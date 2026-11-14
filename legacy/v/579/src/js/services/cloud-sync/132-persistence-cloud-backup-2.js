/* ---------- Persistence / cloud / backup ---------- */
DEFAULT_SETTINGS.v192Dashboard=v192NormalizeDashboardSettings(DEFAULT_SETTINGS.v192Dashboard);
v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);

const v192PersistSettingsBase=persistSettings;
persistSettings=function(){
  v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  return v192PersistSettingsBase.apply(this,arguments);
};
const v192LoadAllBase=loadAll;
loadAll=async function(){
  await v192LoadAllBase.apply(this,arguments);
  v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  V192_MISSING_COVER_QUEUE_LOADED=false;
  v192LoadMissingCoverQueue();
};
const v192SnapshotBase=snapshot;
snapshot=function(){
  v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  const out=v192SnapshotBase.apply(this,arguments)||{};
  out.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  out.cloudSyncVersion=Math.max(Number(out.cloudSyncVersion)||0,V192_CLOUD_SYNC_VERSION);
  return out;
};
const v192ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v192ApplyStateBase.apply(this,arguments);
  v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  return result;
};
const v192MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v192MergeStatesBase.apply(this,arguments)||{};
  out.settings=out.settings||{};
  const av=v192NormalizeDashboardSettings(a?.settings?.v192Dashboard);
  const bv=v192NormalizeDashboardSettings(b?.settings?.v192Dashboard);
  out.settings.v192Dashboard=(Number(av.modifiedAt)||0)>=(Number(bv.modifiedAt)||0)?av:bv;
  out.cloudSyncVersion=Math.max(Number(a?.cloudSyncVersion)||0,Number(b?.cloudSyncVersion)||0,Number(out.cloudSyncVersion)||0,V192_CLOUD_SYNC_VERSION);
  return out;
};
const v192VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v192VerifyCloudStateBase.apply(this,arguments);
  const problems=[...(base?.missing||[])];
  const cloudCfg=v192NormalizeDashboardSettings(cloudState?.settings?.v192Dashboard);
  const wantedCfg=v192NormalizeDashboardSettings(expected?.settings?.v192Dashboard);
  if(JSON.stringify(cloudCfg)!==JSON.stringify(wantedCfg))problems.push('v193 Dashboard section visibility');
  if(Number(cloudState?.cloudSyncVersion||0)<V192_CLOUD_SYNC_VERSION)problems.push('v193 cloud state version');
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};
const v192BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  const payload=v192BuildFullBackupBase.apply(this,arguments);
  payload.backupSchemaVersion=V192_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  payload.backupManifest.schemaVersion=V192_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v193 backup. Adds persistent Dashboard visibility for Stopwatch alongside Today’s Balance, Rate Your Library and Missing Covers. Hiding Stopwatch affects only Dashboard presentation and preserves the timer state. Preserves v192 Missing Covers, v191 Clean Covers/deletion recovery, v189 Last Seen, v188 Library Overview/title size, v186 Control Center and all prior Library, History, Logging, Respect XP, Statistics, theme and protected cloud data.';
  return payload;
};
const v192BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v192BackupManifestBase.apply(this,arguments);
  const cfg=v192NormalizeDashboardSettings(state?.settings?.v192Dashboard);
  manifest.schemaVersion=V192_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{}, {
    dashboardTodayBalanceVisibility:true,
    dashboardRatingQueueVisibility:true,
    dashboardMissingCoversVisibility:true,
    dashboardMissingCoversQueue:true,
    dashboardStopwatchVisibility:true,
    v193CloudSyncAudit:true
  });
  manifest.v193={
    cloudSyncVersion:V192_CLOUD_SYNC_VERSION,
    backupSchemaVersion:V192_BACKUP_SCHEMA_VERSION,
    showTodayBalance:cfg.showTodayBalance,
    showRatingQueue:cfg.showRatingQueue,
    showMissingCovers:cfg.showMissingCovers,
    showStopwatch:cfg.showStopwatch,
    missingCoverTitles:(state?.library||[]).filter(i=>i?.id&&!String(i.coverUrl||'').trim()).length
  };
  return manifest;
};


/* ============================================================
   MediaFlow v193
   - Dashboard Stopwatch Show/Hide setting
   - Hides only the Stopwatch card; Rate Your Library and Missing Covers
     remain controlled independently by their own Dashboard settings.
   - Stopwatch timer state is preserved while the card is hidden.
   ============================================================ */
const v193StopwatchHtmlBase=stopwatchHtml;
stopwatchHtml=function(){
  const html=v193StopwatchHtmlBase.apply(this,arguments);
  const cfg=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  if(cfg.showStopwatch!==false)return html;
  const host=document.createElement('div');
  host.innerHTML=html;
  host.querySelector('.stopwatch-card')?.remove();
  return host.innerHTML;
};


