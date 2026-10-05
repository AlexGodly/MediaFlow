/* ============================================================
   MediaFlow v167 — Editable System Respect XP
   ------------------------------------------------------------
   User-editable future reward tuning:
   - recommended category base XP;
   - recommended exact-title base XP;
   - No-Skip growth rate + cap;
   - First-pick growth rate + cap.

   Existing History rewards remain frozen exactly as earned. Editing these
   values changes future rewards/current projected multipliers only; it never
   retroactively rewrites old session XP.
   ============================================================ */

const V167_BACKUP_SCHEMA_VERSION=8;
const V167_RESPECT_CONFIG_DEFAULT={
  categoryBaseXP:10,
  exactTitleBaseXP:25,
  noSkipGrowthPercent:8,
  noSkipCapPercent:50,
  firstPickGrowthPercent:14,
  firstPickCapPercent:75,
  modifiedAt:0
};

function v167ClampRespectNumber(value,min,max,fallback){
  const n=Number(value);
  return Number.isFinite(n)
    ?Math.max(min,Math.min(max,n))
    :fallback;
}

function v167NormalizeRespectConfig(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  return {
    categoryBaseXP:Math.round(v167ClampRespectNumber(
      src.categoryBaseXP,0,10000,V167_RESPECT_CONFIG_DEFAULT.categoryBaseXP
    )),
    exactTitleBaseXP:Math.round(v167ClampRespectNumber(
      src.exactTitleBaseXP,0,10000,V167_RESPECT_CONFIG_DEFAULT.exactTitleBaseXP
    )),
    noSkipGrowthPercent:v167ClampRespectNumber(
      src.noSkipGrowthPercent,0,100,V167_RESPECT_CONFIG_DEFAULT.noSkipGrowthPercent
    ),
    noSkipCapPercent:v167ClampRespectNumber(
      src.noSkipCapPercent,0,1000,V167_RESPECT_CONFIG_DEFAULT.noSkipCapPercent
    ),
    firstPickGrowthPercent:v167ClampRespectNumber(
      src.firstPickGrowthPercent,0,100,V167_RESPECT_CONFIG_DEFAULT.firstPickGrowthPercent
    ),
    firstPickCapPercent:v167ClampRespectNumber(
      src.firstPickCapPercent,0,1000,V167_RESPECT_CONFIG_DEFAULT.firstPickCapPercent
    ),
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v167EnsureRespectConfig(settings=S.settings){
  const target=(settings&&typeof settings==='object')?settings:{};
  target.systemRespectXP=v167NormalizeRespectConfig(target.systemRespectXP);
  return target.systemRespectXP;
}

v167EnsureRespectConfig(S.settings||DEFAULT_SETTINGS);

function v167RespectConfig(){
  return v167EnsureRespectConfig(S.settings||DEFAULT_SETTINGS);
}

// FINAL multiplier logic now reads the user's saved configuration.
v165RespectMultipliers=function(noSkipStreak,noRerollStreak){
  const cfg=v167RespectConfig();
  const skip=Math.max(0,Number(noSkipStreak)||0);
  const reroll=Math.max(0,Number(noRerollStreak)||0);

  const noSkipGrowth=cfg.noSkipGrowthPercent/100;
  const noSkipCap=cfg.noSkipCapPercent/100;
  const firstPickGrowth=cfg.firstPickGrowthPercent/100;
  const firstPickCap=cfg.firstPickCapPercent/100;

  const noSkip=v165RoundMultiplier(
    1+Math.min(
      noSkipCap,
      noSkipGrowth*Math.log2(Math.max(1,skip))
    )
  );

  const noReroll=v165RoundMultiplier(
    1+Math.min(
      firstPickCap,
      firstPickGrowth*Math.log2(Math.max(1,reroll))
    )
  );

  return {
    noSkip,
    noReroll,
    combined:v165RoundMultiplier(noSkip*noReroll)
  };
};

// FINAL reward function: same v165 behavior, but future rewards use the
// editable v167 configuration instead of fixed constants.
v165ApplyRespectReward=function(task,entries,sessionGroupId,assignedCat){
  const st=v165EnsureRespectState();
  const cfg=v167RespectConfig();
  const groupRows=v165GroupSessions(sessionGroupId);

  const respected=groupRows.some(s=>
    s &&
    s.status!=='skipped' &&
    String(s.categoryId||'')===String(task?.categoryId||assignedCat?.id||'') &&
    Number(s.actualAmount)>0
  );

  if(!respected){
    st.noSkipStreak=0;
    st.noRerollStreak=0;
    st.currentRerolls=0;
    st.modifiedAt=Date.now();
    return 0;
  }

  const hadReroll=st.currentRerolls>0;

  st.noSkipStreak++;

  if(hadReroll)st.noRerollStreak=0;
  else st.noRerollStreak++;

  st.bestNoSkipStreak=Math.max(st.bestNoSkipStreak,st.noSkipStreak);
  st.bestNoRerollStreak=Math.max(st.bestNoRerollStreak,st.noRerollStreak);

  const titleFollowed=v165RecommendedTitleLogged(task,entries,groupRows);
  const exactEnabled=!!S.settings?.exactTitleRecommendations;

  const categoryXP=Math.max(0,Math.round(Number(cfg.categoryBaseXP)||0));
  const exactTitleXP=titleFollowed
    ?Math.max(0,Math.round(Number(cfg.exactTitleBaseXP)||0))
    :0;

  const baseRespectXP=categoryXP+exactTitleXP;
  const mult=v165RespectMultipliers(st.noSkipStreak,st.noRerollStreak);
  const levelingEnabled=levelingSettings().enabled!==false;

  const bonus=levelingEnabled
    ?Math.max(0,Math.round(
      baseRespectXP*mult.noSkip*mult.noReroll
    ))
    :0;

  const target=
    groupRows.find(s=>
      s &&
      s.status!=='skipped' &&
      String(s.categoryId||'')===String(task?.categoryId||'')
    ) ||
    groupRows.find(s=>s&&s.status!=='skipped');

  if(target){
    target.v165RespectBonusXP=bonus;
    target.v165RespectBaseXP=baseRespectXP;
    target.v165SystemBaseXP=categoryXP;
    target.v165RecommendedTitleBaseXP=exactTitleXP;
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

    // Audit exactly which configuration produced this historical reward.
    target.v167RespectConfigAtLog={
      categoryBaseXP:categoryXP,
      exactTitleBaseXP:Math.max(0,Math.round(Number(cfg.exactTitleBaseXP)||0)),
      noSkipGrowthPercent:cfg.noSkipGrowthPercent,
      noSkipCapPercent:cfg.noSkipCapPercent,
      firstPickGrowthPercent:cfg.firstPickGrowthPercent,
      firstPickCapPercent:cfg.firstPickCapPercent
    };
  }

  st.currentRerolls=0;
  st.lastRewardAt=Date.now();
  st.modifiedAt=st.lastRewardAt;

  if(bonus>0){
    const titlePart=titleFollowed?' · recommended title followed':'';
    setTimeout(()=>showToast(
      `System respected · +${bonus.toLocaleString()} XP${titlePart} · no-Skip ${st.noSkipStreak} · first-pick ${st.noRerollStreak}`
    ),0);
  }

  return bonus;
};

function v167RespectEditorHtml(){
  const st=v165EnsureRespectState();
  const cfg=v167RespectConfig();
  const mult=v165RespectMultipliers(st.noSkipStreak,st.noRerollStreak);
  const b=v120XPBreakdown();

  return `<div class="v165-respect-card">
    <div class="v165-respect-head">
      <div>
        <div class="v165-respect-title">SYSTEM RESPECT XP</div>
        <div class="hint">Customize how strongly MediaFlow rewards following its recommendations. Changes affect future recommendation rewards only; already-earned History XP stays exactly as it was earned.</div>
      </div>
    </div>

    <div class="v167-respect-edit-grid">
      <div class="v167-respect-edit">
        <label>Recommended category — base XP</label>
        <input type="number" min="0" max="10000" step="1"
          value="${cfg.categoryBaseXP}"
          onchange="App.v167UpdateRespectSetting('categoryBaseXP',this.value)">
      </div>

      <div class="v167-respect-edit">
        <label>Recommended exact title — base XP</label>
        <input type="number" min="0" max="10000" step="1"
          value="${cfg.exactTitleBaseXP}"
          onchange="App.v167UpdateRespectSetting('exactTitleBaseXP',this.value)">
      </div>

      <div class="v167-respect-edit">
        <label>No-Skip growth per log2 step (%)</label>
        <input type="number" min="0" max="100" step="0.5"
          value="${cfg.noSkipGrowthPercent}"
          onchange="App.v167UpdateRespectSetting('noSkipGrowthPercent',this.value)">
      </div>

      <div class="v167-respect-edit">
        <label>No-Skip maximum bonus (%)</label>
        <input type="number" min="0" max="1000" step="1"
          value="${cfg.noSkipCapPercent}"
          onchange="App.v167UpdateRespectSetting('noSkipCapPercent',this.value)">
      </div>

      <div class="v167-respect-edit">
        <label>First-pick growth per log2 step (%)</label>
        <input type="number" min="0" max="100" step="0.5"
          value="${cfg.firstPickGrowthPercent}"
          onchange="App.v167UpdateRespectSetting('firstPickGrowthPercent',this.value)">
      </div>

      <div class="v167-respect-edit">
        <label>First-pick maximum bonus (%)</label>
        <input type="number" min="0" max="1000" step="1"
          value="${cfg.firstPickCapPercent}"
          onchange="App.v167UpdateRespectSetting('firstPickCapPercent',this.value)">
      </div>
    </div>

    <div class="v167-respect-readonly">
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

    <div class="v167-respect-actions">
      <button type="button" class="btn btn-sm btn-ghost"
        onclick="App.v167ResetRespectSettings()">Reset reward settings</button>
    </div>

    <div class="v165-respect-note">
      Skip resets both streaks. <b>Give me something else</b> resets only the stronger First-pick streak, so avoiding Skip still has value.
      Exact-title XP is awarded only when <b>Exact title recommendations</b> is enabled and the recommended title is actually present in the log.
      Existing day-streak XP can multiply the resulting session XP afterward.
    </div>
  </div>`;
}

// Remove the old read-only v165 panel entirely and insert the editable one.
const v167RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v167RenderSettingsBase();

  h=h.replace(
    /<div class="v165-respect-card">[\s\S]*?<div class="v165-respect-note">[\s\S]*?<\/div>\s*<\/div>/,
    v167RespectEditorHtml()
  );

  return h;
};

function v167UpdateRespectSetting(key,value){
  const allowed=new Set([
    'categoryBaseXP',
    'exactTitleBaseXP',
    'noSkipGrowthPercent',
    'noSkipCapPercent',
    'firstPickGrowthPercent',
    'firstPickCapPercent'
  ]);
  if(!allowed.has(String(key)))return;

  const cfg=v167RespectConfig();

  const bounds={
    categoryBaseXP:[0,10000,V167_RESPECT_CONFIG_DEFAULT.categoryBaseXP,true],
    exactTitleBaseXP:[0,10000,V167_RESPECT_CONFIG_DEFAULT.exactTitleBaseXP,true],
    noSkipGrowthPercent:[0,100,V167_RESPECT_CONFIG_DEFAULT.noSkipGrowthPercent,false],
    noSkipCapPercent:[0,1000,V167_RESPECT_CONFIG_DEFAULT.noSkipCapPercent,false],
    firstPickGrowthPercent:[0,100,V167_RESPECT_CONFIG_DEFAULT.firstPickGrowthPercent,false],
    firstPickCapPercent:[0,1000,V167_RESPECT_CONFIG_DEFAULT.firstPickCapPercent,false]
  };

  const [min,max,fallback,whole]=bounds[key];
  let next=v167ClampRespectNumber(value,min,max,fallback);
  if(whole)next=Math.round(next);

  cfg[key]=next;
  cfg.modifiedAt=Date.now();
  S.settings.systemRespectXP=cfg;

  persistSettings();
  render();
}

function v167ResetRespectSettings(){
  S.settings.systemRespectXP=Object.assign(
    {},
    V167_RESPECT_CONFIG_DEFAULT,
    {modifiedAt:Date.now()}
  );
  persistSettings();
  render();
  showToast('System Respect XP reward settings reset.');
}

Object.assign(App,{
  v167UpdateRespectSetting,
  v167ResetRespectSettings
});

// ---- Persistence / merge / import ------------------------------------------

const v167PersistSettingsBase=persistSettings;
persistSettings=function(){
  v167EnsureRespectConfig(S.settings||DEFAULT_SETTINGS);
  return v167PersistSettingsBase.apply(this,arguments);
};

const v167LoadAllBase=loadAll;
loadAll=async function(){
  await v167LoadAllBase.apply(this,arguments);
  v167EnsureRespectConfig(S.settings||DEFAULT_SETTINGS);
};

const v167SnapshotBase=snapshot;
snapshot=function(){
  v167EnsureRespectConfig(S.settings||DEFAULT_SETTINGS);
  const x=v167SnapshotBase();
  x.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  x.cloudSyncVersion=Math.max(Number(x.cloudSyncVersion)||0,167);
  return x;
};

const v167ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v167ApplyStateBase.apply(this,arguments);
  v167EnsureRespectConfig(S.settings||DEFAULT_SETTINGS);
  return result;
};

