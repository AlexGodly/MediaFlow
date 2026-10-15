/* MediaFlow v428 scheduler behavior — deterministic, offline, no account data. */
'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('src/js/components/312-v428-background-hub.js','utf8');
new vm.Script(source,{filename:'v428-hub.js'});
const callbacks={},data=new Map(),log=[];
let clock=1000000, running=0, peak=0, releaseCover=null, releaseMetadata=null;
class TestDate extends Date{static now(){return clock;}}
const localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
const locks=new Map();
const navigator={locks:{async request(name,options,handler){
 if(locks.get(name))return handler(null);
 locks.set(name,true);
 try{return await handler({name});}finally{locks.delete(name);}
}}};
const user={id:'account-a'};
const S={settings:{v428Background:{visibility:'hidden',cooldownSeconds:30}},library:[],categories:[]};
const App={},window={addEventListener(name,fn){callbacks['window:'+name]=fn;}};
const document={body:null,readyState:'loading',addEventListener(name,fn){callbacks['document:'+name]=fn;}};
const enter=name=>{running++;peak=Math.max(peak,running);log.push('begin:'+name);};
const leave=name=>{running--;log.push('end:'+name);};
const ctx=vm.createContext({S,App,window,document,AUTH_USER:user,localStorage,navigator,Date:TestDate,Math,JSON,console,
 setInterval(fn){callbacks.tick=fn;return 1;},clearInterval(){},setTimeout,clearTimeout,
 MF424:{job:{status:'ready',ids:['1'],cursor:0},running:false},
 mf424Run(){enter('cover');return new Promise(resolve=>{releaseCover=()=>{leave('cover');ctx.MF424.job.status='complete';resolve();};});},
 v377RunJikan:async()=>({complete:true}),
 showToast() {},persistSettings:async()=>{},saveState:async()=>{}
});
window.window=window;
vm.runInContext(source,ctx,{timeout:4000});
const hub=window.MediaFlowV428Hub;
assert(hub,'hub exported');
assert.equal(typeof App.mf428SetPosition,'function');
assert.equal(hub.enqueue('cover',{}),true);
assert.equal(hub.enqueue('metadata',{}),true);
assert.equal(hub.enqueue('fresh',{universal:true}),true);
hub.registerMetadata(()=>{enter('metadata');return new Promise(resolve=>{releaseMetadata=()=>{leave('metadata');resolve();};});});
let freshRuns=0;
hub.registerFresh(async()=>{enter('fresh');freshRuns++;leave('fresh');return {complete:true};});
const tick=async()=>{for(let i=0;i<18;i++)await Promise.resolve();};
(async()=>{
 await tick();
 assert.deepEqual(log,['begin:cover'],'Only Cover Recovery starts');
 assert.equal(hub.status().queued.join(','),'metadata,fresh');
 assert.equal(peak,1);
 releaseCover();await tick();
 assert.equal(hub.status().active,null,'Cover completes, next process waits in cooldown');
 assert(clock<hub.status().cooldownUntil,'Inter-feature cooldown is enforced');
 callbacks['document:DOMContentLoaded']();
 callbacks.tick();await tick();
 assert(!releaseMetadata,'Metadata cannot begin early');
 clock=hub.status().cooldownUntil+1;
 callbacks.tick();await tick();
 assert.equal(log.at(-1),'begin:metadata');
 assert.equal(peak,1,'Never two concurrent network jobs');
 App.mf428Cancel('fresh');await tick();
 assert.equal(hub.status().queued.length,0,'Queued Fresh job removed');
 releaseMetadata();await tick();
 clock=hub.status().cooldownUntil+1;callbacks.tick();await tick();
 assert.equal(freshRuns,0,'Cancelled process never launches');
 assert.equal(hub.enqueue('fresh',{universal:true}),true);
 await tick();assert.equal(freshRuns,1,'New launch runs after cooldown');
 assert.equal(peak,1);
 App.mf428SetVisibility('always');assert.equal(S.settings.v428Background.visibility,'always');
 App.mf428SetPosition('left');assert.equal(S.settings.v428Background.position,'left');
 App.mf428SetVisibility('hidden');assert.equal(S.settings.v428Background.visibility,'hidden');
 assert.equal(typeof hub.ownsLease,'function');
 assert.equal(running,0);
 console.log('v428 scheduler passed: no overlap, FIFO queue, cooldown, cancellation, theme settings, guarded lease');
})().catch(e=>{console.error(e);process.exitCode=1;});
