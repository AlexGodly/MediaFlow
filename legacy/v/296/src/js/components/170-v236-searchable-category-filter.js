/* ============================================================
   MediaFlow v236 — Searchable + Paginated Category Filter
   ------------------------------------------------------------
   - Rebuilds the Normal Library Category Filter as a persistent-open
     multi-select dropdown with live search.
   - Keeps effective category order/visibility sourced from v230 Choice &
     Filter Layout settings.
   - Adds Category Filter page-size persistence (default 15).
   - Pagination appears only when the effective/search result count exceeds
     the configured page size.
   - Checkbox changes update Library filtering without forcing the user to
     reopen the dropdown after every category selection.
   ============================================================ */

const V236_RUNTIME_VERSION=236;
const V236_CATEGORY_FILTER_DEFAULT_PAGE_SIZE=15;
const V236_CATEGORY_FILTER_MAX_PAGE_SIZE=500;
const V236_LIBRARY_CATEGORY_UI={open:false,query:'',page:0};
let V236_LIBRARY_FILTER_RENDER_FRAME=0;

function v236ClampCategoryFilterPageSize(value){
  const n=Math.trunc(Number(value)||V236_CATEGORY_FILTER_DEFAULT_PAGE_SIZE);
  return Math.max(1,Math.min(V236_CATEGORY_FILTER_MAX_PAGE_SIZE,n));
}

/* Keep the new page-size field inside the existing v230 persistent layout
   object so Cloud Sync / Full Backup / Settings Preset automatically cover it. */
const v236NormalizeSurfaceBase=v230NormalizeSurface;
v230NormalizeSurface=function(raw,surface){
  const out=v236NormalizeSurfaceBase.apply(this,arguments);
  if(surface==='categoryFilter')out.pageSize=v236ClampCategoryFilterPageSize(raw?.pageSize);
  return out;
};

function v236EnsureCategoryFilterPageSize(settings=S.settings||DEFAULT_SETTINGS){
  const cfg=v230EnsureChoiceLayout(settings);
  cfg.categoryFilter=cfg.categoryFilter||{};
  cfg.categoryFilter.pageSize=v236ClampCategoryFilterPageSize(cfg.categoryFilter.pageSize);
  return cfg.categoryFilter.pageSize;
}
v236EnsureCategoryFilterPageSize(DEFAULT_SETTINGS);
v236EnsureCategoryFilterPageSize(S.settings||DEFAULT_SETTINGS);

function v236CategoryFilterPageSize(){
  return v236EnsureCategoryFilterPageSize(S.settings||DEFAULT_SETTINGS);
}

function v236SetCategoryFilterPageSize(value){
  const cfg=v230EnsureChoiceLayout(S.settings||DEFAULT_SETTINGS);
  cfg.categoryFilter.pageSize=v236ClampCategoryFilterPageSize(value);
  cfg.modifiedAt=Date.now();
  V236_LIBRARY_CATEGORY_UI.page=0;
  persistSettings();
  render();
  showToast(`Category Filter now shows ${cfg.categoryFilter.pageSize} categor${cfg.categoryFilter.pageSize===1?'y':'ies'} per page.`);
}

/* Individual reset support for the new setting. */
const v236ResetDescriptorBase=v221ResetDescriptorForControl;
v221ResetDescriptorForControl=function(el){
  const code=[el?.getAttribute?.('onchange'),el?.getAttribute?.('onclick'),el?.getAttribute?.('oninput')].filter(Boolean).join(' ');
  if(code.includes('App.v236SetCategoryFilterPageSize'))return {type:'path',path:'v230ChoiceLayout.categoryFilter.pageSize'};
  return v236ResetDescriptorBase(el);
};

/* Add the page-size control directly to the existing Category Filter card in
   Choice & Filter Layout, regardless of which ordering source is active. */
const v236SurfaceEditorBase=v230SurfaceEditor;
v230SurfaceEditor=function(surface){
  let html=v236SurfaceEditorBase.apply(this,arguments);
  if(surface!=='categoryFilter')return html;
  const size=v236CategoryFilterPageSize();
  const control=`<div class="v236-category-filter-page-size-setting">
    <div><b>Categories per page</b><small>Pagination appears only when the available category choices exceed this number.</small></div>
    <input type="number" min="1" max="${V236_CATEGORY_FILTER_MAX_PAGE_SIZE}" step="1" value="${size}" aria-label="Category Filter categories per page" onchange="App.v236SetCategoryFilterPageSize(this.value)">
  </div>`;
  return html.replace('<div class="v230-layout-list">',control+'<div class="v230-layout-list">');
};

function v236EffectiveCategoryFilterCategories(){
  const byId=new Map((S.categories||[]).filter(Boolean).map(cat=>[String(cat.id),cat]));
  const state=v230ResolvedSurface('categoryFilter');
  const hidden=new Set((state.hidden||[]).map(String));
  return (state.order||[]).map(String).filter(id=>!hidden.has(id)).map(id=>byId.get(id)).filter(Boolean);
}

