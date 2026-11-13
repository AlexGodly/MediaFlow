/* ============================================================
   MediaFlow v244 — Progressive Web App Foundation
   GitHub Pages-compatible install/update lifecycle.
   ============================================================ */

const V244_RUNTIME_VERSION=244;
const V244_PWA_STATE={
  registration:null,
  installPrompt:null,
  installed:false,
  offlineReady:false,
  updateReady:false,
  applyingUpdate:false,
  lastCheckedAt:0,
  error:''
};

function v244PwaStandalone(){
  try{return !!(window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true);}catch(_){return false;}
}

function v244PwaSupported(){
  return 'serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1');
}

function v244PwaStatus(){
  if(!v244PwaSupported())return 'PWA installation requires HTTPS (GitHub Pages is supported).';
  if(V244_PWA_STATE.updateReady)return `MediaFlow v${V244_RUNTIME_VERSION} app update is ready. Reload to apply it.`;
  if(v244PwaStandalone()||V244_PWA_STATE.installed)return V244_PWA_STATE.offlineReady?'Installed as an app · app shell ready for offline launch.':'Installed as an app.';
  if(V244_PWA_STATE.installPrompt)return V244_PWA_STATE.offlineReady?'Ready to install · app shell cached for offline launch.':'Ready to install.';
  if(V244_PWA_STATE.offlineReady)return 'PWA app shell is ready. Use your browser install / Add to Home Screen action if no Install button is shown.';
  if(V244_PWA_STATE.error)return `PWA setup could not finish: ${escapeHtml(String(V244_PWA_STATE.error))}`;
  return 'Preparing installable app support…';
}

function v244PwaSettingsHtml(){
  const installed=v244PwaStandalone()||V244_PWA_STATE.installed;
  const canInstall=!!V244_PWA_STATE.installPrompt&&!installed;
  return `<div class="card v244-pwa-card" style="margin-bottom:22px">
    <div class="v244-pwa-card-main">
      <div class="v244-pwa-mark" aria-hidden="true">⌂</div>
      <div class="v244-pwa-copy">
        <b>Install MediaFlow</b>
        <div class="hint">Install the GitHub Pages build as a Progressive Web App. MediaFlow checks its service worker for each release so future versions can update the installed app without changing your data schemas.</div>
        <div id="v244-pwa-status" class="v244-pwa-status">${v244PwaStatus()}</div>
      </div>
    </div>
    <div class="v244-pwa-actions">
      <button id="v244-pwa-install" class="btn btn-sm btn-primary" ${canInstall?'':'disabled'} onclick="App.v244InstallPwa()">${installed?'Installed':'Install app'}</button>
      <button id="v244-pwa-update" class="btn btn-sm" ${V244_PWA_STATE.updateReady?'':'disabled'} onclick="App.v244ApplyPwaUpdate()">Reload update</button>
      <button class="btn btn-sm btn-ghost" onclick="App.v244CheckPwaUpdate(false)">Check PWA update</button>
    </div>
  </div>`;
}

function v244RefreshPwaDom(){
  const status=document.getElementById('v244-pwa-status');
  if(status)status.textContent=v244PwaStatus().replace(/&[^;]+;/g,'');
  const install=document.getElementById('v244-pwa-install');
  if(install){
    const installed=v244PwaStandalone()||V244_PWA_STATE.installed;
    install.textContent=installed?'Installed':'Install app';
    install.disabled=installed||!V244_PWA_STATE.installPrompt;
  }
  const update=document.getElementById('v244-pwa-update');
  if(update)update.disabled=!V244_PWA_STATE.updateReady;
}

function v244MarkPwaUpdateReady(reg){
  V244_PWA_STATE.registration=reg||V244_PWA_STATE.registration;
  V244_PWA_STATE.updateReady=!!V244_PWA_STATE.registration?.waiting;
  if(V244_PWA_STATE.updateReady){
    try{showToast('A MediaFlow app update is ready');}catch(_){ }
  }
  v244RefreshPwaDom();
}

async function v244RegisterPwa(){
  if(!v244PwaSupported()){
    V244_PWA_STATE.error='unsupported context';
    v244RefreshPwaDom();
    return null;
  }
  try{
    const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
    V244_PWA_STATE.registration=reg;
    V244_PWA_STATE.installed=v244PwaStandalone();
    if(reg.waiting&&navigator.serviceWorker.controller)v244MarkPwaUpdateReady(reg);
    reg.addEventListener('updatefound',()=>{
      const worker=reg.installing;
      if(!worker)return;
      worker.addEventListener('statechange',()=>{
        if(worker.state==='installed'){
          V244_PWA_STATE.offlineReady=true;
          if(navigator.serviceWorker.controller)v244MarkPwaUpdateReady(reg);
          else v244RefreshPwaDom();
        }
      });
    });
    navigator.serviceWorker.ready.then(()=>{
      V244_PWA_STATE.offlineReady=true;
      v244RefreshPwaDom();
    }).catch(()=>{});
    await reg.update().catch(()=>{});
    V244_PWA_STATE.lastCheckedAt=Date.now();
    return reg;
  }catch(err){
    V244_PWA_STATE.error=String(err?.message||err||'registration failed');
    v244RefreshPwaDom();
    return null;
  }
}

