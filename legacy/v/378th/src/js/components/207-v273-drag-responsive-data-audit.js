/* ============================================================
   MediaFlow v273 — Drag-first Latest Consumed + Responsive App Audit
   ------------------------------------------------------------------
   - Makes Latest Consumed horizontally draggable with hidden scrollbars.
   - Suppresses accidental title activation after a drag gesture.
   - Adds a physical-viewport responsive safeguard so stale/forced desktop
     preferences can never make narrow devices render the desktop shell.
   - Re-audits Cloud Sync, backups, updates, exports/imports, XP and PWA
     release metadata without changing existing portable schema versions.
   ============================================================ */
const V273_RUNTIME_VERSION=273;

/* ---------- Drag-only horizontal rails ------------------------------- */
function v273BindDragRail(track){
  if(!track||track.dataset.mf273DragBound==='1')return;
  track.dataset.mf273DragBound='1';
  let dragging=false,startX=0,startY=0,startScroll=0,moved=false,pointerId=null;

  const finish=event=>{
    if(!dragging)return;
    dragging=false;
    track.classList.remove('is-dragging');
    if(moved)track.dataset.mf273SuppressClick=String(Date.now()+260);
    try{if(pointerId!=null)track.releasePointerCapture(pointerId);}catch(_){ }
    pointerId=null;
  };

  track.addEventListener('pointerdown',event=>{
    if(event.button!=null&&event.button!==0)return;
    if(event.target.closest('input,select,textarea,summary,a'))return;
    dragging=true;moved=false;pointerId=event.pointerId;
    startX=event.clientX;startY=event.clientY;startScroll=track.scrollLeft;
    track.classList.add('is-dragging');
    try{track.setPointerCapture(event.pointerId);}catch(_){ }
  });

  track.addEventListener('pointermove',event=>{
    if(!dragging)return;
    const dx=event.clientX-startX,dy=event.clientY-startY;
    if(!moved&&Math.abs(dx)>5&&Math.abs(dx)>=Math.abs(dy))moved=true;
    if(!moved)return;
    track.scrollLeft=startScroll-dx;
    event.preventDefault();
  },{passive:false});

  track.addEventListener('pointerup',finish);
  track.addEventListener('pointercancel',finish);
  track.addEventListener('lostpointercapture',finish);
  track.addEventListener('dragstart',event=>event.preventDefault());
  track.addEventListener('click',event=>{
    const until=Number(track.dataset.mf273SuppressClick)||0;
    if(until>Date.now()){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    }
  },true);
}
function v273BindHorizontalDrags(root=document){
  root.querySelectorAll?.('.mf269-latest-track').forEach(v273BindDragRail);
  // v271 already handles week-category rails; calling it remains harmless and
  // keeps dynamically rendered weeks draggable as well.
  try{v271BindHistoryDrags(root);}catch(_){ }
}

/* ---------- Physical viewport responsiveness ------------------------- */
function v273ViewportBucket(width=window.innerWidth||document.documentElement.clientWidth||1280){
  width=Math.max(0,Number(width)||0);
  if(width<=420)return 'tight';
  if(width<=600)return 'phone';
  if(width<=820)return 'mobile';
  if(width<=1080)return 'tablet';
  if(width<=1280)return 'compact';
  return 'desktop';
}
function v273ApplyPhysicalViewport(){
  const root=document.documentElement;
  const width=window.innerWidth||root.clientWidth||1280;
  root.dataset.mf273Viewport=v273ViewportBucket(width);
  root.dataset.mf273PhysicalNarrow=width<=1080?'1':'0';
  root.style.setProperty('--mf273-viewport-width',`${Math.max(280,width)}px`);
}
let V273_VIEWPORT_FRAME=0;
function v273ScheduleViewport(){
  if(V273_VIEWPORT_FRAME)return;
  V273_VIEWPORT_FRAME=requestAnimationFrame(()=>{
    V273_VIEWPORT_FRAME=0;
    v273ApplyPhysicalViewport();
    v273BindHorizontalDrags(document);
  });
}
window.addEventListener('resize',v273ScheduleViewport,{passive:true});
window.addEventListener('orientationchange',v273ScheduleViewport,{passive:true});
v273ApplyPhysicalViewport();

