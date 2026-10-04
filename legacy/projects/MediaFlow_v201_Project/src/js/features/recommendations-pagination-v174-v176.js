/* MediaFlow v201 source fragment
 * Recommended-title editing, pagination, Batch Log filters and rich Library rows
 * Original HTML lines 30560-32327.
 * Build order matters; see scripts/build.mjs.
 */

/* ============================================================
   MediaFlow v174 — Edit Recommended Title From Dashboard
   ------------------------------------------------------------
   When Exact Title Recommendations is active and MediaFlow has picked a
   Library title, the Dashboard now exposes Edit directly beside that
   recommendation. It reuses the normal Library editor; there is no duplicate
   editor/state path.
   ============================================================ */

function v174RecommendedLibraryItem(){
  const t=S.currentTask;
  if(!t?.title || !S.settings?.exactTitleRecommendations)return null;

  if(t.libraryId){
    const byId=(S.library||[]).find(
      item=>String(item?.id||'')===String(t.libraryId)
    );
    if(byId)return byId;
  }

  return v50FindLibraryItem(t.libraryId,t.title);
}

function v174EditRecommendedTitle(){
  const item=v174RecommendedLibraryItem();

  if(!item?.id){
    showToast('This recommended title is not available in your Library.');
    return;
  }

  App.openLibraryModal(item.id);
}

Object.assign(App,{
  v174EditRecommendedTitle
});

// FINAL Dashboard wrapper. This runs after the existing v50 cover-aware
// recommendation renderer, so both rich-cover and plain recommendation states
// receive the same Edit action.
const v174RenderDashboardBase=renderDashboard;
renderDashboard=function(){
  let h=v174RenderDashboardBase();
  const t=S.currentTask;

  if(
    !t?.title ||
    !S.settings?.exactTitleRecommendations ||
    !v174RecommendedLibraryItem()?.id
  ){
    return h;
  }

  const editButton=`<button type="button"
    class="btn btn-sm btn-ghost v174-recommended-edit"
    onclick="App.v174EditRecommendedTitle()"
    title="Edit this recommended Library title">
    Edit
  </button>`;

  // Cover-aware v50 recommendation.
  const richPattern=/(<div class="hero-note v50-title-feature">[\s\S]*?<b>[^<]*<\/b><\/div><\/div>)/;
  if(richPattern.test(h)){
    h=h.replace(
      richPattern,
      `<div class="v174-recommended-title-row">$1${editButton}</div>`
    );
    return h;
  }

  // Plain recommendation when the Library title has no cover.
  const plain=`<div class="hero-note">MediaFlow recommends: <b>${escapeHtml(t.title)}</b></div>`;
  if(h.includes(plain)){
    h=h.replace(
      plain,
      `<div class="v174-recommended-title-row">${plain}${editButton}</div>`
    );
  }

  return h;
};

// If the user edits the recommended title's name from the reused Library
// editor, keep the active task label aligned with that Library item.
const v174SaveLibraryModalBase=App.saveLibraryModal;
App.saveLibraryModal=function(id){
  const wasRecommended=
    !!id &&
    !!S.currentTask &&
    String(S.currentTask.libraryId||'')===String(id);

  const result=v174SaveLibraryModalBase.apply(this,arguments);

  if(wasRecommended){
    const item=(S.library||[]).find(
      row=>String(row?.id||'')===String(id)
    );
    if(item){
      S.currentTask.title=cleanTitle(item.title);
      persistTask();
    }
  }

  return result;
};

// No new persistent user data is introduced in v174. The edit action writes
// through the existing Library persistence pipeline, which is already included
// in cloud state, Sync Now verification, Full Backup, Automatic Backup and JSON
// backup import/export.

const v174BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v174BuildFullBackupBase();
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();

  if(payload.backupManifest){
    payload.backupManifest.note='Complete MediaFlow v174 backup. Dashboard recommended-title editing reuses the normal Library data path, so edited recommendation title metadata is preserved through the existing cloud, Sync Now, Full Backup, Automatic Backup and JSON backup pipelines.';
  }

  return payload;
};


/* ============================================================
   MediaFlow v175
   - Configurable ordered-title page size
   - Configurable page size for Library, Order Library, Logging Library,
     and Batch Log Library
   - Batch Log gains the full Library-picker filter/sort/pagination toolset
   ============================================================ */

const V175_BACKUP_SCHEMA_VERSION=12;
const V175_MAX_PAGE_SIZE=5000;
const V175_PAGE_SIZE_DEFAULTS={
  library:50,
  orderLibrary:20,
  loggingLibrary:20,
  batchLibrary:20,
  modifiedAt:0
};

function v175ClampPageSize(value,fallback=20){
  const n=Math.floor(Number(value));
  if(!Number.isFinite(n)||n<1){
    return Math.max(1,Math.floor(Number(fallback)||20));
  }
  return Math.max(1,Math.min(V175_MAX_PAGE_SIZE,n));
}

