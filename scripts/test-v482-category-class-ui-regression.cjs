/* v482 — category assignment, filtering and modal scroll invariants */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'482');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-2),'components/368-v481-category-class-management.js');
cp.execFileSync(process.execPath,['scripts/test-v482-scheduler-regression.cjs'],{stdio:'pipe'});
const source=fs.readFileSync('src/js/components/368-v481-category-class-management.js','utf8');
const css=fs.readFileSync('assets/css/281-v482-category-class-ui.css','utf8');
assert(!/reset.*categor|delete.*categor|S\.sessions\s*=|S\.library\s*=/.test(source));
assert(css.includes('.mf482-modal-body')&&css.includes('overflow-y:auto!important'));
assert(css.includes('.mf482-modal-header,.mf482-modal-footer')&&css.includes('flex:0 0 auto'));
assert(css.includes('.mf482-member[hidden],.mf482-category-line[hidden]'));
const categories=[
 {id:'seasonal',name:'Seasonal Anime',enabled:true,icon:'🌸'},
 {id:'finished',name:'Finished Anime',enabled:true,icon:'📽️'},
 {id:'tv',name:'TV Shows',enabled:true,icon:'📺'},
 {id:'manga',name:'Manga',enabled:false,icon:'📚'}
];
const prefs={enabled:true,strength:'balanced',avoidRepeat:true,rewardNeglect:true,
 freshInfluence:true,adaptAmount:false,classes:[
 {id:'anime',name:'Anime',weight:1,enabled:true,categoryIds:['seasonal']},
 {id:'television',name:'Television',weight:1,enabled:true,categoryIds:['tv']}
]};
let saved=null,toast=[],panelRenders=0,originalSaveCalls=0;
const S={categories,sessions:[{categoryId:'seasonal',minutes:40}],settings:{v480CategoryClasses:prefs},view:'settings'};
const App={};const window={MediaFlowSettingsRegistry:null};
const mockNode=(name,checked=false)=>({dataset:{mf482MemberName:name},hidden:false,
 querySelector:()=>({checked})});
const rows=[mockNode('seasonal anime',true),mockNode('finished anime',false),mockNode('tv shows',false),mockNode('manga',true)];
let scroll=197,search={value:'anime'},only={checked:false},counter={textContent:''},empty={hidden:true};
const modal={
 querySelector:sel=>({
  '#mf482-member-search':search,'#mf482-only-selected':only,
  '#mf482-member-empty':empty,'#mf482-selected-count':counter
 })[sel]||null,
 querySelectorAll:sel=>sel==='[data-mf482-member-name]'?rows:
  sel==='[data-mf480-member]:checked'?[{},{}]:[]
};
const sidebarSearch={textContent:''};
const sidebarRows=categories.map(c=>({dataset:{mf482Filter:c.name.toLowerCase()},hidden:false}));
const sidebar={querySelectorAll:sel=>sel==='[data-mf482-sidebar-category]'?sidebarRows:[],
 querySelector:sel=>sel==='.mf482-sidebar-count'?sidebarSearch:null};
