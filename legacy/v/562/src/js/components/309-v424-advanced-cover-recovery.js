/* MediaFlow v424 — persistent, deliberately conservative Missing Covers Recovery.
   Source state is kept separate from the existing v158 manual/editor flow.
   All network requests are browser-origin requests; no secret or proxy required.
   Closed browsers cannot run this worker; jobs resume upon reopening. */
const MF424_VERSION = 424;
const MF424_DB_NAME = 'mediaflow-cover-recovery-v424';
const MF424_PROVIDER_META = [
  {id:'tenrai',name:'Tenrai',types:['anime','anime-movie','manga'],limit:35,gap:2200,credentials:false,level:'existing'},
  {id:'jikan',name:'Jikan',types:['anime','anime-movie','manga'],limit:35,gap:2200,credentials:false,level:'experimental'},
  {id:'anilist',name:'AniList',types:['anime','anime-movie','manga'],limit:18,gap:3400,credentials:false,level:'experimental'},
  {id:'kitsu',name:'Kitsu',types:['anime','anime-movie','manga'],limit:30,gap:2400,credentials:false,level:'experimental'},
  {id:'tvmaze',name:'TVmaze',types:['tv'],limit:50,gap:1200,credentials:false,level:'existing'},
  {id:'mangadex',name:'MangaDex',types:['manga'],limit:0,gap:3500,credentials:false,level:'browser CORS blocked'},
  {id:'openlibrary',name:'Open Library',types:['book','comic','reading'],limit:20,gap:3500,credentials:false,level:'existing'},
  {id:'googlebooks',name:'Google Books',types:['book','comic','reading'],limit:0,gap:4500,credentials:true,level:'requires API key'},
  {id:'simkl',name:'SIMKL',types:['anime','anime-movie','tv','movie'],limit:0,gap:0,credentials:true,level:'restricted'},
  {id:'malofficial',name:'MyAnimeList Official',types:['anime','anime-movie','manga'],limit:0,gap:0,credentials:true,level:'restricted'},
  {id:'tmdb',name:'TMDB',types:['movie','tv'],limit:0,gap:0,credentials:true,level:'setup'},
  {id:'omdb',name:'OMDb',types:['movie','tv'],limit:0,gap:0,credentials:true,level:'setup'},
  {id:'thetvdb',name:'TheTVDB',types:['tv'],limit:0,gap:0,credentials:true,level:'setup'},
  {id:'fanart',name:'Fanart.tv',types:['movie','tv'],limit:0,gap:0,credentials:true,level:'setup'},
  {id:'comicvine',name:'Comic Vine',types:['comic'],limit:0,gap:0,credentials:true,level:'setup'},
  {id:'metron',name:'Metron',types:['comic'],limit:0,gap:0,credentials:true,level:'setup'},
  {id:'anidb',name:'AniDB',types:['anime'],limit:0,gap:0,credentials:true,level:'restricted'},
  {id:'animeschedule',name:'AnimeSchedule',types:['anime'],limit:0,gap:0,credentials:false,level:'research'},
  {id:'watchmode',name:'Watchmode',types:['movie','tv'],limit:0,gap:0,credentials:true,level:'research'},
  {id:'marvel',name:'Marvel API',types:['comic'],limit:0,gap:0,credentials:true,level:'research'},
  {id:'wikidata',name:'Wikidata',types:['anime','manga','movie','tv','book','comic'],limit:0,gap:0,credentials:false,level:'mapping'},
  {id:'fribb',name:'Fribb',types:['anime'],limit:0,gap:0,credentials:false,level:'mapping'},
  {id:'manami',name:'manami-project',types:['anime'],limit:0,gap:0,credentials:false,level:'archived'},
  {id:'loc',name:'Library of Congress',types:['book'],limit:0,gap:0,credentials:false,level:'bibliographic'},
  {id:'dnb',name:'German National Library',types:['book'],limit:0,gap:0,credentials:false,level:'bibliographic'},
  {id:'bnf',name:'BnF',types:['book'],limit:0,gap:0,credentials:false,level:'bibliographic'},
  {id:'crossref',name:'Crossref',types:['book'],limit:0,gap:0,credentials:false,level:'bibliographic'}
];
const MF424_DEFAULT = {mode:'parts',partSize:100,continuation:'automatic',selection:'hybrid',protection:'safe',autoResume:true,
  priorities:['tenrai','jikan','anilist','kitsu','tvmaze','openlibrary'],
  enabled:['tenrai','jikan','anilist','kitsu','tvmaze','openlibrary']};
const MF424 = {db:null,job:null,running:false,runner:null,leaseTimer:0,leaseToken:'',timer:0,overlay:false,expanded:false,
  history:[],rate:{},cache:new Map(),account:'',ready:false,status:'idle',toastAt:0};
function mf424Account(){return String((typeof AUTH_USER!=='undefined'&&AUTH_USER?.id)||'local');}
function mf424Escape(s){return typeof escapeHtml==='function'?escapeHtml(String(s??'')):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function mf424Key(){return mf546QueueStorageKey('cover',mf424Account(),'job:'+mf424Account());}
function mf424Defaults(){const s=S.settings||DEFAULT_SETTINGS;const old=s.v424Covers||{};return {...MF424_DEFAULT,...old,
  enabled:Array.isArray(old.enabled)?old.enabled.slice():MF424_DEFAULT.enabled.slice(),
  priorities:Array.isArray(old.priorities)?old.priorities.slice():MF424_DEFAULT.priorities.slice()};}
function mf424DB(){if(MF424.db)return Promise.resolve(MF424.db);return new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(new Error('IndexedDB is not available; durable recovery cannot start.'));return;}
  const req=indexedDB.open(MF424_DB_NAME,1);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('records'))db.createObjectStore('records');};
  req.onsuccess=()=>{MF424.db=req.result;resolve(MF424.db);};req.onerror=()=>reject(req.error||new Error('IndexedDB unavailable'));
});}
async function mf424Storage(action,key,value){const db=await mf424DB();return new Promise((resolve,reject)=>{
  const tx=db.transaction('records',action==='get'?'readonly':'readwrite');const store=tx.objectStore('records');
  const req=action==='put'?store.put(value,key):action==='delete'?store.delete(key):store.get(key);
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});}
async function mf424SaveJob(){if(!MF424.job)return;MF424.job.updated=Date.now();await mf424Storage('put',mf424Key(),MF424.job);}
function mf424Item(id){return (S.library||[]).find(i=>String(i?.id)===String(id))||null;}
function mf424BuildIndex(){MF424.byId=new Map((S.library||[]).filter(i=>i?.id).map(i=>[String(i.id),i]));}
function mf424Lookup(id){return MF424.byId?.get(String(id))||mf424Item(id);}
function mf424Missing(item){return !!item?.id&&!String(item.coverUrl||'').trim();}
function mf424TotalParts(job){return job.mode==='parts'?Math.ceil(job.ids.length/job.partSize):1;}
function mf424Part(job){return job.mode==='parts'?Math.min(mf424TotalParts(job),Math.floor(Math.min(job.cursor,Math.max(0,job.ids.length-1))/job.partSize)+1):1;}
function mf424State(status){if(MF424.job){MF424.job.status=status;MF424.status=status;}mf424Paint();}
function mf424Note(type,message,id){if(!MF424.job)return;
  if(id&&(type==='unresolved'||type==='provider-error'||type==='error')){
    if(!Array.isArray(MF424.job.unresolvedIds))MF424.job.unresolvedIds=[];
    if(!MF424.job.unresolvedIds.includes(String(id)))MF424.job.unresolvedIds.push(String(id));
  }
  MF424.job.results.push({time:Date.now(),type,message,id:String(id||'')});if(MF424.job.results.length>2500)MF424.job.results.splice(0,500);}
