/* ============================================================
   MediaFlow v248 — Settings Navigation + Managed App Updates
   --------------------------------------------------------------------------
   - Makes the Settings section navigator responsive on desktop and draggable
     horizontally with a mouse/pen whenever it becomes a horizontal strip.
   - Fixes the final APP UPDATES section incorrectly leaving the previous
     Settings item highlighted when the page cannot scroll its heading to the
     old fixed activation anchor.
   - Adds shared, dynamic update-state icons to About, App Updates and the PWA
     install card: checking / behind / update ready / installing / up to date.
   - Adds an Install update flow with staged progress, success/failure feedback,
     service-worker activation, hosted-app fallback refresh and an optional
     persistent automatic-update installation preference.
   - Keeps the v247 PWA diagnostics/cache-repair system intact.
   ============================================================ */
const V248_RUNTIME_VERSION=248;
const V248_UPDATE_INSTALL_STATE={
  running:false,
  progress:0,
  phase:'idle',
  tone:'info',
  message:'',
  target:null,
  startedAt:0,
  finishedAt:0
};
const V248_UPDATE_WAIT_MS=16000;
const V248_UPDATE_RESULT_KEY='mediaflow-v248-update-result';

function v248EnsureUpdateSettings(settings=S.settings){
  if(!settings||typeof settings!=='object')return settings;
  if(typeof settings.autoUpdateCheck!=='boolean')settings.autoUpdateCheck=true;
  if(typeof settings.autoInstallUpdates!=='boolean')settings.autoInstallUpdates=false;
  return settings;
}
if(typeof DEFAULT_SETTINGS.autoInstallUpdates!=='boolean')DEFAULT_SETTINGS.autoInstallUpdates=false;
v248EnsureUpdateSettings(DEFAULT_SETTINGS);
S.settings=S.settings||DEFAULT_SETTINGS;
v248EnsureUpdateSettings(S.settings);

/* ---------- Persistence / preset audit ---------------------------------- */
if(typeof v196NormalizeImportedSettings==='function'){
  const v248NormalizeImportedSettingsBase=v196NormalizeImportedSettings;
  v196NormalizeImportedSettings=function(raw){
    const next=v248NormalizeImportedSettingsBase.apply(this,arguments);
    return v248EnsureUpdateSettings(next);
  };
}
if(typeof v196BuildSettingsPreset==='function'){
  const v248BuildSettingsPresetBase=v196BuildSettingsPreset;
  v196BuildSettingsPreset=function(){
    const preset=v248BuildSettingsPresetBase.apply(this,arguments);
    if(preset?.settings)v248EnsureUpdateSettings(preset.settings);
    preset.presetManifest=preset.presetManifest||{};
    preset.presetManifest.includes=Object.assign({},preset.presetManifest.includes||{}, {
      automaticUpdateInstallPreferenceV248:true,
      currentPersistentSettingsAuditV248:true
    });
    return preset;
  };
}
if(typeof v148BackupManifest==='function'){
  const v248BackupManifestBase=v148BackupManifest;
  v148BackupManifest=function(){
    const manifest=v248BackupManifestBase.apply(this,arguments);
    manifest.includes=Object.assign({},manifest.includes||{}, {
      automaticUpdateInstallPreferenceV248:true,
      managedAppUpdateFlowV248:true,
      settingsPresetAuditV248:true,
      fullExportImportAuditV248:true,
      automaticBackupAuditV248:true,
      syncNowAuditV248:true
    });
    manifest.v248={
      cloudSyncVersion:201,
      fullBackupSchema:29,
      settingsPresetSchema:1,
      personalOrderExportVersion:4,
      newPersistentSetting:'autoInstallUpdates'
    };
    return manifest;
  };
}

/* ---------- Shared update visual state ---------------------------------- */
function v248HasHostedUpdate(){
  const current=Number(v161CurrentVersion())||V248_RUNTIME_VERSION;
  return !!(V161_UPDATE_STATE?.available&&Number(V161_UPDATE_STATE.latest)>current);
}
function v248HasPwaUpdate(){return !!V244_PWA_STATE?.updateReady;}
function v248HasUpdate(){return v248HasHostedUpdate()||v248HasPwaUpdate();}
function v248LatestVersion(){
  const latest=Number(V161_UPDATE_STATE?.latest);
  return Number.isFinite(latest)&&latest>0?latest:null;
}
function v248UpdateVisualState(){
  if(V248_UPDATE_INSTALL_STATE.running){
    if(V248_UPDATE_INSTALL_STATE.phase==='checking')return {id:'checking',tone:'info',label:'Checking for updates'};
    return {id:'installing',tone:'info',label:'Installing update'};
  }
  if(V248_UPDATE_INSTALL_STATE.phase==='success')return {id:'success',tone:'pass',label:V248_UPDATE_INSTALL_STATE.message||'Update installed'};
  if(V248_UPDATE_INSTALL_STATE.phase==='error')return {id:'error',tone:'fail',label:'Update failed'};
  if(V161_UPDATE_STATE?.checking)return {id:'checking',tone:'info',label:'Checking for updates'};
  if(v248HasPwaUpdate())return {id:'ready',tone:'pass',label:'Ready to install'};
  if(v248HasHostedUpdate())return {id:'available',tone:'warn',label:'New update available'};
  if(V161_UPDATE_STATE?.checked&&Number(V161_UPDATE_STATE.latest)>0)return {id:'current',tone:'pass',label:'Up to date'};
  return {id:'idle',tone:'info',label:'Check for updates'};
}

