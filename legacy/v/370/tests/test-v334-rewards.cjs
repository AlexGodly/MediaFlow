const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');
const src=fs.readFileSync('src/js/components/232-v334-dashboard-xp-active-time.js','utf8');
let saved=0,touched=0;
const base={
  S:{settings:{leveling:{enabled:true}},library:[{id:'a',status:'planned'}],collections:[{id:'c0',title:'Original'}],xpLedger:{},view:'library'},
  DEFAULT_SETTINGS:{leveling:{}},V186_STATS_COMPONENT_DEFAULTS:{},V186_STATS_COMPONENT_LABELS:{},
  AUTH_READY:true,AUTH_USER:{id:'account1'},V115_STARTUP_GUARD:false,
  v150ComputeStateMetrics(){return {totalXP:100,fixedLibraryXP:40};},
  v120XPBreakdown(){return {total:100};},
  v149MarkStreakDirty(){},
  v149ProspectiveTodayStreak(){return 7;},
  v149StreakMultiplier(n){return n===7?1.28:1;},
  todayISO(){return '2026-10-09';},
  loadAll:async function(){},
  persistLibrary(){saved++;},
  awardLibraryAdditionXP(){return 25;},
  saveState:async function(){saved++;},
  mergeStates(a,b){return {...b,...a,xpLedger:{...b?.xpLedger,...a?.xpLedger}};},
  v274TouchCollection(c){touched++;c.updatedAt=Date.now();},
  v274CollectionById(id){return this.S.collections.find(x=>x.id===id);},
  renderStats(){return '<div><div class="view-head"></div><div class="stats-level-card"></div></div>';},
  renderSettings(){return '<div style="font-weight:700;font-size:12px;margin:14px 0 8px;">UNIT XP</div>';},
  v256RuntimeCalculatorHtml(){return '>Carry-forward</button> >Multi-row</button>';},
  v225IconSvg(s){return `<svg>${s}</svg>`;},
  renderView(){},render(){},
  requestAnimationFrame(fn){fn();},
  localStorage:{getItem(){return null;},setItem(){}},
  window:{addEventListener(){},scrollTo(){}},
  document:{hidden:false,addEventListener(){},querySelector(){return null;},documentElement:{scrollTop:100},body:{scrollTop:50}},
  setInterval(){return 0;},
  console,
  App:{addLogEntry(){},v274SaveCollection:async()=>{},setView(){},mobileNav(){},updateLeveling(){}},
};
base.document.scrollingElement={scrollTop:200};
const cx=vm.createContext(base);
vm.runInContext(src,cx);
(async()=>{
 await cx.loadAll();
 const old=cx.v150ComputeStateMetrics({xpLedger:{}},false);
 assert.equal(old.totalXP,100);
 cx.v334EarnTime(120000);
 const totals=cx.v334Totals();
 assert.equal(totals.activeMs,120000);
 assert.equal(totals.timeXP,5); // 2 mins × 2 XP × 1.28 streak -> floor 5.12
 assert.equal(cx.v150ComputeStateMetrics({xpLedger:cx.S.xpLedger}).totalXP,105);
 // Starting an unstarted title gets one bonus, never farmed by repeats.
 cx.S.library[0].status='active';cx.persistLibrary();cx.persistLibrary();
 assert.equal(cx.S.xpLedger.v334StartedTitles.a,40);
 // Imported titles were already started; no retroactive bonus.
 cx.S.library.push({id:'imported',status:'active'});cx.persistLibrary();
 assert.equal(cx.S.xpLedger.v334StartedTitles.imported,undefined);
 // Create, edit and no revision cap.
 const newCollection={id:'c1',title:'New',createdAt:Date.now()};cx.S.collections.push(newCollection);cx.v274TouchCollection(newCollection);
 assert.equal(cx.S.xpLedger.v334CollectionCreates.c1,35);
 cx.v274TouchCollection(newCollection);
 assert.equal(cx.S.xpLedger.v334CollectionEdits.c1,10);
 cx.v274TouchCollection(newCollection);
 assert.equal(cx.S.xpLedger.v334CollectionEdits.c1,20);
 const m=cx.mergeStates({xpLedger:cx.S.xpLedger},{xpLedger:{v334ActiveTimeDays:{'2026-10-09':{ms:50000,xp:1}}}});
 assert.equal(m.xpLedger.v334ActiveTimeDays['2026-10-09'].ms,120000);
 assert.equal(m.xpLedger.v334CollectionEdits.c1,20);
 assert.match(cx.renderSettings(),/Active app time XP \/ minute/);
 assert.match(cx.v256RuntimeCalculatorHtml(),/<svg>/);
 cx.S.view='dashboard';cx.renderView();assert.equal(cx.document.scrollingElement.scrollTop,0);
 console.log('PASS v334 XP rewards, streak accrual, merges, settings, icons, navigation');
})().catch(e=>{console.error(e);process.exitCode=1});
