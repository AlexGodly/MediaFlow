/* MediaFlow v469 — Mobile floating-control collision avoidance.
 * A compact Background Processes launcher lives below the mobile header,
 * not in the same bottom-right lane as Task Progress and the + quick dock.
 * The open recovery panel has a measured height ceiling above either the
 * compact dock or the expanded task panel. While + action sheet is open,
 * temporarily hide the recovery launcher (jobs keep running normally).
 * Desktop and all recovery data/settings remain unchanged.
 */
const MF469_VERSION=469;
const MF469_MOBILE_QUERY='(max-width:720px)';
const MF469={pending:false,lastRoom:null,lastMenu:false,observedDock:null,observedProgress:null};
function mf469Mobile(){return !!window.matchMedia?.(MF469_MOBILE_QUERY)?.matches;}
function mf469VisibleBox(el){
 if(!el||el.hidden||!el.getClientRects?.().length)return null;
 const r=el.getBoundingClientRect();
 return Number.isFinite(r.top)&&r.width>0&&r.height>0?r:null;
}
function mf469Layout(){
 const widget=document.getElementById('mf441-process-widget');
 // The body flag also protects freshly re-created widgets during menu open.
 const plusOpen=!!(typeof MF397!=='undefined'&&MF397.open)||
  !!document.getElementById('mf397-fan')?.classList.contains('open');
 document.body?.classList.toggle('mf469-actions-open',mf469Mobile()&&plusOpen);
 if(!widget){MF469.lastRoom=null;return {mobile:mf469Mobile(),widget:false,plusOpen};}
 if(!mf469Mobile()){
  widget.classList.remove('mf469-no-room');
  widget.style.removeProperty('--mf469-room');
  MF469.lastRoom=null;
  return {mobile:false,widget:true,plusOpen};
 }
 const rect=widget.getBoundingClientRect();
 const viewport=window.visualViewport?.height||window.innerHeight;
 // Keep a bottom-safe lane for the mobile floating task/+ controls,
 // including the optional expanded task panel, not just their closed dock.
 const dock=mf469VisibleBox(document.getElementById('mf397-dock'));
 const progress=document.getElementById('mf397-progress');
 const expanded=progress&&!progress.classList.contains('compact')?
  mf469VisibleBox(progress):null;
 let ceiling=viewport-15;
 if(dock)ceiling=Math.min(ceiling,dock.top);
 if(expanded)ceiling=Math.min(ceiling,expanded.top);
 const room=Math.max(0,Math.floor(Math.min(viewport*0.61,ceiling-rect.top-14)));
 widget.style.setProperty('--mf469-room',room+'px');
 // A 52px launcher will not fit if a tiny landscape viewport already has
 // the expanded task panel at the top. Hide only the visual launcher then.
 widget.classList.toggle('mf469-no-room',room<54);
 MF469.lastRoom=room;MF469.lastMenu=plusOpen;
 return {mobile:true,widget:true,room,plusOpen,expandedTask:!!expanded,
  dockTop:dock?.top??null,progressTop:expanded?.top??null};
}
function mf469Schedule(){
 if(MF469.pending)return;
 MF469.pending=true;
 requestAnimationFrame(()=>{
  MF469.pending=false;
  mf469Layout();
 });
}
const mf469BackgroundPaintBase=mf441Paint;
mf441Paint=function(){
 const result=mf469BackgroundPaintBase.apply(this,arguments);
 mf469Schedule();
 return result;
};
const mf469DockUpdateBase=mf397Update;
mf397Update=function(){
 const result=mf469DockUpdateBase.apply(this,arguments);
 mf469ObserveDock();mf469Schedule();
 return result;
};
const mf469DockMenuBase=mf397SetMenu;
mf397SetMenu=function(){
 const result=mf469DockMenuBase.apply(this,arguments);
 mf469Schedule();
 return result;
};
// Resize events also cover orientation/keyboard transitions and device
// rotation. Watching the dock sizes catches task expansion without polling.
function mf469ObserveDock(){
 if(!MF469.observer)return;
 const dock=document.getElementById('mf397-dock');
 const progress=document.getElementById('mf397-progress');
 if(dock&&dock!==MF469.observedDock){
  if(MF469.observedDock)MF469.observer.unobserve(MF469.observedDock);
  MF469.observer.observe(dock);MF469.observedDock=dock;
 }
 if(progress&&progress!==MF469.observedProgress){
  if(MF469.observedProgress)MF469.observer.unobserve(MF469.observedProgress);
  MF469.observer.observe(progress);MF469.observedProgress=progress;
 }
}
if(typeof ResizeObserver==='function')
 MF469.observer=new ResizeObserver(()=>mf469Schedule());
const mf469ShellBase=renderShell;
renderShell=function(){
 const result=mf469ShellBase.apply(this,arguments);
 mf469ObserveDock();mf469Schedule();
 return result;
};
window.addEventListener('resize',mf469Schedule,{passive:true});
window.addEventListener('orientationchange',mf469Schedule,{passive:true});
window.visualViewport?.addEventListener('resize',mf469Schedule,{passive:true});
window.visualViewport?.addEventListener('scroll',mf469Schedule,{passive:true});
window.MediaFlowV469=Object.freeze({version:MF469_VERSION,mobile:mf469Mobile,
 layout:mf469Layout,schedule:mf469Schedule,last:()=>({room:MF469.lastRoom,plusOpen:MF469.lastMenu})});
MediaFlowRuntime.version=MF469_VERSION;
