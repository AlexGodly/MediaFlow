/* ============================================================
   MediaFlow v150 — v149 Streak XP Performance Fix
   ------------------------------------------------------------
   Root causes fixed:
   1) mediaFlowXP() still reduced the full History on every level read/render;
   2) v149 logged-completion streak bonus rebuilt maps repeatedly;
   3) completion-date fallback could scan all History once per completion
      (O(completions × history));
   4) the XP breakdown repeated several full History scans.

   v150 builds one shared live XP/streak cache after relevant data changes.
   Normal renders now read totals in O(1). Library History before/after snapshots
   use a single linear indexed scan instead of nested History scans.
   ============================================================ */

let V150_XP_CACHE_DIRTY=true;
let V150_XP_CACHE={
  historyXP:0,
  rawHistoryXP:0,
  sessionStreakBonusXP:0,
  loggedCompletionStreakBonusXP:0,
  fixedLibraryXP:0,
  totalXP:0,
  completedTitles:0,
  libraryTitleXP:0,
  completedTitleXP:0,
  libraryEditXP:0,
  manualCoverXP:0,
  loggedCompletionBonusXP:0,
  ratingXP:0,
  ratingRewards:0
};

function v150LedgerSum(ledger,name){
  return Object.values(ledger?.[name]||{}).reduce((a,v)=>a+(Number(v)||0),0);
}

function v150BaseSessionXP(s){
  if(!s||s.status==='skipped')return 0;
  const stored=Number(s.xp);
  if(Number.isFinite(stored)&&stored>0)return Math.max(0,stored);
  if((Number(s.actualAmount)||0)>0&&(Number(s.minutes)||0)>0){
    const cat=getCategory(s.categoryId);
    return Math.max(0,Number(calculateConsumptionXP(
      cat,
      Number(s.actualAmount)||0,
      Number(s.minutes)||0,
      s.healthStatus||'healthy'
    ).xp)||0);
  }
  return 0;
}

function v150CompletionDateKey(item,latestSessionDateByLibraryId){
  const ts=Number(item?.completedAt)||0;
  if(ts>0){
    const d=new Date(ts);
    if(!Number.isNaN(d.getTime()))return d.toISOString().slice(0,10);
  }
  return latestSessionDateByLibraryId.get(String(item?.id||''))?.key||'';
}

