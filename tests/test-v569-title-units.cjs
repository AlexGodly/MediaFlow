/* v569, in the real app (Chrome through the test harness): a title's own unit
 * and runtime in the log draft's minutes, Batch Log's default minutes and the
 * itemized log's unit name; titles without their own runtime are unchanged. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {openApp,generate}=require('./harness/app.cjs');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const version=Number(read('VERSION').trim());
assert(version>=569);
assert(JSON.parse(read('src/js/runtime-order.json')).includes('components/421-v569-title-units.js'));

(async()=>{
  const app=await openApp({state:generate({titles:40})});
  const p=app.page;
  try{
    await p.waitForTimeout(600);
    const r=await p.evaluate(()=>{
      const S=__MF.S(),get=__MF.get;
      const items=S.library.filter(i=>i.status!=='completed'&&i.status!=='dropped');
      const own=items[0],plain=items.find(i=>i!==own&&i.categoryId===own.categoryId)||items[1];
      own.mf565Unit='matches';own.mf565SecondsPerUnit=1200;
      delete plain.mf565Unit;delete plain.mf565SecondsPerUnit;
      const cat=get('getCategory')(own.categoryId),plainCat=get('getCategory')(plain.categoryId);
      App.startSession?.();if(!S.currentTask)S.currentTask=get('generateTask')();
      App.openLogForm();
      const d=S.logDraft;
      d.entries=[{libraryId:own.id,title:own.title,qty:3},{libraryId:plain.id,title:plain.title,qty:2}];
      get('v179SyncSingleFromEntries')();
      const draftMinutes=d.minutes;
      const expected=60+Math.round(2*(Number(plainCat.minutesPerUnit)||0));
      const nounOwn=get('v369UnitType')(own),nounPlain=get('v369UnitType')(plain);
      // Batch Log, progress mode.
      S.batchDraft={rows:[{libraryId:own.id,qty:0,minutes:0},{libraryId:plain.id,qty:0,minutes:0}],v179Mode:'progress'};
      get('v179UpdateBatchProgress')(0,Number(own.progress||0)+2);
      get('v179UpdateBatchProgress')(1,Number(plain.progress||0)+2);
      return {draftMinutes,expected,nounOwn,nounPlain,catUnit:String(cat.unit||''),
        batch:S.batchDraft.rows.map(r=>[r.qty,r.minutes]),plainMpu:Number(plainCat.minutesPerUnit)||0,
        ownTotal:Number(own.total)||0,ownProgress:Number(own.progress)||0};
    });
    assert.equal(r.draftMinutes,r.expected,'3 matches of 20 min = 60 min, plus the plain title at its category runtime');
    assert.equal(r.nounOwn,'Match','the itemized log names the title\'s own unit');
    assert.notEqual(r.nounPlain,'Match');
    const [ownRow,plainRow]=r.batch;
    assert.equal(ownRow[1],Math.round(ownRow[0]*20),'Batch Log: the title\'s own runtime');
    assert.equal(plainRow[1],Math.round(plainRow[0]*r.plainMpu),'Batch Log: unchanged for other titles');
    console.log('v569 title units passed');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
