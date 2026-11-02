/* MediaFlow test harness: boot the real built app in Chromium, signed in to an
 * in-browser Supabase double, with a generated account. Offline: CDN scripts
 * are replaced by local stand-ins and fonts/images outside the repo are blocked.
 *
 *   const {openApp}=require('./app.cjs');
 *   const app=await openApp({titles:100000});
 *   await app.page.evaluate(()=>__MF.S().library.length);
 *   await app.close();
 */
'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const {chromium}=require('playwright');
const {generate}=require('./generate-account.cjs');
const ROOT=process.env.MF_ROOT||path.resolve(__dirname,'..','..');
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.webmanifest':'application/manifest+json'};

function serve(store){
  return new Promise(resolve=>{
    const server=http.createServer((req,res)=>{
      const url=decodeURIComponent(req.url.split('?')[0]);
      if(url==='/__harness/cloud'){
        if(req.method==='POST'){let body='';req.setEncoding('utf8');req.on('data',c=>body+=c);
          req.on('end',()=>{store.row=JSON.parse(body);store.writes++;res.writeHead(204);res.end();});return;}
        if(!store.row){res.writeHead(404);res.end();return;}
        res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(store.row));return;
      }
      let file=path.join(ROOT,url==='/'?'index.html':url);
      if(!file.startsWith(ROOT)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return;}
      res.writeHead(200,{'Content-Type':TYPES[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0,'127.0.0.1',()=>resolve(server));
  });
}
function bundleName(){
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  return html.match(/assets\/js\/(mediaflow-v\d+\.bundle\.js)/)[1];
}
// Expose internals only to the test page.
function instrumented(){
  let js=fs.readFileSync(path.join(ROOT,'assets/js',bundleName()),'utf8').trimEnd();
  if(!js.endsWith('})();'))throw Error('Unexpected bundle ending');
  return js.slice(0,-5)+`
window.__MF={S:()=>S,App,snapshot:()=>snapshot(),saveState:(...a)=>saveState(...a),
  get:(name)=>{try{return eval(name);}catch(e){return undefined;}},
  run:(code)=>eval(code),
  // Replace a top-level binding with make(original) inside the app scope.
  wrap:(name,make)=>{const orig=eval(name);window.__MF_WRAP_FN=make(orig);eval(name+'=window.__MF_WRAP_FN');return orig;}};
})();`;
}
function cloudRow(state){
  const json=JSON.stringify(state);
  const data=zlib.gzipSync(Buffer.from(json)).toString('base64');
  return {user_id:'harness-user',state_data:{__mediaflowCompressed:'gzip',data},updated_at:new Date().toISOString()};
}
async function openApp(opts={}){
  const state=opts.state||generate({titles:opts.titles??500,...(opts.gen||{})});
  const store={row:cloudRow(state),writes:0};
  const server=await serve(store);
  const base='http://127.0.0.1:'+server.address().port+'/';
  const browser=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--js-flags=--max-old-space-size=4096']});
  const context=await browser.newContext({viewport:opts.viewport||{width:1440,height:900},serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.stack||e)));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
  const bundle=instrumented();
  const harness=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
  await context.route('**/*',async route=>{
    const url=route.request().url();
    if(url.includes('@supabase/supabase-js'))return route.fulfill({contentType:'text/javascript',body:harness('fake-supabase.js')});
    if(/react(-dom)?@18/.test(url))return route.fulfill({contentType:'text/javascript',body:/react-dom/.test(url)?'':harness('react-shim.js')});
    if(url.endsWith('/'+bundleName()))return route.fulfill({contentType:'text/javascript',body:bundle});
    if(url.startsWith(base))return route.continue();
    if(url.includes('/functions/v1/mediaflow-api-gateway')&&opts.gateway){
      const body=JSON.parse(route.request().postData()||'{}');
      const reply=await opts.gateway(body);
      return route.fulfill({status:reply.status||200,contentType:'application/json',body:JSON.stringify(reply.body??reply)});
    }
    if(opts.network){const reply=await opts.network(url,route.request());if(reply)return route.fulfill(reply);}
    return route.fulfill({status:204,body:''});
  });
  await page.addInitScript(([delay])=>{window.__MF_CLOUD={row:null,uploads:[],reads:0,delayMs:delay};
    try{localStorage.setItem('mediaflow-harness','1');}catch(_){}
    // Record long main-thread tasks for freeze budgets.
    window.__MF_LONG=[];
    try{new PerformanceObserver(list=>{for(const e of list.getEntries())window.__MF_LONG.push({start:e.startTime,ms:e.duration,duration:e.duration});}).observe({type:'longtask',buffered:true});}catch(_){}
  },[opts.cloudDelayMs||0]);
  if(opts.beforeGoto)await opts.beforeGoto(page);
  const t0=Date.now();
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__MF&&__MF.S()&&Array.isArray(__MF.S().library)&&__MF.S().library.length>0&&document.querySelector('#app .sidebar'),null,{timeout:opts.bootTimeout||180000});
  const bootMs=Date.now()-t0;
  return {page,context,browser,base,errors,bootMs,state,store,
    async close(){await browser.close();server.close();}};
}
module.exports={openApp,generate,cloudRow,ROOT};
