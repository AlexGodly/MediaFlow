/* MediaFlow v507 — canonical portable state, cloud readback and release audit.
 * This module must not mutate the Library, History or XP when exporting.
 * All existing backup schema versions and import formats remain compatible.
 */
const MF507_RELEASE=507;
function mf507Release(){
 const version=Number(v161CurrentVersion());
 return Number.isSafeInteger(version)&&version>=MF507_RELEASE?version:MF507_RELEASE;
}
function mf507Clone(value){
 const json=JSON.stringify(value);
 if(json===undefined)throw new Error('Non-serializable MediaFlow data in export');
 return JSON.parse(json);
}
function mf507Own(object,key){
 return object!=null&&Object.prototype.hasOwnProperty.call(object,key)&&object[key]!==undefined;
}
function mf507Same(a,b){return v250Fingerprint(mf507Clone(a))===v250Fingerprint(mf507Clone(b));}
const MF507_TRANSIENT_STATE_FIELDS=new Set(['savedAt','cloudSyncVersion']);
/* The old audit enumerated fields added up to v402. Derive coverage from the
 * real v507 account snapshot so future persistent fields are not omitted. */
const mf507FullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
 const backup=mf507FullBackupBase.apply(this,arguments);
 const state=snapshot();
 if(!backup||typeof backup!=='object')throw new Error('Full Backup builder returned invalid data');
 const backedUp=[];
 for(const [key,value] of Object.entries(state)){
  if(MF507_TRANSIENT_STATE_FIELDS.has(key)||value===undefined)continue;
  backup[key]=mf507Clone(value);
  backedUp.push(key);
 }
 backup.mediaFlowVersion=backup.backupVersion=mf507Release();
 const manifest=backup.backupManifest||(backup.backupManifest={});
 manifest.v507={
  release:mf507Release(),
  accountFields:backedUp,
  libraryTitles:Array.isArray(state.library)?state.library.length:0,
  consumptionHistory:Array.isArray(state.sessions)?state.sessions.length:0,
  libraryHistory:Array.isArray(state.activityLog)?state.activityLog.length:0,
  collections:Array.isArray(state.collections)?state.collections.length:0,
  personalOrder:Array.isArray(state.orderPlan?.titleIds)?state.orderPlan.titleIds.length:0,
  xpLedgerEvents:Object.keys(state.xpLedger?.v348EventMeta||{}).length,
  fullCloudSnapshotParity:true,
  automaticExportUsesFullBackup:true,
  importRequiresVerifiedCloudReadback:true,
  pwaVersionedRelease:true,
  schemaCompatible:true
 };
 return backup;
};
backupSnapshot=function(){return v148BuildFullBackup();};
const mf507SettingsPresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
 const preset=mf507SettingsPresetBase.apply(this,arguments);
 if(!preset||typeof preset!=='object')throw new Error('Settings preset builder returned invalid data');
 preset.settings=mf507Clone(S.settings||DEFAULT_SETTINGS);
 preset.mediaFlowVersion=mf507Release();
 const manifest=preset.presetManifest||(preset.presetManifest={});
 manifest.v507={release:mf507Release(),configurationOnly:true,
   settingsKeys:Object.keys(preset.settings).length,libraryDataExcluded:true};
 return preset;
};
const mf507OrderExportBase=v142OrderExportPayload;
v142OrderExportPayload=function(){
 const order=mf507OrderExportBase.apply(this,arguments);
 if(order)order.mediaFlowVersion=mf507Release();
 return order;
};
const mf507CollectionsExportBase=v281CollectionsExportPayload;
v281CollectionsExportPayload=function(){
 const collectionData=mf507CollectionsExportBase.apply(this,arguments);
 if(collectionData){
  collectionData.appVersion=collectionData.mediaFlowVersion=mf507Release();
  collectionData.collectionTombstones=mf507Clone(S.collectionTombstones||[]);
 }
 return collectionData;
};
/* All dedicated imports may use this after the existing queued save succeeds.
 * A readback is not a mutation, and a failed readback never approves a save.
 * Keep the original file in the user's possession on every failure. */
async function mf507VerifyImportedCloud(kind,expectedUserId){
 const userId=String(expectedUserId||AUTH_USER?.id||'');
 if(!userId||String(AUTH_USER?.id||'')!==userId||V115_STARTUP_GUARD||
   (typeof V475_AUTH!=='undefined'&&(!V475_AUTH.hydrated||V475_AUTH.restoring||V475_AUTH.logoutRequested)))
  throw new Error(kind+': account recovery is still in progress. No cloud save is confirmed.');
 if(lastSaveFailed)throw new Error(kind+': cloud save failed. Keep the original import file and retry Sync Now.');
 await saveQueue;
 if(String(AUTH_USER?.id||'')!==userId||V115_STARTUP_GUARD)
  throw new Error(kind+': account changed during import. Cloud verification cancelled.');
 const expected=snapshot();
 const remote=await v115FetchCloudState();
 if(String(AUTH_USER?.id||'')!==userId||V115_STARTUP_GUARD)
  throw new Error(kind+': account changed while verifying imported data.');
 if(!remote?.found||!remote.state)
  throw new Error(kind+': cloud state is missing after the save. Keep the imported file.');
 // snapshot() regenerates savedAt on every call; the cloud was written a
 // moment earlier. Compare the actual uploaded timestamp, not a new clock tick.
 if(mf507Own(remote.state,'savedAt'))expected.savedAt=remote.state.savedAt;
 else delete expected.savedAt;
 const result=v155VerifyCloudState(remote.state,expected);
 if(!result.ok)throw new Error(kind+': cloud verification failed ('+
   (result.missing||[]).slice(0,5).join(', ')+'). Keep the import file and retry Sync Now.');
 return true;
}
/* Lightweight, read-only integrity report. This does not ask for credentials,
 * force a sync, recalculate XP, start an update, or mutate a saved account.
 * Live network readback is done by Sync Now and the import verifiers. */
