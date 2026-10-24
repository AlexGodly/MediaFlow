/* MediaFlow v547 — ID-first automatic external rating refresh.
 * Reuses the deployed verified metadata adapters and rating-only merge path.
 * ID changes are refreshed immediately; missing scores are backfilled gradually.
 * Runs only while the app is open, online, signed in, and no recovery owns the
 * metadata lock. Failed lookups never clear existing ratings.
 */
const MF547_VERSION=547;
const MF547_INTERVALS=[24,72,168,720];
const MF547_DEFAULT={enabled:true,intervalHours:168,refreshExisting:false};
const MF547_ID_RATING_MAP=Object.freeze({
 imdb:{ratings:['imdb'],providers:['omdb']},
 mal:{ratings:['mal'],providers:['jikan','malofficial']},
 anilist:{ratings:['anilist'],providers:['anilist']},
 kitsu:{ratings:['kitsu'],providers:['kitsu']},
 tmdb:{ratings:['tmdb'],providers:['tmdb']},
 tmdb_tv:{ratings:['tmdb'],providers:['tmdb']},
 trakt:{ratings:['trakt'],providers:['trakt']},
 simkl:{ratings:['simkl'],providers:['simkl']},
 tvmaze:{ratings:['tvmaze'],providers:['tvmaze']},
 vndb:{ratings:['vndb'],providers:['vndb']},
 watchmode:{ratings:['watchmode'],providers:['watchmode']},
 animeschedule:{ratings:['anilist','mal'],providers:['anilist','jikan','malofficial']},
 metron_series:{ratings:['metacritic'],providers:['metron']},
 episodate:{ratings:['tvmaze'],providers:['episodate','tvmaze']}
});
const MF547={
 working:false,lastRunAt:0,timer:null,runTimer:null,forced:new Map(),
 seen:new Map(),lastNote:'Waiting for eligible titles',processed:0,updated:0,
 currentId:'',sweepRequested:false
};
function mf547Prefs(){
 const raw=S.settings?.v547ExternalRatingRefresh||{};
 return {
  enabled:raw.enabled!==false,
  intervalHours:MF547_INTERVALS.includes(Number(raw.intervalHours))?Number(raw.intervalHours):MF547_DEFAULT.intervalHours,
  refreshExisting:raw.refreshExisting===true
 };
}
function mf547State(){
 const raw=S.settings?.v547ExternalRatingRefreshState;
 return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
}
function mf547SupportedIds(item){
 const ids=item?.externalIds&&typeof item.externalIds==='object'?item.externalIds:{};
 const out={};
 for(const key of Object.keys(MF547_ID_RATING_MAP)){
  const value=String(ids[key]??'').trim();
  if(value)out[key]=value;
 }
 return out;
}
function mf547Signature(item){return JSON.stringify(Object.entries(mf547SupportedIds(item)).sort(([a],[b])=>a.localeCompare(b)));}
function mf547ScoreExists(item,key){
 const r=item?.universalMetadata?.externalRatings?.[key];
 return r&&r.score!==null&&r.score!==undefined&&String(r.score).trim()!==''&&Number.isFinite(Number(r.score));
}
function mf547MissingRating(item){
 const ids=mf547SupportedIds(item),providers=typeof mf467RatingProviders==='function'?mf467RatingProviders(item):[];
 for(const [id] of Object.entries(ids)){
  const map=MF547_ID_RATING_MAP[id];
  if(!map||!map.providers.some(p=>providers.includes(p)))continue;
  if(map.ratings.some(r=>!mf547ScoreExists(item,r)))return true;
 }
 return false;
}
function mf547CanRefresh(item){
 return Boolean(item?.id!=null&&Object.keys(mf547SupportedIds(item)).length&&
  typeof App?.mf467RefreshRatings==='function'&&typeof mf467RatingProviders==='function'&&
  mf467RatingProviders(item).length);
}
function mf547Store(id,patch){
 const key=String(id),next={...mf547State()},old=next[key]&&typeof next[key]==='object'?next[key]:{};
 next[key]={...old,...patch};
 const entries=Object.entries(next).sort((a,b)=>
  Math.max(Number(b[1]?.lastAttemptAt)||0,Number(b[1]?.lastSuccessAt)||0)-
  Math.max(Number(a[1]?.lastAttemptAt)||0,Number(a[1]?.lastSuccessAt)||0)).slice(0,1200);
 S.settings=S.settings||{};
 S.settings.v547ExternalRatingRefreshState=Object.fromEntries(entries);
 Promise.resolve(persistSettings()).catch(e=>console.warn('v547 rating refresh state sync failed',e));
}
function mf547SetStatus(note){
 MF547.lastNote=String(note||'').slice(0,220);
 const node=document.querySelector('[data-mf547-status]');
 if(node)node.textContent=MF547.lastNote;
}
function mf547Enqueue(id,force=false){
 id=String(id??'');
 if(!id||!mf547Prefs().enabled)return;
 const item=mf439Item(id);
 if(!mf547CanRefresh(item))return;
 const signature=mf547Signature(item);
 MF547.forced.set(id,{signature,queuedAt:Date.now(),force:!!force});
 mf547SetStatus(force?'External IDs changed. Rating refresh queued.':'Rating refresh queued.');
 if(MF547.runTimer)clearTimeout(MF547.runTimer);
 MF547.runTimer=setTimeout(()=>{MF547.runTimer=null;void mf547RunNext();},900);
}
function mf547Eligible(item,now=Date.now()){
 if(!mf547CanRefresh(item))return false;
 const prefs=mf547Prefs(),id=String(item.id),signature=mf547Signature(item);
 const state=mf547State()[id]||{},oldSig=String(state.signature||'');
 const changed=Boolean(oldSig&&oldSig!==signature);
 if(changed)return true;
 if(mf547MissingRating(item)){
  const last=Number(state.lastAttemptAt)||0;
  return !last||now-last>=6*60*60*1000;
 }
 if(!prefs.refreshExisting)return false;
 const last=Number(state.lastSuccessAt)||Number(state.lastAttemptAt)||0;
 if(!last)return false;
 return now-last>=prefs.intervalHours*60*60*1000;
}
function mf547ChooseNext(){
 const now=Date.now();
 for(const [id,entry] of MF547.forced){
  const item=mf439Item(id);
  if(!item||mf547Signature(item)!==entry.signature){MF547.forced.delete(id);continue;}
  if(mf547CanRefresh(item))return {item,force:true};
  MF547.forced.delete(id);
 }
 if(!Array.isArray(S.library))return null;
 for(const item of S.library){
  if(!mf547Eligible(item,now))continue;
  const id=String(item.id);
  const seen=MF547.seen.get(id);
  const signature=mf547Signature(item);
  if(!seen){
   MF547.seen.set(id,{signature,at:now});
   const saved=mf547State()[id];
   // Existing populated ratings are not mass-refreshed on first launch unless
   // the user opted in. Missing scores still get a bounded first attempt.
   if(!mf547MissingRating(item)&&!saved)continue;
  }
  return {item,force:false};
 }
 return null;
}
async function mf547RunNext(){
 if(MF547.working||!mf547Prefs().enabled||!AUTH_USER||!AUTH_READY||S.loading||!navigator.onLine)return;
 if(Date.now()-MF547.lastRunAt<30000)return;
 if(MF467?.working||MF466?.working||MF439?.working||MF424?.running||MF442?.process||
   (typeof mf442CoverLockIsActive==='function'&&mf442CoverLockIsActive())||
   (typeof mf442MetadataLockIsActive==='function'&&mf442MetadataLockIsActive()))return;
 const picked=mf547ChooseNext();
 if(!picked){mf547SetStatus(MF547.forced.size?'Waiting for another metadata task to finish.':'No missing or outdated ID-based ratings due.');return;}
 const item=picked.item,id=String(item.id),signature=mf547Signature(item),now=Date.now();
 MF547.working=true;MF547.currentId=id;MF547.lastRunAt=now;MF547.processed++;
 if(picked.force)MF547.forced.delete(id);
 mf547Store(id,{signature,lastAttemptAt:now});
 mf547SetStatus('Refreshing ratings for '+String(item.title||'selected title').slice(0,90)+'…');
 try{
  const result=await App.mf467RefreshRatings(id,{quiet:true});
  const current=mf439Item(id);
  const state=mf547State()[id]||{};
  if(current===item&&mf547Signature(current)===signature){
   const ok=Boolean(result?.ok&&MF467?.success===true);
   mf547Store(id,{signature,lastAttemptAt:Date.now(),...(ok?{lastSuccessAt:Date.now()}:{})});
   if(ok){
    MF547.updated+=Number(result.changed)||0;
    mf547SetStatus(result.changed?String(result.changed)+' external rating(s) updated for '+String(item.title||'title')+'.':'Ratings checked; no changes needed.');
   }else{
    mf547SetStatus(result?.reason||MF467?.note||'No verified rating returned. Will retry later.');
   }
  }else mf547SetStatus('Title or external IDs changed during refresh. The result was not applied to a different title.');
 }catch(e){
  mf547Store(id,{signature,lastAttemptAt:Date.now()});
  mf547SetStatus(String(e?.message||e||'Rating refresh failed'));
  console.warn('v547 automatic external-rating refresh failed',e);
 }finally{
  MF547.working=false;MF547.currentId='';
  if(MF547.forced.size&&mf547Prefs().enabled){
   if(MF547.runTimer)clearTimeout(MF547.runTimer);
   MF547.runTimer=setTimeout(()=>{MF547.runTimer=null;void mf547RunNext();},30000);
  }
 }
}
function mf547Check(){
 if(!mf547Prefs().enabled||MF547.working||!AUTH_USER||!AUTH_READY||S.loading||!navigator.onLine)return;
 if(MF547.forced.size){void mf547RunNext();return;}
 const picked=mf547ChooseNext();
 if(picked){void mf547RunNext();return;}
}
function mf547SettingsHtml(){
 const p=mf547Prefs();
 return '<section class="mf547-settings" data-mf-setting-id="v547ExternalRatingRefresh">'+
  '<div class="mf547-settings-head">'+mf425Icon('refresh',20)+
  '<div><strong>Automatic external-rating intelligence</strong>'+
  '<small>Use saved external IDs to retrieve verified ratings across your Library.</small></div></div>'+
  '<label class="mf547-option"><input type="checkbox" '+(p.enabled?'checked ':'')+
  'onchange="App.mf547Set(\\'enabled\\',this.checked)"><span>Automatically retrieve ratings when IDs change and backfill missing ratings</span></label>'+
  '<label class="mf547-interval"><span>Refresh interval for previously retrieved ratings</span><select onchange="App.mf547Set(\\'intervalHours\\',Number(this.value))">'+
  MF547_INTERVALS.map(h=>'<option value="'+h+'" '+(p.intervalHours===h?'selected':'')+'>'+
   (h===24?'Every 24 hours':h===72?'Every 3 days':h===168?'Every 7 days':'Every 30 days')+'</option>').join('')+
  '</select></label>'+
  '<label class="mf547-option"><input type="checkbox" '+(p.refreshExisting?'checked ':'')+
  'onchange="App.mf547Set(\\'refreshExisting\\',this.checked)"><span>Periodically refresh existing ratings too</span></label>'+
  '<div class="mf547-status" data-mf547-status role="status" aria-live="polite">'+escapeHtml(MF547.lastNote)+'</div>'+
  '<button type="button" class="btn btn-sm btn-ghost" onclick="App.mf547ScanNow()">'+mf425Icon('refresh',15)+' Scan Library for missing ratings</button>'+
  '<p class="mf547-note">Runs gradually while MediaFlow is open and online. A saved IMDb ID can use a configured IMDb-compatible source; MAL IDs can use Jikan or the official MAL gateway. Provider access, credentials, and rate limits still apply. Existing personal ratings and manually locked external ratings are never overwritten.</p>'+
  '</section>';
}
const mf547SettingsBase=V219_PAGE_RENDERERS.get('settings');
if(typeof mf547SettingsBase==='function')MediaFlowRuntime.registerPageRenderer('settings',function(ctx){
 const html=String(mf547SettingsBase.call(this,ctx)||'');
 if(!html.includes('mf404-recommendations-card')||html.includes('data-mf-setting-id="v547ExternalRatingRefresh"'))return html;
 try{
  const root=document.createElement('div');root.innerHTML=html;
  const card=root.querySelector('.mf404-recommendations-card');
  if(!card)return html;
  card.insertAdjacentHTML('beforeend',mf547SettingsHtml());
  return root.innerHTML;
 }catch(e){console.warn('v547 settings renderer:',e);return html;}
});
if(typeof registerSettingSearch==='function')registerSettingSearch({
 id:'v547ExternalRatingRefresh',section:'title-recommendations',
 selector:'[data-mf-setting-id="v547ExternalRatingRefresh"]',
 label:'Automatic external rating intelligence',subgroup:'Title Recommendations',
 keywords:['external ratings','IMDb','MAL','AniList','external IDs','automatic','refresh','missing ratings','schedule']
});
App.mf547Set=function(key,value){
 if(!Object.hasOwn(MF547_DEFAULT,key))return;
 const p=mf547Prefs();
 if(key==='enabled')p.enabled=value===true;
 else if(key==='refreshExisting')p.refreshExisting=value===true;
 else if(key==='intervalHours')p.intervalHours=MF547_INTERVALS.includes(Number(value))?Number(value):168;
 S.settings=S.settings||{};S.settings.v547ExternalRatingRefresh=p;
 Promise.resolve(persistSettings()).catch(e=>console.warn('v547 rating settings sync failed',e));
 mf547SetStatus(p.enabled?'Automatic rating refresh enabled.':'Automatic rating refresh paused.');
 if(p.enabled){setTimeout(mf547Check,1000);}
};
App.mf547ScanNow=function(){
 if(!mf547Prefs().enabled){showToast('Enable automatic external-rating intelligence first.');return;}
 MF547.sweepRequested=true;
 const first=(S.library||[]).find(item=>mf547CanRefresh(item)&&mf547MissingRating(item));
 if(!first){showToast('No eligible titles with missing ratings were found.');return;}
 mf547Enqueue(first.id,true);
 mf547SetStatus('Library scan requested. Titles will be processed gradually.');
};
const mf547SaveModalBase=App.saveLibraryModal;
App.saveLibraryModal=function(id){
 const before=id!=null?mf439Item(id):null;
 const beforeSignature=before?mf547Signature(before):'';
 const beforeIds=before?JSON.stringify(before.externalIds||{}):'';
 const result=mf547SaveModalBase.apply(this,arguments);
 setTimeout(()=>{
  let item=id!=null?mf439Item(id):null;
  if(!item)item=(S.library||[])[(S.library||[]).length-1]||null;
  if(!item)return;
  const nextSignature=mf547Signature(item),nextIds=JSON.stringify(item.externalIds||{});
  if(nextSignature&&nextIds!==beforeIds&&(beforeSignature!==nextSignature||!before)){
   mf547Enqueue(item.id,true);
  }
 },350);
 return result;
};
MF547.timer=setInterval(mf547Check,15000);
window.addEventListener('online',()=>setTimeout(mf547Check,1200));
setTimeout(mf547Check,4500);
window.MediaFlowV547=Object.freeze({
 version:MF547_VERSION,prefs:mf547Prefs,signature:mf547Signature,
 supportedIds:mf547SupportedIds,missingRating:mf547MissingRating,
 enqueue:mf547Enqueue,scan:mf547Check,
 status:()=>({working:MF547.working,currentId:MF547.currentId,processed:MF547.processed,
  updated:MF547.updated,lastNote:MF547.lastNote,queued:MF547.forced.size})
});
MediaFlowRuntime.version=MF547_VERSION;
