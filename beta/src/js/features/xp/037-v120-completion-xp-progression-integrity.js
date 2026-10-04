/* ============================================================
   MediaFlow v120 — Completion XP + Progression Integrity
   - Every currently completed Library title contributes configured completion XP.
   - Editing a title to Completed earns normal edit XP plus the completed-title XP.
   - Completing through a consumption log also earns a one-time logged-completion
     bonus, on top of consumption XP and completed-title XP, so logging completion
     is always more rewarding than changing the status manually.
   - Calculate XP now, Sync now, cloud merging, imports and full JSON backups are
     aware of all v120 XP sources and the complete state shape.
   ============================================================ */

DEFAULT_SETTINGS.leveling.libraryEditXP = Number.isFinite(Number(DEFAULT_SETTINGS.leveling.libraryEditXP)) ? Number(DEFAULT_SETTINGS.leveling.libraryEditXP) : 5;
DEFAULT_SETTINGS.leveling.manualCoverXP = Number.isFinite(Number(DEFAULT_SETTINGS.leveling.manualCoverXP)) ? Number(DEFAULT_SETTINGS.leveling.manualCoverXP) : 15;
DEFAULT_SETTINGS.leveling.loggingCompletionBonusXP = Number.isFinite(Number(DEFAULT_SETTINGS.leveling.loggingCompletionBonusXP)) ? Number(DEFAULT_SETTINGS.leveling.loggingCompletionBonusXP) : 25;

function v120EnsureXPState(){
  S.settings=S.settings||{};
  S.settings.leveling=Object.assign({},DEFAULT_SETTINGS.leveling,S.settings.leveling||{});
  S.settings.leveling.unitXP=Object.assign({},DEFAULT_SETTINGS.leveling.unitXP,S.settings.leveling.unitXP||{});
  S.settings.leveling.rotationMultiplier=Object.assign({},DEFAULT_SETTINGS.leveling.rotationMultiplier,S.settings.leveling.rotationMultiplier||{});
  S.xpLedger=Object.assign({libraryAdditions:{},libraryEdits:{},manualCovers:{},logCompletions:{}},S.xpLedger||{});
  for(const k of ['libraryAdditions','libraryEdits','manualCovers','logCompletions']){
    if(!S.xpLedger[k] || typeof S.xpLedger[k]!=='object' || Array.isArray(S.xpLedger[k])) S.xpLedger[k]={};
  }
}
function v120IsCompleted(item){
  return !!(item && (item.status==='completed' || (item.total!=null && Number(item.total)>0 && Number(item.progress)>=Number(item.total))));
}
function v120LoggedCompletionXP(){
  return Math.max(0,Math.round(Number(levelingSettings().loggingCompletionBonusXP)||0));
}
function v120AwardLoggedCompletionXP(itemId){
  if(!itemId || levelingSettings().enabled===false) return 0;
  v120EnsureXPState();
  const ledger=S.xpLedger.logCompletions;
  if(Object.prototype.hasOwnProperty.call(ledger,itemId)) return 0;
  const xp=v120LoggedCompletionXP();
  ledger[itemId]=xp; // Store even 0 so changing Settings later cannot re-award an old completion.
  return xp;
}
function v120SumLedger(name,ledger=S.xpLedger){
  return Object.values(ledger?.[name]||{}).reduce((a,v)=>a+(Number(v)||0),0);
}
function v120XPBreakdown(){
  v120EnsureXPState();
  const l=levelingSettings();
  const completed=v46CompletedLibraryCount();
  const sessionXP=(S.sessions||[]).reduce((a,s)=>a+sessionStoredXP(s),0);
  const titleXP=(l.enabled===false)?0:(S.library||[]).length*Math.max(0,Math.round(Number(l.libraryAdditionXP)||0));
  const completedXP=(l.enabled===false)?0:completed*Math.max(0,Math.round(Number(l.completionXP)||0));
  const editXP=v120SumLedger('libraryEdits');
  const coverXP=v120SumLedger('manualCovers');
  const loggedCompletionXP=v120SumLedger('logCompletions');
  return {total:sessionXP+titleXP+completedXP+editXP+coverXP+loggedCompletionXP,historyXP:sessionXP,libraryTitleXP:titleXP,completedTitleXP:completedXP,libraryEditXP:editXP,manualCoverXP:coverXP,loggedCompletionBonusXP:loggedCompletionXP,completedTitles:completed};
}

// v120 source of truth for event-based Library XP.
v46ExtraLibraryXP=function(){
  return v120SumLedger('libraryEdits')+v120SumLedger('manualCovers')+v120SumLedger('logCompletions');
};
libraryXPTotal=function(){ return v46LibraryBaseXP()+v46ExtraLibraryXP(); };

