/* v525 regression: Logging Arrange Your Session default + draft recency only. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const base=fs.readFileSync(path.join(root,'src/js/components/271-v373-logging-order-studio.js'),'utf8');
const extra=fs.readFileSync(path.join(root,'src/js/components/377-v525-logging-draft-sort.js'),'utf8');
const prefix=base.slice(0,base.indexOf('function v373ToolbarHtml()'));
assert(prefix.includes('function v373OrderedEntries()'));
let syncCount=0,frame=null,reordered=0;
const entries=[
  {libraryId:'a',title:'Alpha',loggedAt:950000000000,v369UpdatedAt:1000},
  {libraryId:'b',title:'Beta',loggedAt:960000000000,v369UpdatedAt:3000},
  {libraryId:'c',title:'Gamma',loggedAt:940000000000,v369UpdatedAt:2000}
];
const library=entries.map(e=>({id:e.libraryId,title:e.title,createdAt:1,progress:0,total:12}));
const S={logging:true,logDraft:{entries,v369Interface:'itemized'},library};
const ctx=vm.createContext({
 S,window:{},App:{v179SetLogEntryEnd(i,value){S.logDraft.entries[i].v179EndProgress=Number(value);}},
 Date,Number,String,Object,Array,Math,Set,Map,
 uid:(()=>{let n=0;return ()=>'test-'+(++n)})(),
 v369ItemTitle:e=>library.find(x=>x.id===e.libraryId),
 v53LastTouched:()=>0,cleanTitle:v=>String(v),escapeHtml:v=>String(v),
 v369Touch:()=>{syncCount++;},v373LiveUpdate:()=>{reordered++;},
 requestAnimationFrame:fn=>{frame=fn;return 1}
});
vm.runInContext(prefix,ctx);
function evalSource(source){return vm.runInContext(source,ctx);}
const sortOptions=evalSource('V373_SORTS.map(x=>x[0])');
assert(sortOptions.includes('draftUpdated'),'Session dropdown must include Last updated in draft');
assert(!evalSource('V373_PICKER_SORTS.map(x=>x[0])').includes('draftUpdated'),'Do not change Library picker');
assert.match(base,/\['draftUpdated','Last updated in draft'\]/);
assert.match(base,/Arrange your session/);
assert.equal(evalSource('v373OrderState().sort'),'logAdded');
assert.equal(evalSource('v373OrderState().dir'),'desc');
assert.deepEqual(Array.from(evalSource('v373OrderedEntries().map(r=>r.entry.title)')),['Gamma','Beta','Alpha'],'Default newest inserted first, irrespective of watched-at dates');
assert.deepEqual(entries.map(x=>x.title),['Alpha','Beta','Gamma'],'Sorting must not reorder canonical draft data');
evalSource('S.logDraft.v373Ordering.sort="draftUpdated"');
assert.deepEqual(Array.from(evalSource('v373OrderedEntries().map(r=>r.entry.title)')),['Beta','Gamma','Alpha'],'Last updated in draft sorts latest first');
entries[0].v369Units=[{v369UpdatedAt:5000,loggedAt:4000}];
assert.deepEqual(Array.from(evalSource('v373OrderedEntries().map(r=>r.entry.title)')),['Alpha','Beta','Gamma'],'Per-unit edits count as draft updates');
evalSource('S.logDraft.v373Ordering.dir="asc"');
assert.deepEqual(Array.from(evalSource('v373OrderedEntries().map(r=>r.entry.title)')),['Gamma','Beta','Alpha'],'Direction is reversible');
S.logDraft.v373Ordering={sort:'added',dir:'desc',manualIds:[],randomSeed:1,v517DefaultApplied:true};
assert.equal(evalSource('v373OrderState().sort'),'logAdded','Migrate the old default in existing drafts');
assert.equal(S.logDraft.v373Ordering.v525DefaultApplied,true,'Migrate only once');
S.logDraft.v373Ordering={sort:'priority',dir:'asc',manualIds:[],randomSeed:1,v517DefaultApplied:true};
assert.equal(evalSource('v373OrderState().sort'),'priority','Respect deliberate alternative sort');
S.logDraft.v373Ordering={sort:'custom',dir:'asc',manualIds:['x'],randomSeed:1,v517DefaultApplied:true};
assert.equal(evalSource('v373OrderState().sort'),'custom','Manual sort preserved');
assert.equal(evalSource('v373OrderState().manualIds[0]'),'x');
assert.equal(evalSource('V373_PICKER_SORTS.find(x=>x[0]==="added")[0]'),'added','Library picker options unchanged');
vm.runInContext(extra,ctx);
assert.equal(ctx.window.MediaFlowV525.scope,'Logging / Arrange your session only');
assert.equal(ctx.window.MediaFlowV525.defaultSort,'logAdded');
S.logDraft.v373Ordering.sort='draftUpdated';S.logDraft.v373Ordering.dir='desc';
S.logDraft.v369Interface='quick';entries[1].v179EndProgress=4;
const oldStamp=entries[1].v369UpdatedAt;
ctx.App.v179SetLogEntryEnd(1,5);
assert(entries[1].v369UpdatedAt>oldStamp,'Quick progress edit must stamp the updated draft title');
assert(syncCount>0,'Draft change saved through existing touch path');
assert.equal(typeof frame,'function','Order refresh scheduled after draft change');
frame();
assert.equal(reordered,1,'Live Arrange Your Session reorders after the change');
assert(!S.library.some(x=>x.v369UpdatedAt),'Library metadata must not be mutated');
console.log('PASS v525: session-only Added to Logging default, Last updated in draft, manual choice migration, per-unit/quick recency and read-only sorting');
