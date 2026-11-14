/* v577, in the real app: XP History has a row for every title added and
 * completed, and the list adds up to the account's XP. */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate}=require('./harness/app.cjs');
(async()=>{
  const app=await openApp({state:generate({titles:150})});
  const p=app.page;
  try{
    await p.waitForTimeout(800);
    const r=await p.evaluate(()=>{
      const S=__MF.S(),get=__MF.get;
      const rows=get('v348HistoryEntries')();
      const by={};for(const x of rows)by[x.kind]=(by[x.kind]||0)+x.xp;
      const done=S.library.filter(i=>get('v120IsCompleted')(i)).length;
      const html=get('v348XpHistoryHtml')();
      return {sum:rows.reduce((n,x)=>n+x.xp,0),total:get('mediaFlowXP')(),by,titles:S.library.length,done,
        l:get('levelingSettings')(),dated:rows.filter(x=>x.kind==='libraryAddition'&&x.timestamp>0).length,
        html:html.includes('Library · added title')&&html.includes('Title completed')};
    });
    assert.equal(r.sum,r.total,'XP History sums to total XP');
    assert.equal(r.by.libraryAddition,r.titles*r.l.libraryAdditionXP);
    assert.equal(r.by.titleCompletion,r.done*r.l.completionXP);
    assert(r.dated>0,'added rows carry the day the title was added');
    assert(r.html,'the new sources show in XP History');
    console.log('PASS v577 XP History: added and completed titles, sums to total XP');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
