/* v558: theme polish and a fast Add to Logging popup.
 *  - Library-like sort: the shared collator gives exactly the v557 order for every sort.
 *  - Add to Logging: the frame shows at once; the title list is built a handful of
 *    times on open (v557: ~50); typing in the search filters after a short pause.
 *  - Background Processes: the panel's minimise button sits beside the chevron with
 *    the same size; the minimised button has the + button's gradient and a job count.
 *  - External IDs: round radios (never stretched), grouped status chips, an
 *    "Already linked" list, and an Add button that counts the chosen IDs.
 *  - Nothing uses the old fixed dark fallback colours in a light theme. */
'use strict';
const assert=require('node:assert/strict');
const {openApp}=require('./harness/app.cjs');
const rgb=s=>{const t=String(s),n=(t.match(/\d*\.?\d+/g)||[]).slice(0,3).map(Number);return /^color\(srgb/.test(t)?n.map(v=>v*255):n;};
const light=s=>{const [r,g,b]=rgb(s);return (r*299+g*587+b*114)/1000>150;};
(async()=>{
  const A=await openApp({titles:3000});const p=A.page;
  try{
    await p.evaluate(()=>{const S=__MF.S();S.settings.appearanceMode='light';
      S.settings.v441RecoveryUI={...(S.settings.v441RecoveryUI||{}),visibility:'always'};App.setTheme('sakura');});
    await p.waitForTimeout(600);

    // 1. Same order as the v557 comparator for every sort key, both directions.
    const sortOk=await p.evaluate(()=>__MF.run(`(()=>{
      const lib=__MF.S().library.slice(0,1500);
      const old=(a,b,base,dir)=>{const d=v224SortDirection(dir)==='desc'?-1:1;
        const title=()=>cleanTitle(a?.title||'').localeCompare(cleanTitle(b?.title||''),undefined,{numeric:true,sensitivity:'base'});
        const n=v=>Number.isFinite(Number(v))?Number(v):0,rank={low:0,medium:1,high:2};let diff=0;
        switch(String(base||'title')){case 'title':diff=title();break;
          case 'priority':diff=(rank[String(a?.priority||'medium').toLowerCase()]??1)-(rank[String(b?.priority||'medium').toLowerCase()]??1);break;
          case 'rating':diff=n(a?.rating)-n(b?.rating);break;case 'progress':diff=n(a?.progress)-n(b?.progress);break;
          case 'total':diff=n(a?.total)-n(b?.total);break;
          case 'remaining':return v518CompareRemainingLibrary(a,b,v224SortDirection(dir))||title();
          case 'logging':diff=n(v53LastTouched(a))-n(v53LastTouched(b));break;
          case 'edited':diff=n(a?.modifiedAt||a?.createdAt)-n(b?.modifiedAt||b?.createdAt);break;
          case 'seen':diff=n(a?.lastSeenAt)-n(b?.lastSeenAt);break;case 'added':diff=n(a?.createdAt)-n(b?.createdAt);break;
          default:diff=title();}
        return (diff*d)||(title()*d);};
      const bad=[];
      for(const base of ['title','priority','rating','progress','total','remaining','logging','edited','seen','added'])
        for(const dir of ['asc','desc']){
          const x=lib.slice().sort((a,b)=>old(a,b,base,dir)).map(i=>i.id).join();
          const y=lib.slice().sort((a,b)=>v224CompareLibraryLike(a,b,base,dir)).map(i=>i.id).join();
          if(x!==y)bad.push(base+'/'+dir);
        }
      return bad;})()`));
    assert.deepEqual(sortOk,[],'v558 sort order differs for: '+sortOk.join(', '));

    // 2. Add to Logging: instant frame, few list builds, debounced search.
    await p.evaluate(()=>{const S=__MF.S();S.logging=false;S.logDraft=null;App.setView('history');});await p.waitForTimeout(600);
    const builds0=await p.evaluate(()=>MediaFlowV558.stats().listBuilds);
    const instant=await p.evaluate(()=>{App.mf555OpenLogPopup();return !!document.querySelector('#mf558-log-skeleton,#mf555-log-popup');});
    assert(instant,'the popup frame appears in the same task as the click');
    await p.waitForSelector('#mf555-log-popup.mf557-library-only .log-suggestion',{timeout:30000});
    await p.waitForTimeout(1500);
    assert(!(await p.$('#mf558-log-skeleton')),'skeleton removed once the popup is built');
    const builds=await p.evaluate(()=>MediaFlowV558.stats().listBuilds)-builds0;
    assert(builds<=8,'title list built '+builds+' times while opening (v557: ~50)');
    // Typing: nothing rebuilds per key; the list follows after a pause and is filtered.
    const t0=await p.evaluate(()=>MediaFlowV558.stats().listBuilds);
    await p.type('#mf555-log-popup #entry-title','Saga',{delay:25});
    const during=await p.evaluate(()=>MediaFlowV558.stats().listBuilds)-t0;
    await p.waitForTimeout(500);
    const after=await p.evaluate(()=>MediaFlowV558.stats().listBuilds)-t0;
    assert(during<=1&&after>=1,'search is debounced (during '+during+', after '+after+')');
    const rows=await p.evaluate(()=>[...document.querySelectorAll('#mf555-log-popup .log-suggestion b')].map(b=>b.textContent));
    assert(rows.length&&rows.every(t=>/saga/i.test(t)),'search filters the list: '+rows.slice(0,3).join(' | '));
    assert.equal(await p.evaluate(()=>__MF.S().entryDraft.title),'Saga','the draft keeps what was typed');
    // Themed: the sheet follows the light theme, not the old dark fallback.
    const sheetBg=await p.evaluate(()=>getComputedStyle(document.querySelector('#mf555-log-popup .mf555-log-sheet')).backgroundColor);
    assert(light(sheetBg),'popup sheet is light in a light theme: '+sheetBg);
    assert(await p.evaluate(()=>!!document.querySelector('#mf555-log-popup .mf558-added-pill')),'added count shown as a pill');
    await p.evaluate(()=>App.mf555CloseLogPopup());await p.waitForTimeout(400);

    // 3. Background Processes.
    await p.evaluate(()=>{const w=document.getElementById('mf441-process-widget');if(w&&!w.classList.contains('mf441-expanded'))App.mf441Toggle();});
    await p.waitForTimeout(500);
    const geo=await p.evaluate(()=>{const w=document.getElementById('mf441-process-widget');
      const m=w.querySelector('.mf555-proc-minimize').getBoundingClientRect(),c=w.querySelector('.mf476-toggle-chevron').getBoundingClientRect();
      const cs=getComputedStyle(w.querySelector('.mf555-proc-minimize'));
      return {dTop:Math.abs(m.top-c.top),dW:Math.abs(m.width-c.width),dH:Math.abs(m.height-c.height),gap:c.left-m.right,vis:cs.visibility,bg:cs.backgroundColor};});
    assert(geo.dTop<=1.5&&geo.dW<=1.5&&geo.dH<=1.5,'minimise matches the chevron row and size: '+JSON.stringify(geo));
    assert(geo.gap>=2&&geo.gap<=12,'minimise sits right beside the chevron: '+geo.gap);
    assert(geo.vis==='visible'&&light(geo.bg),'minimise is visible and light (no black square): '+geo.bg);
    await p.evaluate(()=>App.mf555MinimizeProcesses());await p.waitForTimeout(400);
    const mini=await p.evaluate(()=>{const b=document.querySelector('#mf555-proc-mini');const i=b.querySelector('.mf555-proc-icon');const cs=getComputedStyle(i);
      const fab=getComputedStyle(document.getElementById('mf397-fab'));
      return {jobs:b.dataset.mf558Jobs,img:cs.backgroundImage,fabImg:fab.backgroundImage,w:i.getBoundingClientRect().width};});
    assert.equal(mini.jobs,'0','job count recorded');
    assert(/gradient/.test(mini.img)&&mini.img===mini.fabImg,'minimised button uses the + button gradient');
    assert(mini.w>=50,'minimised button is a proper size: '+mini.w);
    await p.evaluate(()=>App.mf555RestoreProcesses());

    // 4. External IDs.
    await p.evaluate(()=>__MF.run(`(()=>{const it=__MF.S().library[1];it.externalIds={mal:'62811'};
      const host=document.createElement('div');host.id='mf558-test-host';host.style.cssText='position:fixed;left:0;top:0;width:900px;z-index:2147483000';
      host.innerHTML=mf434IdsEditorLookupHtml(it);document.body.appendChild(host);
      MF555ID.status=new Map([['tmdb',{state:'ok',note:'2 results'}],['anilist',{state:'ok',note:'No match'}],['omdb',{state:'error',note:'IMDb (OMDb) rejected the API key. Check the OMDB_API_KEY secret.'}],['kitsu',{state:'error',note:'kitsu HTTP 406'}]]);
      const row=(k,v,t,ex)=>[v,{key:k,value:v,title:t,year:'2016',type:'Movie',sources:new Set(['tmdb']),exact:ex,link:'https://example.org/'+v}];
      MF555ID.results=new Map([['tmdb',new Map([row('tmdb','1','A',false),row('tmdb','2','B',false)])],['anilist',new Map([row('anilist','7','C',true)])],['mal',new Map([row('mal','62811','D',true)])]]);
      document.getElementById('mf434-lookup-results').innerHTML=mf555IdResultsHtml(it);})()`));
    await p.waitForTimeout(100);
    const ids=await p.evaluate(()=>{const host=document.getElementById('mf558-test-host');
      const radio=host.querySelector('.mf558-id-row input[type=radio]');const cs=getComputedStyle(radio),r=radio.getBoundingClientRect();
      const chips=[...host.querySelectorAll('.mf558-chip')].map(c=>c.className.split(' ').find(x=>x.startsWith('is-'))+':'+c.textContent);
      return {appearance:cs.appearance,radius:cs.borderTopLeftRadius,w:r.width,h:r.height,
        add:host.querySelector('.mf558-id-add')?.textContent,disabled:host.querySelector('.mf558-id-add')?.disabled,
        linked:host.querySelector('.mf558-linked')?.textContent||'',chips,findPrimary:host.querySelector('.mf436-find-ids').classList.contains('btn-primary')};});
    assert.equal(ids.appearance,'none','custom radio');
    assert(ids.w===ids.h&&ids.w===20&&ids.radius==='50%','radio is a 20px circle: '+JSON.stringify(ids));
    assert(/Add 1 ID to this title/.test(ids.add)&&ids.disabled===false,'exact AniList match preselected and counted: '+ids.add);
    assert(/MyAnimeList[\s\S]*62811/.test(ids.linked),'saved ID listed under Already linked');
    assert(ids.chips.some(c=>/^is-found:TMDB/.test(c))&&ids.chips.some(c=>/^is-none:AniList/.test(c)),'chips grouped by result: '+ids.chips.join(' | '));
    assert(ids.chips.some(c=>/^is-error:IMDb \(OMDb\).*rejected the API key.*Needs API key$/.test(c)),'errors short, full message kept for screen readers');
    assert(ids.findPrimary,'Find IDs is a primary button');
    // Choose TMDB too: the count follows.
    await p.check('#mf558-test-host input[name="mf555-id-tmdb"][value="2"]');
    assert.match(await p.evaluate(()=>document.querySelector('#mf558-test-host .mf558-id-add').textContent),/Add 2 IDs to this title/);
    // Nothing chosen: the button explains itself and is disabled.
    await p.check('#mf558-test-host input[name="mf555-id-tmdb"][value=""]');
    await p.check('#mf558-test-host input[name="mf555-id-anilist"][value=""]');
    const none=await p.evaluate(()=>{const b=document.querySelector('#mf558-test-host .mf558-id-add');return [b.textContent,b.disabled];});
    assert.deepEqual(none,['Select IDs to add',true]);

    assert.deepEqual(A.errors.filter(e=>!/Failed to load resource/.test(e)),[],'no page errors');
    console.log('PASS v558 theme polish: same sort order, fast debounced Add to Logging, aligned minimise, themed mini button, clean External IDs.');
  }finally{await A.close();}
})().catch(e=>{console.error(e);process.exit(1);});
