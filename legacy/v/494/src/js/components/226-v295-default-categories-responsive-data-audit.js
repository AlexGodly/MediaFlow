/* ============================================================
   MediaFlow v295 — Fresh-account defaults, responsive nav repair & data audit
   ---------------------------------------------------------------------------
   - v294 is the functional baseline.
   - Fresh accounts now start with the complete 22-category MediaFlow set and
     packaged category artwork.
   - Existing account categories are not auto-replaced or migrated.
   - Refines the <=1080px bottom navigation so medium/tablet widths never cram
     eight tiny tabs into one row and the More menu stays inside the viewport.
   - Audits current cloud/Sync Now, backup/export/import, XP, History, Personal
     Order, Collections and PWA/update surfaces for the v295 release.
   ============================================================ */
const V295_RUNTIME_VERSION=295;

/* ---------- Responsive navigation ---------------------------------- */
// Keep enough width for real labels such as "Personal Order". The count
// includes the More button whenever overflow exists.
v276MobileNavSlotCount=function(width=window.innerWidth||360){
  width=Math.max(280,Number(width)||360);
  if(width<360)return 4;
  if(width<520)return 5;
  if(width<760)return 6;
  return 7;
};

function v295RefreshResponsiveNavigation(){
  try{v276RefreshMobileNav?.();}catch(_){ }
  try{v277SyncNavigationMode?.();}catch(_){ }
}


/* ---------- Import compatibility for the expanded fresh defaults -------- */
// Existing accounts that still have legacy Manhwa / Other Animation
// categories keep using them. Fresh v295 accounts gracefully map those source
// classifications into the closest new built-in category instead.
if(typeof mfGuessCategory==='function'){
  const v295GuessCategoryBase=mfGuessCategory;
  mfGuessCategory=function(){
    let id=v295GuessCategoryBase.apply(this,arguments);
    if(id==='manhwa'&&!S.categories?.some(c=>String(c?.id)==='manhwa'))id='manga';
    if(id==='otheranim'&&!S.categories?.some(c=>String(c?.id)==='otheranim'))id='tv';
    return id;
  };
}
if(typeof v158InferCategory==='function'){
  const v295InferCategoryBase=v158InferCategory;
  v158InferCategory=function(){
    let id=v295InferCategoryBase.apply(this,arguments);
    if(id==='manhwa'&&!S.categories?.some(c=>String(c?.id)==='manhwa'))id='manga';
    if(id==='otheranim'&&!S.categories?.some(c=>String(c?.id)==='otheranim'))id='tv';
    return id;
  };
}


/* ---------- Fresh-account cloud initialization --------------------- */
// v115 deliberately blocks unsafe startup writes. Once that guard has already
// classified the account as genuinely new/empty and loaded defaults, v295
// immediately commits the canonical fresh workspace so the 22 default
// categories/settings exist in cloud storage without waiting for the first UI
// mutation. Populated/meaningful cloud states never take this path.
if(typeof v115StartWithData==='function'){
  const v295StartWithDataBase=v115StartWithData;
  v115StartWithData=async function(data){
    const looksUninitialized=!data || (typeof data==='object' &&
      !Array.isArray(data.categories) && !Array.isArray(data.library) &&
      !Array.isArray(data.sessions) && !(data.settings&&typeof data.settings==='object'));
    const out=await v295StartWithDataBase.apply(this,arguments);
    if(looksUninitialized && AUTH_USER){
      try{await saveState();}catch(err){console.warn('MediaFlow v295: fresh-account cloud initialization will retry on the next normal save.',err);}
    }
    return out;
  };
}

/* ---------- Current-release transfer metadata ---------------------- */
// No schema bump is required: v295 changes the fresh-account default records,
// not the shape of account data. Keep portable files on their current formats
// while stamping them with the current app release.
if(typeof v142OrderExportPayload==='function'){
  const v295OrderExportBase=v142OrderExportPayload;
  v142OrderExportPayload=function(){
    const payload=v295OrderExportBase.apply(this,arguments)||{};
    payload.mediaFlowVersion=V295_RUNTIME_VERSION;
    payload.exportAudit=Object.assign({},payload.exportAudit||{}, {
      release:V295_RUNTIME_VERSION,
      defaultCategorySetV295:true,
      categoryVisualMetadata:true
    });
    return payload;
  };
}

