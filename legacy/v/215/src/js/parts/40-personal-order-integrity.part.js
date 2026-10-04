/* ============================================================
   MediaFlow v137 — Automatic Start Date from genuine History
   ------------------------------------------------------------
   Rules:
   - a real title log can automatically create Start Date when it is blank;
   - existing progress does not prevent Start Date creation;
   - the earliest genuine matching History date is preferred;
   - later logs never push Start Date forward;
   - an automatically-created Start Date can move earlier when older genuine
     History is later added/backdated;
   - manual, MAL-imported, and legacy pre-v137 Start Dates are protected;
   - repeat/rewatch/reread logs do not become a title's original Start Date.
   ============================================================ */

function v137HistoryTimestamp(session){
  if(!session)return 0;

  // The editable History date is authoritative for day-level lifecycle data.
  // This lets backdating an existing History row move an automatic Start Date
  // earlier without rewriting the session's original technical timestamp.
  const raw=String(session.date||'').trim().slice(0,10);
  const fromDate=/^\d{4}-\d{2}-\d{2}$/.test(raw)?Number(v135ParseDateInput(raw))||0:0;
  if(fromDate)return fromDate;

  return Number(session.timestamp)||0;
}

function v137HistoryTitleMatches(item,session,titleRow){
  if(!item || !session || !titleRow)return false;

  if(titleRow.libraryId){
    return String(titleRow.libraryId)===String(item.id);
  }

  return (
    cleanTitle(titleRow.title||'').toLowerCase()===cleanTitle(item.title||'').toLowerCase() &&
    String(session.categoryId||'')===String(item.categoryId||'')
  );
}

function v137IsGenuineStartEvidence(item,session,titleRow){
  if(!session || session.status==='skipped' || !titleRow)return false;

  // Rewatch/reread history belongs to repeat tracking, not the original start.
  if(titleRow.repeat)return false;

  if(!v137HistoryTitleMatches(item,session,titleRow))return false;

  const qtyRaw=titleRow.qty ?? titleRow.amount;
  const hasQty=qtyRaw!==undefined && qtyRaw!==null && qtyRaw!=='';
  if(hasQty && Number(qtyRaw)<=0)return false;

  const consumed=(Number(session.actualAmount)||0)>0 || (Number(session.minutes)||0)>0 || (hasQty && Number(qtyRaw)>0);
  return consumed;
}

function v137EarliestGenuineStart(item){
  if(!item?.id)return 0;

  let earliest=Infinity;
  for(const session of (S.sessions||[])){
    if(!session || session.status==='skipped')continue;

    for(const titleRow of (session.titles||[])){
      if(!v137IsGenuineStartEvidence(item,session,titleRow))continue;
      const ts=v137HistoryTimestamp(session);
      if(ts>0 && ts<earliest)earliest=ts;
    }
  }

  return Number.isFinite(earliest)?earliest:0;
}

function v137CanAutoChangeStart(item){
  if(!item)return false;

  // No date yet: v137 may establish it.
  if(!(Number(item.startedAt)>0))return true;

  // Only dates explicitly created by the automatic History system are allowed
  // to move earlier. A source-less pre-v137 date is treated as protected legacy
  // data so v137 never silently changes an old manual/imported date.
  return String(item.startedAtSource||'')==='auto';
}

function v137ReconcileStartDate(item){
  if(!item || !v137CanAutoChangeStart(item))return false;

  const earliest=v137EarliestGenuineStart(item);
  if(!earliest)return false;

  const current=Number(item.startedAt)||0;
  if(current>0 && earliest>=current)return false;

  item.startedAt=earliest;
  item.startedAtSource='auto';
  item.modifiedAt=Date.now();
  return true;
}

