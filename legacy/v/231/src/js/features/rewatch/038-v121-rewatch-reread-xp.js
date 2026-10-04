/* ============================================================
   MediaFlow v121 — Rewatch / Reread XP
   - Logged repeat episodes, chapters, issues and movies earn an extra repeat-unit bonus.
   - Normal consumption XP still applies, so repeat XP is additive rather than replacing it.
   - Every time logged repeat progress crosses another whole-title total, MediaFlow awards
     a configurable full rewatch/reread bonus.
   - Repeat XP works through normal logging and Batch Log and is rebuilt by Calculate XP now.
   - Manual past-repeat corrections remain history-only and intentionally do not generate XP.
   ============================================================ */

DEFAULT_SETTINGS.leveling.repeatUnitXP=Object.assign(
  {episodes:10,chapters:3,issues:6,movies:30},
  DEFAULT_SETTINGS.leveling.repeatUnitXP||{}
);
DEFAULT_SETTINGS.leveling.fullRepeatXP=Number.isFinite(Number(DEFAULT_SETTINGS.leveling.fullRepeatXP))
  ? Number(DEFAULT_SETTINGS.leveling.fullRepeatXP)
  : 50;

const v121LevelingSettingsBase=levelingSettings;
levelingSettings=function(){
  const l=v121LevelingSettingsBase();
  l.repeatUnitXP=Object.assign(
    {},
    DEFAULT_SETTINGS.leveling.repeatUnitXP,
    l.repeatUnitXP||{},
    S.settings?.leveling?.repeatUnitXP||{}
  );
  const configured=S.settings?.leveling?.fullRepeatXP;
  l.fullRepeatXP=Number.isFinite(Number(configured))
    ? Math.max(0,Number(configured))
    : Math.max(0,Number(DEFAULT_SETTINGS.leveling.fullRepeatXP)||50);
  return l;
};

function v121EnsureRepeatSettings(){
  S.settings=S.settings||{};
  S.settings.leveling=Object.assign({},DEFAULT_SETTINGS.leveling,S.settings.leveling||{});
  S.settings.leveling.repeatUnitXP=Object.assign(
    {},
    DEFAULT_SETTINGS.leveling.repeatUnitXP,
    S.settings.leveling.repeatUnitXP||{}
  );
  if(!Number.isFinite(Number(S.settings.leveling.fullRepeatXP))){
    S.settings.leveling.fullRepeatXP=Math.max(0,Number(DEFAULT_SETTINGS.leveling.fullRepeatXP)||50);
  }
}

const v121EnsureXPStateBase=v120EnsureXPState;
v120EnsureXPState=function(){
  v121EnsureXPStateBase();
  v121EnsureRepeatSettings();
};

function v121SessionTime(s){
  const direct=Number(s?.timestamp)||0;
  if(direct>0)return direct;
  const parsed=Date.parse(String(s?.date||'')+'T12:00:00');
  return Number.isFinite(parsed)?parsed:0;
}

function v121RepeatKey(t,s){
  if(t?.libraryId)return `id:${String(t.libraryId)}`;
  const title=cleanTitle(t?.title||'').toLowerCase();
  return title?`title:${title}::${String(s?.categoryId||'')}`:'';
}

function v121RepeatTotal(t,s,item,unit){
  const stored=Number(t?.repeatTotalAtLog)||0;
  if(stored>0)return stored;
  const current=Number(item?.total)||0;
  const total=current>0?current:(unit==='movies'?1:0);
  if(total>0 && t && typeof t==='object')t.repeatTotalAtLog=total;
  return total;
}

