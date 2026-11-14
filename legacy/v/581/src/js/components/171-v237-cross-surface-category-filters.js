/* ============================================================
   MediaFlow v237 — Searchable Category Filters Everywhere
   ------------------------------------------------------------
   Extends the v236 searchable, paginated, persistent-open category
   filter to:
     - Personal Order -> Add Titles
     - Batch Log Library Browser
     - Dashboard Logging Library Browser

   All four Library-style category filters share the existing
   Choice & Filter Layout category order / visibility and the v236
   "Categories per page" setting. Search + pager interactions only
   update the small dropdown panel; category selection coalesces the
   owning surface refresh into one animation frame and keeps the
   dropdown open.
   ============================================================ */

const V237_RUNTIME_VERSION=237;
const V237_CATEGORY_FILTER_UI={
  order:{open:false,query:'',page:0},
  batch:{open:false,query:'',page:0},
  logging:{open:false,query:'',page:0}
};
const V237_CATEGORY_REFRESH_FRAMES={order:0,batch:0,logging:0};

function v237SurfaceCategoryUi(surface){
  return V237_CATEGORY_FILTER_UI[surface]||V237_CATEGORY_FILTER_UI.order;
}

function v237SurfaceSelectedCategories(surface){
  if(surface==='order')return (v140EnsureOrderPickerUI().categories||[]).map(String);
  if(surface==='batch')return (v175NormalizeBatchLibraryState().categories||[]).map(String);
  if(surface==='logging')return (v224NormalizeLogSort().categories||[]).map(String);
  return [];
}

function v237SetSurfaceSelectedCategories(surface,ids){
  const next=[...new Set((ids||[]).map(String).filter(Boolean))];
  if(surface==='order'){
    const ui=v140EnsureOrderPickerUI();ui.categories=next;ui.page=0;return;
  }
  if(surface==='batch'){
    const st=v175NormalizeBatchLibraryState();st.categories=next;st.pages={};return;
  }
  if(surface==='logging'){
    const st=v224NormalizeLogSort();st.categories=next;st.page=0;
  }
}

function v237FilteredCategoryRows(surface){
  const ui=v237SurfaceCategoryUi(surface);
  const query=String(ui.query||'').trim().toLocaleLowerCase();
  const rows=v236EffectiveCategoryFilterCategories();
  if(!query)return rows;
  return rows.filter(cat=>String(cat?.name||'').toLocaleLowerCase().includes(query));
}

function v237CategoryPageData(surface){
  const ui=v237SurfaceCategoryUi(surface);
  const all=v237FilteredCategoryRows(surface);
  const pageSize=v236CategoryFilterPageSize();
  const pageCount=Math.max(1,Math.ceil(all.length/pageSize));
  ui.page=Math.max(0,Math.min(pageCount-1,Math.floor(Number(ui.page)||0)));
  const start=ui.page*pageSize;
  return {all,pageSize,pageCount,page:ui.page,rows:all.slice(start,start+pageSize),start};
}

function v237CategorySummaryHtml(surface){
  const selected=v237SurfaceSelectedCategories(surface);
  if(!selected.length)return '<span class="v236-category-filter-summary-label">All categories</span>';
  const byId=new Map((S.categories||[]).filter(Boolean).map(cat=>[String(cat.id),cat]));
  const cats=selected.map(id=>byId.get(String(id))).filter(Boolean);
  if(!cats.length)return '<span class="v236-category-filter-summary-label">All categories</span>';
  const visible=cats.slice(0,2).map(cat=>`<span class="v236-category-filter-chip">${v144CategoryIconHtml(cat)}<span>${escapeHtml(cat.name)}</span></span>`).join('');
  const more=cats.length>2?`<span class="v236-category-filter-more">+${cats.length-2}</span>`:'';
  return `<span class="v236-category-filter-summary-chips">${visible}${more}</span>`;
}

function v237CategoryRowsHtml(surface,rows){
  const selected=new Set(v237SurfaceSelectedCategories(surface).map(String));
  if(!rows.length)return '<div class="v236-category-filter-empty">No categories match your search.</div>';
  return rows.map(cat=>{
    const id=String(cat?.id||'');
    return `<label class="v66-cat-option v236-category-filter-option v237-category-filter-option" data-v237-category-id="${escapeHtml(id)}">
      <input type="checkbox" ${selected.has(id)?'checked':''} onchange="App.v237ToggleCategoryFilter('${surface}','${escapeHtml(id)}',this.checked)">
      <span>${v144CategoryIconHtml(cat)} <span>${escapeHtml(cat?.name||'Unnamed category')}</span></span>
    </label>`;
  }).join('');
}

