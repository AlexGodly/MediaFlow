/* MediaFlow v555 — external ratings engine.
 * For one title, in this order:
 *  1. Saved IDs first: every rating source that can look a title up by an
 *     ID it already has is asked by ID (no name guessing).
 *  2. Find missing IDs:
 *     a. Wikidata links MAL / AniList / IMDb / TMDB IDs to each other;
 *     b. every rating source still missing is searched with every known
 *        name — the title's own names plus the English, romanized, native
 *        and alternate names returned by sources matched in step 1.
 *  3. Recheck with the new IDs: each ID found in step 2 is used right away
 *     to fetch that source's rating by ID.
 * Seasons: when a season has no IMDb/TMDB entry of its own, the whole show's
 * entry is used, so every season shares the show's IMDb/TMDB rating.
 * Safety: a saved ID is never replaced, an ID that conflicts with a saved one
 * is ignored, name matches must be exact (any known name) with a compatible
 * year and type, and ambiguous matches are skipped rather than guessed.
 */
const MF555R={gatewayLast:new Map(),wikiLast:0,wikiCache:new Map(),
  stats:{titles:0,ratingsWritten:0,idsWritten:0,byId:0,byName:0,byWikidata:0,parentShow:0,lastLog:[]}};
const MF555R_GATEWAY_GAP=1300;   // client spacing per gateway source (server enforces too)
const MF555R_WIKI_GAP=900;
// Which saved ID each source can use for a direct lookup.
const MF555R_ID_LOOKUP={jikan:['mal'],malofficial:['mal'],anilist:['anilist','mal'],kitsu:['kitsu'],
  tvmaze:['tvmaze'],omdb:['imdb'],tmdb:['tmdb','tmdb_tv'],watchmode:['imdb'],vndb:['vndb']};
// Which source is authoritative for which rating (preferred when several return it).
const MF555R_PRIMARY={imdb:['omdb','watchmode','simkl','trakt'],mal:['jikan','malofficial','simkl'],
  anilist:['anilist'],kitsu:['kitsu'],tmdb:['tmdb'],trakt:['trakt'],simkl:['simkl'],tvmaze:['tvmaze'],
  metacritic:['omdb'],rottentomatoes_critics:['omdb']};
// ID keys a rating source's record stands for.
const MF555R_RECORD_KEYS={jikan:['mal'],malofficial:['mal'],anilist:['anilist'],kitsu:['kitsu'],tvmaze:['tvmaze'],
  omdb:['imdb'],tmdb:['tmdb','tmdb_tv'],trakt:['trakt'],simkl:['simkl'],watchmode:['watchmode'],vndb:['vndb']};

const mf555rSleep=(ms,signal)=>new Promise((resolve,reject)=>{
  if(signal?.aborted)return reject(new Error('Stopped'));
  const t=setTimeout(resolve,ms);
  signal?.addEventListener?.('abort',()=>{clearTimeout(t);reject(new Error('Stopped'));},{once:true});
});
const mf555rNorm=t=>mf439Norm(t);
function mf555rIsMovie(item){
  const unit=String((typeof getCategory==='function'?getCategory(item.categoryId):null)?.unit||'').toLowerCase();
  const fmt=String(item.mediaFormat||item.universalMetadata?.fields?.mediaFormat||'').toLowerCase();
  return unit==='movies'||/\bmovie|film\b/.test(fmt);
}
function mf555rIsSeries(item){
  const unit=String((typeof getCategory==='function'?getCategory(item.categoryId):null)?.unit||'').toLowerCase();
  return unit==='episodes';
}
// "Attack on Titan Season 3" → "Attack on Titan"; null when no season marker.
function mf555rBaseShowName(title){
  const t=String(title||'').trim();
  const m=t.match(/^(.{2,}?)(?:\s*[:\-–—]\s*|\s+)(?:season\s*\d+|\d+(?:st|nd|rd|th)\s+season|s\d{1,2}|part\s*\d+|cour\s*\d+|(?:the\s+)?final\s+season(?:\s*(?:part|cour)\s*\d+)?|第?\d+期|second season|third season|fourth season|fifth season)(?:\s*[:\-–—].*)?$/i);
  return m?m[1].trim():null;
}
function mf555rRowYear(row){return mf439Year(row?.year||row?.legacy?.year||row?.legacy?.releaseDate);}
function mf555rRowType(row){
  const keys=Object.keys(row?.externalIds||{});
  if(keys.includes('tmdb_tv'))return 'series';
  if(row?.provider==='tmdb'&&keys.includes('tmdb'))return 'movie';
  const f=String(row?.legacy?.mediaFormat||row?.fields?.mediaFormat||'').toLowerCase();
  if(/series|tv|show/.test(f))return 'series';
  if(/movie|film/.test(f))return 'movie';
  return '';
}
function mf555rIdsConflict(row,ids){
  for(const [k,v] of Object.entries(row?.externalIds||{}))
    if(v&&ids[k]&&String(ids[k]).toLowerCase()!==String(v).toLowerCase())return true;
  return false;
}
function mf555rIdMatch(row,ids){
  for(const k of MF555R_RECORD_KEYS[row?.provider]||[]){
    const v=row?.externalIds?.[k];
    if(v&&ids[k]&&String(ids[k]).toLowerCase()===String(v).toLowerCase())return k;
  }
  return '';
}

