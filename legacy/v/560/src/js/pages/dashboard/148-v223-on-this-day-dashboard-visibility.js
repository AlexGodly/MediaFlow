/* ============================================================
   MediaFlow v223 — On This Day Dashboard Visibility
   ------------------------------------------------------------
   - Adds persistent Dashboard Settings control for On This Day.
   - The control sits directly below Today's Balance.
   - Hiding the section only affects Dashboard presentation.
   - On This Day data/theme sources remain available elsewhere.
   - Reuses the existing v192Dashboard persistence/cloud container.
   ============================================================ */
const V223_RUNTIME_VERSION=223;

/* Extend the canonical Dashboard visibility object without creating a second
   settings container. The existing v192 persistence/cloud merge wrappers call
   this normalizer dynamically, so the new field inherits their behavior. */
const v223NormalizeDashboardSettingsBase=v192NormalizeDashboardSettings;
v192NormalizeDashboardSettings=function(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  const out=v223NormalizeDashboardSettingsBase(raw);
  out.showOnThisDay=src.showOnThisDay!==false;
  return out;
};

DEFAULT_SETTINGS.v192Dashboard=v192NormalizeDashboardSettings(DEFAULT_SETTINGS.v192Dashboard);
v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);

/* Add the new Dashboard toggle while preserving all existing v192 actions. */
const v223ToggleDashboardSectionBase=v192ToggleDashboardSection;
v192ToggleDashboardSection=function(key){
  if(key!=='showOnThisDay')return v223ToggleDashboardSectionBase.apply(this,arguments);
  const cfg=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  cfg.showOnThisDay=!cfg.showOnThisDay;
  cfg.modifiedAt=Date.now();
  persistSettings();
  render();
  showToast(`On This Day ${cfg.showOnThisDay?'shown':'hidden'} on Dashboard`);
};
App.v192ToggleDashboardSection=v192ToggleDashboardSection;

/* Keep On This Day directly under Today's Balance in Dashboard Settings. */
v192DashboardVisibilitySettingsHtml=function(){
  const cfg=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  const row=(key,title,desc)=>`<div class="v192-dashboard-toggle-row"><div><b>${escapeHtml(title)}</b><div class="hint">${escapeHtml(desc)}</div></div><button type="button" class="toggle ${cfg[key]!==false?'on':''}" onclick="App.v192ToggleDashboardSection('${key}')" aria-label="Toggle ${escapeHtml(title)}"></button></div>`;
  return `<div class="card v192-dashboard-settings-card">
    <div class="v192-dashboard-settings-head"><div><b>Dashboard sections</b><div class="hint">Choose which optional Dashboard sections MediaFlow shows. Hiding a section never deletes its Library, History or settings data.</div></div></div>
    <div class="v192-dashboard-toggle-list">
      ${row('showTodayBalance',"Today's Balance",'Show or hide the Today’s Balance category section.')}
      ${row('showOnThisDay','On This Day','Show or hide the On This Day activity section on Dashboard.')}
      ${row('showRatingQueue','Rate Your Library','Show or hide the unrated-title queue on Dashboard.')}
      ${row('showMissingCovers','Missing Covers','Show or hide the queue for Library titles that do not have a cover URL.')}
      ${row('showStopwatch','Stopwatch','Show or hide the Stopwatch card on Dashboard. Its current timer state is preserved while hidden.')}
    </div>
  </div>`;
};

/* Dashboard-only visibility. The historical On This Day model and adaptive
   theme source are intentionally untouched when the Dashboard card is hidden. */
const v223RenderOnThisDayBase=renderOnThisDay;
renderOnThisDay=function(){
  const cfg=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  if(cfg.showOnThisDay===false)return '';
  return v223RenderOnThisDayBase.apply(this,arguments);
};

/* Explicit persistence / backup audit. The field lives inside the already
   persisted v192Dashboard object, so no destructive schema migration is needed. */
const v223VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v223VerifyCloudStateBase.apply(this,arguments);
  const problems=[...(base?.missing||[])];
  const cloudCfg=v192NormalizeDashboardSettings(cloudState?.settings?.v192Dashboard);
  const wantedCfg=v192NormalizeDashboardSettings(expected?.settings?.v192Dashboard);
  if(cloudCfg.showOnThisDay!==wantedCfg.showOnThisDay)problems.push('v223 On This Day Dashboard visibility');
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

const v223BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  const payload=v223BuildFullBackupBase.apply(this,arguments);
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  payload.backupManifest=payload.backupManifest||{};
  payload.backupManifest.includes=Object.assign({},payload.backupManifest.includes||{}, {
    dashboardOnThisDayVisibility:true,
    v223SettingsAudit:true
  });
  payload.backupManifest.v223={
    showOnThisDay:v192NormalizeDashboardSettings(payload.settings?.v192Dashboard).showOnThisDay,
    storedIn:'settings.v192Dashboard.showOnThisDay'
  };
  payload.backupManifest.note='Complete MediaFlow v223 modular backup. Adds persistent Dashboard visibility for On This Day directly below Today’s Balance in Dashboard Settings. Hiding the card affects Dashboard presentation only and preserves On This Day history/theme data. Preserves all v222 rendering stability safeguards and the stable v201 data architecture.';
  return payload;
};

const v223BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v223BackupManifestBase.apply(this,arguments);
  const cfg=v192NormalizeDashboardSettings(state?.settings?.v192Dashboard);
  manifest.includes=Object.assign({},manifest.includes||{}, {
    dashboardOnThisDayVisibility:true,
    v223SettingsAudit:true
  });
  manifest.v223={showOnThisDay:cfg.showOnThisDay,storedIn:'settings.v192Dashboard.showOnThisDay'};
  return manifest;
};

const v223BuildSettingsPresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
  const preset=v223BuildSettingsPresetBase.apply(this,arguments);
  preset.presetManifest=preset.presetManifest||{};
  preset.presetManifest.includes=Object.assign({},preset.presetManifest.includes||{}, {
    dashboardOnThisDayVisibility:true
  });
  return preset;
};

App.v223IsOnThisDayVisible=function(){
  return v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS).showOnThisDay!==false;
};
MediaFlowRuntime.version=V223_RUNTIME_VERSION;
