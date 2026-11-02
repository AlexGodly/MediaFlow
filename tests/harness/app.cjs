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
      if(url==='/__harness/db'){
        let body='';req.setEncoding('utf8');req.on('data',c=>body+=c);
        req.on('end',()=>{const out=dbOp(store,JSON.parse(body));res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(out));});return;
      }
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
// Minimal PostgREST emulation for the record table.
let DB_CLOCK=Date.parse('2026-11-02T00:00:00Z')*1000;
// Server time follows the real clock (microseconds, strictly increasing).
function dbStamp(){DB_CLOCK=Math.max(DB_CLOCK+1+Math.floor(Math.random()*3),Date.now()*1000);const ms=Math.floor(DB_CLOCK/1000),us=String(DB_CLOCK%1000000).padStart(6,'0');
  return new Date(ms).toISOString().slice(0,19)+'.'+us+'+00:00';}
function dbOp(store,st){
  const t=store.tables[st.name]||(store.tables[st.name]=new Map());
  if(st.rpcPage){
    // mediaflow_records_page(): rows after (at, kind, id) in that order, up to 10,000.
    const {p_after_at:at,p_after_kind:kind='',p_after_id:id='',p_limit:lim=10000}=st.rpcPage;
    const cmp=(a,b)=>a<b?-1:a>b?1:0;
    let rows=[...t.values()];
    if(at)rows=rows.filter(r=>(cmp(r.updated_at,at)||cmp(r.kind,kind)||cmp(r.record_id,id))>0);
    rows.sort((a,b)=>cmp(a.updated_at,b.updated_at)||cmp(a.kind,b.kind)||cmp(a.record_id,b.record_id));
    rows=rows.slice(0,Math.min(Math.max(1,lim),10000));
    return {data:rows.map(r=>pick(r,'kind,record_id,pos,data,deleted,device_id,updated_at')),error:null};
  }
  if(st.upsert){
    const keys=(st.onConflict||'id').split(',');const out=[];
    for(const row of st.upsert)for(const v of Object.values(row))if(typeof v==='string'&&v.includes('\u0000'))return {data:null,error:{code:'22P05',message:'unsupported Unicode escape sequence (NUL in text)'}};
    for(const row of st.upsert){const k=keys.map(c=>row[c]).join('\u0001');const rec={...(t.get(k)||{}),...row,updated_at:dbStamp()};t.set(k,rec);out.push(rec);store.writes++;}
    return {data:st.returning?out.map(r=>pick(r,st.cols)):null,error:null};
  }
  let rows=[...t.values()].filter(r=>st.filters.every(([op,c,v])=>op==='eq'?String(r[c])===String(v):op==='gt'?r[c]>v:op==='gte'?r[c]>=v:true));
  rows.sort((a,b)=>{for(const [c,asc] of st.order){if(a[c]<b[c])return asc?-1:1;if(a[c]>b[c])return asc?1:-1;}return 0;});
  if(st.range)rows=rows.slice(st.range[0],st.range[1]+1);
  return {data:rows.map(r=>pick(r,st.cols)),error:null};
}
// Postgres returns double precision with 15 significant digits.
const pg15=v=>typeof v==='number'&&Number.isFinite(v)?Number(v.toPrecision(15)):v;
function pick(r,cols){const src={...r,pos:pg15(r.pos)};if(!cols||cols==='*')return src;const o={};for(const c of cols.split(',').map(x=>x.trim()))o[c]=src[c];return o;}
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
  const store=opts.store||{row:cloudRow(state),writes:0,tables:{}};
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
  await page.addInitScript(([delay])=>{window.__MF_CLOUD=Object.assign({row:null,uploads:[],reads:0,delayMs:delay},window.__MF_CLOUD||{});
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
module.exports={openApp,generate,cloudRow,ROOT,dbOp};
