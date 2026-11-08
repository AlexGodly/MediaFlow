/* v402 service-worker cache lifecycle contract using simulated CacheStorage.
   This does NOT claim a live browser installation, Android or iOS validation. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
assert.match(sw,/MEDIAFLOW_VERSION=483/);
assert.match(sw,/Math.min\(8,urls.length\)/);
let summary=[];
async function run(failCritical){
 const listeners={},store=new Map();let running=0,peak=0,requested=[];
 const base='http://example.test/';
 class MockRequest{constructor(input){this.url=String(input instanceof MockRequest?input.url:input);}}
 class MockCache{
  constructor(){this.map=new Map();}
  async match(req){return this.map.get(String(req.url||req))||null;}
  async put(req,resp){this.map.set(String(req.url||req),resp);}
 }
 const old=new MockCache();await old.put(new MockRequest(base+'index.html'),{ok:true,status:200,source:'v402'});
 store.set('mediaflow-pwa-v402-shell-v1',old);
 const caches={
  open:async k=>{if(!store.has(k))store.set(k,new MockCache());return store.get(k);},
  keys:async()=>[...store.keys()],delete:async k=>store.delete(k),
  match:async req=>{for(const c of store.values()){const x=await c.match(req);if(x)return x;}return null;}
 };
 const self={registration:{scope:base},location:{origin:'http://example.test'},clients:{claim:async()=>{},matchAll:async()=>[]},
  addEventListener:(type,callback)=>listeners[type]=callback,skipWaiting:async()=>{}};
 const context={self,caches,URL,Request:MockRequest,console,Promise,Math,Array,Map,Set,
   fetch:async request=>{
    requested.push(request.url);running++;peak=Math.max(peak,running);
    await Promise.resolve();
    running--;
    if(failCritical&&/\/index\.html$/.test(request.url))throw new Error('simulated interrupted update');
    const relative=request.url.replace(base,'');
    if(relative&&relative!=='sw.js'&&relative!=='')assert.ok(fs.existsSync(path.join(root,relative)),relative);
    return {ok:true,status:200,source:'v483',clone(){return {...this}}};
   }
 };
 vm.createContext(context);vm.runInContext(sw,context);
 async function dispatch(type,data){let waiting=[];const event={data,waitUntil:p=>waiting.push(p),ports:[]};
  listeners[type](event);await Promise.all(waiting);return event;}
 await dispatch('install');await dispatch('activate');
 const keys=await caches.keys();
 const newCache=await caches.open('mediaflow-pwa-v483-shell-v1');
 const index=await newCache.match(new MockRequest(base+'index.html'));
 const existsOld=keys.includes('mediaflow-pwa-v402-shell-v1');
 assert.equal(existsOld,failCritical,'old cache preserved only on critical failure');
 assert.equal(Boolean(index),!failCritical);
 assert.ok(peak<=8&&peak>0,`concurrency ${peak}`);
 const appRequest=new MockRequest(base+'index.html');
 const fallback=await caches.match(appRequest);
 assert.equal(fallback.source,failCritical?'v402':'v483');
 assert.ok(requested.length>=170,requested.length);
 summary.push({scenario:failCritical?'interrupted critical asset':'complete asset cache',peakConcurrency:peak,requests:requested.length,retainedOldCache:existsOld});
}
(async()=>{await run(false);await run(true);console.log('PASS v483 PWA generated assets, bounded cache writes, successful cache swap, interrupted-update fallback',JSON.stringify(summary))})().catch(err=>{console.error(err);process.exit(1)});
