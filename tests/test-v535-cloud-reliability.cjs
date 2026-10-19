/* MediaFlow v535 — cloud safety and transfer regression tests.
 * Run after scripts/build.py, without credentials or network access. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const base=read('src/js/services/cloud-sync/004-v115-cloud-data-loss-prevention-recovery-guard.js');
const module535=read('src/js/components/380-v535-cloud-portability-performance.js');
const runtime=JSON.parse(read('src/js/runtime-order.json'));
const bundle=read('assets/js/mediaflow-v535.bundle.js');
const backup=read('src/js/components/373-v507-persistence-portability-pwa-audit.js');
const version=Number(read('VERSION').trim());
assert.equal(version,535);
assert(runtime.includes('components/380-v535-cloud-portability-performance.js'));
assert(bundle.includes('function mf535VerifyCloudReadOnly()'));
assert(bundle.includes('v535PendingSave'));
assert(backup.includes('backupSnapshot=function(){return v148BuildFullBackup();}'));
assert(base.includes('activityLog: Array.isArray(S.activityLog) ? S.activityLog.slice() : []'));
assert(base.includes('out.activityLog=[...activityById.values()].sort('));
assert(!base.includes('out.activityLog=[...activityById.values()].sort((x,y)=>Number(y.timestamp||0)-Number(x.timestamp||0)).slice(0,1000)'));
assert(module535.includes("await saveQueue"));
assert(module535.includes("result!==true||lastSaveFailed"));
assert(module535.includes("v155VerifyCloudState(cloud.state,expected)"));
assert(module535.includes("xpLedger"));
assert(module535.includes("App.v535VerifyCloudReadOnly"));
assert(module535.includes("App.v535ExportAuditReport"));
const bStart=base.indexOf('async function rawSet(key,value){');
const bEnd=base.indexOf('\nfunction v84MergeLibraryItem(',bStart);
const qStart=base.indexOf('let v535PendingSave=null;');
const qEnd=base.indexOf('\nfunction showSaveError(){',qStart);
assert(bStart>=0&&bEnd>bStart&&qStart>=0&&qEnd>qStart);
const injected=base.slice(bStart,bEnd)+'\n'+base.slice(qStart,qEnd);
const writes=[];
let saveRevision=1;
let showErrors=0,hideErrors=0,cacheWrites=0;
const context=vm.createContext({
  console:{warn(){},error(){}},Promise,JSON,String,Error,Date,Set,Array,
  AUTH_USER:{id:'account-a'},V115_STARTUP_GUARD:false,STATE_KEY:'account-state',
  supabase:{from(name){assert.equal(name,'mediaflow_states');return {
    async upsert(data){writes.push(data);return {error:null};}
  };}},
  encodeCloudState:async value=>value,
  v115WriteRecoveryCache(){cacheWrites++;},
  snapshot:()=>({savedAt:saveRevision,revision:saveRevision,activityLog:[1,2,3]}),
  saveQueue:Promise.resolve(),lastSaveFailed:false,
  showSaveError(){showErrors++;},hideSaveError(){hideErrors++;},
  setTimeout(fn){fn();}
});
new vm.Script(injected,{filename:'v535-extracted-cloud-runtime.js'}).runInContext(context);
(async()=>{
  // Many synchronous UI updates must produce one snapshot/write, and saveState
  // must report confirmed success instead of the old undefined success.
  const first=vm.runInContext('saveState()',context);
  const combined=vm.runInContext('saveState()',context);
  assert.strictEqual(first,combined,'queued autosaves should coalesce');
  assert.equal(await first,true);
  assert.equal(writes.length,1,'coalesced saves must upload once');
  assert.equal(writes[0].user_id,'account-a');
  assert.equal(context.lastSaveFailed,false);
  saveRevision=2;
  assert.equal(await vm.runInContext('saveState()',context),true);
  assert.equal(writes.length,2,'later edits must still upload');
  assert.equal(writes[1].state_data.revision,2);

  // Protected startup must suppress normal autosaves, but explicit disaster
  // recovery uses rawSet() directly and must still work for the same user.
  context.V115_STARTUP_GUARD=true;
  assert.equal(await vm.runInContext('saveState()',context),false);
  assert.equal(writes.length,2);
  assert.equal(await vm.runInContext('rawSet(STATE_KEY,{restored:true})',context),true);
  assert.equal(writes.length,3);
  context.V115_STARTUP_GUARD=false;

  // Queued account-A write must never serialize or upload under account B.
  const pending=vm.runInContext('saveState()',context);
  context.AUTH_USER={id:'account-b'};
  assert.equal(await pending,false);
  assert.equal(writes.length,3);

  // A session switch while compression is in flight must not target B.
  context.AUTH_USER={id:'account-a'};
  let releaseEncode;
  context.encodeCloudState=()=>new Promise(resolve=>{releaseEncode=resolve;});
  const inFlight=vm.runInContext('rawSet(STATE_KEY,{crossAccount:false})',context);
  for(let tries=0;tries<8&&!releaseEncode;tries++)await Promise.resolve();
  assert.equal(typeof releaseEncode,'function');
  context.AUTH_USER={id:'account-b'};
  releaseEncode({crossAccount:false});
  await assert.rejects(inFlight,/Cloud account changed/);
  assert.equal(writes.length,3,'account switch must block the in-flight upload');

  // A Supabase failure must be reported and followed by a successful retry.
  context.AUTH_USER={id:'account-a'};
  context.encodeCloudState=async value=>value;
  context.supabase={from(){return {async upsert(){return {error:new Error('network down')};}};}};
  assert.equal(await vm.runInContext('saveState()',context),false);
  assert.equal(context.lastSaveFailed,true);
  assert(showErrors>0);
  context.supabase={from(){return {async upsert(payload){writes.push(payload);return {error:null};}};}};
  assert.equal(await vm.runInContext('saveState()',context),true);
  assert.equal(context.lastSaveFailed,false);
  assert(hideErrors>0);
  assert(cacheWrites>0);
  console.log('PASS v535: coalesced saves, full History, recovery, account isolation, cloud failures and retries.');
})().catch(e=>{console.error(e);process.exitCode=1;});