function v121RecalculateRepeatXPHistory(){
  v121EnsureRepeatSettings();
  const l=levelingSettings();
  const enabled=l.enabled!==false;
  const running=new Map();
  const rows=(S.sessions||[]).map((s,index)=>({s,index})).sort((a,b)=>{
    const d=v121SessionTime(a.s)-v121SessionTime(b.s);
    return d||a.index-b.index;
  });
  let repeatUnits=0,fullRepeats=0,unitBonusXP=0,fullRepeatBonusXP=0,repeatSessions=0;

  for(const row of rows){
    const s=row.s;
    if(!s || s.status==='skipped')continue;
    let sessionUnits=0,sessionFull=0,sessionUnitXP=0,sessionFullXP=0;

    for(const t of (s.titles||[])){
      if(!t?.repeat)continue;
      const qty=Math.max(0,Number(t.qty)||0);
      if(qty<=0)continue;

      const item=t.libraryId?(S.library||[]).find(i=>String(i?.id||'')===String(t.libraryId)):null;
      const unit=getCategory(item?.categoryId||s.categoryId)?.unit||s.unit||'';
      const perUnit=enabled?Math.max(0,Number(l.repeatUnitXP?.[unit])||0):0;

      sessionUnits+=qty;
      sessionUnitXP+=qty*perUnit;

      const key=v121RepeatKey(t,s);
      if(key){
        const before=Number(running.get(key))||0;
        const after=before+qty;
        const total=v121RepeatTotal(t,s,item,unit);
        if(total>0){
          const crossed=Math.max(0,Math.floor(after/total)-Math.floor(before/total));
          if(crossed>0){
            sessionFull+=crossed;
            sessionFullXP+=enabled?crossed*Math.max(0,Number(l.fullRepeatXP)||0):0;
          }
        }
        running.set(key,after);
      }
    }

    if(sessionUnits>0){
      repeatSessions++;
      const cat=getCategory(s.categoryId);
      const base=calculateConsumptionXP(
        cat,
        Number(s.actualAmount)||0,
        Number(s.minutes)||0,
        s.healthStatus||'healthy'
      ).xp;
      s.repeatUnits=sessionUnits;
      s.fullRepeatsCompleted=sessionFull;
      s.repeatUnitBonusXP=Math.max(0,Math.round(sessionUnitXP));s.repeatFullTitleXP=Math.max(0,Math.round(sessionFullXP));
      s.repeatBonusXP=s.repeatUnitBonusXP+s.repeatFullTitleXP;
      s.xp=Math.max(0,Math.round(base+s.repeatBonusXP));

      repeatUnits+=sessionUnits;
      fullRepeats+=sessionFull;
      unitBonusXP+=s.repeatUnitBonusXP;
      fullRepeatBonusXP+=s.repeatFullTitleXP;
    }else if(
      s.repeatBonusXP!==undefined ||
      s.repeatUnitBonusXP!==undefined ||
      s.repeatFullTitleXP!==undefined ||
      s.repeatUnits!==undefined ||
      s.fullRepeatsCompleted!==undefined
    ){
      const cat=getCategory(s.categoryId);
      s.repeatUnits=0;
      s.fullRepeatsCompleted=0;
      s.repeatUnitBonusXP=0;
      s.repeatFullTitleXP=0;
      s.repeatBonusXP=0;
      s.xp=calculateConsumptionXP(
        cat,
        Number(s.actualAmount)||0,
        Number(s.minutes)||0,
        s.healthStatus||'healthy'
      ).xp;
    }
  }

  return {
    repeatSessions,
    repeatUnits,
    fullRepeats,
    repeatUnitBonusXP:Math.max(0,Math.round(unitBonusXP)),
    fullRepeatBonusXP:Math.max(0,Math.round(fullRepeatBonusXP)),
    repeatBonusXP:Math.max(0,Math.round(unitBonusXP+fullRepeatBonusXP))
  };
}

