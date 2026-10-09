/* ============================================================
   MediaFlow v148 — Complete-data Backup Audit + Full Restore
   ------------------------------------------------------------
   Audit result for v147:
   snapshot() already covered the large account state through its wrapper chain:
   categories/order, Library (including cover/rating/date metadata), History,
   Settings, task/session, profile picture/name, stopwatch, MAL link, XP ledgers,
   completion timeline, Library History/migrations and Personal Order.

   The persistent Rating Queue lived separately in localStorage and therefore was
   NOT inside v147's JSON backup. Device UI preferences such as sidebar width
   were also outside the backup. v148 makes the full backup explicitly include
   those portable extras and adds stricter validation/runtime restoration.

   Transient unsaved UI (open modal, in-progress form drafts, current filter page,
   undo/redo stacks) is intentionally not portable app data.
   ============================================================ */

function v148CurrentVersion(){
  const meta=document.querySelector('meta[name="mediaflow-version"]');
  return Number(meta?.getAttribute('content'))||148;
}

function v148SafeClone(value,fallback=null){
  try{return JSON.parse(JSON.stringify(value));}
  catch(_){return fallback;}
}

function v148PortableRatingQueue(){
  try{
    v125LoadRatingQueue();
    v123SyncRatingQueue();
    return V123_RATING_QUEUE.map(String).filter(Boolean);
  }catch(_){
    return [];
  }
}

function v148PortableSidebarWidth(){
  try{
    const value=Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
    return Number.isFinite(value)&&value>0?value:null;
  }catch(_){
    return null;
  }
}

function v148BackupManifest(state,extras){
  const ledger=state?.xpLedger||{};
  const order=state?.orderPlan||{};
  return {
    schemaVersion:2,
    completeAccountState:true,
    counts:{
      categories:Array.isArray(state?.categories)?state.categories.length:0,
      libraryTitles:Array.isArray(state?.library)?state.library.length:0,
      historyLogs:Array.isArray(state?.sessions)?state.sessions.length:0,
      libraryHistory:Array.isArray(state?.activityLog)?state.activityLog.length:0,
      completionTimeline:Array.isArray(state?.completionTimeline)?state.completionTimeline.length:0,
      personalOrderTitles:Array.isArray(order?.titleIds)?order.titleIds.length:0,
      ratingQueue:Array.isArray(extras?.ratingQueue)?extras.ratingQueue.length:0,
      xpRatingRewards:Object.keys(ledger?.ratings||{}).length
    },
    includes:{
      categories:true,
      categoryOrder:true,
      library:true,
      history:true,
      settings:true,
      currentTask:true,
      activeSession:true,
      profileName:true,
      profilePicture:true,
      stopwatch:true,
      malLink:true,
      xpLedgers:true,
      completionTimeline:true,
      libraryHistory:true,
      migrations:true,
      personalOrder:true,
      personalOrderRecovery:true,
      customCategoryIcons:true,
      customCategoryColors:true,
      dynamicThemeSettings:true,
      ratingQueue:true,
      portableUiPreferences:true
    },
    note:'Browser-granted filesystem folder handles and authentication credentials are intentionally not portable JSON data.'
  };
}

function v148BuildFullBackup(){
  // snapshot() is the canonical MediaFlow account state and already includes all
  // late-version wrappers (profileName, activityLog, orderPlan, settings, etc.).
  const state=v148SafeClone(snapshot(),{})||{};

  // Be explicit about modern fields so future refactors cannot silently omit them.
  state.profileName=String(S.profileName||'').trim();
  state.profilePicture=String(S.profilePicture||'').trim();
  state.activityLog=v148SafeClone(Array.isArray(S.activityLog)?S.activityLog:[],[]);
  state.migrations=v148SafeClone(S.migrations||{}, {});
  state.orderPlan=v148SafeClone(v138NormalizeOrderPlan(S.orderPlan,S.library,S.categories),{});
  state.completionTimeline=v148SafeClone(Array.isArray(S.completionTimeline)?S.completionTimeline:[],[]);
  state.xpLedger=v148SafeClone(S.xpLedger||{libraryAdditions:{}},{libraryAdditions:{}});
  state.stopwatch=v148SafeClone(S.stopwatch||{running:false,startedAt:0,elapsed:0,resetValue:0},{running:false,startedAt:0,elapsed:0,resetValue:0});
  state.malLink=v148SafeClone(S.malLink||{username:'',mode:'anime'},{username:'',mode:'anime'});
  state.settings=v148SafeClone(S.settings||DEFAULT_SETTINGS,{});
  state.categoryOrder=v74SyncCategoryOrder().slice();

  const extras={
    ratingQueue:v148PortableRatingQueue(),
    uiPreferences:{
      sidebarWidth:v148PortableSidebarWidth(),
      statsRecapMonth:String(S.statsRecapMonth||''),
      statsHeatmapYear:String(S.statsHeatmapYear||'')
    }
  };

  const now=new Date();
  return Object.assign({},state,{
    backupFormat:'MediaFlow_Full_Backup',
    backupSchemaVersion:2,
    backupVersion:v148CurrentVersion(),
    mediaFlowVersion:v148CurrentVersion(),
    exportedAt:now.toISOString(),
    portableExtras:extras,
    backupManifest:v148BackupManifest(state,extras),
    progression:mediaFlowLevelInfo(),
    progressionBreakdown:v120XPBreakdown()
  });
}

