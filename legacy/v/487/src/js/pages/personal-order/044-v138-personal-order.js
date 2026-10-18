/* ============================================================
   MediaFlow v138 — Personal Order
   ------------------------------------------------------------
   A lightweight planning/notepad layer over Library titles:
   - one canonical title sequence;
   - All Titles and By Category views share that same sequence;
   - custom or Settings-based category order;
   - category visibility controls;
   - cloud/full-backup persistence;
   - no effect on scheduler, History, progress, stats or XP.
   ============================================================ */

function v138OrderDefaults(){
  return {
    titleIds:[],
    viewMode:'all',
    categoryMode:'default',
    categoryOrder:[],
    hiddenCategories:[],
    modifiedAt:0,
    lastClearedOrder:null
  };
}

function v138NormalizeOrderPlan(plan,library,categories){
  const base=v138OrderDefaults();
  const raw=(plan&&typeof plan==='object'&&!Array.isArray(plan))?plan:{};
  const lib=Array.isArray(library)?library:(Array.isArray(S?.library)?S.library:[]);
  const cats=Array.isArray(categories)?categories:(Array.isArray(S?.categories)?S.categories:[]);
  const libIds=new Set(lib.filter(i=>i?.id).map(i=>String(i.id)));
  const catIds=new Set(cats.filter(c=>c?.id).map(c=>String(c.id)));

  const unique=(arr,allowed)=>{
    const out=[],seen=new Set();
    for(const x of (Array.isArray(arr)?arr:[])){
      const id=String(x||'');
      if(!id||seen.has(id)||(allowed&&!allowed.has(id)))continue;
      seen.add(id);out.push(id);
    }
    return out;
  };

  let customCats=unique(raw.categoryOrder,catIds);
  for(const c of cats){
    const id=String(c?.id||'');
    if(id&&!customCats.includes(id))customCats.push(id);
  }

  return {
    titleIds:unique(raw.titleIds,libIds),
    viewMode:raw.viewMode==='category'?'category':'all',
    categoryMode:raw.categoryMode==='custom'?'custom':'default',
    categoryOrder:customCats,
    hiddenCategories:unique(raw.hiddenCategories,catIds),
    modifiedAt:Math.max(0,Number(raw.modifiedAt)||0)
  };
}

function v138EnsureOrderPlan(){
  S.orderPlan=v138NormalizeOrderPlan(S.orderPlan,S.library,S.categories);
  S.orderPlannerUI=S.orderPlannerUI||{
    search:'',
    picks:new Set(),
    dragTitleId:'',
    dragCategoryId:'',
    dragCategoryFrom:'',
    page:0,
    pageSize:20,
    categories:[],
    status:'all',
    priority:'all',
    sort:'relevance'
  };
  if(!(S.orderPlannerUI.picks instanceof Set))S.orderPlannerUI.picks=new Set();
  return S.orderPlan;
}

function v138TouchOrderPlan(){
  const p=v138EnsureOrderPlan();
  p.modifiedAt=Date.now();
  saveState();
}

function v138OrderItem(id){
  return (S.library||[]).find(i=>String(i?.id||'')===String(id))||null;
}

function v138OrderCategory(id){
  return (S.categories||[]).find(c=>String(c?.id||'')===String(id))||null;
}

function v138OrderedItems(){
  const p=v138EnsureOrderPlan();
  return p.titleIds.map(v138OrderItem).filter(Boolean);
}

function v138CategoryDisplayOrder(){
  const p=v138EnsureOrderPlan();
  if(p.categoryMode==='custom'){
    const valid=new Set((S.categories||[]).map(c=>String(c.id)));
    const ids=p.categoryOrder.filter(id=>valid.has(String(id)));
    for(const c of (S.categories||[])){
      if(!ids.includes(String(c.id)))ids.push(String(c.id));
    }
    return ids;
  }
  // S.categories is already kept in the Settings/default MediaFlow order.
  return (S.categories||[]).map(c=>String(c.id));
}

function v138ProgressText(item){
  const progress=Math.max(0,Number(item?.progress)||0);
  const total=Number(item?.total);
  if(Number.isFinite(total)&&total>0)return `${progress}/${total}`;
  return progress>0?`${progress} logged`:'progress unknown';
}

function v138OrderCover(item,cat){
  const title=cleanTitle(item?.title||'');
  if(item?.coverUrl){
    return `<img class="v138-order-cover" src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(title)} cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="v138-order-cover-ph" style="display:none">${v144CategoryIconHtml(cat)}</div>`;
  }
  return `<div class="v138-order-cover-ph">${v144CategoryIconHtml(cat)}</div>`;
}

