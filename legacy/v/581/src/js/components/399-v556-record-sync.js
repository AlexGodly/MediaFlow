/* MediaFlow v556 — per-record cloud storage.
 *
 * The account is stored as one row per title, History log, activity entry,
 * collection and settings/XP section (public.mediaflow_records). A save sends
 * only the rows that changed; another device fetches only rows changed since
 * its last sync and merges them record by record.
 *
 * Safety:
 *  - The existing single cloud row (mediaflow_states) is left in place and is
 *    still written in the background (at most every few minutes, and when the
 *    tab is hidden) as a complete fallback copy, so older app versions and the
 *    existing recovery tools keep working.
 *  - Moving an account over happens once, in the background, after a normal
 *    start: every record is uploaded, read back and compared; only when all of
 *    them match is the account switched (a "meta" row written last).
 *  - Changed records are written to this device's IndexedDB copy before every
 *    upload, so an interrupted save is recovered on the next start.
 *  - Records are stored as exact JSON text, so what comes back is byte-for-byte
 *    what was saved (state, order and key order).
 */
const MF556_VERSION=556;
const MF556_TABLE='mediaflow_records';
const MF556_ARRAYS=['library','sessions','activityLog','collections'];
const MF556_SEP='\u001f'; // unit separator: Postgres text cannot hold NUL
const MF556={ready:false,migrated:null,migrating:false,userId:'',device:'',cursor:'',
  local:new Map(),       // key -> {k,i,pos,j,h,sh,sj}  (this device's records)
  legacyAt:'',legacyDirty:false,legacyTimer:null,legacyBusy:false,lastLegacyWrite:0,
  pullTimer:null,pulling:false,pendingRemote:null,lock:Promise.resolve(),editRev:0,rpc:null,
  stats:{saves:0,uploaded:0,deleted:0,lastUpload:0,pulls:0,pulled:0,conflicts:0,migrations:0,fallbacks:0,legacyWrites:0,lastError:''},
  timings:{}};   // last duration (ms) of each phase, for diagnostics
const mf556T=(name,t0)=>{MF556.timings[name]=Math.round(performance.now()-t0);};
const MF556_LEGACY_INTERVAL=3*60*1000;
const MF556_PULL_INTERVAL=60*1000;
const MF556_BATCH_BYTES=900000,MF556_BATCH_ROWS=1000,MF556_PAGE=1000,MF556_RPC_PAGE=10000;
// One save or merge at a time: a merge from another device and a local save
// never interleave on this device's record copy.
function mf556Lock(fn){const run=MF556.lock.then(fn,fn);MF556.lock=run.catch(()=>{});return run;}

function mf556Device(){
  if(MF556.device)return MF556.device;
  try{let d=localStorage.getItem('mediaflow-v556-device');if(!d){d=(crypto.randomUUID?.()||String(Math.random()).slice(2));localStorage.setItem('mediaflow-v556-device',d);}MF556.device=d;}
  catch(_){MF556.device='device-'+String(Math.random()).slice(2);}
  return MF556.device;
}
// 53-bit string hash (cyrb53).
function mf556Hash(str){
  let h1=0xdeadbeef,h2=0x41c6ce57;
  for(let i=0,ch;i<str.length;i++){ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677);}
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
  h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
  return (4294967296*(2097151&h2)+(h1>>>0)).toString(36);
}
const mf556Key=(k,i)=>k+'\u0001'+i;
const mf556Tick=()=>{let last=performance.now();return async()=>{if(performance.now()-last>8){await mf555Yield();last=performance.now();}};};