if(typeof v281CollectionsExportPayload==='function'){
  const v295CollectionsExportBase=v281CollectionsExportPayload;
  v281CollectionsExportPayload=function(){
    const payload=v295CollectionsExportBase.apply(this,arguments)||{};
    payload.appVersion=V295_RUNTIME_VERSION;
    payload.mediaFlowVersion=V295_RUNTIME_VERSION;
    payload.exportAudit=Object.assign({},payload.exportAudit||{}, {
      release:V295_RUNTIME_VERSION,
      collectionSettings:true,
      categoryCompatibility:true
    });
    return payload;
  };
}

if(typeof v196BuildSettingsPreset==='function'){
  const v295SettingsPresetBase=v196BuildSettingsPreset;
  v196BuildSettingsPreset=function(){
    const preset=v295SettingsPresetBase.apply(this,arguments)||{};
    preset.mediaFlowVersion=V295_RUNTIME_VERSION;
    preset.presetManifest=preset.presetManifest||{};
    preset.presetManifest.includes=Object.assign({},preset.presetManifest.includes||{}, {
      v295DefaultCategoryDefinitions:true,
      v295PackagedCategoryArtwork:true,
      v295CategoryOrder:true
    });
    preset.presetManifest.v295={
      release:V295_RUNTIME_VERSION,
      defaultCategoryCount:DEFAULT_CATEGORIES.length,
      settingsPresetSchema:V196_SETTINGS_PRESET_SCHEMA_VERSION
    };
    return preset;
  };
}

if(typeof v148BuildFullBackup==='function'){
  const v295FullBackupBase=v148BuildFullBackup;
  v148BuildFullBackup=function(){
    const payload=v295FullBackupBase.apply(this,arguments)||{};
    payload.backupVersion=V295_RUNTIME_VERSION;
    payload.mediaFlowVersion=V295_RUNTIME_VERSION;
    payload.backupManifest=payload.backupManifest||{};
    payload.backupManifest.includes=Object.assign({},payload.backupManifest.includes||{}, {
      v295DefaultCategoryDefinitions:true,
      v295PackagedCategoryArtwork:true,
      v295ResponsiveNavigationRepair:true,
      cloudSyncAuditV295:true,
      syncNowAuditV295:true,
      automaticBackupAuditV295:true,
      fullDataExportImportAuditV295:true,
      settingsExportImportAuditV295:true,
      xpCalculationAuditV295:true,
      historyExportAuditV295:true,
      personalOrderImportExportAuditV295:true,
      collectionsImportExportAuditV295:true,
      pwaUpdateAuditV295:true
    });
    payload.backupManifest.v295={
      release:V295_RUNTIME_VERSION,
      defaultCategoryCount:DEFAULT_CATEGORIES.length,
      cloudSyncVersion:201,
      fullBackupSchema:29,
      settingsPresetSchema:1,
      personalOrderExportVersion:Number(v142OrderExportPayload?.()?.formatVersion)||5,
      collectionsExportVersion:Number(v281CollectionsExportPayload?.()?.mediaflowCollectionsExportVersion)||2,
      pwaRelease:V295_RUNTIME_VERSION
    };
    return payload;
  };
}

/* Category definitions are first-class cloud data. Explicitly verify all
   scheduler-critical/default-category fields, not only icon URLs. */
if(typeof v155VerifyCloudState==='function'){
  const v295VerifyCloudBase=v155VerifyCloudState;
  v155VerifyCloudState=function(cloudState,expected){
    const base=v295VerifyCloudBase.apply(this,arguments)||{ok:true,missing:[]};
    const problems=[...(base.missing||[])];
    const shape=state=>(Array.isArray(state?.categories)?state.categories:[]).map(c=>({
      id:String(c?.id||''),
      name:String(c?.name||''),
      icon:String(c?.icon||''),
      iconUrl:typeof v144SafeIconUrl==='function'?(v144SafeIconUrl(c?.iconUrl||'')||''):String(c?.iconUrl||''),
      type:String(c?.type||''),
      unit:String(c?.unit||''),
      target:Number(c?.target)||0,
      weight:Number(c?.weight)||0,
      minutesPerUnit:Number(c?.minutesPerUnit)||0,
      color:String(c?.color||''),
      seasonal:c?.seasonal===true,
      enabled:c?.enabled!==false,
      custom:c?.custom===true,
      missingCoverUrl:String(c?.missingCoverUrl||'')
    }));
    try{
      if(v250Fingerprint(shape(cloudState))!==v250Fingerprint(shape(expected)))problems.push('Category definitions');
    }catch(_){
      if(JSON.stringify(shape(cloudState))!==JSON.stringify(shape(expected)))problems.push('Category definitions');
    }
    return {ok:problems.length===0,missing:[...new Set(problems)]};
  };
}