function v138OrderRowHtml(item,position,scopeCatId=''){
  const cat=v138OrderCategory(item.categoryId);
  const globalIndex=v138EnsureOrderPlan().titleIds.indexOf(String(item.id));
  const canUp=scopeCatId
    ? v138CategoryTitleIds(scopeCatId).indexOf(String(item.id))>0
    : globalIndex>0;
  const scoped=scopeCatId?v138CategoryTitleIds(scopeCatId):v138EnsureOrderPlan().titleIds;
  const scopedIndex=scoped.indexOf(String(item.id));
  const canDown=scopedIndex>=0&&scopedIndex<scoped.length-1;
  const status=v199StatusLabel(item.status);
  const moveFn=scopeCatId?'v138MoveTitleInCategory':'v138MoveTitle';
  const moveArgs=scopeCatId?`'${String(item.id)}','${String(scopeCatId)}'`:`'${String(item.id)}'`;
  const dragCat=scopeCatId?String(scopeCatId):'';

  return `<div class="v138-order-row" draggable="true"
      ondragstart="App.v138OrderDragStart(event,'${String(item.id)}','${dragCat}')"
      ondragend="App.v138OrderDragEnd(event)"
      ondragover="App.v138OrderDragOver(event)"
      ondrop="App.v138OrderDrop(event,'${String(item.id)}','${dragCat}')">
    <div class="v138-order-pos" title="Order position">${position}</div>
    <div>${v138OrderCover(item,cat)}</div>
    <div class="v138-order-copy">
      <span class="v138-order-title">${escapeHtml(cleanTitle(item.title))}</span>
      <div class="v138-order-meta">
        <span>${v144CategoryIconHtml(cat)} ${escapeHtml(cat?.name||'Unknown')}</span>
        <span>·</span>
        <span>${escapeHtml(v199StatusLabel(status))}</span>
        <span>·</span>
        <span>${escapeHtml(v138ProgressText(item))}</span>
      </div>
    </div>
    <div class="v138-order-actions">
      <span class="v138-drag-handle" title="Drag to reorder">☰</span>
      <button class="btn btn-sm btn-ghost" type="button" ${canUp?'':'disabled'} onclick="App.${moveFn}(${moveArgs},-1)" title="Move up">↑</button>
      <button class="btn btn-sm btn-ghost" type="button" ${canDown?'':'disabled'} onclick="App.${moveFn}(${moveArgs},1)" title="Move down">↓</button>
      <button class="btn btn-sm btn-ghost" type="button" onclick="App.v138RemoveOrderTitle('${String(item.id)}')" title="Remove from Order only">Remove</button>
    </div>
  </div>`;
}

function v138CategoryTitleIds(catId){
  const p=v138EnsureOrderPlan();
  return p.titleIds.filter(id=>String(v138OrderItem(id)?.categoryId||'')===String(catId));
}

function v138AllTitlesHtml(){
  const items=v138OrderedItems();
  if(!items.length){
    return `<div class="v138-order-empty"><b>Your Order is empty</b>Add Library titles from the picker, then arrange them in the exact sequence you want.</div>`;
  }
  return `<div class="v138-order-list">${items.map((item,i)=>v138OrderRowHtml(item,i+1,'')).join('')}</div>`;
}

function v138ByCategoryHtml(){
  const p=v138EnsureOrderPlan();
  const hidden=new Set(p.hiddenCategories.map(String));
  const order=v138CategoryDisplayOrder();
  const blocks=[];

  for(const catId of order){
    if(hidden.has(String(catId)))continue;
    const cat=v138OrderCategory(catId);
    if(!cat)continue;
    const ids=v138CategoryTitleIds(catId);
    if(!ids.length)continue;

    const rows=ids.map((id,i)=>{
      const item=v138OrderItem(id);
      return item?v138OrderRowHtml(item,i+1,catId):'';
    }).join('');

    blocks.push(`<div class="card v138-category-card">
      <div class="v138-category-head">
        <div class="v138-category-head-copy">
          <b>${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</b>
          <small>Relative title order is shared with All Titles.</small>
        </div>
        <span class="v138-category-count">${ids.length}</span>
      </div>
      <div class="v138-order-list">${rows}</div>
    </div>`);
  }

  if(!blocks.length){
    return `<div class="v138-order-empty"><b>No visible category groups</b>Add titles to Order or show a hidden category from Category display.</div>`;
  }
  return blocks.join('');
}

