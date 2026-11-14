/* v580, in the real app: a by-parts title in Advanced logging shows the parts
 * panel in Per Unit, Progress Reached and Amount Consumed, and logs the parts. */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate}=require('./harness/app.cjs');
(async()=>{
  const app=await openApp({state:generate({titles:30})});const p=app.page;
  try{
    await p.waitForTimeout(700);
    const r=await p.evaluate(()=>{const S=__MF.S(),get=__MF.get;
      const item=S.library.find(i=>i.status!=='completed'&&i.status!=='dropped');
      Object.assign(item,{status:'active',mf577LogMode:'parts',mf565Unit:'matches',mf565SecondsPerUnit:900,mf577LastPartId:'b',seasons:[
        {id:'a',name:'Career',progress:2,mf577Kind:'Mode'},{id:'b',name:'Live',progress:4,total:10,mf577Kind:'Mode'}]});
      get('v252SyncTitleFromSeasons')(item);
      App.startSession?.();S.currentTask=get('generateTask')();App.openLogForm();S.logging=true;S.logDraft.v369Interface='itemized';
      App.v378QuickAdd(item.id);get('render')();
      const start=S.logDraft.entries[0].v369Units.map(u=>u.seasonId+':'+u.number);
      const look={};
      for(const m of ['unit','last','amount']){App.v394Switch(0,m);const el=document.querySelector('.log-form .v370-title');
        look[m]={panel:!!el.querySelector('.mf580-adv-parts .mf579-part-card'),label:[...el.querySelectorAll('.mf580-adv-parts .mf579-part-head label>span')].map(x=>x.textContent),
          seasons:!!el.querySelector('.mf394-bulk select,.v370-add-row'),units:el.querySelectorAll('.v370-unit-list:not([hidden]) .v370-unit').length,
          partLabel:[...el.querySelectorAll('.v370-unit-season')].map(x=>x.firstChild.textContent.trim())[0]||'',stats:el.querySelector('.v370-title-stats')?.textContent||''};}
      App.mf580AdvToggle(0,'a');App.mf580AdvSet(0,'a','3');App.v394Switch(0,'last');App.mf580AdvSet(0,'b','7');
      const before=new Set(S.sessions.map(x=>x.id));App.submitLog();
      const row=S.sessions.filter(x=>!before.has(x.id)).flatMap(x=>x.titles||[]).find(x=>x.libraryId===item.id);
      return {start,look,parts:item.seasons.map(s=>s.id+':'+s.progress),meta:row&&row.mf577Parts.map(m=>m.id+':'+m.from+'→'+m.to)};});
    assert.deepEqual(r.start,['b:5'],'starts on the part logged last');
    for(const m of ['unit','last','amount']){assert(r.look[m].panel,m+': parts panel');assert(!r.look[m].seasons,m+': no season picker');}
    assert.deepEqual(r.look.last.label,['Match reached']);
    assert.deepEqual(r.look.amount.label,['Amount']);
    assert.equal(r.look.unit.units,1,'Per Unit keeps its unit rows');
    assert.equal(r.look.unit.partLabel,'Part');
    assert(!/matchs/.test(r.look.unit.stats),r.look.unit.stats);
    assert.deepEqual(r.parts,['a:5','b:7']);
    assert.deepEqual(r.meta,['a:2→5','b:4→7']);
    console.log('PASS v580 Advanced logging: by-parts titles in all three tabs');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
