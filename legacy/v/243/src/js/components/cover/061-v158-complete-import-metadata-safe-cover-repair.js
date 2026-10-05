/* ============================================================
   MediaFlow v158 — Complete Import Metadata + Safe Cover Repair
   ------------------------------------------------------------
   Every Library import path now understands, when the source provides them:
   - Start Date        -> startedAt
   - Finish Date       -> completedAt
   - Source timestamp  -> createdAt + sourceTimestamp
   - Cover URL         -> coverUrl (URL only; image bytes/base64 are rejected)

   Covered import paths:
   - Multi-service Exchange Hub (JSON / CSV / XML and every listed service)
   - direct CSV import
   - MAL XML
   - Simkl JSON
   - public MAL sync

   Cover repair is deliberately conservative:
   - stable external IDs are preferred;
   - title-search matches must be exact and disambiguated;
   - ambiguous results are SKIPPED rather than guessed;
   - images are never downloaded into MediaFlow, only their external URL is saved;
   - processing is asynchronous/throttled and yields continuously so a huge
     Library / huge missing-cover set does not lock the UI.
   ============================================================ */

const V158_IMPORT_VERSION=158;
let V158_COVER_FIX_RUNNING=false;
let V158_COVER_FIX_CANCEL=false;
const V158_COVER_QUERY_CACHE=new Map();
const V158_PROVIDER_LAST_REQUEST=new Map();

function v158SafeHttpUrl(value){
  if(value==null)return '';
  let s=String(value).trim();
  if(!s)return '';
  if(s.startsWith('//'))s='https:'+s;
  if(!/^https?:\/\//i.test(s))return '';
  try{
    const u=new URL(s);
    if(!/^https?:$/.test(u.protocol))return '';
    return u.href;
  }catch(_){
    return '';
  }
}

function v158ParseDateLike(value){
  if(value==null||value==='')return 0;

  if(typeof value==='number' && Number.isFinite(value)){
    if(value>1e12)return Math.round(value);
    if(value>1e9)return Math.round(value*1000);
    return 0;
  }

  let s=String(value).trim();
  if(!s||s==='0'||s==='0000-00-00'||s==='0000-00-00 00:00:00')return 0;

  if(/^\d{10}$/.test(s)){
    const n=Number(s);
    return Number.isFinite(n)?n*1000:0;
  }
  if(/^\d{13}$/.test(s)){
    const n=Number(s);
    return Number.isFinite(n)?n:0;
  }
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)){
    try{return Number(v135ParseDateInput(s))||0;}catch(_){}
  }

  const parsed=Date.parse(s);
  return Number.isFinite(parsed)?parsed:0;
}

function v158FirstDate(obj,keys){
  for(const key of keys){
    if(!obj)continue;
    const v=obj[key];
    const ts=v158ParseDateLike(v);
    if(ts>0)return ts;
  }
  return 0;
}

function v158NestedObjects(raw){
  const out=[];
  const push=x=>{
    if(x&&typeof x==='object'&&!Array.isArray(x)&&!out.includes(x))out.push(x);
  };
  push(raw);
  for(const key of [
    'show','movie','media','anime','manga','item','node','entry','book',
    'list_status','listStatus','user_data','userData','details'
  ])push(raw?.[key]);
  return out;
}

function v158UrlFromImageValue(value){
  if(!value)return '';
  if(typeof value==='string')return v158SafeHttpUrl(value);
  if(typeof value!=='object')return '';

  const direct=[
    'large_image_url','image_url','original','large','medium','small',
    'url','src','href','poster','cover'
  ];
  for(const key of direct){
    const u=v158SafeHttpUrl(value[key]);
    if(u)return u;
  }

  for(const key of ['jpg','webp','image','images','main_picture','poster','cover']){
    const u=v158UrlFromImageValue(value[key]);
    if(u)return u;
  }
  return '';
}

function v158ExtractCoverUrl(raw){
  const objects=v158NestedObjects(raw);

  // Only poster/cover-oriented fields are considered. Do not scan arbitrary
  // artwork/background/fanart fields: wrong-image avoidance matters more than
  // filling every blank cover.
  const keys=[
    'coverUrl','cover_url','cover','cover_image','coverImage',
    'posterUrl','poster_url','poster',
    'imageUrl','image_url','series_image','anime_image','manga_image',
    'main_picture','images','image','thumbnail_url','thumbnail'
  ];

  for(const obj of objects){
    for(const key of keys){
      const u=v158UrlFromImageValue(obj?.[key]);
      if(u)return u;
    }
  }
  return '';
}

function v158NormalizeExternalIds(raw){
  const objs=v158NestedObjects(raw);
  const out={simkl:null,mal:null,anilist:null,tmdb:null,imdb:null,trakt:null,kitsu:null,isbn:null};

  const first=(names)=>{
    for(const o of objs){
      const ids=o?.ids&&typeof o.ids==='object'?o.ids:{};
      for(const n of names){
        const values=[
          ids[n], o?.[n], o?.[`${n}_id`], o?.[`${n}Id`]
        ];
        for(const v of values){
          if(v!=null&&String(v).trim()!=='')return v;
        }
      }
    }
    return null;
  };

  out.simkl=first(['simkl']);
  out.mal=first(['mal','series_animedb','series_mangadb','manga_mangadb']);
  out.anilist=first(['anilist','ani_list']);
  out.tmdb=first(['tmdb','tmdbtv','tmdb_movie','tmdb_show']);
  out.imdb=first(['imdb','imdbid','const']);
  out.trakt=first(['trakt']);
  out.kitsu=first(['kitsu']);
  out.isbn=first(['isbn','isbn13','isbn10']);

  // Common XML field names that do not follow *_id.
  if(!out.mal){
    for(const o of objs){
      const v=o?.series_animedb_id??o?.manga_mangadb_id??o?.series_mangadb_id;
      if(v!=null&&String(v).trim()!==''){out.mal=v;break;}
    }
  }
  if(!out.imdb){
    for(const o of objs){
      const v=o?.const;
      if(v!=null&&String(v).trim()!==''){out.imdb=v;break;}
    }
  }

  return out;
}

function v158NormalizeStatus(value){
  return mfNormStatus(value);
}

