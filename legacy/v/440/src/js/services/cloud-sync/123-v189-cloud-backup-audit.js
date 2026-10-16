/* v189 cloud / backup audit. */
const v189SnapshotBase=snapshot;
snapshot=function(){
  const out=v189SnapshotBase.apply(this,arguments)||{};
  out.cloudSyncVersion=Math.max(Number(out.cloudSyncVersion)||0,V189_CLOUD_SYNC_VERSION);
  return out;
};
const v189MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v189MergeStatesBase.apply(this,arguments)||{};
  out.cloudSyncVersion=Math.max(Number(a?.cloudSyncVersion)||0,Number(b?.cloudSyncVersion)||0,Number(out.cloudSyncVersion)||0,V189_CLOUD_SYNC_VERSION);
  return out;
};
function v189LastSeenMismatch(cloudState,expected){
  const cloud=new Map((cloudState?.library||[]).map(i=>[String(i?.id||''),Number(i?.lastSeenAt)||0]));
  for(const item of (expected?.library||[])){
    const id=String(item?.id||'');
    if(!id)continue;
    if((Number(item?.lastSeenAt)||0)!==(cloud.get(id)||0))return true;
  }
  return false;
}
const v189VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v189VerifyCloudStateBase.apply(this,arguments);
  const problems=[...(base?.missing||[])];
  if(v189LastSeenMismatch(cloudState,expected))problems.push('Library last-seen timestamps');
  if(Number(cloudState?.cloudSyncVersion||0)<V189_CLOUD_SYNC_VERSION)problems.push('v189 cloud state version');
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

const v189BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v189BuildFullBackupBase.apply(this,arguments);
  payload.backupSchemaVersion=V189_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  payload.backupManifest.schemaVersion=V189_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v189 backup. Adds persistent Title Details last-seen timestamps used by Library sorting, expanded Library sorting (logging update, last edit, last seen, date added, totals and random), unfinished-only filtering, Dynamic Library bulk actions/selection, and the Normal/Dynamic Library naming update. Preserves all v188 Library Overview/title-size settings, the v186 Control Center and all prior Library, History, Logging, Respect XP, Statistics, theme and protected cloud data.';
  return payload;
};
const v189BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v189BackupManifestBase.apply(this,arguments);
  const seen=(state?.library||[]).filter(i=>Number(i?.lastSeenAt)>0).length;
  manifest.schemaVersion=V189_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{}, {
    expandedLibrarySorting:true,
    randomLibrarySort:true,
    unfinishedOnlyLibraryFilter:true,
    titleDetailsLastSeenTracking:true,
    dynamicLibraryBulkActions:true,
    normalDynamicLibraryNaming:true,
    v189CloudSyncAudit:true
  });
  manifest.v189={
    cloudSyncVersion:V189_CLOUD_SYNC_VERSION,
    backupSchemaVersion:V189_BACKUP_SCHEMA_VERSION,
    titlesWithLastSeenTimestamp:seen
  };
  return manifest;
};


