#!/usr/bin/env node
/* MediaFlow v508 — synthetic Dashboard/Library category presentation tests.
 * Zero real auth, cloud writes, Library mutation or Supabase requests. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const current=JSON.parse(read('version.json'));
assert.equal(read('VERSION').trim(),'508');
for(const k of ['version','appVersion','build'])assert.equal(current[k],508);
const order=JSON.parse(read('src/js/runtime-order.json'));
const modulePath='components/374-v508-unified-category-panels.js';
assert.equal(order.filter(p=>p===modulePath).length,1);
assert.equal(order[order.length-1],modulePath,'Unified settings must load last');
const index=read('index.html');
assert.match(index,/mediaflow-v508\.bundle\.js/);
assert.match(index,/287-v508-category-panel-studio\.css/);
assert.match(index,/<meta name="mediaflow-version" content="508">/);
const code=read('src/js/'+modulePath);
const bundle=read('assets/js/mediaflow-v508.bundle.js');
assert.ok(bundle.includes(code),'Application bundle must include the final shared resolver');
const worker=read('sw.js');
assert.match(worker,/const MEDIAFLOW_VERSION=508;/);
assert.match(worker,/mediaflow-pwa-v508-shell/);
assert.ok(worker.includes('./assets/js/mediaflow-v508.bundle.js'));
const library=read('src/js/legacy/117-v183.js');
const dashboard=read('src/js/pages/dashboard/011-view-dashboard.js');
const b265=read('src/js/components/199-v265-ux-stability-library-balance-sidebar.js');
const legacyBalance=[
 'src/js/pages/dashboard/011-view-dashboard.js',
 'src/js/components/195-v261-library-history-balance-polish.js',
 'src/js/components/198-v264-library-balance-order-settings-polish.js',
 'src/js/components/199-v265-ux-stability-library-balance-sidebar.js'
];
for(const f of legacyBalance)assert.ok(read(f).includes("mf508VisibleCategories('todayBalance')"),f+' must use unified display scope');
assert.ok(library.includes("mf508VisibleCategories('libraryOverview')"),'Library Overview must honor main categories rather than all');
assert.ok(library.includes("typeof mf508Ensure==='function'?mf508Ensure().libraryOverview.enabled"),'Overview toggle must reflect unified setting');
assert.ok(b265.includes("metricScope==='all'||selectedIds.has(String(s.categoryId))"),'Balance summary scope must be visual-only');
assert.ok(b265.includes('mf508HealthSummaryHtml(cats)'),'Balance renderer must show scope-aware health overview');
assert.ok(code.includes("if(source===other&&cfg[other].source===key)"),'Mutual follow must be prevented');
assert.ok(code.includes("mergeStates=function(a,b)"),'Cloud merging must preserve independent settings');
const cats=[
 {id:'anime',name:'Anime',enabled:true,color:'#ffa',target:4,unit:'episodes'},
 {id:'movies',name:'Movies',enabled:false,color:'#acc',target:1,unit:'movies'},
 {id:'books',name:'Books',enabled:true,color:'#cab',target:5,unit:'chapters'},
 {id:'tv',name:'TV',enabled:true,color:'#ccc',target:2,unit:'episodes'}
];
let saved=0,rendered=0;const toasts=[];
const S={categories:cats,view:'dashboard',library:[],settings:{
 v192Dashboard:{showTodayBalance:true,showRatingQueue:true},
 v183LibraryOverview:{showOverview:true,modifiedAt:0},
 v186ControlCenter:{
  scheduler:{mode:'custom',categoryIds:['movies','tv'],modifiedAt:5},
  todayBalance:{mode:'follow',categoryIds:['anime','tv'],modifiedAt:0}
 }
}};
const App={v192ToggleDashboardSection(){},v183ToggleLibraryOverview(){}};
const ctx={S,App,DEFAULT_SETTINGS:{},console,
 persistSettings(){saved++;},render(){rendered++},showToast(t){toasts.push(t)},
 v192EnsureDashboardSettings(s){return s.v192Dashboard;},
 v183EnsureLibraryOverview(s){return s.v183LibraryOverview;},
 v186ScopeCategories(scope){assert.equal(scope,'scheduler');return cats.filter(c=>['movies','tv'].includes(c.id));},
 mergeStates(a,b){return {settings:JSON.parse(JSON.stringify(a.settings||{}))};},
 renderSettings(){return '<div class="section-label">DASHBOARD SETTINGS</div><div class="card v186-settings-card">OBSOLETE TODAY FILTER</div><div class="section-label">STATISTICS SETTINGS</div>';},
 escapeHtml:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),
 v144CategoryIconHtml:c=>'icon-'+c.id,Date,Set,Map,Object,Number,Array,JSON,Math,String,window:{}
};
vm.createContext(ctx);
vm.runInContext(code,ctx,{filename:modulePath});
const resolve=k=>Array.from(ctx.window.MediaFlowV508.resolve(k)).map(c=>c.id);
assert.deepEqual(resolve('todayBalance'),['anime','books','tv'],'Default Today follows enabled main Categories');
assert.deepEqual(resolve('libraryOverview'),['anime','books','tv'],'Default Library follows enabled main Categories');
assert.equal(ctx.window.MediaFlowV508.inspect().settings.todayBalance.metrics,'all');
const markup=vm.runInContext('renderSettings()',ctx);
assert.ok(markup.includes('Library Overview'));
assert.ok(markup.includes('Follow MediaFlow System rotation'));
assert.ok(markup.includes('Show section'));
assert.ok(markup.includes('Balance insights scope'));
assert.ok(!markup.includes('OBSOLETE TODAY FILTER'),'Do not display contradictory v186 Today settings');
ctx.App.mf508SetSource('todayBalance','system');
assert.deepEqual(resolve('todayBalance'),['movies','tv'],'System scope can deliberately include main-disabled Movies');
ctx.App.mf508SetSource('todayBalance','categories');
assert.deepEqual(resolve('todayBalance'),['anime','books','tv'],'Returning to Categories excludes Movies');
ctx.App.mf508SetSource('libraryOverview','todayBalance');
assert.deepEqual(resolve('libraryOverview'),['anime','books','tv'],'Follow Today uses same list');
ctx.App.mf508SetSource('todayBalance','libraryOverview');
assert.equal(ctx.window.MediaFlowV508.inspect().settings.todayBalance.source,'categories','Circular follow rejected');
assert.match(toasts.join(' '),/cannot follow each other/i);
ctx.App.mf508SetSource('todayBalance','custom');
assert.deepEqual(resolve('todayBalance'),['anime','books','tv'],'Switching to custom preserves current visible list');
ctx.App.mf508SetCategory('todayBalance','movies',true);
assert.deepEqual(resolve('todayBalance'),['anime','books','tv','movies'],'Custom can include disabled Movies');
ctx.App.mf508MoveCategory('todayBalance','movies',0);
assert.deepEqual(resolve('todayBalance'),['movies','anime','books','tv'],'Custom reorder respected');
ctx.App.mf508SetCategory('todayBalance','movies',false);
assert.deepEqual(resolve('todayBalance'),['anime','books','tv'],'Custom hide removes Movies');
assert.deepEqual(resolve('libraryOverview'),['anime','books','tv'],'Linked Library updates automatically');
ctx.App.mf508SetSource('libraryOverview','custom');
ctx.App.mf508SetCategory('libraryOverview','movies',true);
assert.ok(resolve('libraryOverview').includes('movies'),'Library custom can display disabled Movies independently');
ctx.App.mf508SetCategory('libraryOverview','movies',false);
assert.ok(!resolve('libraryOverview').includes('movies'),'Library custom can hide Movies');
ctx.App.mf508SetEnabled('libraryOverview',false);
assert.equal(ctx.window.MediaFlowV508.inspect().settings.libraryOverview.enabled,false);
assert.equal(S.settings.v183LibraryOverview.showOverview,false,'Shared existing overview switch');
ctx.App.v183ToggleLibraryOverview();
assert.equal(ctx.window.MediaFlowV508.inspect().settings.libraryOverview.enabled,true);
ctx.App.mf508SetEnabled('todayBalance',false);
assert.equal(S.settings.v192Dashboard.showTodayBalance,false);
ctx.App.v192ToggleDashboardSection('showTodayBalance');
assert.equal(ctx.window.MediaFlowV508.inspect().settings.todayBalance.enabled,true);
ctx.App.mf508SetMetricScope('visible');
assert.equal(ctx.window.MediaFlowV508.inspect().settings.todayBalance.metrics,'visible');
ctx.App.mf508SetAll('libraryOverview',false);
assert.deepEqual(resolve('libraryOverview'),[],'No category selected must show none, not a fallback to all');
ctx.App.mf508SetAll('libraryOverview',true);
assert.equal(resolve('libraryOverview').length,cats.length,'Custom show all includes disabled main categories');
assert.ok(saved>5&&rendered>5,'Settings changes must persist and rerender');
const a={settings:{v508Panels:ctx.window.MediaFlowV508.inspect().settings}};
const b={settings:{v508Panels:JSON.parse(JSON.stringify(a.settings.v508Panels))}};
b.settings.v508Panels.libraryOverview.enabled=false;
b.settings.v508Panels.libraryOverview.modifiedAt+=100;
const merged=vm.runInContext('mergeStates',ctx)(a,b);
assert.equal(merged.settings.v508Panels.libraryOverview.enabled,false,'Newer cloud settings must win per section');
assert.equal(merged.settings.v183LibraryOverview.showOverview,false,'Cloud mirrors legacy switch');
// Actual Library Overview output must hide Movies under Categories.
ctx.App.mf508SetSource('libraryOverview','categories');
ctx.S.settings.v508Panels.libraryOverview.enabled=true;
ctx.v53LibraryOverview=()=>({byCat:new Map(cats.map(c=>[c.id,{items:1,done:1,knownDone:1,total:2,unknown:false}])),overallPct:50});
ctx.v183LibraryOverviewEstimate=(cat,x)=>({pct:50,total:2,estimated:false});
const start=library.indexOf('function v183LibraryOverviewHtml(){');
const end=library.indexOf('\nfunction v183ToggleLibraryOverview(){',start);
assert.ok(start>=0&&end>start);
vm.runInContext(library.slice(start,end),ctx,{filename:'legacy-overview'});
const libraryHtml=vm.runInContext('v183LibraryOverviewHtml()',ctx);
assert.match(libraryHtml,/Anime/);
assert.doesNotMatch(libraryHtml,/Movies/,'Main-disabled Movies must not appear in Library Overview');
ctx.App.mf508SetSource('libraryOverview','custom');
ctx.App.mf508SetCategory('libraryOverview','movies',true);
assert.match(vm.runInContext('v183LibraryOverviewHtml()',ctx),/Movies/,'Custom override must display Movies');
// Actual Today markup calculates visible-only summary without changing History.
ctx.S.settings.v508Panels.todayBalance.source='categories';
ctx.S.settings.v508Panels.todayBalance.metrics='visible';
const sessions=[
 {id:'a',categoryId:'anime',actualAmount:4,minutes:80,status:'done'},
 {id:'b',categoryId:'movies',actualAmount:99,minutes:990,status:'done'}
];
ctx.todaysSessions=()=>sessions;
ctx.categoryStatus=()=> 'healthy';
ctx.overallCategoryStatus=()=> 'healthy';
ctx.v265Clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
ctx.v265Esc=s=>String(s);
ctx.unitLabel=u=>u;
ctx.computeDayStreak=()=>7;
ctx.fmtMinutes=x=>String(x)+' min';
ctx.v265Guidance=()=>({label:'On track',clean:'Keep rotating'});
ctx.v43BalanceGuidance=()=> '';
ctx.v144CategoryIconHtml=c=>'icon-'+c.id;
const x=b265.indexOf('function v265BalanceMarkup(){'),y=b265.indexOf('\nfunction v265EnhanceBalance(){',x);
assert.ok(x>=0&&y>x);
vm.runInContext(b265.slice(x,y),ctx,{filename:'balance-v265'});
const visible=vm.runInContext('v265BalanceMarkup()',ctx);
assert.doesNotMatch(visible,/Movies/,'Today balance row does not include main-disabled Movies');
assert.match(visible,/>4<\/b><span>units<\/span>/,'Visible-only consumption summary excludes hidden Movies');
assert.match(visible,/Only displayed categories · 3 total/,'Visible-only health summary counts three displayed categories');
ctx.App.mf508SetMetricScope('all');
const overall=vm.runInContext('v265BalanceMarkup()',ctx);
assert.match(overall,/>103<\/b><span>units<\/span>/,'All-category balance summary includes hidden Movies');
assert.match(overall,/All categories, including hidden · 4 total/,'All-category health overview counts hidden Movies');
assert.equal(sessions[1].actualAmount,99,'Reporting must not modify history');
const stored=ctx.S.settings.v508Panels;
assert.deepEqual(JSON.parse(JSON.stringify(stored.todayBalance.hiddenIds)),['movies'],
 'Category visibility remains an independent preference');
console.log('PASS v508: Categories/System/custom/linked/cycle, custom order, toggle persistence, Library/Today render and summary scope, cloud merge, PWA');
