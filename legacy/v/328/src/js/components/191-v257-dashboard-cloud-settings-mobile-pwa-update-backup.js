/* ============================================================
   MediaFlow v257 — Dashboard Tool Cloud Sync + Settings Nav + Mobile PWA
   --------------------------------------------------------------------------
   - Keeps Stopwatch / Runtime Calculator header icons static and semantic.
   - Syncs current Stopwatch and Runtime Calculator state through the complete
     MediaFlow cloud snapshot / merge / restore pipeline.
   - Rebuilds horizontal Settings navigation interaction so desktop mouse/pen
     drag does not steal ordinary button clicks, touch keeps native panning,
     active sections stay highlighted and scrollbars stay visually hidden.
   - Adds device-aware mobile/tablet PWA guidance (Android + iOS/iPadOS) while
     preserving native beforeinstallprompt where Chromium exposes it.
   - Adds optional Full Backup export before managed MediaFlow update install,
     with an explicit two-step progress flow.
   ============================================================ */
const V257_RUNTIME_VERSION=257;

/* -------------------------------------------------------------------------
   Dashboard accordion icons: static Stopwatch + clock. The icon itself is an
   identity/action affordance, not the expansion chevron, so it never rotates.
   ------------------------------------------------------------------------- */
const V257_DASHBOARD_TOOL_ICONS={
  stopwatch:v225IconSvg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6M12 2v3"/>'),
  runtimeClock:v225IconSvg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/><path d="M12 3v1"/>')
};
function v257RefreshDashboardToolIcons(root=document){
  const sw=root.querySelector?.('.stopwatch-card .v256-accordion-toggle');
  if(sw){sw.innerHTML=V257_DASHBOARD_TOOL_ICONS.stopwatch;sw.dataset.v225Iconified='1';}
  const rt=root.querySelector?.('.v256-runtime-card .v256-accordion-toggle');
  if(rt){rt.innerHTML=V257_DASHBOARD_TOOL_ICONS.runtimeClock;rt.dataset.v225Iconified='1';}
}
MediaFlowRuntime.registerPageEnhancer('dashboard',()=>requestAnimationFrame(()=>v257RefreshDashboardToolIcons(document)));

/* -------------------------------------------------------------------------
   Stopwatch + Runtime Calculator complete cloud persistence
   ------------------------------------------------------------------------- */
