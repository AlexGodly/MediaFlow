/* MediaFlow v339 — Cloud, export/import, progression and release integrity.
   Full account data remains in the existing Cloud Sync v201 JSON state.
   No new Supabase tables, schema migrations or paid services are required. */
const V339_RUNTIME_VERSION=339;
const V339_CURRENT_ORDER_FORMAT=5;
const V339_CURRENT_COLLECTIONS_FORMAT=2;

function v339Release(){const n=Number(v161CurrentVersion());return Number.isInteger(n)&&n>=339?n:339;}
function v339JsonClone(value){return value===undefined?null:JSON.parse(JSON.stringify(value));}

// v295/v296's transfer metadata was permanently stamped with their historical
// release numbers even on newer builds. Use the deployed meta release instead.
const v339CollectionsExportBase=v281CollectionsExportPayload;
v281CollectionsExportPayload=function(){
  const payload=v339CollectionsExportBase.apply(this,arguments);
  const current=v339Release();
  payload.appVersion=current;
  payload.mediaFlowVersion=current;
  payload.mediaflowCollectionsExportVersion=V339_CURRENT_COLLECTIONS_FORMAT;
  payload.exportAudit=Object.assign({},payload.exportAudit||{}, {
    release:current,formatVersion:V339_CURRENT_COLLECTIONS_FORMAT,
    latestCollectionMetadata:true,cloudCompatible:true
  });
  return payload;
};

const v339OrderExportBase=v142OrderExportPayload;
v142OrderExportPayload=function(){
  const payload=v339OrderExportBase.apply(this,arguments);
  const current=v339Release();
  payload.mediaFlowVersion=current;
  payload.formatVersion=Math.max(Number(payload.formatVersion)||1,V339_CURRENT_ORDER_FORMAT);
  payload.exportAudit=Object.assign({},payload.exportAudit||{}, {
    release:current,personalOrderFormat:payload.formatVersion,
    collectionAssignmentsIncluded:Array.isArray(payload.orderPlan?.collectionAssignments),
    categoryQueuesIncluded:!!(payload.orderPlan?.categoryQueues&&typeof payload.orderPlan.categoryQueues==='object'),
    current:true
  });
  return payload;
};

// Rebuild transient progression summaries on every full export. The canonical
// XP ledger is already in snapshot(); time, first-episode and Collection
// rewards must remain unmodified (no reward re-awarding on export/import).
const v339FullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v339FullBackupBase.apply(this,arguments);
  const current=v339Release();
  payload.backupVersion=current;
  payload.mediaFlowVersion=current;
  // The old Full Backup builder kept portable queue/UI values but discarded
  // the v155 cloud merge timestamps (_syncMeta). Preserve those stamps so
  // imported automatic/manual backups maintain device-merge precedence.
  const portable=v155PortableExtras();
  payload.portableExtras=Object.assign({},payload.portableExtras||{},v339JsonClone(portable));
  payload.backupManifest=payload.backupManifest||{};
  payload.backupManifest.schemaVersion=V201_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.v339={
    release:current,
    cloudSyncVersion:V201_CLOUD_SYNC_VERSION,
    fullBackupSchema:V201_BACKUP_SCHEMA_VERSION,
    settingsPresetSchema:V196_SETTINGS_PRESET_SCHEMA_VERSION,
    personalOrderFormat:V339_CURRENT_ORDER_FORMAT,
    collectionsFormat:V339_CURRENT_COLLECTIONS_FORMAT,
    xpLedgerPreserved:!!payload.xpLedger,
    activeTimeDayCount:Object.keys(payload.xpLedger?.v334ActiveTimeDays||{}).length,
    collectionCount:Array.isArray(payload.collections)?payload.collections.length:0,
    activityLogCount:Array.isArray(payload.activityLog)?payload.activityLog.length:0,
    historyCount:Array.isArray(payload.sessions)?payload.sessions.length:0,
    fullDataSnapshot:true,
    automaticBackupUsesSameBuilder:true
  };
  payload.backupManifest.includes=Object.assign({},payload.backupManifest.includes||{}, {
    v339FullCloudState:true,v339XPAndActivityLedgers:true,
    v339CollectionsAndTombstones:true,v339PersonalOrderV5:true,
    v339CompleteHistory:true,v339CurrentSettings:true
  });
  return payload;
};
// v152+ auto folder backups call backupSnapshot at write time, not the original
// pre-v148 narrow snapshot; keep pointing to the final decorated full builder.
backupSnapshot=function(){return v148BuildFullBackup();};

