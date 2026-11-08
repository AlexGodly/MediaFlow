/* ---------- Full Backup / Automatic Backup -------------------- */

const v178BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v178BuildFullBackupBase();

  payload.backupSchemaVersion=V178_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=
    V178_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v178 backup. Rich imported Library metadata is editable in the normal title editor. Manually changed metadata fields are marked on the Library record and protected from later media-service imports. Includes year, format, runtime, release date, season, content rating, community score, source material, demographic, studios, producers, genres, themes and synopsis alongside all prior MediaFlow data.';

  return payload;
};

const v178BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v178BackupManifestBase(
    state,
    extras
  );
  const audit=v178ManualMetadataAudit(state);

  manifest.schemaVersion=V178_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign(
    {},
    manifest.includes||{},
    {
      editableRichLibraryMetadata:true,
      manualRichMetadataProtection:true,
      editableImportedYear:true,
      editableImportedSynopsis:true,
      editableImportedGenresThemes:true,
      editableImportedStudiosProducers:true
    }
  );

  manifest.counts=Object.assign(
    {},
    manifest.counts||{},
    {
      titlesWithManualRichMetadata:audit.count
    }
  );

  return manifest;
};

// v152 Automatic Backup resolves the final builder dynamically, so manually
// edited metadata and its import-protection flags are included automatically.