function mf424Normalize(value){return String(value||'').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
function mf424Titles(x){const arr=[x?.title,x?.title_english,x?.title_japanese,x?.name,x?.attributes?.canonicalTitle,
  ...(Array.isArray(x?.titles)?x.titles.map(t=>typeof t==='string'?t:t?.title):[]),
  ...(Array.isArray(x?.title_synonyms)?x.title_synonyms:[]),
  ...Object.values(x?.attributes?.titles||{})];return arr.filter(Boolean);}
function mf424Match(item,entry,idMatch){
  const names=mf424Titles(entry).map(mf424Normalize);const wanted=mf424Normalize(cleanTitle(item.title||''));
  if(idMatch)return names.includes(wanted)?{confidence:1,reason:'Exact saved external ID and compatible title'}:{confidence:.84,reason:'Saved ID matches, but returned title is different; manual confirmation required'};
  if(!wanted||!names.includes(wanted))return {confidence:0,reason:'Title mismatch'};
  const statedYear=Number(item.year||item.releaseYear||item.publicationYear)||0;
  const sourceYear=Number(entry?.year||entry?.first_publish_year||String(entry?.premiered||entry?.published?.from||'').slice(0,4))||0;
  if(statedYear&&sourceYear&&statedYear!==sourceYear)return {confidence:0.35,reason:'Conflicting publication years'};
  if(statedYear&&sourceYear&&statedYear===sourceYear)return {confidence:.96,reason:'Exact title and release year'};
  return {confidence:.7,reason:'Exact title; no independent year or creator confirmation'};
}
function mf424Cover(url){try{const u=new URL(url);return u.protocol==='https:'?u.href:'';}catch(_){return '';}}
async function mf424Image(url,provider=''){
  // Cover URLs are network requests too. ISBN image endpoints use a stricter,
  // independently persisted 8-second gap, guarding the 100/5m Open Library limit.
  if(provider==='openlibrary'&&url.includes('/b/isbn/')){
    const state=MF424.rate['openlibrary-art']||{next:0,count:0};MF424.rate['openlibrary-art']=state;
    const wait=Math.max(0,state.next-Date.now());if(wait)await mf424Delay(wait);
    state.next=Date.now()+8000;state.count++;
    if(MF424.job)MF424.job.rate=MF424.rate;
  }
  return new Promise(resolve=>{
  if(!mf424Cover(url)){resolve(false);return;}
  const image=new Image();let settled=false;
  const timer=setTimeout(()=>end(false),9500);
  function end(ok){if(settled)return;settled=true;clearTimeout(timer);image.onload=image.onerror=null;resolve(Boolean(ok));}
  image.onload=()=>end(image.naturalWidth>=50&&image.naturalHeight>=60);
  image.onerror=()=>end(false);
  image.src=url;
});}
function mf424RetryAfter(h){const s=h?.get('Retry-After');if(!s)return 0;const n=Number(s);return Number.isFinite(n)?Math.max(0,n*1000):Math.max(0,Date.parse(s)-Date.now())||0;}
const mf424Delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
// This registry is shared by bulk recovery and the instant Find Cover picker.
// Future provider modules must register both metadata AND a functioning adapter;
// a label without a handler must never be advertised as a working API.
const MF424_EXTRA_COVER_ADAPTERS=new Map();
function mf424RegisterCoverProvider(def,adapter){
  const id=String(def?.id||'').trim();
  if(!/^[a-z][a-z0-9-]{1,39}$/.test(id)||typeof adapter!=='function'||mf424Provider(id))
    throw new Error('A new cover provider needs a unique ID and a working adapter');
  if(!Array.isArray(def.types)||!def.types.length||!def.types.every(t=>typeof t==='string'))
    throw new Error('A cover provider must declare supported media types');
  MF424_PROVIDER_META.push({...def,id,name:String(def.name||id),credentials:Boolean(def.credentials),
    limit:Math.max(0,Number(def.limit)||0),gap:Math.max(0,Number(def.gap)||0)});
  MF424_EXTRA_COVER_ADAPTERS.set(id,adapter);
  return id;
}
function mf424Provider(id){return MF424_PROVIDER_META.find(x=>x.id===id);}
function mf424Kind(item){
  const original=v158ItemKind(item);
  if(!['video','other','reading'].includes(original))return original;
  const ids=item?.externalIds||{},cat=getCategory(item?.categoryId);
  const name=String(item?.categoryId||'')+' '+String(cat?.name||'');
  if(/anime/i.test(name)||ids.mal||ids.anilist||ids.kitsu)return /movie|film/i.test(name)?'anime-movie':'anime';
  if(/manga|manhua|manhwa/i.test(name)||ids.mangadex)return 'manga';
  if(/comic/i.test(name))return 'comic';
  if(/book|novel|literature/i.test(name)||ids.isbn)return 'book';
  if(/tv|television|series|episode/i.test(name)||ids.tvmaze||ids.imdb)return 'tv';
  if(/movie|film/i.test(name))return 'movie';
  return original;
}
function mf424ProviderSupports(item,provider){
  const def=mf424Provider(provider),kind=mf424Kind(item);
  // Categories are user-defined, not authoritative media classifications.
  // The provider reports whether its API can serve the requested work.
  return Boolean(def&&def.limit);
}
function mf424CoverProviderChoices(item){
  const settings=mf424Defaults(),order=settings.priorities.concat(MF424_PROVIDER_META.map(x=>x.id));
  return MF424_PROVIDER_META.slice().sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id)).map(def=>({
    ...def,usable:!!def.limit,compatible:mf424ProviderSupports(item,def.id),
    enabled:settings.enabled.includes(def.id)
  }));
}
function mf424Order(item){const c=mf424Defaults(),choices=mf424CoverProviderChoices(item);
  const valid=choices.filter(p=>p.usable&&p.enabled).map(p=>p.id);
  if(c.selection!=='smart')return valid;
  return valid.sort((a,b)=>Number(mf424HasID(item,b))-Number(mf424HasID(item,a)));
}
function mf424HasID(item,provider){const x=item.externalIds||{};const keys={tenrai:'mal',jikan:'mal',anilist:'anilist',kitsu:'kitsu',tvmaze:'imdb',mangadex:'mangadex',openlibrary:'isbn',googlebooks:'isbn'};
  return Boolean(x[keys[provider]]||(provider==='anilist'&&x.mal)||(provider==='tvmaze'&&x.tvmaze));}
