/* ============================================================
   MediaFlow v163 — Dynamic Cover Theme rotation control
   ============================================================ */

const V163_BACKUP_SCHEMA_VERSION=6;

function v163ClampDynamicInterval(value){
  const n=Math.round(Number(value)||30);
  return Math.max(5,Math.min(3600,n));
}

function v163EnsureDynamicRotationSetting(settings){
  const target=(settings&&typeof settings==='object')?settings:{};
  target.v163DynamicThemeIntervalSec=v163ClampDynamicInterval(
    target.v163DynamicThemeIntervalSec
  );
  return target;
}

v163EnsureDynamicRotationSetting(S.settings||DEFAULT_SETTINGS);

const v163EnsureThemeSettingsObjectBase=v162EnsureThemeSettingsObject;
v162EnsureThemeSettingsObject=function(settings){
  const target=v163EnsureThemeSettingsObjectBase(settings);
  return v163EnsureDynamicRotationSetting(target);
};

const v163EnsureThemeSettingsBase=v162EnsureThemeSettings;
v162EnsureThemeSettings=function(){
  const target=v163EnsureThemeSettingsBase();
  v163EnsureDynamicRotationSetting(target);
  return target;
};

function v163DynamicThemeInterval(){
  return v163ClampDynamicInterval(
    v162EnsureThemeSettings().v163DynamicThemeIntervalSec
  );
}

function v163SetDynamicThemeInterval(value){
  const settings=v162EnsureThemeSettings();
  settings.v163DynamicThemeIntervalSec=v163ClampDynamicInterval(value);

  clearTimeout(V159_DYNAMIC_SOURCE_TIMER);
  V159_DYNAMIC_SOURCE_TIMER=null;

  persistSettings();
  render();

  if(v162ThemeMode()==='dynamic'){
    v146ScheduleDynamicTheme();
    v159EnsureDynamicSourceTimer();
  }
}

// Exact user-controlled interval replaces v159's random 24–36 second cadence.
v159EnsureDynamicSourceTimer=function(){
  if(!S.settings?.dynamicCoverTheme || v162ThemeMode()!=='dynamic'){
    clearTimeout(V159_DYNAMIC_SOURCE_TIMER);
    V159_DYNAMIC_SOURCE_TIMER=null;
    return;
  }

  if(V159_DYNAMIC_SOURCE_TIMER)return;

  const delay=v163DynamicThemeInterval()*1000;

  V159_DYNAMIC_SOURCE_TIMER=setTimeout(()=>{
    V159_DYNAMIC_SOURCE_TIMER=null;

    if(S.settings?.dynamicCoverTheme && v162ThemeMode()==='dynamic'){
      V159_FORCED_THEME_SOURCE=null;
      v146ScheduleDynamicTheme();
      v159EnsureDynamicSourceTimer();
    }
  },delay);
};

// On This Day can continue its visual 12s hero rotation, but it no longer
// forces Dynamic Cover Theme to switch before the configured interval.
const v163ApplyOtdHeroBase=v159ApplyOtdHero;
v159ApplyOtdHero=function(index,options={}){
  if(v162ThemeMode()==='dynamic'){
    options=Object.assign({},options,{forceTheme:false});
  }
  return v163ApplyOtdHeroBase(index,options);
};

// Add interval control to the existing Dynamic Cover Theme panel.
const v163CollectionPanelBase=v162CollectionPanelHtml;
v162CollectionPanelHtml=function(mode){
  let out=v163CollectionPanelBase(mode);
  if(mode!=='dynamic')return out;

  const controls=`<div class="v162-theme-controls">
    <div class="field" style="margin:0">
      <label class="field-label">Rotate every (seconds)</label>
      <input type="number" min="5" max="3600" step="1"
        value="${v163DynamicThemeInterval()}"
        onchange="App.v163SetDynamicThemeInterval(this.value)">
    </div>
  </div>
  <div class="v162-rotation-note">Dynamic Cover Theme changes its active recommendation / On This Day theme source on this exact interval. The Dashboard's On This Day title can still rotate visually without forcing an early theme change.</div>`;

  out=out.replace(
    '<div id="v146-dynamic-theme-status" class="v162-theme-status"><span>Analyzing cover…</span></div>',
    controls+'<div id="v146-dynamic-theme-status" class="v162-theme-status"><span>Analyzing cover…</span></div>'
  );

  return out;
};

// ---- Persistence / cloud verification / backup -----------------------------

const v163PersistSettingsBase=persistSettings;
persistSettings=function(){
  v163EnsureDynamicRotationSetting(S.settings||DEFAULT_SETTINGS);
  return v163PersistSettingsBase.apply(this,arguments);
};

const v163SnapshotBase=snapshot;
snapshot=function(){
  v163EnsureDynamicRotationSetting(S.settings||DEFAULT_SETTINGS);
  const x=v163SnapshotBase();
  x.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  x.cloudSyncVersion=Math.max(Number(x.cloudSyncVersion)||0,163);
  return x;
};

const v163ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v163ApplyStateBase.apply(this,arguments);
  v163EnsureDynamicRotationSetting(S.settings||DEFAULT_SETTINGS);

  clearTimeout(V159_DYNAMIC_SOURCE_TIMER);
  V159_DYNAMIC_SOURCE_TIMER=null;

  return result;
};

const v163MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v163MergeStatesBase(a,b)||{};
  out.settings=v163EnsureDynamicRotationSetting(out.settings||{});
  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    163
  );
  return out;
};

const v163VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v163VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

  const cloud=v163EnsureDynamicRotationSetting(
    JSON.parse(JSON.stringify(cloudState?.settings||{}))
  );
  const wanted=v163EnsureDynamicRotationSetting(
    JSON.parse(JSON.stringify(expected?.settings||{}))
  );

  if(
    Number(cloud.v163DynamicThemeIntervalSec)!==
    Number(wanted.v163DynamicThemeIntervalSec)
  ){
    problems.push('Dynamic Cover Theme rotation interval');
  }

  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

const v163BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v163EnsureDynamicRotationSetting(S.settings||DEFAULT_SETTINGS);

  const payload=v163BuildFullBackupBase();
  payload.backupSchemaVersion=V163_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V163_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v163 backup. Includes configurable Dynamic Cover Theme rotation interval plus all v162 adaptive theme collections, navigation, Library/History, Personal Order, Old System, Rating Queue and portable preferences. Authentication credentials and filesystem permission handles remain intentionally non-portable.';

  return payload;
};

const v163BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v163BackupManifestBase(state,extras);

  manifest.schemaVersion=V163_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{},{
    dynamicCoverThemeRotationInterval:true
  });

  return manifest;
};

Object.assign(App,{
  v163SetDynamicThemeInterval
});



