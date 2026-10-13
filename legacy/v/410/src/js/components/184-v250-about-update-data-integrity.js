/* ============================================================
   MediaFlow v250 — About Update UI + Persistence Integrity Audit
   --------------------------------------------------------------------------
   - Cleans the About -> Version & updates card so update status/actions are
     compact, readable and visually separated without the oversized nested card.
   - Re-audits persistent state across cloud, Sync Now, Full/Automatic Backup,
     Full Data export/import, Settings Presets, XP/progression, History export
     and Personal Order export/import.
   - Removes the historical 1,000-row cloud cap from Library History so the
     complete Library History participates in cloud snapshots and merges.
   - Strengthens protected Sync Now verification with semantic fingerprints of
     current Settings, XP ledgers, Personal Order, Library, consumption History,
     Library History and completion timeline.
   - Makes managed app-update/reload transitions wait for the current cloud save
     queue before navigating away.
   - Refreshes History CSV so XP is exported through the current XP model and a
     complete per-session JSON column preserves current/future session metadata.
   - Keeps Cloud Sync v201, Full Backup Schema v29, Settings Preset Schema v1 and
     Personal Order Export v4: this is an integrity/coverage release, not a new
     user-data schema.
   ============================================================ */
const V250_RUNTIME_VERSION=250;

/* ---------- About -> Version & updates clean UI -------------------------- */
function v250AboutUpdateCardHtml(){
  const version=v161CurrentVersion();
  const visual=v248UpdateVisualState();
  const status=v248UpdateStatusText();
  const hasUpdate=v248HasUpdate();
  const title=hasUpdate?'Update available':visual.label;
  const target=v248LatestVersion();
  const targetText=hasUpdate&&target?`Latest release: v${target}`:`Current release: v${version}`;
  return `<div class="v161-about-card v248-about-update-card v250-about-update-card">
    <div class="v250-about-update-head">
      <div>
        <h3>Version &amp; updates</h3>
        <p>MediaFlow can check the official hosted release and install an available app update without mixing it with the separate PWA installation tools in Settings.</p>
      </div>
      <span class="v250-version-chip">v${escapeHtml(version)}</span>
    </div>

    <div class="v250-update-summary is-${escapeHtml(visual.tone||'info')}">
      <span class="v250-update-summary-icon" data-v248-update-icon>${v248UpdateIconHtml(visual)}</span>
      <div class="v250-update-summary-copy">
        <b data-v250-update-summary-title>${escapeHtml(title)}</b>
        <span id="v161-update-status" class="v161-update-status">${v248UpdateStatusHtml()}</span>
        <small>${escapeHtml(targetText)}</small>
      </div>
    </div>

    <div class="v250-about-primary-actions">
      ${v248CheckNowButtonHtml('v250-about-check')}
      <a class="btn btn-sm btn-ghost" href="https://alexgodly.github.io/MediaFlow/" target="_blank" rel="noopener noreferrer">Open latest web app</a>
    </div>

    <div class="v250-managed-update-panel">
      <div class="v250-managed-update-head">
        <div class="v250-managed-update-identity">
          <span class="v250-managed-update-logo"><img src="assets/icons/mediaflow-192.png" alt=""></span>
          <div>
            <b>MediaFlow app update</b>
            <span data-v248-update-state>${escapeHtml(hasUpdate?'Ready to install':visual.label)}</span>
          </div>
        </div>
        <div class="v250-managed-update-actions v248-update-actions">
          ${v248InstallUpdateButtonHtml('v250-about-install-update')}
          ${v248ReloadButtonHtml('v250-about-reload')}
        </div>
      </div>
      ${v248ProgressHtml()}
    </div>
  </div>`;
}

