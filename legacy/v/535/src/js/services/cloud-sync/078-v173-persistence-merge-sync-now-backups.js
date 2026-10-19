/* ============================================================
   v173 persistence / merge / Sync Now / backups
   ============================================================ */

const v173PersistSettingsBase=persistSettings;
persistSettings=function(){
  v162EnsureThemeSettings();
  return v173PersistSettingsBase.apply(this,arguments);
};

const v173SnapshotBase=snapshot;
snapshot=function(){
  v162EnsureThemeSettings();
  S.orderPlan=v138NormalizeOrderPlan(S.orderPlan,S.library,S.categories);
  S.oldSystem=v153NormalizeOldSystem(S.oldSystem);

  const x=v173SnapshotBase();

  x.orderPlan=v173Clone(S.orderPlan,{});
  x.oldSystem=v173Clone(S.oldSystem,V153_OLD_SYSTEM_DEFAULT);
  x.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  x.cloudSyncVersion=Math.max(Number(x.cloudSyncVersion)||0,173);

  return x;
};

const v173ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v173ApplyStateBase.apply(this,arguments);

  S.orderPlan=v138NormalizeOrderPlan(d?.orderPlan,S.library,S.categories);
  S.oldSystem=v153NormalizeOldSystem(d?.oldSystem);
  v162EnsureThemeSettings();

  V162_ROTATION_INDEX['recommended-only']=0;
  V162_ROTATION_INDEX['onthisday-only']=0;
  V162_ROTATION_INDEX['source-picker']=0;
  v162StopRotation();

  return result;
};

function v173ChooseModifiedConfig(a,b,normalizer,kind){
  const aa=normalizer(a,kind);
  const bb=normalizer(b,kind);

  return (Number(aa.modifiedAt)||0)>=(Number(bb.modifiedAt)||0)
    ?aa
    :bb;
}

const v173MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v173MergeStatesBase(a,b)||{};

  // Order plan is still chosen by the existing modifiedAt merge. Normalize the
  // final choice so pagination preference survives old/new devices.
  out.orderPlan=v138NormalizeOrderPlan(
    out.orderPlan,
    out.library||S.library,
    out.categories||S.categories
  );

  // Old System's existing modifiedAt merge remains authoritative; the final
  // normalizer now also preserves Date View fields/mode.
  out.oldSystem=v153NormalizeOldSystem(out.oldSystem);

  out.settings=v162EnsureThemeSettingsObject(out.settings||{});

  const choose=(key,kind)=>{
    const ac=a?.settings?.[key];
    const bc=b?.settings?.[key];

    out.settings[key]=v173ChooseModifiedConfig(
      ac,
      bc,
      v173NormalizeThemeCollectionConfig,
      kind
    );
  };

  choose('v173RecommendedTheme','simple');
  choose('v173OnThisDayTheme','simple');
  choose('v173SourcePickerTheme','picker');

  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    173
  );

  return out;
};

const v173StateCompletenessBase=v155StateCompleteness;
v155StateCompleteness=function(state){
  const base=v173StateCompletenessBase(state);
  const missing=[...(base?.missing||[])];

  if(!state?.orderPlan||typeof state.orderPlan!=='object'){
    missing.push('Personal Order');
  }
  if(!state?.oldSystem||typeof state.oldSystem!=='object'){
    missing.push('Old System');
  }

  return {ok:missing.length===0,missing:[...new Set(missing)]};
};

const v173VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v173VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

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
    !!cloudOrder.paginateOrderedTitles!==
    !!wantedOrder.paginateOrderedTitles
  ){
    problems.push('Order pagination preference');
  }

  const cloudOld=v153NormalizeOldSystem(cloudState?.oldSystem);
  const wantedOld=v153NormalizeOldSystem(expected?.oldSystem);

  for(const key of ['mode','dateFrom','dateTo','modifiedAt']){
    if(String(cloudOld[key]??'')!==String(wantedOld[key]??'')){
      problems.push('Old System Date View');
      break;
    }
  }

  const cloudSettings=v162EnsureThemeSettingsObject(
    JSON.parse(JSON.stringify(cloudState?.settings||{}))
  );
  const wantedSettings=v162EnsureThemeSettingsObject(
    JSON.parse(JSON.stringify(expected?.settings||{}))
  );

  for(const key of [
    'v162ThemeCollection',
    'v173RecommendedTheme',
    'v173OnThisDayTheme',
    'v173SourcePickerTheme'
  ]){
    if(
      JSON.stringify(cloudSettings[key])!==
      JSON.stringify(wantedSettings[key])
    ){
      problems.push(`v173 Theme collection: ${key}`);
    }
  }

  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

// Full Backup / Automatic Backup / JSON import-export.
const v173BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v162EnsureThemeSettings();
  S.orderPlan=v138NormalizeOrderPlan(S.orderPlan,S.library,S.categories);
  S.oldSystem=v153NormalizeOldSystem(S.oldSystem);

  const payload=v173BuildFullBackupBase();

  payload.backupSchemaVersion=V173_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.orderPlan=v173Clone(S.orderPlan,{});
  payload.oldSystem=v173Clone(S.oldSystem,V153_OLD_SYSTEM_DEFAULT);
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V173_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v173 backup. Includes Order edit/pagination preference, Old System Date View range, three new recommendation/On This Day adaptive theme collections and their rotation settings/source selections, category recovery/default identity, advanced media-service import routing/exclusions, automatic Seasonal/Jikan state, System Respect XP, themes/navigation, Library/History, Rating Queue and portable preferences. Authentication credentials and filesystem permission handles remain intentionally non-portable.';

  return payload;
};

const v173BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v173BackupManifestBase(state,extras);
  const settings=v162EnsureThemeSettingsObject(
    JSON.parse(JSON.stringify(state?.settings||{}))
  );
  const os=v153NormalizeOldSystem(state?.oldSystem);
  const order=v138NormalizeOrderPlan(
    state?.orderPlan,
    state?.library||[],
    state?.categories||[]
  );

  manifest.schemaVersion=V173_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{},{
    orderDirectEditing:true,
    orderPaginationPreference:true,
    oldSystemDateView:true,
    oldSystemDateRange:true,
    recommendedOnlyCoverTheme:true,
    onThisDayOnlyCoverTheme:true,
    recommendationOnThisDayPickerTheme:true,
    v173ThemeRotationIntervals:true,
    v173SelectedThemeSources:true
  });

  manifest.counts=Object.assign({},manifest.counts||{},{
    selectedRecommendationOnThisDaySources:
      settings.v173SourcePickerTheme.selectedKeys.length,
    orderPaginationEnabled:order.paginateOrderedTitles?1:0,
    oldSystemDateRangeActive:(os.dateFrom||os.dateTo)?1:0
  });

  return manifest;
};

// v152 Automatic Backup resolves final v148BuildFullBackup() at call time, so
// every v173 field above is automatically included.