function v137ResolveHistoryTitle(session,titleRow){
  if(!titleRow)return null;

  if(titleRow.libraryId){
    const byId=(S.library||[]).find(i=>String(i?.id||'')===String(titleRow.libraryId));
    if(byId)return byId;
  }

  const titleKey=cleanTitle(titleRow.title||'').toLowerCase();
  if(!titleKey)return null;

  const sameCategory=(S.library||[]).find(i=>
    cleanTitle(i?.title||'').toLowerCase()===titleKey &&
    String(i?.categoryId||'')===String(session?.categoryId||'')
  );
  if(sameCategory)return sameCategory;

  const all=(S.library||[]).filter(i=>cleanTitle(i?.title||'').toLowerCase()===titleKey);
  return all.length===1?all[0]:null;
}

function v137AffectedItemsFromSessions(sessions){
  const map=new Map();

  for(const session of (sessions||[])){
    if(!session || session.status==='skipped')continue;

    for(const titleRow of (session.titles||[])){
      if(titleRow?.repeat)continue;
      const item=v137ResolveHistoryTitle(session,titleRow);
      if(item?.id)map.set(String(item.id),item);
    }
  }

  return [...map.values()];
}

function v137ReconcileStartsForSessions(sessions){
  let changed=0;
  for(const item of v137AffectedItemsFromSessions(sessions)){
    if(v137ReconcileStartDate(item))changed++;
  }
  return changed;
}

// Final wrapper for normal logging.
// This works even when a title already had progress before MediaFlow knew its
// Start Date, and it does not require Update Library to be enabled because the
// genuine History row itself is sufficient evidence of when MediaFlow saw it.
const v137SubmitLogBase=App.submitLog;
App.submitLog=function(){
  const before=new Set((S.sessions||[]).map(s=>s?.id).filter(Boolean));
  const result=v137SubmitLogBase.apply(this,arguments);

  const added=(S.sessions||[]).filter(s=>s?.id&&!before.has(s.id));
  const changed=v137ReconcileStartsForSessions(added);

  if(changed){
    persistLibrary();
    render();
  }

  return result;
};

// Batch Log can be backdated, so its entered day becomes valid Start-Date
// evidence. If older matching History already exists, that earlier day wins.
const v137SubmitBatchLogBase=App.submitBatchLog;
App.submitBatchLog=function(){
  const before=new Set((S.sessions||[]).map(s=>s?.id).filter(Boolean));
  const result=v137SubmitBatchLogBase.apply(this,arguments);

  const added=(S.sessions||[]).filter(s=>s?.id&&!before.has(s.id));
  const changed=v137ReconcileStartsForSessions(added);

  if(changed){
    persistLibrary();
    render();
  }

  return result;
};

// Editing a History date can reveal an earlier genuine starting day.
// Automatic dates may move backward only; manual/MAL/legacy dates stay fixed.
const v137SaveSessionModalBase=App.saveSessionModal;
App.saveSessionModal=function(id){
  const before=(S.sessions||[]).find(s=>s?.id===id);
  const beforeCopy=before?Object.assign({},before,{titles:(before.titles||[]).map(t=>Object.assign({},t))}):null;

  const result=v137SaveSessionModalBase.apply(this,arguments);
  const after=(S.sessions||[]).find(s=>s?.id===id);

  const changed=v137ReconcileStartsForSessions([beforeCopy,after].filter(Boolean));
  if(changed){
    persistLibrary();
    render();
  }

  return result;
};



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



/* ============================================================
   MediaFlow v139 — Prioritize Personal Order for recommendations
   ------------------------------------------------------------
   This feature is intentionally narrow:
   - category selection remains the normal MediaFlow scheduler;
   - suggested amount remains unchanged;
   - balance/health/reasons remain unchanged;
   - only the exact recommended title can be sourced from Personal Order;
   - if no eligible ordered title exists in the selected category, the
     original MediaFlow title scorer is used as fallback.
   ============================================================ */