function v138CategoryManagerHtml(){
  const p=v138EnsureOrderPlan();
  const hidden=new Set(p.hiddenCategories.map(String));
  const custom=p.categoryMode==='custom';
  const order=v138CategoryDisplayOrder();

  const rows=order.map((id,index)=>{
    const c=v138OrderCategory(id);
    if(!c)return '';
    const count=v138CategoryTitleIds(id).length;
    const isHidden=hidden.has(String(id));
    return `<div class="v138-category-control ${isHidden?'hidden-cat':''}" ${custom?'draggable="true"':''}
      ${custom?`ondragstart="App.v138CategoryDragStart(event,'${String(id)}')" ondragend="App.v138CategoryDragEnd(event)" ondragover="App.v138OrderDragOver(event)" ondrop="App.v138CategoryDrop(event,'${String(id)}')"`:''}>
      <span class="v138-drag-handle">${custom?'☰':'•'}</span>
      <span class="v138-category-control-name">${v144CategoryIconHtml(c)} ${escapeHtml(c.name)} <small style="color:var(--text-mute)">(${count})</small></span>
      <div class="v138-order-actions">
        <button class="btn btn-sm btn-ghost v138-eye-btn" type="button" onclick="App.v138ToggleOrderCategory('${String(id)}')" title="${isHidden?'Show category':'Hide category'}">${isHidden?'Show':'Hide'}</button>
        ${custom?`<button class="btn btn-sm btn-ghost" type="button" ${index===0?'disabled':''} onclick="App.v138MoveCategory('${String(id)}',-1)">↑</button><button class="btn btn-sm btn-ghost" type="button" ${index===order.length-1?'disabled':''} onclick="App.v138MoveCategory('${String(id)}',1)">↓</button>`:''}
      </div>
    </div>`;
  }).join('');

  return `<div class="card">
    <div class="section-label">CATEGORY DISPLAY</div>
    <div class="hint">Category order only changes the grouped view. Hidden categories stay in your saved Order and remain visible in All Titles.</div>
    <div class="v138-cat-mode-row">
      <button type="button" class="btn btn-sm ${!custom?'btn-primary':''}" onclick="App.v138SetCategoryMode('default')">Use Settings order</button>
      <button type="button" class="btn btn-sm ${custom?'btn-primary':''}" onclick="App.v138SetCategoryMode('custom')">Custom order</button>
    </div>
    <div class="v138-category-manager">${rows}</div>
  </div>`;
}

function v140EnsureOrderPickerUI(){
  v138EnsureOrderPlan();
  const ui=S.orderPlannerUI=S.orderPlannerUI||{};
  ui.search=String(ui.search||'');
  if(!(ui.picks instanceof Set))ui.picks=new Set(Array.isArray(ui.picks)?ui.picks.map(String):[]);
  ui.page=Math.max(0,Number(ui.page)||0);
  ui.pageSize=v175PageSize('orderLibrary');
  ui.categories=Array.isArray(ui.categories)?[...new Set(ui.categories.map(String).filter(Boolean))]:[];
  ui.status=['all','planned','active','paused','completed','dropped'].includes(String(ui.status||'all').toLowerCase())
    ? String(ui.status||'all').toLowerCase():'all';
  ui.priority=['all','high','medium','low'].includes(String(ui.priority||'all').toLowerCase())
    ? String(ui.priority||'all').toLowerCase():'all';
  const sorts=new Set(['relevance','priority-desc','priority-asc','title-asc','title-desc','rating-desc','rating-asc','progress-desc','progress-asc','total-desc','total-asc']);
  ui.sort=sorts.has(String(ui.sort||'relevance'))?String(ui.sort):'relevance';

  const validCats=new Set((S.categories||[]).map(c=>String(c?.id||'')).filter(Boolean));
  ui.categories=ui.categories.filter(id=>validCats.has(id));
  return ui;
}

function v138PickerMatches(){
  const p=v138EnsureOrderPlan();
  const ui=v140EnsureOrderPickerUI();
  const existing=new Set(p.titleIds.map(String));
  const q=String(ui.search||'').trim().toLowerCase();

  let rows=(S.library||[]).filter(i=>i?.id&&!existing.has(String(i.id)));

  // Search remains useful with no query: filters can browse the full Library.
  if(q){
    rows=rows.filter(i=>{
      const cat=v138OrderCategory(i.categoryId);
      return [
        cleanTitle(i.title),
        cat?.name||'',
        i.status||'',
        i.priority||''
      ].join(' ').toLowerCase().includes(q);
    });
  }

  if(ui.categories.length){
    rows=rows.filter(i=>ui.categories.includes(String(i.categoryId||'')));
  }
  if(ui.status!=='all'){
    rows=rows.filter(i=>String(i.status||'planned').toLowerCase()===ui.status);
  }
  if(ui.priority!=='all'){
    rows=rows.filter(i=>String(i.priority||'medium').toLowerCase()===ui.priority);
  }

  const rank={low:0,medium:1,high:2};
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const cmpTitle=(a,b)=>cleanTitle(a.title).localeCompare(cleanTitle(b.title),undefined,{numeric:true,sensitivity:'base'});

  rows=rows.slice().sort((a,b)=>{
    let d=0;

    if(ui.sort==='title-asc')return cmpTitle(a,b);
    if(ui.sort==='title-desc')return cmpTitle(b,a);
    if(ui.sort==='priority-desc')d=(rank[String(b.priority||'medium').toLowerCase()]??1)-(rank[String(a.priority||'medium').toLowerCase()]??1);
    else if(ui.sort==='priority-asc')d=(rank[String(a.priority||'medium').toLowerCase()]??1)-(rank[String(b.priority||'medium').toLowerCase()]??1);
    else if(ui.sort==='rating-desc')d=num(b.rating)-num(a.rating);
    else if(ui.sort==='rating-asc')d=num(a.rating)-num(b.rating);
    else if(ui.sort==='progress-desc')d=num(b.progress)-num(a.progress);
    else if(ui.sort==='progress-asc')d=num(a.progress)-num(b.progress);
    else if(ui.sort==='total-desc')d=num(b.total)-num(a.total);
    else if(ui.sort==='total-asc')d=num(a.total)-num(b.total);
    else if(q){
      // Same Best match behavior used by the logging title picker:
      // exact title -> title prefix -> contains/other searchable metadata.
      const at=cleanTitle(a.title).toLowerCase();
      const bt=cleanTitle(b.title).toLowerCase();
      const ar=at===q?0:at.startsWith(q)?1:at.includes(q)?2:3;
      const br=bt===q?0:bt.startsWith(q)?1:bt.includes(q)?2:3;
      const ai=at.includes(q)?at.indexOf(q):Number.MAX_SAFE_INTEGER;
      const bi=bt.includes(q)?bt.indexOf(q):Number.MAX_SAFE_INTEGER;
      d=ar-br || ai-bi;
    }

    return d||cmpTitle(a,b);
  });

  return rows;
}