function v257Clone(value,fallback=null){try{return JSON.parse(JSON.stringify(value));}catch(_){return fallback;}}
function v257NormalizeStopwatch(raw){
  const x=(raw&&typeof raw==='object')?raw:{};
  return {
    running:x.running===true,
    startedAt:Math.max(0,Number(x.startedAt)||0),
    elapsed:Math.max(0,Number(x.elapsed)||0),
    resetValue:Math.max(0,Number(x.resetValue)||0),
    modifiedAt:Math.max(0,Number(x.modifiedAt)||0)
  };
}
function v257NormalizeRuntimeCalculator(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  const base=v256RuntimeDefault();
  const chain=Array.isArray(src.chain)?src.chain.slice(0,2).map(v256NormalizeTime):base.chain;
  while(chain.length<2)chain.push(v256BlankTime());
  const rows=Array.isArray(src.rows)?src.rows.map(v256NormalizeTime):base.rows;
  while(rows.length<2)rows.push(v256BlankTime());
  return {
    mode:src.mode==='multi'?'multi':'chain',
    chain,
    rows,
    resultSeconds:Math.max(0,Math.floor(Number(src.resultSeconds)||0)),
    hasResult:src.hasResult===true,
    resultCount:Math.max(0,Math.floor(Number(src.resultCount)||0)),
    carryCount:Math.max(0,Math.floor(Number(src.carryCount)||0)),
    previousAccumulatorSeconds:Math.max(0,Math.floor(Number(src.previousAccumulatorSeconds)||0)),
    previousAccumulatorCount:Math.max(0,Math.floor(Number(src.previousAccumulatorCount)||0)),
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}
function v257CurrentRuntimeForCloud(){
  const current=v257NormalizeRuntimeCalculator(S.v256RuntimeCalculator||{});
  current.modifiedAt=Math.max(current.modifiedAt,Number(S.v257RuntimeCalculatorModifiedAt)||0);
  return current;
}
function v257DashboardToolsState(){
  const stopwatch=v257NormalizeStopwatch(S.stopwatch||{});
  const runtimeCalculator=v257CurrentRuntimeForCloud();
  return {
    stopwatch,
    runtimeCalculator,
    modifiedAt:Math.max(stopwatch.modifiedAt||0,runtimeCalculator.modifiedAt||0)
  };
}
function v257NewerToolState(a,b){
  if(!a)return b? v257Clone(b,b):null;
  if(!b)return v257Clone(a,a);
  const am=Number(a.modifiedAt)||0,bm=Number(b.modifiedAt)||0;
  return v257Clone(bm>am?b:a, bm>am?b:a);
}
function v257ApplyDashboardTools(state){
  const tools=state?.dashboardToolsV257;
  if(tools?.stopwatch){
    S.stopwatch=v257NormalizeStopwatch(tools.stopwatch);
  }else if(state?.stopwatch){
    S.stopwatch=v257NormalizeStopwatch(state.stopwatch);
  }
  if(tools?.runtimeCalculator){
    const rt=v257NormalizeRuntimeCalculator(tools.runtimeCalculator);
    S.v257RuntimeCalculatorModifiedAt=rt.modifiedAt;
    const plain=Object.assign({},rt);delete plain.modifiedAt;
    S.v256RuntimeCalculator=plain;
  }
}

const v257SnapshotBase=snapshot;
snapshot=function(){
  const out=v257SnapshotBase.apply(this,arguments)||{};
  const tools=v257DashboardToolsState();
  out.dashboardToolsV257=v257Clone(tools,tools);
  // Keep the long-standing top-level stopwatch field aligned for all legacy
  // backup/cloud readers while v257 adds explicit utility-state metadata.
  out.stopwatch=v257Clone(tools.stopwatch,tools.stopwatch);
  out.cloudSyncVersion=Math.max(Number(out.cloudSyncVersion)||0,V201_CLOUD_SYNC_VERSION);
  return out;
};

const v257MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v257MergeStatesBase.apply(this,arguments)||{};
  const at=a?.dashboardToolsV257||{stopwatch:a?.stopwatch||null,runtimeCalculator:a?.v256RuntimeCalculator||null};
  const bt=b?.dashboardToolsV257||{stopwatch:b?.stopwatch||null,runtimeCalculator:b?.v256RuntimeCalculator||null};
  const stopwatch=v257NewerToolState(at?.stopwatch,bt?.stopwatch)||v257NormalizeStopwatch(out.stopwatch||{});
  const runtimeCalculator=v257NewerToolState(at?.runtimeCalculator,bt?.runtimeCalculator);
  out.dashboardToolsV257={
    stopwatch:v257NormalizeStopwatch(stopwatch),
    runtimeCalculator:runtimeCalculator?v257NormalizeRuntimeCalculator(runtimeCalculator):v257NormalizeRuntimeCalculator({}),
    modifiedAt:Math.max(Number(stopwatch?.modifiedAt)||0,Number(runtimeCalculator?.modifiedAt)||0)
  };
  out.stopwatch=v257Clone(out.dashboardToolsV257.stopwatch,out.dashboardToolsV257.stopwatch);
  out.cloudSyncVersion=Math.max(Number(out.cloudSyncVersion)||0,V201_CLOUD_SYNC_VERSION);
  return out;
};

const v257ApplyStateBase=v46ApplyState;
v46ApplyState=function(data){
  const out=v257ApplyStateBase.apply(this,arguments);
  v257ApplyDashboardTools(data||{});
  return out;
};
const v257LoadAllBase=loadAll;
loadAll=async function(){
  await v257LoadAllBase.apply(this,arguments);
  try{const d=await rawGet(STATE_KEY);if(d)v257ApplyDashboardTools(d);}catch(_){ }
  try{clearInterval(window.__sw);window.__sw=null;if(S.stopwatch?.running)window.__sw=setInterval(stopwatchTick,250);}catch(_){ }
};