function v175NormalizePageSizes(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  return {
    library:v175ClampPageSize(src.library,V175_PAGE_SIZE_DEFAULTS.library),
    orderLibrary:v175ClampPageSize(src.orderLibrary,V175_PAGE_SIZE_DEFAULTS.orderLibrary),
    loggingLibrary:v175ClampPageSize(src.loggingLibrary,V175_PAGE_SIZE_DEFAULTS.loggingLibrary),
    batchLibrary:v175ClampPageSize(src.batchLibrary,V175_PAGE_SIZE_DEFAULTS.batchLibrary),
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v175EnsurePageSizes(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.v175PageSizes=v175NormalizePageSizes(settings.v175PageSizes);
  return settings.v175PageSizes;
}

function v175PageSize(kind){
  const cfg=v175EnsurePageSizes(S.settings||DEFAULT_SETTINGS);
  return v175ClampPageSize(
    cfg[String(kind||'')],
    V175_PAGE_SIZE_DEFAULTS[String(kind||'')]||20
  );
}

function v175OrderPageSize(){return v175ClampPageSize(
    S.orderPlan?.orderedPageSize,
    50
  );
}

function v175PageSizeControlHtml(kind,label='Per page'){
  const value=v175PageSize(kind);
  return `<label class="v175-page-size-control">
    <span>${escapeHtml(label)}</span>
    <input type="number" min="1" max="${V175_MAX_PAGE_SIZE}" step="1"
      value="${value}"
      onchange="App.v175SetPageSize('${escapeHtml(String(kind))}',this.value)"
      aria-label="${escapeHtml(label)}">
  </label>`;
}

v175EnsurePageSizes(S.settings||DEFAULT_SETTINGS);

// Personal Order now stores both "paginate?" and the requested page size.
const v175NormalizeOrderPlanBase=v138NormalizeOrderPlan;
v138NormalizeOrderPlan=function(plan,library,categories){
  const out=v175NormalizeOrderPlanBase(plan,library,categories);
  const src=(plan&&typeof plan==='object')?plan:{};

  out.orderedPageSize=v175ClampPageSize(
    src.orderedPageSize ?? out.orderedPageSize,
    50
  );

  return out;
};

function v175ResetPagingUI(kind){
  if(kind==='library'){
    S.libPage=0;
    return;
  }

  if(kind==='orderLibrary'){
    const ui=S.orderPlannerUI=S.orderPlannerUI||{};
    ui.page=0;
    return;
  }

  if(kind==='loggingLibrary'){
    V89_LOG.page=0;
    V89_LOG.pageSize=v175PageSize('loggingLibrary');
    return;
  }

  if(kind==='batchLibrary'){
    V175_BATCH_LIBRARY.pages={};
  }
}

function v175SetPageSize(kind,value){
  const key=String(kind||'');
  if(!Object.prototype.hasOwnProperty.call(V175_PAGE_SIZE_DEFAULTS,key))return;

  const cfg=v175EnsurePageSizes(S.settings||DEFAULT_SETTINGS);
  cfg[key]=v175ClampPageSize(
    value,
    V175_PAGE_SIZE_DEFAULTS[key]
  );
  cfg.modifiedAt=Date.now();

  v175ResetPagingUI(key);
  persistSettings();

  if(key==='orderLibrary'){
    try{v138RefreshPickerDOM();}catch(_){render();}
    return;
  }

  if(key==='loggingLibrary'){
    if(S.logging){
      try{renderLogSuggestions();}catch(_){render();}
    }else{
      render();
    }
    return;
  }

  if(key==='batchLibrary'){
    v175RefreshBatchLibraryUI();
    return;
  }

  render();
}

function v175SetOrderPageSize(value){
  const p=v138EnsureOrderPlan();
  p.orderedPageSize=v175ClampPageSize(value,50);

  const ui=v173OrderUI();
  ui.v173AllPage=0;
  ui.v173CategoryPages={};

  v138TouchOrderPlan();
  render();

  showToast(`Ordered titles: ${p.orderedPageSize.toLocaleString()} per page`);
}

Object.assign(App,{
  v175SetPageSize,
  v175SetOrderPageSize
});

/* ---------- Main Library page-size control ------------------- */

const v175RenderLibraryBase=renderLibrary;
renderLibrary=function(){
  let h=v175RenderLibraryBase();
  const control=v175PageSizeControlHtml('library','Titles per page');

  h=h.replace(
    /(<select onchange="App\.setLibFilter\('libPriority', this\.value\)">[\s\S]*?<\/select>)/,
    `$1${control}`
  );

  return h;
};

/* ---------- Order Library picker page-size control ------------ */

const v175OrderPickerToolsBase=v140OrderPickerToolsHtml;
v140OrderPickerToolsHtml=function(data){
  let h=v175OrderPickerToolsBase(data);

  const clear=`<button type="button" class="btn btn-sm btn-ghost v140-order-clear" onclick="App.v140OrderClearFilters()">Clear filters</button>`;
  if(h.includes(clear)){
    h=h.replace(
      clear,
      v175PageSizeControlHtml('orderLibrary','Per page')+clear
    );
  }

  return h;
};

/* ---------- Logging Library page-size control ----------------- */

const v175LogToolsBase=v89LogTools;
v89LogTools=function(candidates,pages){
  let h=v175LogToolsBase(candidates,pages);

  const clear=`<button type="button" class="btn btn-sm btn-ghost v87-log-clear" data-v89-action="clear">Clear filters</button>`;
  if(h.includes(clear)){
    h=h.replace(
      clear,
      v175PageSizeControlHtml('loggingLibrary','Per page')+clear
    );
  }

  return h;
};

/* ---------- Ordered-title pagination amount ------------------- */

const v175RenderOrderBase=renderOrder;
renderOrder=function(){
  let h=v175RenderOrderBase();
  const p=v138EnsureOrderPlan();

  const controls=`<div class="v175-order-pagination-settings">
    <label class="v173-order-pagination-toggle">
      <span>Paginate ordered titles</span>
      <button type="button"
        class="toggle ${p.paginateOrderedTitles?'on':''}"
        onclick="event.preventDefault();App.v173ToggleOrderPagination()"
        aria-label="Toggle ordered-title pagination"></button>
      <span>${p.paginateOrderedTitles?`${v175OrderPageSize().toLocaleString()}/page`:'Off'}</span>
    </label>

    <label class="v175-page-size-control">
      <span>Ordered titles per page</span>
      <input type="number" min="1" max="${V175_MAX_PAGE_SIZE}" step="1"
        value="${v175OrderPageSize()}"
        onchange="App.v175SetOrderPageSize(this.value)"
        aria-label="Ordered titles per page">
    </label>
  </div>`;

  h=h.replace(
    /<label class="v173-order-pagination-toggle">[\s\S]*?<\/label>/,
    controls
  );

  return h;
};

// Update v173 toggle implementation so its feedback uses the configured size.
v173ToggleOrderPagination=function(){
  const p=v138EnsureOrderPlan();
  p.paginateOrderedTitles=!p.paginateOrderedTitles;

  const ui=v173OrderUI();
  ui.v173AllPage=0;
  ui.v173CategoryPages={};

  v138TouchOrderPlan();
  render();

  showToast(
    p.paginateOrderedTitles
      ?`Ordered-title pagination enabled · ${v175OrderPageSize().toLocaleString()} per page`
      :'Ordered-title pagination disabled'
  );
};
App.v173ToggleOrderPagination=v173ToggleOrderPagination;

/* ---------- Dedicated Order export/import --------------------- */

const v175OrderExportPayloadBase=v142OrderExportPayload;
v142OrderExportPayload=function(){
  const payload=v175OrderExportPayloadBase();
  const p=v138EnsureOrderPlan();

  payload.formatVersion=Math.max(Number(payload.formatVersion)||1,3);
  payload.mediaFlowVersion=175;
  payload.orderPlan=payload.orderPlan||{};
  payload.orderPlan.paginateOrderedTitles=!!p.paginateOrderedTitles;
  payload.orderPlan.orderedPageSize=v175OrderPageSize();

  return payload;
};

const v175ImportOrderBase=v142ImportOrder;
v142ImportOrder=async function(file){
  let importedPageSize=null;

  try{
    if(file){
      const data=JSON.parse(await file.text());
      const raw=data?.orderPlan&&typeof data.orderPlan==='object'
        ?data.orderPlan
        :data;

      if(raw?.orderedPageSize!=null){
        importedPageSize=v175ClampPageSize(raw.orderedPageSize,50);
      }
    }
  }catch(_){}

  await v175ImportOrderBase(file);

  if(importedPageSize!==null){
    const p=v138EnsureOrderPlan();
    p.orderedPageSize=importedPageSize;
    v138TouchOrderPlan();

    const ui=v173OrderUI();
    ui.v173AllPage=0;
    ui.v173CategoryPages={};

    render();
  }
};
App.v142ImportOrder=v142ImportOrder;

/* ============================================================
   BATCH LOG — full Library browser filters
   ============================================================ */

const V175_BATCH_LIBRARY={
  categories:[],
  status:'all',
  priority:'all',
  sort:'relevance',
  pages:{},
  activeRow:-1
};

function v175NormalizeBatchLibraryState(){
  const st=V175_BATCH_LIBRARY;
  const validCats=new Set(
    (S.categories||[])
      .filter(c=>c?.id)
      .map(c=>String(c.id))
  );

  st.categories=Array.isArray(st.categories)
    ?[...new Set(st.categories.map(String).filter(id=>validCats.has(id)))]
    :[];

  st.status=['all','planned','active','paused','completed','dropped'].includes(
    String(st.status||'all').toLowerCase()
  )
    ?String(st.status||'all').toLowerCase()
    :'all';

  st.priority=['all','high','medium','low'].includes(
    String(st.priority||'all').toLowerCase()
  )
    ?String(st.priority||'all').toLowerCase()
    :'all';

  const sorts=new Set([
    'relevance',
    'priority-desc','priority-asc',
    'title-asc','title-desc',
    'rating-desc','rating-asc',
    'progress-desc','progress-asc',
    'total-desc','total-asc'
  ]);

  st.sort=sorts.has(String(st.sort||'relevance'))
    ?String(st.sort)
    :'relevance';

  if(!st.pages||typeof st.pages!=='object')st.pages={};

  return st;
}

function v175BatchLibraryMatches(query){
  const st=v175NormalizeBatchLibraryState();
  const q=String(query||'').trim().toLowerCase();

  let rows=(S.library||[]).filter(i=>i?.id);

  if(q){
    rows=rows.filter(item=>{
      const cat=getCategory(item.categoryId);
      return [
        cleanTitle(item.title),
        cat?.name||'',
        item.status||'',
        item.priority||'',
        item.source||'',
        item.year||'',
        ...(Array.isArray(item.tags)?item.tags:[])
      ].join(' ').toLowerCase().includes(q);
    });
  }

  if(st.categories.length){
    rows=rows.filter(
      item=>st.categories.includes(String(item.categoryId||''))
    );
  }

  if(st.status!=='all'){
    rows=rows.filter(
      item=>String(item.status||'planned').toLowerCase()===st.status
    );
  }

  if(st.priority!=='all'){
    rows=rows.filter(
      item=>String(item.priority||'medium').toLowerCase()===st.priority
    );
  }

  const rank={low:0,medium:1,high:2};
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const cmpTitle=(a,b)=>cleanTitle(a.title).localeCompare(
    cleanTitle(b.title),
    undefined,
    {numeric:true,sensitivity:'base'}
  );

  rows=rows.slice().sort((a,b)=>{
    let d=0;

    if(st.sort==='title-asc')return cmpTitle(a,b);
    if(st.sort==='title-desc')return cmpTitle(b,a);

    if(st.sort==='priority-desc'){
      d=(rank[String(b.priority||'medium').toLowerCase()]??1)-
        (rank[String(a.priority||'medium').toLowerCase()]??1);
    }else if(st.sort==='priority-asc'){
      d=(rank[String(a.priority||'medium').toLowerCase()]??1)-
        (rank[String(b.priority||'medium').toLowerCase()]??1);
    }else if(st.sort==='rating-desc'){
      d=num(b.rating)-num(a.rating);
    }else if(st.sort==='rating-asc'){
      d=num(a.rating)-num(b.rating);
    }else if(st.sort==='progress-desc'){
      d=num(b.progress)-num(a.progress);
    }else if(st.sort==='progress-asc'){
      d=num(a.progress)-num(b.progress);
    }else if(st.sort==='total-desc'){
      d=num(b.total)-num(a.total);
    }else if(st.sort==='total-asc'){
      d=num(a.total)-num(b.total);
    }else if(q){
      const at=cleanTitle(a.title).toLowerCase();
      const bt=cleanTitle(b.title).toLowerCase();
      const ar=at===q?0:at.startsWith(q)?1:at.includes(q)?2:3;
      const br=bt===q?0:bt.startsWith(q)?1:bt.includes(q)?2:3;
      const ai=at.includes(q)?at.indexOf(q):Number.MAX_SAFE_INTEGER;
      const bi=bt.includes(q)?bt.indexOf(q):Number.MAX_SAFE_INTEGER;
      d=ar-br||ai-bi;
    }

    return d||cmpTitle(a,b);
  });

  return rows;
}

// Replace the old "top 10 title contains query" helper with the complete
// Library-browser filter pipeline.
batchTitleCandidates=function(query){
  return v175BatchLibraryMatches(query);
};

function v175BatchLibraryToolsHtml(){
  const st=v175NormalizeBatchLibraryState();
  const cats=(S.categories||[]).filter(c=>c?.id);
  const catLabel=st.categories.length
    ?`${st.categories.length} categories selected`
    :'All categories';

  return `<div id="v175-batch-library-tools" class="card v175-batch-library-tools">
    <div class="section-label">BATCH LOG LIBRARY BROWSER</div>

    <div class="v140-order-filterbar">
      <details class="v66-cat-filter">
        <summary class="btn">${escapeHtml(catLabel)} ▾</summary>
        <div class="v66-cat-panel">
          <div class="v66-cat-head">
            <b>Show categories</b>
            <button type="button" class="btn btn-sm btn-ghost"
              onclick="App.v175BatchClearCategories(event)">All</button>
          </div>

          ${cats.map(c=>`<label class="v66-cat-option">
            <input type="checkbox"
              ${st.categories.includes(String(c.id))?'checked':''}
              onchange="App.v175BatchToggleCategory('${escapeHtml(String(c.id))}',this.checked)">
            <span>${v144CategoryIconHtml(c)} ${escapeHtml(c.name)}</span>
          </label>`).join('')}
        </div>
      </details>

      <select aria-label="Batch Log Library display order"
        onchange="App.v175BatchSetFilter('sort',this.value)">
        <option value="relevance" ${st.sort==='relevance'?'selected':''}>Best match</option>
        <option value="priority-desc" ${st.sort==='priority-desc'?'selected':''}>Priority: High → Low</option>
        <option value="priority-asc" ${st.sort==='priority-asc'?'selected':''}>Priority: Low → High</option>
        <option value="title-asc" ${st.sort==='title-asc'?'selected':''}>Title: A → Z</option>
        <option value="title-desc" ${st.sort==='title-desc'?'selected':''}>Title: Z → A</option>
        <option value="rating-desc" ${st.sort==='rating-desc'?'selected':''}>Rating: High → Low</option>
        <option value="rating-asc" ${st.sort==='rating-asc'?'selected':''}>Rating: Low → High</option>
        <option value="progress-desc" ${st.sort==='progress-desc'?'selected':''}>Progress: Most → Least</option>
        <option value="progress-asc" ${st.sort==='progress-asc'?'selected':''}>Progress: Least → Most</option>
        <option value="total-desc" ${st.sort==='total-desc'?'selected':''}>Total: Most → Least</option>
        <option value="total-asc" ${st.sort==='total-asc'?'selected':''}>Total: Least → Most</option>
      </select>

      <select aria-label="Batch Log Library title status"
        onchange="App.v175BatchSetFilter('status',this.value)">
        <option value="all" ${st.status==='all'?'selected':''}>All statuses</option>
        ${['planned','active','paused','completed','dropped'].map(x=>
          `<option value="${x}" ${st.status===x?'selected':''}>${v199StatusLabel(x)}</option>`
        ).join('')}
      </select>

      <select aria-label="Batch Log Library title priority"
        onchange="App.v175BatchSetFilter('priority',this.value)">
        <option value="all" ${st.priority==='all'?'selected':''}>All priorities</option>
        ${['high','medium','low'].map(x=>
          `<option value="${x}" ${st.priority===x?'selected':''}>${x[0].toUpperCase()+x.slice(1)}</option>`
        ).join('')}
      </select>

      ${v175PageSizeControlHtml('batchLibrary','Per page')}

      <button type="button" class="btn btn-sm btn-ghost"
        onclick="App.v175BatchClearFilters()">Clear filters</button>
    </div>

    <div class="v175-batch-browser-note">
      These filters apply to every Batch Log title search. Focus a title field with no text to browse the full Library, or type to search within the filtered results.
    </div>
  </div>`;
}

function v175BatchCurrentRow(){
  const i=Math.floor(Number(V175_BATCH_LIBRARY.activeRow));
  return Number.isFinite(i)&&i>=0?i:-1;
}

function v175RefreshBatchLibraryUI(rowIndex=v175BatchCurrentRow()){
  const tools=document.getElementById('v175-batch-library-tools');
  if(tools){
    tools.outerHTML=v175BatchLibraryToolsHtml();
  }

  document.querySelectorAll('.batch-suggestions').forEach(el=>{
    if(el.id!==`batch-suggestions-${rowIndex}`)el.innerHTML='';
  });

  if(rowIndex>=0){
    renderBatchSuggestions(rowIndex);
  }
}

function v175BatchSetFilter(key,value){
  const st=v175NormalizeBatchLibraryState();
  if(!['sort','status','priority'].includes(String(key)))return;

  st[key]=String(value||'all').toLowerCase();
  st.pages={};

  v175RefreshBatchLibraryUI();
}

function v175BatchToggleCategory(id,on){
  const st=v175NormalizeBatchLibraryState();
  const set=new Set(st.categories||[]);
  const sid=String(id||'');

  if(on)set.add(sid);
  else set.delete(sid);

  st.categories=[...set];
  st.pages={};

  v175RefreshBatchLibraryUI();
}

function v175BatchClearCategories(event){
  if(event){
    event.preventDefault();
    event.stopPropagation();
  }

  const st=v175NormalizeBatchLibraryState();
  st.categories=[];
  st.pages={};

  v175RefreshBatchLibraryUI();
}

function v175BatchClearFilters(){
  const st=v175NormalizeBatchLibraryState();
  st.categories=[];
  st.status='all';
  st.priority='all';
  st.sort='relevance';
  st.pages={};

  v175RefreshBatchLibraryUI();
}

function v175BatchSetPage(i,page){
  const st=v175NormalizeBatchLibraryState();
  const index=Math.max(0,Math.floor(Number(i)||0));

  st.activeRow=index;
  st.pages[index]=Math.max(0,Math.floor(Number(page)||0));

  renderBatchSuggestions(index);

  document.getElementById(`batch-suggestions-${index}`)?.scrollIntoView?.({
    behavior:'smooth',
    block:'nearest'
  });
}

function v175BatchPagerHtml(i,page,pages){
  if(pages<=1)return '';

  const count=Math.min(5,pages);
  let from=Math.max(0,page-2);
  if(from+count>pages)from=Math.max(0,pages-count);

  const nums=[];
  for(let n=from;n<Math.min(pages,from+count);n++){
    nums.push(`<button type="button"
      class="btn btn-sm ${n===page?'btn-primary':''}"
      onclick="App.v175BatchSetPage(${i},${n})">${n+1}</button>`);
  }

  return `<div class="v175-batch-pager">
    <button type="button" class="btn btn-sm btn-ghost"
      ${page===0?'disabled':''}
      onclick="App.v175BatchSetPage(${i},${page-1})">← Prev</button>
    ${nums.join('')}
    <button type="button" class="btn btn-sm btn-ghost"
      ${page>=pages-1?'disabled':''}
      onclick="App.v175BatchSetPage(${i},${page+1})">Next →</button>
  </div>`;
}

// Reset this row to page 1 when its search text changes.
updateBatchSearch=function(i,value){
  ensureBatchDraft();
  const r=S.batchDraft.rows[i];
  if(!r)return;

  r.query=String(value||'');

  if(r.libraryId){
    const selected=S.library.find(x=>x.id===r.libraryId);
    if(!selected||cleanTitle(selected.title)!==r.query){
      r.libraryId='';
    }
  }

  const st=v175NormalizeBatchLibraryState();
  st.activeRow=i;
  st.pages[i]=0;

  renderBatchSuggestions(i);
};

// Full filtered/paginated Batch Library browser.
renderBatchSuggestions=function(i){
  const box=document.getElementById(`batch-suggestions-${i}`);
  if(!box)return;

  ensureBatchDraft();
  const r=S.batchDraft.rows[i];
  if(!r)return;

  const st=v175NormalizeBatchLibraryState();
  st.activeRow=i;

  if(r.libraryId){
    box.innerHTML='';
    return;
  }

  const q=String(r.query||'').trim();
  const candidates=v175BatchLibraryMatches(q);
  const pageSize=v175PageSize('batchLibrary');
  const pages=Math.max(1,Math.ceil(candidates.length/pageSize));
  let page=Math.max(0,Math.floor(Number(st.pages[i])||0));
  page=Math.min(page,pages-1);
  st.pages[i]=page;

  const start=page*pageSize;
  const rows=candidates.slice(start,start+pageSize);

  if(!rows.length){
    box.innerHTML=`<div class="v175-batch-matchline">
        <span>0 matches · Page 1/1</span>
      </div>
      <div class="batch-search-empty">No Library titles match the current search and filters.</div>`;
    return;
  }

  const list=`<div class="log-suggestion-list">${
    rows.map(item=>{
      const cat=getCategory(item.categoryId);
      const progress=item.total!=null
        ?`${Number(item.progress)||0}/${item.total}`
        :'progress unknown';
      const rating=Number(item.rating)>0
        ?`★ ${Number(item.rating).toFixed(1)}`
        :'Unrated';
      const cover=item.coverUrl
        ?`<img class="v86-log-cover" src="${escapeHtml(item.coverUrl)}" alt="" loading="lazy" onerror="this.style.display='none'">`
        :'';

      return `<div class="log-suggestion">
        <div class="v86-log-result">
          ${cover}
          <div>
            <b>${escapeHtml(cleanTitle(item.title))}</b>
            <small class="v175-batch-result-meta">
              <span>${v144CategoryIconHtml(cat)} ${escapeHtml(cat?.name||'Library')}</span>
              <span>${escapeHtml(v199StatusLabel(item.status))}</span>
              <span>${escapeHtml(item.priority||'medium')} priority</span>
              <span>${escapeHtml(progress)}</span>
              <span>${escapeHtml(rating)}</span>
            </small>
          </div>
        </div>

        <div class="v175-batch-result-actions">
          <button class="btn btn-sm btn-ghost" type="button"
            onclick="App.openLibraryModal('${escapeHtml(String(item.id))}')">Edit</button>
          <button class="btn btn-sm btn-primary" type="button"
            onclick="App.selectBatchTitle(${i},'${escapeHtml(String(item.id))}')">Use</button>
        </div>
      </div>`;
    }).join('')
  }</div>`;

  box.innerHTML=`<div class="v175-batch-matchline">
      <span>${candidates.length.toLocaleString()} match${candidates.length===1?'':'es'}</span>
      <span>Page ${page+1}/${pages} · ${pageSize.toLocaleString()} per page</span>
    </div>
    ${list}
    ${v175BatchPagerHtml(i,page,pages)}`;
};

// Add the shared filter toolset to Batch Log and make blank title fields browse.
const v175RenderBatchLogBase=renderBatchLog;
renderBatchLog=function(){
  let h=v175RenderBatchLogBase();

  h=h.replace(
    'Type to search your entire Library…',
    'Search or browse your Library…'
  );

  h=h.replace(
    '<div class="batch-log-list">',
    `${v175BatchLibraryToolsHtml()}<div class="batch-log-list">`
  );

  return h;
};

// Keep Batch row page-state aligned when rows are removed.
const v175RemoveBatchRowBase=removeBatchRow;
removeBatchRow=function(i){
  V175_BATCH_LIBRARY.pages={};
  V175_BATCH_LIBRARY.activeRow=-1;
  return v175RemoveBatchRowBase(i);
};

Object.assign(App,{
  updateBatchSearch,
  renderBatchSuggestions,
  removeBatchRow,
  v175BatchSetFilter,
  v175BatchToggleCategory,
  v175BatchClearCategories,
  v175BatchClearFilters,
  v175BatchSetPage
});

/* ============================================================
   v175 persistence / merge / Sync Now / backup
   ============================================================ */

const v175PersistSettingsBase=persistSettings;
persistSettings=function(){
  v175EnsurePageSizes(S.settings||DEFAULT_SETTINGS);
  return v175PersistSettingsBase.apply(this,arguments);
};

const v175LoadAllBase=loadAll;
loadAll=async function(){
  await v175LoadAllBase.apply(this,arguments);

  v175EnsurePageSizes(S.settings||DEFAULT_SETTINGS);
  S.orderPlan=v138NormalizeOrderPlan(
    S.orderPlan,
    S.library,
    S.categories
  );
};

const v175SnapshotBase=snapshot;
snapshot=function(){
  v175EnsurePageSizes(S.settings||DEFAULT_SETTINGS);
  S.orderPlan=v138NormalizeOrderPlan(
    S.orderPlan,
    S.library,
    S.categories
  );

  const x=v175SnapshotBase();

  x.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  x.orderPlan=JSON.parse(JSON.stringify(S.orderPlan||{}));
  x.cloudSyncVersion=Math.max(Number(x.cloudSyncVersion)||0,175);

  return x;
};

const v175ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v175ApplyStateBase.apply(this,arguments);

  v175EnsurePageSizes(S.settings||DEFAULT_SETTINGS);
  S.orderPlan=v138NormalizeOrderPlan(
    d?.orderPlan,
    S.library,
    S.categories
  );

  V89_LOG.page=0;
  V89_LOG.pageSize=v175PageSize('loggingLibrary');
  V175_BATCH_LIBRARY.pages={};
  V175_BATCH_LIBRARY.activeRow=-1;

  return result;
};

const v175MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v175MergeStatesBase(a,b)||{};

  const ac=v175NormalizePageSizes(a?.settings?.v175PageSizes);
  const bc=v175NormalizePageSizes(b?.settings?.v175PageSizes);
  const chosen=(Number(ac.modifiedAt)||0)>=(Number(bc.modifiedAt)||0)
    ?ac
    :bc;

  out.settings=out.settings||{};
  out.settings.v175PageSizes=chosen;

  out.orderPlan=v138NormalizeOrderPlan(
    out.orderPlan,
    out.library||S.library,
    out.categories||S.categories
  );

  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    175
  );

  return out;
};

