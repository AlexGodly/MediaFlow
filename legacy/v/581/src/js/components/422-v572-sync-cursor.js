/* MediaFlow v572 — changes from your other devices always reach the website.
 *
 * Record sync (v556) reads "rows changed since the cursor". A save on this
 * device moved the cursor to the time of its own upload, so anything another
 * device (the app, another browser) had saved since the last pull — and
 * before this save — was skipped for good: covers and details found by the
 * app's Recovery, edits made in the app, and so on. Reloading didn't help,
 * because the start-up read uses the same cursor.
 *
 *  1. A save no longer moves the cursor. Only reading rows does; this device's
 *     own rows come back once and are recognised as already known.
 *  2. Catch-up, once per device and account: the next start reads every row
 *     again (not just the recent ones) and merges what was missed. Unsent
 *     changes on this device are kept, exactly like a normal pull.
 *  3. Live sync for everything, like logging: every few seconds while the tab
 *     is visible, one tiny read asks whether another device saved anything
 *     since the last pull, and pulls right away when it did (also as soon as
 *     the tab comes back into view). The pull still waits while you're in the
 *     middle of something (an open editor or popup), then catches up. The
 *     "Updated with changes from your other device" toast is gone: changes
 *     simply appear, like the live logging draft.
 */
const MF572_CATCHUP_KEY='mediaflow-v572-catchup';
const MF572={catchup:false,restored:0};

/* 1. Saves keep the cursor where reading left it. */
const mf572SaveStateBase=mf556SaveState;
mf556SaveState=async function(){
  const cursor=MF556.cursor;
  const result=await mf572SaveStateBase.apply(this,arguments);
  if(MF556.cursor!==cursor){
    MF556.cursor=cursor;MF572.restored++;
    try{await mf556SaveMeta();}catch(_){}
  }
  return result;
};

/* 2. One full read on the next start to pick up what was skipped before. */
function mf572CatchupDone(userId){
  try{return (localStorage.getItem(MF572_CATCHUP_KEY)||'').split(',').includes(String(userId));}catch(_){return true;}
}
function mf572MarkCatchup(userId){
  try{const done=(localStorage.getItem(MF572_CATCHUP_KEY)||'').split(',').filter(Boolean);
    if(!done.includes(String(userId)))done.push(String(userId));localStorage.setItem(MF572_CATCHUP_KEY,done.join(','));}catch(_){}
}
const mf572LoadLocalBase=mf556LoadLocal;
mf556LoadLocal=async function(userId){
  const result=await mf572LoadLocalBase.apply(this,arguments);
  // Keep this device's records (and any unsent changes) but read from the
  // beginning: rows already known are skipped by their hash.
  if(MF556.cursor&&MF556.local.size&&!mf572CatchupDone(userId)){
    MF556.cursor='1970-01-01T00:00:03.000Z';MF572.catchup=true;
  }
  return result;
};
const mf572FetchCloudBase=v115FetchCloudState;
v115FetchCloudState=async function(){
  const result=await mf572FetchCloudBase.apply(this,arguments);
  if(AUTH_USER&&MF556.migrated&&MF556.cursor&&!MF556.cursor.startsWith('1970')){mf572MarkCatchup(AUTH_USER.id);MF572.catchup=false;}
  return result;
};

const mf572PullBase=mf556Pull;
mf556Pull=async function(){
  const result=await mf572PullBase.apply(this,arguments);
  if(AUTH_USER&&MF556.cursor&&!MF556.cursor.startsWith('1970')&&MF572.catchup){mf572MarkCatchup(AUTH_USER.id);MF572.catchup=false;}
  return result;
};

/* 3. Live sync. */
const MF572_PROBE_MS=5000;
const MF572_LIVE={timer:null,probing:false,probes:0,hits:0,lastError:''};
async function mf572Probe(){
  if(MF572_LIVE.probing||!MF556.migrated||!AUTH_USER||!supabase||!navigator.onLine||document.visibilityState==='hidden')return false;
  if(!MF556.cursor||MF556.pulling)return false;
  MF572_LIVE.probing=true;
  try{
    MF572_LIVE.probes++;
    const since=new Date(Date.parse(MF556.cursor)-3000).toISOString();
    const {data,error}=await supabase.from(MF556_TABLE).select('updated_at').eq('user_id',AUTH_USER.id).gt('updated_at',since)
      .or('device_id.is.null,device_id.neq.'+mf556Device()).order('updated_at',{ascending:true}).limit(1);
    if(error)throw error;
    if(!data||!data.length)return false;
    MF572_LIVE.hits++;
    await mf556Pull();
    return true;
  }catch(e){MF572_LIVE.lastError=String(e?.message||e);return false;}
  finally{MF572_LIVE.probing=false;}
}
function mf572StartLive(){
  if(MF572_LIVE.timer)return;
  MF572_LIVE.timer=setInterval(()=>{mf572Probe();},MF572_PROBE_MS);
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(mf572Probe,300);});
window.addEventListener('focus',()=>setTimeout(mf572Probe,300));
window.addEventListener('online',()=>setTimeout(mf572Probe,1000));
mf572StartLive();
// Changes simply appear (no toast every time another device saves).
const MF572_QUIET='Updated with changes from your other device.';
const mf572ToastBase=showToast;
showToast=function(message){
  if(message===MF572_QUIET)return;
  return mf572ToastBase.apply(this,arguments);
};

window.MediaFlowV572={version:572,probe:mf572Probe,stats:()=>({...MF572,live:{probes:MF572_LIVE.probes,hits:MF572_LIVE.hits,lastError:MF572_LIVE.lastError},cursor:MF556.cursor})};
