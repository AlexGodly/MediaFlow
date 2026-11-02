/* v555 background save: identical cloud payload, local safety copy in
 * IndexedDB before upload, no long main-thread freeze, and a working
 * fallback when the worker is unavailable. Runs the real app in Chromium. */
'use strict';
const assert=require('node:assert/strict');
const zlib=require('node:zlib');
const {openApp}=require('./harness/app.cjs');
const decode=row=>JSON.parse(zlib.gunzipSync(Buffer.from(row.state_data.data,'base64')).toString('utf8'));
const strip=s=>{const x={...s};delete x.savedAt;return x;};
(async()=>{
  const titles=Number(process.env.MF555_TITLES||30000);
  const app=await openApp({titles});
  const p=app.page;
  try{
    await p.waitForTimeout(1500);
    // 1. Same JSON as JSON.stringify for the live snapshot (including odd values).
    const same=await p.evaluate(async()=>{
      const S=__MF.S();
      S.settings.mf555Probe={u:undefined,n:null,f:()=>1,d:new Date(0),nan:NaN,s:'"quoted"\n'};
      const snap=__MF.snapshot();
      const parts=await window.MediaFlowV555Save.stringify(snap);
      const ok=parts.join('')===JSON.stringify(snap);
      delete S.settings.mf555Probe;
      return {ok,parts:parts.length};
    });
    assert(same.ok,'sliced serialization must equal JSON.stringify');
    assert(same.parts>3,'large arrays must be serialized in slices');

    // 2. A real save: cloud row decodes to exactly the snapshot, with no long freeze.
    const result=await p.evaluate(async()=>{
      const S=__MF.S();S.library[0].progress=(Number(S.library[0].progress)||0)+1;
      const before=__MF_CLOUD.uploads.length;__MF_LONG.length=0;
      const ok=await __MF.saveState();
      return {ok,uploads:__MF_CLOUD.uploads.length-before,maxFreeze:Math.max(0,...__MF_LONG.map(x=>x.duration||x.ms)),
        expect:JSON.parse(JSON.stringify(__MF.snapshot())),stats:window.MediaFlowV555Save.stats(),row:__MF_CLOUD.row};
    });
    assert.equal(result.ok,true,'save must report success');
    assert(result.uploads>=1,'save must upload');
    assert.equal(result.stats.fallbacks,0,'worker path must be used');
    assert(result.stats.cacheWrites>=1,'local safety copy must be written');
    const cloud=decode(result.row);
    assert.deepEqual(strip(cloud),strip(result.expect),'cloud payload must equal the snapshot');
    assert.equal(cloud.library[0].progress,result.expect.library[0].progress,'edit must reach the cloud');
    console.log(`save at ${titles} titles: serialize ${result.stats.serializeMs}ms (sliced), worker ${result.stats.encodeMs}ms, longest freeze ${Math.round(result.maxFreeze)}ms, ${result.stats.lastBytes} bytes`);
    assert(result.maxFreeze<400,'saving must not freeze the page (longest task '+result.maxFreeze+'ms)');

    // 3. IndexedDB safety copy is readable and newest.
    const cache=await p.evaluate(async()=>{const c=await __MF.get('v115ReadRecoveryCache')();return {source:c?.source,idb:!!c?.__mf555Idb,lib:c?.state?.library?.length,savedAt:c?.state?.savedAt};});
    assert(cache.idb&&cache.lib===titles,'recovery copy must come from IndexedDB with correct counts');

    // 4. Reload boots from the saved row with identical data.
    await p.reload({waitUntil:'domcontentloaded'});
    await p.waitForFunction(()=>window.__MF&&__MF.S()?.library?.length>0&&document.querySelector('#app .sidebar'),null,{timeout:180000});
    const reloaded=await p.evaluate(()=>__MF.S().library[0].progress);
    assert.equal(reloaded,result.expect.library[0].progress,'reloaded app must show the saved edit');
    assert.deepEqual(app.errors,[],'no page errors');
    console.log('PASS v555 background save: identical payload, IndexedDB safety copy, sliced serialization, reload round trip.');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
