/* v555 data, sync and PWA audit in the real app. Every path must return the
 * data unchanged: cloud save/reload, Sync Now, Full Backup export/import,
 * automatic export, Settings preset, Personal Order, Collections, History
 * export, XP recount and the PWA shell. Built-in audits (v470/v507/v535) must
 * report no issues for v555. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {openApp,ROOT}=require('./harness/app.cjs');
// Expected, non-data differences: today's active-time XP keeps accruing while
// the app is open, and two Jikan settings are created empty on first load.
const strip=s=>{const x=JSON.parse(JSON.stringify(s));delete x.savedAt;
  const today=new Date();const key=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
  if(x.xpLedger?.v334ActiveTimeDays)delete x.xpLedger.v334ActiveTimeDays[key];
  for(const k of ['v377JikanLedger','v377JikanResults'])if(x.settings&&(x.settings[k]==null||JSON.stringify(x.settings[k])==='{}'||x.settings[k]?.lastCheckedAt===0))delete x.settings[k];
  return x;};
// Data is preserved when every value that existed before is still there and
// unchanged. Newly filled defaults are allowed; list order must match where
// order is meaningful (Library, History, Personal Order, collection order).
const ORDERED=/^\.(library|sessions|activityLog|collections|orderPlan\.titleIds|collections\[[^\]]+\]\.(order|titleIds))$/;
function lost(a,b,pfx='',out=[]){
  if(out.length>20)return out;
  if(a===undefined)return out;
  if(JSON.stringify(a)===JSON.stringify(b))return out;
  if(Array.isArray(a)){
    if(!Array.isArray(b)){out.push(pfx+': was a list');return out;}
    const id=v=>v&&typeof v==='object'?String(v.id??v.libraryId??JSON.stringify(v)):JSON.stringify(v);
    const mb=new Map(b.map(v=>[id(v),v]));
    for(const v of a){const k=id(v);if(!mb.has(k)){out.push(pfx+'['+k.slice(0,40)+'] missing');continue;}lost(v,mb.get(k),pfx+'['+k.slice(0,40)+']',out);}
    if(ORDERED.test(pfx)&&a.map(id).join('|')!==b.map(id).filter(k=>a.some(v=>id(v)===k)).join('|'))out.push(pfx+': order changed');
    return out;
  }
  if(a&&typeof a==='object'){
    if(!b||typeof b!=='object'){out.push(pfx+': was an object');return out;}
    for(const k of Object.keys(a))lost(a[k],b[k],pfx+'.'+k,out);
    return out;
  }
  out.push(pfx+': '+JSON.stringify(a)?.slice(0,60)+' → '+JSON.stringify(b)?.slice(0,60));
  return out;
}
function diffKeys(a,b){const out=lost(a,b);if(out.length)console.log('LOST',out.join('\n'));return out;}
(async()=>{
  const app=await openApp({titles:Number(process.env.MF555_TITLES||2000)});
  const p=app.page;
  p.on('dialog',d=>d.accept());
  const toasts=[];
  const download=async fn=>{const [dl]=await Promise.all([p.waitForEvent('download',{timeout:60000}),p.evaluate(fn)]);return {name:dl.suggestedFilename(),text:fs.readFileSync(await dl.path(),'utf8')};};
  const snap=()=>p.evaluate(()=>JSON.parse(JSON.stringify(__MF.snapshot())));
  const xp=()=>p.evaluate(()=>{const t=document.querySelector('.sidebar')?.textContent||'';return (t.match(/([\d,]+) XP total/)||[])[1]||'';});
  const settle=async(ms=1500)=>{await p.waitForTimeout(ms);await p.waitForFunction(()=>!document.querySelector('.data-progress:not(.done),#data-progress:not(.done)'),null,{timeout:120000}).catch(()=>{});};
  // Imports may wait for a choice in a dialog: start them without awaiting.
  const importFile=async(fnName,name,text)=>{await p.evaluate(([f,n,t])=>{window.__mf555Import=Promise.resolve(App[f](new File([t],n,{type:/csv$/.test(n)?'text/csv':'application/json'}))).catch(e=>String(e));},[fnName,name,text]);await settle(2500);};
  const dialogButtons=()=>p.evaluate(()=>[...document.querySelectorAll('.modal-overlay button,.mf274-overlay button,[role=dialog] button,[role=alertdialog] button')].filter(b=>b.offsetParent).map(b=>b.textContent.trim()).filter(Boolean));
  try{
    await p.evaluate(()=>{window.__toasts=[];__MF.wrap('showToast',o=>function(m){window.__toasts.push(String(m));return o.apply(this,arguments);});});
    await p.waitForTimeout(2000);
    // v556+: run every check on the per-record storage (after the one-time move).
    const recordStore=await p.evaluate(()=>!!window.MediaFlowV556);
    if(recordStore)await p.waitForFunction(()=>window.MediaFlowV556.stats().migrated===true,null,{timeout:300000});
    // Normalise once (completion records etc.) exactly as a real account already is.
    const first=await download(()=>App.exportJSON());
    await importFile('importJSON','normalise.json',first.text);
    await p.evaluate(()=>App.calculateXPNow());await settle(3000);
    await p.evaluate(()=>__MF.saveState());

    // 1. Built-in audits.
    console.log('step 1',(Date.now()/1000|0)%10000);
    const audits=await p.evaluate(async()=>({v470:await window.MediaFlowV470.audit(),v507:await window.MediaFlowV507.audit(),
      v535:await window.MediaFlowV535.audit(),pwa:await window.MediaFlowV470.pwaAudit?.()}));
    const issues=o=>o?.issues||o?.failures||[];
    assert.deepEqual(issues(audits.v507),[],'v507 audit: '+JSON.stringify(issues(audits.v507)));
    assert.deepEqual(issues(audits.v535),[],'v535 audit: '+JSON.stringify(issues(audits.v535)));
    assert(audits.v470?.ok!==false,'v470 data audit: '+JSON.stringify(issues(audits.v470)));

    // 2. Cloud: save, reload, identical.
    console.log('step 2',(Date.now()/1000|0)%10000);
    const xpBefore=await xp();
    const before=await snap();
    await p.evaluate(()=>__MF.saveState());
    await p.reload({waitUntil:'domcontentloaded'});
    await p.waitForFunction(()=>window.__MF&&__MF.S()?.library?.length>0&&document.querySelector('#app .sidebar'),null,{timeout:180000});
    p.on('dialog',d=>d.accept());
    await p.waitForTimeout(2500);
    const reloaded=await snap();
    assert.deepEqual(diffKeys(strip(before),strip(reloaded)),[],'cloud reload must return identical data');
    assert.equal(await xp(),xpBefore,'XP identical after reload');

    // 3. Sync Now: succeeds and leaves data unchanged.
    console.log('step 3',(Date.now()/1000|0)%10000);
    await p.evaluate(()=>App.syncNow());await settle(3000);
    assert.deepEqual(diffKeys(strip(reloaded),strip(await snap())),[],'Sync Now must not change data');

    // 4. XP recount equals the running total.
    console.log('step 4',(Date.now()/1000|0)%10000);
    await p.evaluate(()=>App.calculateXPNow());await settle(3000);
    assert.equal(await xp(),xpBefore,'Calculate XP must match the running total');

    // 5. Full Backup: export → damage → import → identical (and idempotent).
    console.log('step 5',(Date.now()/1000|0)%10000);
    const full=await download(()=>App.exportJSON());
    assert.equal(JSON.parse(full.text).mediaFlowVersion,Number(fs.readFileSync(path.join(ROOT,'VERSION'),'utf8').trim()),'backup stamped with the current version');
    const base=await snap();
    await p.evaluate(()=>{const S=__MF.S();S.library.splice(0,40);S.sessions.splice(0,25);S.collections=[];S.orderPlan.titleIds=[];});
    await importFile('importJSON','full.json',full.text);
    assert.deepEqual(diffKeys(strip(base),strip(await snap())),[],'Full Backup import restores everything');
    // Large-account export path (sliced) produces the same JSON content.
    const sliced=await p.evaluate(async()=>{const b=__MF.get('v148BuildFullBackup')();const parts=await window.MediaFlowV555Save.stringify(b);return parts.join('')===JSON.stringify(b);});
    assert(sliced,'sliced backup serialization equals JSON.stringify');

    // 6. Automatic export uses the same complete snapshot.
    console.log('step 6',(Date.now()/1000|0)%10000);
    const auto=await p.evaluate(()=>{const a=__MF.get('backupSnapshot')(),f=__MF.get('v148BuildFullBackup')();
      return {lib:a.library?.length===f.library?.length,sessions:a.sessions?.length===f.sessions?.length,settings:JSON.stringify(a.settings)===JSON.stringify(f.settings)};});
    assert(auto.lib&&auto.sessions&&auto.settings,'automatic export is the full backup');

    // 7. Settings preset round trip.
    console.log('step 7',(Date.now()/1000|0)%10000);
    const preset=await download(()=>App.exportSettingsPreset());
    const settingsBefore=await p.evaluate(()=>JSON.stringify(__MF.S().settings));
    await p.evaluate(()=>{const S=__MF.S();S.settings.v547ExternalRatingRefresh={enabled:false,intervalHours:24,refreshExisting:true};S.settings.v441RecoveryUI={visibility:'hidden'};});
    await importFile('importSettingsPreset','settings.json',preset.text);
    const settingsAfter=await p.evaluate(()=>JSON.stringify(__MF.S().settings));
    assert.deepEqual(lost(JSON.parse(settingsBefore),JSON.parse(settingsAfter),'.settings'),[],'Settings preset restores every setting');

    // 8. Personal Order round trip.
    console.log('step 8',(Date.now()/1000|0)%10000);
    const order=await download(()=>App.v142ExportOrder());
    const orderBefore=await p.evaluate(()=>JSON.stringify(__MF.S().orderPlan));
    await p.evaluate(()=>{__MF.S().orderPlan.titleIds.reverse();});
    await importFile('v142ImportOrder',order.name,order.text);
    await p.evaluate(()=>{for(const b of document.querySelectorAll('.modal-overlay button,.mf274-overlay button'))if(/replace|import|apply|confirm/i.test(b.textContent)){b.click();break;}});
    await settle(1500);
    assert.equal(await p.evaluate(()=>JSON.stringify(__MF.S().orderPlan.titleIds)),JSON.stringify(JSON.parse(orderBefore).titleIds),'Personal Order restored in the same order');

    // 9. Collections round trip.
    console.log('step 9',(Date.now()/1000|0)%10000);
    const cols=await download(()=>App.v279ExportCollections());
    const colsBefore=await p.evaluate(()=>JSON.stringify(__MF.S().collections.map(c=>({id:c.id,title:c.title,order:c.order}))));
    await p.evaluate(()=>{__MF.S().collections=[];});
    await importFile('v279ImportCollections',cols.name,cols.text);
    console.log('collections dialog:',JSON.stringify(await dialogButtons()));
    await p.evaluate(()=>{for(const b of document.querySelectorAll('.modal-overlay button,.mf274-overlay button'))if(/replace|import|apply|confirm|merge/i.test(b.textContent)){b.click();break;}});
    await settle(1500);
    const colsAfter=await p.evaluate(()=>JSON.stringify(__MF.S().collections.map(c=>({id:c.id,title:c.title,order:c.order}))));
    assert.equal(colsAfter,colsBefore,'Collections restored with titles and order');

    // 10. History exports cover every log.
    console.log('step 10',(Date.now()/1000|0)%10000);
    const logs=await download(()=>App.v271ExportLogsCSV());
    const consumption=await download(()=>App.v271ExportConsumptionCSV());
    const sessions=await p.evaluate(()=>__MF.S().sessions.length);
    const rows=t=>t.trim().split(/\r?\n/).length-1;
    assert(rows(logs.text)>=sessions||rows(consumption.text)>=sessions,'History export includes every log ('+rows(logs.text)+'/'+rows(consumption.text)+' rows, '+sessions+' logs)');

    // 11. PWA shell lists the current bundles and nothing that was merged away.
    console.log('step 11',(Date.now()/1000|0)%10000);
    const sw=fs.readFileSync(path.join(ROOT,'sw.js'),'utf8'),index=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
    const v=fs.readFileSync(path.join(ROOT,'VERSION'),'utf8').trim();
    assert(sw.includes('mediaflow-v'+v+'.bundle.js')&&sw.includes('mediaflow-v'+v+'.bundle.css'),'service worker caches the v'+v+' bundles');
    assert(!/assets\/css\/\d+-v\d+[^"']*\.css/.test(sw),'service worker no longer lists individual stylesheets');
    assert(index.includes('assets/css/mediaflow-v'+v+'.bundle.css'),'index loads the stylesheet bundle');
    const errs=app.errors.filter(e=>!/Failed to load resource/.test(e));
    assert.deepEqual(errs,[],'no page errors');
    if(recordStore)assert.equal(await p.evaluate(()=>window.MediaFlowV556.stats().migrated),true,'checks ran on record storage');
    console.log('PASS v555 data audit'+(recordStore?' (record storage)':'')+': cloud reload, Sync Now, XP recount, Full Backup, automatic export, Settings, Personal Order, Collections, History export, PWA shell.');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