const v175VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v175VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

  const cloudSizes=v175NormalizePageSizes(
    cloudState?.settings?.v175PageSizes
  );
  const wantedSizes=v175NormalizePageSizes(
    expected?.settings?.v175PageSizes
  );

  if(JSON.stringify(cloudSizes)!==JSON.stringify(wantedSizes)){
    problems.push('Library pagination sizes');
  }

  const cloudOrder=v138NormalizeOrderPlan(
    cloudState?.orderPlan,
    cloudState?.library||[],
    cloudState?.categories||[]
  );
  const wantedOrder=v138NormalizeOrderPlan(
    expected?.orderPlan,
    expected?.library||[],
    expected?.categories||[]
  );

  if(
    Number(cloudOrder.orderedPageSize)!==
    Number(wantedOrder.orderedPageSize)
  ){
    problems.push('Ordered-title page size');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

const v175BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v175EnsurePageSizes(S.settings||DEFAULT_SETTINGS);
  S.orderPlan=v138NormalizeOrderPlan(
    S.orderPlan,
    S.library,
    S.categories
  );

  const payload=v175BuildFullBackupBase();

  payload.backupSchemaVersion=V175_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  payload.orderPlan=JSON.parse(JSON.stringify(S.orderPlan||{}));

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V175_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v175 backup. Includes configurable pagination sizes for main Library, Order Library picker, Logging Library picker, Batch Log Library browser, and ordered Personal Order titles; plus all prior category recovery, advanced import routing/exclusions, Old System Date View, adaptive cover collections, System Respect XP, Personal Order, Library/History, Rating Queue and portable preferences. Batch filter selections themselves are temporary UI state; their persistent page-size preference is included. Authentication credentials and filesystem permission handles remain intentionally non-portable.';

  return payload;
};

