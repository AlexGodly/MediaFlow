/* MediaFlow v402 — data portability, cloud readback and release coherence.
 * This layer performs source-of-truth checks; it does not rewrite accounts,
 * trigger a cloud upload, recalculate or re-award XP during an export. */
const V402_RELEASE=405; // v405 release stamp for legacy audit; schema logic remains backward compatible.
const V402_ACCOUNT_FIELDS=[
  'categories','categoryOrder','library','sessions','settings','xpLedger',
  'activityLog','completionTimeline','orderPlan','collections',
  'collectionTombstones','oldSystem','portableExtras','profileName',
  'profilePicture','stopwatch','runtimeCalculator','malLink','migrations',
  'currentTask','sessionActive','savedAt','cloudSyncVersion'
];
const V402_TRANSFER_FIELDS=V402_ACCOUNT_FIELDS.filter(k=>!['savedAt','cloudSyncVersion'].includes(k));
function v402Portable(value){
  // The cloud protocol persists JSON. Compare the transmitted representation,
  // not references or undefined keys that JSON explicitly drops.
  try{return JSON.parse(JSON.stringify(value));}catch(_){return null;}
}
function v402Same(a,b){
  const left=v402Portable(a),right=v402Portable(b);
  return v250Fingerprint(left)===v250Fingerprint(right);
}
function v402Present(obj,key){return obj&&Object.prototype.hasOwnProperty.call(obj,key);}

/* Last-resort readback: every declared account field must survive the actual
 * rawSet/rawGet JSON round-trip, not just a count check or a partial subset.
 * Verify only fields in expected so old, genuinely absent optional data is not
 * invented; keep prior verifiers' stricter semantic checks intact. */
const v402VerifyCloudBase=v155VerifyCloudState;
v155VerifyCloudState=function(actual,expected){
  const base=v402VerifyCloudBase.apply(this,arguments)||{ok:true,missing:[]};
  const missing=new Set(base.missing||[]);
  for(const field of V402_ACCOUNT_FIELDS){
    if(v402Present(expected,field)&&(!v402Present(actual,field)||!v402Same(actual[field],expected[field])))
      missing.add(`${field} cloud readback`);
  }
  return {ok:missing.size===0,missing:[...missing]};
};

/* Ensure the most recent formats contain a correct export release stamp.
 * The v383 Collections export wrapper accidentally reset appVersion to 383
 * even though v339 already stamped the current release correctly. */
const v402CollectionsExportBase=v281CollectionsExportPayload;
v281CollectionsExportPayload=function(){
  const payload=v402CollectionsExportBase.apply(this,arguments)||{};
  const now=V402_RELEASE;
  payload.appVersion=now;
  payload.mediaFlowVersion=now;
  payload.mediaflowCollectionsExportVersion=2; // compatible additive v2 fields
  payload.collectionTombstones=v402Portable(S.collectionTombstones||[])||[];
  payload.exportAudit=Object.assign({},payload.exportAudit||{}, {
    release:now,collectionTombstones:true,collectionSettings:true,
    collectionOrdering:true,sourceTimestamps:true
  });
  return payload;
};

const v402OrderExportBase=v142OrderExportPayload;
v142OrderExportPayload=function(){
  const payload=v402OrderExportBase.apply(this,arguments);
  payload.mediaFlowVersion=V402_RELEASE;
  return payload;
};

const v402FullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const backup=v402FullBackupBase.apply(this,arguments);
  backup.mediaFlowVersion=V402_RELEASE;
  backup.backupVersion=V402_RELEASE;
  // The v148 builder recreated an obsolete four-field Stopwatch object even
  // though v257 cloud state adds modifiedAt for cross-device arbitration.
  // Preserve the current canonical normalized Stopwatch here, too.
  const tools=v257DashboardToolsState();
  backup.stopwatch=v402Portable(tools.stopwatch);
  backup.dashboardToolsV257=v402Portable(tools);
  const manifest=backup.backupManifest||(backup.backupManifest={});
  manifest.includes=Object.assign({},manifest.includes||{}, {
    v402FullDataParity:true,v402AllLibraryHistory:true,
    v400IndividualUnitTimestamps:true,v401ProviderPreferences:true,
    v401VerificationLedger:true,v402CollectionTombstones:true,
    v402PersonalOrderAssignments:true,v402XpEventLedger:true
  });
  manifest.v402={release:V402_RELEASE,cloudSyncSchema:V201_CLOUD_SYNC_VERSION,
    backupSchema:V201_BACKUP_SCHEMA_VERSION,
    settingsPresetSchema:V196_SETTINGS_PRESET_SCHEMA_VERSION,
    historyCount:Array.isArray(backup.sessions)?backup.sessions.length:0,
    activityLogCount:Array.isArray(backup.activityLog)?backup.activityLog.length:0,
    orderAssignments:Array.isArray(backup.orderPlan?.collectionAssignments)?backup.orderPlan.collectionAssignments.length:0,
    collectionCount:Array.isArray(backup.collections)?backup.collections.length:0,
    collectionTombstones:Array.isArray(backup.collectionTombstones)?backup.collectionTombstones.length:0,
    xpEventCount:Object.keys(backup.xpLedger?.v348EventMeta||{}).length,
    includesUnitTimestamps:'Stored inside canonical Library/History/Logging unit objects',
    automaticBackupUsesCanonicalFullBuilder:true};
  return backup;
};
backupSnapshot=function(){return v148BuildFullBackup();};

