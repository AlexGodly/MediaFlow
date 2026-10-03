/* MediaFlow v201 source fragment
 * Streak XP and Old System
 * Original HTML lines 18604-20201.
 * Build order matters; see scripts/build.mjs.
 */

/* ============================================================
   MediaFlow v149 — Day-Streak XP Multiplier
   ------------------------------------------------------------
   Rules:
   - streaks are built from genuine, non-skipped History activity days;
   - every History/log XP gain on that day is multiplied by that day's streak;
   - repeat XP is inside the session XP and is multiplied too;
   - logged-completion bonus XP also receives the streak multiplier;
   - Library maintenance / rating rewards remain their configured fixed rewards;
   - the multiplier grows continuously with streak length:
       1 + 0.10 * log2(streak)
     Day 1 = 1.00x, Day 2 = 1.10x, Day 7 ≈ 1.28x,
     Day 30 ≈ 1.49x, Day 100 ≈ 1.66x.
   ============================================================ */

const V149_STREAK_XP_VERSION=1;
let V149_STREAK_DIRTY=true;
let V149_STREAK_MAP=new Map();

function v149DateKeyFromSession(s){
  const raw=String(s?.date||'').trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw))return raw;
  const ts=Number(s?.timestamp)||0;
  if(ts>0){
    const d=new Date(ts);
    if(!Number.isNaN(d.getTime()))return d.toISOString().slice(0,10);
  }
  return '';
}

function v149ShiftDateKey(key,delta){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(key||'')))return '';
  const d=new Date(`${key}T12:00:00Z`);
  if(Number.isNaN(d.getTime()))return '';
  d.setUTCDate(d.getUTCDate()+Number(delta||0));
  return d.toISOString().slice(0,10);
}

function v149BuildStreakMap(sessions){
  const days=new Set();
  for(const s of (Array.isArray(sessions)?sessions:[])){
    if(!s||s.status==='skipped')continue;
    const key=v149DateKeyFromSession(s);
    if(key)days.add(key);
  }

  const map=new Map();
  for(const key of [...days].sort()){
    const prev=v149ShiftDateKey(key,-1);
    map.set(key,(map.get(prev)||0)+1);
  }
  return map;
}

function v149MarkStreakDirty(){
  V149_STREAK_DIRTY=true;
}

function v149StreakMultiplier(streak){
  if(levelingSettings().enabled===false)return 1;
  const n=Math.max(0,Math.floor(Number(streak)||0));
  if(n<=1)return 1;
  return Math.round((1+0.10*Math.log2(n))*100)/100;
}

const v149SessionStoredXPBase=sessionStoredXP;

function v149AnnotateSessionStreakXP(){
  V149_STREAK_MAP=v149BuildStreakMap(S.sessions||[]);

  for(const s of (S.sessions||[])){
    if(!s||typeof s!=='object')continue;

    if(s.status==='skipped'){
      s.streakAtLog=0;
      s.streakMultiplier=1;
      s.streakBaseXP=0;
      s.streakBonusXP=0;
      s.xpWithStreak=0;
      s.streakXPVersion=V149_STREAK_XP_VERSION;
      continue;
    }

    const key=v149DateKeyFromSession(s);
    const streak=key?(V149_STREAK_MAP.get(key)||1):1;
    const multiplier=v149StreakMultiplier(streak);
    const raw=Math.max(0,Math.round(Number(v149SessionStoredXPBase(s))||0));
    const total=Math.max(0,Math.round(raw*multiplier));

    s.streakAtLog=streak;
    s.streakMultiplier=multiplier;
    s.streakBaseXP=raw;
    s.streakBonusXP=Math.max(0,total-raw);
    s.xpWithStreak=total;
    s.streakXPVersion=V149_STREAK_XP_VERSION;
  }

  V149_STREAK_DIRTY=false;
  return V149_STREAK_MAP;
}

function v149EnsureStreakXP(){
  if(V149_STREAK_DIRTY)v149AnnotateSessionStreakXP();
  return V149_STREAK_MAP;
}

function v149StreakForDateKey(key){
  const map=v149EnsureStreakXP();
  return map.get(String(key||''))||0;
}

function v149ProspectiveTodayStreak(){
  const map=v149EnsureStreakXP();
  const today=todayISO();
  if(map.has(today))return map.get(today)||1;
  const yesterday=v149ShiftDateKey(today,-1);
  return (map.get(yesterday)||0)+1;
}

function v149SessionStreakLabel(s){
  v149EnsureStreakXP();
  const streak=Math.max(0,Number(s?.streakAtLog)||0);
  const mult=Math.max(1,Number(s?.streakMultiplier)||1);
  return `${streak}d ×${mult.toFixed(2)}`;
}

// Final History XP source of truth: base History XP + streak multiplier.
// The stored s.xp remains the pre-streak amount so old backups and existing
// repeat-XP reconstruction continue to work without double multiplication.
sessionStoredXP=function(s){
  if(!s||s.status==='skipped')return 0;
  v149EnsureStreakXP();
  if(Number.isFinite(Number(s.xpWithStreak)))return Math.max(0,Number(s.xpWithStreak));
  return Math.max(0,Number(v149SessionStoredXPBase(s))||0);
};

// Existing sidebar streak now shares the exact same historical day engine.
computeDayStreak=function(){
  return v149StreakForDateKey(todayISO());
};

// The log form previews the XP that will actually be worth after today's
// prospective streak is included.
const v149EstimateCurrentLogXPBase=estimateCurrentLogXP;
estimateCurrentLogXP=function(){
  const base=v149EstimateCurrentLogXPBase();
  const streak=v149ProspectiveTodayStreak();
  const streakMultiplier=v149StreakMultiplier(streak);
  return Object.assign({},base,{
    preStreakXP:Math.max(0,Number(base.xp)||0),
    streak,
    streakMultiplier,xp:Math.max(0,Math.round((Number(base.xp)||0)*streakMultiplier))
  });
};

function v149SessionRawXPTotal(sessions){
  return (Array.isArray(sessions)?sessions:[]).reduce((sum,s)=>{
    if(!s||s.status==='skipped')return sum;
    const stored=Number(s.xp);
    if(Number.isFinite(stored)&&stored>0)return sum+Math.max(0,stored);
    const cat=getCategory(s.categoryId);
    return sum+Math.max(0,Number(calculateConsumptionXP(
      cat,
      Number(s.actualAmount)||0,
      Number(s.minutes)||0,
      s.healthStatus||'healthy'
    ).xp)||0);
  },0);
}

