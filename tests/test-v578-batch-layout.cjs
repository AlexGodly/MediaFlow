/* v578, in the real app: Batch Log rows in "Log any title" keep their layout
 * with real covers, for a normal and a by-parts title, at desktop and phone
 * widths (the cover was drawn at full size and the details squeezed into a
 * one-letter column). */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate}=require('./harness/app.cjs');
(async()=>{
  for(const W of [1280,390]){
    const app=await openApp({state:generate({titles:30})});
    const p=app.page;
    try{
      await p.setViewportSize({width:W,height:900});await p.waitForTimeout(700);
      const r=await p.evaluate(()=>{
        const S=__MF.S();const [a,b]=S.library.filter(x=>x.status!=='completed');
        const cov='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="300" height="450" fill="#c33"/></svg>');
        a.coverUrl=cov;b.coverUrl=cov;
        Object.assign(a,{mf577LogMode:'parts',seasons:[{id:'c',name:'Career',progress:3,mf577Kind:'Mode'},{id:'l',name:'Live',progress:0,total:10,mf577Kind:'Mode'}]});
        S.batchDraft={rows:[{libraryId:'',qty:1,minutes:0},{libraryId:'',qty:1,minutes:0}],note:'',date:'',v179Mode:'progress'};
        App.mf565OpenBatch();App.selectBatchTitle(0,a.id);App.mf577BatchToggle(0,'l');App.selectBatchTitle(1,b.id);
        return [...document.querySelectorAll('#mf565-batch .batch-log-row')].map(row=>{
          const st=row.querySelector('.batch-selected-title'),cover=st.firstElementChild.getBoundingClientRect(),b=st.querySelector('b').getBoundingClientRect();
          const parts=row.querySelector(':scope>.mf577-parts');
          return {cover:[Math.round(cover.width),Math.round(cover.height)],titleW:Math.round(b.width),
            parts:parts?Math.round(parts.getBoundingClientRect().width):0,row:Math.round(row.getBoundingClientRect().width)};
        });
      });
      for(const x of r){
        assert(x.cover[0]<=60&&x.cover[1]<=80,W+': cover stays small '+JSON.stringify(x));
        assert(x.titleW>=120,W+': title readable '+JSON.stringify(x));
      }
      assert(r[0].parts>=r[0].row*0.8,W+': parts take the full width '+JSON.stringify(r[0]));
    }finally{await app.close();}
  }
  console.log('PASS v578 Batch Log layout: covers, details and parts at 1280 and 390');
})().catch(e=>{console.error(e);process.exit(1);});