// Library History XP deltas now use the same XP model as the live level total,
// including completed-title XP and the v120 logged-completion bonus ledger.
v50SnapshotXP=function(x){
  if(!x)return null;
  const l=Object.assign({},DEFAULT_SETTINGS.leveling,S.settings?.leveling||{});
  const sessions=Array.isArray(x.sessions)?x.sessions:[];
  const library=Array.isArray(x.library)?x.library:[];
  const ledger=x.xpLedger||{};
  const sum=o=>Object.values(o||{}).reduce((a,v)=>a+(Number(v)||0),0);
  const sessionXP=sessions.reduce((a,s)=>{
    if(!s||s.status==='skipped')return a;
    const stored=Number(s.xp);
    if(Number.isFinite(stored)&&stored>0)return a+stored;
    const cat=getCategory(s.categoryId);
    return a+calculateConsumptionXP(cat,Number(s.actualAmount)||0,Number(s.minutes)||0,s.healthStatus||'healthy').xp;
  },0);
  if(l.enabled===false) return sessionXP;
  const add=Math.max(0,Math.round(Number(l.libraryAdditionXP)||0));
  const complete=Math.max(0,Math.round(Number(l.completionXP)||0));
  const completed=library.filter(v120IsCompleted).length;
  return sessionXP + library.length*add + completed*complete + sum(ledger.libraryEdits)+sum(ledger.manualCovers)+sum(ledger.logCompletions);
};

// Merge every XP ledger independently. Older sync code only deep-merged
// libraryAdditions, which could discard edit/cover/completion XP from another copy.
const v120MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v120MergeStatesBase(a,b)||{};
  const al=a?.xpLedger||{}, bl=b?.xpLedger||{};
  out.xpLedger=Object.assign({libraryAdditions:{},libraryEdits:{},manualCovers:{},logCompletions:{}},bl,al);
  for(const k of ['libraryAdditions','libraryEdits','manualCovers','logCompletions']) out.xpLedger[k]=Object.assign({},bl[k]||{},al[k]||{});
  const byKey=new Map();
  for(const x of [...(b?.completionTimeline||[]),...(a?.completionTimeline||[])]){
    if(!x||typeof x!=='object')continue;
    const key=x.libraryId||`${cleanTitle(x.title).toLowerCase()}::${x.categoryId||''}::${Number(x.completedAt)||0}`;
    const prev=byKey.get(key);
    if(!prev || Number(x.completedAt||0)>=Number(prev.completedAt||0)) byKey.set(key,Object.assign({},x));
  }
  out.completionTimeline=[...byKey.values()].sort((x,y)=>Number(y.completedAt||0)-Number(x.completedAt||0));
  return out;
};

// Apply the complete modern state shape during manual Sync/Import instead of
// dropping Library History, migrations or the saved profile name.
const v120ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  v120ApplyStateBase(d);
  d=d||{};
  S.activityLog=Array.isArray(d.activityLog)?d.activityLog:[];
  S.migrations=(d.migrations&&typeof d.migrations==='object')?d.migrations:{};
  S.profileName=String(d.profileName||'').trim();
  v120EnsureXPState();
};

function v120CompletionSnapshot(){
  return new Map((S.library||[]).filter(i=>i?.id).map(i=>[i.id,v120IsCompleted(i)]));
}
function v120NewlyCompleted(before){
  return (S.library||[]).filter(i=>i?.id && !before.get(i.id) && v120IsCompleted(i));
}
function v120SessionMatchesCompletion(item){
  if(!item?.id)return false;
  const completedAt=Number(item.completedAt)||0;
  const titleKey=cleanTitle(item.title).toLowerCase();
  return (S.sessions||[]).some(s=>{
    if(!s||s.status==='skipped')return false;
    const ts=Number(s.timestamp)||0;
    if(completedAt && Math.abs(ts-completedAt)>5*60*1000)return false;
    return (s.titles||[]).some(t=>String(t?.libraryId||'')===String(item.id) || (!t?.libraryId && cleanTitle(t?.title).toLowerCase()===titleKey && s.categoryId===item.categoryId));
  });
}
function v120RebuildLoggedCompletionLedger(){
  v120EnsureXPState();
  let added=0;
  for(const item of (S.library||[])){
    if(!v120IsCompleted(item) || Object.prototype.hasOwnProperty.call(S.xpLedger.logCompletions,item.id))continue;
    if(v120SessionMatchesCompletion(item)){v120AwardLoggedCompletionXP(item.id);added++;}
  }
  return added;
}