function v149SessionStreakBonusForState(state){
  const sessions=Array.isArray(state?.sessions)?state.sessions:[];
  const map=v149BuildStreakMap(sessions);
  let bonus=0;

  for(const s of sessions){
    if(!s||s.status==='skipped')continue;
    const stored=Number(s.xp);
    let raw=0;
    if(Number.isFinite(stored)&&stored>0)raw=Math.max(0,stored);
    else{
      const cat=getCategory(s.categoryId);
      raw=Math.max(0,Number(calculateConsumptionXP(
        cat,
        Number(s.actualAmount)||0,
        Number(s.minutes)||0,
        s.healthStatus||'healthy'
      ).xp)||0);
    }

    const streak=map.get(v149DateKeyFromSession(s))||1;
    const total=Math.max(0,Math.round(raw*v149StreakMultiplier(streak)));
    bonus+=Math.max(0,total-raw);
  }

  return Math.round(bonus);
}

function v149CompletionDateKeyForState(item,state){
  const ts=Number(item?.completedAt)||0;
  if(ts>0){
    const d=new Date(ts);
    if(!Number.isNaN(d.getTime()))return d.toISOString().slice(0,10);
  }

  const id=String(item?.id||'');
  if(!id)return '';

  let best='';
  let bestTs=0;
  for(const s of (state?.sessions||[])){
    if(!s||s.status==='skipped')continue;
    if(!(s.titles||[]).some(t=>String(t?.libraryId||'')===id))continue;
    const st=Number(s.timestamp)||0;
    if(st>=bestTs){
      bestTs=st;
      best=v149DateKeyFromSession(s);
    }
  }
  return best;
}

function v149LoggedCompletionStreakBonusForState(state){
  const ledger=state?.xpLedger?.logCompletions||{};
  const library=Array.isArray(state?.library)?state.library:[];
  const map=v149BuildStreakMap(state?.sessions||[]);
  const byId=new Map(library.filter(i=>i?.id).map(i=>[String(i.id),i]));
  let bonus=0;

  for(const [id,value] of Object.entries(ledger)){
    const raw=Math.max(0,Number(value)||0);
    if(raw<=0)continue;
    const item=byId.get(String(id));
    if(!item)continue;
    const key=v149CompletionDateKeyForState(item,state);
    const streak=map.get(key)||0;
    const mult=v149StreakMultiplier(streak);
    bonus+=Math.max(0,Math.round(raw*mult)-raw);
  }

  return Math.round(bonus);
}

function v149LoggedCompletionStreakBonus(){
  return v149LoggedCompletionStreakBonusForState({
    sessions:S.sessions||[],
    library:S.library||[],
    xpLedger:S.xpLedger||{}
  });
}

// Logged-completion bonus is XP earned through a genuine consumption log, so it
// participates in the same day-streak multiplier.
const v149LibraryXPTotalBase=libraryXPTotal;
libraryXPTotal=function(){
  return v149LibraryXPTotalBase()+v149LoggedCompletionStreakBonus();
};

// Keep Library History before/after XP deltas accurate with the new multiplier.
const v149SnapshotXPBase=v50SnapshotXP;
v50SnapshotXP=function(x){
  const base=v149SnapshotXPBase(x);
  if(base==null)return base;
  return base
    +v149SessionStreakBonusForState(x||{})
    +v149LoggedCompletionStreakBonusForState(x||{});
};

// Progression breakdown/export now describes the streak contribution explicitly.
const v149XPBreakdownBase=v120XPBreakdown;
v120XPBreakdown=function(){
  const b=v149XPBreakdownBase();
  const rawHistoryXP=Math.round(v149SessionRawXPTotal(S.sessions||[]));
  const streakedHistoryXP=Math.round((S.sessions||[]).reduce((a,s)=>a+sessionStoredXP(s),0));
  const sessionStreakBonusXP=Math.max(0,streakedHistoryXP-rawHistoryXP);
  const loggedCompletionStreakBonusXP=v149LoggedCompletionStreakBonus();
  const streakBonusXP=sessionStreakBonusXP+loggedCompletionStreakBonusXP;

  return Object.assign({},b,{
    total:(Number(b.total)||0)+loggedCompletionStreakBonusXP,
    historyXP:streakedHistoryXP,
    preStreakHistoryXP:rawHistoryXP,
    sessionStreakBonusXP,
    loggedCompletionStreakBonusXP,
    streakBonusXP,
    currentDayStreak:computeDayStreak(),
    currentStreakMultiplier:v149StreakMultiplier(computeDayStreak()),
    prospectiveTodayStreak:v149ProspectiveTodayStreak(),
    prospectiveTodayMultiplier:v149StreakMultiplier(v149ProspectiveTodayStreak()),
    streakXPFormulaVersion:V149_STREAK_XP_VERSION
  });
};

// Mark streak annotations dirty whenever History can change.
const v149PersistSessionsBase=persistSessions;
persistSessions=function(){
  v149MarkStreakDirty();
  return v149PersistSessionsBase.apply(this,arguments);
};

const v149MfCommitBase=mfCommit;
mfCommit=function(){
  v149MarkStreakDirty();
  return v149MfCommitBase.apply(this,arguments);
};

const v149RestoreCoreBase=mfRestoreCore;
mfRestoreCore=function(){
  const result=v149RestoreCoreBase.apply(this,arguments);
  v149MarkStreakDirty();
  return result;
};

const v149ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v149ApplyStateBase.apply(this,arguments);
  v149MarkStreakDirty();
  return result;
};

// v134 is the final optimized progression repair engine. Mark the streak cache
// dirty before it rewrites base/repeat session XP so its final mediaFlowLevelInfo()
// uses freshly rebuilt streak totals.
const v149RecalculateXPOptimizedBase=v134RecalculateXPOptimized;
v134RecalculateXPOptimized=async function(){
  v149MarkStreakDirty();
  const result=await v149RecalculateXPOptimizedBase.apply(this,arguments);
  v149MarkStreakDirty();
  v149EnsureStreakXP();
  return mediaFlowLevelInfo();
};
v46RecalculateXP=v134RecalculateXPOptimized;

