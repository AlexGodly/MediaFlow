/* MediaFlow v550 — reduce background rating-scan work on the UI thread.
 * v547's recurring scanner used to inspect 200 Library titles every 2.5 seconds
 * and read each title's checkpoint from localStorage on every pass. On large
 * personal Libraries that creates continuous main-thread work even while the
 * user is navigating or logging. This module keeps automatic refresh enabled,
 * but makes scans small, paced, and checkpoint reads memory-first.
 * No Library, History, XP, cloud, or Supabase data is modified by this module.
 */
const MF550_VERSION=550;
const MF550_STATS={checkpointCacheHits:0,checkpointStorageReads:0,scanThrottleHits:0,scanPasses:0};
const MF550_CHECKPOINT_TTL=60000;
const MF550_CHECKPOINT_READ_AT=new Map();
let MF550_NEXT_BACKGROUND_SCAN=0;
const MF550_BACKGROUND_SCAN_INTERVAL=8000;

if(typeof MF547!=='undefined'&&typeof mf547State==='function'&&typeof mf547StateKey==='function'){
  // v547.stateCache is also updated by mf547Store(), so fresh writes remain
  // visible immediately while existing persisted checkpoints are read once
  // and refreshed at most once per TTL.
  const mf550ReadStateBase=mf547State;
  mf547State=function(id){
    const key=mf547StateKey(id);
    const now=Date.now();
    const cached=MF547.stateCache.get(key);
    const readAt=MF550_CHECKPOINT_READ_AT.get(key)||0;
    if(cached&&now-readAt<MF550_CHECKPOINT_TTL){
      MF550_STATS.checkpointCacheHits++;
      return cached;
    }
    MF550_STATS.checkpointStorageReads++;
    const value=mf550ReadStateBase.apply(this,arguments);
    MF550_CHECKPOINT_READ_AT.set(key,now);
    return value;
  };

  if(typeof mf547Store==='function'){
    const mf550StoreBase=mf547Store;
    mf547Store=function(id,patch){
      const result=mf550StoreBase.apply(this,arguments);
      MF550_CHECKPOINT_READ_AT.set(mf547StateKey(id),Date.now());
      return result;
    };
  }

  // A small chunk prevents a single scan from monopolizing the UI thread.
  // The 8-second cadence bounds recurring scan work; explicit ID-change jobs
  // bypass the throttle so user-triggered refreshes retain their priority.
  MF547_LIMITS.scanChunk=24;
  const mf550ChooseNextBase=mf547ChooseNext;
  mf547ChooseNext=function(){
    if(MF547.forced&&MF547.forced.size)return mf550ChooseNextBase.apply(this,arguments);
    if(typeof document!=='undefined'&&document.visibilityState==='hidden'){
      MF550_STATS.scanThrottleHits++;
      return null;
    }
    const now=Date.now();
    if(now<MF550_NEXT_BACKGROUND_SCAN){
      MF550_STATS.scanThrottleHits++;
      return null;
    }
    MF550_NEXT_BACKGROUND_SCAN=now+MF550_BACKGROUND_SCAN_INTERVAL;
    MF550_STATS.scanPasses++;
    return mf550ChooseNextBase.apply(this,arguments);
  };
}

window.MediaFlowV550=Object.freeze({
  version:MF550_VERSION,
  inspect:()=>({...MF550_STATS,scanChunk:typeof MF547!=='undefined'?MF547_LIMITS.scanChunk:null,
    nextBackgroundScanAt:MF550_NEXT_BACKGROUND_SCAN,checkpointCacheEntries:MF550_CHECKPOINT_READ_AT.size})
});
MediaFlowRuntime.version=MF550_VERSION;
