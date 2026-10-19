/* MediaFlow v533 — page-render smoke test for History and Statistics.
   Exercises the real History toolbar and Statistics renderer through their
   source functions, not only the v532 helper definitions. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const util=read('src/js/utils/006-util.js');
const runtime=JSON.parse(read('src/js/runtime-order.json'));
const build=JSON.parse(read('src/js/build-order.json'));
const position=name=>build.findIndex(x=>x.path===name);
assert(position('utils/006-util.js')>=0,'core helper is in build');
assert(position('utils/006-util.js')<position('pages/history/015-view-history.js'),'core type functions precede History');
assert(position('utils/006-util.js')<position('pages/statistics/023-v16-features-backups-themes-stopwatch-mal-link-stats.js'),'core type functions precede Statistics');
assert(!runtime.includes('components/379-v532-media-type-history-statistics.js'),'retire the late extension');
const bundle=read('assets/js/mediaflow-v533.bundle.js');
assert(bundle.indexOf('function v532MediaTypeOptions(')<bundle.indexOf('function renderHistory('),'History can call early type helper');
assert(bundle.indexOf('function v532MediaTypeMix(')<bundle.indexOf('function renderStatsV14('),'Statistics can call early type helper');

const categories=[{id:'anime',name:'Anime',type:'video',color:'#123456'},
 {id:'manga',name:'Manga',type:'reading',color:'#123456'},
 {id:'games',name:'Games',type:'playing',color:'#123456'},
 {id:'music',name:'Music',type:'listening',color:'#123456'}];
const sessions=[
 {id:'a',categoryId:'anime',status:'logged',minutes:50,date:'2026-10-19',timestamp:1792450000000},
 {id:'b',categoryId:'manga',status:'logged',minutes:20,date:'2026-10-19',timestamp:1792440000000},
 {id:'c',categoryId:'games',status:'logged',minutes:60,date:'2026-10-19',timestamp:1792430000000},
 {id:'d',categoryId:'music',status:'logged',minutes:25,date:'2026-10-19',timestamp:1792420000000}];
const state={categories,sessions,library:[],histFilters:{type:'all',range:'all',category:'all',dateFrom:'',dateTo:''},
 histPageSize:50,histPage:0};
const ctx=vm.createContext({
 UNITS:{episodes:{label:'episodes',singular:'episode'}},
 S:state,App:{},v269UI:()=>({year:'all',month:'all',selectMode:false,weeksPerPage:6}),
 v269YearOptions:()=>['2026'],v269MonthName:n=>String(n),v269Esc:x=>String(x),
 v241HistoryCategoryFilterHtml:()=>'<select><option>All categories</option></select>',
 v331LogicalSessionCount:rows=>rows.length,escapeHtml:x=>String(x),
 fmtDate:x=>x,fmtMinutes:n=>String(n),v144CategoryIconText:()=>'🗂',
 v144CategoryIconHtml:()=>'',sessionStoredXP:()=>0,v149SessionStreakLabel:()=>'1',
 xpRotationLabel:()=>'',v149StreakMultiplier:()=>1,Math,Date,Number,String,Object,
 Map,Set,Array,Intl,window:{},document:{}
});
vm.runInContext(util,ctx);
const history=read('src/js/components/203-v269-consumption-history-redesign.js');
const start=history.indexOf('function v269FilterBarHtml(sessions){'),end=history.indexOf('function v269WeekGroups(',start);
assert(start>=0&&end>start,'current History View Options renderer found');
vm.runInContext(history.slice(start,end),ctx);
let historyHtml=vm.runInContext('v269FilterBarHtml(S.sessions)',ctx);
for(const label of ['Watching','Reading','Playing','Listening','Other']){
 assert(historyHtml.includes('>'+label+'</option>'),'History option visible: '+label);
}
ctx.S.histFilters.type='playing';
historyHtml=vm.runInContext('v269FilterBarHtml(S.sessions)',ctx);
assert(historyHtml.includes('value="playing" selected>Playing</option>'),'History restores selected Playing');
const original=read('src/js/pages/history/015-view-history.js');
vm.runInContext(original,ctx);
const classic=vm.runInContext('renderHistory()',ctx);
assert(classic.includes('>Listening</option>'),'Legacy History page renders all types');

// Exercise actual Statistics page function with normal app service dependencies.
const statSource=read('src/js/pages/statistics/023-v16-features-backups-themes-stopwatch-mal-link-stats.js');
const statStart=statSource.indexOf('function renderStatsV14(){'),statEnd=statSource.indexOf('\nrenderStats=renderStatsV14;',statStart);
assert(statStart>=0&&statEnd>statStart,'Statistics page renderer found');
const totals=()=>({minutes:155,episodes:0,chapters:0,issues:0,movies:0});
Object.assign(ctx,{
 totalsForSessions:totals,todaysSessions:()=>sessions,sessionsInRange:()=>sessions,
 weeklyStatsData:()=>Array.from({length:7},(_,i)=>({date:'2026-10-19',label:String(i),minutes:5,tasks:1})),
 v199StatusLabel:s=>s,mediaFlowLevelInfo:()=>({level:1,xp:10,current:10,needed:100,pct:10}),
 fmtMinutes:n=>String(n),statCard:()=>'',svgBarChart:()=>'<svg></svg>',
 computeDayStreak:()=>0,renderProfileStatHero:()=>'',libraryXPTotal:()=>0,
 v81RepeatTotals:()=>({sessions:0,episodes:0,chapters:0,issues:0,movies:0,minutes:0})
});
vm.runInContext(statSource.slice(statStart,statEnd),ctx);
const statsHtml=vm.runInContext('renderStatsV14()',ctx);
assert(statsHtml.includes('MEDIA TYPE MIX'),'Stats page returns type-mix panel');
for(const label of ['Watching','Reading','Playing','Listening']){
 assert(statsHtml.includes('<span class="k">'+label+'</span>'),'Statistics panel has '+label);
}
assert(statsHtml.includes('<span class="v">60</span>'),'Games minutes counted');
assert(!statsHtml.includes('<span class="k">video</span>'),'No raw video label in Stats');
console.log('PASS v533: production helper available before both pages; History and Statistics render and show all four types.');
