/* v480 — scheduler isolation, two-level balancing, settings portability. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'482');
const content=fs.readFileSync('src/js/components/367-v480-category-classes-intelligence.js','utf8');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-3),'components/367-v480-category-classes-intelligence.js');
const legacy=fs.readFileSync('src/js/features/scheduler/007-scheduler.js','utf8');
assert(legacy.includes('function computeScores('));
assert(legacy.includes('function scoreLibraryTitle('));
assert(!/S\.library\s*=|S\.sessions\s*=|S\.xpLedger\s*=|S\.categories\s*=/.test(content));
const cats=[
 {id:'seasonal',name:'Seasonal Anime',enabled:true,seasonal:true,weight:3},
 {id:'finished',name:'Finished Anime',enabled:true,seasonal:false,weight:3},
 {id:'tv',name:'TV Shows',enabled:true,seasonal:false,weight:3},
 {id:'disabled',name:'Disabled Anime',enabled:false,seasonal:false,weight:3}
];
const now=Date.now();
const sessions=[
 {categoryId:'seasonal',timestamp:now-3600000,minutes:240,status:'done',id:'s1'},
 {categoryId:'tv',timestamp:now-1800000,minutes:90,status:'done',id:'s2'},
 {categoryId:'disabled',timestamp:now-7*86400000,minutes:50,status:'done',id:'s3'}
];
const settings={
 neglectCap:25,neglectRate:2,repetitionPenalty:7,consecutivePenalty:4,
 saturationWeight:10,seasonalBonus:4,seasonalFreshCount:0,
 randomness:0,customCategoryIcons:[],customCategoryColors:[]
};
const S={categories:cats,sessions,settings,view:'settings'};
const App={};let writes=0;
const ctx={
 S,App,DEFAULT_SETTINGS:{},MediaFlowRuntime:{registerPageEnhancer:()=>{},version:479},
 window:{},document:{querySelector:()=>null},Math,Date,
 v144SafeIconUrl:v=>/^https?:\/\//.test(v)?v:String(v||'').startsWith('assets/category-icons/')?v:'',
 v144CategoryIconHtml:g=>'<span>'+g.icon+'</span>',
 categoryModalHtml:()=>'',escapeHtml:s=>String(s),showToast:()=>{},uid:()=>String(writes+100),
 persistSettings:()=>{writes++},
 schedulerConsumptionSessions:()=>sessions.filter(x=>x.status!=='skipped'),
 recentTaskWindow:()=>[{categoryIds:new Set(['seasonal']),timestamp:now}],
 schedulerLogicalEvents:()=>[{categoryIds:new Set(['seasonal']),timestamp:now},
 {categoryIds:new Set(['tv']),timestamp:now-86400000}],
 computeScores:()=>[
 {cat:cats[0],score:28,reasons:[{t:'Seasonal fresh',w:2}]},
 {cat:cats[1],score:70,reasons:[{t:'Finished neglected',w:8}]},
 {cat:cats[2],score:100,reasons:[{t:'TV balance',w:5}]},
 {cat:cats[3],score:1000,reasons:[]}],
 weightedPick:function(rows){return rows.slice().sort((a,b)=>b.score-a.score)[0]||null;},
 suggestedAmount:()=>({low:3,high:5,multiplier:1,direction:'normal'})
};
ctx.window.MediaFlowSettingsCenter={mountSection:()=>{}};
vm.runInNewContext(content,ctx,{filename:'category-classes-v480.js'});
assert.equal(ctx.DEFAULT_SETTINGS.v480CategoryClasses.enabled,false,'Off by default');
assert.equal(ctx.weightedPick(ctx.computeScores([])).cat.id,'disabled','Disabled OFF runs original scorer verbatim even for fixture source');
const anime={id:'anime',name:'Anime',weight:1,enabled:true,icon:'🍥',color:'#AA88BB',
 categoryIds:['seasonal','finished','disabled']};
const tv={id:'television',name:'Television',weight:1,enabled:true,icon:'📺',color:'#3377BB',categoryIds:['tv']};
const clean=ctx.window.MediaFlowV480.prefs();
assert.equal(clean.classes.length,0);
ctx.App.v480SetSetting('enabled',true);
assert.equal(writes,1);
ctx.App.v480SetSetting('strength','strong');
assert.equal(writes,2);
S.settings.v480CategoryClasses={...ctx.window.MediaFlowV480.prefs(),classes:[anime,tv]};
const found=ctx.window.MediaFlowV480.candidates();
assert.equal(found.length,2);
assert.deepEqual(Array.from(found.find(g=>g.key==='class:anime').categories),['seasonal','finished'],'Disabled category never enters class pool');
let choice=ctx.weightedPick(ctx.computeScores([]));
assert.equal(choice.cat.id,'tv','Heavy Anime consumption favors Television class');
assert.equal(ctx.window.MediaFlowV480.stats('anime',30),290,'Class totals include disabled-category historical activity');
assert.equal(ctx.window.MediaFlowV480.stats('television',7),90);
const originalContent=JSON.stringify(S.sessions);
ctx.App.v480SetSetting('enabled',false);
assert.equal(ctx.weightedPick(ctx.computeScores([])).cat.id,'disabled','Disabling restores exact original pick');
assert.equal(ctx.window.MediaFlowV480.prefs().classes.length,2,'Disabling never removes classes');
assert.equal(JSON.stringify(S.sessions),originalContent,'History not rewritten');
assert.equal(ctx.window.MediaFlowV480.prefs().classes[0].categoryIds.length,3,'Assignments persist');
assert.equal(ctx.DEFAULT_SETTINGS.v480CategoryClasses.enabled,false);
const noClassSettings={enabled:true,classes:[]};
S.settings.v480CategoryClasses=noClassSettings;
assert.equal(ctx.weightedPick(ctx.computeScores([])).cat.id,'disabled','No classes also falls back to original scorer');
assert.equal(ctx.window.MediaFlowV480.prefs().enabled,true);
assert.ok(content.includes('categoryModalHtml({...target'),'Reuse canonical Category icon picker');
assert.ok(content.includes('v144SafeIconUrl'),'Validate URLs via shared component');
assert.ok(content.includes('v480MountSettings'),'Integrate with Settings Center');
assert.ok(content.includes('MediaFlowSettingsCenter.mountSection'),'Settings registry');
console.log('PASS v480: disabled-default, exact legacy fallback, class/category split, disabled category ignored when class enabled, historical balancing, cloud settings persistence, shared icon picker');
