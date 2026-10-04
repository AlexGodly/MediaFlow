/* ============================================================
   MediaFlow v164 — Simkl Full Style Theme
   ------------------------------------------------------------
   The selected Full Style theme already persists in S.settings.theme,
   therefore the existing cloud, Sync Now, Full Backup, Automatic Backup,
   JSON export/import and Settings merge pipelines require no new schema field.
   ============================================================ */

const v164BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v164BuildFullBackupBase();

  // Keep current schema: v164 introduces a new allowed theme ID, not a new
  // persistent structure.
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();

  if(payload.backupManifest){
    payload.backupManifest.note='Complete MediaFlow v164 backup. Includes the selected Simkl Full Style theme through normal Settings persistence, plus all existing Library/History, adaptive themes, navigation, Personal Order, Old System, Rating Queue and portable preferences.';
  }

  return payload;
};/* ============================================================
   MediaFlow v165 — System Respect XP
   ------------------------------------------------------------
   Rewards:
   - following MediaFlow's recommended category;
   - extra XP when Exact title recommendations are enabled AND the
     recommended title appears anywhere in the same log (other titles may
     be logged alongside it);
   - a growing No-Skip multiplier for consecutive respected recommendations;
   - a stronger First-Pick multiplier for consecutive respected recommendations
     without pressing "Give me something else".

   Performance:
   - reward calculation touches only the newly-created session group;
   - lifetime totals reuse v150's existing dirty/cached XP aggregation;
   - no per-render History scan was added.
   ============================================================ */

const V165_BACKUP_SCHEMA_VERSION=7;
const V165_RESPECT_XP_VERSION=165;
const V165_SYSTEM_BASE_XP=10;
const V165_RECOMMENDED_TITLE_XP=25;

const V165_RESPECT_DEFAULT={
  version:V165_RESPECT_XP_VERSION,
  noSkipStreak:0,
  noRerollStreak:0,
  bestNoSkipStreak:0,
  bestNoRerollStreak:0,
  currentRerolls:0,
  totalSkips:0,
  totalRerolls:0,
  lastRewardAt:0,
  modifiedAt:0
};

function v165Clone(value,fallback){
  try{return JSON.parse(JSON.stringify(value));}
  catch(_){return JSON.parse(JSON.stringify(fallback));}
}

