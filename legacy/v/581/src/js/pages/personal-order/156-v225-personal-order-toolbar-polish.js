/* ============================================================
   MediaFlow v225 — Personal Order Add Titles Toolbar Polish
   ------------------------------------------------------------
   Makes every Personal Order picker control explicit and readable.
   The v224 sorting behavior is preserved: one sort field + one
   independent ASC / DESC direction control.
   ============================================================ */
const V225_RUNTIME_VERSION=225;

v140OrderPickerToolsHtml=function(data){
  const {ui,candidates,pages}=data||v140OrderPickerPageData();
  const cats=(S.categories||[]).filter(c=>c?.id);
  const catLabel=ui.categories.length?`${ui.categories.length} categories selected`:'All categories';

  return `<div class="v140-order-filterbar v224-browser-filterbar v225-order-filterbar">
    <div class="v225-order-filter-control v225-order-filter-category">
      <span class="v225-order-filter-label">Categories</span>
      <details class="v66-cat-filter">
        <summary class="btn">${escapeHtml(catLabel)} ▾</summary>
        <div class="v66-cat-panel">
          <div class="v66-cat-head"><b>Show categories</b><button type="button" class="btn btn-sm btn-ghost" onclick="App.v140OrderClearCategories(event)">All</button></div>
          ${cats.map(c=>`<label class="v66-cat-option"><input type="checkbox" ${ui.categories.includes(String(c.id))?'checked':''} onchange="App.v140OrderToggleCategory('${escapeHtml(String(c.id))}',this.checked)"><span>${v144CategoryIconHtml(c)} ${escapeHtml(c.name)}</span></label>`).join('')}
        </div>
      </details>
    </div>

    <div class="v225-order-filter-control v225-order-filter-sort">
      <label class="v225-order-filter-label" for="v225-order-sort">Sort by</label>
      <select id="v225-order-sort" aria-label="Personal Order Add Titles sort field" onchange="App.v140OrderSetFilter('sort',this.value)">${v224SortOptionsHtml(ui.sortBase,V224_ORDER_PICKER_SORT_OPTIONS)}</select>
    </div>

    <div class="v225-order-filter-control v225-order-filter-direction">
      <span class="v225-order-filter-label">Direction</span>
      ${v224SortDirectionButton(ui.sortDir,'App.v224OrderToggleSortDirection()',false,'Personal Order Add Titles sort direction')}
    </div>

    <div class="v225-order-filter-control v225-order-filter-status">
      <label class="v225-order-filter-label" for="v225-order-status">Status</label>
      <select id="v225-order-status" aria-label="Personal Order Library title status" onchange="App.v140OrderSetFilter('status',this.value)">
        <option value="all" ${ui.status==='all'?'selected':''}>All statuses</option>
        ${['planned','active','paused','completed','dropped'].map(x=>`<option value="${x}" ${ui.status===x?'selected':''}>${v199StatusLabel(x)}</option>`).join('')}
      </select>
    </div>

    <div class="v225-order-filter-control v225-order-filter-priority">
      <label class="v225-order-filter-label" for="v225-order-priority">Priority</label>
      <select id="v225-order-priority" aria-label="Personal Order Library title priority" onchange="App.v140OrderSetFilter('priority',this.value)">
        <option value="all" ${ui.priority==='all'?'selected':''}>All priorities</option>
        ${['high','medium','low'].map(x=>`<option value="${x}" ${ui.priority===x?'selected':''}>${x[0].toUpperCase()+x.slice(1)}</option>`).join('')}
      </select>
    </div>

    <div class="v225-order-filter-footer">
      <button type="button" class="btn btn-sm btn-ghost v140-order-clear" onclick="App.v140OrderClearFilters()">Clear filters</button>
      <div class="v140-order-matchline">${candidates.length.toLocaleString()} match${candidates.length===1?'':'es'} · Page ${ui.page+1}/${pages}</div>
    </div>
  </div>`;
};

MediaFlowRuntime.version=V225_RUNTIME_VERSION;