let V257_TOOL_SAVE_TIMER=0;
function v257ScheduleToolCloudSave(immediate=false){
  clearTimeout(V257_TOOL_SAVE_TIMER);
  const run=()=>{try{saveState();}catch(_){ }};
  if(immediate)run();else V257_TOOL_SAVE_TIMER=setTimeout(run,500);
}
function v257TouchStopwatch(){
  S.stopwatch=v257NormalizeStopwatch(S.stopwatch||{});
  S.stopwatch.modifiedAt=Date.now();
  v257ScheduleToolCloudSave(true);
}
function v257TouchRuntime(immediate=false){
  S.v257RuntimeCalculatorModifiedAt=Date.now();
  v257ScheduleToolCloudSave(immediate);
}

['stopwatchStart','stopwatchPause','stopwatchSetTime','stopwatchReset','stopwatchClear','stopwatchAddTime','stopwatchMinusTime'].forEach(name=>{
  const base=App[name];if(typeof base!=='function')return;
  App[name]=function(){const out=base.apply(this,arguments);v257TouchStopwatch();return out;};
});
[
  ['v256UpdateRuntimeField',false],['v256CalculateRuntime',true],['v256ContinueRuntimeResult',true],
  ['v256RestorePreviousRuntime',true],['v256SetRuntimeMode',true],['v256AddRuntimeRow',true],
  ['v256RemoveRuntimeRow',true],['v256ClearRuntimeCalculator',true]
].forEach(([name,immediate])=>{
  const base=App[name];if(typeof base!=='function')return;
  App[name]=function(){const out=base.apply(this,arguments);v257TouchRuntime(immediate);return out;};
});

const v257VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v257VerifyCloudStateBase.apply(this,arguments)||{ok:true,missing:[]};
  const problems=[...(base.missing||[])];
  const got=cloudState?.dashboardToolsV257||{};
  const wanted=expected?.dashboardToolsV257||{};
  try{
    if(v250Fingerprint(got.stopwatch)!==v250Fingerprint(wanted.stopwatch))problems.push('Stopwatch cloud state');
    if(v250Fingerprint(got.runtimeCalculator)!==v250Fingerprint(wanted.runtimeCalculator))problems.push('Runtime Calculator cloud state');
  }catch(_){
    if(JSON.stringify(got.stopwatch||{})!==JSON.stringify(wanted.stopwatch||{}))problems.push('Stopwatch cloud state');
    if(JSON.stringify(got.runtimeCalculator||{})!==JSON.stringify(wanted.runtimeCalculator||{}))problems.push('Runtime Calculator cloud state');
  }
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

/* -------------------------------------------------------------------------
   Horizontal Settings navigator: no visible scrollbar, drag without stealing
   normal clicks, and immediate active-section highlighting.
   ------------------------------------------------------------------------- */