App.togglePrioritizePersonalOrder=function(){
  S.settings=S.settings||{};
  S.settings.prioritizePersonalOrder=!S.settings.prioritizePersonalOrder;

  // If a task is already active and exact-title recommendations are enabled,
  // immediately refresh only its title recommendation. The task category,
  // amount, reasons, balance and other scheduler data are left untouched.
  if(S.sessionActive && S.currentTask && S.settings.exactTitleRecommendations){
    const cat=getCategory(S.currentTask.categoryId);
    const picked=cat?pickLibraryTitle(cat):null;
    S.currentTask.libraryId=picked?picked.id:null;
    S.currentTask.title=picked?cleanTitle(picked.title):null;
    persistTask();
  }

  persistSettings();
  render();
};



/* ============================================================
   MediaFlow v140 — Order Library picker controls
   ============================================================ */
Object.assign(App,{
  v140OrderSetFilter,
  v140OrderToggleCategory,
  v140OrderClearCategories,
  v140OrderClearFilters,
  v140OrderSetPage
});

// v138 exported these before v140 replaced their implementation.
// Rebind them so inline controls always use the current picker behavior.
App.v138OrderSearch=v138OrderSearch;
App.v138ToggleOrderPick=v138ToggleOrderPick;
App.v138AddSelectedOrderTitles=v138AddSelectedOrderTitles;
App.v138AddVisibleOrderTitles=v138AddVisibleOrderTitles;



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



/* ============================================================
   MediaFlow v142 — Order import/export + clear recovery
   ============================================================ */

function v142OrderSnapshotFrom(plan){
  const p=plan||v138EnsureOrderPlan();
  return {
    titleIds:Array.isArray(p.titleIds)?p.titleIds.map(String):[],
    viewMode:p.viewMode==='category'?'category':'all',
    categoryMode:p.categoryMode==='custom'?'custom':'default',
    categoryOrder:Array.isArray(p.categoryOrder)?p.categoryOrder.map(String):[],
    hiddenCategories:Array.isArray(p.hiddenCategories)?p.hiddenCategories.map(String):[],
    savedAt:Date.now()
  };
}

function v142NormalizeSavedOrderSnapshot(raw,library,categories){
  if(!raw || typeof raw!=='object' || Array.isArray(raw))return null;

  const lib=Array.isArray(library)?library:(S.library||[]);
  const cats=Array.isArray(categories)?categories:(S.categories||[]);
  const libIds=new Set(lib.filter(i=>i?.id).map(i=>String(i.id)));
  const catIds=new Set(cats.filter(c=>c?.id).map(c=>String(c.id)));

  const unique=(arr,allowed)=>{
    const out=[],seen=new Set();
    for(const value of (Array.isArray(arr)?arr:[])){
      const id=String(value||'');
      if(!id||seen.has(id)||(allowed&&!allowed.has(id)))continue;
      seen.add(id);out.push(id);
    }
    return out;
  };

  const titleIds=unique(raw.titleIds,libIds);
  if(!titleIds.length)return null;

  let categoryOrder=unique(raw.categoryOrder,catIds);
  for(const c of cats){
    const id=String(c?.id||'');
    if(id&&!categoryOrder.includes(id))categoryOrder.push(id);
  }

  return {
    titleIds,
    viewMode:raw.viewMode==='category'?'category':'all',
    categoryMode:raw.categoryMode==='custom'?'custom':'default',
    categoryOrder,
    hiddenCategories:unique(raw.hiddenCategories,catIds),
    savedAt:Math.max(0,Number(raw.savedAt)||Date.now())
  };
}

// Preserve the recovery snapshot through every existing Order normalize/save/
// cloud-sync/full-backup path without changing v138's canonical planner format.
const v142NormalizeOrderPlanBase=v138NormalizeOrderPlan;
v138NormalizeOrderPlan=function(plan,library,categories){
  const out=v142NormalizeOrderPlanBase(plan,library,categories);
  out.lastClearedOrder=v142NormalizeSavedOrderSnapshot(
    plan?.lastClearedOrder,
    Array.isArray(library)?library:(S.library||[]),
    Array.isArray(categories)?categories:(S.categories||[])
  );
  return out;
};

