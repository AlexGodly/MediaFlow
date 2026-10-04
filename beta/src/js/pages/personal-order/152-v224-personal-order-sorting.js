/* ============================================================
   MediaFlow v224 — Personal Order Picker Sorting
   ------------------------------------------------------------
   The Add Titles browser now uses one sort field + ASC/DESC.
   Alphabetic / ASC is the default. The saved Personal Order itself
   remains manual and is never auto-sorted.
   ============================================================ */
const V224_ORDER_PICKER_SORT_OPTIONS=[
  ['title','Alphabetic'],
  ['priority','Priority'],
  ['rating','Rating'],
  ['progress','Progress'],
  ['total','Total']
];

const v224EnsureOrderPickerUIBase=v140EnsureOrderPickerUI;
v140EnsureOrderPickerUI=function(){
  const ui=v224EnsureOrderPickerUIBase.apply(this,arguments);
  const allowed=new Set(V224_ORDER_PICKER_SORT_OPTIONS.map(x=>x[0]));
  let base=String(ui.sortBase||'').toLowerCase();
  let dir=v224SortDirection(ui.sortDir);
  if(!allowed.has(base)){
    const parts=v224LegacySortParts(ui.sort,V224_DEFAULT_SORT_BASE,V224_DEFAULT_SORT_DIR);
    base=allowed.has(parts.base)?parts.base:V224_DEFAULT_SORT_BASE;
    dir=parts.dir;
    if(!ui.sort||ui.sort==='relevance'){base=V224_DEFAULT_SORT_BASE;dir=V224_DEFAULT_SORT_DIR;}
  }
  ui.sortBase=base;
  ui.sortDir=dir;
  ui.sort=v224SortKey(base,dir);
  return ui;
};

function v224OrderToggleSortDirection(){
  const ui=v140EnsureOrderPickerUI();
  ui.sortDir=ui.sortDir==='asc'?'desc':'asc';
  ui.sort=v224SortKey(ui.sortBase,ui.sortDir);
  ui.page=0;
  v138RefreshPickerDOM();
}

v140OrderSetFilter=function(key,value){
  const ui=v140EnsureOrderPickerUI();
  if(!['sort','status','priority'].includes(String(key)))return;
  if(key==='sort'){
    const allowed=new Set(V224_ORDER_PICKER_SORT_OPTIONS.map(x=>x[0]));
    ui.sortBase=allowed.has(String(value))?String(value):V224_DEFAULT_SORT_BASE;
    ui.sort=v224SortKey(ui.sortBase,ui.sortDir);
  }else{
    ui[key]=String(value||'all').toLowerCase();
  }
  ui.page=0;
  v138RefreshPickerDOM();
};

v140OrderClearFilters=function(){
  const ui=v140EnsureOrderPickerUI();
  ui.categories=[];
  ui.status='all';
  ui.priority='all';
  ui.sortBase=V224_DEFAULT_SORT_BASE;
  ui.sortDir=V224_DEFAULT_SORT_DIR;
  ui.sort=v224SortKey(ui.sortBase,ui.sortDir);
  ui.page=0;
  v138RefreshPickerDOM();
};

v140OrderPickerToolsHtml=function(data){
  const {ui,candidates,pages}=data||v140OrderPickerPageData();
  const cats=(S.categories||[]).filter(c=>c?.id);
  const catLabel=ui.categories.length?`${ui.categories.length} categories selected`:'All categories';
  return `<div class="v140-order-filterbar v224-browser-filterbar">
    <details class="v66-cat-filter">
      <summary class="btn">${escapeHtml(catLabel)} ▾</summary>
      <div class="v66-cat-panel">
        <div class="v66-cat-head"><b>Show categories</b><button type="button" class="btn btn-sm btn-ghost" onclick="App.v140OrderClearCategories(event)">All</button></div>
        ${cats.map(c=>`<label class="v66-cat-option"><input type="checkbox" ${ui.categories.includes(String(c.id))?'checked':''} onchange="App.v140OrderToggleCategory('${escapeHtml(String(c.id))}',this.checked)"><span>${v144CategoryIconHtml(c)} ${escapeHtml(c.name)}</span></label>`).join('')}
      </div>
    </details>
    <div class="v224-sort-pair">
      <select aria-label="Personal Order Add Titles sort field" onchange="App.v140OrderSetFilter('sort',this.value)">${v224SortOptionsHtml(ui.sortBase,V224_ORDER_PICKER_SORT_OPTIONS)}</select>
      ${v224SortDirectionButton(ui.sortDir,'App.v224OrderToggleSortDirection()',false,'Personal Order Add Titles sort direction')}
    </div>
    <select aria-label="Personal Order Library title status" onchange="App.v140OrderSetFilter('status',this.value)">
      <option value="all" ${ui.status==='all'?'selected':''}>All statuses</option>
      ${['planned','active','paused','completed','dropped'].map(x=>`<option value="${x}" ${ui.status===x?'selected':''}>${v199StatusLabel(x)}</option>`).join('')}
    </select>
    <select aria-label="Personal Order Library title priority" onchange="App.v140OrderSetFilter('priority',this.value)">
      <option value="all" ${ui.priority==='all'?'selected':''}>All priorities</option>
      ${['high','medium','low'].map(x=>`<option value="${x}" ${ui.priority===x?'selected':''}>${x[0].toUpperCase()+x.slice(1)}</option>`).join('')}
    </select>
    <button type="button" class="btn btn-sm btn-ghost v140-order-clear" onclick="App.v140OrderClearFilters()">Clear filters</button>
    <div class="v140-order-matchline">${candidates.length.toLocaleString()} match${candidates.length===1?'':'es'} · Page ${ui.page+1}/${pages}</div>
  </div>`;
};

Object.assign(App,{
  v140OrderSetFilter,
  v140OrderClearFilters,
  v224OrderToggleSortDirection
});
