/* MediaFlow v535 — safe cloud transitions, complete data portability and
 * on-demand health checks. Does not mutate account state, perform automatic
 * imports or recalculate / re-award XP. No Supabase schema change required. */
const MF535_VERSION=535;
function mf535AccountReady(accountId){
  return Boolean(accountId&&String(AUTH_USER?.id||'')===accountId&&
    !V115_STARTUP_GUARD&&(!V475_AUTH||(
      V475_AUTH.hydrated&&!V475_AUTH.restoring&&!V475_AUTH.logoutRequested)));
}
/* v250 previously treated an ignored/guarded save as a success if it resolved
 * without throwing. Require the explicit result from v535's queued writer.
 * This is also used by automatic PWA updates and manual reloads. */
v250SaveStateBeforeAppTransition=async function(){
  const accountId=String(AUTH_USER?.id||'');
  if(!mf535AccountReady(accountId))return false;
  try{
    const result=await saveState();
    await saveQueue;
    if(result!==true||lastSaveFailed||!mf535AccountReady(accountId))return false;
    return true;
  }catch(error){
    console.warn('MediaFlow v535: app update paused because cloud save failed',error);
    return false;
  }
};
function mf535AuditPersistence(){
  const prior=mf507AuditPersistence();
  const state=snapshot();
  const backup=v148BuildFullBackup(),scheduled=backupSnapshot();
  const issues=[...(prior.issues||[])];
  const equal=(a,b)=>v402Same(a,b);
  const fields={};
  for(const [key,value] of Object.entries(state)){
    if(key==='savedAt'||key==='cloudSyncVersion'||value===undefined)continue;
    const inFull=Object.prototype.hasOwnProperty.call(backup,key);
    const inAutomatic=Object.prototype.hasOwnProperty.call(scheduled,key);
    const fullExact=inFull&&equal(value,backup[key]);
    const automaticExact=inAutomatic&&equal(value,scheduled[key]);
    fields[key]={cloudSnapshot:true,fullExport:inFull,automaticExport:inAutomatic,
      fullExact,automaticExact};
    if(!fullExact||!automaticExact)issues.push(key+': Full/Automatic backup mismatch');
  }
  const historyLength=Array.isArray(state.activityLog)?state.activityLog.length:0;
  if(historyLength!==Number(backup.activityLog?.length||0)||
     historyLength!==Number(scheduled.activityLog?.length||0))
    issues.push('Library History export is incomplete');
  const manifest=backup.backupManifest?.v507;
  if(!manifest||!Array.isArray(manifest.accountFields))
    issues.push('Full export field manifest missing');
  else for(const key of Object.keys(fields))
    if(!manifest.accountFields.includes(key))issues.push(key+': unlisted in backup manifest');
  if(!equal(backup.xpLedger,state.xpLedger)||!equal(scheduled.xpLedger,state.xpLedger))
    issues.push('XP ledger does not match the exported state');
  const required={
    fullExport:App.exportJSON,fullImport:App.importJSON,
    settingsExport:App.exportSettingsPreset,settingsImport:App.importSettingsPreset,
    historyExport:App.v271ExportConsumptionCSV,libraryHistoryExport:App.v271ExportLogsCSV,
    xpHistoryExport:App.v348ExportXPHistory,xpCalculation:App.calculateXPNow,
    personalOrderExport:App.v142ExportOrder,personalOrderImport:App.v142ImportOrder,
    collectionsExport:App.v279ExportCollections,collectionsImport:App.v279ImportCollections,
    cloudSyncNow:App.syncNow,automaticPwaUpdates:v161EnsureAutomaticUpdateCheck,
    pwaInstaller:App.v248InstallLatestUpdate
  };
  const capabilities=Object.fromEntries(Object.entries(required).map(([name,fn])=>[name,typeof fn==='function']));
  for(const [name,ok] of Object.entries(capabilities))if(!ok)issues.push(name+': unavailable');
  for(const [kind,stamp] of Object.entries({full:backup.mediaFlowVersion,
    automatic:scheduled.mediaFlowVersion,
    settings:v196BuildSettingsPreset().mediaFlowVersion,
    personalOrder:v142OrderExportPayload().mediaFlowVersion,
    collections:v281CollectionsExportPayload().mediaFlowVersion}))
    if(Number(stamp)!==MF535_VERSION)issues.push(kind+': stale release version');
  const allIssues=[...new Set(issues)];
  return {release:MF535_VERSION,ok:allIssues.length===0,issues:allIssues,fields,
    capabilities,save:{accountReady:mf535AccountReady(String(AUTH_USER?.id||'')),
      lastSaveFailed:Boolean(lastSaveFailed)},
    counts:{library:state.library?.length||0,history:state.sessions?.length||0,
      libraryHistory:historyLength,collections:state.collections?.length||0,
      personalOrder:state.orderPlan?.titleIds?.length||0,
      xpLedgerEntries:Object.keys(state.xpLedger?.v348EventMeta||{}).length},
    note:'Read-only local audit. Live cloud parity requires Verify Cloud; no XP rewards or account writes occur.'};
}
/* Live *read-only* confirmation. Never trigger a write to make the test pass,
 * never mask a cloud error and never allow a readback from a switched account. */
async function mf535VerifyCloudReadOnly(){
  const accountId=String(AUTH_USER?.id||'');
  if(!mf535AccountReady(accountId))return {ok:false,error:'Account is still restoring or not signed in.'};
  try{
    await saveQueue;
    if(!mf535AccountReady(accountId)||lastSaveFailed)
      throw new Error('Cloud save pending/failed or account changed.');
    const expected=snapshot();
    const cloud=await v115FetchCloudState();
    if(!mf535AccountReady(accountId))throw new Error('Account switched during cloud verification.');
    if(!cloud?.found||!cloud.state)throw new Error('Cloud state unavailable; nothing was uploaded.');
    expected.savedAt=cloud.state.savedAt;
    const checked=v155VerifyCloudState(cloud.state,expected);
    return {ok:Boolean(checked.ok),verifiedReadOnly:true,
      release:MF535_VERSION,issues:checked.missing||[],
      localSavedAt:Number(expected.savedAt)||0,cloudSavedAt:Number(cloud.state.savedAt)||0,
      note:'Actual authenticated Supabase readback. Nothing was changed or recalculated.'};
  }catch(error){
    return {ok:false,verifiedReadOnly:true,release:MF535_VERSION,
      error:String(error?.message||error)};
  }
}
App.v535AuditPersistence=mf535AuditPersistence;
App.v535VerifyCloudReadOnly=mf535VerifyCloudReadOnly;
App.v535ExportAuditReport=function(){
  try{
    const report=mf535AuditPersistence();
    triggerDownload(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),
      'MediaFlow_Reliability_Audit_v535.json');
    showToast(report.ok?'MediaFlow reliability report exported':'Report exported with integrity warnings');
    return report.ok;
  }catch(error){
    console.warn('MediaFlow v535: audit export failed',error);
    showToast('Could not export reliability audit');
    return false;
  }
};
window.MediaFlowV535=Object.freeze({version:MF535_VERSION,
  audit:mf535AuditPersistence,verifyCloud:mf535VerifyCloudReadOnly});
MediaFlowRuntime.version=MF535_VERSION;