const v120RecalculateXPBase=v46RecalculateXP;
v46RecalculateXP=async function(force=false){
  v120EnsureXPState();
  await v120RecalculateXPBase(force);
  // Reconstruct a missing logged-completion bonus only when History provides
  // exact evidence that the completion happened through a MediaFlow log.
  v120RebuildLoggedCompletionLedger();
  return mediaFlowLevelInfo();
};

function v120CreditLoggedCompletions(before){
  const newly=v120NewlyCompleted(before);
  let bonus=0;
  for(const item of newly) bonus+=v120AwardLoggedCompletionXP(item.id);
  return {newly,bonus};
}
function v120AddBonusToLatestActivity(bonus){
  if(!bonus || !Array.isArray(S.activityLog))return;
  const recent=S.activityLog.find(x=>x && /log consumption/i.test(String(x.action||'')) && Date.now()-Number(x.timestamp||0)<10000);
  if(recent) recent.xpEarned=Math.max(0,Number(recent.xpEarned)||0)+bonus;
}

// Editing to Completed earns the regular edit XP plus the completed-title XP.
// The original saver already awards edit/manual-cover XP; this wrapper makes the
// completion delta visible and keeps the final toast aligned with the real level total.
const v120SaveLibraryModalBase=App.saveLibraryModal;
App.saveLibraryModal=function(id){
  const beforeItem=id?(S.library||[]).find(i=>i.id===id):null;
  const wasComplete=v120IsCompleted(beforeItem);
  const beforeXP=mediaFlowXP();
  const result=v120SaveLibraryModalBase.apply(this,arguments);
  const afterItem=id?(S.library||[]).find(i=>i.id===id):(S.library||[])[(S.library||[]).length-1];
  if(afterItem && !wasComplete && v120IsCompleted(afterItem)){
    const delta=Math.max(0,Math.round(mediaFlowXP()-beforeXP));
    if(delta)showToast(`Saved as completed · +${delta.toLocaleString()} XP`);
  }
  return result;
};

// The quick Status editor is also a real Library edit, so changing it earns the
// configured edit XP. Marking it Completed additionally activates completed-title XP.
const v120SetLibraryStatusBase=App.setLibraryStatus;
App.setLibraryStatus=function(id,value){
  const item=(S.library||[]).find(i=>i?.id===id);
  if(!item)return v120SetLibraryStatusBase.apply(this,arguments);
  const previous=String(item.status||'planned');
  const wasComplete=v120IsCompleted(item),beforeXP=mediaFlowXP();
  if(previous!==value)v44AwardEditXP(id);
  const result=v120SetLibraryStatusBase.apply(this,arguments);
  const after=(S.library||[]).find(i=>i?.id===id);
  const delta=Math.max(0,Math.round(mediaFlowXP()-beforeXP));
  if(delta){
    const suffix=!wasComplete&&v120IsCompleted(after)?' · completed-title XP included':'';
    showToast(`Title updated · +${delta.toLocaleString()} XP${suffix}`);
  }
  return result;
};

// Logging a completion earns consumption XP + completed-title XP + an additional
// one-time logged-completion bonus. This guarantees logging is the richer path.
const v120SubmitLogBase=App.submitLog;
App.submitLog=function(){
  const before=v120CompletionSnapshot(),beforeXP=mediaFlowXP();
  const result=v120SubmitLogBase.apply(this,arguments);
  const credit=v120CreditLoggedCompletions(before);
  if(credit.bonus){
    v120AddBonusToLatestActivity(credit.bonus);
    persistLibrary();
    render();
    const delta=Math.max(0,Math.round(mediaFlowXP()-beforeXP));
    showToast(`${credit.newly.length} title${credit.newly.length===1?'':'s'} completed by logging · +${delta.toLocaleString()} XP`);
  }
  return result;
};

const v120SubmitBatchLogBase=App.submitBatchLog;
App.submitBatchLog=function(){
  const before=v120CompletionSnapshot(),beforeXP=mediaFlowXP();
  const result=v120SubmitBatchLogBase.apply(this,arguments);
  const credit=v120CreditLoggedCompletions(before);
  if(credit.bonus){
    persistLibrary();
    render();
    const delta=Math.max(0,Math.round(mediaFlowXP()-beforeXP));
    showToast(`${credit.newly.length} title${credit.newly.length===1?'':'s'} completed by Batch Log · +${delta.toLocaleString()} XP`);
  }
  return result;
};

