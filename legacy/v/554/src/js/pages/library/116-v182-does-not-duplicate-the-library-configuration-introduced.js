/* v182 does not duplicate the Library configuration introduced in v181.
   The same category order/visibility, status order, active category/status,
   display mode, default Logging mode and cover-size settings remain the
   canonical persistent data. The redesign is presentation-only and therefore
   remains automatically compatible with v181 backups. */

/* Cloud snapshots now identify themselves as v182 while preserving the entire
   v181 Settings object and every older persistent field. */
const v182SnapshotBase=snapshot;
snapshot=function(){
  const out=v182SnapshotBase.apply(this,arguments)||{};
  out.cloudSyncVersion=Math.max(
    Number(out.cloudSyncVersion)||0,
    V182_CLOUD_SYNC_VERSION
  );
  return out;
};

const v182MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v182MergeStatesBase.apply(this,arguments)||{};
  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    V182_CLOUD_SYNC_VERSION
  );
  return out;
};

/* Protected Sync Now keeps every prior verification and additionally verifies
   that the final cloud snapshot is from the v182 state pipeline. */
const v182VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v182VerifyCloudStateBase.apply(this,arguments);
  const problems=[...(base?.missing||[])];

  if(Number(cloudState?.cloudSyncVersion||0)<V182_CLOUD_SYNC_VERSION){
    problems.push('v182 cloud state version');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

/* Full Backup / manual export / Automatic Backup.
   v152 Automatic Backup resolves v148BuildFullBackup dynamically, so wrapping
   the final builder here updates both manual and automatic exports. */
const v182BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v182BuildFullBackupBase.apply(this,arguments);

  payload.backupSchemaVersion=V182_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V182_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note=
    'Complete MediaFlow v182 backup. Includes the complete v181 Dynamic Library configuration, five Library display modes, default Logging preference, unlimited per-surface cover sizing, all recommendation/reroll and System Respect XP history, plus every prior Library, History, Order, progression, theme and cloud-synced field. v182 redesigns Dynamic Library navigation as minimalist theme-aware category/status tabs with no horizontal navigation scrollbar. The visual redesign introduces no destructive data migration and remains backward-compatible with older complete MediaFlow backups.';

  return payload;
};

const v182BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v182BackupManifestBase.apply(this,arguments);

  manifest.schemaVersion=V182_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign(
    {},
    manifest.includes||{},
    {
      minimalistDynamicLibraryNavigation:true,
      themeAwareDynamicLibraryNavigation:true,
      noHorizontalDynamicNavigationScrollbar:true,
      v181DynamicLibraryDataCompatibility:true,
      v182CloudSyncAudit:true
    }
  );

  manifest.v182DynamicLibrary={
    navigationStyle:'minimal-theme-aware',
    horizontalNavigationScrollbar:false,
    persistentConfigurationSource:'settings.v181Library'
  };

  manifest.v182Cloud={
    cloudSyncVersion:V182_CLOUD_SYNC_VERSION,
    verifiesV181LibraryExperience:true,
    verifiesDefaultLoggingMode:true,
    verifiesPerSurfaceCoverSizes:true
  };


  return manifest;
};


