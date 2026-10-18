/* ============================================================
   MediaFlow v184 — Settings readability metadata
   UI-only release: no persisted data shape changed, so Full Backup
   schema v20 and Cloud Sync state v183 remain intentionally compatible.
   ============================================================ */
const v184BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v184BuildFullBackupBase.apply(this,arguments);
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  if(payload.backupManifest){
    payload.backupManifest.note=
      'Complete MediaFlow v185 backup. Preserves the full v183 data schema and all prior Library, History, Dynamic Library, Overview, Logging, cover-size, recommendation/Respect XP, theme and cloud-synced data. v185 is a title-details readability release and does not introduce a new persisted data field.';
  }
  return payload;
};

const v184BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v184BackupManifestBase.apply(this,arguments);
  manifest.includes=Object.assign({},manifest.includes||{}, {
    readableDynamicLibrarySettingsText:true,
    readableCategoryRecoverySettingsText:true
  });
  manifest.v185={
    settingsTypographyReadability:true,
    dataSchemaChanged:false
  };
  return manifest;
};



/* v186 hotfix: keep control-center logic inside the main MediaFlow scope. */
