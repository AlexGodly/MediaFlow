/* v537: Real canonical XP+Respect sources agree with the read-only preview.
 * No database, credentials, browser network or user account required. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());assert(version>=537);
const bundle=read('assets/js/mediaflow-v'+version+'.bundle.js');
const v167=read('src/js/features/scheduler/069-v167-editable-system-respect-xp.js');
const v180=read('src/js/features/scheduler/104-v180-system-respect-xp.js');
const v537=read('src/js/components/381-v537-unified-xp-reward-preview.js');
const xp=read('src/js/core/rendering/010-render-shell.js');
const stats=read('src/js/pages/statistics/009-derived-stats-helpers.js');
const html=read('index.html'),css=read('assets/css/289-v537-unified-xp-reward.css');
const order=JSON.parse(read('src/js/runtime-order.json'));
assert(order.at(-1)==='components/381-v537-unified-xp-reward-preview.js');
assert(bundle.includes('function mf537ProjectXP()'));
assert(bundle.includes('function v180CalculateRespectAward('));
assert(html.includes('assets/css/289-v537-unified-xp-reward.css'));
assert(css.includes('prefers-reduced-motion')&&css.includes('max-width:370px'));
assert(v537.includes('v382XPCardMarkup=function(){return mf537XPCardMarkup();}'));
assert(v537.includes('v348HistoryEntries=function()'));
assert(v537.includes('readOnly'));
assert(!v537.includes('persistSessions(')&&!v537.includes('saveState('));
function portion(s,start,end){
 const a=s.indexOf(start),b=s.indexOf(end,a+start.length);
 assert(a>=0&&b>a,'Missing live function boundary '+start);
 return s.slice(a,b);
}
const configs=portion(v167,'const V167_RESPECT_CONFIG_DEFAULT=','// FINAL reward function:');
const categoryFn=portion(stats,'function categoryStatus(cat){','function overallCategoryStatus(cat){');
const consumptionFn=portion(xp,'function xpUnitBonus(unit){','function awardLibraryAdditionXP(id){');
const cats=[
 {id:'anime',name:'Anime',unit:'episodes',target:2,minutesPerUnit:68},
 {id:'tv',name:'TV Show',unit:'episodes',target:1,minutesPerUnit:80}
];
const library=[
 {id:'anime-title',title:'Anime Title',categoryId:'anime',status:'active'},
 {id:'tv-title',title:'TV Title',categoryId:'tv',status:'active'}
];
const defaults={enabled:true,minuteXP:1,unitXP:{episodes:10},rotationMultiplier:{
 neglected:10,due:8,healthy:5,overused:2}};
const respectConfig={
 categoryBaseXP:10,exactTitleBaseXP:25,
 noSkipGrowthPercent:8,noSkipCapPercent:50,
 firstPickGrowthPercent:14,firstPickCapPercent:75,modifiedAt:1
};
let healthMode='healthy';
const original=()=>({
 settings:{leveling:JSON.parse(JSON.stringify(defaults)),
  systemRespectXP:{...respectConfig},exactTitleRecommendations:true},
 library:library.map(x=>({...x})),sessions:[],
 categories:cats,currentTask:{categoryId:'anime',targetMid:2,
  libraryId:'anime-title',title:'Anime Title',
  v180RecommendationHistory:[{libraryId:'anime-title',title:'Anime Title',index:0}]},
 logDraft:{v369Interface:'quick',amount:2,minutes:136,entries:[
   {libraryId:'anime-title',title:'Anime Title',qty:2}]},
 respectState:{noSkipStreak:0,noRerollStreak:0,currentRerolls:0,bestNoSkipStreak:0,
  bestNoRerollStreak:0,totalSkips:0,totalRerolls:0},
 view:'dashboard'
});
const C=vm.createContext({
 S:original(),DEFAULT_SETTINGS:{leveling:defaults},App:{},
 window:{},MediaFlowRuntime:{},Number,Math,JSON,Date,Object,String,Set,Map,Array,
 console:{warn(){},error(e){throw e;}},setTimeout(){},
 V165_RESPECT_XP_VERSION:165,V180_RESPECT_XP_VERSION:180,
 v165RoundMultiplier:n=>Math.round((Number(n)||1)*100)/100,
 v165RespectMultipliers:null,v165RecommendedTitleLogged:null,v165ApplyRespectReward:null,
 v165NormalizeRespectState:v=>Object.assign({
  noSkipStreak:0,noRerollStreak:0,bestNoSkipStreak:0,bestNoRerollStreak:0,
  currentRerolls:0,totalSkips:0,totalRerolls:0},JSON.parse(JSON.stringify(v||{}))),
 v165EnsureRespectState:()=>C.S.respectState,
 v165GroupSessions:id=>C.S.sessions.filter(s=>String(s.sessionGroupId)===id),
 v180EnsureRecommendationHistory:task=>task.v180RecommendationHistory||[],
 v180RespectSlotLimit:task=>task?.categoryId==='movie'?3:1,
 v180RecommendationIdentity:entry=>({id:String(entry.libraryId||''),title:String(entry.title||'').trim().toLowerCase()}),
 v180ResolveHistoryItem:entry=>C.S.library.find(x=>x.id===entry.libraryId)||null,
 v165NormalizedTitle:t=>String(t||'').trim().toLowerCase(),
 cleanTitle:x=>String(x||''),getCategory:id=>cats.find(x=>x.id===id)||null,
 v369ItemTitle:e=>C.S.library.find(x=>x.id===e.libraryId)||null,
 v369Seconds:u=>Math.max(0,Number(u.durationSeconds)||0),
 lastSessionFor:()=>({timestamp:1}),
 daysSince:()=>healthMode==='neglected'?7:healthMode==='due'?3:0,
 minutesSince:()=>healthMode==='overused'?700:0,
 todaysSessions:()=>healthMode==='overused'?[{categoryId:'anime',status:'logged',actualAmount:1}]:[],
 v149ProspectiveTodayStreak:()=>38,
 v149StreakMultiplier:()=>1.52,
 v382XPCardMarkup:()=>'',v382Icon:()=>'<svg></svg>',
 escapeHtml:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;'),
 v348HistoryEntries:()=>C.S.sessions.map(s=>({
  id:'log:'+s.id,kind:'consumption',sessionId:s.id,details:'Saved history',xp:s.xpWithStreak||s.xp
 })),
 showToast:()=>{},
 persistSettings:()=>{throw new Error('Preview must never persist Settings');},
 persistSessions:()=>{throw new Error('Preview must never persist History');}
});
vm.runInContext([configs,categoryFn,consumptionFn,v180,v537].join('\n'),C);
const project=()=>vm.runInContext('mf537ProjectXP()',C);
const projectionMarkup=()=>vm.runInContext('v382XPCardMarkup({})',C);
function runActual(){
 const rows=vm.runInContext('mf537DraftRows().rows',C);
 C.S.sessions=rows.map((row,index)=>{
  const health=vm.runInContext('categoryStatus(getCategory("'+row.categoryId+'"))',C);
  const stored=vm.runInContext('calculateConsumptionXP(getCategory("'+row.categoryId+'"),'+row.amount+','+row.minutes+',"'+health+'")',C);
  return {id:'new-'+index,sessionGroupId:'test',categoryId:row.categoryId,
   actualAmount:row.amount,minutes:row.minutes,healthStatus:health,
   status:'logged',titles:row.titles,xp:stored.xp};
 });
 const bonus=vm.runInContext('v165ApplyRespectReward(S.currentTask,S.logDraft.entries,"test",getCategory("anime"))',C);
 const total=C.S.sessions.reduce((sum,s)=>sum+Math.round((s.xp+(Number(s.v165RespectBonusXP)||0))*1.52),0);
 return {total,bonus,sessions:C.S.sessions};
}
for(const status of ['healthy','neglected','due','overused']){
 C.S=original();healthMode=status;
 const old=JSON.stringify({sessions:C.S.sessions,task:C.S.currentTask,
  respect:C.S.respectState,settings:C.S.settings});
 const projected=project();
 assert.equal(JSON.stringify({sessions:C.S.sessions,task:C.S.currentTask,
   respect:C.S.respectState,settings:C.S.settings}),old,
   'Read-only preview must not mutate data: '+status);
 const previewCard=projectionMarkup();
 const actual=runActual();
 assert.equal(actual.total,projected.total,status+' projection equals award');
 assert.equal(projected.respectTotal,actual.bonus,status+' Respect projection equals award');
 assert.equal(projected.respect.match.matchedCount,1);
 assert.equal(projected.categories[0].status,status);
 assert.equal(projected.categories[0].rotation,defaults.rotationMultiplier[status]);
 assert.equal(projected.streakBonus,actual.total-projected.rawSessionTotal);
 assert(previewCard.includes('System Respect'));
 assert(previewCard.includes('+'+Math.round(projected.total).toLocaleString()));
 assert(C.S.sessions[0].v165RespectBonusXP===actual.bonus);
 const history=vm.runInContext('v348HistoryEntries()',C);
 assert(history[0].details.includes('Respect'));
 assert(history[0].details.includes('rotation included'));
}
// Screenshot example: 156 base XP, Healthy×5, Respect +35, streak ×1.52.
C.S=original();healthMode='healthy';
const sample=project();assert.equal(sample.categories[0].base,156);
assert.equal(sample.consumptionTotal,780);
assert.equal(sample.respectTotal,35);
assert.equal(sample.total,1239);
// Title not followed => only recommended category XP.
C.S=original();C.S.logDraft.entries=[{libraryId:'tv-title',title:'TV Title',qty:1}];
const unmatched=project();assert.equal(unmatched.respectTotal,0,
 'Logging only a different category must not award System Respect');
C.S=original();C.S.logDraft.entries=[{libraryId:'anime-title',title:'Anime Title',qty:2},
 {libraryId:'tv-title',title:'TV Title',qty:1}];
C.S.logDraft.minutes=216;
const mixed=project(),mixedActual=runActual();
assert.equal(mixed.total,mixedActual.total,'Mixed categories honor per-session streak rounding');
assert.equal(mixed.categories.length,2);assert.equal(mixed.respectTotal,mixedActual.bonus);
assert.equal(mixed.categories[1].respect,0);
// Editing draft quantities updates preview immediately.
C.S=original();const smaller=project().total;
C.S.logDraft.entries[0].qty=3;C.S.logDraft.minutes=204;
assert(project().total>smaller,'Preview must update when draft changes');
// Itemized durations are per-unit seconds; match canonical submit minutes.
C.S=original();C.S.logDraft.v369Interface='itemized';
C.S.logDraft.entries[0].v369Units=[
 {durationSeconds:3600},{durationSeconds:4560}];
C.S.logDraft.minutes=136;
const advanced=project(),advancedActual=runActual();
assert.equal(advanced.total,advancedActual.total);
assert.equal(advanced.categories[0].minutes,136);
// Reroll category resets first-pick, but preserves no-Skip.
C.S=original();C.S.respectState.noSkipStreak=8;C.S.respectState.noRerollStreak=8;
C.S.respectState.currentRerolls=1;
let reroll=project();
assert.equal(reroll.respect.noSkipStreak,9);
assert.equal(reroll.respect.noRerollStreak,0);
assert.equal(reroll.total,runActual().total);
// Not following an exact title still awards the category bonus.
C.S=original();C.S.logDraft.entries=[{libraryId:'unrecommended',title:'Other Anime',qty:2}];
C.S.library.push({id:'unrecommended',title:'Other Anime',categoryId:'anime'});
const justCategory=project();assert.equal(justCategory.respectTotal,10);
assert.equal(justCategory.total,runActual().total);
// Respect unavailable if leveling disabled; historical logs unchanged.
C.S=original();C.S.settings.leveling.enabled=false;
assert.equal(project().total,0);assert.equal(project().respectTotal,0);
console.log('PASS v537: source-shared Respect, read-only preview, health×4, exact title, Quick/Advanced, mixed categories, streak rounding, History and mobile UI.');