function v140OrderPickerPageData(){
  const ui=v140EnsureOrderPickerUI();
  const candidates=v138PickerMatches();
  const pages=Math.max(1,Math.ceil(candidates.length/ui.pageSize));
  ui.page=Math.max(0,Math.min(ui.page,pages-1));
  const start=ui.page*ui.pageSize;
  const rows=candidates.slice(start,start+ui.pageSize);
  return {ui,candidates,pages,rows,start};
}

function v140OrderPickerToolsHtml(data){
  const {ui,candidates,pages}=data||v140OrderPickerPageData();
  const cats=(S.categories||[]).filter(c=>c?.id);
  const catLabel=ui.categories.length?`${ui.categories.length} categories selected`:'All categories';

  return `<div class="v140-order-filterbar">
    <details class="v66-cat-filter">
      <summary class="btn">${escapeHtml(catLabel)} ▾</summary>
      <div class="v66-cat-panel">
        <div class="v66-cat-head">
          <b>Show categories</b>
          <button type="button" class="btn btn-sm btn-ghost" onclick="App.v140OrderClearCategories(event)">All</button>
        </div>
        ${cats.map(c=>`<label class="v66-cat-option">
          <input type="checkbox" ${ui.categories.includes(String(c.id))?'checked':''} onchange="App.v140OrderToggleCategory('${escapeHtml(String(c.id))}',this.checked)">
          <span>${v144CategoryIconHtml(c)} ${escapeHtml(c.name)}</span>
        </label>`).join('')}
      </div>
    </details>

    <select aria-label="Order Library display order" onchange="App.v140OrderSetFilter('sort',this.value)">
      <option value="relevance" ${ui.sort==='relevance'?'selected':''}>Best match</option>
      <option value="priority-desc" ${ui.sort==='priority-desc'?'selected':''}>Priority: High → Low</option>
      <option value="priority-asc" ${ui.sort==='priority-asc'?'selected':''}>Priority: Low → High</option>
      <option value="title-asc" ${ui.sort==='title-asc'?'selected':''}>Title: A → Z</option>
      <option value="title-desc" ${ui.sort==='title-desc'?'selected':''}>Title: Z → A</option>
      <option value="rating-desc" ${ui.sort==='rating-desc'?'selected':''}>Rating: High → Low</option>
      <option value="rating-asc" ${ui.sort==='rating-asc'?'selected':''}>Rating: Low → High</option>
      <option value="progress-desc" ${ui.sort==='progress-desc'?'selected':''}>Progress: Most → Least</option>
      <option value="progress-asc" ${ui.sort==='progress-asc'?'selected':''}>Progress: Least → Most</option>
      <option value="total-desc" ${ui.sort==='total-desc'?'selected':''}>Total: Most → Least</option>
      <option value="total-asc" ${ui.sort==='total-asc'?'selected':''}>Total: Least → Most</option>
    </select>

    <select aria-label="Order Library title status" onchange="App.v140OrderSetFilter('status',this.value)">
      <option value="all" ${ui.status==='all'?'selected':''}>All statuses</option>
      ${['planned','active','paused','completed','dropped'].map(x=>`<option value="${x}" ${ui.status===x?'selected':''}>${v199StatusLabel(x)}</option>`).join('')}
    </select>

    <select aria-label="Order Library title priority" onchange="App.v140OrderSetFilter('priority',this.value)">
      <option value="all" ${ui.priority==='all'?'selected':''}>All priorities</option>
      ${['high','medium','low'].map(x=>`<option value="${x}" ${ui.priority===x?'selected':''}>${x[0].toUpperCase()+x.slice(1)}</option>`).join('')}
    </select>

    <button type="button" class="btn btn-sm btn-ghost v140-order-clear" onclick="App.v140OrderClearFilters()">Clear filters</button><div class="v140-order-matchline">${candidates.length.toLocaleString()} match${candidates.length===1?'':'es'} · Page ${ui.page+1}/${pages}</div>
  </div>`;
}

function v138PickerResultsHtml(data){
  const page=data||v140OrderPickerPageData();
  const rows=page.rows;
  const picks=page.ui.picks;

  if(!rows.length){
    return `<div class="hint" style="padding:12px 2px">No Library titles match the current search and filters.</div>`;
  }

  return rows.map(item=>{
    const c=v138OrderCategory(item.categoryId);
    const id=String(item.id);
    return `<label class="v138-picker-row">
      <input type="checkbox" ${picks.has(id)?'checked':''} onchange="App.v138ToggleOrderPick('${id}',this.checked)">
      <span class="v138-picker-copy">
        <b>${escapeHtml(cleanTitle(item.title))}</b>
        <small>${v144CategoryIconHtml(c)} ${escapeHtml(c?.name||'Unknown')} · ${escapeHtml(v199StatusLabel(item.status))} · ${escapeHtml(v138ProgressText(item))}</small>
      </span>
    </label>`;
  }).join('');
}

