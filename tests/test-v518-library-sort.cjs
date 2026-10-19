/* v518: run with "node tests/test-v518-library-sort.cjs".
 * Executes the actual v189 comparator, v224 shared controls, v53 Normal
 * Library/Dynamic Library filtering code, v517 remaining-units calculator and
 * v518 integration together, without touching cloud or Library data. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,'src/js',p),'utf8');
const data=[
  {id:'older',title:'Older TV',categoryId:'anime',status:'active',priority:'high',createdAt:100,progress:7,total:12},
  {id:'newer',title:'Newest TV',categoryId:'anime',status:'active',priority:'low',createdAt:900,progress:12,total:12},
  {id:'seasons',title:'Seasons TV',categoryId:'anime',status:'active',createdAt:300,progress:16,total:36,
   seasons:[{id:'s1',total:12,progress:10},{id:'s2',total:24,progress:6}]},
  {id:'unknown',title:'Unknown book',categoryId:'anime',status:'active',createdAt:450,progress:3,total:null},
  {id:'partial',title:'Partially unknown',categoryId:'anime',status:'active',createdAt:250,progress:6,total:12,
   seasons:[{id:'s1',total:12,progress:6},{id:'s2',total:null,progress:0}]},
  {id:'over',title:'Finished book',categoryId:'anime',status:'active',createdAt:700,progress:25,total:20},
  {id:'short',title:'Nearly finished',categoryId:'anime',status:'active',createdAt:550,progress:9,total:10}
];
const original=JSON.stringify(data);
let rendered=0,invalidations=0;
const cached={libraryToken:1,filtered:[],filterKey:'',searchIndex:data.map(item=>({item,search:item.title.toLowerCase()}))};
const settings={v181Library:{mode:'dynamic',activeCategoryId:'anime',activeStatus:'active'}};
const S={library:data,categories:[{id:'anime'}],histFilters:{},settings,libPage:0};
const App={};
const ctx={
  S,App,DEFAULT_SETTINGS:{},V53_LIB:cached,V189_RANDOM_COUNTER:0,
  Date,Number,Math,Array,Object,Map,Set,String,JSON,console,Intl,
  window:{},MediaFlowRuntime:{version:0},
  cleanTitle:s=>String(s||''),
  escapeHtml:s=>String(s||''),
  v53LastTouched:()=>0,
  v189RandomValue:()=>0,
  v189RandomSeed:()=>1,
  v189UnfinishedOnly:()=>false,
  v189IsUnfinished:()=>true,
  v53EnsureLibraryIndex(){},
  v53InvalidateLibraryCache(){cached.filterKey='';invalidations++;},
  v181EnsureLibrarySettings:()=>({mode:'dynamic',activeCategoryId:'anime',activeStatus:'active'}),
  v53FilteredLibrary(){return data;},
  v181DynamicRows(){return data;},
  v189SortMode(){return 'title-asc';},
  v189ShuffleLibraryRandom(){},
  v69SetLibrarySort(){},
  renderLibrary(){return '<input oninput="App.searchLibrary(this.value)">';},
  render(){rendered++;},
  v189UnfinishedFilterHtml:()=>'<div class="unfinished"></div>',
};
vm.createContext(ctx);
const execute=(source,filename)=>vm.runInContext(source,ctx,{filename});
const run=s=>vm.runInContext(s,ctx);
execute(read('core/runtime/149-v224-sort-foundation.js'),'v224-sort-foundation.js');
let source=read('pages/library/121-v189-library-sorting-unfinished-filter-dynamic.js');
execute("const V391_TITLE_COLLATOR=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});\n"+
 source.slice(source.indexOf('function v189CompareLibraryItems')),'v189-compare.js');
source=read('pages/library/122-v53-cached-library-filtering-now-understands-the-v189.js');
execute(source.slice(0,source.indexOf('/* Persistent Last Seen')),'v189-filtering.js');
execute(read('pages/library/150-v224-library-controls.js'),'v224-library-controls.js');
source=read('components/271-v373-logging-order-studio.js');
execute(source.slice(source.indexOf('function v373RemainingUnits'),source.indexOf('function v373CompareData')),'v517-remaining.js');

// Pre-v518 initialization really picks Alphabetic ascending.
assert.equal(run('v224LibrarySortState().key'),'title-asc');
execute(read('components/376-v518-library-remaining-sort.js'),'v518-library-sort.js');
const normal=()=>ctx.v53FilteredLibrary('all','all','all','');
const dynamic=()=>ctx.v181DynamicRows();
const ids=arr=>Array.from(arr,item=>item.id);
const both=(expected,comment)=>{
  assert.deepEqual(ids(normal()),expected,'Normal Library: '+comment);
  assert.deepEqual(ids(dynamic()),expected,'Dynamic Library: '+comment);
};
assert.equal(run('v224LibrarySortState().key'),'added-desc','default newest-first');
assert.equal(run('v189SortMode()'),'added-desc');
assert.equal(S.histFilters.v518DefaultApplied,true);
both(['newer','over','short','unknown','seasons','partial','older'],'newest-first default');
const html=run('v189SortControlHtml()');
assert.match(html,/<option value="remaining"/,'shared Library control must contain Remaining episodes / chapters');
assert.match(html,/Remaining episodes \/ chapters/,'correct shared option label');
assert.match(html,/Date added to Library/,'clear Date added label');
assert.match(html,/<option value="added" selected/,'newest-first selected by default');
assert.deepEqual(Array.from(run('V224_LIBRARY_SORT_OPTIONS')).filter(([key])=>key==='remaining').map(x=>Array.from(x)),
  [['remaining','Remaining episodes / chapters']],'one sorter option only');

run("App.v69SetLibrarySort('remaining')");
assert.equal(run('v224LibrarySortState().key'),'remaining-desc');
both(['seasons','older','short','over','newer','partial','unknown'],'most remaining first; unknown last');
const remHtml=run('v189SortControlHtml()');
assert.match(remHtml,/<option value="remaining" selected/,'remaining visibly selected');
assert.equal(run('v373RemainingUnits(S.library[2])'),20,'per-season 2+18');
assert.equal(run('v373RemainingUnits(S.library[3])'),null,'unknown total not counted as zero');
assert.equal(run('v373RemainingUnits(S.library[4])'),null,'incomplete season data not counted as zero');
assert.equal(run('v373RemainingUnits(S.library[5])'),0,'overprogress clamps to zero');

run('App.v224ToggleLibrarySortDirection()');
assert.equal(run('v224LibrarySortState().key'),'remaining-asc');
both(['over','newer','short','older','seasons','partial','unknown'],'least remaining first, unknown last');
run("App.v69SetLibrarySort('added')");
assert.equal(run('v224LibrarySortState().key'),'added-desc','choosing Date added resets to newest first');
both(['newer','over','short','unknown','seasons','partial','older'],'newest-first');

S.histFilters={libSort:'remaining-asc',v518DefaultApplied:true};
assert.equal(run('v224LibrarySortState().key'),'remaining-asc','imported bare remaining sort key is supported');
S.histFilters={libSortBase:'priority',libSortDir:'desc',libSort:'priority-desc'};
assert.equal(run('v224LibrarySortState().key'),'priority-desc','existing explicit sorter preserved');
S.histFilters={libSortBase:'title',libSortDir:'desc',libSort:'title-desc'};
assert.equal(run('v224LibrarySortState().key'),'title-desc','explicit reverse Alphabetic sorter preserved');
S.histFilters={libSortBase:'title',libSortDir:'asc',libSort:'title-asc'};
assert.equal(run('v224LibrarySortState().key'),'added-desc','migrate untouched old default');
assert.equal(S.histFilters.v518DefaultApplied,true);
assert(invalidations>=3,'switching sorter invalidates cached normal rows');
assert(rendered>=3,'sort changes cause both Library modes to redraw');
assert.equal(JSON.stringify(data),original,'no Library title, progress or season metadata changes');
console.log('PASS v518: Normal + Dynamic Library sorting; remaining season units, ASC/DESC, unknown totals last, newest-first default, preserved explicit sorter, safe read-only data.');