async function mf424Request(provider,url,options={}){
  const def=mf424Provider(provider),settings=mf424Defaults();if(!def||!def.limit)throw new Error('Provider is unavailable without authorization');
  const state=MF424.rate[provider]||{at:[],next:0,cooldown:0,fails:0,count:0};MF424.rate[provider]=state;
  // A repeatedly unreachable API must not freeze an entire Library recovery for every title.
  if(Number(state.unavailableUntil)>Date.now())throw new Error(provider+' temporarily unreachable; other cover sources will be checked');
  const limit=Math.min(def.limit,Math.max(1,Math.floor(def.limit*(settings.protection==='safe'?.75:settings.protection==='balanced'?.9:1))));
  const gap=def.gap*(settings.protection==='safe'?1.5:settings.protection==='balanced'?1.15:1);
  const cacheKey=provider+':'+url+':'+(options.body||'');const hit=MF424.cache.get(cacheKey);
  if(hit&&hit.until>Date.now())return hit.data;
  let attempt=0;
  while(attempt<3){
    if(MF424.job?.hardStop)throw Object.assign(new Error('Recovery stopped by user'),{paused:true});
    let now=Date.now();state.at=state.at.filter(t=>now-t<60000);
    const wait=Math.max(0,state.next-now,state.cooldown-now,state.at.length>=limit?state.at[0]+60000-now:0);
    if(wait){mf424State('cooldown');await mf424Delay(Math.min(3000,wait));continue;}
    attempt++;
    state.at.push(Date.now());state.next=Date.now()+gap;state.count++;
    if(MF424.job)MF424.job.requestCount++;
    const controller=new AbortController();MF424.activeControllers??=new Set();MF424.activeControllers.add(controller);
    const timer=setTimeout(()=>controller.abort(),14500);
    try{
      const res=await fetch(url,{method:options.body?'POST':'GET',body:options.body||undefined,signal:controller.signal,headers:{'Accept':provider==='kitsu'?'application/vnd.api+json':'application/json',...(options.body?{'Content-Type':'application/json'}:{})}});
      if(res.ok){const data=await res.json();
        if(provider==='anilist'&&Array.isArray(data?.errors)&&data.errors.length)throw Object.assign(new Error('AniList API: '+String(data.errors[0]?.message||'GraphQL error').slice(0,100)),{permanent:true});
        if(MF424.cache.size>400)MF424.cache.delete(MF424.cache.keys().next().value);
        MF424.cache.set(cacheKey,{until:Date.now()+3600000,data});state.fails=0;mf424State('running');return data;}
      if(res.status===429||res.status===503){state.cooldown=Date.now()+Math.max(mf424RetryAfter(res.headers),res.status===429?90000:30000);state.fails++;if(MF424.job)MF424.job.rate=MF424.rate;
        mf424Note('cooldown',provider+' '+res.status+' — cooling down');if(MF424.job)MF424.job.cooldownEvents++;await mf424SaveJob();continue;}
      if(res.status>=500){state.fails++;await mf424Delay(1200*(attempt+1));continue;}
      throw Object.assign(new Error(provider+' HTTP '+res.status),{permanent:true});
    }catch(e){if(e.permanent||MF424.job?.hardStop)throw e;state.fails++;if(attempt>=3){state.unavailableUntil=Date.now()+90000;throw e;}await mf424Delay(900*(attempt+1)+Math.random()*550);}
    finally{clearTimeout(timer);MF424.activeControllers?.delete(controller);}
  }
  if(state.fails>=6)state.cooldown=Date.now()+5*60000;
  throw new Error(provider+' temporarily unavailable');
}
function mf424Id(item,name){return String(item.externalIds?.[name]??'').trim();}
function mf424AsCandidate(entry,url,provider,idMatch,link,reason,confidence){url=mf424Cover(url);if(!url)return null;
  const externalIdKey=({tenrai:'mal',jikan:'mal',anilist:'anilist',kitsu:'kitsu',tvmaze:'tvmaze',mangadex:'mangadex',openlibrary:'openlibrary',googlebooks:'googlebooks'})[provider]||'';
  const recordId=String((provider==='openlibrary'?entry?.key:null)??entry?.mal_id??entry?.id??entry?.idMal??'').trim().replace(provider==='openlibrary'?/^\/works\//:/^\u0000/,'');
  const candidate={url,provider,recordUrl:link||'',title:mf424Titles(entry)[0]||'',confidence:confidence??(idMatch?1:.7),reason:reason||'',idMatch:Boolean(idMatch),recordId,externalIdKey,externalIdValue:recordId};
  return typeof mf433EnrichCoverCandidate==='function'?mf433EnrichCoverCandidate(entry,candidate):candidate;
}
function mf424LinkableCoverId(item,candidate){
  if(typeof mf433CandidateLinks==='function'){
    const links=mf433CandidateLinks(item,candidate);
    if(links.length)return links.find(link=>!link.conflict&&link.existing!==link.value)||links[0];
  }
  const key=String(candidate?.externalIdKey||'').trim(),value=String(candidate?.externalIdValue||candidate?.recordId||'').trim();
  if(!/^[a-z][a-z0-9_]{0,32}$/.test(key)||!value||value.length>120||!(/^[\w.:-]+$/.test(value)||key==='openlibrary'&&/^\/works\/OL\d+W$/.test(value)))return null;
  const existing=String(item?.externalIds?.[key]??'').trim();
  if(existing&&existing!==value)return {key,value,existing,conflict:true};
  return {key,value,existing,conflict:false};
}
function mf424LinkSelectedCoverId(item,candidate,{manual=false}={}){
  if(typeof mf433LinkCandidateIds==='function')
    return mf433LinkCandidateIds(item,candidate,{manual})>0;
  const link=mf424LinkableCoverId(item,candidate);
  if(!link||link.conflict||link.existing===link.value)return false;
  // Respect an intentional manual clearing of IDs during automatic recovery.
  if(!manual&&Object.prototype.hasOwnProperty.call(item?.v377ManualExternalIds||{},link.key))return false;
  item.externalIds={...(item.externalIds||{}),[link.key]:link.value};
  if(manual)item.v377ManualExternalIds={...(item.v377ManualExternalIds||{}),[link.key]:link.value};
  return true;
}
async function mf424DiscoverKind(item,provider,kind){
  const title=String(cleanTitle(item.title||'')).trim();
  if(provider==='tenrai'||provider==='jikan'){
    const type=kind==='manga'?'manga':'anime', id=mf424Id(item,'mal');
    const base=provider==='tenrai'?'https://api.tenrai.org/v1/':'https://api.jikan.moe/v4/';
    const data=await mf424Request(provider,base+type+(id?'/'+encodeURIComponent(id):'?q='+encodeURIComponent(title)+'&limit=8'));
    const rows=id?[data?.data]:(Array.isArray(data?.data)?data.data:[]);return rows.filter(Boolean).map(x=>{
      if(id&&String(x.mal_id)!==id)return null;
      if(kind==='anime-movie'&&String(x.type||'').toLowerCase()!=='movie')return null;
      const match=mf424Match(item,x,Boolean(id));
      return mf424AsCandidate(x,x.images?.jpg?.large_image_url||x.images?.webp?.large_image_url||x.images?.jpg?.image_url,provider,Boolean(id),x.url,match.reason,match.confidence);
    }).filter(Boolean);
  }
  if(provider==='anilist'){
    const aid=Number(mf424Id(item,'anilist'))||null,mal=Number(mf424Id(item,'mal'))||null;
    const query='query($id:Int,$idMal:Int,$search:String,$type:MediaType){Page(perPage:8){media(id:$id,idMal:$idMal,search:$search,type:$type){id idMal title{romaji english native} synonyms startDate{year} coverImage{extraLarge large medium} siteUrl format}}}';
    const body=JSON.stringify({query,variables:{id:aid,idMal:aid?null:mal,search:aid||mal?null:title,type:kind==='manga'?'MANGA':'ANIME'}});
    const payload=await mf424Request(provider,'https://graphql.anilist.co',{body});
    return (payload?.data?.Page?.media||[]).map(x=>{
      const known=Boolean(aid&&x.id===aid||!aid&&mal&&x.idMal===mal);
      const entry={id:x.id,idMal:x.idMal,title:x.title?.romaji,titles:[x.title?.english,x.title?.native,...(x.synonyms||[])],year:x.startDate?.year};
      const match=mf424Match(item,entry,known);return mf424AsCandidate(entry,x.coverImage?.extraLarge||x.coverImage?.large,provider,known,x.siteUrl,match.reason,match.confidence);
    }).filter(Boolean);
  }
  if(provider==='kitsu'){
    const id=mf424Id(item,'kitsu'),type=kind==='manga'?'manga':'anime';
    const data=await mf424Request(provider,'https://kitsu.io/api/edge/'+type+(id?'/'+encodeURIComponent(id):'?filter%5Btext%5D='+encodeURIComponent(title)+'&page%5Blimit%5D=8'));
    return (id?[data?.data]:(data?.data||[])).filter(Boolean).map(x=>{
      const a=x.attributes||{},entry={id:x.id,title:a.canonicalTitle,titles:Object.values(a.titles||{}),year:Number(String(a.startDate||'').slice(0,4))};
      const match=mf424Match(item,entry,Boolean(id&&x.id===id));
      return mf424AsCandidate(entry,a.posterImage?.original||a.posterImage?.large||a.posterImage?.medium,provider,Boolean(id&&x.id===id),'https://kitsu.io/'+type+'/'+x.id,match.reason,match.confidence);
    }).filter(Boolean);
  }
  if(provider==='tvmaze'){
    const imdb=mf424Id(item,'imdb'),tvmaze=mf424Id(item,'tvmaze');const url=tvmaze?'https://api.tvmaze.com/shows/'+encodeURIComponent(tvmaze):
      /^tt\d+$/i.test(imdb)?'https://api.tvmaze.com/lookup/shows?imdb='+encodeURIComponent(imdb):'https://api.tvmaze.com/search/shows?q='+encodeURIComponent(title);
    const data=await mf424Request(provider,url);
    return (Array.isArray(data)?data.map(x=>x.show):[data]).filter(Boolean).map(x=>{const direct=Boolean(tvmaze&&String(x.id)===tvmaze||!tvmaze&&imdb&&x.externals?.imdb===imdb);
      const match=mf424Match(item,{title:x.name,year:Number(String(x.premiered||'').slice(0,4))},direct);
      return mf424AsCandidate({id:x.id,title:x.name,externals:x.externals},x.image?.original||x.image?.medium,provider,direct,x.url,match.reason,match.confidence);
    }).filter(Boolean);
  }
  if(provider==='mangadex'){
    const id=mf424Id(item,'mangadex');const url=id?'https://api.mangadex.org/manga/'+encodeURIComponent(id)+'?includes%5B%5D=cover_art':
      'https://api.mangadex.org/manga?title='+encodeURIComponent(title)+'&limit=8&includes%5B%5D=cover_art';
    const data=await mf424Request(provider,url);
    return (id?[data?.data]:(data?.data||[])).filter(Boolean).map(x=>{
      const attrs=x.attributes||{},cover=x.relationships?.find(r=>r.type==='cover_art');const file=cover?.attributes?.fileName;
      const url=file?'https://uploads.mangadex.org/covers/'+x.id+'/'+file:'';
      const entry={id:x.id,title:Object.values(attrs.title||{})[0],titles:Object.values(attrs.altTitles||[]).flatMap(o=>Object.values(o)),year:attrs.year};
      const match=mf424Match(item,entry,Boolean(id&&x.id===id));
      return mf424AsCandidate(entry,url,provider,Boolean(id&&x.id===id),'https://mangadex.org/title/'+x.id,match.reason,match.confidence);
    }).filter(Boolean);
  }
  if(provider==='openlibrary'){
    const isbn=mf424Id(item,'isbn').replace(/[^0-9Xx]/g,'');
    if(/^(?:\d{13}|\d{9}[\dXx])$/.test(isbn)){
      const url='https://covers.openlibrary.org/b/isbn/'+encodeURIComponent(isbn)+'-L.jpg?default=false';
      return [mf424AsCandidate({title},url,provider,true,'https://openlibrary.org/isbn/'+isbn,'Exact ISBN edition',1)].filter(Boolean);
    }
    const data=await mf424Request(provider,'https://openlibrary.org/search.json?title='+encodeURIComponent(title)+'&limit=8&fields=key,title,first_publish_year,cover_i');
    return (data?.docs||[]).filter(x=>x.cover_i).map(x=>{const m=mf424Match(item,{title:x.title,year:x.first_publish_year},false);
      return mf424AsCandidate({title:x.title,key:x.key},'https://covers.openlibrary.org/b/id/'+x.cover_i+'-L.jpg?default=false',provider,false,'https://openlibrary.org'+x.key,m.reason,m.confidence);
    }).filter(Boolean);
  }
  if(provider==='googlebooks'){
    const isbn=mf424Id(item,'isbn');const q=isbn?'isbn:'+isbn:'intitle:'+title;
    const data=await mf424Request(provider,'https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent(q)+'&maxResults=8');
    return (data?.items||[]).map(x=>{const a=x.volumeInfo||{},m=mf424Match(item,{title:a.title,year:Number(String(a.publishedDate||'').slice(0,4))},Boolean(isbn&&a.industryIdentifiers?.some(i=>i.identifier===isbn)));
      const u=String(a.imageLinks?.thumbnail||a.imageLinks?.smallThumbnail||'').replace(/^http:/,'https:');
      return mf424AsCandidate({title:a.title},u,provider,Boolean(isbn&&a.industryIdentifiers?.some(i=>i.identifier===isbn)),a.infoLink,m.reason,m.confidence);
    }).filter(Boolean);
  }
  return [];
}
// Search each provider's own supported catalogues, not MediaFlow category names.
// A provider may return no matching record, but it is never blocked by the
// user's chosen category. Existing IDs get first chance; name search follows
// if the saved ID is missing, stale, or identifies a differently named work.
async function mf424Discover(item,provider){
  if(MF424_EXTRA_COVER_ADAPTERS.has(provider))
    return MF424_EXTRA_COVER_ADAPTERS.get(provider)(item,{request:mf424Request,validate:mf424AsCandidate,cover:mf424Cover,match:mf424Match});
  const kinds=['tenrai','jikan','anilist','kitsu'].includes(provider)
    ?(mf424Kind(item)==='manga'?['manga','anime']:['anime','manga'])
    :[mf424Kind(item)];
  const all=[],seen=new Set(),issues=[];
  const append=rows=>{for(const c of rows||[]){if(!c?.url||seen.has(c.url))continue;seen.add(c.url);all.push(c);}};
  for(const kind of kinds){
    let direct=[];
    try{direct=await mf424DiscoverKind(item,provider,kind);append(direct);}
    catch(error){issues.push(error);}
    if(mf424HasID(item,provider)&&!direct.some(c=>c.idMatch&&c.confidence>=.95)){
      const ids={...(item.externalIds||{})};
      if(provider==='tenrai'||provider==='jikan')delete ids.mal;
      if(provider==='anilist'){delete ids.anilist;delete ids.mal;}
      if(provider==='kitsu')delete ids.kitsu;
      if(provider==='tvmaze'){delete ids.tvmaze;delete ids.imdb;}
      if(provider==='openlibrary')delete ids.isbn;
      try{append(await mf424DiscoverKind({...item,externalIds:ids},provider,kind));}
      catch(error){issues.push(error);}
    }
  }
  if(!all.length&&issues.length)throw issues[0];
  return all;
}
async function mf424Candidates(item){
  const found=[],dedupe=new Set(),ordered=mf424Order(item),manual=mf424Defaults().selection==='manual';
  const idFirst=ordered.filter(p=>mf424HasID(item,p)),search=ordered.filter(p=>!mf424HasID(item,p));
  for(const provider of idFirst.concat(search)){
    try{
      for(const candidate of await mf424Discover(item,provider)){
        if(!candidate||dedupe.has(candidate.url)||(!manual&&candidate.confidence<.65))continue;
        dedupe.add(candidate.url);
        if(!await mf424Image(candidate.url,candidate.provider))continue;
        // Keep collecting choice candidates rather than stopping after the
        // first confident ID match. Continue to the next registered provider.
        if(found.length<24)found.push(candidate);
      }
    }catch(error){if(error.paused)break;mf424Note('provider-error',provider+': '+String(error.message||error),item.id);}
  }
  return found;
}
function mf424QueueReview(item,candidates){MF424.job.reviews.push({id:String(item.id),title:String(cleanTitle(item.title||'')),
  expectedModified:Number(item.modifiedAt)||0,added:Date.now(),candidates});
  MF424.job.pending++;mf424Note('review','Manual confirmation required',item.id);
}
async function mf424Apply(item,candidate,expected,{manual=false,linkId=true}={}){
  if(mf424Account()!==MF424.account)throw new Error('Account changed; recovery suspended');
  if(!mf424Missing(item))return false;
  if(Number(item.modifiedAt||0)!==Number(expected||0))return false;
  if(!await mf424Image(candidate.url,candidate.provider))return false;
  // A slow image probe may outlive this tab's lease or account session.
  if(mf424Account()!==MF424.account||(MF424.running&&!mf424OwnLease())||
     (MF424.running&&typeof mf442ProcessOwned==='function'&&!mf442ProcessOwned('cover')))return false;
  if(!mf424Missing(item)||Number(item.modifiedAt||0)!==Number(expected||0))return false;
  item.coverUrl=candidate.url;item.coverSource='auto:'+candidate.provider+':'+(candidate.idMatch?'external-id':'verified');
  // A selected cover can safely link a record ID, but existing IDs are sacred.
  // Auto jobs link only a verified direct ID; explicit user selection may link
  // a title-search record after the user has reviewed the provider's title.
  if(linkId&&(manual||candidate.idMatch&&candidate.confidence>=.95))mf424LinkSelectedCoverId(item,candidate,{manual});
  item.modifiedAt=Date.now();MF424.job.dirty++;if(typeof mf425CreditRecoveredCover==='function')mf425CreditRecoveredCover(item,'',candidate.url,candidate.provider);
  return true;
}
async function mf424Flush(){if(!MF424.job?.dirty)return;
  if(mf424Account()!==MF424.account)throw new Error('Account changed before saving');
  if(MF424.running&&typeof mf442ProcessOwned==='function'&&!mf442ProcessOwned('cover'))throw new Error('Recovery process lock changed; cover save suspended');
  if(typeof v53InvalidateLibraryCache==='function')v53InvalidateLibraryCache();
  await saveState();MF424.job.dirty=0;MF424.byId=null;mf424BuildIndex();
}
async function mf424WaitForLibrary(){
  // DOM readiness is not sufficient: cloud state/account hydration is asynchronous.
  for(let attempt=0;attempt<240;attempt++){
    if(Array.isArray(S.library)&&S.loading!==true&&mf424Account()===MF424.job?.account)return;
    await mf424Delay(250);
  }
  throw new Error('Account Library is not fully loaded; recovery paused rather than skipping titles');
}
function mf424LeaseKey(){return 'mf-v424-owner-'+mf424Account();}
function mf424OwnLease(){try{const row=JSON.parse(localStorage.getItem(mf424LeaseKey())||'null');return Boolean(MF424.leaseToken&&row?.token===MF424.leaseToken&&Number(row.expiry)>Date.now());}catch(_){return false;}}
function mf424Lease(){const key=mf424LeaseKey();try{
  const current=JSON.parse(localStorage.getItem(key)||'null');if(current&&current.expiry>Date.now()&&current.token!==MF424.leaseToken)return false;
  if(!MF424.leaseToken)MF424.leaseToken=String(Date.now())+'-'+Math.random();
  localStorage.setItem(key,JSON.stringify({token:MF424.leaseToken,expiry:Date.now()+16000}));
  clearInterval(MF424.leaseTimer);MF424.leaseTimer=setInterval(()=>{
    if(!mf424OwnLease()){clearInterval(MF424.leaseTimer);if(MF424.job)MF424.job.pauseRequested=true;return;}
    localStorage.setItem(key,JSON.stringify({token:MF424.leaseToken,expiry:Date.now()+16000}));
  },5000);return mf424OwnLease();
}catch(_){return false;}}
function mf424Release(){clearInterval(MF424.leaseTimer);MF424.leaseTimer=0;
  if(mf424OwnLease()){try{localStorage.removeItem(mf424LeaseKey());}catch(_){}}
  MF424.leaseToken='';}
async function mf424Process(item){if(!mf424Missing(item)){MF424.job.skipped++;return;}
  const expected=Number(item.modifiedAt)||0;const candidates=await mf424Candidates(item);
  if(!candidates.length){MF424.job.unresolved++;mf424Note('unresolved','No verified cover found',item.id);return;}
  const mode=mf424Defaults().selection;
  const best=candidates.sort((a,b)=>b.confidence-a.confidence)[0];
  // With user-defined categories, a title-only match cannot establish media
  // identity. Queue it for the owner's choice rather than overwriting artwork.
  // Automatic application requires a verified saved provider ID AND title.
  if(mode==='manual'||!best.idMatch||best.confidence<.95){
    mf424QueueReview(item,candidates);return;
  }
  if(await mf424Apply(item,best,expected)){MF424.job.fixed++;mf424Note('recovered',best.provider,item.id);}
  else{MF424.job.unresolved++;mf424Note('conflict','Title changed; skipped outdated cover candidate',item.id);}
}
async function mf424Run(){if(MF424.running||!MF424.job)return;
  try{await mf424WaitForLibrary();}catch(e){mf424State('paused');MF424.job.pauseRequested=true;await mf424SaveJob();return;}
  if(!mf424Lease()){mf424State('other-tab');return;}
  MF424.running=true;MF424.account=mf424Account();MF424.rate=MF424.job.rate||MF424.rate;mf424BuildIndex();mf424State('running');
  try{
    const job=MF424.job;
    while(job.cursor<job.ids.length){
      if(mf424Account()!==MF424.account){job.pauseRequested=true;throw new Error('Account changed');}
      if(!mf424OwnLease()){job.pauseRequested=true;throw new Error('Another tab claimed this job');}
      if(job.stopRequested||job.pauseRequested)break;
      const partEnd=job.mode==='parts'?Math.min(job.ids.length,(Math.floor(job.cursor/job.partSize)+1)*job.partSize):job.ids.length;
      while(job.cursor<partEnd&&!job.pauseRequested&&!job.stopRequested){
        const id=job.ids[job.cursor],item=mf424Lookup(id);
        try{if(item)await mf424Process(item);else job.skipped++;}
        catch(e){if(!e.paused){job.failed++;mf424Note('error',String(e.message||e),id);}}
        // Never commit a checkpoint for a title processed after lease loss.
        if(!mf424OwnLease()||(typeof mf442ProcessOwned==='function'&&!mf442ProcessOwned('cover'))){job.pauseRequested=true;break;}
        if(job.pauseRequested||job.stopRequested)break;
        await mf424Flush(); // confirm actual Library save BEFORE moving the cursor
        if(!mf424OwnLease()||(typeof mf442ProcessOwned==='function'&&!mf442ProcessOwned('cover'))){job.pauseRequested=true;break;}
        job.cursor++;job.processed++;
        await mf424SaveJob(); // committed results before checkpoint advancement
        if(job.stopAfterTitle){job.stopAfterTitle=false;job.stopRequested=true;await mf424SaveJob();break;}
        mf424Paint();await mf424Delay(0);
      }
      if(job.cursor>=partEnd&&job.mode==='parts'&&job.cursor<job.ids.length){
        if(job.stopAfterPart){job.stopRequested=true;break;}
        if(job.continuation==='manual'){mf424State('waiting-part');await mf424SaveJob();break;}
      }
      if(job.stopAfterPart&&job.mode==='one'){job.stopRequested=true;break;}
    }
    await mf424Flush();
    if(job.stopRequested)mf424State('stopped');
    else if(job.pauseRequested)mf424State('paused');
    else if(job.cursor>=job.ids.length)mf424State(job.pending?'waiting-review':'complete');
    else if(job.status!=='waiting-part')mf424State('paused');
    if(job.status==='complete'||job.status==='stopped')job.ended=Date.now();
    await mf424SaveJob();
  }catch(e){mf424State('paused');MF424.job.pauseRequested=true;mf424Note('error',String(e.message||e));try{await mf424Flush();await mf424SaveJob();}catch(_) {}}
  finally{MF424.running=false;mf424Release();mf424Paint();}
}
async function mf424Start(){if(MF424.running)return;const settings=mf424ReadForm();
  if(!MF424.ready){showToast('Recovery storage is not ready. Please reload and check IndexedDB permissions.');return;}
  // Check ownership before scanning or replacing a queue. A second tab must
  // never overwrite the checkpoint currently being advanced by the owner.
  if(typeof mf546CheckNewQueueStart==='function'&&!await mf546CheckNewQueueStart('cover'))return;
  const missing=[];const lib=S.library||[];
  for(let i=0;i<lib.length;i+=1000){
    for(const item of lib.slice(i,i+1000))if(mf424Missing(item)&&(typeof mf425ScopeAllows!=='function'||mf425ScopeAllows(item)))missing.push(String(item.id));
    if(i%10000===0)await mf424Delay(0);
  }
  if(!missing.length){showToast('Every Library title already has a cover URL.');return;}
  if(MF424.job&&!['complete','stopped'].includes(MF424.job.status)&&!await mf427ConfirmJobReplace())return;
  // Recheck after the long Library scan and confirmation, then acquire both
  // locks before touching the shared checkpoint.
  if(typeof mf546PrepareNewQueue==='function'&&!await mf546PrepareNewQueue('cover'))return;
  const previousJob=MF424.job;
  MF424.job={id:'mf424-'+Date.now(),account:mf424Account(),created:Date.now(),updated:Date.now(),ended:0,
    ids:missing,cursor:0,scope:(typeof MF425!=='undefined'&&MF425.active?MF425.active:null),mode:settings.mode,partSize:settings.partSize,continuation:settings.continuation,
    status:'ready',fixed:0,unresolved:0,skipped:0,failed:0,pending:0,processed:0,dirty:0,
    requestCount:0,cooldownEvents:0,rate:{},unresolvedIds:[],results:[],reviews:[],stopRequested:false,pauseRequested:false,stopAfterPart:false};
  S.settings.v424Covers=settings;
  try{await saveState();await mf424SaveJob();}
  catch(e){MF424.job=previousJob;if(typeof mf546AbortPreparedQueue==='function')mf546AbortPreparedQueue('cover');
    showToast('Cover Recovery could not save its initial checkpoint. The previous queue remains available.');return;}
  mf424CloseModal();mf424Run();
}
function mf424ReadForm(){const base=mf424Defaults();const form=document.getElementById('mf424-config');if(!form)return base;
  const val=(n,d)=>form.querySelector('[name="'+n+'"]')?.value||d;
  const size=Math.min(10000,Math.max(1,Number(val('partSize',base.partSize))||100));
  const enabled=[...form.querySelectorAll('[data-mf424-provider]')].filter(x=>x.checked).map(x=>x.value);
  return {...base,priorities:[...form.querySelectorAll('[data-mf424-provider]')].map(x=>x.value),mode:val('mode',base.mode),partSize:size,continuation:val('continuation',base.continuation),
    selection:val('selection',base.selection),protection:val('protection',base.protection),autoResume:form.querySelector('[name="autoResume"]')?.checked!==false,enabled};}
function mf424OpenConfig(){const existing=document.getElementById('mf424-modal');if(existing)existing.remove();const cfg=mf424Defaults();
  const available=MF424_PROVIDER_META.filter(x=>x.limit).sort((a,b)=>(cfg.priorities.indexOf(a.id)<0?999:cfg.priorities.indexOf(a.id))-(cfg.priorities.indexOf(b.id)<0?999:cfg.priorities.indexOf(b.id)));const other=MF424_PROVIDER_META.filter(x=>!x.limit);
  function opts(field,values){return values.map(([v,n])=>'<option value="'+v+'" '+(cfg[field]===v?'selected':'')+'>'+n+'</option>').join('');}
  const el=document.createElement('div');el.id='mf424-modal';el.className='mf424-modal mf425-themed mf430-config-modal';el.innerHTML='<div class="mf424-shade" onclick="App.mf424CloseModal()"></div>'+ 
    '<section class="mf424-dialog" role="dialog" aria-modal="true" aria-label="Advanced missing covers recovery">'+
    '<div class="mf424-heading"><div><small>COVER RECOVERY</small><h2>Cover Recovery</h2><p>Verify IDs first. Protect providers. Keep your library safe.</p></div><button class="btn btn-ghost" onclick="App.mf424CloseModal()">Close</button></div>'+
    '<div id="mf424-config" class="mf424-config"><div class="mf424-options">'+
    '<label>Recovery mode<select name="mode">'+opts('mode',[['parts','Part-by-Part'],['one','One-Go']])+'</select></label>'+
    '<label>Titles per part<input name="partSize" type="number" min="1" max="10000" value="'+cfg.partSize+'"></label>'+
    '<label>Continuation<select name="continuation">'+opts('continuation',[['automatic','Automatic'],['manual','Manual']])+'</select></label>'+
    '<label>Cover selection<select name="selection">'+opts('selection',[['hybrid','Hybrid'],['smart','Smart Automatic'],['priority','Provider Priority'],['manual','Manual Selection']])+'</select></label>'+
    '<label>Rate-limit protection<select name="protection">'+opts('protection',[['safe','Safe'],['balanced','Balanced'],['custom','Custom (provider maximums enforced)']])+'</select></label>'+
    '<label class="mf424-check"><input type="checkbox" name="autoResume" '+(cfg.autoResume?'checked':'')+'> Resume when app reopens</label></div>'+
    '<h3>Enabled cover providers</h3><div class="mf424-provider-grid">'+available.map(x=>'<div class="mf424-provider"><input type="checkbox" aria-label="Enable '+mf424Escape(x.name)+'" data-mf424-provider value="'+x.id+'" '+(cfg.enabled.includes(x.id)?'checked':'')+'><strong>'+x.name+'</strong><span class="mf424-provider-order"><button type="button" onclick="event.preventDefault();event.stopPropagation();App.mf424MoveProvider(\''+x.id+'\',-1)">↑</button><button type="button" onclick="event.preventDefault();event.stopPropagation();App.mf424MoveProvider(\''+x.id+'\',1)">↓</button></span><small>Public API · '+(x.credentials?'setup required':x.level)+'</small></div>').join('')+'</div>'+
    '<details><summary>Other researched providers (not available without credentials / additional verification)</summary><p class="mf424-note">Not presented as working APIs. Their current limitations are documented in the provider report.</p>'+other.map(x=>'<span class="mf424-unavailable">'+x.name+' — '+x.level+'</span>').join('')+'</details>'+
    '<p class="mf424-note">Jobs run while the app is active and resume after reopening. Closing the browser suspends processing. Broken existing URLs are not scanned.</p>'+ 
    '<div class="mf424-actions"><button class="btn btn-ghost" onclick="App.mf424CloseModal()">Cancel</button><button class="btn btn-primary" onclick="App.mf424Start()">Start Recovery</button></div></div></section>';
  document.body.appendChild(el);
}
function mf424MoveProvider(id,dir){const node=document.querySelector('#mf424-config [data-mf424-provider="'+id+'"]')?.closest('.mf424-provider');
  if(!node)return;const sibling=dir<0?node.previousElementSibling:node.nextElementSibling;
  if(sibling&&sibling.classList.contains('mf424-provider')){
    if(dir<0)node.parentElement.insertBefore(node,sibling);else node.parentElement.insertBefore(sibling,node);
  }
}
function mf424CloseModal(){document.getElementById('mf424-modal')?.remove();}
function mf424StatusText(s){return ({running:'Recovering covers',cooldown:'Waiting for provider quota',paused:'Paused',stopped:'Stopped safely',complete:'Recovery complete',
    ready:'Ready',idle:'Ready to recover', 'waiting-review':'Waiting for Review','waiting-part':'Waiting for Next Part','other-tab':'Active in another tab'})[s]||s;}
function mf424Paint(){if(!document.body)return;let root=document.getElementById('mf424-indicator');
  if(!root){root=document.createElement('div');root.id='mf424-indicator';document.body.appendChild(root);}
  const j=MF424.job,c=j?j.cursor:0,total=j?.ids.length||0,percent=total?Math.floor(c/total*100):0;
  root.className='mf424-indicator'+(MF424.expanded?' expanded':'');
  root.innerHTML='<button type="button" class="mf424-pill" onclick="App.mf424Toggle()" aria-expanded="'+MF424.expanded+'">'+
    '<span aria-hidden="true">▣</span><span><b>Cover Recovery</b><small>'+mf424StatusText(j?.status||'idle')+'</small></span>'+
    (j?'<b>'+percent+'%</b>':'')+(j?.pending?'<em>'+j.pending+' review</em>':'')+'</button>'+
    (MF424.expanded?'<section class="mf424-flyout" aria-label="Cover recovery controls">'+
      '<div class="mf424-progress"><span style="width:'+percent+'%"></span></div>'+
      (j?'<p>'+c.toLocaleString()+' / '+total.toLocaleString()+' processed · Part '+mf424Part(j)+' / '+mf424TotalParts(j)+'</p>'+ 
        '<div class="mf424-stats"><span>Recovered <b>'+j.fixed+'</b></span><span>Unresolved <b>'+j.unresolved+'</b></span><span>Reviews <b>'+j.pending+'</b></span><span>Errors <b>'+j.failed+'</b></span></div>':
        '<p>Recover missing artwork without leaving your current workspace.</p>')+
      '<div class="mf424-controls"><button class="btn btn-primary" onclick="App.mf424OpenConfig()">New Recovery</button>'+ 
      (j&&(['running','cooldown'].includes(j.status))?'<button class="btn btn-ghost" onclick="App.mf424Pause()">Pause</button>':'')+
      (j&&(['paused','stopped','waiting-part','other-tab'].includes(j.status))?'<button class="btn btn-ghost" onclick="App.mf424Resume()">Continue</button>':'')+
      (j&&!['complete','stopped'].includes(j.status)?'<button class="btn btn-ghost" onclick="App.mf424StopTitle()">Stop after title</button><button class="btn btn-ghost" onclick="App.mf424StopPart()">Finish part & stop</button>':'')+
      (j?.pending?'<button class="btn btn-primary" onclick="App.mf424Review()">Review ('+j.pending+')</button>':'')+
      (j?'<button class="btn btn-ghost" onclick="App.mf424Export()">JSON report</button><button class="btn btn-ghost" onclick="App.mf424ExportCSV()">CSV report</button>'+(!MF424.running?'<button class="btn btn-ghost" onclick="App.mf424RetryUnresolved()">Retry unresolved</button>':''):'')+'</div>'+ 
      (j?'<details><summary>Provider cooldowns and requests</summary>'+MF424_PROVIDER_META.filter(x=>x.limit).map(x=>{
        const r=MF424.rate[x.id];return '<div>'+x.name+' · '+(r?.count||0)+' requests'+(r?.cooldown>Date.now()?' · cools down until '+new Date(r.cooldown).toLocaleTimeString():'')+'</div>';
      }).join('')+'</details>':'')+'</section>':'');
}
function mf424Toggle(){MF424.expanded=!MF424.expanded;mf424Paint();}
async function mf424Pause(){if(!MF424.job)return;MF424.job.pauseRequested=true;await mf424SaveJob();mf424Paint();}
async function mf424Resume(){if(!MF424.job||MF424.running)return;MF424.job.stopRequested=false;MF424.job.pauseRequested=false;MF424.job.stopAfterPart=false;
  mf424State('ready');await mf424SaveJob();mf424Run();}
async function mf424StopTitle(){if(!MF424.job)return;MF424.job.stopRequested=true;await mf424SaveJob();mf424Paint();}
async function mf424StopPart(){if(!MF424.job)return;MF424.job.stopAfterPart=true;await mf424SaveJob();mf424Paint();}
function mf424ReviewIcon(name){const shapes={
  close:'<path d="M5 5l14 14M19 5L5 19"/>',
  check:'<path d="m5 12 4 4 10-10"/><circle cx="12" cy="12" r="9"/>',
  skip:'<path d="M6 5v14m4-14 9 7-9 7Z"/>',
  alert:'<path d="M12 3 2 20h20L12 3Z"/><path d="M12 9v5m0 3h.01"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m3 17 6-6 4 4 3-3 5 5"/>'
};return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(shapes[name]||shapes.image)+'</svg>';}
function mf424CoverIdControl(item,candidate,index,scope='mf424'){
  if(typeof mf433CoverIdMarkup==='function')
    return mf433CoverIdMarkup(item,candidate,index,scope);
  const link=mf424LinkableCoverId(item,candidate);
  if(!link)return '<small class="mf424-cover-id-note">No usable external record ID supplied by this cover source.</small>';
  const name=mf424Escape(link.key==='mal'?'MAL':link.key.toUpperCase());
  if(link.conflict)return '<small class="mf424-cover-id-conflict">Existing '+name+' ID '+mf424Escape(link.existing)+' is protected. This cover uses '+mf424Escape(link.value)+'; the ID will not be replaced.</small>';
  if(link.existing===link.value)return '<small class="mf424-cover-id-note">'+name+' ID '+mf424Escape(link.value)+' already linked.</small>';
  return '<label class="mf424-cover-id-control"><input type="checkbox" data-'+mf424Escape(scope)+'-cover-link-id="'+Number(index)+'" checked> Save '+name+' external ID <strong>'+mf424Escape(link.value)+'</strong> with this cover</label>';
}
function mf424Review(){if(!MF424.job?.reviews.length)return;const x=MF424.job.reviews[0],item=mf424Lookup(x.id);
  const old=document.getElementById('mf424-review');if(old)old.remove();const root=document.createElement('div');root.id='mf424-review';root.className='mf424-modal mf425-themed mf427-manual-review';
  root.innerHTML='<div class="mf424-shade" onclick="App.mf424CloseReview()"></div><section class="mf424-dialog" role="dialog" aria-modal="true"><div class="mf424-heading"><div><small>MANUAL REVIEW · '+MF424.job.pending+' PENDING</small><h2>'+mf424Escape(x.title)+'</h2><p>'+mf424Escape(item?String(getCategory(item.categoryId)?.name||''):'Title no longer exists')+'</p></div><button class="btn btn-ghost" onclick="App.mf424CloseReview()">'+mf424ReviewIcon('close')+' Close</button></div>'+ 
    '<div class="mf424-review-candidates">'+x.candidates.map((c,i)=>'<article><img loading="lazy" src="'+mf424Escape(c.url)+'" alt="Cover candidate"><div><b>'+mf424Escape(c.title||c.provider)+'</b><small>'+mf424Escape(c.provider)+' · '+Math.round(c.confidence*100)+'% match</small><p>'+mf424Escape(c.reason)+'</p>'+(c.recordUrl?'<a href="'+mf424Escape(c.recordUrl)+'" target="_blank" rel="noopener noreferrer">Source record</a>':'')+mf424CoverIdControl(item,c,i,'mf424')+'<button class="btn btn-primary" onclick="App.mf424Confirm('+i+')">'+mf424ReviewIcon('check')+' Use cover</button></div></article>').join('')+'</div><div class="mf424-actions"><button class="btn btn-ghost" onclick="App.mf424DiscardReview()">'+mf424ReviewIcon('alert')+' Mark unresolved</button><button class="btn btn-ghost" onclick="App.mf424CloseReview()">'+mf424ReviewIcon('skip')+' Later</button></div></section>';
  document.body.appendChild(root);
}
function mf424CloseReview(){document.getElementById('mf424-review')?.remove();}
async function mf424DiscardReview(){if(!MF424.job?.reviews.length)return;const x=MF424.job.reviews.shift();MF424.job.pending--;
  MF424.job.unresolved++;mf424Note('unresolved','Rejected or unresolved by user',x.id);await mf424ReviewSave();}
async function mf424Confirm(i){if(!MF424.job?.reviews.length)return;const x=MF424.job.reviews[0],item=mf424Lookup(x.id),candidate=x.candidates[i];
  if(!candidate||!item||!mf424Missing(item)||Number(item.modifiedAt||0)!==x.expectedModified){
    showToast('This title changed after review was queued. Its cover was not overwritten.');return;
  }
  const linkId=document.querySelector('#mf424-review [data-mf424-cover-link-id="'+Number(i)+'"]')?.checked===true;
  if(await mf424Apply(item,candidate,x.expectedModified,{manual:true,linkId})){await mf424Flush();MF424.job.fixed++;mf424Note('recovered','Manual selection: '+candidate.provider,x.id);
    MF424.job.reviews.shift();MF424.job.pending--;await mf424ReviewSave();}else showToast('Unable to validate this cover safely.');
}
async function mf424ReviewSave(){if(MF424.job.cursor>=MF424.job.ids.length&&!MF424.job.pending)mf424State('complete');
  await mf424SaveJob();mf424CloseReview();mf424Paint();if(MF424.job.pending)mf424Review();}
async function mf424RetryUnresolved(){if(!MF424.job||MF424.running)return;
  const old=MF424.job;const ids=[...new Set([...(old.unresolvedIds||[]),...old.results.filter(x=>x.type==='unresolved'||x.type==='provider-error'||x.type==='error').map(x=>x.id).filter(Boolean)])]
    .filter(id=>mf424Missing(mf424Item(id)));
  if(!ids.length){showToast('No unresolved missing-cover titles to retry.');return;}
  if(old.pending&&!await mf427ConfirmRetryPending())return;
  if(!await mf427ConfirmRetry(ids.length))return;
  await mf424Storage('put','history:'+mf424Account()+':'+old.id,{...old,ids:undefined});
  MF424.job={...old,id:'mf424-'+Date.now(),ids,cursor:0,created:Date.now(),ended:0,status:'ready',fixed:0,unresolved:0,skipped:0,failed:0,pending:0,processed:0,dirty:0,
    requestCount:0,cooldownEvents:0,rate:{},unresolvedIds:[],results:[],reviews:[],stopRequested:false,pauseRequested:false,stopAfterPart:false};
  await mf424SaveJob();mf424Run();
}
function mf424Export(){if(!MF424.job)return;const j=MF424.job;
  const safe={...j,ids:undefined,dirty:undefined,results:j.results.slice(),reviews:j.reviews.map(({id,title,added,candidates})=>({id,title,added,candidates}))};
  const blob=new Blob([JSON.stringify({format:'MediaFlowCoverRecovery',version:424,report:safe},null,2)],{type:'application/json'});
  const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='MediaFlow_Cover_Recovery_'+j.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);
}
function mf424ExportCSV(){if(!MF424.job)return;
  const fields=['time','type','id','message'];const csv=[fields.join(','),...MF424.job.results.map(x=>fields.map(k=>'"'+String(x[k]??'').replace(/"/g,'""')+'"').join(','))].join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download='MediaFlow_Cover_Recovery_'+MF424.job.id+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);
}
async function mf424Init(){try{await mf424DB();MF424.account=mf424Account();MF424.job=await mf424Storage('get',mf424Key())||null;
  if(MF424.job?.account!==MF424.account)MF424.job=null;
  const interrupted=MF424.job&&['running','cooldown','ready'].includes(MF424.job.status);
  if(interrupted){MF424.job.status='paused';MF424.job.pauseRequested=false;}
  MF424.ready=true;mf424Paint();if(MF424.job&&mf424Defaults().autoResume&&!MF424.job.pauseRequested&&!['stopped','complete','waiting-review','waiting-part'].includes(MF424.job.status))mf424Resume();
}catch(e){console.warn('MediaFlow v424 persistence unavailable:',e);mf424Paint();}}
// Public extension point: registering a future provider with a real adapter
// adds it automatically to Cover Recovery and Find Cover source options.
window.MediaFlowCoverProviders=Object.freeze({
 register:mf424RegisterCoverProvider,
 list:()=>mf424CoverProviderChoices({categoryId:''}).map(({id,name,types,limit,credentials,level})=>({id,name,types,limit,credentials,level}))
});
Object.assign(App,{mf424Start,mf424OpenConfig,mf424MoveProvider,mf424CloseModal,mf424Toggle,mf424Pause,mf424Resume,mf424StopTitle,mf424StopPart,
  mf424Review,mf424CloseReview,mf424DiscardReview,mf424Confirm,mf424Export,mf424ExportCSV,mf424RetryUnresolved});
// Preserve the existing Settings button and Dashboard manual-cover behavior.
App.v158FixMissingCovers=mf424OpenConfig;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mf424Init,{once:true});else mf424Init();
// Security: do not process an old account after signing into another account.
window.addEventListener('storage',event=>{if(event.key===mf424LeaseKey()&&!mf424OwnLease()&&MF424.running&&MF424.job)MF424.job.pauseRequested=true;});
window.addEventListener('pagehide',()=>{if(MF424.running&&MF424.job){MF424.job.pauseRequested=true;mf424SaveJob().catch(()=>{});}mf424Release();});
MediaFlowRuntime.version=MF424_VERSION;

// Detect sign-in/account switches even if MediaFlow does not reload the page.
setInterval(()=>{if(!MF424.ready||mf424Account()===MF424.account)return;
  if(MF424.running){if(MF424.job)MF424.job.pauseRequested=true;return;}
  MF424.job=null;MF424.rate={};MF424.cache.clear();mf424Init();
},4000);