function v140OrderPagerHtml(data){
  const page=data||v140OrderPickerPageData();
  const {ui,pages}=page;
  if(pages<=1)return '';

  const count=Math.min(5,pages);
  let from=Math.max(0,ui.page-2);
  if(from+count>pages)from=Math.max(0,pages-count);
  const nums=[];
  for(let n=from;n<Math.min(pages,from+count);n++){
    nums.push(`<button type="button" class="btn btn-sm ${n===ui.page?'btn-primary':''}" ${n===ui.page?'aria-current="page"':''} onclick="App.v140OrderSetPage(${n})">${n+1}</button>`);
  }

  return `<div class="v140-order-pager">
    <button type="button" class="btn btn-sm btn-ghost" ${ui.page===0?'disabled':''} onclick="App.v140OrderSetPage(${ui.page-1})">← Prev</button>
    ${nums.join('')}
    <button type="button" class="btn btn-sm btn-ghost" ${ui.page===pages-1?'disabled':''} onclick="App.v140OrderSetPage(${ui.page+1})">Next →</button>
  </div>`;
}

function v138PickerHtml(){
  const page=v140OrderPickerPageData();
  const picks=page.ui.picks;
  return `<div class="card">
    <div class="section-label">ADD TITLES</div>
    <input class="v138-picker-search" type="text" value="${escapeHtml(page.ui.search||'')}" placeholder="Search your Library…" oninput="App.v138OrderSearch(this.value)">
    <div id="v140-order-picker-tools">${v140OrderPickerToolsHtml(page)}</div>
    <div id="v138-order-picker-results" class="v138-picker-results">${v138PickerResultsHtml(page)}</div>
    <div id="v140-order-picker-pager">${v140OrderPagerHtml(page)}</div>
    <div class="v138-picker-actions">
      <span id="v138-order-pick-count" class="hint">${picks.size} selected</span>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button id="v138-order-add-selected" class="btn btn-sm btn-primary" type="button" ${picks.size?'':'disabled'} onclick="App.v138AddSelectedOrderTitles()">Add selected</button>
        <button id="v140-order-add-shown" class="btn btn-sm btn-ghost" type="button" ${page.rows.length?'':'disabled'} onclick="App.v138AddVisibleOrderTitles()">Add shown</button>
      </div>
    </div>
  </div>`;
}

function v138RefreshPickerDOM(){
  const page=v140OrderPickerPageData();

  const tools=document.getElementById('v140-order-picker-tools');
  if(tools)tools.innerHTML=v140OrderPickerToolsHtml(page);

  const box=document.getElementById('v138-order-picker-results');
  if(box)box.innerHTML=v138PickerResultsHtml(page);

  const pager=document.getElementById('v140-order-picker-pager');
  if(pager)pager.innerHTML=v140OrderPagerHtml(page);

  const picks=page.ui.picks;
  const count=document.getElementById('v138-order-pick-count');
  if(count)count.textContent=`${picks.size} selected`;

  const add=document.getElementById('v138-order-add-selected');
  if(add)add.disabled=picks.size===0;

  const shown=document.getElementById('v140-order-add-shown');
  if(shown)shown.disabled=page.rows.length===0;
}

function v138OrderSearch(value){
  const ui=v140EnsureOrderPickerUI();
  ui.search=String(value||'');
  ui.page=0;
  v138RefreshPickerDOM();
}

function v140OrderSetFilter(key,value){
  const ui=v140EnsureOrderPickerUI();
  if(!['sort','status','priority'].includes(String(key)))return;
  ui[key]=String(value||'all').toLowerCase();
  ui.page=0;
  v138RefreshPickerDOM();
}

function v140OrderToggleCategory(id,on){
  const ui=v140EnsureOrderPickerUI();
  const set=new Set(ui.categories||[]);
  const sid=String(id||'');
  if(on)set.add(sid);else set.delete(sid);
  ui.categories=[...set];
  ui.page=0;
  v138RefreshPickerDOM();
}

function v140OrderClearCategories(event){
  if(event){event.preventDefault();event.stopPropagation();}
  const ui=v140EnsureOrderPickerUI();
  ui.categories=[];
  ui.page=0;
  v138RefreshPickerDOM();
}

function v140OrderClearFilters(){
  const ui=v140EnsureOrderPickerUI();
  ui.categories=[];
  ui.status='all';
  ui.priority='all';
  ui.sort='relevance';
  ui.page=0;
  v138RefreshPickerDOM();
}

function v140OrderSetPage(page){
  const ui=v140EnsureOrderPickerUI();
  ui.page=Math.max(0,Number(page)||0);
  v138RefreshPickerDOM();
  document.getElementById('v138-order-picker-results')?.scrollTo?.({top:0,behavior:'smooth'});
}