/* ---------- state <-> records ---------- */
function mf556ArrayHasIds(arr){
  if(!Array.isArray(arr))return false;
  const seen=new Set();
  for(const el of arr){
    if(!el||typeof el!=='object'||Array.isArray(el))return false;
    const id=el.id;
    if((typeof id!=='string'&&typeof id!=='number')||String(id)===''||String(id).length>250)return false;
    const s=String(id);if(seen.has(s))return false;seen.add(s);
  }
  return true;
}
// Positions: keep the existing position of every element whose relative order
// is unchanged (longest increasing run), give new/moved ones positions between
// their neighbours. Appending or editing never moves other records.
function mf556Positions(ids,prev){
  const n=ids.length,old=ids.map(id=>prev.get(id));
  // Longest strictly increasing subsequence over defined old positions.
  const tails=[],tailIdx=[],parent=new Array(n).fill(-1);
  for(let i=0;i<n;i++){
    const v=old[i];if(v==null)continue;
    let lo=0,hi=tails.length;
    while(lo<hi){const m=(lo+hi)>>1;if(tails[m]<v)lo=m+1;else hi=m;}
    tails[lo]=v;tailIdx[lo]=i;parent[i]=lo>0?tailIdx[lo-1]:-1;
  }
  const keep=new Set();
  for(let i=tailIdx[tails.length-1]??-1;i>=0;i=parent[i])keep.add(i);
  const pos=new Array(n);
  let i=0;
  while(i<n){
    if(keep.has(i)){pos[i]=old[i];i++;continue;}
    let j=i;while(j<n&&!keep.has(j))j++;
    const lo=i>0?pos[i-1]:null,hi=j<n?old[j]:null,count=j-i;
    for(let t=0;t<count;t++){
      if(lo==null&&hi==null)pos[i+t]=(i+t)*1024;
      else if(lo==null)pos[i+t]=hi-(count-t)*1024;
      else if(hi==null)pos[i+t]=lo+(t+1)*1024;
      else pos[i+t]=lo+(hi-lo)*(t+1)/(count+1);
    }
    i=j;
  }
  // 4 decimals: the database returns floats with 15 significant digits, so
  // every position must survive that unchanged (|pos| < 1e10 → ≤ 14 digits).
  for(let k=0;k<n;k++)if(!keep.has(k))pos[k]=Math.round(pos[k]*1e4)/1e4;
  // Positions too close together: renumber everything once.
  for(let k=1;k<n;k++)if(!(pos[k]>pos[k-1])||pos[k]-pos[k-1]<2e-4){for(let m=0;m<n;m++)pos[m]=m*1024;break;}
  return pos;
}
// Break a state into records: {k,i,pos,j}. j is the exact JSON text.
async function mf556Decompose(state,tick=mf556Tick()){
  const out=new Map();
  const add=(k,i,pos,j)=>{if(j!==undefined)out.set(mf556Key(k,i),{k,i,pos,j});};
  const keys=Object.keys(state);
  add('doc','__keys',null,JSON.stringify(keys));
  for(const key of keys){
    const v=state[key];
    if(MF556_ARRAYS.includes(key)&&mf556ArrayHasIds(v)){
      const ids=v.map(el=>String(el.id));
      const prev=new Map();
      for(let n=0;n<ids.length;n++){const r=MF556.local.get(mf556Key(key,ids[n]));if(r&&r.pos!=null)prev.set(ids[n],r.pos);if(n%2000===1999)await tick();}
      const pos=mf556Positions(ids,prev);
      add('doc','__array'+MF556_SEP+key,null,'1');
      for(let n=0;n<v.length;n++){add(key,ids[n],pos[n],JSON.stringify(v[n]));if(n%500===499)await tick();}
      continue;
    }
    if(v&&typeof v==='object'&&!Array.isArray(v)&&typeof v.toJSON!=='function'){
      const sub=Object.keys(v);
      add('doc',key+MF556_SEP,null,JSON.stringify(sub));
      for(const s of sub)add('doc',key+MF556_SEP+s,null,JSON.stringify(v[s]));
      await tick();continue;
    }
    add('doc',key,null,JSON.stringify(v));
    await tick();
  }
  return out;
}
// Rebuild a state from records (key order, array order and object key order kept).
async function mf556Compose(records,tick=mf556Tick()){
  const docs=new Map(),arrays=new Map();
  for(const r of records){
    if(r.k==='doc')docs.set(r.i,r.j);
    else if(MF556_ARRAYS.includes(r.k)){let a=arrays.get(r.k);if(!a)arrays.set(r.k,a=[]);a.push(r);}
  }
  const keysJson=docs.get('__keys');
  if(!keysJson)return null;
  const state={};
  for(const key of JSON.parse(keysJson)){
    if(docs.has('__array'+MF556_SEP+key)){
      const rows=(arrays.get(key)||[]).slice().sort((a,b)=>a.pos-b.pos||(a.i<b.i?-1:a.i>b.i?1:0));
      const arr=new Array(rows.length);
      for(let n=0;n<rows.length;n++){arr[n]=JSON.parse(rows[n].j);if(n%500===499)await tick();}
      state[key]=arr;continue;
    }
    const subKeys=docs.get(key+MF556_SEP);
    if(subKeys!==undefined){
      const obj={};
      for(const s of JSON.parse(subKeys)){const j=docs.get(key+MF556_SEP+s);if(j!==undefined)obj[s]=JSON.parse(j);}
      state[key]=obj;continue;
    }
    const j=docs.get(key);
    if(j!==undefined)state[key]=JSON.parse(j);
  }
  return state;
}

