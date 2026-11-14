/* MediaFlow v575 — the full fallback copy is written rarely.
 *
 * Accounts on record storage (v556) also keep the whole account as one row
 * (mediaflow_states) for older versions and recovery tools. That copy is
 * several MB, and each write of it costs the database a lot of disk work. It
 * was written every 3 minutes and every time the tab was hidden, by the
 * website and the app, which used up the project's Disk IO budget.
 * Now: at most every 30 minutes, and when the tab is hidden only if the last
 * copy is at least 10 minutes old. The time of the last copy is remembered
 * across reloads (it used to be written right after every reload). Records
 * themselves are saved exactly as before; only the extra copy is rarer.
 */
const MF575_INTERVAL=30*60*1000,MF575_MIN_GAP=10*60*1000;
const MF575_KEY='mediaflow-v575-legacy-at';
const MF575={skipped:0,forced:false};
function mf575LastWrite(){
  let saved=0;try{saved=Number(localStorage.getItem(MF575_KEY))||0;}catch(_){}
  return Math.max(Number(MF556.lastLegacyWrite)||0,saved,Date.parse(MF556.legacyAt||'')||0);
}
mf556ScheduleLegacy=function(force=false){
  MF556.legacyDirty=true;
  if(force)MF575.forced=true;
  if(MF556.legacyTimer)return;
  const wait=force?0:Math.max(0,mf575LastWrite()+MF575_INTERVAL-Date.now());
  MF556.legacyTimer=setTimeout(()=>{MF556.legacyTimer=null;mf556WriteLegacy().catch(e=>console.warn('MediaFlow v556: fallback copy not updated',e));},wait);
};
const mf575WriteLegacyBase=mf556WriteLegacy;
mf556WriteLegacy=async function(){
  if(!MF575.forced&&Date.now()-mf575LastWrite()<MF575_MIN_GAP){
    MF575.skipped++;
    if(MF556.legacyDirty&&!MF556.legacyTimer)mf556ScheduleLegacy();
    return;
  }
  MF575.forced=false;
  const before=MF556.stats.legacyWrites;
  const result=await mf575WriteLegacyBase.apply(this,arguments);
  if(MF556.stats.legacyWrites>before){try{localStorage.setItem(MF575_KEY,String(Date.now()));}catch(_){}}
  return result;
};
window.MediaFlowV575={version:575,
  // Write the copy now (diagnostics and tests), whatever the time since the last one.
  flush:()=>{MF575.forced=true;MF556.legacyDirty=true;return mf556WriteLegacy();},
  stats:()=>({...MF575,lastWrite:mf575LastWrite()})};
