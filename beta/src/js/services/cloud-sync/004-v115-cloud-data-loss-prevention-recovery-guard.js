/* ============================================================
   MediaFlow v115 — Cloud Data Loss Prevention & Recovery Guard
   - Never treats a failed/missing cloud read as permission to overwrite data.
   - Blocks all normal cloud writes until startup has been safely resolved.
   - Keeps a per-account local safety cache and can recover newer unsynced state.
   - Requires an explicit user decision before replacing suspicious cloud state.
   ============================================================ */
const V115_USER_CACHE_PREFIX='mf_cloud_cache_v2_';
let V115_STARTUP_GUARD=true;
let V115_BOOTSTRAP_OVERRIDE=false;
let V115_BOOTSTRAP_DATA=undefined;
let V115_RECOVERY_CONTEXT=null;

function v115UserCacheKey(){
  return V115_USER_CACHE_PREFIX+String(AUTH_USER?.id||'unknown');
}
function v115StateStats(state){
  const x=(state&&typeof state==='object')?state:{};
  const library=Array.isArray(x.library)?x.library.length:0;
  const sessions=Array.isArray(x.sessions)?x.sessions.length:0;
  const activity=Array.isArray(x.activityLog)?x.activityLog.length:0;
  const completions=Array.isArray(x.completionTimeline)?x.completionTimeline.length:0;
  const xpEntries=Object.keys(x.xpLedger?.libraryAdditions||{}).length;
  const savedAt=Number(x.savedAt)||0;
  return {library,sessions,activity,completions,xpEntries,savedAt,core:library+sessions+activity+completions+xpEntries};}
