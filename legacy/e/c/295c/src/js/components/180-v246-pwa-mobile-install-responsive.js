/* ============================================================
   MediaFlow v246 — Mobile/Tablet PWA UX + Tight-Width Responsiveness
   ============================================================ */
const V246_RUNTIME_VERSION=246;

function v246PwaIcon(paths){
  return `<span class="v225-btn-icon v246-pwa-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg></span>`;
}
const V246_PWA_ICONS={
  install:v246PwaIcon('<path d="M12 3v11"/><path d="m8 10 4 4 4-4"/><path d="M5 14v6h14v-6"/>'),
  reload:v246PwaIcon('<path d="M20 6v5h-5"/><path d="M19 11a8 8 0 1 0 1 5"/>'),
  update:v246PwaIcon('<path d="M20 7h-5V2"/><path d="M20 7a8 8 0 0 0-14-2"/><path d="M4 17h5v5"/><path d="M4 17a8 8 0 0 0 14 2"/>')
};

Object.assign(V225_BUTTON_ICONS,{
  installPwa:v225IconSvg('<path d="M12 3v11"/><path d="m8 10 4 4 4-4"/><path d="M5 14v6h14v-6"/>'),
  reloadPwa:v225IconSvg('<path d="M20 6v5h-5"/><path d="M19 11a8 8 0 1 0 1 5"/>'),
  checkPwaUpdate:v225IconSvg('<path d="M20 7h-5V2"/><path d="M20 7a8 8 0 0 0-14-2"/><path d="M4 17h5v5"/><path d="M4 17a8 8 0 0 0 14 2"/>')
});
const v246PwaButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(el?.id==='v244-pwa-install')return 'installPwa';
  if(el?.id==='v244-pwa-update')return 'reloadPwa';
  if(el?.id==='v246-pwa-check')return 'checkPwaUpdate';
  return v246PwaButtonIconNameBase(el);
};

function v246PwaPlatform(){
  const ua=String(navigator.userAgent||'');
  const ios=/iPad|iPhone|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const android=/Android/i.test(ua);
  const mobile=/Mobi|Android|iPhone|iPad|iPod/i.test(ua)||Math.min(innerWidth||9999,innerHeight||9999)<700;
  return {ios,android,mobile};
}

