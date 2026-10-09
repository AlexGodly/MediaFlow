/* ============================================================
   MediaFlow v134 — Calculate XP + Sync Now Performance
   ------------------------------------------------------------
   Behavior / XP formulas are unchanged. The heavy repair/sync path now:
   - indexes completion evidence once instead of rescanning all History per title;
   - uses O(1) Library-ID lookups for repeat History instead of repeated .find();
   - time-slices large History / Library loops so Chromium can repaint;
   - removes the redundant first scheduler-balance pass;
   - prevents Calculate XP and Sync Now from overlapping;
   - reuses one full-state JSON serialization for cloud compression + v115 caches.
   ============================================================ */

let V134_HEAVY_OPERATION='';

function v134Yield(){
  return new Promise(resolve=>{
    if(typeof requestAnimationFrame==='function'){
      requestAnimationFrame(()=>setTimeout(resolve,0));
    }else{
      setTimeout(resolve,0);
    }
  });
}

function v134ProgressRange(start,end,ratio){
  const a=Number(start)||0,b=Number(end)||a;
  return Math.round(a+(b-a)*Math.max(0,Math.min(1,Number(ratio)||0)));
}

function v134LegacyCompletionKey(title,categoryId){
  // Preserve v120's strict category equality by keeping category type in the key.
  return `${cleanTitle(title).toLowerCase()}::${typeof categoryId}:${String(categoryId??'')}`;
}

async function v134BuildCompletionEvidenceIndex(progressStart,progressEnd){
  const byId=new Map(),byLegacy=new Map();
  const sessions=S.sessions||[];
  const total=Math.max(1,sessions.length);

  const push=(map,key,ts)=>{
    if(!key)return;
    let arr=map.get(key);
    if(!arr){arr=[];map.set(key,arr);}
    arr.push(ts);
  };

  for(let i=0;i<sessions.length;i++){
    const s=sessions[i];
    if(s && s.status!=='skipped'){
      const ts=Number(s.timestamp)||0;
      for(const t of (s.titles||[])){
        // v120 could match by Library ID even when an old History title string
        // was empty/missing. Preserve that exact behavior; title is required
        // only for the legacy no-ID fallback.
        if(t?.libraryId){
          push(byId,String(t.libraryId),ts);
        }else if(t?.title){
          push(byLegacy,v134LegacyCompletionKey(t.title,s.categoryId),ts);
        }
      }
    }

    if(i && i%300===0){
      updateDataProgress(
        v134ProgressRange(progressStart,progressEnd,i/total),
        `Indexing completion History… ${i.toLocaleString()} / ${sessions.length.toLocaleString()}`
      );
      await v134Yield();
    }
  }

  return {byId,byLegacy};
}

function v134HasCompletionEvidence(list,completedAt){
  if(!list || !list.length)return false;
  const target=Number(completedAt)||0;
  if(!target)return true;
  const windowMs=5*60*1000;
  for(const ts of list){
    if(Math.abs((Number(ts)||0)-target)<=windowMs)return true;
  }
  return false;
}

async function v134RebuildLoggedCompletionLedger(progressStart,progressEnd){
  v120EnsureXPState();

  // v120AwardLoggedCompletionXP intentionally awards nothing while leveling is off.
  // Preserve that behavior and avoid building a large index unnecessarily.
  if(levelingSettings().enabled===false)return 0;

  const indexEnd=progressStart+(progressEnd-progressStart)*0.58;
  const index=await v134BuildCompletionEvidenceIndex(progressStart,indexEnd);
  const library=S.library||[];
  const total=Math.max(1,library.length);
  const ledger=S.xpLedger.logCompletions;
  const xp=v120LoggedCompletionXP();
  let added=0;

  for(let i=0;i<library.length;i++){
    const item=library[i];
    if(item?.id && v120IsCompleted(item) && !Object.prototype.hasOwnProperty.call(ledger,item.id)){
      const completedAt=Number(item.completedAt)||0;
      const idMatch=v134HasCompletionEvidence(index.byId.get(String(item.id)),completedAt);
      const legacyMatch=idMatch?false:v134HasCompletionEvidence(
        index.byLegacy.get(v134LegacyCompletionKey(item.title,item.categoryId)),
        completedAt
      );

      if(idMatch||legacyMatch){
        // Same one-time ledger semantics as v120AwardLoggedCompletionXP,
        // but state/settings were already normalized once above.
        ledger[item.id]=xp;
        added++;
      }
    }

    if(i && i%750===0){
      updateDataProgress(
        v134ProgressRange(indexEnd,progressEnd,i/total),
        `Checking completed titles… ${i.toLocaleString()} / ${library.length.toLocaleString()}`
      );
      await v134Yield();
    }
  }
  return added;
}