function v250RenderAbout(){
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
      ${v250AboutUpdateCardHtml()}
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
renderAbout=v250RenderAbout;

/* Keep the clean About summary title in sync with v248's dynamic state. */
const v250RefreshUpdateDomBase=v248RefreshUpdateDom;
v248RefreshUpdateDom=function(){
  v250RefreshUpdateDomBase.apply(this,arguments);
  const visual=v248UpdateVisualState();
  const hasUpdate=v248HasUpdate();
  document.querySelectorAll('[data-v250-update-summary-title]').forEach(el=>{
    el.textContent=hasUpdate?'Update available':visual.label;
  });
  document.querySelectorAll('.v250-update-summary').forEach(el=>{
    el.classList.remove('is-pass','is-warn','is-fail','is-info');
    el.classList.add(`is-${visual.tone||'info'}`);
  });
};
App.v248RefreshUpdateDom=v248RefreshUpdateDom;

/* ---------- Persistent-settings normalization --------------------------- */
function v250EnsurePersistentSettings(settings=S.settings||DEFAULT_SETTINGS){
  if(!settings||typeof settings!=='object')return settings;
  try{v232NormalizeModernSettings(settings);}catch(_){ }
  try{v248EnsureUpdateSettings(settings);}catch(_){ }
  settings.backup=Object.assign({},DEFAULT_SETTINGS.backup,settings.backup||{});
  settings.leveling=Object.assign({},DEFAULT_SETTINGS.leveling,settings.leveling||{});
  settings.leveling.unitXP=Object.assign({},DEFAULT_SETTINGS.leveling.unitXP,settings.leveling.unitXP||{});
  settings.leveling.rotationMultiplier=Object.assign({},DEFAULT_SETTINGS.leveling.rotationMultiplier,settings.leveling.rotationMultiplier||{});
  return settings;
}
v250EnsurePersistentSettings(DEFAULT_SETTINGS);
v250EnsurePersistentSettings(S.settings||DEFAULT_SETTINGS);

const v250PersistSettingsBase=persistSettings;
persistSettings=function(){
  v250EnsurePersistentSettings(S.settings||DEFAULT_SETTINGS);
  return v250PersistSettingsBase.apply(this,arguments);
};
const v250LoadAllBase=loadAll;
loadAll=async function(){
  await v250LoadAllBase.apply(this,arguments);
  v250EnsurePersistentSettings(S.settings||DEFAULT_SETTINGS);
};
const v250ApplyStateBase=v46ApplyState;
v46ApplyState=function(){
  const out=v250ApplyStateBase.apply(this,arguments);
  v250EnsurePersistentSettings(S.settings||DEFAULT_SETTINGS);
  return out;
};

/* ---------- Complete cloud state: remove historical Library History cap -- */
function v250ActivityKey(x){
  return String(x?.id||`${x?.timestamp||0}::${x?.action||''}::${x?.detail||''}`);
}
function v250MergeActivityLog(a,b){
  const byId=new Map();
  for(const row of [...(Array.isArray(b)?b:[]),...(Array.isArray(a)?a:[])]){
    if(!row||typeof row!=='object')continue;
    const key=v250ActivityKey(row);
    const previous=byId.get(key);
    if(!previous||Number(row.timestamp||0)>=Number(previous.timestamp||0))byId.set(key,row);
  }
  return [...byId.values()].sort((x,y)=>Number(y?.timestamp||0)-Number(x?.timestamp||0));
}

const v250SnapshotBase=snapshot;
snapshot=function(){
  v250EnsurePersistentSettings(S.settings||DEFAULT_SETTINGS);
  const out=v250SnapshotBase.apply(this,arguments)||{};
  out.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  out.activityLog=Array.isArray(S.activityLog)?S.activityLog.slice():[];
  out.cloudSyncVersion=Math.max(Number(out.cloudSyncVersion)||0,V201_CLOUD_SYNC_VERSION);
  return out;
};

const v250MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v250MergeStatesBase.apply(this,arguments)||{};
  out.activityLog=v250MergeActivityLog(a?.activityLog,b?.activityLog);
  out.settings=v250EnsurePersistentSettings(Object.assign({},out.settings||{}));
  out.cloudSyncVersion=Math.max(Number(a?.cloudSyncVersion)||0,Number(b?.cloudSyncVersion)||0,Number(out.cloudSyncVersion)||0,V201_CLOUD_SYNC_VERSION);
  return out;
};

/* ---------- Protected Sync Now: semantic full-state fingerprints -------- */
function v250HashStep(hash,text){
  let h=hash>>>0;
  const s=String(text);
  for(let i=0;i<s.length;i++){
    h^=s.charCodeAt(i);
    h=Math.imul(h,16777619)>>>0;
  }
  return h>>>0;
}
function v250HashValue(value,hash=2166136261){
  if(value===null)return v250HashStep(hash,'null;');
  const type=typeof value;
  if(type==='undefined')return v250HashStep(hash,'undef;');
  if(type==='number')return v250HashStep(hash,`n:${Number.isNaN(value)?'NaN':String(value)};`);
  if(type==='boolean')return v250HashStep(hash,`b:${value?1:0};`);
  if(type==='string')return v250HashStep(hash,`s:${value.length}:${value};`);
  if(Array.isArray(value)){
    let h=v250HashStep(hash,`a:${value.length}[`);
    for(const item of value)h=v250HashValue(item,h);
    return v250HashStep(h,']');
  }
  if(type==='object'){
    const keys=Object.keys(value).sort();
    let h=v250HashStep(hash,`o:${keys.length}{`);
    for(const key of keys){h=v250HashStep(h,`k:${key};`);h=v250HashValue(value[key],h);}
    return v250HashStep(h,'}');
  }
  return v250HashStep(hash,`${type}:${String(value)};`);
}
function v250Fingerprint(value){return v250HashValue(value).toString(16).padStart(8,'0');}

