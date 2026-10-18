/* ---------- Persistence / cloud / backup ---------- */
DEFAULT_SETTINGS.v191Library=v191NormalizeLibrarySettings(DEFAULT_SETTINGS.v191Library);
v191EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);

const v191PersistSettingsBase=persistSettings;
persistSettings=function(){v191EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);return v191PersistSettingsBase.apply(this,arguments);};
const v191LoadAllBase=loadAll;
loadAll=async function(){await v191LoadAllBase.apply(this,arguments);v191EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);};
const v191ApplyStateBase=v46ApplyState;
v46ApplyState=function(){const r=v191ApplyStateBase.apply(this,arguments);v191EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);return r;};

const v191SnapshotBase=snapshot;
snapshot=function(){
  v191EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const out=v191SnapshotBase.apply(this,arguments)||{};
  out.cloudSyncVersion=Math.max(Number(out.cloudSyncVersion)||0,V191_CLOUD_SYNC_VERSION);
  return out;
};
const v191MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v191MergeStatesBase.apply(this,arguments)||{};
  out.settings=out.settings||{};
  const left=v191NormalizeLibrarySettings(a?.settings?.v191Library);
  const right=v191NormalizeLibrarySettings(b?.settings?.v191Library);
  out.settings.v191Library=(right.modifiedAt>left.modifiedAt)?right:left;
  out.cloudSyncVersion=Math.max(Number(a?.cloudSyncVersion)||0,Number(b?.cloudSyncVersion)||0,Number(out.cloudSyncVersion)||0,V191_CLOUD_SYNC_VERSION);
  return out;
};

function v191HashString(text){
  let h=2166136261>>>0;
  const s=String(text||'');
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
  return h>>>0;
}
function v191StableValue(value){
  if(Array.isArray(value))return value.map(v191StableValue);
  if(value&&typeof value==='object'){
    const out={};
    for(const key of Object.keys(value).sort())out[key]=v191StableValue(value[key]);
    return out;
  }
  return value;
}
function v191DeletedArchiveAudit(state){
  const rows=[];
  let count=0;
  for(const entry of (state?.activityLog||[])){
    const items=Array.isArray(entry?.deletedItems)?entry.deletedItems:[];
    for(const item of items){
      if(!item?.id)continue;
      count++;
      rows.push(`${entry?.id||''}:${item.id}:${JSON.stringify(v191StableValue(item))}`);
    }
  }
  rows.sort();
  return {count,hash:v191HashString(rows.join('|'))};
}
const v191VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v191VerifyCloudStateBase.apply(this,arguments);
  const problems=[...(base?.missing||[])];
  const cloudCfg=v191NormalizeLibrarySettings(cloudState?.settings?.v191Library);
  const expectedCfg=v191NormalizeLibrarySettings(expected?.settings?.v191Library);
  if(JSON.stringify(cloudCfg)!==JSON.stringify(expectedCfg))problems.push('Clean Covers setting');
  const ca=v191DeletedArchiveAudit(cloudState),ea=v191DeletedArchiveAudit(expected);
  if(ca.count!==ea.count||ca.hash!==ea.hash)problems.push('Restorable deleted-title Library History');
  if(Number(cloudState?.cloudSyncVersion||0)<V191_CLOUD_SYNC_VERSION)problems.push('v191 cloud state version');
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

const v191BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v191EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const payload=v191BuildFullBackupBase.apply(this,arguments);
  payload.backupSchemaVersion=V191_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  payload.backupManifest.schemaVersion=V191_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v191 backup. Adds persistent Clean Covers preference for Normal/Dynamic cover views and complete restorable snapshots for Library title deletions, including Restore title / Restore all controls in Library History. Preserves v189 Last Seen data, v188 Library Overview/title-size settings, v186 Control Center and all prior Library, History, Logging, Respect XP, Statistics, theme and protected cloud data.';
  return payload;
};
const v191BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v191BackupManifestBase.apply(this,arguments);
  const cfg=v191NormalizeLibrarySettings(state?.settings?.v191Library);
  const audit=v191DeletedArchiveAudit(state);
  manifest.schemaVersion=V191_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{}, {
    cleanCovers:true,
    restorableDeletedTitles:true,
    restoreDeletedTitleFromLibraryHistory:true,
    restoreDeletedBatchFromLibraryHistory:true,
    v191CloudSyncAudit:true
  });
  manifest.v191={
    cloudSyncVersion:V191_CLOUD_SYNC_VERSION,
    backupSchemaVersion:V191_BACKUP_SCHEMA_VERSION,
    cleanCovers:cfg.cleanCovers,
    restorableDeletedTitleSnapshots:audit.count,
    deletedArchiveHash:audit.hash
  };
  return manifest;
};

