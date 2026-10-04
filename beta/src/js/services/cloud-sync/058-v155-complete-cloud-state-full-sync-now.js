/* ============================================================
   MediaFlow v155 — Complete Cloud State + Full Sync Now
   ------------------------------------------------------------
   Audit result:
   - v153/v154 Old System WAS already in snapshot(), saveState(), loadAll()
     and mergeStates(), so Old System actions were already cloud-persistent.
   - Sync Now also saw Old System because it used snapshot()/mergeStates().
   - However, a few newer portable persistent values still lived outside the
     cloud snapshot: Rating Queue order and supported portable UI preferences.
   - v150's final XP breakdown also stopped exposing repeat-summary fields that
     older Sync/Calculate-XP result text still expected.

   v155:
   - explicitly keeps Old System in the complete cloud state;
   - adds portable extras to cloud snapshots;
   - merges/restores those extras across devices;
   - replaces Sync Now with a protected, verified complete synchronization;
   - restores repeat-summary fields so Sync/XP reporting remains valid.
   ============================================================ */

const V155_CLOUD_SYNC_VERSION=155;
let V155_APPLYING_PORTABLE=false;
let V155_PORTABLE_SAVE_TIMER=null;

function v155UserScopedKey(name){
  return `${name}_${String(AUTH_USER?.id||'local')}`;
}
function v155RatingQueueStampKey(){return v155UserScopedKey('mf_rating_queue_updated_v155');}
function v155UIPrefsStampKey(){return v155UserScopedKey('mf_ui_prefs_updated_v155');}

function v155ReadStamp(key){
  try{return Math.max(0,Number(localStorage.getItem(key))||0);}
  catch(_){return 0;}
}
function v155WriteStamp(key,value=Date.now()){
  try{localStorage.setItem(key,String(Math.max(0,Number(value)||Date.now())));}
  catch(_){}
}
function v155SchedulePortableCloudSave(){
  if(V155_APPLYING_PORTABLE||V115_STARTUP_GUARD)return;
  clearTimeout(V155_PORTABLE_SAVE_TIMER);
  V155_PORTABLE_SAVE_TIMER=setTimeout(()=>{
    V155_PORTABLE_SAVE_TIMER=null;
    try{saveState();}catch(_){}
  },650);
}

function v155PortableUIValues(){
  return {
    sidebarWidth:v148PortableSidebarWidth(),
    statsRecapMonth:String(S.statsRecapMonth||''),
    statsHeatmapYear:String(S.statsHeatmapYear||'')
  };
}

function v155PortableExtras(){
  const ratingQueue=v148PortableRatingQueue();
  const uiPreferences=v155PortableUIValues();

  let ratingQueueUpdatedAt=v155ReadStamp(v155RatingQueueStampKey());
  let uiPreferencesUpdatedAt=v155ReadStamp(v155UIPrefsStampKey());

  // First v155 run: establish a stable timestamp only if this device actually
  // has pre-existing portable data. The stamp is then changed only on edits.
  if(!ratingQueueUpdatedAt && ratingQueue.length){
    ratingQueueUpdatedAt=Date.now();
    v155WriteStamp(v155RatingQueueStampKey(),ratingQueueUpdatedAt);
  }
  if(!uiPreferencesUpdatedAt && (
    Number(uiPreferences.sidebarWidth)>0 ||
    uiPreferences.statsRecapMonth ||
    uiPreferences.statsHeatmapYear
  )){
    uiPreferencesUpdatedAt=Date.now();
    v155WriteStamp(v155UIPrefsStampKey(),uiPreferencesUpdatedAt);
  }

  return {
    ratingQueue,
    uiPreferences,
    _syncMeta:{
      ratingQueueUpdatedAt,
      uiPreferencesUpdatedAt
    }
  };
}