const v175BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v175BackupManifestBase(state,extras);
  const sizes=v175NormalizePageSizes(
    state?.settings?.v175PageSizes
  );
  const order=v138NormalizeOrderPlan(
    state?.orderPlan,
    state?.library||[],
    state?.categories||[]
  );

  manifest.schemaVersion=V175_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{},{
    configurableLibraryPagination:true,
    mainLibraryPageSize:true,
    orderLibraryPageSize:true,
    loggingLibraryPageSize:true,
    batchLibraryPageSize:true,
    orderedTitlesPageSize:true,
    batchLogFullLibraryFilters:true
  });

  manifest.pagination=Object.assign({},manifest.pagination||{},{
    library:sizes.library,
    orderLibrary:sizes.orderLibrary,
    loggingLibrary:sizes.loggingLibrary,
    batchLibrary:sizes.batchLibrary,
    orderedTitles:Number(order.orderedPageSize)||50
  });

  return manifest;
};

// v152 Automatic Backup resolves the final v148BuildFullBackup() at runtime,
// therefore every persistent v175 pagination setting is included automatically.


/* ============================================================
   MediaFlow v176 — Dense Library Rows + Rich Imported Metadata
   ------------------------------------------------------------
   Library rows/cards now use the cover area efficiently instead of leaving
   large empty surfaces. When an import provides richer media metadata, v176
   keeps and displays it without inventing missing values.
   ============================================================ */

