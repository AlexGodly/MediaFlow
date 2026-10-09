/* ============================================================
   MediaFlow v331 — Per-title logging timestamps (Personal Edition)
   ------------------------------------------------------------
   New title entries remember exactly when they were added to the
   logging queue. The session's existing group ID, XP, duration and
   scheduler accounting are unchanged. Pre-v331 rows use their original
   session timestamp. Manual Batch Log date changes override the day,
   retaining each title's own recorded local clock time.
   ============================================================ */
const V331_RUNTIME_VERSION=331;
MediaFlowRuntime.version=V331_RUNTIME_VERSION;
window.MediaFlowV331={version:331,base:330,feature:'Per-title timestamps within grouped logging sessions'};
function v331ValidTimestamp(value){
  const n=Number(value);
  return Number.isFinite(n)&&n>=946684800000&&n<=Date.now()+86400000?n:0;
}
function v331LocalDay(value){
  const d=new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function v331BatchTitleTimestamp(row,draft,date,fallback){
  const captured=v331ValidTimestamp(row?.loggedAt)||fallback;
  if(draft?.v331DateOverride===true&&/^\d{4}-\d{2}-\d{2}$/.test(String(date||''))){
    const clock=new Date(captured), parts=date.split('-').map(Number);
    const adjusted=new Date(parts[0],parts[1]-1,parts[2],clock.getHours(),clock.getMinutes(),clock.getSeconds(),clock.getMilliseconds());
    if(!Number.isNaN(adjusted.getTime())&&v331LocalDay(adjusted)===date)return adjusted.getTime();
  }
  return captured;
}
function v331EventDate(session,row){
  // Use each row's own day for its consumption card; the containing
  // session retains its original calendar group and Statistics count.
  const ts=v331ValidTimestamp(row?.loggedAt);
  const raw=String(session?.date||'');
  const day=/^\d{4}-\d{2}-\d{2}$/.test(raw)?new Date(`${raw}T12:00:00`):null;
  return ts?new Date(ts):day&&Number.isFinite(day.getTime())?day:new Date(Number(session?.timestamp)||Date.now());
}
function v331HistoryTime(session,row){
  const ts=v331ValidTimestamp(row?.loggedAt)||Number(session?.timestamp)||Date.now();
  return new Date(ts).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
}
function v331AddedAtLabel(entry){
  const ts=v331ValidTimestamp(entry?.loggedAt);
  return ts?`Added ${new Date(ts).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}`:'';
}
// A multi-category Dashboard submission has one sessionGroupId and a
// multi-title Batch Log has one batchGroupId. Count the user action once;
// do not alter the underlying per-category records or their XP values.
function v331LogicalSessionCount(sessions){
  const seen=new Set();
  for(const s of sessions||[]){
    if(!s)continue;
    const key=s.sessionGroupId?`session:${s.sessionGroupId}`:s.batchGroupId?`batch:${s.batchGroupId}`:`entry:${s.id||seen.size}`;
    seen.add(key);
  }
  return seen.size;
}
// Render additional timestamps without changing the v252/v242 visual title
// cards: each newly created v331 title card receives its own small label.
const v331RenderLogFormBase=renderLogForm;
renderLogForm=function(){
  let html=String(v331RenderLogFormBase.apply(this,arguments)||'');
  const entries=S.logDraft?.entries||[];
  if(!entries.length)return html;
  let index=0;
  return html.replace(/(<div class="v239-logged-title-copy">[\s\S]*?<\/small>)/g,(match)=>{
    const entry=entries[index++],label=v331AddedAtLabel(entry);
    return label?`${match}<small class="mf331-added-at" title="Timestamp captured when this title was added to logging">◷ ${escapeHtml(label)}</small>`:match;
  });
};
// Show times for selected Batch Log titles while respecting the existing
// complete Library browser and Last Progress controls.
const v331RenderBatchBase=renderBatchLog;
renderBatchLog=function(){
  let html=String(v331RenderBatchBase.apply(this,arguments)||'');
  const rows=S.batchDraft?.rows||[];
  let index=0;
  return html.replace(/(<div class="batch-selected-title">[\s\S]*?<\/div>)/g,(match)=>{
    const row=rows.filter(x=>x.libraryId)[index++],label=v331AddedAtLabel(row);
    return label?`${match}<small class="mf331-batch-added">◷ ${escapeHtml(label)}</small>`:match;
  });
};