function v155MergePortableExtras(localExtras,cloudExtras){
  const l=(localExtras&&typeof localExtras==='object')?localExtras:{};
  const c=(cloudExtras&&typeof cloudExtras==='object')?cloudExtras:{};
  const lm=l._syncMeta||{}, cm=c._syncMeta||{};

  const lq=Number(lm.ratingQueueUpdatedAt)||0;
  const cq=Number(cm.ratingQueueUpdatedAt)||0;
  const lu=Number(lm.uiPreferencesUpdatedAt)||0;
  const cu=Number(cm.uiPreferencesUpdatedAt)||0;

  let ratingQueue;
  let ratingQueueUpdatedAt;
  if(cq>lq){
    ratingQueue=Array.isArray(c.ratingQueue)?c.ratingQueue:[];
    ratingQueueUpdatedAt=cq;
  }else if(lq>cq){
    ratingQueue=Array.isArray(l.ratingQueue)?l.ratingQueue:[];
    ratingQueueUpdatedAt=lq;
  }else{
    // Legacy/no-stamp tie: prefer a non-empty local queue, otherwise cloud.
    ratingQueue=Array.isArray(l.ratingQueue)&&l.ratingQueue.length
      ? l.ratingQueue
      : (Array.isArray(c.ratingQueue)?c.ratingQueue:[]);
    ratingQueueUpdatedAt=Math.max(lq,cq);
  }

  let uiPreferences;
  let uiPreferencesUpdatedAt;
  if(cu>lu){
    uiPreferences=(c.uiPreferences&&typeof c.uiPreferences==='object')?c.uiPreferences:{};
    uiPreferencesUpdatedAt=cu;
  }else if(lu>cu){
    uiPreferences=(l.uiPreferences&&typeof l.uiPreferences==='object')?l.uiPreferences:{};
    uiPreferencesUpdatedAt=lu;
  }else{
    uiPreferences=(l.uiPreferences&&typeof l.uiPreferences==='object'&&Object.keys(l.uiPreferences).length)
      ? l.uiPreferences
      : ((c.uiPreferences&&typeof c.uiPreferences==='object')?c.uiPreferences:{});
    uiPreferencesUpdatedAt=Math.max(lu,cu);
  }

  return {
    ratingQueue:[...new Set((Array.isArray(ratingQueue)?ratingQueue:[]).map(String).filter(Boolean))],
    uiPreferences:Object.assign({},uiPreferences||{}),
    _syncMeta:{ratingQueueUpdatedAt,uiPreferencesUpdatedAt}
  };
}

function v155ApplyPortableExtras(extras){
  if(!extras||typeof extras!=='object')return;
  V155_APPLYING_PORTABLE=true;
  try{
    if(Array.isArray(extras.ratingQueue)){
      V123_RATING_QUEUE=extras.ratingQueue.map(String).filter(Boolean);
      V125_RATING_QUEUE_LOADED=true;
      try{v125SaveRatingQueue();}catch(_){}
      try{v123SyncRatingQueue();}catch(_){}
    }

    const ui=(extras.uiPreferences&&typeof extras.uiPreferences==='object')
      ?extras.uiPreferences:{};

    const width=Number(ui.sidebarWidth);
    if(Number.isFinite(width)&&width>0){
      try{applySidebarWidth(width);}catch(_){}
    }
    if(Object.prototype.hasOwnProperty.call(ui,'statsRecapMonth')){
      S.statsRecapMonth=String(ui.statsRecapMonth||'');
    }
    if(Object.prototype.hasOwnProperty.call(ui,'statsHeatmapYear')){
      S.statsHeatmapYear=String(ui.statsHeatmapYear||'');
    }

    const meta=extras._syncMeta||{};
    if(Number(meta.ratingQueueUpdatedAt)>0){
      v155WriteStamp(v155RatingQueueStampKey(),Number(meta.ratingQueueUpdatedAt));
    }
    if(Number(meta.uiPreferencesUpdatedAt)>0){
      v155WriteStamp(v155UIPrefsStampKey(),Number(meta.uiPreferencesUpdatedAt));
    }

    try{localStorage.setItem('mf_theme',String(S.settings?.theme||'dark'));}catch(_){}
  }finally{
    V155_APPLYING_PORTABLE=false;
  }
}

// Rating Queue changes now become cloud-persistent too, not only localStorage.
const v155SaveRatingQueueBase=v125SaveRatingQueue;
v125SaveRatingQueue=function(){
  let before='';
  let after='';
  try{before=localStorage.getItem(v125RatingQueueStorageKey())||'';}catch(_){}
  const result=v155SaveRatingQueueBase.apply(this,arguments);
  try{after=localStorage.getItem(v125RatingQueueStorageKey())||'';}catch(_){}
  if(!V155_APPLYING_PORTABLE && before!==after){
    v155WriteStamp(v155RatingQueueStampKey());
    v155SchedulePortableCloudSave();
  }
  return result;
};

// Supported UI preferences now get a modification timestamp and are included
// in the next normal cloud save / Sync Now.
const v155ApplySidebarWidthBase=applySidebarWidth;
applySidebarWidth=function(width){
  let before='';
  try{before=String(localStorage.getItem(SIDEBAR_WIDTH_KEY)||'');}catch(_){}
  const result=v155ApplySidebarWidthBase.apply(this,arguments);
  let after='';
  try{after=String(localStorage.getItem(SIDEBAR_WIDTH_KEY)||'');}catch(_){}
  if(!V155_APPLYING_PORTABLE && before!==after){
    v155WriteStamp(v155UIPrefsStampKey());
    v155SchedulePortableCloudSave();
  }
  return result;
};