const v339SettingsPresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
  const payload=v339SettingsPresetBase.apply(this,arguments);
  payload.mediaFlowVersion=v339Release();
  payload.presetSchemaVersion=V196_SETTINGS_PRESET_SCHEMA_VERSION;
  payload.presetManifest=payload.presetManifest||{};
  payload.presetManifest.v339={release:v339Release(),schema:V196_SETTINGS_PRESET_SCHEMA_VERSION,
    fullSettings:true,levelingRewards:['firstEpisodeXP','firstTitleStartXP','collectionCreateXP','collectionEditXP','activeTimeXPPerMinute'],
    includesCategoryDefinitions:true,includesCategoryOrder:true,excludesPersonalData:true};
  return payload;
};

// The inherited Sync Now checked core Library/History/Settings/XP/Order but
// could still declare success if separate Collections, tombstones, portable
// preferences, runtime tools or category definitions failed to round-trip.
const V339_CLOUD_VERIFY_FIELDS={
  categories:'Category definitions',categoryOrder:'Category order',
  collections:'Collections',collectionTombstones:'Collection tombstones',
  portableExtras:'Portable extras',oldSystem:'Old System',
  profilePicture:'Profile picture',profileName:'Profile name',
  stopwatch:'Stopwatch',runtimeCalculator:'Runtime Calculator',
  malLink:'MyAnimeList link',migrations:'Migration flags',
  completionTimeline:'Completion timeline'
};
const v339CloudVerifyBase=v155VerifyCloudState;
v155VerifyCloudState=function(remote,expected){
  const base=v339CloudVerifyBase.apply(this,arguments)||{ok:true,missing:[]};
  const missing=new Set(base.missing||[]);
  for(const [key,label] of Object.entries(V339_CLOUD_VERIFY_FIELDS)){
    if(!Object.prototype.hasOwnProperty.call(expected||{},key))continue;
    // Compare JSON as it will actually be stored by Supabase. `undefined`
    // fields disappear during serialization; do not report false failures.
    if(v250Fingerprint(v339JsonClone({data:remote?.[key]}))!==v250Fingerprint(v339JsonClone({data:expected[key]}))){
      missing.add(`${label} content`);
    }
  }
  return {ok:missing.size===0,missing:[...missing]};
};

// In v336 pageMs/actionMs were assigned AFTER v334's local checkpoint ran,
// leaving the newest per-page/action slice unprotected until the next tick.
// Flush the final ledger after the existing v337 counter + progress updater.
const v339EarnTimeBase=v334EarnTime;
v334EarnTime=function(){
  const result=v339EarnTimeBase.apply(this,arguments);
  if(AUTH_READY&&AUTH_USER&&Number(arguments[0])>0)v334CheckpointLocalTime();
  return result;
};
// A local checkpoint and the cloud can have equal total daily ms while the
// local checkpoint has more detailed page/action slices. Preserve those slices
// on load without adding counters twice or changing earned XP.
const v339RestoreTimeBase=v334RestoreLocalTime;
v334RestoreLocalTime=function(){
  v339RestoreTimeBase.apply(this,arguments);
  if(!AUTH_USER)return;
  try{
    const stored=JSON.parse(localStorage.getItem(v334LocalTimeKey())||'null');
    if(!stored||typeof stored!=='object'||Array.isArray(stored))return;
    const days=v334Ledger().v334ActiveTimeDays;
    for(const [day,local] of Object.entries(stored)){
      if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!local||typeof local!=='object'||!days[day])continue;
      for(const prop of ['pageMs','actionMs']){
        const old=days[day][prop];const src=local[prop];
        if(!src||typeof src!=='object'||Array.isArray(src))continue;
        const merged=old&&typeof old==='object'&&!Array.isArray(old)?{...old}:{};
        for(const [key,amount] of Object.entries(src))merged[key]=Math.max(Number(merged[key])||0,Number(amount)||0);
        days[day][prop]=merged;
      }
    }
  }catch(err){console.warn('MediaFlow v339: activity details restored from local checkpoint only partially',err);}
};