async function v120CalculateXPNow(){
  showDataProgress('Calculate XP now','Scanning the complete Library, completion state and History…',5);
  try{
    v120EnsureXPState();
    updateDataProgress(10,`Checking ${(S.library||[]).length.toLocaleString()} Library titles and ${(S.sessions||[]).length.toLocaleString()} History logs…`);
    await v46RecalculateXP(true);
    updateDataProgress(64,`Verifying ${v46CompletedLibraryCount().toLocaleString()} completed Library titles and logged-completion bonuses…`); await v46Yield();
    await v46RefreshSchedulerProgress();
    updateDataProgress(86,'Saving rebuilt progression and XP ledgers to cloud…');
    await saveState(); await saveQueue;
    const info=mediaFlowLevelInfo(),b=v120XPBreakdown();
    render();
    finishDataProgress(true,'XP calculation complete',`Level ${info.level} · ${info.xp.toLocaleString()} lifetime XP · ${b.completedTitles.toLocaleString()} completed titles · ${b.loggedCompletionBonusXP.toLocaleString()} logged-completion bonus XP`);
  }catch(e){console.error(e);finishDataProgress(false,'XP calculation failed',friendlyAuthError?.(e)||String(e?.message||e));}
}

async function v120SyncNow(){
  showDataProgress('Sync now','Preparing complete MediaFlow state and XP ledgers…',5);
  try{
    await saveQueue;
    updateDataProgress(13,'Reading protected cloud state…');
    const remote=await rawGet(STATE_KEY);
    updateDataProgress(27,'Merging Library, History, Library History, completions and XP ledgers…'); await v46Yield();
    const local=snapshot();
    const merged=remote?mergeStates(local,remote):local;
    v46ApplyState(merged);
    updateDataProgress(45,'Rechecking completed titles and progression…');
    await v46RecalculateXP(false);
    updateDataProgress(70,'Refreshing scheduler balance and health…'); await v46RefreshSchedulerProgress();
    updateDataProgress(87,'Uploading one complete protected cloud state…');
    await saveState(); await saveQueue;
    const info=mediaFlowLevelInfo(),b=v120XPBreakdown();
    render();
    finishDataProgress(true,'Sync complete',`${(S.library||[]).length.toLocaleString()} titles · ${(S.sessions||[]).length.toLocaleString()} logs · ${b.completedTitles.toLocaleString()} completed · Level ${info.level} · ${info.xp.toLocaleString()} XP`);
  }catch(e){console.error(e);finishDataProgress(false,'Sync failed',String(e?.message||e));}
}
App.calculateXPNow=v120CalculateXPNow;
App.syncNow=v120SyncNow;

// Final Settings wrapper: expose every active v120 XP source and keep the repair/
// sync descriptions accurate. Existing v44 fields remain; this only modernizes them.
const v120SettingsBase=renderSettings;
renderSettings=function(){
  v120EnsureXPState();
  let h=v120SettingsBase();
  const l=levelingSettings(),completed=v46CompletedLibraryCount(),completedValue=completed*Math.max(0,Math.round(Number(l.completionXP)||0));
  h=h.replace('Control how much XP you earn from time, media units, Library additions, completions, and rotation health.','Control XP from time, media units, Library additions, title edits, completed Library titles, logged completions, cover work, and rotation health.');
  h=h.replace('Completion bonus XP','Completed Library title XP');
  const completionField=`onchange="App.updateLeveling('completionXP',this.value)"></div>`;
  const loggedField=`<div class="field"><label class="field-label">Logged completion bonus XP</label><input type="number" min="0" value="${l.loggingCompletionBonusXP??25}" onchange="App.updateLeveling('loggingCompletionBonusXP',this.value)"><small class="hint">One-time extra bonus when a title becomes completed through normal logging or Batch Log. Consumption XP and completed-title XP are awarded separately, so logging completion earns more than a manual status edit.</small></div><div class="hint" style="margin:-4px 0 14px">Current Library: <b>${completed.toLocaleString()}</b> completed title${completed===1?'':'s'} = <b>${completedValue.toLocaleString()} XP</b> from Completed Library title XP.</div>`;
  if(h.includes(completionField) && !h.includes('Logged completion bonus XP'))h=h.replace(completionField,completionField+loggedField);
  h=h.replace('Force a full XP calculation from Library + History and refresh every Level/XP display.','Rescan the entire Library and History, recalculate consumption XP, verify every completed title, rebuild detectable logged-completion bonuses, and refresh every Level/XP display.');
  h=h.replace('Merge cloud + local data, refresh XP and scheduler calculations, then upload one complete optimized state.','Merge cloud + local Library, History, Library History, completion data and all XP ledgers; then refresh progression/scheduler calculations and upload one complete protected state.');
  return h;
};



