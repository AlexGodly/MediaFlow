/* MediaFlow v536 — use real category health for configurable rotation XP.
 * Test the actual source functions, not a reimplementation of the formulas. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const v=Number(read('VERSION').trim());
assert(v>=536,'This regression test targets MediaFlow v536 and later');
const bundle=read('assets/js/mediaflow-v'+v+'.bundle.js');
const sources={
  stats:read('src/js/pages/statistics/009-derived-stats-helpers.js'),
  xp:read('src/js/core/rendering/010-render-shell.js'),
  logging:read('src/js/features/logging/008-session-flow.js'),
  batch:read('src/js/pages/batch-log/014-view-batch-log-v61.js'),
  app:read('src/js/core/app/021-app-public-actions-bound-to-window.js'),
  streak:read('src/js/features/xp/054-v149-day-streak-xp-multiplier.js'),
  preview:read('src/js/components/278-v382-logging-recommended-progress-xp.js')
};
const invalid=/categoryStatus\(\s*[^()]+\s*\)\.status/g;
for(const [name,source] of Object.entries(sources)){
  if(['logging','batch','app','xp'].includes(name))
    assert(!invalid.test(source),name+' must never access .status on categoryStatus() string');
}
assert(!invalid.test(bundle),'Built app must contain no broken categoryStatus(...).status calls');
const extract=(source,start,next)=>{
  const from=source.indexOf(start);
  assert(from>=0,'Missing live source function: '+start);
  const end=source.indexOf(next,from+start.length);
  assert(end>from,'Missing source boundary after '+start);
  return source.slice(from,end);
};
const catSource=extract(sources.stats,'function categoryStatus(cat){','function overallCategoryStatus(cat){');
const xpSource=extract(sources.xp,'function xpUnitBonus(unit){','function awardLibraryAdditionXP(id){');
const streakSource=extract(sources.streak,'const v149EstimateCurrentLogXPBase=estimateCurrentLogXP;','function v149SessionRawXPTotal(');
const previewSource=extract(sources.preview,'function v382XPCardMarkup(x){','function v382UpdateXPPreview(){');
const submitSource=extract(sources.logging,'function submitLog(){','\n\n/* ============================================================') ;
const batchSource=extract(sources.batch,'function ensureBatchDraft(){','function addBatchRow(){')+
  extract(sources.batch,'function submitBatchLog(){','function renderBatchLog(){');
const modalSource=extract(sources.app,'  saveSessionModal(id){','  deleteSessionFromModal(id){');

const cat={id:'anime',name:'Anime',target:3,minutesPerUnit:30,unit:'episodes'};
const multipliers={neglected:10,due:8,healthy:5,overused:2};
const environment={days:0,minutes72:0,todayAmount:0};
const old={id:'historical',categoryId:'anime',status:'logged',actualAmount:2,minutes:136,xp:156,healthStatus:undefined};
const freshState=()=>({
 categories:[cat],
 library:[], sessions:[{...old}], completionTimeline:[], settings:{
  leveling:{enabled:true,minuteXP:1,unitXP:{episodes:10},rotationMultiplier:{...multipliers}}
 },
 currentTask:{categoryId:'anime',targetMid:2},logDraft:{
  categoryId:'anime',amount:2,minutes:136,note:'',entries:[],updateLibrary:false
 },logging:true,modal:null,view:'dashboard',batchDraft:{rows:[],note:'',date:'2026-10-20'}
});
const ctx=vm.createContext({
 S:freshState(),DEFAULT_SETTINGS:{leveling:{enabled:true,minuteXP:1,unitXP:{episodes:10},rotationMultiplier:{...multipliers}}},
 Number,Math,Date,JSON,Object,Array,String,Set,Map,console,
 getCategory:id=>id==='anime'?cat:null,
 lastSessionFor:()=>({timestamp:1}),
 daysSince:()=>environment.days,
 minutesSince:()=>environment.minutes72,
 todaysSessions:()=>environment.todayAmount?[{categoryId:'anime',status:'complete',actualAmount:environment.todayAmount}]:[],
 v149ProspectiveTodayStreak:()=>38,
 v149StreakMultiplier:()=>1.52,
 v382Icon:()=>'',escapeHtml:String,
 uid:(()=>{let i=0;return ()=>"id-"+(++i);})(),
 todayISO:()=> '2026-10-20',
 clamp:(value,min,max)=>Math.max(min,Math.min(max,value)),
 entriesNote:()=>'',cleanTitle:String,
 v165ApplyRespectReward:()=>{},
 persistLibrary:()=>{},persistSessions:()=>{},persistTask:()=>{},
 render:()=>{},showToast:()=>{},generateTask:()=>({categoryId:'anime',targetMid:2}),
 normalizeSeasonalLibraryItems:()=>{},
 v331BatchTitleTimestamp:()=>Date.now(),
 v331ValidTimestamp:()=>Date.now(),
 v369Seconds:u=>u.seconds,
 document:{getElementById(id){return {value:{
  's-category':'anime','s-date':'2026-10-20','s-status':'logged',
  's-target':'2','s-actual':'2','s-minutes':'136','s-note':'corrected'
 }[id]};}}
});
vm.runInContext([catSource,xpSource,streakSource,previewSource,submitSource,batchSource,
  'const modalActions={'+modalSource+'};'].join('\n'),ctx);

const cases=[
 {status:'healthy',days:0,minutes72:0,todayAmount:0,multiplier:5},
 {status:'due',days:3,minutes72:0,todayAmount:0,multiplier:8},
 {status:'neglected',days:7,minutes72:0,todayAmount:0,multiplier:10},
 {status:'overused',days:0,minutes72:500,todayAmount:2,multiplier:2}
];
for(const x of cases){
 Object.assign(environment,x);
 ctx.S=freshState();
 assert.equal(vm.runInContext('categoryStatus(getCategory("anime"))',ctx),x.status,
  'Actual health engine must report '+x.status);
 const raw=vm.runInContext('calculateConsumptionXP(getCategory("anime"),2,136,categoryStatus(getCategory("anime")))',ctx);
 assert.equal(raw.base,156,x.status+' pre-rotation base');
 assert.equal(raw.multiplier,x.multiplier,x.status+' saved setting');
 assert.equal(raw.xp,156*x.multiplier,x.status+' real calculated award');
 const preview=vm.runInContext('estimateCurrentLogXP()',ctx);
 assert.equal(preview.base,156);
 assert.equal(preview.multiplier,x.multiplier);
 assert.equal(preview.streak,38);
 assert.equal(preview.streakMultiplier,1.52);
 assert.equal(preview.xp,Math.round(156*x.multiplier*1.52));
 const html=vm.runInContext('v382XPCardMarkup(estimateCurrentLogXP())',ctx);
 assert(html.includes('<strong>×'+x.multiplier+'</strong>'),x.status+' displayed rotation');
 assert(html.includes('+'+preview.xp.toLocaleString()),x.status+' displayed XP');

 // Normal Logging: verify actual stored session, not only the preview.
 vm.runInContext('submitLog()',ctx);
 const logged=ctx.S.sessions.find(s=>s.id!=='historical'&&s.status!=='skipped');
 assert(logged,x.status+' Quick Logging creates an entry');
 assert.equal(logged.healthStatus,x.status);
 assert.equal(logged.xp,raw.xp,x.status+' Quick Logging stores correct XP');
 assert.equal(ctx.S.sessions[0].xp,156,'Old XP must remain untouched');
 assert.equal(ctx.S.sessions[0].healthStatus,undefined,'Old status must not be rewritten');

 // Advanced Logging uses exactly the same canonical grouping and XP path.
 ctx.S=freshState();
 ctx.S.library=[{id:'title',title:'Anime',categoryId:'anime',status:'planned'}];
 ctx.S.logDraft.v369Interface='itemized';
 ctx.S.logDraft.entries=[{title:'Anime',libraryId:'title',qty:2,v369Units:[
  {seconds:3600,loggedAt:100}, {seconds:4560,loggedAt:200}
 ]}];
 vm.runInContext('submitLog()',ctx);
 const advanced=ctx.S.sessions.find(s=>s.id!=='historical'&&s.status!=='skipped');
 assert(advanced,x.status+' Advanced Logging must create entry');
 assert.equal(advanced.healthStatus,x.status);
 assert.equal(advanced.xp,raw.xp,x.status+' Advanced Logging stores correct XP');

 // Batch Logging retains its separate legacy entry point.
 ctx.S=freshState();
 ctx.S.library=[{id:'title',title:'Anime',categoryId:'anime',status:'planned',progress:0,total:100}];
 ctx.S.batchDraft.rows=[{libraryId:'title',qty:2,minutes:136}];
 vm.runInContext('submitBatchLog()',ctx);
 const batch=ctx.S.sessions.find(s=>s.id!=='historical');
 assert.equal(batch.healthStatus,x.status);
 assert.equal(batch.xp,raw.xp,x.status+' Batch Logging stores correct XP');
 assert.equal(ctx.S.sessions[0].xp,156,'Batch Logging must not rewrite History');
}

// Explicitly setting zero must award zero, not silently ×1.
ctx.S=freshState();
ctx.S.settings.leveling.rotationMultiplier.healthy=0;
assert.equal(vm.runInContext('xpRotationMultiplier("healthy")',ctx),0);
assert.equal(vm.runInContext('calculateConsumptionXP(getCategory("anime"),2,136,"healthy").xp',ctx),0);
// Legacy undefined/unrecognized health retains the historically used ×1.
assert.equal(vm.runInContext('xpRotationMultiplier(undefined)',ctx),1);
assert.equal(vm.runInContext('xpRotationMultiplier("unsupported")',ctx),1);

// Editing one History row uses actual health and doesn't rewrite unrelated rows.
ctx.S=freshState();
Object.assign(environment,cases[0]);
ctx.S.sessions.push({id:'to-edit',categoryId:'anime',actualAmount:1,minutes:1,xp:1,status:'logged'});
vm.runInContext('modalActions.saveSessionModal("to-edit")',ctx);
assert.equal(ctx.S.sessions[1].xp,780,'Explicit History edit recalculates only edited entry');
assert.equal(ctx.S.sessions[1].healthStatus,'healthy');
assert.equal(ctx.S.sessions[0].xp,156,'History edit must preserve other stored XP');
console.log('PASS v536: configurable ×10/×8/×5/×2, preview, Quick/Advanced/Batch rewards, History editing, zero and legacy safety.');
