/* MediaFlow v470 — cloud/readback, portable exports, PWA and XP integrity.
 * Additive to v201 cloud schema and v29 backups. Never mutate an account in an
 * audit, upload during an export, or award/recalculate XP as a side effect. */
const MF470_STATE_FIELDS=Object.freeze([...new Set(V402_ACCOUNT_FIELDS)]);
function mf470Version(){
  const reported=Number(v161CurrentVersion());
  return Number.isSafeInteger(reported)&&reported>=470?reported:470;
}
function mf470Own(value,key){return value!=null&&Object.prototype.hasOwnProperty.call(value,key)&&value[key]!==undefined;}
function mf470Copy(value){
  const result=JSON.stringify(value);
  if(result===undefined)throw new Error('MediaFlow backup contains non-portable undefined data');
  return JSON.parse(result);
}
function mf470Parity(a,b){return v402Same(a,b);}
const mf470BackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const backup=mf470BackupBase.apply(this,arguments);
  const state=snapshot();
  if(!backup||typeof backup!=='object')throw new Error('Full Backup builder returned invalid data');
  // Older builders skipped some cloud-snapshot fields or normalized their old
  // equivalents. A Full Backup must preserve the current *exact* cloud value.
  for(const field of MF470_STATE_FIELDS){
    if(field==='savedAt'||field==='cloudSyncVersion')continue;
    if(mf470Own(state,field))backup[field]=mf470Copy(state[field]);
  }
  backup.mediaFlowVersion=backup.backupVersion=mf470Version();
  const manifest=backup.backupManifest||(backup.backupManifest={});
  manifest.schemaVersion=V201_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{},{
    v470CloudSnapshotParity:true,v470FullHistory:true,v470XpLedger:true,
    v470DualFreshEpisodes:true,v470PersonalOrder:true,v470Collections:true,
    v470CurrentSettings:true,v470AutoBackupSameBuilder:true
  });
  manifest.v470={
    release:mf470Version(),cloudSyncSchema:V201_CLOUD_SYNC_VERSION,
    backupSchema:V201_BACKUP_SCHEMA_VERSION,createdAt:new Date().toISOString(),
    accountFields:MF470_STATE_FIELDS.filter(field=>mf470Own(state,field)),
    sessions:Array.isArray(state.sessions)?state.sessions.length:0,
    library:Array.isArray(state.library)?state.library.length:0,
    collections:Array.isArray(state.collections)?state.collections.length:0,
    xpEvents:Object.keys(state.xpLedger?.v348EventMeta||{}).length,
    freshSystem:state.settings?.v468FreshEpisodesSystem==='advanced'?'advanced':'legacy'
  };
  return backup;
};
// Existing scheduled automatic exports call backupSnapshot; make them use the
// same release-current implementation as manual Full Data exports.
backupSnapshot=function(){return v148BuildFullBackup();};
const mf470PresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
  const preset=mf470PresetBase.apply(this,arguments);
  const state=snapshot();
  if(!preset||typeof preset!=='object')throw new Error('Settings exporter returned invalid data');
  // Include every user preference, including recovery, themes, advanced fresh
  // detection, floating controls, auto-export and PWA/update preferences.
  if(mf470Own(state,'settings'))preset.settings=mf470Copy(state.settings);
  preset.mediaFlowVersion=mf470Version();
  const manifest=preset.presetManifest||(preset.presetManifest={});
  manifest.v470={release:mf470Version(),allCurrentSettings:true,appDataExcluded:true};
  return preset;
};
const mf470OrderBase=v142OrderExportPayload;
v142OrderExportPayload=function(){
  const payload=mf470OrderBase.apply(this,arguments);
  if(payload)payload.mediaFlowVersion=mf470Version();
  return payload;
};
const mf470CollectionsBase=v281CollectionsExportPayload;
v281CollectionsExportPayload=function(){
  const payload=mf470CollectionsBase.apply(this,arguments);
  if(payload){
    payload.appVersion=payload.mediaFlowVersion=mf470Version();
    payload.collectionTombstones=mf470Copy(S.collectionTombstones||[]);
  }
  return payload;
};
// Extend existing Sync Now post-upload readback to later account fields instead
// of relying on a fixed v402 field list. This runs only during explicit sync.
const mf470VerifyBase=v155VerifyCloudState;
v155VerifyCloudState=function(actual,expected){
  const previous=mf470VerifyBase.apply(this,arguments)||{ok:true,missing:[]};
  const missing=new Set(previous.missing||[]);
  for(const field of Object.keys(expected||{})){
    if(!mf470Own(expected,field))continue; // JSON drops undefined values
    if(!mf470Own(actual,field)||!mf470Parity(actual[field],expected[field]))
      missing.add(field+' cloud readback');
  }
  return {ok:missing.size===0,missing:[...missing]};
};
function mf470DataIntegrityAudit(){
  const before=v250Fingerprint({xpLedger:S.xpLedger,sessions:S.sessions,orderPlan:S.orderPlan,collections:S.collections});
  const state=snapshot(),backup=v148BuildFullBackup(),preset=v196BuildSettingsPreset();
  const order=v142OrderExportPayload(),collections=v281CollectionsExportPayload();
  const failures=[],fields={};
  for(const field of MF470_STATE_FIELDS){
    if(!mf470Own(state,field)||field==='savedAt'||field==='cloudSyncVersion')continue;
    const included=mf470Own(backup,field),equal=included&&mf470Parity(state[field],backup[field]);
    fields[field]={cloudSnapshot:true,fullExport:included,roundTrip:equal};
    if(!equal)failures.push(field+' Full Backup mismatch');
  }
  for(const field of Object.keys(state.settings||{})){
    if(!mf470Own(preset.settings,field)||!mf470Parity(state.settings[field],preset.settings[field]))
      failures.push('Settings preset: '+field);
  }
  const stamp=mf470Version();
  for(const [type,version] of Object.entries({
    full:backup.mediaFlowVersion,settings:preset.mediaFlowVersion,
    personalOrder:order?.mediaFlowVersion,collections:collections?.appVersion
  }))if(Number(version)!==stamp)failures.push(type+' stale release version');
  if(!mf470Parity(state.orderPlan?.collectionAssignments||[],order?.orderPlan?.collectionAssignments||[]))
    failures.push('Personal Order assignments');
  if(!mf470Parity(state.orderPlan?.categoryQueues||{},order?.orderPlan?.categoryQueues||{}))
    failures.push('Personal Order category queues');
  if(!mf470Parity(state.collectionTombstones||[],collections?.collectionTombstones||[]))
    failures.push('Collections deletion tombstones');
  if(!mf470Parity(backup,mf470Copy(backup)))failures.push('Full JSON backup round-trip');
  if(!mf470Parity(backup,backupSnapshot())) {
    // The manifest timestamp is intentionally regenerated; compare actual
    // saved data instead of the volatile backup-created-at audit marker.
    const secondary=backupSnapshot();
    for(const field of MF470_STATE_FIELDS)if(field!=='savedAt'&&field!=='cloudSyncVersion'&&
      mf470Own(backup,field)&&!mf470Parity(backup[field],secondary[field]))
      failures.push(field+' automatic export mismatch');
  }
  const after=v250Fingerprint({xpLedger:S.xpLedger,sessions:S.sessions,orderPlan:S.orderPlan,collections:S.collections});
  if(before!==after)failures.push('Audit unexpectedly changed canonical History / XP / Order / Collections');
  const methods={
    cloudSave:typeof saveState==='function',
    syncNow:typeof App.syncNow==='function',
    automaticExport:typeof backupSnapshot==='function',
    dataExport:typeof App.exportJSON==='function',
    dataImport:typeof App.importJSON==='function',
    settingsExport:typeof App.exportSettingsPreset==='function',
    settingsImport:typeof App.importSettingsPreset==='function',
    historyExport:typeof App.v271ExportConsumptionCSV==='function'&&typeof App.v271ExportLogsCSV==='function',
    xpHistoryExport:typeof App.v348ExportXPHistory==='function',
    xpCalculation:typeof App.calculateXPNow==='function',
    personalOrderExport:typeof App.v142ExportOrder==='function',
    personalOrderImport:typeof App.v142ImportOrder==='function',
    collectionsExport:typeof App.v279ExportCollections==='function',
    collectionsImport:typeof App.v279ImportCollections==='function',
    updateCheck:typeof v161EnsureAutomaticUpdateCheck==='function'
  };
  for(const [method,available] of Object.entries(methods))if(!available)failures.push('Missing '+method+' entry point');
  return {version:stamp,ok:failures.length===0,failures,fields,methods,
    counts:{library:state.library?.length||0,history:state.sessions?.length||0,
      libraryHistory:state.activityLog?.length||0,collections:state.collections?.length||0,
      xpHistory:Object.keys(state.xpLedger?.v348EventMeta||{}).length},
    notes:'Read-only local parity, not an authenticated Supabase round-trip. Use Sync Now to test real cloud readback. PWA verified separately.'};
}
async function mf470PwaIntegrityAudit(){
  const version=mf470Version(),issues=[];
  let hosted=null,worker=null;
  try{
    const res=await fetch('version.json?mf470-audit='+Date.now(),{cache:'no-store'});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const payload=await res.json();hosted=Number(payload.appVersion||payload.version||0);
    if(!Number.isFinite(hosted)||hosted<version)issues.push('Hosted version is older than loaded app');
  }catch(e){issues.push('Cannot read hosted version: '+String(e?.message||e));}
  if('serviceWorker' in navigator){
    try{
      const reg=await navigator.serviceWorker.getRegistration();
      if(reg?.active){
        worker=await new Promise((resolve,reject)=>{
          const channel=new MessageChannel();
          const timeout=setTimeout(()=>{channel.port1.close();reject(new Error('worker reply timed out'));},2200);
          channel.port1.onmessage=event=>{clearTimeout(timeout);channel.port1.close();resolve(Number(event.data?.version)||0);};
          reg.active.postMessage({type:'GET_VERSION'},[channel.port2]);
        });
        if(worker<version)issues.push('Installed service worker still uses an older release');
      }else issues.push('No active service worker (browser install may be unavailable)');
    }catch(e){issues.push('PWA diagnostics unavailable: '+String(e?.message||e));}
  }
  return {version,hosted,worker,ok:issues.length===0,issues,
    note:'PWA update detection remains managed by existing automatic update controls; no unsafe automatic reload was attempted.'};
}
App.v470AuditDataIntegrity=mf470DataIntegrityAudit;
App.v470AuditPWA=mf470PwaIntegrityAudit;
window.MediaFlowV470={version:470,audit:mf470DataIntegrityAudit,pwaAudit:mf470PwaIntegrityAudit};
MediaFlowRuntime.version=mf470Version();
