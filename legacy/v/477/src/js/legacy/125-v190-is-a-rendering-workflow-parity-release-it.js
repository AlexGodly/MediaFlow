/* v190 is a rendering/workflow parity release. It adds no new persistent
   fields, so v189 cloud state + Full Backup schema v23 remain canonical. */
const v190BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v190BuildFullBackupBase.apply(this,arguments);
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  payload.backupManifest.schemaVersion=V189_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v190 backup. Adds Normal/Dynamic Library batch-toolbar parity while preserving the v189 persistent Library last-seen data, v188 Overview/title-size settings, v186 Control Center and all prior Library, History, Logging, Respect XP, Statistics, theme and protected cloud data. v190 adds no new persistent fields; Full Backup schema remains v23 and Cloud Sync remains v189-compatible.';
  return payload;
};
const v190BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v190BackupManifestBase.apply(this,arguments);
  manifest.includes=Object.assign({},manifest.includes||{}, {
    normalLibraryBulkActions:true,
    dynamicLibraryBulkActions:true,
    sharedNormalDynamicBatchToolbar:true
  });
  manifest.v190={
    sharedLibraryBatchToolbar:true,
    persistentSchemaChanged:false,
    cloudSyncVersion:V189_CLOUD_SYNC_VERSION,
    backupSchemaVersion:V189_BACKUP_SCHEMA_VERSION
  };
  return manifest;
};