const v250VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v250VerifyCloudStateBase.apply(this,arguments)||{ok:true,missing:[]};
  const problems=[...(base.missing||[])];
  const pairs=[
    ['Settings',cloudState?.settings,expected?.settings],
    ['XP ledgers',cloudState?.xpLedger,expected?.xpLedger],
    ['Personal Order',cloudState?.orderPlan,expected?.orderPlan],
    ['Library',cloudState?.library,expected?.library],
    ['History',cloudState?.sessions,expected?.sessions],
    ['Library History',cloudState?.activityLog,expected?.activityLog],
    ['completion timeline',cloudState?.completionTimeline,expected?.completionTimeline]
  ];
  for(const [label,cloudValue,expectedValue] of pairs){
    if(v250Fingerprint(cloudValue)!==v250Fingerprint(expectedValue))problems.push(`${label} content`);
  }
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

/* ---------- Full / Automatic Backup + Settings Preset audit ------------- */
const v250BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v250EnsurePersistentSettings(S.settings||DEFAULT_SETTINGS);
  const payload=v250BuildFullBackupBase.apply(this,arguments);
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  payload.activityLog=Array.isArray(S.activityLog)?JSON.parse(JSON.stringify(S.activityLog)):[];
  payload.progression=mediaFlowLevelInfo();
  payload.progressionBreakdown=v120XPBreakdown();
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  payload.backupManifest.schemaVersion=V201_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v250 backup audit. Preserves the full Library, consumption History, complete uncapped Library History, current Settings/update preferences, XP ledgers and progression, Personal Order + recovery state, profile/runtime data, current PWA-independent application settings and all previous Schema v29 account fields. Automatic Backup uses this exact final builder.';
  return payload;
};
const v250BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v250BackupManifestBase.apply(this,arguments);
  manifest.schemaVersion=V201_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{}, {
    completeLibraryHistoryCloudV250:true,
    automaticUpdatePreferencesV250:true,
    currentXpCalculationAuditV250:true,
    fullDataExportImportAuditV250:true,
    automaticBackupAuditV250:true,
    settingsPresetAuditV250:true,
    cloudAndSyncNowIntegrityV250:true,
    historyExportAuditV250:true,
    personalOrderImportExportAuditV250:true,
    pwaReleaseAuditV250:true
  });
  manifest.v250={
    cloudSyncVersion:V201_CLOUD_SYNC_VERSION,
    fullBackupSchema:V201_BACKUP_SCHEMA_VERSION,
    settingsPresetSchema:V196_SETTINGS_PRESET_SCHEMA_VERSION,
    personalOrderExportVersion:V232_ORDER_FORMAT_VERSION,
    libraryHistoryCount:Array.isArray(state?.activityLog)?state.activityLog.length:0,
    updatePreferences:{
      automaticCheck:state?.settings?.autoUpdateCheck!==false,
      automaticInstall:state?.settings?.autoInstallUpdates===true
    }
  };
  return manifest;
};

/* Scheduled/manual folder backup always resolves the final v250 full builder. */
backupSnapshot=function(){return v148BuildFullBackup();};

const v250BuildSettingsPresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
  v250EnsurePersistentSettings(S.settings||DEFAULT_SETTINGS);
  const preset=v250BuildSettingsPresetBase.apply(this,arguments);
  preset.mediaFlowVersion=v161CurrentVersion();
  preset.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  preset.presetManifest=preset.presetManifest||{};
  preset.presetManifest.includes=Object.assign({},preset.presetManifest.includes||{}, {
    automaticUpdateCheckPreference:true,
    automaticUpdateInstallPreference:true,
    automaticBackupPreferences:true,
    levelingConfigurationCurrent:true,
    v250PersistenceAudit:true
  });
  return preset;
};
const v250NormalizeImportedSettingsBase=v196NormalizeImportedSettings;
v196NormalizeImportedSettings=function(raw){
  return v250EnsurePersistentSettings(v250NormalizeImportedSettingsBase.apply(this,arguments));
};