function v115HasMeaningfulState(state){
  if(!state||typeof state!=='object')return false;
  const st=v115StateStats(state);
  return st.core>0 || !!state.profilePicture || !!state.profileName || !!state.currentTask || !!state.sessionActive || st.savedAt>0;
}
function v115AccountLooksNew(){
  const created=Date.parse(String(AUTH_USER?.created_at||''));
  return Number.isFinite(created) && (Date.now()-created)<15*60*1000;
}
function v115WriteRecoveryCache(state,serializedState){
  if(!AUTH_USER||!state||typeof state!=='object')return false;
  try{
    // v134: stringify the potentially huge MediaFlow state only once.
    // The account-scoped wrapper is assembled around the already-serialized
    // state, while the legacy cache receives the exact same state JSON.
    const stateJson=typeof serializedState==='string'?serializedState:JSON.stringify(state);
    const cachedAt=Date.now();
    const wrappedJson=`{"__mediaflowCacheV2":1,"userId":${JSON.stringify(String(AUTH_USER.id))},"cachedAt":${cachedAt},"state":${stateJson}}`;
    let ok=false;
    try{localStorage.setItem(v115UserCacheKey(),wrappedJson);ok=true;}catch(_){}
    // Keep the legacy cache updated for backward compatibility with older builds.
    try{localStorage.setItem(CLOUD_CACHE_KEY,stateJson);}catch(_){}
    return ok;
  }catch(_){
    return false;
  }
}
async function v115ReadRecoveryCache(){
  try{
    const scoped=await localRawGet(v115UserCacheKey());
    if(scoped&&scoped.__mediaflowCacheV2===1&&scoped.userId===AUTH_USER?.id&&scoped.state&&typeof scoped.state==='object'){
      return {state:scoped.state,source:'account',cachedAt:Number(scoped.cachedAt)||Number(scoped.state.savedAt)||0};
    }
  }catch(_){}
  try{
    const legacy=await localRawGet(CLOUD_CACHE_KEY);
    if(legacy&&typeof legacy==='object')return {state:legacy,source:'legacy',cachedAt:Number(legacy.savedAt)||0};
  }catch(_){}
  return null;
}
async function v115FetchCloudState(){
  if(!AUTH_USER||!supabase)throw new Error('MediaFlow cloud session is unavailable.');
  const {data,error}=await supabase.from('mediaflow_states').select('state_data,updated_at').eq('user_id',AUTH_USER.id).maybeSingle();
  if(error)throw error;
  if(!data)return {found:false,state:undefined,updatedAt:null};
  return {found:true,state:await decodeCloudState(data.state_data??undefined),updatedAt:data.updated_at||null};
}
function v115FormatWhen(ts){
  if(!ts)return 'unknown time';
  try{return new Date(ts).toLocaleString();}catch(_){return 'unknown time';}
}
function v115RenderSafetyScreen(ctx){
  V115_RECOVERY_CONTEXT=ctx;
  const app=document.getElementById('app');
  if(!app)return;
  const cache=ctx.cache||null;
  const localStats=v115StateStats(cache?.state);
  const cloudStats=v115StateStats(ctx.cloud?.state);
  const localSummary=cache&&v115HasMeaningfulState(cache.state)
    ? `<div class="card" style="margin:14px 0;padding:14px"><b>Local safety copy found</b><div class="auth-sub" style="margin:6px 0 0">${localStats.library.toLocaleString()} Library titles · ${localStats.sessions.toLocaleString()} consumption logs · ${localStats.activity.toLocaleString()} Library History events<br>Last local snapshot: ${escapeHtml(v115FormatWhen(cache.cachedAt||localStats.savedAt))}${cache.source==='legacy'?'<br><span style="color:var(--flow)">Legacy cache: confirm it belongs to this MediaFlow account before restoring.</span>':''}</div></div>`
    : '';
  let title='Cloud data safety check';
  let message='MediaFlow stopped before writing anything to your account.';
  let actions='';
  if(ctx.kind==='cloud-error'){
    title='Could not safely read cloud data';
    message=`MediaFlow could not read your Supabase state. To prevent an accidental reset, the app did not load defaults and did not write anything to the cloud.<br><br><b>${escapeHtml(String(ctx.error?.message||ctx.error||'Cloud read failed.'))}</b>`;
    actions=`<button class="btn btn-primary btn-block" onclick="window.MediaFlowRecovery.retry()">Retry cloud connection</button>`;
  }else if(ctx.kind==='missing'){
    title='Cloud state is missing';
    message='This account did not return a MediaFlow cloud row. MediaFlow will not assume that means your data should be reset.';
    actions=`${cache&&v115HasMeaningfulState(cache.state)?'<button class="btn btn-primary btn-block" onclick="window.MediaFlowRecovery.restore()">Restore local safety copy to cloud</button>':''}<button class="btn btn-block" style="margin-top:8px" onclick="window.MediaFlowRecovery.retry()">Retry cloud connection</button><button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="window.MediaFlowRecovery.startEmpty()">I intentionally want an empty workspace</button>`;
  }else if(ctx.kind==='cloud-empty'){
    title='Cloud state looks unexpectedly empty';
    message=`The cloud row exists, but it contains much less data than the local safety copy. MediaFlow blocked the startup write so the larger copy cannot be silently replaced.<br><br>Cloud: <b>${cloudStats.library.toLocaleString()} titles · ${cloudStats.sessions.toLocaleString()} logs</b>`;
    actions=`<button class="btn btn-primary btn-block" onclick="window.MediaFlowRecovery.restore()">Merge local safety copy with cloud</button><button class="btn btn-block" style="margin-top:8px" onclick="window.MediaFlowRecovery.useCloud()">Use cloud version</button><button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="window.MediaFlowRecovery.retry()">Retry first</button>`;
  }else if(ctx.kind==='local-newer'){
    title='Unsynced local changes detected';
    message=`The local safety copy is newer than the cloud snapshot. This can happen if a previous cloud save failed. MediaFlow will not discard the newer local state automatically.<br><br>Cloud snapshot: <b>${escapeHtml(v115FormatWhen(Number(ctx.cloud?.state?.savedAt)||Date.parse(ctx.cloud?.updatedAt||'')||0))}</b><br>Local snapshot: <b>${escapeHtml(v115FormatWhen(localStats.savedAt||cache?.cachedAt))}</b>`;
    actions=`<button class="btn btn-primary btn-block" onclick="window.MediaFlowRecovery.restore()">Merge local changes with cloud</button><button class="btn btn-block" style="margin-top:8px" onclick="window.MediaFlowRecovery.useCloud()">Use cloud version</button>`;
  }
  app.innerHTML=`<div class="auth-screen"><div class="auth-card" style="width:min(560px,100%)"><div class="auth-brand"><div class="brand-mark"></div><div><div class="auth-brand-name">MediaFlow</div><div class="brand-sub">v115 data protection</div></div></div><div class="auth-title">${title}</div><div class="auth-sub">${message}</div>${localSummary}<div style="margin-top:16px">${actions}</div><div class="auth-foot">Safety rule: a missing, failed, or suspicious cloud read can never automatically overwrite your MediaFlow account.</div></div></div>`;
}
async function v115StartWithData(data){
  V115_STARTUP_GUARD=true;
  V115_BOOTSTRAP_DATA=data;
  V115_BOOTSTRAP_OVERRIDE=true;
  try{
    await loadAll();
  }finally{
    V115_BOOTSTRAP_OVERRIDE=false;
  }
  V115_STARTUP_GUARD=false;
  // Cache the exact source snapshot, not a newly timestamped snapshot. This keeps
  // savedAt meaningful so a normal app launch is never mistaken for an unsynced edit.
  try{if(data&&typeof data==='object')v115WriteRecoveryCache(data);}catch(_){}
  renderShell();
}
async function v115SafeBootstrap(){
  V115_STARTUP_GUARD=true;
  let cache=null;
  try{cache=await v115ReadRecoveryCache();}catch(_){}
  let cloud;
  try{
    cloud=await v115FetchCloudState();
  }catch(error){
    v115RenderSafetyScreen({kind:'cloud-error',error,cache});
    return false;
  }
  const localState=cache?.state;
  const localStats=v115StateStats(localState);
  const cloudStats=v115StateStats(cloud.state);
  const localMeaningful=cache&&v115HasMeaningfulState(localState);

  if(!cloud.found){
    if(localMeaningful || !v115AccountLooksNew()){
      v115RenderSafetyScreen({kind:'missing',cloud,cache});
      return false;
    }
    await v115StartWithData(undefined);
    return true;
  }

  // If cloud is effectively empty but this account has a populated local cache,
  // require an explicit recovery decision instead of silently trusting the empty row.
  if(localMeaningful && localStats.core>0 && cloudStats.core===0){
    v115RenderSafetyScreen({kind:'cloud-empty',cloud,cache});
    return false;
  }

  // A user-scoped cache newer than the cloud usually means a previous save failed.
  // Do not discard it on refresh; let the user merge or explicitly choose cloud.
  const localSaved=Number(localStats.savedAt)||0;
  const cloudSaved=Number(cloudStats.savedAt)||0;
  if(cache?.source==='account' && localMeaningful && localSaved>0 && cloudSaved>0 && localSaved>cloudSaved+15000){
    v115RenderSafetyScreen({kind:'local-newer',cloud,cache});
    return false;
  }

  try{if(cloud.state&&typeof cloud.state==='object')v115WriteRecoveryCache(cloud.state);}catch(_){}
  await v115StartWithData(cloud.state);
  return true;
}
window.MediaFlowRecovery={
  async retry(){
    const app=document.getElementById('app');if(app)app.innerHTML='<div class="loader-wrap">Retrying MediaFlow cloud…</div>';
    await startAuthenticatedApp();
  },
  async restore(){
    const ctx=V115_RECOVERY_CONTEXT,local=ctx?.cache?.state;
    if(!local)return;
    const app=document.getElementById('app');if(app)app.innerHTML='<div class="loader-wrap">Recovering MediaFlow data…</div>';
    try{
      const recovered=ctx?.cloud?.found&&ctx.cloud.state?mergeStates(local,ctx.cloud.state):local;
      await rawSet(STATE_KEY,recovered);
      await v115StartWithData(recovered);
      showToast('MediaFlow data recovered and protected ✓');
    }catch(error){v115RenderSafetyScreen({kind:'cloud-error',error,cache:ctx?.cache||null});}
  },
  async useCloud(){
    const ctx=V115_RECOVERY_CONTEXT;
    if(!ctx?.cloud?.found)return;
    await v115StartWithData(ctx.cloud.state);
  },
  async startEmpty(){
    if(!confirm('Start with an empty MediaFlow workspace? This is only for a genuinely new/empty account. Existing cloud data will not be written over until you make a later change.'))return;
    await v115StartWithData(undefined);
  }
};
async function encodeCloudState(value,serializedJson){
  // Large MediaFlow histories can make the single JSONB row expensive to update.
  // Compress the state in browsers that support CompressionStream before sending it.
  // v134 accepts a pre-serialized state so Sync/Save does not stringify it again.
  const json=typeof serializedJson==='string'?serializedJson:JSON.stringify(value);
  try{
    if(typeof CompressionStream==='function' && typeof TextEncoder!=='undefined'){
      const cs=new CompressionStream('gzip');
      const writer=cs.writable.getWriter();
      writer.write(new TextEncoder().encode(json));
      writer.close();
      const buf=await new Response(cs.readable).arrayBuffer();
      let binary='';
      const bytes=new Uint8Array(buf);
      const chunk=0x8000;
      for(let i=0;i<bytes.length;i+=chunk) binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));
      return {__mediaflowCompressed:'gzip',data:btoa(binary)};
    }
  }catch(e){
    console.warn('MediaFlow: compression unavailable, saving normally.',e);
  }
  return value;
}

