/* ============================================================
   MediaFlow v224 — Library Controls
   ------------------------------------------------------------
   - Removes Empty library from Library page header.
   - Keeps + Add title as the single right-side header action.
   - Adds cover-presence filter to Normal + Dynamic Library.
   - Replaces direction-duplicated sorts with one sort field + ASC/DESC.
   - Alphabetic / ASC is the default Library sort.
   ============================================================ */
const V224_LIBRARY_SORT_OPTIONS=[
  ['title','Alphabetic'],
  ['priority','Priority'],
  ['rating','Rating'],
  ['progress','Progress watched/read'],
  ['total','Total episodes/chapters'],
  ['logging','Last updated by logging'],
  ['edited','Last edited'],
  ['seen','Last seen in Title Details'],
  ['added','Date added'],
  ['random','Random']
];

function v224LibrarySortState(){
  S.histFilters=S.histFilters||{};
  const f=S.histFilters;
  const allowed=new Set(V224_LIBRARY_SORT_OPTIONS.map(x=>x[0]));
  let base=String(f.libSortBase||'').toLowerCase();
  let dir=v224SortDirection(f.libSortDir);
  if(!allowed.has(base)){
    const parts=v224LegacySortParts(f.libSort,V224_DEFAULT_SORT_BASE,V224_DEFAULT_SORT_DIR);
    base=allowed.has(parts.base)?parts.base:V224_DEFAULT_SORT_BASE;
    dir=parts.dir;
    // v224 intentionally replaces the old implicit priority default.
    if(!f.libSort) {base=V224_DEFAULT_SORT_BASE;dir=V224_DEFAULT_SORT_DIR;}
  }
  if(base==='random')dir='asc';
  f.libSortBase=base;
  f.libSortDir=dir;
  f.libSort=v224SortKey(base,dir);
  return {base,dir,key:f.libSort};
}

v189SortMode=function(){ return v224LibrarySortState().key; };

v69SetLibrarySort=function(value){
  S.histFilters=S.histFilters||{};
  const allowed=new Set(V224_LIBRARY_SORT_OPTIONS.map(x=>x[0]));
  const raw=String(value||'').toLowerCase();
  const parts=v224LegacySortParts(raw,V224_DEFAULT_SORT_BASE,V224_DEFAULT_SORT_DIR);
  const base=allowed.has(raw)?raw:(allowed.has(parts.base)?parts.base:V224_DEFAULT_SORT_BASE);
  const current=v224LibrarySortState();
  const dir=base==='random'?'asc':(raw.includes('-')?parts.dir:current.dir);
  S.histFilters.libSortBase=base;
  S.histFilters.libSortDir=dir;
  S.histFilters.libSort=v224SortKey(base,dir);
  if(base==='random')S.histFilters.libRandomSeed=Date.now()+(++V189_RANDOM_COUNTER);
  S.libPage=0;
  try{v53InvalidateLibraryCache();}catch(_){ }
  render();
};
App.v69SetLibrarySort=v69SetLibrarySort;

function v224ToggleLibrarySortDirection(){
  const st=v224LibrarySortState();
  if(st.base==='random')return;
  S.histFilters.libSortDir=st.dir==='asc'?'desc':'asc';
  S.histFilters.libSort=v224SortKey(st.base,S.histFilters.libSortDir);
  S.libPage=0;
  try{v53InvalidateLibraryCache();}catch(_){ }
  render();
}
App.v224ToggleLibrarySortDirection=v224ToggleLibrarySortDirection;

v189ShuffleLibraryRandom=function(){
  S.histFilters=S.histFilters||{};
  S.histFilters.libSortBase='random';
  S.histFilters.libSortDir='asc';
  S.histFilters.libSort='random';
  S.histFilters.libRandomSeed=Date.now()+(++V189_RANDOM_COUNTER);
  S.libPage=0;
  try{v53InvalidateLibraryCache();}catch(_){ }
  render();
};
App.v189ShuffleLibraryRandom=v189ShuffleLibraryRandom;

v189SortOptionsHtml=function(){
  return v224SortOptionsHtml(v224LibrarySortState().base,V224_LIBRARY_SORT_OPTIONS);
};
v189SortControlHtml=function(){
  const st=v224LibrarySortState();
  return `<div class="v189-sort-control v224-sort-control" data-v224-sort-scope="library">
    <select onchange="App.v69SetLibrarySort(this.value)" aria-label="Library sort field">${v189SortOptionsHtml()}</select>
    ${v224SortDirectionButton(st.dir,'App.v224ToggleLibrarySortDirection()',st.base==='random','Library sort direction')}
    ${st.base==='random'?`<button type="button" class="btn btn-sm btn-ghost v189-shuffle-again" onclick="App.v189ShuffleLibraryRandom()">↻ Shuffle again</button>`:''}
  </div>${v189UnfinishedFilterHtml()}`;
};

function v224LibraryCoverFilter(){
  S.histFilters=S.histFilters||{};
  const value=String(S.histFilters.libCover||'all').toLowerCase();
  return ['all','has','missing'].includes(value)?value:'all';
}
function v224LibraryHasCover(item){
  return !!String(item?.coverUrl||'').trim();
}
function v224FilterLibraryByCover(rows){
  const mode=v224LibraryCoverFilter();
  if(mode==='all')return rows;
  return (rows||[]).filter(item=>mode==='has'?v224LibraryHasCover(item):!v224LibraryHasCover(item));
}
function v224SetLibraryCoverFilter(value){
  S.histFilters=S.histFilters||{};
  const v=String(value||'all').toLowerCase();
  S.histFilters.libCover=['all','has','missing'].includes(v)?v:'all';
  S.libPage=0;
  try{v53InvalidateLibraryCache();}catch(_){ }
  render();
}
App.v224SetLibraryCoverFilter=v224SetLibraryCoverFilter;
function v224LibraryCoverFilterHtml(){
  const mode=v224LibraryCoverFilter();
  return `<select class="v224-cover-filter" onchange="App.v224SetLibraryCoverFilter(this.value)" aria-label="Filter titles by cover availability">
    <option value="all" ${mode==='all'?'selected':''}>All covers</option>
    <option value="has" ${mode==='has'?'selected':''}>Has cover</option>
    <option value="missing" ${mode==='missing'?'selected':''}>Missing cover</option>
  </select>`;
}

const v224FilteredLibraryBase=v53FilteredLibrary;
v53FilteredLibrary=function(){
  return v224FilterLibraryByCover(v224FilteredLibraryBase.apply(this,arguments));
};
const v224DynamicRowsBase=v181DynamicRows;
v181DynamicRows=function(){
  return v224FilterLibraryByCover(v224DynamicRowsBase.apply(this,arguments));
};

const v224RenderLibraryBase=renderLibrary;
renderLibrary=function(){
  let h=v224RenderLibraryBase.apply(this,arguments);

  // Emptying the entire Library now lives only in Settings → Library Maintenance.
  h=h.replace(/\s*<button class="btn btn-danger" onclick="App\.emptyLibraryAdvanced\(\)">Empty library<\/button>/g,'');

  // Add one cover-presence filter beside the Library search in both modes.
  if(!h.includes('class="v224-cover-filter"')){
    h=h.replace(
      /(<input[^>]+oninput="App\.searchLibrary\(this\.value\)"[^>]*>)/,
      `$1${v224LibraryCoverFilterHtml()}`
    );
  }

  return h;
};

// Normalize the new default at startup without touching persisted content data.
v224LibrarySortState();