async function v244InstallPwa(){
  const promptEvent=V244_PWA_STATE.installPrompt;
  if(!promptEvent){
    try{showToast(v244PwaStandalone()?'MediaFlow is already installed':'Use your browser menu to install MediaFlow / Add to Home Screen');}catch(_){ }
    return false;
  }
  try{
    promptEvent.prompt();
    const choice=await promptEvent.userChoice;
    V244_PWA_STATE.installPrompt=null;
    if(choice?.outcome==='accepted')V244_PWA_STATE.installed=true;
    v244RefreshPwaDom();
    return choice?.outcome==='accepted';
  }catch(err){
    V244_PWA_STATE.error=String(err?.message||err||'install failed');
    v244RefreshPwaDom();
    return false;
  }
}

async function v244CheckPwaUpdate(showFeedback=true){
  try{
    const reg=V244_PWA_STATE.registration||await v244RegisterPwa();
    if(!reg)return false;
    await reg.update();
    V244_PWA_STATE.lastCheckedAt=Date.now();
    v244MarkPwaUpdateReady(reg);
    if(showFeedback&&!V244_PWA_STATE.updateReady){try{showToast('PWA app shell is up to date');}catch(_){ }}
    return V244_PWA_STATE.updateReady;
  }catch(err){
    V244_PWA_STATE.error=String(err?.message||err||'update check failed');
    if(showFeedback){try{showToast('Could not check the PWA update right now');}catch(_){ }}
    v244RefreshPwaDom();
    return false;
  }
}

async function v244ApplyPwaUpdate(){
  const reg=V244_PWA_STATE.registration||await v244RegisterPwa();
  if(!reg)return false;
  if(!reg.waiting){
    await v244CheckPwaUpdate(false);
  }
  if(!reg.waiting){
    try{showToast('No PWA update is waiting');}catch(_){ }
    return false;
  }
  V244_PWA_STATE.applyingUpdate=true;
  reg.waiting.postMessage({type:'SKIP_WAITING'});
  return true;
}

window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  V244_PWA_STATE.installPrompt=event;
  v244RefreshPwaDom();
});

window.addEventListener('appinstalled',()=>{
  V244_PWA_STATE.installPrompt=null;
  V244_PWA_STATE.installed=true;
  v244RefreshPwaDom();
  try{showToast('MediaFlow installed');}catch(_){ }
});

if('serviceWorker' in navigator){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    V244_PWA_STATE.offlineReady=true;
    if(V244_PWA_STATE.applyingUpdate){
      V244_PWA_STATE.applyingUpdate=false;
      location.reload();
    }else{
      v244RefreshPwaDom();
    }
  });
  navigator.serviceWorker.addEventListener('message',event=>{
    if(event.data?.type==='MEDIAFLOW_SW_ACTIVATED'){
      V244_PWA_STATE.offlineReady=true;
      v244RefreshPwaDom();
    }
  });
}

window.addEventListener('online',()=>v244CheckPwaUpdate(false));
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'&&Date.now()-V244_PWA_STATE.lastCheckedAt>15*60*1000)v244CheckPwaUpdate(false);
});

const v244UpdateSettingsHtmlBase=v161UpdateSettingsHtml;
v161UpdateSettingsHtml=function(){
  return v244UpdateSettingsHtmlBase.apply(this,arguments)+v244PwaSettingsHtml();
};

// Keep the existing v161 hosted-build checker useful for installed PWA users too.
const v244CheckHostedUpdateBase=v161CheckForUpdates;
v161CheckForUpdates=async function(){
  const out=await v244CheckHostedUpdateBase.apply(this,arguments);
  v244CheckPwaUpdate(false);
  return out;
};
App.v161CheckForUpdates=v161CheckForUpdates;

Object.assign(App,{
  v244InstallPwa,
  v244CheckPwaUpdate,
  v244ApplyPwaUpdate,
  v244PwaSettingsHtml,
  v244PwaStatus:()=>Object.assign({},V244_PWA_STATE,{standalone:v244PwaStandalone(),supported:v244PwaSupported()})
});

window.MediaFlowPWA={
  register:v244RegisterPwa,
  install:v244InstallPwa,
  checkForUpdate:v244CheckPwaUpdate,
  applyUpdate:v244ApplyPwaUpdate,
  state:V244_PWA_STATE
};

MediaFlowRuntime.version=V244_RUNTIME_VERSION;