function v148ValidateBackup(data){
  if(!data||typeof data!=='object'||Array.isArray(data)){
    return {ok:false,message:'The selected file is not a MediaFlow backup object.'};
  }

  const format=String(data.backupFormat||'');
  const hasCore=
    Array.isArray(data.categories) &&
    Array.isArray(data.library) &&
    Array.isArray(data.sessions) &&
    data.settings && typeof data.settings==='object';

  // Modern full backup.
  if(format==='MediaFlow_Full_Backup'){
    if(!hasCore){
      return {ok:false,message:'This MediaFlow full backup is incomplete or corrupted.'};
    }
    return {ok:true,legacy:false};
  }

  // Backward compatibility for older MediaFlow JSON backups that predate the
  // backupFormat marker but still contain the canonical core account state.
  if(hasCore){
    return {ok:true,legacy:true};
  }

  return {
    ok:false,
    message:'This JSON does not contain the required MediaFlow categories, Library, History and Settings data.'
  };
}

function v148RestorePortableExtras(data){
  const extras=data?.portableExtras&&typeof data.portableExtras==='object'
    ? data.portableExtras
    : {};

  // v148 Rating Queue portability. v147 and older backups simply rebuild the
  // queue from unrated Library titles because the field did not exist.
  if(Array.isArray(extras.ratingQueue)){
    V123_RATING_QUEUE=extras.ratingQueue.map(String).filter(Boolean);
    V125_RATING_QUEUE_LOADED=true;
    try{v125SaveRatingQueue();}catch(_){}
    try{v123SyncRatingQueue();}catch(_){}
  }else{
    // Do not keep a stale queue from the pre-import Library.
    V123_RATING_QUEUE=[];
    V125_RATING_QUEUE_LOADED=true;
    try{v125SaveRatingQueue();v123SyncRatingQueue();}catch(_){}
  }

  const ui=extras.uiPreferences&&typeof extras.uiPreferences==='object'
    ? extras.uiPreferences
    : {};

  const width=Number(ui.sidebarWidth);
  if(Number.isFinite(width)&&width>0){
    try{
      localStorage.setItem(SIDEBAR_WIDTH_KEY,String(width));
      applySidebarWidth(width);
    }catch(_){}
  }

  if(Object.prototype.hasOwnProperty.call(ui,'statsRecapMonth')){
    S.statsRecapMonth=String(ui.statsRecapMonth||'');
  }
  if(Object.prototype.hasOwnProperty.call(ui,'statsHeatmapYear')){
    S.statsHeatmapYear=String(ui.statsHeatmapYear||'');
  }

  // Keep the fast local theme cache aligned with imported Settings.
  try{localStorage.setItem('mf_theme',String(S.settings?.theme||'dark'));}catch(_){}
}

function v148FinalizeImportedRuntime(){
  // Full backups replace the profile picture too, including intentionally empty.
  // v46's legacy fallback kept the pre-import picture when the imported value
  // was empty, so v148 explicitly honors the backup value.
  try{applyTheme(S.settings?.theme||'dark');}catch(_){}

  try{
    clearInterval(window.__sw);
    window.__sw=null;
    if(S.stopwatch?.running)window.__sw=setInterval(stopwatchTick,250);
  }catch(_){}

  try{restartBackupTimer();}catch(_){}
  try{v53InvalidateLibraryCache();}catch(_){}
  try{v53InvalidateSessionCache();}catch(_){}
}

function v148ImportSummary(){
  const orderCount=Array.isArray(S.orderPlan?.titleIds)?S.orderPlan.titleIds.length:0;
  const queueCount=Array.isArray(V123_RATING_QUEUE)?V123_RATING_QUEUE.length:0;
  return `${(S.library||[]).length.toLocaleString()} titles · ${(S.sessions||[]).length.toLocaleString()} logs · ${(S.activityLog||[]).length.toLocaleString()} Library History · ${orderCount.toLocaleString()} ordered · ${queueCount.toLocaleString()} rating queue`;
}