async function decodeCloudState(value){
  if(!value || value.__mediaflowCompressed!=='gzip') return value;
  try{
    if(typeof DecompressionStream!=='function' || typeof TextDecoder==='undefined') throw new Error('DecompressionStream unavailable');
    const binary=atob(value.data||'');
    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
    const ds=new DecompressionStream('gzip');
    const writer=ds.writable.getWriter();
    writer.write(bytes);
    writer.close();
    const text=await new Response(ds.readable).text();
    return JSON.parse(text);
  }catch(e){
    throw new Error('MediaFlow cloud data could not be decompressed. Try another Chromium-based browser or restore from a JSON backup.');
  }
}

async function rawGet(key){
  if(V115_BOOTSTRAP_OVERRIDE&&key===STATE_KEY)return V115_BOOTSTRAP_DATA;
  if(!AUTH_USER||!supabase)throw new Error('MediaFlow cloud session is unavailable.');
  const {data,error}=await supabase.from('mediaflow_states').select('state_data').eq('user_id',AUTH_USER.id).maybeSingle();
  if(error)throw error;
  return await decodeCloudState(data?.state_data??undefined);
}

async function rawSet(key,value){
  if(!AUTH_USER||!supabase)throw new Error('MediaFlow cloud session is unavailable.');

  // v134: one full JSON serialization feeds cloud compression and both protected
  // recovery caches. v133 could stringify the same very large state three times.
  const serializedState=JSON.stringify(value);
  if(serializedState.length>750000) await new Promise(r=>setTimeout(r,0));
  const payload=await encodeCloudState(value,serializedState);

  // Keep a per-account local copy as a safety net while the cloud write is in flight.
  // v115 keeps the legacy key too, but recovery prefers the account-scoped cache.
  try{ v115WriteRecoveryCache(value,serializedState); }catch(_){}

  let lastError=null;
  const delays=[0,450,1000,2000,4000];
  for(let attempt=0;attempt<delays.length;attempt++){
    if(delays[attempt]) await new Promise(r=>setTimeout(r,delays[attempt]));
    try{
      const {error}=await supabase.from('mediaflow_states').upsert({user_id:AUTH_USER.id,state_data:payload,updated_at:new Date().toISOString()},{onConflict:'user_id'});
      if(!error) return true;
      lastError=error;
      const code=String(error?.code||'');
      if(code!=='57014' && !/timeout|canceling statement/i.test(String(error?.message||''))) throw error;
      if(attempt<delays.length-1) console.warn(`MediaFlow: cloud save timed out, retrying (${attempt+1}/${delays.length-1})...`);
    }catch(e){
      lastError=e;
      const code=String(e?.code||'');
      const timeout=code==='57014' || /timeout|canceling statement/i.test(String(e?.message||''));
      if(!timeout || attempt===delays.length-1) throw e;
      console.warn(`MediaFlow: cloud save timed out, retrying (${attempt+1}/${delays.length-1})...`);
    }
  }
  throw lastError||new Error('MediaFlow cloud save failed.');
}
function v84MergeLibraryItem(left,right){
  if(!left) return right ? Object.assign({},right) : null;
  if(!right) return Object.assign({},left);
  const lm=Number(left.modifiedAt||0), rm=Number(right.modifiedAt||0);
  const newer=rm>lm?right:left, older=rm>lm?left:right;
  const out=Object.assign({},older,newer);
  const nonEmpty=(a,b)=>{ const av=a!==undefined&&a!==null&&a!==''; const bv=b!==undefined&&b!==null&&b!==''; if(av&&bv) return rm>lm?b:a; return av?a:b; };
  out.id=nonEmpty(left.id,right.id)||uid();
  out.title=cleanTitle(nonEmpty(left.title,right.title)||'Untitled');
  out.categoryId=nonEmpty(left.categoryId,right.categoryId)||S.categories?.[0]?.id||'backlog';
  out.progress=Math.max(Number(left.progress)||0,Number(right.progress)||0);
  // Keep an explicitly known total from either side. If both differ, prefer the newer edited copy.
  const lt=left.total==null||left.total===''?null:Number(left.total), rt=right.total==null||right.total===''?null:Number(right.total);
  out.total=(lt!=null&&rt!=null)?(rm>lm?rt:lt):(lt!=null?lt:rt);
  const statusRank={dropped:0,planned:1,paused:2,active:3,completed:4};
  out.status=(statusRank[left.status]||0)>(statusRank[right.status]||0)?left.status:(right.status||left.status||'planned');
  const pr={low:1,medium:2,high:3}; out.priority=(pr[left.priority]||0)>=(pr[right.priority]||0)?(left.priority||'medium'):(right.priority||'medium');
  out.tags=[...new Set([...(Array.isArray(left.tags)?left.tags:[]),...(Array.isArray(right.tags)?right.tags:[])])];
  out.externalIds=Object.assign({},left.externalIds||{},right.externalIds||{});
  // v84: never let an empty device copy erase useful per-title metadata from cloud/another device.
  for(const k of ['coverUrl','coverSource','source','year','simklAddedAt','estimatedMinutes','startedAt','startedAtSource']) out[k]=nonEmpty(left[k],right[k]);
  const lr=Number(left.rating), rr=Number(right.rating); out.rating=lr>0&&rr>0?(rm>lm?rr:lr):(lr>0?lr:(rr>0?rr:null));
  out.manualRepeatAmount=Math.max(0,Number(left.manualRepeatAmount)||0,Number(right.manualRepeatAmount)||0);
  out.createdAt=Math.min(...[Number(left.createdAt)||0,Number(right.createdAt)||0].filter(Boolean))||Date.now();
  out.completedAt=nonEmpty(left.completedAt,right.completedAt)||null;
  out.modifiedAt=Math.max(lm,rm,Number(out.modifiedAt)||0);
  return out;
}
function mergeStates(a,b){
  if(!a)return b||{}; if(!b)return a;
  const out=Object.assign({},b,a);
  // v84: merge every Library title field instead of rebuilding titles from a small legacy field subset.
  // Match stable IDs first, then title/category for older imports that may have different IDs.
  const merged=[]; const byId=new Map(), byKey=new Map();
  const add=(x)=>{
    if(!x||typeof x!=='object')return;
    const key=cleanTitle(x.title).toLowerCase()+'::'+(x.categoryId||'');
    let idx=(x.id&&byId.has(x.id))?byId.get(x.id):(key&&byKey.has(key)?byKey.get(key):null);
    if(idx==null){idx=merged.length;merged.push(Object.assign({},x));if(x.id)byId.set(x.id,idx);if(key)byKey.set(key,idx);}
    else {merged[idx]=v84MergeLibraryItem(merged[idx],x);if(merged[idx].id)byId.set(merged[idx].id,idx);const nk=cleanTitle(merged[idx].title).toLowerCase()+'::'+(merged[idx].categoryId||'');if(nk)byKey.set(nk,idx);}
  };
  (b.library||[]).forEach(add); (a.library||[]).forEach(add); out.library=merged;
  const sessions=new Map(); [...(b.sessions||[]),...(a.sessions||[])].forEach(x=>sessions.set(x.id||uid(),x)); out.sessions=[...sessions.values()].sort((x,y)=>(x.timestamp||0)-(y.timestamp||0));
  out.xpLedger=Object.assign({libraryAdditions:{}},b.xpLedger||{},a.xpLedger||{}); out.xpLedger.libraryAdditions=Object.assign({},b.xpLedger?.libraryAdditions||{},a.xpLedger?.libraryAdditions||{});
  const activityById=new Map(); [...(b.activityLog||[]),...(a.activityLog||[])].forEach(x=>{if(!x||typeof x!=='object')return;const k=x.id||`${x.timestamp||0}::${x.action||''}::${x.detail||''}`;const prev=activityById.get(k);if(!prev||Number(x.timestamp||0)>=Number(prev.timestamp||0))activityById.set(k,x);});
  out.activityLog=[...activityById.values()].sort((x,y)=>Number(y.timestamp||0)-Number(x.timestamp||0)).slice(0,1000);
  out.migrations=Object.assign({},b.migrations||{},a.migrations||{});
  out.categories=a.categories||b.categories; out.categoryOrder=a.categoryOrder||a.settings?.categoryOrder||b.categoryOrder||b.settings?.categoryOrder||[]; out.settings=Object.assign({},b.settings||{},a.settings||{}); if(out.categoryOrder.length) out.settings.categoryOrder=out.categoryOrder.slice(); out.currentTask=a.currentTask||b.currentTask; out.sessionActive=a.sessionActive??b.sessionActive; out.profilePicture=a.profilePicture||b.profilePicture||'';
  return out;
}
function snapshot(){

  return {

    categories: S.categories, categoryOrder: v74SyncCategoryOrder().slice(), library: S.library, sessions: S.sessions,

    settings: S.settings, currentTask: S.currentTask, sessionActive: S.sessionActive,

    profilePicture: S.profilePicture || '',
    stopwatch: S.stopwatch || {running:false,startedAt:0,elapsed:0,resetValue:0},
    malLink: S.malLink || {username:'',mode:'anime'},
    xpLedger: S.xpLedger || {libraryAdditions:{}},
    completionTimeline: S.completionTimeline || [],
    // v50: Library History is account data, not device-only UI state.
    // Persist it in the same atomic cloud snapshot as Library + consumption History.
    activityLog: Array.isArray(S.activityLog) ? S.activityLog.slice(0,1000) : [],
    migrations: S.migrations || {},

    savedAt: Date.now(),

  };

}

