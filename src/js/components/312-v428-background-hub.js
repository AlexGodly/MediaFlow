/* MediaFlow v428 — theme-native background coordination.
   Browser execution pauses when the browser closes. Cross-device locking needs server support. */
(function () {
'use strict';
if (window.MediaFlowV428Hub) return;
const KINDS=['cover','metadata','fresh'];
const LABELS={cover:'Cover Recovery',metadata:'Metadata Recovery',fresh:'Fresh Releases'};
const ICONS={cover:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m3 17 5-5 4 4 3-3 6 6"/>',metadata:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 2 16 2 16 0V5M4 12c0 2 16 2 16 0"/>',fresh:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-12 5h6"/>'};
const icon=(kind)=>'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICONS[kind]+'</svg>';
const x=(s)=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const account=()=>String((typeof AUTH_USER!=='undefined'&&AUTH_USER&&AUTH_USER.id)||'local');
const key=(id)=>'mf428-background:'+(id||HUB.loadedFor||account()),leaseKey=(id)=>'mf428-worker:'+(id||HUB.loadedFor||account());
const LOCK_MS=16000;
const queueSlot=(kind,id)=>'mf428-pending:'+(id||HUB.loadedFor||account())+':'+kind;
function writeSlot(kind,job){
 try{if(job)localStorage.setItem(queueSlot(kind),JSON.stringify(job));
 else localStorage.removeItem(queueSlot(kind));}
 catch(e){console.warn('v428 individual queue slot',kind,e);return false;}
 return true;
}
const defaults={visibility:'auto',compact:false,cooldownSeconds:60,position:'right'};
const HUB={queue:[],active:null,cooldownUntil:0,last:{},expanded:false,loadedFor:'',owner:String(Date.now())+'-'+Math.random().toString(36).slice(2),ticker:0,working:false,metadataRunner:null,freshRunner:null,renderQueued:false,leaseTimer:0,waiters:{},lastMarkup:'',pumping:false};
function prefs(){const s=(typeof S!=='undefined'&&S.settings&&S.settings.v428Background)||{};return {...defaults,...s};}
function persistPrefs(p){S.settings=S.settings||{};S.settings.v428Background={...prefs(),...p};try{Promise.resolve(typeof persistSettings==='function'?persistSettings():saveState()).catch(e=>console.warn('v428 widget preference',e));}catch(e){console.warn(e);}paint();}
function load(){if(HUB.loadedFor===account())return;
 if(HUB.active){HUB.active.leaseLost=true;HUB.active.accountChanged=true;if(HUB.active.kind==='cover'&&typeof MF424!=='undefined'&&MF424.job)MF424.job.pauseRequested=true;return;}
 HUB.loadedFor=account();HUB.queue=[];HUB.active=null;HUB.cooldownUntil=0;HUB.last={};
 try{const data=JSON.parse(localStorage.getItem(key())||'{}');
  HUB.cooldownUntil=Math.max(0,Number(data.cooldownUntil)||0);HUB.last=data.last||{};
  // Migrate earlier v428 branch snapshots exactly once. Production v427 never had these keys.
  if(Array.isArray(data.queue)){
   for(const row of data.queue.filter(r=>KINDS.includes(r?.kind))){
    if(!localStorage.getItem(queueSlot(row.kind)))writeSlot(row.kind,{kind:row.kind,at:row.at||Date.now(),params:row.params||{}});
   }
   localStorage.setItem(key(),JSON.stringify({cooldownUntil:HUB.cooldownUntil,last:HUB.last}));
  }
 }catch(e){console.warn('v428 queue restoration',e);}
 syncQueue();
}
function save(){
 try{const current=JSON.parse(localStorage.getItem(key(HUB.loadedFor))||'{}');
  HUB.cooldownUntil=Math.max(HUB.cooldownUntil,Number(current.cooldownUntil)||0);
  localStorage.setItem(key(HUB.loadedFor),JSON.stringify({cooldownUntil:HUB.cooldownUntil,last:HUB.last}));
 }catch(e){console.warn('v428 queue state persistence',e);}
}
function syncQueue(){
 try{
  const found=[];
  for(const kind of KINDS){
   const value=JSON.parse(localStorage.getItem(queueSlot(kind))||'null');
   if(value?.kind===kind)found.push({kind,at:Number(value.at)||Date.now(),params:value.params||{}});
  }
  HUB.queue=found.sort((a,b)=>a.at-b.at||KINDS.indexOf(a.kind)-KINDS.indexOf(b.kind));
  const state=JSON.parse(localStorage.getItem(key(HUB.loadedFor))||'{}');
  HUB.cooldownUntil=Math.max(HUB.cooldownUntil,Number(state.cooldownUntil)||0);
  if(state.last&&typeof state.last==='object')HUB.last=state.last;
 }catch(e){console.warn('v428 queue sync',e);}
}
function leaseHeld(){try{const v=JSON.parse(localStorage.getItem(leaseKey(HUB.loadedFor))||'null');return !!(v&&v.owner===HUB.owner&&v.until>Date.now());}catch(_){return false;}}
function foreignLeaseInfo(){try{const v=JSON.parse(localStorage.getItem(leaseKey(HUB.loadedFor))||'null');return v&&v.owner!==HUB.owner&&v.until>Date.now()?v:null;}catch(_){return null;}}
function foreignLease(){return !!foreignLeaseInfo();}
function acquire(){try{const k=leaseKey(),old=JSON.parse(localStorage.getItem(k)||'null');if(old&&old.until>Date.now()&&old.owner!==HUB.owner)return false;localStorage.setItem(k,JSON.stringify({owner:HUB.owner,kind:HUB.queue[0]?.kind||null,until:Date.now()+LOCK_MS}));return leaseHeld();}catch(_){return false;}}
function renew(){if(!HUB.active)return;try{if(!leaseHeld()){HUB.active.leaseLost=true;if(MF424&&MF424.job&&HUB.active.kind==='cover')MF424.job.pauseRequested=true;return;}localStorage.setItem(leaseKey(),JSON.stringify({owner:HUB.owner,kind:HUB.active.kind,until:Date.now()+LOCK_MS}));}catch(_){}}
function release(){try{if(leaseHeld())localStorage.removeItem(leaseKey());}catch(_){}}
function note(kind,status,message){HUB.last[kind]={status,message:String(message||''),at:Date.now()};save();paint();}
function enqueue(kind,params){load();syncQueue();if(!KINDS.includes(kind)||HUB.loadedFor!==account())return false;
 if(HUB.active&&HUB.active.kind===kind){showToast(LABELS[kind]+' is already running.');return false;}
 if(HUB.queue.some(q=>q.kind===kind)){showToast(LABELS[kind]+' is already queued.');return false;}
 if(!writeSlot(kind,{kind,at:Date.now(),params:params||{}}))return false;
 syncQueue();save();paint();pump();return true;
}
function cancel(kind){
 syncQueue();if(!HUB.queue.some(q=>q.kind===kind))return;
 if(!writeSlot(kind,null))return;
 syncQueue();
 if(kind==='cover'&&typeof MF424!=='undefined'&&MF424.job){
  MF424.job.pauseRequested=true;MF424.job.status='paused';
  if(typeof mf424SaveJob==='function')Promise.resolve(mf424SaveJob()).catch(e=>console.warn('v428 cover checkpoint',e));
 }
 if(kind==='metadata')App.mf428MetadataControl?.('cancel');
 if(kind==='fresh')App.mf428FreshControl?.('cancel');
 save();paint();
}
function move(kind,by){
 syncQueue();const i=HUB.queue.findIndex(q=>q.kind===kind),j=i+by;
 if(i<0||j<0||j>=HUB.queue.length)return;
 const a=HUB.queue[i],b=HUB.queue[j],old=a.at;
 if(!writeSlot(a.kind,{...a,at:b.at}))return;
 if(!writeSlot(b.kind,{...b,at:old}))return;
 syncQueue();save();paint();
}
const nativeCoverRun=typeof mf424Run==='function'?mf424Run:null;
const nativeFresh=typeof v377RunJikan==='function'?v377RunJikan:null;
async function execute(job){
 if(job.kind==='cover'){
  if(!nativeCoverRun||!MF424.job)return;
  return nativeCoverRun();
 }
 if(job.kind==='fresh'){
  if(typeof HUB.freshRunner==='function')return HUB.freshRunner(job.params);
  if(!nativeFresh)throw new Error('Existing Fresh Episodes engine is unavailable');
  return nativeFresh(job.params||{force:true});
 }
 if(job.kind==='metadata'){
  if(typeof HUB.metadataRunner!=='function')throw new Error('Metadata Fixer has not initialized');
  return HUB.metadataRunner(job.params);
 }
}
async function runNext(){
 if(!acquire())return;
 syncQueue();if(!HUB.queue.length||Date.now()<HUB.cooldownUntil){release();return;}
 const next=HUB.queue[0],jobAccount=HUB.loadedFor;
 if(!writeSlot(next.kind,null)){release();return;}
 syncQueue();
 HUB.active={kind:next.kind,params:next.params,started:Date.now(),leaseLost:false,account:jobAccount};
 HUB.working=true;save();paint();
 try{
  const value=await execute(next);
  if(HUB.active.leaseLost||jobAccount!==account()||!leaseHeld())throw new Error('Worker ownership or account changed');
  const outcome=actualOutcome(next.kind);
  note(next.kind,outcome,outcome==='complete'?'Finished':outcome==='review'?'Waiting for review':outcome==='paused'?'Progress saved':outcome);
  HUB.waiters[next.kind]?.resolve(value);
 }catch(e){console.warn('v428 '+next.kind,e);note(next.kind,'failed',String(e.message||e));HUB.waiters[next.kind]?.reject(e);}
 finally{
  delete HUB.waiters[next.kind];HUB.working=false;release();HUB.active=null;
  HUB.cooldownUntil=Date.now()+Math.max(30,Math.min(600,Number(prefs().cooldownSeconds)||60))*1000;
  save();if(jobAccount!==account())load();paint();
 }
}
function actualOutcome(kind){
 const raw=kind==='cover'?(typeof MF424!=='undefined'?MF424.job?.status:null):kind==='metadata'?window.MediaFlowV428Metadata?.status():window.MediaFlowV428Fresh?.status();
 if(raw==='waiting-review')return 'review';
 if(['paused','stopped','waiting-part','other-tab'].includes(raw))return 'paused';
 if(raw==='complete')return 'complete';
 if(raw==='failed')return 'failed';
 return 'complete';
}
async function pump(){
 load();if(HUB.pumping||HUB.working||HUB.active||HUB.loadedFor!==account())return;
 syncQueue();if(!HUB.queue.length||Date.now()<HUB.cooldownUntil)return;
 HUB.pumping=true;
 try{
  const locks=typeof navigator!=='undefined'&&navigator.locks;
  if(locks&&typeof locks.request==='function'){
   await locks.request('mediaflow-v428-background:'+HUB.loadedFor,{mode:'exclusive',ifAvailable:true},async lock=>{
    if(lock)await runNext();
   });
  }else await runNext();
 }catch(e){console.warn('v428 scheduler',e);}
 finally{HUB.pumping=false;}
}
if(nativeCoverRun)mf424Run=function(){if(MF424.running)return;enqueue('cover',{});};
if(nativeFresh)v377RunJikan=function(options){if(HUB.waiters.fresh)return HUB.waiters.fresh.promise;let resolve,reject;const promise=new Promise((ok,no)=>{resolve=ok;reject=no;});HUB.waiters.fresh={promise,resolve,reject};if(!enqueue('fresh',options||{})){delete HUB.waiters.fresh;resolve({queued:true});}return promise;};
function start(kind){
 if(kind==='cover'){if(typeof App.mf425OpenConfig==='function')App.mf425OpenConfig('settings');else showToast('Cover Recovery unavailable');return;}
 if(kind==='metadata'){if(typeof App.mf428MetadataOpen==='function')App.mf428MetadataOpen('settings');else showToast('Metadata Fixer unavailable');return;}
 if(kind==='fresh'){if(typeof App.mf428FreshOpen==='function')App.mf428FreshOpen();else enqueue('fresh',{});return;}
}
function control(kind,cmd){
 if(kind==='cover'&&MF424.job){if(cmd==='pause')App.mf424Pause();if(cmd==='stop')App.mf424StopTitle();if(cmd==='resume')App.mf424Resume();if(cmd==='review')App.mf424Review();return;}
 if(kind==='metadata'&&typeof App.mf428MetadataControl==='function'){App.mf428MetadataControl(cmd);return;}
 if(kind==='fresh'&&typeof App.mf428FreshControl==='function'){if(cmd==='resume')App.mf428FreshResume();else App.mf428FreshControl(cmd);return;}
 if(cmd==='cancel')cancel(kind);
}
function phase(kind){
 if(HUB.active&&HUB.active.kind===kind){
  if(kind==='cover'&&MF424.job?.status==='cooldown')return 'cooldown';
  return 'running';
 }
 if(HUB.queue.some(q=>q.kind===kind))return 'queued';
 if(kind==='cover'&&MF424.job?.pending)return 'review';
 if(kind==='cover'&&['paused','stopped','waiting-part','other-tab'].includes(MF424.job?.status))return 'paused';
 if(kind==='metadata'&&window.MediaFlowV428Metadata){const m=window.MediaFlowV428Metadata.status();if(m==='waiting-review')return 'review';if(['paused','waiting-part','stopped'].includes(m))return 'paused';}
 if(kind==='fresh'&&window.MediaFlowV428Fresh){const f=window.MediaFlowV428Fresh.status();if(['paused','stopped'].includes(f))return 'paused';}
 if(foreignLeaseInfo()?.kind===kind&&!HUB.active)return 'other-tab';
 return HUB.last[kind]?.status||'idle';
}
function progress(kind){
 if(kind==='cover'&&MF424.job){const j=MF424.job;return {at:j.cursor||0,total:j.ids?.length||0};}
 if(kind==='metadata'&&window.MediaFlowV428Metadata)return window.MediaFlowV428Metadata.progress();
 if(kind==='fresh'&&window.MediaFlowV428Fresh)return window.MediaFlowV428Fresh.progress();
 return {at:0,total:0};
}
function row(kind){const state=phase(kind),p=progress(kind),percent=p.total?Math.round(p.at/p.total*100):0;
 const order=HUB.queue.findIndex(q=>q.kind===kind);
 const detail=state==='queued'?'Queue position '+(order+1):state==='running'?(p.total?p.at.toLocaleString()+' / '+p.total.toLocaleString():'Checking providers'):state==='review'?'Manual review pending':state==='paused'?'Progress saved':state==='other-tab'?'Another tab is processing':state==='cooldown'?'Respecting API limits':HUB.last[kind]?.message||'Ready to start';
 return '<article class="mf428-process" data-kind="'+kind+'"><div class="mf428-process-head"><span class="mf428-process-icon">'+icon(kind)+'</span><span class="mf428-process-copy"><strong>'+LABELS[kind]+'</strong><small>'+x(detail)+'</small></span><span class="mf428-state" data-state="'+state+'">'+x(state)+'</span></div>'+
 (p.total&&['running','paused','queued','review','cooldown'].includes(state)?'<div class="mf428-bar" role="progressbar" aria-valuenow="'+percent+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+percent+'%"></i></div>':'')+
 '<div class="mf428-process-actions">'+
 (state==='idle'||state==='complete'||state==='failed'?'<button type="button" onclick="App.mf428Start(\''+kind+'\')">Start</button>':'')+
 (state==='queued'?'<button type="button" onclick="App.mf428Move(\''+kind+'\',-1)" aria-label="Move earlier">↑</button><button type="button" onclick="App.mf428Move(\''+kind+'\',1)" aria-label="Move later">↓</button><button type="button" onclick="App.mf428Cancel(\''+kind+'\')">Remove</button>':'')+
 (state==='running'?'<button type="button" onclick="App.mf428Control(\''+kind+'\',\'pause\')">Pause</button><button type="button" onclick="App.mf428Control(\''+kind+'\',\'stop\')">Stop safely</button>':'')+
 (state==='paused'?'<button type="button" onclick="App.mf428Control(\''+kind+'\',\'resume\')">Resume</button>':'')+
 (state==='review'?'<button type="button" onclick="App.mf428Control(\''+kind+'\',\'review\')">Review</button>':'')+
 '</div></article>';
}
function paint(){if(!document.body)return;load();const v=prefs().visibility,exists=HUB.active||HUB.queue.length||foreignLease()||Date.now()<HUB.cooldownUntil||KINDS.some(k=>['paused','review','running'].includes(phase(k)));
 let el=document.getElementById('mf428-hub');if(v==='hidden'||(v==='auto'&&!exists)){el?.remove();HUB.lastMarkup='';return;}
 if(!el){el=document.createElement('aside');el.id='mf428-hub';el.setAttribute('aria-label','Background Processes');document.body.appendChild(el);HUB.lastMarkup='';}
 const cooldown=Math.max(0,Math.ceil((HUB.cooldownUntil-Date.now())/1000));
 el.className='mf428-hub'+(HUB.expanded?' mf428-open':'');
 el.dataset.position=prefs().position==='left'?'left':'right';
 const markup='<button type="button" class="mf428-pill" onclick="App.mf428Toggle()" aria-expanded="'+HUB.expanded+'"><span class="mf428-pulse" aria-hidden="true"></span><span><strong>Background Processes</strong><small>'+(HUB.active?LABELS[HUB.active.kind]+' running':HUB.queue.length?HUB.queue.length+' queued':foreignLease()?'Another tab: '+(LABELS[foreignLeaseInfo()?.kind]||'processing'):cooldown?'Cooldown · '+cooldown+'s':'All systems idle')+'</small></span><span aria-hidden="true">'+(HUB.expanded?'▾':'▴')+'</span></button>'+
 (HUB.expanded?'<section class="mf428-panel" aria-label="Process controls"><div class="mf428-panel-title"><strong>Recovery & Release Center</strong><small>Only one process runs at a time</small></div>'+KINDS.map(row).join('')+'<div class="mf428-footer"><span>◈ '+(cooldown?'Shared cooldown: '+cooldown+'s':'Smart rate-limit scheduling')+'</span><button type="button" onclick="App.mf428SetVisibility(\'hidden\')">Hide widget</button></div></section>':'');
 if(HUB.lastMarkup!==markup){
  const panel=el.querySelector('.mf428-panel'),scroll=panel?.scrollTop||0;
  const selected=el.contains(document.activeElement)?document.activeElement:null;
  const selectKey=selected?.getAttribute('onclick')||null;
  const wasPill=selected?.classList?.contains('mf428-pill');
  el.innerHTML=markup;
  const next=el.querySelector('.mf428-panel');if(next)next.scrollTop=scroll;
  const target=wasPill?el.querySelector('.mf428-pill'):selectKey?[...el.querySelectorAll('button')].find(b=>b.getAttribute('onclick')===selectKey):null;
  target?.focus({preventScroll:true});
  HUB.lastMarkup=markup;
 }
}
function settingsHtml(){const selected=prefs().visibility,pos=prefs().position;
 return '<div class="mf428-widget-settings"><strong>Background Processes Widget</strong><p>Monitor Cover Recovery, Metadata Recovery and Fresh Releases, or start them from an always-visible launcher.</p>'+
  '<label for="mf428-visibility">Widget visibility</label><select id="mf428-visibility" onchange="App.mf428SetVisibility(this.value)">'+[['hidden','Hidden'],['auto','Automatic — show for background work'],['always','Always Show — launcher and progress']].map(a=>'<option value="'+a[0]+'" '+(selected===a[0]?'selected':'')+'>'+a[1]+'</option>').join('')+'</select>'+
  '<label for="mf428-position">Widget position</label><select id="mf428-position" onchange="App.mf428SetPosition(this.value)"><option value="right" '+(pos!=='left'?'selected':'')+'>Bottom right</option><option value="left" '+(pos==='left'?'selected':'')+'>Bottom left</option></select>'+
  '<p class="hint">Expand or collapse the widget with its heading. Hiding the widget never stops processing. Browser-closed work resumes from saved checkpoints when supported.</p></div>';
}
if(typeof v405FloatingSettingsHtml==='function'){
 const previous=v405FloatingSettingsHtml;v405FloatingSettingsHtml=function(){return previous.apply(this,arguments)+settingsHtml();};
}
Object.assign(App,{mf428Start:start,mf428Toggle:()=>{HUB.expanded=!HUB.expanded;paint();},mf428SetVisibility:v=>{if(['hidden','auto','always'].includes(v))persistPrefs({visibility:v});},mf428SetPosition:p=>{if(['left','right'].includes(p))persistPrefs({position:p});},mf428Move:move,mf428Cancel:cancel,mf428Control:control,mf428Queue:enqueue});
window.MediaFlowV428Hub={enqueue,paint,phase,progress,ownsLease:leaseHeld,registerMetadata:(fn)=>{HUB.metadataRunner=fn;pump();},registerFresh:(fn)=>{HUB.freshRunner=fn;pump();},runLegacyFresh:(options)=>nativeFresh?nativeFresh(options||{force:true}):Promise.resolve(null),status:()=>({active:HUB.active?.kind||null,queued:HUB.queue.map(x=>x.kind),cooldownUntil:HUB.cooldownUntil,otherTab:foreignLease()})};
function init(){load();if(!HUB.ticker)HUB.ticker=setInterval(()=>{if(HUB.loadedFor!==account())load();renew();pump();if(!HUB.renderQueued){HUB.renderQueued=true;paint();HUB.renderQueued=false;}},1500);paint();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.addEventListener('storage',e=>{
 if(e.key===key(HUB.loadedFor)||KINDS.some(k=>e.key===queueSlot(k,HUB.loadedFor))){syncQueue();paint();}
 if(e.key===leaseKey(HUB.loadedFor)&&HUB.active&&!leaseHeld()){HUB.active.leaseLost=true;if(HUB.active.kind==='cover'&&typeof MF424!=='undefined'&&MF424.job)MF424.job.pauseRequested=true;}
});
window.addEventListener('pagehide',()=>{
 if(HUB.active){HUB.active.leaseLost=true;if(HUB.active.kind==='cover'&&typeof MF424!=='undefined'&&MF424.job)MF424.job.pauseRequested=true;}
 release();
});
})();