const V176_BACKUP_SCHEMA_VERSION=13;
const V176_RICH_FIELDS=[
  'mediaFormat','synopsis','genres','themes','studios','producers',
  'mediaSource','demographic','durationMinutes','ageRating',
  'releaseDate','seasonLabel','communityScore'
];

function v176SafeText(value,max=5000){
  if(value==null)return '';
  let s=String(value)
    .replace(/<br\s*\/?>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;/gi,' ')
    .replace(/\s+/g,' ')
    .trim();
  if(s.length>max)s=s.slice(0,max).trim();
  return s;
}

function v176SourceObjects(raw){
  const out=[];
  const seen=new Set();

  const add=obj=>{
    if(!obj||typeof obj!=='object'||Array.isArray(obj)||seen.has(obj))return;
    seen.add(obj);
    out.push(obj);
  };

  for(const obj of v158NestedObjects(raw))add(obj);

  for(const key of [
    'metadata','attributes','details','info','information',
    'aired','broadcast','release','production','user_data','userData'
  ]){
    add(raw?.[key]);
    for(const parent of out.slice(0,12))add(parent?.[key]);
  }

  return out;
}

function v176Key(value){
  return String(value||'')
    .toLowerCase()
    .replace(/[^a-z0-9]/g,'');
}

function v176FindValue(raw,names){
  const wanted=new Set(names.map(v176Key));

  for(const obj of v176SourceObjects(raw)){
    for(const [key,value] of Object.entries(obj)){
      if(
        wanted.has(v176Key(key)) &&
        value!=null &&
        !(typeof value==='string'&&value.trim()==='')
      ){
        return value;
      }
    }
  }

  return null;
}function v176List(value){
  if(value==null)return [];

  if(typeof value==='string'){
    const s=value.trim();
    if(!s)return [];

    if((s.startsWith('[')&&s.endsWith(']'))||(s.startsWith('{')&&s.endsWith('}'))){
      try{return v176List(JSON.parse(s));}catch(_){}
    }

    return [...new Set(
      s.split(/\s*(?:,|;|\||\/)\s*/)
        .map(x=>v176SafeText(x,120))
        .filter(Boolean)
    )].slice(0,40);
  }

  if(Array.isArray(value)){
    const rows=[];
    for(const entry of value){
      if(typeof entry==='string'||typeof entry==='number'){
        rows.push(v176SafeText(entry,120));
      }else if(entry&&typeof entry==='object'){
        const name=
          entry.name ??
          entry.title ??
          entry.label ??
          entry.value ??
          entry.text;
        if(name!=null)rows.push(v176SafeText(name,120));
      }
    }
    return [...new Set(rows.filter(Boolean))].slice(0,40);
  }

  if(typeof value==='object'){
    const direct=
      value.name ??
      value.title ??
      value.label ??
      value.value ??
      value.text;
    if(direct!=null)return v176List(direct);

    for(const key of ['data','items','results','nodes','edges']){
      if(value[key]!=null)return v176List(value[key]);
    }
  }

  return [];
}