// v149 Settings panel.
const v149RenderSettingsBase=renderSettings;
renderSettings=function(){
  v149EnsureStreakXP();
  let h=v149RenderSettingsBase();

  const current=computeDayStreak();
  const prospective=v149ProspectiveTodayStreak();
  const currentMult=v149StreakMultiplier(current);
  const nextMult=v149StreakMultiplier(prospective);
  const b=v120XPBreakdown();

  const marker='<div style="font-weight:700;font-size:12px;margin:14px 0 8px;">ROTATION XP MULTIPLIERS</div>';
  const card=`<div style="font-weight:700;font-size:12px;margin:14px 0 8px;">DAY-STREAK XP</div>
    <div class="v149-streak-xp-card">
      <div class="v149-streak-xp-head">
        <div><b>Higher streak → higher daily log XP</b><div class="hint" style="margin-top:3px">Your genuine non-skipped History days build the multiplier.</div></div>
        <div class="v149-streak-xp-mult">×${(current>0?currentMult:nextMult).toFixed(2)}</div>
      </div>
      <div class="v149-streak-xp-grid">
        <div><b>${current.toLocaleString()} day${current===1?'':'s'}</b><small>current streak</small></div>
        <div><b>${prospective.toLocaleString()} day${prospective===1?'':'s'} · ×${nextMult.toFixed(2)}</b><small>your next log today</small></div>
        <div><b>+${Math.round(b.streakBonusXP||0).toLocaleString()} XP</b><small>lifetime streak bonus</small></div>
      </div>
      <div class="v149-streak-xp-note">Formula: <b>1 + 0.10 × log₂(streak)</b>. Day 1 = ×1.00, Day 2 = ×1.10, Day 7 ≈ ×1.28, Day 30 ≈ ×1.49. The multiplier applies to consumption/History XP, repeat XP and logged-completion bonus XP. Fixed Library maintenance and Rating XP keep their configured values.</div>
    </div>`;

  if(h.includes(marker) && !h.includes('DAY-STREAK XP')){
    h=h.replace(marker,card+marker);
  }

  h=h.replace('Full Backup:','Full Backup:');
  h=h.replace(
    'XP ledgers, completion timeline, Library History, profile data, stopwatch, MAL link, Personal Order + recovery state and the saved Rating Queue.',
    'XP ledgers, day-streak XP metadata, completion timeline, Library History, profile data, stopwatch, MAL link, Personal Order + recovery state and the saved Rating Queue.'
  );

  return h;
};

// ------------------------------------------------------------
// v149 Full Backup / Import compatibility audit
// ------------------------------------------------------------

const v149BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v149BackupManifestBase(state,extras);
  manifest.schemaVersion=3;
  manifest.includes=Object.assign({},manifest.includes||{},{
    streakXP:true,
    streakSessionMetadata:true
  });

  const sessions=Array.isArray(state?.sessions)?state.sessions:[];
  const streakMap=v149BuildStreakMap(sessions);
  const maxStreak=streakMap.size?Math.max(...streakMap.values()):0;
  manifest.counts=Object.assign({},manifest.counts||{},{
    activeStreakDays:streakMap.size,
    longestReconstructedStreak:maxStreak
  });

  manifest.note='Complete MediaFlow v149 backup. Day-streak XP is reconstructable from History dates and also exports per-session streak metadata. Browser authentication credentials and filesystem permission handles are intentionally non-portable.';
  return manifest;
};

const v149BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  // Ensure exported sessions contain current streak/multiplier/bonus metadata.
  v149MarkStreakDirty();
  v149EnsureStreakXP();

  const payload=v149BuildFullBackupBase();
  payload.backupSchemaVersion=3;
  payload.backupVersion=v148CurrentVersion();
  payload.mediaFlowVersion=v148CurrentVersion();
  payload.streakXP={
    version:V149_STREAK_XP_VERSION,
    formula:'1 + 0.10 * log2(streak)',
    appliesTo:[
      'consumption History XP',
      'repeat XP',
      'logged-completion bonus XP'
    ],
    breakdown:v120XPBreakdown()
  };
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  return payload;
};

// v148 import already validates the canonical state, applies it through the full
// state wrapper chain and calls v46RecalculateXP(). Because v149 redirects that
// recalculation engine above, v148/v149/older backups automatically reconstruct
// streak XP from imported History. No separate fragile import path is needed.


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


/* ============================================================
   MediaFlow v152 — Automatic Backup = Full Backup
   ------------------------------------------------------------
   Before v152, automatic folder backups still serialized snapshot()
   directly. That covered the core account state but skipped newer
   portable extras introduced by the modern Full Backup pipeline,
   such as the saved Rating Queue and portable UI preferences.

   v152 routes BOTH scheduled automatic backups and the manual
   "Save backup now" folder backup through the FINAL full-backup
   builder chain (v148 -> v149 -> v150), so folder backups and the
   normal Export JSON backup now carry the same complete data model.
   ============================================================ */

backupSnapshot=function(){
  // v148BuildFullBackup is intentionally resolved at call time.
  // At this point it is the FINAL wrapped builder, including:
  // - v148 complete-data backup + Rating Queue / portable UI prefs
  // - v149 streak-XP schema/metadata
  // - v150 performance-model compatibility metadata
  return v148BuildFullBackup();
};


/* ============================================================
   MediaFlow v153 — Old System
   ------------------------------------------------------------
   Separate from MediaFlow's scheduler/recommendation engine.

   SYSTEM:
   - choose existing MediaFlow categories that participate;
   - define directional conversion rules;
   - consume units manually and maintain an independent balance ledger.

   VIEW:
   - read-only simulation of the same rules over actual MediaFlow History;
   - never modifies MediaFlow History, Library, recommendations or progress.

   STATS:
   - exact all-time consumed units from genuine non-skipped MediaFlow History.

   Old System data is persistent account data and participates in cloud state,
   Full Backup, Automatic Backup, import/restore and cloud merge.
   ============================================================ */

const V153_OLD_SYSTEM_DEFAULT={
  enabledCategoryIds:[],
  rules:[],
  balances:{},
  transactions:[],
  mode:'system',
  modifiedAt:0
};

S.oldSystem=S.oldSystem||JSON.parse(JSON.stringify(V153_OLD_SYSTEM_DEFAULT));
S.oldSystemUI=S.oldSystemUI||{consumeCategoryId:'',consumeAmount:1};

let V153_HISTORY_CACHE_DIRTY=true;
let V153_HISTORY_CACHE=null;

function v153Clone(value,fallback){
  try{return JSON.parse(JSON.stringify(value));}
  catch(_){return fallback;}
}

function v153CurrentCategoryIds(){
  return new Set((S.categories||[]).filter(c=>c?.id).map(c=>String(c.id)));
}