const v402PresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
  const preset=v402PresetBase.apply(this,arguments);
  preset.mediaFlowVersion=V402_RELEASE;
  preset.presetManifest=preset.presetManifest||{};
  preset.presetManifest.v402={release:V402_RELEASE,
    includesFreshEpisodeDetectionMode:true,includesFreshOnlyRecommendations:true,
    includesFreshEpisodeLedger:true,settingsOnly:true};
  return preset;
};

/* Accept historic backups, but do not destroy current state with a corrupted
 * modern record that happens to have the four legacy-required fields. */
const v402ValidateBackupBase=v148ValidateBackup;
v148ValidateBackup=function(data){
  const prior=v402ValidateBackupBase.apply(this,arguments);
  if(!prior.ok)return prior;
  const bad=[];
  for(const k of ['categories','library','sessions','activityLog','completionTimeline','collections','collectionTombstones']){
    if(v402Present(data,k)&&!Array.isArray(data[k]))bad.push(k);
  }
  for(const k of ['settings','xpLedger','orderPlan','oldSystem','portableExtras']){
    if(v402Present(data,k)&&(!data[k]||typeof data[k]!=='object'||Array.isArray(data[k])))bad.push(k);
  }
  if(bad.length)return {ok:false,message:`The backup contains invalid account data in: ${bad.join(', ')}.`};
  return prior;
};

/* Pure read-only inspection. The parity result is computed from the canonical
 * current runtime builders. It is not a claim that Supabase has been reached. */
function v402AuditDataIntegrity(){
  const local=snapshot(),full=v148BuildFullBackup(),preset=v196BuildSettingsPreset();
  const order=v142OrderExportPayload(),collections=v281CollectionsExportPayload();
  const fields={};
  for(const key of V402_TRANSFER_FIELDS){
    const expected=v402Present(local,key);
    fields[key]={cloudSnapshot:!!expected,fullBackup:v402Present(full,key),
      equal:!expected||v402Same(local[key],full[key])};
  }
  const settingsParity=Object.keys(local.settings||{}).every(k=>
    v402Present(preset.settings,k)&&v402Same(local.settings[k],preset.settings[k]));
  // Preset normalizers may add supported default keys. Extra defaults are
  // safe; dropping or rewriting an existing user preference is not.
  const jsonRoundtrip=v402Portable(full);
  const roundtrip=!!jsonRoundtrip&&V402_TRANSFER_FIELDS.every(k=>
    !v402Present(full,k)||v402Same(full[k],jsonRoundtrip[k]));
  const orderExtension=v402Same(order.orderPlan?.collectionAssignments||[],local.orderPlan?.collectionAssignments||[])
    &&v402Same(order.orderPlan?.categoryQueues||{},local.orderPlan?.categoryQueues||{});
  const ledger=local.settings?.v377JikanLedger||{};
  const issues=[];
  for(const [key,test] of Object.entries(fields))if(test.cloudSnapshot&&(!test.fullBackup||!test.equal))issues.push(key+' backup parity');
  if(!settingsParity)issues.push('Settings preset parity');
  if(!roundtrip)issues.push('Full JSON serialization');
  if(!orderExtension)issues.push('Personal Order collection assignments or queues');
  if(!v402Same(collections.collectionTombstones||[],local.collectionTombstones||[]))issues.push('Collections tombstones');
  if(Number(collections.appVersion)!==V402_RELEASE)issues.push('Collections release stamp');
  return {release:V402_RELEASE,ok:issues.length===0,issues,fields,settingsParity,
    jsonRoundtrip:roundtrip,orderExtension,collectionTombstones:v402Same(collections.collectionTombstones||[],local.collectionTombstones||[]),
    versionStamps:{full:full.mediaFlowVersion,preset:preset.mediaFlowVersion,order:order.mediaFlowVersion,collections:collections.appVersion},
    counts:{library:local.library?.length||0,history:local.sessions?.length||0,libraryHistory:local.activityLog?.length||0,
      collections:local.collections?.length||0,deletedCollections:local.collectionTombstones?.length||0,
      xpEvents:Object.keys(local.xpLedger?.v348EventMeta||{}).length,providerLedger:Object.keys(ledger).length},
    capabilities:{syncNow:typeof App.syncNow==='function',cloudSave:typeof saveState==='function',
      fullExport:typeof App.exportJSON==='function',fullImport:typeof App.importJSON==='function',
      settingsExport:typeof App.exportSettingsPreset==='function',settingsImport:typeof App.importSettingsPreset==='function',
      historyExport:typeof App.v271ExportConsumptionCSV==='function'&&typeof App.v271ExportLogsCSV==='function',
      xpHistoryExport:typeof App.v348ExportXPHistory==='function',xpCalculation:typeof App.calculateXPNow==='function',
      orderExport:typeof App.v142ExportOrder==='function',orderImport:typeof App.v142ImportOrder==='function',
      collectionsExport:typeof App.v279ExportCollections==='function',collectionsImport:typeof App.v279ImportCollections==='function',
      automaticBackup:typeof backupSnapshot==='function',updateCheck:typeof v161EnsureAutomaticUpdateCheck==='function'},
    notes:'Offline serialization check only. Live Supabase readback, PWA update installation and file-import UI require independent testing.'};
}
App.v402AuditDataIntegrity=v402AuditDataIntegrity;
window.MediaFlowV402={version:V402_RELEASE,audit:v402AuditDataIntegrity};
MediaFlowRuntime.version=V402_RELEASE;
