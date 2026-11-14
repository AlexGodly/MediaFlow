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
  try{result=await cdp.evaluate("({v:document.querySelector('meta[name=mediaflow-version]')?.content, loaded:document.readyState==='complete'||document.readyState==='interactive', text:(document.body?.innerText||'').length, title:document.title, script:!!document.querySelector('script[src*=\"mediaflow-v442.bundle.js\"]')})");}
  catch(e){await sleep(400);continue;}
  if(result?.v==='442'&&result.loaded&&result.script&&result.text>30){console.log(label,'browser boot:',JSON.stringify(result));return result;}
  if(i===44)throw Error(label+' failed browser boot: '+JSON.stringify(result));
  await sleep(350);
 }
}
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mf442-browser-')),screens=path.join(root,'artifacts','v442-browser-smoke');
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
   await cdp.send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/?v438-smoke='+d.label});
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
   assert.deepEqual(schema,{version:437,schema:1,hasMusic:true,hasVisualNovel:true},'v437 metadata foundation remains loaded');
   const gateway=await cdp.evaluate("(()=>({version:window.MediaFlowV434?.version,ready:window.MediaFlowV434?.configured()}))()");
   assert.equal(gateway.version,434,'Existing v434 gateway UI remains loaded');
   assert.equal(gateway.ready,false,'Do not activate providers before authentication and verification');
   assert(foundation.count>=37,'Expected remaining provider definitions, excluding Podcast Index');
   assert(foundation.pending,'Public staged book provider visible in registry');
   // Mount the actual v438 Settings body and inspect readable cards on
   // desktop and 360px mobile without requiring user account credentials.
   const directory=await cdp.evaluate("(()=>{\n    try{\n     const api=window.MediaFlowV438;if(!api)return {error:'Missing v438 registry'};\n     const root=document.createElement('section');root.className='mf365-settings-center';\n     root.style.cssText='width:min(1040px,calc(100vw - 24px));margin:10px auto;';\n     root.innerHTML=api.render();document.body.append(root);\n     api.refresh();\n     const grid=root.querySelector('#mf438-provider-grid');\n     const rect=root.querySelector('.mf438-provider')?.getBoundingClientRect();\n     const width=root.getBoundingClientRect().width;\n     const obj={version:api.version,cards:grid?.querySelectorAll('.mf438-provider').length||0,\n      width,cardWidth:rect?.width||0,withGateway:!!root.querySelector('.mf434-connection'),\n      withPublic:!!root.querySelector('[data-mf438-id=\"jikan\"]'),\n      withMusic:!!root.querySelector('[data-mf438-id=\"musicbrainz\"]'),\n      withGame:!!root.querySelector('[data-mf438-id=\"igdb\"]'),\n      overflow:root.scrollWidth>root.clientWidth+3,\n      category:window.MediaFlowSettingsRegistry.inspect().categories.some(x=>x.id==='api-providers')};\n     root.remove();return obj;\n    }catch(e){return {error:String(e.stack||e)};}\n   })()");
   console.log(d.label+' v438 Settings directory:',JSON.stringify(directory));
   assert(!directory.error,'v438 Settings directory must mount');
   assert.equal(directory.version,438);
   assert(directory.cards>=30,'provider directory should expose all catalog entries');
   assert(directory.withGateway&&directory.withPublic&&directory.withMusic&&directory.withGame,
     'Existing gateway and expanded media provider cards are present');
   assert(directory.category,'Settings Center has API Providers & Testing category');
   assert(directory.cardWidth>Math.min(220,directory.width*.65),'provider card must be readable on desktop and narrow mobile');
   assert(!directory.overflow,'no horizontal overflow in API directory');
   // The signed-out smoke mounts the real v439 Settings markup without
   // fake Library credentials or live provider network access.
   const metadata=await cdp.evaluate("(()=>{\n try{\n  const api=window.MediaFlowV439;\n  if(!api)return {error:'v439 runtime missing'};\n  const root=document.createElement('section');\n  root.className='mf365-settings-center mf365-detail';\n  root.style.cssText='width:min(1020px,calc(100vw - 25px));margin:8px auto;';\n  root.innerHTML=api.renderSettings();\n  document.body.append(root);\n  const area=root.querySelector('.mf439-settings');\n  const providers=area?.querySelectorAll('[data-mf439-provider]')||[];\n  const dialog=document.createElement('div');dialog.className='mf424-modal mf439-modal mf425-themed';\n  dialog.innerHTML='<section class=\"mf424-dialog mf439-dialog\"><div class=\"mf439-dialog-body\">'+\n    '<div class=\"mf439-recovery-preview\"><div class=\"mf439-fields\"><div class=\"mf439-proposal\"><div class=\"mf439-candidate\">Preview text and rating</div></div></div></div></div></section>';\n  document.body.append(dialog);\n  const box=area?.getBoundingClientRect();\n  const result={version:api.version,providers:providers.length,width:box?.width||0,rootWidth:root.getBoundingClientRect().width,\n   preview:!!dialog.querySelector('.mf439-proposal'),controls:!!root.querySelector('#mf439-max-batch'),\n   overflow:area?area.scrollWidth>area.clientWidth+3:true,\n   background:getComputedStyle(area).color,allSources:api.getProviders().length};\n  root.remove();dialog.remove();\n  return result;\n }catch(e){return {error:String(e.stack||e)};}\n})()");
   console.log(d.label+' v439 metadata UI:',JSON.stringify(metadata));
   assert(!metadata.error,'v439 metadata recovery UI must render: '+JSON.stringify(metadata));
   assert.equal(metadata.version,439);
   assert(metadata.providers>=10&&metadata.allSources>=10,'real metadata adapters listed');
   assert(metadata.controls&&metadata.preview,'Settings controls and preview rendering available');
   assert(metadata.width>=Math.max(220,metadata.rootWidth*.9),'metadata Settings must span available width');
   assert(!metadata.overflow,'no horizontal overflow in Metadata Recovery Settings');
   const covers=await cdp.evaluate("(()=>{\n try{\n  const v=window.MediaFlowV440;\n  if(!v)return {error:'Missing v440 cover registry'};\n  const sources=v.registered(),defs=window.MediaFlowV438.list();\n  const active=sources.every(id=>defs.some(p=>p.id===id&&p.coverAdapter));\n  const forbidden=sources.some(id=>!window.MediaFlowV440.providers().find(x=>x.id===id));\n  const controls=document.createElement('div');\n  controls.style.cssText='width:min(980px,calc(100vw - 24px));margin:auto;min-width:0;';\n  const card=document.createElement('div');\n  card.className='mf430-settings-provider-list';\n  card.innerHTML=window.MediaFlowV440.providers().map(p=>'<div class=\"mf430-settings-provider\"><label><input type=\"checkbox\" aria-label=\"'+p.name+'\"><span><strong>'+p.name+'</strong></span></label></div>').join('');\n  controls.appendChild(card);document.body.appendChild(controls);\n  const box=controls.getBoundingClientRect();\n  const row=card.querySelector('.mf430-settings-provider').getBoundingClientRect();\n  const report={version:v.version,providers:sources.length,active,\n   forbidden,width:box.width,rowWidth:row.width,overflow:controls.scrollWidth>controls.clientWidth+3,\n   apiTesting:!!window.MediaFlowV438.list().find(p=>p.id==='ifdb'&&p.testKind==='public'),\n   coverUI:!!card.querySelector('label input[type=\"checkbox\"]')};\n  controls.remove();return report;\n }catch(e){return {error:String(e.stack||e)};}\n})()");
   console.log(d.label+' v440 cover registry:',JSON.stringify(covers));
   assert(!covers.error,'v440 cover registry failed: '+JSON.stringify(covers));
   assert.equal(covers.version,440);
   assert.equal(covers.providers,7,'all seven public cover sources registered');
   assert(covers.active&&!covers.forbidden,'registry represents actual adapters');
   assert(covers.apiTesting&&covers.coverUI,'API testing and cover Settings both expose providers');
   assert(covers.width>=Math.min(280,d.width*0.8),'cover Settings readable on desktop/mobile');
   assert(!covers.overflow,'no horizontal overflow for cover source settings');
   const recovery=await cdp.evaluate("(()=>{\n try{\n  const api=window.MediaFlowV441;\n  if(!api)return {error:'v441 runtime missing'};\n  const settings=api.settings(),quick=api.quickMarkup();\n  const state={cover:{status:'paused',cursor:4,ids:Array(8).fill('id'),fixed:2},\n    metadata:{status:'paused',cursor:2,ids:Array(6).fill('id'),changed:7,errors:[]},\n    coverPct:50,metaPct:33,activeCount:2};\n  const frame=document.createElement('div');\n  frame.innerHTML=api.widget({visibility:'always',expanded:true,position:'right'},state);\n  document.body.append(frame);\n  const el=frame.querySelector('.mf441-widget');\n  // For screenshot geometry measure in the same fixed layout as production.\n  const rect=el.getBoundingClientRect();\n  const saved=document.body.scrollWidth;\n  const providerControls=settings.includes('API Providers & Testing')&&settings.includes('Metadata Recovery preferences');\n  const actions=(quick.match(/class=\"mf397-fan-action/g)||[]).length;\n  const result={version:api.version,width:rect.width,left:rect.left,right:rect.right,\n   viewport:window.innerWidth,actions,providerControls,\n   both:!!el.querySelector('[data-mf441-process=\"cover\"]')&&!!el.querySelector('[data-mf441-process=\"metadata\"]'),\n   progress:el.querySelectorAll('[role=\"progressbar\"]').length,\n   themed:!!getComputedStyle(el).backgroundColor,\n   settingsControls:settings.includes('recovery-widget-visibility')&&settings.includes('recovery-widget-position'),\n   overflow:rect.left<0||rect.right>window.innerWidth+3||saved>window.innerWidth+5};\n  frame.remove();return result;\n }catch(e){return {error:String(e.stack||e)};}\n})()");
   console.log(d.label+' v441 recovery workspace:',JSON.stringify(recovery));
   assert(!recovery.error,'v441 recovery workspace mounts: '+JSON.stringify(recovery));
   assert.equal(recovery.version,441);
   assert.equal(recovery.actions,5,'five floating actions including metadata');
   assert(recovery.both&&recovery.progress===2,'both background recovery engines displayed with progress');
   assert(recovery.providerControls&&recovery.settingsControls,'shared settings and provider links available');
   assert(recovery.width>=Math.min(300,d.width*.75),'widget readable in desktop and narrow mobile');
   assert(!recovery.overflow,'no viewport horizontal overflow');
   const health=await cdp.evaluate("(()=>{\n try{\n  const api=window.MediaFlowV442;\n  if(!api)return {error:'v442 Recovery Integrity API missing'};\n  const root=document.createElement('section');\n  root.className='mf441-settings';\n  root.style.cssText='width:min(930px,calc(100vw - 25px));margin:12px auto;';\n  root.innerHTML=api.renderHealth();\n  document.body.append(root);\n  const panel=root.querySelector('.mf442-health');\n  const rect=panel?.getBoundingClientRect(),health=api.health();\n  const info={version:api.version,scope:health.scope,\n    hasHealth:!!panel,hasRefresh:!!root.querySelector('[onclick=\"App.mf442RefreshHealth()\"]'),\n    hasExport:!!root.querySelector('[onclick=\"App.mf442ExportHealth()\"]'),\n    gridItems:panel?.querySelectorAll('.mf442-health-grid>div').length||0,\n    width:rect?.width||0,screen:innerWidth,overflow:panel?panel.scrollWidth>panel.clientWidth+4:true,\n    leakIds:panel?.textContent.includes('apikey')||false,\n    originalWidget:!!window.MediaFlowV441};\n  root.remove();return info;\n }catch(e){return {error:String(e.stack||e)};}\n})()");
   console.log(d.label+' v442 recovery health:',JSON.stringify(health));
   assert(!health.error,'v442 Recovery Integrity must render: '+JSON.stringify(health));
   assert.equal(health.version,442);
   assert(health.hasHealth&&health.hasRefresh&&health.hasExport&&health.gridItems===4,
     'recovery diagnostics and actions present');
   assert(health.originalWidget,'v441 recovery interface remains intact');
   assert(health.width>=Math.min(300,d.width*.8),'health UI readable on mobile and desktop');
   assert(!health.overflow&&!health.leakIds,'safe non-overflow diagnostics');
   const dock=await cdp.evaluate("(()=>{const el=document.querySelector('.mf421-dock-progress');return el?{type:el.tagName,arrow:!!el.querySelector('.v225-btn-icon'),tabindex:el.getAttribute('tabindex')}:null})()");
   if(dock){assert.notEqual(dock.type,'BUTTON','Dock progression must never become a generic button');assert(!dock.arrow,'First-paint circle arrow must never appear');assert.equal(dock.tabindex,'0');}

   const img=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   assert(img.data,'No screenshot from '+d.label);
   fs.writeFileSync(path.join(screens,d.label+'.png'),Buffer.from(img.data,'base64'));
  }
  console.log('v438 Chromium smoke passed: local bundle boots with visible body on desktop and 360px mobile, screenshots saved');
 }finally{
  cdp?.close();proc.kill('SIGKILL');server.close();
  try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:7,retryDelay:150});}catch(cleanupError){console.warn('Chromium profile cleanup deferred:',cleanupError.message);}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