function v150ComputeStateMetrics(state,mutateSessions=false){
  const sessions=Array.isArray(state?.sessions)?state.sessions:[];
  const library=Array.isArray(state?.library)?state.library:[];
  const ledger=state?.xpLedger||{};
  const streakMap=v149BuildStreakMap(sessions);
  const latestSessionDateByLibraryId=new Map();

  let rawHistoryXP=0;
  let historyXP=0;

  for(const s of sessions){
    if(!s||s.status==='skipped'){
      if(mutateSessions&&s){
        s.streakAtLog=0;
        s.streakMultiplier=1;
        s.streakBaseXP=0;
        s.streakBonusXP=0;
        s.xpWithStreak=0;
        s.streakXPVersion=V149_STREAK_XP_VERSION;
      }
      continue;
    }

    const key=v149DateKeyFromSession(s);
    const streak=key?(streakMap.get(key)||1):1;
    const multiplier=v149StreakMultiplier(streak);
    const raw=Math.max(0,Math.round(v150BaseSessionXP(s)));
    const total=Math.max(0,Math.round(raw*multiplier));

    rawHistoryXP+=raw;
    historyXP+=total;

    if(mutateSessions){
      s.streakAtLog=streak;
      s.streakMultiplier=multiplier;
      s.streakBaseXP=raw;
      s.streakBonusXP=Math.max(0,total-raw);
      s.xpWithStreak=total;
      s.streakXPVersion=V149_STREAK_XP_VERSION;
    }

    const ts=Number(s.timestamp)||0;
    for(const t of (s.titles||[])){
      const id=String(t?.libraryId||'');
      if(!id)continue;
      const prev=latestSessionDateByLibraryId.get(id);
      if(!prev||ts>=prev.ts){
        latestSessionDateByLibraryId.set(id,{ts,key});
      }
    }
  }

  const completionLedger=ledger?.logCompletions||{};
  const completionIds=new Set(Object.keys(completionLedger));
  const libraryByCompletionId=new Map();
  let completedTitles=0;

  for(const item of library){
    if(v120IsCompleted(item))completedTitles++;
    const id=String(item?.id||'');
    if(id&&completionIds.has(id))libraryByCompletionId.set(id,item);
  }

  let loggedCompletionStreakBonusXP=0;
  for(const [id,value] of Object.entries(completionLedger)){
    const raw=Math.max(0,Number(value)||0);
    if(raw<=0)continue;
    const item=libraryByCompletionId.get(String(id));
    if(!item)continue;

    const key=v150CompletionDateKey(item,latestSessionDateByLibraryId);
    const streak=streakMap.get(key)||0;
    const total=Math.max(0,Math.round(raw*v149StreakMultiplier(streak)));
    loggedCompletionStreakBonusXP+=Math.max(0,total-raw);
  }

  const l=levelingSettings();
  const enabled=l.enabled!==false;
  const libraryTitleXP=enabled
    ? library.length*Math.max(0,Math.round(Number(l.libraryAdditionXP)||0))
    : 0;
  const completedTitleXP=enabled
    ? completedTitles*Math.max(0,Math.round(Number(l.completionXP)||0))
    : 0;

  const libraryEditXP=v150LedgerSum(ledger,'libraryEdits');
  const manualCoverXP=v150LedgerSum(ledger,'manualCovers');
  const loggedCompletionBonusXP=v150LedgerSum(ledger,'logCompletions');
  const ratingXP=v150LedgerSum(ledger,'ratings');
  const ratingRewards=Object.keys(ledger?.ratings||{}).length;

  const fixedLibraryXP=
    libraryTitleXP+
    completedTitleXP+
    libraryEditXP+
    manualCoverXP+
    loggedCompletionBonusXP+
    ratingXP;

  return {
    streakMap,
    rawHistoryXP:Math.round(rawHistoryXP),
    historyXP:Math.round(historyXP),
    sessionStreakBonusXP:Math.max(0,Math.round(historyXP-rawHistoryXP)),
    loggedCompletionStreakBonusXP:Math.round(loggedCompletionStreakBonusXP),
    fixedLibraryXP:Math.round(fixedLibraryXP),
    totalXP:Math.round(historyXP+fixedLibraryXP+loggedCompletionStreakBonusXP),
    completedTitles,
    libraryTitleXP:Math.round(libraryTitleXP),
    completedTitleXP:Math.round(completedTitleXP),
    libraryEditXP:Math.round(libraryEditXP),
    manualCoverXP:Math.round(manualCoverXP),
    loggedCompletionBonusXP:Math.round(loggedCompletionBonusXP),
    ratingXP:Math.round(ratingXP),
    ratingRewards
  };
}

function v150BuildLiveXPCache(){
  const metrics=v150ComputeStateMetrics({
    sessions:S.sessions||[],
    library:S.library||[],
    xpLedger:S.xpLedger||{}
  },true);

  V149_STREAK_MAP=metrics.streakMap;
  V149_STREAK_DIRTY=false;
  V150_XP_CACHE=metrics;
  V150_XP_CACHE_DIRTY=false;
  return V150_XP_CACHE;
}

function v150EnsureLiveXPCache(){
  if(V150_XP_CACHE_DIRTY||V149_STREAK_DIRTY)return v150BuildLiveXPCache();
  return V150_XP_CACHE;
}

// All existing v149 dirty paths call this binding at runtime.
v149MarkStreakDirty=function(){
  V149_STREAK_DIRTY=true;
  V150_XP_CACHE_DIRTY=true;
};

// Reuse the same single pass for streak annotations and aggregates.
v149AnnotateSessionStreakXP=function(){
  v150BuildLiveXPCache();
  return V149_STREAK_MAP;
};
v149EnsureStreakXP=function(){
  v150EnsureLiveXPCache();
  return V149_STREAK_MAP;
};

// O(1) normal History XP read after the cache is built.
sessionStoredXP=function(s){
  if(!s||s.status==='skipped')return 0;
  v150EnsureLiveXPCache();
  if(Number.isFinite(Number(s.xpWithStreak)))return Math.max(0,Number(s.xpWithStreak));
  return Math.max(0,v150BaseSessionXP(s));
};

// O(1) progression totals during normal rendering.
mediaFlowXP=function(){
  return v150EnsureLiveXPCache().totalXP;
};