/* ---------- source calls ---------- */
async function mf555rGateway(provider,query,signal){
  const last=MF555R.gatewayLast.get(provider)||0,wait=last+MF555R_GATEWAY_GAP-Date.now();
  if(wait>0)await mf555rSleep(wait,signal);
  MF555R.gatewayLast.set(provider,Date.now());
  try{return await mf439LookupGateway(provider,query);}
  catch(e){
    const msg=String(e?.message||e);
    // Older gateway: one request per source every 10 seconds.
    if(/wait ten seconds|wait.*seconds/i.test(msg)){
      await mf555rSleep(10500,signal);MF555R.gatewayLast.set(provider,Date.now());
      return mf439LookupGateway(provider,query);
    }
    throw e;
  }
}
async function mf555rLookup(provider,query,signal){
  if(signal?.aborted)throw new Error('Stopped');
  if(MF439_GATEWAY.includes(provider))return mf555rGateway(provider,query,signal);
  return mf439LookupPublic(provider,query,signal);
}
function mf555rQuery(item,title,ids){
  return {id:item.id,title,categoryId:item.categoryId,year:item.year,releaseDate:item.releaseDate,
    externalIds:{...ids},universalMetadata:{mediaType:item.universalMetadata?.mediaType||'unspecified'}};
}

/* ---------- Wikidata ID links ---------- */
const MF555R_WD={mal:'P4086',anilist:'P8729',imdb:'P345',tmdb:'P4947',tmdb_tv:'P4983'};
const MF555R_WD_VALID={mal:/^\d{1,9}$/,anilist:/^\d{1,9}$/,imdb:/^tt\d{7,12}$/,tmdb:/^\d{1,9}$/,tmdb_tv:/^\d{1,9}$/};
async function mf555rWikiFetch(params,signal){
  const wait=MF555R.wikiLast+MF555R_WIKI_GAP-Date.now();
  if(wait>0)await mf555rSleep(wait,signal);
  MF555R.wikiLast=Date.now();
  const url=new URL('https://www.wikidata.org/w/api.php');
  for(const [k,v] of Object.entries({...params,format:'json',origin:'*'}))url.searchParams.set(k,v);
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),9000);
  signal?.addEventListener?.('abort',()=>ctrl.abort(),{once:true});
  try{const r=await fetch(url.href,{signal:ctrl.signal,headers:{Accept:'application/json'}});
    if(!r.ok)throw new Error('Wikidata HTTP '+r.status);return await r.json();}
  finally{clearTimeout(timer);}
}
function mf555rClaims(entity,prop){
  return (entity?.claims?.[prop]||[]).filter(c=>c?.rank!=='deprecated')
    .map(c=>c?.mainsnak?.datavalue?.value).filter(v=>v!=null);
}
function mf555rWikiIds(entity){
  const out={};
  for(const [key,prop] of Object.entries(MF555R_WD)){
    const vals=[...new Set(mf555rClaims(entity,prop).map(v=>String(v)).filter(v=>MF555R_WD_VALID[key].test(v)))];
    if(vals.length===1)out[key]=vals[0]; // several different values = ambiguous, skip
  }
  return out;
}
async function mf555rWikidata(ids,signal){
  for(const key of ['mal','anilist','imdb','tmdb_tv','tmdb']){
    const value=String(ids[key]||'').trim();
    if(!value||!MF555R_WD_VALID[key].test(value))continue;
    const cacheKey=key+':'+value;
    if(MF555R.wikiCache.has(cacheKey))return MF555R.wikiCache.get(cacheKey);
    let result=null;
    try{
      const found=await mf555rWikiFetch({action:'query',list:'search',srsearch:'haswbstatement:'+MF555R_WD[key]+'='+value,srlimit:'3'},signal);
      const hits=(found?.query?.search||[]).map(h=>h.title).filter(t=>/^Q\d+$/.test(t));
      if(hits.length===1){
        const ent=await mf555rWikiFetch({action:'wbgetentities',ids:hits[0],props:'claims'},signal);
        const entity=ent?.entities?.[hits[0]];
        // The item must really carry the ID we searched for.
        if(entity&&mf555rClaims(entity,MF555R_WD[key]).map(String).includes(value)){
          result={qid:hits[0],ids:mf555rWikiIds(entity),parent:null};
          // A season item: its series ("part of the series") holds the show's IDs.
          const parents=[...new Set(mf555rClaims(entity,'P179').map(v=>v?.id).filter(v=>/^Q\d+$/.test(v||'')))];
          if(parents.length===1&&(!result.ids.imdb||!result.ids.tmdb_tv)){
            const pe=await mf555rWikiFetch({action:'wbgetentities',ids:parents[0],props:'claims'},signal);
            const p=pe?.entities?.[parents[0]];
            if(p)result.parent={qid:parents[0],ids:mf555rWikiIds(p)};
          }
        }
      }
    }catch(e){if(signal?.aborted)throw e;result=null;}
    MF555R.wikiCache.set(cacheKey,result);
    if(result)return result;
  }
  return null;
}