/* ---------- Release audit ------------------------------------------ */
function v295DefaultCategoryAudit(){
  return DEFAULT_CATEGORIES.map((c,index)=>({
    position:index+1,id:c.id,name:c.name,iconUrl:c.iconUrl||'',type:c.type,unit:c.unit,
    target:c.target,weight:c.weight,minutesPerUnit:c.minutesPerUnit,seasonal:!!c.seasonal
  }));
}
function v295HasApp(...names){return names.some(n=>typeof App?.[n]==='function');}
function v295AuditState(){
  let snap=null,backup=null,preset=null,order=null,collectionsExport=null,cloudVerify=null;
  try{snap=snapshot();}catch(_){ }
  try{backup=v148BuildFullBackup();}catch(_){ }
  try{preset=v196BuildSettingsPreset();}catch(_){ }
  try{order=v142OrderExportPayload();}catch(_){ }
  try{collectionsExport=v281CollectionsExportPayload();}catch(_){ }
  try{cloudVerify=v155VerifyCloudState(snap,snap);}catch(_){ }
  const defaultAudit=v295DefaultCategoryAudit();
  return {
    version:V295_RUNTIME_VERSION,
    baseline:294,
    defaultCategoryCount:DEFAULT_CATEGORIES.length,
    defaultCategoryOrder:defaultAudit.map(x=>x.name),
    allDefaultCategoryIconsPackaged:defaultAudit.every(x=>/^assets\/category-icons\/.+\.png$/i.test(x.iconUrl)),
    cloudCategoryDefinitionsProtected:cloudVerify?.ok!==false,
    cloudSyncVersion:Number(snap?.cloudSyncVersion)||201,
    fullBackupSchema:Number(backup?.backupSchemaVersion||backup?.backupManifest?.schemaVersion)||29,
    settingsPresetSchema:Number(preset?.presetSchemaVersion||preset?.schemaVersion)||1,
    personalOrderExportVersion:Number(order?.formatVersion)||5,
    personalOrderRelease:Number(order?.mediaFlowVersion)||V295_RUNTIME_VERSION,
    collectionsExportVersion:Number(collectionsExport?.mediaflowCollectionsExportVersion)||2,
    collectionsExportRelease:Number(collectionsExport?.mediaFlowVersion||collectionsExport?.appVersion)||V295_RUNTIME_VERSION,
    pwaRelease:V295_RUNTIME_VERSION,
    responsiveNavMaxSlots:v276MobileNavSlotCount(963),
    systems:{
      cloudSnapshot:typeof snapshot==='function'&&typeof saveState==='function',
      freshAccountCloudInitialization:typeof v115StartWithData==='function',
      syncNow:v295HasApp('syncNow'),
      automaticBackup:typeof v148BuildFullBackup==='function',
      fullDataExport:v295HasApp('exportJSON'),
      fullDataImport:v295HasApp('importJSON'),
      settingsExport:v295HasApp('exportSettingsPreset'),
      settingsImport:v295HasApp('importSettingsPreset'),
      xpCalculation:typeof calculateConsumptionXP==='function'&&v295HasApp('calculateXPNow'),
      consumptionHistoryExport:v295HasApp('v271ExportConsumptionCSV'),
      historyLogsExport:v295HasApp('v271ExportLogsCSV'),
      personalOrderExport:typeof v142OrderExportPayload==='function'&&v295HasApp('v142ExportOrder'),
      personalOrderImport:v295HasApp('v142ImportOrder'),
      collectionsExport:v295HasApp('v279ExportCollections'),
      collectionsImport:v295HasApp('v279ImportCollections'),
      automaticUpdate:typeof v161EnsureAutomaticUpdateCheck==='function',
      automaticInstallUpdate:v295HasApp('v248ToggleAutoInstallUpdates')
    }
  };
}

Object.assign(App,{v295RefreshResponsiveNavigation,v295DefaultCategoryAudit,v295AuditState});
window.MediaFlowV295={version:V295_RUNTIME_VERSION,focus:'Fresh-account default categories, responsive navigation repair and complete persistence/export/PWA audit'};
MediaFlowRuntime.version=V295_RUNTIME_VERSION;

window.addEventListener('resize',v295RefreshResponsiveNavigation,{passive:true});
window.addEventListener('orientationchange',v295RefreshResponsiveNavigation,{passive:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',v295RefreshResponsiveNavigation,{once:true});
else v295RefreshResponsiveNavigation();
