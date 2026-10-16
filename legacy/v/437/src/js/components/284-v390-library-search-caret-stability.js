/* MediaFlow v390 — Library search caret/selection stability.
 * Complements the v265 and v281 render fixes. Reattach only a replaced search
 * input and never override a still-focused input's live selection or steal
 * focus from another control. No Library filtering or save changes.
 */
const V390_LIBRARY_SEARCH_SELECTOR='#view-root .mf264-library-search,#view-root .lib-search';
function v390ActiveLibrarySearch(){
  const el=document.activeElement;
  return String(S.view||'')==='library'&&!!el?.matches?.(V390_LIBRARY_SEARCH_SELECTOR)?el:null;
}
function v390VisibleSearch(){
  return [...document.querySelectorAll(V390_LIBRARY_SEARCH_SELECTOR)].find(el=>{
    const style=getComputedStyle(el);
    return style.visibility!=='hidden'&&style.display!=='none'&&el.offsetParent!==null;
  })||null;
}
let V390_RENDERS_WITH_SEARCH=0;
const v390RenderBase=render;
render=function(){
  const source=v390ActiveLibrarySearch();
  const snapshot=source?{
    value:source.value,
    start:source.selectionStart,
    end:source.selectionEnd,
    direction:source.selectionDirection||'none'
  }:null;
  const result=v390RenderBase.apply(this,arguments);
  if(!snapshot||String(S.view||'')!=='library')return result;
  V390_RENDERS_WITH_SEARCH++;
  const target=v390VisibleSearch();
  if(!target||target===source||document.activeElement===target)return result;
  const active=document.activeElement;
  if(active&&active!==document.body&&active!==document.documentElement&&active.isConnected)return result;
  // A different search value means the user typed again while this render ran.
  if(String(S.histFilters?.libSearch??'')!==snapshot.value)return result;
  try{
    target.focus({preventScroll:true});
    target.setSelectionRange(snapshot.start,snapshot.end,snapshot.direction);
  }catch(_){ }
  return result;
};
App.v390LibrarySearchAudit=()=>({release:390,guardedRenders:V390_RENDERS_WITH_SEARCH,activeSearch:!!v390ActiveLibrarySearch()});
window.MediaFlowV390={version:390,focus:'Library search caret, selection, and focus stability'};
MediaFlowRuntime.version=390;