/* ---------- the engine ---------- */
async function mf555RatingsForTitle(item,{providers,signal,progress=()=>{}}={}){
  const savedIds={...(item.externalIds||{})};
  for(const k of Object.keys(savedIds))if(savedIds[k]==null||String(savedIds[k]).trim()==='')delete savedIds[k];
  const ids={...savedIds};                 // saved + verified discoveries (used for lookups)
  const discovered={};                      // new IDs to save
  const accepted=[];                        // rows whose ratings may be written
  const done=new Set();                     // sources that already produced an accepted row
  const failures=[];
  const names=new Map();                    // normalized → original, all known names
  const addName=n=>{const v=mf439Plain(n,220),k=mf555rNorm(v);if(k&&!names.has(k))names.set(k,v);};
  for(const n of mf439TitleVariants(item))addName(n);
  const itemYear=mf439Year(item.year||item.releaseDate||item.universalMetadata?.fields?.releaseDate);
  const movie=mf555rIsMovie(item),series=mf555rIsSeries(item);
  const learn=(row,via)=>{
    // A verified record teaches us its names and IDs.
    addName(row.title);for(const a of row.aliases||[])addName(a);
    for(const [k,v] of Object.entries(row.externalIds||{})){
      const val=String(v||'').trim();if(!val||!/^[A-Za-z0-9_:.-]{1,120}$/.test(val))continue;
      if(savedIds[k]){continue;}
      if(discovered[k]&&discovered[k].value!==val){discovered[k].conflict=true;continue;}
      if(!discovered[k])discovered[k]={value:val,via};
      if(!ids[k])ids[k]=val;
    }
  };
  const accept=(row,via,extra={})=>{accepted.push({...row,mf555Via:via,...extra});done.add(row.provider);learn(row,via);};
  const call=async(provider,query)=>{
    try{return await mf555rLookup(provider,query,signal)||[];}
    catch(e){if(signal?.aborted)throw e;failures.push({provider,reason:String(e?.message||e).slice(0,160)});return [];}
  };
  const canById=p=>(MF555R_ID_LOOKUP[p]||[]).some(k=>ids[k]);

  // 1. Saved IDs first.
  for(const p of providers){
    if(!canById(p))continue;
    progress('Checking '+p+' by saved ID…');
    for(const row of await call(p,mf555rQuery(item,item.title,ids))){
      if(mf555rIdsConflict(row,savedIds))continue;
      if(mf555rIdMatch(row,ids)){accept(row,'saved-id');MF555R.stats.byId++;break;}
    }
  }

  // 2a. Wikidata links between MAL / AniList / IMDb / TMDB.
  let wiki=null;
  if(['mal','anilist','imdb','tmdb','tmdb_tv'].some(k=>ids[k])){
    progress('Linking IDs through Wikidata…');
    try{wiki=await mf555rWikidata(ids,signal);}catch(e){if(signal?.aborted)throw e;}
    if(wiki?.ids)for(const [k,v] of Object.entries(wiki.ids)){
      if(savedIds[k]&&savedIds[k]!==v)continue;                     // never contradict a saved ID
      if(!savedIds[k]&&!discovered[k]){discovered[k]={value:v,via:'wikidata'};ids[k]=v;MF555R.stats.byWikidata++;}
    }
  }

  // 2b. Search every missing source with every known name.
  const ordered=()=>{
    const list=[...names.values()];
    // English-looking names first (IMDb/TMDB list most anime under English names).
    return list.sort((a,b)=>(/^[\x00-\x7F]+$/.test(b)?1:0)-(/^[\x00-\x7F]+$/.test(a)?1:0)).slice(0,6);
  };
  const pickByName=(rows,variantSet)=>{
    const hits=rows.filter(row=>{
      if(!row?.recordId||mf555rIdsConflict(row,savedIds))return false;
      const rowNames=[row.title,...(row.aliases||[])].map(mf555rNorm);
      if(!rowNames.some(n=>variantSet.has(n)))return false;
      const y=mf555rRowYear(row);
      if(itemYear&&y&&Math.abs(itemYear-y)>1)return false;
      const type=mf555rRowType(row);
      if(type&&movie&&type==='series')return false;
      if(type&&series&&type==='movie')return false;
      return true;
    });
    const distinct=[...new Map(hits.map(r=>[r.provider+':'+r.recordId,r])).values()];
    if(distinct.length===1)return distinct[0];
    const sameYear=distinct.filter(r=>itemYear&&mf555rRowYear(r)===itemYear);
    return sameYear.length===1?sameYear[0]:null;          // ambiguous: skip, don't guess
  };
  for(const p of providers){
    if(done.has(p)||canById(p))continue;
    const variants=ordered();
    const known=new Set(names.keys());
    for(const v of variants){
      progress('Searching '+p+' for “'+v.slice(0,60)+'”…');
      const row=pickByName(await call(p,mf555rQuery(item,v,ids)),known);
      if(row){accept(row,'name');MF555R.stats.byName++;break;}
    }
  }

  // 3. Recheck: sources that can now be asked by a newly found ID.
  for(const p of providers){
    if(done.has(p)||!canById(p))continue;
    progress('Checking '+p+' with newly found ID…');
    for(const row of await call(p,mf555rQuery(item,item.title,ids))){
      if(mf555rIdsConflict(row,savedIds))continue;
      if(mf555rIdMatch(row,ids)){accept(row,'new-id');MF555R.stats.byId++;break;}
    }
  }

  // Seasons: share the whole show's IMDb / TMDB rating.
  if(!movie){
    const needImdb=!accepted.some(r=>r.ratings?.imdb)&&!savedIds.imdb;
    const needTmdb=!accepted.some(r=>r.ratings?.tmdb)&&!savedIds.tmdb_tv&&!savedIds.tmdb;
    if(needImdb||needTmdb){
      const parentIds={};
      if(wiki?.parent?.ids?.imdb&&needImdb)parentIds.imdb=wiki.parent.ids.imdb;
      if(wiki?.parent?.ids?.tmdb_tv&&needTmdb)parentIds.tmdb_tv=wiki.parent.ids.tmdb_tv;
      const base=[...new Set([...names.values()].map(mf555rBaseShowName).filter(Boolean))].slice(0,3);
      for(const [p,key] of [['omdb','imdb'],['tmdb','tmdb_tv']]){
        if(!providers.includes(p)||(key==='imdb'?!needImdb:!needTmdb))continue;
        let row=null;
        if(parentIds[key]){
          progress('Checking the whole show on '+p+'…');
          for(const r of await call(p,mf555rQuery(item,item.title,{[key]:parentIds[key]})))
            if(String(r?.externalIds?.[key]||'').toLowerCase()===parentIds[key].toLowerCase()){row=r;break;}
        }
        for(const b of base){
          if(row)break;
          progress('Searching '+p+' for the whole show “'+b.slice(0,60)+'”…');
          const rows=(await call(p,mf555rQuery({...item,year:0},b,{}))).filter(r=>{
            if(!r?.recordId||mf555rNorm(r.title)!==mf555rNorm(b))return false;
            const type=mf555rRowType(r);if(type==='movie')return false;
            const y=mf555rRowYear(r);return !itemYear||!y||y<=itemYear;   // the show started on/before this season
          });
          const distinct=[...new Map(rows.map(r=>[r.recordId,r])).values()];
          // Several shows with the same name: the most recent one that started before this season.
          distinct.sort((a,b)=>mf555rRowYear(b)-mf555rRowYear(a));
          if(distinct.length===1||(distinct.length>1&&itemYear&&mf555rRowYear(distinct[0])&&mf555rRowYear(distinct[0])!==mf555rRowYear(distinct[1])))row=distinct[0];
        }
        // The show's ID is not this season's ID: share the rating, don't save the ID.
        if(row){accepted.push({...row,externalIds:{},mf555Via:'whole-show'});MF555R.stats.parentShow++;}
      }
    }
  }
  return {accepted,discovered,failures,names:[...names.values()],wiki};
}

