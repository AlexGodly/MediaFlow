/* v579, in the real app: Edit title's "How this title is logged" spans the
 * form, right above the seasons / parts editor (it was squeezed into one
 * narrow cell at the top). */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate}=require('./harness/app.cjs');
(async()=>{
  for(const W of [1784,390]){
    const app=await openApp({state:generate({titles:10})});const p=app.page;
    try{
      await p.setViewportSize({width:W,height:900});await p.waitForTimeout(700);
      const r=await p.evaluate(()=>{const S=__MF.S();App.openLibraryModal(S.library[0].id);
        const m=document.querySelector('[data-mf577-mode]'),se=document.querySelector('[data-v252-seasons-editor]');
        const a=m.getBoundingClientRect(),b=se.getBoundingClientRect();
        return {w:a.width,sw:b.width,above:a.bottom<=b.top+1,gap:b.top-a.bottom};});
      assert(Math.abs(r.w-r.sw)<2,W+': as wide as the seasons editor '+JSON.stringify(r));
      assert(r.above&&r.gap<40,W+': right above it '+JSON.stringify(r));
    }finally{await app.close();}
  }
  console.log('PASS v579 Edit title: logging mode spans the form above the seasons editor');
})().catch(e=>{console.error(e);process.exit(1);});