function v236SelectedCategoryIds(){
  S.histFilters=S.histFilters||{};
  const valid=new Set((S.categories||[]).map(c=>String(c?.id||'')));
  const rows=Array.isArray(S.histFilters.libCategories)?S.histFilters.libCategories:[];
  const seen=new Set(),out=[];
  for(const raw of rows){const id=String(raw||'');if(id&&valid.has(id)&&!seen.has(id)){seen.add(id);out.push(id);}}
  S.histFilters.libCategories=out;
  return out;
}

function v236CategoryFilterSearchRows(){
  const query=String(V236_LIBRARY_CATEGORY_UI.query||'').trim().toLocaleLowerCase();
  const rows=v236EffectiveCategoryFilterCategories();
  if(!query)return rows;
  return rows.filter(cat=>String(cat?.name||'').toLocaleLowerCase().includes(query));
}

function v236CategoryFilterPageData(){
  const all=v236CategoryFilterSearchRows();
  const pageSize=v236CategoryFilterPageSize();
  const pageCount=Math.max(1,Math.ceil(all.length/pageSize));
  V236_LIBRARY_CATEGORY_UI.page=Math.max(0,Math.min(pageCount-1,Number(V236_LIBRARY_CATEGORY_UI.page)||0));
  const start=V236_LIBRARY_CATEGORY_UI.page*pageSize;
  return {all,pageSize,pageCount,page:V236_LIBRARY_CATEGORY_UI.page,rows:all.slice(start,start+pageSize),start};
}

function v236CategoryFilterRowsHtml(rows){
  const selected=new Set(v236SelectedCategoryIds().map(String));
  if(!rows.length)return '<div class="v236-category-filter-empty">No categories match your search.</div>';
  return rows.map(cat=>{
    const id=String(cat?.id||'');
    return `<label class="v66-cat-option v236-category-filter-option" data-v236-category-id="${escapeHtml(id)}">
      <input type="checkbox" ${selected.has(id)?'checked':''} onchange="App.v236ToggleLibraryCategory('${escapeHtml(id)}',this.checked)">
      <span>${v144CategoryIconHtml(cat)} <span>${escapeHtml(cat?.name||'Unnamed category')}</span></span>
    </label>`;
  }).join('');
}

function v236CategoryFilterPagerHtml(data){
  if(data.all.length<=data.pageSize)return '';
  return `<div class="v236-category-filter-pager" aria-label="Category Filter pages">
    <button type="button" class="btn btn-sm btn-ghost" onclick="App.v236SetLibraryCategoryFilterPage(${data.page-1})" ${data.page<=0?'disabled':''}>Previous</button>
    <span>Page <b>${data.page+1}</b> of <b>${data.pageCount}</b></span>
    <button type="button" class="btn btn-sm btn-ghost" onclick="App.v236SetLibraryCategoryFilterPage(${data.page+1})" ${data.page>=data.pageCount-1?'disabled':''}>Next</button>
  </div>`;
}

function v236CategoryFilterSummaryHtml(){
  const selected=v236SelectedCategoryIds();
  if(!selected.length)return '<span class="v236-category-filter-summary-label">All categories</span>';
  const byId=new Map((S.categories||[]).map(c=>[String(c?.id||''),c]));
  const cats=selected.map(id=>byId.get(String(id))).filter(Boolean);
  if(!cats.length)return '<span class="v236-category-filter-summary-label">All categories</span>';
  const visible=cats.slice(0,2).map(cat=>`<span class="v236-category-filter-chip">${v144CategoryIconHtml(cat)}<span>${escapeHtml(cat.name)}</span></span>`).join('');
  const more=cats.length>2?`<span class="v236-category-filter-more">+${cats.length-2}</span>`:'';
  return `<span class="v236-category-filter-summary-chips">${visible}${more}</span>`;
}

function v236LibraryCategoryFilterHtml(){
  const data=v236CategoryFilterPageData();
  const selected=v236SelectedCategoryIds();
  const total=v236EffectiveCategoryFilterCategories().length;
  const query=String(V236_LIBRARY_CATEGORY_UI.query||'');
  return `<details class="v66-cat-filter v236-category-filter" data-v236-library-category-filter ${V236_LIBRARY_CATEGORY_UI.open?'open':''} ontoggle="App.v236CategoryFilterToggle(this)">
    <summary class="btn v236-category-filter-summary">${v236CategoryFilterSummaryHtml()}<span class="v236-category-filter-chevron" aria-hidden="true">⌄</span></summary>
    <div class="v66-cat-panel v236-category-filter-panel" onclick="event.stopPropagation()">
      <div class="v236-category-filter-search-wrap">
        <input class="v236-category-filter-search" type="search" placeholder="Search categories…" value="${escapeHtml(query)}" autocomplete="off" spellcheck="false" oninput="App.v236SearchLibraryCategories(this.value)">
      </div>
      <div class="v66-cat-head v236-category-filter-head"><b>Categories</b><button type="button" class="btn btn-sm btn-ghost" onclick="event.preventDefault();App.v236ClearLibraryCategories()">All</button></div>
      <div class="v236-category-filter-meta"><span>${selected.length?`${selected.length} selected`:'All selected'}</span><span>${query?`${data.all.length} matching`:`${total} available`}</span></div>
      <div class="v236-category-filter-list">${v236CategoryFilterRowsHtml(data.rows)}</div>
      ${v236CategoryFilterPagerHtml(data)}
    </div>
  </details>`;
}