function v153NormalizeOldSystem(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  const existing=v153CurrentCategoryIds();

  const enabled=[...new Set(
    (Array.isArray(src.enabledCategoryIds)?src.enabledCategoryIds:[])
      .map(String)
      .filter(id=>existing.has(id))
  )];

  const balances={};
  if(src.balances&&typeof src.balances==='object'){
    for(const [id,value] of Object.entries(src.balances)){
      const n=Number(value);
      if(Number.isFinite(n))balances[String(id)]=n;
    }
  }

  const rules=(Array.isArray(src.rules)?src.rules:[])
    .filter(r=>r&&typeof r==='object')
    .map(r=>({
      id:String(r.id||uid()),
      fromCategoryId:String(r.fromCategoryId||''),
      toCategoryId:String(r.toCategoryId||''),
      fromAmount:Math.max(0.000001,Number(r.fromAmount)||1),
      toAmount:Math.max(0.000001,Number(r.toAmount)||1),
      createdAt:Number(r.createdAt)||Date.now()
    }))
    .filter(r=>r.fromCategoryId&&r.toCategoryId&&r.fromCategoryId!==r.toCategoryId);

  const transactions=(Array.isArray(src.transactions)?src.transactions:[])
    .filter(t=>t&&typeof t==='object')
    .map(t=>({
      id:String(t.id||uid()),
      timestamp:Number(t.timestamp)||Date.now(),
      type:String(t.type||'consume'),
      categoryId:String(t.categoryId||''),
      amount:Number(t.amount)||0,
      label:String(t.label||''),
      deltas:Array.isArray(t.deltas)
        ? t.deltas
            .filter(d=>d&&d.categoryId&&Number.isFinite(Number(d.delta)))
            .map(d=>({categoryId:String(d.categoryId),delta:Number(d.delta)}))
        : []
    }));

  return {
    enabledCategoryIds:enabled,
    rules,
    balances,
    transactions,
    mode:['system','view','stats'].includes(src.mode)?src.mode:'system',
    modifiedAt:Number(src.modifiedAt)||0
  };
}

function v153EnsureOldSystem(){
  S.oldSystem=v153NormalizeOldSystem(S.oldSystem);
  if(!S.oldSystemUI||typeof S.oldSystemUI!=='object'){
    S.oldSystemUI={consumeCategoryId:'',consumeAmount:1};
  }

  if(!S.oldSystem.enabledCategoryIds.includes(String(S.oldSystemUI.consumeCategoryId||''))){
    S.oldSystemUI.consumeCategoryId=S.oldSystem.enabledCategoryIds[0]||'';
  }
  if(!(Number(S.oldSystemUI.consumeAmount)>0))S.oldSystemUI.consumeAmount=1;

  return S.oldSystem;
}

function v153TouchOldSystem(save=true){
  const os=v153EnsureOldSystem();
  os.modifiedAt=Date.now();
  V153_HISTORY_CACHE_DIRTY=true;
  if(save)saveState();
}

function v153FmtQty(value){
  const n=Number(value)||0;
  if(Math.abs(n)<0.0000001)return '0';
  return n.toLocaleString(undefined,{maximumFractionDigits:3});
}

function v153CategoryName(id){
  return getCategory(id)?.name||'(removed category)';
}

function v153CategoryUnit(id,amount=2){
  const cat=getCategory(id);
  return unitLabel(cat.unit,Number(amount)===1?1:2);
}

function v153CategoryIcon(cat){
  try{return v144CategoryIconHtml(cat);}
  catch(_){return `<span>${escapeHtml(cat?.icon||'📦')}</span>`;}
}

function v153EnabledCategories(){
  const os=v153EnsureOldSystem();
  const set=new Set(os.enabledCategoryIds);
  return (S.categories||[]).filter(c=>c?.id&&set.has(String(c.id)));
}

function v153ActiveRules(){
  const os=v153EnsureOldSystem();
  const enabled=new Set(os.enabledCategoryIds);
  return os.rules.filter(r=>
    enabled.has(String(r.fromCategoryId))&&
    enabled.has(String(r.toCategoryId))&&
    r.fromCategoryId!==r.toCategoryId
  );
}

function v153RulesForConsumedCategory(categoryId){
  const id=String(categoryId||'');
  return v153ActiveRules().filter(r=>String(r.toCategoryId)===id);
}

function v153RuleSentence(r){
  const from=getCategory(r.fromCategoryId),to=getCategory(r.toCategoryId);
  return `Consume ${v153FmtQty(r.toAmount)} ${escapeHtml(unitLabel(to.unit,r.toAmount))} of ${escapeHtml(to.name)} → subtract ${v153FmtQty(r.fromAmount)} ${escapeHtml(unitLabel(from.unit,r.fromAmount))} from ${escapeHtml(from.name)}.`;
}

function v153HistoryRows(){
  const existing=v153CurrentCategoryIds();
  return (S.sessions||[])
    .filter(s=>
      s&&
      s.status!=='skipped'&&
      (Number(s.actualAmount)||0)>0&&
      s.categoryId&&
      existing.has(String(s.categoryId))
    )
    .slice()
    .sort((a,b)=>(Number(a.timestamp)||0)-(Number(b.timestamp)||0));
}

function v153BuildHistoryCache(){
  const os=v153EnsureOldSystem();
  const enabled=new Set(os.enabledCategoryIds);
  const rules=v153ActiveRules();

  const rawTotals=new Map();
  const sessionCounts=new Map();
  const minuteTotals=new Map();
  const simulatedBalances=new Map();
  const simulatedSpent=new Map();

  for(const id of os.enabledCategoryIds)simulatedBalances.set(id,0);

  const rows=v153HistoryRows();

  for(const s of rows){
    const id=String(s.categoryId||'');
    const amount=Math.max(0,Number(s.actualAmount)||0);
    const minutes=Math.max(0,Number(s.minutes)||0);

    rawTotals.set(id,(rawTotals.get(id)||0)+amount);
    sessionCounts.set(id,(sessionCounts.get(id)||0)+1);
    minuteTotals.set(id,(minuteTotals.get(id)||0)+minutes);

    if(!enabled.has(id))continue;

    simulatedBalances.set(id,(simulatedBalances.get(id)||0)+amount);

    for(const r of rules){
      if(String(r.toCategoryId)!==id)continue;
      const cost=amount*(Number(r.fromAmount)||1)/(Number(r.toAmount)||1);
      const fromId=String(r.fromCategoryId);
      simulatedBalances.set(fromId,(simulatedBalances.get(fromId)||0)-cost);
      simulatedSpent.set(fromId,(simulatedSpent.get(fromId)||0)+cost);
    }
  }

  V153_HISTORY_CACHE={
    rawTotals,sessionCounts,minuteTotals,simulatedBalances,simulatedSpent,
    activityRows:rows.length,
    builtAt:Date.now(),
    oldSystemModifiedAt:Number(os.modifiedAt)||0
  };
  V153_HISTORY_CACHE_DIRTY=false;
  return V153_HISTORY_CACHE;
}