function v176DurationMinutes(value){
  if(value==null||value==='')return null;

  if(typeof value==='number'&&Number.isFinite(value)){
    return value>0?Math.round(value):null;
  }

  const s=String(value).toLowerCase().trim();
  if(!s)return null;

  const hr=Number((s.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)/)||[])[1])||0;
  const min=Number((s.match(/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)/)||[])[1])||0;

  if(hr||min)return Math.max(1,Math.round(hr*60+min));

  const n=Number((s.match(/\d+(?:\.\d+)?/)||[])[0]);
  return Number.isFinite(n)&&n>0?Math.round(n):null;
}

function v176DateValue(value){
  if(value==null)return '';

  if(value&&typeof value==='object'){
    value=value.from??value.start??value.date??value.value??'';
  }

  const raw=String(value||'').trim();
  if(!raw)return '';

  const iso=raw.match(/(\d{4}-\d{2}-\d{2})/);
  if(iso)return iso[1];

  const ts=Date.parse(raw);
  if(!Number.isFinite(ts))return '';

  return new Date(ts).toISOString().slice(0,10);
}

function v176CommunityScore(value){
  const n=Number(value);
  if(!Number.isFinite(n)||n<=0)return null;

  // Preserve a native 0–10 value; common 0–100 APIs are normalized to 0–10.
  return Math.round((n>10?n/10:n)*100)/100;
}

function v176ExtractRichMetadata(raw,service){
  const format=v176SafeText(v176FindValue(raw,[
    'media_format','mediaFormat','format','series_type','anime_type',
    'manga_type','title_type','show_type','movie_type','content_type','kind'
  ]),80);

  const synopsis=v176SafeText(v176FindValue(raw,[
    'synopsis','description','overview','summary','plot','storyline','about'
  ]),6000);

  const genres=v176List(v176FindValue(raw,[
    'genres','genre','genre_names','genreNames'
  ]));

  const themes=v176List(v176FindValue(raw,[
    'themes','theme','theme_names','themeNames'
  ]));

  const studios=v176List(v176FindValue(raw,[
    'studios','studio','studio_names','studioNames',
    'production_companies','productionCompanies',
    'networks','network'
  ]));

  const producers=v176List(v176FindValue(raw,[
    'producers','producer','production','production_names','productionNames'
  ]));

  let mediaSource=v176SafeText(v176FindValue(raw,[
    'source_material','sourceMaterial','source_type','sourceType',
    'original_source','originalSource','media_source','mediaSource'
  ]),120);

  // Some anime-oriented exports use a plain "source" field for source material.
  // Accept it only when it does not simply repeat the exchange provider.
  if(!mediaSource){
    const generic=v176SafeText(v176FindValue(raw,['source']),120);
    if(
      generic &&
      v176Key(generic)!==v176Key(service) &&
      v176Key(generic)!==v176Key(mfServiceName(service)) &&
      !/^mediaflow$/i.test(generic)
    ){
      mediaSource=generic;
    }
  }

  const demographicList=v176List(v176FindValue(raw,[
    'demographics','demographic','target_demographic','targetDemographic','audience'
  ]));
  const demographic=demographicList.join(', ');

  const durationMinutes=v176DurationMinutes(v176FindValue(raw,[
    'duration_minutes','durationMinutes','runtime_minutes','runtimeMinutes',
    'runtime','episode_duration','episodeDuration','duration'
  ]));

  const ageRating=v176SafeText(v176FindValue(raw,[
    'content_rating','contentRating','age_rating','ageRating',
    'certification','mpaa_rating','mpaaRating','rating_classification'
  ]),80);

  const releaseDate=v176DateValue(v176FindValue(raw,[
    'release_date','releaseDate','released_at','releasedAt',
    'premiered','first_air_date','firstAirDate','air_date','airDate'
  ]));

  let seasonLabel=v176SafeText(v176FindValue(raw,[
    'season_name','seasonName','season_label','seasonLabel','season'
  ]),80);
  const seasonYear=v176SafeText(v176FindValue(raw,[
    'season_year','seasonYear'
  ]),10);
  if(seasonLabel&&seasonYear&&!seasonLabel.includes(seasonYear)){
    seasonLabel=`${seasonLabel} ${seasonYear}`;
  }

  const communityScore=v176CommunityScore(v176FindValue(raw,[
    'community_score','communityScore','average_score','averageScore',
    'mean_score','meanScore','score_average','scoreAverage',
    'imdb_rating','imdbRating','tmdb_rating','tmdbRating'
  ]));

  return {
    mediaFormat:format||'',
    synopsis:synopsis||'',
    genres,
    themes,
    studios,
    producers,
    mediaSource:mediaSource||'',
    demographic:demographic||'',
    durationMinutes,
    ageRating:ageRating||'',
    releaseDate:releaseDate||'',
    seasonLabel:seasonLabel||'',
    communityScore
  };
}