const v155SetRecapMonthBase=App.setRecapMonth;
App.setRecapMonth=function(v){
  const result=v155SetRecapMonthBase.call(this,v);
  if(!V155_APPLYING_PORTABLE){
    v155WriteStamp(v155UIPrefsStampKey());
    v155SchedulePortableCloudSave();
  }
  return result;
};

const v155SetHeatmapYearBase=App.setHeatmapYear;
App.setHeatmapYear=function(v){
  const result=v155SetHeatmapYearBase.call(this,v);
  if(!V155_APPLYING_PORTABLE){
    v155WriteStamp(v155UIPrefsStampKey());
    v155SchedulePortableCloudSave();
  }
  return result;
};

// Explicit complete cloud snapshot. Old System was already added by v153;
// v155 adds the remaining portable cloud data.
const v155SnapshotBase=snapshot;
snapshot=function(){
  const x=v155SnapshotBase();
  x.oldSystem=v153Clone(v153NormalizeOldSystem(S.oldSystem),V153_OLD_SYSTEM_DEFAULT);
  x.portableExtras=v155PortableExtras();
  x.cloudSyncVersion=V155_CLOUD_SYNC_VERSION;
  return x;
};

// Merge portable persistent data in addition to the existing Library/History,
// XP ledgers, Personal Order and Old System merge layers.
const v155MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v155MergeStatesBase(a,b)||{};
  out.portableExtras=v155MergePortableExtras(a?.portableExtras,b?.portableExtras);
  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    V155_CLOUD_SYNC_VERSION
  );
  return out;
};

// v150 optimized the progression breakdown but dropped repeat-summary fields
// still used by Sync Now / Calculate XP result text and Settings.
const v155XPBreakdownBase=v120XPBreakdown;
v120XPBreakdown=function(){
  const b=v155XPBreakdownBase();
  const r=v121RepeatXPBreakdown();
  return Object.assign({},b,r);
};

function v155StateCompleteness(state){
  const s=(state&&typeof state==='object')?state:{};
  const missing=[];

  if(!Array.isArray(s.categories))missing.push('categories');
  if(!Array.isArray(s.library))missing.push('Library');
  if(!Array.isArray(s.sessions))missing.push('History');
  if(!s.settings||typeof s.settings!=='object')missing.push('Settings');
  if(!s.xpLedger||typeof s.xpLedger!=='object')missing.push('XP ledgers');
  if(!Array.isArray(s.activityLog))missing.push('Library History');
  if(!Array.isArray(s.completionTimeline))missing.push('completion timeline');
  if(!s.orderPlan||typeof s.orderPlan!=='object')missing.push('Personal Order');
  if(!s.oldSystem||typeof s.oldSystem!=='object')missing.push('Old System');
  if(!s.portableExtras||typeof s.portableExtras!=='object')missing.push('portable extras');

  return {ok:missing.length===0,missing};
}

function v155VerifyCloudState(cloudState,expected){
  const c=v155StateCompleteness(cloudState);
  if(!c.ok)return c;

  const problems=[];
  const sameCount=(key)=>{
    const a=Array.isArray(expected?.[key])?expected[key].length:0;
    const b=Array.isArray(cloudState?.[key])?cloudState[key].length:0;
    if(a!==b)problems.push(`${key} count`);
  };

  sameCount('library');
  sameCount('sessions');
  sameCount('activityLog');
  sameCount('completionTimeline');

  const eo=expected?.oldSystem||{}, co=cloudState?.oldSystem||{};
  if(Number(eo.modifiedAt||0)!==Number(co.modifiedAt||0))problems.push('Old System');

  const ep=expected?.orderPlan||{}, cp=cloudState?.orderPlan||{};
  if(Number(ep.modifiedAt||0)!==Number(cp.modifiedAt||0))problems.push('Personal Order');

  const eq=expected?.portableExtras?.ratingQueue||[];
  const cq=cloudState?.portableExtras?.ratingQueue||[];
  if(eq.length!==cq.length)problems.push('Rating Queue');

  return {ok:problems.length===0,missing:problems};
}