function v134LibraryById(){
  const map=new Map();
  for(const item of (S.library||[])){
    const key=String(item?.id||'');
    // Array.find() returned the first match in v121; retain that exact preference.
    if(key && !map.has(key))map.set(key,item);
  }
  return map;
}

function v134PrepareRepeatRows(){
  return (S.sessions||[]).map((s,index)=>({
    s,
    index,
    time:v121SessionTime(s)
  })).sort((a,b)=>{
    const d=a.time-b.time;
    return d||a.index-b.index;
  });
}

function v134RepeatContext(){
  v121EnsureRepeatSettings();
  const l=levelingSettings();
  return {
    l,
    enabled:l.enabled!==false,
    libraryById:v134LibraryById(),
    running:new Map(),
    repeatUnits:0,
    fullRepeats:0,
    unitBonusXP:0,
    fullRepeatBonusXP:0,
    repeatSessions:0
  };
}

function v134ProcessRepeatRow(row,ctx){
  const s=row?.s;
  if(!s || s.status==='skipped')return;

  let sessionUnits=0,sessionFull=0,sessionUnitXP=0,sessionFullXP=0;

  for(const t of (s.titles||[])){
    if(!t?.repeat)continue;
    const qty=Math.max(0,Number(t.qty)||0);
    if(qty<=0)continue;

    const item=t.libraryId?ctx.libraryById.get(String(t.libraryId))||null:null;
    const unit=getCategory(item?.categoryId||s.categoryId)?.unit||s.unit||'';
    const perUnit=ctx.enabled?Math.max(0,Number(ctx.l.repeatUnitXP?.[unit])||0):0;

    sessionUnits+=qty;
    sessionUnitXP+=qty*perUnit;

    const key=v121RepeatKey(t,s);
    if(key){
      const before=Number(ctx.running.get(key))||0;
      const after=before+qty;
      const total=v121RepeatTotal(t,s,item,unit);
      if(total>0){
        const crossed=Math.max(0,Math.floor(after/total)-Math.floor(before/total));
        if(crossed>0){
          sessionFull+=crossed;
          sessionFullXP+=ctx.enabled?crossed*Math.max(0,Number(ctx.l.fullRepeatXP)||0):0;
        }
      }
      ctx.running.set(key,after);
    }
  }

  if(sessionUnits>0){
    ctx.repeatSessions++;
    const cat=getCategory(s.categoryId);
    const base=calculateConsumptionXP(
      cat,
      Number(s.actualAmount)||0,
      Number(s.minutes)||0,
      s.healthStatus||'healthy'
    ).xp;

    s.repeatUnits=sessionUnits;
    s.fullRepeatsCompleted=sessionFull;
    s.repeatUnitBonusXP=Math.max(0,Math.round(sessionUnitXP));
    s.repeatFullTitleXP=Math.max(0,Math.round(sessionFullXP));
    s.repeatBonusXP=s.repeatUnitBonusXP+s.repeatFullTitleXP;
    s.xp=Math.max(0,Math.round(base+s.repeatBonusXP));

    ctx.repeatUnits+=sessionUnits;
    ctx.fullRepeats+=sessionFull;
    ctx.unitBonusXP+=s.repeatUnitBonusXP;
    ctx.fullRepeatBonusXP+=s.repeatFullTitleXP;
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

function v134RepeatSummary(ctx){
  return {
    repeatSessions:ctx.repeatSessions,
    repeatUnits:ctx.repeatUnits,
    fullRepeats:ctx.fullRepeats,
    repeatUnitBonusXP:Math.max(0,Math.round(ctx.unitBonusXP)),
    fullRepeatBonusXP:Math.max(0,Math.round(ctx.fullRepeatBonusXP)),
    repeatBonusXP:Math.max(0,Math.round(ctx.unitBonusXP+ctx.fullRepeatBonusXP))
  };
}

// Replace v121's synchronous implementation too, so normal repeat logging/startup
// benefits from indexed Library lookups without changing its synchronous callers.
v121RecalculateRepeatXPHistory=function(){
  const ctx=v134RepeatContext();
  const rows=v134PrepareRepeatRows();
  for(const row of rows)v134ProcessRepeatRow(row,ctx);
  return v134RepeatSummary(ctx);
};

async function v134RecalculateRepeatXPHistoryAsync(progressStart,progressEnd){
  const ctx=v134RepeatContext();
  const rows=v134PrepareRepeatRows();
  const total=Math.max(1,rows.length);

  for(let i=0;i<rows.length;i++){
    v134ProcessRepeatRow(rows[i],ctx);
    if(i && i%300===0){
      updateDataProgress(
        v134ProgressRange(progressStart,progressEnd,i/total),
        `Rebuilding rewatch / reread XP… ${i.toLocaleString()} / ${rows.length.toLocaleString()}`
      );
      await v134Yield();
    }
  }
  return v134RepeatSummary(ctx);
}

async function v134RecalculateXPOptimized(force=false,range={}){
  const start=Number(range.start??10);
  const historyEnd=Number(range.historyEnd??54);
  const completionEnd=Number(range.completionEnd??72);const repeatEnd=Number(range.repeatEnd??84);

  v120EnsureXPState();

  // Stage 1 — same v46 session-XP formula, but with shorter browser time slices.
  const sessions=S.sessions||[];
  const totalSessions=Math.max(1,sessions.length);
  for(let i=0;i<sessions.length;i++){
    const x=sessions[i];
    if(!x || x.status==='skipped'){
      if(x)x.xp=0;
    }else{
      const should=force ||
        !Number.isFinite(Number(x.xp)) ||
        (Number(x.xp)===0 && (Number(x.actualAmount)||0)>0 && (Number(x.minutes)||0)>0);
      if(should){
        const cat=getCategory(x.categoryId);
        x.xp=calculateConsumptionXP(
          cat,
          Number(x.actualAmount)||0,
          Number(x.minutes)||0,
          x.healthStatus||'healthy'
        ).xp;
      }
    }

    if(i && i%300===0){
      updateDataProgress(
        v134ProgressRange(start,historyEnd,i/totalSessions),
        `Calculating History XP… ${i.toLocaleString()} / ${sessions.length.toLocaleString()}`
      );
      await v134Yield();
    }
  }

  // Stage 2 — same v46 completion-timeline repair, time-sliced for large libraries.
  S.completionTimeline=Array.isArray(S.completionTimeline)?S.completionTimeline:[];
  const seen=new Set(S.completionTimeline.map(x=>x?.libraryId).filter(Boolean));
  const library=S.library||[];
  const totalLibrary=Math.max(1,library.length);
  const timelineEnd=historyEnd+(completionEnd-historyEnd)*0.20;

  for(let i=0;i<library.length;i++){
    const item=library[i];
    const complete=item && (
      item.status==='completed' ||
      (item.total!=null && Number(item.total)>0 && Number(item.progress)>=Number(item.total))
    );
    if(complete && !seen.has(item.id)){
      S.completionTimeline.push({
        libraryId:item.id,
        title:cleanTitle(item.title),
        categoryId:item.categoryId,
        completedAt:item.completedAt||item.createdAt||Date.now()
      });
      seen.add(item.id);
    }

    if(i && i%750===0){
      updateDataProgress(
        v134ProgressRange(historyEnd,timelineEnd,i/totalLibrary),
        `Checking completion timeline… ${i.toLocaleString()} / ${library.length.toLocaleString()}`
      );
      await v134Yield();
    }
  }

  // Stage 3 — v120 logged-completion reconstruction using one History index.
  await v134RebuildLoggedCompletionLedger(timelineEnd,completionEnd);

  // Stage 4 — v121 repeat XP with a one-time Library ID map + browser yields.
  await v134RecalculateRepeatXPHistoryAsync(completionEnd,repeatEnd);

  updateDataProgress(repeatEnd,'Finalizing progression totals…');
  await v134Yield();
  return mediaFlowLevelInfo();
}

// Make every current/future caller of the progression-repair function use v134.
v46RecalculateXP=v134RecalculateXPOptimized;

// v46 used to evaluate categoryBalance for every category and then computeScores(),
// which immediately evaluated those balances a second time. computeScores() already
// exercises the complete scheduler formula, so remove that redundant full-history pass.
v46RefreshSchedulerProgress=async function(){
  await v134Yield();
  computeScores([]);
  await v134Yield();
};

function v134OperationBusy(name){
  if(!V134_HEAVY_OPERATION)return false;
  showToast(`${V134_HEAVY_OPERATION==='xp'?'Calculate XP':'Sync Now'} is already running. Please let it finish.`);
  return true;
}

async function v134CalculateXPNow(){
  if(v134OperationBusy('xp'))return;
  V134_HEAVY_OPERATION='xp';
  showDataProgress('Calculate XP now','Preparing optimized progression scan…',4);

  try{
    v120EnsureXPState();
    updateDataProgress(
      8,
      `Checking ${(S.library||[]).length.toLocaleString()} Library titles and ${(S.sessions||[]).length.toLocaleString()} History logs…`
    );

    await v134RecalculateXPOptimized(true,{
      start:10,
      historyEnd:52,
      completionEnd:72,
      repeatEnd:84
    });

    updateDataProgress(87,'Refreshing scheduler balance and health…');
    await v46RefreshSchedulerProgress();

    updateDataProgress(94,'Saving rebuilt progression to protected cloud storage…');
    await saveState();
    await saveQueue;

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
  }finally{
    V134_HEAVY_OPERATION='';
  }
}

async function v134SyncNow(){
  if(v134OperationBusy('sync'))return;
  V134_HEAVY_OPERATION='sync';
  showDataProgress('Sync now','Preparing optimized protected synchronization…',4);

  try{
    await saveQueue;

    updateDataProgress(9,'Reading protected cloud state…');
    const remote=await rawGet(STATE_KEY);
    await v134Yield();

    updateDataProgress(20,'Preparing local snapshot…');
    const local=snapshot();
    await v134Yield();

    updateDataProgress(27,'Merging cloud + local Library, History and XP ledgers…');
    const merged=remote?mergeStates(local,remote):local;
    await v134Yield();

    updateDataProgress(34,'Applying merged MediaFlow state…');
    v46ApplyState(merged);
    await v134Yield();

    await v134RecalculateXPOptimized(false,{
      start:38,
      historyEnd:58,
      completionEnd:72,
      repeatEnd:83
    });

    updateDataProgress(87,'Refreshing scheduler balance and health…');
    await v46RefreshSchedulerProgress();

    updateDataProgress(94,'Uploading one complete protected cloud state…');
    await saveState();
    await saveQueue;

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
  }finally{
    V134_HEAVY_OPERATION='';
  }
}

App.calculateXPNow=v134CalculateXPNow;
App.syncNow=v134SyncNow;


