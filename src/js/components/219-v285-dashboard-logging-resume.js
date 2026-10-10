/* ============================================================
   MediaFlow v285 — Dashboard accordion + in-progress logging resume
   --------------------------------------------------------------------------
   - Remembers Stopwatch / Runtime Calculator collapsed state locally, in
     Settings, in Cloud Sync and in complete backups.
   - Preserves the complete in-progress Dashboard logging workspace across
     refreshes and devices: active draft, added titles, final progress fields,
     note/minutes/amount, current entry draft and logging browser UI state.
   - Uses a tiny immediate local resume cache for accidental refreshes, while
     cloud writes stay debounced so typing never serializes the full Library on
     every keystroke.
   ============================================================ */
const V285_RUNTIME_VERSION=285;
const V285_RESUME_FORMAT='MediaFlow_Resume_v285';
let V285_RESUME_SAVE_TIMER=0;
let V285_RESUME_APPLYING=false;

function v285Clone(value,fallback=null){
  try{return JSON.parse(JSON.stringify(value));}catch(_){return fallback;}
}
function v285Now(){return Date.now();}
function v285UserKey(){
  const id=String(AUTH_USER?.id||AUTH_USER?.email||'local').trim()||'local';
  return `mediaflow:v285:resume:${encodeURIComponent(id)}`;
}
function v285NormalizeDashboard(raw){
  const x=(raw&&typeof raw==='object')?raw:{};
  return {
    stopwatchCollapsed:x.stopwatchCollapsed===true,
    runtimeCalculatorCollapsed:x.runtimeCalculatorCollapsed===true,
    modifiedAt:Math.max(0,Number(x.modifiedAt)||0)
  };
}
function v285NormalizeLoggingUi(raw){
  const x=(raw&&typeof raw==='object')?raw:{};
  return {
    libraryOpen:x.libraryOpen===true,
    page:Math.max(0,Math.floor(Number(x.page)||0)),
    categories:Array.isArray(x.categories)?x.categories.map(String):[],
    status:String(x.status||'all'),
    priority:String(x.priority||'all'),
    sort:String(x.sort||''),
    sortBase:String(x.sortBase||''),
    sortDir:String(x.sortDir||'')
  };
}
function v285NormalizeLogging(raw){
  const x=(raw&&typeof raw==='object')?raw:{};
  return {
    active:x.active===true,
    currentTask:(x.currentTask&&typeof x.currentTask==='object')?v285Clone(x.currentTask,null):null,
    logDraft:(x.logDraft&&typeof x.logDraft==='object')?v285Clone(x.logDraft,{}):{},
    entryDraft:(x.entryDraft&&typeof x.entryDraft==='object')?v285Clone(x.entryDraft,{}):{},
    ui:v285NormalizeLoggingUi(x.ui),
    modifiedAt:Math.max(0,Number(x.modifiedAt)||0)
  };
}
function v285NormalizeResume(raw){
  const x=(raw&&typeof raw==='object')?raw:{};
  return {
    format:V285_RESUME_FORMAT,
    dashboard:v285NormalizeDashboard(x.dashboard),
    logging:v285NormalizeLogging(x.logging),
    modifiedAt:Math.max(0,Number(x.modifiedAt)||0)
  };
}
function v285ReadLocalResume(){
  try{
    const raw=localStorage.getItem(v285UserKey());
    return raw?v285NormalizeResume(JSON.parse(raw)):null;
  }catch(_){return null;}
}
function v285WriteLocalResume(state=S.v285ResumeState){
  try{
    if(!state)return;
    localStorage.setItem(v285UserKey(),JSON.stringify(v285NormalizeResume(state)));
  }catch(_){ }
}
function v285NewerSection(a,b,normalizer){
  const aa=normalizer(a),bb=normalizer(b);
  return (Number(bb.modifiedAt)||0)>(Number(aa.modifiedAt)||0)?bb:aa;
}
function v285LoggingUiSnapshot(){
  return {
    libraryOpen:typeof V238_LOG_LIBRARY_OPEN!=='undefined'&&V238_LOG_LIBRARY_OPEN===true,
    page:typeof V89_LOG!=='undefined'?Math.max(0,Number(V89_LOG.page)||0):0,
    categories:typeof V89_LOG!=='undefined'&&Array.isArray(V89_LOG.categories)?V89_LOG.categories.map(String):[],
    status:typeof V89_LOG!=='undefined'?String(V89_LOG.status||'all'):'all',
    priority:typeof V89_LOG!=='undefined'?String(V89_LOG.priority||'all'):'all',
    sort:typeof V89_LOG!=='undefined'?String(V89_LOG.sort||''):'',
    sortBase:typeof V89_LOG!=='undefined'?String(V89_LOG.sortBase||''):'',
    sortDir:typeof V89_LOG!=='undefined'?String(V89_LOG.sortDir||''):''
  };
}
function v285CurrentDashboardState(modifiedAt){
  const settingsState=v285NormalizeDashboard(S.settings?.v285DashboardResume||{});
  const acc=(S.v256DashboardAccordions&&typeof S.v256DashboardAccordions==='object')?S.v256DashboardAccordions:{};
  return {
    stopwatchCollapsed:acc.stopwatch===true,
    runtimeCalculatorCollapsed:acc.runtimeCalculator===true,
    modifiedAt:Math.max(0,Number(modifiedAt)||Number(settingsState.modifiedAt)||0)
  };
}
function v285EnsureResumeState(){
  const existing=v285NormalizeResume(S.v285ResumeState||{});
  if(!existing.dashboard.modifiedAt&&S.settings?.v285DashboardResume){
    existing.dashboard=v285NormalizeDashboard(S.settings.v285DashboardResume);
  }
  S.v285ResumeState=existing;
  return existing;
}
function v285MirrorDashboardSetting(dashboard){
  S.settings=S.settings||{};
  S.settings.v285DashboardResume=v285NormalizeDashboard(dashboard||{});
}
function v285RefreshResumeForSnapshot(){
  const state=v285EnsureResumeState();
  const importedSetting=v285NormalizeDashboard(S.settings?.v285DashboardResume||{});
  let d;
  if(importedSetting.modifiedAt>Number(state.dashboard?.modifiedAt||0)){
    d=importedSetting;
    S.v256DashboardAccordions=S.v256DashboardAccordions||{};
    S.v256DashboardAccordions.stopwatch=d.stopwatchCollapsed===true;
    S.v256DashboardAccordions.runtimeCalculator=d.runtimeCalculatorCollapsed===true;
  }else{
    d=v285CurrentDashboardState(state.dashboard.modifiedAt);
  }
  state.dashboard=d;
  v285MirrorDashboardSetting(d);
  // Always serialize the live draft so unrelated saves cannot persist stale
  // logging content. modifiedAt is changed only by actual draft interactions.
  state.logging=Object.assign({},state.logging,{
    active:S.logging===true,
    currentTask:S.logging===true?v285Clone(S.currentTask,null):null,
    logDraft:S.logging===true?v285Clone(S.logDraft||{},{}):{},
    entryDraft:S.logging===true?v285Clone(S.entryDraft||{},{}):{},
    ui:S.logging===true?v285LoggingUiSnapshot():v285NormalizeLoggingUi(state.logging?.ui)
  });
  state.modifiedAt=Math.max(Number(state.dashboard.modifiedAt)||0,Number(state.logging.modifiedAt)||0);
  S.v285ResumeState=state;
  return state;
}
function v285ScheduleCloudSave(delay=450){
  if(V285_RESUME_APPLYING)return;
  clearTimeout(V285_RESUME_SAVE_TIMER);
  V285_RESUME_SAVE_TIMER=setTimeout(()=>{
    try{saveState();}catch(_){ }
  },Math.max(0,Number(delay)||0));
}
function v285TouchDashboard(){
  const state=v285EnsureResumeState();
  state.dashboard=v285CurrentDashboardState(v285Now());
  state.modifiedAt=Math.max(state.dashboard.modifiedAt,Number(state.logging?.modifiedAt)||0);
  v285MirrorDashboardSetting(state.dashboard);
  S.v285ResumeState=state;
  v285WriteLocalResume(state);
  v285ScheduleCloudSave(180);
}
function v285TouchLogging(active=S.logging===true,immediateCloud=false){
  const state=v285EnsureResumeState();
  const now=v285Now();
  state.logging={
    active:active===true,
    currentTask:active===true?v285Clone(S.currentTask,null):null,
    logDraft:active===true?v285Clone(S.logDraft||{},{}):{},
    entryDraft:active===true?v285Clone(S.entryDraft||{},{}):{},
    ui:active===true?v285LoggingUiSnapshot():v285NormalizeLoggingUi({}),
    modifiedAt:now
  };
  state.modifiedAt=Math.max(Number(state.dashboard?.modifiedAt)||0,now);
  S.v285ResumeState=state;
  v285WriteLocalResume(state);
  v285ScheduleCloudSave(immediateCloud?0:420);
}
function v285ApplyLoggingUi(ui){
  const x=v285NormalizeLoggingUi(ui);
  try{V238_LOG_LIBRARY_OPEN=x.libraryOpen;}catch(_){ }
  try{
    if(typeof V89_LOG!=='undefined'){
      V89_LOG.page=x.page;
      V89_LOG.categories=x.categories.slice();
      V89_LOG.status=x.status||'all';
      V89_LOG.priority=x.priority||'all';
      if(x.sort)V89_LOG.sort=x.sort;
      if(x.sortBase)V89_LOG.sortBase=x.sortBase;
      if(x.sortDir)V89_LOG.sortDir=x.sortDir;
    }
  }catch(_){ }
}
function v285ApplyResume(raw,{includeLocal=false}={}){
  const hasCloudResume=!!(raw?.resumeStateV285&&typeof raw.resumeStateV285==='object');
  const settingsDashboard=raw?.settings?.v285DashboardResume;
  let cloud=v285NormalizeResume(hasCloudResume?raw.resumeStateV285:{});
  if(!cloud.dashboard.modifiedAt&&settingsDashboard)cloud.dashboard=v285NormalizeDashboard(settingsDashboard);
  const local=includeLocal?v285ReadLocalResume():null;
  const localNorm=local?v285NormalizeResume(local):null;
  const dashboard=localNorm?v285NewerSection(cloud.dashboard,localNorm.dashboard,v285NormalizeDashboard):cloud.dashboard;
  const logging=localNorm?v285NewerSection(cloud.logging,localNorm.logging,v285NormalizeLogging):cloud.logging;
  const hasDashboard=!!(dashboard.modifiedAt||settingsDashboard||localNorm?.dashboard?.modifiedAt);
  const hasLogging=!!(logging.modifiedAt&&(hasCloudResume||localNorm?.logging?.modifiedAt));

  V285_RESUME_APPLYING=true;
  try{
    const state=v285EnsureResumeState();
    if(hasDashboard){
      state.dashboard=dashboard;
      S.v256DashboardAccordions=S.v256DashboardAccordions||{};
      S.v256DashboardAccordions.stopwatch=dashboard.stopwatchCollapsed===true;
      S.v256DashboardAccordions.runtimeCalculator=dashboard.runtimeCalculatorCollapsed===true;
      v285MirrorDashboardSetting(dashboard);
    }
    if(hasLogging){
      state.logging=logging;
      if(logging.active&&logging.currentTask){
        S.currentTask=v285Clone(logging.currentTask,S.currentTask);
        S.sessionActive=true;
        S.logging=true;
        S.logDraft=v285Clone(logging.logDraft,{});
        S.entryDraft=v285Clone(logging.entryDraft,{title:'',qty:1,libraryId:null});
        v285ApplyLoggingUi(logging.ui);
      }else{
        S.logging=false;
      }
    }
    state.modifiedAt=Math.max(Number(state.dashboard?.modifiedAt)||0,Number(state.logging?.modifiedAt)||0);
    S.v285ResumeState=state;
    v285WriteLocalResume(state);
  }finally{V285_RESUME_APPLYING=false;}
}

