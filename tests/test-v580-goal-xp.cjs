/* v580, in the real app: task goal XP — +100 at the minimum, +300 more at
 * the maximum, +10 per unit past it (up to +100) — once per task by any log,
 * in the Logging and Batch Log previews, in the session and the XP total. */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate}=require('./harness/app.cjs');
(async()=>{
  const app=await openApp({state:generate({titles:40})});const p=app.page;
  try{
    await p.waitForTimeout(700);
    const r=await p.evaluate(()=>{const S=__MF.S(),get=__MF.get;const G=window.MediaFlowV580Goal;const out={};
      out.tiers=[G.tiers(2,5,7),G.tiers(5,5,7),G.tiers(7,5,7),G.tiers(9,5,7),G.tiers(40,5,7)].map(t=>t.min+t.max+t.extra);
      App.startSession?.();
      const ok=i=>i.status!=='completed'&&i.status!=='dropped';
      const byCat={};for(const i of S.library)if(ok(i))(byCat[i.categoryId]=byCat[i.categoryId]||[]).push(i);
      const catId=Object.keys(byCat).sort((a,b)=>byCat[b].length-byCat[a].length)[0];
      const items=byCat[catId].slice(0,3);for(const i of items){i.total=0;i.progress=1;i.status='active';}
      const task=get('generateTask')();
      Object.assign(task,{categoryId:catId,low:2,high:4,targetMid:3,createdAt:Date.now()-1000});S.currentTask=task;
      const xp=()=>get('mf542AccountXP')();
      // 1) Batch Log: 1 unit in the task's category — below the minimum.
      S.batchDraft={rows:[{libraryId:items[0].id,qty:1,minutes:20}],note:'',date:'',v179Mode:'amount'};App.mf565OpenBatch();
      out.batchPreview1=get('mf574Project')()?.parts?.goal||0;
      // 2) Logging preview with 2 more → amount 3: the minimum (+100).
      App.submitBatchLog();
      out.afterBatch=S.sessions.filter(s=>s.mf580GoalTaskId).length;
      S.currentTask=task;App.openLogForm();S.logging=true;S.logDraft.v369Interface='quick';S.logDraft.v179Mode='amount';
      App.v378QuickAdd(items[1].id);S.logDraft.entries[0].qty=2;get('v179SyncSingleFromEntries')();
      const prev=get('mf537ProjectXP')();out.prevGoal=prev.goal&&prev.goal.total;out.card=get('mf537XPCardMarkup')().includes('Task goal +100 XP');
      const before=xp();App.submitLog();const after=xp();
      const s=S.sessions.find(x=>x.mf580GoalTaskId===task.id);
      out.saved=s&&[s.mf580GoalXP,s.mf580Goal.min,s.mf580Goal.max,s.mf580Goal.amount];out.stored=s&&[s.streakBaseXP,s.xp+(s.v165RespectBonusXP||0)+s.mf580GoalXP];
      {const keep=s.mf580GoalXP;delete s.mf580GoalXP;get('v334InvalidateXP')();const without=xp();s.mf580GoalXP=keep;get('v334InvalidateXP')();out.goalInTotal=xp()-without;}
      out.gain=after-before;out.projected=prev.total;out.dbg=JSON.stringify({p:prev.total,goal:prev.goal,mult:prev.dayMultiplier,rep:S.mf542LastReport||null,gx:s&&s.xp,sb:s&&[s.streakMultiplier,s.xpWithStreak,s.v165RespectBonusXP]});
      // 3) The same task again (still current for this test) with 4 more: amount 7 → max +300, extra 3×10.
      S.currentTask=task;S.batchDraft={rows:[{libraryId:items[2].id,qty:4,minutes:60}],note:'',date:'',v179Mode:'amount'};App.mf565OpenBatch();
      out.batchPreview2=get('mf574Project')()?.parts?.goal||0;out.batchHtml=get('mf574Html')(get('mf574Project')()).includes('task goal');
      App.submitBatchLog();
      out.paid=S.sessions.filter(x=>x.mf580GoalTaskId===task.id).map(x=>x.mf580GoalXP);
      // 4) Settings: off → no goal XP.
      App.mf580SetGoal('enabled',false);out.off=G.due(task,99,[]).total;App.mf580SetGoal('enabled',true);
      out.settings=!!get('v167RespectEditorHtml')().includes('TASK GOAL XP');S.settings.exactTitleRecommendations=true;out.hint=String(get('mf395DashboardRecommendationHtml')(task,get('getCategory')(task.categoryId))).includes('Goal XP: reach 2 for +100');
      return out;});
    assert.deepEqual(r.tiers,[0,100,400,420,500]);
    assert.equal(r.batchPreview1,0,'below the minimum: nothing');
    assert.equal(r.afterBatch,0);
    assert.equal(r.prevGoal,100,'Logging preview shows the minimum');
    assert(r.card,'Logging XP card shows Task goal');
    assert.deepEqual(r.saved,[100,100,0,3]);
    assert.equal(r.stored[0],r.stored[1],'the stored streak base includes the goal XP');
    assert.equal(r.goalInTotal,100,'the goal XP is in the account XP');
    assert(r.gain>=r.projected,'earned at least the preview '+r.dbg);
    assert(r.batchPreview2>=330,'Batch Log preview: maximum + 3 past it ('+r.batchPreview2+')');
    assert(r.batchHtml);
    assert.deepEqual(r.paid,[100,330],'each part paid once');
    assert.equal(r.off,0);
    assert(r.settings);
    assert(r.hint,'MediaFlow Recommends shows what the goal is worth');
    console.log('PASS v580 task goal XP: tiers, once per task, previews, settings');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