const v167MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v167MergeStatesBase(a,b)||{};

  const ac=v167NormalizeRespectConfig(a?.settings?.systemRespectXP);
  const bc=v167NormalizeRespectConfig(b?.settings?.systemRespectXP);

  const chosen=
    (Number(ac.modifiedAt)||0)>=(Number(bc.modifiedAt)||0)
      ?ac
      :bc;

  out.settings=out.settings||{};
  out.settings.systemRespectXP=chosen;
  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    167
  );

  return out;
};

// Preserve the historical config audit object when cloud/local versions of the
// same v165+ History session are merged.
const v167MergeSessionRespectFieldsBase=v165MergeSessionRespectFields;
v165MergeSessionRespectFields=function(target,...sources){
  const result=v167MergeSessionRespectFieldsBase(target,...sources);

  for(const src of sources){
    if(
      src &&
      src.v167RespectConfigAtLog &&
      typeof src.v167RespectConfigAtLog==='object'
    ){
      result.v167RespectConfigAtLog=JSON.parse(
        JSON.stringify(src.v167RespectConfigAtLog)
      );
    }
  }

  return result;
};

// ---- Protected Sync verification -------------------------------------------

const v167VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v167VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

  const cloud=v167NormalizeRespectConfig(
    cloudState?.settings?.systemRespectXP
  );
  const wanted=v167NormalizeRespectConfig(
    expected?.settings?.systemRespectXP
  );

  for(const key of [
    'categoryBaseXP',
    'exactTitleBaseXP',
    'noSkipGrowthPercent',
    'noSkipCapPercent',
    'firstPickGrowthPercent',
    'firstPickCapPercent',
    'modifiedAt'
  ]){
    if(Number(cloud[key])!==Number(wanted[key])){
      problems.push('System Respect XP configuration');
      break;
    }
  }

  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

// ---- Full Backup / Automatic Backup ----------------------------------------

const v167BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v167EnsureRespectConfig(S.settings||DEFAULT_SETTINGS);
  const payload=v167BuildFullBackupBase();

  payload.backupSchemaVersion=V167_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V167_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v167 backup. Includes editable System Respect XP reward configuration and historical per-log respect reward metadata, plus automatic Seasonal episode state, adaptive themes/navigation, Library/History, Personal Order, Old System, Rating Queue and portable preferences. Authentication credentials and filesystem permission handles remain intentionally non-portable.';

  return payload;
};

const v167BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v167BackupManifestBase(state,extras);
  const cfg=v167NormalizeRespectConfig(
    state?.settings?.systemRespectXP
  );

  manifest.schemaVersion=V167_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{},{
    editableSystemRespectXP:true,
    systemRespectRewardConfiguration:true,
    historicalRespectConfigurationAudit:true
  });

  manifest.systemRespectXPConfig=Object.assign({},cfg);

  return manifest;
};

// v152 Automatic Backup already resolves the final v148BuildFullBackup() at
// call time, so it automatically receives the v167 schema/configuration.
// JSON export/import use the same final full-backup/apply-state chains.



