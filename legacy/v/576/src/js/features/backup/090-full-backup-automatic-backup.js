/* ---------- Full Backup / Automatic Backup ------------------- */

const v176BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v176BuildFullBackupBase();

  payload.backupSchemaVersion=V176_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V176_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v176 backup. Library title records may include source-provided rich metadata such as synopsis, format, genres, themes, studios, producers, source material, demographic, runtime, content rating, release date, season and community score. These fields are preserved by cloud merge, protected Sync Now verification, Full Backup, Automatic Backup and generic media-service JSON/CSV exchange export/import. No missing metadata is invented.';

  return payload;
};

const v176BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v176BackupManifestBase(state,extras);
  const audit=v176LibraryMetadataAudit(state);

  manifest.schemaVersion=V176_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{},{
    richLibraryMetadata:true,
    importedSynopsis:true,
    importedGenresThemes:true,
    importedStudiosProducers:true,
    importedSourceMaterial:true,
    importedDemographics:true,
    importedRuntimeAndFormat:true,
    importedReleaseMetadata:true
  });

  manifest.counts=Object.assign({},manifest.counts||{},{
    titlesWithRichMetadata:audit.count
  });

  return manifest;
};

// v152 Automatic Backup resolves the final builder at call time, so v176 rich
// title metadata is automatically included.



