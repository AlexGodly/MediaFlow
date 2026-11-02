/* MediaFlow v555 — background cloud save.
 * Same cloud row, same compressed format, same retry/account fencing as v535.
 * What changes is WHERE the work happens:
 *  - the state is serialized in small slices with yields, so the page never
 *    freezes while a large account is being saved;
 *  - gzip + base64 run in a Web Worker;
 *  - the local safety copy moves from localStorage (5 MB quota — silently
 *    failing for large accounts) to IndexedDB, written BEFORE each upload.
 * The output is byte-for-byte the JSON that JSON.stringify(state) produces.
 */
const MF555_SAVE={worker:null,seq:0,waiters:new Map(),workerFailed:false,
  stats:{saves:0,encodeMs:0,serializeMs:0,lastBytes:0,cacheWrites:0,cacheFailures:0,fallbacks:0}};
const MF555_SLICE=1500;
const MF555_YIELD_MS=8;

function mf555Yield(){
  if(typeof scheduler!=='undefined'&&typeof scheduler.yield==='function')return scheduler.yield();
  return new Promise(resolve=>{
    try{const ch=new MessageChannel();ch.port1.onmessage=()=>resolve();ch.port2.postMessage(0);}
    catch(_){setTimeout(resolve,0);}
  });
}
/* JSON.stringify(value) for a plain top-level object, produced in pieces.
 * Big arrays are emitted slice by slice: JSON.stringify(arr.slice(a,b)) with
 * its brackets removed joins to exactly JSON.stringify(arr). */
async function mf555StringifyParts(value){
  const parts=[];
  if(!value||typeof value!=='object'||Array.isArray(value)||typeof value.toJSON==='function'){
    parts.push(JSON.stringify(value));return parts;
  }
  let last=performance.now(),first=true;
  const tick=async()=>{if(performance.now()-last>MF555_YIELD_MS){await mf555Yield();last=performance.now();}};
  parts.push('{');
  for(const key of Object.keys(value)){
    const v=value[key];
    if(Array.isArray(v)&&v.length>MF555_SLICE&&typeof v.toJSON!=='function'){
      const arr=v.slice(); // stable view while we yield
      parts.push((first?'':',')+JSON.stringify(key)+':[');first=false;
      for(let i=0;i<arr.length;i+=MF555_SLICE){
        const chunk=JSON.stringify(arr.slice(i,i+MF555_SLICE));
        parts.push((i?',':'')+chunk.slice(1,-1));
        await tick();
      }
      parts.push(']');
      continue;
    }
    const json=JSON.stringify(v);
    if(json===undefined)continue;
    parts.push((first?'':',')+JSON.stringify(key)+':'+json);first=false;
    await tick();
  }
  parts.push('}');
  return parts;
}

