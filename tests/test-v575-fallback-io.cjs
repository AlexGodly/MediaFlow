/* v575, in the real app: the full fallback copy isn't rewritten on every
 * save or every time the tab is hidden (Disk IO budget). */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate,cloudRow}=require('./harness/app.cjs');
(async()=>{
  const state=generate({titles:200});
  const store={row:cloudRow(state),writes:0,tables:{}};
  const A=await openApp({state,store});const p=A.page;
  try{
    await p.waitForFunction(()=>window.MediaFlowV556.stats().migrated===true,null,{timeout:180000});
    await p.evaluate(()=>window.MediaFlowV575.flush());
    const w0=await p.evaluate(()=>window.MediaFlowV556.stats().legacyWrites);
    // Several saves and a hidden tab right after: no new copy.
    for(let i=0;i<3;i++){
      await p.evaluate(async i=>{const S=__MF.S();S.library[i].rating=i+3;S.library[i].modifiedAt=Date.now();await __MF.saveState();},i);
    }
    await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
    await p.waitForTimeout(1500);
    const s=await p.evaluate(()=>({writes:window.MediaFlowV556.stats().legacyWrites,v575:window.MediaFlowV575.stats()}));
    assert.equal(s.writes,w0,'no new full copy within 10 minutes: '+JSON.stringify(s));
    assert(s.v575.skipped>=1,'the hidden-tab write was skipped');
    assert(await p.evaluate(()=>Number(localStorage.getItem('mediaflow-v575-legacy-at'))>0),'the time of the last copy is remembered');
    console.log('PASS v575 fallback copy throttled');
  }finally{await A.close();}
})().catch(e=>{console.error(e);process.exit(1);});
