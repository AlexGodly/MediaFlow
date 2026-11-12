/* MediaFlow v391 — targeted main-thread performance repair.
 * Cache the already-computed Dynamic Library ordering until its authoritative
 * inputs change. Active-time XP additions update the clean live XP cache by
 * the exact reward delta instead of rescanning every title and History entry
 * each 15-second heartbeat. No saved data, rewards, or algorithms change.
 */
const V391_RELEASE=391;
const V391_PERF={dynamicHits:0,dynamicMisses:0,timeFastUpdates:0,timeFullInvalidations:0};
let V391_DYNAMIC_CACHE={key:'',library:null,rows:null};
const v391DynamicRowsBase=v181DynamicRows;
function v391DynamicKey(){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const f=S.histFilters||{};
  const sort=v189SortMode(),unfinished=v189UnfinishedOnly();
  const seed=sort==='random'?v189RandomSeed():'';
  const rating=typeof v274LibraryRatingMode==='function'?v274LibraryRatingMode():String(f.libRating||'all');
  return [Number(V53_LIB.libraryToken)||0,(S.library||[]).length,
    String(cfg.activeCategoryId||''),String(cfg.activeStatus||''),
    String(f.libPriority||'all'),String(f.libSearch||'').trim().toLocaleLowerCase(),
    sort,unfinished?'1':'0',seed,rating].join('\u0001');
}
v181DynamicRows=function(){
  const library=S.library||[];
  const key=v391DynamicKey();
  if(V391_DYNAMIC_CACHE.library===library&&V391_DYNAMIC_CACHE.key===key&&V391_DYNAMIC_CACHE.rows){
    V391_PERF.dynamicHits++;
    return V391_DYNAMIC_CACHE.rows;
  }
  const rows=v391DynamicRowsBase.apply(this,arguments);
  V391_DYNAMIC_CACHE={key,library,rows};
  V391_PERF.dynamicMisses++;
  return rows;
};
// Clear held Library references when a title is modified, imported, removed or
// cloud state is applied. This also protects the 50K-title memory footprint.
const v391InvalidateLibraryBase=v53InvalidateLibraryCache;
v53InvalidateLibraryCache=function(){
  V391_DYNAMIC_CACHE={key:'',library:null,rows:null};
  return v391InvalidateLibraryBase.apply(this,arguments);
};

// The v334 active-time timer accrues XP every 15 seconds. Its old invalidation
// unconditionally marked the entire v150 cache dirty; the sidebar's v385 timer
// then rebuilt XP from ALL Library + History entries. When nothing else is
// dirty, the only change here is the time reward, so patch its known delta.
// Other XP changes, imports, restores and edits retain the full recomputation.
let V391_TIME_REWARD_ONLY=false;
const v391EarnTimeBase=v334EarnTime;
v334EarnTime=function(){
  const was=V391_TIME_REWARD_ONLY;V391_TIME_REWARD_ONLY=true;
  try{return v391EarnTimeBase.apply(this,arguments);}
  finally{V391_TIME_REWARD_ONLY=was;}
};
const v391InvalidateXPBase=v334InvalidateXP;
v334InvalidateXP=function(){
  const cache=V150_XP_CACHE,old=cache?.v334Rewards;
  if(V391_TIME_REWARD_ONLY&&!V150_XP_CACHE_DIRTY&&!V149_STREAK_DIRTY&&old&&cache){
    const next=v334Totals(S.xpLedger||{});
    const delta=next.total-old.total;
    const fixedDelta=(next.startsXP-old.startsXP)+
      (next.collectionCreateXP-old.collectionCreateXP)+
      (next.collectionEditXP-old.collectionEditXP);
    if(Number.isFinite(delta)&&Number.isFinite(fixedDelta)&&delta>=0&&fixedDelta===0){
      cache.totalXP+=delta;
      cache.v334Rewards=next;
      V391_PERF.timeFastUpdates++;
      if(typeof v385ScheduleXP==='function')v385ScheduleXP();
      return;
    }
  }
  V391_PERF.timeFullInvalidations++;
  return v391InvalidateXPBase.apply(this,arguments);
};
App.v391PerformanceAudit=()=>({release:391,...V391_PERF,cacheEntries:V391_DYNAMIC_CACHE.rows?.length||0,
  xpCacheDirty:!!V150_XP_CACHE_DIRTY||!!V149_STREAK_DIRTY});
window.MediaFlowV391={version:391,focus:'Dynamic Library filtering cache and nonblocking active-time XP updates'};
MediaFlowRuntime.version=V391_RELEASE;