const MF555_WORKER_SOURCE=`
'use strict';
const DB='mediaflow-v555',STORE='recovery';
function db(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,1);
  r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'userId'});};
  r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function tx(mode,fn){const d=await db();return new Promise((res,rej)=>{const t=d.transaction(STORE,mode);const s=t.objectStore(STORE);
  let out;Promise.resolve(fn(s)).then(v=>{out=v;});t.oncomplete=()=>{d.close();res(out);};t.onerror=t.onabort=()=>{d.close();rej(t.error);};});}
function req(r){return new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function gzipBase64(parts){
  const cs=new CompressionStream('gzip');const w=cs.writable.getWriter();const enc=new TextEncoder();
  const done=new Response(cs.readable).arrayBuffer();
  for(const p of parts)await w.write(enc.encode(p));
  await w.close();
  const bytes=new Uint8Array(await done);
  // 24576 = 3*8192: whole 3-byte groups per chunk, so concatenated btoa
  // output is identical to btoa of the entire buffer (padding only at the end).
  let out='';const CH=24576;
  for(let i=0;i<bytes.length;i+=CH)out+=btoa(String.fromCharCode.apply(null,bytes.subarray(i,i+CH)));
  return out;
}
onmessage=async e=>{
  const {id,op}=e.data;
  try{
    if(op==='encode'){postMessage({id,ok:true,data:await gzipBase64(e.data.parts)});return;}
    if(op==='save'){
      // Local safety copy first; an IndexedDB failure must not block the upload.
      let cacheOk=false,cacheError='';
      try{await tx('readwrite',s=>s.put({userId:e.data.userId,cachedAt:e.data.cachedAt,meta:e.data.meta,json:e.data.parts.join('')}));cacheOk=true;}
      catch(err){cacheError=String(err&&err.message||err);}
      postMessage({id,ok:true,cacheOk,cacheError,data:await gzipBase64(e.data.parts)});return;}
    if(op==='cache-put'){const json=e.data.parts.join('');
      await tx('readwrite',s=>s.put({userId:e.data.userId,cachedAt:e.data.cachedAt,meta:e.data.meta,json}));
      postMessage({id,ok:true});return;}
    if(op==='cache-meta'){const row=await tx('readonly',s=>req(s.get(e.data.userId)));
      postMessage({id,ok:true,row:row?{cachedAt:row.cachedAt,meta:row.meta}:null});return;}
    if(op==='cache-get'){const row=await tx('readonly',s=>req(s.get(e.data.userId)));
      postMessage({id,ok:true,row:row?{cachedAt:row.cachedAt,meta:row.meta,state:JSON.parse(row.json)}:null});return;}
    if(op==='decode'){
      const bin=atob(e.data.data||'');const bytes=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
      const text=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
      postMessage({id,ok:true,text});return;}
    if(op==='cache-clear'){await tx('readwrite',s=>s.delete(e.data.userId));postMessage({id,ok:true});return;}
    postMessage({id,ok:false,error:'unknown op'});
  }catch(err){postMessage({id,ok:false,error:String(err&&err.message||err)});}
};`;
function mf555Worker(){
  if(MF555_SAVE.workerFailed)return null;
  if(MF555_SAVE.worker)return MF555_SAVE.worker;
  try{
    if(typeof Worker!=='function'||typeof CompressionStream!=='function')throw Error('Worker or CompressionStream unavailable');
    const url=URL.createObjectURL(new Blob([MF555_WORKER_SOURCE],{type:'text/javascript'}));
    const w=new Worker(url);
    w.onmessage=e=>{const p=MF555_SAVE.waiters.get(e.data.id);if(!p)return;MF555_SAVE.waiters.delete(e.data.id);
      e.data.ok?p.resolve(e.data):p.reject(new Error(e.data.error||'Worker failed'));};
    w.onerror=e=>{MF555_SAVE.workerFailed=true;for(const p of MF555_SAVE.waiters.values())p.reject(new Error('Save worker crashed'));MF555_SAVE.waiters.clear();MF555_SAVE.worker=null;e.preventDefault?.();};
    MF555_SAVE.worker=w;return w;
  }catch(err){console.warn('MediaFlow v555: background save worker unavailable, using main thread',err);MF555_SAVE.workerFailed=true;return null;}
}
function mf555Call(msg,timeoutMs=120000){
  const w=mf555Worker();
  if(!w)return Promise.reject(new Error('Save worker unavailable'));
  const id=++MF555_SAVE.seq;
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{if(MF555_SAVE.waiters.delete(id))reject(new Error('Save worker timed out'));},timeoutMs);
    MF555_SAVE.waiters.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}});
    w.postMessage({id,...msg});
  });
}