/* ---------- writing results ---------- */
function mf555ApplyRatings(item,result){
  const env=mf437Normalized(item.universalMetadata);
  const now=Date.now();let ratings=0,idsWritten=0;
  const byKey=new Map();
  for(const row of result.accepted){
    for(const [key,value] of Object.entries(row.ratings||{})){
      const token='rating.'+key,valid=mf439Value(token,value);
      if(!valid||!MF437_RATING_MAP.has(key))continue;
      const prio=(MF555R_PRIMARY[key]||[]).indexOf(row.provider),rank=prio<0?99:prio;
      const viaRank=row.mf555Via==='whole-show'?1:0;    // a season's own record beats the show's
      const cur=byKey.get(key);
      if(!cur||viaRank<cur.viaRank||(viaRank===cur.viaRank&&rank<cur.rank))byKey.set(key,{row,value:valid,rank,viaRank});
    }
  }
  for(const [key,{row,value}] of byKey){
    const token='rating.'+key;
    if(mf439IsProtected(item,token))continue;
    const existing=env.externalRatings[key],prov=env.provenance[token];
    const has=existing&&existing.score!=null&&String(existing.score).trim()!=='';
    // Refresh only what the same source wrote for the same record; fill gaps freely.
    const sameSource=prov&&prov.verified===true&&prov.source===row.provider&&(!prov.recordId||String(prov.recordId)===String(row.recordId));
    if(has&&!sameSource)continue;
    if(has&&Number(existing.score)===value.score&&Number(existing.scale)===value.scale&&(existing.votes??null)===(value.votes??null))continue;
    if(mf437SetRating(env,key,value,{source:row.provider,verified:true,force:has,updatedAt:now})){
      env.provenance[token]={source:row.provider,verified:true,recordId:String(row.recordId||''),updatedAt:now,
        ...(row.mf555Via==='whole-show'?{scope:'whole-show'}:{} )};
      ratings++;
    }
  }
  const allowed=new Set(V377_ID_PROVIDERS.map(x=>x[0]).concat(['tmdb_tv','tvmaze','vndb','watchmode']));
  const ids={...(item.externalIds||{})};
  for(const [k,d] of Object.entries(result.discovered)){
    if(d.conflict||!allowed.has(k))continue;
    if(ids[k]!=null&&String(ids[k]).trim()!=='')continue;     // never replace a saved ID
    ids[k]=d.value;idsWritten++;
  }
  if(ratings){item.universalMetadata=env;}
  if(idsWritten)item.externalIds=ids;
  if(ratings||idsWritten){
    item.modifiedAt=Math.max(Number(item.modifiedAt)||0,now);
    MF555R.stats.ratingsWritten+=ratings;MF555R.stats.idsWritten+=idsWritten;
  }
  return {ratings,ids:idsWritten,changed:ratings+idsWritten};
}