function v257SettingsNavIsHorizontal(nav){
  if(!nav)return false;
  const style=getComputedStyle(nav);
  return style.display==='flex'&&['auto','scroll'].includes(style.overflowX);
}
let V257_SETTINGS_NAV_SUPPRESS_CLICK=false;
let V257_SETTINGS_NAV_LOCK_ID='';
let V257_SETTINGS_NAV_LOCK_UNTIL=0;
let V257_SETTINGS_NAV_LOCK_SEQ=0;
const v257SettingsActiveNavBase=v231UpdateSettingsActiveNav;
v231UpdateSettingsActiveNav=function(ensureVisible=false){
  if(V257_SETTINGS_NAV_LOCK_ID&&Date.now()<V257_SETTINGS_NAV_LOCK_UNTIL){
    v231SetActiveSettingsNav(V257_SETTINGS_NAV_LOCK_ID,ensureVisible);return;
  }
  if(V257_SETTINGS_NAV_LOCK_ID&&Date.now()>=V257_SETTINGS_NAV_LOCK_UNTIL){
    V257_SETTINGS_NAV_LOCK_ID='';V257_SETTINGS_NAV_LOCK_UNTIL=0;
  }
  return v257SettingsActiveNavBase.apply(this,arguments);
};
function v257StableSettingsJump(id){
  const targetId=String(id||'');
  const target=document.getElementById(targetId);
  if(!targetId||!target)return false;
  const seq=++V257_SETTINGS_NAV_LOCK_SEQ;
  V257_SETTINGS_NAV_LOCK_ID=targetId;
  V257_SETTINGS_NAV_LOCK_UNTIL=Date.now()+1400;
  try{App.v221JumpSettings(targetId);}catch(_){
    try{target.scrollIntoView({behavior:'smooth',block:'start'});}catch(__){ }
  }
  const reinforce=()=>{
    if(String(S.view||'')!=='settings')return;
    try{v231SetActiveSettingsNav(targetId,true);}catch(_){ }
  };
  reinforce();
  requestAnimationFrame(reinforce);
  setTimeout(reinforce,70);
  setTimeout(reinforce,220);
  setTimeout(()=>{
    if(seq!==V257_SETTINGS_NAV_LOCK_SEQ)return;
    V257_SETTINGS_NAV_LOCK_ID='';V257_SETTINGS_NAV_LOCK_UNTIL=0;
    try{v257SettingsActiveNavBase(true);}catch(_){ }
  },1450);
  return true;
}
function v257BuildCleanSettingsNav(){
  const current=document.getElementById('v221-settings-nav');
  if(!current)return null;
  // v248's pointer listeners were attached anonymously. Clone once so v257
  // owns drag behavior and ordinary taps/clicks can never be swallowed.
  let nav=current;
  if(nav.dataset.v257Nav==='1')return nav;
  const clone=nav.cloneNode(true);
  clone.dataset.v257Nav='1';
  nav.replaceWith(clone);nav=clone;
  let active=false,dragged=false,pointerId=null,startX=0,startScroll=0;
  nav.addEventListener('pointerdown',event=>{
    if(!v257SettingsNavIsHorizontal(nav)||event.button!==0||event.pointerType==='touch')return;
    active=true;dragged=false;pointerId=event.pointerId;startX=event.clientX;startScroll=nav.scrollLeft;
  });
  nav.addEventListener('pointermove',event=>{
    if(!active||event.pointerId!==pointerId)return;
    const dx=event.clientX-startX;
    if(!dragged&&Math.abs(dx)>6){
      dragged=true;V257_SETTINGS_NAV_SUPPRESS_CLICK=true;nav.classList.add('v257-settings-nav-dragging');
      try{nav.setPointerCapture(pointerId);}catch(_){ }
    }
    if(dragged){event.preventDefault();nav.scrollLeft=startScroll-dx;}
  });
  const finish=()=>{
    active=false;pointerId=null;
    const wasDragged=dragged;
    setTimeout(()=>{
      dragged=false;nav.classList.remove('v257-settings-nav-dragging');
      if(wasDragged)V257_SETTINGS_NAV_SUPPRESS_CLICK=false;
    },120);
  };
  nav.addEventListener('pointerup',finish);nav.addEventListener('pointercancel',finish);
  return nav;
}
if(!window.__v257SettingsNavClickFix){
  window.__v257SettingsNavClickFix=true;
  document.addEventListener('click',event=>{
    if(String(S.view||'')!=='settings')return;
    const btn=event.target.closest?.('#v221-settings-nav .v221-settings-nav-item');
    if(!btn)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(V257_SETTINGS_NAV_SUPPRESS_CLICK)return;
    const id=String(btn.dataset.settingsTarget||'');
    if(id)v257StableSettingsJump(id);
  },true);
}
function v257RefreshSettingsNav(){
  const nav=v257BuildCleanSettingsNav();if(!nav)return;
  nav.classList.toggle('v257-settings-nav-horizontal',v257SettingsNavIsHorizontal(nav));
  try{v231UpdateSettingsActiveNav(true);}catch(_){ }
}
MediaFlowRuntime.registerPageEnhancer('settings',()=>requestAnimationFrame(v257RefreshSettingsNav));
window.addEventListener('resize',()=>{if(String(S.view||'')==='settings')requestAnimationFrame(v257RefreshSettingsNav);},{passive:true});
window.visualViewport?.addEventListener('resize',()=>{if(String(S.view||'')==='settings')requestAnimationFrame(v257RefreshSettingsNav);},{passive:true});