function v165NormalizeRespectState(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  return {
    version:V165_RESPECT_XP_VERSION,
    noSkipStreak:Math.max(0,Math.floor(Number(src.noSkipStreak)||0)),
    noRerollStreak:Math.max(0,Math.floor(Number(src.noRerollStreak)||0)),
    bestNoSkipStreak:Math.max(0,Math.floor(Number(src.bestNoSkipStreak)||0)),
    bestNoRerollStreak:Math.max(0,Math.floor(Number(src.bestNoRerollStreak)||0)),
    currentRerolls:Math.max(0,Math.floor(Number(src.currentRerolls)||0)),
    totalSkips:Math.max(0,Math.floor(Number(src.totalSkips)||0)),
    totalRerolls:Math.max(0,Math.floor(Number(src.totalRerolls)||0)),
    lastRewardAt:Math.max(0,Number(src.lastRewardAt)||0),
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v165EnsureRespectState(){
  S.respectState=v165NormalizeRespectState(S.respectState);
  return S.respectState;
}

S.respectState=v165NormalizeRespectState(S.respectState);

function v165TouchRespectState(){
  const st=v165EnsureRespectState();
  st.modifiedAt=Date.now();
  return st;
}

function v165EndSessionContext(){
  const st=v165EnsureRespectState();
  if(st.currentRerolls){
    st.currentRerolls=0;
    st.modifiedAt=Date.now();
  }
}

function v165RecordReroll(){
  const st=v165TouchRespectState();
  st.currentRerolls++;
  st.totalRerolls++;
  // "Give me something else" breaks the stronger first-pick streak,
  // but does not break the separate no-Skip streak.
  st.noRerollStreak=0;
}

function v165RecordSkip(){
  const st=v165TouchRespectState();
  st.totalSkips++;
  st.currentRerolls=0;
  // Skip breaks both respect streaks.
  st.noSkipStreak=0;
  st.noRerollStreak=0;
}

function v165RoundMultiplier(value){
  return Math.round((Number(value)||1)*100)/100;
}

function v165RespectMultipliers(noSkipStreak,noRerollStreak){
  const skip=Math.max(0,Number(noSkipStreak)||0);
  const reroll=Math.max(0,Number(noRerollStreak)||0);

  // Both start at ×1.00. The first-pick streak grows faster and to a higher cap,
  // because respecting the very first MediaFlow recommendation deserves more
  // than merely avoiding Skip.
  const noSkip=v165RoundMultiplier(
    1+Math.min(.50,.08*Math.log2(Math.max(1,skip)))
  );
  const noReroll=v165RoundMultiplier(
    1+Math.min(.75,.14*Math.log2(Math.max(1,reroll)))
  );

  return {noSkip,noReroll,combined:v165RoundMultiplier(noSkip*noReroll)};
}

function v165GroupSessions(sessionGroupId){
  const rows=[];
  const sessions=S.sessions||[];

  // New submitLog rows are contiguous at the end. Walk backward only across
  // this just-created group instead of scanning the whole History.
  for(let i=sessions.length-1;i>=0;i--){
    const s=sessions[i];
    if(!s)continue;
    if(String(s.sessionGroupId||'')===String(sessionGroupId||'')){
      rows.push(s);
      continue;
    }
    if(rows.length)break;
  }

  return rows.reverse();
}

function v165NormalizedTitle(value){
  return cleanTitle(String(value||'')).trim().toLocaleLowerCase();
}

function v165RecommendedTitleLogged(task,entries,groupRows){
  if(!S.settings?.exactTitleRecommendations)return false;
  if(!task?.title)return false;

  const wantedId=String(task.libraryId||'');
  const wantedTitle=v165NormalizedTitle(task.title);

  const matches=(libraryId,title,qty)=>{
    if(Number(qty)<=0)return false;
    const id=String(libraryId||'');
    if(wantedId&&id&&id===wantedId)return true;
    return !!wantedTitle&&v165NormalizedTitle(title)===wantedTitle;
  };

  for(const e of (entries||[])){
    if(matches(e?.libraryId,e?.title,e?.qty))return true;
  }

  for(const s of (groupRows||[])){
    for(const t of (s?.titles||[])){
      if(matches(t?.libraryId,t?.title,t?.qty))return true;
    }
  }

  return false;
}

function v165ApplyRespectReward(task,entries,sessionGroupId,assignedCat){
  const st=v165EnsureRespectState();
  const groupRows=v165GroupSessions(sessionGroupId);

  // Recommendation was respected when actual consumption includes the assigned
  // category. This remains true even if other categories/titles were logged too.
  const respected=groupRows.some(s=>
    s &&
    s.status!=='skipped' &&
    String(s.categoryId||'')===String(task?.categoryId||assignedCat?.id||'') &&
    Number(s.actualAmount)>0
  );

  if(!respected){
    // Logging something completely different is not a System Respect success.
    st.noSkipStreak=0;
    st.noRerollStreak=0;
    st.currentRerolls=0;
    st.modifiedAt=Date.now();
    return 0;
  }

  const hadReroll=st.currentRerolls>0;

  // A completed recommendation without Skip extends the no-Skip streak,
  // including when the user rerolled first.
  st.noSkipStreak++;

  // First-pick streak is deliberately stricter.
  if(hadReroll)st.noRerollStreak=0;
  else st.noRerollStreak++;

  st.bestNoSkipStreak=Math.max(st.bestNoSkipStreak,st.noSkipStreak);
  st.bestNoRerollStreak=Math.max(st.bestNoRerollStreak,st.noRerollStreak);

  const titleFollowed=v165RecommendedTitleLogged(task,entries,groupRows);
  const exactEnabled=!!S.settings?.exactTitleRecommendations;
  const baseRespectXP=
    V165_SYSTEM_BASE_XP+
    (titleFollowed?V165_RECOMMENDED_TITLE_XP:0);

  const mult=v165RespectMultipliers(st.noSkipStreak,st.noRerollStreak);
  const levelingEnabled=levelingSettings().enabled!==false;
  const bonus=levelingEnabled
    ?Math.max(0,Math.round(baseRespectXP*mult.noSkip*mult.noReroll))
    :0;

  const target=
    groupRows.find(s=>
      s &&
      s.status!=='skipped' &&
      String(s.categoryId||'')===String(task?.categoryId||'')
    ) ||
    groupRows.find(s=>s&&s.status!=='skipped');

  if(target){
    // Bonus stays separate from s.xp. That is important: progression repair and
    // repeat-XP reconstruction are allowed to rebuild s.xp at any time without
    // ever deleting or double-awarding System Respect XP.
    target.v165RespectBonusXP=bonus;
    target.v165RespectBaseXP=baseRespectXP;
    target.v165SystemBaseXP=V165_SYSTEM_BASE_XP;
    target.v165RecommendedTitleBaseXP=titleFollowed?V165_RECOMMENDED_TITLE_XP:0;
    target.v165RecommendedTitleFollowed=!!titleFollowed;
    target.v165ExactTitleRecommendationEnabled=exactEnabled;
    target.v165RecommendedLibraryId=exactEnabled?String(task?.libraryId||''):'';
    target.v165RecommendedTitle=exactEnabled?cleanTitle(task?.title||''):'';
    target.v165NoSkipStreak=st.noSkipStreak;
    target.v165NoRerollStreak=st.noRerollStreak;
    target.v165NoSkipMultiplier=mult.noSkip;
    target.v165NoRerollMultiplier=mult.noReroll;
    target.v165RespectMultiplier=mult.combined;
    target.v165RerollsBeforeLog=st.currentRerolls;
    target.v165RespectXPVersion=V165_RESPECT_XP_VERSION;
  }

  st.currentRerolls=0;
  st.lastRewardAt=Date.now();
  st.modifiedAt=st.lastRewardAt;

  if(bonus>0){
    const titlePart=titleFollowed?' · recommended title followed':'';
    const message=`System respected · +${bonus.toLocaleString()} XP${titlePart} · no-Skip ${st.noSkipStreak} · first-pick ${st.noRerollStreak}`;
    // submitLog still has one normal render to perform. Queue the toast until
    // after that render instead of causing another render/history pass.
    setTimeout(()=>showToast(message),0);
  }

  return bonus;
}

function v165RespectBonusForSession(s){
  if(!s||s.status==='skipped')return 0;
  return Math.max(0,Math.round(Number(s.v165RespectBonusXP)||0));
}

// Respect XP remains outside s.xp so repeat/repair logic can rebuild base XP.
// v150's cached single-pass progression engine adds it at read time.
const v165BaseSessionXPBase=v150BaseSessionXP;
v150BaseSessionXP=function(s){
  return Math.max(
    0,
    Number(v165BaseSessionXPBase(s))+
    v165RespectBonusForSession(s)
  );
};

// Extend the existing cache when it is rebuilt. This is one extra lightweight
// pass only when History is already dirty; normal renders stay O(1).
const v165BuildLiveXPCacheBase=v150BuildLiveXPCache;
v150BuildLiveXPCache=function(){
  const c=v165BuildLiveXPCacheBase();

  let respectBonusXP=0;
  let respectXPWithDayStreak=0;
  let rewardedSessions=0;
  let recommendedTitleFollowed=0;

  for(const s of (S.sessions||[])){
    const raw=v165RespectBonusForSession(s);
    if(raw<=0)continue;

    rewardedSessions++;
    respectBonusXP+=raw;
    if(s.v165RecommendedTitleFollowed)recommendedTitleFollowed++;

    const dayMultiplier=Math.max(1,Number(s.streakMultiplier)||1);
    respectXPWithDayStreak+=Math.max(0,Math.round(raw*dayMultiplier));
  }

  c.systemRespectBonusXP=Math.round(respectBonusXP);
  c.systemRespectXPWithDayStreak=Math.round(respectXPWithDayStreak);
  c.systemRespectDayStreakBonusXP=Math.max(
    0,
    Math.round(respectXPWithDayStreak-respectBonusXP)
  );
  c.systemRespectRewardedSessions=rewardedSessions;
  c.recommendedTitleFollowedRewards=recommendedTitleFollowed;

  return c;
};

const v165XPBreakdownBase=v120XPBreakdown;
v120XPBreakdown=function(){
  const b=v165XPBreakdownBase();
  const c=v150EnsureLiveXPCache();
  const st=v165EnsureRespectState();
  const mult=v165RespectMultipliers(st.noSkipStreak,st.noRerollStreak);

  return Object.assign({},b,{
    systemRespectBonusXP:Number(c.systemRespectBonusXP)||0,
    systemRespectXPWithDayStreak:Number(c.systemRespectXPWithDayStreak)||0,
    systemRespectDayStreakBonusXP:Number(c.systemRespectDayStreakBonusXP)||0,
    systemRespectRewardedSessions:Number(c.systemRespectRewardedSessions)||0,
    recommendedTitleFollowedRewards:Number(c.recommendedTitleFollowedRewards)||0,
    noSkipRespectStreak:st.noSkipStreak,
    firstPickRespectStreak:st.noRerollStreak,
    noSkipRespectMultiplier:mult.noSkip,
    firstPickRespectMultiplier:mult.noReroll,
    combinedRespectMultiplier:mult.combined
  });
};

// ---- Settings ---------------------------------------------------------------

function v165RespectSettingsHtml(){
  const st=v165EnsureRespectState();
  const mult=v165RespectMultipliers(st.noSkipStreak,st.noRerollStreak);
  const b=v120XPBreakdown();

  return `<div class="v165-respect-card">
    <div class="v165-respect-head">
      <div>
        <div class="v165-respect-title">SYSTEM RESPECT XP</div>
        <div class="hint">Earn bonus XP for actually following MediaFlow. Logging other titles at the same time is allowed — the recommended-title bonus still applies as long as the recommended title is included in that log.</div>
      </div>
      <span class="pill">v165</span>
    </div>

    <div class="v165-respect-grid">
      <div class="v165-respect-stat">
        <small>Recommended category</small>
        <b>+${V165_SYSTEM_BASE_XP} base XP</b>
      </div>
      <div class="v165-respect-stat">
        <small>Recommended exact title</small>
        <b>+${V165_RECOMMENDED_TITLE_XP} base XP</b>
      </div>
      <div class="v165-respect-stat">
        <small>No-Skip streak</small>
        <b>${st.noSkipStreak} · ×${mult.noSkip.toFixed(2)}</b>
      </div>
      <div class="v165-respect-stat">
        <small>First-pick streak</small>
        <b>${st.noRerollStreak} · ×${mult.noReroll.toFixed(2)}</b>
      </div>
      <div class="v165-respect-stat">
        <small>Combined respect multiplier</small>
        <b>×${mult.combined.toFixed(2)}</b>
      </div>
      <div class="v165-respect-stat">
        <small>Respect XP earned</small>
        <b>${Number(b.systemRespectBonusXP||0).toLocaleString()} XP</b>
      </div>
    </div>

    <div class="v165-respect-note">
      Skip resets both streaks. <b>Give me something else</b> resets only the stronger First-pick streak, so avoiding Skip still has value.
      The First-pick multiplier grows faster than the No-Skip multiplier.
      Exact-title bonus is awarded only when <b>Exact title recommendations</b> is enabled and the recommended title is actually present in the log.
      Existing day-streak XP can multiply the resulting session XP afterward.
    </div>
  </div>`;
}

const v165RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v165RenderSettingsBase();

  const marker='<div style="font-weight:700;font-size:12px;margin:14px 0 8px;">ROTATION XP MULTIPLIERS</div>';
  if(h.includes(marker)&&!h.includes('SYSTEM RESPECT XP')){
    h=h.replace(marker,v165RespectSettingsHtml()+marker);
  }

  return h;
};

// ---- Persistence / cloud / import / merge ----------------------------------

const v165SnapshotBase=snapshot;
snapshot=function(){
  const x=v165SnapshotBase();
  x.respectState=v165Clone(v165EnsureRespectState(),V165_RESPECT_DEFAULT);
  x.cloudSyncVersion=Math.max(Number(x.cloudSyncVersion)||0,165);
  return x;
};

const v165ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v165ApplyStateBase.apply(this,arguments);
  S.respectState=v165NormalizeRespectState(d?.respectState);
  v149MarkStreakDirty();
  return result;
};