function v153HistoryCache(){
  const os=v153EnsureOldSystem();
  if(
    V153_HISTORY_CACHE_DIRTY||
    !V153_HISTORY_CACHE||
    V153_HISTORY_CACHE.oldSystemModifiedAt!==(Number(os.modifiedAt)||0)
  ){
    return v153BuildHistoryCache();
  }
  return V153_HISTORY_CACHE;
}

function v153SystemBalanceCard(cat,balance,extra=''){
  const n=Number(balance)||0;
  const cls=n<0?'v153-os-negative':(n>0?'v153-os-positive':'');
  return `<div class="v153-os-balance">
    <div class="v153-os-balance-head">
      <div class="v153-os-icon">${v153CategoryIcon(cat)}</div>
      <div style="min-width:0">
        <div class="v153-os-balance-name">${escapeHtml(cat.name)}</div>
        <div class="v153-os-unit">${escapeHtml(unitLabel(cat.unit,2))} · ${v153FmtQty(cat.minutesPerUnit||0)}m per unit</div>
      </div>
    </div>
    <div class="v153-os-number ${cls}">${v153FmtQty(n)}</div>
    <div class="v153-os-unit">${escapeHtml(unitLabel(cat.unit,n))} balance</div>
    ${extra}
  </div>`;
}

function v153RenderModeTabs(){
  const mode=v153EnsureOldSystem().mode;
  return `<div class="v153-os-tabs">
    <button class="v153-os-tab ${mode==='system'?'active':''}" onclick="App.v153SetOldSystemMode('system')">System</button>
    <button class="v153-os-tab ${mode==='view'?'active':''}" onclick="App.v153SetOldSystemMode('view')">View</button>
    <button class="v153-os-tab ${mode==='stats'?'active':''}" onclick="App.v153SetOldSystemMode('stats')">Stats</button>
  </div>`;
}

function v153RenderCategoryConfiguration(){
  const os=v153EnsureOldSystem();
  const enabled=new Set(os.enabledCategoryIds);
  const rows=(S.categories||[]).map(cat=>`
    <label class="v153-os-category-toggle">
      <input type="checkbox" ${enabled.has(String(cat.id))?'checked':''}
        onchange="App.v153ToggleOldSystemCategory('${String(cat.id).replace(/'/g,"\\'")}')">
      <div class="v153-os-icon">${v153CategoryIcon(cat)}</div>
      <div style="min-width:0">
        <b style="font-size:10.5px">${escapeHtml(cat.name)}</b>
        <small>${escapeHtml(unitLabel(cat.unit,2))} · ${v153FmtQty(cat.minutesPerUnit||0)}m/unit</small>
      </div>
    </label>`).join('');

  return `<div class="v153-os-card">
    <div class="v153-os-card-title">Categories in Old System</div>
    <div class="v153-os-card-sub">Choose which existing MediaFlow categories participate. This does not change whether a category is enabled in the normal MediaFlow scheduler.</div>
    <div class="v153-os-category-list">${rows||'<div class="v153-os-empty">No MediaFlow categories available.</div>'}</div>
  </div>`;
}

function v153RenderRules(){
  const os=v153EnsureOldSystem();
  const enabled=v153EnabledCategories();
  const enabledSet=new Set(enabled.map(c=>String(c.id)));
  const rules=os.rules.filter(r=>enabledSet.has(String(r.fromCategoryId))&&enabledSet.has(String(r.toCategoryId)));

  const options=(selected)=>enabled.map(c=>
    `<option value="${escapeHtml(String(c.id))}" ${String(c.id)===String(selected)?'selected':''}>${escapeHtml(c.name)}</option>`
  ).join('');

  const html=rules.map(r=>`
    <div class="v153-os-rule">
      <div>
        <label>Subtract from</label>
        <select onchange="App.v153UpdateOldSystemRule('${escapeHtml(r.id)}','fromCategoryId',this.value)">${options(r.fromCategoryId)}</select>
      </div>
      <div>
        <label>Units</label>
        <input type="number" min="0.001" step="0.001" value="${Number(r.fromAmount)||1}"
          onchange="App.v153UpdateOldSystemRule('${escapeHtml(r.id)}','fromAmount',this.value)">
      </div>
      <div class="v153-os-rule-arrow">→</div>
      <div>
        <label>When consuming</label>
        <select onchange="App.v153UpdateOldSystemRule('${escapeHtml(r.id)}','toCategoryId',this.value)">${options(r.toCategoryId)}</select>
      </div>
      <div>
        <label>Units</label>
        <input type="number" min="0.001" step="0.001" value="${Number(r.toAmount)||1}"
          onchange="App.v153UpdateOldSystemRule('${escapeHtml(r.id)}','toAmount',this.value)">
      </div>
      <button class="btn btn-ghost" onclick="App.v153RemoveOldSystemRule('${escapeHtml(r.id)}')">Remove</button>
    </div>
    <div class="v153-os-rule-text">${v153RuleSentence(r)}</div>
  `).join('');

  return `<div class="v153-os-card">
    <div class="v153-os-card-title">Conversion Rules</div>
    <div class="v153-os-card-sub">Rules are directional. Example: 4 Manga chapters → 2 Seasonal Anime episodes means consuming 2 Seasonal Anime subtracts 4 from Manga and adds 2 to Seasonal Anime.</div>
    ${html||'<div class="v153-os-empty">No conversion rules yet. Add at least two categories, then create a rule.</div>'}
    <button class="btn" onclick="App.v153AddOldSystemRule()" ${enabled.length<2?'disabled':''}>+ Add conversion rule</button>
  </div>`;
}

function v153ConsumptionPreview(categoryId,amount){
  const id=String(categoryId||'');
  const qty=Math.max(0,Number(amount)||0);
  if(!id||qty<=0)return 'Enter an amount to preview the balance changes.';

  const rules=v153RulesForConsumedCategory(id);
  const cat=getCategory(id);
  const parts=[`+${v153FmtQty(qty)} ${escapeHtml(unitLabel(cat.unit,qty))} to ${escapeHtml(cat.name)}`];

  for(const r of rules){
    const cost=qty*(Number(r.fromAmount)||1)/(Number(r.toAmount)||1);
    const from=getCategory(r.fromCategoryId);
    parts.push(`−${v153FmtQty(cost)} ${escapeHtml(unitLabel(from.unit,cost))} from ${escapeHtml(from.name)}`);
  }

  return parts.join(' · ');
}