function v158NormalizedTitleKey(value){
  return cleanTitle(String(value||''))
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/&/g,' and ')
    .replace(/[’'`´]/g,'')
    .replace(/[^\p{L}\p{N}]+/gu,' ')
    .trim()
    .replace(/\s+/g,' ');
}

function v158InferCategory(raw,service){
  const objs=v158NestedObjects(raw);
  const flat=Object.assign({},...objs.slice().reverse(),raw||{});
  const group=String(raw?.__group||'').toLowerCase();

  const mangaSignal=
    flat.manga_title!=null ||
    flat.my_read_chapters!=null ||
    flat.num_chapters_read!=null ||
    group==='manga' ||
    /manga|manhwa|manhua/.test(String(flat.manga_type||'').toLowerCase());

  if(mangaSignal){
    const t=String(flat.manga_type||flat.type||flat.format||'').toLowerCase();
    return /manhwa|manhua/.test(t)?'manhwa':'manga';
  }

  const animeSignal=
    flat.anime_title!=null ||
    flat.series_animedb_id!=null ||
    group==='anime' ||
    ['anilist','anisearch','aniwatch','hianime','livechart','kitsu','mal','malxml','crunchyroll'].includes(String(service||''));

  if(animeSignal){
    const type=String(flat.series_type||flat.anime_type||flat.type||flat.format||'').toLowerCase();
    if(/movie|film/.test(type))return 'animemovies';
    if(/currently airing|airing/.test(String(flat.series_status||flat.airing_status||'')))return 'seasonal';
    if(flat.airing===true||flat.is_airing===true||Number(flat.not_aired_episodes_count)>0)return 'seasonal';
    return 'backlog';
  }

  if(group==='movies')return 'movies';
  if(group==='shows')return 'tv';

  return mfGuessCategory(flat,service);
}

function v158SimklEpisodeBounds(raw){
  let first=0,last=0;
  for(const season of (raw?.seasons||[])){
    for(const ep of (season?.episodes||[])){
      const ts=v158ParseDateLike(ep?.watched_at??ep?.watchedAt??ep?.date);
      if(!ts)continue;
      if(!first||ts<first)first=ts;
      if(ts>last)last=ts;
    }
  }
  return {first,last};
}

function v158NormalizeRecord(raw,service){
  if(!raw||typeof raw!=='object')return null;
  const objs=v158NestedObjects(raw);
  const nested=raw.show||raw.movie||raw.media||raw.anime||raw.manga||raw.item||raw.node||raw.entry||raw.book||{};
  const list=raw.list_status||raw.listStatus||{};
  const o=Object.assign({},nested,list,raw);

  const title=cleanTitle(String(mfFirst(o,[
    'title','name','series_title','manga_title','anime_title','movie_title',
    'original_title','primary_title','canonical_title'
  ])||''));
  if(!title)return null;

  const progress=Number(mfFirst(o,[
    'progress','watched_episodes','watched_episodes_count','episodes_watched',
    'episode','my_watched_episodes','chapters_read','my_read_chapters',
    'num_episodes_watched','num_chapters_read','watched'
  ])||0)||0;

  let total=Number(mfFirst(o,[
    'total','total_episodes','total_episodes_count','episodes_total','series_episodes',
    'chapters_total','series_chapters','manga_chapters','num_episodes','num_chapters'
  ])||0)||null;

  const categoryId=v158InferCategory(raw,service);
  if(categoryId==='movies'||categoryId==='animemovies')total=total||1;

  const status=v158NormalizeStatus(mfFirst(o,['status','list_status','my_status','state']));
  const rating=Number(mfFirst(o,['rating','user_rating','your_rating','score','my_score'])||0)||null;
  const year=Number(mfFirst(o,['year','release_year','title_year','start_year'])||0)||null;

  let startedAt=0;
  let completedAt=0;
  let sourceTimestamp=0;

  const startKeys=[
    'start_date','started_at','startedAt','startdate','date_started','started',
    'my_start_date','first_watched_at','first_read_at','watching_started_at'
  ];
  const finishKeys=[
    'finish_date','finished_at','finishedAt','completed_at','completedAt',
    'finishdate','date_completed','my_finish_date','last_watched_at',
    'last_read_at','ended_at'
  ];
  const timestampKeys=[
    'timestamp','created_at','createdAt','added_at','addedAt','date_added',
    'added_to_watchlist_at','listed_at','list_added_at','my_last_updated',
    'updated_at','updatedAt'
  ];

  for(const obj of objs){
    if(!startedAt)startedAt=v158FirstDate(obj,startKeys);
    if(!completedAt)completedAt=v158FirstDate(obj,finishKeys);
    if(!sourceTimestamp)sourceTimestamp=v158FirstDate(obj,timestampKeys);
  }

  if(String(service)==='simkl'){
    const bounds=v158SimklEpisodeBounds(raw);
    if(!startedAt)startedAt=bounds.first;
    if(!completedAt&&status==='completed')completedAt=bounds.last;
  }

  // A finish date belongs only to an actually completed title.
  if(status!=='completed')completedAt=0;

  return {
    title,
    categoryId,
    progress:Math.max(0,progress),
    total,
    status,
    rating,
    year,
    externalIds:v158NormalizeExternalIds(raw),
    startedAt:startedAt||null,
    completedAt:completedAt||null,
    sourceTimestamp:sourceTimestamp||null,
    coverUrl:v158ExtractCoverUrl(raw)||null
  };
}

// Make every Exchange Hub importer use v158 metadata normalization.
mfNormalizeRecord=v158NormalizeRecord;

function v158ImportIndex(){
  const byExternal=new Map();
  const byTitle=new Map();

  const add=item=>{
    if(!item||!item.id)return;

    const ids=item.externalIds||{};
    for(const [k,v] of Object.entries(ids)){
      if(v==null||String(v).trim()==='')continue;
      const key=`${k}:${String(v).trim().toLowerCase()}`;
      if(!byExternal.has(key))byExternal.set(key,item);
    }

    const tk=v158NormalizedTitleKey(item.title);
    if(tk){
      let arr=byTitle.get(tk);
      if(!arr){arr=[];byTitle.set(tk,arr);}
      if(!arr.includes(item))arr.push(item);
    }
  };

  for(const item of (S.library||[]))add(item);
  return {byExternal,byTitle,add};
}

function v158FindImportItem(record,index){
  for(const [k,v] of Object.entries(record.externalIds||{})){
    if(v==null||String(v).trim()==='')continue;
    const x=index.byExternal.get(`${k}:${String(v).trim().toLowerCase()}`);
    if(x)return x;
  }

  const candidates=index.byTitle.get(v158NormalizedTitleKey(record.title))||[];
  if(record.year){
    const sameYear=candidates.filter(i=>!i.year||Number(i.year)===Number(record.year));
    if(sameYear.length===1)return sameYear[0];
    const exactYear=sameYear.find(i=>Number(i.year)===Number(record.year));
    if(exactYear)return exactYear;
  }

  const sameCategory=candidates.filter(i=>String(i.categoryId||'')===String(record.categoryId||''));
  if(sameCategory.length===1)return sameCategory[0];
  if(candidates.length===1)return candidates[0];
  return null;
}

function v158CategoryFallback(categoryId){
  if(S.categories.some(c=>String(c.id)===String(categoryId)))return String(categoryId);
  return String(S.categories.find(c=>c.enabled!==false)?.id||S.categories[0]?.id||'tv');
}

function v158ImportedStartSource(service){
  const s=String(service||'import');
  return (s==='mal'||s==='malxml')?'mal':`import:${s}`;
}

function v158ApplyNormalizedRecord(record,service,index,touched){
  if(!record)return 'skipped';

  let item=v158FindImportItem(record,index);
  const now=Date.now();

  if(item){
    item.progress=Math.max(Number(item.progress)||0,Number(record.progress)||0);
    if(record.total!=null&&Number(record.total)>0)item.total=Number(record.total);
    item.status=record.status||item.status||'planned';
    item.rating=record.rating??item.rating??null;
    item.year=record.year||item.year||null;
    item.externalIds=Object.assign({},item.externalIds||{},record.externalIds||{});
    item.source=String(service||item.source||'import');
    item.tags=[...new Set([...(Array.isArray(item.tags)?item.tags:[]),mfServiceName(service)])];

    // Imported metadata never destroys a real local value when the source
    // omitted that field.
    if(record.startedAt){
      item.startedAt=Number(record.startedAt);
      item.startedAtSource=v158ImportedStartSource(service);
    }

    if(item.status==='completed'){
      if(record.completedAt)item.completedAt=Number(record.completedAt);
    }else if(record.completedAt){
      // v158NormalizeRecord should already prevent this branch.
    }

    if(record.sourceTimestamp){
      const ts=Number(record.sourceTimestamp);
      item.sourceTimestamp=ts;
      item.sourceTimestampSource=String(service||'import');
      item.createdAt=Math.min(Number(item.createdAt)||ts,ts);
    }

    // Never overwrite an existing manually/previously selected cover during an
    // import. If this title is blank and the source record has its own poster,
    // save only that external URL.
    if(!String(item.coverUrl||'').trim()&&record.coverUrl){
      item.coverUrl=String(record.coverUrl);
      item.coverSource=`import:${String(service||'external')}`;
    }

    item.modifiedAt=now;
    touched?.set(String(item.id),item);
    index.add(item);
    return 'updated';
  }

  const createdAt=Number(record.sourceTimestamp)||now;
  item={id:uid(),
    title:record.title,
    categoryId:v158CategoryFallback(record.categoryId),
    progress:Math.max(0,Number(record.progress)||0),
    total:record.total==null?null:Number(record.total),
    status:record.status||'planned',
    priority:'medium',
    estimatedMinutes:null,
    tags:[mfServiceName(service)],
    source:String(service||'import'),
    year:record.year||null,
    rating:record.rating??null,
    externalIds:Object.assign({},record.externalIds||{}),
    startedAt:record.startedAt||null,
    startedAtSource:record.startedAt?v158ImportedStartSource(service):null,
    completedAt:record.status==='completed'?(record.completedAt||null):null,
    createdAt,
    modifiedAt:now,
    sourceTimestamp:record.sourceTimestamp||null,
    sourceTimestampSource:record.sourceTimestamp?String(service||'import'):null,
    coverUrl:record.coverUrl||null,
    coverSource:record.coverUrl?`import:${String(service||'external')}`:null
  };

  S.library.push(item);
  touched?.set(String(item.id),item);
  index.add(item);
  return 'added';
}

function v158SyncCompletionTimeline(touched){
  if(!touched||!touched.size)return;
  const ids=new Set(touched.keys());
  S.completionTimeline=(S.completionTimeline||[]).filter(
    x=>!ids.has(String(x?.libraryId||''))
  );
  for(const item of touched.values()){
    if(item?.status==='completed'&&Number(item.completedAt)>0){
      S.completionTimeline.push({
        libraryId:item.id,
        title:cleanTitle(item.title),
        categoryId:item.categoryId,
        completedAt:Number(item.completedAt)
      });
    }
  }
}

async function v158MergeExchangeRecords(records,service,options={}){
  const list=Array.isArray(records)?records:[];
  const index=options.index||v158ImportIndex();
  const touched=options.touched||new Map();
  let added=0,updated=0,skipped=0,covers=0,startDates=0,finishDates=0,timestamps=0;

  const BATCH=Math.max(20,Number(options.batchSize)||80);
  for(let i=0;i<list.length;i++){
    const r=v158NormalizeRecord(list[i],service);
    if(!r){skipped++;continue;}

    const hadCover=!!r.coverUrl;
    const hadStart=!!r.startedAt;
    const hadFinish=!!r.completedAt;
    const hadTimestamp=!!r.sourceTimestamp;

    const result=v158ApplyNormalizedRecord(r,service,index,touched);
    if(result==='added')added++;
    else if(result==='updated')updated++;
    else skipped++;

    if(hadCover)covers++;
    if(hadStart)startDates++;
    if(hadFinish)finishDates++;
    if(hadTimestamp)timestamps++;

    if((i+1)%BATCH===0){
      if(typeof options.onProgress==='function'){
        options.onProgress(i+1,list.length,{added,updated,skipped,covers,startDates,finishDates,timestamps});
      }
      await yieldToBrowser();
    }
  }

  v158SyncCompletionTimeline(touched);
  normalizeSeasonalLibraryItems();
  v53InvalidateLibraryCache();

  return {added,updated,skipped,covers,startDates,finishDates,timestamps,index,touched};
}

// Keep legacy callers compatible, but v158 file imports use the async engine
// below directly.
mfMergeExchangeRecords=function(records,service){
  // Synchronous compatibility path for any third-party code that calls this
  // function directly. It still receives all v158 metadata.
  const index=v158ImportIndex();
  const touched=new Map();
  let added=0,updated=0,skipped=0,covers=0,startDates=0,finishDates=0,timestamps=0;
  for(const raw of (records||[])){
    const r=v158NormalizeRecord(raw,service);
    if(!r){skipped++;continue;}
    const x=v158ApplyNormalizedRecord(r,service,index,touched);
    if(x==='added')added++;else if(x==='updated')updated++;else skipped++;
    if(r.coverUrl)covers++;
    if(r.startedAt)startDates++;
    if(r.completedAt)finishDates++;
    if(r.sourceTimestamp)timestamps++;
  }
  v158SyncCompletionTimeline(touched);
  normalizeSeasonalLibraryItems();
  v53InvalidateLibraryCache();
  return {added,updated,skipped,covers,startDates,finishDates,timestamps};
};

async function v158ImportExchangeFile(service,file){
  showImportProgress(`Importing ${mfServiceName(service)}`,1);
  try{
    const text=await file.text();
    const name=String(file.name||'').toLowerCase();
    let records;

    if(name.endsWith('.xml')||/^\s*</.test(text))records=mfXmlRecords(text);
    else if(name.endsWith('.csv')||(!name.endsWith('.json')&&text.includes(',')))records=mfCsvParse(text);
    else records=mfFlattenJson(JSON.parse(text));

    if(!records.length)throw new Error('No recognizable media records were found.');

    showImportProgress(`Importing ${mfServiceName(service)}`,records.length);
    mfBegin(`${mfServiceName(service)} import`,file.name);

    const result=await v158MergeExchangeRecords(records,service,{
      batchSize:80,
      onProgress:(done,total,s)=>{
        updateImportProgress(
          done,total,s.added,s.updated,s.skipped,
          `${s.startDates.toLocaleString()} start dates · ${s.finishDates.toLocaleString()} finish dates · ${s.timestamps.toLocaleString()} timestamps · ${s.covers.toLocaleString()} cover URLs`
        );
      }
    });

    mfCommit(
      `${mfServiceName(service)} import`,
      `${result.added} added, ${result.updated} updated, ${result.covers} covers`
    );

    updateImportProgress(
      records.length,records.length,result.added,result.updated,result.skipped,
      'Saving imported metadata and external cover URLs…'
    );
    await saveState();

    finishImportProgress(
      true,
      `${mfServiceName(service)} import complete`,
      `${result.added.toLocaleString()} added · ${result.updated.toLocaleString()} updated${result.blocked?` · ${result.blocked.toLocaleString()} blocked by type`:''} · ${result.startDates.toLocaleString()} start dates · ${result.finishDates.toLocaleString()} finish dates · ${result.timestamps.toLocaleString()} timestamps · ${result.covers.toLocaleString()} cover URLs${result.skipped>result.blocked?` · ${(result.skipped-result.blocked).toLocaleString()} other skipped`:''}.`
    );
    render();
  }catch(e){
    console.error(e);
    finishImportProgress(false,'Import failed',e?.message||'MediaFlow could not understand this export file.');
  }
}

mfImportExchangeFile=v158ImportExchangeFile;

// Direct CSV now uses the same complete v158 metadata engine instead of the
// older title/progress/status-only parser.
App.importCsv=function(file){
  if(file)return v158ImportExchangeFile('csv',file);
};

// MAL XML now goes through the same metadata parser, including series_image /
// cover URL, start date, finish date and timestamp-like fields when present.
App.importMalXml=async function(file){
  if(!file)return;
  showImportProgress('Importing MyAnimeList XML',1);
  try{
    const text=await file.text();
    const records=mfXmlRecords(text);
    if(!records.length)throw new Error('No entries found. Make sure this is a MAL list export XML.');

    showImportProgress('Importing MyAnimeList XML',records.length);
    mfBegin('MyAnimeList XML import',file.name||'MAL XML');

    const result=await v158MergeExchangeRecords(records,'malxml',{
      batchSize:50,
      onProgress(done,total,s){
        updateImportProgress(
          done,total,s.added,s.updated,s.skipped,
          `${s.startDates.toLocaleString()} start dates · ${s.finishDates.toLocaleString()} finish dates · ${s.timestamps.toLocaleString()} timestamps · ${s.covers.toLocaleString()} cover URLs`
        );
      }
    });

    mfCommit('MyAnimeList XML import',`${result.added} added, ${result.updated} updated, ${result.covers} covers`);
    await saveState();

    finishImportProgress(
      true,
      'MyAnimeList merge complete',
      `${result.added.toLocaleString()} added · ${result.updated.toLocaleString()} updated · ${result.startDates.toLocaleString()} start dates · ${result.finishDates.toLocaleString()} finish dates · ${result.timestamps.toLocaleString()} timestamps · ${result.covers.toLocaleString()} cover URLs${result.skipped?` · ${result.skipped.toLocaleString()} skipped`:''}.`
    );
    render();
  }catch(e){
    console.error('MAL import failed',e);
    finishImportProgress(false,'MAL import failed',e?.message||"Couldn't parse that file as a MAL export XML.");
  }
};

function v158FindLibraryForSimklRecord(raw,index){
  const r=v158NormalizeRecord(raw,'simkl');
  return r?v158FindImportItem(r,index):null;
}

App.importSimklJson=async function(file){
  if(!file)return;
  showImportProgress('Importing Simkl JSON',1);

  try{
    const data=JSON.parse(await file.text());
    if(!data||(!Array.isArray(data.anime)&&!Array.isArray(data.shows)&&!Array.isArray(data.movies))){
      throw new Error('This does not look like a Simkl JSON backup.');
    }

    const records=mfFlattenJson(data);
    const total=Math.max(1,records.length);
    showImportProgress('Importing Simkl JSON',total);
    mfBegin('Simkl JSON import',file.name||'backup');

    const result=await v158MergeExchangeRecords(records,'simkl',{
      batchSize:70,
      onProgress(done,totalCount,s){
        updateImportProgress(
          done,totalCount,s.added,s.updated,s.skipped,
          `Titles: ${s.startDates.toLocaleString()} starts · ${s.finishDates.toLocaleString()} finishes · ${s.timestamps.toLocaleString()} timestamps · ${s.covers.toLocaleString()} cover URLs`
        );
      }
    });

    // Preserve Simkl's valuable genuine watched_at History import.
    const seenSessions=new Set((S.sessions||[]).map(s=>s.importKey).filter(Boolean));
    const index=result.index||v158ImportIndex();
    let historyAdded=0,processed=0;

    const groups=[
      ['anime',data.anime||[]],
      ['shows',data.shows||[]],
      ['movies',data.movies||[]]
    ];

    for(const [kind,list] of groups){
      for(const sourceRec of list){
        processed++;
        const raw=Object.assign({__group:kind},sourceRec);
        const item=v158FindLibraryForSimklRecord(raw,index);
        if(!item)continue;

        const media=sourceRec.show||sourceRec.movie||sourceRec.media||{};
        const title=cleanTitle(item.title);
        const simklId=item.externalIds?.simkl||media?.ids?.simkl||'';

        const dayCounts=new Map();
        for(const season of (sourceRec.seasons||[])){
          for(const ep of (season?.episodes||[])){
            const ts=v158ParseDateLike(ep?.watched_at??ep?.watchedAt);
            if(!ts)continue;
            const day=new Date(ts).toISOString().slice(0,10);
            const old=dayCounts.get(day)||{count:0,ts};
            old.count++;
            old.ts=Math.max(old.ts,ts);
            dayCounts.set(day,old);
          }
        }

        for(const [day,h] of dayCounts){
          const ik=`simkl:${simklId||v158NormalizedTitleKey(title)}:${day}`;
          if(seenSessions.has(ik))continue;

          const cat=getCategory(item.categoryId);
          const amount=kind==='movies'?1:h.count;
          S.sessions.push({
            id:uid(),
            timestamp:h.ts,
            date:day,
            categoryId:item.categoryId,
            targetAmount:amount,
            actualAmount:amount,
            minutes:Math.max(0,Math.round((Number(media.runtime)||Number(cat?.minutesPerUnit)||0)*amount)),
            note:`Imported from Simkl · ${title}`,
            status:'complete',
            unit:cat?.unit||'units',
            xp:0,
            healthStatus:'healthy',
            titles:[{title,libraryId:item.id,qty:amount}],
            source:'simkl',
            importKey:ik
          });
          seenSessions.add(ik);
          historyAdded++;
        }

        if(processed%100===0){
          updateImportProgress(
            Math.min(total,processed),total,result.added,result.updated,result.skipped,
            `Importing genuine Simkl watched timestamps… ${historyAdded.toLocaleString()} History groups`
          );
          await yieldToBrowser();
        }
      }
    }

    v53InvalidateSessionCache();
    mfCommit(
      'Simkl JSON import',
      `${result.added} added, ${result.updated} updated, ${historyAdded} history groups, ${result.covers} covers`
    );
    await saveState();

    finishImportProgress(
      true,
      'Simkl import successful',
      `${result.added.toLocaleString()} added · ${result.updated.toLocaleString()} updated · ${historyAdded.toLocaleString()} timestamped History groups · ${result.startDates.toLocaleString()} start dates · ${result.finishDates.toLocaleString()} finish dates · ${result.timestamps.toLocaleString()} title timestamps · ${result.covers.toLocaleString()} cover URLs.`
    );
    render();
  }catch(e){
    console.error(e);
    if(S.undoStack?.length&&S.undoStack[S.undoStack.length-1]?.action==='Simkl JSON import'){
      const x=S.undoStack.pop();
      mfRestoreCore(x.before);
    }
    finishImportProgress(false,'Simkl import failed',e?.message||'Could not read this Simkl JSON backup.');
  }
};

// Final binding used by the Quick Simkl JSON import button.
mfImportSimklJson=App.importSimklJson;

async function v158MalSync(){
  const username=(S.malLink?.username||'').trim();
  if(!username){alert('Enter your MyAnimeList username first.');return;}

  const mode=S.malLink.mode||'anime';
  const types=mode==='both'?['anime','manga']:[mode];

  showImportProgress('MAL sync',1);
  updateImportProgress(0,0,0,0,0,'Starting complete MAL metadata sync…');

  const index=v158ImportIndex();
  const touched=new Map();
  let processed=0,added=0,updated=0,skipped=0,covers=0,startDates=0,finishDates=0,timestamps=0;

  try{
    mfBegin('MyAnimeList sync',username);

    for(const type of types){
      let page=1,hasNext=true;

      while(hasNext){
        updateImportProgress(processed,Math.max(processed,1),added,updated,skipped,`Fetching ${type} page ${page}…`);
        const j=await malFetchPage(username,type,page);
        const rows=Array.isArray(j?.data)?j.data:[];

        for(let offset=0;offset<rows.length;offset+=40){
          const batch=rows.slice(offset,offset+40);

          for(const sourceRow of batch){
            const row=Object.assign({__group:type},sourceRow);
            const rec=v158NormalizeRecord(row,'mal');

            if(!rec){skipped++;processed++;continue;}

            // Jikan user-list payloads may expose MAL's list metadata under
            // different nested names. Explicitly preserve the MAL ID if present.
            const media=sourceRow.entry||sourceRow.node||sourceRow.anime||sourceRow.manga||sourceRow;
            const malId=media?.mal_id??media?.id??sourceRow?.mal_id;
            if(malId!=null&&String(malId).trim()!=='')rec.externalIds.mal=malId;

            const x=v158ApplyNormalizedRecord(rec,'mal',index,touched);
            if(x==='added')added++;else if(x==='updated')updated++;else skipped++;

            if(rec.coverUrl)covers++;
            if(rec.startedAt)startDates++;
            if(rec.completedAt)finishDates++;
            if(rec.sourceTimestamp)timestamps++;
            processed++;
          }

          updateImportProgress(
            processed,Math.max(processed,Number(j?.pagination?.items?.total)||processed),
            added,updated,skipped,
            `${covers.toLocaleString()} cover URLs · ${startDates.toLocaleString()} starts · ${finishDates.toLocaleString()} finishes · ${timestamps.toLocaleString()} timestamps`
          );

          await yieldToBrowser();
        }

        hasNext=!!j?.pagination?.has_next;
        page++;
        if(hasNext)await new Promise(resolve=>setTimeout(resolve,700));
      }
    }

    v158SyncCompletionTimeline(touched);
    normalizeSeasonalLibraryItems();
    v53InvalidateLibraryCache();

    mfCommit(
      'MyAnimeList sync',
      `${added} added, ${updated} updated, ${covers} covers, ${startDates} starts, ${finishDates} finishes`
    );
    await saveState();

    finishImportProgress(
      true,
      'MAL sync complete',
      `${added.toLocaleString()} added · ${updated.toLocaleString()} updated · ${startDates.toLocaleString()} start dates · ${finishDates.toLocaleString()} finish dates · ${timestamps.toLocaleString()} timestamps · ${covers.toLocaleString()} cover URLs${skipped?` · ${skipped.toLocaleString()} skipped`:''}.`
    );
    render();
  }catch(e){
    console.error(e);
    finishImportProgress(false,'MAL sync failed',e?.message||String(e));
  }
}

App.syncMAL=v158MalSync;

// Export enough metadata for a clean MediaFlow round-trip through the Exchange
// Hub. External services are still free to ignore fields they do not support.
mfExchangeRows=function(){
  return (S.library||[]).map(i=>{
    const c=getCategory(i.categoryId);
    const ts=Number(i.sourceTimestamp)||Number(i.createdAt)||0;
    return {
      title:cleanTitle(i.title),
      media_type:c?.id||i.categoryId,
      status:i.status,
      progress:Number(i.progress)||0,
      total:i.total??'',
      rating:i.rating??'',
      year:i.year??'',
      start_date:i.startedAt?v135DateInputValue(i.startedAt):'',
      finish_date:i.completedAt?v135DateInputValue(i.completedAt):'',
      timestamp:ts?new Date(ts).toISOString():'',
      cover_url:v158SafeHttpUrl(i.coverUrl)||'',
      mal_id:i.externalIds?.mal??'',
      anilist_id:i.externalIds?.anilist??'',
      imdb_id:i.externalIds?.imdb??'',
      tmdb_id:i.externalIds?.tmdb??'',
      trakt_id:i.externalIds?.trakt??'',
      simkl_id:i.externalIds?.simkl??'',
      kitsu_id:i.externalIds?.kitsu??'',
      isbn:i.externalIds?.isbn??''
    };
  });
};

// Preserve v158 timestamp metadata across cloud merges even when one device has
// not seen the external-import fields yet.
const v158MergeLibraryItemBase=v84MergeLibraryItem;
v84MergeLibraryItem=function(left,right){
  const out=v158MergeLibraryItemBase(left,right);
  if(!out)return out;

  const pick=(key)=>{
    const lv=left?.[key],rv=right?.[key];
    const lOk=lv!==undefined&&lv!==null&&lv!=='';
    const rOk=rv!==undefined&&rv!==null&&rv!=='';
    if(lOk&&rOk){
      return Number(right?.modifiedAt||0)>Number(left?.modifiedAt||0)?rv:lv;
    }
    return lOk?lv:(rOk?rv:null);
  };

  out.sourceTimestamp=pick('sourceTimestamp');
  out.sourceTimestampSource=pick('sourceTimestampSource');
  return out;
};

// ------------------------------------------------------------
// Safe automatic missing-cover repair
// ------------------------------------------------------------

function v158ItemKind(item){
  const cat=getCategory(item?.categoryId);
  const id=String(item?.categoryId||'');
  const name=String(cat?.name||'').toLowerCase();

  if(id==='seasonal'||id==='backlog'||id==='animemovies'||/anime/.test(name)){
    return id==='animemovies'?'anime-movie':'anime';
  }
  if(id==='manga'||id==='manhwa'||/manga|manhwa|manhua/.test(name))return 'manga';
  if(id==='tv'||/tv series|television|series/.test(name))return 'tv';
  if(id==='otheranim'||/animation|cartoon/.test(name))return 'tv';
  if(id==='movies'||/movie|film/.test(name))return 'movie';
  if(id==='comics'||/comic/.test(name))return 'comic';
  if(cat?.type==='reading'&&/book|novel/.test(name))return 'book';
  return cat?.type==='reading'?'reading':cat?.type==='video'?'video':'other';
}

function v158CandidateYear(value){
  const n=Number(value);
  return Number.isFinite(n)&&n>1800&&n<2200?n:null;
}

function v158ItemYear(item){
  return v158CandidateYear(item?.year) ||
    (Number(item?.startedAt)>0?new Date(Number(item.startedAt)).getFullYear():null);
}

function v158ExactTitleCandidate(item,candidateTitles){
  const wanted=v158NormalizedTitleKey(item?.title);
  if(!wanted)return false;
  for(const title of candidateTitles||[]){
    if(v158NormalizedTitleKey(title)===wanted)return true;
  }
  return false;
}

async function v158Throttle(provider,minimumGap){
  const last=Number(V158_PROVIDER_LAST_REQUEST.get(provider))||0;
  const wait=Math.max(0,minimumGap-(Date.now()-last));
  if(wait)await new Promise(resolve=>setTimeout(resolve,wait));
  V158_PROVIDER_LAST_REQUEST.set(provider,Date.now());
}

async function v158FetchJson(url,provider,minimumGap=250){
  const cacheKey=`${provider}:${url}`;
  if(V158_COVER_QUERY_CACHE.has(cacheKey))return V158_COVER_QUERY_CACHE.get(cacheKey);

  await v158Throttle(provider,minimumGap);

  let lastError=null;
  for(let attempt=0;attempt<3;attempt++){
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),12000);
      const response=await fetch(url,{
        signal:controller.signal,
        headers:{Accept:'application/json'}
      });
      clearTimeout(timer);

      if(response.ok){
        const json=await response.json();
        V158_COVER_QUERY_CACHE.set(cacheKey,json);
        return json;
      }

      lastError=new Error(`${provider} ${response.status}`);
      if(![408,429,500,502,503,504].includes(response.status))break;

      const retry=Number(response.headers.get('Retry-After'))||0;
      await new Promise(resolve=>setTimeout(resolve,retry?retry*1000:700*(attempt+1)));
    }catch(e){
      lastError=e;
      if(attempt<2)await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));
    }
  }

  console.warn('v158 cover provider request failed',provider,lastError);
  return null;
}

