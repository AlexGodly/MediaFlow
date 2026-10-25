/* v548 Logging large-Library sort contract and regression tests. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const modulePath='src/js/components/388-v548-logging-large-library-sort.js';
const source=read(modulePath);
const runtime=JSON.parse(read('src/js/runtime-order.json'));
const version=Number(read('VERSION').trim());
const versionJson=JSON.parse(read('version.json'));
const index=read('index.html');
assert.equal(version,548,'VERSION must be v548');
assert.equal(versionJson.build,548,'version.json build must match VERSION');
assert.equal(versionJson.version,548,'version.json version must match VERSION');
assert(runtime.includes('components/388-v548-logging-large-library-sort.js'),'v548 optimizer must be loaded');
assert(index.includes('mediaflow-v548.bundle.js'),'HTML must point to the v548 bundle');
assert(source.includes("new Intl.Collator(undefined,{numeric:true,sensitivity:'base'})"),
  'sorting must reuse one collator instead of constructing locale options for every comparison');
assert(source.includes('V548_SORTED_INDEXES')&&source.includes('v548SortedLogIndex'),
  'sorted candidate indexes must be reused across query changes');
assert(!/S\.(?:library|sessions|history)\s*=/.test(source),
  'the optimizer must not replace core user data');

const categories=[{id:'anime',name:'Anime'},{id:'tv',name:'Television'},{id:'books',name:'Books'}];
const data=[
  {id:'a10',title:'Show 10',categoryId:'anime',status:'active',priority:'high',rating:8,progress:10,total:24,source:'Streaming',year:2024,tags:['space','drama']},
  {id:'a2',title:'Show 2',categoryId:'anime',status:'active',priority:'low',rating:9,progress:2,total:12,source:'Streaming',year:2023,tags:['space']},
  {id:'t1',title:'Mystery',categoryId:'tv',status:'paused',priority:'medium',rating:7,progress:4,total:8,source:'Broadcast',year:2020,tags:['crime']},
  {id:'b1',title:'Mystery Book',categoryId:'books',status:'planned',priority:'medium',rating:0,progress:0,total:null,source:'Print',year:2019,tags:['crime','mystery']},
  {id:'a3',title:'Show 3',categoryId:'anime',status:'active',priority:'high',rating:8,progress:7,total:24,source:'Streaming',year:2025,tags:['fantasy']},
  {id:'a4',title:'No Rating',categoryId:'anime',status:'completed',priority:'low',rating:null,progress:12,total:12,source:'Disc',year:2018,tags:[]}
];
const S={library:data,categories,histFilters:{},settings:{},entryDraft:{title:''}};
const state={sortBase:'title',sortDir:'asc',categories:[],status:'all',priority:'all'};
const ctx={
  S,App:{},window:{},MediaFlowRuntime:{version:0},
  V548_TEST_SORT_STATE:state,
  cleanTitle:value=>String(value||'').trim(),
  escapeHtml:value=>String(value??''),
  getCategory:id=>S.categories.find(c=>String(c.id)===String(id))||null,
  console,Intl,Number,String,Array,Object,Map,Set,Math,JSON,Date,
  logTitleCandidates:()=>[]
};
vm.createContext(ctx);
const execute=(text,filename)=>vm.runInContext(text,ctx,{filename});
execute(read('src/js/core/runtime/149-v224-sort-foundation.js'),'v224-sort-foundation.js');
execute('function v224NormalizeLogSort(){return V548_TEST_SORT_STATE;}','sort-state.js');
const originalComparator=ctx.v224CompareLibraryLike;
function legacyCandidates(query,st){
  const q=String(query||'').trim().toLowerCase();
  let rows=(S.library||[]).filter(item=>item?.id);
  if(q)rows=rows.filter(item=>{
    const cat=ctx.getCategory(item.categoryId);
    return [
      ctx.cleanTitle(item.title),cat?.name||'',item.status||'',item.priority||'',
      item.source||'',item.year||'',...(Array.isArray(item.tags)?item.tags:[])
    ].join(' ').toLowerCase().includes(q);
  });
  if((st.categories||[]).length)rows=rows.filter(item=>st.categories.includes(String(item.categoryId||'')));
  if(st.status!=='all')rows=rows.filter(item=>String(item.status||'planned').toLowerCase()===st.status);
  if(st.priority!=='all')rows=rows.filter(item=>String(item.priority||'medium').toLowerCase()===st.priority);
  return rows.slice().sort((a,b)=>originalComparator(a,b,st.sortBase,st.sortDir)).map(item=>item.id);
}
const cases=[];
for(const base of ['title','priority','rating','progress','total']){
  for(const dir of ['asc','desc']){
    cases.push({base,dir,q:''});
    cases.push({base,dir,q:'show 1'});
    cases.push({base,dir,q:'crime'});
    cases.push({base,dir,q:'streaming',categories:['anime'],status:'active',priority:'high'});
  }
}
execute(source,modulePath);
let oldComparatorCalls=0;
ctx.v224CompareLibraryLike=(...args)=>{oldComparatorCalls++;return originalComparator(...args);};
const ids=rows=>Array.from(rows,item=>item.id);
for(const c of cases){
  const st={sortBase:c.base,sortDir:c.dir,categories:c.categories||[],status:c.status||'all',priority:c.priority||'all'};
  ctx.V548_TEST_SORT_STATE=st;
  const expected=legacyCandidates(c.q,st);
  oldComparatorCalls=0;
  const actual=ids(ctx.logTitleCandidates(c.q));
  assert.deepEqual(actual,expected,'optimized results must preserve existing search/filter/sort semantics: '+JSON.stringify(c));
  assert.equal(oldComparatorCalls,0,'optimized Logging must not invoke the expensive legacy comparator');
}
const stateForCache={sortBase:'title',sortDir:'asc',categories:[],status:'all',priority:'all'};
ctx.V548_TEST_SORT_STATE=stateForCache;
ctx.logTitleCandidates('');
let info=ctx.window.MediaFlowV548.inspect();
const sortCount=info.sortBuilds;
ctx.logTitleCandidates('show');
ctx.logTitleCandidates('anime');
assert.equal(ctx.window.MediaFlowV548.inspect().sortBuilds,sortCount,
  'typing and changing search queries must reuse the sorted index');
stateForCache.sortBase='priority';stateForCache.sortDir='desc';
ctx.logTitleCandidates('');
assert.equal(ctx.window.MediaFlowV548.inspect().sortBuilds,sortCount+1,
  'changing sort field/direction should build only that missing index');
const buildsBeforeMutation=ctx.window.MediaFlowV548.inspect().indexBuilds;
data[0].title='Aardvark';
ctx.V548_TEST_SORT_STATE=stateForCache;
assert.deepEqual(ids(ctx.logTitleCandidates('aardvark')),['a10'],
  'title edits must invalidate the search index and become searchable immediately');
assert.equal(ctx.window.MediaFlowV548.inspect().indexBuilds,buildsBeforeMutation+1,
  'relevant Library edits must rebuild the cached search index');
assert.equal(ctx.window.MediaFlowV548.inspect().sortBuilds,sortCount+2,
  'relevant Library edits must invalidate cached sorted indexes');

S.categories[0].name='Animation';
assert.deepEqual(ids(ctx.logTitleCandidates('animation')),['a10','a2','a3','a4'],
  'category renames must refresh the cached search text');

const largeLibrary=Array.from({length:30000},(_,i)=>({
  id:'bulk-'+i,title:'Series '+String(i).padStart(5,'0'),categoryId:'anime',
  status:i%3?'active':'planned',priority:i%2?'high':'low',rating:i%10,
  progress:i%100,total:100,source:'Bulk',year:2000+i%25,tags:['bulk','scale']
}));
S.library=largeLibrary;
S.categories[0].name='Anime';
const largeState={sortBase:'title',sortDir:'asc',categories:[],status:'all',priority:'all'};
ctx.V548_TEST_SORT_STATE=largeState;
const largeRows=ctx.logTitleCandidates('');
assert.equal(largeRows.length,30000,'all valid titles must remain available at 30,000-title scale');
assert.equal(largeRows[0].id,'bulk-0','numeric title sorting must remain natural and stable');
const largeSortCount=ctx.window.MediaFlowV548.inspect().sortBuilds;
assert.equal(ctx.logTitleCandidates('bulk').length,30000,'broad searches must include all matching titles');
assert.equal(ctx.window.MediaFlowV548.inspect().sortBuilds,largeSortCount,
  '30,000-title searches must not re-sort for each query');
console.log('PASS v548: Logging search/filter/sort parity, cache invalidation, natural sorting and 30,000-title index reuse.');
