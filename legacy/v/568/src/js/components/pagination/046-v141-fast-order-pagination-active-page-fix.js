/* ============================================================
   MediaFlow v141 — Fast Order pagination + active-page fix
   ============================================================ */

let V141_ORDER_PICKER_CACHE={key:'',candidates:null};

function v141InvalidateOrderPickerCache(){
  V141_ORDER_PICKER_CACHE={key:'',candidates:null};
}

function v141OrderPickerCacheKey(){
  const ui=v140EnsureOrderPickerUI();
  const plan=v138EnsureOrderPlan();

  // Page and checkbox selection are intentionally excluded: neither changes
  // the filtered/sorted candidate set.
  return JSON.stringify([
    String(ui.search||'').trim().toLowerCase(),
    [...(ui.categories||[])].map(String).sort(),
    String(ui.status||'all'),
    String(ui.priority||'all'),
    String(ui.sort||'relevance'),
    Number(plan.modifiedAt)||0,
    (S.library||[]).length,
    (S.categories||[]).length
  ]);
}

// Capture the real v140 filtering implementation once, then cache its output.
const v141PickerMatchesBase=v138PickerMatches;
v138PickerMatches=function(){
  const key=v141OrderPickerCacheKey();
  if(V141_ORDER_PICKER_CACHE.key===key && Array.isArray(V141_ORDER_PICKER_CACHE.candidates)){
    return V141_ORDER_PICKER_CACHE.candidates;
  }

  const candidates=v141PickerMatchesBase();
  V141_ORDER_PICKER_CACHE={key,candidates};
  return candidates;
};

function v141UpdateOrderPickerSelectionUI(){
  const ui=v140EnsureOrderPickerUI();
  const count=document.getElementById('v138-order-pick-count');
  if(count)count.textContent=`${ui.picks.size} selected`;

  const add=document.getElementById('v138-order-add-selected');
  if(add)add.disabled=ui.picks.size===0;
}

function v141UpdateOrderPickerMatchline(page){
  const line=document.querySelector('#v140-order-picker-tools .v140-order-matchline');
  if(line){
    line.textContent=`${page.candidates.length.toLocaleString()} match${page.candidates.length===1?'':'es'} · Page ${page.ui.page+1}/${page.pages}`;
  }
}

function v141RefreshOrderPickerPageOnly(){
  const page=v140OrderPickerPageData();

  const box=document.getElementById('v138-order-picker-results');
  if(box)box.innerHTML=v138PickerResultsHtml(page);

  const pager=document.getElementById('v140-order-picker-pager');
  if(pager)pager.innerHTML=v140OrderPagerHtml(page);

  v141UpdateOrderPickerMatchline(page);
  v141UpdateOrderPickerSelectionUI();

  const shown=document.getElementById('v140-order-add-shown');
  if(shown)shown.disabled=page.rows.length===0;

  return page;
}

function v141RefreshOrderPickerAll(){
  const page=v140OrderPickerPageData();

  const tools=document.getElementById('v140-order-picker-tools');
  if(tools)tools.innerHTML=v140OrderPickerToolsHtml(page);

  const box=document.getElementById('v138-order-picker-results');
  if(box)box.innerHTML=v138PickerResultsHtml(page);

  const pager=document.getElementById('v140-order-picker-pager');
  if(pager)pager.innerHTML=v140OrderPagerHtml(page);

  v141UpdateOrderPickerSelectionUI();

  const shown=document.getElementById('v140-order-add-shown');
  if(shown)shown.disabled=page.rows.length===0;

  return page;
}

// Override the stale later v138 declaration from v140.
v138RefreshPickerDOM=function(){
  return v141RefreshOrderPickerAll();
};

// Search/filter changes genuinely change the candidate set, so invalidate once.
v138OrderSearch=function(value){
  const ui=v140EnsureOrderPickerUI();
  ui.search=String(value||'');
  ui.page=0;
  v141InvalidateOrderPickerCache();
  v141RefreshOrderPickerAll();
};

v140OrderSetFilter=function(key,value){
  const ui=v140EnsureOrderPickerUI();
  if(!['sort','status','priority'].includes(String(key)))return;
  ui[key]=String(value||'all').toLowerCase();
  ui.page=0;
  v141InvalidateOrderPickerCache();
  v141RefreshOrderPickerAll();
};

v140OrderToggleCategory=function(id,on){
  const ui=v140EnsureOrderPickerUI();
  const set=new Set(ui.categories||[]);
  const sid=String(id||'');
  if(on)set.add(sid);else set.delete(sid);
  ui.categories=[...set];
  ui.page=0;
  v141InvalidateOrderPickerCache();
  v141RefreshOrderPickerAll();
};

v140OrderClearCategories=function(event){
  if(event){event.preventDefault();event.stopPropagation();}
  const ui=v140EnsureOrderPickerUI();
  ui.categories=[];
  ui.page=0;
  v141InvalidateOrderPickerCache();
  v141RefreshOrderPickerAll();
};

v140OrderClearFilters=function(){
  const ui=v140EnsureOrderPickerUI();
  ui.categories=[];
  ui.status='all';
  ui.priority='all';
  ui.sort='relevance';
  ui.page=0;
  v141InvalidateOrderPickerCache();
  v141RefreshOrderPickerAll();
};

// Page navigation is intentionally lightweight:
// no full Library filtering/sorting and no filter-bar reconstruction.
v140OrderSetPage=function(page){
  const ui=v140EnsureOrderPickerUI();
  const next=Math.max(0,Number(page)||0);
  if(next===ui.page)return;

  ui.page=next;
  const current=v141RefreshOrderPickerPageOnly();

  const box=document.getElementById('v138-order-picker-results');
  if(box)box.scrollTop=0;

  return current;
};

// Checking a title does not need to rebuild the page at all.
v138ToggleOrderPick=function(id,checked){
  const ui=v140EnsureOrderPickerUI();
  const sid=String(id);
  if(checked)ui.picks.add(sid);
  else ui.picks.delete(sid);
  v141UpdateOrderPickerSelectionUI();
};

// A full Order render may follow Library edits/imports/deletes.
// Drop the cached candidate list so those changes are reflected immediately.
const v141RenderOrderBase=renderOrder;
renderOrder=function(){
  v141InvalidateOrderPickerCache();
  return v141RenderOrderBase();
};

// Rebind every inline action to the v141 implementations.
Object.assign(App,{
  v138OrderSearch,
  v138ToggleOrderPick,
  v140OrderSetFilter,
  v140OrderToggleCategory,
  v140OrderClearCategories,
  v140OrderClearFilters,
  v140OrderSetPage
});