function v246PwaInstallHelp(){
  const p=v246PwaPlatform();
  let title='Install MediaFlow';
  let steps='Use your browser menu and choose Install app / Add to Home Screen.';
  if(p.ios)steps='In Safari, tap Share, then choose Add to Home Screen, then confirm Add.';
  else if(p.android)steps='Open the browser menu (⋮), choose Install app or Add to Home screen, then confirm.';
  else steps='Use the install icon in your browser address bar, or open the browser menu and choose Install MediaFlow / Install app.';
  const old=document.getElementById('v246-pwa-help');
  if(old)old.remove();
  const overlay=document.createElement('div');
  overlay.id='v246-pwa-help';
  overlay.className='modal-overlay v246-pwa-help-overlay';
  overlay.innerHTML=`<div class="modal v246-pwa-help-modal" role="dialog" aria-modal="true" aria-labelledby="v246-pwa-help-title">
    <div class="v246-pwa-help-head">
      <img src="assets/icons/mediaflow-192.png" alt="" class="v246-pwa-help-icon">
      <div><div id="v246-pwa-help-title" class="modal-title">${title}</div><div class="hint">MediaFlow is installable on supported phones, tablets and desktop browsers.</div></div>
    </div>
    <div class="v246-pwa-help-steps">${escapeHtml(steps)}</div>
    <div class="modal-actions"><button class="btn btn-primary" data-v225-iconified="1" onclick="document.getElementById('v246-pwa-help')?.remove()">${v246PwaIcon('<path d="m5 12 4 4L19 6"/>')}Got it</button></div>
  </div>`;
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

function v246PwaStatus(){
  if(!v244PwaSupported())return 'PWA installation requires HTTPS. GitHub Pages is supported.';
  if(V244_PWA_STATE.updateReady)return `MediaFlow v${V246_RUNTIME_VERSION} app update is ready. Reload the app to apply it.`;
  if(v244PwaStandalone()||V244_PWA_STATE.installed)return V244_PWA_STATE.offlineReady?'Installed · app shell ready for offline launch.':'Installed as an app.';
  if(V244_PWA_STATE.installPrompt)return V244_PWA_STATE.offlineReady?'Ready to install · app shell cached for offline launch.':'Ready to install.';
  if(V244_PWA_STATE.offlineReady)return 'PWA app shell is ready. Tap Install app for browser-specific install instructions if a native prompt is not available.';
  if(V244_PWA_STATE.error)return `PWA setup could not finish: ${String(V244_PWA_STATE.error)}`;
  return 'Preparing installable app support…';
}

v244PwaStatus=v246PwaStatus;

function v246PwaSettingsHtml(){
  const installed=v244PwaStandalone()||V244_PWA_STATE.installed;
  return `<div class="card v244-pwa-card v246-pwa-card" style="margin-bottom:22px">
    <div class="v244-pwa-card-main">
      <div class="v244-pwa-mark v246-pwa-mark" aria-hidden="true"><img src="assets/icons/mediaflow-192.png" alt=""></div>
      <div class="v244-pwa-copy">
        <b>Install MediaFlow</b>
        <div class="hint">Install MediaFlow as a Progressive Web App on desktop, tablet or mobile. The installed app follows MediaFlow's responsive layout and checks the service worker for future releases.</div>
        <div id="v244-pwa-status" class="v244-pwa-status">${v246PwaStatus()}</div>
      </div>
    </div>
    <div class="v244-pwa-actions v246-pwa-actions">
      <button id="v244-pwa-install" class="btn btn-sm btn-primary" data-v225-iconified="1" ${installed?'disabled':''} onclick="App.v244InstallPwa()">${V246_PWA_ICONS.install}<span>${installed?'Installed':'Install app'}</span></button>
      <button id="v244-pwa-update" class="btn btn-sm" data-v225-iconified="1" onclick="App.v246ReloadPwa()">${V246_PWA_ICONS.reload}<span>${V244_PWA_STATE.updateReady?'Reload update':'Reload app'}</span></button>
      <button id="v246-pwa-check" class="btn btn-sm btn-ghost" data-v225-iconified="1" onclick="App.v244CheckPwaUpdate(true)">${V246_PWA_ICONS.update}<span>Check PWA update</span></button>
    </div>
  </div>`;
}

v244PwaSettingsHtml=v246PwaSettingsHtml;

function v246RefreshPwaDom(){
  const status=document.getElementById('v244-pwa-status');
  if(status)status.textContent=v246PwaStatus();
  const install=document.getElementById('v244-pwa-install');
  if(install){
    const installed=v244PwaStandalone()||V244_PWA_STATE.installed;
    install.disabled=installed;
    const label=install.querySelector('span:last-child');
    if(label)label.textContent=installed?'Installed':'Install app';
  }
  const update=document.getElementById('v244-pwa-update');
  if(update){
    update.disabled=false;
    const label=update.querySelector('span:last-child');
    if(label)label.textContent=V244_PWA_STATE.updateReady?'Reload update':'Reload app';
  }
  const check=document.getElementById('v246-pwa-check');
  if(check)check.disabled=false;
}

v244RefreshPwaDom=v246RefreshPwaDom;

const v246BaseInstallPwa=v244InstallPwa;
v244InstallPwa=async function(){
  if(v244PwaStandalone()||V244_PWA_STATE.installed){
    try{showToast('MediaFlow is already installed');}catch(_){ }
    return true;
  }
  if(V244_PWA_STATE.installPrompt)return v246BaseInstallPwa.apply(this,arguments);
  // The native install prompt is browser-controlled and is not available on
  // every mobile/tablet browser (notably iOS Safari). Keep the button useful.
  await v244RegisterPwa().catch(()=>null);
  if(V244_PWA_STATE.installPrompt)return v246BaseInstallPwa.apply(this,arguments);
  v246PwaInstallHelp();
  return false;
};

async function v246ReloadPwa(){
  try{
    const reg=V244_PWA_STATE.registration||await v244RegisterPwa();
    if(reg){
      await reg.update().catch(()=>{});
      if(reg.waiting){
        V244_PWA_STATE.applyingUpdate=true;
        reg.waiting.postMessage({type:'SKIP_WAITING'});
        return true;
      }
    }
  }catch(_){ }
  // Reload is always a real action even when no newer worker is waiting.
  location.reload();
  return true;
}

// Keep the original public API names functional for existing settings markup.
App.v244InstallPwa=v244InstallPwa;
App.v244PwaSettingsHtml=v244PwaSettingsHtml;
App.v246ReloadPwa=v246ReloadPwa;
window.MediaFlowPWA.install=v244InstallPwa;
window.MediaFlowPWA.reload=v246ReloadPwa;

function v246ApplyViewportClass(){
  const w=Math.max(0,Math.round(window.visualViewport?.width||window.innerWidth||document.documentElement.clientWidth||0));
  const root=document.documentElement;
  root.dataset.v246Width=String(w);
  root.dataset.v246Viewport=w<=320?'tight':w<=430?'mobile':w<=900?'tablet':'desktop';
  root.dataset.v246Pwa=v244PwaStandalone()?'standalone':'browser';
}
let v246ViewportRaf=0;
function v246ScheduleViewportClass(){
  cancelAnimationFrame(v246ViewportRaf);
  v246ViewportRaf=requestAnimationFrame(v246ApplyViewportClass);
}
v246ApplyViewportClass();
window.addEventListener('resize',v246ScheduleViewportClass,{passive:true});
window.visualViewport?.addEventListener('resize',v246ScheduleViewportClass,{passive:true});

Object.assign(App,{v246ReloadPwa,v246PwaInstallHelp,v246ApplyViewportClass});
MediaFlowRuntime.version=V246_RUNTIME_VERSION;