/* ---------- this device's copy (IndexedDB) ---------- */
// Records are kept in 256 chunks (grouped by key) rather than one entry each:
// a save rewrites only the chunks it touched, and a new device writes 256
// entries instead of 200,000.
const MF556_CHUNKS=256;
function mf556Chunk(key){let h=2166136261;for(let i=0;i<key.length;i++){h^=key.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0)%MF556_CHUNKS;}
function mf556Db(){
  if(MF556.dbPromise)return MF556.dbPromise;
  MF556.dbPromise=new Promise((res,rej)=>{
    const r=indexedDB.open('mediaflow-v556',2);
    r.onupgradeneeded=()=>{const db=r.result;
      if(db.objectStoreNames.contains('records'))db.deleteObjectStore('records');
      if(!db.objectStoreNames.contains('chunks')){const s=db.createObjectStore('chunks',{keyPath:['u','b']});s.createIndex('u','u');}
      if(!db.objectStoreNames.contains('meta'))db.createObjectStore('meta',{keyPath:'u'});};
    r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);
  });
  return MF556.dbPromise;
}
function mf556Tx(stores,mode,fn){
  return mf556Db().then(db=>new Promise((res,rej)=>{
    const t=db.transaction(stores,mode);let out;
    Promise.resolve(fn(t)).then(v=>{out=v;});
    t.oncomplete=()=>res(out);t.onerror=t.onabort=()=>rej(t.error||new Error('IndexedDB transaction failed'));
  }));
}
const mf556Req=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});
async function mf556LoadLocal(userId){
  if(MF556.userId===userId&&MF556.loaded)return;
  MF556.local=new Map();MF556.cursor='';MF556.legacyAt='';MF556.loaded=false;
  try{
    const [meta,chunks]=await mf556Tx(['meta','chunks'],'readonly',async t=>[
      await mf556Req(t.objectStore('meta').get(userId)),
      await mf556Req(t.objectStore('chunks').index('u').getAll(userId))]);
    const tick=mf556Tick();
    for(const c of chunks||[]){for(const r of c.rows||[])MF556.local.set(r.key,{k:r.k,i:r.i,pos:r.pos,j:r.j,h:r.h,sh:r.sh,sj:r.sj});await tick();}
    MF556.cursor=meta?.cursor||'';MF556.legacyAt=meta?.legacyAt||'';MF556.localSavedAt=meta?.savedAt||0;
  }catch(e){console.warn('MediaFlow v556: local copy unavailable',e);}
  MF556.userId=userId;MF556.loaded=true;
}
async function mf556SaveLocal(keys){
  const u=MF556.userId;if(!u)return;
  const touched=new Set();
  for(const key of keys)touched.add(mf556Chunk(key));
  if(!touched.size)return;
  const groups=new Map([...touched].map(b=>[b,[]]));
  const tick=mf556Tick();let n=0;
  for(const [key,r] of MF556.local){
    if(++n%4096===0)await tick();
    const g=groups.get(mf556Chunk(key));
    if(g)g.push({key,k:r.k,i:r.i,pos:r.pos,j:r.j,h:r.h,sh:r.sh,sj:r.sj});
  }
  const list=[...groups];
  for(let x=0;x<list.length;x+=32){
    const part=list.slice(x,x+32);
    await mf556Tx(['chunks'],'readwrite',t=>{const s=t.objectStore('chunks');
      for(const [b,rows] of part){if(rows.length)s.put({u,b,rows});else s.delete([u,b]);}});
  }
}
async function mf556SaveMeta(extra={}){
  if(!MF556.userId)return;
  await mf556Tx(['meta'],'readwrite',t=>{t.objectStore('meta').put({u:MF556.userId,cursor:MF556.cursor,legacyAt:MF556.legacyAt,savedAt:MF556.localSavedAt||0,version:MF556_VERSION,...extra});});
}
async function mf556ClearLocal(userId){
  await mf556Tx(['chunks','meta'],'readwrite',async t=>{
    const keys=await mf556Req(t.objectStore('chunks').index('u').getAllKeys(userId));
    for(const k of keys)t.objectStore('chunks').delete(k);t.objectStore('meta').delete(userId);});
}