/* Sources that make sense for the title's media type (category type is
 * video / reading / playing / listening). Unknown types keep every source. */
const MF555R_BY_TYPE={
  video:['jikan','malofficial','anilist','kitsu','tvmaze','omdb','tmdb','trakt','simkl','watchmode'],
  reading:['jikan','malofficial','anilist','kitsu','openlibrary','gutendex','vndb'],
  playing:['steam','vndb'],
  listening:['itunes','musicbrainz']
};
function mf555rSourcesFor(item,providers){
  const type=String((typeof getCategory==='function'?getCategory(item.categoryId):null)?.type||'');
  const allowed=MF555R_BY_TYPE[type];
  return allowed?providers.filter(p=>allowed.includes(p)):providers;
}

/* ---------- replace the per-title refresh (button + automatic) ---------- */
mf467RefreshRatings=async function(id,options={}){
  const quiet=options?.quiet===true;
  id=String(id??'');
  const item=mf439Item(id);
  if(!item||!AUTH_USER||!AUTH_READY||S.loading)return {ok:false,reason:'Save the title and finish loading MediaFlow first.'};
  if(MF467.working||MF466.working||MF439.working||MF424.running||MF442.process||mf442CoverLockIsActive()||mf442MetadataLockIsActive()||
    (typeof MF453Quick!=='undefined'&&MF453Quick.current)){
    const reason='Another recovery or ratings refresh is already running.';
    if(!quiet)showToast(reason);return {ok:false,reason};
  }
  if(!navigator.onLine){if(!quiet)showToast('Offline. Ratings need provider access.');return {ok:false,reason:'Offline'};}
  const providers=mf555rSourcesFor(item,mf467RatingProviders(item));
  if(!providers.length){
    const reason='No ready rating sources. Enable/configure them in Provider Management.';
    if(!quiet)showToast(reason);return {ok:false,reason};
  }
  if(!mf442AcquireProcess('metadata')){if(!quiet)showToast('A recovery is already active in another tab.');return {ok:false,reason:'Another tab owns recovery'};}
  if(!mf439AcquireLease()){mf442ReleaseProcess('metadata');if(!quiet)showToast('Metadata recovery is already active.');return {ok:false,reason:'Another tab owns metadata'};}
  const account=mf439Account(),signature=mf442TitleSignature(item),epoch=++MF467.sequence;
  const before=structuredClone(item.universalMetadata?.externalRatings||{});
  const oldAccount=MF439.account,controller=options.signal?null:new AbortController();
  const signal=options.signal||controller.signal;
  const result={ok:false,changed:0,ratings:0,ids:0};
  MF467.working=true;MF467.titleId=id;MF467.account=account;MF467.abort=controller||{abort(){}};
  MF467.provider='';MF467.note='Checking saved IDs…';MF467.success=null;
  MF439.account=account;MF439.working=true;
  const keepAlive=setInterval(()=>{if(!mf442RenewMetadataLease())controller?.abort();},8000);
  mf467Paint(item);
  try{
    const found=await mf555RatingsForTitle(item,{providers,signal,progress:note=>{MF467.note=note;mf467Paint(item);}});
    if(signal.aborted||epoch!==MF467.sequence||!mf442ProcessOwned('metadata')||!mf442MetadataLeaseOwned()||
      !mf467IsCurrent(item,id,account,signature))
      throw Error('Title, account, or recovery ownership changed. Nothing saved.');
    const written=mf555ApplyRatings(item,found);
    Object.assign(result,{changed:written.ratings,ratings:written.ratings,ids:written.ids,
      sources:[...new Set(found.accepted.map(r=>r.provider))],failures:found.failures});
    MF555R.stats.titles++;
    MF555R.stats.lastLog=[{title:item.title,at:Date.now(),ratings:written.ratings,ids:written.ids,
      via:found.accepted.map(r=>r.provider+':'+r.mf555Via)},...MF555R.stats.lastLog].slice(0,20);
    if(written.changed){
      await saveState();
      try{v53InvalidateLibraryCache();}catch(_){}
    }
    const parts=[];
    if(written.ratings)parts.push(written.ratings+' rating'+(written.ratings===1?'':'s'));
    if(written.ids)parts.push(written.ids+' ID'+(written.ids===1?'':'s'));
    MF467.note=parts.length?parts.join(' and ')+' saved.':
      (found.accepted.length?'Ratings already up to date.':'No verified match found.'+(found.failures.length?' Some sources were unavailable.':''));
    result.ok=true;MF467.success=true;
    mf467PatchEditor(item,before);mf467PatchDetails(item);
    if(typeof mf466Repaint==='function')mf466Repaint();
  }catch(e){
    result.reason=String(e?.message||e).slice(0,160);
    MF467.note=result.reason;MF467.success=false;
    if(!/Stopped/.test(result.reason))console.warn('v555 ratings refresh:',e);
  }finally{
    clearInterval(keepAlive);
    MF467.working=false;MF467.provider='';MF467.abort=null;
    MF439.working=false;MF439.account=oldAccount;
    mf439ReleaseLease();mf442ReleaseProcess('metadata');
    mf467Paint(item);
  }
  if(!quiet)showToast(MF467.note);
  return result;
};
App.mf467RefreshRatings=mf467RefreshRatings;

