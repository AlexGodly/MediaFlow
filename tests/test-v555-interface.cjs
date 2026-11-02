/* v555 interface, in the real app: icon-only Sync + Full Backup shortcut,
 * Logging popup from any page (same workspace, same draft, real save),
 * matching quick-action geometry, Background Processes minimise/drag, and
 * On This Day recovery. Desktop and phone widths. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {openApp,generate}=require('./harness/app.cjs');
const {nav}=require('./harness/measure.cjs');
const SHOTS=process.env.MF555_SHOTS||'';
async function shot(p,name){if(SHOTS){fs.mkdirSync(SHOTS,{recursive:true});await p.screenshot({path:SHOTS+'/'+name+'.png'});}}

async function run(viewport,label){
  const state=generate({titles:60});
  // A History entry exactly two years ago today for On This Day.
  const d=new Date();d.setFullYear(d.getFullYear()-2);d.setHours(12,0,0,0);
  state.sessions.push({id:'otd-1',timestamp:d.getTime(),date:d.toISOString().slice(0,10),categoryId:state.library[3].categoryId,
    minutes:24,actualAmount:1,status:'complete',unit:'episodes',titles:[{title:state.library[3].title,libraryId:state.library[3].id,qty:1,loggedAt:d.getTime()}]});
  const app=await openApp({state,viewport});
  const p=app.page;
  const out={};
  try{
    await p.waitForTimeout(800);
    // 1. Top bar.
    const top=await p.evaluate(()=>{
      const sync=document.querySelector('.v555-sync-btn'),backup=document.querySelector('.v555-backup-btn');
      return {sync:!!sync,syncText:sync?.textContent.trim(),syncLabel:sync?.getAttribute('aria-label'),backup:!!backup,
        backupLabel:backup?.getAttribute('aria-label'),w:sync?.getBoundingClientRect().width};
    });
    assert(top.sync&&top.syncText===''&&top.syncLabel==='Sync now','Sync is icon-only with an accessible name');
    assert(top.backup&&top.backupLabel==='Export full backup','Full Backup shortcut present');
    assert(top.w<=44,'icon buttons are compact');
    const [download]=await Promise.all([p.waitForEvent('download',{timeout:20000}),p.click('.v555-backup-btn')]);
    const file=await download.path();
    const backup=JSON.parse(fs.readFileSync(file,'utf8'));
    assert(/^MediaFlow_Backup_.*\.json$/.test(download.suggestedFilename()),'standard backup filename');
    assert.equal(backup.library?.length??backup.state?.library?.length,60,'backup contains the whole Library');
    out.backup=true;

    // 2. Logging popup from the Library page.
    await nav(p,'library');await p.waitForTimeout(600);
    await p.click('#mf397-fab');await p.waitForTimeout(350);
    await shot(p,label+'-menu');
    // Quick-action menu: every item's icon box and text start line up.
    const geo=await p.evaluate(()=>[...document.querySelectorAll('#mf397-fan .mf397-fan-action')].map(b=>{
      const s=b.querySelector('.mf397-action-symbol').getBoundingClientRect(),t=b.querySelector('strong').getBoundingClientRect();
      return {a:b.dataset.action,w:Math.round(s.width),h:Math.round(s.height),x:Math.round(s.left),tx:Math.round(t.left)};}));
    const ref=geo[0],last=geo.find(g=>g.a==='backgroundProcessesVisibility');
    assert(last,'Background Processes item present');
    for(const g of geo)assert(g.w===ref.w&&g.h===ref.h&&g.x===ref.x&&g.tx===ref.tx,'menu item '+g.a+' must match the others: '+JSON.stringify(g)+' vs '+JSON.stringify(ref));
    await p.click('.mf397-fan-action[data-action="logging"]');
    await p.waitForSelector('#mf555-log-popup .log-form',{timeout:15000});
    const pop=await p.evaluate(()=>({view:__MF.S().view,forms:document.querySelectorAll('.log-form').length,logging:__MF.S().logging}));
    assert.equal(pop.view,'library','the page underneath stays the Library');
    assert.equal(pop.forms,1,'exactly one Logging workspace exists');
    await shot(p,label+'-logging-popup');
    // Add a title through the workspace's own entry path, then close: draft kept.
    // (v557: the popup shows only Browse Library; the rest of the form is hidden, not removed.)
    await p.evaluate(()=>App.v369SwitchInterface('quick'));await p.waitForTimeout(300);
    await p.evaluate(()=>App.v179SetLogMode('single','amount'));await p.waitForTimeout(200);
    await p.evaluate(()=>{const S=__MF.S(),it=S.library.find(x=>x.categoryId===S.currentTask.categoryId&&x.status!=='dropped')||S.library[0];
      S.entryDraft={title:it.title,qty:2,libraryId:it.id};App.addLogEntry();});
    await p.waitForTimeout(300);
    const entries=await p.evaluate(()=>__MF.S().logDraft.entries.length);
    assert(entries>=1,'title added to the draft from the popup');
    await p.keyboard.press('Escape');await p.waitForTimeout(300);
    const closed=await p.evaluate(()=>({pop:!!document.getElementById('mf555-log-popup'),entries:__MF.S().logDraft?.entries?.length,logging:__MF.S().logging}));
    assert(!closed.pop&&closed.entries===entries&&closed.logging,'closing keeps the draft intact');
    // Dashboard shows the same draft inline.
    await nav(p,'dashboard');await p.waitForTimeout(600);
    const inline=await p.evaluate(()=>!!document.querySelector('#view-root .log-form')&&!document.querySelector('.mf555-log-placeholder'));
    assert(inline,'Dashboard shows the same draft inline after closing the popup');
    // Popup also works on the Dashboard (inline copy steps aside), then save.
    await p.click('#mf397-fab');await p.waitForTimeout(300);
    await p.click('.mf397-fan-action[data-action="logging"]');
    await p.waitForSelector('#mf555-log-popup .log-form');
    const dash=await p.evaluate(()=>({forms:document.querySelectorAll('.log-form').length,placeholder:!!document.querySelector('#view-root .mf555-log-placeholder')}));
    assert(dash.forms===1&&dash.placeholder,'on the Dashboard the popup is the only workspace');
    const before=await p.evaluate(()=>__MF.S().sessions.length);
    await p.evaluate(()=>App.submitLog());
    await p.waitForTimeout(800);
    const after=await p.evaluate(()=>({sessions:__MF.S().sessions.length,pop:!!document.getElementById('mf555-log-popup'),logging:__MF.S().logging}));
    assert(after.sessions>before,'saving from the popup records History');
    assert(!after.pop&&!after.logging,'the popup closes after saving');
    out.logging=true;

    // 3. Background Processes: minimise, restore, drag, reset.
    await p.evaluate(()=>{const S=__MF.S();S.settings.v441RecoveryUI={...(S.settings.v441RecoveryUI||{}),visibility:'always'};__MF.get('mf441Paint')();});
    await p.waitForSelector('#mf441-process-widget .mf555-proc-minimize',{timeout:10000});
    await shot(p,label+'-processes');
    await p.click('#mf441-process-widget .mf555-proc-minimize');await p.waitForTimeout(300);
    const mini=await p.evaluate(()=>{const m=document.getElementById('mf555-proc-mini')?.getBoundingClientRect(),f=document.getElementById('mf397-fab')?.getBoundingClientRect(),
      w=document.getElementById('mf441-process-widget');
      const bar=document.querySelector('#mf555-proc-mini .mf555-proc-bar')?.getBoundingClientRect(),icon=document.querySelector('#mf555-proc-mini .mf555-proc-icon')?.getBoundingClientRect();
      return {m:!!m,hidden:w?getComputedStyle(w).display==='none':true,leftOfFab:m&&f?m.right<=f.left+1:false,
        nearFab:m&&f?Math.abs((m.top+m.bottom)/2-(f.top+f.bottom)/2)<60:false,barLeft:bar&&icon?bar.right<=icon.left:false};});
    assert(mini.m&&mini.hidden,'minimised to a single icon');
    assert(mini.leftOfFab&&mini.nearFab,'icon floats next to the + button: '+JSON.stringify(mini));
    assert(mini.barLeft,'progress bar sits on the icon’s left');
    await shot(p,label+'-processes-min');
    await p.click('#mf555-proc-mini');await p.waitForTimeout(300);
    assert(await p.evaluate(()=>getComputedStyle(document.getElementById('mf441-process-widget')).display!=='none'),'restored from the icon');
    const handle=await p.evaluate(()=>{const r=document.querySelector('#mf441-process-widget .mf476-widget-name,#mf441-process-widget .mf441-widget-name').getBoundingClientRect();return {x:r.left+20,y:r.top+8};});
    const startRect=await p.evaluate(()=>document.getElementById('mf441-process-widget').getBoundingClientRect().toJSON());
    await p.mouse.move(handle.x,handle.y);await p.mouse.down();
    await p.mouse.move(handle.x-120,handle.y-150,{steps:8});await p.mouse.up();
    await p.waitForTimeout(300);
    const moved=await p.evaluate(()=>({r:document.getElementById('mf441-process-widget').getBoundingClientRect().toJSON(),
      expanded:!!__MF.S().settings.v441RecoveryUI.expanded,saved:JSON.parse(localStorage.getItem('mediaflow-v555-process-widget')||'{}')}));
    assert(Math.abs(moved.r.left-(startRect.left-120))<3||moved.r.left<=8,'widget follows the drag: '+JSON.stringify([startRect.left,moved.r.left]));
    assert(moved.saved.x!=null,'position remembered on this device');
    // Clicks inside still work after dragging (toggle expands).
    await p.waitForTimeout(450);
    await p.click('#mf441-process-widget .mf476-toggle-chevron,#mf441-process-widget .mf441-widget-toggle');await p.waitForTimeout(300);
    const exp=await p.evaluate(()=>!!__MF.S().settings.v441RecoveryUI.expanded);
    assert.notEqual(exp,moved.expanded,'the header still toggles after a drag');
    const kept=await p.evaluate(()=>document.getElementById('mf441-process-widget').getBoundingClientRect().left);
    assert(Math.abs(kept-moved.r.left)<3,'position kept across repaints');
    await p.dblclick('#mf441-process-widget .mf476-widget-name,#mf441-process-widget .mf441-widget-name');await p.waitForTimeout(300);
    const reset=await p.evaluate(()=>({ls:localStorage.getItem('mediaflow-v555-process-widget'),x:window.MediaFlowV555Interface.processes().x}));
    assert(JSON.parse(reset.ls).x==null,'double-click resets the position: '+JSON.stringify(reset));
    out.processes=true;

    // 4. On This Day recovery.
    await nav(p,'dashboard');await p.waitForTimeout(700);
    const otd=await p.evaluate(()=>{const b=document.querySelector('.mf427-otd-heading .mf555-otd-recover');return {b:!!b,label:b?.getAttribute('aria-label')};});
    assert(otd.b,'recovery icon on the On This Day heading');
    await p.click('.mf427-otd-heading .mf555-otd-recover');await p.waitForTimeout(800);
    const ws=await p.evaluate(()=>({ids:__MF.get('MF447').contextIds,label:__MF.get('MF447').contextLabel,open:!!document.querySelector('.mf445-overlay,.mf441-workspace,#mf445-root,[class*="mf445"]')}));
    assert.deepEqual(ws.ids,[state.library[3].id],'workspace opens with today’s On This Day titles selected');
    assert.equal(ws.label,'On This Day');
    await shot(p,label+'-otd-recovery');
    out.otd=true;
    assert.deepEqual(app.errors.filter(e=>!/Failed to load resource/.test(e)),[],'no page errors');
    return out;
  }finally{await app.close();}
}
(async()=>{
  const desk=await run({width:1440,height:900},'desktop');
  const phone=await run({width:390,height:844},'phone');
  console.log('PASS v555 interface (desktop + phone):',JSON.stringify({desk,phone}));
})().catch(e=>{console.error(e);process.exit(1);});