function v158JikanTitles(x){
  const out=[
    x?.title,x?.title_english,x?.title_japanese,
    ...(Array.isArray(x?.title_synonyms)?x.title_synonyms:[])
  ];
  for(const row of (Array.isArray(x?.titles)?x.titles:[]))out.push(row?.title);
  return out.filter(Boolean);
}

function v158JikanCover(x){
  return v158SafeHttpUrl(
    x?.images?.jpg?.large_image_url ||
    x?.images?.webp?.large_image_url ||
    x?.images?.jpg?.image_url ||
    x?.images?.webp?.image_url
  );
}

function v158JikanYear(x,kind){
  if(kind==='manga'){
    const raw=x?.published?.from;
    const y=raw?new Date(raw).getFullYear():null;
    return v158CandidateYear(y);
  }
  return v158CandidateYear(x?.year) ||
    v158CandidateYear(x?.aired?.from?new Date(x.aired.from).getFullYear():null);
}

async function v158FindJikanCover(item,kind){
  const endpoint=kind==='manga'?'manga':'anime';
  const malId=String(item?.externalIds?.mal??'').trim();

  // Stable MAL ID = exact identity. This is the safest path.
  if(/^\d+$/.test(malId)){
    const j=await v158FetchJson(`https://api.jikan.moe/v4/${endpoint}/${encodeURIComponent(malId)}`,'jikan',380);
    const x=j?.data;
    if(x&&String(x?.mal_id??'')===malId){
      if(kind==='anime-movie'&&String(x?.type||'').toLowerCase()!=='movie')return null;
      const url=v158JikanCover(x);
      if(url)return {url,provider:'Jikan',confidence:'external-id'};
    }
  }

  // Search fallback is intentionally strict. Without an external ID, require an
  // exact title PLUS a real disambiguator (year or total episode/chapter count).
  const itemYear=v158ItemYear(item);
  const total=Number(item?.total)>0?Number(item.total):null;
  if(!itemYear&&!total)return null;

  const q=cleanTitle(item?.title||'');
  if(!q)return null;

  const j=await v158FetchJson(
    `https://api.jikan.moe/v4/${endpoint}?q=${encodeURIComponent(q)}&limit=12`,
    'jikan',380
  );

  let rows=(j?.data||[]).filter(x=>v158ExactTitleCandidate(item,v158JikanTitles(x)));
  if(kind==='anime-movie')rows=rows.filter(x=>String(x?.type||'').toLowerCase()==='movie');
  else if(endpoint==='anime')rows=rows.filter(x=>String(x?.type||'').toLowerCase()!=='movie');

  if(itemYear){
    const withYear=rows.filter(x=>v158JikanYear(x,endpoint)===itemYear);
    if(withYear.length)rows=withYear;
    else return null;
  }

  if(total){
    const withTotal=rows.filter(x=>{
      const n=endpoint==='manga'?Number(x?.chapters):Number(x?.episodes);
      return Number.isFinite(n)&&n>0&&n===total;
    });
    if(withTotal.length)rows=withTotal;
    else if(!itemYear)return null;
  }

  const unique=new Map();
  for(const x of rows){
    const url=v158JikanCover(x);
    if(url)unique.set(String(x?.mal_id||url),{x,url});
  }

  if(unique.size!==1)return null;
  const only=[...unique.values()][0];
  return {url:only.url,provider:'Jikan',confidence:'exact-disambiguated'};
}