/* ---------- cloud table ---------- */
async function mf556CloudMeta(){
  const {data,error}=await supabase.from(MF556_TABLE).select('record_id,data,updated_at').eq('user_id',AUTH_USER.id).eq('kind','meta').eq('record_id','store').maybeSingle();
  if(error)throw error;
  return data?{...JSON.parse(data.data||'{}'),updatedAt:data.updated_at}:null;
}
// All rows changed after `since` (or every row), page by page.
// Keyset paging on updated_at (not offsets): a row saved while we read moves
// to the end and is still picked up; duplicates are removed by key+time.
// Preferred: one database call returns up to 10,000 rows (true keyset paging on
// updated_at, kind, record_id), so a new device needs ~20 calls for 100,000
// titles instead of ~200. Falls back to plain paging if the function is missing.
async function mf556FetchRpc(since,onPage){
  const rows=[];let at=since||null,kind='',id='';
  for(;;){
    const {data,error}=await supabase.rpc('mediaflow_records_page',{p_after_at:at,p_after_kind:kind,p_after_id:id,p_limit:MF556_RPC_PAGE});
    if(error)throw Object.assign(new Error(error.message||'Record page failed'),{code:error.code,rpcMissing:/PGRST202|42883|Could not find the function/i.test(String(error.code||'')+' '+String(error.message||''))});
    const list=Array.isArray(data)?data:[];
    for(const r of list)rows.push(r);
    onPage?.(rows.length);
    if(list.length<MF556_RPC_PAGE)break;
    const last=list[list.length-1];at=last.updated_at;kind=last.kind;id=last.record_id;
    await mf555Yield();
  }
  return rows;
}
async function mf556Fetch(since,onPage){
  if(MF556.rpc!==false){
    try{const rows=await mf556FetchRpc(since,onPage);MF556.rpc=true;return rows;}
    catch(e){if(!e.rpcMissing)throw e;MF556.rpc=false;}
  }
  return mf556FetchPaged(since,onPage);
}
async function mf556FetchPaged(since,onPage){
  const rows=[],seen=new Set();let after=since||'',first=true;
  for(;;){
    let q=supabase.from(MF556_TABLE).select('kind,record_id,pos,data,deleted,device_id,updated_at').eq('user_id',AUTH_USER.id);
    if(after)q=first&&since?q.gt('updated_at',after):q.gte('updated_at',after);
    const {data,error}=await q.order('updated_at',{ascending:true}).order('kind',{ascending:true}).order('record_id',{ascending:true}).range(0,MF556_PAGE-1);
    if(error)throw error;
    let added=0;
    for(const r of data||[]){const id=r.kind+'\u0001'+r.record_id+'\u0001'+r.updated_at;if(seen.has(id))continue;seen.add(id);rows.push(r);added++;}
    onPage?.(rows.length);
    first=false;
    if(!data||data.length<MF556_PAGE)break;
    const last=data[data.length-1].updated_at;
    if(!added||last===after){
      // More than a page shares one timestamp: read that instant with offsets.
      let from=MF556_PAGE;
      for(;;){const r2=await supabase.from(MF556_TABLE).select('kind,record_id,pos,data,deleted,device_id,updated_at').eq('user_id',AUTH_USER.id).eq('updated_at',last).order('kind',{ascending:true}).order('record_id',{ascending:true}).range(from,from+MF556_PAGE-1);
        if(r2.error)throw r2.error;for(const r of r2.data||[]){const id=r.kind+'\u0001'+r.record_id+'\u0001'+r.updated_at;if(!seen.has(id)){seen.add(id);rows.push(r);}}
        if(!r2.data||r2.data.length<MF556_PAGE)break;from+=MF556_PAGE;}
      after=last;first=true;since=last;   // continue strictly after this instant
      continue;
    }
    after=last;
  }
  return rows;
}
async function mf556Upload(rows,onProgress){
  const user=String(AUTH_USER.id),device=mf556Device();
  let batch=[],bytes=0,done=0,maxAt='';
  const flush=async()=>{
    if(!batch.length)return;
    let lastErr=null;
    for(const wait of [0,600,1500,3500]){
      if(wait)await new Promise(r=>setTimeout(r,wait));
      if(String(AUTH_USER?.id||'')!==user)throw new Error('Cloud account changed while saving. Upload cancelled; local copy retained.');
      const {data,error}=await supabase.from(MF556_TABLE).upsert(batch,{onConflict:'user_id,kind,record_id'}).select('updated_at');
      if(!error){for(const r of data||[])if(r.updated_at>maxAt)maxAt=r.updated_at;lastErr=null;break;}
      lastErr=error;
      if(!/timeout|57014|fetch|network|503|502|504/i.test(String(error?.message||error?.code||'')))break;
    }
    if(lastErr)throw lastErr;
    done+=batch.length;onProgress?.(done);batch=[];bytes=0;
  };
  for(const r of rows){
    const row={user_id:user,kind:r.k,record_id:r.i,pos:r.pos??null,data:r.deleted?null:r.j,deleted:!!r.deleted,device_id:device};
    const size=(r.j?.length||0)+200;
    if(batch.length&&(bytes+size>MF556_BATCH_BYTES||batch.length>=MF556_BATCH_ROWS))await flush();
    batch.push(row);bytes+=size;
  }
  await flush();
  return maxAt;
}

/* ---------- merging rows from the cloud ---------- */
function mf556RecordTime(j){
  try{const v=JSON.parse(j);return Number(v?.modifiedAt||v?.updatedAt||v?.timestamp||0)||0;}catch(_){return 0;}
}
// Apply cloud rows to this device's records. Returns the keys whose LOCAL value changed.
async function mf556ApplyRows(rows,undo=null){
  const changed=new Set(),tick=mf556Tick();
  const remember=key=>{if(undo&&!undo.has(key))undo.set(key,MF556.local.get(key));};
  let n=0;
  for(const row of rows){
    if(++n%256===0)await tick();
    if(row.kind==='meta')continue;
    const key=mf556Key(row.kind,row.record_id);
    const j=row.deleted?null:row.data;
    const h=j==null?null:mf556Hash(j+'|'+(row.pos??''));
    const cur=MF556.local.get(key);
    if(row.updated_at>MF556.cursor)MF556.cursor=row.updated_at;
    if(cur&&cur.sh===h)continue;                                            // already known (or our own save)
    if(!cur&&j==null)continue;                                              // deletion of something we never had
    if(cur&&!cur.h&&cur.sh&&j==null){remember(key);MF556.local.delete(key);continue;} // both deleted it
    const pending=cur&&cur.h!==cur.sh;                                      // unsent local change
    remember(key);
    if(!pending){
      if(j==null){if(cur){MF556.local.delete(key);changed.add(key);}continue;}
      MF556.local.set(key,{k:row.kind,i:row.record_id,pos:row.pos,j,h,sh:h});changed.add(key);continue;
    }
    // Both sides changed the same record.
    MF556.stats.conflicts++;
    const localWins=j==null?false:(row.kind!=='doc'&&mf556RecordTime(cur.j)>=mf556RecordTime(j));
    if(row.kind==='doc'&&j!=null&&cur.j!=null){
      // Sections of settings/XP: keep both sides' entries (this device wins on the same entry).
      try{
        const a=JSON.parse(j),b=JSON.parse(cur.j);
        if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){
          const merged=JSON.stringify({...a,...b});
          MF556.local.set(key,{...cur,j:merged,h:mf556Hash(merged+'|'+(cur.pos??'')),sh:h,sj:j});changed.add(key);continue;
        }
      }catch(_){}
    }
    if(localWins){MF556.local.set(key,{...cur,sh:h,sj:j});}
    else if(j==null){MF556.local.delete(key);changed.add(key);}
    else{MF556.local.set(key,{k:row.kind,i:row.record_id,pos:row.pos,j,h,sh:h});changed.add(key);}
  }
  return changed;
}
const mf556LocalState=()=>mf556Compose([...MF556.local.values()].filter(r=>r.j!=null));
// The cloud's copy: what was last confirmed on the server for every record.
const mf556CloudState=()=>mf556Compose([...MF556.local.values()].map(r=>r.sh===r.h?r:(r.sj!==undefined?{...r,j:r.sj}:null)).filter(r=>r&&r.j!=null&&r.sh!=null));