function mf507AuditPersistence(){
 const before=v250Fingerprint({xpLedger:S.xpLedger,sessions:S.sessions,orderPlan:S.orderPlan,
   collections:S.collections,activityLog:S.activityLog});
 const state=snapshot(),full=v148BuildFullBackup(),scheduled=backupSnapshot();
 const settings=v196BuildSettingsPreset(),order=v142OrderExportPayload(),collections=v281CollectionsExportPayload();
 const problems=[],fields={};
 for(const key of Object.keys(state)){
  if(MF507_TRANSIENT_STATE_FIELDS.has(key)||state[key]===undefined)continue;
  const found=mf507Own(full,key)&&mf507Own(scheduled,key);
  const equal=found&&mf507Same(full[key],state[key])&&mf507Same(scheduled[key],state[key]);
  fields[key]={fullExport:mf507Own(full,key),automaticExport:mf507Own(scheduled,key),equal};
  if(!equal)problems.push(key+' backup / automatic export mismatch');
 }
 if(!mf507Same(settings.settings,state.settings))problems.push('Settings preset mismatch');
 if(!mf507Same(collections.collectionTombstones||[],state.collectionTombstones||[]))
  problems.push('Collections deletion records mismatch');
 for(const [kind,value] of Object.entries({
  full:full.mediaFlowVersion,automatic:scheduled.mediaFlowVersion,
  settings:settings.mediaFlowVersion,order:order.mediaFlowVersion,
  collections:collections.mediaFlowVersion
 }))if(Number(value)!==mf507Release())problems.push(kind+' version is stale');
 const after=v250Fingerprint({xpLedger:S.xpLedger,sessions:S.sessions,orderPlan:S.orderPlan,
   collections:S.collections,activityLog:S.activityLog});
 if(before!==after)problems.push('Read-only audit changed account data');
 const methods={
  cloudSave:typeof saveState==='function',
  syncNow:typeof App.syncNow==='function',
  dataExport:typeof App.exportJSON==='function',
  dataImport:typeof App.importJSON==='function',
  automaticExport:typeof backupSnapshot==='function',
  settingsExport:typeof App.exportSettingsPreset==='function',
  settingsImport:typeof App.importSettingsPreset==='function',
  historyExport:typeof App.v271ExportConsumptionCSV==='function'&&typeof App.v271ExportLogsCSV==='function',
  xpHistoryExport:typeof App.v348ExportXPHistory==='function',
  xpCalculator:typeof App.calculateXPNow==='function',
  orderExport:typeof App.v142ExportOrder==='function',
  orderImport:typeof App.v142ImportOrder==='function',
  collectionsExport:typeof App.v279ExportCollections==='function',
  collectionsImport:typeof App.v279ImportCollections==='function',
  pwaInstaller:typeof App.v248InstallLatestUpdate==='function',
  automaticUpdateCheck:typeof v161EnsureAutomaticUpdateCheck==='function'
 };
 for(const [method,ready] of Object.entries(methods))if(!ready)problems.push('Missing '+method);
 return {version:mf507Release(),ok:problems.length===0,issues:problems,fields,methods,
  release:{app:mf507Release(),cloudSchema:V201_CLOUD_SYNC_VERSION,
    backupSchema:V201_BACKUP_SCHEMA_VERSION,
    settingsPresetSchema:V196_SETTINGS_PRESET_SCHEMA_VERSION},
  counts:{library:state.library?.length||0,history:state.sessions?.length||0,
    libraryHistory:state.activityLog?.length||0,collections:state.collections?.length||0,
    ordered:state.orderPlan?.titleIds?.length||0,xpEvents:Object.keys(state.xpLedger?.v348EventMeta||{}).length},
  note:'Offline, read-only parity. For actual Supabase verification, use Sync Now after your account finishes loading.'};
}
App.v507AuditPersistence=mf507AuditPersistence;
App.v507ExportAuditReport=function(){
 try{
  const report=mf507AuditPersistence();
  triggerDownload(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),
    'MediaFlow_Data_Integrity_v'+mf507Release()+'.json');
  showToast(report.ok?'MediaFlow integrity report exported':'Integrity report exported with warnings');
 }catch(error){console.error('MediaFlow v507 audit report failed',error);showToast('Could not generate the data integrity report');}
};
window.MediaFlowV507=Object.freeze({version:507,audit:mf507AuditPersistence,verifyCloud:mf507VerifyImportedCloud});