/* -------------------------------------------------------------------------
   Mobile/tablet PWA install support + honest platform-specific guidance.
   Chromium Android still owns beforeinstallprompt. iOS/iPadOS does not expose
   that event, so Add to Home Screen is the native installation path.
   ------------------------------------------------------------------------- */
function v257PwaPlatform(){
  const ua=String(navigator.userAgent||'');
  const ios=/iPad|iPhone|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const android=/Android/i.test(ua);
  const chrome=/CriOS|Chrome|Chromium/i.test(ua)&&!/EdgA|OPR|SamsungBrowser/i.test(ua);
  const safari=ios&&/Safari/i.test(ua)&&!/CriOS|FxiOS|EdgiOS/i.test(ua);
  const tablet=/iPad|Tablet/i.test(ua)||(android&&!/Mobile/i.test(ua));
  return {ios,android,chrome,safari,tablet,mobile:ios||android||/Mobi/i.test(ua)};
}
function v257PwaInstallHelp(){
  const p=v257PwaPlatform();
  let title='Install MediaFlow';
  let steps='Use your browser install action to install MediaFlow.';
  let note='MediaFlow is configured as a standalone Progressive Web App.';
  if(p.ios){
    steps='Tap Share, choose Add to Home Screen, keep “Open as Web App” enabled when your iOS/iPadOS version shows that option, then tap Add.';
    note='iPhone and iPad browsers do not expose beforeinstallprompt. Add to Home Screen is the native install path.';
  }else if(p.android){
    steps='In Chrome, use ⋮ → Install app. You can also tap Install app here as soon as Chrome exposes its native prompt. If installation is unavailable, run PWA Diagnostics, reload once after the service worker is active, then retry.';
    note='Chrome controls the Android beforeinstallprompt event. MediaFlow now ships install-safe 192×192 and 512×512 icons, a standalone manifest and an active fetch-capable service worker; diagnostics show any remaining live deployment problem.';
  }
  document.getElementById('v246-pwa-help')?.remove();
  const overlay=document.createElement('div');overlay.id='v246-pwa-help';overlay.className='modal-overlay v246-pwa-help-overlay';
  overlay.innerHTML=`<div class="modal v246-pwa-help-modal v257-pwa-help-modal" role="dialog" aria-modal="true" aria-labelledby="v246-pwa-help-title">
    <div class="v246-pwa-help-head"><img src="assets/icons/mediaflow-install-192.png" alt="" class="v246-pwa-help-icon"><div><div id="v246-pwa-help-title" class="modal-title">${escapeHtml(title)}</div><div class="hint">Phone, tablet and desktop installation support</div></div></div>
    <div class="v246-pwa-help-steps">${escapeHtml(steps)}</div><div class="v257-pwa-help-note">${escapeHtml(note)}</div>
    <div class="modal-actions"><button class="btn btn-primary" data-v225-iconified="1" onclick="document.getElementById('v246-pwa-help')?.remove()">${v246PwaIcon('<path d="m5 12 4 4L19 6"/>')}Got it</button></div>
  </div>`;
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});document.body.appendChild(overlay);
}
v246PwaInstallHelp=v257PwaInstallHelp;
App.v246PwaInstallHelp=v257PwaInstallHelp;

