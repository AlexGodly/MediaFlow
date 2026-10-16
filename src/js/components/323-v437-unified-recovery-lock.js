/* MediaFlow v437 — shared account-scoped cross-tab lock between Cover and Metadata recovery.
 * v424 keeps its own lease/checkpoints; this is an additional exclusive concurrency guard. */
const mf437PreviousCoverRun=mf424Run;
mf424Run=async function(){
 if(typeof navigator==='undefined'||!navigator.locks?.request)
  return mf437PreviousCoverRun.apply(this,arguments); // v424's existing lease still enforces cover-only exclusivity.
 const account=mf424Account();
 return navigator.locks.request('mediaflow-recovery-global:'+account,{mode:'exclusive',ifAvailable:true},async lock=>{
  if(!lock){
   if(MF424.job){mf424State('other-tab');MF424.job.pauseRequested=true;await mf424SaveJob();mf424Paint();}
   return;
  }
  return mf437PreviousCoverRun.apply(this,arguments);
 });
};