/* ---------- save (replaces the single-row upload) ---------- */
async function mf556SaveState(state){
  const tick=mf556Tick();let t0=performance.now();
  const recs=await mf556Decompose(state,tick);mf556T('saveDecompose',t0);t0=performance.now();
  const changed=[],seen=new Set();let n=0;
  for(const [key,r] of recs){
    seen.add(key);
    if(++n%512===0)await tick();
    const cur=MF556.local.get(key);
    // Unchanged and already in the cloud: a plain text comparison, no hashing.
    if(cur&&cur.h===cur.sh&&cur.j===r.j&&(cur.pos??null)===(r.pos??null))continue;
    const h=mf556Hash(r.j+'|'+(r.pos??''));
    if(cur&&cur.h===h&&cur.sh===h)continue;
    const next={k:r.k,i:r.i,pos:r.pos,j:r.j,h,sh:cur?.sh??null};
    if(cur&&cur.sh!=null&&cur.sh!==h)next.sj=cur.sh===cur.h?cur.j:cur.sj;
    MF556.local.set(key,next);changed.push(key);
  }
  // Removed records stay as pending deletions until the cloud confirms them.
  const removed=[];n=0;
  for(const [key,r] of [...MF556.local]){
    if(++n%2048===0)await tick();
    if(seen.has(key))continue;
    if(r.sh==null){MF556.local.delete(key);removed.push({key,r,local:true});continue;}
    if(r.j===null&&r.h===null){removed.push({key,r});continue;}          // already a pending deletion
    MF556.local.set(key,{k:r.k,i:r.i,pos:null,j:null,h:null,sh:r.sh,sj:r.sh===r.h?r.j:r.sj});removed.push({key,r});
  }
  MF556.localSavedAt=Number(state.savedAt)||Date.now();
  mf556T('saveDiff',t0);t0=performance.now();
  // Safety copy on this device first.
  await mf556SaveLocal([...changed,...removed.map(x=>x.key)]);await mf556SaveMeta();
  const deletions=removed.filter(x=>!x.local);
  const rows=[...changed.map(k=>MF556.local.get(k)),...deletions.map(x=>({k:x.r.k,i:x.r.i,deleted:true}))];
  if(rows.length){
    const maxAt=await mf556Upload(rows);
    for(const k of changed){const r=MF556.local.get(k);if(r){r.sh=r.h;delete r.sj;}}
    for(const x of deletions)MF556.local.delete(x.key);
    if(maxAt&&maxAt>MF556.cursor)MF556.cursor=maxAt;
    await mf556SaveLocal([...changed,...deletions.map(x=>x.key)]);await mf556SaveMeta();
  }
  mf556T('saveUpload',t0);
  MF556.stats.saves++;MF556.stats.uploaded+=changed.length;MF556.stats.deleted+=deletions.length;MF556.stats.lastUpload=rows.length;
  mf556ScheduleLegacy();
  return true;
}