function v121RepeatXPBreakdown(){
  let repeatSessions=0,repeatUnits=0,fullRepeats=0,repeatUnitBonusXP=0,fullRepeatBonusXP=0;
  for(const s of (S.sessions||[])){
    const units=Math.max(0,Number(s?.repeatUnits)||0);
    if(units>0)repeatSessions++;
    repeatUnits+=units;
    fullRepeats+=Math.max(0,Number(s?.fullRepeatsCompleted)||0);
    repeatUnitBonusXP+=Math.max(0,Number(s?.repeatUnitBonusXP)||0);
    fullRepeatBonusXP+=Math.max(0,Number(s?.repeatFullTitleXP)||0);
  }
  return {
    repeatSessions,
    repeatUnits,
    fullRepeats,
    repeatUnitBonusXP:Math.round(repeatUnitBonusXP),
    fullRepeatBonusXP:Math.round(fullRepeatBonusXP),
    repeatBonusXP:Math.round(repeatUnitBonusXP+fullRepeatBonusXP)
  };
}

// Rebuild repeat XP whenever the main progression repair recalculates History.
const v121RecalculateXPBase=v46RecalculateXP;
v46RecalculateXP=async function(force=false){
  await v121RecalculateXPBase(force);
  v121RecalculateRepeatXPHistory();
  return mediaFlowLevelInfo();
};

// Manual Sync/Import must restore the nested repeat-XP settings too.
const v121ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  v121ApplyStateBase(d);
  v121EnsureRepeatSettings();
};

// Deep-merge the new nested repeat-unit settings during cloud/local synchronization.
const v121MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v121MergeStatesBase(a,b)||{};
  const as=a?.settings||{},bs=b?.settings||{};
  const al=as.leveling||{},bl=bs.leveling||{};
  out.settings=Object.assign({},bs,as);
  out.settings.leveling=Object.assign({},DEFAULT_SETTINGS.leveling,bl,al);
  out.settings.leveling.unitXP=Object.assign({},DEFAULT_SETTINGS.leveling.unitXP,bl.unitXP||{},al.unitXP||{});
  out.settings.leveling.rotationMultiplier=Object.assign({},DEFAULT_SETTINGS.leveling.rotationMultiplier,bl.rotationMultiplier||{},al.rotationMultiplier||{});
  out.settings.leveling.repeatUnitXP=Object.assign({},DEFAULT_SETTINGS.leveling.repeatUnitXP,bl.repeatUnitXP||{},al.repeatUnitXP||{});
  return out;
};

// Make old repeat History contribute immediately after loading without creating a startup write.
const v121LoadAllBase=loadAll;
loadAll=async function(){
  await v121LoadAllBase();
  v121EnsureRepeatSettings();
  v121RecalculateRepeatXPHistory();
};

// Expose repeat XP inside the existing progression breakdown/export without double-counting total XP.
const v121XPBreakdownBase=v120XPBreakdown;
v120XPBreakdown=function(){
  const base=v121XPBreakdownBase();
  return Object.assign({},base,v121RepeatXPBreakdown());
};

function v121NewSessionIds(before){
  const old=before||new Set();
  return (S.sessions||[]).filter(s=>s?.id&&!old.has(s.id)).map(s=>s.id);
}
function v121HasRepeatSession(ids){
  const set=new Set(ids||[]);
  return (S.sessions||[]).some(s=>set.has(s?.id)&&(s.titles||[]).some(t=>t?.repeat&&Number(t.qty)>0));
}
function v121NewRepeatSummary(ids){
  const set=new Set(ids||[]);
  let units=0,full=0,bonus=0;
  for(const s of (S.sessions||[])){
    if(!set.has(s?.id))continue;
    units+=Math.max(0,Number(s.repeatUnits)||0);
    full+=Math.max(0,Number(s.fullRepeatsCompleted)||0);
    bonus+=Math.max(0,Number(s.repeatBonusXP)||0);
  }
  return {units,full,bonus:Math.round(bonus)};
}
function v121RepeatToast(summary){
  if(!summary || summary.bonus<=0)return;
  const full=summary.full>0?` · ${summary.full} full title repeat${summary.full===1?'':'s'}`:'';
  showToast(`Rewatch / reread · +${summary.bonus.toLocaleString()} repeat XP${full}`);
}

