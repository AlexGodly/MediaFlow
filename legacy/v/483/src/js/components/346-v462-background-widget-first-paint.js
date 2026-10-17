/* MediaFlow v462 — defer the unified Background Processes widget until
 * the signed-in shell AND authoritative cloud settings are fully hydrated.
 * A pre-hydration v424/v439 paint previously flashed defaults at bottom-right,
 * then vanished or jumped left when the user's saved preferences arrived.
 * This only gates presentation; it never changes jobs, cloud settings or queues.
 */
const MF462_VERSION=462;
const MF462_WIDGET_BOOT={ready:false,epoch:0};

function mf462WidgetCanDisplay(){
 return Boolean(AUTH_USER&&AUTH_READY&&!S.loading&&!V115_STARTUP_GUARD&&
  S.settings&&document.querySelector('#app .sidebar'));
}
function mf462SuspendWidget(){
 MF462_WIDGET_BOOT.ready=false;
 MF462_WIDGET_BOOT.epoch++;
 document.getElementById('mf441-process-widget')?.remove();
 document.body?.classList.remove('mf441-recovery-widget-active');
}
const mf462PaintBase=mf441Paint;
mf441Paint=function(){
 if(!MF462_WIDGET_BOOT.ready||!mf462WidgetCanDisplay()){
  document.getElementById('mf441-process-widget')?.remove();
  document.body?.classList.remove('mf441-recovery-widget-active');
  mf441RefreshSettingsStatus();
  return;
 }
 // v441 reads cloud-backed position/visibility BEFORE DOM insertion; v462
 // CSS hides any transient node until the final placement is committed.
 const result=mf462PaintBase.apply(this,arguments);
 document.getElementById('mf441-process-widget')?.classList.add('mf462-ready');
 return result;
};
function mf462RevealAfterShell(){
 const epoch=++MF462_WIDGET_BOOT.epoch;
 // Two frames ensure the real dashboard has rendered once before the first
 // eligible widget paint. Do not race another login/logout or bootstrap.
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if(epoch!==MF462_WIDGET_BOOT.epoch||!mf462WidgetCanDisplay())return;
  MF462_WIDGET_BOOT.ready=true;
  mf441Paint();
 }));
}
const mf462RenderShellBase=renderShell;
renderShell=function(){
 const result=mf462RenderShellBase.apply(this,arguments);
 if(!MF462_WIDGET_BOOT.ready)mf462RevealAfterShell();
 return result;
};
const mf462BootstrapBase=v115SafeBootstrap;
v115SafeBootstrap=async function(){
 mf462SuspendWidget();
 return mf462BootstrapBase.apply(this,arguments);
};
const mf462StartWithDataBase=v115StartWithData;
v115StartWithData=async function(){
 mf462SuspendWidget();
 return mf462StartWithDataBase.apply(this,arguments);
};
const mf462RenderAuthBase=renderAuthScreen;
renderAuthScreen=function(){
 mf462SuspendWidget();
 return mf462RenderAuthBase.apply(this,arguments);
};
window.MediaFlowV462=Object.freeze({
 version:MF462_VERSION,
 isReady:()=>MF462_WIDGET_BOOT.ready,
 canDisplay:mf462WidgetCanDisplay,
 suspend:mf462SuspendWidget,
 reveal:mf462RevealAfterShell
});
MediaFlowRuntime.version=MF462_VERSION;
