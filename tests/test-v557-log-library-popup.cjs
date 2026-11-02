/* v557: "Add to Logging" opens only Browse Library, from any page. Titles are
 * added to the current Logging draft (per title, and Select Visible + Add
 * Selected); the count updates; nothing else of the workspace is visible;
 * the section cannot be collapsed; closing keeps the titles; "Open Logging"
 * goes to the full workspace on the Dashboard with the same draft. */
'use strict';
const assert=require('node:assert/strict');
const {openApp}=require('./harness/app.cjs');
const visible=(p,sel)=>p.evaluate(s=>[...document.querySelectorAll(s)].some(e=>e.offsetParent!==null&&e.getBoundingClientRect().height>0),sel);
(async()=>{
  const A=await openApp({titles:400});const p=A.page;
  try{
    for(const vp of [{width:1440,height:900},{width:390,height:820}]){
      await p.setViewportSize(vp);
      await p.evaluate(()=>{const S=__MF.S();S.logging=false;S.logDraft=null;App.setView('history');});await p.waitForTimeout(500);
      await p.click('#mf397-fab');await p.waitForTimeout(300);
      await p.click('.mf397-fan-action[data-action="logging"]');
      await p.waitForSelector('#mf555-log-popup.mf557-library-only',{timeout:15000});
      await p.waitForTimeout(800);
      assert.equal(await p.evaluate(()=>__MF.S().view),'history','page underneath unchanged');
      assert.equal(await p.evaluate(()=>document.querySelector('#mf555-log-title').textContent),'Add to Logging');
      // Only Browse Library is shown.
      assert(await visible(p,'#mf555-log-popup .mf378-add-btn'),'library titles with Add buttons visible');
      assert(await visible(p,'#mf555-log-popup #entry-title'),'library search visible');
      for(const sel of ['.mf537-xp-card','.mf373-toolbar','.v370-auto-totals','.mf372-session-hero','#log-note','[onclick*="submitLog"]','[onclick*="v369SwitchInterface"]','details.v238-log-library > summary'])
        assert(!(await visible(p,'#mf555-log-popup '+sel)),'hidden in the popup: '+sel);
      // Add one title, then two more with Select Visible / Add Selected.
      await p.click('#mf555-log-popup .mf378-add-btn');await p.waitForTimeout(500);
      assert.equal(await p.evaluate(()=>MediaFlowV557.added()),1,'one title added');
      assert.match(await p.evaluate(()=>document.querySelector('[data-mf557-added]').textContent),/^1 title added/);
      // Tick two more titles (the checkbox input is styled; click it as the page does).
      await p.evaluate(()=>{const boxes=[...document.querySelectorAll('#mf555-log-popup .log-suggestion .mf378-check input[type="checkbox"]:not(:checked)')];
        for(const b of boxes.slice(1,3))b.click();});
      await p.waitForTimeout(200);
      assert.match(await p.evaluate(()=>document.querySelector('#mf555-log-popup [onclick*="v378BulkAdd"]').textContent),/Add Selected \(2\)/,'two titles ticked');
      await p.click('#mf555-log-popup [onclick*="v378BulkAdd"]');await p.waitForTimeout(600);
      const n=await p.evaluate(()=>MediaFlowV557.added());
      assert(n>=3,'Add Selected adds the ticked titles ('+n+')');
      assert.match(await p.evaluate(()=>document.querySelector('[data-mf557-added]').textContent),new RegExp('^'+n+' titles added'));
      // The section can't be collapsed.
      await p.evaluate(()=>document.querySelector('#mf555-log-popup details.v238-log-library > summary').click());await p.waitForTimeout(200);
      assert(await p.evaluate(()=>document.querySelector('#mf555-log-popup details.v238-log-library').open),'library stays open');
      // Close keeps the titles; reopen shows the same count.
      await p.keyboard.press('Escape');await p.waitForTimeout(300);
      assert(!(await p.evaluate(()=>!!document.getElementById('mf555-log-popup'))),'closed');
      assert.equal(await p.evaluate(()=>__MF.S().logDraft.entries.length),n,'titles kept after closing');
      await p.evaluate(()=>App.mf555OpenLogPopup());await p.waitForSelector('#mf555-log-popup.mf557-library-only');
      assert.match(await p.evaluate(()=>document.querySelector('[data-mf557-added]').textContent),new RegExp('^'+n+' titles'));
      // Open Logging: full workspace on the Dashboard, same draft.
      await p.click('#mf555-log-popup .mf557-open-logging');await p.waitForTimeout(800);
      const ws=await p.evaluate(()=>({view:__MF.S().view,pop:!!document.getElementById('mf555-log-popup'),form:!!document.querySelector('#view-root .log-form'),n:__MF.S().logDraft.entries.length}));
      assert.deepEqual(ws,{view:'dashboard',pop:false,form:true,n},'Open Logging shows the workspace with the same titles');
      assert(await visible(p,'#view-root .mf537-xp-card'),'the full workspace (XP preview) is on the Dashboard');
    }
    assert.deepEqual(A.errors,[],'no page errors');
    console.log('PASS v557 Add to Logging popup: Browse Library only, per-title and bulk add, live count, close keeps titles, Open Logging.');
  }finally{await A.close();}
})().catch(e=>{console.error(e);process.exit(1);});
