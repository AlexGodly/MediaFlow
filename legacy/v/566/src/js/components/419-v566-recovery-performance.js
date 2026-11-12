/* MediaFlow v566 — Recovery workspace stays smooth while recoveries run.
 *
 * Cover and Details Recovery publish progress after every step, and every
 * publish repainted the Background Processes widget and the open workspace.
 * On a big page that meant a full rebuild and page layout many times a
 * second. Now:
 *  - progress repaints are capped at ~4 per second while a job runs
 *    (the first one is immediate, the last one is never dropped);
 *  - nothing is repainted while the tab is hidden; one repaint on return;
 *  - the widget is only rebuilt when what it shows changed (v441 change),
 *    and the minimise button is placed once per frame (v558 change).
 */
const MF566_PAINT={last:0,timer:0,gap:250,hiddenDirty:false};
const mf566PaintBase=mf441Paint;
function mf566JobRunning(){
  try{
    const c=typeof MF424!=='undefined'&&MF424.job&&String(MF424.job.status||'')==='running';
    const m=typeof MF439!=='undefined'&&(MF439.working||(MF439.job&&String(MF439.job.status||'')==='running'));
    return !!(c||m);
  }catch(_){return false;}
}
function mf566PaintRun(self,args){
  MF566_PAINT.last=performance.now();
  return mf566PaintBase.apply(self,args);
}
mf441Paint=function(){
  if(document.hidden){MF566_PAINT.hiddenDirty=true;return;}
  if(!mf566JobRunning()){                      // user actions and idle: paint right away
    clearTimeout(MF566_PAINT.timer);MF566_PAINT.timer=0;
    return mf566PaintRun(this,arguments);
  }
  const wait=MF566_PAINT.gap-(performance.now()-MF566_PAINT.last);
  if(wait<=0&&!MF566_PAINT.timer)return mf566PaintRun(this,arguments);
  if(!MF566_PAINT.timer){
    const self=this,args=arguments;
    MF566_PAINT.timer=setTimeout(()=>{MF566_PAINT.timer=0;if(document.hidden){MF566_PAINT.hiddenDirty=true;return;}mf566PaintRun(self,args);},Math.max(16,wait));
  }
};
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden&&MF566_PAINT.hiddenDirty){MF566_PAINT.hiddenDirty=false;mf566PaintRun(null,[]);}
});
/* ---------- batched account saves during recovery jobs ----------
 * Before v566 every recovered title saved the whole account (and rebuilt the
 * Library cache) — hundreds of milliseconds of frozen page per title on big
 * accounts. Now a running job saves every 10 titles or every 10 seconds,
 * and right away when the job pauses, stops, finishes or the tab is hidden
 * or closed. The checkpoint never passes the first title whose changes are
 * not saved yet, so a crash only means those few titles are checked again. */
const MF566_SAVE_EVERY=10,MF566_SAVE_MS=10000;
const MF566_SAVE={cover:{pending:0,last:0,safe:null,timer:0,jobId:''},metadata:{pending:0,last:0,safe:null,timer:0,jobId:''}};
function mf566RecoveryJob(kind){return kind==='cover'?(typeof MF424!=='undefined'?MF424.job:null):(typeof MF439!=='undefined'?MF439.job:null);}
// true = the caller may skip this save (it is batched).
function mf566DeferRecoverySave(kind){
  const s=MF566_SAVE[kind],job=mf566RecoveryJob(kind);
  if(!s||!job||document.hidden)return false;
  if(job.stopRequested||job.pauseRequested)return false;
  if(s.jobId!==String(job.id||'')){if(s.pending)return false;s.jobId=String(job.id||'');s.safe=null;}
  const now=Date.now();
  if(!s.pending)s.last=s.last&&now-s.last<MF566_SAVE_MS?s.last:now;
  if(s.pending+1>=MF566_SAVE_EVERY||now-s.last>=MF566_SAVE_MS)return false;
  if(s.safe==null)s.safe=Math.max(0,Number(job.cursor)||0);   // the current title is the first unsaved one
  s.pending++;
  if(!s.timer)s.timer=setTimeout(()=>{s.timer=0;mf566FlushRecovery(kind).catch(e=>console.warn('MediaFlow v566: batched recovery save failed',e));},MF566_SAVE_MS);
  return true;
}
function mf566RecoverySaved(kind){
  const s=MF566_SAVE[kind];if(!s)return;
  s.pending=0;s.safe=null;s.last=Date.now();
  if(s.timer){clearTimeout(s.timer);s.timer=0;}
}
async function mf566FlushRecovery(kind){
  const s=MF566_SAVE[kind];
  if(!s||!s.pending)return;
  if(kind==='cover'){await mf424Flush(true);if(!MF424.job?.dirty)mf566RecoverySaved('cover');return;}
  await saveState();
  mf566RecoverySaved(kind);
  try{mf439SaveJob();}catch(_){}
}
function mf566SafeCheckpoint(kind,job){
  const s=MF566_SAVE[kind];
  if(!job||!s||s.safe==null||s.jobId!==String(job.id||'')||!(Number(job.cursor)>s.safe))return job;
  const out={...job,cursor:s.safe};
  if('completed' in job)out.completed=s.safe;
  return out;
}
function mf566FlushAllRecovery(){
  for(const kind of ['cover','metadata'])mf566FlushRecovery(kind).catch(()=>{});
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)mf566FlushAllRecovery();});
window.addEventListener('pagehide',mf566FlushAllRecovery);

window.MediaFlowV566=Object.assign(window.MediaFlowV566||{},{paintNow:()=>mf566PaintRun(null,[]),
  recoverySave:{defer:mf566DeferRecoverySave,saved:mf566RecoverySaved,flush:mf566FlushRecovery,checkpoint:mf566SafeCheckpoint,state:MF566_SAVE}});