function renderOrder(){
  const p=v138EnsureOrderPlan();
  const items=v138OrderedItems();
  const hiddenCount=p.hiddenCategories.length;
  const custom=p.categoryMode==='custom';

  return `<div class="v138-order-view">
    <div class="view-head">
      <div>
        <h1>Order</h1>
        <p>Arrange what you want to consume next without changing MediaFlow recommendations.</p>
      </div>
      ${items.length?`<button class="btn btn-ghost" type="button" onclick="App.v138ClearOrder()">Clear Order</button>`:''}
    </div>

    <div class="v138-order-note">
      <span>📝</span>
      <div><strong>Personal planning only.</strong> Order does not affect scheduler scoring, History, progress, Statistics or XP. It is simply your saved “this first, then this” list.</div>
    </div>

    <div class="v138-order-toolbar">
      <div class="v138-order-switch">
        <button type="button" class="btn btn-sm ${p.viewMode==='all'?'btn-primary':''}" onclick="App.v138SetOrderView('all')">All Titles</button>
        <button type="button" class="btn btn-sm ${p.viewMode==='category'?'btn-primary':''}" onclick="App.v138SetOrderView('category')">By Category</button>
      </div>
      <div class="v138-order-summary">
        <b>${items.length}</b> ordered title${items.length===1?'':'s'}
        ${p.viewMode==='category'?`· ${custom?'Custom category order':'Settings category order'}${hiddenCount?` · ${hiddenCount} hidden categor${hiddenCount===1?'y':'ies'}`:''}`:''}
      </div>
    </div>

    <div class="v138-order-grid">
      <div class="v138-order-main">
        ${p.viewMode==='category'?v138ByCategoryHtml():v138AllTitlesHtml()}
      </div>
      <div class="v138-order-side">
        ${v138PickerHtml()}
        ${p.viewMode==='category'?`<div style="height:14px"></div>${v138CategoryManagerHtml()}`:''}
      </div>
    </div>
  </div>`;
}

function v138RefreshPickerDOM(){
  const box=document.getElementById('v138-order-picker-results');
  if(box)box.innerHTML=v138PickerResultsHtml();
  const count=document.getElementById('v138-order-pick-count');
  const picks=S.orderPlannerUI?.picks instanceof Set?S.orderPlannerUI.picks:new Set();
  if(count)count.textContent=`${picks.size} selected`;
  const add=document.getElementById('v138-order-add-selected');
  if(add)add.disabled=picks.size===0;
}

function v138OrderSearch(value){
  v138EnsureOrderPlan();
  S.orderPlannerUI.search=String(value||'');
  v138RefreshPickerDOM();
}

function v138ToggleOrderPick(id,checked){
  v138EnsureOrderPlan();
  const sid=String(id);
  if(checked)S.orderPlannerUI.picks.add(sid);
  else S.orderPlannerUI.picks.delete(sid);
  v138RefreshPickerDOM();
}

function v138AddSelectedOrderTitles(){
  const p=v138EnsureOrderPlan();
  const picks=S.orderPlannerUI.picks;
  if(!(picks instanceof Set)||!picks.size)return;

  const existing=new Set(p.titleIds.map(String));
  const selected=new Set([...picks].map(String));
  for(const item of (S.library||[])){
    const id=String(item?.id||'');
    if(id&&selected.has(id)&&!existing.has(id)){
      p.titleIds.push(id);
      existing.add(id);
    }
  }

  S.orderPlannerUI.picks.clear();
  S.orderPlannerUI.search='';
  S.orderPlannerUI.page=0;
  v138TouchOrderPlan();
  render();
  showToast('Titles added to Order ✓');
}

function v138AddVisibleOrderTitles(){
  const p=v138EnsureOrderPlan();
  const page=v140OrderPickerPageData();
  const existing=new Set(p.titleIds.map(String));
  let added=0;

  // v140: "Add shown" means the titles on the current visible page,
  // not every match across hundreds/thousands of filtered results.
  for(const item of page.rows){
    const id=String(item?.id||'');
    if(id&&!existing.has(id)){
      p.titleIds.push(id);
      existing.add(id);
      added++;
    }
  }

  if(!added){showToast('No new titles on this page to add.');return;}
  S.orderPlannerUI.picks.clear();
  v138TouchOrderPlan();
  render();
  showToast(`${added} shown title${added===1?'':'s'} added to Order ✓`);
}

function v138RemoveOrderTitle(id){
  const p=v138EnsureOrderPlan();
  const sid=String(id);
  const before=p.titleIds.length;
  p.titleIds=p.titleIds.filter(x=>String(x)!==sid);
  if(p.titleIds.length===before)return;
  S.orderPlannerUI?.picks?.delete?.(sid);
  v138TouchOrderPlan();
  render();
}

function v138ClearOrder(){
  if(!confirm('Clear every title from your Order? This does not delete anything from Library.'))return;
  const p=v138EnsureOrderPlan();
  p.titleIds=[];
  S.orderPlannerUI?.picks?.clear?.();
  v138TouchOrderPlan();
  render();
  showToast('Order cleared');
}

