/* MediaFlow v577 — the Batch Log draft is saved to your account.
 *
 * Rows, amounts, minutes, progress, parts, the date, the time and the note
 * of an unfinished Batch Log follow you to every device, like the logging
 * workspace's draft (v285 / v561): saved with the account as
 *   resumeStateV285.mf577Batch = {draft:{rows, note, date, mf573Time, v179Mode}, modifiedAt}
 * (a record of its own on per-record accounts), newer wins, and an open Batch
 * Log picks up changes from another device within a few seconds. The
 * MediaFlow app's multi-title Log any title uses the same draft (9.0.0.577).
 */
const MF577_BATCH={timer:0,poll:0,since:'',busy:false,applied:0};
const MF577_BATCH_ID=typeof MF556_SEP!=='undefined'?'resumeStateV285'+MF556_SEP+'mf577Batch':'';
const MF577_ROW_KEYS=['libraryId','query','qty','minutes','loggedAt','v179StartProgress','v179EndProgress','mf577Parts','mf577MinutesManual','v331TimestampOverride'];

function mf577BatchRowClean(r){
  const out={};
  for(const k of MF577_ROW_KEYS)if(r&&r[k]!==undefined)out[k]=v285Clone(r[k],r[k]);
  if(out.libraryId==null)out.libraryId='';
  return out;
}
function mf577BatchDraftClean(d){
  const x=d&&typeof d==='object'?d:{};
  const out={rows:(Array.isArray(x.rows)?x.rows:[]).filter(r=>r&&typeof r==='object').slice(0,200).map(mf577BatchRowClean),
    note:String(x.note||'').slice(0,2000),date:/^\d{4}-\d{2}-\d{2}$/.test(String(x.date||''))?String(x.date):''};
  if(/^\d{1,2}:\d{2}$/.test(String(x.mf573Time||'')))out.mf573Time=String(x.mf573Time);
  if(x.v179Mode==='progress'||x.v179Mode==='amount')out.v179Mode=x.v179Mode;
  return out;
}
function mf577BatchNorm(raw){
  const x=raw&&typeof raw==='object'?raw:{};
  return {draft:mf577BatchDraftClean(x.draft),modifiedAt:Math.max(0,Number(x.modifiedAt)||0)};
}
function mf577BatchEmpty(d){return !(d?.rows||[]).some(r=>r?.libraryId)&&!String(d?.note||'').trim();}

