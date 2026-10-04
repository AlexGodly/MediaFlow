/* ============================================================
   MediaFlow v224 — Batch Log Unified Sorting
   ------------------------------------------------------------
   Batch Log now uses one sort field plus one ASC/DESC switch.
   Alphabetic / ASC is the default.
   ============================================================ */
const V224_BATCH_SORT_OPTIONS=[
  ['title','Alphabetic'],
  ['priority','Priority'],
  ['rating','Rating'],
  ['progress','Progress'],
  ['total','Total']
];

const v224NormalizeBatchLibraryStateBase=v175NormalizeBatchLibraryState;
v175NormalizeBatchLibraryState=function(){
  const st=v224NormalizeBatchLibraryStateBase.apply(this,arguments);
  const allowed=new Set(V224_BATCH_SORT_OPTIONS.map(x=>x[0]));
  let base=String(st.sortBase||'').toLowerCase();
  let dir=v224SortDirection(st.sortDir);
  if(!allowed.has(base)){
    const parts=v224LegacySortParts(st.sort,V224_DEFAULT_SORT_BASE,V224_DEFAULT_SORT_DIR);
    base=allowed.has(parts.base)?parts.base:V224_DEFAULT_SORT_BASE;
    dir=parts.dir;
    if(!st.sort||st.sort==='relevance'){base=V224_DEFAULT_SORT_BASE;dir=V224_DEFAULT_SORT_DIR;}
  }
  st.sortBase=base;
  st.sortDir=dir;
  st.sort=v224SortKey(base,dir);
  return st;
};

function v224BatchToggleSortDirection(){
  const st=v175NormalizeBatchLibraryState();
  st.sortDir=st.sortDir==='asc'?'desc':'asc';
  st.sort=v224SortKey(st.sortBase,st.sortDir);
  st.pages={};
  v175RefreshBatchLibraryUI();
}

v175BatchSetFilter=function(key,value){
  const st=v175NormalizeBatchLibraryState();
  if(!['sort','status','priority'].includes(String(key)))return;
  if(key==='sort'){
    const allowed=new Set(V224_BATCH_SORT_OPTIONS.map(x=>x[0]));
    st.sortBase=allowed.has(String(value))?String(value):V224_DEFAULT_SORT_BASE;
    st.sort=v224SortKey(st.sortBase,st.sortDir);
  }else{
    st[key]=String(value||'all').toLowerCase();
  }
  st.pages={};
  v175RefreshBatchLibraryUI();
};

v175BatchClearFilters=function(){
  const st=v175NormalizeBatchLibraryState();
  st.categories=[];
  st.status='all';
  st.priority='all';
  st.sortBase=V224_DEFAULT_SORT_BASE;
  st.sortDir=V224_DEFAULT_SORT_DIR;
  st.sort=v224SortKey(st.sortBase,st.sortDir);
  st.pages={};
  v175RefreshBatchLibraryUI();
};

v175BatchLibraryToolsHtml=function(){
  const st=v175NormalizeBatchLibraryState();
  const cats=(S.categories||[]).filter(c=>c?.id);
  const catLabel=st.categories.length?`${st.categories.length} categories selected`:'All categories';
  return `<div id="v175-batch-library-tools" class="card v175-batch-library-tools">
    <div class="section-label">BATCH LOG LIBRARY BROWSER</div>
    <div class="v140-order-filterbar v224-browser-filterbar">
      <details class="v66-cat-filter">
        <summary class="btn">${escapeHtml(catLabel)} ▾</summary>
        <div class="v66-cat-panel">
          <div class="v66-cat-head"><b>Show categories</b><button type="button" class="btn btn-sm btn-ghost" onclick="App.v175BatchClearCategories(event)">All</button></div>
          ${cats.map(c=>`<label class="v66-cat-option"><input type="checkbox" ${st.categories.includes(String(c.id))?'checked':''} onchange="App.v175BatchToggleCategory('${escapeHtml(String(c.id))}',this.checked)"><span>${v144CategoryIconHtml(c)} ${escapeHtml(c.name)}</span></label>`).join('')}
        </div>
      </details>
      <div class="v224-sort-pair">
        <select aria-label="Batch Log sort field" onchange="App.v175BatchSetFilter('sort',this.value)">${v224SortOptionsHtml(st.sortBase,V224_BATCH_SORT_OPTIONS)}</select>
        ${v224SortDirectionButton(st.sortDir,'App.v224BatchToggleSortDirection()',false,'Batch Log sort direction')}
      </div>
      <select aria-label="Batch Log Library title status" onchange="App.v175BatchSetFilter('status',this.value)">
        <option value="all" ${st.status==='all'?'selected':''}>All statuses</option>
        ${['planned','active','paused','completed','dropped'].map(x=>`<option value="${x}" ${st.status===x?'selected':''}>${v199StatusLabel(x)}</option>`).join('')}
      </select>
      <select aria-label="Batch Log Library title priority" onchange="App.v175BatchSetFilter('priority',this.value)">
        <option value="all" ${st.priority==='all'?'selected':''}>All priorities</option>
        ${['high','medium','low'].map(x=>`<option value="${x}" ${st.priority===x?'selected':''}>${x[0].toUpperCase()+x.slice(1)}</option>`).join('')}
      </select>
      ${v175PageSizeControlHtml('batchLibrary','Per page')}
      <button type="button" class="btn btn-sm btn-ghost" onclick="App.v175BatchClearFilters()">Clear filters</button>
    </div>
    <div class="v175-batch-browser-note">These filters apply to every Batch Log title search. Focus a title field with no text to browse the full Library, or type to search within the filtered results.</div>
  </div>`;
};

Object.assign(App,{
  v175BatchSetFilter,
  v175BatchClearFilters,
  v224BatchToggleSortDirection
});

// Normalize the transient browser state immediately for the v224 default.
V175_BATCH_LIBRARY.sortBase=V224_DEFAULT_SORT_BASE;
V175_BATCH_LIBRARY.sortDir=V224_DEFAULT_SORT_DIR;
V175_BATCH_LIBRARY.sort=v224SortKey(V224_DEFAULT_SORT_BASE,V224_DEFAULT_SORT_DIR);
