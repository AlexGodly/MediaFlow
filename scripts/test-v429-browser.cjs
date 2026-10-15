/* MediaFlow v429: deterministic local Chromium UI boot smoke, no cloud credentials.
   Start ephemeral localhost server, block external DNS, inspect desktop/mobile app.
   Chromium required; intentionally fail CI when unavailable, no silent skip. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {spawn,execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.woff2':'font/woff2'};
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
async function startServer(){
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1/');
  const name=decodeURIComponent(url.pathname)==='/'?'index.html':decodeURIComponent(url.pathname).replace(/^\/+/,'');
  const target=path.resolve(root,name);
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(target,(err,data)=>{
   if(err){res.writeHead(404).end();return;}
   res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});
   res.end(data);
  });
 });
 await new Promise((resolve,reject)=>server.listen(0,'127.0.0.1',err=>err?reject(err):resolve()));
 return server;
}
function binary(){
 for(const name of [process.env.CHROME_BIN,'chromium','google-chrome','google-chrome-stable','chromium-browser'].filter(Boolean)){
  try{return execFileSync('which',[name],{encoding:'utf8'}).trim();}catch(_){}
  if(fs.existsSync(name))return name;
 }
 throw Error('Chromium/Google Chrome is required for v429 browser smoke test');
}
class CDP{
 constructor(ws){this.ws=ws;this.next=0;this.pending=new Map();ws.addEventListener('message',e=>{
  let data;try{data=JSON.parse(e.data);}catch(_){return;}
  if(data.id){const p=this.pending.get(data.id);if(!p)return;this.pending.delete(data.id);data.error?p.reject(Error(data.error.message)):p.resolve(data.result);}
 });}
 send(method,params={}){
  const id=++this.next;
  return new Promise((resolve,reject)=>{
   this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}));
  });
 }
 async evaluate(expression){
  const res=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(res.exceptionDetails)throw Error('Browser JS exception: '+JSON.stringify(res.exceptionDetails).slice(0,500));
  return res.result?.value;
 }
 close(){try{this.ws.close();}catch(_){}}
}
async function connect(port){
 for(let i=0;i<100;i++){
  try{
   const resp=await fetch('http://127.0.0.1:'+port+'/json/list');
   const tabs=await resp.json(),page=tabs.find(t=>t.type==='page');
   if(page?.webSocketDebuggerUrl){
    const ws=new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
    return new CDP(ws);
   }
  }catch(_){}
  await sleep(200);
 }
 throw Error('Chromium DevTools page target did not become available');
}
async function pageReady(cdp,label){
 for(let i=0;i<45;i++){
  let result;
  try{result=await cdp.evaluate("({v:document.querySelector('meta[name=mediaflow-version]')?.content, loaded:!!window.MediaFlowV429Center, text:(document.body?.innerText||'').length, title:document.title, script:!!document.querySelector('script[src*=\"mediaflow-v429.bundle.js\"]')})");}
  catch(e){await sleep(400);continue;}
  if(result?.v==='429'&&result.loaded&&result.script&&result.text>30){console.log(label,'browser boot:',JSON.stringify(result));return result;}
  if(i===44)throw Error(label+' failed browser boot: '+JSON.stringify(result));
  await sleep(350);
 }
}
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mf429-browser-')),screens=path.join(root,'artifacts','v429-browser-smoke');
 fs.mkdirSync(screens,{recursive:true});
 const server=await startServer();
 const chrome=binary();
 const proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
  '--disable-background-networking','--no-first-run','--disable-extensions',
  '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
  '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
 let cdp=null;
 try{
  const active=path.join(profile,'DevToolsActivePort');
  for(let i=0;i<150&&!fs.existsSync(active);i++)await sleep(150);
  assert(fs.existsSync(active),'Chromium debugging endpoint unavailable');
  const port=Number(fs.readFileSync(active,'utf8').split('\n')[0]);
  cdp=await connect(port);
  await cdp.send('Page.enable');await cdp.send('Runtime.enable');
  for(const d of [{label:'desktop',width:1440,height:900,mobile:false},{label:'mobile',width:360,height:780,mobile:true}]){
   await cdp.send('Emulation.setDeviceMetricsOverride',{width:d.width,height:d.height,deviceScaleFactor:1,mobile:d.mobile});
   await cdp.send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/?v429-smoke='+d.label});
   await pageReady(cdp,d.label);
   let center=null;
   for(let attempt=0;attempt<30&&!center;attempt++){
    center=await cdp.evaluate("(()=>{const n=document.querySelector('#mf429-center .mf429-launch');if(!n)return null;const r=n.getBoundingClientRect();return {x:r.x,width:r.width,viewport:innerWidth,label:n.innerText};})()");
    if(!center)await sleep(350);
   }
   if(!center){
    const diagnostic=await cdp.evaluate("(()=>({ready:document.readyState,body:!!document.body,center:!!document.getElementById('mf429-center'),className:document.body?.className,state:window.MediaFlowV429Center?.status?.(),app:typeof App?.mf429CenterToggle,settings:typeof S==='undefined'?'missing':JSON.stringify(S.settings?.v429Center),error:window.__mf429Error||''}))()");
    console.error('v429 Center initialization diagnostic:',JSON.stringify(diagnostic));
   }
   assert(center,'Recovery and Release Center launcher missing in '+d.label);
   assert(center.x>=-1&&center.x+center.width<=d.width+1,'Bottom-left launcher overflows '+d.label);
   assert(center.x<d.width/2,'Recovery Center not anchored to bottom-left on '+d.label);
   const opened=await cdp.evaluate("(()=>{App.mf429CenterTab('queue');const root=document.querySelector('#mf429-center');return {hasQueue:!!root?.querySelector('.mf429-job'),tabs:root?.querySelectorAll('[role=tab]').length,expanded:root?.classList.contains('open')};})()");
   assert(opened?.hasQueue&&opened.tabs===4&&opened.expanded,'Queue tab failed '+d.label+': '+JSON.stringify(opened));
   const surfaces=await cdp.evaluate("(()=>{const test={};for(const [tab,id] of [['covers','mf424-modal'],['metadata','mf428-metadata-modal']]){try{App.mf429CenterTab(tab);test[tab]=!!document.querySelector('#mf429-center #'+id);}catch(e){test[tab]='error: '+e.message;}}try{App.mf429CenterTab('fresh');test.fresh=!!document.querySelector('#mf429-center .mf429-anime-settings');test.freshProvider=!!document.querySelector('#mf429-center .mf380-provider-select');}catch(e){test.fresh='error: '+e.message;}return test;})()");
   assert(surfaces?.covers===true&&surfaces?.metadata===true&&surfaces?.fresh===true,'Existing recovery UI portal failed on '+d.label+': '+JSON.stringify(surfaces));
   console.log(d.label,'reused recovery interfaces:',JSON.stringify(surfaces));

   const editing=await cdp.evaluate("(()=>{App.mf429CenterTab('covers');const cover=document.querySelector('#mf429-center #mf424-config select[name=selection]');if(!cover)return {error:'Cover select missing'};cover.value='manual';App.mf429CenterTab('metadata');const mode=document.querySelector('#mf429-center #mf428-meta-method');if(!mode)return {error:'Metadata method missing'};mode.value='refresh';App.mf429CenterTab('covers');const keptCover=document.querySelector('#mf429-center #mf424-config select[name=selection]')?.value;App.mf429CenterTab('metadata');const keptMetadata=document.querySelector('#mf429-center #mf428-meta-method')?.value;App.mf429CenterToggle();App.mf429CenterToggle();const afterMinimize=document.querySelector('#mf429-center #mf428-meta-method')?.value;App.mf424OpenConfig();const scopedSettings=!!document.querySelector('#mf429-center #mf424-modal');const looseModal=!!document.querySelector('body > #mf424-modal');return {keptCover,keptMetadata,afterMinimize,scopedSettings,looseModal}})()");
   assert(editing?.keptCover==='manual'&&editing.keptMetadata==='refresh'&&editing.afterMinimize==='refresh',
     'Switching tabs/minimizing lost unsubmitted original form values: '+JSON.stringify(editing));
   assert(editing.scopedSettings&&!editing.looseModal,'Legacy Cover Recovery settings entry escaped Center: '+JSON.stringify(editing));
   console.log(d.label,'native recovery draft preservation:',JSON.stringify(editing));
   const freshPreservation=await cdp.evaluate("(()=>{App.mf429CenterTab('fresh');const seasonal=document.getElementById('mf429-seasonal-form');const present=!!seasonal;App.mf429CenterTab('queue');App.mf429CenterTab('fresh');const sameNode=document.getElementById('mf429-seasonal-form')===seasonal;return {present,sameNode};})()");
   assert(freshPreservation?.present&&freshPreservation.sameNode,'Fresh Episodes settings draft DOM was recreated: '+JSON.stringify(freshPreservation));
   const hiddenShortcut=await cdp.evaluate("(()=>{App.mf429CenterVisibility('hidden');const initiallyHidden=!document.getElementById('mf429-center');App.mf428MetadataOpen('settings');const opened=!!document.querySelector('#mf429-center #mf428-metadata-modal');App.mf429CenterToggle();const hiddenWhenMinimized=!document.getElementById('mf429-center');App.mf429CenterVisibility('always');return {initiallyHidden,opened,hiddenWhenMinimized};})()");
   assert(hiddenShortcut?.initiallyHidden&&hiddenShortcut.opened&&hiddenShortcut.hiddenWhenMinimized,'Hidden visibility blocked recovery shortcut: '+JSON.stringify(hiddenShortcut));
   console.log(d.label,'Fresh Episodes preservation and hidden-shortcut access:',JSON.stringify({freshPreservation,hiddenShortcut}));

   const img=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   assert(img.data,'No screenshot from '+d.label);
   fs.writeFileSync(path.join(screens,d.label+'.png'),Buffer.from(img.data,'base64'));
  }
  console.log('v429 Chromium smoke passed: local bundle boots with visible body on desktop and 360px mobile, screenshots saved');
 }finally{
  cdp?.close();proc.kill('SIGKILL');server.close();
  try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:8,retryDelay:200});}catch(e){console.warn('Temporary Chromium profile cleanup:',e.message);}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
