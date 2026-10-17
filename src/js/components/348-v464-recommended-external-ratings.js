/* MediaFlow v464 — external ratings on MediaFlow Recommends.
 * Provider scores are presented in their original scales and distinct brands,
 * separate from the user's own rating. The existing v437/v450 metadata envelope
 * is authoritative for SAVED values. Missing scores may be looked up lazily
 * through enabled v439 providers with strict v439 identity matching; fetched
 * results are private, session-scoped read-only previews, not Library writes.
 */
const MF464_VERSION=464;
const MF464_RATING_PROVIDERS=[
 'jikan','anilist','kitsu','tvmaze','vndb',
 'omdb','tmdb','trakt','simkl','malofficial'
];
const MF464={memory:new Map(),pending:new Set(),timers:new Map(),refreshing:new Set()};
const mf464Obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
function mf464Account(){return String(AUTH_USER?.id||'');}
function mf464Key(item){
 const enabled=mf439Preferences().enabled.filter(x=>MF464_RATING_PROVIDERS.includes(x));
 return JSON.stringify([mf464Account(),String(item?.id||''),String(item?.title||''),
  String(item?.originalTitle||''),String(item?.year||item?.releaseDate||''),
  item?.externalIds||{},enabled]);
}
function mf464StorageKey(item){return 'mf464-recommend-ratings:'+mf464Account()+':'+String(item?.id||'');}
function mf464Valid(key,raw){
 const x=mf464Obj(raw),score=x.score,scale=x.scale;
 if(score===undefined||score===null||String(score).trim()==='')return null;
 const n=Number(score),max=Number(scale??MF437_RATING_MAP.get(key)?.[2]);
 if(!Number.isFinite(n)||!Number.isFinite(max)||max<=0||max>100000||n<0||n>max)return null;
 const votes=x.votes==null||String(x.votes).trim()===''?null:Number(x.votes);
 if(votes!==null&&(!Number.isSafeInteger(votes)||votes<0))return null;
 return {score:n,scale:max,votes};
}
function mf464Stored(item){
 const env=mf437Normalized(item?.universalMetadata),out={};
 for(const [key,label] of MF437_RATING_SOURCES){
  const raw=mf464Obj(env.externalRatings[key]),rating=mf464Valid(key,raw);
  if(!rating)continue;
  const prov=mf464Obj(env.provenance['rating.'+key]);
  const source=String(prov.source||raw.source||'');
  const verified=prov.verified===true;
  out[key]={...rating,key,label,source,
   attribution:source==='manual'?'Entered manually':
    verified?'Verified provider rating':'Saved rating · source not verified',
   stored:true,verified,recordId:String(prov.recordId||raw.sourceRecordId||'').slice(0,90)};
 }
 return out;
}
function mf464Memo(item){
 const key=mf464Key(item);
 const existing=MF464.memory.get(key);
 if(existing&&existing.until>Date.now())return existing;
 try{
  const data=JSON.parse(sessionStorage.getItem(mf464StorageKey(item))||'null');
  if(data?.key===key&&Number(data.until)>Date.now()&&data.ratings&&typeof data.ratings==='object'){
   const row={key,until:Number(data.until),ratings:mf464Obj(data.ratings)};
   MF464.memory.set(key,row);return row;
  }
 }catch(_){}
 return null;
}
function mf464SaveCache(item,key,ratings){
 const entry={key,ratings,until:Date.now()+(Object.keys(ratings).length?30:8)*60000};
 MF464.memory.set(key,entry);
 // Only ephemeral UI metadata, scoped to the signed-in account. No cloud
 // changes, no new schema, and never a personal-rating mutation.
 try{sessionStorage.setItem(mf464StorageKey(item),JSON.stringify(entry));}catch(_){}
 return entry;
}
function mf464ProviderScores(item,rows){
 // One result from one verified, identity-matched record only. Conflicting
 // top-scoring matches are deliberately omitted rather than arbitrarily picked.
 const candidates=new Map();
 for(const row of rows||[]){
  if(!row?.provider||!row?.recordId||!row?.title)continue;
  const match=mf439Evidence(item,row);
  if(match.confidence<0.97)continue; // exact title+year or exact title+ID
  const mapped=mf450NormalizeRatingMap(row.ratings);
  for(const [key,input] of Object.entries(mapped)){
   if(!MF437_RATING_MAP.has(key))continue;
   const v=mf464Valid(key,input);if(!v)continue;
   const bucket=candidates.get(key)||[];
   bucket.push({...v,confidence:match.confidence,source:String(row.provider),
    recordId:String(row.recordId).slice(0,90)});
   candidates.set(key,bucket);
  }
 }
 const out={};
 for(const [key,bucket] of candidates){
  bucket.sort((a,b)=>b.confidence-a.confidence);
  const highest=bucket[0];
  const tied=bucket.filter(x=>x.confidence===highest.confidence);
  if(tied.some(x=>x.score!==highest.score||x.scale!==highest.scale))continue;
  const name=MF437_RATING_MAP.get(key)?.[1]||key;
  out[key]={score:highest.score,scale:highest.scale,votes:highest.votes,
   source:highest.source,recordId:highest.recordId,verified:true,stored:false,
   attribution:'Verified match · '+highest.source,key,label:name};
 }
 return out;
}
function mf464Current(item){
 const stored=mf464Stored(item),memo=mf464Memo(item);
 return {...(memo?.ratings||{}),...stored};
}
function mf464Icon(key){return mf450ProviderMark(key);}
function mf464DisplayNumber(n){
 return Number.isInteger(n)?String(n):String(Number(n.toFixed(3)));
}
function mf464ScoreHtml(data){
 const key=String(data?.key||'');
 if(!MF437_RATING_MAP.has(key))return '';
 const rating=mf464Valid(key,data);
 if(!rating)return '';
 const label=MF437_RATING_MAP.get(key)[1];
 const votes=rating.votes===null?'':'<small>'+rating.votes.toLocaleString()+' votes</small>';
 const provider=String(data.source||'');
 const origin=String(data.attribution||'Saved external rating');
 return '<article class="mf464-rating" data-mf464-source="'+escapeHtml(key)+'" aria-label="'+escapeHtml(label+' '+mf464DisplayNumber(rating.score)+' out of '+mf464DisplayNumber(rating.scale))+'">'+
  '<div class="mf464-rating-source">'+mf464Icon(key)+'<strong>'+escapeHtml(label)+'</strong></div>'+
  '<div class="mf464-rating-value">'+escapeHtml(mf464DisplayNumber(rating.score))+
  '<small>/ '+escapeHtml(mf464DisplayNumber(rating.scale))+'</small></div>'+
  (votes?'<div class="mf464-rating-votes">'+votes+'</div>':'')+
  '<small class="mf464-rating-evidence" title="'+escapeHtml(origin+(data.recordId?' · Record '+data.recordId:''))+'">'+
  escapeHtml(origin)+'</small></article>';
}
function mf464Panel(item){
 if(!item?.id)return '';
 const key=mf464Key(item);
 const ratings=mf464Current(item);
 const rows=MF437_RATING_SOURCES.filter(([key])=>ratings[key]).map(([key])=>mf464ScoreHtml(ratings[key])).filter(Boolean);
 const busy=MF464.pending.has(key),message=busy?
  'Checking your enabled metadata providers for verified title matches…':
  !rows.length?'No matching external ratings available from saved data or enabled providers.':'';
 const more='<button type="button" class="btn btn-sm btn-ghost mf464-refresh" onclick="App.mf464RefreshRatings()"'+
  (busy?' disabled':'')+' aria-label="Refresh recommended title external ratings">'+mf419Icon('progress',14)+' Refresh ratings</button>';
 return '<section class="mf419-insight-group mf464-recommended-ratings" data-mf464-ratings="'+
  escapeHtml(String(item.id))+'" aria-label="External ratings for recommended title">'+
  '<div class="mf464-ratings-head"><span>'+mf419Icon('star',18)+
  '<strong>External ratings</strong><small>Original provider scales · separate from your rating</small></span>'+
  '<span class="mf464-ratings-actions"><small>'+rows.length+' source'+(rows.length===1?'':'s')+'</small>'+more+'</span></div>'+
  (rows.length?'<div class="mf464-rating-grid">'+rows.join('')+'</div>':'')+
  (message?'<p class="mf464-ratings-status" role="status">'+escapeHtml(message)+'</p>':'')+
  '</section>';
}
function mf464CanFetch(){
 return Boolean(AUTH_USER&&AUTH_READY&&!S.loading&&!V115_STARTUP_GUARD&&
  S.view==='dashboard'&&S.settings?.exactTitleRecommendations);
}
function mf464StillSame(item,key){
 if(!mf464CanFetch())return false;
 if(key!==mf464Key(item))return false;
 const selected=mf395DashboardRecommendedItem(S.currentTask);
 return String(selected?.id||'')===String(item.id);
}
function mf464UpdatePanel(item){
 const old=document.querySelector('.mf464-recommended-ratings');
 if(!old||String(old.dataset.mf464Ratings||'')!==String(item.id))return;
 if(!mf464StillSame(item,mf464Key(item)))return;
 old.outerHTML=mf464Panel(item);
}
function mf464ProvidersReady(){
 const chosen=new Set(mf439Preferences().enabled);
 return MF464_RATING_PROVIDERS.filter(id=>chosen.has(id)&&
  (MF439_PUBLIC[id]||MF439_GATEWAY.includes(id)&&
   mf434ProviderStatus(id)?.configured===true&&mf434ProviderStatus(id)?.testable===true));
}
async function mf464Run(item,key){
 const account=mf464Account(),rows=[];
 try{
  if(!mf464StillSame(item,key))return;
  // Gateway discovery is the same bounded, account-checked method used by
  // Metadata Recovery; unconfigured/restricted gateways are never queried.
  if(mf439Preferences().enabled.some(p=>MF439_GATEWAY.includes(p))&&
     typeof mf443EnsureGateway==='function')
   await mf443EnsureGateway();
  const providers=mf464ProvidersReady();
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),27000);
  try{
   for(let i=0;i<providers.length;i+=2){
    if(!mf464StillSame(item,key)||controller.signal.aborted)break;
    const pair=await Promise.all(providers.slice(i,i+2).map(async p=>{
     try{return p&&MF439_GATEWAY.includes(p)?
      await mf439LookupGateway(p,item):await mf439LookupPublic(p,item,controller.signal);}
     catch(e){return [];} // a provider error never blocks recommendations
    }));
    for(const data of pair)for(const row of data||[])rows.push(row);
   }
  }finally{clearTimeout(timeout);}
  if(account!==mf464Account()||key!==mf464Key(item))return;
  mf464SaveCache(item,key,mf464ProviderScores(item,rows));
 }catch(e){if(account===mf464Account()&&key===mf464Key(item))mf464SaveCache(item,key,{});}
 finally{MF464.pending.delete(key);MF464.timers.delete(key);mf464UpdatePanel(item);}
}
function mf464Schedule(item){
 if(!item?.id||!mf464CanFetch())return;
 const key=mf464Key(item);
 if(mf464Memo(item)||MF464.pending.has(key))return;
 MF464.pending.add(key);
 const timer=setTimeout(()=>{MF464.timers.delete(key);void mf464Run(item,key);},160);
 MF464.timers.set(key,timer);
}
function mf464RefreshRatings(){
 const item=mf395DashboardRecommendedItem(S.currentTask);
 if(!item?.id||!mf464CanFetch())return;
 const key=mf464Key(item);
 if(MF464.pending.has(key))return;
 MF464.memory.delete(key);
 try{sessionStorage.removeItem(mf464StorageKey(item));}catch(_){}
 mf464Schedule(item);mf464UpdatePanel(item);
}
App.mf464RefreshRatings=mf464RefreshRatings;
const mf464PreviousRecommendation=mf395DashboardRecommendationHtml;
mf395DashboardRecommendationHtml=function(task,cat){
 const html=String(mf464PreviousRecommendation.apply(this,arguments)||'');
 if(!html.includes('<div class="mf419-category-stats">')||
    !S.settings?.exactTitleRecommendations||!task?.title)return html;
 const item=mf395DashboardRecommendedItem(task);
 if(!item)return html;
 mf464Schedule(item);
 return html.replace('<div class="mf419-category-stats">',
  mf464Panel(item)+'<div class="mf419-category-stats">');
};
window.MediaFlowV464=Object.freeze({
 version:MF464_VERSION,stored:mf464Stored,verified:mf464ProviderScores,
 current:mf464Current,score:mf464ScoreHtml,panel:mf464Panel,
 readyProviders:mf464ProvidersReady,refresh:mf464RefreshRatings
});
MediaFlowRuntime.version=MF464_VERSION;
