/* v551 app-wide large-Library responsiveness contract. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const modulePath='src/js/components/391-v551-app-wide-performance.js';
const source=read(modulePath);
const logging=read('src/js/components/388-v548-logging-large-library-sort.js');
const runtime=JSON.parse(read('src/js/runtime-order.json'));
const version=Number(read('VERSION').trim());
const versionJson=JSON.parse(read('version.json'));
const index=read('index.html');
assert.equal(version,551,'VERSION must be v551');
assert.equal(versionJson.build,version,'version.json build must match VERSION');
assert.equal(versionJson.version,version,'version.json version must match VERSION');
assert(runtime.includes('components/391-v551-app-wide-performance.js'),'v551 performance module must be loaded');
assert(index.includes('mediaflow-v'+version+'.bundle.js'),'HTML must point to the current bundle');
assert(logging.includes('V548_SOURCE_TOKEN')&&!logging.includes('for(const item of library){\n      if(!item?.id)continue;\n      const previous=V548_LOG_INDEX[pos]'),
  'Logging index validation must be token-based, not a full scan on every query');
assert(source.includes('MF551_BATCH_SORTED')&&source.includes('batchTitleCandidates=function(query)'),
  'Batch Log must reuse pre-sorted large-Library indexes');
assert(source.includes('libraryCacheInvalidationsAvoided')&&source.includes('requestIdleCallback'),
  'last-seen metadata must avoid broad cache invalidation and defer persistence when possible');
assert(!/S\.(?:library|sessions|history)\s*=/.test(source),'performance module must not replace user data');

const categories=[{id:'anime',name:'Anime'},{id:'tv',name:'Television'}];
const library=Array.from({length:30000},(_,i)=>({
  id:'bulk-'+i,title:'Series '+String(i).padStart(5,'0'),categoryId:i%4?'anime':'tv',
  status:i%3?'active':'planned',priority:i%2?'high':'low',rating:i%10,
  progress:i%100,total:100,source:'Bulk',year:2000+i%25,tags:['bulk','scale']
}));
const batchState={categories:[],status:'all',priority:'all',sort:'relevance'};
const ctx={
  S:{library,categories,histFilters:{},settings:{}},App:{},window:{},MediaFlowRuntime:{version:0},
  V53_LIB:{libraryToken:0,filterKey:'',filtered:[]},V175_BATCH_LIBRARY:batchState,
  V548_TEST_SORT_STATE:{sortBase:'title',sortDir:'asc',categories:[],status:'all',priority:'all'},
  cleanTitle:v=>String(v||'').trim(),getCategory:id=>categories.find(c=>String(c.id)===String(id))||null,
  v53InvalidateLibraryCache(){this.V53_LIB.libraryToken++;},
  v224NormalizeLogSort(){return ctx.V548_TEST_SORT_STATE;},v224SortDirection:v=>v,
  v224CompareLibraryLike:(a,b)=>String(a.title).localeCompare(String(b.title)),
  v175NormalizeBatchLibraryState(){return batchState;},
  v175BatchLibraryMatches(){return library.slice();},
  v241LibraryById(id){return library.find(x=>String(x.id)===String(id))||null;},
  v189MarkTitleSeen(){},v189SortMode(){return ctx.S.histFilters.libSort||'title-asc';},
  persistLibrary(){},setTimeout:()=>1,clearTimeout(){},console,Intl,Number,String,Array,Object,Map,Set,Math,JSON,Date,
  logTitleCandidates(){return [];}
};
vm.createContext(ctx);
vm.runInContext('let V189_SEEN_SAVE_TIMER=null; let V391_DYNAMIC_CACHE={key:"warm",library:S.library,rows:[]};',ctx);
vm.runInContext(logging,ctx,{filename:'v548.js'});
vm.runInContext(source,ctx,{filename:modulePath});
const first=ctx.logTitleCandidates('series 1');
assert(first.length>0,'Logging query should return matching titles');
const builds=ctx.window.MediaFlowV548.inspect().indexBuilds;
const validationScans=ctx.window.MediaFlowV548.inspect().validationRowsScanned;
ctx.logTitleCandidates('bulk');
ctx.logTitleCandidates('anime');
assert.equal(ctx.window.MediaFlowV548.inspect().indexBuilds,builds,'search query changes must reuse the existing index');
assert.equal(ctx.window.MediaFlowV548.inspect().validationRowsScanned,validationScans,'search query changes must not scan rows for cache validation');
batchState.sort='rating-desc';
const rated=ctx.batchTitleCandidates('series');
assert.equal(rated.length,30000,'Batch Log must preserve all matching Library titles');
assert.equal(rated[0].rating,9,'Batch Log rating-desc sorting must remain correct');
const batchSortBuilds=ctx.window.MediaFlowV551.inspect().batchSortBuilds;
ctx.batchTitleCandidates('series 1');
ctx.batchTitleCandidates('bulk');
assert.equal(ctx.window.MediaFlowV551.inspect().batchSortBuilds,batchSortBuilds,'query changes must reuse Batch Log sort indexes');
const token=ctx.V53_LIB.libraryToken;
ctx.v189MarkTitleSeen('bulk-1');
assert.equal(ctx.V53_LIB.libraryToken,token,'last-seen updates must not invalidate all Library caches');
assert.equal(ctx.window.MediaFlowV551.inspect().libraryCacheInvalidationsAvoided,1,'last-seen updates should avoid broad cache invalidation');
ctx.S.histFilters.libSort='seen-desc';
ctx.V53_LIB.filterKey='cached';
ctx.V53_LIB.filtered=[library[0]];
ctx.v189MarkTitleSeen('bulk-2');
assert.equal(ctx.V53_LIB.filterKey,'','seen sort cache must be invalidated when last-seen ordering is active');
assert.equal(ctx.window.MediaFlowV551.inspect().seenCacheInvalidations,1,'seen sort should receive targeted invalidation');
ctx.v53InvalidateLibraryCache();
library[0].title='Instantly searchable';
assert(ctx.logTitleCandidates('instantly searchable').some(item=>item.id==='bulk-0'),
  'explicit Library invalidation must make edited titles searchable immediately');
console.log('PASS v551: token-based Logging index reuse, cached Batch Log sorting, targeted last-seen invalidation and 30,000-title behavior.');