/* ---------- automatic catch-up through the existing Library ---------- */
Object.assign(MF547_LIMITS,{perHour:60,perDay:500,minGapMs:20000,scanChunk:600});
// Titles with no ratings at all are picked before titles missing only some:
// a separate, bounded scan looks for those first; the original scan follows.
let MF555R_EMPTY_CURSOR=0;
const mf555ChooseNextBase=mf547ChooseNext;
mf547ChooseNext=function(){
  const forced=MF547.forced.size?mf555ChooseNextBase.apply(this,arguments):null;
  if(forced)return forced;
  const lib=Array.isArray(S.library)?S.library:[],now=Date.now();
  const limit=Math.min(300,lib.length);
  for(let n=0;n<limit;n++){
    const item=lib[MF555R_EMPTY_CURSOR%lib.length];
    MF555R_EMPTY_CURSOR=(MF555R_EMPTY_CURSOR+1)%Math.max(1,lib.length);
    if(!item)continue;
    const has=Object.values(item.universalMetadata?.externalRatings||{}).some(r=>r&&r.score!=null&&String(r.score).trim()!=='');
    if(has)continue;
    if(mf547Eligible(item,now)&&mf547CanRefresh(item))return {item,force:false};
  }
  return mf555ChooseNextBase.apply(this,arguments);
};
// Faster title lookups for every recovery path.
mf439Item=function(id){return (typeof mf555ById==='function'?mf555ById(id):null)||(S.library||[]).find(x=>String(x?.id)===String(id))||null;};