function v165MergeSessionRespectFields(target,...sources){
  const keys=[
    'v165RespectBonusXP',
    'v165RespectBaseXP',
    'v165SystemBaseXP',
    'v165RecommendedTitleBaseXP',
    'v165RecommendedTitleFollowed',
    'v165ExactTitleRecommendationEnabled',
    'v165RecommendedLibraryId',
    'v165RecommendedTitle',
    'v165NoSkipStreak',
    'v165NoRerollStreak',
    'v165NoSkipMultiplier',
    'v165NoRerollMultiplier',
    'v165RespectMultiplier',
    'v165RerollsBeforeLog',
    'v165RespectXPVersion'
  ];

  for(const src of sources){
    if(!src||typeof src!=='object')continue;
    for(const key of keys){
      if(
        Object.prototype.hasOwnProperty.call(src,key) &&
        src[key]!==undefined &&
        src[key]!==null
      ){
        target[key]=src[key];
      }
    }
  }

  return target;
}

const v165MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v165MergeStatesBase(a,b)||{};

  const ar=a?.respectState&&typeof a.respectState==='object'
    ?v165NormalizeRespectState(a.respectState):null;
  const br=b?.respectState&&typeof b.respectState==='object'
    ?v165NormalizeRespectState(b.respectState):null;

  let chosen=null;
  if(ar&&br){
    chosen=(Number(ar.modifiedAt)||0)>=(Number(br.modifiedAt)||0)?ar:br;
  }else{
    chosen=ar||br||V165_RESPECT_DEFAULT;
  }

  out.respectState=v165Clone(
    v165NormalizeRespectState(chosen),
    V165_RESPECT_DEFAULT
  );

  // Session IDs are stable. Preserve v165 metadata even when an older device's
  // copy of an otherwise-identical History row wins the legacy session merge.
  const aById=new Map((a?.sessions||[]).filter(x=>x?.id).map(x=>[String(x.id),x]));
  const bById=new Map((b?.sessions||[]).filter(x=>x?.id).map(x=>[String(x.id),x]));

  for(const s of (out.sessions||[])){
    if(!s?.id)continue;
    const id=String(s.id);
    v165MergeSessionRespectFields(
      s,
      bById.get(id),
      aById.get(id)
    );
  }

  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    165
  );

  return out;
};