function v153RenderSystemMode(){
  const os=v153EnsureOldSystem();
  const enabled=v153EnabledCategories();

  const balances=enabled.length
    ? `<div class="v153-os-grid" style="margin-bottom:14px">${enabled.map(cat=>
        v153SystemBalanceCard(
          cat,
          os.balances[String(cat.id)]||0,
          `<div class="v153-os-adjust">
            <div><label>Set current balance</label><input type="number" step="0.001" id="v153-balance-${escapeHtml(String(cat.id))}" value="${Number(os.balances[String(cat.id)]||0)}"></div>
            <button class="btn btn-ghost" onclick="App.v153SetOldSystemBalance('${String(cat.id).replace(/'/g,"\\'")}')">Set</button>
          </div>`
        )).join('')}</div>`
    : '';

  const selected=enabled.some(c=>String(c.id)===String(S.oldSystemUI.consumeCategoryId))? String(S.oldSystemUI.consumeCategoryId)
    : String(enabled[0]?.id||'');

  S.oldSystemUI.consumeCategoryId=selected;

  const useCard=enabled.length?`<div class="v153-os-card">
    <div class="v153-os-card-title">Use Old System</div>
    <div class="v153-os-card-sub">Record consumption only inside the Old System ledger. This does not create MediaFlow History, change Library progress, or affect recommendations.</div>
    <div class="v153-os-use">
      <div>
        <label>Consumed category</label>
        <select onchange="App.v153SetOldSystemUseCategory(this.value)">
          ${enabled.map(c=>`<option value="${escapeHtml(String(c.id))}" ${String(c.id)===selected?'selected':''}>${escapeHtml(c.name)}</option>`).join('')}
        </select>
      </div>
      <div>
        <label>Amount</label>
        <input type="number" min="0.001" step="0.001" value="${Number(S.oldSystemUI.consumeAmount)||1}" oninput="App.v153SetOldSystemUseAmount(this.value,false)" onchange="App.v153SetOldSystemUseAmount(this.value,true)">
      </div>
      <button class="btn btn-primary" onclick="App.v153ApplyOldSystemConsumption()">Apply consumption</button>
    </div>
    <div class="v153-os-preview" id="v153-old-system-preview">${v153ConsumptionPreview(selected,S.oldSystemUI.consumeAmount)}</div>
  </div>`:'';

  const existingCategoryIds=v153CurrentCategoryIds();
  const recent=os.transactions
    .filter(t=>!t.categoryId||existingCategoryIds.has(String(t.categoryId)))
    .slice(-12)
    .reverse();
  const activity=recent.length?`<div class="v153-os-card">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:11px">
      <div>
        <div class="v153-os-card-title" style="margin:0">Recent Old System Activity</div>
        <div class="v153-os-muted">Independent from MediaFlow History.</div>
      </div>
      <button class="btn btn-ghost" onclick="App.v153UndoOldSystem()" ${os.transactions.length?'':'disabled'}>Undo last</button>
    </div>
    <div class="v153-os-activity">
      ${recent.map(t=>`<div class="v153-os-activity-row">
        <div><b>${escapeHtml(t.label||'Old System change')}</b><div class="v153-os-muted">${new Date(Number(t.timestamp)||0).toLocaleString()}</div></div>
        <div style="text-align:right">${(t.deltas||[]).filter(d=>v153CurrentCategoryIds().has(String(d.categoryId||''))).map(d=>{
          const c=getCategory(d.categoryId),n=Number(d.delta)||0;
          return `<div class="${n<0?'v153-os-negative':'v153-os-positive'}">${n>=0?'+':''}${v153FmtQty(n)} ${escapeHtml(unitLabel(c.unit,n))}</div>`;
        }).join('')}</div>
      </div>`).join('')}
    </div>
  </div>`:'';

  return `
    ${enabled.length?`<div class="section-label">CURRENT OLD SYSTEM BALANCES</div>${balances}`:
      '<div class="v153-os-empty" style="margin-bottom:14px">Add categories below to start building your Old System.</div>'}
    ${useCard}
    ${v153RenderCategoryConfiguration()}
    ${v153RenderRules()}
    ${activity}
  `;
}

function v153RenderViewMode(){
  const os=v153EnsureOldSystem();
  const enabled=v153EnabledCategories();
  if(!enabled.length){
    return `<div class="v153-os-empty">No categories are configured for the Old System yet. Open <b>System</b> and add the categories you want to simulate.</div>`;
  }

  const cache=v153HistoryCache();
  const cards=enabled.map(cat=>{
    const id=String(cat.id);
    const balance=cache.simulatedBalances.get(id)||0;
    const consumed=cache.rawTotals.get(id)||0;
    const spent=cache.simulatedSpent.get(id)||0;
    const extra=`<div class="v153-os-stat-line"><span>MediaFlow consumed</span><b>${v153FmtQty(consumed)}</b></div>
      <div class="v153-os-stat-line"><span>Spent as source</span><b>${v153FmtQty(spent)}</b></div>`;
    return v153SystemBalanceCard(cat,balance,extra);
  }).join('');

  const rules=v153ActiveRules();
  return `<div class="v153-os-card">
      <div class="v153-os-card-title">Read-only Old System Simulation</div>
      <div class="v153-os-card-sub">This replays your genuine non-skipped MediaFlow History from oldest to newest using your Old System conversion rules. Nothing is written back to MediaFlow.</div>
      <div class="v153-os-muted">${cache.activityRows.toLocaleString()} consumption record${cache.activityRows===1?'':'s'} analyzed.</div>
      ${rules.length?`<div class="v153-os-rule-summary">${rules.map(r=>`<span class="v153-os-rule-pill">${v153RuleSentence(r)}</span>`).join('')}</div>`:''}
    </div>
    <div class="section-label">IF YOU HAD USED THE OLD SYSTEM</div>
    <div class="v153-os-grid">${cards}</div>`;
}

function v153AllStatCategories(cache){
  // v154: only show categories that currently exist in MediaFlow.
  // Historical sessions from deleted categories remain in normal History data,
  // but they are intentionally hidden from the Old System tab.
  return (S.categories||[]).filter(c=>c?.id);
}