// Serialize saves so two rapid actions never race each other; always await the tail.

function saveState(){
  // v115: startup/load code is never allowed to upload defaults or partial state.
  // Normal writes are enabled only after the cloud/local source has been resolved safely.
  if(V115_STARTUP_GUARD){
    console.warn('MediaFlow v115: blocked a cloud save during protected startup/recovery.');
    return Promise.resolve(false);
  }
  // Serialize saves so concurrent UI actions cannot overwrite each other.
  // Each queued save snapshots only when its turn begins, so a burst of actions
  // always ends with the newest state rather than a pile of stale uploads.
  saveQueue = saveQueue.then(async ()=>{
    try{
      await rawSet(STATE_KEY, snapshot());
      if(lastSaveFailed){ lastSaveFailed=false; hideSaveError(); }
    }catch(e){
      console.error('MediaFlow: save failed', e);
      lastSaveFailed = true; showSaveError();
    }
  });
  return saveQueue;
}

function showSaveError(){

  let bar = document.getElementById('save-error-bar');

  if(!bar){

    bar = document.createElement('div');

    bar.id='save-error-bar';

    bar.style.cssText='position:fixed;bottom:0;left:0;right:0;background:#E8607A;color:#1a0a0d;font-weight:700;font-size:13px;text-align:center;padding:9px;z-index:999;';

    bar.textContent = "Cloud save is taking longer than expected. MediaFlow is retrying automatically; your data is also kept locally until the cloud save succeeds.";

    document.body.appendChild(bar);

  }

}

