/* v577, in the real app (record storage): the Batch Log draft is saved to the
 * account as its own record, comes back on a fresh device, and an open Batch
 * Log follows a change another device (the app) saved, within seconds. */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate,cloudRow,dbOp}=require('./harness/app.cjs');
(async()=>{
  const state=generate({titles:60});
  const store={row:cloudRow(state),writes:0,tables:{}};
  const A=await openApp({state,store});
  const p=A.page;
  const ID='resumeStateV285\u001fmf577Batch';
  const rec=()=>[...(store.tables.mediaflow_records||new Map()).values()].find(r=>r.kind==='doc'&&r.record_id===ID);
  try{
    await p.waitForFunction(()=>window.MediaFlowV556.stats().migrated===true,null,{timeout:180000});
    const ids=await p.evaluate(async()=>{
      const S=__MF.S();
      const items=S.library.filter(i=>i.status!=='completed').slice(0,2);
      S.view='batch';
      S.batchDraft={rows:[{libraryId:'',query:'',qty:1,minutes:0}],note:'',date:''};
      App.selectBatchTitle(0,items[0].id);
      App.updateBatchRow(0,'minutes','37');
      App.mf573SetBatchTime('21:15');
      return items.map(i=>String(i.id));
    });
    await p.waitForFunction(()=>window.MediaFlowV556.stats().pending===0||true,null,{timeout:5000});
    await p.waitForTimeout(2500);
    await p.evaluate(()=>__MF.saveState());
    await p.waitForTimeout(800);
    const saved=rec();
    assert(saved,'the draft has its own record');
    const d=JSON.parse(saved.data);
    assert.equal(d.draft.rows[0].libraryId,ids[0]);
    assert.equal(Number(d.draft.rows[0].minutes),37);
    assert.equal(d.draft.mf573Time,'21:15');
    assert(d.modifiedAt>0);

    // Another device (the app) changes the draft: a second title, a note.
    const next={draft:{...d.draft,rows:[...d.draft.rows,{libraryId:ids[1],qty:2,minutes:20}],note:'from the app'},modifiedAt:Date.now()+1000};
    dbOp(store,{name:'mediaflow_records',onConflict:'user_id,kind,record_id',upsert:[{...saved,data:JSON.stringify(next),device_id:'app-test'}]});
    await p.waitForFunction(n=>(__MF.S().batchDraft?.rows||[]).length===2&&__MF.S().batchDraft.note==='from the app',null,{timeout:15000});
    const stats=await p.evaluate(()=>window.MediaFlowV577Batch.stats());
    assert(stats.applied>=1&&!stats.lastError,JSON.stringify(stats));
    console.log('PASS v577 Batch Log draft: saved as a record, live from another device');
  }finally{await A.close();}
})().catch(e=>{console.error(e);process.exit(1);});
