/* ============================================================
   MediaFlow v63 — Large Library Performance Engine
   ============================================================ */
const V53_LIB={
  libraryRef:null, libraryLen:-1, libraryToken:0,
  searchIndex:[], overview:null,
  sessionRef:null, sessionLen:-1, sessionTail:'', lastTouched:new Map(),
  filterKey:'', filtered:[]
};
let V53_LIB_SEARCH_TIMER=null;

function v53InvalidateLibraryCache(){
  V53_LIB.libraryRef=null;
  V53_LIB.libraryLen=-1;
  V53_LIB.libraryToken++;
  V53_LIB.searchIndex=[];
  V53_LIB.overview=null;
  V53_LIB.filterKey='';
  V53_LIB.filtered=[];
}
function v53InvalidateSessionCache(){
  V53_LIB.sessionRef=null;
  V53_LIB.sessionLen=-1;
  V53_LIB.sessionTail='';
  V53_LIB.lastTouched=new Map();
}
function v53EnsureLibraryIndex(){
  if(V53_LIB.libraryRef===S.library && V53_LIB.libraryLen===S.library.length && V53_LIB.searchIndex.length===S.library.length) return;
  V53_LIB.libraryRef=S.library;
  V53_LIB.libraryLen=S.library.length;
  V53_LIB.searchIndex=S.library.map((item,index)=>({
    item,index,
    title:cleanTitle(item.title),
    search:cleanTitle(item.title).toLocaleLowerCase()
  }));
  V53_LIB.overview=null;
  V53_LIB.filterKey='';
  V53_LIB.filtered=[];
}
function v53LibraryOverview(){
  v53EnsureLibraryIndex();
  if(V53_LIB.overview)return V53_LIB.overview;
  const byCat=new Map(S.categories.map(c=>[c.id,{items:0,done:0,knownDone:0,total:0,unknown:false}]));
  let totalDone=0,totalAll=0;
  for(const i of S.library){
    let x=byCat.get(i.categoryId);
    if(!x){x={items:0,done:0,knownDone:0,total:0,unknown:false};byCat.set(i.categoryId,x);}
    const progress=Math.max(0,Number(i.progress)||0);
    const total=Number(i.total)||0;
    x.items++; x.done+=progress;
    if(total>0){
      x.knownDone+=Math.min(progress,total);
      x.total+=total;
      totalDone+=Math.min(progress,total);
      totalAll+=total;
    }else x.unknown=true;
  }
  V53_LIB.overview={byCat,totalDone,totalAll,overallPct:totalAll>0?Math.round(totalDone/totalAll*100):0};
  return V53_LIB.overview;
}
function v53EnsureLastTouchedIndex(){
  const tail=S.sessions.length ? `${S.sessions[S.sessions.length-1]?.id||''}:${S.sessions[S.sessions.length-1]?.timestamp||0}` : '';
  if(V53_LIB.sessionRef===S.sessions && V53_LIB.sessionLen===S.sessions.length && V53_LIB.sessionTail===tail)return;
  const map=new Map();
  // Newest wins. Index by stable Library ID first, with normalized title as a legacy fallback.
  for(let n=S.sessions.length-1;n>=0;n--){
    const ss=S.sessions[n];
    const ts=Number(ss?.timestamp)||0;
    for(const t of (ss?.titles||[])){
      if(t?.libraryId && !map.has('id:'+t.libraryId))map.set('id:'+t.libraryId,ts);
      const title=cleanTitle(t?.title||'').toLocaleLowerCase();
      if(title && !map.has('title:'+title))map.set('title:'+title,ts);
    }
  }
  V53_LIB.sessionRef=S.sessions;
  V53_LIB.sessionLen=S.sessions.length;
  V53_LIB.sessionTail=tail;
  V53_LIB.lastTouched=map;
}
function v53LastTouched(item){
  v53EnsureLastTouchedIndex();
  return V53_LIB.lastTouched.get('id:'+item.id) ||
         V53_LIB.lastTouched.get('title:'+cleanTitle(item.title).toLocaleLowerCase()) || 0;
}
function v53FilteredLibrary(catFilter,statusFilter,priorityFilter,q){
 v53EnsureLibraryIndex();const nq=String(q||'').trim().toLocaleLowerCase(),cats=Array.isArray(S.histFilters?.libCategories)?S.histFilters.libCategories:[],sort=S.histFilters?.libSort||'priority';
 const key=[V53_LIB.libraryToken,S.library.length,catFilter,cats.slice().sort().join(','),statusFilter,priorityFilter,nq,sort].join('|');if(V53_LIB.filterKey===key)return V53_LIB.filtered;
 let rows=V53_LIB.searchIndex;if(cats.length)rows=rows.filter(x=>cats.includes(x.item.categoryId));else if(catFilter!=='all')rows=rows.filter(x=>x.item.categoryId===catFilter);
 if(statusFilter!=='all')rows=rows.filter(x=>x.item.status===statusFilter);if(priorityFilter!=='all')rows=rows.filter(x=>x.item.priority===priorityFilter);if(nq)rows=rows.filter(x=>x.search.includes(nq));
 const rank={low:0,medium:1,high:2};
 const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0;};
 const cmpTitle=(a,b)=>a.title.localeCompare(b.title,undefined,{numeric:true,sensitivity:'base'});
 rows=rows.slice().sort((a,b)=>{
   let d=0;
   if(sort==='title-asc') return cmpTitle(a,b);
   if(sort==='title-desc') return cmpTitle(b,a);
   if(sort==='priority-asc') d=(rank[a.item.priority]??1)-(rank[b.item.priority]??1);
   else if(sort==='priority-desc'||sort==='priority') d=(rank[b.item.priority]??1)-(rank[a.item.priority]??1);
   else if(sort==='rating-asc') d=num(a.item.rating)-num(b.item.rating);
   else if(sort==='rating-desc') d=num(b.item.rating)-num(a.item.rating);
   else if(sort==='progress-asc') d=num(a.item.progress)-num(b.item.progress);
   else if(sort==='progress-desc') d=num(b.item.progress)-num(a.item.progress);
   else if(sort==='total-asc') d=num(a.item.total)-num(b.item.total);
   else if(sort==='total-desc') d=num(b.item.total)-num(a.item.total);
   return d||cmpTitle(a,b);
 });
 V53_LIB.filterKey=key;V53_LIB.filtered=rows.map(x=>x.item);return V53_LIB.filtered;
}
function v53DebouncedLibrarySearch(value){
  S.histFilters.libSearch=value;
  S.libPage=0;
  clearTimeout(V53_LIB_SEARCH_TIMER);
  V53_LIB_SEARCH_TIMER=setTimeout(()=>{
    if(S.view!=='library')return;

    // render() replaces the Library DOM, including the search input.
    // Remember whether the user is actively typing and restore the new
    // input's focus/caret immediately after the debounced refresh.
    const active=document.activeElement;
    const wasTyping=!!(active && active.classList && active.classList.contains('lib-search'));
    const caret=wasTyping && active.selectionStart!=null ? active.selectionStart : String(S.histFilters.libSearch||'').length;
    const end=wasTyping && active.selectionEnd!=null ? active.selectionEnd : caret;

    render();

    if(wasTyping){
      const next=document.querySelector('.lib-search');
      if(next){
        next.focus({preventScroll:true});
        try{ next.setSelectionRange(Math.min(caret,next.value.length),Math.min(end,next.value.length)); }catch(e){}
      }
    }
  },180);
}