function v248RawIcon(paths,extra=''){
  return `<span class="v248-update-icon ${extra}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg></span>`;
}
function v248UpdateIconHtml(state=v248UpdateVisualState()){
  switch(state.id){
    case 'checking':
      return v248RawIcon('<path d="M20 7h-5V2"/><path d="M20 7a8 8 0 0 0-14-2"/><path d="M4 17h5v5"/><path d="M4 17a8 8 0 0 0 14 2"/>','is-checking');
    case 'available':
      return v248RawIcon('<path d="M12 3v11"/><path d="m8 10 4 4 4-4"/><path d="M5 18h14"/>','is-available');
    case 'ready':
      return v248RawIcon('<path d="M12 3v10"/><path d="m8 9 4 4 4-4"/><path d="M5 17v3h14v-3"/><path d="m17 5 1.5 1.5L21 4"/>','is-ready');
    case 'installing':
      return v248RawIcon('<path d="M12 3v10"/><path d="m8 9 4 4 4-4"/><path d="M5 18h14"/>','is-installing');
    case 'success':
    case 'current':
      return v248RawIcon('<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16.5 8.5"/>','is-current');
    case 'error':
      return v248RawIcon('<circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16h.01"/>','is-error');
    default:
      return v248RawIcon('<path d="M20 7h-5V2"/><path d="M20 7a8 8 0 0 0-14-2"/><path d="M4 17h5v5"/><path d="M4 17a8 8 0 0 0 14 2"/>','is-idle');
  }
}

function v248UpdateStatusText(){
  const current=Number(v161CurrentVersion())||V248_RUNTIME_VERSION;
  const latest=v248LatestVersion();
  if(V248_UPDATE_INSTALL_STATE.running)return V248_UPDATE_INSTALL_STATE.message||'Installing the latest MediaFlow update…';
  if(V248_UPDATE_INSTALL_STATE.phase==='success')return V248_UPDATE_INSTALL_STATE.message||`MediaFlow updated successfully.`;
  if(V248_UPDATE_INSTALL_STATE.phase==='error')return V248_UPDATE_INSTALL_STATE.message||'MediaFlow could not install the update.';
  if(V161_UPDATE_STATE?.checking)return 'Checking the official MediaFlow build…';
  if(v248HasPwaUpdate())return latest&&latest>current?`MediaFlow v${latest} is downloaded and ready to install.`:'A new MediaFlow app update is ready to install.';
  if(v248HasHostedUpdate())return `MediaFlow v${latest} is available. Current build: v${current}.`;
  if(V161_UPDATE_STATE?.checked&&latest)return `You are on the latest detected build (v${current}).`;
  if(V161_UPDATE_STATE?.checked)return `Update check could not verify the hosted build right now. Current build: v${current}.`;
  return `Current build: v${current}. Automatic update checking is ${S.settings?.autoUpdateCheck===false?'off':'on'}.`;
}
function v248UpdateStatusHtml(){
  const state=v248UpdateVisualState();
  return `<span class="v248-inline-update-status is-${state.tone}" data-v248-update-status>${v248UpdateIconHtml(state)}<span>${escapeHtml(v248UpdateStatusText())}</span></span>`;
}
v161UpdateStatusHtml=v248UpdateStatusHtml;

