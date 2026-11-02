/* MediaFlow v555 — interface updates.
 *  - Top bar: icon-only Sync, plus a one-click Full Backup export.
 *  - Full Backup export no longer freezes large accounts.
 *  - "Add to Logging" opens the real Logging workspace in a popup on any page.
 *  - Background Processes: minimise to an icon by the + button, drag anywhere.
 *  - On This Day: recover covers/metadata for today's titles in one click.
 * Presentation and navigation only: Logging, recovery and backup keep using
 * their existing save, XP and validation paths.
 */
const MF555UI={logPopup:{open:false,inBase:false,scroll:0,returnFocus:null},
  proc:{minimized:false,x:null,y:null,lastActive:0,flashUntil:0,drag:null,suppressClick:false}};
const MF555_SVG=d=>'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
const MF555_ICON={
  minimize:MF555_SVG('<path d="M5 12h14"/>'),
  close:MF555_SVG('<path d="M6 6l12 12M18 6 6 18"/>'),
  layers:MF555_SVG('<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>'),
  check:MF555_SVG('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  recover:MF555_SVG('<path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/><path d="M9 12l2 2 4-4"/>')
};

/* ---------- Full Backup: same file, built without freezing the page ---------- */
const mf555ExportJSONBase=App.exportJSON;
App.exportJSON=function(){
  const big=(S.library?.length||0)+(S.sessions?.length||0)>20000;
  if(!big||MF555_SAVE.workerFailed)return mf555ExportJSONBase.apply(this,arguments);
  showDataProgress('Exporting complete MediaFlow backup','Auditing and packing all persistent MediaFlow data…',8);
  setTimeout(async()=>{
    try{
      const payload=v148BuildFullBackup();
      const now=new Date(payload.exportedAt);
      const pad=n=>String(n).padStart(2,'0');
      const stamp=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
      updateDataProgress(55,'Packing Library, History, progression, Order, themes and local queues…');
      // Same JSON content; compact and written in slices for very large accounts.
      const parts=await mf555StringifyParts(payload);
      updateDataProgress(88,'Creating complete backup download…');
      triggerDownload(new Blob(parts,{type:'application/json'}),`MediaFlow_Backup_${stamp}.json`);
      const c=payload.backupManifest?.counts||{};
      finishDataProgress(true,'Export successful',
        `Complete v${payload.mediaFlowVersion} backup · ${(c.libraryTitles||0).toLocaleString()} titles · ${(c.historyLogs||0).toLocaleString()} logs · ${(c.personalOrderTitles||0).toLocaleString()} ordered`);
    }catch(e){console.error(e);finishDataProgress(false,'Export failed','MediaFlow could not create the complete backup file.');}
  },40);
};
// One-click backup from the top bar: waits for a running sync to finish so the
// file never captures a half-merged state.
App.mf555ExportFullBackup=async function(){
  if(!AUTH_READY||V115_STARTUP_GUARD){showToast('Finish loading MediaFlow before exporting a backup.');return false;}
  let waited=0;
  while(typeof V134_HEAVY_OPERATION!=='undefined'&&V134_HEAVY_OPERATION&&waited<60000){
    if(!waited)showToast('Waiting for '+(V134_HEAVY_OPERATION==='xp'?'Calculate XP':'Sync Now')+' to finish…');
    await new Promise(r=>setTimeout(r,500));waited+=500;
  }
  App.exportJSON();
  return true;
};
if(window.MediaFlowV260Bridge)window.MediaFlowV260Bridge.exportFullBackup=()=>App.mf555ExportFullBackup();
if(window.MediaFlowV261Bridge)window.MediaFlowV261Bridge.exportFullBackup=()=>App.mf555ExportFullBackup();
// Fallback top bar (used only if React cannot load): same two icon buttons.
function mf555TopbarFallback(){
  for(const actions of document.querySelectorAll('.v260-topbar-fallback .v260-topbar-actions')){
    if(actions.dataset.mf555)continue;actions.dataset.mf555='1';
    actions.innerHTML='<button type="button" class="btn btn-sm v555-icon-btn v555-backup-btn" onclick="App.mf555ExportFullBackup()" aria-label="Export full backup" title="Export full backup">'+mf425Icon('download',16)+'</button>'+
      '<button type="button" class="btn btn-sm v555-icon-btn v555-sync-btn" onclick="App.syncNow()" aria-label="Sync now" title="Sync now">'+mf425Icon('refresh',16)+'</button>';
  }
}

/* ---------- Logging popup: the real Logging workspace on any page ---------- */
const mf555RenderLogFormBase=renderLogForm;
renderLogForm=function(t,cat){
  const pop=MF555UI.logPopup;
  // While the popup is open, the Dashboard's copy steps aside so the workspace
  // exists exactly once (shared draft, unique element IDs).
  if(pop.open&&pop.inBase)return '<div class="mf555-log-placeholder">'+MF555_ICON.layers+
    '<span>Logging is open in a window.</span><button type="button" class="btn btn-sm" onclick="App.mf555FocusLogPopup()">Show</button></div>';
  return mf555RenderLogFormBase.apply(this,arguments);
};
function mf555LogPopupEl(){return document.getElementById('mf555-log-popup');}
function mf555PaintLogPopup(){
  const pop=MF555UI.logPopup;
  const old=mf555LogPopupEl();
  const t=S.currentTask,cat=t?getCategory(t.categoryId):null;
  if(!pop.open||!S.logging||!t||!cat){
    if(old){old.remove();document.body.classList.remove('mf555-log-popup-open');}
    if(pop.open&&(!S.logging||!t)){pop.open=false;pop.returnFocus?.focus?.({preventScroll:true});}
    return;
  }
  const scroll=old?.querySelector('.mf555-log-body')?.scrollTop||0;
  const active=document.activeElement,activeId=old?.contains(active)?active.id:'';
  const caret=activeId&&typeof active.selectionStart==='number'?[active.selectionStart,active.selectionEnd]:null;
  const wrap=document.createElement('div');
  wrap.innerHTML='<div class="mf555-log-popup" id="mf555-log-popup" role="dialog" aria-modal="true" aria-labelledby="mf555-log-title">'+
    '<div class="mf555-log-backdrop" onclick="App.mf555CloseLogPopup()"></div>'+
    '<section class="mf555-log-sheet">'+
      '<header class="mf555-log-head"><div><strong id="mf555-log-title">Logging</strong><small>'+escapeHtml(cat.name)+' · draft saved as you go</small></div>'+
      '<button type="button" class="btn btn-sm v555-icon-btn" onclick="App.mf555CloseLogPopup()" aria-label="Close Logging (draft is kept)" title="Close (draft is kept)">'+MF555_ICON.close+'</button></header>'+
      '<div class="mf555-log-body"><div class="hero mf555-log-hero">'+mf555RenderLogFormBase(t,cat)+'</div></div>'+
    '</section></div>';
  const fresh=wrap.firstElementChild;
  if(old)old.replaceWith(fresh);else document.body.appendChild(fresh);
  document.body.classList.add('mf555-log-popup-open');
  fresh.querySelector('.mf555-log-body').scrollTop=scroll;
  if(activeId){const el=document.getElementById(activeId);if(el&&fresh.contains(el)){el.focus({preventScroll:true});if(caret&&typeof el.setSelectionRange==='function')try{el.setSelectionRange(caret[0],caret[1]);}catch(_){}}}
  // Suggestions are filled after render by the Logging picker.
  requestAnimationFrame(()=>{try{if(mf555LogPopupEl())renderLogSuggestions();}catch(_){}});
}
const mf555RenderViewBase=renderView;
renderView=function(){
  const pop=MF555UI.logPopup;
  pop.inBase=true;
  let out;
  try{out=mf555RenderViewBase.apply(this,arguments);}finally{pop.inBase=false;}
  mf555PaintLogPopup();
  mf555TopbarFallback();
  return out;
};
App.mf555OpenLogPopup=function(){
  const pop=MF555UI.logPopup;
  if(!S.currentTask||!S.sessionActive)App.startSession();
  if(!S.currentTask){showToast('Create or start a task to use Logging.');return;}
  pop.returnFocus=document.activeElement;
  pop.open=true;
  if(!S.logging)App.openLogForm();else render();
  if(S.logDraft)S.logDraft.v379HideAddedTitles=false;
  requestAnimationFrame(()=>{
    try{renderLogSuggestions();}catch(_){}
    const el=mf555LogPopupEl();
    const search=el?.querySelector('#entry-title,input[type="search"],.log-form input[type="text"]');
    (search||el?.querySelector('button'))?.focus?.({preventScroll:true});
  });
};
App.mf555CloseLogPopup=function(){
  const pop=MF555UI.logPopup;
  if(!pop.open)return;
  pop.open=false;
  // The draft stays exactly as it is (S.logDraft untouched); the Dashboard shows it.
  render();
  pop.returnFocus?.focus?.({preventScroll:true});
};
App.mf555FocusLogPopup=function(){mf555LogPopupEl()?.querySelector('.mf555-log-body')?.focus?.();};
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape'||!MF555UI.logPopup.open)return;
  // An inner dialog (title editor, confirm) closes first.
  if(document.querySelector('#modal-root .modal-overlay,.mf274-overlay:not([hidden])'))return;
  e.preventDefault();App.mf555CloseLogPopup();
});
const mf555DockActionBase=mf397Action;
mf397Action=function(action){
  if(action==='logging'){mf397SetMenu(false);App.mf555OpenLogPopup();return;}
  return mf555DockActionBase.apply(this,arguments);
};

