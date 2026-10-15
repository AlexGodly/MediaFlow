/* ============================================================
   Persistence / cloud / Sync Now / backup
   ============================================================ */

const v177PersistSettingsBase=persistSettings;
persistSettings=function(){
  v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  return v177PersistSettingsBase.apply(this,arguments);
};

const v177LoadAllBase=loadAll;
loadAll=async function(){
  await v177LoadAllBase.apply(this,arguments);
  v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
};

const v177SnapshotBase=snapshot;
snapshot=function(){
  v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  const x=v177SnapshotBase();

  x.settings=JSON.parse(
    JSON.stringify(S.settings||DEFAULT_SETTINGS)
  );
  x.cloudSyncVersion=Math.max(
    Number(x.cloudSyncVersion)||0,
    177
  );

  return x;
};

const v177ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v177ApplyStateBase.apply(this,arguments);
  v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  return result;
};

const v177MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v177MergeStatesBase(a,b)||{};

  const ac=v177NormalizeCoverSizes(
    a?.settings?.v177CoverSizes
  );
  const bc=v177NormalizeCoverSizes(
    b?.settings?.v177CoverSizes
  );

  out.settings=out.settings||{};
  out.settings.v177CoverSizes=
    (Number(ac.modifiedAt)||0)>=(Number(bc.modifiedAt)||0)
      ?ac
      :bc;

  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    177
  );

  return out;
};

const v177VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v177VerifyCloudStateBase(
    cloudState,
    expected
  );
  const problems=[...(base?.missing||[])];

  const cloud=v177NormalizeCoverSizes(
    cloudState?.settings?.v177CoverSizes
  );
  const wanted=v177NormalizeCoverSizes(
    expected?.settings?.v177CoverSizes
  );

  if(JSON.stringify(cloud)!==JSON.stringify(wanted)){
    problems.push('Library / Order cover sizes');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

const v177BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  const payload=v177BuildFullBackupBase();

  payload.backupSchemaVersion=V177_BACKUP_SCHEMA_VERSION;
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
    V177_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v177 backup. Includes independent responsive cover-size preferences for Library and Personal Order (50%–180%), alongside all prior rich title metadata, configurable pagination, category recovery, Advanced Import routing/exclusions, Old System Date View, adaptive cover collections, System Respect XP, Library/History, Personal Order, Rating Queue and portable preferences.';

  return payload;
};

const v177BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v177BackupManifestBase(
    state,
    extras
  );
  const sizes=v177NormalizeCoverSizes(
    state?.settings?.v177CoverSizes
  );

  manifest.schemaVersion=V177_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign(
    {},
    manifest.includes||{},
    {
      adjustableLibraryCoverSize:true,
      adjustableOrderCoverSize:true,
      responsiveCoverScaling:true
    }
  );

  manifest.coverSizes={
    libraryPercent:sizes.library,
    orderPercent:sizes.order
  };

  return manifest;
};

// v152 Automatic Backup resolves the final v148BuildFullBackup() at call time,
// so the v177 cover-size preferences are included automatically.



