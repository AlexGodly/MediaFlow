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