async function v158FindTVMazeCover(item){
  const imdb=String(item?.externalIds?.imdb??'').trim();

  // IMDb lookup is an exact identity mapping for TVMaze shows.
  if(/^tt\d+$/i.test(imdb)){
    const x=await v158FetchJson(
      `https://api.tvmaze.com/lookup/shows?imdb=${encodeURIComponent(imdb)}`,
      'tvmaze',180
    );
    const url=v158SafeHttpUrl(x?.image?.original||x?.image?.medium);
    if(url)return {url,provider:'TVmaze',confidence:'external-id'};
  }

  const year=v158ItemYear(item);
  if(!year)return null; // title-only TV matches are deliberately not guessed.

  const q=cleanTitle(item?.title||'');
  if(!q)return null;
  const rows=await v158FetchJson(
    `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`,
    'tvmaze',180
  );

  const exact=(Array.isArray(rows)?rows:[])
    .map(r=>r?.show)
    .filter(Boolean)
    .filter(x=>v158ExactTitleCandidate(item,[x?.name]))
    .filter(x=>{
      const y=x?.premiered?new Date(x.premiered).getFullYear():null;
      return Number(y)===Number(year);
    })
    .filter(x=>v158SafeHttpUrl(x?.image?.original||x?.image?.medium));

  const unique=new Map(exact.map(x=>[String(x.id),x]));
  if(unique.size!==1)return null;

  const x=[...unique.values()][0];
  return {
    url:v158SafeHttpUrl(x?.image?.original||x?.image?.medium),
    provider:'TVmaze',
    confidence:'exact-year'
  };
}