function v142OrderExportPayload(){
  const p=v138EnsureOrderPlan();
  const titleSet=new Set(p.titleIds.map(String));
  const titles=[];

  for(const id of p.titleIds){
    const item=v138OrderItem(id);
    if(!item)continue;
    const cat=v138OrderCategory(item.categoryId);
    titles.push({
      id:String(item.id),
      title:cleanTitle(item.title),
      categoryId:String(item.categoryId||''),
      categoryName:cat?.name||'',
      externalIds:Object.assign({},item.externalIds||{})
    });
  }

  const categories=(S.categories||[]).map(c=>({
    id:String(c?.id||''),
    name:String(c?.name||'')
  })).filter(c=>c.id);

  return {
    format:'MediaFlowOrder',
    formatVersion:1,
    mediaFlowVersion:142,
    exportedAt:new Date().toISOString(),
    orderPlan:{
      titleIds:[...titleSet],
      viewMode:p.viewMode,
      categoryMode:p.categoryMode,
      categoryOrder:[...(p.categoryOrder||[])],
      hiddenCategories:[...(p.hiddenCategories||[])]
    },
    titles,
    categories
  };
}

function v142ExportOrder(){
  const p=v138EnsureOrderPlan();
  if(!p.titleIds.length){
    showToast('Your Order is empty.');
    return;
  }

  const payload=v142OrderExportPayload();
  const stamp=new Date().toISOString().slice(0,10);
  triggerDownload(
    new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),
    `MediaFlow_Order_${stamp}.json`
  );
  showToast(`${payload.titles.length.toLocaleString()} ordered title${payload.titles.length===1?'':'s'} exported ✓`);
}

function v142PickOrderImport(){
  document.getElementById('v142-order-import-file')?.click();
}

function v142NormalizeTitleKey(value){
  return cleanTitle(value||'').trim().toLowerCase();
}

function v142MapImportedCategoryId(importedId,importedCategories){
  const id=String(importedId||'');
  if(id && (S.categories||[]).some(c=>String(c?.id||'')===id))return id;

  const source=(importedCategories||[]).find(c=>String(c?.id||'')===id);
  const name=String(source?.name||'').trim().toLowerCase();
  if(!name)return '';
  return String((S.categories||[]).find(c=>String(c?.name||'').trim().toLowerCase()===name)?.id||'');
}

function v142FindImportedOrderItem(descriptor){
  if(!descriptor)return null;

  const direct=(S.library||[]).find(i=>String(i?.id||'')===String(descriptor.id||''));
  if(direct)return direct;

  const ext=descriptor.externalIds&&typeof descriptor.externalIds==='object'?descriptor.externalIds:{};
  const extEntries=Object.entries(ext).filter(([,v])=>v!==null&&v!==undefined&&String(v)!=='');
  if(extEntries.length){
    const byExt=(S.library||[]).find(item=>
      extEntries.some(([k,v])=>item?.externalIds?.[k]!=null && String(item.externalIds[k])===String(v))
    );
    if(byExt)return byExt;
  }

  const titleKey=v142NormalizeTitleKey(descriptor.title);
  if(!titleKey)return null;

  const all=(S.library||[]).filter(i=>v142NormalizeTitleKey(i?.title)===titleKey);
  if(!all.length)return null;

  const mappedCategory=v142MapImportedCategoryId(descriptor.categoryId,descriptor._categories||[]);
  if(mappedCategory){
    const byCategory=all.find(i=>String(i?.categoryId||'')===mappedCategory);
    if(byCategory)return byCategory;
  }

  if(descriptor.categoryName){
    const name=String(descriptor.categoryName).trim().toLowerCase();
    const byName=all.find(i=>String(v138OrderCategory(i?.categoryId)?.name||'').trim().toLowerCase()===name);
    if(byName)return byName;
  }

  return all.length===1?all[0]:null;
}