const v257PwaStatusBase=v247PwaStatus;
function v257PwaStatus(){
  const p=v257PwaPlatform();
  if(v244PwaStandalone()||V244_PWA_STATE.installed)return v257PwaStatusBase();
  if(p.ios&&!V244_PWA_STATE.installPrompt){
    return V244_PWA_STATE.offlineReady
      ? 'iPhone/iPad ready · use Share → Add to Home Screen. iOS does not expose beforeinstallprompt.'
      : 'Preparing iPhone/iPad app shell · install with Share → Add to Home Screen.';
  }
  if(p.android&&!V244_PWA_STATE.installPrompt&&V244_PWA_STATE.offlineReady){
    return 'Android PWA checks are ready. Chrome has not exposed its native install prompt yet; reload once after the worker is active or use Chrome → Install app, and run PWA Diagnostics if the browser still refuses installation.';
  }
  return v257PwaStatusBase();
}
v247PwaStatus=v257PwaStatus;v244PwaStatus=v257PwaStatus;

const v257PwaSettingsHtmlBase=v244PwaSettingsHtml;
v244PwaSettingsHtml=function(){
  let html=v257PwaSettingsHtmlBase.apply(this,arguments);
  const p=v257PwaPlatform();
  const label=p.ios?'iOS / iPadOS':p.android?'Android':p.tablet?'Tablet':'Desktop';
  const path=p.ios?'Share → Add to Home Screen':p.android?'Chrome native Install app':'Browser Install app';
  html=html.replace('<details id="v247-pwa-diagnostics"',`<div class="v257-pwa-platform-hint"><b>${escapeHtml(label)} install path</b><span>${escapeHtml(path)}</span></div><details id="v247-pwa-diagnostics"`);
  return html;
};
App.v244PwaSettingsHtml=v244PwaSettingsHtml;

const v257RunPwaDiagnosticsBase=v247RunPwaDiagnostics;
v247RunPwaDiagnostics=async function(options={}){
  const report=await v257RunPwaDiagnosticsBase.apply(this,arguments);
  const p=v257PwaPlatform();
  if(report?.checks){
    const promptCheck=report.checks.find(x=>String(x?.name||'').toLowerCase()==='native install prompt');
    if(promptCheck&&p.ios){
      if(promptCheck.status==='warn'){report.warnings=Math.max(0,Number(report.warnings||0)-1);}
      promptCheck.status='pass';promptCheck.detail='iOS/iPadOS uses Share → Add to Home Screen; beforeinstallprompt is not exposed by iOS browsers.';
    }else if(promptCheck&&p.android&&!V244_PWA_STATE.installPrompt){
      promptCheck.detail='Chrome Android has not exposed beforeinstallprompt yet. Core PWA checks can still pass; the browser owns this event and may withhold it after dismissal, when already installed, or while a live installability requirement is unmet.';
    }
    report.status=report.failures>0?'fail':report.warnings>0?'warn':'pass';
    report.summary=report.failures?`${report.failures} failed check${report.failures===1?'':'s'}`:report.warnings?`${report.warnings} warning${report.warnings===1?'':'s'}`:'all PWA checks passed';
    try{V247_PWA_DIAGNOSTICS.report=report;v247RefreshDiagnosticsDom();}catch(_){ }
  }
  return report;
};
App.v247RunPwaDiagnostics=v247RunPwaDiagnostics;
Object.assign(window.MediaFlowPWA||{}, {diagnostics:v247RunPwaDiagnostics,status:v257PwaStatus});

/* -------------------------------------------------------------------------
   Optional Full Backup before a managed MediaFlow update.
   ------------------------------------------------------------------------- */
const v257EnsureUpdateSettingsBase=v248EnsureUpdateSettings;
v248EnsureUpdateSettings=function(settings=S.settings){
  const out=v257EnsureUpdateSettingsBase.apply(this,arguments);
  if(out&&typeof out.backupBeforeUpdate!=='boolean')out.backupBeforeUpdate=false;
  return out;
};
if(typeof DEFAULT_SETTINGS.backupBeforeUpdate!=='boolean')DEFAULT_SETTINGS.backupBeforeUpdate=false;
v248EnsureUpdateSettings(DEFAULT_SETTINGS);v248EnsureUpdateSettings(S.settings||DEFAULT_SETTINGS);

