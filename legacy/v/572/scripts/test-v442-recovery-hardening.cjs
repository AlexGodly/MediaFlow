/* v442 deterministic failure-injection and 100K-title safety */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('src/js/components/322-v442-recovery-hardening.js','utf8'),core=fs.readFileSync('src/js/components/309-v424-advanced-cover-recovery.js','utf8');
assert(Number(fs.readFileSync('VERSION','utf8').trim())>=442);
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.includes('components/322-v442-recovery-hardening.js'));
const store=new Map(),events=[];let saveFail=false,discover=0,applies=0,coverStarts=0,saves=0;
const account={id:'demo'},title={id:'one',title:'First Work',year:2025,externalIds:{},modifiedAt:0};
const S={view:'library',library:[title],settings:{},loading:false};
const MF439={job:null,account:'',working:false,lease:'',cancel:false},MF424={job:null,running:false};
const doc={body:{appendChild:()=>{}},querySelector:()=>null,createElement:()=>({innerHTML:'',firstElementChild:null})};
const c={console,Date,Number,Math,Array,Map,Set,Object,String,JSON,Promise,URL,Blob,
 setTimeout,clearTimeout,setInterval,clearInterval,document:doc,S,MF439,MF424,AUTH_USER:account,App:{},window:{},
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},
 mf439Account:()=>account.id,mf424Account:()=>account.id,
 mf439LeaseKey:()=>('mediaflow-v439-lock:'+account.id),
 mf439ReadJob:()=>MF439.job,mf439SaveJob:()=>events.push('checkpoint:'+MF439.job?.cursor),
 mf439AcquireLease:()=>{
  const key='mediaflow-v439-lock:'+account.id,x=JSON.parse(store.get(key)||'null');
  if(x&&x.expires>Date.now()&&x.token!==MF439.lease)return false;
  MF439.lease=MF439.lease||'metadata-test-lease';
  store.set(key,JSON.stringify({token:MF439.lease,expires:Date.now()+45000}));return true;},
 mf439ReleaseLease:()=>{store.delete('mediaflow-v439-lock:'+account.id);MF439.lease='';},
 mf439RunBatch:async()=>{throw Error('old batch must be replaced');},
 mf439ConfirmBatch:()=>events.push('old-confirm'),
 mf439Discover:async()=>{discover++;return {preview:{titleId:'one',proposals:[]},failures:[]};},
 mf439Preferences:()=>({enabled:['anilist']}),mf439Apply:item=>{applies++;
  if(item.synopsis)return {changed:0};
  item.synopsis='A verified synopsis';item.modifiedAt=Date.now();return {changed:1};},
 mf439PaintJob:()=>{},mf424Run:async()=>{coverStarts++;return 'cover-started';},
 mf424SaveJob:async()=>{},mf424State:status=>{if(MF424.job)MF424.job.status=status;},
 mf441WorkspaceHtml:()=>'<section class="mf441-settings"><p>Existing recovery links</p></section>',
 mf425Icon:()=>'<svg></svg>',mf424Escape:v=>String(v).replace(/</g,'&lt;').replace(/&/g,'&amp;'),
 v53InvalidateLibraryCache:()=>{},render:()=>{},
 saveState:async()=>{saves++;events.push('saved');if(saveFail)throw Error('cloud unavailable');},
 showToast:msg=>events.push('toast:'+msg),confirm:()=>true,
 v148BuildFullBackup:()=>({backupVersion:441,backupManifest:{includes:{}}})
};
vm.createContext(c);vm.runInContext(src,c,{filename:'v442-recovery-hardening.js'});
const api=c.window.MediaFlowV442;
assert.equal(api.version,442);
assert.equal(coverStarts+saves+discover,0,'No eager recovery requests');
assert.equal(api.health().lock,null);
const bad={schema:1,account:'demo',ids:['one','one',''],cursor:900,status:'bogus',errors:Array(100).fill('x')},fixed=api.validateJob(bad);
assert.equal(fixed.ids.length,1);assert.equal(fixed.cursor,1);assert.equal(fixed.status,'paused');assert.equal(fixed.errors.length,50);
assert.equal(api.validateJob({...bad,account:'other'}),null);
function job(){return {schema:1,account:'demo',ids:['one'],cursor:0,changed:0,completed:0,errors:[],status:'paused'};}
async function run(){
 MF439.job=job();await vm.runInContext('mf439RunBatch()',c);
 assert.equal(discover,1);assert.equal(saves,1);assert.equal(title.synopsis,'A verified synopsis');
 assert.equal(MF439.job.cursor,1);assert.equal(MF439.job.status,'completed');assert.equal(MF439.job.changed,1);
 assert(events.lastIndexOf('saved')<events.lastIndexOf('checkpoint:1'),'Save MUST precede checkpoint');
 assert.equal(api.health().lock,null);assert.equal(MF439.working,false);assert.equal(MF439.lease,'');
 title.synopsis='';title.modifiedAt=0;MF439.job=job();saveFail=true;
 const initial=saves;await vm.runInContext('mf439RunBatch()',c);
 assert.equal(saves,initial+1);assert.equal(MF439.job.cursor,0,'Failed save cannot advance cursor');
 assert.equal(MF439.job.status,'paused');assert.equal(MF439.job.pendingSaveId,'one');
 saveFail=false;await vm.runInContext('mf439RunBatch()',c);
 assert.equal(MF439.job.cursor,1);assert.equal(MF439.job.changed,0,'Repeated saved field cannot double-count');
 MF439.job=job();
 store.set('mediaflow-v442-recovery-owner:demo',JSON.stringify({token:'foreign',kind:'cover',expires:Date.now()+50000}));
 const before=discover;await vm.runInContext('mf439RunBatch()',c);
 assert.equal(discover,before);assert.equal(MF439.job.cursor,0);assert.equal(MF439.job.status,'paused');
 store.delete('mediaflow-v442-recovery-owner:demo');
 MF424.job={status:'ready',pauseRequested:false};MF439.working=true;
 await vm.runInContext('mf424Run()',c);
 assert.equal(coverStarts,0);assert.equal(MF424.job.status,'paused');
 MF439.working=false;await vm.runInContext('mf424Run()',c);
 assert.equal(coverStarts,1);assert.equal(api.health().lock,null);
 // Title changes while API is pending must never be overwritten.
 title.synopsis='';MF439.job=job();let resolve;
 c.mf439Discover=async()=>{discover++;await new Promise(r=>{resolve=r;});return {preview:{titleId:'one',proposals:[]},failures:[]};};
 const pending=vm.runInContext('mf439RunBatch()',c);
 for(let i=0;i<15&&!resolve;i++)await new Promise(r=>setTimeout(r,1));
 assert(resolve);title.title='Renamed while fetching';resolve();await pending;
 assert.equal(MF439.job.cursor,1);assert.equal(MF439.job.changed,0);
 assert.equal(title.synopsis,'');assert(MF439.job.errors.some(e=>/changed during provider lookup/.test(e.reason)));
 // 100K Library tests bounded indexing.
 c.mf439Discover=async()=>({preview:{titleId:'99999',proposals:[]},failures:[]});
 S.library=Array.from({length:100000},(_,i)=>({id:String(i),title:'Title '+i}));
 MF439.job={...job(),ids:['99999']};c.mf439Apply=()=>({changed:0});
 await vm.runInContext('mf439RunBatch()',c);
 assert.equal(MF439.job.cursor,1);assert.equal(S.library[99999].synopsis,undefined);
 const markup=api.renderHealth(),h=api.health();
 assert(markup.includes('Recovery Integrity & Diagnostics'));
 assert(!markup.includes('demo')&&!markup.includes('99999'));
 const backup=vm.runInContext('v148BuildFullBackup()',c);
 assert.equal(backup.backupVersion,442);assert(backup.backupManifest.includes.v442RecoveryHardening);
 assert(core.includes("if(MF424.running&&typeof mf442ProcessOwned==='function'&&!mf442ProcessOwned('cover'))"));
 assert(core.includes('await mf424Flush(); // confirm actual Library save BEFORE moving the cursor'));
 assert(core.includes('row.expiry)>Date.now()'));
 assert(!src.includes('item.coverUrl='));
 console.log('PASS v442: lock arbitration, save failure, idempotent retry, mid-fetch edits, 100K index, diagnostics, backup');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
