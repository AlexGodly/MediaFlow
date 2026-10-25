/* MediaFlow v548 — large-Library Logging sort optimization.
 * Reuses sorted, pre-keyed Library rows across Logging searches and filters.
 * Sorting remains read-only: no Library, History, XP, cloud, or schema writes.
 */
const V548_RELEASE=548;
const V548_SORT_FIELDS=new Set(['title','priority','rating','progress','total']);
const V548_TITLE_COLLATOR=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
const V548_PRIORITY_RANK={low:0,medium:1,high:2};
let V548_SOURCE_LIBRARY=null;
let V548_SOURCE_LENGTH=-1;
let V548_CATEGORY_SIGNATURE='';
let V548_CATEGORY_NAMES=new Map();
let V548_LOG_INDEX=[];
let V548_SORTED_INDEXES=new Map();
let V548_INDEX_BUILDS=0;
let V548_SORT_BUILDS=0;

function v548SyncCategoryNames(){
  const categories=Array.isArray(S.categories)?S.categories:[];
  const signature=categories.map(c=>
    (c?.id==null?'':String(c.id))+'\\u0000'+(c?.name==null?'':String(c.name))
  ).join('\\u0001');
  if(signature===V548_CATEGORY_SIGNATURE)return false;
  V548_CATEGORY_SIGNATURE=signature;
  const names=new Map();
  for(const category of categories){
    if(category?.id==null)continue;
    names.set(String(category.id),String(category.name||''));
  }
  V548_CATEGORY_NAMES=names;
  return true;
}
function v548ReadSnapshot(item){
  const categoryKey=item?.categoryId==null?'':String(item.categoryId);
  const categoryName=V548_CATEGORY_NAMES.get(categoryKey)||'';
  const tags=Array.isArray(item?.tags)?item.tags.map(value=>String(value??'')).join(' '):'';
  return {
    item,
    id:item?.id,
    titleRaw:item?.title,
    categoryIdRaw:item?.categoryId,
    categoryName,
    statusRaw:item?.status,
    priorityRaw:item?.priority,
    sourceRaw:item?.source,
    yearRaw:item?.year,
    tagsRaw:tags,
    ratingRaw:item?.rating,
    progressRaw:item?.progress,
    totalRaw:item?.total
  };
}
function v548SnapshotMatches(entry,s){
  return !!entry&&entry.item===s.item&&
    Object.is(entry.id,s.id)&&Object.is(entry.titleRaw,s.titleRaw)&&
    Object.is(entry.categoryIdRaw,s.categoryIdRaw)&&entry.categoryName===s.categoryName&&
    Object.is(entry.statusRaw,s.statusRaw)&&Object.is(entry.priorityRaw,s.priorityRaw)&&
    Object.is(entry.sourceRaw,s.sourceRaw)&&Object.is(entry.yearRaw,s.yearRaw)&&
    entry.tagsRaw===s.tagsRaw&&Object.is(entry.ratingRaw,s.ratingRaw)&&
    Object.is(entry.progressRaw,s.progressRaw)&&Object.is(entry.totalRaw,s.totalRaw);
}
function v548Number(value){
  return Number.isFinite(Number(value))?Number(value):0;
}
function v548BuildEntry(s){
  const title=cleanTitle(s.titleRaw||'');
  const priority=String(s.priorityRaw||'medium').toLowerCase();
  const tags=Array.isArray(s.item?.tags)?s.item.tags:[];
  return {
    ...s,
    sortTitle:title,
    priorityRank:V548_PRIORITY_RANK[priority]??1,
    rating:v548Number(s.ratingRaw),
    progress:v548Number(s.progressRaw),
    total:v548Number(s.totalRaw),
    searchText:[
      title,s.categoryName,s.statusRaw||'',s.priorityRaw||'',
      s.sourceRaw||'',s.yearRaw||'',...tags
    ].join(' ').toLowerCase()
  };
}
function v548EnsureLogIndex(){
  const categoryChanged=v548SyncCategoryNames();
  const library=Array.isArray(S.library)?S.library:[];
  let changed=categoryChanged||library!==V548_SOURCE_LIBRARY||library.length!==V548_SOURCE_LENGTH;
  if(!changed){
    let pos=0;
    for(const item of library){
      if(!item?.id)continue;
      const previous=V548_LOG_INDEX[pos];
      const snapshot=v548ReadSnapshot(item);
      if(!v548SnapshotMatches(previous,snapshot)){changed=true;break;}
      pos++;
    }
    if(pos!==V548_LOG_INDEX.length)changed=true;
  }
  if(changed){
    const next=[];
    for(const item of library){
      if(!item?.id)continue;
      next.push(v548BuildEntry(v548ReadSnapshot(item)));
    }
    V548_SOURCE_LIBRARY=library;
    V548_SOURCE_LENGTH=library.length;
    V548_LOG_INDEX=next;
    V548_SORTED_INDEXES.clear();
    V548_INDEX_BUILDS++;
  }
  return V548_LOG_INDEX;
}
function v548CompareEntries(a,b,base,dir){
  const direction=v224SortDirection(dir)==='desc'?-1:1;
  let diff=0;
  switch(base){
    case 'title': diff=V548_TITLE_COLLATOR.compare(a.sortTitle,b.sortTitle);break;
    case 'priority': diff=a.priorityRank-b.priorityRank;break;
    case 'rating': diff=a.rating-b.rating;break;
    case 'progress': diff=a.progress-b.progress;break;
    case 'total': diff=a.total-b.total;break;
    default:return 0;
  }
  if(diff)return diff*direction;
  return V548_TITLE_COLLATOR.compare(a.sortTitle,b.sortTitle)*direction;
}
function v548SortedLogIndex(base,dir){
  const key=base+'|'+v224SortDirection(dir);
  let rows=V548_SORTED_INDEXES.get(key);
  if(rows)return rows;
  rows=V548_LOG_INDEX.slice().sort((a,b)=>v548CompareEntries(a,b,base,dir));
  V548_SORTED_INDEXES.set(key,rows);
  V548_SORT_BUILDS++;
  return rows;
}

const v548LogTitleCandidatesBase=logTitleCandidates;
logTitleCandidates=function(query){
  const st=v224NormalizeLogSort();
  const base=String(st.sortBase||'title').toLowerCase();
  if(!V548_SORT_FIELDS.has(base))return v548LogTitleCandidatesBase.apply(this,arguments);

  const index=v548EnsureLogIndex();
  const rows=v548SortedLogIndex(base,st.sortDir);
  const q=String(query||'').trim().toLowerCase();
  const selectedCategories=new Set((Array.isArray(st.categories)?st.categories:[]).map(String));
  const status=String(st.status||'all').toLowerCase();
  const priority=String(st.priority||'all').toLowerCase();
  const out=[];
  for(const entry of rows){
    if(q&&!entry.searchText.includes(q))continue;
    if(selectedCategories.size&&!selectedCategories.has(String(entry.categoryIdRaw||'')))continue;
    if(status!=='all'&&String(entry.statusRaw||'planned').toLowerCase()!==status)continue;
    if(priority!=='all'&&String(entry.priorityRaw||'medium').toLowerCase()!==priority)continue;
    out.push(entry.item);
  }
  return out;
};

window.MediaFlowV548=Object.freeze({
  version:V548_RELEASE,
  inspect:()=>({
    indexedTitles:V548_LOG_INDEX.length,
    indexBuilds:V548_INDEX_BUILDS,
    sortBuilds:V548_SORT_BUILDS,
    cachedSorts:V548_SORTED_INDEXES.size
  })
});
MediaFlowRuntime.version=V548_RELEASE;