function v248CheckNowButtonHtml(extraClass=''){
  return `<button type="button" class="btn btn-sm v248-check-update ${extraClass}" data-v225-iconified="1" onclick="App.v161CheckForUpdates(false)"><span data-v248-update-icon>${v248UpdateIconHtml()}</span><span>Check now</span></button>`;
}
function v248ReloadButtonHtml(extraClass='', id=''){
  return `<button ${id?`id="${id}" `:''}type="button" class="btn btn-sm btn-ghost v248-reload-app ${extraClass}" data-v225-iconified="1" onclick="App.v248ReloadApp()">${V246_PWA_ICONS.reload}<span>Reload app</span></button>`;
}
function v248InstallUpdateButtonHtml(extraClass=''){
  const hidden=!v248HasUpdate()&&!V248_UPDATE_INSTALL_STATE.running;
  return `<button type="button" class="btn btn-sm btn-primary v248-install-update ${extraClass}" data-v225-iconified="1" onclick="App.v248InstallLatestUpdate()" ${hidden?'hidden':''} ${V248_UPDATE_INSTALL_STATE.running?'disabled':''}>${V246_PWA_ICONS.install}<span>${V248_UPDATE_INSTALL_STATE.running?'Installing…':'Install update'}</span></button>`;
}
function v248ProgressHtml(){
  const s=V248_UPDATE_INSTALL_STATE;
  const visible=s.running||s.phase==='success'||s.phase==='error';
  return `<div class="v248-update-progress-shell is-${escapeHtml(s.tone||'info')}" data-v248-update-progress ${visible?'':'hidden'}>
    <div class="v248-update-progress-head"><span data-v248-update-progress-message>${escapeHtml(s.message||'')}</span><b data-v248-update-progress-percent>${Math.max(0,Math.min(100,Math.round(s.progress||0)))}%</b></div>
    <div class="v248-update-progress-track"><span data-v248-update-progress-fill style="width:${Math.max(0,Math.min(100,Number(s.progress)||0))}%"></span></div>
  </div>`;
}
function v248UpdateBrandHtml(){
  const visual=v248UpdateVisualState();
  const ready=v248HasUpdate();
  return `<div class="v248-update-brand">
    <div class="v248-update-brand-mark" aria-hidden="true">
      <img src="assets/icons/mediaflow-192.png" alt="">
      <span class="v248-update-brand-badge is-${visual.tone}" data-v248-update-icon>${v248UpdateIconHtml(visual)}</span>
    </div>
    <div class="v248-update-brand-copy">
      <div class="v248-update-brand-title ${ready?'is-ready':''}" data-v248-update-brand-title>Install MediaFlow</div>
      <div class="v248-update-brand-state is-${ready||visual.tone==='pass'?'pass':visual.tone}" data-v248-update-state>${escapeHtml(ready?'Ready to install':visual.label)}</div>
      <div class="hint">Install the latest MediaFlow release when an update is detected, or reload the current app without applying an update.</div>
    </div>
  </div>
  <div class="v248-update-actions">
    ${v248InstallUpdateButtonHtml()}
    ${v248ReloadButtonHtml()}
  </div>
  ${v248ProgressHtml()}`;
}

/* ---------- About page --------------------------------------------------- */
function v248RenderAbout(){
  const version=v161CurrentVersion();
  const counts={categories:(S.categories||[]).length,titles:(S.library||[]).length,logs:(S.sessions||[]).length};
  return `<div class="v161-about">
    <div class="v161-about-hero">
      <div class="section-label">ABOUT MEDIAFLOW</div>
      <h1>MediaFlow</h1>
      <div style="color:var(--text-dim);font-size:12px;margin-bottom:11px">Personal media rotation, Library tracking and consumption history.</div>
      <div class="v161-about-version">MediaFlow v${escapeHtml(version)} · by Alex Godly</div>
      <div class="v161-about-links">
        <a class="btn btn-primary" href="https://guns.lol/alexgodly" target="_blank" rel="noopener noreferrer">Contact Alex Godly</a>
        <a class="btn" href="https://alexgodly.github.io/apps/" target="_blank" rel="noopener noreferrer">Other apps by Alex Godly</a>
      </div>
    </div>
    <div class="v161-about-grid">
      <div class="v161-about-card">
        <h3>What MediaFlow does</h3>
        <p>MediaFlow combines a weighted consumption-rotation scheduler with a personal media Library, detailed History, Statistics, progression systems and optional title-level recommendations.</p>
        <ul>${v161FeatureList().map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>
      </div>
      <div class="v161-about-card">
        <h3>Current account</h3>
        <p><b>${counts.categories.toLocaleString()}</b> categories<br><b>${counts.titles.toLocaleString()}</b> Library titles<br><b>${counts.logs.toLocaleString()}</b> History records</p>
        <p>Account data participates in MediaFlow's protected cloud-save and complete backup pipelines.</p>
      </div>
      <div class="v161-about-card v248-about-update-card">
        <h3>Version & updates</h3>
        <p>This file identifies itself as <b>MediaFlow v${escapeHtml(version)}</b>. Automatic update checking compares the current build with the official hosted MediaFlow build when the browser allows the request.</p>
        <div class="v161-update-status" id="v161-update-status">${v248UpdateStatusHtml()}</div>
        <div class="v248-about-check-row">
          ${v248CheckNowButtonHtml()}
          <a class="btn btn-sm btn-ghost" href="https://alexgodly.github.io/MediaFlow/" target="_blank" rel="noopener noreferrer">Open latest web app</a>
        </div>
        <div class="v248-update-divider"></div>
        ${v248UpdateBrandHtml()}
      </div>
    </div>
    <div class="section-label">FAQ</div>
    ${v161FaqHtml()}
    <div class="v161-about-card" style="margin-top:18px">
      <h3>Developer</h3>
      <p><b>MediaFlow is by Alex Godly.</b> For contact, profiles and developer links use <b>guns.lol/alexgodly</b>. To see other Alex Godly applications, use the Apps hub.</p>
      <div class="v161-about-links">
        <a class="btn btn-primary" href="https://guns.lol/alexgodly" target="_blank" rel="noopener noreferrer">Contact developer</a>
        <a class="btn" href="https://alexgodly.github.io/apps/" target="_blank" rel="noopener noreferrer">Alex Godly Apps</a>
      </div>
    </div>
  </div>`;
}
renderAbout=v248RenderAbout;

