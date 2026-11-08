/* v563 release contract: On This Day hides deleted titles, Old System Consume
 * keeps its rule costs and Undo entry, deleting a category fills the recovery
 * slot. Runs the real v153 / v563 code with small stand-ins. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=563,'VERSION must be v563 or newer');
const runtime=JSON.parse(read('src/js/runtime-order.json'));
assert(runtime.indexOf('components/406-v563-fixes.js')>runtime.indexOf('components/405-v562-library-history-more.js'),'v563 module loads after v562');
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`),'HTML loads the current bundle');
assert(fs.existsSync(path.join(root,'docs/release-v563.md')),'release notes present');
if(version===563){
  const wf=read('.github/workflows/publish-v563.yml');
  assert(wf.includes('test "$(cat VERSION)" = 563')&&wf.includes('legacy/v/563')&&wf.includes('gh release create 563'),'release workflow archives and releases v563');
}
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v563"'),'deploy runs after the v563 release');

const mod=read('src/js/components/406-v563-fixes.js');
const oldSystem=read('src/js/pages/old-system/057-v153-old-system.js');
const UNITS=read('src/js/core/constants/001-constants.js').match(/const UNITS = \{[\s\S]*?\n\};/)[0];
const ctx={console,JSON,Object,Array,Math,Number,String,Map,Set,Date,window:{},MediaFlowRuntime:{}};
vm.createContext(ctx);
vm.runInContext(`
${UNITS}
let S={
  categories:[{id:'anime',name:'Anime',unit:'episodes'},{id:'manga',name:'Manga',unit:'chapters'}],
  sessions:[],
  library:[{id:'kept',title:'Kept',categoryId:'anime'}],
  oldSystem:null,
};
const App={confirmDeleteCategory(id,button){S.categories=S.categories.filter(c=>c.id!==id);}};
let __uid=0;function uid(){return 'u'+(++__uid);}
function unitLabel(u,n){const x=UNITS[u]||UNITS.episodes;return n===1?x.singular:x.label;}
function getCategory(id){return S.categories.find(c=>c.id===id)||{id,name:'(removed category)',unit:'episodes'};}
function escapeHtml(s){return String(s);} function saveState(){} function render(){} function showToast(t){globalThis.__toast=t;}
const document={getElementById(){return {value:''};}};
const ICONS={},NAV_ITEMS=[],MOBILE_MORE_NAV=[];
function renderView(){} function persistSessions(){} function mfCommit(){} function mfRestoreCore(){} function snapshot(){return {};}
async function loadAll(){} function v46ApplyState(){} function mergeStates(){return {};} function v148BackupManifest(){return {};}
function v144CategoryIconHtml(){return '';} function fmtMinutes(m){return m+'m';}
${oldSystem}
function v159BuildOnThisDayModel(){
  const rows=[
    {kind:'logged',title:'Kept',item:S.library[0]},
    {kind:'logged',title:'Gone',item:null,libraryId:'gone'},
    {kind:'logged',title:'Stale',item:{id:'deleted-later'}},
    {kind:'started',title:'Kept',item:S.library[0]},
  ];
  return {dirty:false,dayKey:'x',groups:[{years:1,rows},{years:2,rows:[{kind:'logged',title:'Gone',item:null}]}],flat:rows};
}
${mod}
globalThis.api={S:()=>S,App,otd:()=>v159BuildOnThisDayModel()};
`,ctx);

// 1. On This Day
const m=ctx.api.otd();
assert.equal(m.groups.length,1,'a year with only deleted titles disappears');
assert.equal(JSON.stringify(m.groups[0].rows.map(r=>r.title)),'["Kept","Kept"]','deleted titles are left out, Library milestones stay');
assert.equal(JSON.stringify(m.flat.map(r=>r.kind)),'["logged","started"]');

// 2. Old System: consume keeps rule costs and the Undo entry
vm.runInContext(`
v153ToggleCategory('anime');v153ToggleCategory('manga');v153AddRule();
S.oldSystemUI.consumeCategoryId='manga';S.oldSystemUI.consumeAmount=4;v153ApplyConsumption();
`,ctx);
let os=ctx.api.S().oldSystem;
assert.equal(os.balances.manga,4,'consumed category goes up');
assert.equal(os.balances.anime,-4,'the rule subtracts from the source category');
assert.equal(os.transactions.length,1,'the entry is recorded');
vm.runInContext('v153Undo();',ctx);
os=ctx.api.S().oldSystem;
assert.equal(os.balances.manga,0);assert.equal(os.balances.anime,0);assert.equal(os.transactions.length,0,'Undo reverses it');

// 3. Category delete fills the recovery slot
vm.runInContext(`App.confirmDeleteCategory('manga',{dataset:{}});`,ctx);
const rec=ctx.api.S().categoryRecovery;
assert.equal(rec.lastDeletedCategory.id,'manga');assert.equal(rec.lastDeletedIndex,1);
assert.equal(ctx.api.S().categories.length,1,'the category is still deleted');
console.log('v563 release contract passed');
