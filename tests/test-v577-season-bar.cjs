/* v577, in the real app: with a season selected, logging shows the season's
 * own counter and bar (Progress reached and Advanced). */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate}=require('./harness/app.cjs');
(async()=>{
  const app=await openApp({state:generate({titles:20})});
  const p=app.page;
  try{
    await p.waitForTimeout(600);
    const r=await p.evaluate(()=>{
      const S=__MF.S(),get=__MF.get;
      const item=S.library.find(i=>i.status!=='completed');
      Object.assign(item,{progress:13,total:22,seasons:[{id:'s1',number:1,name:'Season 1',progress:10,total:10},{id:'s2',number:2,name:'Season 2',progress:3,total:12}]});
      const entry={libraryId:item.id,title:item.title,qty:2,v252UseSeasonView:true,v252SeasonId:'s2',v252SeasonEpisode:5,v179StartProgress:13,v179EndProgress:15};
      const quick=get('v252EntrySeasonControlsHtml')(item,entry,0,13);
      const adv=get('v394BulkPanel')({libraryId:item.id,v369SelectedSeasonId:'s2',v369Units:[{id:'u',number:4,seasonId:'s2'},{id:'v',number:5,seasonId:'s2'}],v394Method:'last'},0,item);
      return {quick,adv};
    });
    assert(r.quick.includes('mf577-season-bar')&&r.quick.includes('3 → 5 / 12'),r.quick.slice(-400));
    assert(r.adv.includes('mf577-season-bar')&&r.adv.includes('3 → 5 / 12'),r.adv.slice(0,400));
    console.log('PASS v577 season bar: quick and advanced');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