/* ---------- Background Processes: minimise + drag ---------- */
const MF555_PROC_KEY='mediaflow-v555-process-widget';
try{Object.assign(MF555UI.proc,JSON.parse(localStorage.getItem(MF555_PROC_KEY)||'{}'));}catch(_){}
function mf555ProcSave(){
  const p=MF555UI.proc;
  try{localStorage.setItem(MF555_PROC_KEY,JSON.stringify({minimized:!!p.minimized,x:p.x,y:p.y}));}catch(_){}
}
function mf555ProcClamp(el,x,y){
  const r=el.getBoundingClientRect(),m=8;
  return [Math.min(Math.max(m,x),Math.max(m,innerWidth-r.width-m)),Math.min(Math.max(m,y),Math.max(m,innerHeight-r.height-m))];
}
function mf555ProcPlace(){
  const w=document.getElementById('mf441-process-widget'),p=MF555UI.proc;
  if(!w)return;
  const dragged=p.x!=null&&p.y!=null&&!p.minimized;
  w.classList.toggle('mf555-dragged',dragged);
  if(dragged){
    w.classList.remove('mf469-no-room');
    w.style.setProperty('left',p.x+'px','important');w.style.setProperty('top',p.y+'px','important');
    w.style.setProperty('right','auto','important');w.style.setProperty('bottom','auto','important');
    const [x,y]=mf555ProcClamp(w,p.x,p.y);
    if(x!==p.x||y!==p.y){w.style.setProperty('left',x+'px','important');w.style.setProperty('top',y+'px','important');}
  }else for(const k of ['left','top','right','bottom'])if(w.style.getPropertyPriority(k)==='important')w.style.removeProperty(k);
}
function mf555ProcMini(state){
  const p=MF555UI.proc;
  let mini=document.getElementById('mf555-proc-mini');
  const widget=document.getElementById('mf441-process-widget');
  if(!p.minimized||!widget){mini?.remove();document.body.classList.remove('mf555-proc-minimized');return;}
  document.body.classList.add('mf555-proc-minimized');
  const cover=Number(state.coverPct)||0,meta=Number(state.metaPct)||0;
  const parts=[state.cover&&'Covers '+cover+'%',state.metadata&&'Metadata '+meta+'%'].filter(Boolean);
  const jobs=[state.cover?cover:null,state.metadata?meta:null].filter(v=>v!=null);
  const pct=jobs.length?Math.round(jobs.reduce((a,b)=>a+b,0)/jobs.length):0;
  const done=Date.now()<p.flashUntil;
  const label='Background Processes: '+(parts.join(' · ')||'no active jobs')+'. Click to open.';
  const html='<button type="button" class="mf555-proc-mini'+(done?' is-done':'')+(state.activeCount?' is-active':'')+'" id="mf555-proc-mini" onclick="App.mf555RestoreProcesses()" aria-label="'+escapeHtml(label)+'" title="'+escapeHtml(parts.join(' · ')||'Background Processes')+'">'+
    '<span class="mf555-proc-bar" aria-hidden="true"><i style="width:'+pct+'%"></i></span>'+
    '<span class="mf555-proc-icon">'+(done?MF555_ICON.check:MF555_ICON.layers)+'</span></button>';
  if(mini)mini.outerHTML=html;else document.body.insertAdjacentHTML('beforeend',html);
  mf555ProcMiniPlace();
}
function mf555ProcMiniPlace(){
  const mini=document.getElementById('mf555-proc-mini'),fab=document.getElementById('mf397-fab');
  if(!mini)return;
  const r=mini.getBoundingClientRect();
  let right=16,bottom=16;
  if(fab){
    const f=fab.getBoundingClientRect();
    right=Math.max(8,innerWidth-f.left+12);bottom=Math.max(8,innerHeight-f.bottom+(f.height-r.height)/2);
    // Beside the task-progress card instead of on top of it.
    const task=document.getElementById('mf397-progress');
    if(task&&!task.hidden&&task.offsetParent){
      const t=task.getBoundingClientRect();
      const left=innerWidth-right-r.width,top=innerHeight-bottom-r.height;
      if(left<t.right&&left+r.width>t.left&&top<t.bottom&&top+r.height>t.top)bottom=Math.max(bottom,innerHeight-t.top+10);
    }
  }
  mini.style.right=right+'px';mini.style.bottom=bottom+'px';
}
App.mf555MinimizeProcesses=function(){MF555UI.proc.minimized=true;mf555ProcSave();mf441Paint();};
App.mf555RestoreProcesses=function(){MF555UI.proc.minimized=false;mf555ProcSave();mf441Paint();
  requestAnimationFrame(()=>document.querySelector('#mf441-process-widget .mf555-proc-minimize')?.focus?.({preventScroll:true}));};