function v153RenderStatsMode(){
  const cache=v153HistoryCache();
  const cats=v153AllStatCategories(cache);

  const cards=cats.map(cat=>{
    const id=String(cat.id);
    const total=cache.rawTotals.get(id)||0;
    const sessions=cache.sessionCounts.get(id)||0;
    const minutes=cache.minuteTotals.get(id)||0;
    return `<div class="v153-os-balance">
      <div class="v153-os-balance-head">
        <div class="v153-os-icon">${v153CategoryIcon(cat)}</div>
        <div style="min-width:0">
          <div class="v153-os-balance-name">${escapeHtml(cat.name)}</div>
          <div class="v153-os-unit">${escapeHtml(unitLabel(cat.unit,2))}</div>
        </div>
      </div>
      <div class="v153-os-number">${v153FmtQty(total)}</div>
      <div class="v153-os-unit">${escapeHtml(unitLabel(cat.unit,total))} consumed</div>
      <div class="v153-os-stat-line"><span>History records</span><b>${sessions.toLocaleString()}</b></div>
      <div class="v153-os-stat-line"><span>Logged time</span><b>${escapeHtml(fmtMinutes(minutes))}</b></div>
    </div>`;
  }).join('');

  return `<div class="v153-os-card">
      <div class="v153-os-card-title">Exact MediaFlow Consumption</div>
      <div class="v153-os-card-sub">All-time genuine non-skipped MediaFlow History, grouped by category. No Old System conversion is applied here.</div>
    </div>
    <div class="v153-os-grid">${cards||'<div class="v153-os-empty">No consumption History yet.</div>'}</div>`;
}

function renderOldSystem(){
  // v154: normalize against current MediaFlow categories on every Old System render.
  // Deleted categories are dropped from enabled lists/rules immediately.
  const os=v153EnsureOldSystem();
  let body='';
  if(os.mode==='view')body=v153RenderViewMode();
  else if(os.mode==='stats')body=v153RenderStatsMode();
  else body=v153RenderSystemMode();

  return `<div class="v153-old-system">
    <div class="v153-os-head">
      <div>
        <div class="section-label">OLD SYSTEM</div>
        <h1 style="margin:4px 0 7px">Old System</h1>
        <div class="v153-os-sub">Your original category-conversion system, kept completely separate from MediaFlow's main scheduler. Use it directly, simulate it from MediaFlow History, or inspect exact category consumption.</div>
      </div>
    </div>
    ${v153RenderModeTabs()}
    ${body}
  </div>`;
}

// ---- Navigation ------------------------------------------------------------
ICONS.oldsystem=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h11l-3-3"/><path d="m18 7-3 3"/><path d="M17 17H6l3 3"/><path d="m6 17 3-3"/></svg>`;

if(!NAV_ITEMS.some(n=>n.id==='oldsystem')){
  const orderIndex=NAV_ITEMS.findIndex(n=>n.id==='order');
  const statsIndex=NAV_ITEMS.findIndex(n=>n.id==='stats');
  const at=orderIndex>=0?orderIndex+1:(statsIndex>=0?statsIndex:Math.max(0,NAV_ITEMS.length-2));
  NAV_ITEMS.splice(at,0,{id:'oldsystem',label:'Old System'});
}
if(!MOBILE_MORE_NAV.includes('oldsystem')){
  const oi=MOBILE_MORE_NAV.indexOf('order');
  MOBILE_MORE_NAV.splice(oi>=0?oi+1:0,0,'oldsystem');
}

const v153RenderViewBase=renderView;
renderView=function(){
  if(S.view==='oldsystem'){
    const root=document.getElementById('view-root');
    if(!root)return;
    root.innerHTML=`<div class="fade-in">${renderOldSystem()}</div>`;
    return;
  }
  return v153RenderViewBase();
};

// ---- Actions ---------------------------------------------------------------
function v153SetMode(mode){
  const os=v153EnsureOldSystem();
  if(!['system','view','stats'].includes(mode))return;
  os.mode=mode;
  os.modifiedAt=Date.now();
  saveState();
  render();
}

function v153ToggleCategory(id){
  const os=v153EnsureOldSystem();
  id=String(id||'');
  if(!id||!v153CurrentCategoryIds().has(id))return;

  const set=new Set(os.enabledCategoryIds);
  if(set.has(id))set.delete(id);
  else set.add(id);

  os.enabledCategoryIds=(S.categories||[])
    .map(c=>String(c.id))
    .filter(cid=>set.has(cid));

  if(!Object.prototype.hasOwnProperty.call(os.balances,id))os.balances[id]=0;
  if(!os.enabledCategoryIds.includes(String(S.oldSystemUI.consumeCategoryId||''))){
    S.oldSystemUI.consumeCategoryId=os.enabledCategoryIds[0]||'';
  }

  v153TouchOldSystem();
  render();
}

function v153AddRule(){
  const os=v153EnsureOldSystem();
  const ids=os.enabledCategoryIds.slice();
  if(ids.length<2){showToast('Add at least two categories first.');return;}

  os.rules.push({
    id:uid(),
    fromCategoryId:ids[0],
    toCategoryId:ids[1],
    fromAmount:1,
    toAmount:1,
    createdAt:Date.now()
  });
  v153TouchOldSystem();
  render();
}

function v153UpdateRule(id,key,value){
  const os=v153EnsureOldSystem();
  const r=os.rules.find(x=>String(x.id)===String(id));
  if(!r)return;

  if(key==='fromAmount'||key==='toAmount'){
    const n=Number(value);
    if(!(n>0)){showToast('Conversion amount must be greater than 0.');render();return;}
    r[key]=n;
  }else if(key==='fromCategoryId'||key==='toCategoryId'){
    const cid=String(value||'');
    if(!os.enabledCategoryIds.includes(cid))return;
    const other=key==='fromCategoryId'?String(r.toCategoryId):String(r.fromCategoryId);
    if(cid===other){showToast('A category cannot subtract from itself.');render();return;}
    r[key]=cid;
  }else return;

  v153TouchOldSystem();
  render();
}

function v153RemoveRule(id){
  const os=v153EnsureOldSystem();
  os.rules=os.rules.filter(r=>String(r.id)!==String(id));
  v153TouchOldSystem();
  render();
}

function v153SetBalance(catId){
  const os=v153EnsureOldSystem();
  const id=String(catId||'');
  if(!os.enabledCategoryIds.includes(id))return;

  const el=document.getElementById(`v153-balance-${id}`);
  const value=Number(el?.value);
  if(!Number.isFinite(value)){showToast('Enter a valid balance.');return;}

  const before=Number(os.balances[id])||0;
  const delta=value-before;
  if(Math.abs(delta)<0.0000001)return;

  os.balances[id]=value;
  os.transactions.push({
    id:uid(),timestamp:Date.now(),type:'adjustment',categoryId:id,amount:value,
    label:`Set ${v153CategoryName(id)} balance to ${v153FmtQty(value)}`,
    deltas:[{categoryId:id,delta}]
  });

  v153TouchOldSystem();
  render();
}

function v153SetUseCategory(id){
  const os=v153EnsureOldSystem();
  id=String(id||'');
  if(!os.enabledCategoryIds.includes(id))return;
  S.oldSystemUI.consumeCategoryId=id;
  const preview=document.getElementById('v153-old-system-preview');
  if(preview)preview.innerHTML=v153ConsumptionPreview(id,S.oldSystemUI.consumeAmount);
}