// ---- Sync Now completeness / verification ----------------------------------

const v165StateCompletenessBase=v155StateCompleteness;
v155StateCompleteness=function(state){
  const result=v165StateCompletenessBase(state);
  const missing=[...(result?.missing||[])];

  if(!state?.respectState||typeof state.respectState!=='object'){
    missing.push('System Respect state');
  }

  return {ok:missing.length===0,missing:[...new Set(missing)]};
};

function v165RespectSessionAudit(state){
  let count=0,total=0,titleCount=0;
  for(const s of (state?.sessions||[])){
    const xp=Math.max(0,Math.round(Number(s?.v165RespectBonusXP)||0));
    if(xp<=0)continue;
    count++;
    total+=xp;
    if(s?.v165RecommendedTitleFollowed)titleCount++;
  }
  return {count,total,titleCount};
}

const v165VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v165VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

  const c=v165NormalizeRespectState(cloudState?.respectState);
  const e=v165NormalizeRespectState(expected?.respectState);

  for(const key of [
    'noSkipStreak',
    'noRerollStreak',
    'bestNoSkipStreak',
    'bestNoRerollStreak',
    'currentRerolls',
    'totalSkips',
    'totalRerolls',
    'modifiedAt'
  ]){
    if(Number(c[key])!==Number(e[key])){
      problems.push('System Respect state');
      break;
    }
  }

  const ca=v165RespectSessionAudit(cloudState);
  const ea=v165RespectSessionAudit(expected);

  if(
    ca.count!==ea.count ||
    ca.total!==ea.total ||
    ca.titleCount!==ea.titleCount
  ){
    problems.push('System Respect XP History');
  }

  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