async function v158FindOpenLibraryCover(item){
  const isbn=String(item?.externalIds?.isbn??'').replace(/[^0-9Xx]/g,'');
  if(isbn.length===10||isbn.length===13){
    // ISBN is an exact work/edition identifier. Open Library's cover endpoint
    // returns the image by identifier; MediaFlow still stores only this URL.
    return {
      url:`https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg`,
      provider:'Open Library',
      confidence:'external-id'
    };
  }

  const year=v158ItemYear(item);
  if(!year)return null;

  const title=cleanTitle(item?.title||'');
  if(!title)return null;

  const j=await v158FetchJson(
    `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=12&fields=key,title,first_publish_year,cover_i`,
    'openlibrary',240
  );

  const rows=(j?.docs||[])
    .filter(x=>x?.cover_i)
    .filter(x=>v158ExactTitleCandidate(item,[x?.title]))
    .filter(x=>Number(x?.first_publish_year)===Number(year));

  const unique=new Map(rows.map(x=>[String(x.key||x.cover_i),x]));
  if(unique.size!==1)return null;

  const x=[...unique.values()][0];
  return {
    url:`https://covers.openlibrary.org/b/id/${encodeURIComponent(x.cover_i)}-L.jpg`,
    provider:'Open Library',
    confidence:'exact-year'
  };
}