/* ---------- local safety copy (IndexedDB, falls back to localStorage) ---------- */
const mf555WriteRecoveryCacheBase=v115WriteRecoveryCache;
async function mf555PutRecoveryCache(state,parts){
  if(!AUTH_USER||!state||typeof state!=='object')return false;
  const userId=String(AUTH_USER.id);
  const meta=v115StateStats(state);
  meta.profile=!!(state.profilePicture||state.profileName||state.currentTask||state.sessionActive);
  try{
    await mf555Call({op:'cache-put',userId,cachedAt:Date.now(),meta,parts:[parts.join('')]});
    MF555_SAVE.stats.cacheWrites++;
  }catch(err){
    MF555_SAVE.stats.cacheFailures++;
    // Small states still fit the original localStorage cache.
    const json=parts.join('');
    if(json.length<2000000)return mf555WriteRecoveryCacheBase(state,json);
    return false;
  }
  // Keep the legacy localStorage copies only while they fit comfortably.
  try{
    const size=parts.reduce((n,p)=>n+p.length,0);
    if(size<1500000)mf555WriteRecoveryCacheBase(state,parts.join(''));
    else{localStorage.removeItem(v115UserCacheKey());localStorage.removeItem(CLOUD_CACHE_KEY);}
  }catch(_){}
  return true;
}
// Synchronous callers (startup) get a background write instead of a freeze.
v115WriteRecoveryCache=function(state,serializedState){
  if(!AUTH_USER||!state||typeof state!=='object')return false;
  if(MF555_SAVE.workerFailed)return mf555WriteRecoveryCacheBase(state,serializedState);
  const run=async()=>{
    const parts=typeof serializedState==='string'?[serializedState]:await mf555StringifyParts(state);
    return mf555PutRecoveryCache(state,parts);
  };
  // Startup writes wait for an idle moment; the copy only has to exist before
  // the next upload, and every upload writes it again first.
  const later=cb=>typeof requestIdleCallback==='function'?requestIdleCallback(cb,{timeout:15000}):setTimeout(cb,2000);
  later(()=>run().catch(err=>console.warn('MediaFlow v555: recovery copy not written',err)));
  return true;
};
// Reading: newest of IndexedDB and the legacy localStorage cache. The full
// IndexedDB state is loaded only if startup actually needs it (recovery).
const mf555ReadRecoveryCacheBase=v115ReadRecoveryCache;
function mf555StubState(meta){
  // Array lengths and counts match the stored state for v115StateStats.
  const keys={};for(let i=0;i<(meta.xpEntries||0);i++)keys['k'+i]=1;
  return {library:new Array(meta.library||0),sessions:new Array(meta.sessions||0),
    activityLog:new Array(meta.activity||0),completionTimeline:new Array(meta.completions||0),
    xpLedger:{libraryAdditions:keys},savedAt:meta.savedAt||0,profileName:meta.profile?'yes':'',
    __mf555Stub:true};
}
v115ReadRecoveryCache=async function(){
  let legacy=null,idb=null;
  try{legacy=await mf555ReadRecoveryCacheBase();}catch(_){}
  try{
    if(AUTH_USER){const r=await mf555Call({op:'cache-meta',userId:String(AUTH_USER.id)},30000);
      if(r.row)idb={state:mf555StubState(r.row.meta||{}),source:'account',cachedAt:Number(r.row.cachedAt)||0,__mf555Idb:true};}
  }catch(_){}
  if(idb&&(!legacy||Number(idb.state.savedAt)>=Number(legacy.state?.savedAt||0)))return idb;
  return legacy;
};
async function mf555HydrateRecoveryContext(){
  const ctx=V115_RECOVERY_CONTEXT;
  if(!ctx?.cache?.__mf555Idb||!ctx.cache.state?.__mf555Stub)return;
  const r=await mf555Call({op:'cache-get',userId:String(AUTH_USER.id)},120000);
  if(!r.row?.state)throw new Error('The local recovery copy could not be read.');
  ctx.cache.state=r.row.state;
}
const mf555RecoveryRestoreBase=window.MediaFlowRecovery.restore;
window.MediaFlowRecovery.restore=async function(){
  try{await mf555HydrateRecoveryContext();}
  catch(error){v115RenderSafetyScreen({kind:'cloud-error',error,cache:null});return;}
  return mf555RecoveryRestoreBase.apply(this,arguments);
};