/* ---------- cloud / backup / merge persistence ----------------------- */
const v285SnapshotBase=snapshot;
snapshot=function(){
  const out=v285SnapshotBase.apply(this,arguments)||{};
  const resume=v285RefreshResumeForSnapshot();
  out.resumeStateV285=v285Clone(resume,resume);
  out.settings=out.settings||S.settings||{};
  out.settings.v285DashboardResume=v285Clone(resume.dashboard,resume.dashboard);
  return out;
};

const v285MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v285MergeStatesBase.apply(this,arguments)||{};
  const ar=v285NormalizeResume(a?.resumeStateV285||{}),br=v285NormalizeResume(b?.resumeStateV285||{});
  if(!ar.dashboard.modifiedAt&&a?.settings?.v285DashboardResume)ar.dashboard=v285NormalizeDashboard(a.settings.v285DashboardResume);
  if(!br.dashboard.modifiedAt&&b?.settings?.v285DashboardResume)br.dashboard=v285NormalizeDashboard(b.settings.v285DashboardResume);
  const dashboard=v285NewerSection(ar.dashboard,br.dashboard,v285NormalizeDashboard);
  const logging=v285NewerSection(ar.logging,br.logging,v285NormalizeLogging);
  out.resumeStateV285={format:V285_RESUME_FORMAT,dashboard,logging,modifiedAt:Math.max(dashboard.modifiedAt,logging.modifiedAt)};
  out.settings=out.settings||{};
  out.settings.v285DashboardResume=v285Clone(dashboard,dashboard);
  return out;
};

