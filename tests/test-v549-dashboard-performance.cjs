/* v549 Dashboard history aggregation and responsiveness contract tests. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const modulePath='src/js/components/389-v549-dashboard-performance.js';
const source=read(modulePath);
const runtime=JSON.parse(read('src/js/runtime-order.json'));
const version=Number(read('VERSION').trim());
const versionJson=JSON.parse(read('version.json'));
const index=read('index.html');
assert(version>=549,'VERSION must include the v549 Dashboard optimizer');
assert.equal(versionJson.build,version,'version.json build must match VERSION');
assert.equal(versionJson.version,version,'version.json version must match VERSION');
assert(runtime.includes('components/389-v549-dashboard-performance.js'),'v549 optimizer must be loaded');
assert(index.includes('mediaflow-v'+version+'.bundle.js'),'HTML must point to the current bundle');
assert(source.includes('function mf549BuildDashboardSnapshot'),'Dashboard must aggregate History in one pass');
assert(source.includes('MF549_DASHBOARD_SNAPSHOT'),'all Dashboard category calculations must share a render-scoped snapshot');
assert(source.includes('MF549_LIBRARY_LOOKUP_CACHE'),'On This Day Library lookup must survive History-only changes');
assert(source.includes('MF549_STATS.markupPassThroughs'),'Dashboard must avoid the detached-DOM parse during the live render path');
assert(!/S\.(?:library|sessions|history)\s*=/.test(source),'performance code must not replace core user data');

const fixedToday='2026-10-25';
const categories=[
  {id:'anime',name:'Anime',enabled:true,weight:1,target:3,minutesPerUnit:24},
  {id:'tv',name:'TV',enabled:true,weight:1.5,target:2,minutesPerUnit:42},
  {id:'books',name:'Books',enabled:true,weight:.75,target:1,minutesPerUnit:30},
  {id:'games',name:'Games',enabled:true,weight:2,target:2,minutesPerUnit:60},
  {id:'empty',name:'Empty',enabled:true,weight:1,target:1,minutesPerUnit:20}
];
const now=Date.now();
const sessions=[];
for(let i=0;i<720;i++){
  const category=categories[i%4];
  const ageHours=(i*7)%1600;
  const timestamp=now-ageHours*3600000;
  const date=new Date(timestamp).toISOString().slice(0,10);
  sessions.push({
    id:'session-'+i,categoryId:category.id,status:i%17===0?'skipped':'logged',
    timestamp,date,minutes:i%9===0?0:(i%95)+1,actualAmount:(i%6)+1,
    titles:[{title:'Title '+i,qty:(i%6)+1}]
  });
}
sessions.push({id:'today-a',categoryId:'anime',status:'logged',timestamp:now,date:fixedToday,minutes:45,actualAmount:4,titles:[]});
sessions.push({id:'today-b',categoryId:'tv',status:'logged',timestamp:now-1000,date:fixedToday,minutes:30,actualAmount:2,titles:[]});
const library=[{id:'a',title:'Alpha',categoryId:'anime'},{id:'b',title:'Beta',categoryId:'tv'}];
const S={sessions,library,categories,settings:{}};
const window={};
let legacyStatusCalls=0,legacyOverallCalls=0,legacyBalanceCalls=0,libraryLookupCalls=0;
const ctx={
  S,window,App:{},MediaFlowRuntime:{version:0},console,Intl,Number,String,Array,Object,Map,Set,Math,JSON,Date,
  V53_LIB:{libraryToken:1},
  todayISO:()=>fixedToday,
  hoursAgo:h=>Date.now()-h*3600000,
  daysSince:ts=>ts==null?Infinity:Math.max(0,(now-Number(ts))/86400000),
  schedulerConsumptionSessions:()=>S.sessions.filter(s=>s&&s.status!=='skipped'&&((Number(s.minutes)||0)>0||(Number(s.actualAmount)||0)>0)),
  v186ScopeCategories:()=>S.categories.filter(c=>c.enabled),
  lastSessionFor:catId=>{
    let best=null;for(const s of S.sessions){if(s.categoryId===catId&&(!best||s.timestamp>best.timestamp))best=s;}return best;
  },
  minutesSince:(catId,hours)=>{
    const cutoff=Date.now()-hours*3600000;
    return S.sessions.filter(s=>s.categoryId===catId&&s.timestamp>=cutoff&&s.status!=='skipped').reduce((sum,s)=>sum+(s.minutes||0),0);
  },
  todaysSessions:()=>S.sessions.filter(s=>s.date===fixedToday),
  categoryStatus:cat=>{
    legacyStatusCalls++;
    const last=ctx.lastSessionFor(cat.id),dSince=ctx.daysSince(last?last.timestamp:null);
    const min72=ctx.minutesSince(cat.id,72),expected3d=cat.target*cat.minutesPerUnit*2.2;
    const satRatio=expected3d>0?min72/expected3d:0;
    const todayAmt=ctx.todaysSessions().filter(s=>s.categoryId===cat.id&&s.status!=='skipped').reduce((a,s)=>a+s.actualAmount,0);
    if(todayAmt>0&&satRatio>=1.6)return 'overused';
    if(dSince>=6)return 'neglected';if(dSince>=2.2)return 'due';return 'healthy';
  },
  overallCategoryStatus:cat=>{
    legacyOverallCalls++;
    const rows=S.sessions.filter(s=>s&&s.categoryId===cat.id&&s.status!=='skipped'&&Number(s.minutes)>0)
      .sort((a,b)=>new Date(a.timestamp||a.date)-new Date(b.timestamp||b.date));
    if(!rows.length)return 'healthy';
    const first=rows[0],last=rows[rows.length-1];
    const firstTime=new Date(first.timestamp||first.date).getTime();
    const lastTime=new Date(last.timestamp||last.date).getTime();
    const spanDays=Math.max(3,(lastTime-firstTime)/86400000);
    const totalMinutes=rows.reduce((sum,s)=>sum+(Number(s.minutes)||0),0);
    const expectedPerDay=(cat.target*cat.minutesPerUnit*2.2)/3;
    const expectedOverall=expectedPerDay*spanDays,ratio=expectedOverall>0?totalMinutes/expectedOverall:0;
    const dSince=ctx.daysSince(last.timestamp||last.date);
    if(dSince>=6)return 'neglected';if(ratio>=1.6)return 'overused';if(dSince>=2.2)return 'due';return 'healthy';
  },
  categoryBalance:cat=>{
    legacyBalanceCalls++;
    const enabled=ctx.v186ScopeCategories('scheduler');
    const weightTotal=enabled.reduce((a,c)=>a+Math.max(.25,Number(c.weight)||1),0)||1;
    const desiredShare=Math.max(.25,Number(cat.weight)||1)/weightTotal;
    const all=ctx.schedulerConsumptionSessions(),now=Date.now();
    const windows=[{days:3,weight:.35,minMinutes:60},{days:7,weight:.25,minMinutes:120},{days:30,weight:.20,minMinutes:240},{days:null,weight:.20,minMinutes:1}];
    let ratioSum=0,usedWeight=0;const detail={};
    for(const w of windows){
      const rows=w.days==null?all:all.filter(x=>Number(x.timestamp)>=now-w.days*86400000);
      const totalMinutes=rows.reduce((a,x)=>a+Math.max(0,Number(x.minutes)||0),0);
      const catMinutes=rows.filter(x=>x.categoryId===cat.id).reduce((a,x)=>a+Math.max(0,Number(x.minutes)||0),0);
      const key=w.days==null?'lifetime':String(w.days)+'d';
      const actualShare=totalMinutes>0?catMinutes/totalMinutes:0;
      const ratio=desiredShare>0?actualShare/desiredShare:1;
      detail[key]={totalMinutes,catMinutes,actualShare,ratio};
      if(totalMinutes>=w.minMinutes){ratioSum+=Math.min(6,ratio)*w.weight;usedWeight+=w.weight;}
    }
    const last=ctx.lastSessionFor(cat.id),daysIdle=ctx.daysSince(last?last.timestamp:null);
    return {desiredShare,consumptionRatio:usedWeight>0?ratioSum/usedWeight:1,daysIdle,detail};
  },
  computeDayStreak:()=>{
    const days=new Set(S.sessions.filter(s=>s.status!=='skipped').map(s=>s.date));
    let streak=0,cur=new Date();
    while(true){const iso=cur.toISOString().slice(0,10);if(days.has(iso)){streak++;cur.setDate(cur.getDate()-1);}else break;}
    return streak;
  },
  v159LibraryLookup:()=>{libraryLookupCalls++;return {library:S.library};},
  v53InvalidateLibraryCache:()=>{ctx.V53_LIB.libraryToken++;return true;},
  v46ApplyState:()=>true,
  v268BalanceEnabled:()=>true,
  v268UpgradeBalanceHtml:html=>String(html||''),
  renderDashboard:()=>{
    window.__dashboardRows=S.categories.map(cat=>({
      id:cat.id,status:ctx.categoryStatus(cat),overall:ctx.overallCategoryStatus(cat),
      balance:ctx.categoryBalance(cat),balanceAgain:ctx.categoryBalance(cat),streak:ctx.computeDayStreak()
    }));
    return ctx.v268UpgradeBalanceHtml('<dashboard>');
  }
};
ctx.__legacyCategoryStatus=ctx.categoryStatus;
ctx.__legacyOverallCategoryStatus=ctx.overallCategoryStatus;
ctx.__legacyCategoryBalance=ctx.categoryBalance;
ctx.__legacyComputeDayStreak=ctx.computeDayStreak;
vm.createContext(ctx);
vm.runInContext(source,ctx,{filename:modulePath});
const expected=S.categories.map(cat=>({
  id:cat.id,status:ctx.__legacyCategoryStatus(cat),overall:ctx.__legacyOverallCategoryStatus(cat),
  balance:ctx.__legacyCategoryBalance(cat),balanceAgain:ctx.__legacyCategoryBalance(cat),
  streak:ctx.__legacyComputeDayStreak()
}));
const legacyCallsBeforeRender={status:legacyStatusCalls,overall:legacyOverallCalls,balance:legacyBalanceCalls};
const beforeData=JSON.stringify({sessions:S.sessions,library:S.library,categories:S.categories,settings:S.settings});
ctx.renderDashboard();
assert.equal(JSON.stringify(window.__dashboardRows),JSON.stringify(expected),
  'optimized category status, lifetime status, scheduler balance windows and streak must match legacy results');
assert.deepEqual(
  {status:legacyStatusCalls,overall:legacyOverallCalls,balance:legacyBalanceCalls},
  legacyCallsBeforeRender,
  'valid Dashboard data must use the aggregate instead of repeatedly invoking legacy full-history scans'
);
let audit=window.MediaFlowV549.inspect();
assert.equal(audit.lastSnapshotScanned,S.sessions.length,'one snapshot pass must scan each History record once');
assert.equal(audit.snapshotBuilds,1,'all Dashboard health helpers must share one render-scoped snapshot');
assert(audit.balanceCalculations<=S.categories.length,'each category balance must be calculated at most once per render');
assert(audit.balanceCacheHits>=S.categories.length,'repeated balance requests must reuse the cached result');
assert.equal(audit.markupPassThroughs,1,'the mounted Balance finalizer must avoid a detached-DOM round trip');
assert.equal(JSON.stringify({sessions:S.sessions,library:S.library,categories:S.categories,settings:S.settings}),beforeData,
  'the optimization must be read-only');

ctx.v159LibraryLookup();ctx.v159LibraryLookup();
assert.equal(libraryLookupCalls,1,'the On This Day Library lookup should be reused when Library content is unchanged');
ctx.v53InvalidateLibraryCache();
ctx.v159LibraryLookup();
assert.equal(libraryLookupCalls,2,'Library invalidation must clear the cached lookup');
ctx.v159LibraryLookup();
assert.equal(libraryLookupCalls,2,'the refreshed Library lookup should be cached again');

const largeCategories=Array.from({length:22},(_,i)=>({
  id:'cat-'+i,name:'Category '+i,enabled:true,weight:1+(i%4)/2,target:1+(i%3),minutesPerUnit:20+(i%5)*10
}));
const largeSessions=Array.from({length:30000},(_,i)=>{
  const timestamp=now-((i*11)%10000)*3600000;
  return {id:'large-'+i,categoryId:largeCategories[i%largeCategories.length].id,
    status:i%19===0?'skipped':'logged',timestamp,
    date:new Date(timestamp).toISOString().slice(0,10),
    minutes:i%7===0?0:(i%90)+1,actualAmount:(i%5)+1};
});
S.categories=largeCategories;S.sessions=largeSessions;
const beforeLarge=window.MediaFlowV549.inspect();
ctx.renderDashboard();
const afterLarge=window.MediaFlowV549.inspect();
assert.equal(afterLarge.snapshotBuilds,beforeLarge.snapshotBuilds+1,
  'a 30,000-record History must still build only one Dashboard snapshot');
assert.equal(afterLarge.lastSnapshotScanned,30000,'the 30,000-record fixture must be fully accounted for');
assert.equal(afterLarge.totalSessionsScanned-beforeLarge.totalSessionsScanned,30000,
  'Dashboard work must not rescan all History once per category');
assert.equal(afterLarge.balanceCalculations-beforeLarge.balanceCalculations,largeCategories.length,
  'all category balance values must be calculated once and reused across repeated requests');
assert.equal(afterLarge.legacyFallbacks,beforeLarge.legacyFallbacks,
  'valid 30,000-record History must not fall back to the per-category legacy sort');
console.log('PASS v549: Dashboard health parity, single-pass 30,000-record History aggregation, cached On This Day Library lookup, and read-only data integrity.');
