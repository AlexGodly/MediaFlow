/* Release gate: compile and exercise the actual generated service worker.
 * A previous release compiled the app bundle but shipped an invalid sw.js,
 * permanently blocking installed PWAs from upgrading. */
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const version=Number(fs.readFileSync(path.join(root,'VERSION'),'utf8').trim());
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const metadata=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
assert(Number.isInteger(version)&&version>0,'VERSION must be an integer');
assert.equal(metadata.build,version,'version.json build must match VERSION');
assert.equal(metadata.version,version,'version.json version must match VERSION');
assert(index.includes('mediaflow-v'+version+'.bundle.js'),'HTML must load the latest bundle');
assert(index.includes('name="mediaflow-version" content="'+version+'"'),'HTML version meta must match VERSION');
assert(sw.includes('const MEDIAFLOW_VERSION='+version+';'),'worker version must match VERSION');
assert(sw.includes('mediaflow-pwa-v'+version+'-shell-'),'worker cache namespace must be versioned');

const registrations=new Map();
const cacheStores=new Map();
const cacheOpened=[];
const requests=[];
const notices=[];
let didSkipWaiting=false;
let didClaim=false;
function cacheOf(name){
  if(!cacheStores.has(name))cacheStores.set(name,new Map());
  const items=cacheStores.get(name);
  return {
    async put(request,response){items.set(new URL(request.url).href,response);},
    async match(request){return items.get(new URL(request.url).href)||undefined;}
  };
}
const caches={
  async open(name){cacheOpened.push(name);return cacheOf(name);},
  async keys(){return [...cacheStores.keys()];},
  async delete(name){return cacheStores.delete(name);},
  async match(request){for(const name of cacheStores.keys()){
    const item=await cacheOf(name).match(request);if(item)return item;
  }}
};
const self={
  registration:{scope:'https://example.github.io/MediaFlow/'},
  addEventListener(name,callback){registrations.set(name,callback);},
  async skipWaiting(){didSkipWaiting=true;},
  clients:{
    async claim(){didClaim=true;},
    async matchAll(){return [{postMessage(message){notices.push(message);}}];}
  },
  location:{origin:'https://example.github.io'}
};
const fakeFetch=async request=>{
  const url=new URL(request.url);
  requests.push(url.href);
  assert.equal(url.origin,'https://example.github.io');
  return new Response('ok',{status:200});
};
const ctx={self,URL,Request,Response,fetch:fakeFetch,caches,console,Promise,Error,setTimeout,clearTimeout};
new vm.Script(sw,{filename:'sw.js'}).runInNewContext(ctx,{timeout:2000});
assert(registrations.has('install')&&registrations.has('activate')&&registrations.has('fetch'),
  'Service worker must register install, activate and fetch handlers');
async function dispatch(name,event={}){
  const waits=[];
  registrations.get(name)({...event,waitUntil(promise){waits.push(Promise.resolve(promise));}});
  await Promise.all(waits);
}
(async()=>{
  await dispatch('install');
  assert(didSkipWaiting,'service worker should activate without manual intervention');
  const precached=requests.map(url=>new URL(url).pathname);
  assert(precached.some(url=>url.endsWith('/index.html')),'index.html must be pre-cached');
  assert(precached.some(url=>url.endsWith('/version.json')),'version metadata must be pre-cached');
  assert(precached.some(url=>url.endsWith('/mediaflow-v'+version+'.bundle.js')),'latest bundle must be pre-cached');
  assert(precached.length<12,'install must not stall fetching hundreds of files');
  await dispatch('activate');
  assert(didClaim,'worker must claim clients immediately on activation');
  assert(notices.some(m=>m.type==='MEDIAFLOW_SW_ACTIVATED'&&m.version===version));
  let versionReply;
  registrations.get('message')({data:{type:'GET_VERSION'},ports:[{postMessage(msg){versionReply=msg;}}]});
  assert.equal(versionReply.version,version,'PWA update handshake must report deployed version');
  console.log('PWA RELEASE CHECK PASSED: v'+version+' worker compiled, activated, claimed clients, and reported the correct version.');
})().catch(err=>{console.error(err);process.exitCode=1;});
