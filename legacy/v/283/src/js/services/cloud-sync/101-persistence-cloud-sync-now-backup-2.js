/* ============================================================
   Persistence / cloud / Sync Now / backup
   ============================================================ */

const v179PersistSettingsBase=persistSettings;
persistSettings=function(){
  v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);
  return v179PersistSettingsBase.apply(this,arguments);
};

const v179LoadAllBase=loadAll;
loadAll=async function(){
  await v179LoadAllBase.apply(this,arguments);
  v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);
};

const v179SnapshotBase=snapshot;
snapshot=function(){
  v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);
  const x=v179SnapshotBase();

  x.settings=JSON.parse(
    JSON.stringify(S.settings||DEFAULT_SETTINGS)
  );
  x.cloudSyncVersion=Math.max(
    Number(x.cloudSyncVersion)||0,
    179
  );

  return x;
};

const v179ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v179ApplyStateBase.apply(this,arguments);
  v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);
  return result;
};

const v179MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v179MergeStatesBase(a,b)||{};

  const am=v179NormalizeLoggingModes(
    a?.settings?.v179LoggingModes
  );
  const bm=v179NormalizeLoggingModes(
    b?.settings?.v179LoggingModes
  );

  out.settings=out.settings||{};
  out.settings.v179LoggingModes=
    (Number(am.modifiedAt)||0)>=(Number(bm.modifiedAt)||0)
      ?am
      :bm;

  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    179
  );

  return out;
};

const v179VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v179VerifyCloudStateBase(
    cloudState,
    expected
  );
  const problems=[...(base?.missing||[])];

  const cloud=v179NormalizeLoggingModes(
    cloudState?.settings?.v179LoggingModes
  );
  const wanted=v179NormalizeLoggingModes(
    expected?.settings?.v179LoggingModes
  );

  if(JSON.stringify(cloud)!==JSON.stringify(wanted)){
    problems.push('Logging method preferences');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

const v179BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);
  const payload=v179BuildFullBackupBase();

  payload.backupSchemaVersion=V179_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(
    JSON.stringify(S.settings||DEFAULT_SETTINGS)
  );

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=
    V179_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v179 backup. Includes remembered logging-method preferences for normal logging and Batch Log: direct amount consumed or final progress. In final-progress mode MediaFlow calculates consumed units from the title’s starting Library progress while preserving the existing History, XP, repeat, completion, scheduler and Library-update pipelines.';

  return payload;
};

const v179BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v179BackupManifestBase(
    state,
    extras
  );
  const modes=v179NormalizeLoggingModes(
    state?.settings?.v179LoggingModes
  );

  manifest.schemaVersion=V179_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign(
    {},
    manifest.includes||{},
    {
      dualLoggingModes:true,
      finalProgressLogging:true,
      batchFinalProgressLogging:true,
      automaticConsumedDifference:true
    }
  );

  manifest.loggingModes={
    single:modes.single,
    batch:modes.batch
  };

  return manifest;
};

// v152 Automatic Backup resolves the final Full Backup builder dynamically.