window.MediaFlowV555Ratings=Object.freeze({version:MF555_VERSION,stats:()=>JSON.parse(JSON.stringify(MF555R.stats)),
  forTitle:mf555RatingsForTitle,apply:mf555ApplyRatings,baseShowName:mf555rBaseShowName,wikidata:mf555rWikidata});
MediaFlowRuntime.version=MF555_VERSION;

/* ---------- "Refresh all missing ratings" (user-started, with progress + stop) ---------- */
const MF555BULK={running:false,controller:null,done:0,total:0,ratings:0,ids:0,current:'',note:'',quotaStreak:0};
function mf555BulkHtml(){
  const b=MF555BULK;
  const pct=b.total?Math.round(b.done/b.total*100):0;
  return '<div class="mf555-bulk" data-mf555-bulk>'+
    (b.running?
      '<div class="mf555-bulk-progress" role="progressbar" aria-valuemin="0" aria-valuemax="'+b.total+'" aria-valuenow="'+b.done+'"><i style="width:'+pct+'%"></i></div>'+
      '<div class="mf555-bulk-line"><strong>'+b.done.toLocaleString()+' / '+b.total.toLocaleString()+'</strong> titles · '+
        b.ratings.toLocaleString()+' ratings · '+b.ids.toLocaleString()+' IDs saved</div>'+
      '<div class="mf555-bulk-current">'+escapeHtml(b.current||'Preparing…')+'</div>'+
      '<button type="button" class="btn btn-sm btn-ghost" onclick="App.mf555StopAllMissing()">'+mf425Icon('stop',15)+' Stop</button>'
    :
      '<button type="button" class="btn btn-sm" onclick="App.mf555RefreshAllMissing()">'+mf425Icon('refresh',15)+' Refresh all missing ratings</button>'+
      (b.note?'<div class="mf555-bulk-line">'+escapeHtml(b.note)+'</div>':''))+
  '</div>';
}
function mf555BulkPaint(){
  for(const el of document.querySelectorAll('[data-mf555-bulk]'))el.outerHTML=mf555BulkHtml();
}
function mf555HasNoRatings(item){
  return !Object.values(item?.universalMetadata?.externalRatings||{}).some(r=>r&&r.score!=null&&String(r.score).trim()!=='');
}
App.mf555RefreshAllMissing=async function(){
  if(MF555BULK.running)return;
  if(!AUTH_USER||!AUTH_READY||S.loading){showToast('Finish loading MediaFlow first.');return;}
  const b=MF555BULK;
  Object.assign(b,{running:true,controller:new AbortController(),done:0,total:0,ratings:0,ids:0,current:'Finding titles with missing ratings…',note:'',quotaStreak:0});
  mf555BulkPaint();
  const signal=b.controller.signal;
  try{
    // Pick candidates in slices so a large Library never freezes the page.
    const empty=[],partial=[];
    const lib=(S.library||[]).slice();
    for(let i=0;i<lib.length;i++){
      const item=lib[i];
      if(item&&mf547CanRefresh(item)&&mf547MissingRating(item))(mf555HasNoRatings(item)?empty:partial).push(String(item.id));
      if(i%400===399){await mf555Yield();if(signal.aborted)throw new Error('Stopped');}
    }
    const queue=[...empty,...partial];
    b.total=queue.length;
    if(!queue.length){b.note='Every title already has the ratings its sources can provide.';return;}
    for(const id of queue){
      if(signal.aborted)break;
      const item=mf439Item(id);
      if(!item){b.done++;continue;}
      b.current=String(item.title||'Untitled').slice(0,90);mf555BulkPaint();
      // Wait for any other recovery to finish rather than skipping titles.
      for(let w=0;w<60&&(MF467.working||MF466.working||MF439.working||MF424.running||MF442.process);w++)await mf555rSleep(1000,signal);
      const r=await App.mf467RefreshRatings(id,{quiet:true,signal});
      b.done++;b.ratings+=Number(r?.ratings)||0;b.ids+=Number(r?.ids)||0;
      // Record the attempt so the automatic catch-up does not repeat it today.
      try{mf547Store(id,{signature:mf547Signature(item),providerSignature:mf547ProvidersForIds(item).join(','),lastAttemptAt:Date.now(),
        ...(r?.ok?{lastSuccessAt:Date.now(),status:r.changed?'updated':'current'}:{status:'no-match'})});}catch(_){}
      const quota=(r?.failures||[]).filter(f=>/quota|limit reached/i.test(f.reason)).length;
      b.quotaStreak=quota&&quota>=(r?.failures||[]).length&&!(r?.ratings)?b.quotaStreak+1:0;
      if(b.quotaStreak>=5){b.note='Paused: the rating sources’ daily limit was reached. Automatic catch-up continues tomorrow.';break;}
      mf555BulkPaint();
    }
    if(!b.note)b.note=signal.aborted?'Stopped. '+b.done+' of '+b.total+' titles checked.':'Done. '+b.done+' titles checked, '+b.ratings+' ratings and '+b.ids+' IDs saved.';
  }catch(e){
    b.note=/Stopped/.test(String(e?.message))?'Stopped.':'Stopped: '+String(e?.message||e).slice(0,120);
  }finally{
    b.running=false;b.controller=null;b.current='';
    mf555BulkPaint();showToast(b.note);
  }
};
App.mf555StopAllMissing=function(){MF555BULK.controller?.abort();try{MF467.abort?.abort?.();}catch(_){}};
// Settings panel: same controls plus the bulk button; limits text updated.
mf547SettingsHtml=function(){
  const p=mf547Prefs();
  return '<section class="mf547-settings" data-mf-setting-id="v547ExternalRatingRefresh">'+
   '<div class="mf547-settings-head">'+mf425Icon('refresh',20)+
   '<div><strong>Automatic external-rating intelligence</strong>'+
   '<small>Uses saved IDs first, finds missing IDs (Wikidata links and every known title name), then rechecks with the new IDs.</small></div></div>'+
   '<label class="mf547-option"><input type="checkbox" '+(p.enabled?'checked ':'')+
   'onchange="App.mf547Set(\'enabled\',this.checked)"><span>Automatically retrieve ratings when IDs change and backfill missing ratings</span></label>'+
   '<label class="mf547-interval"><span>Refresh interval for previously retrieved ratings</span><select onchange="App.mf547Set(\'intervalHours\',Number(this.value))">'+
   MF547_INTERVALS.map(h=>'<option value="'+h+'" '+(p.intervalHours===h?'selected':'')+'>'+
    (h===24?'Every 24 hours':h===72?'Every 3 days':h===168?'Every 7 days':'Every 30 days')+'</option>').join('')+
   '</select></label>'+
   '<label class="mf547-option"><input type="checkbox" '+(p.refreshExisting?'checked ':'')+
   'onchange="App.mf547Set(\'refreshExisting\',this.checked)"><span>Periodically refresh existing ratings too</span></label>'+
   '<div class="mf547-status" data-mf547-status role="status" aria-live="polite">'+escapeHtml(MF547.lastNote)+'</div>'+
   mf555BulkHtml()+
   '<p class="mf547-note">Background catch-up runs while MediaFlow is open and online: up to '+MF547_LIMITS.perHour+' titles per hour and '+MF547_LIMITS.perDay+
   ' per day, titles with no ratings first. Seasons share the whole show’s IMDb and TMDB rating. Saved IDs are never replaced, and uncertain matches are skipped rather than guessed.</p>'+
   '</section>';
};