// Normal logging and Batch Log both award repeat-unit XP and full-repeat XP.
const v121SubmitLogBase=App.submitLog;
App.submitLog=function(){
  const before=new Set((S.sessions||[]).map(s=>s?.id).filter(Boolean));
  const result=v121SubmitLogBase.apply(this,arguments);
  const ids=v121NewSessionIds(before);
  if(v121HasRepeatSession(ids)){
    v121RecalculateRepeatXPHistory();
    persistSessions();
    render();
    v121RepeatToast(v121NewRepeatSummary(ids));
  }
  return result;
};

const v121SubmitBatchLogBase=App.submitBatchLog;
App.submitBatchLog=function(){
  const before=new Set((S.sessions||[]).map(s=>s?.id).filter(Boolean));
  const result=v121SubmitBatchLogBase.apply(this,arguments);
  const ids=v121NewSessionIds(before);
  if(v121HasRepeatSession(ids)){
    v121RecalculateRepeatXPHistory();
    persistSessions();
    render();
    v121RepeatToast(v121NewRepeatSummary(ids));
  }
  return result;
};

App.updateRepeatUnitXP=function(unit,value){
  if(!['episodes','chapters','issues','movies'].includes(unit))return;
  v121EnsureRepeatSettings();
  S.settings.leveling.repeatUnitXP[unit]=Math.max(0,Number(value)||0);
  persistSettings();
  render();
};

async function v121CalculateXPNow(){
  showDataProgress('Calculate XP now','Scanning Library, History, completions and repeat consumption…',5);
  try{
    v120EnsureXPState();
    updateDataProgress(10,`Checking ${(S.library||[]).length.toLocaleString()} Library titles and ${(S.sessions||[]).length.toLocaleString()} History logs…`);
    await v46RecalculateXP(true);
    updateDataProgress(65,'Verifying completed titles, logged completions and full rewatches/rereads…'); await v46Yield();
    await v46RefreshSchedulerProgress();
    updateDataProgress(87,'Saving rebuilt progression and repeat XP to cloud…');
    await saveState(); await saveQueue;
    const info=mediaFlowLevelInfo(),b=v120XPBreakdown();
    render();
    finishDataProgress(
      true,
      'XP calculation complete',
      `Level ${info.level} · ${info.xp.toLocaleString()} lifetime XP · ${b.completedTitles.toLocaleString()} completed titles · ${b.repeatUnits.toLocaleString()} repeat units · ${b.fullRepeats.toLocaleString()} full rewatches/rereads · ${b.repeatBonusXP.toLocaleString()} repeat bonus XP`
    );
  }catch(e){
    console.error(e);
    finishDataProgress(false,'XP calculation failed',friendlyAuthError?.(e)||String(e?.message||e));
  }
}

async function v121SyncNow(){
  showDataProgress('Sync now','Preparing complete MediaFlow state, completion XP and repeat XP…',5);
  try{
    await saveQueue;
    updateDataProgress(13,'Reading protected cloud state…');
    const remote=await rawGet(STATE_KEY);
    updateDataProgress(27,'Merging Library, History, Library History, completions, repeat data and XP…'); await v46Yield();
    const local=snapshot();
    const merged=remote?mergeStates(local,remote):local;
    v46ApplyState(merged);
    updateDataProgress(46,'Rechecking completed titles, repeat units and full rewatches/rereads…');
    await v46RecalculateXP(false);
    updateDataProgress(70,'Refreshing scheduler balance and health…'); await v46RefreshSchedulerProgress();
    updateDataProgress(87,'Uploading one complete protected cloud state…');
    await saveState(); await saveQueue;
    const info=mediaFlowLevelInfo(),b=v120XPBreakdown();
    render();
    finishDataProgress(
      true,
      'Sync complete',
      `${(S.library||[]).length.toLocaleString()} titles · ${(S.sessions||[]).length.toLocaleString()} logs · ${b.completedTitles.toLocaleString()} completed · ${b.fullRepeats.toLocaleString()} full rewatches/rereads · Level ${info.level} · ${info.xp.toLocaleString()} XP`
    );
  }catch(e){
    console.error(e);
    finishDataProgress(false,'Sync failed',String(e?.message||e));
  }
}
App.calculateXPNow=v121CalculateXPNow;
App.syncNow=v121SyncNow;

