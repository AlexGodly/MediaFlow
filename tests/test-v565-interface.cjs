/* v565 interface, in the real app (Chrome through the test harness):
 * More button class, task progress numbers and settings, + menu items,
 * Log any title (Batch Log popup) with a title's own unit converted to the
 * category's unit, title names shown and searched, title editor fields,
 * collection cover from a title, XP for actions (repeat rule), away XP
 * (credited once), Get MediaFlow with a stable release, FAQ entries. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {openApp,generate}=require('./harness/app.cjs');
const {nav}=require('./harness/measure.cjs');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

// Static contract.
const version=Number(read('VERSION').trim());
assert(version>=565);
const runtime=JSON.parse(read('src/js/runtime-order.json'));
for(const f of ['408-v565-fixes','409-v565-floating-controls','410-v565-quick-logging','411-v565-titles','412-v565-collection-cover','413-v565-xp-everywhere','414-v565-get-mediaflow','415-v565-faq'])
  assert(runtime.includes('components/'+f+'.js'),f+' is in the runtime order');
assert(read('src/js/components/405-v562-library-history-more.js').includes('mf562-more-btn'),'More button has its own class');
assert(!/class="btn btn-sm mf562-more"/.test(read('src/js/components/405-v562-library-history-more.js')),'More button no longer uses the popup class');
if(version===565){const wf=read('.github/workflows/publish-v565.yml');assert(wf.includes('gh release create 565')&&wf.includes('legacy/v/565'));}

const RELEASE={tag_name:'mediaflowapp-v6.0.0.565',prerelease:false,draft:false,html_url:'https://github.com/AlexGodly/MediaFlowApp/releases/tag/mediaflowapp-v6.0.0.565',published_at:'2026-11-12T10:00:00Z',
  assets:['Android.apk','Android-arm64-v8a.apk','Android-armeabi-v7a.apk','Android-x86_64.apk','Windows-x64-Setup.exe','Windows-x64-portable.zip','iOS-unsigned.ipa']
    .map(s=>({name:'MediaFlow-6.0.0.565-'+s,size:52428800,browser_download_url:'https://example.invalid/'+s}))};

(async()=>{
  const state=generate({titles:60});
  const app=await openApp({state,network:async url=>{
    if(url.startsWith('https://api.github.com/repos/AlexGodly/MediaFlowApp/releases/latest'))
      return {status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(RELEASE)};
    return null;
  }});
  const p=app.page;
  try{
    await p.waitForTimeout(800);

    // Task progress numbers.
    const nums=await p.evaluate(()=>{const f=MediaFlowV565.taskNumbers;return {
      min9:f(9,9,13,'minimum','count'),min11:f(11,9,13,'minimum','count'),min15:f(15,9,13,'minimum','count'),
      max15:f(15,9,13,'maximum','count'),warn15:f(15,9,13,'minimum','warning'),status15:f(15,9,13,'minimum','status'),max11:f(11,9,13,'maximum','status')};});
    assert.equal(Math.round(nums.min9.pct),100,'minimum: 9 of 9–13 is 100%');
    assert.equal(Math.round(nums.min11.pct),122);assert.equal(nums.min11.warn,false,'inside the goal: no warning');
    assert.equal(Math.round(nums.min15.pct),167);assert.equal(nums.min15.warn,true,'past the maximum: warning');
    assert.equal(Math.round(nums.max15.pct),115);
    assert.equal(Math.round(nums.warn15.pct),100);assert.equal(nums.warn15.warn,true);
    assert.equal(Math.round(nums.status15.pct),100);assert.equal(nums.status15.warn,false);
    assert.equal(Math.round(nums.max11.pct),85);assert(nums.max11.marker>0,'maximum keeps the minimum marker');
    assert.equal(nums.min11.marker,null,'minimum hides the marker');

    // + menu items.
    await nav(p,'library');await p.waitForTimeout(500);
    await p.click('#mf397-fab');await p.waitForTimeout(350);
    const menu=await p.evaluate(()=>({logAny:!!document.querySelector('#mf397-fan [data-action="mf565LogAny"]'),
      get:!!document.querySelector('#mf397-fan [data-action="mf565Get"]'),
      saveHidden:document.querySelector('#mf397-fan [data-action="mf565SaveNext"]')?.hidden}));
    assert(menu.logAny&&menu.get,'Log any title and Get MediaFlow are in the + menu');
    assert.equal(menu.saveHidden,true,'Save & get next task only shows while a log is open');

    // Per-title unit, then Log any title from the Library page.
    const setup=await p.evaluate(()=>{
      const S=__MF.S(),item=S.library.find(i=>i.status!=='completed'&&i.status!=='dropped');
      const cat=__MF.get('getCategory')(item.categoryId);
      item.mf565Unit='matches';item.mf565SecondsPerUnit=Math.round(__MF.get('mf565CatSeconds')(cat)/3); // 3 matches = 1 category unit
      return {id:item.id,catUnit:cat.unit,before:S.sessions.length};
    });
    await p.click('#mf397-fan [data-action="mf565LogAny"]');
    await p.waitForSelector('#mf565-batch',{timeout:10000});
    const label=await p.evaluate(id=>{
      try{App.v179SetLogMode('batch','amount');}catch(_){}
      const S=__MF.S();S.batchDraft.rows=[{libraryId:id,query:'',qty:3,minutes:30}];__MF.get('render')();
      return document.querySelector('#mf565-batch .batch-number-fields .field-label,#mf565-batch label.field-label[for],#mf565-batch .field-label')?.textContent||'';
    },setup.id);
    await p.waitForTimeout(200);
    const amountLabel=await p.evaluate(()=>[...document.querySelectorAll('#mf565-batch .field-label')].map(x=>x.textContent).join(' | '));
    assert(/match/i.test(amountLabel),'Batch Log shows the title\'s own unit: '+amountLabel);
    await p.evaluate(()=>App.submitBatchLog());await p.waitForTimeout(500);
    const after=await p.evaluate(b=>{const S=__MF.S();return {view:S.view,added:S.sessions.length-b,last:S.sessions[S.sessions.length-1],open:!!document.getElementById('mf565-batch')};},setup.before);
    assert.equal(after.added,1,'one Batch Log session');
    assert.equal(after.view,'library','still on the Library page');
    assert.equal(after.open,false,'popup closes after logging');
    assert.equal(after.last.actualAmount,1,'3 matches count as 1 category unit');
    assert.equal(after.last.titles[0].qty,3,'the title keeps its own amount');

    // Title names: English shown (for titles on the page), search finds every name.
    await p.waitForFunction(()=>{const t=document.getElementById('view-root').textContent;return __MF.S().library.some(i=>i.titleEnglish&&t.includes(i.title));},null,{timeout:20000});
    const visible=await p.evaluate(()=>{
      const S=__MF.S(),txt=document.getElementById('view-root').textContent;
      const item=S.library.find(i=>i.titleEnglish&&txt.includes(i.title));
      return item?{id:item.id,main:item.title,en:item.titleEnglish}:null;
    });
    assert(visible,'a title with an English name is on the Library page');
    await p.evaluate(()=>App.mf565SetNameLang('','en'));
    await p.waitForTimeout(700);
    const shown=await p.evaluate(n=>{const txt=document.getElementById('view-root').textContent;return {en:txt.includes(n.en)};},visible);
    assert(shown.en,'the English name is shown');
    const found=await p.evaluate(n=>__MF.get('v53FilteredLibrary')('all','all','all',n.en.toLowerCase()).some(i=>i.id===n.id),visible);
    assert(found,'Library search finds a title by another name');
    const kept=await p.evaluate(n=>__MF.S().library.find(i=>i.id===n.id).title===n.main,visible);
    assert(kept,'the saved main title never changes');
    await p.evaluate(()=>App.mf565SetNameLang('','main'));

    // Title editor has the new section.
    const editor=await p.evaluate(id=>String(__MF.get('libraryModalHtml')(__MF.S().library.find(i=>i.id===id))).includes('data-mf565-editor'),setup.id);
    assert(editor,'title editor has Unit & Names');

    // Collection cover from a title.
    const cover=await p.evaluate(()=>{
      const S=__MF.S(),t=S.library.find(i=>i.id),c=S.collections[0];
      t.coverUrl='https://example.invalid/cover-a.jpg';c.mf565CoverTitleId=t.id;c.coverUrl='';
      const html1=__MF.get('v274CollectionCoverHtml')(c);
      t.coverUrl='https://example.invalid/cover-b.jpg';
      const html2=__MF.get('v274CollectionCoverHtml')(c);
      const kept=__MF.get('v274NormalizeCollection')(c).mf565CoverTitleId;
      return {a:html1.includes('cover-a.jpg'),b:html2.includes('cover-b.jpg'),kept};
    });
    assert(cover.a&&cover.b,'collection follows its title\'s cover');
    assert(cover.kept,'the collection keeps mf565CoverTitleId through normalizing');

    // XP for actions with the repeat rule.
    const xp=await p.evaluate(()=>{
      const S=__MF.S(),count=()=>Object.keys(S.xpLedger?.v348ActionEvents||{}).filter(k=>k.startsWith('mf565Action:')).length;
      __MF.run('MF565_XP.recent.clear()');
      const a=count();App.mf565SetProc('icon','ring');const b=count();App.mf565SetProc('icon','both');const c=count();
      return {a,b,c};
    });
    assert.equal(xp.b-xp.a,1,'a real change earns XP');
    assert.equal(xp.c-xp.b,0,'the same action again within 5 minutes earns nothing');

    // Away XP: credited once.
    const away=await p.evaluate(()=>{
      const S=__MF.S(),l=S.xpLedger;const from=Date.now()-60*60*1000;l.mf565LastSeenAt=from;
      const x1=MediaFlowV565.creditAway();l.mf565LastSeenAt=from;const x2=MediaFlowV565.creditAway();
      return {x1,x2,key:!!l.v348ActionEvents['mf565Away:'+from]};
    });
    assert(away.x1>0&&away.key,'an hour away earns XP');
    assert.equal(away.x2,0,'the same away time is never credited twice');

    // Get MediaFlow.
    await p.evaluate(()=>App.mf565OpenGet());
    await p.waitForFunction(()=>document.querySelectorAll('#mf565-get .mf565-get-dl').length>=7,null,{timeout:10000});
    const get=await p.evaluate(()=>({cards:document.querySelectorAll('#mf565-get .mf565-get-card').length,
      text:document.getElementById('mf565-get').innerText}));
    assert.equal(get.cards,6,'Android, Windows, Mac, Linux, iPhone and Web (v568)');
    assert(/6\.0\.0\.565/.test(get.text),'shows the latest stable version');
    await p.evaluate(()=>App.mf565CloseGet());

    // FAQ.
    const faq=await p.evaluate(()=>__MF.get('V383_FAQS').some(f=>/Log any title|own unit/i.test(f.question)));
    assert(faq,'FAQ has the v565 entries');

    assert.deepEqual(app.errors.filter(e=>!/favicon|ERR_|net::/i.test(e)),[],'no page errors');
    console.log('PASS v565 interface: task progress, + menu, Log any title + units, names, editor, collection cover, XP, away XP, Get MediaFlow, FAQ');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