/* ---------- App Updates Settings ---------------------------------------- */
function v248UpdateSettingsHtml(){
  v248EnsureUpdateSettings(S.settings);
  const enabled=S.settings?.autoUpdateCheck!==false;
  const autoInstall=S.settings?.autoInstallUpdates===true;
  return `<div class="section-label">APP UPDATES</div>
    <div class="card v248-app-updates-card" style="margin-bottom:22px">
      <div class="v248-auto-update-row">
        <div class="v248-auto-update-main">
          <span class="v248-auto-update-state-icon is-${v248UpdateVisualState().tone}" data-v248-update-icon>${v248UpdateIconHtml()}</span>
          <div>
            <b>Automatic update checking</b>
            <div class="hint">Periodically checks the official MediaFlow build version. When a newer release is detected you can install it directly from MediaFlow.</div>
            <div class="v161-update-status" id="v161-settings-update-status">${v248UpdateStatusHtml()}</div>
          </div>
        </div>
        <div class="v248-update-check-actions">
          <button class="toggle ${enabled?'on':''}" data-v248-auto-check-toggle onclick="App.v161ToggleAutoUpdateCheck()" aria-label="Toggle automatic update checking"></button>
          ${v248CheckNowButtonHtml()}
        </div>
      </div>
      <div class="v248-auto-install-row">
        <div><b>Automatically install MediaFlow updates</b><div class="hint">When automatic checking finds a newer deployed release, MediaFlow installs/activates the new app version automatically and reloads after saving current state.</div></div>
        <button class="toggle ${autoInstall?'on':''}" data-v248-auto-install-toggle onclick="App.v248ToggleAutoInstallUpdates()" aria-label="Toggle automatic update installation"></button>
      </div>
      <div class="v248-update-divider"></div>
      ${v248UpdateBrandHtml()}
    </div>
    ${v244PwaSettingsHtml()}`;
}
v161UpdateSettingsHtml=v248UpdateSettingsHtml;

/* Resetting APP UPDATES must reset both persistent update preferences. */
if(typeof v221SectionResetPlan==='function'){
  const v248SectionResetPlanBase=v221SectionResetPlan;
  v221SectionResetPlan=function(title){
    const t=String(title||'').trim().toUpperCase();
    if(t==='APP UPDATES')return {kind:'paths',paths:['autoUpdateCheck','autoInstallUpdates']};
    return v248SectionResetPlanBase(title);
  };
}

/* ---------- PWA card: dynamic MediaFlow icon/status + split update/reload */
function v248PwaSettingsHtml(){
  const installed=v244PwaStandalone()||V244_PWA_STATE.installed;
  const state=v247PwaStateLabel();
  const updateState=v248UpdateVisualState();
  const readyToInstall=!installed&&!!V244_PWA_STATE.installPrompt;
  const open=V247_PWA_DIAGNOSTICS.report?.status==='fail'||!!V247_PWA_DIAGNOSTICS.error;
  return `<div class="card v244-pwa-card v246-pwa-card v247-pwa-card v248-pwa-card" style="margin-bottom:22px">
    <div class="v244-pwa-card-main">
      <div class="v244-pwa-mark v246-pwa-mark v248-pwa-mark" aria-hidden="true">
        <img src="assets/icons/mediaflow-192.png" alt="">
        <span class="v248-pwa-mark-badge is-${updateState.tone}" data-v248-update-icon>${v248UpdateIconHtml(updateState)}</span>
      </div>
      <div class="v244-pwa-copy">
        <div class="v247-pwa-title-row"><b class="v248-pwa-title ${readyToInstall?'is-ready':''}">Install MediaFlow</b>${v247DiagBadge(state.tone,state.text)}</div>
        <div class="hint">Install MediaFlow as a Progressive Web App on desktop, tablet or mobile. PWA diagnostics can test the live manifest, worker and every app-shell URL when the browser refuses installation.</div>
        <div id="v244-pwa-status" class="v244-pwa-status">${escapeHtml(v247PwaStatus())}</div>
      </div>
    </div>
    <div class="v244-pwa-actions v246-pwa-actions v248-pwa-actions">
      <button id="v244-pwa-install" class="btn btn-sm btn-primary" data-v225-iconified="1" ${installed?'disabled':''} onclick="App.v244InstallPwa()">${V246_PWA_ICONS.install}<span>${installed?'Installed':'Install app'}</span></button>
      ${v248InstallUpdateButtonHtml('v248-pwa-install-update')}
      ${v248ReloadButtonHtml('v248-pwa-reload','v244-pwa-update')}
      <button id="v246-pwa-check" class="btn btn-sm btn-ghost" data-v225-iconified="1" onclick="App.v244CheckPwaUpdate(true)">${V246_PWA_ICONS.update}<span>Check PWA update</span></button>
    </div>
    ${v248ProgressHtml()}
    <details id="v247-pwa-diagnostics" class="v247-pwa-diagnostics" ${open?'open':''}>
      <summary>PWA Diagnostics <span>manifest · service worker · cache · assets</span></summary>
      <div id="v247-pwa-diagnostics-body" class="v247-pwa-diagnostics-body">${v247DiagnosticsBodyHtml()}</div>
    </details>
  </div>`;
}
v244PwaSettingsHtml=v248PwaSettingsHtml;
App.v244PwaSettingsHtml=v244PwaSettingsHtml;