function hideSaveError(){ const bar=document.getElementById('save-error-bar'); if(bar) bar.remove(); }

function showMemoryModeNotice(){

  if(document.getElementById('memory-mode-bar')) return;

  const bar = document.createElement('div');

  bar.id='memory-mode-bar';

  bar.style.cssText='position:fixed;top:0;left:0;right:0;background:#E8A94A;color:#1c1305;font-weight:700;font-size:12.5px;text-align:center;padding:8px;z-index:999;';

  bar.textContent = "This browser is blocking all local storage (private/incognito mode, or storage disabled) — nothing will be saved between refreshes right now.";

  document.body.appendChild(bar);

}

function sanitizeLibrary(list){
  const out=[];
  const seen=new Map();
  for(const raw of (Array.isArray(list)?list:[])){
    if(!raw || typeof raw!=='object') continue;
    const title=cleanTitle(raw.title);
    if(!title) continue;
    const item=Object.assign({
      id:uid(), categoryId:S.categories?.[0]?.id || 'backlog', progress:0, total:null,
      status:'planned', priority:'medium', estimatedMinutes:null, tags:[], createdAt:Date.now(), startedAt:null, startedAtSource:null, completedAt:null
    }, raw, {title, id:raw.id || uid()});
    const key=(item.categoryId||'')+'::'+title.toLowerCase();
    if(seen.has(key)){
      const existing=seen.get(key);
      const merged=v84MergeLibraryItem(existing,item);
      Object.keys(existing).forEach(k=>delete existing[k]);
      Object.assign(existing,merged);
    }else{
      seen.set(key,item); out.push(item);
    }
  }
  return out;
}

