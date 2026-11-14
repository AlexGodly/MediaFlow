/* v579, in the real app: a by-parts title in MediaFlow Recommends. The
 * Dashboard card and the Logging shortcut name the next part ("Next: Mode ·
 * Live · Match 5 of 10") and count in the title's own unit; "Use recommended
 * title" (and the Logging picker's quick add) start it on that part, so the
 * log moves the part instead of logging nothing. */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate}=require('./harness/app.cjs');
(async()=>{
  const app=await openApp({state:generate({titles:30})});
  const p=app.page;
  try{
    await p.waitForTimeout(700);
    const r=await p.evaluate(()=>{
      const S=__MF.S(),get=__MF.get;
      const item=S.library.find(i=>i.status!=='completed'&&i.status!=='dropped');
      Object.assign(item,{status:'active',mf577LogMode:'parts',mf565Unit:'matches',mf565SecondsPerUnit:900,mf577LastPartId:'b',seasons:[
        {id:'a',name:'Career',progress:2,mf577Kind:'Mode'},{id:'b',name:'Live',progress:4,total:10,mf577Kind:'Mode'}]});
      get('v252SyncTitleFromSeasons')(item);
      App.startSession?.();const t=get('generateTask')();t.categoryId=item.categoryId;t.libraryId=item.id;t.title=item.title;S.currentTask=t;
      S.settings.exactTitleRecommendations=true;
      const tx=document.createElement('div');tx.innerHTML=get('mf395DashboardRecommendationHtml')(t,get('getCategory')(item.categoryId));
      const dash=tx.textContent;
      App.openLogForm();S.logging=true;S.logDraft.v369Interface='quick';
      const card=document.createElement('div');card.innerHTML=get('v253RecommendedLogCardHtml')(item);
      App.v253UseRecommendedTitle();
      const e=JSON.parse(JSON.stringify(S.logDraft.entries[0]||{}));
      const before=new Set(S.sessions.map(s=>s.id));
      App.submitLog();
      const row=S.sessions.filter(s=>!before.has(s.id)).flatMap(s=>s.titles||[]).find(x=>x.libraryId===item.id);
      return {dash,card:card.textContent.replace(/\s+/g,' '),e,parts:item.seasons.map(s=>[s.id,s.progress]),meta:row&&row.mf577Parts};
    });
    assert(r.dash.includes('Next: Mode · Live · Match 5 of 10'),r.dash.slice(0,300));
    assert(/\d+ matches logged/.test(r.dash),'title progress in its own unit');
    assert(r.card.includes('2 parts')&&r.card.includes('Next: Mode · Live · Match 5 of 10')&&!r.card.includes('seasons'),r.card);
    assert.deepEqual(r.e.mf577Parts,[{id:'b',qty:1}],'starts on the part logged last');
    assert.equal(r.e.qty,1);
    assert.deepEqual(r.parts,[['a',2],['b',5]]);
    assert(r.meta&&r.meta[0].id==='b'&&r.meta[0].from===4&&r.meta[0].to===5,JSON.stringify(r.meta));
    console.log('PASS v579 recommended by-parts title: next part, own unit, logs the part');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