function v257BackupBeforeUpdateOptionHtml(){
  const on=S.settings?.backupBeforeUpdate===true;
  return `<label class="v257-update-backup-option"><span><b>Export Full Backup before update</b><small>When enabled, Step 1 downloads a complete MediaFlow backup before Step 2 installs the new version.</small></span><input type="checkbox" ${on?'checked':''} onchange="App.v257SetBackupBeforeUpdate(this.checked)" aria-label="Export Full Backup before installing updates"></label>`;
}
function v257SetBackupBeforeUpdate(value){
  S.settings=S.settings||DEFAULT_SETTINGS;v248EnsureUpdateSettings(S.settings);
  S.settings.backupBeforeUpdate=!!value;persistSettings();v257RefreshBackupUpdateToggles();
}
function v257RefreshBackupUpdateToggles(){
  document.querySelectorAll('.v257-update-backup-option input[type="checkbox"]').forEach(el=>{el.checked=S.settings?.backupBeforeUpdate===true;});
}

const v257UpdateBrandHtmlBase=v248UpdateBrandHtml;
v248UpdateBrandHtml=function(){
  const html=v257UpdateBrandHtmlBase.apply(this,arguments);
  return html.replace('<div class="v248-update-actions">',`${v257BackupBeforeUpdateOptionHtml()}<div class="v248-update-actions">`);
};

const v257AboutUpdateCardHtmlBase=v250AboutUpdateCardHtml;
v250AboutUpdateCardHtml=function(){
  const html=v257AboutUpdateCardHtmlBase.apply(this,arguments);
  const host=document.createElement('div');host.innerHTML=html;
  const panel=host.querySelector('.v250-managed-update-panel');
  const progress=panel?.querySelector('.v248-update-progress-shell');
  if(panel&&progress){const wrap=document.createElement('div');wrap.innerHTML=v257BackupBeforeUpdateOptionHtml();panel.insertBefore(wrap.firstElementChild,progress);}
  return host.innerHTML;
};

const v257SectionResetPlanBase=v221SectionResetPlan;
v221SectionResetPlan=function(title){
  const plan=v257SectionResetPlanBase.apply(this,arguments);
  if(String(title||'').trim().toUpperCase()==='APP UPDATES'&&plan?.kind==='paths'&&!plan.paths.includes('backupBeforeUpdate'))plan.paths.push('backupBeforeUpdate');
  return plan;
};

function v257BackupFilename(target){
  const now=new Date(),pad=n=>String(n).padStart(2,'0');
  const stamp=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return `MediaFlow_PreUpdate_Backup_v${v161CurrentVersion()}${target?`_to_v${target}`:''}_${stamp}.json`;
}
async function v257ExportPreUpdateBackup(target){
  try{saveState();await saveQueue;}catch(_){ }
  const payload=v148BuildFullBackup();
  payload.preUpdateBackup={fromVersion:Number(v161CurrentVersion())||257,targetVersion:Number(target)||null,createdAt:new Date().toISOString()};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const filename=v257BackupFilename(target);triggerDownload(blob,filename);
  return filename;
}

let V257_UPDATE_FLOW_ACTIVE=false;
let V257_UPDATE_FLOW_STAGE='';
const v257SetInstallStateBase=v248SetInstallState;
v248SetInstallState=function(patch){
  if(V257_UPDATE_FLOW_ACTIVE&&V257_UPDATE_FLOW_STAGE==='install'&&S.settings?.backupBeforeUpdate===true){
    const mapped=Object.assign({},patch||{});
    if(Object.prototype.hasOwnProperty.call(mapped,'progress'))mapped.progress=35+(Math.max(0,Math.min(100,Number(mapped.progress)||0))*.65);
    if(mapped.message&&!/^Step 2 of 2/i.test(mapped.message))mapped.message=`Step 2 of 2 · ${mapped.message}`;
    return v257SetInstallStateBase(mapped);
  }
  return v257SetInstallStateBase.apply(this,arguments);
};