/* ---------- Managed update installer ------------------------------------ */
function v248SetInstallState(patch){
  Object.assign(V248_UPDATE_INSTALL_STATE,patch||{});
  V248_UPDATE_INSTALL_STATE.progress=Math.max(0,Math.min(100,Number(V248_UPDATE_INSTALL_STATE.progress)||0));
  v248RefreshUpdateDom();
}
function v248SaveBeforeReload(){
  try{saveState();}catch(_){try{persistSettings();}catch(__){ }}
}
function v248WriteUpdateResult(target,status,message){
  try{sessionStorage.setItem(V248_UPDATE_RESULT_KEY,JSON.stringify({target:Number(target)||null,status,message:String(message||''),at:Date.now()}));}catch(_){ }
}
function v248ReadPreviousUpdateResult(){
  try{
    const raw=sessionStorage.getItem(V248_UPDATE_RESULT_KEY);
    if(!raw)return;
    sessionStorage.removeItem(V248_UPDATE_RESULT_KEY);
    const row=JSON.parse(raw);
    if(!row||Date.now()-Number(row.at||0)>120000)return;
    const current=Number(v161CurrentVersion())||V248_RUNTIME_VERSION;
    if(row.target&&current>=Number(row.target)){
      Object.assign(V248_UPDATE_INSTALL_STATE,{running:false,progress:100,phase:'success',tone:'pass',message:`Updated successfully to MediaFlow v${current}.`,target:Number(row.target),finishedAt:Date.now()});
    }else if(row.target&&current<Number(row.target)){
      Object.assign(V248_UPDATE_INSTALL_STATE,{running:false,progress:100,phase:'error',tone:'fail',message:`Reload finished, but this build is still v${current}. The v${row.target} deployment may still be propagating.`,target:Number(row.target),finishedAt:Date.now()});
    }
  }catch(_){ }
}

function v248WaitForRegistrationWorker(reg,timeout=V248_UPDATE_WAIT_MS){
  if(reg?.waiting)return Promise.resolve(reg.waiting);
  if(reg?.installing)return Promise.resolve(reg.installing);
  return new Promise((resolve,reject)=>{
    if(!reg){resolve(null);return;}
    let settled=false;
    const finish=(value)=>{if(settled)return;settled=true;clearTimeout(timer);try{reg.removeEventListener?.('updatefound',onFound);}catch(_){ }resolve(value||null);};
    const onFound=()=>finish(reg.installing||reg.waiting||null);
    const timer=setTimeout(()=>finish(reg.waiting||reg.installing||null),timeout);
    try{reg.addEventListener?.('updatefound',onFound);}catch(_){ }
    Promise.resolve(reg.update?.()).then(()=>{
      if(reg.waiting||reg.installing)finish(reg.waiting||reg.installing);
    }).catch(err=>{if(!settled){settled=true;clearTimeout(timer);reject(err);}});
  });
}

function v248WaitForWorkerInstalled(worker,reg,timeout=V248_UPDATE_WAIT_MS){
  if(!worker)return Promise.resolve(reg?.waiting||null);
  if(worker===reg?.waiting||worker.state==='installed')return Promise.resolve(reg?.waiting||worker);
  if(worker.state==='activated')return Promise.resolve(worker);
  return new Promise((resolve,reject)=>{
    let done=false;
    const finish=(ok,value)=>{if(done)return;done=true;clearTimeout(timer);try{worker.removeEventListener?.('statechange',onState);}catch(_){ }ok?resolve(value):reject(value);};
    const onState=()=>{
      const state=String(worker.state||'');
      if(state==='installing')v248SetInstallState({progress:58,phase:'installing',tone:'info',message:'Downloading and preparing the new MediaFlow app shell…'});
      if(state==='installed'){
        v248SetInstallState({progress:80,phase:'installing',tone:'info',message:'Update downloaded. Preparing activation…'});
        finish(true,reg?.waiting||worker);
      }else if(state==='activated')finish(true,worker);
      else if(state==='redundant')finish(false,new Error('The new service worker became redundant before activation.'));
    };
    const timer=setTimeout(()=>finish(true,reg?.waiting||worker),timeout);
    try{worker.addEventListener?.('statechange',onState);}catch(_){ }
    onState();
  });
}

function v248WaitForControllerChange(timeout=10000){
  if(!('serviceWorker' in navigator))return Promise.resolve(false);
  return new Promise(resolve=>{
    let done=false;
    const finish=(value)=>{if(done)return;done=true;clearTimeout(timer);try{navigator.serviceWorker.removeEventListener?.('controllerchange',onChange);}catch(_){ }resolve(value);};
    const onChange=()=>finish(true);
    const timer=setTimeout(()=>finish(false),timeout);
    try{navigator.serviceWorker.addEventListener('controllerchange',onChange,{once:true});}catch(_){finish(false);}
  });
}

function v248ReloadToLatest(target){
  v248SaveBeforeReload();
  v248WriteUpdateResult(target,'pending','Reloading into the latest MediaFlow release');
  const url=new URL(location.href);
  url.searchParams.set('mf_update',String(target||Date.now()));
  url.searchParams.set('mf_refresh',String(Date.now()));
  setTimeout(()=>location.replace(url.href),650);
}