async function v142ImportOrder(file){
  if(!file)return;

  try{
    const text=await file.text();
    const data=JSON.parse(text);

    const rawPlan=(data?.orderPlan&&typeof data.orderPlan==='object')
      ? data.orderPlan
      : (Array.isArray(data?.titleIds)?data:null);if(!rawPlan || !Array.isArray(rawPlan.titleIds)){
      throw new Error('This is not a MediaFlow Order export.');
    }

    const importedCategories=Array.isArray(data?.categories)?data.categories:[];
    const descriptors=Array.isArray(data?.titles)?data.titles:[];
    const descById=new Map(
      descriptors
        .filter(x=>x&&x.id!=null)
        .map(x=>[String(x.id),Object.assign({_categories:importedCategories},x)])
    );

    const currentById=new Map(
      (S.library||[]).filter(i=>i?.id).map(i=>[String(i.id),i])
    );

    const resolved=[],seen=new Set();
    let skipped=0;

    for(const rawId of rawPlan.titleIds){
      const id=String(rawId||'');
      let item=currentById.get(id)||null;

      if(!item){
        const descriptor=descById.get(id);
        if(descriptor)item=v142FindImportedOrderItem(descriptor);
      }

      if(!item?.id){
        skipped++;
        continue;
      }

      const itemId=String(item.id);
      if(seen.has(itemId))continue;
      seen.add(itemId);
      resolved.push(itemId);
    }

    if(!resolved.length){
      throw new Error('None of the exported titles could be matched to your current Library.');
    }

    const p=v138EnsureOrderPlan();

    // Keep one recoverable copy of the current plan before replacing it.
    if(p.titleIds.length){
      p.lastClearedOrder=v142OrderSnapshotFrom(p);
    }

    const mapCatList=(arr)=>{
      const out=[],used=new Set();
      for(const rawId of (Array.isArray(arr)?arr:[])){
        const mapped=v142MapImportedCategoryId(rawId,importedCategories);
        if(mapped&&!used.has(mapped)){used.add(mapped);out.push(mapped);}
      }
      return out;
    };

    const currentCatIds=(S.categories||[]).map(c=>String(c.id));
    let categoryOrder=mapCatList(rawPlan.categoryOrder);
    for(const id of currentCatIds)if(!categoryOrder.includes(id))categoryOrder.push(id);

    p.titleIds=resolved;
    p.viewMode=rawPlan.viewMode==='category'?'category':'all';
    p.categoryMode=rawPlan.categoryMode==='custom'?'custom':'default';
    p.categoryOrder=categoryOrder;
    p.hiddenCategories=mapCatList(rawPlan.hiddenCategories);
    p.modifiedAt=Date.now();

    S.orderPlannerUI?.picks?.clear?.();
    if(S.orderPlannerUI){
      S.orderPlannerUI.search='';
      S.orderPlannerUI.page=0;
    }

    await saveState();
    render();

    showToast(
      `Order imported: ${resolved.length.toLocaleString()} title${resolved.length===1?'':'s'}${skipped?` · ${skipped.toLocaleString()} unmatched skipped`:''} ✓`
    );
  }catch(err){
    console.error('Order import failed',err);
    showToast(err?.message||'Could not import that Order file.');
  }
}

function v142OrderClearConfirmHtml(){
  const p=v138EnsureOrderPlan();
  const count=p.titleIds.length;
  return `<div class="priority-modal">
    <div class="v142-order-confirm-icon">🧹</div>
    <div class="modal-title">Clear Personal Order?</div>
    <div class="v142-order-confirm-copy">
      You're about to remove <b>${count.toLocaleString()} title${count===1?'':'s'}</b> from your Personal Order.
    </div>
    <div class="v142-order-confirm-box">
      <b>Your Library will not be changed.</b><br>
      Titles, progress, History, XP and scheduler data stay untouched. MediaFlow will keep one recovery copy so you can restore this exact Order afterward.
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-danger" type="button" onclick="App.v142ConfirmClearOrder(this)">Clear Order</button>
    </div>
  </div>`;
}