const v285ApplyStateBase=v46ApplyState;
v46ApplyState=function(data){
  const out=v285ApplyStateBase.apply(this,arguments);
  try{v285ApplyResume(data||{},{includeLocal:false});}catch(_){ }
  return out;
};

const v285LoadAllBase=loadAll;
loadAll=async function(){
  await v285LoadAllBase.apply(this,arguments);
  let source=null;
  try{source=await rawGet(STATE_KEY);}catch(_){ }
  try{v285ApplyResume(source||{},{includeLocal:true});}catch(_){ }
};

const v285VerifyCloudBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v285VerifyCloudBase.apply(this,arguments)||{ok:true,missing:[]};
  const problems=[...(base.missing||[])];
  const got=v285NormalizeResume(cloudState?.resumeStateV285||{});
  const want=v285NormalizeResume(expected?.resumeStateV285||{});
  if(Number(got.dashboard.modifiedAt)!==Number(want.dashboard.modifiedAt)||got.dashboard.stopwatchCollapsed!==want.dashboard.stopwatchCollapsed||got.dashboard.runtimeCalculatorCollapsed!==want.dashboard.runtimeCalculatorCollapsed){
    problems.push('Dashboard collapse resume state');
  }
  if(Number(got.logging.modifiedAt)!==Number(want.logging.modifiedAt)||got.logging.active!==want.logging.active||((got.logging.logDraft?.entries||[]).length!==((want.logging.logDraft?.entries||[]).length))){
    problems.push('In-progress logging resume state');
  }
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

