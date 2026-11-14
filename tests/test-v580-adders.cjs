/* v580, in the real app: the "+ add" bar under every Amount box adds to it
 * ("3 + 4 = 7") — Quick and Advanced logging, Batch Log, normal titles and
 * each part of a by-parts title. */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate}=require('./harness/app.cjs');
(async()=>{
  const app=await openApp({state:generate({titles:30})});const p=app.page;
  try{
    await p.setViewportSize({width:1300,height:1000});await p.waitForTimeout(700);
    await p.evaluate(()=>{const S=__MF.S(),get=__MF.get;
      const items=S.library.filter(i=>i.status!=='completed'&&i.status!=='dropped');const item=items[0],plain=items[1];window.__ids=[item.id,plain.id];
      Object.assign(item,{status:'active',mf577LogMode:'parts',mf565Unit:'matches',seasons:[{id:'a',name:'Career',progress:2},{id:'b',name:'Live',progress:4,total:10}]});
      Object.assign(plain,{progress:0,total:0,seasons:[]});
      get('v252SyncTitleFromSeasons')(item);App.startSession?.();S.currentTask=get('generateTask')();
      App.openLogForm();S.logging=true;S.logDraft.v369Interface='quick';S.logDraft.v179Mode='amount';App.v378QuickAdd(item.id);App.v378QuickAdd(plain.id);get('render')();});
    const add=async(sel,n)=>{await p.waitForTimeout(700);const box=p.locator(sel).filter({visible:true}).first();await box.locator('input').fill(String(n));await box.locator('button').click();await p.waitForTimeout(350);};
    await add('.mf580-adder[data-mf580-key^="App.mf504SetQuickAmount"]',3);
    await add('.mf580-adder[data-mf580-key^="App.mf504SetQuickAmount"]',4);
    await add('.mf580-adder[data-mf580-key^="App.mf577SetPart"]',2);
    const quick=await p.evaluate(()=>({q:__MF.S().logDraft.entries.map(e=>e.qty),sums:[...document.querySelectorAll('.mf580-sum')].map(x=>x.textContent)}));
    assert.deepEqual(quick.q,[3,7],JSON.stringify(quick));
    assert(quick.sums.includes('3 + 4 = 7')&&quick.sums.includes('1 + 2 = 3'),JSON.stringify(quick));
    await p.evaluate(()=>{const S=__MF.S(),get=__MF.get;S.logDraft.entries=[];S.logDraft.v369Interface='itemized';App.v378QuickAdd(window.__ids[0]);App.v378QuickAdd(window.__ids[1]);App.v394Switch(0,'amount');App.v394Switch(1,'amount');get('render')();});
    await add('.mf580-adder[data-mf580-key^="App.mf580AdvSet"]',2);
    await add('.mf580-adder[data-mf580-key^="App.v394SetQuantity(1"]',5);
    const adv=await p.evaluate(()=>__MF.S().logDraft.entries.map(e=>(e.v369Units||[]).length));
    assert.deepEqual(adv,[3,5],'Advanced: '+JSON.stringify(adv));
    await p.evaluate(()=>{const S=__MF.S();S.batchDraft={rows:[{libraryId:'',qty:1,minutes:0},{libraryId:'',qty:1,minutes:0}],note:'',date:'',v179Mode:'amount'};App.mf565OpenBatch();App.selectBatchTitle(0,window.__ids[0]);App.selectBatchTitle(1,window.__ids[1]);});
    await add('#mf565-batch .mf580-adder[data-mf580-key^="App.updateBatchRow(1"]',6);
    await add('#mf565-batch .mf580-adder[data-mf580-key^="App.mf577BatchSet"]',3);
    const batch=await p.evaluate(()=>__MF.S().batchDraft.rows.map(r=>Number(r.qty)));
    assert.deepEqual(batch,[4,7],'Batch Log: '+JSON.stringify(batch));
    console.log('PASS v580 + add bars: Quick, Advanced, Batch Log, titles and parts');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