async function v248InstallLatestUpdate(manual=true){
  if(V248_UPDATE_INSTALL_STATE.running)return false;
  v248SetInstallState({running:true,progress:6,phase:'checking',tone:'info',message:'Checking the latest MediaFlow release…',target:v248LatestVersion(),startedAt:Date.now(),finishedAt:0});
  try{
    if(!v248HasUpdate()){
      await v248HostedCheckBase(false);
      v248RefreshUpdateDom();
    }
    const current=Number(v161CurrentVersion())||V248_RUNTIME_VERSION;
    const target=v248LatestVersion();
    if(!v248HasUpdate()){
      v248SetInstallState({running:false,progress:100,phase:'success',tone:'pass',message:`MediaFlow v${current} is already up to date.`,target:current,finishedAt:Date.now()});
      if(manual)try{showToast(`MediaFlow v${current} is already up to date`);}catch(_){ }
      return true;
    }

    v248SetInstallState({progress:22,phase:'installing',tone:'info',message:target?`MediaFlow v${target} found. Preparing update…`:'A new MediaFlow update is ready. Preparing update…',target:target||null});

    if(v244PwaSupported()&&'serviceWorker' in navigator){
      let reg=V244_PWA_STATE.registration;
      if(!reg)reg=await v244RegisterPwa().catch(()=>null);
      if(!reg){
        try{reg=await navigator.serviceWorker.getRegistration?.('./')||await navigator.serviceWorker.ready;}catch(_){reg=null;}
      }
      if(reg){
        V244_PWA_STATE.registration=reg;
        v248SetInstallState({progress:36,phase:'installing',tone:'info',message:'Requesting the latest MediaFlow service worker…'});
        let worker=reg.waiting||await v248WaitForRegistrationWorker(reg);
        worker=await v248WaitForWorkerInstalled(worker,reg);
        worker=reg.waiting||worker;
        if(worker&&worker.state!=='redundant'){
          v248SetInstallState({progress:88,phase:'installing',tone:'info',message:'Activating the new MediaFlow version…'});
          const controllerPromise=v248WaitForControllerChange(10000);
          try{worker.postMessage?.({type:'SKIP_WAITING'});}catch(_){ }
          const changed=await controllerPromise;
          if(changed||worker.state==='activated'||reg.active===worker){
            const resultTarget=target||current+1;
            v248SetInstallState({running:false,progress:100,phase:'success',tone:'pass',message:target?`MediaFlow v${target} installed successfully. Reloading…`:'MediaFlow update installed successfully. Reloading…',target:resultTarget,finishedAt:Date.now()});
            try{showToast(target?`MediaFlow v${target} installed`:'MediaFlow update installed');}catch(_){ }
            v248SaveBeforeReload();
            v248WriteUpdateResult(resultTarget,'pending','Service-worker update activated');
            setTimeout(()=>location.reload(),850);
            return true;
          }
        }
      }
    }

    // Hosted/PWA fallback: navigation is network-first. A cache-busted reload
    // obtains the newest deployed index/bundle even if the browser did not
    // expose the new worker lifecycle quickly enough.
    if(/^https?:$/.test(location.protocol)){
      v248SetInstallState({progress:94,phase:'installing',tone:'info',message:'Refreshing the hosted app into the latest deployed MediaFlow version…'});
      v248ReloadToLatest(target||current+1);
      return true;
    }
    throw new Error('This local file cannot replace itself. Open the hosted MediaFlow app to install the latest release.');
  }catch(err){
    const message=String(err?.message||err||'Update installation failed');
    v248SetInstallState({running:false,progress:100,phase:'error',tone:'fail',message,finishedAt:Date.now()});
    if(manual)try{showToast('MediaFlow update installation failed');}catch(_){ }
    return false;
  }
}

function v248ReloadApp(){
  v248SaveBeforeReload();
  try{showToast('Reloading MediaFlow…');}catch(_){ }
  setTimeout(()=>location.reload(),120);
  return true;
}

function v248ToggleAutoInstallUpdates(){
  S.settings=S.settings||DEFAULT_SETTINGS;
  v248EnsureUpdateSettings(S.settings);
  S.settings.autoInstallUpdates=!S.settings.autoInstallUpdates;
  try{persistSettings();}catch(_){try{saveState();}catch(__){ }}
  v248RefreshUpdateDom();
  try{showToast(S.settings.autoInstallUpdates?'Automatic update installation enabled':'Automatic update installation disabled');}catch(_){ }
  if(S.settings.autoInstallUpdates&&v248HasUpdate()&&!V248_UPDATE_INSTALL_STATE.running){
    setTimeout(()=>v248InstallLatestUpdate(false),80);
  }
}

/* Capture the current v244-wrapped hosted checker. It already checks the
   registered PWA worker as part of each hosted version check. */
const v248HostedCheckBase=v161CheckForUpdates;
v161CheckForUpdates=async function(silent=true){
  const out=await v248HostedCheckBase.apply(this,arguments);
  v248RefreshUpdateDom();
  if(S.settings?.autoInstallUpdates===true&&v248HasUpdate()&&!V248_UPDATE_INSTALL_STATE.running){
    setTimeout(()=>v248InstallLatestUpdate(false),60);
  }
  return out;
};
App.v161CheckForUpdates=v161CheckForUpdates;