/* ---------- the single-row fallback copy, kept current in the background ---------- */
function mf556ScheduleLegacy(force=false){
  MF556.legacyDirty=true;
  if(MF556.legacyTimer)return;
  const wait=force?0:Math.max(0,MF556.lastLegacyWrite+MF556_LEGACY_INTERVAL-Date.now());
  MF556.legacyTimer=setTimeout(()=>{MF556.legacyTimer=null;mf556WriteLegacy().catch(e=>console.warn('MediaFlow v556: fallback copy not updated',e));},wait);
}
async function mf556WriteLegacy(){
  if(!MF556.legacyDirty||MF556.legacyBusy||!AUTH_USER||V115_STARTUP_GUARD)return;
  MF556.legacyBusy=true;MF556.legacyDirty=false;
  try{
    const state=snapshot();
    const parts=await mf555StringifyParts(state);
    const enc=await mf555Call({op:'encode',parts:[parts.join('')]});
    const marker={device:mf556Device(),at:Date.now(),version:MF556_VERSION};
    const updatedAt=new Date().toISOString();
    const {error}=await supabase.from('mediaflow_states').upsert({user_id:String(AUTH_USER.id),
      state_data:{__mediaflowCompressed:'gzip',data:enc.data,mf556:marker},updated_at:updatedAt},{onConflict:'user_id'});
    if(error)throw error;
    MF556.legacyAt=updatedAt;MF556.lastLegacyWrite=Date.now();MF556.stats.legacyWrites++;
    await mf556SaveMeta();
  }catch(e){MF556.legacyDirty=true;throw e;}
  finally{MF556.legacyBusy=false;}
}
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden'&&MF556.migrated&&MF556.legacyDirty){
    if(MF556.legacyTimer){clearTimeout(MF556.legacyTimer);MF556.legacyTimer=null;}
    mf556WriteLegacy().catch(()=>{});
  }
  if(document.visibilityState==='visible')mf556SchedulePull(1500);
});
// Was the single row written by an older MediaFlow version since our last copy?
async function mf556LegacyFromOlderVersion(){
  const {data,error}=await supabase.from('mediaflow_states').select('updated_at,state_data->mf556').eq('user_id',AUTH_USER.id).maybeSingle();
  if(error||!data)return false;
  const marker=data.mf556||data['state_data->mf556'];
  return !marker&&data.updated_at!==MF556.legacyAt&&(!MF556.legacyAt||data.updated_at>MF556.legacyAt);
}

/* ---------- start-up / cloud reads ---------- */
const mf556FetchCloudBase=v115FetchCloudState;
v115FetchCloudState=async function(){
  if(!AUTH_USER||!supabase)return mf556FetchCloudBase.apply(this,arguments);
  const userId=String(AUTH_USER.id);
  let meta=null;
  try{meta=await mf556CloudMeta();}
  catch(e){MF556.stats.lastError=String(e?.message||e);MF556.stats.fallbacks++;MF556.migrated=null;return mf556FetchCloudBase.apply(this,arguments);}
  if(!meta){MF556.migrated=false;return mf556FetchCloudBase.apply(this,arguments);}
  try{
    let t0=performance.now();
    await mf556LoadLocal(userId);mf556T('bootLocal',t0);t0=performance.now();
    const fresh=!MF556.cursor||!MF556.local.size;
    if(fresh){MF556.local=new Map();MF556.cursor='';}
    // Small overlap so rows written in the same instant are never missed.
    const since=fresh?'':new Date(Date.parse(MF556.cursor)-3000).toISOString();
    const rows=await mf556Fetch(since);mf556T('bootFetch',t0);t0=performance.now();
    const changed=await mf556ApplyRows(rows);mf556T('bootApply',t0);t0=performance.now();
    MF556.stats.pulled+=rows.length;
    await mf556SaveLocal(changed);await mf556SaveMeta();mf556T('bootSaveLocal',t0);t0=performance.now();
    let state=await mf556CloudState();mf556T('bootCompose',t0);t0=performance.now();
    if(!state)throw new Error('Cloud records are incomplete.');
    // An older MediaFlow version saved the single row since: merge its changes in.
    try{
      if(await mf556LegacyFromOlderVersion()){
        const legacy=await mf556FetchCloudBase.apply(this,arguments);
        if(legacy?.found&&legacy.state){state=mergeStates(state,legacy.state);MF556.legacyMerged=true;}
      }
    }catch(_){}
    mf556T('bootLegacyCheck',t0);
    MF556.migrated=true;MF556.ready=true;
    return {found:true,state,updatedAt:meta.updatedAt||null};
  }catch(e){
    // Records unreadable: the single-row copy is the fallback.
    console.warn('MediaFlow v556: record storage unavailable, using the fallback copy',e);
    MF556.stats.lastError=String(e?.message||e);MF556.stats.fallbacks++;MF556.migrated=null;
    return mf556FetchCloudBase.apply(this,arguments);
  }
};
const mf556RawGetBase=rawGet;
rawGet=async function(key){
  if(key!==STATE_KEY||!MF556.migrated||V115_BOOTSTRAP_OVERRIDE)return mf556RawGetBase.apply(this,arguments);
  const cloud=await v115FetchCloudState();
  return cloud?.state;
};
// This device's copy for the start-up safety check (unsent changes = newer).
const mf556ReadRecoveryBase=v115ReadRecoveryCache;
v115ReadRecoveryCache=async function(){
  const base=await mf556ReadRecoveryBase.apply(this,arguments);
  try{
    if(!AUTH_USER)return base;
    const t0=performance.now();
    await mf556LoadLocal(String(AUTH_USER.id));mf556T('bootLocalRead',t0);
    const pending=[...MF556.local.values()].some(r=>r.h!==r.sh);
    if(!pending||!MF556.local.size)return base;
    const state=await mf556LocalState();
    if(!state)return base;
    if(base&&Number(base.state?.savedAt||0)>Number(state.savedAt||0))return base;
    return {state,source:'account',cachedAt:Number(state.savedAt)||Date.now(),mf556:true};
  }catch(_){return base;}
};

