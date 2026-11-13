/* v576, in the real app: a full check of saving and moving data — the
 * persistence audit is clean, a full backup round-trips through import (and
 * reaches the cloud records), and a Settings Preset round-trips. */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate,cloudRow}=require('./harness/app.cjs');
(async()=>{
  const state=generate({titles:120});
  const store={row:cloudRow(state),writes:0,tables:{}};
  const A=await openApp({state,store});const p=A.page;p.on('dialog',d=>d.accept());
  try{
    await p.waitForFunction(()=>window.MediaFlowV556.stats().migrated===true,null,{timeout:180000});
    const r=await p.evaluate(async()=>{
      const S=__MF.S(),get=__MF.get,wait=ms=>new Promise(r=>setTimeout(r,ms));
      const audit=App.v507AuditPersistence();
      const t=S.library[3];
      Object.assign(t,{mf565Unit:'matches',mf565SecondsPerUnit:1200,modifiedAt:Date.now()});
      Object.assign(S.settings,{mf566LogTime:'added',mf565TitleNames:{global:'en',categories:{}},v453RecoveryPresets:{[t.categoryId]:{cover:['steam']}}});
      await __MF.saveState();await wait(300);
      const full=JSON.parse(JSON.stringify(get('v148BuildFullBackup')()));
      S.library.splice(0,2);S.settings.mf566LogTime='unit';delete S.settings.v453RecoveryPresets;
      await __MF.saveState();await wait(300);
      await App.importJSON(new File([JSON.stringify(full)],'b.json',{type:'application/json'}));await wait(3000);
      const back={titles:S.library.length,want:full.library.length,unit:S.library.find(x=>x.id===t.id)?.mf565Unit,
        logTime:S.settings.mf566LogTime,presets:!!S.settings.v453RecoveryPresets};
      const preset=JSON.parse(JSON.stringify(get('v196BuildSettingsPreset')()));
      const wantSettings=JSON.stringify(S.settings.mf565TitleNames);
      S.settings.mf565TitleNames={global:'main',categories:{}};
      await App.importSettingsPreset(new File([JSON.stringify(preset)],'s.json',{type:'application/json'}));await wait(1500);
      return {audit:{ok:audit.ok,issues:audit.issues},back,presetOk:JSON.stringify(S.settings.mf565TitleNames)===wantSettings};
    });
    assert(r.audit.ok,'persistence audit clean: '+JSON.stringify(r.audit.issues));
    assert.equal(r.back.titles,r.back.want,'the backup brings every title back');
    assert.equal(r.back.unit,'matches');assert.equal(r.back.logTime,'added');assert(r.back.presets);
    assert(r.presetOk,'Settings Preset round trip');
    const recs=[...store.tables.mediaflow_records.values()].filter(x=>x.kind==='library'&&!x.deleted).length;
    assert.equal(recs,r.back.want,'the imported Library reached the cloud records');
    console.log('PASS v576 audit: clean audit, backup and preset round trips, cloud records');
  }finally{await A.close();}
})().catch(e=>{console.error(e);process.exit(1);});
