/* ============================================================
   Persistence / merge / Sync Now / Full Backup
   ============================================================ */

const v181PersistSettingsBase=persistSettings;
persistSettings=function(){
  v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  v181EnsureLogging(S.settings||DEFAULT_SETTINGS);
  v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  return v181PersistSettingsBase.apply(this,arguments);
};

const v181LoadAllBase=loadAll;
loadAll=async function(){
  await v181LoadAllBase.apply(this,arguments);

  v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  v181EnsureLogging(S.settings||DEFAULT_SETTINGS);
  v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  v181ApplyCoverVars();
};

const v181SnapshotBase=snapshot;
snapshot=function(){
  v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  v181EnsureLogging(S.settings||DEFAULT_SETTINGS);
  v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);

  const x=v181SnapshotBase();
  x.settings=JSON.parse(
    JSON.stringify(S.settings||DEFAULT_SETTINGS)
  );
  x.cloudSyncVersion=Math.max(
    Number(x.cloudSyncVersion)||0,
    181
  );

  return x;
};

const v181ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v181ApplyStateBase.apply(this,arguments);

  v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  v181EnsureLogging(S.settings||DEFAULT_SETTINGS);
  v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  v181ApplyCoverVars();

  return result;
};

const v181MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v181MergeStatesBase(a,b)||{};
  out.settings=out.settings||{};

  const al=v181NormalizeLibrarySettings(
    a?.settings?.v181Library,
    a?.categories||out.categories||S.categories
  );
  const bl=v181NormalizeLibrarySettings(
    b?.settings?.v181Library,
    b?.categories||out.categories||S.categories
  );

  out.settings.v181Library=
    (Number(al.modifiedAt)||0)>=(Number(bl.modifiedAt)||0)
      ?al
      :bl;

  const ag=v181NormalizeLogging(a?.settings?.v181Logging);
  const bg=v181NormalizeLogging(b?.settings?.v181Logging);

  out.settings.v181Logging=
    (Number(ag.modifiedAt)||0)>=(Number(bg.modifiedAt)||0)
      ?ag
      :bg;

  const ac=v181NormalizeCoverSizes(a?.settings?.v181CoverSizes);
  const bc=v181NormalizeCoverSizes(b?.settings?.v181CoverSizes);

  out.settings.v181CoverSizes=
    (Number(ac.modifiedAt)||0)>=(Number(bc.modifiedAt)||0)
      ?ac
      :bc;

  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    181
  );

  return out;
};

const v181VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v181VerifyCloudStateBase(
    cloudState,
    expected
  );
  const problems=[...(base?.missing||[])];

  const cloudLibrary=v181NormalizeLibrarySettings(
    cloudState?.settings?.v181Library,
    cloudState?.categories||[]
  );
  const wantedLibrary=v181NormalizeLibrarySettings(
    expected?.settings?.v181Library,
    expected?.categories||[]
  );

  if(JSON.stringify(cloudLibrary)!==JSON.stringify(wantedLibrary)){
    problems.push('v181 Library experience');
  }

  const cloudLogging=v181NormalizeLogging(
    cloudState?.settings?.v181Logging
  );
  const wantedLogging=v181NormalizeLogging(
    expected?.settings?.v181Logging
  );

  if(JSON.stringify(cloudLogging)!==JSON.stringify(wantedLogging)){
    problems.push('Default logging mode');
  }

  const cloudCovers=v181NormalizeCoverSizes(
    cloudState?.settings?.v181CoverSizes
  );
  const wantedCovers=v181NormalizeCoverSizes(
    expected?.settings?.v181CoverSizes
  );

  if(JSON.stringify(cloudCovers)!==JSON.stringify(wantedCovers)){
    problems.push('Per-surface cover sizes');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

const v181BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  v181EnsureLogging(S.settings||DEFAULT_SETTINGS);
  v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);

  const payload=v181BuildFullBackupBase();

  payload.backupSchemaVersion=V181_BACKUP_SCHEMA_VERSION;
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
    V181_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v181 backup. Includes Classic/Dynamic Library mode, Dynamic category visibility/order and status order, all five Library title display modes, recommended Last Progress default logging preference, unlimited per-surface cover-size configuration, editable rich title metadata and all prior MediaFlow Library/History/Order/Respect XP/backup data. In-page logging mode switches remain intentionally temporary and are not account preferences.';

  return payload;
};

const v181BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v181BackupManifestBase(state,extras);
  const library=v181NormalizeLibrarySettings(
    state?.settings?.v181Library,
    state?.categories||[]
  );
  const logging=v181NormalizeLogging(
    state?.settings?.v181Logging
  );
  const covers=v181NormalizeCoverSizes(
    state?.settings?.v181CoverSizes
  );

  manifest.schemaVersion=V181_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign(
    {},
    manifest.includes||{},
    {
      classicDynamicLibraryMode:true,
      dynamicLibraryCategoryOrder:true,
      dynamicLibraryCategoryVisibility:true,
      dynamicLibraryStatusOrder:true,
      coverOnlyLibraryView:true,
      coverTitleLibraryView:true,
      globalCoverTitleDetails:true,
      quickTitleDetailEditing:true,
      defaultLoggingMode:true,
      unlimitedPerSurfaceCoverSizing:true
    }
  );

  manifest.v181Library={
    mode:library.mode,
    categoryOrderCount:library.categoryOrder.length,
    hiddenCategoryCount:library.hiddenCategoryIds.length,
    statusOrder:library.statusOrder.slice()
  };

  manifest.v181Logging={
    defaultMode:logging.defaultMode
  };

  manifest.v181CoverSizes=Object.assign({},covers);

  return manifest;
};

// v152 Automatic Backup resolves the final Full Backup builder dynamically,
// therefore all persistent v181 Settings are included automatically.




/* ============================================================
   MediaFlow v182
   - Minimalist, theme-aware Dynamic Library navigation
   - No horizontal Dynamic Library navigation scrollbars
   - Full Backup schema v19
   - Cloud/Sync Now audit bumped to v182
   - Automatic Backup keeps using the final Full Backup builder
   ============================================================ */

const V182_BACKUP_SCHEMA_VERSION=19;
const V182_CLOUD_SYNC_VERSION=182;

