/* v573, in the real app: Batch Log saves at the chosen date and time. */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate}=require('./harness/app.cjs');
(async()=>{
  const app=await openApp({state:generate({titles:30})});const p=app.page;
  try{
    await p.waitForTimeout(600);
    const r=await p.evaluate(async()=>{
      const S=__MF.S();
      const item=S.library.find(i=>i.status!=='completed'&&i.status!=='dropped'&&!(Number(i.total)>0&&Number(i.progress)>=Number(i.total)));
      App.mf565OpenBatch();
      await new Promise(r=>setTimeout(r,300));
      const field=!!document.querySelector('.mf573-when input[type="date"]')&&!!document.querySelector('.mf573-batch-time');
      S.batchDraft.v179Mode='amount';
      S.batchDraft.rows=[{query:item.title,libraryId:item.id,qty:1,minutes:20}];
      S.batchDraft.date='2026-11-10';S.batchDraft.v331DateOverride=true;
      App.mf573SetBatchTime('08:15');
      const before=S.sessions.length;
      await App.submitBatchLog();
      await new Promise(r=>setTimeout(r,300));
      const added=S.sessions.slice(before).filter(s=>s.source==='batch');
      return {field,n:added.length,ts:added.map(s=>s.timestamp),logged:added.map(s=>s.titles[0].loggedAt),dates:added.map(s=>s.date),
        expect:new Date(2026,10,10,8,15).getTime(),future:MediaFlowV573.time(new Date().toISOString().slice(0,10),'23:59')<=Date.now(),
        none:MediaFlowV573.time('2026-11-10','')};
    });
    assert(r.field,'date and time fields side by side');
    assert(r.n>=1,'the batch was saved');
    assert(r.ts.every(t=>t===r.expect),'sessions at the chosen time: '+JSON.stringify(r));
    assert(r.logged.every(t=>t===r.expect),'titles at the chosen time');
    assert(r.dates.every(d=>d==='2026-11-10'));
    assert(r.future,'never later than now');assert.equal(r.none,0,'no time: the old rule');
    console.log('PASS v573 batch time');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