// Final v121 Settings wrapper: surface repeat-unit and whole-title repeat rewards.
const v121SettingsBase=renderSettings;
renderSettings=function(){
  v121EnsureRepeatSettings();
  let h=v121SettingsBase();
  const l=levelingSettings(),r=v121RepeatXPBreakdown();

  h=h.replace(
    'Control XP from time, media units, Library additions, title edits, completed Library titles, logged completions, cover work, and rotation health.',
    'Control XP from time, media units, Library additions, title edits, completed Library titles, logged completions, rewatches/rereads, cover work, and rotation health.'
  );

  const rotationMarker='<div style="font-weight:700;font-size:12px;margin:14px 0 8px;">ROTATION XP MULTIPLIERS</div>';
  const repeatFields=`<div style="font-weight:700;font-size:12px;margin:14px 0 8px;">REWATCH / REREAD XP</div>
    <div class="field-row">
      <div class="field"><label class="field-label">Repeat episode bonus XP</label><input type="number" min="0" value="${l.repeatUnitXP?.episodes??10}" onchange="App.updateRepeatUnitXP('episodes',this.value)"></div>
      <div class="field"><label class="field-label">Repeat chapter bonus XP</label><input type="number" min="0" value="${l.repeatUnitXP?.chapters??3}" onchange="App.updateRepeatUnitXP('chapters',this.value)"></div>
    </div>
    <div class="field-row">
      <div class="field"><label class="field-label">Repeat issue bonus XP</label><input type="number" min="0" value="${l.repeatUnitXP?.issues??6}" onchange="App.updateRepeatUnitXP('issues',this.value)"></div>
      <div class="field"><label class="field-label">Repeat movie bonus XP</label><input type="number" min="0" value="${l.repeatUnitXP?.movies??30}" onchange="App.updateRepeatUnitXP('movies',this.value)"></div>
    </div>
    <div class="field"><label class="field-label">Full title rewatch / reread XP</label><input type="number" min="0" value="${l.fullRepeatXP??50}" onchange="App.updateLeveling('fullRepeatXP',this.value)"><small class="hint">Awarded each time your logged repeat units complete another full Library title. Regular minute/unit consumption XP still applies, so this is an additional repeat reward.</small></div>
    <div class="hint" style="margin:-4px 0 14px">Tracked repeats: <b>${r.repeatUnits.toLocaleString()}</b> repeat units · <b>${r.fullRepeats.toLocaleString()}</b> full rewatches/rereads · <b>${r.repeatBonusXP.toLocaleString()} XP</b> in repeat bonuses. Manual past-repeat corrections remain history-only and do not create repeat XP.</div>`;

  if(h.includes(rotationMarker) && !h.includes('Full title rewatch / reread XP')){
    h=h.replace(rotationMarker,repeatFields+rotationMarker);
  }

  h=h.replace(
    'Rescan the entire Library and History, recalculate consumption XP, verify every completed title, rebuild detectable logged-completion bonuses, and refresh every Level/XP display.',
    'Rescan the entire Library and History, recalculate consumption XP, verify every completed title, rebuild logged-completion bonuses, recalculate repeat-unit/full-rewatch XP, and refresh every Level/XP display.'
  );
  h=h.replace(
    'Merge cloud + local Library, History, Library History, completion data and all XP ledgers; then refresh progression/scheduler calculations and upload one complete protected state.',
    'Merge cloud + local Library, History, Library History, completion data, repeat data and all XP; then refresh progression/scheduler calculations and upload one complete protected state.'
  );
  return h;
};