/* ---------- cloud write ---------- */
const mf555RawSetBase=rawSet;
rawSet=async function(key,value){
  if(!AUTH_USER||!supabase)throw new Error('MediaFlow cloud session is unavailable.');
  if(MF555_SAVE.workerFailed)return mf555RawSetBase.apply(this,arguments);
  const uploadAccountId=String(AUTH_USER.id);
  const assertUploadAccount=()=>{
    if(String(AUTH_USER?.id||'')!==uploadAccountId)
      throw new Error('Cloud account changed while saving. Upload cancelled; local recovery copy retained.');
  };
  const t0=performance.now();
  const parts=await mf555StringifyParts(value);
  const t1=performance.now();
  assertUploadAccount();
  let payload;
  try{
    // One transfer: the worker writes the local safety copy (before the
    // upload, exactly like v115/v134) and returns the compressed payload.
    const meta=v115StateStats(value);
    meta.profile=!!(value.profilePicture||value.profileName||value.currentTask||value.sessionActive);
    // One flat string: cloning a single string is a copy, many slices are not.
    const saved=await mf555Call({op:'save',userId:uploadAccountId,cachedAt:Date.now(),meta,parts:[parts.join('')]});
    if(saved.cacheOk){
      MF555_SAVE.stats.cacheWrites++;
      try{const size=parts.reduce((n,p)=>n+p.length,0);
        if(size<1500000)mf555WriteRecoveryCacheBase(value,parts.join(''));
        else{localStorage.removeItem(v115UserCacheKey());localStorage.removeItem(CLOUD_CACHE_KEY);}}catch(_){}
    }else{
      MF555_SAVE.stats.cacheFailures++;
      const json=parts.join('');if(json.length<2000000)mf555WriteRecoveryCacheBase(value,json);
    }
    payload={__mediaflowCompressed:'gzip',data:saved.data};
  }catch(err){
    // Worker path failed: the original pipeline remains fully functional.
    MF555_SAVE.stats.fallbacks++;
    console.warn('MediaFlow v555: background encode failed, using the standard save path',err);
    return mf555RawSetBase.apply(this,arguments);
  }
  MF555_SAVE.stats.saves++;MF555_SAVE.stats.serializeMs=Math.round(t1-t0);
  MF555_SAVE.stats.encodeMs=Math.round(performance.now()-t1);MF555_SAVE.stats.lastBytes=payload.data.length;
  let lastError=null;
  const delays=[0,450,1000,2000,4000];
  for(let attempt=0;attempt<delays.length;attempt++){
    if(delays[attempt])await new Promise(r=>setTimeout(r,delays[attempt]));
    try{
      assertUploadAccount();
      const {error}=await supabase.from('mediaflow_states').upsert({user_id:uploadAccountId,state_data:payload,updated_at:new Date().toISOString()},{onConflict:'user_id'});
      assertUploadAccount();
      if(!error)return true;
      lastError=error;
      const code=String(error?.code||'');
      if(code!=='57014'&&!/timeout|canceling statement/i.test(String(error?.message||'')))throw error;
    }catch(e){
      lastError=e;
      const code=String(e?.code||'');
      const timeout=code==='57014'||/timeout|canceling statement/i.test(String(e?.message||''));
      if(!timeout||attempt===delays.length-1)throw e;
      console.warn(`MediaFlow: cloud save timed out, retrying (${attempt+1}/${delays.length-1})...`);
    }
  }
  throw lastError||new Error('MediaFlow cloud save failed.');
};

/* ---------- cloud load: unpack in the worker, parse on the main thread ---------- */
const mf555DecodeBase=decodeCloudState;
decodeCloudState=async function(value){
  if(!value||value.__mediaflowCompressed!=='gzip'||MF555_SAVE.workerFailed||typeof DecompressionStream!=='function')
    return mf555DecodeBase.apply(this,arguments);
  try{const r=await mf555Call({op:'decode',data:value.data},120000);return JSON.parse(r.text);}
  catch(_){return mf555DecodeBase.apply(this,arguments);}
};

/* ---------- unsaved-change protection ---------- */
window.addEventListener('beforeunload',event=>{
  let pending=false;
  try{pending=Boolean(v535PendingSave&&!v535PendingSave.settled)||App.v385CloudSaveStatus?.()==='saving';}catch(_){}
  if(!pending)return;
  event.preventDefault();event.returnValue='';
});
const mf555SaveStateBase=saveState;
saveState=function(){
  const result=mf555SaveStateBase.apply(this,arguments);
  try{const p=v535PendingSave;if(p&&!p.mf555Tracked){p.mf555Tracked=true;Promise.resolve(p.promise).finally(()=>{p.settled=true;});}}catch(_){}
  return result;
};

window.MediaFlowV555Save=Object.freeze({version:MF555_VERSION,stats:()=>({...MF555_SAVE.stats,worker:!!MF555_SAVE.worker,workerFailed:MF555_SAVE.workerFailed}),
  stringify:mf555StringifyParts,clearRecovery:()=>AUTH_USER?mf555Call({op:'cache-clear',userId:String(AUTH_USER.id)}):null});
MediaFlowRuntime.version=MF555_VERSION;