async function v158ResolveSafeCover(item){
  if(!item||String(item.coverUrl||'').trim())return null;

  const kind=v158ItemKind(item);

  if(kind==='anime'||kind==='anime-movie')return v158FindJikanCover(item,kind);
  if(kind==='manga')return v158FindJikanCover(item,'manga');
  if(kind==='tv')return v158FindTVMazeCover(item);
  if(kind==='book'||kind==='comic'||kind==='reading')return v158FindOpenLibraryCover(item);

  // General live-action movies currently have no anonymous exact-ID image
  // provider configured in MediaFlow. Do NOT fall back to a loose TV/show
  // search because the explicit v158 requirement is "no wrong covers".
  return null;
}

function v158AttachCoverCancelButton(){
  const root=document.getElementById('mediaflow-data-progress');
  const card=root?.querySelector('.import-card');
  if(!card||card.querySelector('[data-v158-cover-cancel]'))return;

  const row=document.createElement('div');
  row.style.cssText='display:flex;justify-content:flex-end;margin-top:14px';
  row.innerHTML='<button type="button" class="btn btn-ghost" data-v158-cover-cancel onclick="App.v158CancelCoverFix()">Stop safely</button>';
  card.appendChild(row);
}

async function v158FixMissingCovers(){
  if(V158_COVER_FIX_RUNNING){
    showToast('Cover repair is already running.');
    return;
  }

  const missing=(S.library||[]).filter(i=>i&& !String(i.coverUrl||'').trim());
  if(!missing.length){
    showToast('Every Library title already has a cover URL.');
    return;
  }

  V158_COVER_FIX_RUNNING=true;
  V158_COVER_FIX_CANCEL=false;

  showDataProgress(
    'Fix missing covers',
    `Preparing ${missing.length.toLocaleString()} titles · ambiguous matches will be skipped`,
    0
  );
  v158AttachCoverCancelButton();

  let fixed=0,skipped=0,errors=0;
  const touched=[];
  const SAVE_EVERY=200;

  try{
    for(let i=0;i<missing.length;i++){
      if(V158_COVER_FIX_CANCEL)break;

      const item=missing[i];

      // The item may have received a cover from another action while this job
      // was running. Never overwrite it.
      if(String(item.coverUrl||'').trim()){
        skipped++;
        continue;
      }

      updateDataProgress(
        Math.round((i/missing.length)*100),
        `${(i+1).toLocaleString()} / ${missing.length.toLocaleString()} · fixed ${fixed.toLocaleString()} · safely skipped ${skipped.toLocaleString()} · ${cleanTitle(item.title)}`
      );

      try{
        const match=await v158ResolveSafeCover(item);

        if(match?.url){
          // Final re-check: never replace a cover that appeared while awaiting
          // the provider request.
          if(!String(item.coverUrl||'').trim()){
            item.coverUrl=v158SafeHttpUrl(match.url);
            item.coverSource=`auto:${match.provider}:${match.confidence}`;
            item.modifiedAt=Date.now();
            touched.push(item.id);
            fixed++;
          }else{
            skipped++;
          }
        }else{
          skipped++;
        }
      }catch(e){
        console.warn('v158 cover repair skipped',item?.title,e);
        errors++;
        skipped++;
      }

      // Yield after every title. Network I/O is already async; this guarantees
      // CPU/UI work never turns a huge missing-cover list into a long task.
      await yieldToBrowser();

      // Avoid repeated full-state/cloud serialization. Save in large checkpoints.
      if(fixed>0&&fixed%SAVE_EVERY===0){
        v53InvalidateLibraryCache();
        await saveState();
        await yieldToBrowser();
      }
    }

    if(touched.length){
      v53InvalidateLibraryCache();
      await saveState();
    }

    render();

    if(V158_COVER_FIX_CANCEL){
      finishDataProgress(
        true,
        'Cover repair stopped safely',
        `${fixed.toLocaleString()} exact-confidence cover URLs saved · ${skipped.toLocaleString()} skipped · progress was saved.`
      );
    }else{
      finishDataProgress(
        true,
        'Missing-cover repair complete',
        `${fixed.toLocaleString()} exact-confidence cover URLs saved · ${skipped.toLocaleString()} ambiguous/unsupported titles safely skipped${errors?` · ${errors.toLocaleString()} provider errors`:''}.`
      );
    }
  }finally{
    V158_COVER_FIX_RUNNING=false;
    V158_COVER_FIX_CANCEL=false;
  }
}