function v142OpenClearOrderConfirm(){
  const p=v138EnsureOrderPlan();
  if(!p.titleIds.length){
    showToast('Your Order is already empty.');
    return;
  }

  const existing=document.getElementById('modal-root');
  if(existing)existing.remove();

  const wrap=document.createElement('div');
  wrap.id='modal-root';
  wrap.innerHTML=`<div class="modal-overlay" onclick="if(event.target===this) App.closeModal()"><div class="modal">${v142OrderClearConfirmHtml()}</div></div>`;
  document.body.appendChild(wrap);
}

async function v142ConfirmClearOrder(button){
  if(button?.dataset?.clearing==='1')return;
  if(button){button.dataset.clearing='1';button.disabled=true;}

  const p=v138EnsureOrderPlan();
  if(!p.titleIds.length){
    App.closeModal();
    return;
  }

  p.lastClearedOrder=v142OrderSnapshotFrom(p);
  p.titleIds=[];
  p.modifiedAt=Date.now();
  S.orderPlannerUI?.picks?.clear?.();

  const modal=document.getElementById('modal-root');
  if(modal)modal.remove();
  S.modal=null;

  await saveState();
  render();
  showToast('Order cleared · Restore Last Order is available');
}

async function v142RestoreLastOrder(){
  const p=v138EnsureOrderPlan();
  const last=v142NormalizeSavedOrderSnapshot(p.lastClearedOrder,S.library,S.categories);
  if(!last?.titleIds?.length){
    p.lastClearedOrder=null;
    render();
    showToast('No cleared Order is available to restore.');
    return;
  }

  p.titleIds=[...last.titleIds];
  p.viewMode=last.viewMode;
  p.categoryMode=last.categoryMode;
  p.categoryOrder=[...last.categoryOrder];
  p.hiddenCategories=[...last.hiddenCategories];
  p.lastClearedOrder=null;
  p.modifiedAt=Date.now();

  S.orderPlannerUI?.picks?.clear?.();
  await saveState();
  render();
  showToast(`${p.titleIds.length.toLocaleString()} ordered title${p.titleIds.length===1?'':'s'} restored ✓`);
}

// Replace the old browser confirm() clear action with the designed MediaFlow modal.
v138ClearOrder=v142OpenClearOrderConfirm;
App.v138ClearOrder=v142OpenClearOrderConfirm;

// Add Order portability/recovery controls without disturbing v141's picker.
const v142RenderOrderBase=renderOrder;
renderOrder=function(){
  let h=v142RenderOrderBase();
  const p=v138EnsureOrderPlan();
  const count=p.titleIds.length;
  const canRestore=!!(p.lastClearedOrder?.titleIds?.length);

  const oldHead=`${count?`<button class="btn btn-ghost" type="button" onclick="App.v138ClearOrder()">Clear Order</button>`:''}`;
  const actions=`<div class="v142-order-head-actions">
    <button class="btn btn-ghost" type="button" onclick="App.v142ExportOrder()" ${count?'':'disabled'}>Export Order</button>
    <button class="btn btn-ghost" type="button" onclick="App.v142PickOrderImport()">Import Order</button>
    ${canRestore?`<button class="btn btn-ghost v142-order-restore" type="button" onclick="App.v142RestoreLastOrder()">Restore Last Order</button>`:''}
    ${count?`<button class="btn btn-ghost" type="button" onclick="App.v138ClearOrder()">Clear Order</button>`:''}
    <input id="v142-order-import-file" type="file" accept=".json,application/json" hidden onchange="App.v142ImportOrder(this.files?.[0]);this.value=''">
  </div>`;

  if(oldHead && h.includes(oldHead)){
    h=h.replace(oldHead,actions);
  }else{
    h=h.replace('</div>\n\n    <div class="v138-order-note">',actions+'</div>\n\n    <div class="v138-order-note">');
  }

  return h;
};

Object.assign(App,{
  v142ExportOrder,
  v142PickOrderImport,
  v142ImportOrder,
  v142ConfirmClearOrder,
  v142RestoreLastOrder
});