const v248MarkPwaUpdateReadyBase=v244MarkPwaUpdateReady;
v244MarkPwaUpdateReady=function(reg){
  const out=v248MarkPwaUpdateReadyBase.apply(this,arguments);
  v248RefreshUpdateDom();
  if(S.settings?.autoInstallUpdates===true&&V244_PWA_STATE.updateReady&&!V248_UPDATE_INSTALL_STATE.running){
    setTimeout(()=>v248InstallLatestUpdate(false),60);
  }
  return out;
};

/* ---------- Dynamic DOM refresh ----------------------------------------- */
function v248RefreshUpdateDom(){
  const state=v248UpdateVisualState();
  document.querySelectorAll('[data-v248-update-icon]').forEach(el=>{
    el.innerHTML=v248UpdateIconHtml(state);
    el.classList.toggle('is-pass',state.tone==='pass');
    el.classList.toggle('is-warn',state.tone==='warn');
    el.classList.toggle('is-fail',state.tone==='fail');
    el.classList.toggle('is-info',state.tone==='info');
  });
  document.querySelectorAll('[data-v248-update-state]').forEach(el=>{
    const ready=v248HasUpdate();
    el.textContent=ready?'Ready to install':state.label;
    el.className=`v248-update-brand-state is-${ready||state.tone==='pass'?'pass':state.tone}`;
  });
  document.querySelectorAll('[data-v248-update-brand-title]').forEach(el=>el.classList.toggle('is-ready',v248HasUpdate()));
  document.querySelectorAll('.v248-install-update').forEach(btn=>{
    const show=v248HasUpdate()||V248_UPDATE_INSTALL_STATE.running;
    btn.hidden=!show;
    btn.disabled=V248_UPDATE_INSTALL_STATE.running;
    const label=btn.querySelector('span:last-child');if(label)label.textContent=V248_UPDATE_INSTALL_STATE.running?'Installing…':'Install update';
  });
  document.querySelectorAll('[data-v248-auto-install-toggle]').forEach(btn=>btn.classList.toggle('on',S.settings?.autoInstallUpdates===true));
  document.querySelectorAll('[data-v248-auto-check-toggle]').forEach(btn=>btn.classList.toggle('on',S.settings?.autoUpdateCheck!==false));
  for(const id of ['v161-update-status','v161-settings-update-status']){
    const el=document.getElementById(id);if(el)el.innerHTML=v248UpdateStatusHtml();
  }
  const p=V248_UPDATE_INSTALL_STATE;
  document.querySelectorAll('[data-v248-update-progress]').forEach(shell=>{
    shell.hidden=!(p.running||p.phase==='success'||p.phase==='error');
    shell.className=`v248-update-progress-shell is-${p.tone||'info'}`;
    const message=shell.querySelector('[data-v248-update-progress-message]');if(message)message.textContent=p.message||'';
    const pct=shell.querySelector('[data-v248-update-progress-percent]');if(pct)pct.textContent=`${Math.round(p.progress||0)}%`;
    const fill=shell.querySelector('[data-v248-update-progress-fill]');if(fill)fill.style.width=`${Math.max(0,Math.min(100,p.progress||0))}%`;
  });
  const pwaTitle=document.querySelector('.v248-pwa-title');
  if(pwaTitle)pwaTitle.classList.toggle('is-ready',!v244PwaStandalone()&&!V244_PWA_STATE.installed&&!!V244_PWA_STATE.installPrompt);
}

const v248RefreshUpdateStatusDomBase=v161RefreshUpdateStatusDom;
v161RefreshUpdateStatusDom=function(){
  try{v248RefreshUpdateStatusDomBase.apply(this,arguments);}catch(_){ }
  v248RefreshUpdateDom();
};
const v248RefreshPwaDomBase=v244RefreshPwaDom;
v244RefreshPwaDom=function(){
  try{v248RefreshPwaDomBase.apply(this,arguments);}catch(_){ }
  v248RefreshUpdateDom();
};

