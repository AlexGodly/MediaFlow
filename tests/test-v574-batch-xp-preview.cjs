/* v574, in the real app: Batch Log's XP preview is exactly what saving earns. */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate}=require('./harness/app.cjs');
const state=generate({titles:60});
const CASES=[
  {name:'one title',rows:[{pick:'open',qty:2,minutes:40}]},
  {name:'completes the title',rows:[{pick:'nearEnd',qty:2,minutes:40}]},
  {name:'two titles, two categories',rows:[{pick:'open',qty:1,minutes:20},{pick:'otherCat',qty:3,minutes:60}]},
  {name:'a past day',rows:[{pick:'open',qty:2,minutes:30}],date:-3,time:'09:30'},
  {name:'a rewatch',rows:[{pick:'completed',qty:1,minutes:24}]},
];
(async()=>{
  const results=[];
  for(const c of CASES){
    const A=await openApp({state:JSON.parse(JSON.stringify(state))});const p=A.page;
    try{
      await p.waitForTimeout(600);
      const r=await p.evaluate(async c=>{
        const S=__MF.S(),get=__MF.get,M=()=>get('v150ComputeStateMetrics')(S).totalXP;
        const open=S.library.filter(i=>i.status!=='completed'&&i.status!=='dropped'&&Number(i.total)>6&&Number(i.progress)+4<Number(i.total));
        const used=new Set();
        const pick=kind=>{
          let it;
          if(kind==='open')it=open.find(i=>!used.has(i.id));
          if(kind==='otherCat')it=open.find(i=>!used.has(i.id)&&![...used].some(u=>S.library.find(x=>x.id===u).categoryId===i.categoryId));
          if(kind==='nearEnd'){it=open.find(i=>!used.has(i.id));it.progress=Number(it.total)-2;}
          if(kind==='completed'){it=S.library.find(i=>i.status==='completed')||open[0];if(it.status!=='completed'){it.progress=Number(it.total);it.status='completed';}}
          used.add(it.id);return it;
        };
        App.mf565OpenBatch();
        S.batchDraft.v179Mode='amount';
        S.batchDraft.rows=c.rows.map(r=>{const it=pick(r.pick);return {query:it.title,libraryId:it.id,qty:r.qty,minutes:r.minutes};});
        if(c.date){const d=new Date(Date.now()+c.date*86400000);S.batchDraft.date=d.toISOString().slice(0,10);S.batchDraft.v331DateOverride=true;}
        if(c.time)App.mf573SetBatchTime(c.time);
        const sessionsBefore=S.sessions.length,libBefore=JSON.stringify(S.library);
        const preview=MediaFlowV574.project();
        const untouched=S.sessions.length===sessionsBefore&&JSON.stringify(S.library)===libBefore;
        // The line on screen.
        App.mf565CloseBatch();App.mf565OpenBatch();await new Promise(r=>setTimeout(r,400));
        const shown=document.getElementById('mf574-batch-xp')?.textContent||'';
        const before=M();
        await App.submitBatchLog();
        await new Promise(r=>setTimeout(r,600));
        return {preview,untouched,shown,actual:M()-before};
      },c);
      results.push([c.name,r.preview&&r.preview.xp,r.actual,r.preview&&r.preview.parts]);
      assert(r.untouched,c.name+': the preview changes nothing');
      assert(r.shown.includes('+'+Math.round(r.preview.xp).toLocaleString()+' XP'),c.name+': shown above the buttons: '+r.shown);
      assert.equal(r.preview.xp,r.actual,c.name+': preview = award '+JSON.stringify(r.preview.parts));
    }finally{await A.close();}
  }
  console.log(results.map(r=>r.join(' | ')).join('\n'));
  console.log('PASS v574 Batch Log XP preview');
})().catch(e=>{console.error(e);process.exit(1);});