libraryXPTotal=function(){
  const c=v150EnsureLiveXPCache();
  return c.fixedLibraryXP+c.loggedCompletionStreakBonusXP;
};

v149LoggedCompletionStreakBonus=function(){
  return v150EnsureLiveXPCache().loggedCompletionStreakBonusXP;
};

v149SessionRawXPTotal=function(sessions){
  if(sessions===S.sessions)return v150EnsureLiveXPCache().rawHistoryXP;
  return v150ComputeStateMetrics({sessions:Array.isArray(sessions)?sessions:[],library:[],xpLedger:{}},false).rawHistoryXP;
};

v149SessionStreakBonusForState=function(state){
  if(state?.sessions===S.sessions&&state?.library===S.library&&state?.xpLedger===S.xpLedger){
    return v150EnsureLiveXPCache().sessionStreakBonusXP;
  }
  return v150ComputeStateMetrics(state||{},false).sessionStreakBonusXP;
};

v149LoggedCompletionStreakBonusForState=function(state){
  if(state?.sessions===S.sessions&&state?.library===S.library&&state?.xpLedger===S.xpLedger){
    return v150EnsureLiveXPCache().loggedCompletionStreakBonusXP;
  }
  return v150ComputeStateMetrics(state||{},false).loggedCompletionStreakBonusXP;
};

// Replace the multi-pass v149 breakdown with one cached read.
v120XPBreakdown=function(){
  v120EnsureXPState();
  const c=v150EnsureLiveXPCache();
  const currentDayStreak=v149StreakForDateKey(todayISO());
  const prospectiveTodayStreak=v149ProspectiveTodayStreak();

  return {
    total:c.totalXP,
    historyXP:c.historyXP,
    preStreakHistoryXP:c.rawHistoryXP,
    sessionStreakBonusXP:c.sessionStreakBonusXP,
    loggedCompletionStreakBonusXP:c.loggedCompletionStreakBonusXP,
    streakBonusXP:c.sessionStreakBonusXP+c.loggedCompletionStreakBonusXP,
    libraryTitleXP:c.libraryTitleXP,
    completedTitleXP:c.completedTitleXP,
    libraryEditXP:c.libraryEditXP,
    manualCoverXP:c.manualCoverXP,
    loggedCompletionBonusXP:c.loggedCompletionBonusXP,
    ratingXP:c.ratingXP,
    ratingRewards:c.ratingRewards,
    completedTitles:c.completedTitles,
    currentDayStreak,
    currentStreakMultiplier:v149StreakMultiplier(currentDayStreak),
    prospectiveTodayStreak,
    prospectiveTodayMultiplier:v149StreakMultiplier(prospectiveTodayStreak),
    streakXPFormulaVersion:V149_STREAK_XP_VERSION
  };
};

// Library History before/after XP comparisons stay exact, but are now linear
// O(history + library) instead of v149's potential O(completions × history).
v50SnapshotXP=function(x){
  if(!x)return null;
  return v150ComputeStateMetrics({
    sessions:Array.isArray(x.sessions)?x.sessions:[],
    library:Array.isArray(x.library)?x.library:[],
    xpLedger:x.xpLedger||{}
  },false).totalXP;
};

// Invalidate the aggregate cache for every persistent source that can affect XP.
const v150PersistLibraryBase=persistLibrary;
persistLibrary=function(){
  v149MarkStreakDirty();
  return v150PersistLibraryBase.apply(this,arguments);
};

const v150PersistSettingsBase=persistSettings;
persistSettings=function(){
  v149MarkStreakDirty();
  return v150PersistSettingsBase.apply(this,arguments);
};

// The v149 wrappers already invalidate on persistSessions, mfCommit,
// restoreCore and applyState. Calculate XP also marks dirty before/after.

// Backup/export compatibility: there is no new persistent v150 data.
// Schema v3 remains valid; the runtime cache is intentionally reconstructed.
const v150BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v150EnsureLiveXPCache();
  const payload=v150BuildFullBackupBase();
  if(payload?.streakXP){
    payload.streakXP.performanceModel='v150 cached aggregate; reconstructed from History on import';
  }
  if(payload?.backupManifest){
    payload.backupManifest.note='Complete MediaFlow backup. v150 XP performance caches are runtime-only and are rebuilt from imported History/Library/XP ledgers; no user data depends on the cache.';
  }
  return payload;
};