/* ---------- Settings active-section correction ------------------------- */
const v248UpdateSettingsActiveNavBase=v231UpdateSettingsActiveNav;
v231UpdateSettingsActiveNav=function(ensureVisible=false){
  if(String(S.view||'')!=='settings')return;
  if(V231_SETTINGS_JUMP_LOCK_ID&&Date.now()<V231_SETTINGS_JUMP_LOCK_UNTIL){
    v231SetActiveSettingsNav(V231_SETTINGS_JUMP_LOCK_ID,ensureVisible);return;
  }
  if(V231_SETTINGS_JUMP_LOCK_ID&&Date.now()>=V231_SETTINGS_JUMP_LOCK_UNTIL){V231_SETTINGS_JUMP_LOCK_ID='';V231_SETTINGS_JUMP_LOCK_UNTIL=0;}
  const registry=(V221_SETTINGS_REGISTRY||[]).filter(section=>{
    const el=section?.label||document.getElementById(section?.id||'');
    if(!el||el.classList.contains('v221-settings-hidden'))return false;
    const style=getComputedStyle(el);return style.display!=='none'&&style.visibility!=='hidden';
  });
  if(!registry.length)return v248UpdateSettingsActiveNavBase(ensureVisible);

  const viewport=Math.max(1,window.innerHeight||document.documentElement.clientHeight||1);
  const pageBottom=Math.max(document.documentElement.scrollHeight||0,document.body?.scrollHeight||0);
  const scrollBottom=(window.scrollY||document.documentElement.scrollTop||0)+viewport;
  const nearBottom=pageBottom-scrollBottom<=Math.max(18,viewport*.025);
  let chosen=null;

  if(nearBottom){
    // APP UPDATES is the final Settings section. On short final sections the
    // browser physically cannot scroll its heading to the historical 132px
    // activation anchor, so the old algorithm kept highlighting the section
    // above it. Prefer the last visible section when the document is at bottom.
    const visible=registry.filter(section=>{
      const r=(section.label||document.getElementById(section.id))?.getBoundingClientRect?.();
      return r&&r.top<viewport-12&&r.bottom>-12;
    });
    chosen=visible[visible.length-1]||registry[registry.length-1];
  }else{
    const anchor=Math.min(150,Math.max(96,viewport*.18));
    let firstBelow=null;
    for(const section of registry){
      const top=(section.label||document.getElementById(section.id))?.getBoundingClientRect?.().top;
      if(!Number.isFinite(top))continue;
      if(top<=anchor)chosen=section;else if(!firstBelow)firstBelow=section;
    }
    chosen=chosen||firstBelow||registry[0];
  }
  if(chosen)v231SetActiveSettingsNav(chosen.id,ensureVisible);
};

/* ---------- Horizontal Settings-nav drag scrolling ---------------------- */
function v248EnableSettingsNavDragScroll(){
  const nav=document.getElementById('v221-settings-nav');
  if(!nav||nav.dataset.v248DragScroll==='1')return;
  nav.dataset.v248DragScroll='1';
  let active=false,startX=0,startScroll=0,pointerId=null,dragged=false,suppressClick=false;
  const horizontal=()=>nav.scrollWidth>nav.clientWidth+3&&['auto','scroll'].includes(getComputedStyle(nav).overflowX);
  nav.addEventListener('pointerdown',event=>{
    if(event.pointerType==='touch'||event.button!==0||!horizontal())return;
    active=true;dragged=false;pointerId=event.pointerId;startX=event.clientX;startScroll=nav.scrollLeft;
    nav.classList.add('v248-drag-ready');
    try{nav.setPointerCapture(pointerId);}catch(_){ }
  });
  nav.addEventListener('pointermove',event=>{
    if(!active||event.pointerId!==pointerId)return;
    const dx=event.clientX-startX;
    if(Math.abs(dx)>4){dragged=true;event.preventDefault();nav.classList.add('v248-dragging');nav.scrollLeft=startScroll-dx;}
  });
  const end=event=>{
    if(!active)return;
    if(dragged)suppressClick=true;
    active=false;dragged=false;
    try{if(pointerId!=null)nav.releasePointerCapture(pointerId);}catch(_){ }
    pointerId=null;nav.classList.remove('v248-dragging','v248-drag-ready');
  };
  nav.addEventListener('pointerup',end);nav.addEventListener('pointercancel',end);
  nav.addEventListener('click',event=>{
    if(!suppressClick)return;
    suppressClick=false;event.preventDefault();event.stopImmediatePropagation();
  },true);
  nav.addEventListener('wheel',event=>{
    if(!horizontal())return;
    if(Math.abs(event.deltaY)<=Math.abs(event.deltaX))return;
    nav.scrollLeft+=event.deltaY;event.preventDefault();
  },{passive:false});
}

function v248EnhanceSettings(){
  requestAnimationFrame(()=>{
    v248EnableSettingsNavDragScroll();
    v231UpdateSettingsActiveNav(true);
    v248RefreshUpdateDom();
  });
}
MediaFlowRuntime.registerPageEnhancer('settings',v248EnhanceSettings);
MediaFlowRuntime.registerPageEnhancer('about',()=>requestAnimationFrame(v248RefreshUpdateDom));
window.addEventListener('resize',()=>{if(String(S.view||'')==='settings')requestAnimationFrame(v248EnableSettingsNavDragScroll);},{passive:true});

/* Keep semantic button icons from replacing the explicitly dynamic icon. */
const v248ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(el?.classList?.contains('v248-check-update'))return null;
  if(el?.classList?.contains('v248-install-update'))return 'installPwa';
  if(el?.classList?.contains('v248-reload-app'))return 'reloadPwa';
  return v248ButtonIconNameBase(el);
};

Object.assign(App,{
  v248InstallLatestUpdate,
  v248ReloadApp,
  v248ToggleAutoInstallUpdates,
  v248RefreshUpdateDom,
  v248EnableSettingsNavDragScroll
});
Object.assign(window.MediaFlowPWA||{}, {installLatestUpdate:v248InstallLatestUpdate,reloadApp:v248ReloadApp});

v248ReadPreviousUpdateResult();
setTimeout(()=>v248RefreshUpdateDom(),0);
MediaFlowRuntime.version=V248_RUNTIME_VERSION;