function v153SetUseAmount(value,rerender=false){
  const n=Number(value);
  if(n>0)S.oldSystemUI.consumeAmount=n;
  const preview=document.getElementById('v153-old-system-preview');
  if(preview)preview.innerHTML=v153ConsumptionPreview(S.oldSystemUI.consumeCategoryId,S.oldSystemUI.consumeAmount);
  if(rerender&&!(n>0))render();
}

function v153ApplyConsumption(){
  const os=v153EnsureOldSystem();
  const id=String(S.oldSystemUI.consumeCategoryId||'');
  const qty=Number(S.oldSystemUI.consumeAmount);

  if(!os.enabledCategoryIds.includes(id)){showToast('Choose an Old System category.');return;}
  if(!(qty>0)){showToast('Consumption amount must be greater than 0.');return;}

  const deltas=[];
  os.balances[id]=(Number(os.balances[id])||0)+qty;
  deltas.push({categoryId:id,delta:qty});

  for(const r of v153RulesForConsumedCategory(id)){
    const fromId=String(r.fromCategoryId);
    const cost=qty*(Number(r.fromAmount)||1)/(Number(r.toAmount)||1);
    os.balances[fromId]=(Number(os.balances[fromId])||0)-cost;
    deltas.push({categoryId:fromId,delta:-cost});
  }

  const cat=getCategory(id);
  os.transactions.push({
    id:uid(),timestamp:Date.now(),type:'consume',categoryId:id,amount:qty,
    label:`Consumed ${v153FmtQty(qty)} ${unitLabel(cat.unit,qty)} of ${cat.name}`,
    deltas
  });

  v153TouchOldSystem();
  render();
  showToast(`Old System updated · +${v153FmtQty(qty)} ${cat.name}`);
}

function v153Undo(){
  const os=v153EnsureOldSystem();
  const t=os.transactions.pop();
  if(!t){showToast('Nothing to undo.');return;}

  for(const d of (t.deltas||[])){
    const id=String(d.categoryId||'');
    os.balances[id]=(Number(os.balances[id])||0)-(Number(d.delta)||0);
  }

  v153TouchOldSystem();
  render();
  showToast('Last Old System change undone');
}

Object.assign(App,{
  v153SetOldSystemMode:v153SetMode,
  v153ToggleOldSystemCategory:v153ToggleCategory,
  v153AddOldSystemRule:v153AddRule,
  v153UpdateOldSystemRule:v153UpdateRule,
  v153RemoveOldSystemRule:v153RemoveRule,
  v153SetOldSystemBalance:v153SetBalance,
  v153SetOldSystemUseCategory:v153SetUseCategory,
  v153SetOldSystemUseAmount:v153SetUseAmount,
  v153ApplyOldSystemConsumption:v153ApplyConsumption,
  v153UndoOldSystem:v153Undo
});

// ---- History-cache invalidation --------------------------------------------
const v153PersistSessionsBase=persistSessions;
persistSessions=function(){
  V153_HISTORY_CACHE_DIRTY=true;
  return v153PersistSessionsBase.apply(this,arguments);
};

const v153MfCommitBase=mfCommit;
mfCommit=function(){
  V153_HISTORY_CACHE_DIRTY=true;
  return v153MfCommitBase.apply(this,arguments);
};

const v153RestoreCoreBase=mfRestoreCore;
mfRestoreCore=function(){
  V153_HISTORY_CACHE_DIRTY=true;
  return v153RestoreCoreBase.apply(this,arguments);
};

// ---- Persistence / Cloud / Import ------------------------------------------
const v153SnapshotBase=snapshot;
snapshot=function(){
  S.oldSystem=v153NormalizeOldSystem(S.oldSystem);
  const x=v153SnapshotBase();
  x.oldSystem=v153Clone(S.oldSystem,V153_OLD_SYSTEM_DEFAULT);
  return x;
};

const v153LoadAllBase=loadAll;
loadAll=async function(){
  await v153LoadAllBase();
  const d=await rawGet(STATE_KEY);
  S.oldSystem=v153NormalizeOldSystem(d?.oldSystem);
  S.oldSystemUI={consumeCategoryId:S.oldSystem.enabledCategoryIds[0]||'',consumeAmount:1};
  S.navLayout=v161NormalizeNavLayout(d?.navLayout);
  S.respectState=v165NormalizeRespectState(d?.respectState);
  S.categoryRecovery=v171NormalizeCategoryRecovery(d?.categoryRecovery);
  if(d?.portableExtras) v155ApplyPortableExtras(d.portableExtras);
  V153_HISTORY_CACHE_DIRTY=true;
};

const v153ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v153ApplyStateBase.apply(this,arguments);
  S.oldSystem=v153NormalizeOldSystem(d?.oldSystem);
  S.oldSystemUI={consumeCategoryId:S.oldSystem.enabledCategoryIds[0]||'',consumeAmount:1};
  V153_HISTORY_CACHE_DIRTY=true;
  return result;
};

const v153MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v153MergeStatesBase(a,b)||{};
  const ao=a?.oldSystem&&typeof a.oldSystem==='object'?a.oldSystem:null;
  const bo=b?.oldSystem&&typeof b.oldSystem==='object'?b.oldSystem:null;

  let chosen=null;
  if(ao&&bo){
    chosen=(Number(ao.modifiedAt)||0)>=(Number(bo.modifiedAt)||0)?ao:bo;
  }else{
    chosen=ao||bo||null;
  }

  out.oldSystem=v153NormalizeOldSystem(chosen);
  return out;
};

// Make category deletion/toggling harmless to Old System rendering.
const v153SetViewBase=App.setView;
App.setView=function(v){
  if(v==='oldsystem')v153EnsureOldSystem();
  return v153SetViewBase.call(this,v);
};

// ---- Full Backup / Automatic Backup manifest -------------------------------
const v153BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v153BackupManifestBase(state,extras);
  const os=v153NormalizeOldSystem(state?.oldSystem);
  manifest.includes=Object.assign({},manifest.includes||{},{
    oldSystem:true,
    oldSystemRules:true,
    oldSystemBalances:true,
    oldSystemTransactions:true
  });
  manifest.counts=Object.assign({},manifest.counts||{},{
    oldSystemCategories:os.enabledCategoryIds.length,
    oldSystemRules:os.rules.length,
    oldSystemTransactions:os.transactions.length
  });
  return manifest;
};

// v152 automatic backups already call the final v148BuildFullBackup() chain.
// Because v153 adds Old System to snapshot(), BOTH Full Backup and Automatic
// Backup now include the entire Old System automatically.
