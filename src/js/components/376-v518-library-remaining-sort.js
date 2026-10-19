/* MediaFlow v518 — Normal & Dynamic Library sort parity with Logging.
 * The two Library modes share S.histFilters and v189CompareLibraryItems.
 * Extend their canonical v224 sorter (not their obsolete duplicate HTML).
 * Sorting remains read-only and does not modify per-title progress or seasons.
 */
const V518_RELEASE=518;
if(!V224_LIBRARY_SORT_OPTIONS.some(([key])=>key==='remaining')){
  const afterTotal=V224_LIBRARY_SORT_OPTIONS.findIndex(([key])=>key==='total');
  V224_LIBRARY_SORT_OPTIONS.splice(afterTotal<0?V224_LIBRARY_SORT_OPTIONS.length:afterTotal+1,
    0,['remaining','Remaining progress']);
}
const v518AddedOption=V224_LIBRARY_SORT_OPTIONS.find(row=>row[0]==='added');
if(v518AddedOption)v518AddedOption[1]='Date added to Library';

// Support restoring/importing direction-qualified remaining sorts in legacy
// histFilters which have libSort but no libSortBase.
const v518LegacySortParts=v224LegacySortParts;
v224LegacySortParts=function(value,fallbackBase,fallbackDir){
  const raw=String(value||'').trim().toLowerCase();
  const match=raw.match(/^remaining-(asc|desc)$/);
  if(match)return {base:'remaining',dir:match[1]};
  if(raw==='remaining')return {base:'remaining',dir:v224SortDirection(fallbackDir)};
  return v518LegacySortParts.apply(this,arguments);
};

const v518LibrarySortStateBase=v224LibrarySortState;
v224LibrarySortState=function(){
  S.histFilters=S.histFilters||{};
  const filters=S.histFilters;
  if(filters.v518DefaultApplied!==true){
    const base=String(filters.libSortBase||'').toLowerCase();
    const key=String(filters.libSort||'').toLowerCase();
    const dir=String(filters.libSortDir||'').toLowerCase();
    // Older versions initialized the Library sorter to Alphabetic ASC even
    // when the user had never opened it. Upgrade that untouched default, but
    // preserve all distinct saved user choices (priority, progress, custom
    // direction, random, etc.). No title or cloud data is modified.
    const unset=!base&&!key;
    const oldDefault=(base===''||base==='title')&&
      (dir===''||dir==='asc')&&(!key||key==='title-asc');
    if(unset||oldDefault){
      filters.libSortBase='added';
      filters.libSortDir='desc';
      filters.libSort='added-desc';
    }
    filters.v518DefaultApplied=true;
  }
  return v518LibrarySortStateBase.apply(this,arguments);
};

// These comparators serve both Normal Library's v53FilteredLibrary and
// Dynamic Library's v181SortDynamicRows, including all display modes.
function v518CompareRemainingLibrary(a,b,dir){
  const ai=a?.item||a,bi=b?.item||b;
  const av=v373RemainingUnits(ai),bv=v373RemainingUnits(bi);
  if(av===null&&bv!==null)return 1;
  if(av!==null&&bv===null)return -1;
  if(av===null&&bv===null)return 0;
  return (av-bv)*(dir==='asc'?1:-1);
}
const v518CompareLibraryBase=v189CompareLibraryItems;
v189CompareLibraryItems=function(a,b,sort){
  if(sort==='remaining-asc'||sort==='remaining-desc'){
    return v518CompareRemainingLibrary(a,b,sort.endsWith('-asc')?'asc':'desc')||
      v518CompareLibraryBase(a,b,'title-asc');
  }
  return v518CompareLibraryBase.apply(this,arguments);
};
const v518CompareLikeBase=v224CompareLibraryLike;
v224CompareLibraryLike=function(a,b,base,dir){
  if(base==='remaining'){
    return v518CompareRemainingLibrary(a,b,v224SortDirection(dir))||
      v518CompareLikeBase(a,b,'title','asc');
  }
  return v518CompareLikeBase.apply(this,arguments);
};

// Keep the same direction behavior as the v517 Logging picker: choosing
// Remaining or Date added begins with descending (most/newest first).
const v518SetLibrarySortBase=v69SetLibrarySort;
v69SetLibrarySort=function(value){
  const raw=String(value||'').toLowerCase();
  if(raw==='remaining'||raw==='added'){
    v224LibrarySortState();
    S.histFilters.libSortDir='desc';
  }
  return v518SetLibrarySortBase.apply(this,arguments);
};
App.v69SetLibrarySort=v69SetLibrarySort;

// v224's initial normalization already ran before this late extension.
// Apply v518 default migration now, before the next Library rendering.
const V518_INITIAL_LIBRARY_SORT=v224LibrarySortState();
window.MediaFlowV518=Object.freeze({
  version:V518_RELEASE,
  supportedModes:['classic','dynamic'],
  defaultSort:'added-desc',
  remainingUnits:v373RemainingUnits,
  inspect:()=>({sort:v224LibrarySortState(),options:V224_LIBRARY_SORT_OPTIONS.map(row=>row[0])})
});