function v237CategoryPagerHtml(surface,data){
  if(data.all.length<=data.pageSize)return '';
  return `<div class="v236-category-filter-pager v237-category-filter-pager" aria-label="Category Filter pages">
    <button type="button" class="btn btn-sm btn-ghost" onclick="App.v237SetCategoryFilterPage('${surface}',${data.page-1})" ${data.page<=0?'disabled':''}>Previous</button>
    <span>Page <b>${data.page+1}</b> of <b>${data.pageCount}</b></span>
    <button type="button" class="btn btn-sm btn-ghost" onclick="App.v237SetCategoryFilterPage('${surface}',${data.page+1})" ${data.page>=data.pageCount-1?'disabled':''}>Next</button>
  </div>`;
}

function v237CategoryFilterHtml(surface){
  const ui=v237SurfaceCategoryUi(surface);
  const data=v237CategoryPageData(surface);
  const selected=v237SurfaceSelectedCategories(surface);
  const total=v236EffectiveCategoryFilterCategories().length;
  const query=String(ui.query||'');
  return `<details class="v66-cat-filter v236-category-filter v237-category-filter v237-category-filter-${surface}" data-v237-category-filter="${surface}" ${ui.open?'open':''} ontoggle="App.v237CategoryFilterToggle('${surface}',this)">
    <summary class="btn v236-category-filter-summary">${v237CategorySummaryHtml(surface)}<span class="v236-category-filter-chevron" aria-hidden="true">⌄</span></summary>
    <div class="v66-cat-panel v236-category-filter-panel v237-category-filter-panel" onclick="event.stopPropagation()">
      <div class="v236-category-filter-search-wrap">
        <input class="v236-category-filter-search v237-category-filter-search" type="search" placeholder="Search categories…" value="${escapeHtml(query)}" autocomplete="off" spellcheck="false" oninput="App.v237SearchCategoryFilter('${surface}',this.value)">
      </div>
      <div class="v66-cat-head v236-category-filter-head"><b>Categories</b><button type="button" class="btn btn-sm btn-ghost" onclick="event.preventDefault();event.stopPropagation();App.v237ClearCategoryFilter('${surface}')">All</button></div>
      <div class="v236-category-filter-meta"><span>${selected.length?`${selected.length} selected`:'All selected'}</span><span>${query?`${data.all.length} matching`:`${total} available`}</span></div>
      <div class="v236-category-filter-list">${v237CategoryRowsHtml(surface,data.rows)}</div>
      ${v237CategoryPagerHtml(surface,data)}
    </div>
  </details>`;
}

function v237ReplaceCategoryFilter(html,surface){
  const replacement=v237CategoryFilterHtml(surface);
  return String(html||'').replace(/<details class="v66-cat-filter"[\s\S]*?<\/details>/,replacement);
}

function v237CategoryFilterToggle(surface,details){
  v237SurfaceCategoryUi(surface).open=!!details?.open;
}

function v237UpdateCategoryFilterPanel(surface){
  const details=document.querySelector(`[data-v237-category-filter="${surface}"]`);
  if(!details)return;
  const data=v237CategoryPageData(surface);
  const list=details.querySelector('.v236-category-filter-list');
  const pager=details.querySelector('.v236-category-filter-pager');
  const meta=details.querySelector('.v236-category-filter-meta');
  if(list)list.innerHTML=v237CategoryRowsHtml(surface,data.rows);
  const nextPager=v237CategoryPagerHtml(surface,data);
  if(nextPager){
    if(pager)pager.outerHTML=nextPager;
    else list?.insertAdjacentHTML('afterend',nextPager);
  }else pager?.remove();
  if(meta){
    const selected=v237SurfaceSelectedCategories(surface);
    const total=v236EffectiveCategoryFilterCategories().length;
    const query=String(v237SurfaceCategoryUi(surface).query||'');
    meta.innerHTML=`<span>${selected.length?`${selected.length} selected`:'All selected'}</span><span>${query?`${data.all.length} matching`:`${total} available`}</span>`;
  }
}

function v237SearchCategoryFilter(surface,value){
  const ui=v237SurfaceCategoryUi(surface);
  ui.query=String(value||'');ui.page=0;
  v237UpdateCategoryFilterPanel(surface);
}

