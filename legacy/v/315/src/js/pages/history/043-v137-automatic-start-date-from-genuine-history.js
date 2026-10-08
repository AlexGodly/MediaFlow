/* ============================================================
   MediaFlow v137 — Automatic Start Date from genuine History
   ------------------------------------------------------------
   Rules:
   - a real title log can automatically create Start Date when it is blank;
   - existing progress does not prevent Start Date creation;
   - the earliest genuine matching History date is preferred;
   - later logs never push Start Date forward;
   - an automatically-created Start Date can move earlier when older genuine
     History is later added/backdated;
   - manual, MAL-imported, and legacy pre-v137 Start Dates are protected;
   - repeat/rewatch/reread logs do not become a title's original Start Date.
   ============================================================ */

function v137HistoryTimestamp(session){
  if(!session)return 0;

  // The editable History date is authoritative for day-level lifecycle data.
  // This lets backdating an existing History row move an automatic Start Date
  // earlier without rewriting the session's original technical timestamp.
  const raw=String(session.date||'').trim().slice(0,10);
  const fromDate=/^\d{4}-\d{2}-\d{2}$/.test(raw)?Number(v135ParseDateInput(raw))||0:0;
  if(fromDate)return fromDate;

  return Number(session.timestamp)||0;
}

function v137HistoryTitleMatches(item,session,titleRow){
  if(!item || !session || !titleRow)return false;

  if(titleRow.libraryId){
    return String(titleRow.libraryId)===String(item.id);
  }

  return (
    cleanTitle(titleRow.title||'').toLowerCase()===cleanTitle(item.title||'').toLowerCase() &&
    String(session.categoryId||'')===String(item.categoryId||'')
  );
}

function v137IsGenuineStartEvidence(item,session,titleRow){
  if(!session || session.status==='skipped' || !titleRow)return false;

  // Rewatch/reread history belongs to repeat tracking, not the original start.
  if(titleRow.repeat)return false;

  if(!v137HistoryTitleMatches(item,session,titleRow))return false;

  const qtyRaw=titleRow.qty ?? titleRow.amount;
  const hasQty=qtyRaw!==undefined && qtyRaw!==null && qtyRaw!=='';
  if(hasQty && Number(qtyRaw)<=0)return false;

  const consumed=(Number(session.actualAmount)||0)>0 || (Number(session.minutes)||0)>0 || (hasQty && Number(qtyRaw)>0);
  return consumed;
}

function v137EarliestGenuineStart(item){
  if(!item?.id)return 0;

  let earliest=Infinity;
  for(const session of (S.sessions||[])){
    if(!session || session.status==='skipped')continue;

    for(const titleRow of (session.titles||[])){
      if(!v137IsGenuineStartEvidence(item,session,titleRow))continue;
      const ts=v137HistoryTimestamp(session);
      if(ts>0 && ts<earliest)earliest=ts;
    }
  }

  return Number.isFinite(earliest)?earliest:0;
}

function v137CanAutoChangeStart(item){
  if(!item)return false;

  // No date yet: v137 may establish it.
  if(!(Number(item.startedAt)>0))return true;

  // Only dates explicitly created by the automatic History system are allowed
  // to move earlier. A source-less pre-v137 date is treated as protected legacy
  // data so v137 never silently changes an old manual/imported date.
  return String(item.startedAtSource||'')==='auto';
}

function v137ReconcileStartDate(item){
  if(!item || !v137CanAutoChangeStart(item))return false;

  const earliest=v137EarliestGenuineStart(item);
  if(!earliest)return false;

  const current=Number(item.startedAt)||0;
  if(current>0 && earliest>=current)return false;

  item.startedAt=earliest;
  item.startedAtSource='auto';
  item.modifiedAt=Date.now();
  return true;
}

function v137ResolveHistoryTitle(session,titleRow){
  if(!titleRow)return null;

  if(titleRow.libraryId){
    const byId=(S.library||[]).find(i=>String(i?.id||'')===String(titleRow.libraryId));
    if(byId)return byId;
  }

  const titleKey=cleanTitle(titleRow.title||'').toLowerCase();
  if(!titleKey)return null;

  const sameCategory=(S.library||[]).find(i=>
    cleanTitle(i?.title||'').toLowerCase()===titleKey &&
    String(i?.categoryId||'')===String(session?.categoryId||'')
  );
  if(sameCategory)return sameCategory;

  const all=(S.library||[]).filter(i=>cleanTitle(i?.title||'').toLowerCase()===titleKey);
  return all.length===1?all[0]:null;
}

function v137AffectedItemsFromSessions(sessions){
  const map=new Map();

  for(const session of (sessions||[])){
    if(!session || session.status==='skipped')continue;

    for(const titleRow of (session.titles||[])){
      if(titleRow?.repeat)continue;
      const item=v137ResolveHistoryTitle(session,titleRow);
      if(item?.id)map.set(String(item.id),item);
    }
  }

  return [...map.values()];
}

function v137ReconcileStartsForSessions(sessions){
  let changed=0;
  for(const item of v137AffectedItemsFromSessions(sessions)){
    if(v137ReconcileStartDate(item))changed++;
  }
  return changed;
}

// Final wrapper for normal logging.
// This works even when a title already had progress before MediaFlow knew its
// Start Date, and it does not require Update Library to be enabled because the
// genuine History row itself is sufficient evidence of when MediaFlow saw it.
const v137SubmitLogBase=App.submitLog;
App.submitLog=function(){
  const before=new Set((S.sessions||[]).map(s=>s?.id).filter(Boolean));
  const result=v137SubmitLogBase.apply(this,arguments);

  const added=(S.sessions||[]).filter(s=>s?.id&&!before.has(s.id));
  const changed=v137ReconcileStartsForSessions(added);

  if(changed){
    persistLibrary();
    render();
  }

  return result;
};

// Batch Log can be backdated, so its entered day becomes valid Start-Date
// evidence. If older matching History already exists, that earlier day wins.
const v137SubmitBatchLogBase=App.submitBatchLog;
App.submitBatchLog=function(){
  const before=new Set((S.sessions||[]).map(s=>s?.id).filter(Boolean));
  const result=v137SubmitBatchLogBase.apply(this,arguments);

  const added=(S.sessions||[]).filter(s=>s?.id&&!before.has(s.id));
  const changed=v137ReconcileStartsForSessions(added);

  if(changed){
    persistLibrary();
    render();
  }

  return result;
};

// Editing a History date can reveal an earlier genuine starting day.
// Automatic dates may move backward only; manual/MAL/legacy dates stay fixed.
const v137SaveSessionModalBase=App.saveSessionModal;
App.saveSessionModal=function(id){
  const before=(S.sessions||[]).find(s=>s?.id===id);
  const beforeCopy=before?Object.assign({},before,{titles:(before.titles||[]).map(t=>Object.assign({},t))}):null;

  const result=v137SaveSessionModalBase.apply(this,arguments);
  const after=(S.sessions||[]).find(s=>s?.id===id);

  const changed=v137ReconcileStartsForSessions([beforeCopy,after].filter(Boolean));
  if(changed){
    persistLibrary();
    render();
  }

  return result;
};



