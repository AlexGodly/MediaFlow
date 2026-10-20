/* v546 recovery takeover regression tests: lock fencing, latest checkpoint and queue isolation. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const version=Number(fs.readFileSync('VERSION','utf8').trim());
assert(version>=546,'v546 build is required');
const runtime=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(runtime.includes('components/386-v546-recovery-lock-takeover.js'));
const takeover=fs.readFileSync('src/js/components/386-v546-recovery-lock-takeover.js','utf8');
const coverSource=fs.readFileSync('src/js/components/309-v424-advanced-cover-recovery.js','utf8');
const metaSource=fs.readFileSync('src/js/components/319-v439-metadata-recovery.js','utf8');
const lockCore=fs.readFileSync('src/js/components/322-v442-recovery-hardening.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('assets/css/290-v546-recovery-lock-takeover.css','utf8');
assert(coverSource.includes("mf546QueueStorageKey('cover',mf424Account(),'job:'+mf424Account())"));
assert(metaSource.includes("mf546QueueStorageKey('metadata',mf439Account(),'mediaflow-v439-job:'+mf439Account())"));
assert(coverSource.includes("mf546CheckNewQueueStart('cover')")&&coverSource.includes("mf546PrepareNewQueue('cover')"));
assert(takeover.includes("mf546PrepareNewQueue('metadata')"),'Metadata batches must secure ownership before writing a replacement checkpoint');
assert(lockCore.includes("if(typeof mf546OpenConflict==='function')"),'The old v442 lock-race branches must hand off to the designed dialog');
assert(lockCore.includes("const conflict=mf546Conflict('cover')")&&lockCore.includes("const conflict=mf546Conflict('metadata')"));
assert(html.includes('assets/css/290-v546-recovery-lock-takeover.css'));
assert(css.includes('.mf546-overlay')&&css.includes('.mf546-btn-force'));
assert(takeover.includes('Resume Safely')&&takeover.includes('Force Start')&&takeover.includes('Force Start Anyway'));
assert(takeover.includes('mf546FenceProcess')&&takeover.includes('mf546IsolateQueue'));
assert(takeover.includes('mf546WaitForLegacyLocks'));
assert(takeover.includes('latest=await mf546LatestJob(kind,account);'),'A cleared lock must resume from the latest durable cursor');

const storage=new Map(),db=new Map(),toasts=[],runs={cover:0,metadata:0};
const account='user-546';
const rawGet=k=>storage.has(k)?storage.get(k):null;
const localStorage={
 getItem:k=>rawGet(k),
 setItem:(k,v)=>storage.set(k,String(v)),
 removeItem:k=>storage.delete(k)
};
const window={addEventListener:()=>{},__mf546RecoveryQueueKeys:null};
const document={
 body:{appendChild:()=>{}},
 getElementById:()=>null,
 createElement:()=>({innerHTML:'',firstElementChild:null,remove(){}})
};
const MF442={owner:'current-tab',process:'',timer:null,leaseLost:false};
const MF424={job:null,running:false,account,leaseToken:'',activeControllers:new Set()};
const MF439={job:null,working:false,cancel:false,account,lease:'',controller:null};
const context={
 console,Date,Math,String,Number,Boolean,Array,Map,Set,Object,JSON,Promise,Error,URL,Blob,
 setTimeout,clearTimeout,setInterval:()=>1,clearInterval:()=>{},
 window,document,localStorage,MF442,MF424,MF439,App:{},
 AUTH_USER:{id:account},S:{library:[],settings:{}},
 mf439Account:()=>account,mf424Account:()=>account,
 mf442ProcessKey:()=> 'mediaflow-v442-recovery-owner:'+account,
 mf442LocalLease:key=>{try{const r=JSON.parse(localStorage.getItem(key)||'null');return r&&Number(r.expires)>Date.now()?r:null;}catch(_){return null;}},
 mf442ProcessLease:()=>{try{const r=JSON.parse(localStorage.getItem('mediaflow-v442-recovery-owner:'+account)||'null');return r&&Number(r.expires)>Date.now()?r:null;}catch(_){return null;}},
 mf442ProcessOwned:kind=>{const r=JSON.parse(localStorage.getItem('mediaflow-v442-recovery-owner:'+account)||'null');return Boolean(r&&r.token===MF442.owner&&r.kind===kind&&MF442.process===kind);},
 mf442AcquireProcess:kind=>{
  const old=context.mf442ProcessLease();
  if(old&&(old.token!==MF442.owner||old.kind!==kind))return false;
  localStorage.setItem(context.mf442ProcessKey(),JSON.stringify({token:MF442.owner,kind,expires:Date.now()+60000}));
  MF442.process=kind;MF442.leaseLost=false;MF442.timer=1;return context.mf442ProcessOwned(kind);
 },
 mf442ReleaseProcess:kind=>{
  clearInterval(MF442.timer);
  if(context.mf442ProcessOwned(kind))localStorage.removeItem(context.mf442ProcessKey());
  if(MF442.process===kind)MF442.process='';
 },
 mf424LeaseKey:()=> 'mf-v424-owner-'+account,
 mf439LeaseKey:()=> 'mediaflow-v439-lock:'+account,
 mf424Lease:()=>{
  const token=MF424.leaseToken||'cover-lease-'+Date.now();MF424.leaseToken=token;
  localStorage.setItem('mf-v424-owner-'+account,JSON.stringify({token,expiry:Date.now()+16000}));return true;
 },
 mf424Release:()=>{const row=JSON.parse(localStorage.getItem('mf-v424-owner-'+account)||'null');if(row?.token===MF424.leaseToken)localStorage.removeItem('mf-v424-owner-'+account);MF424.leaseToken='';},
 mf439AcquireLease:()=>{
  const token=MF439.lease||'metadata-lease-'+Date.now();MF439.lease=token;
  const row=JSON.parse(localStorage.getItem('mediaflow-v439-lock:'+account)||'null');
  if(row&&Number(row.expires)>Date.now()&&row.token!==token)return false;
  localStorage.setItem('mediaflow-v439-lock:'+account,JSON.stringify({token,expires:Date.now()+45000}));return true;
 },
 mf439ReleaseLease:()=>{const row=JSON.parse(localStorage.getItem('mediaflow-v439-lock:'+account)||'null');if(row?.token===MF439.lease)localStorage.removeItem('mediaflow-v439-lock:'+account);MF439.lease='';},
 mf424Key:()=>context.mf546QueueStorageKey('cover',account,'job:'+account),
 mf439StateKey:()=>context.mf546QueueStorageKey('metadata',account,'mediaflow-v439-job:'+account),
 mf424Storage:async(action,key,value)=>{
  if(action==='put'){db.set(key,JSON.parse(JSON.stringify(value)));return;}
  if(action==='delete'){db.delete(key);return;}
  return db.get(key)||null;
 },
 mf424SaveJob:async()=>{if(MF424.job)db.set(context.mf424Key(),JSON.parse(JSON.stringify(MF424.job)));},
 mf439SaveJob:()=>{if(MF439.job)localStorage.setItem(context.mf439StateKey(),JSON.stringify(MF439.job));},
 mf439ReadJob:()=>{try{return JSON.parse(localStorage.getItem(context.mf439StateKey())||'null');}catch(_){return null;}},
 mf424State:status=>{if(MF424.job)MF424.job.status=status;},
 mf424Paint:()=>{},mf439PaintJob:()=>{},
 mf424Run:async()=>{runs.cover++;return 'cover-started';},
 mf439RunBatch:async()=>{runs.metadata++;return 'metadata-started';},
 mf439ConfirmBatch:async()=>{},
 mf424Escape:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
 mf425Icon:()=>'<svg></svg>',showToast:s=>toasts.push(String(s))
};
vm.createContext(context);
vm.runInContext(takeover,context,{filename:'386-v546-recovery-lock-takeover.js'});
const api=window.MediaFlowV546;
assert.equal(api.version,546);
assert.equal(api.queueKey('cover',account,'job:'+account),'job:'+account,'legacy queues remain the default until a takeover occurs');
const keyFor=(kind)=>kind==='cover'?'mediaflow-v442-recovery-owner:'+account:'mediaflow-v442-recovery-owner:'+account;
const leaseCover='mf-v424-owner-'+account,leaseMeta='mediaflow-v439-lock:'+account;
const pointerCover='mediaflow-v546-recovery-queue:cover:'+account;
const pointerMeta='mediaflow-v546-recovery-queue:metadata:'+account;

async function run(){
 // Active lock with an already-released legacy lease: takeover must fence the
 // process, copy the newest durable cursor and start from a separate queue key.
 const coverJob={id:'cover-job-1',account,ids:['a','b','c','d'],cursor:1,status:'paused',fixed:1,results:[]};
 const latestCover={...coverJob,cursor:3,fixed:3,results:[{type:'recovered'},{type:'recovered'},{type:'recovered'}]};
 MF424.job=coverJob;
 db.set('job:'+account,latestCover);
 localStorage.setItem(keyFor('cover'),JSON.stringify({token:'old-tab-cover',kind:'cover',expires:Date.now()+60000}));
 localStorage.setItem(leaseCover,JSON.stringify({token:'old-cover-lease',expiry:Date.now()-1000}));
 await context.mf424Run();
 assert.equal(runs.cover,0,'A conflicting worker must not start before takeover');
 assert.equal(db.get('job:'+account).cursor,3,'The blocked tab must not overwrite the newer durable cursor');
 await api.takeover('cover','force');
 assert.equal(runs.cover,1,'Cover Recovery starts after takeover');
 assert.equal(MF424.job.cursor,3,'Latest durable checkpoint wins over a stale in-memory cursor');
 assert.equal(MF424.job.fixed,3,'Already recovered cover count is preserved');
 const coverPointer=JSON.parse(localStorage.getItem(pointerCover));
 assert(coverPointer.key.startsWith('mf546-cover:'+account+':'));
 assert.notEqual(coverPointer.key,'job:'+account,'Takeover isolates the queue from older tabs');
 assert.equal(db.get(coverPointer.key).cursor,3);
 assert.equal(db.get('job:'+account).cursor,3,'Original checkpoint remains intact');
 assert.equal(JSON.parse(localStorage.getItem(keyFor('cover'))).token,MF442.owner);
 assert.equal(JSON.parse(localStorage.getItem(leaseCover)).token,MF442.owner);

 // Release the owned idle cover lock before switching recovery type.
 vm.runInContext("mf546CleanupOwnIdleLock('metadata')",context);
 assert.equal(localStorage.getItem(leaseCover),null);

 // Metadata takeover follows the same guarantees and preserves its latest cursor.
 const metaJob={schema:1,account,ids:['x','y','z'],cursor:0,changed:0,completed:0,errors:[],startedAt:123,status:'paused'};
 const latestMeta={...metaJob,cursor:2,completed:2,changed:7,errors:[{titleId:'x',failures:[]}]};
 MF439.job=metaJob;
 localStorage.setItem('mediaflow-v439-job:'+account,JSON.stringify(latestMeta));
 localStorage.setItem(keyFor('metadata'),JSON.stringify({token:'old-tab-metadata',kind:'metadata',expires:Date.now()+60000}));
 localStorage.setItem(leaseMeta,JSON.stringify({token:'old-metadata-lease',expires:Date.now()-1000}));
 await api.takeover('metadata','force');
 assert.equal(runs.metadata,1,'Metadata Recovery starts after takeover');
 assert.equal(MF439.job.cursor,2);
 assert.equal(MF439.job.changed,7);
 const metaPointer=JSON.parse(localStorage.getItem(pointerMeta));
 assert(metaPointer.key.startsWith('mf546-metadata:'+account+':'));
 assert.equal(JSON.parse(localStorage.getItem(metaPointer.key)).cursor,2);
 assert.equal(JSON.parse(localStorage.getItem(keyFor('metadata'))).token,MF442.owner);
 assert.equal(JSON.parse(localStorage.getItem(leaseMeta)).token,MF442.owner);

 // An active legacy lease must delay the new worker until the old worker releases it.
 vm.runInContext("mf546CleanupOwnIdleLock('cover')",context);
 const delayedCover={id:'cover-job-delayed',account,ids:['q','r'],cursor:0,status:'paused',fixed:0};
 MF424.job=delayedCover;
 const delayedKey=context.mf424Key();
 db.set(delayedKey,delayedCover);
 localStorage.setItem(keyFor('cover'),JSON.stringify({token:'slow-tab',kind:'cover',expires:Date.now()+60000}));
 localStorage.setItem(leaseCover,JSON.stringify({token:'slow-cover-lease',expiry:Date.now()+60000}));
 let leaseReleased=false;
 setTimeout(()=>{localStorage.removeItem(leaseCover);leaseReleased=true;},25);
 const previousRuns=runs.cover;
 await api.takeover('cover','force');
 assert(leaseReleased,'The old worker lease was released before takeover completed');
 assert.equal(runs.cover,previousRuns+1,'The new worker starts only after the old lease releases');
 assert(MF424.job.id==='cover-job-delayed');

 // A stale lock is ignored once its expiry has passed.
 localStorage.setItem(keyFor('cover'),JSON.stringify({token:'expired',kind:'cover',expires:Date.now()-1000}));
 localStorage.setItem(leaseCover,JSON.stringify({token:'expired',expiry:Date.now()-1000}));
 localStorage.removeItem(leaseMeta);
 assert.equal(api.conflict('cover'),null,'Expired locks do not block a recovery start');

 // A new queue reserves both leases first and rotates away from a key that an
 // older tab may have cached, while keeping the process token and queue token distinct.
 const previousPointer=JSON.parse(localStorage.getItem(pointerCover)).key;
 const prepared=await vm.runInContext("mf546PrepareNewQueue('cover')",context);
 assert.equal(prepared,true,'New Cover Recovery queue must acquire process and queue leases');
 assert.notEqual(JSON.parse(localStorage.getItem(pointerCover)).key,previousPointer,'New queue uses a fresh isolated key');
 assert.equal(JSON.parse(localStorage.getItem(leaseCover)).token,MF424.leaseToken,'Queue lease token remains consistent after key rotation');
 assert.equal(api.conflict('cover'),null,'The newly reserved queue does not trip its own conflict guard');
 vm.runInContext("mf546AbortPreparedQueue('cover')",context);

 // Cross-tab handoff asks a live v546 worker to pause and abort its requests.
 let aborted=0;
 MF442.process='cover';MF424.running=true;
 MF424.job={id:'running-cover',account,ids:['a'],cursor:0,status:'running',pauseRequested:false};
 MF424.activeControllers=new Set([{abort:()=>aborted++}]);
 api.receiveHandoff({account,requester:'other-tab',requestedAt:Date.now(),activeKind:'cover'});
 assert.equal(MF424.job.pauseRequested,true);
 assert.equal(aborted,1);
 assert(takeover.includes('Force Start Anyway'),'An explicit final force action exists if an old worker never releases its lease');
 assert(toasts.some(x=>/resumed from its isolated checkpoint/.test(x)));
 console.log('PASS v546: safe and forced takeover, fencing, queue isolation, latest checkpoint recovery, delayed lease handoff, stale lock expiry, cross-tab pause');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
