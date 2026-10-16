/* MediaFlow v451: durable checkpoints, hard stop and priority recovery. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert(['451','452','453'].includes(fs.readFileSync('VERSION','utf8').trim()));
const runtime=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(runtime.includes('components/331-v451-recovery-stop-priority.js'));
assert(runtime.includes('components/332-v452-recovery-control-polish.js'));
assert.equal(runtime.at(-1),'components/334-v453-quick-title-recovery.js');
const code=fs.readFileSync('src/js/components/331-v451-recovery-stop-priority.js','utf8');
const v424=fs.readFileSync('src/js/components/309-v424-advanced-cover-recovery.js','utf8');
const v442=fs.readFileSync('src/js/components/322-v442-recovery-hardening.js','utf8');
assert(v424.includes('MF424.activeControllers.add(controller)'));
assert(v424.includes('MF424.job?.hardStop'));
assert(v442.includes("'stopped'"));
assert(v442.includes("job.stopRequested?'stopped'"));
const storage=new Map(),db=new Map(),toasts=[];
const coverJob={id:'old',account:'user',ids:['1','2','3'],cursor:1,status:'paused',fixed:1,
 pauseRequested:true,stopRequested:false,results:[{type:'recovered'}],reviews:[]};
const metaJob={schema:1,account:'user',ids:['1','2'],cursor:1,
 status:'paused',changed:3,completed:1,errors:[]};
const env={
 console,Map,Set,Date,JSON,Object,Number,String,Array,Math,Error,URL,Promise,setTimeout,clearTimeout,queueMicrotask,
 localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},
 AUTH_USER:{id:'user'},S:{library:[{id:'1',title:'One'},{id:'2',title:'Two'}]},
 MF424:{ready:true,job:null,running:false,account:'user',activeControllers:new Set()},
 MF439:{job:null,working:false,cancel:false},MF442:{process:'',owner:'this-tab'},
 MF425:{oneId:''},MF447:{},MF445:{},App:{},window:{},
 mf439Account:()=> 'user',mf424Account:()=> 'user',mf442ProcessLease:()=>null,
 mf424Key:()=> 'cover-main',mf439StateKey:()=> 'metadata-main',
 mf424Storage:async(action,key,val)=>{
  if(action==='put'){db.set(key,structuredClone(val));return;}
  if(action==='delete'){db.delete(key);return;}return db.get(key)||null;
 },
 mf424SaveJob:async()=>{if(env.MF424.job)db.set('cover-main',structuredClone(env.MF424.job));},
 mf439ReadJob:()=>env.MF439.job,
 mf439SaveJob:()=>{if(env.MF439.job)storage.set('metadata-main',JSON.stringify(env.MF439.job));},
 mf424Run:async()=>{},mf439RunBatch:async()=>{},mf439Resume:()=>{},
 mf424ReviewSave:async()=>{},mf424Paint:()=>{},mf439PaintJob:()=>{},mf441Paint:()=>{},
 mf441CoverRow:()=>'<article><div class="mf441-process-actions"></div></article>',
 mf441MetadataRow:()=>'<article><div class="mf441-process-actions"></div></article>',
 mf441WidgetHtml:()=>'<aside><div class="mf441-widget-foot mf446-widget-foot"></div></aside>',
 mf441WorkspaceHtml:()=>'<section class="parent"><section class="nested"></section></section>',
 mf441Prefs:()=>({expanded:true}),mf441State:()=>({}),
 mf425Icon:()=>'',mf424Escape:String,mf439Item:id=>env.S.library.find(x=>x.id===id),
 mf444Confirm:async()=>true,mf447Combo:()=>null,mf447WriteCombo:()=>{},
 mf447ScopeSnapshot:()=>['2'],mf446ScopeIds:()=>['2'],
 mf439Close:()=>{},document:{getElementById:()=>null},showToast:x=>toasts.push(x)
};
env.App.mf424Resume=()=>{env.MF424.job.status='running';env.MF424.job.pauseRequested=false;};
env.App.mf424Start=async()=>{};
env.App.mf439Resume=()=>{};env.App.mf447StartCombined=()=>{};
env.App.mf447Open=()=>{};env.App.mf445Start=async()=>{};
vm.createContext(env);vm.runInContext(code,env,{filename:'v451-recovery.js'});
(async()=>{
 const api=env.window.MediaFlowV451;
 assert.equal(api.version,451);
 env.MF424.job=structuredClone(coverJob);
 assert.equal(await api.prepare('cover','2'),true);
 assert.equal(env.MF424.job,null,'Bulk queue suspended');
 assert.equal(db.get('mf451-suspended-cover:user').cursor,1);
 assert.equal(db.get('mf451-suspended-cover:user').fixed,1);
 assert.equal(api.priority().id,'2');
 env.MF424.job={id:'priority',account:'user',ids:['2'],cursor:1,status:'complete',pending:0};
 const j=api.priority();j.priorityCoverId='priority';
 storage.set('mediaflow-v451-priority:user',JSON.stringify(j));
 assert.equal(await api.restore({force:true}),true);
 assert.equal(env.MF424.job.id,'old');
 assert.equal(env.MF424.job.cursor,1);
 assert.equal(env.MF424.job.fixed,1);
 assert.equal(api.priority(),null);
 assert.equal(db.has('mf451-suspended-cover:user'),false);
 assert.equal(db.get('mf451-last-priority-report:user').id,'priority');
 assert.equal(env.MF424.job.status,'paused','Manually paused job must not silently restart');
 env.MF424.job={...structuredClone(coverJob),status:'running',pauseRequested:false};
 let aborted=false;env.MF424.activeControllers.add({abort:()=>{aborted=true;}});
 await api.stop('cover',{confirm:false});
 assert.equal(env.MF424.job.status,'stopped');
 assert.equal(env.MF424.job.stopRequested,true);
 assert.equal(env.MF424.job.hardStop,true);
 assert(aborted);
 env.MF424.job=null;env.MF439.job=structuredClone(metaJob);
 await api.stop('metadata',{confirm:false});
 assert.equal(env.MF439.job.status,'stopped');
 assert.equal(env.MF439.job.stopRequested,true);
 const rows=api.controls();
 assert(rows.includes('Stop All')&&rows.includes('Discard Queues'));
 assert(code.includes("mf451BaseCombined=App.mf447StartCombined"));
 assert(code.includes("mf451BaseStartWorkspace=App.mf445Start"));
 assert(code.includes("mf451BaseStartCover=App.mf424Start"));
 assert(!/\b(?:item|title)\.(?:rating|progress|coverUrl|total)\s*=/.test(code));
 assert(fs.readFileSync('index.html','utf8').includes('258-v451-recovery-stop-priority.css'));
 console.log('PASS v451: saved priority snapshots, safe restoration, request abort, stopped status, UI controls, unchanged Library data');
})().catch(e=>{console.error(e);process.exitCode=1;});
