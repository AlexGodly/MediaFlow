/* v514 integration contract: run with "node tests/test-v514-category-settings.cjs".
 * Tests the actual v508 handlers + v514 registered Settings renderer together
 * without touching user data or requiring a production Supabase connection. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const component=p=>fs.readFileSync(path.join(root,'src/js/components',p),'utf8');
const registeredSections=[],registeredSettings=[],pageRenderers=new Map();
const categories=[
  {id:'anime',name:'Anime',enabled:true,color:'#4477dd',target:3},
  {id:'movies',name:'Movies',enabled:false,color:'#cc8811',target:2},
  {id:'books',name:'Books',enabled:true,color:'#33aa99',target:1}
];
let saves=0,renders=0,toast='';
const S={
  categories,
  settings:{v192Dashboard:{showTodayBalance:true},v183LibraryOverview:{showOverview:true}},
  library:[],
  sessions:[]
};
const DEFAULT_SETTINGS={v192Dashboard:{showTodayBalance:true},v183LibraryOverview:{showOverview:true}};
const App={v183ToggleLibraryOverview(){},v192ToggleDashboardSection(){}};
const shell='<div class="v221-settings-page"><main class="v221-settings-content">'+
  '<div class="section-label">LEVELING & XP</div><section id="v348-xp-settings">XP settings preserved</section>'+
  '<div id="v221-settings-empty" hidden>No results</div></main></div>';
pageRenderers.set('settings',()=>shell);
const context={
  S,DEFAULT_SETTINGS,App,
  window:{},
  Date,Math,Map,Set,Number,String,Array,Object,JSON,console,
  renderSettings(){return '<div class="section-label">DASHBOARD SETTINGS</div><div class="card">Legacy</div><div class="section-label">STATISTICS SETTINGS</div>';},
  persistSettings(){saves++;},
  render(){renders++;},
  mergeStates(a,b){return {settings:{...a?.settings,...b?.settings}};},
  v192EnsureDashboardSettings(settings){return settings.v192Dashboard||(settings.v192Dashboard={showTodayBalance:true});},
  v183EnsureLibraryOverview(settings){return settings.v183LibraryOverview||(settings.v183LibraryOverview={showOverview:true});},
  v186ScopeCategories(scope){assert.equal(scope,'scheduler');return [categories[2]];},
  categoryStatus(cat){return cat.id==='movies'?'due':'healthy';},
  overallCategoryStatus(cat){return cat.id==='books'?'overused':'healthy';},
  v144CategoryIconHtml(cat){return '<i>'+cat.name+'</i>';},
  escapeHtml(value){return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');},
  showToast(value){toast=String(value);},
  v264BalanceMarkup(){return '<div class="original-balance"><b>Existing consumption totals unchanged</b></div>';},
  V219_PAGE_RENDERERS:pageRenderers,
  MediaFlowRuntime:{registerPageRenderer(name,fn){pageRenderers.set(name,fn);}},
  v366RegisterSection(input){registeredSections.push(input);return input;},
  v366RegisterSetting(input){registeredSettings.push(input);return input;}
};
vm.createContext(context);
vm.runInContext(component('374-v508-unified-category-panels.js'),context,{filename:'v508.js'});
vm.runInContext(component('375-v514-canonical-category-settings.js'),context,{filename:'v514.js'});
const api=context.window.MediaFlowV514;
assert(api,'v514 API should be installed');
assert.equal(api.inspect().settingsRendererActive,true);
assert.equal(registeredSections.length,3);
assert.deepEqual(registeredSections.map(x=>x.id),[
  'v221-settings-today-s-balance','v221-settings-library-overview-display','v221-settings-pwa-update-recovery'
]);
assert(registeredSettings.length>=4,'settings search metadata must be registered');
assert.equal(registeredSections[0].category,'dashboard');
assert.equal(registeredSections[1].category,'library');
assert.equal(registeredSections[2].category,'app');

const markup=pageRenderers.get('settings')();
assert(markup.includes('XP settings preserved'),'existing Settings controls must remain intact');
for(const name of ['todayBalance','libraryOverview'])
  assert.equal(markup.split('data-mf508-panel="'+name+'"').length-1,1,'one '+name+' panel');
assert(markup.indexOf('data-mf508-panel="todayBalance"')>markup.indexOf('v221-settings-content'));
assert(markup.indexOf('data-mf508-panel="libraryOverview"')<markup.indexOf('id="v221-settings-empty"'));
assert(markup.includes('Force latest app update'));
assert(markup.includes('Follow Categories (default)'));
assert(markup.includes('Balance insights scope'));
assert(!markup.includes('v220-settings-page'),'obsolete v220 settings DOM must not replace canonical v221');
assert.equal(pageRenderers.get('settings')(),markup,'rerenders should not duplicate sections');

const same=arr=>Array.from(arr).join(',');
assert.equal(same(api.inspect().todayCategoryIds),'anime,books','default follows enabled categories');
assert.equal(same(api.inspect().overviewCategoryIds),'anime,books');
assert.equal(api.inspect().todayBalance.enabled,true);
assert.equal(api.inspect().libraryOverview.enabled,true);
assert.equal(api.inspect().todayBalance.metrics,'all','balance insights default to all categories');

// Main Category Settings toggle is reflected immediately in both panels.
categories[1].enabled=true;
assert.equal(same(api.inspect().todayCategoryIds),'anime,movies,books');
categories[1].enabled=false;

// System source follows the scheduler scope, not the Category Settings scope.
App.mf508SetSource('todayBalance','system');
assert.equal(same(api.inspect().todayCategoryIds),'books');
App.mf508SetSource('todayBalance','categories');
assert.equal(same(api.inspect().todayCategoryIds),'anime,books');

// Custom visibility and ordering, including disabled source categories.
App.mf508SetSource('todayBalance','custom');
App.mf508SetCategory('todayBalance','movies',true);
App.mf508MoveCategory('todayBalance','movies',0);
assert.equal(same(api.inspect().todayCategoryIds),'movies,anime,books');
App.mf508SetCategory('todayBalance','anime',false);
assert.equal(same(api.inspect().todayCategoryIds),'movies,books');
// Both custom panels must use native checkboxes. The former button was
// auto-iconified by v225/v226, rendering a circle-arrow beside the minus.
App.mf508SetSource('libraryOverview','custom');
const customMarkup=pageRenderers.get('settings')();
for(const key of ['todayBalance','libraryOverview']){
  const start=customMarkup.indexOf('data-mf508-panel="'+key+'"');
  const finish=customMarkup.indexOf('</section>',start);
  assert(start>=0&&finish>start,'custom panel must render for '+key);
  const html=customMarkup.slice(start,finish);
  assert.match(html,/<input type="checkbox" class="mf508-cat-toggle"/,'native checkbox required for '+key);
  assert(!html.includes('<button type="button" class="mf508-cat-toggle'),'no auto-iconified toggle buttons in '+key);
  assert(!html.includes('v225-btn-icon'),'no decorative circle-arrow in '+key);
  assert(!html.includes('>−</button>'),'unchecked state must not contain a minus glyph');
  assert(html.includes("App.mf508SetCategory('"+key+"','movies',this.checked)"),'checkbox must control visibility for '+key);
  assert(html.includes('aria-label="Show Movies in '),'checkbox must remain accessible for '+key);
}
const toggleCss=fs.readFileSync(path.join(root,'assets/css/287-v508-category-panel-studio.css'),'utf8');
assert(toggleCss.includes('-webkit-appearance:checkbox;'),'native checkboxes must retain their browser rendering');
App.mf508SetSource('libraryOverview','todayBalance');
assert.equal(same(api.inspect().overviewCategoryIds),'movies,books','follow-other mirrors visibility and order');
App.mf508SetSource('todayBalance','libraryOverview');
assert.equal(api.inspect().todayBalance.source,'custom','circular dependencies must be rejected');
assert(/cannot follow each other/.test(toast));

// Health summary scope affects its counts but not preexisting balance markup.
App.mf508SetMetricScope('visible');
let health=context.v264BalanceMarkup();
assert(health.includes('Existing consumption totals unchanged'));
assert(health.includes('Only displayed categories'));
assert(health.includes('2 total'));
App.mf508SetMetricScope('all');
health=context.v264BalanceMarkup();
assert(health.includes('All categories, including hidden'));
assert(health.includes('3 total'));
assert(health.includes('Existing consumption totals unchanged'));
App.mf508SetEnabled('todayBalance',false);
assert.equal(api.inspect().todayBalance.enabled,false);
assert.equal(S.settings.v192Dashboard.showTodayBalance,false,'dashboard legacy visibility must stay synced');
App.mf508SetEnabled('libraryOverview',false);
assert.equal(S.settings.v183LibraryOverview.showOverview,false);
assert(saves>5&&renders>5,'settings edits must persist and redraw');
const state={settings:{v508Panels:{...JSON.parse(JSON.stringify(S.settings.v508Panels))}}};
const older={settings:{v508Panels:{todayBalance:{source:'categories',modifiedAt:1}}}};
const merged=context.mergeStates(older,state);
assert.equal(merged.settings.v508Panels.todayBalance.source,'custom','cloud merge preserves newer settings');
assert.equal(merged.settings.v183LibraryOverview.showOverview,false);
console.log('PASS: canonical v221/v365 Settings Center sections, search metadata, XP preservation, sources, ordering, following, visibility, health scope, persistence and cloud merge, icon-free checkboxes.');