/* ---------- saving: records when the account has moved, otherwise as before ---------- */
const mf556RawSetBase=rawSet;
rawSet=async function(key,value){
  if(key!==STATE_KEY||!MF556.migrated||!AUTH_USER)return mf556RawSetBase.apply(this,arguments);
  if(String(AUTH_USER.id)!==MF556.userId)await mf556LoadLocal(String(AUTH_USER.id));
  try{return await mf556Lock(()=>mf556SaveState(value));}
  catch(e){MF556.stats.lastError=String(e?.message||e);throw e;}
};

// Once an account uses records, this device's record copy is the safety copy;
// the full single-file copy is no longer rewritten at every start.
const mf556WriteRecoveryBase=v115WriteRecoveryCache;
v115WriteRecoveryCache=function(){
  if(MF556.migrated)return true;
  return mf556WriteRecoveryBase.apply(this,arguments);
};

/* ---------- other devices' changes, while the app is open ---------- */
function mf556SchedulePull(ms=MF556_PULL_INTERVAL){
  if(MF556.pullTimer)clearTimeout(MF556.pullTimer);
  MF556.pullTimer=setTimeout(()=>{MF556.pullTimer=null;mf556Pull().finally(()=>mf556SchedulePull());},ms);
}
function mf556Busy(){
  return document.visibilityState==='hidden'||!AUTH_READY||V115_STARTUP_GUARD||S.loading||
    (typeof V134_HEAVY_OPERATION!=='undefined'&&V134_HEAVY_OPERATION)||
    !!document.querySelector('#modal-root .modal-overlay,.mf274-overlay:not([hidden]),#mf555-log-popup,.data-progress:not(.done)')||
    (typeof v535PendingSave!=='undefined'&&v535PendingSave&&!v535PendingSave.settled);
}
async function mf556Pull(){
  if(!MF556.migrated||MF556.pulling||!navigator.onLine||mf556Busy())return {skipped:true};
  MF556.pulling=true;
  try{
    const since=MF556.cursor?new Date(Date.parse(MF556.cursor)-3000).toISOString():'';
    const rows=await mf556Fetch(since);
    MF556.stats.pulls++;
    if(!rows.length){await mf556SaveMeta();return {rows:0};}
    return await mf556Lock(async()=>{
      if(mf556Busy())return {skipped:true};
      // Remember what the merge replaces: if the person edits something while
      // it runs, the merge is undone and simply repeated at the next pull, so
      // their edit is never overwritten and the other device's change is not lost.
      const rev=MF556.editRev,cursor0=MF556.cursor,undo=new Map();
      const changed=await mf556ApplyRows(rows,undo);
      const rollback=()=>{for(const [k,v] of undo){if(v)MF556.local.set(k,v);else MF556.local.delete(k);}MF556.cursor=cursor0;};
      let merged=null;
      if(changed.size)merged=await mf556LocalState();
      if(changed.size&&(!merged||mf556Busy()||rev!==MF556.editRev)){rollback();return {skipped:true,retry:true};}
      MF556.stats.pulled+=rows.length;
      if(changed.size){
        const view=S.view;
        v46ApplyState(merged);
        try{v155ApplyPortableExtras(merged.portableExtras);}catch(_){}
        try{V153_HISTORY_CACHE_DIRTY=true;v149MarkStreakDirty();v53InvalidateLibraryCache();}catch(_){}
        S.view=view;render();
        showToast('Updated with changes from your other device.');
      }
      await mf556SaveLocal(undo.keys());await mf556SaveMeta();
      return {rows:rows.length,changed:changed.size};
    });
  }catch(e){MF556.stats.lastError=String(e?.message||e);return {error:true};}
  finally{MF556.pulling=false;}
}

