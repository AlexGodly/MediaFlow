/* MediaFlow v569 — a title's own unit and runtime in logging.
 *
 * v565 gave titles their own unit (mf565Unit) and runtime per unit
 * (mf565SecondsPerUnit). The itemized log already timed each unit with the
 * title's runtime, but three places still used the category's:
 *   - the log draft's minutes (quick logging: v179SyncSingleFromEntries),
 *   - Batch Log's default minutes in progress mode,
 *   - the unit's name in the itemized log ("Log another episode").
 * Now a title with its own unit and runtime counts its own runtime
 * (3 matches of 20 min = 60 min) and is shown in its own unit. Titles without
 * their own runtime keep the category's numbers exactly as before.
 * The MediaFlow app (7.1.1.569) does the same, and also uses the title's unit
 * and the open log's draft progress in its Discord status.
 */

/* One of the title's own units in seconds, or 0 (the category's applies). */
function mf569OwnSeconds(item){
  const own=Math.floor(Number(item?.mf565SecondsPerUnit)||0);
  return mf565OwnUnit(item)&&own>0?own:0;
}
/* Minutes for qty of a title's units. */
function mf569Minutes(item,cat,qty){
  const n=Math.max(0,Number(qty)||0);
  const own=mf569OwnSeconds(item);
  return own>0?Math.round(n*own/60):Math.round(n*(Number(cat?.minutesPerUnit)||0));
}

/* The unit's name in the itemized log: the title's own unit first. */
v369UnitType=function(item){
  const key=mf565UnitKey(item,getCategory(item?.categoryId));
  const singular=UNITS[key]?(UNITS[key].singular||'unit'):(mf565Singular(key)||'unit');
  return singular.charAt(0).toUpperCase()+singular.slice(1);
};

/* The log draft's amount and minutes (quick logging). */
v179SyncSingleFromEntries=function(){
  if(!S.logDraft)return;
  const entries=S.logDraft.entries||[];
  let amount=0,minutes=0;
  for(const entry of entries){
    const qty=Math.max(0,Number(entry.qty)||0);
    amount+=qty;
    const item=entry.libraryId?S.library.find(i=>i.id===entry.libraryId):null;
    const cat=item?getCategory(item.categoryId):getCategory(S.currentTask?.categoryId||'');
    minutes+=mf569Minutes(item,cat,qty);
  }
  S.logDraft.amount=amount;
  S.logDraft.minutes=minutes;
  refreshXPPreview();
};

/* Batch Log (progress mode): default minutes from the title's runtime. */
function mf569FixBatchRow(row){
  if(!row?.libraryId)return false;
  const item=S.library.find(x=>x.id===row.libraryId);
  if(!item||!mf569OwnSeconds(item))return false;
  row.minutes=mf569Minutes(item,getCategory(item.categoryId),row.qty);
  return true;
}
const mf569SetLogModeBase=v179SetLogMode;
v179SetLogMode=function(kind,mode){
  const result=mf569SetLogModeBase.apply(this,arguments);
  if(kind==='batch'&&v179Mode('batch')==='progress'&&S.batchDraft?.rows)for(const row of S.batchDraft.rows)mf569FixBatchRow(row);
  return result;
};
const mf569UpdateBatchProgressBase=v179UpdateBatchProgress;
v179UpdateBatchProgress=function(i){
  const result=mf569UpdateBatchProgressBase.apply(this,arguments);
  mf569FixBatchRow(S.batchDraft?.rows?.[i]);
  return result;
};
App.v179SetLogMode=v179SetLogMode;
App.v179UpdateBatchProgress=v179UpdateBatchProgress;
const mf569SelectBatchTitleBase=App.selectBatchTitle;
App.selectBatchTitle=function(i){
  const result=mf569SelectBatchTitleBase.apply(this,arguments);
  if(v179Mode('batch')==='progress'&&mf569FixBatchRow(S.batchDraft?.rows?.[i]))render();
  return result;
};
const mf569SubmitBatchLogBase=App.submitBatchLog;
App.submitBatchLog=function(){
  // Rows still without minutes get the title's runtime before the save fills
  // them with the category's.
  if(v179Mode('batch')==='progress'&&S.batchDraft?.rows){
    for(const row of S.batchDraft.rows){
      if(!row?.libraryId||Number(row.minutes)>0)continue;
      const item=S.library.find(x=>x.id===row.libraryId);
      if(!item||!mf569OwnSeconds(item))continue;
      const start=Number.isFinite(Number(row.v179StartProgress))?Math.max(0,Number(row.v179StartProgress)):v179StartProgress(item);
      const end=v179ClampEndProgress(item,row.v179EndProgress);
      const qty=v179CalculatedQty(item,start,end);
      if(qty>0)row.minutes=mf569Minutes(item,getCategory(item.categoryId),qty);
    }
  }
  return mf569SubmitBatchLogBase.apply(this,arguments);
};

if(typeof window!=='undefined'){
  window.MediaFlowV569={ownSeconds:mf569OwnSeconds,minutes:mf569Minutes};
}
