/* Regression tests for v517 Logging/picker "Remaining episodes / chapters".
 * Use the actual v373 module with browser/Library dependencies stubbed. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'src/js/components/271-v373-logging-order-studio.js'),'utf8');
const library=[
  {id:'older',title:'Older series',createdAt:100,progress:7,total:12,priority:'high'},
  {id:'newer',title:'Newest series',createdAt:900,progress:12,total:12,priority:'low'},
  {id:'seasonal',title:'Seasoned anime',createdAt:300,progress:16,total:36,
   seasons:[{id:'s1',total:12,progress:10},{id:'s2',total:24,progress:6}]},
  {id:'unknown',title:'Unreleased series',createdAt:450,progress:3,total:null},
  {id:'partial',title:'Partial seasons',createdAt:250,progress:6,total:12,
   seasons:[{id:'s1',total:12,progress:6},{id:'s2',total:null,progress:0}]},
  {id:'over',title:'Overdone chapters',createdAt:700,progress:25,total:20},
  {id:'short',title:'Nearly finished book',createdAt:550,progress:9,total:10}
];
const lookup=new Map(library.map(x=>[x.id,x]));
const S={
  library,
  logDraft:{entries:library.map(x=>({v373Key:x.id,libraryId:x.id,title:x.title,loggedAt:100}))},
  entryDraft:{title:''}
};
const picker={sort:'relevance',sortBase:'title',sortDir:'asc',v373Ready:false,categories:[],status:'all',priority:'all',page:2};
let pickerRenders=0,saves=0;
const App={};
let uidIndex=0;
const ctx={
  S,App,V89_LOG:picker,
  Date,Math,Number,String,Array,Object,Map,Set,JSON,console,
  window:{},MediaFlowRuntime:{version:0},
  document:{addEventListener(){},querySelector(){return null;}},
  uid(){return 'key-'+ ++uidIndex;},
  cleanTitle(value){return String(value||'');},
  escapeHtml(value){return String(value);},
  v369ItemTitle(entry){return lookup.get(entry.libraryId)||null;},
  v53LastTouched(){return 0;},
  v369Touch(){saves++;},
  renderLogForm(){return '';},
  v369RefreshPanels(){return '';},
  v224SortKey(base,dir){return base==='random'?'random':base+'-'+dir;},
  v224SortOptionsHtml(base,options){return options.map(([value,label])=>'<option value="'+value+'"'+(base===value?' selected':'')+'>'+label+'</option>').join('');},
  v224LogToolsHtml(){return '<select aria-label="Dashboard logging sort field" onchange="App.v224LogSetSort(this.value)"></select>';},
  logTitleCandidates(){return library.slice();},
  renderLogSuggestions(){pickerRenders++;}
};
vm.createContext(ctx);
vm.runInContext(src,ctx,{filename:'v373-logging-order-studio.js'});
const run=s=>vm.runInContext(s,ctx);
const ids=a=>Array.from(a,x=>x.id||x.item?.id);

// New drafts and previously untouched drafts default to newest first.
assert.equal(run('v373OrderState().sort'),'added');
assert.equal(run('v373OrderState().dir'),'desc');
assert.deepEqual(Array.from(run('v373OrderedEntries()'),x=>x.item.id),
  ['newer','over','short','unknown','seasonal','partial','older']);
S.logDraft.v373Ordering={sort:'logAdded',dir:'asc',manualIds:[],randomSeed:1};
assert.equal(run('v373OrderState().sort'),'added','migrate unchanged old draft default');
assert.equal(run('v373OrderState().dir'),'desc');
S.logDraft.v373Ordering={sort:'title',dir:'asc',manualIds:[],randomSeed:1};
assert.equal(run('v373OrderState().sort'),'title','preserve explicitly chosen sort');

const available=run('V373_SORTS');
assert(available.some(([value,label])=>value==='remaining'&&label==='Remaining episodes / chapters'));
assert(run('V373_PICKER_SORTS').some(([key])=>key==='remaining'));
assert.equal(run('v373RemainingUnits(S.library[0])'),5);
assert.equal(run('v373RemainingUnits(S.library[1])'),0);
assert.equal(run('v373RemainingUnits(S.library[2])'),20,'sum remaining in each season');
assert.equal(run('v373RemainingUnits(S.library[3])'),null,'unknown total cannot mean zero');
assert.equal(run('v373RemainingUnits(S.library[4])'),null,'partially unknown seasons last');
assert.equal(run('v373RemainingUnits(S.library[5])'),0,'overprogress never negative');
assert.equal(run('v373RemainingUnits(S.library[6])'),1);
run("v373SetSort('remaining')");
assert.equal(run('v373OrderState().dir'),'desc','remaining defaults to most remaining first');
assert.deepEqual(Array.from(run('v373OrderedEntries()'),x=>x.item.id).slice(0,3),
 ['seasonal','older','short']);
assert.deepEqual(Array.from(run('v373OrderedEntries()'),x=>x.item.id).slice(-2),
 ['unknown','partial'],'unknown totals at end of descending sort');
run('v373ToggleDirection()');
assert.deepEqual(Array.from(run('v373OrderedEntries()'),x=>x.item.id).slice(0,3),
 ['newer','over','short'],'remaining can be sorted ascending');
assert.deepEqual(Array.from(run('v373OrderedEntries()'),x=>x.item.id).slice(-2),
 ['unknown','partial'],'unknown totals always last');

// Picker uses the exact same options and comparator, not just a display label.
assert.equal(run('v373NormalizePickerSort().sort'),'added-desc');
assert.equal(picker.sortBase,'added');
assert.equal(picker.sortDir,'desc');
assert.deepEqual(ids(ctx.logTitleCandidates('')).slice(0,3),['newer','over','short']);
picker.v517DefaultApplied=false;
picker.sortBase='added';picker.sortDir='asc';picker.sort='added-asc';
assert.equal(run('v373NormalizePickerSort().sort'),'added-desc','migrate old ascending picker default');
run("App.v224LogSetSort('remaining')");
assert.equal(picker.sortBase,'remaining');
assert.equal(picker.sortDir,'desc');
assert.deepEqual(ids(ctx.logTitleCandidates('')).slice(0,3),['seasonal','older','short']);
assert.deepEqual(ids(ctx.logTitleCandidates('')).slice(-2),['partial','unknown']);
run('App.v224LogToggleSortDirection()');
assert.equal(picker.sortDir,'asc');
assert.deepEqual(ids(ctx.logTitleCandidates('')).slice(0,2),['newer','over']);
assert.deepEqual(ids(ctx.logTitleCandidates('')).slice(-2),['partial','unknown']);
run("App.v224LogSetSort('added')");
assert.equal(picker.sortDir,'desc','selecting Date added should show newest first');
assert.equal(picker.sortBase,'added');
run('App.v224LogClearFilters()');
assert.equal(picker.sort,'added-desc','clearing filters restores the requested default');
assert.equal(picker.page,0);
assert(pickerRenders>=3);
assert(saves>=2);

// Read-only sorting: no edits to Library progress, totals, seasons or dates.
assert.deepEqual(library[2].seasons,[{id:'s1',total:12,progress:10},{id:'s2',total:24,progress:6}]);
assert.equal(library[0].progress,7);
console.log('PASS v517: shared Logging and picker sorter, seasons and unknown totals, ASC/DESC, newest-first default, migration and read-only calculations.');
