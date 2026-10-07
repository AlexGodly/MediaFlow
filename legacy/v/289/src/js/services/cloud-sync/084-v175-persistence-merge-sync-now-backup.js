/* ============================================================
   v175 persistence / merge / Sync Now / backup
   ============================================================ */

const v175PersistSettingsBase=persistSettings;
persistSettings=function(){
  v175EnsurePageSizes(S.settings||DEFAULT_SETTINGS);
  return v175PersistSettingsBase.apply(this,arguments);
};

const v175LoadAllBase=loadAll;
loadAll=async function(){
  await v175LoadAllBase.apply(this,arguments);

  v175EnsurePageSizes(S.settings||DEFAULT_SETTINGS);
  S.orderPlan=v138NormalizeOrderPlan(
    S.orderPlan,
    S.library,
    S.categories
  );
};

const v175SnapshotBase=snapshot;
snapshot=function(){
  v175EnsurePageSizes(S.settings||DEFAULT_SETTINGS);
  S.orderPlan=v138NormalizeOrderPlan(
    S.orderPlan,
    S.library,
    S.categories
  );

  const x=v175SnapshotBase();

  x.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  x.orderPlan=JSON.parse(JSON.stringify(S.orderPlan||{}));
  x.cloudSyncVersion=Math.max(Number(x.cloudSyncVersion)||0,175);

  return x;
};

const v175ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v175ApplyStateBase.apply(this,arguments);

  v175EnsurePageSizes(S.settings||DEFAULT_SETTINGS);
  S.orderPlan=v138NormalizeOrderPlan(
    d?.orderPlan,
    S.library,
    S.categories
  );

  V89_LOG.page=0;
  V89_LOG.pageSize=v175PageSize('loggingLibrary');
  V175_BATCH_LIBRARY.pages={};
  V175_BATCH_LIBRARY.activeRow=-1;

  return result;
};

const v175MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v175MergeStatesBase(a,b)||{};

  const ac=v175NormalizePageSizes(a?.settings?.v175PageSizes);
  const bc=v175NormalizePageSizes(b?.settings?.v175PageSizes);
  const chosen=(Number(ac.modifiedAt)||0)>=(Number(bc.modifiedAt)||0)
    ?ac
    :bc;

  out.settings=out.settings||{};
  out.settings.v175PageSizes=chosen;

  out.orderPlan=v138NormalizeOrderPlan(
    out.orderPlan,
    out.library||S.library,
    out.categories||S.categories
  );

  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    175
  );

  return out;
};

const v175VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v175VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

  const cloudSizes=v175NormalizePageSizes(
    cloudState?.settings?.v175PageSizes
  );
  const wantedSizes=v175NormalizePageSizes(
    expected?.settings?.v175PageSizes
  );

  if(JSON.stringify(cloudSizes)!==JSON.stringify(wantedSizes)){
    problems.push('Library pagination sizes');
  }

  const cloudOrder=v138NormalizeOrderPlan(
    cloudState?.orderPlan,
    cloudState?.library||[],
    cloudState?.categories||[]
  );
  const wantedOrder=v138NormalizeOrderPlan(
    expected?.orderPlan,
    expected?.library||[],
    expected?.categories||[]
  );

  if(
    Number(cloudOrder.orderedPageSize)!==
    Number(wantedOrder.orderedPageSize)
  ){
    problems.push('Ordered-title page size');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

const v175BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v175EnsurePageSizes(S.settings||DEFAULT_SETTINGS);
  S.orderPlan=v138NormalizeOrderPlan(
    S.orderPlan,
    S.library,
    S.categories
  );

  const payload=v175BuildFullBackupBase();

  payload.backupSchemaVersion=V175_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  payload.orderPlan=JSON.parse(JSON.stringify(S.orderPlan||{}));

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V175_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v175 backup. Includes configurable pagination sizes for main Library, Order Library picker, Logging Library picker, Batch Log Library browser, and ordered Personal Order titles; plus all prior category recovery, advanced import routing/exclusions, Old System Date View, adaptive cover collections, System Respect XP, Personal Order, Library/History, Rating Queue and portable preferences. Batch filter selections themselves are temporary UI state; their persistent page-size preference is included. Authentication credentials and filesystem permission handles remain intentionally non-portable.';

  return payload;
};

const v175BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v175BackupManifestBase(state,extras);
  const sizes=v175NormalizePageSizes(
    state?.settings?.v175PageSizes
  );
  const order=v138NormalizeOrderPlan(
    state?.orderPlan,
    state?.library||[],
    state?.categories||[]
  );

  manifest.schemaVersion=V175_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{},{
    configurableLibraryPagination:true,
    mainLibraryPageSize:true,
    orderLibraryPageSize:true,
    loggingLibraryPageSize:true,
    batchLibraryPageSize:true,
    orderedTitlesPageSize:true,
    batchLogFullLibraryFilters:true
  });

  manifest.pagination=Object.assign({},manifest.pagination||{},{
    library:sizes.library,
    orderLibrary:sizes.orderLibrary,
    loggingLibrary:sizes.loggingLibrary,
    batchLibrary:sizes.batchLibrary,
    orderedTitles:Number(order.orderedPageSize)||50
  });

  return manifest;
};

// v152 Automatic Backup resolves the final v148BuildFullBackup() at runtime,
// therefore every persistent v175 pagination setting is included automatically.