/* ---------- one-time move to record storage ---------- */
async function mf556Migrate({onProgress}={}){
  if(MF556.migrating||MF556.migrated||!AUTH_USER||V115_STARTUP_GUARD)return {skipped:true};
  MF556.migrating=true;
  const userId=String(AUTH_USER.id),rev0=MF556.editRev;
  try{
    if(await mf556CloudMeta()){MF556.migrated=true;return {already:true};}
    await mf556LoadLocal(userId);
    MF556.local=new Map();MF556.cursor='';
    const state=JSON.parse(JSON.stringify(snapshot()));
    const recs=await mf556Decompose(state);
    const rows=[];
    for(const [key,r] of recs){const h=mf556Hash(r.j+'|'+(r.pos??''));MF556.local.set(key,{...r,h,sh:null});rows.push(MF556.local.get(key));}
    onProgress?.(0,rows.length);
    // Clear rows left by an interrupted earlier attempt (no meta = never used).
    const prior=await mf556Fetch('');
    const stale=prior.filter(p=>p.kind!=='meta'&&!recs.has(mf556Key(p.kind,p.record_id))&&!p.deleted).map(p=>({k:p.kind,i:p.record_id,deleted:true}));
    await mf556Upload([...rows,...stale],done=>onProgress?.(done,rows.length));
    // Read everything back and compare before switching.
    const back=await mf556Fetch('');
    const byKey=new Map(back.filter(r=>!r.deleted&&r.kind!=='meta').map(r=>[mf556Key(r.kind,r.record_id),r]));
    let bad=0;
    for(const [key,r] of MF556.local){const b=byKey.get(key);if(!b||b.data!==r.j||(b.pos??null)!==(r.pos??null))bad++;}
    if(bad||byKey.size!==MF556.local.size)throw new Error('Verification failed: '+bad+' of '+MF556.local.size+' records differ.');
    const composed=await mf556Compose([...byKey.values()].map(r=>({k:r.kind,i:r.record_id,pos:r.pos,j:r.data})));
    if(JSON.stringify(composed)!==JSON.stringify(state))throw new Error('Verification failed: rebuilt account differs.');
    for(const r of MF556.local.values())r.sh=r.h;
    MF556.cursor=back.reduce((m,r)=>r.updated_at>m?r.updated_at:m,'');
    await mf556SaveLocal([...MF556.local.keys()]);
    // Switch: the meta row is written last.
    const {error}=await supabase.from(MF556_TABLE).upsert({user_id:userId,kind:'meta',record_id:'store',pos:null,deleted:false,device_id:mf556Device(),
      data:JSON.stringify({version:MF556_VERSION,migratedAt:Date.now(),records:MF556.local.size})},{onConflict:'user_id,kind,record_id'});
    if(error)throw error;
    MF556.migrated=true;MF556.ready=true;MF556.stats.migrations++;
    MF556.lastLegacyWrite=Date.now();
    await mf556SaveMeta();
    mf556ScheduleLegacy(true);
    mf556SchedulePull();
    // Edits made while moving went to the old storage: send them as records too.
    if(MF556.editRev!==rev0)setTimeout(()=>{try{saveState();}catch(_){}},0);
    return {ok:true,records:MF556.local.size};
  }catch(e){
    console.warn('MediaFlow v556: storage upgrade postponed; the current storage stays in use',e);
    MF556.stats.lastError=String(e?.message||e);
    MF556.local=new Map();MF556.cursor='';
    try{await mf556ClearLocal(userId);}catch(_){}
    return {ok:false,error:String(e?.message||e)};
  }finally{MF556.migrating=false;}
}
// Start-up hook: after a normal start, either keep records in sync or move over.
const mf556StartBase=v115StartWithData;
v115StartWithData=async function(){
  const out=await mf556StartBase.apply(this,arguments);
  // Starting from the recovery screen ("Recover" / "Use cloud") skipped the
  // normal start-up's ready flags, leaving sync, ratings and imports blocked
  // until a reload. A successful start always marks the account ready.
  if(out===true&&AUTH_USER&&!V115_STARTUP_GUARD){
    AUTH_READY=true;
    try{V475_AUTH.hydrated=true;V475_AUTH.bootId=String(AUTH_USER.id);}catch(_){}
  }
  if(out===true&&AUTH_USER){
    if(MF556.migrated){
      mf556SchedulePull();
      // Merged in an older version's single-row save: send those changes as records.
      if(MF556.legacyMerged){MF556.legacyMerged=false;setTimeout(()=>{try{saveState();}catch(_){}},1500);}
    }else if(MF556.migrated===false){
      const go=()=>mf556Migrate().then(r=>{if(r?.ok)console.info('MediaFlow v556: cloud storage upgraded ('+r.records+' records).');});
      typeof requestIdleCallback==='function'?requestIdleCallback(go,{timeout:8000}):setTimeout(go,3000);
    }
  }
  return out;
};
// Count edits (every change goes through saveState) so a merge never lands on top of one.
const mf556SaveStateBase=saveState;
saveState=function(){MF556.editRev++;return mf556SaveStateBase.apply(this,arguments);};
// A background task finishing while the account is still loading (a slow
// start on a large account) must not draw pages from empty data.
const mf556RenderBase=render;
render=function(){
  if(S&&S.loading===true&&!Array.isArray(S.library))return;
  return mf556RenderBase.apply(this,arguments);
};
App.mf556SyncNowPull=()=>mf556Pull();

window.MediaFlowV556=Object.freeze({version:MF556_VERSION,stats:()=>({...MF556.stats,timings:{...MF556.timings},migrated:MF556.migrated,records:MF556.local.size,cursor:MF556.cursor,
  pending:[...MF556.local.values()].filter(r=>r.h!==r.sh).length}),
  migrate:mf556Migrate,pull:mf556Pull,decompose:mf556Decompose,compose:mf556Compose,positions:mf556Positions,flushFallback:()=>{MF556.legacyDirty=true;return mf556WriteLegacy();}});
MediaFlowRuntime.version=MF556_VERSION;