function v237SetCategoryFilterPage(surface,page){
  const ui=v237SurfaceCategoryUi(surface);
  ui.page=Math.max(0,Math.floor(Number(page)||0));
  v237UpdateCategoryFilterPanel(surface);
}

function v237RefreshSurface(surface){
  if(surface==='order'){
    if(typeof v141RefreshOrderPickerAll==='function')v141RefreshOrderPickerAll();
    else v138RefreshPickerDOM();
    return;
  }
  if(surface==='batch'){
    v175RefreshBatchLibraryUI();
    return;
  }
  if(surface==='logging')renderLogSuggestions();
}

function v237ScheduleSurfaceRefresh(surface){
  if(V237_CATEGORY_REFRESH_FRAMES[surface])return;
  V237_CATEGORY_REFRESH_FRAMES[surface]=requestAnimationFrame(()=>{
    V237_CATEGORY_REFRESH_FRAMES[surface]=0;
    v237RefreshSurface(surface);
  });
}

function v237ToggleCategoryFilter(surface,id,on){
  const selected=new Set(v237SurfaceSelectedCategories(surface).map(String));
  const sid=String(id||'');
  if(on)selected.add(sid);else selected.delete(sid);
  v237SetSurfaceSelectedCategories(surface,[...selected]);
  v237SurfaceCategoryUi(surface).open=true;
  v237ScheduleSurfaceRefresh(surface);
}

function v237ClearCategoryFilter(surface){
  v237SetSurfaceSelectedCategories(surface,[]);
  v237SurfaceCategoryUi(surface).open=true;
  v237ScheduleSurfaceRefresh(surface);
}

/* Replace only the category chooser inside each existing toolbar. All sorting,
   status, priority, result pagination and Personal Order clarity markup stay
   owned by their current v224/v225 implementations. */
const v237OrderToolsBase=v140OrderPickerToolsHtml;
v140OrderPickerToolsHtml=function(data){
  return v237ReplaceCategoryFilter(v237OrderToolsBase.apply(this,arguments),'order');
};

const v237BatchToolsBase=v175BatchLibraryToolsHtml;
v175BatchLibraryToolsHtml=function(){
  return v237ReplaceCategoryFilter(v237BatchToolsBase.apply(this,arguments),'batch');
};

const v237LogToolsBase=v224LogToolsHtml;
v224LogToolsHtml=function(){
  return v237ReplaceCategoryFilter(v237LogToolsBase.apply(this,arguments),'logging');
};

/* Clarify that the single persistent page-size control is shared by all four
   Library-style category-filter surfaces. */
const v237SurfaceEditorBase=v230SurfaceEditor;
v230SurfaceEditor=function(surface){
  let html=v237SurfaceEditorBase.apply(this,arguments);
  if(surface==='categoryFilter'){
    html=html.replace(
      'Pagination appears only when the available category choices exceed this number.',
      'Used by Library, Personal Order, Batch Log and Dashboard logging. Pagination appears only when the available category choices exceed this number.'
    );
  }
  return html;
};

/* Legacy direct action names still land on the new persistent-open controls if
   any older markup calls them during an intermediate render. */
v140OrderToggleCategory=function(id,on){v237ToggleCategoryFilter('order',id,on);};
v140OrderClearCategories=function(event){if(event){event.preventDefault();event.stopPropagation();}v237ClearCategoryFilter('order');};
v175BatchToggleCategory=function(id,on){v237ToggleCategoryFilter('batch',id,on);};
v175BatchClearCategories=function(event){if(event){event.preventDefault();event.stopPropagation();}v237ClearCategoryFilter('batch');};
v224LogToggleCategory=function(id,on){v237ToggleCategoryFilter('logging',id,on);};
v224LogClearCategories=function(event){if(event){event.preventDefault();event.stopPropagation();}v237ClearCategoryFilter('logging');};

Object.assign(App,{
  v237CategoryFilterToggle,
  v237SearchCategoryFilter,
  v237SetCategoryFilterPage,
  v237ToggleCategoryFilter,
  v237ClearCategoryFilter,
  v140OrderToggleCategory,
  v140OrderClearCategories,
  v175BatchToggleCategory,
  v175BatchClearCategories,
  v224LogToggleCategory,
  v224LogClearCategories
});

MediaFlowRuntime.version=V237_RUNTIME_VERSION;