function v138SetOrderView(mode){
  const p=v138EnsureOrderPlan();
  const next=mode==='category'?'category':'all';
  if(p.viewMode===next)return;
  p.viewMode=next;
  v138TouchOrderPlan();
  render();
}

function v138MoveTitle(id,direction){
  const p=v138EnsureOrderPlan();
  const sid=String(id);
  const idx=p.titleIds.indexOf(sid);
  const next=idx+Number(direction||0);
  if(idx<0||next<0||next>=p.titleIds.length)return;
  [p.titleIds[idx],p.titleIds[next]]=[p.titleIds[next],p.titleIds[idx]];
  v138TouchOrderPlan();
  render();
}

function v138MoveTitleInCategory(id,catId,direction){
  const p=v138EnsureOrderPlan();
  const sid=String(id),cid=String(catId);
  const positions=[];
  for(let i=0;i<p.titleIds.length;i++){
    const item=v138OrderItem(p.titleIds[i]);
    if(String(item?.categoryId||'')===cid)positions.push(i);
  }

  const subset=positions.map(i=>p.titleIds[i]);
  const idx=subset.indexOf(sid);
  const next=idx+Number(direction||0);
  if(idx<0||next<0||next>=subset.length)return;

  [subset[idx],subset[next]]=[subset[next],subset[idx]];
  positions.forEach((pos,i)=>{p.titleIds[pos]=subset[i];});
  v138TouchOrderPlan();
  render();
}

function v138ReorderGlobalBefore(sourceId,targetId){
  const p=v138EnsureOrderPlan();
  const source=String(sourceId),target=String(targetId);
  if(source===target)return false;
  const from=p.titleIds.indexOf(source),to=p.titleIds.indexOf(target);
  if(from<0||to<0)return false;

  p.titleIds.splice(from,1);
  let insertAt=p.titleIds.indexOf(target);
  if(insertAt<0)insertAt=p.titleIds.length;
  p.titleIds.splice(insertAt,0,source);
  return true;
}

function v138ReorderCategoryBefore(sourceId,targetId,catId){
  const p=v138EnsureOrderPlan();
  const source=String(sourceId),target=String(targetId),cid=String(catId);
  if(source===target)return false;

  const positions=[];
  for(let i=0;i<p.titleIds.length;i++){
    if(String(v138OrderItem(p.titleIds[i])?.categoryId||'')===cid)positions.push(i);
  }

  const subset=positions.map(i=>p.titleIds[i]);
  const from=subset.indexOf(source),to=subset.indexOf(target);
  if(from<0||to<0)return false;

  subset.splice(from,1);
  let insertAt=subset.indexOf(target);
  if(insertAt<0)insertAt=subset.length;
  subset.splice(insertAt,0,source);
  positions.forEach((pos,i)=>{p.titleIds[pos]=subset[i];});
  return true;
}

function v138OrderDragStart(event,id,catId){
  v138EnsureOrderPlan();
  S.orderPlannerUI.dragTitleId=String(id);
  S.orderPlannerUI.dragCategoryId=String(catId||'');
  try{
    event.dataTransfer.effectAllowed='move';
    event.dataTransfer.setData('text/plain',String(id));
  }catch(_){}
  event.currentTarget?.classList?.add('v138-dragging');
}

function v138OrderDragEnd(event){
  event.currentTarget?.classList?.remove('v138-dragging');
  if(S.orderPlannerUI){
    S.orderPlannerUI.dragTitleId='';
    S.orderPlannerUI.dragCategoryId='';
  }
}

function v138OrderDragOver(event){
  event.preventDefault();
  try{event.dataTransfer.dropEffect='move';}catch(_){}
}

function v138OrderDrop(event,targetId,catId){
  event.preventDefault();
  const source=String(S.orderPlannerUI?.dragTitleId||'');
  const sourceCat=String(S.orderPlannerUI?.dragCategoryId||'');
  const target=String(targetId||'');
  const targetCat=String(catId||'');
  if(!source||!target||source===target)return;

  let changed=false;
  if(targetCat){
    if(sourceCat!==targetCat)return;
    changed=v138ReorderCategoryBefore(source,target,targetCat);
  }else{
    changed=v138ReorderGlobalBefore(source,target);
  }

  if(changed){
    v138TouchOrderPlan();
    render();
  }
}

function v138SetCategoryMode(mode){
  const p=v138EnsureOrderPlan();
  const next=mode==='custom'?'custom':'default';
  if(p.categoryMode===next)return;
  p.categoryMode=next;

  if(next==='custom'){
    const current=(S.categories||[]).map(c=>String(c.id));
    const valid=new Set(current);
    p.categoryOrder=p.categoryOrder.filter(id=>valid.has(String(id)));
    for(const id of current)if(!p.categoryOrder.includes(id))p.categoryOrder.push(id);
  }

  v138TouchOrderPlan();
  render();
}

function v138ToggleOrderCategory(catId){
  const p=v138EnsureOrderPlan();
  const id=String(catId);
  const hidden=new Set(p.hiddenCategories.map(String));
  if(hidden.has(id))hidden.delete(id);
  else hidden.add(id);
  p.hiddenCategories=[...hidden];
  v138TouchOrderPlan();
  render();
}