function v236CategoryFilterToggle(details){
  // Keep search/page state when the user manually closes and reopens the filter;
  // only the explicit UI close state changes. This avoids stale DOM/search state.
  V236_LIBRARY_CATEGORY_UI.open=!!details?.open;
}

function v236UpdateLibraryCategoryFilterPanel(){
  const details=document.querySelector('[data-v236-library-category-filter]');
  if(!details)return;
  const data=v236CategoryFilterPageData();
  const list=details.querySelector('.v236-category-filter-list');
  const pager=details.querySelector('.v236-category-filter-pager');
  const meta=details.querySelector('.v236-category-filter-meta');
  if(list)list.innerHTML=v236CategoryFilterRowsHtml(data.rows);
  const nextPager=v236CategoryFilterPagerHtml(data);
  if(nextPager){
    if(pager)pager.outerHTML=nextPager;
    else details.querySelector('.v236-category-filter-list')?.insertAdjacentHTML('afterend',nextPager);
  }else pager?.remove();
  if(meta){
    const selected=v236SelectedCategoryIds();
    const total=v236EffectiveCategoryFilterCategories().length;
    meta.innerHTML=`<span>${selected.length?`${selected.length} selected`:'All selected'}</span><span>${V236_LIBRARY_CATEGORY_UI.query?`${data.all.length} matching`:`${total} available`}</span>`;
  }
}

function v236SearchLibraryCategories(value){
  V236_LIBRARY_CATEGORY_UI.query=String(value||'');
  V236_LIBRARY_CATEGORY_UI.page=0;
  v236UpdateLibraryCategoryFilterPanel();
}
function v236SetLibraryCategoryFilterPage(page){
  V236_LIBRARY_CATEGORY_UI.page=Math.max(0,Number(page)||0);
  v236UpdateLibraryCategoryFilterPanel();
}

function v236ScheduleLibraryFilterRender(){
  if(V236_LIBRARY_FILTER_RENDER_FRAME)return;
  V236_LIBRARY_FILTER_RENDER_FRAME=requestAnimationFrame(()=>{
    V236_LIBRARY_FILTER_RENDER_FRAME=0;
    render();
  });
}

function v236ToggleLibraryCategory(id,on){
  S.histFilters=S.histFilters||{};
  const set=new Set(v236SelectedCategoryIds().map(String));
  const sid=String(id||'');
  if(on)set.add(sid);else set.delete(sid);
  S.histFilters.libCategories=[...set];
  S.histFilters.libCategory='all';
  S.libPage=0;
  V236_LIBRARY_CATEGORY_UI.open=true;
  try{v53InvalidateLibraryCache();}catch(_){ }
  v236ScheduleLibraryFilterRender();
}
function v236ClearLibraryCategories(){
  S.histFilters=S.histFilters||{};
  S.histFilters.libCategories=[];S.histFilters.libCategory='all';S.libPage=0;
  V236_LIBRARY_CATEGORY_UI.open=true;
  try{v53InvalidateLibraryCache();}catch(_){ }
  v236ScheduleLibraryFilterRender();
}

/* Keep legacy action names pointing at the faster persistent-open path. */
v69ToggleLibraryCategory=v236ToggleLibraryCategory;
v69ClearLibraryCategories=v236ClearLibraryCategories;

/* Final Normal Library HTML pass. Dynamic Library keeps its dedicated category
   row and is intentionally untouched. */
const v236RenderLibraryBase=renderLibrary;
renderLibrary=function(){
  let html=v236RenderLibraryBase.apply(this,arguments);
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  if(cfg.mode==='dynamic')return html;
  const replacement=v236LibraryCategoryFilterHtml();
  html=html.replace(/<details class="v66-cat-filter"[\s\S]*?<\/details>/,replacement);
  return html;
};

/* v232's generic Category Filter DOM reorder pass is unnecessary for the new
   Library control because v236 already renders only the resolved order/page. */
const v236ApplyCategoryPanelBase=v230ApplyCategoryPanel;
v230ApplyCategoryPanel=function(details){
  if(details?.matches?.('[data-v236-library-category-filter]'))return;
  return v236ApplyCategoryPanelBase.apply(this,arguments);
};

Object.assign(App,{
  v236SetCategoryFilterPageSize,
  v236CategoryFilterToggle,
  v236SearchLibraryCategories,
  v236SetLibraryCategoryFilterPage,
  v236ToggleLibraryCategory,
  v236ClearLibraryCategories,
  v69ToggleLibraryCategory:v236ToggleLibraryCategory,
  v69ClearLibraryCategories:v236ClearLibraryCategories
});

MediaFlowRuntime.version=V236_RUNTIME_VERSION;
