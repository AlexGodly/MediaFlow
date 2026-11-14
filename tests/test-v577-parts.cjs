/* v577, in the real app: titles logged by parts. Quick logging moves only the
 * chosen parts (several at once), minutes and the category amount use each
 * part's time, History records the parts, the title has no total, Batch Log
 * does the same, Advanced units take their part's time, and Normal titles
 * with seasons still fill in order. */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate}=require('./harness/app.cjs');

(async()=>{
  const app=await openApp({state:generate({titles:40})});
  const p=app.page;p.on('dialog',d=>d.accept());
  try{
    await p.waitForTimeout(600);
    const r=await p.evaluate(()=>{
      const S=__MF.S(),get=__MF.get;
      const item=S.library.find(i=>i.status!=='completed'&&i.status!=='dropped');
      const cat=get('getCategory')(item.categoryId);
      Object.assign(item,{status:'active',mf577LogMode:'parts',mf565Unit:'sessions',mf565SecondsPerUnit:1800,progress:45,total:999,seasons:[
        {id:'pc',name:'Competitive',number:null,progress:41,total:null,mf577Kind:'Mode',mf577Unit:'matches',mf577SecondsPerUnit:2400},
        {id:'pu',name:'Unrated',number:null,progress:4,total:10,mf577Kind:'Mode'},
        {id:'pd',name:'Deathmatch',number:null,progress:0,total:null,mf577Kind:'Mode',mf577SecondsPerUnit:600},
      ]});
      get('v252SyncTitleFromSeasons')(item);
      const synced={progress:item.progress,total:item.total,kept:item.seasons[0].mf577Unit};
      App.startSession?.();if(!S.currentTask)S.currentTask=get('generateTask')();
      S.currentTask.categoryId=item.categoryId;
      App.openLogForm();
      S.logging=true;S.logDraft.v369Interface='quick';S.logDraft.v179Mode='progress';
      S.logDraft.entries=[{libraryId:item.id,title:item.title,qty:0,mf577Parts:[{id:'pc',qty:1}]}];
      App.mf577SetPart(0,'pc',44);      // Competitive reached 44 (+3)
      App.mf577TogglePart(0,'pu');      // + Unrated (+1)
      App.mf577SetPart(0,'pu',6);       // Unrated reached 6 (+2)
      const e=S.logDraft.entries[0];
      const draft={qty:e.qty,parts:JSON.parse(JSON.stringify(e.mf577Parts)),minutes:S.logDraft.minutes,
        catAmount:get('mf565ToCategoryAmount')(item,cat,e.qty),html:get('v239LoggedTitlesHtml')(S.logDraft.entries).includes('mf577-parts')};
      const before=new Set(S.sessions.map(s=>s.id));
      App.submitLog();
      const fresh=S.sessions.filter(s=>!before.has(s.id));
      const row=fresh.flatMap(s=>s.titles||[]).find(t=>t.libraryId===item.id);
      const after={progress:item.progress,total:item.total,status:item.status,parts:item.seasons.map(s=>[s.id,s.progress]),last:item.mf577LastPartId,
        meta:row&&row.mf577Parts,history:get('mf577HistoryText')(row)};
      // Batch Log, amount mode: one row, Deathmatch +3 (10 min each).
      S.batchDraft={rows:[{libraryId:item.id,qty:1,minutes:0}],note:'',date:get('todayISO')(),v179Mode:'amount'};const modeB=get('v179Mode')('batch');
      App.selectBatchTitle(0,item.id);
      App.mf577BatchToggle(0,'pd');App.mf577BatchToggle(0,'pu');
      App.mf577BatchSet(0,'pd',3);
      const brow=JSON.parse(JSON.stringify(S.batchDraft.rows[0]));
      const before2=new Set(S.sessions.map(s=>s.id));
      App.submitBatchLog();
      const bs=S.sessions.filter(s=>!before2.has(s.id));
      const batch={modeB,row:brow,sessions:bs.length,minutes:bs[0]&&bs[0].minutes,target:bs[0]&&bs[0].targetAmount,
        meta:bs[0]&&bs[0].titles[0].mf577Parts,parts:item.seasons.map(s=>[s.id,s.progress]),progress:item.progress};
      // Advanced: a unit at the title's default time takes its part's time.
      S.logDraft={v369Interface:'itemized',entries:[{libraryId:item.id,title:item.title,v369Units:[
        {id:'u1',number:4,seasonId:'pd',durationSeconds:get('v369DefaultSeconds')(item),loggedAt:Date.now()}]}]};
      get('v369Sync')();
      const unitSecs=S.logDraft.entries[0].v369Units[0].durationSeconds;
      // A Normal title with seasons still fills in order.
      const normal=S.library.find(i=>i!==item&&i.status!=='completed'&&i.status!=='dropped');
      Object.assign(normal,{progress:0,total:null,seasons:[{id:'s1',number:1,name:'Season 1',progress:0,total:10},{id:'s2',number:2,name:'Season 2',progress:0,total:12}]});
      get('v252DistributeAggregateProgress')(normal,13);
      const modal=String(get('libraryModalHtml')(item)||'');
      const editor={mode:modal.includes('data-mf577-mode'),parts:modal.includes('mf577-parts-editor'),fields:modal.includes('data-mf577-kind')};
      return {editor,synced,draft,after,batch,unitSecs,normal:normal.seasons.map(s=>s.progress),catSecs:get('mf565CatSeconds')(cat)};
    });
    assert.deepEqual(r.synced,{progress:45,total:null,kept:'matches'},'title = sum of parts, no total, part fields kept');
    assert.equal(r.draft.qty,5);
    assert.deepEqual(r.draft.parts,[{id:'pc',qty:3},{id:'pu',qty:2}]);
    assert.equal(r.draft.minutes,3*40+2*30,'each part its own time (own, then the title\'s)');
    assert(r.draft.html,'the part controls are drawn');
    const want=(n,secs)=>{const f=secs/r.catSecs;return f===1?n:Math.round(n*f*100)/100;};
    assert.equal(r.draft.catAmount,want(3,2400)+want(2,1800),'category amount per part');
    assert.deepEqual(r.after.parts,[['pc',44],['pu',6],['pd',0]],'only the chosen parts moved');
    assert.equal(r.after.progress,50);assert.equal(r.after.total,null);
    assert.equal(r.after.last,'pu');
    assert.deepEqual(r.after.meta.map(m=>[m.id,m.from,m.to,m.qty,m.kind]),[['pc',41,44,3,'Mode'],['pu',4,6,2,'Mode']]);
    assert(r.after.history.includes('Mode · Competitive · Match 41 → 44 (+3)'),r.after.history);
    assert.deepEqual(r.batch.row.mf577Parts,[{id:'pd',qty:3}],'default part (last logged), toggles, amount');
    assert.equal(r.batch.sessions,1);
    const bp=Object.fromEntries(r.batch.parts);
    const moved=r.batch.row.mf577Parts;
    for(const m of moved)assert.equal(bp[m.id],({pc:44,pu:6,pd:0})[m.id]+m.qty,'batch moved '+m.id);
    assert.equal(r.batch.minutes,moved.reduce((n,m)=>n+Math.round(m.qty*({pc:2400,pu:1800,pd:600})[m.id]/60),0));
    assert.equal(r.batch.meta.length,moved.length);
    assert.deepEqual(r.editor,{mode:true,parts:true,fields:true},'Edit title: how this title is logged + part fields');
    assert.equal(r.unitSecs,600,'an Advanced unit takes its part\'s time');
    assert.deepEqual(r.normal,[10,3],'Normal seasons still fill in order');
    console.log('PASS v577 parts: quick, batch, advanced, history, normal titles unchanged');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