/* ============================================================
   MediaFlow v143 — Library bulk-action confirmations
   ------------------------------------------------------------
   v143 audit:
   - Empty Library already had a designed MediaFlow confirmation, so it is
     intentionally preserved unchanged.
   - Delete selected, Set status, Set priority and Move to previously executed
     immediately. They now require explicit designed confirmation.
   ============================================================ */

const v143BatchStatusBase=App.batchLibraryStatus;
const v143BatchPriorityBase=App.batchLibraryPriority;
const v143BatchCategoryBase=App.batchLibraryCategory;
const v143BatchDeleteBase=App.batchDeleteLibrary;

function v143SelectedLibraryCount(){
  return mfSelectedIds().length;
}

function v143StatusLabel(value){
  const map={
    planned:'Plan to Watch',
    active:'Watching',
    paused:'On Hold',
    completed:'Completed',
    dropped:'Dropped'
  };
  return map[String(value||'').toLowerCase()]||String(value||'');
}

function v143PriorityLabel(value){
  const map={low:'Low',medium:'Medium',high:'High'};
  return map[String(value||'').toLowerCase()]||String(value||'');
}

function v143LibraryBatchConfirmHtml(kind,value,count){
  const n=Math.max(0,Number(count)||0);
  const plural=n===1?'title':'titles';

  let icon='✓';
  let title='Confirm Library change';
  let action='Confirm';
  let target='';
  let description='';
  let detail='';
  let danger=false;

  if(kind==='status'){
    const label=v143StatusLabel(value);
    icon='◉';
    title='Change selected status?';
    action='Change status';
    target=label;
    description=`You are about to change the status of <b>${n.toLocaleString()} ${plural}</b>.`;
    detail=label==='Completed'
      ?'Titles changed to Completed will use MediaFlow’s existing completion behavior. Other selected titles keep their Library and History data.'
      :'Only the selected Library titles are affected. Your consumption History is not deleted.';
  }else if(kind==='priority'){
    const label=v143PriorityLabel(value);
    icon='◆';
    title='Change selected priority?';
    action='Change priority';
    target=label;
    description=`You are about to change the priority of <b>${n.toLocaleString()} ${plural}</b>.`;
    detail='This changes the selected Library titles only. History, progress and title ordering remain intact.';
  }else if(kind==='category'){
    const cat=(S.categories||[]).find(c=>String(c?.id||'')===String(value||''));
    const label=cat?`${cat.icon||'📚'} ${cat.name}`:'Selected category';
    icon='↪';
    title='Move selected titles?';
    action='Move titles';
    target=label;
    description=`You are about to move <b>${n.toLocaleString()} ${plural}</b> to another category.`;
    detail='The titles stay in your Library. Progress and History remain intact; only their Library category changes.';
  }else if(kind==='delete'){
    icon='🗑️';
    title='Delete selected titles?';
    action='Delete selected';
    danger=true;
    description=`You are about to delete <b>${n.toLocaleString()} selected ${plural}</b> from your Library.`;
    detail='Consumption History remains intact. This Library batch change is tracked by Library History and can be undone from there.';
  }

  return `<div class="priority-modal v143-lib-confirm">
    <div class="v143-lib-confirm-icon">${icon}</div>
    <div class="modal-title">${escapeHtml(title)}</div>
    <div class="v143-lib-confirm-copy">${description}</div>
    <div class="v143-lib-confirm-box ${danger?'v143-lib-confirm-danger':''}">
      <b>${danger?'Library deletion':'Selected-title update'}</b><br>
      ${escapeHtml(detail)}
      ${target?`<div class="v143-lib-confirm-target">${escapeHtml(target)}</div>`:''}
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" type="button" onclick="App.v143CancelLibraryBatch()">Cancel</button>
      <button class="btn ${danger?'btn-danger':'btn-primary'}" type="button" onclick="App.v143ConfirmLibraryBatch(this)">${escapeHtml(action)}</button>
    </div>
  </div>`;
}

