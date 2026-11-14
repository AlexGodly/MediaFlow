/* MediaFlow v475 — PWA installer/login handoff hardening.
 * Never activate/reload a PWA while an account is still hydrating or the
 * cloud-recovery guard is active. Save fully before any manual worker switch.
 * The primary auth/initial session race fix is in core/rendering/035. */
const MF475_UPDATE_MIN_READY=()=>Boolean(
  AUTH_USER?.id&&AUTH_READY&&V475_AUTH.hydrated===true&&!V475_AUTH.restoring&&
  !V115_STARTUP_GUARD&&!V475_AUTH.bootPromise
);
async function mf475PrepareAppTransition(){
  if(!MF475_UPDATE_MIN_READY()){
    try{showToast('MediaFlow is still restoring your account. Wait for your Library to load before updating.');}catch(_){}
    return false;
  }
  // v250's cloud save awaits the same serialized saveQueue as Sync Now.
  // Explicitly check the guard first: saveState() legitimately returns false
  // under protected startup, which older callers mistook for a successful save.
  if(typeof v250SaveStateBeforeAppTransition==='function'){
    const result=await v250SaveStateBeforeAppTransition();
    if(result!==true)return false;
  }else{
    try{
      const result=await saveState();
      await saveQueue;
      if(result===false||(typeof lastSaveFailed!=='undefined'&&lastSaveFailed))return false;
    }catch(err){console.warn('v475 app transition save failed',err);return false;}
  }
  return MF475_UPDATE_MIN_READY();
}
const mf475PwaReloadBase=v246ReloadPwa;
v246ReloadPwa=async function(){
  if(!await mf475PrepareAppTransition())return false;
  return mf475PwaReloadBase.apply(this,arguments);
};
App.v246ReloadPwa=v246ReloadPwa;
if(window.MediaFlowPWA)window.MediaFlowPWA.reload=v246ReloadPwa;
const mf475PwaApplyBase=v244ApplyPwaUpdate;
v244ApplyPwaUpdate=async function(){
  if(!await mf475PrepareAppTransition())return false;
  return mf475PwaApplyBase.apply(this,arguments);
};
App.v244ApplyPwaUpdate=v244ApplyPwaUpdate;
if(window.MediaFlowPWA)window.MediaFlowPWA.applyUpdate=v244ApplyPwaUpdate;
const mf475InstallBase=v248InstallLatestUpdate;
v248InstallLatestUpdate=async function(manual=true){
  if(!MF475_UPDATE_MIN_READY()){
    // Autoupdate waits for next healthy hosted/PWA update check; it must never
    // reload an anonymous or pre-hydration shell with blank account state.
    if(manual)try{showToast('Finish restoring your cloud account before installing the update.');}catch(_){}
    return false;
  }
  return mf475InstallBase.apply(this,arguments);
};
App.v248InstallLatestUpdate=v248InstallLatestUpdate;
if(window.MediaFlowPWA)window.MediaFlowPWA.installLatestUpdate=v248InstallLatestUpdate;
window.MediaFlowV475=Object.freeze({version:475,canUpdate:MF475_UPDATE_MIN_READY,
  saveBeforeUpdate:mf475PrepareAppTransition});
MediaFlowRuntime.version=475;