/* ---------- settings / backup manifests ------------------------------ */
const v285PresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
  const state=v285RefreshResumeForSnapshot();
  v285MirrorDashboardSetting(state.dashboard);
  const preset=v285PresetBase.apply(this,arguments);
  preset.presetManifest=preset.presetManifest||{};
  preset.presetManifest.includes=Object.assign({},preset.presetManifest.includes||{}, {dashboardAccordionResumeV285:true});
  preset.presetManifest.excludes=Object.assign({},preset.presetManifest.excludes||{}, {inProgressLoggingDraft:true});
  return preset;
};
const v285BackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v285BackupBase.apply(this,arguments);
  payload.backupManifest=payload.backupManifest||{};
  payload.backupManifest.includes=Object.assign({},payload.backupManifest.includes||{}, {dashboardAccordionResumeV285:true,inProgressLoggingDraftV285:true});
  return payload;
};

/* ---------- interaction hooks --------------------------------------- */
function v285WrapLoggingAction(name,{active=null,immediate=false}={}){
  const base=App[name];
  if(typeof base!=='function')return;
  App[name]=function(){
    const out=base.apply(this,arguments);
    const finish=()=>v285TouchLogging(active===null?S.logging===true:active,immediate);
    if(out&&typeof out.then==='function')return out.finally(finish);
    finish();
    return out;
  };
}

// Accordion presentation state.
if(typeof App.v256ToggleDashboardAccordion==='function'){
  const v285ToggleAccordionBase=App.v256ToggleDashboardAccordion;
  App.v256ToggleDashboardAccordion=function(){
    const out=v285ToggleAccordionBase.apply(this,arguments);
    v285TouchDashboard();
    return out;
  };
}

// Lifecycle actions explicitly open/close the resumable logging workspace.
v285WrapLoggingAction('openLogForm',{active:true,immediate:true});
v285WrapLoggingAction('cancelLogForm',{active:false,immediate:true});
// Preserve an active logging draft when submitLog rejects validation or fails.
// Using active:false here previously erased a rejected draft from the resume cache.
v285WrapLoggingAction('submitLog',{active:null,immediate:true});
v285WrapLoggingAction('endSession',{active:false,immediate:true});
v285WrapLoggingAction('rotateTask',{active:false,immediate:true});
v285WrapLoggingAction('skipTask',{active:false,immediate:true});