const document={
 getElementById:id=>id==='mf480-modal'?modal:null,
 querySelector:()=>null,querySelectorAll:()=>[],
 createElement:()=>({}),
 activeElement:null
};
const ctx={S,App,window,document,MediaFlowRuntime:{registerPageEnhancer:()=>{},version:480},
 v480Prefs:()=>JSON.parse(JSON.stringify(S.settings.v480CategoryClasses)),
 v480Write:p=>{saved=JSON.parse(JSON.stringify(p));S.settings.v480CategoryClasses=saved;return saved;},
 v480RefreshPanel:()=>{panelRenders++},
 v480SaveClass:()=>{originalSaveCalls++;return true;},
 v480Icon:c=>'<span>'+c.icon+'</span>',
 v144CategoryIconHtml:c=>'<span>'+c.icon+'</span>',
 escapeHtml:s=>String(s),showToast:s=>toast.push(s),uid:()=>String(Date.now()),
 ICON_CHOICES:['✨','📚'],COLOR_CHOICES:['#FFFFFF'],
 v144SafeIconUrl:v=>v,v258BuiltInCategoryIconPalette:()=>'<b>icons</b>',
 v144IconSwatchHtml:()=>'',v144CustomIconsHtml:()=>'',v144ColorSwatchHtml:()=>'',v144CustomColorsHtml:()=>'',Math,Date
};
vm.runInNewContext(source,ctx,{filename:'v482.js'});
assert.equal(window.MediaFlowV482.version,482);
assert.equal(typeof App.mf482FilterModal,'function');
assert.equal(typeof App.mf482FilterSidebar,'function');
assert.equal(typeof App.mf482AssignCategory,'function');
assert.equal(typeof App.mf482Drop,'function');
assert.equal(App.mf482AssignCategory('finished','anime'),true);
assert.deepEqual(Array.from(saved.classes[0].categoryIds),['seasonal','finished']);
assert.deepEqual(Array.from(saved.classes[1].categoryIds),['tv']);
assert.equal(App.mf482AssignCategory('tv','anime'),true);
assert(!saved.classes[1].categoryIds.includes('tv'));
assert(saved.classes[0].categoryIds.includes('tv'));
assert.equal(App.mf482AssignCategory('manga','anime'),true,'Disabled category may be assigned; scheduler separately excludes');
assert(saved.classes[0].categoryIds.includes('manga'));
assert.equal(App.mf482AssignCategory('seasonal',''),true);
assert(!saved.classes[0].categoryIds.includes('seasonal'));
assert.equal(App.mf482AssignCategory('invalid','anime'),false);
assert.equal(App.mf482AssignCategory('finished','bad'),false);
App.mf482FilterSidebar('anime',sidebar);
assert.deepEqual(sidebarRows.map(x=>x.hidden),[false,false,true,true]);
assert.equal(sidebarSearch.textContent,'2');
search.value='anime';const priorScroll=scroll;
App.mf482FilterModal();
assert.deepEqual(rows.map(x=>x.hidden),[false,false,true,true]);
assert.equal(scroll,priorScroll,'Checkbox filtering may not jump scroll');
only.checked=true;App.mf482FilterModal();
assert.deepEqual(rows.map(x=>x.hidden),[false,true,true,true]);
assert.equal(scroll,priorScroll);
App.mf482SelectionChanged();
assert.equal(counter.textContent,'2 selected');
assert.equal(originalSaveCalls,0,'Assignment selection remains draft until Save');
assert(source.includes("const memberIds=[...modal.querySelectorAll('[data-mf480-member]:checked')]")===false,
 'v482 must delegate to v480 canonical save rather than duplicate membership');
assert(source.includes('return v480SaveClass(id,button)'));
assert(source.includes('ondragstart="App.mf482DragStart'));
assert(source.includes('App.mf482Drop('));
assert(source.includes('ondragover="App.mf482DragOver'));
assert(source.includes('oninput="App.mf482FilterModal(this.value)"'));
assert(source.includes('onchange="App.mf482SelectionChanged()"'));
assert(source.includes('App.v144AddCustomCategoryEmoji()'));
assert(source.includes('App.v144AddCustomCategoryUrl()'));
assert(source.includes('App.v144AddCustomCategoryColor()'));
assert(source.includes('v258BuiltInCategoryIconPalette(url)'));
assert(!source.includes('categoryModalHtml('),'No full Category modal reused');
assert(source.includes('mf482ModalColorSection')&&source.includes('mf482ModalIconSection'));
assert(css.includes('scrollbar-gutter:stable'));
assert(css.includes('max-height:calc(100dvh - 12px)'));
assert(css.includes('@media(max-width:620px)'));
console.log('PASS v482: drag/drop + dropdown assignment, one-class-per-category transfers, disabled category preserved, search selections and scroll continuity, dedicated modal, shared icons/colors and v480 regression');