/* The resume record keeps the Batch Log section. */
const mf577NormalizeResumeBase=v285NormalizeResume;
v285NormalizeResume=function(raw){
  const out=mf577NormalizeResumeBase.apply(this,arguments);
  if(raw&&raw.mf577Batch&&typeof raw.mf577Batch==='object'){
    out.mf577Batch=mf577BatchNorm(raw.mf577Batch);
    out.modifiedAt=Math.max(out.modifiedAt,out.mf577Batch.modifiedAt);
  }
  return out;
};
const mf577SnapshotBase=snapshot;
snapshot=function(){
  const out=mf577SnapshotBase.apply(this,arguments)||{};
  const mine=S.v285ResumeState?.mf577Batch;
  if(mine&&out.resumeStateV285){
    // The live draft, at the time it was last changed.
    out.resumeStateV285.mf577Batch={draft:mf577BatchDraftClean(S.batchDraft||mine.draft),modifiedAt:Number(mine.modifiedAt)||0};
  }
  return out;
};
const mf577MergeBase=mergeStates;
mergeStates=function(a,b){
  const out=mf577MergeBase.apply(this,arguments)||{};
  const x=a?.resumeStateV285?.mf577Batch,y=b?.resumeStateV285?.mf577Batch;
  if(x||y){
    const nx=mf577BatchNorm(x),ny=mf577BatchNorm(y),win=ny.modifiedAt>nx.modifiedAt?ny:nx;
    out.resumeStateV285=out.resumeStateV285||{};
    out.resumeStateV285.mf577Batch=win;
    out.resumeStateV285.modifiedAt=Math.max(Number(out.resumeStateV285.modifiedAt)||0,win.modifiedAt);
  }
  return out;
};
function mf577BatchTyping(){
  const el=document.activeElement;
  return !!(el&&/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)&&el.closest?.('#mf565-batch,.page-batch,.batch-log-list,.batch-log-meta'));
}
function mf577BatchOpen(){
  return S.view==='batch'||(typeof MF565_QUICK!=='undefined'&&MF565_QUICK.batchOpen===true);
}
/* A newer draft from the account (another device) replaces this one. */
function mf577BatchAdopt(incoming){
  const next=mf577BatchNorm(incoming),st=v285EnsureResumeState(),cur=mf577BatchNorm(st.mf577Batch);
  if(!(next.modifiedAt>cur.modifiedAt))return false;
  st.mf577Batch=next;st.modifiedAt=Math.max(Number(st.modifiedAt)||0,next.modifiedAt);
  S.v285ResumeState=st;
  S.batchDraft={...mf577BatchDraftClean(next.draft)};
  if(!S.batchDraft.date)S.batchDraft.date=todayISO();
  try{v285WriteLocalResume(st);}catch(_){}
  MF577_BATCH.applied++;
  return true;
}
const mf577ApplyStateBase=v46ApplyState;
v46ApplyState=function(data){
  const out=mf577ApplyStateBase.apply(this,arguments);
  try{
    const incoming=data?.resumeStateV285?.mf577Batch;
    if(incoming&&mf577BatchAdopt(incoming)&&mf577BatchOpen()&&!mf577BatchTyping())setTimeout(()=>{try{render();}catch(_){}},0);
  }catch(_){}
  return out;
};
/* Every change to the draft is saved (debounced) with its time. */
function mf577BatchTouch(delay=650){
  clearTimeout(MF577_BATCH.timer);
  MF577_BATCH.timer=setTimeout(()=>{
    const st=v285EnsureResumeState(),now=Date.now();
    const draft=mf577BatchDraftClean(S.batchDraft||{});
    const prev=st.mf577Batch?mf577BatchNorm(st.mf577Batch):null;
    if(prev&&JSON.stringify(prev.draft)===JSON.stringify(draft))return;
    if(!prev&&mf577BatchEmpty(draft))return;
    st.mf577Batch={draft,modifiedAt:now};
    st.modifiedAt=Math.max(Number(st.modifiedAt)||0,now);
    S.v285ResumeState=st;
    try{v285WriteLocalResume(st);}catch(_){}
    v285ScheduleCloudSave(0);
  },Math.max(0,delay));
}
for(const name of ['addBatchRow','removeBatchRow','selectBatchTitle','updateBatchRow','v179UpdateBatchProgress','clearBatchLog',
  'submitBatchLog','mf573SetBatchTime','mf577BatchToggle','mf577BatchSet','v179SetLogMode']){
  const base=App[name];
  if(typeof base!=='function')continue;
  App[name]=function(){
    const out=base.apply(this,arguments);
    if(out&&typeof out.then==='function')return out.finally(()=>mf577BatchTouch(name==='submitBatchLog'?0:650));
    mf577BatchTouch(name==='submitBatchLog'||name==='clearBatchLog'?0:650);
    return out;
  };
}
for(const type of ['input','change'])document.addEventListener(type,e=>{
  if(e.target?.closest?.('#mf565-batch,.page-batch,.batch-log-meta,.batch-log-list'))mf577BatchTouch();
},true);

/* Live: an open Batch Log follows the draft on other devices. */
async function mf577BatchTick(){
  if(MF577_BATCH.busy||!MF577_BATCH_ID||!mf577BatchOpen())return;
  if(typeof MF556==='undefined'||!MF556.migrated||!AUTH_USER||!supabase||!navigator.onLine||document.visibilityState==='hidden')return;
  MF577_BATCH.busy=true;
  try{
    let q=supabase.from(MF556_TABLE).select('kind,record_id,pos,data,deleted,updated_at').eq('user_id',AUTH_USER.id).eq('kind','doc').eq('record_id',MF577_BATCH_ID);
    if(MF577_BATCH.since)q=q.gt('updated_at',MF577_BATCH.since);
    const {data,error}=await q.order('updated_at',{ascending:true});
    if(error)throw error;
    const row=(data||[]).slice(-1)[0];
    if(!row)return;
    MF577_BATCH.since=row.updated_at;
    if(row.deleted||row.data==null||mf577BatchTyping())return;
    let incoming=null;try{incoming=JSON.parse(row.data);}catch(_){return;}
    const h=mf556Hash(row.data+'|'+(row.pos??''));
    if(mf577BatchAdopt(incoming)){
      MF556.local.set(mf556Key(row.kind,row.record_id),{k:row.kind,i:row.record_id,pos:row.pos,j:row.data,h,sh:h});
      render();
    }
  }catch(e){MF577_BATCH.lastError=String(e?.message||e);}
  finally{MF577_BATCH.busy=false;}
}
function mf577BatchSchedule(){
  clearTimeout(MF577_BATCH.poll);
  MF577_BATCH.poll=setTimeout(()=>{mf577BatchTick().finally(mf577BatchSchedule);},4000);
}
mf577BatchSchedule();

window.MediaFlowV577Batch=Object.freeze({stats:()=>({...MF577_BATCH,timer:undefined,poll:undefined}),touch:mf577BatchTouch,adopt:mf577BatchAdopt,tick:mf577BatchTick});
