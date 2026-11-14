/* ============================================================
   ORDER — Edit buttons + optional ordered-title pagination
   ============================================================ */

const v173NormalizeOrderPlanBase=v138NormalizeOrderPlan;
v138NormalizeOrderPlan=function(plan,library,categories){
  const out=v173NormalizeOrderPlanBase(plan,library,categories);
  const raw=(plan&&typeof plan==='object')?plan:{};

  out.paginateOrderedTitles=
    typeof raw.paginateOrderedTitles==='boolean'
      ?raw.paginateOrderedTitles
      :true;

  return out;
};

function v173OrderUI(){
  v138EnsureOrderPlan();
  const ui=S.orderPlannerUI=S.orderPlannerUI||{};

  ui.v173AllPage=Math.max(0,Math.floor(Number(ui.v173AllPage)||0));

  if(!ui.v173CategoryPages||typeof ui.v173CategoryPages!=='object'){
    ui.v173CategoryPages={};
  }

  return ui;
}

function v173OrderPaginationHtml(page,totalPages,kind,catId=''){
  if(totalPages<=1)return '';

  page=Math.max(0,Math.min(totalPages-1,Number(page)||0));
  const id=String(catId||'').replace(/'/g,"\\'");
  const call=(target)=>kind==='category'
    ?`App.v173SetOrderPage('category',${target},'${id}')`
    :`App.v173SetOrderPage('all',${target})`;

  return `<div class="v173-order-pagination ${kind==='category'?'v173-category-pagination':''}">
    <button type="button" class="btn btn-sm btn-ghost"
      onclick="${call(0)}" ${page===0?'disabled':''}>«</button>
    <button type="button" class="btn btn-sm btn-ghost"
      onclick="${call(page-1)}" ${page===0?'disabled':''}>‹ Prev</button>
    <span class="v173-page-label">Page ${(page+1).toLocaleString()} / ${totalPages.toLocaleString()}</span>
    <button type="button" class="btn btn-sm btn-ghost"
      onclick="${call(page+1)}" ${page>=totalPages-1?'disabled':''}>Next ›</button>
    <button type="button" class="btn btn-sm btn-ghost"
      onclick="${call(totalPages-1)}" ${page>=totalPages-1?'disabled':''}>»</button>
  </div>`;
}

function v173SetOrderPage(kind,page,catId=''){
  const ui=v173OrderUI();
  const target=Math.max(0,Math.floor(Number(page)||0));

  if(kind==='category'){
    ui.v173CategoryPages[String(catId||'')]=target;
  }else{
    ui.v173AllPage=target;
  }

  render();
  requestAnimationFrame(()=>{
    document.querySelector('.v138-order-main')?.scrollIntoView?.({
      behavior:'smooth',
      block:'start'
    });
  });
}

function v173ToggleOrderPagination(){
  const p=v138EnsureOrderPlan();
  p.paginateOrderedTitles=!p.paginateOrderedTitles;

  const ui=v173OrderUI();
  ui.v173AllPage=0;
  ui.v173CategoryPages={};

  v138TouchOrderPlan();
  render();

  showToast(
    p.paginateOrderedTitles
      ?`Ordered-title pagination enabled · ${v175OrderPageSize()} per page`
      :'Ordered-title pagination disabled'
  );
}

// FINAL Order row wrapper: ordered titles can now be edited directly from Order.
const v173OrderRowHtmlBase=v138OrderRowHtml;
v138OrderRowHtml=function(item,position,scopeCatId=''){
  let h=v173OrderRowHtmlBase(item,position,scopeCatId);
  const id=String(item?.id||'').replace(/'/g,"\\'");

  const removeNeedle=`<button class="btn btn-sm btn-ghost" type="button" onclick="App.v138RemoveOrderTitle('${id}')" title="Remove from Order only">Remove</button>`;

  const edit=`<button class="btn btn-sm btn-ghost" type="button"
    onclick="event.stopPropagation();App.openLibraryModal('${id}')"
    title="Edit this Library title">Edit</button>`;

  if(h.includes(removeNeedle)){
    h=h.replace(removeNeedle,edit+removeNeedle);
  }

  return h;
};

// FINAL All Titles renderer with optional pagination.
v138AllTitlesHtml=function(){
  const p=v138EnsureOrderPlan();
  const st=v156EnsureOrderStructure();
  const items=st.orderedItems||[];

  if(!items.length){
    return `<div class="v138-order-empty"><b>Your Order is empty</b>Add Library titles from the picker, then arrange them in the exact sequence you want.</div>`;
  }

  if(!p.paginateOrderedTitles){
    return `<div class="v138-order-list">${
      items.map((item,i)=>v138OrderRowHtml(item,i+1,'')).join('')
    }</div>`;
  }

  const ui=v173OrderUI();
  const totalPages=Math.max(1,Math.ceil(items.length/v175OrderPageSize()));
  const page=Math.max(0,Math.min(totalPages-1,ui.v173AllPage||0));
  ui.v173AllPage=page;

  const start=page*v175OrderPageSize();
  const rows=items
    .slice(start,start+v175OrderPageSize())
    .map((item,i)=>v138OrderRowHtml(item,start+i+1,''))
    .join('');

  return `<div class="v138-order-list">${rows}</div>
    ${v173OrderPaginationHtml(page,totalPages,'all')}`;
};

// FINAL By Category renderer with independent page state per category.
v138ByCategoryHtml=function(){
  const p=v138EnsureOrderPlan();
  const st=v156EnsureOrderStructure();
  const ui=v173OrderUI();
  const hidden=new Set(p.hiddenCategories.map(String));
  const order=v138CategoryDisplayOrder();
  const blocks=[];

  for(const catId of order){
    const cid=String(catId);
    if(hidden.has(cid))continue;

    const cat=v138OrderCategory(cid);
    if(!cat)continue;

    const ids=st.byCategory.get(cid)||[];
    if(!ids.length)continue;

    let page=0,totalPages=1,start=0,visibleIds=ids;

    if(p.paginateOrderedTitles){
      totalPages=Math.max(1,Math.ceil(ids.length/v175OrderPageSize()));
      page=Math.max(
        0,
        Math.min(
          totalPages-1,
          Math.floor(Number(ui.v173CategoryPages[cid])||0)
        )
      );
      ui.v173CategoryPages[cid]=page;
      start=page*v175OrderPageSize();
      visibleIds=ids.slice(start,start+v175OrderPageSize());
    }

    const rows=visibleIds.map((id,i)=>{
      const item=v138OrderItem(id);
      return item?v138OrderRowHtml(item,start+i+1,cid):'';
    }).join('');

    blocks.push(`<div class="card v138-category-card">
      <div class="v138-category-head">
        <div class="v138-category-head-copy">
          <b>${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</b>
          <small>Relative title order is shared with All Titles.${p.paginateOrderedTitles?` Showing up to ${v175OrderPageSize()} titles per page.`:''}</small>
        </div>
        <span class="v138-category-count">${ids.length}</span>
      </div>
      <div class="v138-order-list">${rows}</div>
      ${p.paginateOrderedTitles?v173OrderPaginationHtml(page,totalPages,'category',cid):''}
    </div>`);
  }

  if(!blocks.length){
    return `<div class="v138-order-empty"><b>No visible category groups</b>Add titles to Order or show a hidden category from Category display.</div>`;
  }

  return blocks.join('');
};

// Add one global pagination toggle to the Order toolbar. It controls both views.
const v173RenderOrderBase=renderOrder;
renderOrder=function(){
  let h=v173RenderOrderBase();
  const p=v138EnsureOrderPlan();

  const toggle=`<label class="v173-order-pagination-toggle">
    <span>Paginate ordered titles</span>
    <button type="button"
      class="toggle ${p.paginateOrderedTitles?'on':''}"
      onclick="event.preventDefault();App.v173ToggleOrderPagination()"
      aria-label="Toggle ordered-title pagination"></button>
    <span>${p.paginateOrderedTitles?`${v175OrderPageSize()}/page`:'Off'}</span>
  </label>`;

  h=h.replace(
    /(<div class="v138-order-switch">[\s\S]*?<\/div>)(\s*<div class="v138-order-summary">)/,
    `$1${toggle}$2`
  );

  return h;
};

// Dedicated Order export/import keeps the pagination preference too.
const v173OrderExportPayloadBase=v142OrderExportPayload;
v142OrderExportPayload=function(){
  const payload=v173OrderExportPayloadBase();
  const p=v138EnsureOrderPlan();

  payload.formatVersion=Math.max(Number(payload.formatVersion)||1,2);
  payload.mediaFlowVersion=173;
  payload.orderPlan=payload.orderPlan||{};
  payload.orderPlan.paginateOrderedTitles=!!p.paginateOrderedTitles;

  return payload;
};

const v173ImportOrderBase=v142ImportOrder;
v142ImportOrder=async function(file){
  let importedPagination=null;

  try{
    if(file){
      const data=JSON.parse(await file.text());
      const raw=data?.orderPlan&&typeof data.orderPlan==='object'
        ?data.orderPlan
        :data;

      if(typeof raw?.paginateOrderedTitles==='boolean'){
        importedPagination=raw.paginateOrderedTitles;
      }
    }
  }catch(_){}

  await v173ImportOrderBase(file);

  if(importedPagination!==null){
    const p=v138EnsureOrderPlan();
    p.paginateOrderedTitles=importedPagination;
    v138TouchOrderPlan();
    render();
  }
};

Object.assign(App,{
  v173SetOrderPage,
  v173ToggleOrderPagination,
  v142ImportOrder
});

