/* v580, in the real app: Batch Log rows have "Customize total runtime", and
 * every Customize total runtime (Batch Log, Advanced logging) can take the
 * Stopwatch's time or the Runtime Calculator's result. */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate}=require('./harness/app.cjs');
(async()=>{
  const app=await openApp({state:generate({titles:30})});const p=app.page;
  try{
    await p.waitForTimeout(700);
    const r=await p.evaluate(()=>{const S=__MF.S(),get=__MF.get;
      const items=S.library.filter(i=>i.status!=='completed'&&i.status!=='dropped');
      S.stopwatch={running:false,startedAt:0,elapsed:(1*3600+23*60+45)*1000,resetValue:0};
      S.v256RuntimeCalculator=null;
      const calc=get('v256EnsureRuntimeState')();calc.hasResult=true;calc.resultSeconds=2*3600+5*60;S.v256RuntimeCalculator=calc;
      S.batchDraft={rows:[{libraryId:'',qty:1,minutes:0}],note:'',date:'',v179Mode:'amount'};
      App.mf565OpenBatch();App.selectBatchTitle(0,items[0].id);
      const box=()=>document.querySelector('#mf565-batch .batch-log-row .mf580-runtime');
      const out={off:!!box()&&!box().querySelector('input[type=text]')};
      App.mf580BatchRuntimeToggle(0,true);
      out.on=!!box()?.querySelector('input[type=text]')&&!!box().querySelector('.mf580-time-buttons');
      App.mf580UseTime('batch',0,'stopwatch');
      out.sw=[S.batchDraft.rows[0].minutes,box().querySelector('input[type=text]').value];
      App.mf580UseTime('batch',0,'calculator');
      out.calc=[S.batchDraft.rows[0].minutes,box().querySelector('input[type=text]').value];
      App.mf580BatchRuntimeSet(0,'00:42:00');out.typed=S.batchDraft.rows[0].minutes;
      App.mf565CloseBatch?.();
      App.startSession?.();S.currentTask=get('generateTask')();App.openLogForm();S.logging=true;S.logDraft.v369Interface='itemized';
      App.v378QuickAdd(items[1].id);App.v369AddUnit(0);App.v394Switch(0,'amount');App.v394ToggleRuntime(0,true);
      out.advButtons=!!document.querySelector('.log-form .mf394-runtime .mf580-time-buttons');
      App.mf580UseTime('adv',0,'stopwatch');out.adv=S.logDraft.entries[0].v394RuntimeSeconds;
      return out;});
    assert(r.off,'Batch Log row shows Customize total runtime');
    assert(r.on,'turned on: HH:MM:SS box and the two buttons');
    assert.deepEqual(r.sw,[83.75,'01:23:45']);
    assert.deepEqual(r.calc,[125,'02:05:00']);
    assert.equal(r.typed,42);
    assert(r.advButtons,'Advanced logging has the two buttons');
    assert.equal(r.adv,5025);
    console.log('PASS v580 Customize total runtime: Batch Log, stopwatch and calculator');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