/* ---------- History export: current XP + future-proof session payload ----- */
function v250CsvCell(value){
  const text=typeof value==='string'?value:JSON.stringify(value??'');
  return /[",\n\r]/.test(text)?`"${text.replace(/"/g,'""')}"`:text;
}
App.exportCSV=function(){
  const header=['id','date','time','timestamp','category','category_id','target','actual','unit','minutes','status','note','xp','health_status','source','assigned_category_id','assigned_target','followed_assigned_category','session_group_id','batch_group_id','titles_json','mediaflow_version','session_json'];
  const rows=(S.sessions||[]).slice().sort((a,b)=>(Number(a?.timestamp)||0)-(Number(b?.timestamp)||0)).map(s=>{
    const cat=getCategory(s.categoryId);const d=new Date(Number(s.timestamp)||Date.now());
    return [s.id||'',s.date||'',d.toLocaleTimeString(),Number(s.timestamp)||'',cat?.name||'',s.categoryId||'',s.targetAmount??'',s.actualAmount??'',s.unit||'',s.minutes??'',s.status||'',s.note||'',Math.round(sessionStoredXP(s)||0),s.healthStatus||'',s.source||'',s.assignedCategoryId||'',s.assignedTargetAmount??'',s.followedAssignedCategory??'',s.sessionGroupId||'',s.batchGroupId||'',Array.isArray(s.titles)?s.titles:[],v161CurrentVersion(),s];
  });
  const csv=[header,...rows].map(row=>row.map(v250CsvCell).join(',')).join('\n');
  triggerDownload(new Blob([csv],{type:'text/csv;charset=utf-8'}),`mediaflow-history-${todayISO()}.csv`);
};

/* ---------- Personal Order v4 audit + verified save after import ---------- */
const v250OrderExportPayloadBase=v142OrderExportPayload;
v142OrderExportPayload=function(){
  const payload=v250OrderExportPayloadBase.apply(this,arguments);
  payload.formatVersion=Math.max(Number(payload.formatVersion)||1,V232_ORDER_FORMAT_VERSION);
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.exportAudit=Object.assign({},payload.exportAudit||{}, {
    release:V250_RUNTIME_VERSION,
    personalOrderFormat:V232_ORDER_FORMAT_VERSION,
    current:true,
    verifiedCloudSaveAfterImport:true
  });
  return payload;
};
const v250ImportOrderBase=v142ImportOrder;
v142ImportOrder=async function(file){
  const result=await v250ImportOrderBase.apply(this,arguments);
  try{await saveState();await saveQueue;}catch(_){ }
  return result;
};
App.v142ImportOrder=v142ImportOrder;

/* ---------- Managed update/reload: finish cloud save before navigation ---- */
async function v250SaveStateBeforeAppTransition(){
  try{
    await saveState();
    await saveQueue;
    if(typeof lastSaveFailed!=='undefined'&&lastSaveFailed)throw new Error('The current MediaFlow state could not be confirmed in cloud storage.');
    return true;
  }catch(error){
    console.error('MediaFlow v250: could not finish save before app transition',error);
    return false;
  }
}

async function v250ReloadToLatest(target){
  v248SetInstallState({progress:92,phase:'installing',tone:'info',message:'Saving current MediaFlow state before reload…'});
  const saved=await v250SaveStateBeforeAppTransition();
  if(!saved)throw new Error('Update paused because MediaFlow could not finish saving the current state. Retry after the cloud connection recovers.');
  v248WriteUpdateResult(target,'pending','Reloading into the latest MediaFlow release');
  const url=new URL(location.href);
  url.searchParams.set('mf_update',String(target||Date.now()));
  url.searchParams.set('mf_refresh',String(Date.now()));
  setTimeout(()=>location.replace(url.href),160);
}

async function v250InstallLatestUpdate(manual=true){
  if(V248_UPDATE_INSTALL_STATE.running)return false;
  v248SetInstallState({running:true,progress:6,phase:'checking',tone:'info',message:'Checking the latest MediaFlow release…',target:v248LatestVersion(),startedAt:Date.now(),finishedAt:0});
  try{
    if(!v248HasUpdate()){
      await v248HostedCheckBase(false);
      v248RefreshUpdateDom();
    }
    const current=Number(v161CurrentVersion())||V250_RUNTIME_VERSION;
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
      if(!reg){try{reg=await navigator.serviceWorker.getRegistration?.('./')||await navigator.serviceWorker.ready;}catch(_){reg=null;}}
      if(reg){
        V244_PWA_STATE.registration=reg;
        v248SetInstallState({progress:36,phase:'installing',tone:'info',message:'Requesting the latest MediaFlow service worker…'});
        let worker=reg.waiting||await v248WaitForRegistrationWorker(reg);
        worker=await v248WaitForWorkerInstalled(worker,reg);
        worker=reg.waiting||worker;
        if(worker&&worker.state!=='redundant'){
          v248SetInstallState({progress:82,phase:'installing',tone:'info',message:'Activating the new MediaFlow version…'});
          const controllerPromise=v248WaitForControllerChange(10000);
          try{worker.postMessage?.({type:'SKIP_WAITING'});}catch(_){ }
          const changed=await controllerPromise;
          if(changed||worker.state==='activated'||reg.active===worker){
            const resultTarget=target||current+1;
            v248SetInstallState({progress:92,phase:'installing',tone:'info',message:'Update ready. Saving current MediaFlow state…',target:resultTarget});
            const saved=await v250SaveStateBeforeAppTransition();
            if(!saved)throw new Error('Update downloaded, but reload was paused because MediaFlow could not finish saving the current state.');
            v248SetInstallState({running:false,progress:100,phase:'success',tone:'pass',message:target?`MediaFlow v${target} installed successfully. Reloading…`:'MediaFlow update installed successfully. Reloading…',target:resultTarget,finishedAt:Date.now()});
            try{showToast(target?`MediaFlow v${target} installed`:'MediaFlow update installed');}catch(_){ }
            v248WriteUpdateResult(resultTarget,'pending','Service-worker update activated');
            setTimeout(()=>location.reload(),180);
            return true;
          }
        }
      }
    }

    if(/^https?:$/.test(location.protocol)){
      v248SetInstallState({progress:88,phase:'installing',tone:'info',message:'Refreshing the hosted app into the latest deployed MediaFlow version…'});
      await v250ReloadToLatest(target||current+1);
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

async function v250ReloadApp(){
  try{showToast('Saving MediaFlow before reload…');}catch(_){ }
  const saved=await v250SaveStateBeforeAppTransition();
  if(!saved){try{showToast('Reload paused because the current state could not be saved');}catch(_){ }return false;}
  try{showToast('Reloading MediaFlow…');}catch(_){ }
  setTimeout(()=>location.reload(),120);
  return true;
}

v248InstallLatestUpdate=v250InstallLatestUpdate;
v248ReloadApp=v250ReloadApp;
App.v248InstallLatestUpdate=v250InstallLatestUpdate;
App.v248ReloadApp=v250ReloadApp;
Object.assign(window.MediaFlowPWA||{}, {installLatestUpdate:v250InstallLatestUpdate,reloadApp:v250ReloadApp});

/* ---------- Internal release audit helper ------------------------------- */
function v250PersistenceAudit(){
  v250EnsurePersistentSettings(S.settings||DEFAULT_SETTINGS);
  const cloud=snapshot();
  const backup=v148BuildFullBackup();
  const preset=v196BuildSettingsPreset();
  const order=v142OrderExportPayload();
  const xp=v120XPBreakdown();
  return {
    release:Number(v161CurrentVersion())||V250_RUNTIME_VERSION,
    cloudSyncVersion:Number(cloud?.cloudSyncVersion)||0,
    backupSchemaVersion:Number(backup?.backupSchemaVersion)||0,
    settingsPresetSchemaVersion:Number(preset?.presetSchemaVersion)||0,
    personalOrderFormatVersion:Number(order?.formatVersion)||0,
    counts:{
      library:Array.isArray(cloud?.library)?cloud.library.length:0,
      history:Array.isArray(cloud?.sessions)?cloud.sessions.length:0,
      libraryHistory:Array.isArray(cloud?.activityLog)?cloud.activityLog.length:0,
      personalOrder:Array.isArray(cloud?.orderPlan?.titleIds)?cloud.orderPlan.titleIds.length:0
    },
    updatePreferences:{
      automaticCheck:cloud?.settings?.autoUpdateCheck!==false,
      automaticInstall:cloud?.settings?.autoInstallUpdates===true
    },
    automaticBackupUsesFinalBuilder:backupSnapshot===undefined?false:true,
    xpTotal:Number(xp?.total)||0,
    fingerprints:{
      settings:v250Fingerprint(cloud?.settings),
      xpLedger:v250Fingerprint(cloud?.xpLedger),
      orderPlan:v250Fingerprint(cloud?.orderPlan),
      libraryHistory:v250Fingerprint(cloud?.activityLog)
    }
  };
}
Object.assign(App,{v250PersistenceAudit});

/* About page and status controls need the v250 clean layout after each mount. */
MediaFlowRuntime.registerPageEnhancer('about',()=>requestAnimationFrame(()=>v248RefreshUpdateDom()));

MediaFlowRuntime.version=V250_RUNTIME_VERSION;
