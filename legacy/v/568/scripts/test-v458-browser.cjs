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
  try{result=await cdp.evaluate("({v:document.querySelector('meta[name=mediaflow-version]')?.content, loaded:document.readyState==='complete'||document.readyState==='interactive', text:(document.body?.innerText||'').length, title:document.title, script:!!document.querySelector('script[src*=\"mediaflow-v458.bundle.js\"]')})");}
  catch(e){await sleep(400);continue;}
  if(result?.v==='458'&&result.loaded&&result.script&&result.text>30){console.log(label,'browser boot:',JSON.stringify(result));return result;}
  if(i===44)throw Error(label+' failed browser boot: '+JSON.stringify(result));
  await sleep(350);
 }
}
(async()=>{
 let profile=fs.mkdtempSync(path.join(os.tmpdir(),'mf443-browser-'));const screens=path.join(root,'artifacts','v458-browser-smoke');
 fs.mkdirSync(screens,{recursive:true});
 const server=await startServer();
 const chrome=binary();
 const spawnChrome=()=>spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
  '--disable-background-networking','--no-first-run','--disable-extensions',
  '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
  '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 let chromeErrors='';let proc=spawnChrome();proc.stderr.on('data',chunk=>{chromeErrors+=String(chunk).slice(-3000);});
 let cdp=null;
 try{
  const active=path.join(profile,'DevToolsActivePort');
  for(let attempt=0;attempt<3&&!fs.existsSync(path.join(profile,'DevToolsActivePort'));attempt++){
   if(attempt){proc.kill('SIGKILL');profile=fs.mkdtempSync(path.join(os.tmpdir(),'mf455-browser-retry-'));chromeErrors='';proc=spawnChrome();proc.stderr.on('data',chunk=>{chromeErrors+=String(chunk).slice(-3000);});}
   for(let i=0;i<150&&!fs.existsSync(path.join(profile,'DevToolsActivePort'));i++)await sleep(150);
  }
  assert(fs.existsSync(path.join(profile,'DevToolsActivePort')),'Chromium debugging endpoint unavailable after retries: '+JSON.stringify({chrome,exit:proc.exitCode,stderr:chromeErrors.slice(-4000),profile}));
  const port=Number(fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]);
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
   assert(recovery.actions>=6,'original actions plus Cover, Metadata and Combined Recovery shortcuts');
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
   const providerReadiness=await cdp.evaluate("(()=>{const api=window.MediaFlowV443;return api?{version:api.version,state:api.state(),hasReadySources:typeof api.readyCoverProviders==='function'}:null})()");
   assert(providerReadiness&&providerReadiness.version===443,'v443 provider readiness API must boot on both viewport sizes');
   assert(providerReadiness.hasReadySources,'v443 exposes real gateway readiness contract');
   const ui=await cdp.evaluate("(()=>{try{\n const api=window.MediaFlowV444;if(!api)return {error:'v444 module missing'};\n window.__mf444Pending=api.confirm('Start Metadata Recovery?', 'Selected titles stay protected.', 'Start Recovery', false, 86, 'metadata');\n const dialog=document.getElementById('mf444-confirm'),rect=dialog?.querySelector('.mf444-dialog')?.getBoundingClientRect();\n return {version:api.version,shown:!!dialog,selected:dialog?.textContent.includes('86'),modal:!!dialog?.querySelector('[aria-modal=\"true\"]'),within:rect?.left>=0&&rect?.right<=innerWidth,style:getComputedStyle(dialog.querySelector('.mf444-dialog')).backgroundColor};\n }catch(e){return {error:String(e)}}})()");
   console.log(d.label+' v444 modal:',JSON.stringify(ui));
   assert(!ui.error&&ui.version===444&&ui.shown&&ui.selected&&ui.modal&&ui.within,'v444 confirmation must be visible, themed and within viewport');
   const confirmationScreenshot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   fs.writeFileSync(path.join(screens,'v444-confirm-'+d.label+'.png'),Buffer.from(confirmationScreenshot.data,'base64'));
   await cdp.evaluate("document.querySelector('#mf444-confirm [data-mf444-dismiss]')?.click()");
   const dismissed=await cdp.evaluate("window.__mf444Pending.then(value=>({accepted:value,removed:!document.getElementById('mf444-confirm')}))");
   assert(dismissed?.accepted===false&&dismissed.removed,'Cancelling modal must not start recovery');
   const actions=await cdp.evaluate("(()=>{try{\n const wrap=document.createElement('div');wrap.id='mf444-test-quick-menu';wrap.innerHTML=window.MediaFlowV441.quickMarkup();document.body.append(wrap);\n const fan=wrap.querySelector('#mf397-fan');if(!fan)return {error:'missing fan'};\n fan.classList.add('open');\n const rects=[...fan.querySelectorAll('.mf397-fan-action')].map(x=>{const r=x.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height}});\n const result={count:rects.length,allEqual:rects.every(r=>Math.abs(r.width-rects[0].width)<2),noOverflow:rects.every(r=>r.left>=0&&r.right<=innerWidth+2),noNumbers:getComputedStyle(fan.querySelector('em')).display==='none'};\n wrap.remove();return result;\n }catch(e){return {error:String(e)}}})()");
   console.log(d.label+' v444 floating actions:',JSON.stringify(actions));
   assert(!actions.error&&actions.count>=7&&actions.allEqual&&actions.noOverflow&&actions.noNumbers,'All expanded actions must have equal widths, no number badges or horizontal overflow');
   const unified=await cdp.evaluate("(()=>{try{\n const api=window.MediaFlowV445;if(!api)return {error:'v445 runtime missing'};\n api.open('cover');\n const el=document.getElementById('mf445-workspace'),dialog=el?.querySelector('.mf445-dialog');\n const rect=dialog?.getBoundingClientRect();\n const cover={providers:el?.querySelectorAll('.mf445-provider').length||0,\n  tabs:el?.querySelectorAll('[role=\"tab\"]').length||0,\n  categories:!!el?.querySelector('.mf445-categories details'),\n  style:dialog?getComputedStyle(dialog).backgroundColor:'',\n  width:rect?.width||0,within:!!rect&&rect.left>=-2&&rect.right<=innerWidth+2};\n api.open('metadata');\n const metadata={providers:el?.querySelectorAll('.mf445-provider').length||0,\n  active:el?.querySelector('[data-mf445-tab=\"metadata\"]')?.getAttribute('aria-selected'),\n  buttons:el?.querySelectorAll('.mf445-actions button').length||0,\n  restricted:!!el?.querySelector('.mf445-actions button[disabled]')};\n api.close();\n return {version:api.version,cover,metadata,removed:!document.getElementById('mf445-workspace'),\n  noOverflow:document.documentElement.scrollWidth<=innerWidth+5};\n }catch(e){return {error:String(e.stack||e)}}})()");
   console.log(d.label+' v445 unified workspace:',JSON.stringify(unified));
   assert(!unified.error&&unified.version===445,'v445 UI must boot: '+JSON.stringify(unified));
   assert(unified.cover.providers>=5&&unified.cover.tabs>=3&&unified.cover.style&&unified.cover.within,'Cover tab must list real providers with responsive dialog');
   assert(unified.metadata.providers>=5&&unified.metadata.active==='true'&&unified.metadata.buttons>=2,'Metadata tab must show independent sources and safe actions');
   assert(unified.removed&&unified.noOverflow,'Workspace must dismiss safely without horizontal overflow');
   const scoped=await cdp.evaluate("(()=>{try{\n const api=window.MediaFlowV446;if(!api)return {error:'v446 module not loaded'};\n window.MediaFlowV445.open('cover');let root=document.getElementById('mf445-workspace');\n const control=root.querySelector('[data-mf446-scope]');\n const scopes=[...control.options].map(x=>x.value);\n const covers=root.querySelectorAll('.mf446-provider input[type=checkbox]').length;\n control.value='category';control.dispatchEvent(new Event('change',{bubbles:true}));\n root=document.getElementById('mf445-workspace');\n const category=root.querySelector('[data-mf446-scope]').value==='category'&&!!root.querySelector('.mf446-categories[open]');\n window.MediaFlowV445.open('metadata');root=document.getElementById('mf445-workspace');\n const metadata=root.querySelectorAll('.mf446-provider input[type=checkbox]').length;\n const rect=root.querySelector('.mf445-dialog').getBoundingClientRect();\n const widget=api.widget({visibility:'always',position:'right',expanded:true},\n {cover:{status:'paused',cursor:1,ids:['1'],fixed:1,pending:0},metadata:null,coverPct:100,metaPct:0,activeCount:1});\n window.MediaFlowV445.close();\n const foot=widget.slice(widget.indexOf('mf446-widget-foot'));\n const row=widget.slice(widget.indexOf('data-mf441-process=\"cover\"'),widget.indexOf('</article>'));\n return {version:api.version,scopes,covers,category,metadata,\n  footer:foot.indexOf('Setup</button>')>=0&&foot.indexOf('Setup</button>')<foot.indexOf('Recovery Settings'),\n  coverAction:row.includes('New Recovery')&&!row.includes(' Setup</button>'),\n  within:rect.left>=-2&&rect.right<=innerWidth+2,\n  overflow:document.documentElement.scrollWidth>innerWidth+5,\n  removed:!document.getElementById('mf445-workspace')};\n }catch(e){return {error:String(e.stack||e)}}})()");
   console.log(d.label+' v446 scope UI:',JSON.stringify(scoped));
   assert(!scoped.error&&scoped.version===446,'v446 module must load: '+JSON.stringify(scoped));
   assert.deepEqual(scoped.scopes,['all','library','category','categoryStatus','selected']);
   assert(scoped.covers>5&&scoped.metadata>5&&scoped.category,'Both recovery types expose editable providers and category scope');
   assert(scoped.footer&&scoped.coverAction,'Setup relocates left of Recovery Settings; Cover gets New Recovery');
   assert(scoped.within&&!scoped.overflow&&scoped.removed,'v446 dialog fits desktop and mobile');
   const universal=await cdp.evaluate("(()=>{try{\n const api=window.MediaFlowV447;if(!api)return {error:'v447 runtime missing'};\n api.open('both');\n const root=document.getElementById('mf445-workspace');\n const dialog=root.querySelector('.mf445-dialog');\n const rect=dialog.getBoundingClientRect();\n const tabs=[...root.querySelectorAll('[data-mf445-tab]')].map(el=>({kind:el.dataset.mf445Tab,active:el.getAttribute('aria-selected')}));\n const scope=[...root.querySelector('[data-mf446-scope]').options].map(x=>x.value);\n const providerLists=[...root.querySelectorAll('.mf447-stage .mf446-providers')].map(el=>el.querySelectorAll('input[type=checkbox]').length);\n const start=!!root.querySelector('button[data-mf457-launch-kind]');\n const caps=!!root.querySelector('.mf447-combined-note');\n const shortcuts=api.buttons({ids:['1']});\n const quick=window.MediaFlowV441.quickMarkup();\n api.open('metadata');\n const metadata=root.querySelector('[data-mf445-tab=\"metadata\"]').getAttribute('aria-selected');\n window.MediaFlowV445.close();\n return {version:api.version,tabs,scope,providerLists,start,caps,shortcuts:shortcuts.includes('Recover Both'),\n  floating:quick.includes('metadataRecovery')&&quick.includes('bothRecovery'),\n  metadata,inside:rect.left>=-2&&rect.right<=innerWidth+2,\n  overflow:document.documentElement.scrollWidth>innerWidth+5,\n  removed:!document.getElementById('mf445-workspace')};\n }catch(e){return {error:String(e.stack||e)}}})()");
   console.log(d.label+' v447 universal actions:',JSON.stringify(universal));
   assert(!universal.error&&universal.version===447,'v447 runtime must load: '+JSON.stringify(universal));
   assert.deepEqual(universal.tabs.map(x=>x.kind),['cover','metadata','both']);
   assert(universal.tabs.find(x=>x.kind==='both')?.active==='true','Combined recovery is an active third workspace tab');
   assert.deepEqual(universal.scope,['all','library','category','categoryStatus','selected']);
   assert(universal.providerLists[0]>5&&universal.providerLists[1]>5,'Both provider selectors appear in Combined tab');
   assert(universal.start&&universal.caps&&universal.shortcuts&&universal.floating,'Combined action, cap, and floating shortcuts are visible');
   assert(universal.metadata==='true'&&universal.inside&&!universal.overflow&&universal.removed,'Combined recovery fits desktop/mobile and preserves tab switching');
   const smart=await cdp.evaluate("(()=>{try{\n const api=window.MediaFlowV448,unified=window.MediaFlowV445;if(!api)return {error:'v448 module not loaded'};\n unified.open('cover');\n let root=document.getElementById('mf445-workspace');\n const cover={settings:!!root?.querySelector('.mf448-settings'),select:!!root?.querySelector('[data-mf448-key=\"coverPolicy\"]'),autoSave:!!root?.querySelector('[data-mf448-key=\"dashboardAutoSave\"]')};\n if(!cover.settings)return {error:'cover automation policy missing'};\n window.App.mf448Set('coverPolicy','strict');\n root=document.getElementById('mf445-workspace');\n const persisted=api.prefs().coverPolicy==='strict';\n unified.open('metadata');root=document.getElementById('mf445-workspace');\n const metadata={settings:!!root.querySelector('.mf448-settings'),selector:!!root.querySelector('[data-mf448-key=\"metadataPolicy\"]'),\n   confidence:!!root.querySelector('[data-mf448-key=\"metadataConfidence\"]')};\n window.App.mf448Set('metadataPolicy','review');\n const policy=api.prefs().metadataPolicy==='review';\n window.App.mf448Set('coverPolicy','original');\n window.App.mf448Set('metadataPolicy','original');\n unified.close();\n window.App.mf447Open('both');\n root=document.getElementById('mf445-workspace');\n const combined=root?.querySelectorAll('.mf448-policy').length||0;\n const dialog=root?.querySelector('.mf445-dialog');\n const rect=dialog?.getBoundingClientRect();\n unified.close();\n return {version:api.version,cover,metadata,persisted,policy,combined,\n   within:!!rect&&rect.left>=-2&&rect.right<=innerWidth+2,\n   overflow:document.documentElement.scrollWidth>innerWidth+5,\n   removed:!document.getElementById('mf445-workspace')};\n }catch(e){return {error:String(e.stack||e)}}})()");
   console.log(d.label+' v448 smart policies:',JSON.stringify(smart));
   assert(!smart.error&&smart.version===448,'v448 smart policy must load: '+JSON.stringify(smart));
   assert(smart.cover.settings&&smart.cover.select&&smart.cover.autoSave,'Cover policies and existing Dashboard auto-save are integrated');
   assert(smart.metadata.settings&&smart.metadata.selector&&smart.metadata.confidence,'Metadata review mode and confidence are configurable');
   assert(smart.persisted&&smart.policy&&smart.combined===2,'Selections persist and combined tab shows both policies');
   assert(smart.within&&!smart.overflow&&smart.removed,'Policy workspace stays responsive on mobile and desktop');
   const editor449=await cdp.evaluate("(()=>{try{\n const api=window.MediaFlowV449;\n if(!api)return {error:'v449 runtime missing'};\n const item={id:'v449-editor-test',title:'Example Library title'};\n const actions=['Cover Recovery','Metadata Recovery','Recover Both'].map((label,i)=>\n  '<button type=\"button\" onclick=\"App.mf447Open(&#39;'+['cover','metadata','both'][i]+'&#39;)\">'+label+'</button>').join('');\n const raw='<div class=\"v239-library-editor-shell\"><div class=\"v238-library-editor v240-library-editor\">'+\n  '<div class=\"modal-title\">Edit title</div><div class=\"field\"><input id=\"l-title\" value=\"Example Library title\"></div>'+\n  '<div class=\"mf439-editor-action mf447-editor-actions\"><div class=\"mf447-shortcut-group\">'+actions+'</div>'+\n  '<button type=\"button\" onclick=\"App.mf439Open(&#39;v449-editor-test&#39;)\">Fix Metadata</button></div>'+\n  '<section class=\"mf437-editor\">Metadata details</section></div></div>';\n const holder=document.createElement('div');holder.id='v449-test-modal';holder.className='modal';\n holder.innerHTML=api.transform(raw,item);\n document.body.append(holder);\n const editor=holder.querySelector('.v240-library-editor,.v238-library-editor');\n const toolbar=editor?.querySelector(':scope > .mf449-editor-recovery-toolbar');\n const label=editor?.querySelector('.modal-title');\n const buttons=[...(toolbar?.querySelectorAll('button')||[])];\n const labels=buttons.map(el=>el.textContent.trim().replace(/\\s+/g,' '));\n const rect=toolbar?.getBoundingClientRect();\n const headerRect=label?.getBoundingClientRect();\n const saved={count:buttons.length,labels,\n   top:!!toolbar&&editor.firstElementChild===toolbar,\n   titleBelow:!!rect&&!!headerRect&&rect.top<=headerRect.top,\n   metadataPreview:buttons.some(b=>b.getAttribute('onclick')?.includes('mf439Open')),\n   combined:buttons.some(b=>b.getAttribute('onclick')?.includes('mf447Open')),\n   duplicates:(editor.querySelectorAll('.mf447-shortcut-group').length===1),\n   inside:!!rect&&rect.left>=-2&&rect.right<=innerWidth+2,\n   grid:getComputedStyle(toolbar).gridColumnStart,\n   order:getComputedStyle(toolbar).order,\n   overflow:!!toolbar&&toolbar.scrollWidth>toolbar.clientWidth+4};\n holder.remove();\n const draft=document.createElement('div');\n draft.innerHTML=api.transform('<div class=\"v239-library-editor-shell\"><div class=\"v238-library-editor v240-library-editor\">'+\n  '<div class=\"modal-title\">Add title</div><div class=\"field\"><input id=\"l-title\"></div></div></div>',\n  {title:'Unsaved test title'});\n const draftButtons=[...draft.querySelectorAll('.mf449-editor-recovery-toolbar button')];\n const newTitle={count:draftButtons.length,disabled:draftButtons.every(b=>b.disabled),\n   note:!!draft.querySelector('.mf449-draft-note'),\n   titleBelow:!!draft.querySelector('.mf449-editor-recovery-toolbar + .modal-title')};\n const libraryHtml=api.cleanLibrary('<div class=\"mf425-library-tools\">'+\n  '<button class=\"btn btn-sm mf425-tools-button\">Fix missing covers</button>'+\n  '<div class=\"mf447-shortcut-group\"><button>Cover Recovery</button>'+\n  '<button>Metadata Recovery</button><button>Recover Both</button></div></div>');\n const library={oldButton:libraryHtml.includes('mf425-tools-button'),\n   recover:libraryHtml.includes('mf447-shortcut-group'),\n   labels:libraryHtml.includes('Cover Recovery')};\n return {version:api.version,saved,newTitle,library};\n }catch(e){return {error:String(e.stack||e)}}})()");
   console.log(d.label+' v449 editor actions:',JSON.stringify(editor449));
   assert(!editor449.error&&editor449.version===449,'v449 UI loads: '+JSON.stringify(editor449));
   assert.deepEqual(editor449.saved.labels,['Cover Recovery','Metadata Recovery','Recover Both','Fix Metadata']);
   assert(editor449.saved.count===4&&editor449.saved.top&&editor449.saved.titleBelow&&editor449.saved.metadataPreview&&editor449.saved.combined&&editor449.saved.duplicates,'The four functional saved-title actions belong only to the top toolbar');
   assert(editor449.saved.inside&&!editor449.saved.overflow&&editor449.saved.order==='-1','The toolbar fits within the desktop and mobile modal');
   assert(editor449.newTitle.count===3&&editor449.newTitle.disabled&&editor449.newTitle.note&&editor449.newTitle.titleBelow,'Unsaved title shows the three supported disabled recovery actions above its heading');
   assert(!editor449.library.oldButton&&editor449.library.recover&&editor449.library.labels,'Remove only the redundant Library Tools button; keep Cover Recovery actions');

   const ratings450=await cdp.evaluate("(()=>{try{\n const api=window.MediaFlowV450;\n if(!api)return {error:'v450 metadata module missing'};\n const keys=Object.keys(api.fields);\n const normalized=api.normalizeRatings({rottenTomatoes:{value:91,scale:100},imdb:{score:8.3,scale:10},anilist:{score:111,scale:100}});\n const rating=api.ratingTiles({universalMetadata:{externalRatings:{imdb:{score:8.3,scale:10,votes:200}},provenance:{'rating.imdb':{source:'omdb',verified:true}}}});\n const icon=api.mark('rottentomatoes_critics');\n const group=api.fields.book.some(f=>f[0]==='audiobookDurationMinutes');\n const dimensions={width:document.documentElement.scrollWidth,viewport:innerWidth};\n return {version:api.version,groups:keys.length,book:group,score:normalized.rottentomatoes_critics?.score,\n  invalid:normalized.anilist===undefined,icon:icon.includes('mf450-source-mark'),\n  tile:rating.includes('IMDb')&&rating.includes('8.3'),within:dimensions.width<=dimensions.viewport+5};\n }catch(e){return {error:String(e.stack||e)}}})()");

   const control451=await cdp.evaluate("(()=>{try{\n const api=window.MediaFlowV451;\n if(!api)return {error:'v451 runtime missing'};\n const widget=api.controls();\n const active=['mf451Stop','mf451ClearAll','mf451ResumeInterrupted'].every(k=>typeof window.App[k]==='function');\n return {version:api.version,stopAll:widget.includes('Stop All'),discard:widget.includes('Discard Queues'),\n  active,priority:api.priority(),overflow:document.documentElement.scrollWidth>innerWidth+5};\n }catch(e){return {error:String(e.stack||e)}}})()");
   console.log(d.label+' v451 recovery scheduler:',JSON.stringify(control451));
   assert(!control451.error&&control451.version===451&&control451.stopAll&&control451.discard&&control451.active,'v451 stop and resume UI wired');
   assert(!control451.overflow,'v451 recovery controls fit desktop and 360px viewport');

   const polish452=await cdp.evaluate("(()=>{try{\n const api=window.MediaFlowV452;\n if(!api)return {error:'v452 runtime missing'};\n const simple='<section class=\"mf449-editor-recovery-toolbar\">'+\n '<button>Cover Recovery</button><button>Metadata Recovery</button><button>Recover Both</button>'+\n '<button onclick=\"App.mf439Open(&#39;123&#39;)\">Fix Metadata</button></section>'+\n '<div class=\"v181-detail-actions\"><button onclick=\"App.mf439Open(&#39;123&#39;)\">Fix Metadata</button></div>';\n const cleaned=api.clean(simple);\n const cover=api.toolbar('cover'),metadata=api.toolbar('metadata');\n const stop=typeof api.stopAfter==='function'&&\n ['stop','stopTitle','stopPart','stopAll','discard'].every(k=>api.icon(k).includes('mf452-icon-'+k));\n const icon=new Set(['stop','stopTitle','stopPart','stopAll','discard'].map(k=>api.icon(k))).size===5;\n const cleanOk=!cleaned.includes('Fix Metadata')&&['Cover Recovery','Metadata Recovery','Recover Both'].every(t=>cleaned.includes(t));\n const groups=[cover,metadata].every(x=>x.includes('Select All')&&x.includes('Deselect All')&&x.includes('data-v225-iconified=\"1\"')&&x.includes('mf452-icon-selectAll')&&x.includes('mf452-icon-deselectAll'));\n return {version:api.version,cleanOk,groups,stop,icon,icons:5,\n  viewport:document.documentElement.scrollWidth<=innerWidth+5};\n }catch(e){return {error:String(e.stack||e)}}})()");
   console.log(d.label+' v452 recovery UI:',JSON.stringify(polish452));
   assert(!polish452.error&&polish452.version===452&&polish452.cleanOk&&polish452.groups,
    'Recovery provider selection/icons and redundant Fix Metadata cleanup functional');
   assert(polish452.stop&&polish452.icon&&polish452.viewport,
    'Cover and Metadata stop actions are distinct and desktop/mobile-safe');

   const quick453=await cdp.evaluate("(()=>{try{\n const preset=window.MediaFlowV453Presets,quick=window.MediaFlowV453;\n if(!preset||!quick)return {error:'v453 modules missing'};\n const html=preset.html();\n const node=document.createElement('div');node.innerHTML=window.MediaFlowV452.toolbar('cover');document.body.append(node);\n const buttons=[...node.querySelectorAll('button.mf452-control')];\n const selected=buttons[0],deselected=buttons[1];\n const old=App.mf446ProviderAll;let log=[];\n try{App.mf446ProviderAll=(mode,on)=>log.push({mode,on});selected.click();deselected.click();}\n finally{App.mf446ProviderAll=old;node.remove();}\n const count=log.length===2&&log[0].mode==='cover'&&log[0].on===true&&log[1].on===false;\n const source=document.createElement('div');source.innerHTML=window.MediaFlowV452.sourceHtml('metadata');\n const checkbox=source.querySelector('input[data-mf446-toggle]');\n const originalToggle=App.mf446ToggleProvider;let toggle=null;\n try{App.mf446ToggleProvider=(mode,id,on)=>{toggle={mode,id,on}};if(checkbox){checkbox.checked=true;checkbox.dispatchEvent(new Event('change',{bubbles:true}));}}\n finally{App.mf446ToggleProvider=originalToggle;}\n return {version:preset.version,quick:quick.version,settings:html.includes('Recovery Presets'),\n  bulkClick:count,toggle:!!toggle&&toggle.mode==='metadata'&&typeof toggle.id==='string',\n  noOverflow:document.documentElement.scrollWidth<=innerWidth+5};\n }catch(e){return {error:String(e.stack||e)}}})()");
   console.log(d.label+' v453 presets + real DOM provider clicks:',JSON.stringify(quick453));
   assert(!quick453.error&&quick453.version===453&&quick453.quick===453&&quick453.settings,'v453 quick recovery and presets boot');
   assert(quick453.bulkClick&&quick453.toggle&&quick453.noOverflow,'Provider bulk and checkbox actions must EXECUTE in real DOM, no truncated attribute');



   console.log(d.label+' v450 external ratings:',JSON.stringify(ratings450));
   assert(!ratings450.error&&ratings450.version===450,'v450 metadata module loads: '+JSON.stringify(ratings450));
   assert(ratings450.groups>=12&&ratings450.book&&ratings450.score===91&&ratings450.invalid,
    'Universal fields and score normalization activate in browser');
   assert(ratings450.icon&&ratings450.tile&&ratings450.within,
    'Provider-specific ratings render without overflow on desktop or 360px mobile');

   const ui454=await cdp.evaluate("(()=>{\n try{\n const quick=window.MediaFlowV454,presets=window.MediaFlowV454Presets;\n if(!quick||!presets)return {error:'v454 modules missing'};\n const root=document.createElement('div');\n root.id='mf453-title-quick';root.className='mf424-modal mf425-themed mf453-quick-modal mf454-quick-modal';\n root.innerHTML='<div class=\"mf424-shade\"></div><section class=\"mf424-dialog mf453-quick-dialog mf454-quick-dialog\"><header class=\"mf453-quick-top\">Quick recovery</header><div data-mf453-quick-content></div></section>';\n const fixture={id:'fixture-title',kind:'both',serial:454,stage:'ready',closed:false,\n covers:[{url:'https://example.com/cover1.jpg',title:'First alternative cover',provider:'AniList',confidence:.98},\n {url:'https://example.com/cover2.jpg',title:'Second alternative cover with a long readable title',provider:'Jikan',confidence:.4}],\n coverIndex:-1,coverLoading:false,metaLoading:false,applying:false,pending:[],errors:[],\n metadata:{preview:{results:2,proposals:[{token:'field.synopsis',label:'Synopsis',\n original:null,selected:true,hasOriginal:false,protected:false,same:false,status:'ready',choice:0,\n options:[{value:'New synopsis option A',sources:[{provider:'AniList',evidence:'Verified ID'}]},\n {value:'New synopsis option B',sources:[{provider:'Jikan',evidence:'Title match'}]}]}]}}};\n document.body.append(root);\n const pane=root.querySelector('[data-mf453-quick-content]');\n pane.innerHTML=quick.html(fixture);\n const cover=root.querySelector('.mf454-cover-option'),meta=root.querySelector('.mf454-source-label select');\n const coverWidth=cover?.getBoundingClientRect().width||0;\n const strongWidth=cover?.querySelector('strong')?.getBoundingClientRect().width||0;\n const z=parseInt(getComputedStyle(root).zIndex,10);\n const alternatives=pane.textContent.includes('Second alternative cover')&&pane.textContent.includes('New synopsis option B');\n const choices=root.querySelectorAll('.mf454-cover-option').length;\n const group=document.createElement('div');\n group.innerHTML='<div class=\"mf454-category-art\"><img alt=\"\" src=\"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==\"></div>';\n document.body.append(group);\n const img=group.querySelector('img'); const iconWidth=img?.getBoundingClientRect().width||0;\n const iconHeight=img?.getBoundingClientRect().height||0;\n group.remove();quick.clearOrphans();\n const html=presets.html();\n return {version:quick.version,z,coverWidth,strongWidth,choices,alternatives,meta:!!meta,\n iconWidth,iconHeight,searchable:html.includes('Search categories')&&html.includes('mf454-presets-layout'),\n overflow:document.documentElement.scrollWidth>innerWidth+5};\n }catch(e){return {error:String(e.stack||e)}}\n})()");
   console.log(d.label+' v454 modal, alternatives and preset layout:',JSON.stringify(ui454));
   assert(!ui454.error&&ui454.version===454&&ui454.z>1000000&&ui454.choices===2&&ui454.alternatives&&ui454.meta,'v454 top-layer quick recovery shows cover and metadata alternatives');
   assert(ui454.coverWidth>100&&ui454.strongWidth>65&&ui454.iconWidth<=32&&ui454.iconHeight<=32&&ui454.searchable&&!ui454.overflow,'v454 cover text readable, category artwork bounded and presets responsive');

   const v455=await cdp.evaluate("(()=>{\n try{\n const api=window.MediaFlowV455,stages=window.MediaFlowV455Stages;\n if(!api||!stages)return {error:'v455 missing'};\n const html=api.processing('cover');\n const settings=['Processing & matching','Part-by-Part','One-Go','Titles per part','Cover selection',\n 'Hybrid','Smart Automatic','Provider Priority','Manual Selection','Rate-limit protection',\n 'Resume when app reopens'].every(x=>html.includes(x));\n const old=document.querySelector('#mf453-title-quick');\n const root=document.createElement('div');\n root.id='mf453-title-quick';root.className='mf424-modal mf425-themed mf453-quick-modal mf454-quick-modal';\n root.innerHTML='<div class=\"mf424-shade\"></div><section class=\"mf424-dialog mf453-quick-dialog mf454-quick-dialog\"><header>Quick</header><div data-mf453-quick-content></div></section>';\n const fixture={id:'fixture-title',kind:'both',serial:455,stage:'ready',closed:false,\n covers:[{url:'https://example.com/cover-a.jpg',title:'First season artwork',provider:'AniList',confidence:.95,idMatch:true},\n {url:'https://example.com/cover-b.jpg',title:'Docchi ni suru alternative candidate',provider:'Tenrai',confidence:0,idMatch:false}],\n coverIndex:1,coverLoading:false,metaLoading:false,applying:false,pending:[],errors:[],\n metadata:{preview:{results:2,proposals:[]}}};\n document.body.append(root);\n root.querySelector('[data-mf453-quick-content]').innerHTML=window.MediaFlowV454.html(fixture);\n const card=root.querySelector('.mf454-cover-option'),image=root.querySelector('.mf454-cover-image');\n const label=card?.querySelector('.mf454-cover-meta strong');\n const rb=card?.getBoundingClientRect(),ib=image?.getBoundingClientRect(),lb=label?.getBoundingClientRect();\n const display=getComputedStyle(card).display,direction=getComputedStyle(card).flexDirection;\n const full=rb&&ib&&lb&&ib.width>=rb.width*.7&&lb.width>=rb.width*.7&&lb.top>=ib.bottom-2;\n const uncertain=root.textContent.includes('Unverified match');\n const none=!!root.querySelector('.v225-btn-icon');\n const overflow=document.documentElement.scrollWidth>innerWidth+5;\n root.remove();\n return {version:api.version,settings,full,display,direction,uncertain,\n noCircle:!none,overflow,progress:typeof stages.progress==='function'};\n }catch(e){return {error:String(e.stack||e)}}\n})()");
   console.log(d.label+' v455 workspace + cover-card layout:',JSON.stringify(v455));
   assert(!v455.error&&v455.version===455&&v455.settings&&v455.progress&&v455.uncertain,'v455 processing controls, direct runtime and cautious alternate cover labels');
   assert(v455.full&&v455.display==='flex'&&v455.direction==='column'&&v455.noCircle&&!v455.overflow,'v455 cover thumbnails and titles stack legibly on desktop and 360px mobile');

   const ui456=await cdp.evaluate("(()=>{\n try{\n const api=window.MediaFlowV456Quick,launch=window.MediaFlowV456Launch;\n if(!api||!launch)return {error:'v456 modules missing'};\n const root=document.createElement('div');\n root.id='mf453-title-quick';root.className='mf424-modal mf425-themed mf453-quick-modal mf454-quick-modal';\n root.innerHTML='<div class=\"mf424-shade\"></div><section class=\"mf424-dialog mf453-quick-dialog mf454-quick-dialog\"><header>Quick</header><div data-mf453-quick-content></div></section>';\n const covers=[\n ['https://example.com/a.jpg','Long cover A anime season 2 title','AniList',.94,'anilist','12345',true],\n ['https://example.com/b.jpg','Long cover B other release','Jikan',.64,'mal','67890',false],\n ['https://example.com/c.jpg','Long cover C other edition','Kitsu',.51,'kitsu','123',false],\n ['https://example.com/d.jpg','Long cover D other option','Tenrai',.31,'mal','8080',false]\n ].map(([url,title,provider,confidence,externalIdKey,externalIdValue,idMatch])=>(\n {url,title,provider,confidence,externalIdKey,externalIdValue,idMatch}));\n const fixture={id:'v456-fake',kind:'both',serial:456,stage:'ready',closed:false,covers,coverIndex:1,\n coverLoading:false,metaLoading:false,applying:false,pending:[],errors:[],\n metadata:{preview:{results:1,proposals:[]}}};\n document.body.append(root);\n root.querySelector('[data-mf453-quick-content]').innerHTML=api.view(fixture);\n const cards=[...root.querySelectorAll('.mf456-cover-card')];\n const buttons=[...root.querySelectorAll('.mf456-cover-select')];\n const one=cards[0]?.getBoundingClientRect(),two=cards[1]?.getBoundingClientRect(),\n three=cards[2]?.getBoundingClientRect(),four=cards[3]?.getBoundingClientRect();\n const noOverlap=!!(one&&two&&three&&four&&\n (one.right<=two.left+1||two.right<=one.left+1||one.bottom<=two.top+1)&&\n three.top>=Math.max(one.bottom,two.bottom)-2&&\n (three.right<=four.left+1||four.right<=three.left+1||three.bottom<=four.top+1));\n const details=root.querySelector('.mf456-cover-gallery')?.innerText||'';\n const explicit=buttons.length===4&&buttons[1].getAttribute('aria-pressed')==='true';\n const pct=details.includes('94% match')&&details.includes('64% match');\n const idLabels=details.includes('Provider record ID')&&details.includes('ID saved as');\n const styling=getComputedStyle(cards[0]);\n const height=one?.height||0;\n root.remove();\n launch.stage('validating','Checking provider readiness…','cover');\n const bar=document.querySelector('#mf456-launch-status progress');\n const progress=bar?.value===1&&bar?.max===5;\n launch.stage('error','No titles in scope.','cover');\n const errorShown=document.querySelector('#mf456-launch-status')?.textContent.includes('No titles in scope.');\n App.mf456DismissLaunch();\n return {version:api.version,startup:launch.version,choices:cards.length,\n noOverlap,explicit,pct,idLabels,display:styling.display,height,progress,errorShown,\n noLauncher:!document.getElementById('mf456-launch-status-host'),\n overflow:document.documentElement.scrollWidth>innerWidth+6};\n }catch(e){return {error:String(e.stack||e)}}\n})()");
   console.log(d.label+' v456 cover choices + startup progress:',JSON.stringify(ui456));
   assert(!ui456.error&&ui456.version===456&&ui456.startup===456&&ui456.choices===4&&ui456.explicit&&ui456.pct&&ui456.idLabels,'v456 record ID, match score and explicit cover selection');
   assert(ui456.noOverlap&&ui456.height>220&&ui456.progress&&ui456.errorShown&&ui456.noLauncher&&!ui456.overflow,'v456 covers do not overlap and launch stages display accurate status on desktop/mobile');


   const fix457=await cdp.evaluate("(()=>{const api=window.MediaFlowV457,previous=App.mf455Launch,calls=[],checks=[];if(!api)return {error:'v457 missing'};try{App.mf455Launch=async kind=>{calls.push(kind);};for(const kind of ['cover','metadata','both']){api.open(kind);const root=document.getElementById('mf445-workspace');if(!root)throw Error('No workspace');const buttons=[...root.querySelectorAll('.mf445-actions button.btn-primary')];if(buttons.length!==1)throw Error(kind+' has '+buttons.length+' buttons');const b=buttons[0];if(b.disabled||b.hasAttribute('onclick'))throw Error(kind+' has inert or inline button');b.click();if(calls.at(-1)!==kind)throw Error(kind+' launch callback missing');const dialog=root.querySelector('.mf445-dialog'),pane=root.querySelector('[data-mf445-panel]');dialog.scrollTop=85;pane.scrollTop=45;const before=dialog.scrollTop,inside=pane.scrollTop;App.mf445Panel(kind);const scroll=dialog.scrollTop===before&&pane.scrollTop===inside;checks.push({kind,scroll});App.mf445Close();}return {version:api.version,calls,checks,success:checks.length===3&&checks.every(c=>c.scroll)};}catch(e){return {error:String(e.stack||e),calls,checks};}finally{App.mf455Launch=previous;App.mf445Close();App.mf456DismissLaunch();}})()");
   console.log(d.label+' v457 action/scroll smoke:',JSON.stringify(fix457));
   assert(!fix457.error&&fix457.version===457&&fix457.success&&fix457.calls.join(',')==='cover,metadata,both',
    'All three recovery actions must run exactly once; scroll must remain stable');


   const fixes458=await cdp.evaluate("(()=>{\n const api=window.MediaFlowV458;\n if(!api)return {error:'v458 missing'};\n let overlay=null,quick=null;\n try{\n   window.MediaFlowV457.open('both');\n   const work=document.getElementById('mf445-workspace');\n   if(!work)throw Error('Unified workspace missing');\n   api.confirm('Start Cover + Metadata Recovery?','250 titles in scope. This replaces an old unfinished queue.', 'Replace Queue & Start',false,250,'both');\n   overlay=document.getElementById('mf444-confirm');\n   if(!overlay)throw Error('Confirmation was not mounted');\n   const btn=overlay.querySelector('[data-mf444-approve]'),headline=overlay.querySelector('.mf444-heading small');\n   const z=Number(getComputedStyle(overlay).zIndex),workZ=Number(getComputedStyle(work).zIndex);\n   const style=getComputedStyle(btn);\n   const box=btn.getBoundingClientRect(),inside=box.left>=0&&box.right<=innerWidth&&box.top>=0&&box.bottom<=innerHeight;\n   const approveContrast=style.color!==style.backgroundColor&&style.opacity==='1'&&!btn.disabled;\n   btn.click();\n   const removed=!document.getElementById('mf444-confirm');\n   App.mf445Close();\n   const q={id:'fake-v458',kind:'both',stage:'scanning',closed:false,applying:false,\n    coverLoading:true,metaLoading:false,coverIndex:0,errors:[],pending:[],\n    covers:[{url:'https://example.com/selected.jpg',title:'Candidate',provider:'AniList',confidence:.91,idMatch:true}],\n    metadata:{preview:{results:1,proposals:[\n      {token:'summary',label:'Summary',selected:false,hasOriginal:false,protected:false,same:false,status:'ready',choice:0,\n       options:[{value:'Synopsis',sources:[{provider:'AniList'}]}]},\n      {token:'protected',label:'Protected',selected:false,hasOriginal:true,protected:true,same:false,status:'protected',choice:0,\n       options:[{value:'Keep',sources:[{provider:'Jikan'}]}]}\n    ]}}};\n   const host=document.createElement('div');host.id='mf453-title-quick';\n   host.className='mf424-modal mf425-themed mf453-quick-modal mf454-quick-modal';\n   host.innerHTML='<div class=\"mf424-shade\"></div><section class=\"mf424-dialog mf454-quick-dialog\"><div data-mf453-quick-content></div></section>';\n   document.body.append(host);quick=host;\n   host.querySelector('[data-mf453-quick-content]').innerHTML=api.quickHtml(q);\n   const toolbar=host.querySelector('.mf458-metadata-tools');\n   const all=toolbar?.querySelector('button[onclick*=\"true\"]');\n   const none=toolbar?.querySelector('button[onclick*=\"false\"]');\n   const save=host.querySelector('.mf454-footer-actions button.btn-primary');\n   const early=api.canConfirm(q)&&!!save&&!save.disabled&&q.coverLoading;\n   const eligible=api.eligible(q).length;\n   const dimensions={width:document.documentElement.scrollWidth,viewport:innerWidth};\n   host.remove();quick=null;\n   return {version:api.version,above:z>workZ&&z>2147483000,headline:headline?.textContent,approveContrast,\n    inside,removed,toolbar:!!toolbar,all:!!all,none:!!none,eligible,early,overflow:dimensions.width>dimensions.viewport+6};\n }catch(e){return {error:String(e.stack||e)}}\n finally{overlay?.querySelector('[data-mf444-dismiss]')?.click();quick?.remove();App.mf445Close();}\n})()");
   console.log(d.label+' v458 recovery dialog & early save:',JSON.stringify(fixes458));
   assert(!fixes458.error&&fixes458.version===458&&fixes458.above&&fixes458.approveContrast&&fixes458.inside&&fixes458.removed,
    'v458 confirmation must be above unified workspace with a visible, clickable action');
   assert(fixes458.headline==='COVER + METADATA RECOVERY'&&fixes458.toolbar&&fixes458.all&&fixes458.none&&fixes458.eligible===1&&fixes458.early&&!fixes458.overflow,
    'v458 quick metadata selection and early cover commit must be visible on desktop and 360px mobile');

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
