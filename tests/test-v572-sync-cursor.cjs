/* v572, in the real app (Chrome through the test harness, record storage):
 *  1. A change saved by another device (the app) before this tab's own save
 *     still arrives at the next pull (a save no longer moves the cursor).
 *  2. A change this tab already skipped under the old rule arrives after a
 *     reload: the one-time catch-up reads every row again, and keeps an
 *     unsent local change. */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate,cloudRow,dbOp}=require('./harness/app.cjs');

(async()=>{
  const state=generate({titles:300});
  const store={row:cloudRow(state),writes:0,tables:{}};
  const A=await openApp({state,store});
  const p=A.page;
  const recs=()=>store.tables.mediaflow_records;
  const findRec=id=>[...recs().values()].find(r=>r.kind==='library'&&r.record_id===id);
  // Another device writes a title record (as the app does), at server time.
  const otherDevice=(id,patch)=>{const r=findRec(id);const data=JSON.stringify({...JSON.parse(r.data),...patch});
    dbOp(store,{name:'mediaflow_records',onConflict:'user_id,kind,record_id',upsert:[{...r,data,device_id:'app-test'}]});return findRec(id);};
  try{
    await p.waitForFunction(()=>window.MediaFlowV556.stats().migrated===true,null,{timeout:180000});
    await p.evaluate(()=>window.MediaFlowV556.pull());
    const ids=await p.evaluate(()=>__MF.S().library.slice(0,3).map(i=>String(i.id)));

    // 1. The app saves a cover; this tab saves something else 4 s later, then pulls.
    otherDevice(ids[0],{coverUrl:'https://example.invalid/app-cover.jpg',modifiedAt:Date.now()});
    await p.waitForTimeout(4000);
    await p.evaluate(async()=>{const S=__MF.S();S.library[2].rating=7;S.library[2].modifiedAt=Date.now();await __MF.saveState();});
    await p.evaluate(()=>window.MediaFlowV556.pull());
    const cover1=await p.evaluate(id=>__MF.S().library.find(i=>String(i.id)===id).coverUrl,ids[0]);
    assert.equal(cover1,'https://example.invalid/app-cover.jpg','the app\'s change arrives after this tab saved');
    assert(await p.evaluate(()=>window.MediaFlowV572.stats().restored>0),'the save kept the cursor');

    // 1b. Live: another device's change appears on its own within seconds (no manual pull).
    otherDevice(ids[2],{title:'Live from the app',modifiedAt:Date.now()});
    await p.waitForFunction(id=>__MF.S().library.find(i=>String(i.id)===id).title==='Live from the app',ids[2],{timeout:15000});
    const live=await p.evaluate(()=>window.MediaFlowV572.stats().live);
    assert(live.hits>=1&&!live.lastError,'found by the live probe: '+JSON.stringify(live));
    // Own saves are not "another device".
    const hits0=live.hits;
    await p.evaluate(async()=>{const S=__MF.S();S.library[2].rating=8;S.library[2].modifiedAt=Date.now();await __MF.saveState();});
    await p.waitForTimeout(6500);
    assert.equal(await p.evaluate(()=>window.MediaFlowV572.stats().live.hits),hits0,'own saves never trigger a pull');

    // 2. A change written under the old rule and skipped: its time is before this tab's cursor.
    const cursor=await p.evaluate(()=>window.MediaFlowV556.stats().cursor);
    const r=otherDevice(ids[1],{title:'Renamed in the app',modifiedAt:Date.now()});
    r.updated_at='2026-11-02T00:00:00.000001+00:00';
    assert(r.updated_at<cursor);
    await p.evaluate(()=>{try{localStorage.removeItem('mediaflow-v572-catchup');}catch(_){}});
    await p.reload({waitUntil:'domcontentloaded'});
    await p.waitForFunction(()=>window.__MF&&__MF.S()&&__MF.S().library&&__MF.S().library.length>0&&window.MediaFlowV556.stats().migrated===true,null,{timeout:120000});
    await p.waitForTimeout(800);
    const title=await p.evaluate(id=>__MF.S().library.find(i=>String(i.id)===id).title,ids[1]);
    assert.equal(title,'Renamed in the app','the skipped change arrives after the catch-up');
    assert(await p.evaluate(()=>(localStorage.getItem('mediaflow-v572-catchup')||'').length>0),'catch-up recorded');
    assert(!(await p.evaluate(()=>window.MediaFlowV556.stats().cursor.startsWith('1970'))),'cursor is current again');
    console.log('PASS v572 sync: other devices\' changes arrive live and after a save; one-time catch-up');
  }finally{await A.close();}
})().catch(e=>{console.error(e);process.exit(1);});