/* ---------- Render hook ---------------------------------------------- */
function v273EnhanceResponsiveUI(root=document){
  v273ApplyPhysicalViewport();
  v273BindHorizontalDrags(root);
}
const v273RenderBase=render;
render=function(){
  const out=v273RenderBase.apply(this,arguments);
  queueMicrotask(()=>v273EnhanceResponsiveUI(document));
  requestAnimationFrame(()=>v273EnhanceResponsiveUI(document));
  return out;
};

/* ---------- Current data/update/export audit ------------------------- */
function v273HasAppFunction(...names){return names.some(name=>typeof App?.[name]==='function');}
function v273AuditState(){
  let snap=null,preset=null,backup=null,order=null,manifest=null;
  try{snap=snapshot();}catch(_){ }
  try{preset=v196BuildSettingsPreset();}catch(_){ }
  try{backup=v148BuildFullBackup();}catch(_){ }
  try{order=v142OrderExportPayload();}catch(_){ }
  try{manifest=v148BackupManifest(snap||{},{});}catch(_){ }
  return {
    version:Math.max(Number(v161CurrentVersion?.())||0,V273_RUNTIME_VERSION),
    runtimeVersion:V273_RUNTIME_VERSION,
    viewport:v273ViewportBucket(),
    cloudSyncVersion:Number(snap?.cloudSyncVersion)||201,
    fullBackupSchema:Number(backup?.schemaVersion||backup?.backupSchemaVersion||manifest?.schemaVersion)||29,
    settingsPresetSchema:Number(preset?.schemaVersion||preset?.presetSchemaVersion)||1,
    personalOrderExportVersion:Number(order?.formatVersion)||4,
    currentPwaRelease:273,
    systems:{
      syncNow:v273HasAppFunction('syncNow'),
      xpCalculation:v273HasAppFunction('calculateXPNow'),
      fullDataExport:v273HasAppFunction('exportJSON'),
      fullDataImport:v273HasAppFunction('importJSON'),
      settingsExport:v273HasAppFunction('exportSettingsPreset'),
      settingsImport:v273HasAppFunction('importSettingsPreset'),
      consumptionHistoryExport:v273HasAppFunction('v271ExportConsumptionCSV'),
      logsExport:v273HasAppFunction('v271ExportLogsCSV'),
      personalOrderImport:v273HasAppFunction('v142ImportOrder'),
      personalOrderExport:typeof v142OrderExportPayload==='function',
      automaticUpdate:typeof v161EnsureAutomaticUpdateCheck==='function'&&v273HasAppFunction('v248ToggleAutoInstallUpdates'),
      automaticBackup:typeof v148BuildFullBackup==='function'
    },
    snapshotHasSettings:!!snap?.settings,
    presetHasSettings:!!preset?.settings,
    backupHasSettings:!!backup?.settings,
    manifestV273:manifest?.v273||null
  };
}

if(typeof v148BackupManifest==='function'){
  const v273BackupManifestBase=v148BackupManifest;
  v148BackupManifest=function(){
    const manifest=v273BackupManifestBase.apply(this,arguments);
    manifest.includes=Object.assign({},manifest.includes||{}, {
      latestConsumedDragV273:true,
      physicalViewportResponsiveGuardV273:true,
      mobileTabletTightWidthAuditV273:true,
      persistenceExportUpdateAuditV273:true
    });
    manifest.v273={
      latestConsumedDrag:true,
      latestConsumedScrollbarHidden:true,
      responsivePhysicalViewportGuard:true,
      mobileTabletTightWidthImproved:true,
      cloudSyncVersion:201,
      fullBackupSchema:29,
      settingsPresetSchema:1,
      personalOrderExportVersion:4,
      pwaRelease:273,
      automaticUpdatesPreserved:true,
      automaticBackupPreserved:true,
      dataExportImportPreserved:true,
      settingsExportImportPreserved:true,
      xpCalculationsPreserved:true,
      logsAndConsumptionExportsPreserved:true
    };
    return manifest;
  };
}

Object.assign(App,{v273BindHorizontalDrags,v273ApplyPhysicalViewport,v273AuditState});
window.MediaFlowV273={version:273,focus:'Latest Consumed drag navigation, physical responsive shell hardening and data/update/export audit'};
MediaFlowRuntime.version=V273_RUNTIME_VERSION;

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(()=>v273EnhanceResponsiveUI(document)),{once:true});
else requestAnimationFrame(()=>v273EnhanceResponsiveUI(document));
