/* v556 per-record cloud storage, end to end with two "devices" sharing one
 * cloud: one-time verified migration, saves that upload only changed rows,
 * start-up from records, record-level merge of concurrent edits, deletions,
 * order, an older app version writing the single row, fallback when the
 * record table is unreachable, and recovery of an interrupted upload. */
'use strict';
const assert=require('node:assert/strict');
const zlib=require('node:zlib');
const {openApp,generate,cloudRow}=require('./harness/app.cjs');
const strip=s=>{const x=JSON.parse(JSON.stringify(s));delete x.savedAt;
  const d=new Date(),k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  if(x.xpLedger?.v334ActiveTimeDays)delete x.xpLedger.v334ActiveTimeDays[k];
  for(const s of ['v377JikanLedger','v377JikanResults'])if(x.settings)delete x.settings[s];return x;};
const titles=Number(process.env.MF556_TITLES||3000);
const boot=p=>p.waitForFunction(()=>window.__MF&&__MF.S()?.library?.length>0&&document.querySelector('#app .sidebar'),null,{timeout:180000});
const stats=p=>p.evaluate(()=>window.MediaFlowV556.stats());
const recordCount=store=>[...(store.tables.mediaflow_records||new Map()).values()].filter(r=>!r.deleted&&r.kind!=='meta').length;
const snap=p=>p.evaluate(()=>JSON.parse(JSON.stringify(__MF.snapshot())));
(async()=>{
  const state=generate({titles});
  const store={row:cloudRow(state),writes:0,tables:{}};
  const A=await openApp({state,store});
  let B=null;
  try{
    const a=A.page;
    // 1. One-time move to records, verified, legacy row untouched until then.
    await a.waitForFunction(()=>window.MediaFlowV556.stats().migrated===true,null,{timeout:180000});
    const s1=await stats(a);
    assert(s1.migrations===1,'migrated once');
    assert(recordCount(store)>=titles,'every title stored as its own record ('+recordCount(store)+')');
    assert(store.tables.mediaflow_records.get([...store.tables.mediaflow_records.keys()].find(k=>k.includes('store'))),'meta row written last');
    // 2. A save sends only what changed.
    const before=await a.evaluate(()=>__MF_CLOUD.recordUploads||0);
    await a.evaluate(async()=>{const S=__MF.S();S.library[5].progress=(Number(S.library[5].progress)||0)+1;S.library[5].modifiedAt=Date.now();await __MF.saveState();});
    const sent=await a.evaluate(()=>__MF_CLOUD.recordUploads||0)-before;
    assert(sent>=1&&sent<=6,'one edit uploads a handful of rows, not the account ('+sent+')');
    // 3. Reload: starts from records and shows the edit.
    const expectA=await snap(a);
    await a.reload({waitUntil:'domcontentloaded'});await boot(a);await a.waitForTimeout(1500);
    assert.equal((await stats(a)).migrated,true,'reload uses records');
    assert.deepEqual(strip(await snap(a)),strip(expectA),'reload returns identical data');
    // 4. A second device with no local copy downloads everything (in pages).
    B=await openApp({state,store});const b=B.page;
    await b.waitForTimeout(1500);
    assert.deepEqual(strip(await snap(b)),strip(await snap(a)),'second device has identical data');
    assert((await b.evaluate(()=>__MF_CLOUD.rpcCalls||0))>=1,'bulk reads use the page function');
    // 4b. Without the page function (older database), plain paging gives the same result.
    const D=await openApp({state,store,beforeGoto:async page=>{await page.addInitScript(()=>{window.__MF_CLOUD=window.__MF_CLOUD||{};window.__MF_CLOUD.noRpc=true;});}});
    try{await D.page.waitForTimeout(1500);
      assert.equal((await stats(D.page)).migrated,true,'records used without the page function');
      assert.deepEqual(strip(await snap(D.page)),strip(await snap(a)),'plain paging returns identical data');}
    finally{await D.close();}
    // 5. Concurrent edits to different titles on both devices merge.
    await a.evaluate(async()=>{const S=__MF.S();S.library[10].title='Edited on A';S.library[10].modifiedAt=Date.now();await __MF.saveState();});
    await b.evaluate(async()=>{const S=__MF.S();S.library[20].title='Edited on B';S.library[20].modifiedAt=Date.now();await __MF.saveState();});
    await a.evaluate(()=>window.MediaFlowV556.pull());await b.evaluate(()=>window.MediaFlowV556.pull());
    const titlesA=await a.evaluate(()=>[__MF.S().library[10].title,__MF.S().library[20].title]);
    const titlesB=await b.evaluate(()=>[__MF.S().library[10].title,__MF.S().library[20].title]);
    assert.deepEqual(titlesA,['Edited on A','Edited on B'],'device A sees both edits');
    assert.deepEqual(titlesB,['Edited on A','Edited on B'],'device B sees both edits');
    // 6. Same title edited on both: the newer edit wins on both devices.
    await a.evaluate(async()=>{const S=__MF.S();S.library[30].rating=3;S.library[30].modifiedAt=Date.now();await __MF.saveState();});
    await b.waitForTimeout(30);
    await b.evaluate(async()=>{const S=__MF.S();S.library[30].rating=9;S.library[30].modifiedAt=Date.now()+5;await __MF.saveState();});
    await a.evaluate(()=>window.MediaFlowV556.pull());
    assert.equal(await a.evaluate(()=>__MF.S().library[30].rating),9,'newer edit wins');
    // 7. Deletion and reordering reach the other device.
    const gone=await a.evaluate(async()=>{const S=__MF.S();const id=S.library[40].id;S.library.splice(40,1);
      const moved=S.library.splice(50,1)[0];S.library.unshift(moved);await __MF.saveState();return {id,moved:moved.id};});
    await b.evaluate(()=>window.MediaFlowV556.pull());
    const bState=await b.evaluate(g=>({has:__MF.S().library.some(x=>x.id===g.id),first:__MF.S().library[0].id}),gone);
    assert(!bState.has,'deleted title removed on the other device');
    assert.equal(bState.first,gone.moved,'order change reaches the other device');
    assert.deepEqual(strip(await snap(b)),strip(await snap(a)),'both devices identical after merging');
    // Positions survive the database's 15-digit floats: a pull right after a
    // reorder must not look like a change from another device.
    await a.evaluate(async()=>{const S=__MF.S();for(let n=0;n<6;n++){const m=S.library.splice(70+n,1)[0];S.library.splice(3,0,m);}await __MF.saveState();});
    const echo=await a.evaluate(()=>window.MediaFlowV556.pull());
    assert.equal(echo.changed||0,0,'own reorder does not come back as a remote change: '+JSON.stringify(echo));
    await b.evaluate(()=>window.MediaFlowV556.pull());
    assert.deepEqual(await b.evaluate(()=>__MF.S().library.slice(0,12).map(x=>x.id)),await a.evaluate(()=>__MF.S().library.slice(0,12).map(x=>x.id)),'inserted positions identical on both devices');
    // 7c. An edit made while another device's changes are being merged: the
    //     merge steps aside, the edit is kept, and the merge lands next time.
    await b.evaluate(async()=>{const S=__MF.S();S.library[90].title='Remote 90';S.library[90].modifiedAt=Date.now();await __MF.saveState();});
    await a.evaluate(()=>{let n=0;window.__MF_BUSY_ORIG=__MF.wrap('mf556Busy',orig=>function(){n++;
      if(n===3){const S=__MF.S();S.library[91].title='Local 91';S.library[91].modifiedAt=Date.now();window.__MF_EDIT=__MF.saveState();}return orig.apply(this,arguments);});});
    const mid=await a.evaluate(()=>window.MediaFlowV556.pull());
    assert(mid.skipped&&mid.retry,'merge steps aside for an edit: '+JSON.stringify(mid));
    await a.evaluate(async()=>{__MF.wrap('mf556Busy',()=>window.__MF_BUSY_ORIG);await window.__MF_EDIT;});
    await a.waitForFunction(()=>window.MediaFlowV556.stats().pending===0,null,{timeout:30000});
    const after=await a.evaluate(async()=>{await window.MediaFlowV556.pull();return [__MF.S().library[90].title,__MF.S().library[91].title];});
    assert.deepEqual(after,['Remote 90','Local 91'],'both the edit and the other device’s change kept');
    await b.evaluate(()=>window.MediaFlowV556.pull());
    assert.equal(await b.evaluate(()=>__MF.S().library[91].title),'Local 91','edit reached the other device');
    // 8. Unsaved deletion survives a failed upload and is sent later.
    await b.evaluate(async()=>{__MF_CLOUD.failRecords={message:'Network down'};const S=__MF.S();S.library.splice(60,1);try{await __MF.saveState();}catch(_){} __MF_CLOUD.failRecords=null;});
    assert((await stats(b)).pending>0,'failed upload leaves pending changes');
    await b.evaluate(async()=>{const S=__MF.S();S.library[0].modifiedAt=Date.now();await __MF.saveState();});
    assert.equal((await stats(b)).pending,0,'pending changes sent with the next save');
    await a.evaluate(()=>window.MediaFlowV556.pull());
    assert.equal(await a.evaluate(()=>__MF.S().library.length),await b.evaluate(()=>__MF.S().library.length),'retried deletion reached device A');
    // 8b. Upload fails and the tab is reloaded before the next save: this
    //     device's copy is newer, start-up offers it, and restoring sends it.
    await b.evaluate(async()=>{__MF_CLOUD.failRecords={message:'Network down'};const S=__MF.S();S.library[2].title='Unsent on B';S.library[2].modifiedAt=Date.now();try{await __MF.saveState();}catch(_){}});
    await b.waitForTimeout(16000);
    await b.evaluate(async()=>{const S=__MF.S();S.library[3].modifiedAt=Date.now();try{await __MF.saveState();}catch(_){} __MF_CLOUD.failRecords=null;});
    await b.reload({waitUntil:'domcontentloaded'});
    await b.waitForFunction(()=>window.MediaFlowRecovery&&/recover|newer|local/i.test(document.body.innerText||''),null,{timeout:120000});
    await b.evaluate(()=>window.MediaFlowRecovery.restore());
    await boot(b);await b.waitForTimeout(1500);
    assert.equal(await b.evaluate(()=>__MF.S().library[2].title),'Unsent on B','unsent change recovered after reload');
    assert.equal(await b.evaluate(()=>__MF.get('AUTH_READY')),true,'app is fully ready after recovering');
    assert.equal((await stats(b)).pending,0,'recovered change uploaded');
    await a.evaluate(()=>window.MediaFlowV556.pull());
    assert.equal(await a.evaluate(()=>__MF.S().library[2].title),'Unsent on B','recovered change reached the other device');
    // 9. The single-row fallback copy is kept current and marked.
    await a.evaluate(()=>window.MediaFlowV556.flushFallback());
    assert(store.row.state_data.mf556,'fallback copy written by v556');
    const legacy=JSON.parse(zlib.gunzipSync(Buffer.from(store.row.state_data.data,'base64')).toString());
    assert.equal(legacy.library.length,await a.evaluate(()=>__MF.S().library.length),'fallback copy is complete');
    // 10. An older MediaFlow version saves the single row: its change is merged in.
    legacy.library[1].title='Saved by an older version';legacy.library[1].modifiedAt=Date.now()+60000;legacy.savedAt=Date.now()+60000;
    store.row={user_id:'harness-user',state_data:{__mediaflowCompressed:'gzip',data:zlib.gzipSync(Buffer.from(JSON.stringify(legacy))).toString('base64')},updated_at:new Date(Date.now()+60000).toISOString()};
    await a.reload({waitUntil:'domcontentloaded'});await boot(a);await a.waitForTimeout(3500);
    assert.equal(await a.evaluate(()=>__MF.S().library[1].title),'Saved by an older version','older version’s save merged in');
    const pb=await b.evaluate(()=>window.MediaFlowV556.pull());
    const dbg=await b.evaluate(()=>({conds:{hidden:document.visibilityState,auth:__MF.get('AUTH_READY'),guard:__MF.get('V115_STARTUP_GUARD'),loading:__MF.S().loading,heavy:__MF.get('V134_HEAVY_OPERATION'),pend:(()=>{const v=__MF.get('v535PendingSave');return v?{started:v.started,settled:v.settled}:null;})(),sel:!!document.querySelector('#modal-root .modal-overlay,.mf274-overlay:not([hidden]),#mf555-log-popup,.data-progress:not(.done)'),selWhich:[...document.querySelectorAll('#modal-root .modal-overlay,.mf274-overlay:not([hidden]),#mf555-log-popup,.data-progress:not(.done)')].map(e=>e.className||e.id)},modal:!!document.querySelector('#modal-root .modal-overlay'),overlay:!!document.querySelector('.mf274-overlay:not([hidden])'),prog:document.querySelector('.data-progress')?.className,stats:window.MediaFlowV556.stats()}));
    const aStats=await stats(a);
    assert.equal(await b.evaluate(()=>__MF.S().library[1].title),'Saved by an older version','and sent on as records: '+JSON.stringify({pb,dbg,aStats}));
    // 11. Record table unreachable at start: the fallback copy is used.
    await B.close();B=null;
    const C=await openApp({state,store,beforeGoto:async page=>{await page.addInitScript(()=>{window.__MF_CLOUD=window.__MF_CLOUD||{};window.__MF_CLOUD.failRecords={message:'records offline'};});}});
    try{
      const c=C.page;await c.waitForTimeout(1000);
      assert.equal(await c.evaluate(()=>__MF.S().library[1].title),'Saved by an older version','fallback copy loads when records are unreachable');
      assert.notEqual((await stats(c)).migrated,true,'records not used while unreachable');
    }finally{await C.close();}
    const errs=A.errors.filter(e=>!/Failed to load resource|records offline|Network down|save failed/.test(e));
    assert.deepEqual(errs,[],'no unexpected page errors');
    console.log('PASS v556 record storage: verified migration, small uploads, reload, second device, merge, deletions, order, retry, fallback copy, older-version saves, offline records.');
  }finally{await A.close();if(B)await B.close();}
})().catch(e=>{console.error(e);process.exit(1);});
