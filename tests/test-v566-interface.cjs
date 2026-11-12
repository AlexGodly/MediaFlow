/* v566 interface, in the real app (Chrome through the test harness):
 * Get MediaFlow (icons, Your devices, browsers recorded as devices, download
 * icon on the Settings button), Details Recovery Select all / Deselect all,
 * ratings from Details Recovery and the refresh rule, log times (per unit,
 * per added title, split by day) through the real submitLog chain. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {openApp,generate}=require('./harness/app.cjs');
const {nav}=require('./harness/measure.cjs');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const version=Number(read('VERSION').trim());
assert(version>=566);
const runtime=JSON.parse(read('src/js/runtime-order.json'));
for(const f of ['416-v566-get-mediaflow','417-v566-recovery-ratings','418-v566-log-times'])
  assert(runtime.includes('components/'+f+'.js'),f+' is in the runtime order');

const RELEASE={tag_name:'mediaflowapp-v7.0.0.566',prerelease:false,draft:false,html_url:'https://github.com/AlexGodly/MediaFlowApp/releases/tag/mediaflowapp-v7.0.0.566',published_at:'2026-11-13T10:00:00Z',
  assets:['Android.apk','Android-arm64-v8a.apk','Android-armeabi-v7a.apk','Android-x86_64.apk','Windows-x64-Setup.exe','Windows-x64-portable.zip','iOS-unsigned.ipa']
    .map(s=>({name:'MediaFlow-7.0.0.566-'+s,size:52428800,browser_download_url:'https://example.invalid/'+s}))};
const DAY=86400000;

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

    /* ---------- Get MediaFlow ---------- */
    await p.evaluate(()=>{
      const S=__MF.S(),now=Date.now();
      S.settings.mf565AppDevices={'app-a':{platform:'android',version:'6.1.0.565',label:'Android phone',lastSeen:now},
        'app-w':{platform:'windows',version:'7.0.0.566',label:'DESKTOP-1',lastSeen:now},
        'app-old':{platform:'ios',version:'1.0.0',label:'Old iPad',lastSeen:now-400*86400000}};
      MediaFlowV566.reportWebDevice();
    });
    const web=await p.evaluate(()=>Object.values(__MF.S().settings.mf566WebDevices||{}));
    assert.equal(web.length,1,'this browser is recorded as a device');
    assert.equal(web[0].platform,'web');assert(Number(web[0].version)>=566,'with the website version');
    await p.evaluate(()=>App.mf565OpenGet());
    await p.waitForFunction(()=>document.querySelectorAll('#mf565-get .mf565-get-dl').length>=7&&document.querySelector('#mf565-get .mf566-devices'),null,{timeout:10000});
    const get=await p.evaluate(()=>{
      const root=document.getElementById('mf565-get');
      return {devices:[...root.querySelectorAll('.mf566-devices li')].map(li=>li.innerText.replace(/\s+/g,' ')),
        icons:[...root.querySelectorAll('.mf565-get-card .mf565-get-icon')].every(i=>i.querySelector('svg,img,.mf567-logo')),
        emoji:/🤖|🪟|🌐/.test(root.innerHTML),
        dlIcons:[...root.querySelectorAll('.mf565-get-dl')].every(a=>a.querySelector('svg')),
        check:!!root.querySelector('.mf565-get-status .mf566-btn svg')};
    });
    assert.equal(get.devices.length,3,'Your devices: phone, PC and this browser (stale device hidden): '+get.devices.join(' / '));
    assert(get.devices.some(d=>/Android phone/.test(d)&&/Update available/.test(d)),'the phone needs the update');
    assert(get.devices.some(d=>/DESKTOP-1/.test(d)&&/Up to date/.test(d)),'the PC is up to date');
    assert(get.devices.some(d=>/This device/.test(d)&&/Website v/.test(d)),'this browser is checked against the website');
    assert(get.icons&&!get.emoji,'platform cards use icons, not emoji');
    assert(get.dlIcons&&get.check,'download and check-for-updates buttons have icons');
    await p.evaluate(()=>App.mf565CloseGet());
    await nav(p,'settings');await p.waitForTimeout(900);
    const settingsBtn=await p.evaluate(()=>{const b=document.querySelector('.mf565-get-settings [onclick*="mf565OpenGet"]');return b?{svg:!!b.querySelector('svg'),text:b.textContent.trim()}:null;});
    if(settingsBtn){assert(settingsBtn.svg,'the green Get MediaFlow button has the download icon');assert.equal(settingsBtn.text,'Get MediaFlow');}

    /* ---------- Details Recovery: Select all / Deselect all ---------- */
    const sel=await p.evaluate(()=>{
      const S=__MF.S(),item=S.library[0];
      const proposals=[
        {token:'legacy.synopsis',label:'Synopsis',options:[{value:'x',sources:[{provider:'anilist',confidence:1}],confidence:1}],selected:false,status:'review',choice:0},
        {token:'legacy.genres',label:'Genres',options:[{value:['a'],sources:[{provider:'anilist',confidence:1}],confidence:1}],selected:true,status:'ready',choice:0},
        {token:'legacy.year',label:'Year',options:[{value:2020,sources:[{provider:'anilist',confidence:1}],confidence:1}],selected:false,status:'protected',protected:true,choice:0},
        {token:'legacy.studios',label:'Studios',options:[{value:['s'],sources:[{provider:'anilist',confidence:1}],confidence:1}],selected:false,status:'existing',hasOriginal:true,choice:0}];
      __MF.run('MF439').preview={itemId:String(item.id),failures:[],preview:{title:item.title,results:1,providers:['anilist'],errors:[],proposals}};
      __MF.get('mf439Dialog')('Recover metadata · '+item.title,__MF.get('mf439PreviewHtml')());
      const tools=!!document.querySelector('#mf439-recovery-modal .mf566-select-tools');
      App.mf566SelectFields(false);
      const none=proposals.map(p=>p.selected);
      const saveDisabled=document.querySelector('#mf439-recovery-modal .mf439-preview-actions .btn-primary').disabled;
      App.mf566SelectFields(true);
      const all=proposals.map(p=>p.selected);
      const boxes=[...document.querySelectorAll('#mf439-recovery-modal .mf439-proposal-head input')].map(b=>b.checked);
      __MF.get('mf439Close')();
      return {tools,none,all,boxes,saveDisabled};
    });
    assert(sel.tools,'Select all / Deselect all are shown');
    assert.deepEqual(sel.none,[false,false,false,false],'Deselect all clears every field');
    assert.equal(sel.saveDisabled,true,'nothing selected: Save is disabled');
    assert.deepEqual(sel.all,[true,true,false,false],'Select all never picks protected or existing fields');
    assert.deepEqual(sel.boxes,[true,true,false,false],'checkboxes follow');

    /* ---------- ratings from Details Recovery ---------- */
    const rat=await p.evaluate(()=>{
      const S=__MF.S(),A=MediaFlowV566;
      const mk=()=>({id:'t'+Math.random(),title:'Rating Test',categoryId:S.library[0].categoryId,universalMetadata:{}});
      const prop=(key,score,provider,{original=null,disagree=false}={})=>({token:'rating.'+key,options:[{value:{score,scale:10,votes:null},sources:[{provider,recordId:'r1',confidence:1}],confidence:1}],
        choice:0,original,hasOriginal:!!original,protected:false,same:false,disagree,selected:true,status:original?'existing':'ready'});
      // 1. Empty rating: recovery fills it and marks it.
      const a=mk();A.applyRecovery(a,{titleId:a.id,proposals:[prop('mal',8.1,'jikan')]},'review');
      const r1=a.universalMetadata.externalRatings?.mal,p1=a.universalMetadata.provenance?.['rating.mal'];
      // 2. Automatic rating with a different value: recovery updates it.
      const b=mk();b.universalMetadata={externalRatings:{mal:{score:7,scale:10,votes:null,source:'simkl'}},provenance:{'rating.mal':{source:'simkl',verified:true}}};
      const pb=prop('mal',8.4,'jikan',{original:{score:7,scale:10}});
      A.proposals; // proposal flags are set by mf439Proposals; mirror them here
      Object.assign(pb,{mf566RatingUpdate:true,hasOriginal:false,status:'update'});
      A.applyRecovery(b,{titleId:b.id,proposals:[pb]},'review');
      const r2=b.universalMetadata.externalRatings.mal,p2=b.universalMetadata.provenance['rating.mal'];
      // 3. Manual rating: never changed.
      const c=mk();c.universalMetadata={externalRatings:{mal:{score:5,scale:10,votes:null,source:'manual'}},provenance:{'rating.mal':{source:'manual',verified:false}},locks:{'rating.mal':true}};
      const pc=prop('mal',9,'jikan',{original:{score:5,scale:10}});Object.assign(pc,{mf566RatingUpdate:true,hasOriginal:false});
      A.applyRecovery(c,{titleId:c.id,proposals:[pc]},'review');
      const r3=c.universalMetadata.externalRatings.mal.score;
      // 4. Refresh: a recovery rating takes a newer value from any verified source…
      const d=mk();d.universalMetadata={externalRatings:{mal:{score:8.1,scale:10,votes:null,source:'jikan'}},provenance:{'rating.mal':{source:'jikan',verified:true,recordId:'r1',via:'recovery'}}};
      A.applyRatings(d,{accepted:[{provider:'simkl',recordId:'s9',ratings:{mal:{score:8.3,scale:10}}}],discovered:{}});
      const r4=d.universalMetadata.externalRatings.mal.score,p4=d.universalMetadata.provenance['rating.mal'];
      // 5. …and is left alone when there is nothing new.
      const e=mk();e.universalMetadata={externalRatings:{mal:{score:8.1,scale:10,votes:null,source:'jikan'}},provenance:{'rating.mal':{source:'jikan',verified:true,recordId:'r1',via:'recovery'}}};
      A.applyRatings(e,{accepted:[],discovered:{}});
      const r5=e.universalMetadata.externalRatings.mal.score;
      // 6. A non-recovery rating from another source keeps the old rule (not replaced).
      const f=mk();f.universalMetadata={externalRatings:{mal:{score:7,scale:10,votes:null,source:'jikan'}},provenance:{'rating.mal':{source:'jikan',verified:true,recordId:'r1'}}};
      A.applyRatings(f,{accepted:[{provider:'simkl',recordId:'s9',ratings:{mal:{score:9,scale:10}}}],discovered:{}});
      const r6=f.universalMetadata.externalRatings.mal.score;
      return {r1:r1?.score,via1:p1?.via,r2:r2.score,via2:p2.via,src2:p2.source,r3,r4,via4:p4.via,r5,r6};
    });
    assert.equal(rat.r1,8.1);assert.equal(rat.via1,'recovery','a filled rating is marked as a recovery rating');
    assert.equal(rat.r2,8.4,'recovery updates an automatic rating with a newer value');assert.equal(rat.via2,'recovery');assert.equal(rat.src2,'jikan');
    assert.equal(rat.r3,5,'a rating you entered is never changed');
    assert.equal(rat.r4,8.3,'refresh updates a recovery rating with a newer value');assert.equal(rat.via4,'recovery');
    assert.equal(rat.r5,8.1,'no new value: the rating is kept');
    assert.equal(rat.r6,7,'other ratings keep the same-source refresh rule');

    /* ---------- log times ---------- */
    const pure=await p.evaluate(D=>{
      const A=MediaFlowV566,now=Date.now(),t0=now-2*D,t1=now-D;
      const units=[{id:'u1',number:1,loggedAt:t0,durationSeconds:1200},{id:'u2',number:2,loggedAt:t0+60000,durationSeconds:1200},
        {id:'u3',number:3,loggedAt:t1,durationSeconds:1200},{id:'u4',number:4,loggedAt:now,durationSeconds:1200}];
      const base=()=>({id:'s1',timestamp:now,date:new Date(now).toISOString().slice(0,10),status:'complete',xp:100,actualAmount:4,minutes:80,
        v369DurationSeconds:4800,sessionGroupId:'g1',titles:[{title:'A',libraryId:'L1',qty:4,loggedAt:t0,v369Itemized:true,v369Units:units.map(u=>({...u}))}]});
      const draft=new Map([['id:L1',{added:t0}]]);
      const split=A.redateSession(base(),draft,'unit');
      const added=A.redateSession(base(),draft,'added');
      const single=A.redateSession({...base(),titles:[{title:'B',libraryId:'L2',qty:2,loggedAt:t1}]},new Map([['id:L2',{added:t1}]]),'unit');
      return {
        days:split.map(s=>s.date),ids:split.map(s=>s.id),xp:split.map(s=>s.xp),amount:split.map(s=>s.actualAmount),
        minutes:split.map(s=>s.minutes),status:split.map(s=>s.status),units:split.map(s=>s.titles[0].v369Units.length),
        parts:split.map(s=>s.mf566Split&&s.mf566Split.part+'/'+s.mf566Split.of),
        expect:[t0,t1,now].map(x=>new Date(x).toISOString().slice(0,10)),
        added:added.map(s=>s.date),singleDate:single[0].date,singleTs:single[0].timestamp===t1,t1Day:new Date(t1).toISOString().slice(0,10)};
    },DAY);
    assert.deepEqual(pure.days,pure.expect,'one session per day the units were logged');
    assert.equal(pure.ids[2],'s1','the latest day keeps the session id');
    assert.equal(pure.xp.reduce((a,b)=>a+b,0),100,'XP total unchanged');assert.deepEqual(pure.xp,[50,25,25]);
    assert.equal(pure.amount.reduce((a,b)=>a+b,0),4,'amount total unchanged');
    assert.deepEqual(pure.minutes,[40,20,20],'itemized minutes follow each unit');
    assert.deepEqual(pure.status,['logged','logged','complete'],'the outcome stays on the latest day');
    assert.deepEqual(pure.units,[2,1,1]);assert.deepEqual(pure.parts,['1/3','2/3','3/3']);
    assert.deepEqual(pure.added,[pure.expect[0]],'"when added": everything on the day the title was added');
    assert.equal(pure.singleDate,pure.t1Day,'a quick-logged title counts on the day it was added');assert(pure.singleTs);

    // Real submit chain: a log kept open since two days ago.
    const real=await p.evaluate(D=>{
      const S=__MF.S(),get=__MF.get;
      S.settings.mf566LogTime='unit';
      const item=S.library.find(i=>i.status!=='completed'&&i.status!=='dropped');
      const item2=S.library.find(i=>i!==item&&i.categoryId===item.categoryId&&i.status!=='completed'&&i.status!=='dropped');
      const before=S.sessions.length,now=Date.now();
      App.startSession?.();if(!S.currentTask)S.currentTask=get('generateTask')();
      App.openLogForm();
      const d=S.logDraft;
      d.v369Interface='classic';d.amount=2;d.minutes=60;d.updateLibrary=false;
      d.entries=[{libraryId:item.id,title:item.title,qty:1,loggedAt:now-2*D,isNew:false},{libraryId:item2.id,title:item2.title,qty:1,loggedAt:now,isNew:false}];
      let err='';try{App.submitLog();}catch(e){err=String(e&&e.message||e);}
      const added=S.sessions.slice(before).filter(s=>s.status!=='skipped');
      return {err,logging:S.logging,dates:added.map(s=>s.date).sort(),
        expect:[now-2*D,now].map(x=>new Date(x).toISOString().slice(0,10)),
        split:added.every(s=>s.mf566Split&&s.mf566Split.of===2),
        streakToday:get('v149BuildStreakMap')(S.sessions).get(new Date(now).toISOString().slice(0,10))||0};
    },DAY);
    assert.equal(real.err,'','submitLog ran: '+real.err);
    assert.notEqual(real.logging,true,'the log was saved');
    assert.deepEqual(real.dates,real.expect,'saved sessions sit on the days the titles were logged');
    assert(real.split,'the session was split by day');

    /* ---------- recovery performance: batched saves, safe checkpoints ---------- */
    const meta=await p.evaluate(async()=>{
      const S=__MF.S(),get=__MF.get,run=__MF.run;
      let saves=0;const restore=__MF.wrap('saveState',o=>function(){saves++;return o.apply(this,arguments);});
      const discover=__MF.wrap('mf439Discover',o=>async function(item){return {results:[],failures:[],preview:{titleId:String(item.id),
        proposals:[{token:'legacy.mediaSource',label:'Source',options:[{value:'Original',sources:[{provider:'anilist',recordId:'1',confidence:1}],confidence:1}],choice:0,selected:true,status:'ready',hasOriginal:false,protected:false,same:false,disagree:false}],mf565Names:[]}};});
      const ids=S.library.slice(0,25).map(i=>{delete i.mediaSource;return String(i.id);});
      const gaps=[];const saveJob=__MF.wrap('mf439SaveJob',o=>function(){const r=o.apply(this,arguments);
        try{const j=JSON.parse(localStorage.getItem(get('mf439StateKey')())||'null');if(j)gaps.push(run('MF439').job.cursor-j.cursor);}catch(_){}return r;});
      const M=run('MF439');M.working=false;M.cancel=false;
      M.job={schema:1,id:'job-v566',account:get('mf439Account')(),ids,cursor:0,changed:0,completed:0,errors:[],startedAt:Date.now(),status:'running'};
      await get('mf439RunBatch')();
      const out={status:M.job.status,filled:ids.filter(id=>S.library.find(i=>String(i.id)===id).mediaSource==='Original').length,saves,
        maxGap:Math.max(...gaps),stored:JSON.parse(localStorage.getItem(get('mf439StateKey')())||'null')?.cursor,
        pending:MediaFlowV566.recoverySave.state.metadata.pending};
      window.__r1=restore;__MF.run('saveState=window.__r1');window.__r2=discover;__MF.run('mf439Discover=window.__r2');window.__r3=saveJob;__MF.run('mf439SaveJob=window.__r3');
      return out;
    });
    assert.equal(meta.status,'completed');assert.equal(meta.filled,25,'every title recovered');
    assert(meta.saves<=4,'account saved in batches, not per title: '+meta.saves+' saves');
    assert(meta.maxGap<=9,'the checkpoint never passes more than 9 unsaved titles');
    assert.equal(meta.stored,25,'final checkpoint is complete');assert.equal(meta.pending,0,'nothing left unsaved');
    const paint=await p.evaluate(async()=>{
      const run=__MF.run,get=__MF.get,M=run('MF439');
      M.job={schema:1,id:'paint',account:get('mf439Account')(),ids:['a','b'],cursor:0,changed:0,completed:0,errors:[],status:'running'};M.working=true;
      let real=0;const r=__MF.wrap('mf441WidgetHtml',o=>function(){real++;return o.apply(this,arguments);});
      for(let i=0;i<40;i++)get('mf439PaintJob')();
      await new Promise(res=>setTimeout(res,400));
      window.__r4=r;__MF.run('mf441WidgetHtml=window.__r4');
      M.working=false;M.job.status='paused';get('mf439PaintJob')();
      return real;
    });
    assert(paint<=6,'40 progress updates in a burst repaint only a few times: '+paint);

    assert.deepEqual(app.errors.filter(e=>!/favicon|ERR_|net::/i.test(e)),[],'no page errors');
    console.log('PASS v566 interface: Get MediaFlow devices + icons, Select all / Deselect all, recovery ratings + refresh rule, log times, recovery performance');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