function mf555ProcDecorate(){
  const w=document.getElementById('mf441-process-widget');
  if(!w)return;
  if(!w.querySelector('.mf555-proc-minimize'))
    w.insertAdjacentHTML('beforeend','<button type="button" class="mf555-proc-minimize" onclick="App.mf555MinimizeProcesses()" aria-label="Minimize Background Processes" title="Minimize">'+MF555_ICON.minimize+'</button>');
  const handle=w.querySelector('.mf441-widget-toggle');
  if(handle&&!handle.dataset.mf555Drag){
    handle.dataset.mf555Drag='1';
    handle.title='Drag to move · double-click to reset position';
    handle.addEventListener('pointerdown',mf555ProcDown);
    handle.addEventListener('click',e=>{if(MF555UI.proc.suppressClick){e.preventDefault();e.stopImmediatePropagation();MF555UI.proc.suppressClick=false;}},true);
  }
}
// Double-click the header to reset the position. Each click toggles and
// repaints the widget, which can move it, so the second click is matched by
// time and screen position (not element) and never reaches the page below.
let MF555_PROC_LASTCLICK={t:0,x:0,y:0};
document.addEventListener('click',e=>{
  const onHeader=!!e.target.closest?.('#mf441-process-widget .mf476-widget-symbol,#mf441-process-widget .mf476-widget-name,#mf441-process-widget .mf441-widget-symbol,#mf441-process-widget .mf441-widget-name');
  const last=MF555_PROC_LASTCLICK,now=Date.now();
  if(now-last.t<450&&Math.abs(e.clientX-last.x)<12&&Math.abs(e.clientY-last.y)<12){
    MF555_PROC_LASTCLICK={t:0,x:0,y:0};
    if(!onHeader){e.preventDefault();e.stopImmediatePropagation();}
    MF555UI.proc.x=null;MF555UI.proc.y=null;mf555ProcSave();
    requestAnimationFrame(()=>mf441Paint());
    return;
  }
  MF555_PROC_LASTCLICK=onHeader?{t:now,x:e.clientX,y:e.clientY}:{t:0,x:0,y:0};
},true);
function mf555ProcDown(e){
  if(e.button!==0)return;
  // Drag by the header only: the icon and the title.
  if(!e.target.closest('.mf476-widget-symbol,.mf476-widget-name,.mf441-widget-symbol,.mf441-widget-name'))return;
  const w=document.getElementById('mf441-process-widget');if(!w)return;
  const r=w.getBoundingClientRect();
  MF555UI.proc.drag={id:e.pointerId,sx:e.clientX,sy:e.clientY,ox:r.left,oy:r.top,moved:false};
  const move=ev=>{
    const d=MF555UI.proc.drag;if(!d||ev.pointerId!==d.id)return;
    const dx=ev.clientX-d.sx,dy=ev.clientY-d.sy;
    if(!d.moved&&Math.hypot(dx,dy)<6)return;
    d.moved=true;ev.preventDefault();
    const el=document.getElementById('mf441-process-widget');if(!el)return;
    const [x,y]=mf555ProcClamp(el,d.ox+dx,d.oy+dy);
    MF555UI.proc.x=Math.round(x);MF555UI.proc.y=Math.round(y);
    el.classList.add('mf555-dragging');mf555ProcPlace();
  };
  const up=ev=>{
    const d=MF555UI.proc.drag;if(!d||ev.pointerId!==d.id)return;
    removeEventListener('pointermove',move);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);
    document.getElementById('mf441-process-widget')?.classList.remove('mf555-dragging');
    if(d.moved){MF555UI.proc.suppressClick=true;mf555ProcSave();setTimeout(()=>{MF555UI.proc.suppressClick=false;},400);}
    MF555UI.proc.drag=null;
  };
  addEventListener('pointermove',move,{passive:false});addEventListener('pointerup',up);addEventListener('pointercancel',up);
}
const mf555ProcPaintBase=mf441Paint;
mf441Paint=function(){
  // A repaint during a drag would replace the element under the pointer.
  const out=mf555ProcPaintBase.apply(this,arguments);
  const state=mf441State(),p=MF555UI.proc;
  if(p.lastActive>0&&!state.activeCount)p.flashUntil=Date.now()+2200;
  p.lastActive=state.activeCount;
  mf555ProcDecorate();mf555ProcPlace();mf555ProcMini(state);
  if(Date.now()<p.flashUntil)setTimeout(()=>mf555ProcMini(mf441State()),2300);
  return out;
};
const mf555LayoutBase=mf469Layout;
mf469Layout=function(){
  const out=mf555LayoutBase.apply(this,arguments);
  mf555ProcPlace();mf555ProcMiniPlace();
  return out;
};
addEventListener('resize',()=>{mf555ProcPlace();mf555ProcMiniPlace();});

