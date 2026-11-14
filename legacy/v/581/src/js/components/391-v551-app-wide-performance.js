/* MediaFlow v551 — app-wide responsiveness for large Libraries.
 * Removes repeated full-Library validation from Logging searches, shares the
 * pre-indexed title metadata with Batch Log, and avoids invalidating every
 * Library cache when only a title's last-seen timestamp changes.
 * Search/filter/sort semantics and user data remain authoritative.
 */
const MF551_VERSION=551;
const MF551_STATS={
  batchCalls:0,batchTitlesScanned:0,batchSortBuilds:0,
  seenMarks:0,seenCacheInvalidations:0,libraryCacheInvalidationsAvoided:0
};
const MF551_BATCH_SORTED=new Map();
let MF551_BATCH_SOURCE=null;
const MF551_BATCH_COLLATOR=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});

function mf551BatchCompare(a,b,sort){
  let d=0;
  switch(sort){
    case 'title-desc': d=MF551_BATCH_COLLATOR.compare(b.sortTitle,a.sortTitle);break;
    case 'title-asc':
    case 'relevance': d=MF551_BATCH_COLLATOR.compare(a.sortTitle,b.sortTitle);break;
    case 'priority-desc': d=b.priorityRank-a.priorityRank;break;
    case 'priority-asc': d=a.priorityRank-b.priorityRank;break;
    case 'rating-desc': d=b.rating-a.rating;break;
    case 'rating-asc': d=a.rating-b.rating;break;
    case 'progress-desc': d=b.progress-a.progress;break;
    case 'progress-asc': d=a.progress-b.progress;break;
    case 'total-desc': d=b.total-a.total;break;
    case 'total-asc': d=a.total-b.total;break;
    default: d=MF551_BATCH_COLLATOR.compare(a.sortTitle,b.sortTitle);
  }
  // Batch Log's existing comparator breaks primary-sort ties by title A → Z.
  return d||MF551_BATCH_COLLATOR.compare(a.sortTitle,b.sortTitle);
}
function mf551BatchSortedIndex(sort){
  v548EnsureLogIndex();
  if(MF551_BATCH_SOURCE!==V548_LOG_INDEX){
    MF551_BATCH_SOURCE=V548_LOG_INDEX;
    MF551_BATCH_SORTED.clear();
  }
  let rows=MF551_BATCH_SORTED.get(sort);
  if(rows)return rows;
  rows=V548_LOG_INDEX.slice().sort((a,b)=>mf551BatchCompare(a,b,sort));
  MF551_BATCH_SORTED.set(sort,rows);
  MF551_STATS.batchSortBuilds++;
  return rows;
}
const mf551BatchMatchesBase=v175BatchLibraryMatches;
function mf551BatchLibraryMatches(query){
  if(typeof v548EnsureLogIndex!=='function'||typeof V548_LOG_INDEX==='undefined'||
     typeof v175NormalizeBatchLibraryState!=='function'){
    return mf551BatchMatchesBase.apply(this,arguments);
  }
  const st=v175NormalizeBatchLibraryState();
  const q=String(query||'').trim().toLowerCase();
  const sort=String(st.sort||'relevance');
  const ordered=mf551BatchSortedIndex(sort);
  const categories=new Set((Array.isArray(st.categories)?st.categories:[]).map(String));
  const status=String(st.status||'all').toLowerCase();
  const priority=String(st.priority||'all').toLowerCase();
  const rows=[];
  MF551_STATS.batchCalls++;
  MF551_STATS.batchTitlesScanned+=ordered.length;
  for(const entry of ordered){
    if(q&&!entry.searchText.includes(q))continue;
    if(categories.size&&!categories.has(String(entry.categoryIdRaw||'')))continue;
    if(status!=='all'&&String(entry.statusRaw||'planned').toLowerCase()!==status)continue;
    if(priority!=='all'&&String(entry.priorityRaw||'medium').toLowerCase()!==priority)continue;
    rows.push(entry);
  }
  if(sort==='relevance'&&q){
    const buckets=[[],[],[],[]];
    for(const entry of rows){
      const title=String(entry.sortTitle||'').toLowerCase();
      const rank=title===q?0:title.startsWith(q)?1:title.includes(q)?2:3;
      buckets[rank].push(entry);
    }
    // Source order keeps exact/prefix/other-field matches stable. Only the
    // "contains title" bucket needs a query-specific positional sort.
    buckets[2].sort((a,b)=>{
      const d=a.sortTitle.toLowerCase().indexOf(q)-b.sortTitle.toLowerCase().indexOf(q);
      return d||MF551_BATCH_COLLATOR.compare(a.sortTitle,b.sortTitle);
    });
    return buckets.flat().map(entry=>entry.item);
  }
  return rows.map(entry=>entry.item);
}
batchTitleCandidates=function(query){
  return mf551BatchLibraryMatches(query);
};

/* Opening Title Details changes only lastSeenAt. Avoid rebuilding all Library
 * search/index caches unless the active Library order depends on that field.
 * Persistence stays debounced and moves to idle time when supported.
 */
v189MarkTitleSeen=function(id){
  const item=typeof v241LibraryById==='function'
    ?v241LibraryById(id)
    :(S.library||[]).find(row=>String(row?.id||'')===String(id||''));
  if(!item)return;
  const now=Date.now();
  if(now-Number(item.lastSeenAt||0)<750)return;
  item.lastSeenAt=now;
  MF551_STATS.seenMarks++;
  MF551_STATS.libraryCacheInvalidationsAvoided++;
  const sort=typeof v189SortMode==='function'?v189SortMode():'';
  if(sort==='seen-desc'||sort==='seen-asc'){
    if(typeof V53_LIB!=='undefined'){
      V53_LIB.filterKey='';
      V53_LIB.filtered=[];
    }
    if(typeof V391_DYNAMIC_CACHE!=='undefined'){
      V391_DYNAMIC_CACHE={key:'',library:null,rows:null};
    }
    MF551_STATS.seenCacheInvalidations++;
  }
  clearTimeout(V189_SEEN_SAVE_TIMER);
  V189_SEEN_SAVE_TIMER=setTimeout(()=>{
    const save=()=>{try{persistLibrary();}catch(error){console.warn('MediaFlow v551: last-seen persistence failed',error);}};
    if(typeof requestIdleCallback==='function')requestIdleCallback(save,{timeout:1800});
    else setTimeout(save,0);
  },700);
};

window.MediaFlowV551=Object.freeze({
  version:MF551_VERSION,
  inspect:()=>({
    ...MF551_STATS,
    loggingIndex:typeof window.MediaFlowV548?.inspect==='function'
      ?window.MediaFlowV548.inspect():null,
    cachedBatchSorts:MF551_BATCH_SORTED.size,
    indexedBatchTitles:MF551_BATCH_SOURCE?.length||0
  })
});
MediaFlowRuntime.version=MF551_VERSION;
