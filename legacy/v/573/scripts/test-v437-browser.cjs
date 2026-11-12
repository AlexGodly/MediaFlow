/* MediaFlow v436: deterministic local Chromium UI boot smoke, no cloud credentials.
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
 throw Error('Chromium/Google Chrome is required for v436 browser smoke test');
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
  try{result=await cdp.evaluate("({v:document.querySelector('meta[name=mediaflow-version]')?.content, loaded:document.readyState==='complete'||document.readyState==='interactive', text:(document.body?.innerText||'').length, title:document.title, script:!!document.querySelector('script[src*=\"mediaflow-v437.bundle.js\"]')})");}
  catch(e){await sleep(400);continue;}
  if(result?.v==='437'&&result.loaded&&result.script&&result.text>30){console.log(label,'browser boot:',JSON.stringify(result));return result;}
  if(i===44)throw Error(label+' failed browser boot: '+JSON.stringify(result));
  await sleep(350);
 }
}
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mf436-browser-')),screens=path.join(root,'artifacts','v437-browser-smoke');
 fs.mkdirSync(screens,{recursive:true});
 const server=await startServer();
 const chrome=binary();
 const proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
  '--disable-background-networking','--no-first-run','--disable-extensions',
  '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
  '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 let chromeErrors='';proc.stderr.on('data',chunk=>{chromeErrors+=String(chunk).slice(-3000);});
 let cdp=null;
 try{
  const active=path.join(profile,'DevToolsActivePort');
  for(let i=0;i<150&&!fs.existsSync(active);i++)await sleep(150);
  assert(fs.existsSync(active),'Chromium debugging endpoint unavailable: '+JSON.stringify({chrome,exit:proc.exitCode,stderr:chromeErrors.slice(-4000),profile}));
  const port=Number(fs.readFileSync(active,'utf8').split('\n')[0]);
  cdp=await connect(port);
  await cdp.send('Page.enable');await cdp.send('Runtime.enable');
  for(const d of [{label:'desktop',width:1440,height:900,mobile:false},{label:'mobile',width:360,height:780,mobile:true}]){
   await cdp.send('Emulation.setDeviceMetricsOverride',{width:d.width,height:d.height,deviceScaleFactor:1,mobile:d.mobile});
   await cdp.send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/?v437-smoke='+d.label});
   await pageReady(cdp,d.label);
   if(d.label==='desktop'){
    const prep=await cdp.evaluate("(()=>{if(!window.App?.mf421SetNavStyle)return 'missing App.mf421SetNavStyle';App.mf421SetNavStyle('top');return 'top applied';})()");
    assert.equal(prep,'top applied','Require functioning desktop top navigation');
    await sleep(300);
    const before=await cdp.evaluate("(()=>{const b=document.querySelector('.mf421-dock-account');return b?{html:b.innerHTML,cls:b.className}:null})()");
    assert(before,'Actual desktop Account button is required for avatar regression');
    console.log('Account first-paint:',JSON.stringify(before).slice(0,1000));
    const simulated=await cdp.evaluate("(()=>{const b=document.querySelector('.mf421-dock-account');const img=document.createElement('img');img.className='mf423-dock-avatar';img.alt='';img.src='data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22/%3E';b.replaceChildren(img);delete b.dataset.v225Iconified;delete b.dataset.v226SemanticIcon;window.App.v225EnhanceButtonIcons(b);window.App.v226RefreshSemanticButtonIcons(b);return {html:b.innerHTML,icons:b.querySelectorAll('.v225-btn-icon').length,image:b.querySelectorAll('img.mf423-dock-avatar').length}})()");
    assert.equal(simulated.icons,0,'Generic circled-arrow must NOT be inserted when avatar img is present');
    assert.equal(simulated.image,1,'Avatar must remain visible after both icon enhancers');
    await sleep(450);
    const settled=await cdp.evaluate("(()=>{const b=document.querySelector('.mf421-dock-account');return {html:b?.innerHTML||'',icons:b?.querySelectorAll('.v225-btn-icon').length||0,visibleIcon:!![...b.querySelectorAll('.v225-btn-icon')].find(el=>getComputedStyle(el).display!=='none')}})()");
    assert.equal(settled.icons,0,'No action icon reappears after observers and rerenders');
    console.log('Account avatar after observers:',JSON.stringify(settled));
    const bottom=await cdp.evaluate("(()=>{window.App.mf421SetNavStyle('bottom');const b=document.querySelector('.mf421-dock-account');return {exists:!!b,icons:b?.querySelectorAll('.v225-btn-icon').length||0}})()");
    assert(bottom.exists,'Account button persists when navigation moves bottom');
    assert.equal(bottom.icons,0,'Switching navigation positions must not create circled action icon');
    await cdp.evaluate("window.App.mf421SetNavStyle('top')");
   }
   const foundation=await cdp.evaluate("(()=>({version:window.MediaFlowV433?.version,count:window.MediaFlowV433?.list().length,pending:window.MediaFlowV433?.list().some(p=>p.id==='inventaire'&&p.access==='public')}))()");
   assert.equal(foundation.version,433,'Base v433 provider foundation remains loaded');
   const v436=await cdp.evaluate("(()=>({version:window.MediaFlowV436?.version,hasSelection:typeof window.MediaFlowV436?.selectedIds==='function'}))()");
   assert.equal(v436.version,436,'v436 runtime extension loaded');
   assert.equal(v436.hasSelection,true,'Selection recovery helper exists');
   const schema=await cdp.evaluate("(()=>({version:window.MediaFlowV437?.version,schema:window.MediaFlowV437?.schemaVersion,hasMusic:window.MediaFlowV437?.mediaTypes?.some(x=>x[0]==='music'),hasVisualNovel:window.MediaFlowV437?.mediaTypes?.some(x=>x[0]==='visual_novel')}))()");
   assert.deepEqual(schema,{version:437,schema:1,hasMusic:true,hasVisualNovel:true},'v437 runtime metadata foundation available');
   const gateway=await cdp.evaluate("(()=>({version:window.MediaFlowV434?.version,ready:window.MediaFlowV434?.configured()}))()");
   assert.equal(gateway.version,434,'Existing v434 gateway UI remains loaded');
   assert.equal(gateway.ready,false,'Do not activate providers before authentication and verification');
   assert(foundation.count>=37,'Expected remaining provider definitions, excluding Podcast Index');
   assert(foundation.pending,'Public staged book provider visible in registry');
   const dock=await cdp.evaluate("(()=>{const el=document.querySelector('.mf421-dock-progress');return el?{type:el.tagName,arrow:!!el.querySelector('.v225-btn-icon'),tabindex:el.getAttribute('tabindex')}:null})()");
   if(dock){assert.notEqual(dock.type,'BUTTON','Dock progression must never become a generic button');assert(!dock.arrow,'First-paint circle arrow must never appear');assert.equal(dock.tabindex,'0');}

   const img=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   assert(img.data,'No screenshot from '+d.label);
   fs.writeFileSync(path.join(screens,d.label+'.png'),Buffer.from(img.data,'base64'));
  }
  console.log('v437 Chromium smoke passed: local bundle boots with visible body on desktop and 360px mobile, screenshots saved');
 }finally{
  cdp?.close();proc.kill('SIGKILL');server.close();
  try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:7,retryDelay:150});}catch(cleanupError){console.warn('Chromium profile cleanup deferred:',cleanupError.message);}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