function v158CancelCoverFix(){
  if(!V158_COVER_FIX_RUNNING)return;
  V158_COVER_FIX_CANCEL=true;
  updateDataProgress(
    Number(document.getElementById('data-progress-pct')?.textContent?.replace('%',''))||0,
    'Stopping after the current safe lookup and saving progress…'
  );
}

Object.assign(App,{
  v158FixMissingCovers,
  v158CancelCoverFix
});

// Settings: add one dedicated, scalable cover-maintenance action.
const v158RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v158RenderSettingsBase();

  const missing=(S.library||[]).reduce(
    (n,item)=>n+(item&&!String(item.coverUrl||'').trim()?1:0),
    0
  );

  const card=`<div class="section-label">COVER MAINTENANCE</div>
    <div class="card" style="margin-bottom:22px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap">
        <div style="min-width:220px;flex:1">
          <b>Fix missing Library covers</b>
          <div class="profile-note">
            ${missing.toLocaleString()} title${missing===1?'':'s'} currently ${missing===1?'has':'have'} no cover URL.
            MediaFlow uses external IDs first and only accepts exact, disambiguated title matches.
            Ambiguous matches are skipped instead of guessed. Images are never stored in MediaFlow — only their external URL.
          </div>
        </div>
        <button class="btn btn-primary" onclick="App.v158FixMissingCovers()" ${missing?'':'disabled'}>
          Fix missing covers
        </button>
      </div>
      <div class="hint" style="margin-top:10px">
        Large Libraries are processed asynchronously with throttled provider requests, continuous UI yields and infrequent checkpoint saves, so thousands of missing covers do not freeze the app.
      </div>
    </div>`;

  const dataMarker='<div class="section-label">DATA</div>';
  if(h.includes(dataMarker))h=h.replace(dataMarker,card+dataMarker);
  else h+=card;

  h=h.replace(
    'Different services expose different fields, so MediaFlow imports what is actually present instead of inventing missing data.',
    'Different services expose different fields, so MediaFlow imports what is actually present instead of inventing missing data. v158 also imports Start Date, Finish Date, source timestamps and external cover URLs whenever the source includes them.'
  );

  return h;
};

// Full Backup/Automatic Backup already serialize every Library title object.
// v158's coverUrl/sourceTimestamp metadata therefore requires no separate backup
// schema and is automatically covered by the v148+ complete backup pipeline.



