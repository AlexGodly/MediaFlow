/* v581, in the real app: Edit title → By parts: reorder parts with the arrows,
 * the position number and by dragging the handle; the saved order is what
 * Logging and Batch Log / Log any title show. */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate}=require('./harness/app.cjs');
(async()=>{
  const app=await openApp({state:generate({titles:20})});const p=app.page;
  try{
    await p.setViewportSize({width:1200,height:1000});await p.waitForTimeout(700);
    const id=await p.evaluate(()=>{const S=__MF.S(),get=__MF.get;
      const item=S.library.find(i=>i.status!=='completed'&&i.status!=='dropped');
      Object.assign(item,{status:'active',mf577LogMode:'parts',seasons:[
        {id:'a',name:'Alpha',progress:1},{id:'b',name:'Bravo',progress:2},{id:'c',name:'Charlie',progress:3},{id:'d',name:'Delta',progress:4}]});
      get('v252SyncTitleFromSeasons')(item);App.openLibraryModal(item.id);return item.id;});
    await p.waitForTimeout(300);
    const names=()=>p.evaluate(()=>[...document.querySelectorAll('[data-v252-season-list] > [data-v252-season-row]')].map(r=>r.querySelector('[data-v252-season-name]').value+'#'+r.querySelector('.mf581-pos').value));
    assert.deepEqual(await names(),['Alpha#1','Bravo#2','Charlie#3','Delta#4']);
    // Arrows: Delta up.
    await p.locator('[data-v252-season-row]').nth(3).locator('[aria-label="Move up"]').click();
    assert.deepEqual(await names(),['Alpha#1','Bravo#2','Delta#3','Charlie#4']);
    // Position: Charlie to 1.
    const pos=p.locator('[data-v252-season-row]').nth(3).locator('.mf581-pos');await pos.fill('1');await pos.dispatchEvent('change');
    assert.deepEqual(await names(),['Charlie#1','Alpha#2','Bravo#3','Delta#4']);
    // Drag: Delta's handle above Alpha.
    const h=await p.locator('[data-v252-season-row]').nth(3).locator('.mf581-handle').boundingBox();
    const t=await p.locator('[data-v252-season-row]').nth(1).boundingBox();
    await p.mouse.move(h.x+h.width/2,h.y+h.height/2);await p.mouse.down();
    await p.mouse.move(h.x+h.width/2,t.y+5,{steps:12});await p.mouse.up();
    assert.deepEqual(await names(),['Charlie#1','Delta#2','Alpha#3','Bravo#4']);
    await p.evaluate(id=>App.saveLibraryModal(id),id);await p.waitForTimeout(600);
    const r=await p.evaluate(id=>{const S=__MF.S(),get=__MF.get;
      const item=S.library.find(i=>i.id===id);
      App.startSession?.();S.currentTask=get('generateTask')();App.openLogForm();S.logging=true;S.logDraft.v369Interface='quick';S.logDraft.v179Mode='amount';
      App.v378QuickAdd(id);get('render')();
      const chips=[...document.querySelectorAll('.log-form .mf577-chip')].map(b=>b.textContent.replace(/[✓\s]+$/,'').trim());
      return {order:item.seasons.map(s=>s.name),progress:item.seasons.map(s=>s.progress),chips};},id);
    assert.deepEqual(r.order,['Charlie','Delta','Alpha','Bravo']);
    assert.deepEqual(r.progress,[3,4,1,2],'each part keeps its counter');
    assert.deepEqual(r.chips.map(c=>c.replace(/^.*·\s*/,'')),['Charlie','Delta','Alpha','Bravo'],'Logging follows the order');
    console.log('PASS v581 part order: arrows, position, drag; saved and followed by Logging');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