function v138MoveCategory(catId,direction){
  const p=v138EnsureOrderPlan();
  if(p.categoryMode!=='custom')return;

  const ids=v138CategoryDisplayOrder();
  const id=String(catId);
  const idx=ids.indexOf(id),next=idx+Number(direction||0);
  if(idx<0||next<0||next>=ids.length)return;

  [ids[idx],ids[next]]=[ids[next],ids[idx]];
  p.categoryOrder=ids;
  v138TouchOrderPlan();
  render();
}

function v138CategoryDragStart(event,catId){
  const p=v138EnsureOrderPlan();
  if(p.categoryMode!=='custom')return;
  S.orderPlannerUI.dragCategoryFrom=String(catId);
  try{
    event.dataTransfer.effectAllowed='move';
    event.dataTransfer.setData('text/plain',String(catId));
  }catch(_){}
  event.currentTarget?.classList?.add('v138-dragging');
}

function v138CategoryDragEnd(event){
  event.currentTarget?.classList?.remove('v138-dragging');
  if(S.orderPlannerUI)S.orderPlannerUI.dragCategoryFrom='';
}

function v138CategoryDrop(event,targetId){
  event.preventDefault();
  const p=v138EnsureOrderPlan();
  if(p.categoryMode!=='custom')return;

  const source=String(S.orderPlannerUI?.dragCategoryFrom||'');
  const target=String(targetId||'');
  if(!source||!target||source===target)return;

  const ids=v138CategoryDisplayOrder();
  const from=ids.indexOf(source),to=ids.indexOf(target);
  if(from<0||to<0)return;

  ids.splice(from,1);
  let insertAt=ids.indexOf(target);
  if(insertAt<0)insertAt=ids.length;
  ids.splice(insertAt,0,source);

  p.categoryOrder=ids;
  v138TouchOrderPlan();
  render();
}

// ---- Navigation ------------------------------------------------------------
ICONS.order=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>`;
if(!NAV_ITEMS.some(n=>n.id==='order')){
  const libIndex=NAV_ITEMS.findIndex(n=>n.id==='library');
  NAV_ITEMS.splice(libIndex>=0?libIndex+1:1,0,{id:'order',label:'Order'});
}
if(!MOBILE_MORE_NAV.includes('order'))MOBILE_MORE_NAV.unshift('order');

// Final renderView wrapper: no changes to any existing view.
const v138RenderViewBase=renderView;
renderView=function(){
  if(S.view==='order'){
    const root=document.getElementById('view-root');
    if(!root)return;
    root.innerHTML=`<div class="fade-in">${renderOrder()}</div>`;
    return;
  }
  return v138RenderViewBase();
};

// ---- Persistence -----------------------------------------------------------
// Every regular save/full JSON backup now carries Order.
const v138SnapshotBase=snapshot;
snapshot=function(){
  S.orderPlan=v138NormalizeOrderPlan(S.orderPlan,S.library,S.categories);
  const x=v138SnapshotBase();
  x.orderPlan=JSON.parse(JSON.stringify(S.orderPlan));
  return x;
};

// Sync/restore application path.
const v138ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  v138ApplyStateBase(d);
  S.orderPlan=v138NormalizeOrderPlan(d?.orderPlan,S.library,S.categories);
};

// Cloud merge: sequence data cannot be meaningfully field-merged, so the most
// recently edited complete planner wins. Missing planner data never erases one.
const v138MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v138MergeStatesBase(a,b)||{};
  const ap=a?.orderPlan&&typeof a.orderPlan==='object'?a.orderPlan:null;
  const bp=b?.orderPlan&&typeof b.orderPlan==='object'?b.orderPlan:null;

  let chosen=null;
  if(ap&&bp){
    chosen=(Number(ap.modifiedAt)||0)>=(Number(bp.modifiedAt)||0)?ap:bp;
  }else{
    chosen=ap||bp||null;
  }

  out.orderPlan=v138NormalizeOrderPlan(chosen,out.library||S.library,out.categories||S.categories);
  return out;
};

// Make sure a title/category deletion is cleaned from the in-memory planner the
// next time Order opens, while snapshot() also strips stale IDs on every save.
const v138SetViewBase=App.setView;
App.setView=function(v){
  if(v==='order')v138EnsureOrderPlan();
  return v138SetViewBase.call(this,v);
};

Object.assign(App,{
  v138OrderSearch,
  v138ToggleOrderPick,
  v138AddSelectedOrderTitles,
  v138AddVisibleOrderTitles,
  v138RemoveOrderTitle,
  v138ClearOrder,
  v138SetOrderView,
  v138MoveTitle,
  v138MoveTitleInCategory,
  v138OrderDragStart,
  v138OrderDragEnd,
  v138OrderDragOver,
  v138OrderDrop,
  v138SetCategoryMode,
  v138ToggleOrderCategory,
  v138MoveCategory,
  v138CategoryDragStart,
  v138CategoryDragEnd,
  v138CategoryDrop
});