function v176HasRichMetadata(meta){
  if(!meta||typeof meta!=='object')return false;
  return V176_RICH_FIELDS.some(key=>{
    const v=meta[key];
    return Array.isArray(v)?v.length>0:(v!=null&&v!=='');
  });
}

// FINAL v158 normalizer — all existing service/type/date/cover logic remains
// authoritative, then v176 opportunistically adds metadata actually present.
const v176NormalizeRecordBase=v158NormalizeRecord;
v158NormalizeRecord=function(raw,service){
  const record=v176NormalizeRecordBase(raw,service);
  if(!record)return record;

  const rich=v176ExtractRichMetadata(raw,service);
  if(v176HasRichMetadata(rich)){
    record.richMetadata=rich;
  }

  return record;
};

function v176MergeListValues(a,b){
  return [...new Set([
    ...(Array.isArray(a)?a:[]),
    ...(Array.isArray(b)?b:[])
  ].map(x=>v176SafeText(x,120)).filter(Boolean))].slice(0,40);
}

function v176ApplyRichMetadata(item,meta){
  if(!item||!meta||typeof meta!=='object')return false;
  let changed=false;

  for(const key of ['genres','themes','studios','producers']){
    const merged=v176MergeListValues(item[key],meta[key]);
    if(JSON.stringify(merged)!==JSON.stringify(Array.isArray(item[key])?item[key]:[])){
      item[key]=merged;
      changed=true;
    }
  }

  for(const key of [
    'mediaFormat','synopsis','mediaSource','demographic',
    'ageRating','releaseDate','seasonLabel'
  ]){
    const value=v176SafeText(meta[key],key==='synopsis'?6000:160);
    if(value&&value!==String(item[key]||'')){
      item[key]=value;
      changed=true;
    }
  }

  for(const key of ['durationMinutes','communityScore']){
    const value=Number(meta[key]);
    if(Number.isFinite(value)&&value>0&&Number(item[key])!==value){
      item[key]=value;
      changed=true;
    }
  }

  return changed;
}

// FINAL v158 apply — lets Standard Import and Advanced Import use the same rich
// metadata path, with no second Library scan.
const v176ApplyNormalizedRecordBase=v158ApplyNormalizedRecord;
v158ApplyNormalizedRecord=function(record,service,index,touched){
  const result=v176ApplyNormalizedRecordBase(
    record,
    service,
    index,
    touched
  );

  if(
    result==='skipped' ||
    !record?.richMetadata
  ){
    return result;
  }

  const item=v158FindImportItem(record,index);
  if(item&&v176ApplyRichMetadata(item,record.richMetadata)){
    item.modifiedAt=Date.now();
    touched?.set(String(item.id),item);
    index?.add?.(item);
  }

  return result;
};

/* ---------- Rich Library row presentation -------------------- */

function v176FmtDate(value){
  if(!value)return '';
  const ts=typeof value==='number'?value:Date.parse(value);
  if(!Number.isFinite(ts))return '';
  return new Date(ts).toLocaleDateString(undefined,{
    year:'numeric',
    month:'short',
    day:'numeric'
  });
}

function v176ShortList(value,limit=4){
  const rows=Array.isArray(value)?value.filter(Boolean):[];
  if(!rows.length)return '';
  const shown=rows.slice(0,limit);
  return shown.join(', ')+(rows.length>limit?` +${rows.length-limit}`:'');
}