// ---- Full Backup / Automatic Backup ----------------------------------------

const v165BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v165BuildFullBackupBase();

  payload.backupSchemaVersion=V165_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.respectState=v165Clone(
    v165EnsureRespectState(),
    V165_RESPECT_DEFAULT
  );

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V165_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v165 backup. Includes System Respect XP state, per-log respect/recommended-title rewards, no-Skip/First-pick streak metadata, all prior adaptive themes/navigation, Library/History, Personal Order, Old System, Rating Queue and portable preferences. Authentication credentials and filesystem permission handles remain intentionally non-portable.';

  return payload;
};

const v165BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v165BackupManifestBase(state,extras);
  const audit=v165RespectSessionAudit(state);
  const respect=v165NormalizeRespectState(state?.respectState);

  manifest.schemaVersion=V165_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{},{
    systemRespectXP:true,
    recommendedTitleRespectRewards:true,
    noSkipRespectStreak:true,
    firstPickRespectStreak:true,
    respectSessionMetadata:true
  });

  manifest.counts=Object.assign({},manifest.counts||{},{
    systemRespectRewardedSessions:audit.count,
    recommendedTitleFollowedRewards:audit.titleCount,
    systemRespectRawXP:audit.total,
    currentNoSkipRespectStreak:respect.noSkipStreak,
    currentFirstPickRespectStreak:respect.noRerollStreak
  });

  return manifest;
};

// Import uses the final v46ApplyState chain above, so respectState is restored.
// Per-session reward fields are normal History fields and are restored unchanged.
// v152 Automatic Backup resolves this final v148BuildFullBackup at runtime.



