/* MediaFlow v437 — Metadata Recovery foundation, safe field merges and independent provider ratings.
 * New metadata is additive. Never reinterpret personal rating, Library progress, XP or History.
 * Public adapters are deliberately limited to implemented, permitted endpoints; catalog-only
 * providers are shown as pending, not presented as live connections. */
const MF437_PROVIDERS=[
 {id:'jikan',name:'Jikan',group:'Anime / Manga',public:true,live:true},
 {id:'anilist',name:'AniList',group:'Anime / Manga',public:true,live:true},
 {id:'kitsu',name:'Kitsu',group:'Anime / Manga',public:true,live:true},
 {id:'tvmaze',name:'TVmaze',group:'TV',public:true,live:true},
 {id:'openlibrary',name:'Open Library',group:'Books',public:true,live:true},
 {id:'itunes',name:'Apple iTunes',group:'Movies / Music / Books',public:true,live:true},
 {id:'vndb',name:'VNDB',group:'Visual Novels',public:true,live:true},
 ...['Tenrai','Shikimori','MangaDex','MangaUpdates','IFDB','MusicBrainz','Open Opus','LibriVox','BookBrainz','Inventaire','Gutendex','Wikidata','Wikimedia Commons','Crossref','OpenAlex','Library of Congress','BnF','German National Library','Fribb','manami-project','Royal Road RSS','Steam Storefront','SteamSpy','CheapShark','PCGamingWiki','Libretro Thumbnails','GameTDB','Cover Art Archive','TheAudioDB','Deezer','Grand Comics Database','Anime News Network'].map(name=>({id:name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name,group:'Additional sources',public:true,live:false})),
 ...['malofficial','tmdb','omdb','trakt','simkl','metron','animeschedule','watchmode','fanart','hardcover','thetvdb','comicvine','anidb','marvel','googlebooks'].map(id=>({id,name:({malofficial:'MyAnimeList Official',tmdb:'TMDB',omdb:'OMDb',trakt:'Trakt',simkl:'SIMKL',metron:'Metron',animeschedule:'AnimeSchedule',watchmode:'Watchmode',fanart:'Fanart.tv',hardcover:'Hardcover',thetvdb:'TheTVDB',comicvine:'Comic Vine',anidb:'AniDB',marvel:'Marvel API',googlebooks:'Google Books'})[id],group:'Supabase-configured (metadata adapter pending)',public:false,live:false}))
];
const MF437_DEFAULTS={mode:'missing',scope:'selected',partSize:100,autoResume:false,providers:['jikan','anilist','kitsu','tvmaze','openlibrary','itunes','vndb'],ratingRefresh:false};
const MF437={job:null,running:false,busy:false,requested:'',pause:false,stop:'',results:[],ready:false,lastError:'',modalOpen:false,metadataVersion:1};
function mf437Prefs(){const saved=S.settings?.v437Metadata||{};return {...MF437_DEFAULTS,...saved,providers:Array.isArray(saved.providers)?saved.providers.slice():MF437_DEFAULTS.providers.slice()};}
function mf437Escape(t){return typeof mf424Escape==='function'?mf424Escape(t):String(t??'').replace(/[&<>"]/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x]));}
function mf437Name(t){return String(t||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
function mf437Find(id){return (S.library||[]).find(item=>String(item?.id)===String(id));}
function mf437Kind(item){const cat=(S.categories||[]).find(c=>String(c.id)===String(item?.categoryId));return (String(cat?.name||'')+' '+String(cat?.type||'')+' '+String(item?.mediaFormat||'')).toLowerCase();}
function mf437Suitable(provider,item){const k=mf437Kind(item),ids=item?.externalIds||{};switch(provider){
 case 'jikan':case 'anilist':case 'kitsu':return /anime|manga|manhwa|manhua|light novel/.test(k)||Boolean(ids.mal||ids.anilist||ids.kitsu);
 case 'tvmaze':return /tv|series|television|show/.test(k)||Boolean(ids.tvmaze);
 case 'openlibrary':return /book|novel|comic|reading|literature/.test(k)||Boolean(ids.isbn||ids.openlibrary);
 case 'vndb':return /visual novel/.test(k)||Boolean(ids.vndb);
 case 'itunes':return true;
 default:return false;
}}
const MF437_FIELD_NAMES=['synopsis','releaseDate','year','genres','themes','studios','producers','durationMinutes','mediaFormat','ageRating'];
const MF437_EXTRA_FIELD_NAMES=['originalTitle','episodeCount','chapterCount','volumeCount','pageCount','trackCount','authors','artists','platforms','publishers','developers','language','network','isbn','originalLanguage','officialSite','visualNovelLength'];
function mf437Rating(value,scale,votes,url){
 if(value===null||value===undefined||value==='')return null;
 const n=Number(value);if(!Number.isFinite(n)||n<0||n>scale)return null;
 return {value:n,scale,votes:Number.isSafeInteger(Number(votes))&&Number(votes)>=0?Number(votes):null,url:/^https:\/\//.test(String(url||''))?String(url):'',updatedAt:Date.now()};
}
async function mf437Fetch(url,body){
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),15000);
 try{const res=await fetch(url,{method:body?'POST':'GET',body:body?JSON.stringify(body):undefined,headers:body?{'Content-Type':'application/json','Accept':'application/json'}:{'Accept':'application/json'},signal:ctl.signal});
  if(!res.ok)throw Error('Provider HTTP '+res.status);
  return await res.json();
 }finally{clearTimeout(timer);}
}
function mf437Entry(item,provider,title,fields,ratings,ids,sourceUrl,aliases=[]){
 const existing=mf437Name(item?.title),candidates=[title,...aliases].map(mf437Name).filter(Boolean);
 const matched=candidates.some(name=>name===existing||name.length>4&&existing.length>4&&(name.includes(existing)||existing.includes(name)));
 const idField=({jikan:'mal',anilist:'anilist',kitsu:'kitsu',tvmaze:'tvmaze',openlibrary:'openlibrary',vndb:'vndb'})[provider];
 const idConfirmed=Boolean(idField&&item.externalIds?.[idField]&&String(item.externalIds[idField])===String(ids?.[idField]));
 if(!matched&&!idConfirmed)return null;
 const sourceYear=Number(fields?.year||String(fields?.releaseDate||'').slice(0,4)),localYear=Number(item.year||'');
 if(!idConfirmed&&sourceYear>1900&&localYear>1900&&Math.abs(sourceYear-localYear)>1)return null;
 return {provider,title,fields,ratings,ids,sourceUrl,matchedBy:idConfirmed?'id':'title',verified:idConfirmed||matched};
}
async function mf437Discover(item,provider){
 const title=String(item.title||'').trim(),q=encodeURIComponent(title),ids=item.externalIds||{},kind=mf437Kind(item);
 if(provider==='jikan'){
  const type=/manga|manhwa|manhua|novel/.test(kind)?'manga':'anime',id=String(ids.mal||'');
  const data=await mf437Fetch('https://api.jikan.moe/v4/'+type+( /^\d+$/.test(id)?'/'+id:'?q='+q+'&limit=5'));
  const row= /^\d+$/.test(id)?data?.data:(data?.data||[])[0];if(!row)return null;
  return mf437Entry(item,provider,row.title,{synopsis:row.synopsis||'',year:row.year||row.published?.from?.slice(0,4)||row.aired?.from?.slice(0,4),genres:(row.genres||[]).map(x=>x.name),themes:(row.themes||[]).map(x=>x.name),studios:(row.studios||[]).map(x=>x.name),mediaFormat:row.type||'',durationMinutes:Number.parseInt(row.duration)||null,episodeCount:row.episodes,chapterCount:row.chapters,volumeCount:row.volumes,authors:(row.authors||[]).map(x=>x.name),originalTitle:row.title_japanese||''}, {mal:mf437Rating(row.score,10,row.scored_by,row.url)},{mal:String(row.mal_id)},row.url,[row.title_english,row.title_japanese,...(row.title_synonyms||[])]);
 }
 if(provider==='anilist'){
  const type=/manga|novel|manhwa|manhua/.test(kind)?'MANGA':'ANIME';
  const query='query($search:String,$id:Int,$type:MediaType){Page(perPage:5){media(search:$search,id:$id,type:$type){id idMal title{romaji english native} synonyms description(asHtml:false) genres tags{name} startDate{year month day} duration format episodes chapters volumes averageScore meanScore popularity siteUrl studios{nodes{name}}}}}';
  const id=Number(ids.anilist)||null,raw=await mf437Fetch('https://graphql.anilist.co',{query,variables:{search:id?null:title,id,type}});
  const row=raw?.data?.Page?.media?.[0];if(!row)return null;
  return mf437Entry(item,provider,row.title?.romaji||row.title?.english,{synopsis:row.description||'',year:row.startDate?.year,genres:row.genres||[],themes:(row.tags||[]).map(x=>x.name),studios:(row.studios?.nodes||[]).map(x=>x.name),durationMinutes:row.duration,mediaFormat:row.format,episodeCount:row.episodes,chapterCount:row.chapters,volumeCount:row.volumes,originalTitle:row.title?.native},{anilist:mf437Rating(row.averageScore,100,null,row.siteUrl)},{anilist:String(row.id),...(row.idMal?{mal:String(row.idMal)}:{})},row.siteUrl,[row.title?.english,row.title?.native,...(row.synonyms||[])]);
 }
 if(provider==='kitsu'){
  const type=/manga|manhwa|manhua|novel/.test(kind)?'manga':'anime',id=String(ids.kitsu||'');
  const data=await mf437Fetch('https://kitsu.io/api/edge/'+type+(id?'/'+encodeURIComponent(id):'?filter%5Btext%5D='+q+'&page%5Blimit%5D=5'));
  const row=id?data?.data:data?.data?.[0];if(!row)return null;const a=row.attributes||{};
  return mf437Entry(item,provider,a.canonicalTitle,{synopsis:a.synopsis||a.description||'',releaseDate:a.startDate||'',genres:[],mediaFormat:a.subtype||'',durationMinutes:a.episodeLength,episodeCount:a.episodeCount,chapterCount:a.chapterCount,volumeCount:a.volumeCount,originalTitle:a.titles?.ja_jp},{kitsu:mf437Rating(a.averageRating,100,null,'https://kitsu.io/'+type+'/'+row.id)},{kitsu:String(row.id)},'https://kitsu.io/'+type+'/'+row.id,Object.values(a.titles||{}));
 }
 if(provider==='tvmaze'){
  const id=String(ids.tvmaze||'');const raw=await mf437Fetch(id?'https://api.tvmaze.com/shows/'+encodeURIComponent(id):'https://api.tvmaze.com/search/shows?q='+q);
  const row=id?raw:raw?.[0]?.show;if(!row)return null;
  return mf437Entry(item,provider,row.name,{synopsis:row.summary||'',releaseDate:row.premiered||'',year:String(row.premiered||'').slice(0,4),genres:row.genres||[],mediaFormat:row.type||'',durationMinutes:row.runtime||row.averageRuntime||null,language:row.language||'',network:row.network?.name||'',officialSite:row.officialSite||''},{tvmaze:mf437Rating(row.rating?.average,10,null,row.url)},{tvmaze:String(row.id)},row.url);
 }
 if(provider==='openlibrary'){
  const raw=await mf437Fetch('https://openlibrary.org/search.json?title='+q+'&limit=5&fields=key,title,author_name,first_publish_year,subject,isbn');
  const row=raw?.docs?.[0];if(!row)return null;
  return mf437Entry(item,provider,row.title,{year:row.first_publish_year,genres:(row.subject||[]).slice(0,25),producers:(row.author_name||[]).slice(0,20),authors:(row.author_name||[]).slice(0,20),isbn:(row.isbn||[])[0]||'',mediaFormat:'Book'},{},{openlibrary:String(row.key||'').replace('/works/','')},'https://openlibrary.org'+row.key);
 }
 if(provider==='vndb'){
  const id=String(ids.vndb||'');const filters=id?['id','=',id]:['search','=',title];
  const raw=await mf437Fetch('https://api.vndb.org/kana/vn',{filters,fields:'id,title,alttitle,description,released,rating,votecount,length_minutes,image.url',results:5});
  const row=raw?.results?.[0];if(!row)return null;
  return mf437Entry(item,provider,row.title,{synopsis:row.description||'',releaseDate:row.released||'',mediaFormat:'Visual Novel',originalTitle:row.alttitle||'',visualNovelLength:row.length_minutes},{vndb:mf437Rating(row.rating,100,row.votecount,'https://vndb.org/'+row.id)},{vndb:row.id},'https://vndb.org/'+row.id,[row.alttitle]);
 }
 if(provider==='itunes'){
  const media=/music|album|soundtrack|track|song/.test(kind)?'music':/book|novel/.test(kind)?'ebook':/movie|film/.test(kind)?'movie':'all';
  const raw=await mf437Fetch('https://itunes.apple.com/search?term='+q+'&limit=6&media='+media);
  const row=raw?.results?.find(x=>mf437Name(x.collectionName||x.trackName)===mf437Name(title))||raw?.results?.[0];
  if(!row)return null;
  return mf437Entry(item,provider,row.collectionName||row.trackName,{synopsis:row.longDescription||row.description||'',releaseDate:String(row.releaseDate||'').slice(0,10),genres:row.primaryGenreName?[row.primaryGenreName]:[],producers:row.artistName?[row.artistName]:[],durationMinutes:row.trackTimeMillis?Math.round(row.trackTimeMillis/60000):null,artists:row.artistName?[row.artistName]:[],trackCount:row.trackCount,publishers:row.publisherName?[row.publisherName]:[]},{},{itunes:String(row.collectionId||row.trackId||'')},row.collectionViewUrl||row.trackViewUrl);
 }
 return null;
}
function mf437Merge(item,record,mode='missing'){
 if(!record?.verified)return {changed:0,reason:'Unverified match'};
 const before={},after={},manual=item.richMetadataManual||{},fields=record.fields||{};
 for(const name of MF437_FIELD_NAMES){
  if(!Object.prototype.hasOwnProperty.call(fields,name)||manual[name])continue;
  let value=fields[name];if(value===null||value===undefined||value==='')continue;
  if(Array.isArray(value)){value=[...new Set(value.map(x=>String(x||'').trim()).filter(Boolean))].slice(0,40);if(!value.length)continue;}
  if(name==='synopsis')value=v176SafeText(value,6000);
  if(name==='year'||name==='durationMinutes'){value=Number(value);if(!Number.isFinite(value)||value<=0)continue;}
  if(typeof value==='string')value=value.slice(0,name==='synopsis'?6000:180);
  const old=item[name];const empty=old===null||old===undefined||old===''||(Array.isArray(old)&&old.length===0);
  if(!empty&&mode!=='refresh')continue; // default no existing overrides, even in full recovery
  if(JSON.stringify(old)===JSON.stringify(value))continue;
  before[name]=old;after[name]=value;
 }
 const detail={...(item.mediaMetadata||{})};
 for(const name of MF437_EXTRA_FIELD_NAMES){
  let value=fields[name];if(value===undefined||value===null||value===''||item.richMetadataManual?.[name])continue;
  if(Array.isArray(value)){value=[...new Set(value.map(x=>String(x||'').trim()).filter(Boolean))].slice(0,40);if(!value.length)continue;}
  if(typeof value==='string')value=value.slice(0,300);
  if(typeof value==='number'&&(!Number.isFinite(value)||value<=0))continue;
  if(detail[name]!==undefined&&detail[name]!==null&&detail[name]!=='')continue;
  detail[name]=value;
 }
 if(JSON.stringify(detail)!==JSON.stringify(item.mediaMetadata||{})){before.mediaMetadata=item.mediaMetadata;after.mediaMetadata=detail;}
 const ratings={...(item.externalRatings||{})};
 for(const [id,score] of Object.entries(record.ratings||{})){
  if(!score||!Number.isFinite(score.value)||!Number.isFinite(score.scale))continue;
  if(ratings[id]&&!mf437Prefs().ratingRefresh)continue;
  ratings[id]={...score,provider:record.provider};
 }
 if(JSON.stringify(ratings)!==JSON.stringify(item.externalRatings||{})){before.externalRatings=item.externalRatings;after.externalRatings=ratings;}
 const newIds={...(item.externalIds||{})};
 for(const [key,value] of Object.entries(record.ids||{})){
  if(!/^[a-z][a-z0-9_]{0,32}$/.test(key)||!value||String(value).length>120)continue;
  if(item.v377ManualExternalIds&&Object.prototype.hasOwnProperty.call(item.v377ManualExternalIds,key))continue;
  if(newIds[key])continue;
  if(!record.verified)continue;
  newIds[key]=String(value);
 }
 if(JSON.stringify(newIds)!==JSON.stringify(item.externalIds||{})){before.externalIds=item.externalIds;after.externalIds=newIds;}
 const changes=Object.keys(after);if(!changes.length)return {changed:0,reason:'Nothing missing'};
 Object.assign(item,after);item.modifiedAt=Date.now();
 item.metadataRecoverySources={...(item.metadataRecoverySources||{}),...Object.fromEntries(changes.map(x=>[x,{provider:record.provider,at:Date.now(),url:record.sourceUrl||''}]))};
 return {changed:changes.length,before,after,provider:record.provider};
}
async function mf437SaveJob(){if(!MF437.job)return;MF437.job.updatedAt=Date.now();await mf424Storage('put','metadata:'+mf424Account(),MF437.job);}
async function mf437Restore(){if(!AUTH_USER||MF437.running)return;try{
 const job=await mf424Storage('get','metadata:'+mf424Account());if(!job||job.account!==mf424Account())return;
 if(job.status==='running')job.status='paused';MF437.job=job;MF437.ready=true;
 }catch(e){console.warn('Metadata recovery checkpoint unavailable:',e);}
}
async function mf437Process(){
 const job=MF437.job;if(!job||MF437.running||job.account!==mf424Account())return;
 MF437.running=true;MF437.pause=false;MF437.stop='';job.status='running';await mf437SaveJob();
 try{
  const index=new Map((S.library||[]).map(x=>[String(x.id),x]));
  while(job.cursor<job.ids.length){
   if(job.account!==mf424Account()){job.status='paused';break;}
   if(MF437.pause||MF437.stop){job.status=MF437.stop?'stopped':'paused';break;}
   const id=job.ids[job.cursor],item=index.get(id);
   if(!item){job.skipped++;job.cursor++;await mf437SaveJob();continue;}
   let updated=0,attempted=0;
   for(const provider of job.providers){
    if(MF437.pause||MF437.stop)break;
    if(!MF437_PROVIDERS.some(p=>p.id===provider&&p.live)||!mf437Suitable(provider,item))continue;
    attempted++;
    try{
     const record=await mf437Discover(item,provider);
     if(record){const changed=mf437Merge(item,record,job.mode);updated+=changed.changed;
      if(changed.changed){job.events.push({titleId:id,provider,at:Date.now(),before:changed.before,fields:Object.keys(changed.after)});if(job.events.length>200)job.events.shift();}}
    }catch(e){job.errors++;job.lastError=provider+': '+String(e.message||e).slice(0,120);}
    await new Promise(resolve=>setTimeout(resolve,1150));
   }
   if(updated){job.updated++;persistLibrary();await saveState();}
   else job.skipped++;
   job.cursor++;
   await mf437SaveJob();if(typeof mf437Paint==='function')mf437Paint();
   if(job.cursor<job.ids.length&&job.cursor%job.partSize===0){if(job.continuation==='manual'){job.status='waiting-part';break;}}
  }
  if(job.cursor>=job.ids.length)job.status='complete';
 }catch(e){job.status='paused';job.lastError=String(e.message||e).slice(0,200);}
 finally{MF437.running=false;await mf437SaveJob();if(typeof mf437Paint==='function')mf437Paint();}
}
function mf437SelectedIds(mode,category,id){
 if(mode==='single')return id?[String(id)]:[];
 if(mode==='selected')return typeof mf436SelectedLibraryIds==='function'?mf436SelectedLibraryIds():[];
 if(mode==='category')return (S.library||[]).filter(x=>String(x.categoryId)===String(category)).map(x=>String(x.id));
 return (S.library||[]).filter(x=>x?.id!=null).map(x=>String(x.id));
}
async function mf437StartJob(config){
 if(MF437.running||MF437.job&&['running','paused','waiting-part'].includes(MF437.job.status))throw Error('Finish or cancel the previous metadata job first.');
 if(!AUTH_USER)throw Error('Sign in before recovering metadata.');
 const ids=[...new Set(mf437SelectedIds(config.scope,config.category,config.id))];
 if(!ids.length)throw Error('No Library titles in this recovery scope.');
 MF437.job={version:437,account:mf424Account(),ids,cursor:0,status:'queued',mode:config.mode||'missing',
  providers:(config.providers||[]).filter(id=>MF437_PROVIDERS.some(p=>p.id===id&&p.live)),
  partSize:Math.max(1,Math.min(1000,Number(config.partSize)||100)),continuation:config.continuation||'automatic',
  updated:0,skipped:0,errors:0,lastError:'',createdAt:Date.now(),events:[]};
 if(!MF437.job.providers.length)throw Error('Choose at least one working metadata provider.');
 await mf437SaveJob();void mf437Process();
}
window.MediaFlowV437=Object.freeze({version:437,providers:()=>MF437_PROVIDERS.map(x=>({...x})),merge:mf437Merge,discover:mf437Discover});