// On every run provide an audit based on the *actual* current export builders,
// never outdated hard-coded v2xx metadata. Does not upload or overwrite data.
function v339PersistenceAudit(){
  const current=v339Release();
  const snap=snapshot(),backup=v148BuildFullBackup(),preset=v196BuildSettingsPreset(),order=v142OrderExportPayload(),collections=v281CollectionsExportPayload();
  const comparable=(a,b)=>v250Fingerprint(v339JsonClone(a))===v250Fingerprint(v339JsonClone(b));
  const fields=['categories','library','sessions','settings','xpLedger','orderPlan','activityLog','collections','collectionTombstones','completionTimeline','portableExtras','stopwatch'];
  const parity={};
  for(const key of fields){
    const value=snap[key];
    parity[key]=Object.prototype.hasOwnProperty.call(snap,key)&&Object.prototype.hasOwnProperty.call(backup,key)&&comparable(value,backup[key]);
  }
  const settingsKeys=['firstEpisodeXP','firstTitleStartXP','collectionCreateXP','collectionEditXP','activeTimeXPPerMinute'];
  const settingsParity=settingsKeys.every(key=>comparable(snap.settings?.leveling?.[key],preset.settings?.leveling?.[key]));
  const present={
    cloud:typeof rawSet==='function'&&typeof rawGet==='function',syncNow:typeof App.syncNow==='function',
    fullExport:typeof App.exportJSON==='function',fullImport:typeof App.importJSON==='function',
    settingsExport:typeof App.exportSettingsPreset==='function',settingsImport:typeof App.importSettingsPreset==='function',
    historyExport:typeof App.v271ExportConsumptionCSV==='function'&&typeof App.v271ExportLogsCSV==='function',
    orderExport:typeof App.v142ExportOrder==='function',orderImport:typeof App.v142ImportOrder==='function',
    collectionsExport:typeof App.v279ExportCollections==='function',collectionsImport:typeof App.v279ImportCollections==='function',
    xpCalculation:typeof App.calculateXPNow==='function',
    automaticBackup:typeof backupSnapshot==='function',
    automaticUpdate:typeof v161EnsureAutomaticUpdateCheck==='function',
    managedUpdate:typeof App.v248InstallLatestUpdate==='function'
  };
  return {release:current,
    versions:{cloud:Number(snap.cloudSyncVersion)||0,backup:Number(backup.backupSchemaVersion)||0,
      settingsPreset:Number(preset.presetSchemaVersion)||0,order:Number(order.formatVersion)||0,
      collections:Number(collections.mediaflowCollectionsExportVersion)||0,
      backupRelease:Number(backup.mediaFlowVersion)||0,presetRelease:Number(preset.mediaFlowVersion)||0,
      orderRelease:Number(order.mediaFlowVersion)||0,collectionsRelease:Number(collections.appVersion)||0},
    checks:{...present,settingsParity,fullBackupParity:Object.values(parity).every(Boolean)},
    parity,settingsParity,
    counts:{library:snap.library?.length||0,history:snap.sessions?.length||0,libraryHistory:snap.activityLog?.length||0,
      collections:snap.collections?.length||0,activeDays:Object.keys(snap.xpLedger?.v334ActiveTimeDays||{}).length},
    xp:{earnedFromActiveTime:v334Totals(snap.xpLedger).timeXP,firstEpisode:v334Totals(snap.xpLedger).firstEpisodeXP},
    automaticUpdatePreferences:{check:snap.settings?.autoUpdateCheck!==false,install:snap.settings?.autoInstallUpdates===true},
    current:!lastSaveFailed,
    note:'This is an in-app data pipeline audit; remote cloud readback requires running Sync Now while authenticated.'};
}
App.v339PersistenceAudit=v339PersistenceAudit;
// Module version is informational; final deployed version is index meta + VERSION.
MediaFlowRuntime.version=V339_RUNTIME_VERSION;
