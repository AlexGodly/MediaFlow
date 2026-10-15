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
const key=()=> 'mf428-background:'+account(),leaseKey=()=> 'mf428-worker:'+account();
const defaults={visibility:'auto',compact:false,cooldownSeconds:60,position:'right'};
const HUB={queue:[],active:null,cooldownUntil:0,last:{},expanded:false,loadedFor:'',owner:String(Date.now())+'-'+Math.random().toString(36).slice(2),ticker:0,working:false,metadataRunner:null,freshRunner:null,renderQueued:false,leaseTimer:0,waiters:{},lastMarkup:''};
function prefs(){const s=(typeof S!=='undefined'&&S.settings&&S.settings.v428Background)||{};return {...defaults,...s};}
function persistPrefs(p){S.settings=S.settings||{};S.settings.v428Background={...prefs(),...p};try{Promise.resolve(typeof persistSettings==='function'?persistSettings():saveState()).catch(e=>console.warn('v428 widget preference',e));}catch(e){console.warn(e);}paint();}
function load(){if(HUB.loadedFor===account())return;HUB.loadedFor=account();HUB.queue=[];HUB.active=null;HUB.cooldownUntil=0;HUB.last={};try{const data=JSON.parse(localStorage.getItem(key())||'{}');if(Array.isArray(data.queue))HUB.queue=data.queue.filter(q=>KINDS.includes(q.kind)).slice(0,20).map(q=>({kind:q.kind,at:q.at||Date.now(),params:q.params||{}}));HUB.cooldownUntil=Math.max(0,Number(data.cooldownUntil)||0);HUB.last=data.last||{};}catch(e){console.warn('v428 queue restoration',e);}}
function save(){try{localStorage.setItem(key(),JSON.stringify({queue:HUB.queue,cooldownUntil:HUB.cooldownUntil,last:HUB.last}));}catch(e){console.warn('v428 queue persistence',e);}}
function leaseHeld(){try{const v=JSON.parse(localStorage.getItem(leaseKey())||'null');return v&&v.owner===HUB.owner&&v.until>Date.now();}catch(_){return false;}}
function acquire(){try{const k=leaseKey(),old=JSON.parse(localStorage.getItem(k)||'null');if(old&&old.until>Date.now()&&old.owner!==HUB.owner)return false;localStorage.setItem(k,JSON.stringify({owner:HUB.owner,until:Date.now()+15000}));return leaseHeld();}catch(_){return false;}}
function renew(){if(!HUB.active)return;try{if(!leaseHeld()){HUB.active.leaseLost=true;if(MF424&&MF424.job&&HUB.active.kind==='cover')MF424.job.pauseRequested=true;return;}localStorage.setItem(leaseKey(),JSON.stringify({owner:HUB.owner,until:Date.now()+15000}));}catch(_){}}
function release(){try{if(leaseHeld())localStorage.removeItem(leaseKey());}catch(_){}}
function note(kind,status,message){HUB.last[kind]={status,message:String(message||''),at:Date.now()};save();paint();}
function enqueue(kind,params){load();if(!KINDS.includes(kind))return false;
 if(HUB.active&&HUB.active.kind===kind){showToast(LABELS[kind]+' is already running.');return false;}
 if(HUB.queue.some(q=>q.kind===kind)){showToast(LABELS[kind]+' is already queued.');return false;}
 HUB.queue.push({kind,at:Date.now(),params:params||{}});save();paint();pump();return true;
}
function cancel(kind){const n=HUB.queue.length;HUB.queue=HUB.queue.filter(q=>q.kind!==kind);if(n!==HUB.queue.length){save();paint();}}
function move(kind,by){const i=HUB.queue.findIndex(q=>q.kind===kind),j=i+by;if(i<0||j<0||j>=HUB.queue.length)return;const a=HUB.queue.splice(i,1)[0];HUB.queue.splice(j,0,a);save();paint();}
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
async function pump(){load();if(HUB.working||HUB.active||!HUB.queue.length||Date.now()<HUB.cooldownUntil)return;
 if(!acquire())return;
 const next=HUB.queue.shift();HUB.active={kind:next.kind,params:next.params,started:Date.now(),leaseLost:false};HUB.working=true;save();paint();
 try{const value=await execute(next);if(HUB.active.leaseLost)throw new Error('Worker ownership changed');note(next.kind,'complete','Finished');HUB.waiters[next.kind]?.resolve(value);}
 catch(e){console.warn('v428 '+next.kind,e);note(next.kind,'failed',String(e.message||e));HUB.waiters[next.kind]?.reject(e);}
 finally{delete HUB.waiters[next.kind];const hadWork=HUB.active!==null;HUB.active=null;HUB.working=false;release();if(hadWork)HUB.cooldownUntil=Date.now()+Math.max(30,Math.min(600,Number(prefs().cooldownSeconds)||60))*1000;save();paint();}
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
 const detail=state==='queued'?'Queue position '+(order+1):state==='running'?(p.total?p.at.toLocaleString()+' / '+p.total.toLocaleString():'Checking providers'):state==='review'?'Manual review pending':state==='paused'?'Progress saved':state==='cooldown'?'Respecting API limits':HUB.last[kind]?.message||'Ready to start';
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
function paint(){if(!document.body)return;load();const v=prefs().visibility,exists=HUB.active||HUB.queue.length||Date.now()<HUB.cooldownUntil||KINDS.some(k=>['paused','review','running'].includes(phase(k)));
 let el=document.getElementById('mf428-hub');if(v==='hidden'||(v==='auto'&&!exists)){el?.remove();HUB.lastMarkup='';return;}
 if(!el){el=document.createElement('aside');el.id='mf428-hub';el.setAttribute('aria-label','Background Processes');document.body.appendChild(el);}
 const cooldown=Math.max(0,Math.ceil((HUB.cooldownUntil-Date.now())/1000));
 el.className='mf428-hub'+(HUB.expanded?' mf428-open':'');
 const markup='<button type="button" class="mf428-pill" onclick="App.mf428Toggle()" aria-expanded="'+HUB.expanded+'"><span class="mf428-pulse" aria-hidden="true"></span><span><strong>Background Processes</strong><small>'+(HUB.active?LABELS[HUB.active.kind]+' running':HUB.queue.length?HUB.queue.length+' queued':cooldown?'Cooldown · '+cooldown+'s':'All systems idle')+'</small></span><span aria-hidden="true">'+(HUB.expanded?'▾':'▴')+'</span></button>'+
 (HUB.expanded?'<section class="mf428-panel" aria-label="Process controls"><div class="mf428-panel-title"><strong>Recovery & Release Center</strong><small>Only one process runs at a time</small></div>'+KINDS.map(row).join('')+'<div class="mf428-footer"><span>◈ '+(cooldown?'Shared cooldown: '+cooldown+'s':'Smart rate-limit scheduling')+'</span><button type="button" onclick="App.mf428SetVisibility(\'hidden\')">Hide widget</button></div></section>':'');
 if(HUB.lastMarkup!==markup){const panel=el.querySelector('.mf428-panel'),scroll=panel?.scrollTop||0;el.innerHTML=markup;const next=el.querySelector('.mf428-panel');if(next)next.scrollTop=scroll;HUB.lastMarkup=markup;}
}
function settingsHtml(){const selected=prefs().visibility;
 return '<div class="mf428-widget-settings"><strong>Background Processes Widget</strong><p>Monitor Cover Recovery, Metadata Recovery and Fresh Releases, or start them from an always-visible launcher.</p><label for="mf428-visibility">Widget visibility</label><select id="mf428-visibility" onchange="App.mf428SetVisibility(this.value)">'+[['hidden','Hidden'],['auto','Automatic — show for background work'],['always','Always Show — launcher and progress']].map(a=>'<option value="'+a[0]+'" '+(selected===a[0]?'selected':'')+'>'+a[1]+'</option>').join('')+'</select><p class="hint">Hiding does not stop tasks. Browser-closed work resumes from saved checkpoints when supported.</p></div>';
}
if(typeof v405FloatingSettingsHtml==='function'){
 const previous=v405FloatingSettingsHtml;v405FloatingSettingsHtml=function(){return previous.apply(this,arguments)+settingsHtml();};
}
Object.assign(App,{mf428Start:start,mf428Toggle:()=>{HUB.expanded=!HUB.expanded;paint();},mf428SetVisibility:v=>{if(['hidden','auto','always'].includes(v))persistPrefs({visibility:v});},mf428Move:move,mf428Cancel:cancel,mf428Control:control,mf428Queue:enqueue});
window.MediaFlowV428Hub={enqueue,paint,phase,progress,registerMetadata:(fn)=>{HUB.metadataRunner=fn;pump();},registerFresh:(fn)=>{HUB.freshRunner=fn;pump();},runLegacyFresh:(options)=>nativeFresh?nativeFresh(options||{force:true}):Promise.resolve(null),status:()=>({active:HUB.active?.kind||null,queued:HUB.queue.map(x=>x.kind),cooldownUntil:HUB.cooldownUntil})};
function init(){load();if(!HUB.ticker)HUB.ticker=setInterval(()=>{if(HUB.loadedFor!==account())load();renew();pump();if(!HUB.renderQueued){HUB.renderQueued=true;paint();HUB.renderQueued=false;}},1500);paint();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.addEventListener('storage',e=>{if(e.key===leaseKey()&&HUB.active&&!leaseHeld()){HUB.active.leaseLost=true;if(HUB.active.kind==='cover'&&MF424.job)MF424.job.pauseRequested=true;}});
window.addEventListener('pagehide',release);
})();