async function v155SyncNow(){
  if(v134OperationBusy('sync'))return;
  V134_HEAVY_OPERATION='sync';
  showDataProgress('Sync now','Preparing complete protected MediaFlow synchronization…',3);

  try{
    // Finish any older queued saves before we take the local source snapshot.
    await saveQueue;

    updateDataProgress(8,'Building complete local cloud snapshot…');
    const local=snapshot();
    const localCheck=v155StateCompleteness(local);
    if(!localCheck.ok){
      throw new Error(`Local state is incomplete (${localCheck.missing.join(', ')}). Sync stopped before writing anything.`);
    }
    await v134Yield();

    updateDataProgress(15,'Reading protected cloud state…');
    let cloud;
    try{
      cloud=await v115FetchCloudState();
    }catch(error){
      throw new Error(`Cloud read failed. Nothing was written. ${String(error?.message||error)}`);
    }

    // Preserve v115's core safety invariant: missing/suspicious cloud reads do
    // not automatically become writes, even when Sync Now is pressed.
    if(!cloud?.found){
      throw new Error('Cloud state is missing. Protected Sync stopped without writing anything. Retry the cloud connection or use the existing recovery flow.');
    }
    if(!cloud.state||typeof cloud.state!=='object'){
      throw new Error('Cloud state could not be read safely. Protected Sync stopped without writing anything.');
    }

    const localStats=v115StateStats(local);
    const cloudStats=v115StateStats(cloud.state);
    if(localStats.core>0 && cloudStats.core===0){
      throw new Error('Cloud state looks unexpectedly empty compared with this device. Protected Sync stopped without overwriting it.');
    }

    updateDataProgress(25,'Merging all cloud + local MediaFlow data…');
    const merged=mergeStates(local,cloud.state);
    const mergedCheck=v155StateCompleteness(merged);
    if(!mergedCheck.ok){
      throw new Error(`Merged state is incomplete (${mergedCheck.missing.join(', ')}). Sync stopped before upload.`);
    }
    await v134Yield();

    updateDataProgress(34,'Applying Library, History, Settings, Order and Old System…');
    v46ApplyState(merged);
    v155ApplyPortableExtras(merged.portableExtras);
    V153_HISTORY_CACHE_DIRTY=true;
    v149MarkStreakDirty();
    await v134Yield();

    updateDataProgress(41,'Rebuilding progression, repeats and streak XP…');
    await v134RecalculateXPOptimized(false,{
      start:42,
      historyEnd:61,
      completionEnd:73,
      repeatEnd:83
    });

    updateDataProgress(85,'Refreshing scheduler balance and health…');
    await v46RefreshSchedulerProgress();

    // Use rawSet directly here so Sync Now receives the real cloud-write error.
    // saveState() intentionally catches errors for normal UI autosaves.
    updateDataProgress(91,'Uploading one complete protected cloud state…');
    const finalState=snapshot();
    await rawSet(STATE_KEY,finalState);

    updateDataProgress(96,'Verifying cloud upload…');
    const verify=await v115FetchCloudState();
    if(!verify?.found||!verify.state){
      throw new Error('Cloud upload could not be verified after writing.');
    }
    const verification=v155VerifyCloudState(verify.state,finalState);
    if(!verification.ok){
      throw new Error(`Cloud verification found incomplete data: ${verification.missing.join(', ')}.`);
    }

    // Keep local recovery cache aligned with the verified cloud result.
    try{v115WriteRecoveryCache(verify.state);}catch(_){}

    const info=mediaFlowLevelInfo();
    const b=v120XPBreakdown();
    const os=v153NormalizeOldSystem(S.oldSystem);
    const queueCount=(V123_RATING_QUEUE||[]).length;

    render();
    finishDataProgress(
      true,
      'Sync complete & verified',
      `${(S.library||[]).length.toLocaleString()} titles · ${(S.sessions||[]).length.toLocaleString()} logs · ${os.rules.length.toLocaleString()} Old System rule${os.rules.length===1?'':'s'} · ${os.transactions.length.toLocaleString()} Old System transaction${os.transactions.length===1?'':'s'} · ${queueCount.toLocaleString()} rating queue · ${b.completedTitles.toLocaleString()} completed · ${b.fullRepeats.toLocaleString()} full rewatches/rereads · Level ${info.level} · ${info.xp.toLocaleString()} XP`
    );
  }catch(e){
    console.error(e);
    finishDataProgress(false,'Sync failed safely',String(e?.message||e));
  }finally{
    V134_HEAVY_OPERATION='';
  }
}

// FINAL runtime Sync Now.
App.syncNow=v155SyncNow;

// Keep the Settings explanation aligned with what v155 really synchronizes.
const v155RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v155RenderSettingsBase();
  h=h.replace(
    'Merge cloud + local data, refresh XP and scheduler calculations with the optimized large-library path, then upload one complete protected state.',
    'Merge and verify the complete cloud + local MediaFlow state — Library, History, Library History, Settings/themes, XP, Personal Order, Old System, Rating Queue and portable preferences — then refresh progression/scheduler calculations and verify the final cloud upload.'
  );
  h=h.replace(
    'Synchronize MediaFlow</b>',
    'Synchronize all MediaFlow data</b>'
  );
  return h;
};