/* ---------- On This Day: recover today's titles ---------- */
function mf555OnThisDayIds(){
  let model=null;
  try{model=v159BuildOnThisDayModel();}catch(_){}
  const ids=[];
  for(const g of model?.groups||[])for(const row of g.rows||[]){
    const id=String(row.libraryId||row.item?.id||'');
    if(id&&mf555ById(id)&&!ids.includes(id))ids.push(id);
  }
  return ids;
}
App.mf555RecoverOnThisDay=function(){
  const ids=mf555OnThisDayIds();
  if(!ids.length){showToast('None of today’s On This Day titles are in your Library.');return;}
  App.mf445Open('cover',{ids,label:'On This Day',entry:'onthisday'});
};
const mf555OtdBase=mf427OnThisDayDashboardHtml;
mf427OnThisDayDashboardHtml=function(){
  const html=String(mf555OtdBase.apply(this,arguments)||'');
  if(!html)return html;
  const count=mf555OnThisDayIds().length;
  if(!count)return html;
  const button='<button type="button" class="btn btn-sm v555-icon-btn mf555-otd-recover" onclick="App.mf555RecoverOnThisDay()" '+
    'aria-label="Recover covers or metadata for '+count+' On This Day title'+(count===1?'':'s')+'" title="Recover covers / metadata for these '+count+' title'+(count===1?'':'s')+'">'+MF555_ICON.recover+'</button>';
  // Right side of the "On This Day" heading.
  return html.replace(/(<div class="mf427-otd-heading">[\s\S]*?<\/div><\/div>)/,(m)=>m.replace(/<\/div>$/,button+'</div>'));
};

window.MediaFlowV555Interface=Object.freeze({version:MF555_VERSION,logPopupOpen:()=>MF555UI.logPopup.open,
  processes:()=>({...MF555UI.proc,drag:null}),onThisDayIds:mf555OnThisDayIds});
MediaFlowRuntime.version=MF555_VERSION;
