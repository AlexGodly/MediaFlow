/* MediaFlow v373 logging picker behavioral and performance contract.
   Test the real source extension in an isolated website-like runtime. */
const fs=require('fs');
const vm=require('vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'../src/js/components/271-v373-logging-browser-ordering.js'),'utf8');
const makeTitle=(id,createdAt,index=id)=>({id:String(id),title:`Episode ${String(index).padStart(4,'0')}`,
  createdAt,modifiedAt:createdAt+5,lastSeenAt:createdAt+10,categoryId:id%2===0?'anime':'books',priority:id%3===0?'high':'medium',
  total:100+id,progress:id%10,coverUrl:'',status:'active'});
function makeRuntime(library,{batch=false}={}){
  const times={};let saves=0;
  const context={
    S:{settings:{},library,sessions:[],entryDraft:{title:'',libraryId:null},logDraft:{entries:[]}},
    DEFAULT_SETTINGS:{},V89_LOG:{sortBase:'title',sortDir:'asc',sort:'title-asc',categories:[],status:'all',priority:'all',page:0},
    V224_LOG_SORT_OPTIONS:[['title','Alphabetic']],
    V53_LIB:{libraryToken:0},V238_LOG_LIBRARY_OPEN:true, MediaFlowRuntime:{version:372},window:{},
    document:{addEventListener() {},querySelectorAll(){return [];}},
    v224NormalizeLogSort(){return context.V89_LOG},v224SortKey:(base,dir)=>`${base}-${dir}`,
    v224LogToolsHtml(){return '<div class="v87-log-tools v89-log-tools v224-log-tools">old toolbar</div>'},
    v224LogSuggestionsHtml(){return 'old suggestions'},v53InvalidateLibraryCache(){context.V53_LIB.libraryToken++;},
    v242EnsureLoggingIndex(){return {titleLower:new Map(context.S.library.map(x=>[String(x.id),x.title.toLowerCase()]))}},
    v175PageSize(){return 15},v199StatusLabel:x=>x,v144CategoryIconHtml:()=>'',getCategory:()=>({name:'Anime'}),
    cleanTitle:s=>String(s||''),escapeHtml:s=>String(s||'').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;'),
    v53LastTouched:item=>times[item.id]||0,
    persistSettings(){saves++},showToast(){},renderLogSuggestions(){return context.v224LogSuggestionsHtml()},
    mergeStates(a,b){return {settings:{...a?.settings,...b?.settings}}},
    v155VerifyCloudState(){return {ok:true,missing:[]}},
    App:{addLogEntry(){const id=context.S.entryDraft.libraryId;if(!id)return;context.S.logDraft.entries.push({libraryId:id});}},
  };
  if(batch){
    const batchState={categories:[],status:'all',priority:'all',sortBase:'title',sortDir:'asc',sort:'title-asc',pages:{},activeRow:0};
    Object.assign(context,{
      V224_BATCH_SORT_OPTIONS:[['title','Alphabetical']],
      V175_BATCH_LIBRARY:batchState,
      v175NormalizeBatchLibraryState(){return batchState},
      v175BatchLibraryMatches(query){return []},
      v175BatchLibraryToolsHtml(){return '<div class="card v175-batch-library-tools">Tools</div>'},
      v175RefreshBatchLibraryUI(){},
      v175PageSize(){return 15},
      renderBatchSuggestions(){},
    });
    context.document.getElementById=()=>null;
    context.document.querySelector=()=>null;
    context.S.batchDraft={rows:[{query:'',libraryId:''}]};
    context.App.v175BatchSetFilter=function(){};
    context.App.v224BatchToggleSortDirection=function(){};
    context.App.v175BatchClearFilters=function(){};
    context.App.selectBatchTitle=function(index,id){context.S.batchDraft.rows[index].libraryId=id;};
  }
  vm.createContext(context);vm.runInContext(script,context,{filename:'v373-runtime.js'});
  const call=(name,...args)=>vm.runInContext(`${name}(...JSON.parse(${JSON.stringify(JSON.stringify(args))}))`,context);
  return {context,call,times,get saves(){return saves}};
}
(function run(){
 const library=[makeTitle(4,400),makeTitle(2,200),makeTitle(3,300),makeTitle(1,100)];
 const r=makeRuntime(library),ids=()=>Array.from(r.context.logTitleCandidates(''),x=>x.id);
 assert.deepEqual(ids(),['1','2','3','4'],'default is oldest added first, not alphabetical/array order');
 assert.equal(r.context.MediaFlowRuntime.version,373);
 assert.equal(r.context.V224_LOG_SORT_OPTIONS.length,12);
 assert.equal((r.context.v224LogSuggestionsHtml().match(/class="log-suggestion v373-title-row"/g)||[]).length,4);
 r.context.App.v224LogSetSort('title');assert.deepEqual(ids(),['1','2','3','4']);
 r.context.App.v224LogToggleSortDirection();assert.deepEqual(ids(),['4','3','2','1']);
 r.context.App.v224LogSetSort('added');r.context.App.v224LogToggleSortDirection();assert.deepEqual(ids(),['4','3','2','1']);
 r.context.App.v224LogSetSort('progress');assert.deepEqual(ids(),['4','3','2','1']); // progress descending
 r.context.App.v224LogSetSort('total');assert.deepEqual(ids(),['4','3','2','1']);
 r.context.App.v224LogSetSort('priority');assert.equal(ids()[0],'3');
 r.context.S.library.find(x=>x.id==='2').rating=9;
 r.context.App.v224LogSetSort('rating');assert.equal(ids()[0],'2','existing Rating sorting must not disappear');
 r.context.App.v224LogSetSort('edited');assert.deepEqual(ids(),['4','3','2','1']);
 r.context.App.v224LogSetSort('seen');assert.deepEqual(ids(),['4','3','2','1']);
 r.times['2']=9000;r.times['4']=10000;
 r.context.S.sessions.push({id:'session1',timestamp:10000,titles:[{libraryId:'4'}]});
 r.context.App.v224LogSetSort('logging');assert.deepEqual(ids().slice(0,2),['4','2']);
 r.context.App.v224LogSetSort('random');const shuffled=ids();assert.deepEqual(shuffled,ids(),'random stable across rerenders');
 r.context.App.v373Reshuffle();assert.deepEqual(ids().sort(),['1','2','3','4']);
 r.context.S.entryDraft.libraryId='2';r.context.App.addLogEntry();
 r.context.App.v224LogSetSort('recentlog');assert.equal(ids()[0],'2','most recently added to logging first');
 r.context.App.v224LogSetSort('manual');assert.deepEqual(ids(),['1','2','3','4'],'manual begins in added order');
 assert.match(r.context.v224LogSuggestionsHtml(),/data-v373-drag="1"/);
 assert.match(r.context.v224LogSuggestionsHtml(),/App\.v373MovePosition/);
 r.context.App.v373MovePosition('4','1');assert.deepEqual(ids(),['4','1','2','3']);
 r.context.App.v373Nudge('1',1);assert.deepEqual(ids(),['4','2','1','3']);
 r.context.App.v373MoveBefore('3','4');assert.deepEqual(ids(),['3','4','2','1']);
 // Filtered browser retains full manual order, and numeric rank refers to full Library.
 r.context.V89_LOG.categories=['anime'];assert.deepEqual(ids(),['4','2']);
 r.context.V89_LOG.categories=[];assert.deepEqual(ids(),['3','4','2','1']);
 r.context.App.v224LogSetSort('title');r.context.App.v224LogSetSort('manual');assert.deepEqual(ids(),['3','4','2','1'],'manual sort survives sort changes');
 const saved=JSON.parse(JSON.stringify(r.context.S.settings.v373LoggingBrowser));
 const restored=makeRuntime(library);restored.context.S.settings.v373LoggingBrowser=saved;
 assert.deepEqual(Array.from(restored.context.logTitleCandidates(''),x=>x.id),['3','4','2','1'],'manual order restored across sessions');
 r.context.App.v373ResetManual();assert.deepEqual(ids(),['1','2','3','4'],'manual reset restores oldest added first');
 r.context.App.v224LogClearFilters();assert.deepEqual(ids(),['1','2','3','4'],'clear filters restores oldest default');
 assert.equal(r.context.S.settings.v373LoggingBrowser.sort,'added');
 assert.ok(r.saves>5,'settings persistence called');
 // Cloud merge selects the newer manual order independently of sort selection.
 const a={settings:{v373LoggingBrowser:{sort:'priority',dir:'desc',sortAt:400,manualOrder:['1','2'],manualAt:100}}};
 const b={settings:{v373LoggingBrowser:{sort:'added',dir:'asc',sortAt:200,manualOrder:['3','1'],manualAt:500}}};
 const merged=r.context.mergeStates(a,b).settings.v373LoggingBrowser;
 assert.equal(merged.sort,'priority');assert.deepEqual(Array.from(merged.manualOrder),['3','1']);
 // Batch Log shares sorting and custom manual positions without changing its draft.
 const batch=makeRuntime(library,{batch:true});
 const batchIds=(q='')=>Array.from(batch.context.v175BatchLibraryMatches(q),x=>x.id);
 assert.deepEqual(batchIds(),['1','2','3','4'],'batch defaults to oldest first');
 batch.context.App.v175BatchSetFilter('sort','priority');
 assert.equal(batchIds()[0],'3');
 batch.context.App.v175BatchSetFilter('sort','manual');
 batch.context.App.v373MovePosition('4',1);
 assert.deepEqual(batchIds(),['4','1','2','3']);
 batch.context.App.selectBatchTitle(0,'2');
 batch.context.App.v175BatchSetFilter('sort','recentlog');
 assert.equal(batchIds()[0],'2','batch title selection contributes to recently logged picker');
 assert.match(batch.context.v175BatchLibraryToolsHtml(),/mf373-batch-order/);
 assert.equal(batch.context.S.batchDraft.rows[0].libraryId,'2','existing batch draft is preserved');
 batch.context.App.v175BatchClearFilters();
 assert.deepEqual(batchIds(),['1','2','3','4']);
 // 50K title smoke: no all-title DOM explosion (only page-size rows).
 const many=Array.from({length:50000},(_,i)=>makeTitle(i+1,i+1));
 const large=makeRuntime(many);
 const start=performance.now();
 const all=large.context.logTitleCandidates('');
 const took=Math.round(performance.now()-start);
 assert.equal(all.length,50000);
 assert.equal(all[0].id,'1');assert.equal(all.at(-1).id,'50000');
 const rendered=large.context.v224LogSuggestionsHtml();
 assert.equal((rendered.match(/class="log-suggestion v373-title-row"/g)||[]).length,15);
 assert.ok(took<10000,`50K titles sorting exceeded 10 seconds: ${took}ms`);
 const manStart=performance.now();
 large.context.App.v224LogSetSort('manual');
 large.context.App.v373MovePosition('50000','1');
 const reordered=large.context.logTitleCandidates('');
 const manualMs=Math.round(performance.now()-manStart);
 assert.equal(reordered[0].id,'50000','global numeric ordering works at 50K titles');
 assert.equal(reordered.length,50000);
 assert.ok(manualMs<10000,`50K custom order exceeded 10 seconds: ${manualMs}ms`);

 console.log(`v373 contracts PASS — default/sorts/manual/filters/cloud/recent/logging/50K (${took}ms), 50K manual (${manualMs}ms)`);
})();