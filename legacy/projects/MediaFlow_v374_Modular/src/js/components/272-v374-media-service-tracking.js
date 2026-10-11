/* MediaFlow v374 — MAL and SIMKL opt-in tracking.
 * External associations never modify Library/History on their own.
 * All tokens and writes go through the authenticated Edge Function.
 */
const V374_FUNCTION='mediaflow-tracking-v374';
const V374_META={mal:{name:'MyAnimeList',types:['anime','manga']},simkl:{name:'SIMKL',types:['anime','tv','movie']}};
const V374_SESSION={accounts:[],links:[],loaded:false,busy:false,stamp:0};
let V374_ADD_CHOICES={};
function v374Esc(s){return escapeHtml(String(s==null?'':s));}
function v374Js(s){return v374Esc(JSON.stringify(String(s==null?'':s)));}
function v374Connected(provider){return V374_SESSION.accounts.some(x=>x.provider===provider);}
function v374GetLinks(libraryId){return V374_SESSION.links.filter(x=>String(x.library_id)===String(libraryId));}
async function v374Invoke(action,values={}){
  if(!supabase||!AUTH_USER)throw Error('Sign in to your MediaFlow account to use tracking');
  const {data,error}=await supabase.functions.invoke(V374_FUNCTION,{body:{action,...values}});
  if(error){let message=error.message||'Tracking backend unavailable';try{const info=await error.context?.json?.();message=info?.error||message;}catch(_){}throw Error(message);}
  if(data?.error)throw Error(String(data.error));
  return data||{};
}
async function v374Refresh(force=false){
  if(!AUTH_USER)return;
  if(V374_SESSION.busy)return;
  if(!force&&V374_SESSION.loaded&&Date.now()-V374_SESSION.stamp<45000)return;
  V374_SESSION.busy=true;
  try{
    const result=await v374Invoke('accounts');
    V374_SESSION.accounts=result.accounts||[];V374_SESSION.links=result.links||[];
    V374_SESSION.loaded=true;V374_SESSION.stamp=Date.now();
    v374UpdatePanels();
  }catch(err){V374_SESSION.loaded=false;v374Notice('Tracking setup unavailable: '+String(err.message||err),false);v374UpdatePanels();}
  finally{V374_SESSION.busy=false;}
}
function v374Notice(message,toast=true){if(toast&&typeof showToast==='function')showToast(message);const notice=document.querySelector('[data-v374-notice]');if(notice)notice.textContent=message;}
function v374ServiceLabel(p){return V374_META[p]?.name||p;}
function v374CardRows(item,adding){
  if(!V374_SESSION.loaded)return '<p class="mf374-subtle">Connect MAL or SIMKL in Settings → Media Services. Tracking is optional and only assigned titles synchronize.</p>';
  const accounts=V374_SESSION.accounts;
  if(!accounts.length)return '<p class="mf374-subtle">No tracking accounts connected. Open Settings → Media Services to connect MAL or SIMKL.</p>';
  return accounts.map(acc=>{
    const p=acc.provider,links=adding?[]:v374GetLinks(item.id).filter(l=>l.provider===p);
    const baseLink=links.find(l=>!l.season_id),others=links.filter(l=>l.season_id);
    const assign=`<button class="btn btn-sm btn-primary" type="button" onclick="App.v374Search(${v374Js(p)},${v374Js(item.id||'')},'',${v374Js(item.title||'')})">${baseLink?'Change':adding&&V374_ADD_CHOICES[p]?'Selected for save':'Assign'} title</button>`;
    return `<div class="mf374-service"><div class="mf374-service-head"><b>${v374Esc(v374ServiceLabel(p))}</b><span>${baseLink?(baseLink.enabled?'● Auto tracking':'● Paused'):'Not assigned'}</span></div>
      ${baseLink?`<small class="mf374-subtle">${v374Esc(baseLink.remote_title)} · #${v374Esc(baseLink.remote_id)} · ${baseLink.last_error?`Sync error: ${v374Esc(baseLink.last_error)}`:baseLink.last_synced_at?'Synced '+v374Esc(new Date(baseLink.last_synced_at).toLocaleString()):'Not yet synced'}</small><div class="mf374-controls">${assign}<button type="button" class="btn btn-sm" onclick="App.v374Options('${baseLink.id}')">${baseLink.enabled?'Settings / Pause':'Enable / Settings'}</button><button type="button" class="btn btn-sm" onclick="App.v374SyncOne('${baseLink.id}')">Sync Now</button><button type="button" class="btn btn-sm btn-danger" onclick="App.v374Unlink('${baseLink.id}')">Unlink</button></div>`:
        `<div class="mf374-controls">${assign}</div>`}
      ${!adding&&Array.isArray(item.seasons)&&item.seasons.length?`<details class="mf374-seasons"><summary>Season tracking · ${others.length} linked</summary>${item.seasons.map((s,i)=>{const link=others.find(l=>l.season_id===String(s.id));return `<div class="mf374-season-row"><span>${v374Esc(s.name||`Season ${i+1}`)}</span><span>${link?v374Esc(link.remote_title):'Not linked'}</span><button class="btn btn-sm" type="button" onclick="App.v374Search(${v374Js(p)},${v374Js(item.id)},${v374Js(s.id)},${v374Js(item.title+' '+(s.name||''))})">${link?'Change':'Assign'}</button>${link?`<button class="btn btn-sm" type="button" onclick="App.v374Options('${link.id}')">${link.enabled?'Settings':'Enable'}</button><button class="btn btn-sm btn-danger" type="button" onclick="App.v374Unlink('${link.id}')">Unlink</button>`:''}</div>`;}).join('')}</details>`:''}
    </div>`;
  }).join('');
}
function v374TrackingHtml(item={},adding=false){
  return `<section class="mf374-tracking" data-v374-tracking data-v374-library="${v374Esc(item.id||'')}" data-v374-add="${adding?'1':'0'}"><div class="mf374-head"><div><span class="mf374-kicker">MEDIA SERVICES · v374</span><h3>Tracking</h3><p>Assign external titles yourself. Only linked titles can synchronize; no automatic Library imports.</p></div><span class="mf374-icon">↗</span></div><div class="mf374-services">${v374CardRows(item,adding)}</div></section>`;
}
function v374UpdatePanels(){
 document.querySelectorAll('[data-v374-tracking]').forEach(el=>{
   const id=el.dataset.v374Library||'',item=id?(S.library||[]).find(x=>String(x.id)===id)||{}:{title:document.getElementById('l-title')?.value||''};
   const services=el.querySelector('.mf374-services');if(services)services.innerHTML=v374CardRows(item,el.dataset.v374Add==='1');
 });
 const host=document.getElementById('mf374-accounts-content');if(host)host.innerHTML=v374AccountsBody();
}
function v374AccountsBody(){
 return `<div class="mf374-account-list">${Object.entries(V374_META).map(([key,service])=>{
 const linked=V374_SESSION.links.filter(l=>l.provider===key),connected=v374Connected(key);
 return `<div class="mf374-account"><div><strong>${v374Esc(service.name)}</strong><p>${connected?'Connected · '+linked.length+' assigned title'+(linked.length===1?'':'s'):'Not connected'}</p></div><div class="mf374-controls"><button class="btn btn-sm ${connected?'':'btn-primary'}" type="button" onclick="App.v374Connect('${key}')">${connected?'Reconnect':'Connect'}</button>${connected?`<button class="btn btn-sm btn-danger" type="button" onclick="App.v374Disconnect('${key}')">Disconnect</button>`:''}</div></div>`;
 }).join('')}</div><p class="mf374-subtle" data-v374-notice>${V374_SESSION.loaded?'Only manually assigned titles will synchronize.':'Loading account connections…'}</p><button class="btn btn-sm" type="button" onclick="App.v374Refresh(true)">Refresh connections</button>`;
}
function v374SettingsSection(){return `<div class="section-label">Media Services Tracking</div><div class="card mf374-settings"><h3>MAL & SIMKL Tracking</h3><p>Connect your external accounts, then assign individual titles from Add Title, Edit Title, or Anime Details. Never sync the whole Library.</p><div id="mf374-accounts-content">${v374AccountsBody()}</div></div>`;}
const v374OriginalLibraryHtml=libraryModalHtml;
libraryModalHtml=function(d){
  const raw=String(v374OriginalLibraryHtml.apply(this,arguments)||'');
  try{const host=document.createElement('div');host.innerHTML=raw;
    const anchor=host.querySelector('.modal-actions');
    if(anchor)anchor.insertAdjacentHTML('beforebegin',v374TrackingHtml(d||{},!d?.id));
    return host.innerHTML;
  }catch(_){return raw;}
};
const v374OriginalDetailsHtml=v181TitleDetailsHtml;
v181TitleDetailsHtml=function(item){
  const raw=String(v374OriginalDetailsHtml.apply(this,arguments)||'');
  try{const host=document.createElement('div');host.innerHTML=raw;const body=host.querySelector('.v181-title-details-body');
    const actions=body?.querySelector('.v181-detail-actions');
    if(actions)actions.insertAdjacentHTML('beforebegin',v374TrackingHtml(item,false));
    return host.innerHTML;
  }catch(_){return raw;}
};
const v374PreviousSettings=V219_PAGE_RENDERERS.get('settings')||v348RenderSettingsPage;
MediaFlowRuntime.registerPageRenderer('settings',function(){
  const raw=String(v374PreviousSettings.apply(this,arguments)||'');
  try{const host=document.createElement('div');host.innerHTML=raw;const content=host.querySelector('.v221-settings-content');
    const marker=content?.querySelector('#v221-settings-empty');
    if(content)content.insertAdjacentHTML('afterbegin',v374SettingsSection());
    return host.innerHTML;
  }catch(_){return raw;}
});
MediaFlowRuntime.registerPageEnhancer('settings',function(){if(!V374_SESSION.busy)v374Refresh();});
const v374OpenModalBase=App.openLibraryModal;
App.openLibraryModal=function(id){if(!id)V374_ADD_CHOICES={};const ret=v374OpenModalBase.apply(this,arguments);v374Refresh();return ret;};
const v374DetailsBase=App.v181OpenTitleDetails;
App.v181OpenTitleDetails=function(id){const ret=v374DetailsBase.apply(this,arguments);v374Refresh();return ret;};
function v374Popup(html){document.getElementById('mf374-popup')?.remove();const overlay=document.createElement('div');overlay.id='mf374-popup';overlay.className='mf374-overlay';overlay.innerHTML=`<div class="mf374-dialog" role="dialog" aria-modal="true" aria-label="Tracking assignment"><button type="button" class="mf374-x" aria-label="Close" onclick="App.v374Close()">×</button>${html}</div>`;overlay.addEventListener('click',e=>{if(e.target===overlay)v374Close();});document.body.appendChild(overlay);}
function v374Close(){document.getElementById('mf374-popup')?.remove();}
async function v374Connect(provider){try{const result=await v374Invoke('start',{provider});if(!result.authorization_url)throw Error('No authorization URL returned');window.location.assign(result.authorization_url);}catch(e){v374Notice('Connection could not start: '+e.message);}}
async function v374Disconnect(provider){if(!confirm(`Disconnect ${v374ServiceLabel(provider)} and remove all its tracking links? Your external list will remain untouched.`))return;try{await v374Invoke('disconnect',{provider});await v374Refresh(true);v374Notice('Disconnected '+v374ServiceLabel(provider));}catch(e){v374Notice(e.message);}}
let V374_SEARCH={provider:'mal',libraryId:'',seasonId:'',query:'',type:'anime',timer:0};
function v374MediaType(item,provider){const c=getCategory(item?.categoryId||'');const str=String((c?.unit||'')+' '+(c?.name||'')+' '+(item?.mediaFormat||'')).toLowerCase();if(provider==='mal')return /manga|chapter|volume|manhwa|manhua/.test(str)?'manga':'anime';return /movie|film/.test(str)?'movie':/tv series|television|tv show/.test(str)&&!/anime/.test(str)?'tv':'anime';}
function v374Search(provider,libraryId='',seasonId='',query=''){
 if(!v374Connected(provider)){v374Notice('Connect your '+v374ServiceLabel(provider)+' account first');return;}
 const item=(S.library||[]).find(x=>String(x.id)===String(libraryId));const title=query||item?.title||document.getElementById('l-title')?.value||'';
 V374_SEARCH={provider,libraryId,seasonId,query:title,type:v374MediaType(item,provider),timer:0};
 v374Popup(`<div class="mf374-kicker">${v374Esc(v374ServiceLabel(provider))} · Title assignment</div><h2>Find the matching title</h2><p class="mf374-subtle">Choose the correct season or adaptation. Assignment alone will not overwrite progress.</p><div class="mf374-searchbar"><input id="mf374-query" type="search" placeholder="Search ${v374Esc(v374ServiceLabel(provider))}" value="${v374Esc(title)}" oninput="App.v374OnSearchInput(this.value)"><select id="mf374-type" onchange="App.v374SelectType(this.value)">${V374_META[provider].types.map(t=>`<option value="${t}" ${t===V374_SEARCH.type?'selected':''}>${t.toUpperCase()}</option>`).join('')}</select><button class="btn btn-primary" type="button" onclick="App.v374FetchSearch()">Search</button></div><div id="mf374-results" class="mf374-results">Searching…</div>`);
 v374FetchSearch();
}
function v374OnSearchInput(value){V374_SEARCH.query=value;clearTimeout(V374_SEARCH.timer);V374_SEARCH.timer=setTimeout(v374FetchSearch,380);}
function v374SelectType(value){V374_SEARCH.type=value;v374FetchSearch();}
async function v374FetchSearch(){
 const {provider,type,query}=V374_SEARCH;const host=document.getElementById('mf374-results');if(!host)return;
 if(query.trim().length<2){host.textContent='Enter at least two characters';return;}
 host.textContent='Searching '+v374ServiceLabel(provider)+'…';
 try{const r=await v374Invoke('search',{provider,type,query:query.trim()});
  if(!host.isConnected||V374_SEARCH.query!==query||V374_SEARCH.type!==type)return;
  host.innerHTML=r.results?.length?r.results.map((x,i)=>`<button type="button" class="mf374-result" onclick="App.v374Choose(${i})"><span class="mf374-result-cover">${x.cover?`<img src="${v374Esc(x.cover)}" alt="" loading="lazy" onerror="this.style.display='none'">`:'◈'}</span><span><strong>${v374Esc(x.title)}</strong><small>${v374Esc(x.type)} · ${v374Esc(x.year||'Year unknown')}${x.count?' · '+Number(x.count)+' units':''}</small></span><span>Assign →</span></button>`).join(''):'No matching titles. Try another title name or category.';
  V374_SEARCH.results=r.results||[];
 }catch(err){host.textContent='Search unavailable: '+String(err.message||err);}
}
async function v374Choose(index){
 const x=V374_SEARCH.results?.[index];if(!x)return;
 const s=V374_SEARCH;
 v374Popup(`<div class="mf374-kicker">Confirm ${v374Esc(v374ServiceLabel(s.provider))} association</div><h2>${v374Esc(x.title)}</h2><p>Link this ${v374Esc(x.type)} entry to your MediaFlow title${s.seasonId?' season':''}? Nothing is synchronized until you explicitly enable tracking.</p><div class="mf374-choices"><button class="btn btn-primary" onclick="App.v374ConfirmChoice()">Confirm & keep both unchanged</button><button class="btn" onclick="App.v374Search(${v374Js(s.provider)},${v374Js(s.libraryId)},${v374Js(s.seasonId)},${v374Js(s.query)})">Back to search</button></div><p class="mf374-subtle">After linking, open Tracking Settings to enable specific fields. This avoids accidental overwrites.</p>`);
 V374_SEARCH.selected=x;
}
async function v374ConfirmChoice(){const s=V374_SEARCH,x=s.selected;if(!x)return;
 if(!s.libraryId){V374_ADD_CHOICES[s.provider]={...x,seasonId:s.seasonId};v374Close();v374Notice(`${v374ServiceLabel(s.provider)} selected. Save the Library title to finish assignment.`);return;}
 try{await v374Invoke('assign',{provider:s.provider,libraryId:s.libraryId,seasonId:s.seasonId,remoteId:x.id,remoteType:x.type,remoteTitle:x.title});v374Close();await v374Refresh(true);v374Notice('Title linked; automatic tracking is paused until you enable it.');}
 catch(e){v374Notice('Could not assign: '+e.message);}
}
function v374FindLink(id){return V374_SESSION.links.find(l=>l.id===id);}
function v374Options(linkId){const l=v374FindLink(linkId);if(!l)return;
 v374Popup(`<div class="mf374-kicker">${v374Esc(v374ServiceLabel(l.provider))} · Tracking preferences</div><h2>${v374Esc(l.remote_title)}</h2><p>Choose which fields MediaFlow is allowed to update. Local saves always come first.</p><label class="mf374-option"><input type="checkbox" id="mf374-enabled" ${l.enabled?'checked':''}> Automatic tracking enabled</label><label class="mf374-option"><input type="checkbox" id="mf374-progress" ${l.sync_progress?'checked':''}> Episode/chapter progress</label><label class="mf374-option"><input type="checkbox" id="mf374-status" ${l.sync_status?'checked':''}> Status changes</label><label class="mf374-option"><input type="checkbox" id="mf374-rating" ${l.sync_rating?'checked':''}> Rating changes</label><div class="mf374-choices"><button class="btn btn-primary" onclick="App.v374SaveOptions('${l.id}')">Save tracking preferences</button><button class="btn" onclick="App.v374Close()">Cancel</button></div><p class="mf374-subtle">Enabling updates affects future saved changes only. Existing external progress is not overwritten during linking.</p>`);
}
async function v374SaveOptions(id){try{await v374Invoke('options',{linkId:id,enabled:document.getElementById('mf374-enabled')?.checked,progress:document.getElementById('mf374-progress')?.checked,status:document.getElementById('mf374-status')?.checked,rating:document.getElementById('mf374-rating')?.checked});v374Close();await v374Refresh(true);v374Notice('Tracking preferences saved');}catch(e){v374Notice(e.message);}}
async function v374Unlink(id){if(!confirm('Unlink this external title? Any pending updates for this association will be deleted. Your MediaFlow and external Library records stay intact.'))return;
 try{await v374Invoke('unlink',{linkId:id});await v374Refresh(true);v374Notice('Tracking association removed and pending updates cleaned');}catch(e){v374Notice(e.message);}}
async function v374SyncOne(id){const l=v374FindLink(id);if(!l)return;if(!l.enabled){v374Notice('Enable tracking first');return;}
 const item=(S.library||[]).find(x=>String(x.id)===String(l.library_id));if(!item)return;
 if(Array.isArray(item.seasons)&&item.seasons.length&&!l.season_id){v374Notice('This title uses Seasons View. Assign the exact external season before syncing progress.');return;}
 if(l.provider==='simkl'&&l.sync_progress&&!l.sync_status&&!l.sync_rating&&l.remote_type!=='movie'){v374Notice('SIMKL Sync Now cannot safely invent watched episodes from a total. Save new episode logs to synchronize them.');return;}
 if(!confirm('Send current MediaFlow values to '+v374ServiceLabel(l.provider)+' for this assigned title?'))return;
 const season=l.season_id?(item.seasons||[]).find(s=>String(s.id)===l.season_id):null;
 try{await v374Invoke('publish',{libraryId:String(item.id),seasonId:l.season_id||'',eventKey:'manual-'+uid(),payload:{progress:season?season.progress:item.progress,status:item.status,rating:item.rating,seasonNumber:Number(season?.number)||0,units:[]}});const result=await v374Invoke('process');await v374Refresh(true);v374Notice(`Tracking sync: ${result.processed||0} completed, ${result.failed||0} failed`);}catch(e){v374Notice(e.message);}
}
const v374SaveLibraryBase=App.saveLibraryModal;
App.saveLibraryModal=function(id){
 const before=new Set((S.library||[]).map(x=>String(x.id))),old=id?(S.library||[]).find(x=>String(x.id)===String(id)):null;
 const prior=old?{progress:old.progress,status:old.status,rating:old.rating,seasons:JSON.stringify(old.seasons||[])}:null;
 const result=v374SaveLibraryBase.apply(this,arguments);
 const item=id?(S.library||[]).find(x=>String(x.id)===String(id)):(S.library||[]).find(x=>!before.has(String(x.id)));
 if(!item)return result;
 if(!id&&Object.keys(V374_ADD_CHOICES).length){const choices={...V374_ADD_CHOICES};V374_ADD_CHOICES={};Promise.allSettled(Object.entries(choices).map(([provider,x])=>v374Invoke('assign',{provider,libraryId:String(item.id),seasonId:x.seasonId||'',remoteId:x.id,remoteType:x.type,remoteTitle:x.title}))).then(results=>{if(results.some(x=>x.status==='rejected'))v374Notice('Title saved, but one or more external associations failed. Reopen Tracking to try again.');v374Refresh(true);});}
 if(prior&&(Number(prior.progress)!==Number(item.progress)||prior.status!==item.status||Number(prior.rating||0)!==Number(item.rating||0)||prior.seasons!==JSON.stringify(item.seasons||[]))){if(Array.isArray(item.seasons)&&item.seasons.length){const previous=new Map(JSON.parse(prior.seasons).map(s=>[String(s.id),s]));for(const season of item.seasons){const old=previous.get(String(season.id));if(Number(old?.progress)!==Number(season.progress)||prior.status!==item.status||Number(prior.rating||0)!==Number(item.rating||0))v374QueueItem(item,'edit-'+uid(),[],false,String(season.id));}}else v374QueueItem(item,'edit-'+uid(),[],false);}
 return result;
};
function v374LocalEvents(){try{return JSON.parse(localStorage.getItem('mf374-events-'+String(AUTH_USER?.id||''))||'[]')}catch{return []}}
function v374SetLocalEvents(list){try{localStorage.setItem('mf374-events-'+String(AUTH_USER?.id||''),JSON.stringify(list.slice(-1000)))}catch(_){}}
let V374_FLUSHING=false;
function v374QueueItem(item,eventKey,units=[],repeat=false,seasonId=''){
 if(!item?.id||!AUTH_USER||!V374_SESSION.links.some(x=>x.enabled&&String(x.library_id)===String(item.id)))return;
 const hasSeasons=Array.isArray(item.seasons)&&item.seasons.length;
 // Never send the aggregate progress of a multi-season Library title as one MAL season.
 const eligible=V374_SESSION.links.some(x=>x.enabled&&String(x.library_id)===String(item.id)&&String(x.season_id||'')===String(seasonId||'')&&(!hasSeasons||!!seasonId));
 if(!eligible)return;
 const season=seasonId?item.seasons?.find(s=>String(s.id)===String(seasonId)):null;
 const payload={progress:Number(season?season.progress:item.progress)||0,status:item.status,rating:item.rating,seasonNumber:Number(season?.number)||0,units:units.map(Number).filter(n=>Number.isInteger(n)&&n>0).slice(0,60),repeat};
 const ev={libraryId:String(item.id),seasonId:String(seasonId||''),eventKey,payload};const stored=v374LocalEvents();if(!stored.some(x=>x.eventKey===eventKey))stored.push(ev);v374SetLocalEvents(stored);v374Flush();
}
async function v374Flush(){if(V374_FLUSHING||!navigator.onLine||!AUTH_USER)return;V374_FLUSHING=true;
 try{let pending=v374LocalEvents();for(const e of pending.slice(0,20)){
   try{await v374Invoke('publish',e);pending=v374LocalEvents().filter(x=>x.eventKey!==e.eventKey);v374SetLocalEvents(pending);}catch(err){console.warn('v374 queued event pending',err);break;}
 }if(!pending.length)await v374Invoke('process');
 }catch(err){console.warn('v374 process pending',err)}finally{V374_FLUSHING=false;}
}
window.addEventListener('online',()=>{v374Refresh(true).then(v374Flush);});
const v374StartAuthenticatedBase=startAuthenticatedApp;
startAuthenticatedApp=async function(){const result=await v374StartAuthenticatedBase.apply(this,arguments);v374Refresh(true).then(v374Flush);return result;};
// Captured before final submit; no update is emitted on rejected/unfinished saves.
const v374SubmitLogBase=App.submitLog;
App.submitLog=function(){
 const draft=S.logDraft,wasLogging=!!S.logging,prior=new Set((S.sessions||[]).map(s=>String(s.id)));
 const captured=(draft?.entries||[]).map(e=>({libraryId:String(e.libraryId||''),repeat:!!e.isRepeat,before:Number((S.library||[]).find(x=>String(x.id)===String(e.libraryId||''))?.progress)||0,units:(e.v369Units||[]).map(u=>({number:Number(u.number),seasonId:String(u.seasonId||''),repeat:!!u.repeat,loggedAt:u.loggedAt}))}));
 const result=v374SubmitLogBase.apply(this,arguments);
 const finish=()=>{
   if(!wasLogging||S.logging||!(S.sessions||[]).some(s=>!prior.has(String(s.id))))return;
   for(const e of captured){const item=(S.library||[]).find(x=>String(x.id)===e.libraryId);if(!item)continue;
     const seasonal=Array.isArray(item.seasons)&&item.seasons.length;
     if(seasonal){const groups=new Map();for(const u of e.units){if(!u.seasonId||u.repeat)continue;const list=groups.get(u.seasonId)||[];list.push(u.number);groups.set(u.seasonId,list);}for(const [seasonId,units] of groups)v374QueueItem(item,'log-'+uid(),units,e.repeat,seasonId);}
     else {const precise=e.units.filter(u=>!u.repeat).map(u=>u.number);const after=Number(item.progress)||0;const inferred=!precise.length&&!e.repeat&&after>e.before&&after-e.before<=60?Array.from({length:after-e.before},(_,i)=>e.before+i+1):[];v374QueueItem(item,'log-'+uid(),precise.length?precise:inferred,e.repeat);}
   }
 };
 if(result&&typeof result.then==='function')return result.then(x=>{finish();return x;});finish();return result;
};
Object.assign(App,{v374Refresh,v374Connect,v374Disconnect,v374Search,v374OnSearchInput,v374SelectType,v374FetchSearch,v374Choose,v374ConfirmChoice,v374Close,v374Options,v374SaveOptions,v374Unlink,v374SyncOne});
window.MediaFlowV374={version:374,features:['Opt-in MAL and SIMKL accounts','Manual title and season assignments','Add/Edit/Details Tracking section','Encrypted server-side tokens','Tracking queue with retry'],refresh:v374Refresh,flush:v374Flush};