function v176LibraryInfoHtml(item){
  if(!item)return '';

  const facts=[];
  const detail=[];

  const year=Number(item.year)||0;
  if(year)facts.push(`<span class="v176-library-fact"><b>${year}</b></span>`);

  if(item.mediaFormat){
    facts.push(`<span class="v176-library-fact"><b>${escapeHtml(String(item.mediaFormat))}</b></span>`);
  }

  if(Number(item.durationMinutes)>0){
    facts.push(`<span class="v176-library-fact">${Number(item.durationMinutes).toLocaleString()} min</span>`);
  }else if(Number(item.estimatedMinutes)>0){
    facts.push(`<span class="v176-library-fact">Est. ${Number(item.estimatedMinutes).toLocaleString()} min</span>`);
  }

  if(item.ageRating){
    facts.push(`<span class="v176-library-fact">${escapeHtml(String(item.ageRating))}</span>`);
  }

  if(Number(item.communityScore)>0){
    facts.push(`<span class="v176-library-fact">Community ★ ${Number(item.communityScore).toFixed(2).replace(/\.?0+$/,'')}</span>`);
  }

  if(item.seasonLabel){
    facts.push(`<span class="v176-library-fact">${escapeHtml(String(item.seasonLabel))}</span>`);
  }

  const studios=v176ShortList(item.studios,3);
  if(studios){
    detail.push(`<div class="v176-library-detail"><b>Studio:</b> ${escapeHtml(studios)}</div>`);
  }

  if(item.mediaSource){
    detail.push(`<div class="v176-library-detail"><b>Source:</b> ${escapeHtml(String(item.mediaSource))}</div>`);
  }

  const genres=v176ShortList(item.genres,5);
  if(genres){
    detail.push(`<div class="v176-library-detail"><b>Genres:</b> ${escapeHtml(genres)}</div>`);
  }

  const themes=v176ShortList(item.themes,4);
  if(themes){
    detail.push(`<div class="v176-library-detail"><b>Themes:</b> ${escapeHtml(themes)}</div>`);
  }

  if(item.demographic){
    detail.push(`<div class="v176-library-detail"><b>Demographic:</b> ${escapeHtml(String(item.demographic))}</div>`);
  }

  const producers=v176ShortList(item.producers,3);
  if(producers){
    detail.push(`<div class="v176-library-detail"><b>Producer:</b> ${escapeHtml(producers)}</div>`);
  }

  const lifecycle=[];
  const release=v176FmtDate(item.releaseDate);
  if(release)lifecycle.push(`Released ${release}`);

  const started=v176FmtDate(Number(item.startedAt)||0);
  if(started)lifecycle.push(`Started ${started}`);

  const finished=v176FmtDate(Number(item.completedAt)||0);
  if(finished)lifecycle.push(`Finished ${finished}`);

  if(item.source){
    lifecycle.push(`Source: ${mfServiceName(String(item.source))||String(item.source)}`);
  }

  const ext=item.externalIds||{};
  const idLabel=
    ext.mal?`MAL #${ext.mal}`:
    ext.anilist?`AniList #${ext.anilist}`:
    ext.simkl?`Simkl #${ext.simkl}`:
    ext.imdb?`IMDb ${ext.imdb}`:
    '';
  if(idLabel)lifecycle.push(idLabel);

  const synopsis=v176SafeText(item.synopsis,6000);

  if(
    !facts.length &&
    !detail.length &&
    !lifecycle.length &&
    !synopsis
  ){
    return '';
  }

  return `${facts.length?`<div class="v176-library-facts">${facts.join('')}</div>`:''}
    ${detail.length?`<div class="v176-library-detail-lines">${detail.join('')}</div>`:''}
    ${synopsis?`<div class="v176-library-synopsis" title="${escapeHtml(synopsis)}">${escapeHtml(synopsis)}</div>`:''}
    ${lifecycle.length?`<div class="v176-library-source-line">${lifecycle.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div>`:''}`;
}

/* ---------- Cloud merge preservation ------------------------- */

const v176MergeLibraryItemBase=v84MergeLibraryItem;
v84MergeLibraryItem=function(left,right){
  const out=v176MergeLibraryItemBase(left,right);
  if(!out)return out;

  for(const key of ['genres','themes','studios','producers']){
    out[key]=v176MergeListValues(left?.[key],right?.[key]);
  }

  const lm=Number(left?.modifiedAt)||0;
  const rm=Number(right?.modifiedAt)||0;
  const newer=rm>lm?right:left;
  const older=rm>lm?left:right;

  for(const key of [
    'mediaFormat','synopsis','mediaSource','demographic',
    'ageRating','releaseDate','seasonLabel'
  ]){
    const nv=v176SafeText(newer?.[key],key==='synopsis'?6000:160);
    const ov=v176SafeText(older?.[key],key==='synopsis'?6000:160);
    out[key]=nv||ov||'';
  }

  for(const key of ['durationMinutes','communityScore']){
    const nv=Number(newer?.[key]);
    const ov=Number(older?.[key]);
    out[key]=Number.isFinite(nv)&&nv>0
      ?nv
      :(Number.isFinite(ov)&&ov>0?ov:null);
  }

  return out;
};

/* ---------- Media-service exchange export -------------------- */

const v176ExchangeRowsBase=mfExchangeRows;
mfExchangeRows=function(){
  const base=v176ExchangeRowsBase();

  return base.map((row,index)=>{
    const item=S.library[index]||{};

    return Object.assign({},row,{
      format:item.mediaFormat||'',
      synopsis:item.synopsis||'',
      genres:Array.isArray(item.genres)?item.genres.join('; '):'',
      themes:Array.isArray(item.themes)?item.themes.join('; '):'',
      studios:Array.isArray(item.studios)?item.studios.join('; '):'',
      producers:Array.isArray(item.producers)?item.producers.join('; '):'',
      source_material:item.mediaSource||'',
      demographic:item.demographic||'',
      duration_minutes:item.durationMinutes??'',
      content_rating:item.ageRating||'',
      release_date:item.releaseDate||'',
      season:item.seasonLabel||'',
      community_score:item.communityScore??''
    });
  });
};

/* ---------- Sync verification ------------------------------- */

function v176Fnv(text){
  let h=2166136261>>>0;
  const s=String(text||'');

  for(let i=0;i<s.length;i++){
    h^=s.charCodeAt(i);
    h=Math.imul(h,16777619)>>>0;
  }

  return h>>>0;
}

function v176LibraryMetadataAudit(state){
  let count=0;
  let xor=0;
  let sum=0;

  for(const item of (Array.isArray(state?.library)?state.library:[])){
    const payload={
      id:String(item?.id||''),
      mediaFormat:item?.mediaFormat||'',
      synopsis:item?.synopsis||'',
      genres:Array.isArray(item?.genres)?item.genres:[],
      themes:Array.isArray(item?.themes)?item.themes:[],
      studios:Array.isArray(item?.studios)?item.studios:[],
      producers:Array.isArray(item?.producers)?item.producers:[],
      mediaSource:item?.mediaSource||'',
      demographic:item?.demographic||'',
      durationMinutes:Number(item?.durationMinutes)||0,
      ageRating:item?.ageRating||'',
      releaseDate:item?.releaseDate||'',
      seasonLabel:item?.seasonLabel||'',
      communityScore:Number(item?.communityScore)||0
    };

    if(!v176HasRichMetadata(payload))continue;

    const hash=v176Fnv(JSON.stringify(payload));
    count++;
    xor=(xor^hash)>>>0;
    sum=(sum+hash)>>>0;
  }

  return {count,xor,sum};
}

const v176VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v176VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

  const cloud=v176LibraryMetadataAudit(cloudState);
  const wanted=v176LibraryMetadataAudit(expected);

  if(
    cloud.count!==wanted.count ||
    cloud.xor!==wanted.xor ||
    cloud.sum!==wanted.sum
  ){
    problems.push('Rich Library metadata');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

/* ---------- Full Backup / Automatic Backup ------------------- */

const v176BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v176BuildFullBackupBase();

  payload.backupSchemaVersion=V176_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V176_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v176 backup. Library title records may include source-provided rich metadata such as synopsis, format, genres, themes, studios, producers, source material, demographic, runtime, content rating, release date, season and community score. These fields are preserved by cloud merge, protected Sync Now verification, Full Backup, Automatic Backup and generic media-service JSON/CSV exchange export/import. No missing metadata is invented.';

  return payload;
};

const v176BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v176BackupManifestBase(state,extras);
  const audit=v176LibraryMetadataAudit(state);

  manifest.schemaVersion=V176_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{},{
    richLibraryMetadata:true,
    importedSynopsis:true,
    importedGenresThemes:true,
    importedStudiosProducers:true,
    importedSourceMaterial:true,
    importedDemographics:true,
    importedRuntimeAndFormat:true,
    importedReleaseMetadata:true
  });

  manifest.counts=Object.assign({},manifest.counts||{},{
    titlesWithRichMetadata:audit.count
  });

  return manifest;
};

// v152 Automatic Backup resolves the final builder at call time, so v176 rich
// title metadata is automatically included.