const v257InstallLatestUpdateBase=v248InstallLatestUpdate;
v248InstallLatestUpdate=async function(manual=true){
  if(V248_UPDATE_INSTALL_STATE.running)return false;
  v248EnsureUpdateSettings(S.settings||DEFAULT_SETTINGS);
  if(S.settings?.backupBeforeUpdate!==true)return v257InstallLatestUpdateBase.apply(this,arguments);
  V257_UPDATE_FLOW_ACTIVE=true;V257_UPDATE_FLOW_STAGE='backup';
  const target=v248LatestVersion();
  try{
    v257SetInstallStateBase({running:true,progress:5,phase:'installing',tone:'info',message:'Step 1 of 2 · Saving current MediaFlow state before backup…',target:target||null,startedAt:Date.now(),finishedAt:0});
    try{saveState();await saveQueue;}catch(_){ }
    v257SetInstallStateBase({progress:16,message:'Step 1 of 2 · Building complete Full Backup…'});
    const filename=await v257ExportPreUpdateBackup(target);
    v257SetInstallStateBase({progress:30,message:`Step 1 of 2 · Full Backup exported (${filename}).`});
    await new Promise(resolve=>setTimeout(resolve,180));
    // The v248 installer starts only when running=false; Step 2 remaps its
    // native 0–100 progress into the remaining 35–100 range.
    V248_UPDATE_INSTALL_STATE.running=false;V257_UPDATE_FLOW_STAGE='install';
    return await v257InstallLatestUpdateBase.call(this,manual);
  }catch(err){
    const message=`Step 1 of 2 failed · ${String(err?.message||err||'Could not export Full Backup')}`;
    v257SetInstallStateBase({running:false,progress:100,phase:'error',tone:'fail',message,finishedAt:Date.now()});
    if(manual)try{showToast('Update stopped because the pre-update backup could not be exported');}catch(_){ }
    return false;
  }finally{
    V257_UPDATE_FLOW_ACTIVE=false;V257_UPDATE_FLOW_STAGE='';
  }
};
App.v248InstallLatestUpdate=v248InstallLatestUpdate;
Object.assign(window.MediaFlowPWA||{}, {installLatestUpdate:v248InstallLatestUpdate});

const v257RefreshUpdateDomBase=v248RefreshUpdateDom;
v248RefreshUpdateDom=function(){const out=v257RefreshUpdateDomBase.apply(this,arguments);v257RefreshBackupUpdateToggles();return out;};
App.v248RefreshUpdateDom=v248RefreshUpdateDom;

/* Backup/preset audit metadata for the new persistent setting + tools. */
const v257BuildSettingsPresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
  const preset=v257BuildSettingsPresetBase.apply(this,arguments);preset.presetManifest=preset.presetManifest||{};
  preset.presetManifest.includes=Object.assign({},preset.presetManifest.includes||{}, {backupBeforeUpdateV257:true,dashboardToolCloudStateV257:true});return preset;
};
const v257BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v257BuildFullBackupBase.apply(this,arguments);payload.backupManifest=payload.backupManifest||{};
  payload.backupManifest.includes=Object.assign({},payload.backupManifest.includes||{}, {stopwatchCloudSyncV257:true,runtimeCalculatorCloudSyncV257:true,backupBeforeUpdatePreferenceV257:true});
  payload.backupManifest.note='Complete MediaFlow v257 backup. Includes cloud-synced Stopwatch + Runtime Calculator state and the optional Full Backup before managed updates preference while preserving Cloud Sync v201, Full Backup Schema v29, Settings Preset Schema v1 and Personal Order Export v4.';
  return payload;
};

Object.assign(App,{v257SetBackupBeforeUpdate,v257RefreshSettingsNav,v257PwaInstallHelp,v257PwaStatus,v257DashboardToolsState:()=>v257Clone(v257DashboardToolsState(),{}),v257ExportPreUpdateBackup});
MediaFlowRuntime.version=V257_RUNTIME_VERSION;
