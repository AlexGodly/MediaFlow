/* v428 cross-tab regression: separate queue slots and Web Locks ownership. */
'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const src=fs.readFileSync('src/js/components/312-v428-background-hub.js','utf8');
const slots=new Map(),busy=new Set();
const storage={getItem:k=>slots.get(k)||null,setItem:(k,v)=>slots.set(k,v),removeItem:k=>slots.delete(k)};
let now=1700000000,coverDone=null,started=0,working=0,maxWorking=0;
class MockDate extends Date{static now(){return now;}}
const locks={request:async(name,opts,fn)=>{if(busy.has(name))return fn(null);busy.add(name);try{return await fn({name});}finally{busy.delete(name);}}};
function makeTab(name){
 const events={},App={},S={settings:{v428Background:{visibility:'hidden',cooldownSeconds:30}}},window={addEventListener(n,f){events[n]=f;}};
 const document={body:null,readyState:'loading',addEventListener(n,f){events[n]=f;}};
 const ctx=vm.createContext({App,S,window,document,AUTH_USER:{id:'same-account'},localStorage:storage,navigator:{locks},MF424:{running:false,job:{status:'ready',cursor:0,ids:['a']}},
 mf424Run:()=>{working++;maxWorking=Math.max(maxWorking,working);return new Promise(r=>{coverDone=()=>{working--;r();};});},
 v377RunJikan:async()=>({complete:true}),
 showToast(){},persistSettings:async()=>{},saveState:async()=>{},setInterval:f=>{events.tick=f;return 1;},clearInterval(){},setTimeout,clearTimeout,Date:MockDate,Math,JSON,console
 });
 vm.runInContext(src,ctx);return {ctx,hub:window.MediaFlowV428Hub,events,app:App};
}
const one=makeTab('one'),two=makeTab('two');
const flush=async()=>{for(let i=0;i<28;i++)await Promise.resolve();};
(async()=>{
 assert(one.hub.enqueue('cover',{}));
 await flush();
 assert.equal(one.hub.status().active,'cover');
 two.hub.registerMetadata(async()=>{working++;maxWorking=Math.max(maxWorking,working);started++;working--;});
 assert(two.hub.enqueue('metadata',{}));
 await flush();
 assert.equal(started,0,'Second tab cannot run while cover holds Web Lock');
 assert(slots.has('mf428-pending:same-account:metadata'),'Other tab job persisted in its own slot');
 one.ctx.MF424.job.status='complete';coverDone();await flush();
 assert(slots.has('mf428-pending:same-account:metadata'),'First tab finishing cannot wipe second tab queued job');
 two.events.DOMContentLoaded();now=one.hub.status().cooldownUntil+1;
 two.events.tick();await flush();
 assert.equal(started,1,'Second tab resumes queued metadata after shared cooldown');
 assert.equal(maxWorking,1,'No overlap across tabs');
 assert(!slots.has('mf428-pending:same-account:metadata'),'Committed queue entry cleared at execution');
 console.log('v428 cross-tab scheduler OK: no lost jobs, shared lock and cooldown');
})().catch(e=>{console.error(e);process.exitCode=1;});