function v143OpenLibraryBatchConfirm(kind,value=''){
  const ids=mfSelectedIds();
  if(!ids.length){
    showToast('Select at least one Library title first.');
    return;
  }

  if(kind==='status'&&!['planned','active','paused','completed','dropped'].includes(String(value||'')))return;
  if(kind==='priority'&&!['low','medium','high'].includes(String(value||'')))return;
  if(kind==='category'&&!(S.categories||[]).some(c=>String(c?.id||'')===String(value||'')))return;
  if(kind!=='delete'&&!value)return;

  S.v143PendingLibraryBatch={
    kind:String(kind||''),
    value:String(value||''),
    ids:[...ids]
  };

  const existing=document.getElementById('modal-root');
  if(existing)existing.remove();

  const wrap=document.createElement('div');
  wrap.id='modal-root';
  wrap.innerHTML=`<div class="modal-overlay" onclick="if(event.target===this) App.v143CancelLibraryBatch()"><div class="modal">${v143LibraryBatchConfirmHtml(kind,value,ids.length)}</div></div>`;
  document.body.appendChild(wrap);
}

function v143CancelLibraryBatch(){
  S.v143PendingLibraryBatch=null;
  const modal=document.getElementById('modal-root');
  if(modal)modal.remove();
}

function v143RestorePendingSelection(ids){
  const valid=new Set((S.library||[]).map(i=>String(i?.id||'')));
  S.librarySelection=S.librarySelection||{};
  for(const key of Object.keys(S.librarySelection))S.librarySelection[key]=false;
  for(const id of (ids||[])){
    const sid=String(id||'');
    if(valid.has(sid))S.librarySelection[sid]=true;
  }
}

async function v143ConfirmLibraryBatch(button){
  if(button?.dataset?.working==='1')return;
  if(button){
    button.dataset.working='1';
    button.disabled=true;
  }

  const pending=S.v143PendingLibraryBatch;
  if(!pending){
    v143CancelLibraryBatch();
    return;
  }

  // Apply to the exact selection the user confirmed, even if some other UI
  // refresh happened while the dialog was open.
  v143RestorePendingSelection(pending.ids);

  const kind=pending.kind;
  const value=pending.value;
  const count=mfSelectedIds().length;

  S.v143PendingLibraryBatch=null;
  const modal=document.getElementById('modal-root');
  if(modal)modal.remove();

  if(!count){
    showToast('The selected titles are no longer available.');
    render();
    return;
  }

  if(kind==='status'){
    v143BatchStatusBase.call(App,value);
    showToast(`${count.toLocaleString()} ${count===1?'title':'titles'} changed to ${v143StatusLabel(value)} ✓`);
  }else if(kind==='priority'){
    v143BatchPriorityBase.call(App,value);
    showToast(`${count.toLocaleString()} ${count===1?'title':'titles'} priority changed to ${v143PriorityLabel(value)} ✓`);
  }else if(kind==='category'){
    const cat=(S.categories||[]).find(c=>String(c?.id||'')===String(value));
    v143BatchCategoryBase.call(App,value);
    showToast(`${count.toLocaleString()} ${count===1?'title':'titles'} moved to ${cat?.name||'category'} ✓`);
  }else if(kind==='delete'){
    v143BatchDeleteBase.call(App);
  }
}

// Final wrappers used by every Library bulk-control variant.
App.batchLibraryStatus=function(value){
  v143OpenLibraryBatchConfirm('status',value);
};
App.batchLibraryPriority=function(value){
  v143OpenLibraryBatchConfirm('priority',value);
};
App.batchLibraryCategory=function(value){
  v143OpenLibraryBatchConfirm('category',value);
};
App.batchDeleteLibrary=function(){
  v143OpenLibraryBatchConfirm('delete','');
};

Object.assign(App,{
  v143ConfirmLibraryBatch,
  v143CancelLibraryBatch
});