// Every draft mutation that can happen without closing the workspace.
[
  'updateLogDraft','updateEntryDraft','selectLogTitle','addLogEntry','removeLogEntry',
  'updateLogEntryDetail','syncAmountFromEntries','toggleUpdateLibrary','v179SetLogMode',
  'v179UpdateEntryProgressDraft','v179SetLogEntryEnd','v252ToggleEntryDraftSeasonView',
  'v252SetEntryDraftSeason','v252SetEntryDraftSeasonEpisode','v252ToggleLogEntrySeasonView',
  'v252SetLogEntrySeason','v252SetLogEntrySeasonEpisode','v256RuntimeUseMinutes','stopwatchUseMinutes',
  'v238ToggleLogLibrary','v224LogSetSort','v224LogToggleSortDirection','v224LogSetFilter',
  'v224LogToggleCategory','v224LogClearCategories','v224LogClearFilters','v224LogPage'
].forEach(name=>v285WrapLoggingAction(name,{active:null,immediate:false}));

// Inline input handlers run before this bubbling listener, so this is a final
// safety net for fields added by future logging UI versions.
document.addEventListener('input',event=>{
  if(!S.logging)return;
  if(event.target?.closest?.('.log-form'))v285TouchLogging(true,false);
},true);
document.addEventListener('change',event=>{
  if(!S.logging)return;
  if(event.target?.closest?.('.log-form'))v285TouchLogging(true,false);
},true);

// Apply Dashboard state immediately after importing a Settings Preset.
if(typeof App.importSettingsPreset==='function'){
  const v285ImportPresetBase=App.importSettingsPreset;
  App.importSettingsPreset=async function(){
    const out=await v285ImportPresetBase.apply(this,arguments);
    try{
      const d=v285NormalizeDashboard(S.settings?.v285DashboardResume||{});
      if(d.modifiedAt){
        const state=v285EnsureResumeState();state.dashboard=d;S.v285ResumeState=state;
        S.v256DashboardAccordions=S.v256DashboardAccordions||{};
        S.v256DashboardAccordions.stopwatch=d.stopwatchCollapsed;
        S.v256DashboardAccordions.runtimeCalculator=d.runtimeCalculatorCollapsed;
        v285WriteLocalResume(state);v285ScheduleCloudSave(0);render();
      }
    }catch(_){ }
    return out;
  };
}

// Refresh-safe local save, independent of network timing.
window.addEventListener('beforeunload',()=>{
  try{v285RefreshResumeForSnapshot();v285WriteLocalResume();}catch(_){ }
});
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='hidden')return;
  try{v285RefreshResumeForSnapshot();v285WriteLocalResume();saveState();}catch(_){ }
});

function v285AuditState(){
  const resume=v285RefreshResumeForSnapshot();
  return {
    version:285,
    stopwatchCollapsed:resume.dashboard.stopwatchCollapsed,
    runtimeCalculatorCollapsed:resume.dashboard.runtimeCalculatorCollapsed,
    stopwatchDomCollapsed:document.querySelector('.stopwatch-card')?.classList.contains('is-collapsed')===true,
    runtimeCalculatorDomCollapsed:document.querySelector('.v256-runtime-card')?.classList.contains('is-collapsed')===true,
    loggingActive:resume.logging.active,
    loggingEntries:(resume.logging.logDraft?.entries||[]).length,
    loggingEndProgress:Number(resume.logging.logDraft?.entries?.[0]?.v179EndProgress)||0,
    loggingNote:String(resume.logging.logDraft?.note||''),
    currentTaskId:String(resume.logging.currentTask?.id||S.currentTask?.id||''),
    loggingModifiedAt:resume.logging.modifiedAt,
    snapshotResumePresent:!!snapshot().resumeStateV285,
    backupResumePresent:!!v148BuildFullBackup().resumeStateV285,
    presetDashboardPresent:!!v196BuildSettingsPreset().settings?.v285DashboardResume,
    cloudSyncVersion:201,
    fullBackupSchema:29,
    settingsPresetSchema:1,
    personalOrderExportVersion:4,
    collectionsExportVersion:2,
    pwaRelease:285
  };
}
Object.assign(App,{v285AuditState,v285TouchLogging,v285TouchDashboard});
window.MediaFlowV285={version:285,focus:'Resume Dashboard accordions and in-progress logging exactly where you left them'};
MediaFlowRuntime.version=V285_RUNTIME_VERSION;
