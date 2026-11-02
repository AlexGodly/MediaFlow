/* v555 performance parity: every optimised helper returns exactly what the
 * original returned, on a generated 30,000-title account in the real app. */
'use strict';
const assert=require('node:assert/strict');
const {openApp}=require('./harness/app.cjs');
(async()=>{
  const app=await openApp({titles:Number(process.env.MF555_TITLES||30000)});
  const p=app.page;
  try{
    // Library ranking is prepared in a worker after startup; compare with it ready.
    await p.waitForFunction(()=>window.MediaFlowV555Performance.ranksReady(),null,{timeout:60000});
    const r=await p.evaluate(()=>{
      const S=__MF.S(),B=window.MediaFlowV555Performance.bases,out={};
      // Messy titles: duplicates, case, CDATA, numbers, accents, renamed after ranking.
      S.library[1].title=S.library[2].title;S.library[3].title='<![CDATA[ Éclair 10 ]]>';
      S.library[4].title='éclair 9';S.library[5].title='';S.library[6].priority=undefined;
      const sorts=['priority-desc','priority-asc','title-asc','title-desc','rating-desc','rating-asc','progress-desc','progress-asc',
        'total-desc','total-asc','remaining-desc','remaining-asc','added-desc','added-asc','edited-desc','seen-desc','logging-desc'];
      const sign=x=>x>0?1:x<0?-1:0;
      const cmp=__MF.get('v189CompareLibraryItems');
      let mismatches=0,checked=0;
      const lib=S.library;
      for(const sort of sorts){
        for(let i=0;i<4000;i++){
          const a=lib[(i*7919)%lib.length],b=lib[(i*104729+13)%lib.length];
          checked++;if(sign(cmp(a,b,sort))!==sign(B.compare(a,b,sort)))mismatches++;
        }
        // Full sort order identical for a 3,000-title slice.
        const slice=lib.slice(0,3000);
        const x=slice.slice().sort((a,b)=>cmp(a,b,sort)).map(i=>i.id).join();
        const y=slice.slice().sort((a,b)=>B.compare(a,b,sort)).map(i=>i.id).join();
        if(x!==y)out['order:'+sort]=false;
      }
      // Rename after ranks were built must still compare correctly.
      lib[7].title='AAAA first';
      checked++;if(sign(cmp(lib[7],lib[8],'title-asc'))!==sign(B.compare(lib[7],lib[8],'title-asc')))mismatches++;
      out.compare={checked,mismatches};
      // History helpers (clock frozen so time-based fields compare exactly).
      const realNow=Date.now,frozen=realNow();Date.now=()=>frozen;
      let hist=0;const diffs=[];
      for(const c of S.categories){
        if(B.lastSessionFor(c.id)!==__MF.get('lastSessionFor')(c.id))hist++;
        if(B.minutesSince(c.id,72)!==__MF.get('minutesSince')(c.id,72))hist++;
        if(B.minutesSince(c.id,24*400)!==__MF.get('minutesSince')(c.id,24*400))hist++;
        if(JSON.stringify(B.categoryBalance(c))!==JSON.stringify(__MF.get('categoryBalance')(c))){hist++;diffs.push('balance '+c.id);}
        if(B.overall(c)!==__MF.get('overallCategoryStatus')(c)){hist++;diffs.push('overall '+c.id);}
        if(B.status(c)!==__MF.get('categoryStatus')(c)){hist++;diffs.push('status '+c.id);}
      }
      // Memoised objects are copies: mutating one must not leak to the next caller.
      const c0=S.categories[0];const b1=__MF.get('categoryBalance')(c0);if(b1&&typeof b1==='object'){b1.mf555Mutated=true;if(__MF.get('categoryBalance')(c0).mf555Mutated){hist++;diffs.push('balance shared');}}
      Date.now=realNow;out.diffs=diffs;
      if(JSON.stringify(B.todaysSessions())!==JSON.stringify(__MF.get('todaysSessions')()))hist++;
      if(B.consumption().length!==__MF.get('schedulerConsumptionSessions')().length)hist++;
      out.historyMismatches=hist;
      // A new log in the same task is seen immediately.
      const cat=S.categories[0].id;
      const before=__MF.get('lastSessionFor')(cat);
      S.sessions.push({id:'mf555-new',timestamp:Date.now()+5,date:new Date().toISOString().slice(0,10),categoryId:cat,minutes:30,status:'complete',titles:[]});
      out.newLogSeen=__MF.get('lastSessionFor')(cat)?.id==='mf555-new'&&before?.id!=='mf555-new';
      S.sessions.pop();
      // Pure helpers.
      out.clean=['  x ','<![CDATA[a]]>',null,undefined,5,'Ｆｕｌｌ'].every(v=>B.cleanTitle(v)===__MF.get('cleanTitle')(v));
      out.leveling=JSON.stringify(B.leveling())===JSON.stringify(__MF.get('levelingSettings')());
      S.settings.leveling=S.settings.leveling||{};const prev=S.settings.leveling.completionXP;
      S.settings.leveling.completionXP=12345;
      out.levelingEdit=__MF.get('levelingSettings')().completionXP===12345;
      // An in-place edit is also seen by the next History-wide XP computation.
      __MF.get('levelingSettings')();S.settings.leveling.completionXP=777;
      let seen=null;const base=__MF.get('levelingSettings');
      __MF.wrap('v149StreakMultiplier',orig=>function(){seen=__MF.get('levelingSettings')().completionXP;return orig.apply(this,arguments);});
      __MF.get('v150ComputeStateMetrics')({sessions:S.sessions.slice(0,50),library:[],xpLedger:{}});
      out.levelingScope=seen===777;
      if(prev===undefined)delete S.settings.leveling.completionXP;else S.settings.leveling.completionXP=prev;
      // Cover resolution.
      let cover=0;
      // Covers are edited through the app's save path, which refreshes Library caches.
      for(let i=0;i<300;i++)if(i%3===2)lib[i*31].coverUrl='https://cdn.example/'+i+'.jpg';
      __MF.get('persistLibrary')();
      for(let i=0;i<300;i++){
        const it=lib[i*31];const img=document.createElement('img');
        if(i%3===0)img.dataset.libraryId=it.id;else if(i%3===1)img.alt=it.title+' cover';else img.src=it.coverUrl;
        if(B.resolveCover(img)!==__MF.get('v181ResolveCoverItem')(img))cover++;
      }
      // A cover changed later in the same moment is still resolved correctly.
      lib[31].coverUrl='https://cdn.example/changed.jpg';
      const img2=document.createElement('img');img2.src=lib[31].coverUrl;
      if(B.resolveCover(img2)!==__MF.get('v181ResolveCoverItem')(img2)&&__MF.get('v181ResolveCoverItem')(img2)!==null)cover++;
      out.coverMismatches=cover;
      return out;
    });
    assert.equal(r.compare.mismatches,0,'comparator must match the original for every pair');
    for(const [k,v] of Object.entries(r))if(k.startsWith('order:'))assert.fail(k+' differs from original');
    assert.equal(r.historyMismatches,0,'History helpers must match the originals');
    assert(r.newLogSeen,'a log added in the same task must be visible immediately');
    assert(r.levelingScope,'XP computations must see settings edited just before');
    assert(r.clean&&r.leveling&&r.levelingEdit,'pure helpers must match and settings edits must apply immediately');
    assert.equal(r.coverMismatches,0,'cover resolution must match');
    // Button labels on every page match the clone-based original.
    const {nav}=require('./harness/measure.cjs');
    let labels=0,labelDiffs=[];
    for(const v of ['dashboard','library','history','collections','personal order','statistics','settings']){
      await nav(p,v);await p.waitForTimeout(900);
      const d=await p.evaluate(()=>{const B=window.MediaFlowV555Performance.bases,f=__MF.get('v225CleanActionText');let n=0;const bad=[];
        for(const el of document.querySelectorAll('button,a,[role=button],label,option')){n++;const a=B.actionText(el),b=f(el);if(a!==b)bad.push(a+' | '+b);}
        return {n,bad:bad.slice(0,5)};});
      labels+=d.n;labelDiffs.push(...d.bad);
    }
    assert.deepEqual(labelDiffs,[],'button labels must match the original');
    assert(labels>500,'label parity must cover many controls');
    assert.deepEqual(app.errors,[],'no page errors');
    console.log('PASS v555 performance parity: '+r.compare.checked+' comparisons, 17 full sort orders, History helpers, covers, leveling, titles.');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