// FINAL full export used at runtime.
App.exportJSON=function(){
  showDataProgress('Exporting complete MediaFlow backup','Auditing and packing all persistent MediaFlow data…',8);

  setTimeout(()=>{
    try{
      const payload=v148BuildFullBackup();
      const now=new Date(payload.exportedAt);
      const pad=n=>String(n).padStart(2,'0');
      const stamp=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

      updateDataProgress(55,'Packing Library, History, progression, Order, themes and local queues…');
      const json=JSON.stringify(payload,null,2);
      const blob=new Blob([json],{type:'application/json'});

      updateDataProgress(88,'Creating complete backup download…');
      triggerDownload(blob,`MediaFlow_Backup_${stamp}.json`);

      const c=payload.backupManifest?.counts||{};
      finishDataProgress(
        true,
        'Export successful',
        `Complete v${payload.mediaFlowVersion} backup · ${(c.libraryTitles||0).toLocaleString()} titles · ${(c.historyLogs||0).toLocaleString()} logs · ${(c.personalOrderTitles||0).toLocaleString()} ordered · ${(c.ratingQueue||0).toLocaleString()} rating queue`
      );
    }catch(e){
      console.error(e);
      finishDataProgress(false,'Export failed','MediaFlow could not create the complete backup file.');
    }
  },40);
};

// FINAL full import used at runtime.
App.importJSON=function(file){
  if(!file)return;

  showDataProgress('Importing complete MediaFlow backup','Reading and validating backup file…',5);

  const reader=new FileReader();
  reader.onprogress=e=>{
    if(e.lengthComputable){
      updateDataProgress(
        Math.min(22,5+Math.round((e.loaded/e.total)*17)),
        'Reading backup…'
      );
    }
  };

  reader.onload=async()=>{
    try{
      const data=JSON.parse(reader.result);
      const validation=v148ValidateBackup(data);
      if(!validation.ok){
        finishDataProgress(false,'Import rejected',validation.message);
        return;
      }

      updateDataProgress(26,'Restoring complete account state…');

      // Existing wrapper chain restores all modern account fields:
      // v120 Library History/profile, v121 nested repeat settings, v138 Order.
      v46ApplyState(data);

      // Honor exact full-backup replacement semantics for fields whose older
      // apply code intentionally used non-empty fallbacks.
      if(Object.prototype.hasOwnProperty.call(data,'profilePicture')){
        S.profilePicture=String(data.profilePicture||'').trim();
      }
      if(Object.prototype.hasOwnProperty.call(data,'profileName')){
        S.profileName=String(data.profileName||'').trim();
      }

      v148RestorePortableExtras(data);

      updateDataProgress(42,'Checking restored progression and completion data…');
      const info=await v46RecalculateXP(false);

      updateDataProgress(66,'Refreshing scheduler and runtime state…');
      await v46RefreshSchedulerProgress();
      v148FinalizeImportedRuntime();

      updateDataProgress(84,'Saving restored complete state to protected cloud storage…');
      await saveState();
      await saveQueue;

      render();

      finishDataProgress(
        true,
        validation.legacy?'Legacy backup imported':'Import successful',
        `${v148ImportSummary()} · Level ${info.level} · ${info.xp.toLocaleString()} XP`
      );
    }catch(e){
      console.error(e);
      finishDataProgress(
        false,
        'Import failed',
        'Could not restore that MediaFlow JSON backup. The file may be invalid or corrupted.'
      );
    }
  };

  reader.onerror=()=>finishDataProgress(false,'Import failed','The file could not be read.');
  reader.readAsText(file);
};

// Explain exactly what Full Backup now means in Settings without adding another
// exporter or import path.
const v148RenderSettingsBase=renderSettings;
renderSettings=function(){
  let out=v148RenderSettingsBase();
  const note=`<div class="v148-backup-note"><b>Full Backup:</b> exports/restores all persistent MediaFlow account data — categories, Library metadata/covers/dates, consumption History, Settings/themes, XP ledgers, completion timeline, Library History, profile data, stopwatch, MAL link, Personal Order + recovery state and the saved Rating Queue. Browser authentication and filesystem folder permissions are not portable JSON data.</div>`;

  const exportButton='<button class="btn" onclick="App.exportJSON()">Export JSON backup</button>';
  if(out.includes(exportButton))out=out.replace(exportButton,exportButton+note);
  return out;
};



