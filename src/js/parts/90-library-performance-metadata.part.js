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



/* ============================================================
   MediaFlow v177 — Adjustable Library & Order Cover Size
   ============================================================ */

const V177_BACKUP_SCHEMA_VERSION=14;
const V177_COVER_SIZE_DEFAULTS={
  library:100,
  order:100,
  modifiedAt:0
};

function v177ClampCoverSize(value,fallback=100){
  const n=Math.round(Number(value));
  if(!Number.isFinite(n)){
    return Math.max(50,Math.min(180,Math.round(Number(fallback)||100)));
  }
  return Math.max(50,Math.min(180,n));
}

function v177NormalizeCoverSizes(raw){
  const src=(raw&&typeof raw==='object')?raw:{};

  return {
    library:v177ClampCoverSize(
      src.library,
      V177_COVER_SIZE_DEFAULTS.library
    ),
    order:v177ClampCoverSize(
      src.order,
      V177_COVER_SIZE_DEFAULTS.order
    ),
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v177EnsureCoverSizes(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.v177CoverSizes=v177NormalizeCoverSizes(
    settings.v177CoverSizes
  );
  return settings.v177CoverSizes;
}

function v177CoverSize(kind){
  const cfg=v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  return kind==='order'?cfg.order:cfg.library;
}

function v177ScaleValue(kind){
  return (v177CoverSize(kind)/100).toFixed(2);
}

function v177CoverSliderHtml(kind,label){
  const value=v177CoverSize(kind);
  const safeKind=kind==='order'?'order':'library';

  return `<label class="v177-cover-size-control">
    <span>${escapeHtml(label)}</span>
    <input type="range"
      min="50"
      max="180"
      step="5"
      value="${value}"
      oninput="App.v177PreviewCoverSize('${safeKind}',this.value)"
      onchange="App.v177SetCoverSize('${safeKind}',this.value)"
      aria-label="${escapeHtml(label)}">
    <span id="v177-${safeKind}-cover-value"
      class="v177-cover-size-value">${value}%</span>
  </label>`;
}

function v177PreviewCoverSize(kind,value){
  const safeKind=kind==='order'?'order':'library';
  const pct=v177ClampCoverSize(value,100);
  const scale=(pct/100).toFixed(2);

  const scope=document.querySelector(
    `[data-v177-cover-scope="${safeKind}"]`
  );

  if(scope){
    scope.style.setProperty(
      safeKind==='order'
        ?'--v177-order-scale'
        :'--v177-library-scale',
      scale
    );
  }

  const label=document.getElementById(
    `v177-${safeKind}-cover-value`
  );
  if(label)label.textContent=`${pct}%`;
}

function v177SetCoverSize(kind,value){
  const safeKind=kind==='order'?'order':'library';
  const cfg=v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);

  cfg[safeKind]=v177ClampCoverSize(value,100);
  cfg.modifiedAt=Date.now();

  persistSettings();

  // Keep the live preview instant; no heavy Library rerender is required just
  // to move the slider. A normal navigation/render will read the saved value.
  v177PreviewCoverSize(safeKind,cfg[safeKind]);
}

v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);

Object.assign(App,{
  v177PreviewCoverSize,
  v177SetCoverSize
});

/* ---------- Library slider ----------------------------------- */

const v177RenderLibraryBase=renderLibrary;
renderLibrary=function(){
  let h=v177RenderLibraryBase();
  const slider=v177CoverSliderHtml(
    'library',
    'Cover size'
  );

  const pageControl=v175PageSizeControlHtml(
    'library',
    'Titles per page'
  );

  if(h.includes(pageControl)){
    h=h.replace(
      pageControl,
      pageControl+slider
    );
  }else{
    // Fallback: place it next to the priority filter if a future build changes
    // the page-size control's exact markup.
    h=h.replace(
      /(<select onchange="App\.setLibFilter\('libPriority', this\.value\)">[\s\S]*?<\/select>)/,
      `$1${slider}`
    );
  }

  return `<div class="v177-library-cover-scope"
    data-v177-cover-scope="library"
    style="--v177-library-scale:${v177ScaleValue('library')}">
      ${h}
    </div>`;
};

/* ---------- Order slider ------------------------------------- */

const v177RenderOrderBase=renderOrder;
renderOrder=function(){
  let h=v177RenderOrderBase();

  const slider=`<div class="v177-order-cover-tools">
    ${v177CoverSliderHtml('order','Cover size')}
  </div>`;

  if(h.includes('class="v175-order-pagination-settings"')){
    h=h.replace(
      /(<div class="v175-order-pagination-settings">[\s\S]*?<\/div>)/,
      `$1${slider}`
    );
  }else{
    h=h.replace(
      /(<div class="v138-order-switch">[\s\S]*?<\/div>)/,
      `$1${slider}`
    );
  }

  return `<div class="v177-order-cover-scope"
    data-v177-cover-scope="order"
    style="--v177-order-scale:${v177ScaleValue('order')}">
      ${h}
    </div>`;
};

/* ============================================================
   Persistence / cloud / Sync Now / backup
   ============================================================ */

const v177PersistSettingsBase=persistSettings;
persistSettings=function(){
  v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  return v177PersistSettingsBase.apply(this,arguments);
};

const v177LoadAllBase=loadAll;
loadAll=async function(){
  await v177LoadAllBase.apply(this,arguments);
  v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
};

const v177SnapshotBase=snapshot;
snapshot=function(){
  v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  const x=v177SnapshotBase();

  x.settings=JSON.parse(
    JSON.stringify(S.settings||DEFAULT_SETTINGS)
  );
  x.cloudSyncVersion=Math.max(
    Number(x.cloudSyncVersion)||0,
    177
  );

  return x;
};

const v177ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v177ApplyStateBase.apply(this,arguments);
  v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  return result;
};

const v177MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v177MergeStatesBase(a,b)||{};

  const ac=v177NormalizeCoverSizes(
    a?.settings?.v177CoverSizes
  );
  const bc=v177NormalizeCoverSizes(
    b?.settings?.v177CoverSizes
  );

  out.settings=out.settings||{};
  out.settings.v177CoverSizes=
    (Number(ac.modifiedAt)||0)>=(Number(bc.modifiedAt)||0)
      ?ac
      :bc;

  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    177
  );

  return out;
};

const v177VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v177VerifyCloudStateBase(
    cloudState,
    expected
  );
  const problems=[...(base?.missing||[])];

  const cloud=v177NormalizeCoverSizes(
    cloudState?.settings?.v177CoverSizes
  );
  const wanted=v177NormalizeCoverSizes(
    expected?.settings?.v177CoverSizes
  );

  if(JSON.stringify(cloud)!==JSON.stringify(wanted)){
    problems.push('Library / Order cover sizes');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

const v177BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  const payload=v177BuildFullBackupBase();

  payload.backupSchemaVersion=V177_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(
    JSON.stringify(S.settings||DEFAULT_SETTINGS)
  );

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=
    V177_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v177 backup. Includes independent responsive cover-size preferences for Library and Personal Order (50%–180%), alongside all prior rich title metadata, configurable pagination, category recovery, Advanced Import routing/exclusions, Old System Date View, adaptive cover collections, System Respect XP, Library/History, Personal Order, Rating Queue and portable preferences.';

  return payload;
};

const v177BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v177BackupManifestBase(
    state,
    extras
  );
  const sizes=v177NormalizeCoverSizes(
    state?.settings?.v177CoverSizes
  );

  manifest.schemaVersion=V177_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign(
    {},
    manifest.includes||{},
    {
      adjustableLibraryCoverSize:true,
      adjustableOrderCoverSize:true,
      responsiveCoverScaling:true
    }
  );

  manifest.coverSizes={
    libraryPercent:sizes.library,
    orderPercent:sizes.order
  };

  return manifest;
};

// v152 Automatic Backup resolves the final v148BuildFullBackup() at call time,
// so the v177 cover-size preferences are included automatically.



/* ============================================================
   MediaFlow v178 — Editable Rich Imported Metadata
   ------------------------------------------------------------
   v176 introduced source-provided rich title metadata. v178 exposes those
   fields in the normal Library editor and protects fields the user manually
   changes from later media-service imports.
   ============================================================ */

const V178_BACKUP_SCHEMA_VERSION=15;

const V178_EDITABLE_RICH_FIELDS=[
  'year',
  'mediaFormat',
  'durationMinutes',
  'releaseDate',
  'seasonLabel',
  'ageRating',
  'communityScore',
  'mediaSource',
  'demographic',
  'studios',
  'producers',
  'genres',
  'themes',
  'synopsis'
];

function v178ManualMap(item){
  const src=item?.richMetadataManual;
  if(!src||typeof src!=='object'||Array.isArray(src))return {};
  const out={};
  for(const key of V178_EDITABLE_RICH_FIELDS){
    if(src[key]===true)out[key]=true;
  }
  return out;
}

function v178CommaText(value){
  return Array.isArray(value)
    ?value.filter(Boolean).join(', ')
    :'';
}

function v178CsvList(value){
  return [...new Set(
    String(value||'')
      .split(',')
      .map(x=>v176SafeText(x,120))
      .filter(Boolean)
  )].slice(0,40);
}

function v178FieldLockBadge(item,key){
  return v178ManualMap(item)[key]
    ?'<span class="v178-import-lock" title="You manually edited this field. Future imports will not overwrite it.">MANUAL</span>'
    :'';
}

function v178RichEditorHtml(d){
  const item=d&&typeof d==='object'?d:{};

  const n=value=>{
    const x=Number(value);
    return Number.isFinite(x)&&x>0?x:'';
  };

  return `<details class="v178-rich-editor" ${v176HasRichMetadata(item)||Number(item.year)>0?'open':''}>
    <summary>
      <span>Title details / imported metadata</span>
      <span class="hint" style="margin:0">Editable</span>
    </summary>

    <div class="v178-rich-editor-body">
      <div class="v178-rich-editor-note">
        These fields can be filled by supported imports when the source actually provides them. You can edit or clear them manually. A field you manually change becomes protected from later media-service imports so your edit is not silently overwritten.
      </div>

      <div class="v178-rich-grid">
        <div class="field"><label class="field-label">Year ${v178FieldLockBadge(item,'year')}</label>
          <input type="number" id="l-rich-year" min="0" max="9999" step="1"
            value="${n(item.year)}" placeholder="e.g. 2026">
        </div>

        <div class="field">
          <label class="field-label">Media format ${v178FieldLockBadge(item,'mediaFormat')}</label>
          <input type="text" id="l-rich-format"
            value="${escapeHtml(String(item.mediaFormat||''))}"
            placeholder="TV, Movie, OVA, Manga…">
        </div>

        <div class="field">
          <label class="field-label">Runtime / duration (minutes) ${v178FieldLockBadge(item,'durationMinutes')}</label>
          <input type="number" id="l-rich-duration" min="0" step="1"
            value="${n(item.durationMinutes)}"
            placeholder="e.g. 24">
        </div>

        <div class="field">
          <label class="field-label">Release date ${v178FieldLockBadge(item,'releaseDate')}</label>
          <input type="date" id="l-rich-release-date"
            value="${escapeHtml(String(item.releaseDate||''))}">
        </div>

        <div class="field">
          <label class="field-label">Season ${v178FieldLockBadge(item,'seasonLabel')}</label>
          <input type="text" id="l-rich-season"
            value="${escapeHtml(String(item.seasonLabel||''))}"
            placeholder="Fall 2026">
        </div>

        <div class="field">
          <label class="field-label">Content / age rating ${v178FieldLockBadge(item,'ageRating')}</label>
          <input type="text" id="l-rich-age-rating"
            value="${escapeHtml(String(item.ageRating||''))}"
            placeholder="PG-13, TV-MA, 16+…">
        </div>

        <div class="field">
          <label class="field-label">Community score (0–10) ${v178FieldLockBadge(item,'communityScore')}</label>
          <input type="number" id="l-rich-community-score"
            min="0" max="10" step="0.01"
            value="${n(item.communityScore)}"
            placeholder="Not available">
        </div>

        <div class="field">
          <label class="field-label">Source material ${v178FieldLockBadge(item,'mediaSource')}</label>
          <input type="text" id="l-rich-source"
            value="${escapeHtml(String(item.mediaSource||''))}"
            placeholder="Manga, Light novel, Original…">
        </div>

        <div class="field">
          <label class="field-label">Demographic ${v178FieldLockBadge(item,'demographic')}</label>
          <input type="text" id="l-rich-demographic"
            value="${escapeHtml(String(item.demographic||''))}"
            placeholder="Shounen, Seinen…">
        </div>

        <div class="field">
          <label class="field-label">Studios ${v178FieldLockBadge(item,'studios')}</label>
          <input type="text" id="l-rich-studios"
            value="${escapeHtml(v178CommaText(item.studios))}"
            placeholder="Comma separated">
        </div>

        <div class="field">
          <label class="field-label">Producers ${v178FieldLockBadge(item,'producers')}</label>
          <input type="text" id="l-rich-producers"
            value="${escapeHtml(v178CommaText(item.producers))}"
            placeholder="Comma separated">
        </div>

        <div class="field">
          <label class="field-label">Genres ${v178FieldLockBadge(item,'genres')}</label>
          <input type="text" id="l-rich-genres"
            value="${escapeHtml(v178CommaText(item.genres))}"
            placeholder="Action, Adventure, Fantasy…">
        </div>

        <div class="field">
          <label class="field-label">Themes ${v178FieldLockBadge(item,'themes')}</label>
          <input type="text" id="l-rich-themes"
            value="${escapeHtml(v178CommaText(item.themes))}"
            placeholder="Isekai, School, Detective…">
        </div>

        <div class="field v178-rich-wide">
          <label class="field-label">Synopsis / description ${v178FieldLockBadge(item,'synopsis')}</label>
          <textarea id="l-rich-synopsis"
            placeholder="Synopsis or description…">${escapeHtml(String(item.synopsis||''))}</textarea>
        </div>
      </div>
    </div>
  </details>`;
}

/* ---------- Add rich fields to the normal Library editor ------- */

const v178LibraryModalHtmlBase=libraryModalHtml;
libraryModalHtml=function(d){
  let h=v178LibraryModalHtmlBase(d);

  const panel=v178RichEditorHtml(d||{});

  return h.replace(
    '<div class="modal-actions" style="justify-content:space-between;">',
    panel+'<div class="modal-actions" style="justify-content:space-between;">'
  );
};

function v178CaptureEditorValues(){
  const el=id=>document.getElementById(id);
  if(!el('l-rich-format'))return null;

  const numberOrNull=(id,max=null)=>{
    const raw=String(el(id)?.value||'').trim();
    if(!raw)return null;
    let value=Number(raw);
    if(!Number.isFinite(value))return null;
    if(max!=null)value=Math.min(max,value);
    return Math.max(0,value);
  };

  return {
    year:numberOrNull('l-rich-year',9999),
    mediaFormat:v176SafeText(el('l-rich-format')?.value,80),
    durationMinutes:numberOrNull('l-rich-duration'),
    releaseDate:v176DateValue(el('l-rich-release-date')?.value),
    seasonLabel:v176SafeText(el('l-rich-season')?.value,80),
    ageRating:v176SafeText(el('l-rich-age-rating')?.value,80),
    communityScore:numberOrNull('l-rich-community-score',10),
    mediaSource:v176SafeText(el('l-rich-source')?.value,120),
    demographic:v176SafeText(el('l-rich-demographic')?.value,120),
    studios:v178CsvList(el('l-rich-studios')?.value),
    producers:v178CsvList(el('l-rich-producers')?.value),
    genres:v178CsvList(el('l-rich-genres')?.value),
    themes:v178CsvList(el('l-rich-themes')?.value),
    synopsis:v176SafeText(el('l-rich-synopsis')?.value,6000)
  };
}

function v178ComparableRichValue(key,value){
  if(['studios','producers','genres','themes'].includes(key)){
    return JSON.stringify(Array.isArray(value)?value:[]);
  }

  if(['year','durationMinutes','communityScore'].includes(key)){
    const n=Number(value);
    return Number.isFinite(n)&&n>0?String(n):'';
  }

  return String(value??'');
}

function v178ApplyManualEditorValues(item,before,captured){
  if(!item||!captured)return false;

  const manual=v178ManualMap(before||item);
  let changed=false;

  for(const key of V178_EDITABLE_RICH_FIELDS){
    const oldValue=before?.[key];
    const newValue=captured[key];

    if(
      v178ComparableRichValue(key,oldValue)!==
      v178ComparableRichValue(key,newValue)
    ){
      manual[key]=true;
      changed=true;
    }

    if(['studios','producers','genres','themes'].includes(key)){
      item[key]=Array.isArray(newValue)?newValue:[];
      continue;
    }

    if(['year','durationMinutes','communityScore'].includes(key)){
      const n=Number(newValue);
      item[key]=Number.isFinite(n)&&n>0?n:null;
      continue;
    }

    item[key]=String(newValue||'');
  }

  item.richMetadataManual=manual;

  if(changed)item.modifiedAt=Date.now();
  return changed;
}

/* FINAL title saver: capture metadata before the base editor closes, then save
   it onto the same Library record. The base save keeps all existing XP,
   completion, date, cover and validation behavior. */
const v178SaveLibraryModalBase=App.saveLibraryModal;
App.saveLibraryModal=function(id){
  const captured=v178CaptureEditorValues();

  const before=id
    ?(S.library||[]).find(item=>String(item?.id||'')===String(id))
    :null;

  const beforeCopy=before
    ?JSON.parse(JSON.stringify(before))
    :{};

  const beforeIds=new Set(
    (S.library||[]).map(item=>String(item?.id||''))
  );

  const result=v178SaveLibraryModalBase.apply(this,arguments);

  // If validation failed, the Library editor is still open. Do not save rich
  // metadata independently from the rest of the title form.
  if(document.getElementById('l-title'))return result;
  if(!captured)return result;

  let item=null;

  if(id){
    item=(S.library||[]).find(
      row=>String(row?.id||'')===String(id)
    );
  }else{
    item=(S.library||[]).find(
      row=>!beforeIds.has(String(row?.id||''))
    ) || (S.library||[])[(S.library||[]).length-1];
  }

  if(!item)return result;

  const changed=v178ApplyManualEditorValues(
    item,
    beforeCopy,
    captured
  );

  // Make the existing Library undo/redo entry include the rich metadata edit.
  const undo=(S.undoStack||[])[(S.undoStack||[]).length-1];
  if(undo&&/^(Edit title|Add title)$/i.test(String(undo.action||''))){
    undo.after=mfCoreSnapshot();
  }

  if(changed || !before){
    persistLibrary();
    render();
  }

  return result;
};

/* ---------- Protect manually edited fields from future imports -------- */

v176ApplyRichMetadata=function(item,meta){
  if(!item||!meta||typeof meta!=='object')return false;

  const manual=v178ManualMap(item);
  let changed=false;

  for(const key of ['genres','themes','studios','producers']){
    if(manual[key])continue;

    const merged=v176MergeListValues(
      item[key],
      meta[key]
    );

    if(
      JSON.stringify(merged)!==
      JSON.stringify(Array.isArray(item[key])?item[key]:[])
    ){
      item[key]=merged;
      changed=true;
    }
  }

  for(const key of [
    'mediaFormat','synopsis','mediaSource','demographic',
    'ageRating','releaseDate','seasonLabel'
  ]){
    if(manual[key])continue;

    const value=v176SafeText(
      meta[key],
      key==='synopsis'?6000:160
    );

    if(value&&value!==String(item[key]||'')){
      item[key]=value;
      changed=true;
    }
  }

  for(const key of ['durationMinutes','communityScore']){
    if(manual[key])continue;

    const value=Number(meta[key]);
    if(
      Number.isFinite(value)&&
      value>0&&
      Number(item[key])!==value
    ){
      item[key]=value;
      changed=true;
    }
  }

  return changed;
};

// Year was part of the older v158 core importer rather than v176 rich metadata.
// Protect a manually edited Year around the complete Standard/Advanced import
// pipeline too.
const v178ApplyNormalizedRecordBase=v158ApplyNormalizedRecord;
v158ApplyNormalizedRecord=function(record,service,index,touched){
  const existing=v158FindImportItem(record,index);
  const protectYear=existing?.richMetadataManual?.year===true;
  const yearBefore=existing?.year??null;

  const result=v178ApplyNormalizedRecordBase(
    record,
    service,
    index,
    touched
  );

  if(protectYear){
    const item=v158FindImportItem(record,index);
    if(item){
      item.year=yearBefore;
      touched?.set(String(item.id),item);
      index?.add?.(item);
    }
  }

  return result;
};

/* ---------- Cloud merge preservation of manual-protection flags -------- */

const v178MergeLibraryItemBase=v84MergeLibraryItem;
v84MergeLibraryItem=function(left,right){
  const out=v178MergeLibraryItemBase(left,right);
  if(!out)return out;

  const lm=v178ManualMap(left);
  const rm=v178ManualMap(right);
  const merged={};

  for(const key of V178_EDITABLE_RICH_FIELDS){
    if(lm[key]||rm[key])merged[key]=true;
  }

  out.richMetadataManual=merged;
  return out;
};

/* ---------- Protected Sync Now verification ------------------- */

function v178ManualMetadataAudit(state){
  let count=0;
  let xor=0;
  let sum=0;

  for(const item of (Array.isArray(state?.library)?state.library:[])){
    const manual=v178ManualMap(item);
    if(!Object.keys(manual).length)continue;

    const hash=v176Fnv(
      JSON.stringify({
        id:String(item?.id||''),
        manual
      })
    );

    count++;
    xor=(xor^hash)>>>0;
    sum=(sum+hash)>>>0;
  }

  return {count,xor,sum};
}

const v178VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v178VerifyCloudStateBase(
    cloudState,
    expected
  );
  const problems=[...(base?.missing||[])];

  const cloud=v178ManualMetadataAudit(cloudState);
  const wanted=v178ManualMetadataAudit(expected);

  if(
    cloud.count!==wanted.count ||
    cloud.xor!==wanted.xor ||
    cloud.sum!==wanted.sum
  ){
    problems.push('Manual rich-metadata protection');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

/* ---------- Full Backup / Automatic Backup -------------------- */

const v178BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v178BuildFullBackupBase();

  payload.backupSchemaVersion=V178_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=
    V178_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v178 backup. Rich imported Library metadata is editable in the normal title editor. Manually changed metadata fields are marked on the Library record and protected from later media-service imports. Includes year, format, runtime, release date, season, content rating, community score, source material, demographic, studios, producers, genres, themes and synopsis alongside all prior MediaFlow data.';

  return payload;
};

const v178BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v178BackupManifestBase(
    state,
    extras
  );
  const audit=v178ManualMetadataAudit(state);

  manifest.schemaVersion=V178_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign(
    {},
    manifest.includes||{},
    {
      editableRichLibraryMetadata:true,
      manualRichMetadataProtection:true,
      editableImportedYear:true,
      editableImportedSynopsis:true,
      editableImportedGenresThemes:true,
      editableImportedStudiosProducers:true
    }
  );

  manifest.counts=Object.assign(
    {},
    manifest.counts||{},
    {
      titlesWithManualRichMetadata:audit.count
    }
  );

  return manifest;
};

// v152 Automatic Backup resolves the final builder dynamically, so manually
// edited metadata and its import-protection flags are included automatically.



/* ============================================================
   MediaFlow v179 — Dual Logging Modes
   ------------------------------------------------------------
   Mode 1: Amount consumed (the original MediaFlow behavior)
   Mode 2: Final progress — enter the last watched episode / read chapter /
           read issue / final progress. MediaFlow calculates the consumed
           difference automatically from the title's starting progress.
   ============================================================ */

const V179_BACKUP_SCHEMA_VERSION=16;

const V179_LOG_MODE_DEFAULTS={
  single:'amount',
  batch:'amount',
  modifiedAt:0
};

function v179NormalizeMode(value){
  return value==='progress'?'progress':'amount';
}

function v179NormalizeLoggingModes(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  return {
    single:v179NormalizeMode(src.single),
    batch:v179NormalizeMode(src.batch),
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v179EnsureLoggingModes(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.v179LoggingModes=v179NormalizeLoggingModes(
    settings.v179LoggingModes
  );
  return settings.v179LoggingModes;
}

function v179Mode(kind){
  const cfg=v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);
  return kind==='batch'?cfg.batch:cfg.single;
}

function v179IsComplete(item){
  return !!item && (
    String(item.status||'')==='completed' ||
    (
      Number(item.total)>0 &&
      Number(item.progress)>=Number(item.total)
    )
  );
}

function v179StartProgress(item){
  if(!item)return 0;
  // Completed titles are repeat consumption. Main Library progress already
  // equals the total, so "last watched episode" for a rewatch starts at 0.
  if(v179IsComplete(item))return 0;
  return Math.max(0,Number(item.progress)||0);
}

function v179ProgressInputLabel(item){
  const cat=item?getCategory(item.categoryId):null;
  const unit=String(cat?.unit||'').toLowerCase();

  if(/episode/.test(unit))return 'Last watched episode';
  if(/chapter/.test(unit))return 'Last read chapter';
  if(/issue/.test(unit))return 'Last read issue';
  if(/volume/.test(unit))return 'Last read volume';
  if(/book/.test(unit))return 'Last read book';

  return 'Final progress';
}

function v179ProgressNoun(item,amount=2){
  const cat=item?getCategory(item.categoryId):null;
  return cat?unitLabel(cat.unit,amount):'units';
}

function v179ClampEndProgress(item,value){
  let end=Math.max(0,Number(value)||0);
  const total=Number(item?.total);

  if(Number.isFinite(total)&&total>0){
    end=Math.min(end,total);
  }

  return end;
}

function v179CalculatedQty(item,start,end){
  const safeStart=Math.max(0,Number(start)||0);
  const safeEnd=v179ClampEndProgress(item,end);
  return Math.max(0,safeEnd-safeStart);
}

function v179ModeSwitchHtml(kind){
  const mode=v179Mode(kind);
  const isBatch=kind==='batch';

  return `<div class="v179-log-mode-switch ${isBatch?'v179-batch-mode-wrap':''}">
    <span class="v179-mode-label">Logging method</span>

    <button type="button"
      class="btn btn-sm ${mode==='amount'?'active':''}"
      onclick="App.v179SetLogMode('${kind}','amount')">
      Amount consumed
    </button>

    <button type="button"
      class="btn btn-sm ${mode==='progress'?'active':''}"
      onclick="App.v179SetLogMode('${kind}','progress')">
      Last progress
    </button>

    <div class="v179-log-mode-help">${
      mode==='progress'
        ?'Select a Library title, enter the last episode/chapter/issue you reached, and MediaFlow calculates how much you consumed from the title’s starting progress.'
        :'Original logging method: enter directly how many episodes, chapters, issues, movies, or other units you consumed.'
    }</div>
  </div>`;
}

function v179SetLogMode(kind,mode){
  const safeKind=kind==='batch'?'batch':'single';
  const safeMode=v179NormalizeMode(mode);
  const cfg=v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);

  cfg[safeKind]=safeMode;
  cfg.modifiedAt=Date.now();
  persistSettings();

  if(safeKind==='single'){
    if(S.logDraft){
      S.logDraft.v179Mode=safeMode;

      if(safeMode==='progress'){
        S.logDraft.updateLibrary=true;

        for(const entry of (S.logDraft.entries||[])){
          const item=entry.libraryId
            ?S.library.find(i=>i.id===entry.libraryId)
            :null;

          if(!item)continue;

          const start=Number.isFinite(Number(entry.v179StartProgress))
            ?Math.max(0,Number(entry.v179StartProgress))
            :v179StartProgress(item);

          entry.v179StartProgress=start;
          entry.v179EndProgress=v179ClampEndProgress(
            item,
            start+Math.max(0,Number(entry.qty)||0)
          );
          entry.qty=v179CalculatedQty(
            item,
            entry.v179StartProgress,
            entry.v179EndProgress
          );
        }

        if(S.entryDraft){
          const item=S.entryDraft.libraryId
            ?S.library.find(i=>i.id===S.entryDraft.libraryId)
            :null;

          if(item){
            const start=v179StartProgress(item);
            S.entryDraft.endProgress=v179ClampEndProgress(
              item,
              start+1
            );
          }
        }

        v179SyncSingleFromEntries();
      }
    }

    render();
    return;
  }

  ensureBatchDraft();
  S.batchDraft.v179Mode=safeMode;

  for(const row of S.batchDraft.rows){
    const item=row.libraryId
      ?S.library.find(i=>i.id===row.libraryId)
      :null;

    if(!item)continue;

    if(safeMode==='progress'){
      const start=v179StartProgress(item);
      row.v179StartProgress=start;

      if(row.v179EndProgress==null||row.v179EndProgress===''){
        row.v179EndProgress=v179ClampEndProgress(
          item,
          start+Math.max(0,Number(row.qty)||1)
        );
      }

      row.qty=v179CalculatedQty(
        item,
        row.v179StartProgress,
        row.v179EndProgress
      );

      const cat=getCategory(item.categoryId);
      if(cat){
        row.minutes=Math.round(
          row.qty*(Number(cat.minutesPerUnit)||0)
        );
      }
    }
  }

  render();
}

function v179SyncSingleFromEntries(){
  if(!S.logDraft)return;

  const entries=S.logDraft.entries||[];
  let amount=0;
  let minutes=0;

  for(const entry of entries){
    const qty=Math.max(0,Number(entry.qty)||0);
    amount+=qty;

    const item=entry.libraryId
      ?S.library.find(i=>i.id===entry.libraryId)
      :null;

    const cat=item
      ?getCategory(item.categoryId)
      :getCategory(S.currentTask?.categoryId||'');

    minutes+=Math.round(
      qty*(Number(cat?.minutesPerUnit)||0)
    );
  }

  S.logDraft.amount=amount;
  S.logDraft.minutes=minutes;
  refreshXPPreview();
}

function v179ProgressEntryEditorHtml(entries){
  if(v179Mode('single')!=='progress'||!entries.length)return '';

  return `<div class="v179-progress-entry-list">
    ${entries.map((entry,idx)=>{
      const item=entry.libraryId
        ?S.library.find(i=>i.id===entry.libraryId)
        :null;

      if(!item)return '';

      const start=Number.isFinite(Number(entry.v179StartProgress))
        ?Math.max(0,Number(entry.v179StartProgress))
        :v179StartProgress(item);

      const end=entry.v179EndProgress!=null
        ?v179ClampEndProgress(item,entry.v179EndProgress)
        :v179ClampEndProgress(item,start+Math.max(0,Number(entry.qty)||0));

      const qty=v179CalculatedQty(item,start,end);
      const total=Number(item.total)>0?` / ${Number(item.total)}`:'';

      return `<div class="v179-progress-entry-row">
        <div class="v179-progress-entry-copy">
          <b>${escapeHtml(cleanTitle(item.title))}</b>
          <small>Starting progress: ${start}${total}${entry.isRepeat?' · Rewatch/reread starts at 0':''}</small>
        </div>

        <label class="v179-progress-entry-input">
          <span>${escapeHtml(v179ProgressInputLabel(item))}</span>
          <input type="number"
            min="${start}"
            ${Number(item.total)>0?`max="${Number(item.total)}"`:''}
            step="1"
            value="${end}"
            onchange="App.v179SetLogEntryEnd(${idx},this.value)">
        </label>

        <div class="v179-consumed-chip">
          +${qty} ${escapeHtml(v179ProgressNoun(item,qty))}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function v179SetLogEntryEnd(index,value){
  const entry=(S.logDraft?.entries||[])[index];
  if(!entry?.libraryId)return;

  const item=S.library.find(i=>i.id===entry.libraryId);
  if(!item)return;

  const start=Number.isFinite(Number(entry.v179StartProgress))
    ?Math.max(0,Number(entry.v179StartProgress))
    :v179StartProgress(item);

  const end=v179ClampEndProgress(item,value);

  entry.v179StartProgress=start;
  entry.v179EndProgress=end;
  entry.qty=v179CalculatedQty(item,start,end);

  v179SyncSingleFromEntries();
  render();
}

/* ---------- Normal logging UI ------------------------------- */

const v179RenderLogFormBase=renderLogForm;
renderLogForm=function(t,cat){
  let h=v179RenderLogFormBase(t,cat);
  const mode=v179Mode('single');

  h=h.replace(
    '<div class="log-form">',
    `<div class="log-form">${v179ModeSwitchHtml('single')}`
  );

  if(mode!=='progress')return h;

  const selected=S.entryDraft?.libraryId
    ?S.library.find(i=>i.id===S.entryDraft.libraryId)
    :null;

  const inputLabel=selected
    ?v179ProgressInputLabel(selected)
    :'Last progress';

  const start=selected?v179StartProgress(selected):0;
  const suggested=selected
    ?v179ClampEndProgress(
        selected,
        S.entryDraft?.endProgress==null||S.entryDraft?.endProgress===''
          ?start+1
          :S.entryDraft.endProgress
      )
    :(Math.max(1,Number(S.entryDraft?.endProgress)||1));

  const progressInput=`<label class="v179-inline-progress">
    <span>${escapeHtml(inputLabel)}</span>
    <input type="number"
      id="entry-progress"
      min="${start}"
      ${selected&&Number(selected.total)>0?`max="${Number(selected.total)}"`:''}
      step="1"
      value="${suggested}"
      oninput="App.v179UpdateEntryProgressDraft(this.value)">
  </label>`;

  h=h.replace(
    /<input type="number" id="entry-qty"[\s\S]*?style="width:74px;">/,
    progressInput
  );

  const editors=v179ProgressEntryEditorHtml(
    S.logDraft?.entries||[]
  );

  h=h.replace(
    /(<div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">)/,
    `${editors}$1`
  );

  h=h.replace(
    /<label style="display:flex; align-items:center; gap:6px; font-size:12\.5px; color:var\(--text-dim\); margin-bottom:10px;">[\s\S]*?Update Library progress automatically[\s\S]*?<\/label>/,
    `<div class="v179-auto-progress-note">
      Library progress updates automatically to the final progress you enter. MediaFlow logs only the difference as consumed.
    </div>`
  );

  h=h.replace(
    '<label class="field-label">Actual amount (',
    '<label class="field-label">Consumed automatically ('
  );

  h=h.replace(
    /<input type="number" min="0" id="log-amount" value="([^"]*)" oninput="App\.updateLogDraft\('amount', this\.value\)">/,
    `<input type="number" min="0" id="log-amount" value="$1" readonly>`
  );

  h=h.replace(
    '<div class="field">\n\n        <label class="field-label">Consumed automatically',
    '<div class="field v179-readonly-amount">\n\n        <label class="field-label">Consumed automatically'
  );

  return h;
};

function v179UpdateEntryProgressDraft(value){
  S.entryDraft=S.entryDraft||{title:'',qty:1,libraryId:null};
  S.entryDraft.endProgress=Math.max(0,Number(value)||0);
}

const v179SelectLogTitleBase=App.selectLogTitle;
App.selectLogTitle=function(id){
  const result=v179SelectLogTitleBase.apply(this,arguments);

  if(v179Mode('single')==='progress'){
    const item=S.library.find(i=>i.id===id);

    if(item){
      const start=v179StartProgress(item);
      S.entryDraft.endProgress=v179ClampEndProgress(
        item,
        start+1
      );
      render();
    }
  }

  return result;
};

const v179AddLogEntryBase=App.addLogEntry;
App.addLogEntry=function(){
  if(v179Mode('single')!=='progress'){
    return v179AddLogEntryBase.apply(this,arguments);
  }

  const title=String(S.entryDraft?.title||'').trim();
  if(!title)return;

  const assignedCat=getCategory(S.currentTask?.categoryId||'');
  let item=S.entryDraft?.libraryId
    ?S.library.find(i=>i.id===S.entryDraft.libraryId)
    :null;

  if(!item&&assignedCat){
    item=findLibraryMatch(assignedCat.id,title);
  }

  if(!item){
    const key=cleanTitle(title).toLowerCase();
    item=S.library.find(
      i=>i&&i.status!=='dropped'&&
      cleanTitle(i.title).toLowerCase()===key
    )||null;
  }

  const start=item?v179StartProgress(item):0;
  let end=Math.max(
    start,
    Number(S.entryDraft?.endProgress)||0
  );

  if(item)end=v179ClampEndProgress(item,end);

  const qty=Math.max(0,end-start);

  if(qty<=0){
    showToast(
      item
        ?`Enter a ${v179ProgressInputLabel(item).toLowerCase()} higher than ${start}.`
        :'Enter the final progress you reached.'
    );
    return;
  }

  // Avoid two progress-mode rows for the same Library title, because each
  // final-progress entry is defined relative to one starting progress value.
  if(item?.id){
    const existing=(S.logDraft?.entries||[]).findIndex(
      e=>String(e?.libraryId||'')===String(item.id)
    );

    if(existing>=0){
      const entry=S.logDraft.entries[existing];
      entry.v179StartProgress=Number.isFinite(Number(entry.v179StartProgress))
        ?Math.max(0,Number(entry.v179StartProgress))
        :start;
      entry.v179EndProgress=end;
      entry.qty=v179CalculatedQty(
        item,
        entry.v179StartProgress,
        entry.v179EndProgress
      );

      S.entryDraft={title:'',qty:1,libraryId:null,endProgress:''};
      v179SyncSingleFromEntries();
      render();
      showToast('Updated final progress for that title.');
      return;
    }
  }

  const beforeLength=(S.logDraft?.entries||[]).length;

  S.entryDraft.qty=qty;
  S.logDraft.updateLibrary=true;

  const result=v179AddLogEntryBase.apply(this,arguments);

  const entry=(S.logDraft?.entries||[])[beforeLength];
  if(entry){
    const savedItem=entry.libraryId
      ?S.library.find(i=>i.id===entry.libraryId)
      :item;

    const savedStart=savedItem
      ?v179StartProgress(savedItem)
      :start;

    entry.v179StartProgress=savedStart;
    entry.v179EndProgress=savedItem
      ?v179ClampEndProgress(savedItem,end)
      :end;
    entry.qty=savedItem
      ?v179CalculatedQty(
          savedItem,
          entry.v179StartProgress,
          entry.v179EndProgress
        )
      :qty;
  }

  S.entryDraft=S.entryDraft||{};S.entryDraft.endProgress='';

  v179SyncSingleFromEntries();
  render();

  return result;
};

const v179OpenLogFormBase=App.openLogForm;
App.openLogForm=function(){
  const result=v179OpenLogFormBase.apply(this,arguments);

  if(S.logDraft){
    S.logDraft.v179Mode=v179Mode('single');

    if(v179Mode('single')==='progress'){
      S.logDraft.amount=0;
      S.logDraft.minutes=0;
      S.logDraft.updateLibrary=true;
      S.entryDraft=S.entryDraft||{title:'',qty:1};
      S.entryDraft.endProgress='';
      render();
    }
  }

  return result;
};

/* Final wrapper over the complete existing submit chain (XP, completion,
   repeat, Start Date, undo/activity, etc.). We only prepare quantities first. */
const v179SubmitLogBase=App.submitLog;
App.submitLog=function(){
  if(v179Mode('single')==='progress'){
    const entries=S.logDraft?.entries||[];

    if(!entries.length){
      showToast('Select at least one Library title and enter its final progress.');
      return;
    }

    for(const entry of entries){
      const item=entry.libraryId
        ?S.library.find(i=>i.id===entry.libraryId)
        :null;

      if(!item){
        if(!(Number(entry.qty)>0)){
          showToast('One of the progress entries has no consumed amount.');
          return;
        }
        continue;
      }

      const start=Number.isFinite(Number(entry.v179StartProgress))
        ?Math.max(0,Number(entry.v179StartProgress))
        :v179StartProgress(item);

      const end=v179ClampEndProgress(
        item,
        entry.v179EndProgress
      );

      entry.v179StartProgress=start;
      entry.v179EndProgress=end;
      entry.qty=v179CalculatedQty(item,start,end);

      if(!(entry.qty>0)){
        showToast(
          `${cleanTitle(item.title)}: final progress must be higher than ${start}.`
        );
        return;
      }
    }

    S.logDraft.updateLibrary=true;
    v179SyncSingleFromEntries();
  }

  return v179SubmitLogBase.apply(this,arguments);
};

/* ---------- Batch Log state + UI ----------------------------- */

const v179EnsureBatchDraftBase=ensureBatchDraft;
ensureBatchDraft=function(){
  v179EnsureBatchDraftBase();

  S.batchDraft.v179Mode=v179NormalizeMode(
    S.batchDraft.v179Mode||v179Mode('batch')
  );

  for(const row of S.batchDraft.rows){
    if(row.v179EndProgress===undefined)row.v179EndProgress='';
    if(row.v179StartProgress===undefined)row.v179StartProgress=null;
  }
};

const v179AddBatchRowBase=App.addBatchRow;
App.addBatchRow=function(){
  const result=v179AddBatchRowBase.apply(this,arguments);

  ensureBatchDraft();
  const row=S.batchDraft.rows[S.batchDraft.rows.length-1];

  if(row){
    row.v179EndProgress='';
    row.v179StartProgress=null;
  }

  return result;
};

const v179SelectBatchTitleBase=App.selectBatchTitle;
App.selectBatchTitle=function(i,id){
  ensureBatchDraft();

  if(v179Mode('batch')==='progress'){
    const duplicate=S.batchDraft.rows.findIndex(
      (row,index)=>
        index!==Number(i)&&
        String(row?.libraryId||'')===String(id)
    );

    if(duplicate>=0){
      showToast('That title is already in this progress-mode batch.');
      return;
    }
  }

  const result=v179SelectBatchTitleBase.apply(this,arguments);

  if(v179Mode('batch')==='progress'){
    ensureBatchDraft();
    const row=S.batchDraft.rows[i];
    const item=S.library.find(x=>x.id===id);

    if(row&&item){
      const start=v179StartProgress(item);
      const end=v179ClampEndProgress(item,start+1);

      row.v179StartProgress=start;
      row.v179EndProgress=end;
      row.qty=v179CalculatedQty(item,start,end);

      const cat=getCategory(item.categoryId);
      if(cat){
        row.minutes=Math.round(
          row.qty*(Number(cat.minutesPerUnit)||0)
        );
      }

      render();
    }
  }

  return result;
};

function v179UpdateBatchProgress(i,value){
  ensureBatchDraft();

  const row=S.batchDraft.rows[i];
  if(!row?.libraryId)return;

  const item=S.library.find(x=>x.id===row.libraryId);
  if(!item)return;

  const start=Number.isFinite(Number(row.v179StartProgress))
    ?Math.max(0,Number(row.v179StartProgress))
    :v179StartProgress(item);

  const end=v179ClampEndProgress(item,value);
  const qty=v179CalculatedQty(item,start,end);

  row.v179StartProgress=start;
  row.v179EndProgress=end;
  row.qty=qty;

  const cat=getCategory(item.categoryId);
  if(cat){
    row.minutes=Math.round(
      qty*(Number(cat.minutesPerUnit)||0)
    );
  }

  const hint=document.getElementById(
    `batch-progress-calc-${i}`
  );
  if(hint){
    hint.innerHTML=`Starting ${start} → <b>+${qty} ${escapeHtml(v179ProgressNoun(item,qty))}</b>`;
  }

  const minutesInput=document.getElementById(
    `batch-minutes-${i}`
  );
  if(minutesInput){
    minutesInput.value=row.minutes;
  }

  const total=document.getElementById('batch-total-summary');
  if(total){
    const mins=S.batchDraft.rows.reduce(
      (n,x)=>n+(Number(x.minutes)||0),
      0
    );
    total.textContent=`${S.batchDraft.rows.length} rows · ${fmtMinutes(mins)}`;
  }
}

/* Final Batch Log renderer. It preserves v175's complete Library-browser
   filters/pagination while changing only the quantity-entry method. */
renderBatchLog=function(){
  ensureBatchDraft();
  const mode=v179Mode('batch');

  const rows=S.batchDraft.rows.map((r,i)=>{
    const item=S.library.find(x=>x.id===r.libraryId);
    const cat=item&&getCategory(item.categoryId);
    const query=r.query!=null
      ?r.query
      :(item?cleanTitle(item.title):'');

    let amountField='';

    if(mode==='progress'){
      const start=item
        ?(
          Number.isFinite(Number(r.v179StartProgress))
            ?Math.max(0,Number(r.v179StartProgress))
            :v179StartProgress(item)
        )
        :0;

      const end=item
        ?v179ClampEndProgress(
            item,
            r.v179EndProgress==null||r.v179EndProgress===''
              ?start+1
              :r.v179EndProgress
          )
        :'';

      const qty=item
        ?v179CalculatedQty(item,start,end)
        :0;

      amountField=`<div class="field">
        <label class="field-label">${
          item
            ?escapeHtml(v179ProgressInputLabel(item))
            :'Last progress'
        }</label>

        <input id="batch-progress-${i}"
          type="number"
          min="${start}"
          ${item&&Number(item.total)>0?`max="${Number(item.total)}"`:''}
          step="1"
          inputmode="numeric"
          ${item?'':'disabled'}
          value="${end}"
          placeholder="${item?'':'Select a title first'}"
          oninput="App.v179UpdateBatchProgress(${i},this.value)">

        <small id="batch-progress-calc-${i}" class="v179-batch-progress-hint">
          ${
            item
              ?`Starting ${start} → <b>+${qty} ${escapeHtml(v179ProgressNoun(item,qty))}</b>`
              :'Select a Library title first.'
          }
        </small>
      </div>`;
    }else{
      amountField=`<div class="field">
        <label class="field-label">Amount ${cat?`(${escapeHtml(unitLabel(cat.unit,2))})`:''}</label>
        <input id="batch-qty-${i}"
          type="number"
          min="0"
          inputmode="decimal"
          value="${r.qty}"
          oninput="App.updateBatchRow(${i},'qty',this.value)">
      </div>`;
    }

    return `<div class="card batch-log-row">
      <div class="batch-title-field field">
        <label class="field-label">Title</label>

        <div class="batch-search-wrap">
          <input id="batch-title-${i}"
            type="text"
            autocomplete="off"
            value="${escapeHtml(query)}"
            placeholder="Search or browse your Library…"
            oninput="App.updateBatchSearch(${i},this.value)"
            onfocus="App.renderBatchSuggestions(${i})">

          <div id="batch-suggestions-${i}" class="batch-suggestions"></div>
        </div>

        ${
          item&&cat
            ?`<div class="batch-selected-title">
                ${v144CategoryIconHtml(cat)}
                <b>${escapeHtml(cleanTitle(item.title))}</b>
                <span>${escapeHtml(cat.name)}${item.total!=null?` · ${Number(item.progress)||0}/${item.total}`:` · progress ${Number(item.progress)||0}`}${v179IsComplete(item)?' · ↻ repeat':''}</span>
              </div>`
            :`<small class="hint">Search across every category, then select the title you consumed.</small>`
        }
      </div>

      <div class="batch-number-fields">
        ${amountField}

        <div class="field">
          <label class="field-label">Minutes</label>
          <input id="batch-minutes-${i}"
            type="number"
            min="0"
            inputmode="numeric"
            value="${r.minutes}"
            oninput="App.updateBatchRow(${i},'minutes',this.value)">
        </div>
      </div>

      <button class="btn btn-danger batch-remove"
        onclick="App.removeBatchRow(${i})">
        Remove
      </button>

      ${
        cat
          ?`<small class="hint batch-counts-note">
              ${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)} · ${
                mode==='progress'
                  ?'MediaFlow calculates the consumed difference and updates Library progress to your entered final progress.'
                  :'Updates Library progress and counts toward scheduler balance, health, Statistics and XP.'
              }
            </small>`
          :''
      }
    </div>`;
  }).join('');

  const totalMinutes=S.batchDraft.rows.reduce(
    (n,r)=>n+(Number(r.minutes)||0),
    0
  );

  return `<div class="view-head">
      <div>
        <div class="view-title">Batch Log</div>
        <div class="view-desc">
          Search your entire Library and record multiple titles at once.
        </div>
      </div>
    </div>

    <div class="card batch-log-meta">
      <div class="field-row">
        <div class="field">
          <label class="field-label">Consumption date</label>
          <input type="date"
            value="${escapeHtml(S.batchDraft.date||todayISO())}"
            onchange="S.batchDraft.date=this.value">
        </div>

        <div class="field">
          <label class="field-label">Batch note (optional)</label>
          <input type="text"
            value="${escapeHtml(S.batchDraft.note||'')}"
            placeholder="What did you consume?"
            onchange="S.batchDraft.note=this.value">
        </div>
      </div>

      <div class="health-note">
        Batch entries use <b>Logged</b>. Their actual categories, amounts and minutes still fully count throughout MediaFlow.
      </div>
    </div>

    ${v179ModeSwitchHtml('batch')}
    ${v175BatchLibraryToolsHtml()}

    <div class="batch-log-list">
      ${
        rows||
        `<div class="empty-state card">
          <div class="em-icon">🧾</div>
          <div class="em-title">No batch rows yet</div>
          <div>Add a title, search your Library, and select what you consumed.</div>
        </div>`
      }
    </div>

    <div class="batch-log-actions">
      <button class="btn" onclick="App.addBatchRow()">+ Add title</button>

      <button class="btn btn-primary"
        ${S.batchDraft.rows.length?'':'disabled'}
        onclick="App.submitBatchLog()">
        Log batch
      </button>

      ${
        S.batchDraft.rows.length
          ?`<button class="btn btn-ghost" onclick="App.clearBatchLog()">Clear</button>`
          :''
      }

      <span id="batch-total-summary" class="hint">
        ${S.batchDraft.rows.length} rows · ${fmtMinutes(totalMinutes)}
      </span>
    </div>`;
};

const v179SubmitBatchLogBase=App.submitBatchLog;
App.submitBatchLog=function(){
  if(v179Mode('batch')==='progress'){
    ensureBatchDraft();

    const selected=S.batchDraft.rows.filter(r=>r.libraryId);
    if(!selected.length){
      showToast('Select at least one Library title.');
      return;
    }

    const seen=new Set();

    for(const row of selected){
      const item=S.library.find(x=>x.id===row.libraryId);
      if(!item)continue;

      if(seen.has(String(item.id))){
        showToast(`${cleanTitle(item.title)} appears more than once in this progress-mode batch.`);
        return;
      }
      seen.add(String(item.id));

      const start=Number.isFinite(Number(row.v179StartProgress))
        ?Math.max(0,Number(row.v179StartProgress))
        :v179StartProgress(item);

      const end=v179ClampEndProgress(
        item,
        row.v179EndProgress
      );

      const qty=v179CalculatedQty(
        item,
        start,
        end
      );

      if(!(qty>0)){
        showToast(
          `${cleanTitle(item.title)}: final progress must be higher than ${start}.`
        );
        return;
      }

      row.v179StartProgress=start;
      row.v179EndProgress=end;
      row.qty=qty;

      const cat=getCategory(item.categoryId);
      if(cat&&!(Number(row.minutes)>0)){
        row.minutes=Math.round(
          qty*(Number(cat.minutesPerUnit)||0)
        );
      }
    }
  }

  return v179SubmitBatchLogBase.apply(this,arguments);
};

Object.assign(App,{
  v179SetLogMode,
  v179UpdateEntryProgressDraft,
  v179SetLogEntryEnd,
  v179UpdateBatchProgress
});

/* ============================================================
   Persistence / cloud / Sync Now / backup
   ============================================================ */

const v179PersistSettingsBase=persistSettings;
persistSettings=function(){
  v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);
  return v179PersistSettingsBase.apply(this,arguments);
};

const v179LoadAllBase=loadAll;
loadAll=async function(){
  await v179LoadAllBase.apply(this,arguments);
  v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);
};

const v179SnapshotBase=snapshot;
snapshot=function(){
  v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);
  const x=v179SnapshotBase();

  x.settings=JSON.parse(
    JSON.stringify(S.settings||DEFAULT_SETTINGS)
  );
  x.cloudSyncVersion=Math.max(
    Number(x.cloudSyncVersion)||0,
    179
  );

  return x;
};

const v179ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v179ApplyStateBase.apply(this,arguments);
  v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);
  return result;
};

const v179MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v179MergeStatesBase(a,b)||{};

  const am=v179NormalizeLoggingModes(
    a?.settings?.v179LoggingModes
  );
  const bm=v179NormalizeLoggingModes(
    b?.settings?.v179LoggingModes
  );

  out.settings=out.settings||{};
  out.settings.v179LoggingModes=
    (Number(am.modifiedAt)||0)>=(Number(bm.modifiedAt)||0)
      ?am
      :bm;

  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    179
  );

  return out;
};

const v179VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v179VerifyCloudStateBase(
    cloudState,
    expected
  );
  const problems=[...(base?.missing||[])];

  const cloud=v179NormalizeLoggingModes(
    cloudState?.settings?.v179LoggingModes
  );
  const wanted=v179NormalizeLoggingModes(
    expected?.settings?.v179LoggingModes
  );

  if(JSON.stringify(cloud)!==JSON.stringify(wanted)){
    problems.push('Logging method preferences');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

const v179BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);
  const payload=v179BuildFullBackupBase();

  payload.backupSchemaVersion=V179_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(
    JSON.stringify(S.settings||DEFAULT_SETTINGS)
  );

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=
    V179_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v179 backup. Includes remembered logging-method preferences for normal logging and Batch Log: direct amount consumed or final progress. In final-progress mode MediaFlow calculates consumed units from the title’s starting Library progress while preserving the existing History, XP, repeat, completion, scheduler and Library-update pipelines.';

  return payload;
};

const v179BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v179BackupManifestBase(
    state,
    extras
  );
  const modes=v179NormalizeLoggingModes(
    state?.settings?.v179LoggingModes
  );

  manifest.schemaVersion=V179_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign(
    {},
    manifest.includes||{},
    {
      dualLoggingModes:true,
      finalProgressLogging:true,
      batchFinalProgressLogging:true,
      automaticConsumedDifference:true
    }
  );

  manifest.loggingModes={
    single:modes.single,
    batch:modes.batch
  };

  return manifest;
};

// v152 Automatic Backup resolves the final Full Backup builder dynamically.



/* ============================================================
   MediaFlow v180
   SAME-CATEGORY RECOMMENDED-TITLE REROLLS
   + TASK-LOCAL REROLL HISTORY
   + MULTI-TITLE SYSTEM RESPECT XP
   ============================================================ */

const V180_BACKUP_SCHEMA_VERSION=17;
const V180_RESPECT_XP_VERSION=180;

function v180HistoryEntry(item,index=0){
  return {
    libraryId:String(item?.id||''),
    title:cleanTitle(item?.title||''),
    shownAt:Date.now(),
    index:Math.max(0,Math.floor(Number(index)||0))
  };
}

function v180EnsureRecommendationHistory(task=S.currentTask){
  if(!task||!S.settings?.exactTitleRecommendations)return [];

  if(!Array.isArray(task.v180RecommendationHistory)){
    task.v180RecommendationHistory=[];
  }

  // Existing task from an older build: the title already on the task becomes
  // Recommendation #1 for this task.
  if(
    task.v180RecommendationHistory.length===0 &&
    (task.libraryId||task.title)
  ){
    const item=v50FindLibraryItem(task.libraryId,task.title);
    task.v180RecommendationHistory.push(
      v180HistoryEntry(
        item||{
          id:task.libraryId||'',
          title:task.title||''
        },
        0
      )
    );
  }

  // Normalize without destroying historical title text if the Library entry
  // was later removed.
  task.v180RecommendationHistory=
    task.v180RecommendationHistory
      .filter(x=>x&&typeof x==='object')
      .map((x,index)=>({
        libraryId:String(x.libraryId||''),
        title:cleanTitle(x.title||''),
        shownAt:Math.max(0,Number(x.shownAt)||0),
        index
      }));

  task.v180TitleRerolls=Math.max(
    0,
    task.v180RecommendationHistory.length-1
  );

  return task.v180RecommendationHistory;
}

function v180IsPerTitleUnit(task){
  const cat=getCategory(task?.categoryId||'');
  const unit=String(cat?.unit||task?.unit||'').toLowerCase();

  // These units represent separate Library titles, unlike episodes/chapters/
  // issues which normally belong to one series/title.
  return /(^|[^a-z])(movies?|films?|books?|titles?)([^a-z]|$)/i.test(unit);
}

function v180RespectSlotLimit(task){
  if(!S.settings?.exactTitleRecommendations)return 0;
  if(!task)return 0;

  if(v180IsPerTitleUnit(task)){
    return Math.max(
      1,
      Math.round(Number(task.targetMid)||1)
    );
  }

  // Episode/chapter/issue tasks still have one exact-title recommendation
  // opportunity, regardless of how many units the task asks the user to consume.
  return 1;
}

function v180RecommendationIdentity(entry){
  return {
    id:String(entry?.libraryId||''),
    title:v165NormalizedTitle(entry?.title||'')
  };
}

function v180ResolveHistoryItem(entry){
  if(!entry)return null;

  if(entry.libraryId){
    const byId=(S.library||[]).find(
      item=>String(item?.id||'')===String(entry.libraryId)
    );
    if(byId)return byId;
  }

  const key=v165NormalizedTitle(entry.title||'');
  return key
    ?(S.library||[]).find(
      item=>v165NormalizedTitle(item?.title||'')===key
    )||null
    :null;
}

function v180RecommendationCandidates(task=S.currentTask){
  if(!task)return [];

  const cat=getCategory(task.categoryId);
  let pool=(S.library||[]).filter(item=>
    item &&
    String(item.categoryId||'')===String(cat.id||'') &&
    item.status!=='completed' &&
    item.status!=='dropped'
  );

  if(!pool.length)return [];

  const seen=new Set(
    v180EnsureRecommendationHistory(task)
      .map(x=>String(x.libraryId||''))
      .filter(Boolean)
  );

  pool=pool.filter(item=>!seen.has(String(item.id||'')));
  if(!pool.length)return [];

  if(
    S.settings?.prioritizePersonalOrder &&
    Array.isArray(S.orderPlan?.titleIds)
  ){
    const rank=new Map(
      S.orderPlan.titleIds.map(
        (id,index)=>[String(id),index]
      )
    );

    pool.sort((a,b)=>{
      const ar=rank.has(String(a.id))
        ?rank.get(String(a.id))
        :Number.MAX_SAFE_INTEGER;
      const br=rank.has(String(b.id))
        ?rank.get(String(b.id))
        :Number.MAX_SAFE_INTEGER;

      if(ar!==br)return ar-br;
      return scoreLibraryTitle(b,cat)-scoreLibraryTitle(a,cat);
    });

    return pool;
  }

  return pool.sort(
    (a,b)=>scoreLibraryTitle(b,cat)-scoreLibraryTitle(a,cat)
  );
}

function v180RerollRecommendedTitle(){
  const task=S.currentTask;

  if(
    !task ||
    !S.settings?.exactTitleRecommendations
  ){
    showToast('Exact title recommendations are not active.');
    return;
  }

  v180EnsureRecommendationHistory(task);

  const next=v180RecommendationCandidates(task)[0];
  if(!next){
    showToast('No other eligible Library titles are available in this category.');
    return;
  }

  const history=task.v180RecommendationHistory;
  history.push(
    v180HistoryEntry(next,history.length)
  );

  task.libraryId=next.id;
  task.title=cleanTitle(next.title);
  task.v180TitleRerolls=history.length-1;
  task.v180RecommendationUpdatedAt=Date.now();

  // Deliberately DO NOT call v165RecordReroll().
  // This is a title reroll inside the SAME category task, not "Give me
  // something else". It never damages the no-Skip or first-category-pick
  // streaks by itself.
  persistTask();
  render();

  showToast(
    `Next recommended title · ${cleanTitle(next.title)}`
  );
}

function v180HistoryCoverHtml(entry){
  const item=v180ResolveHistoryItem(entry);
  const cat=getCategory(
    item?.categoryId||S.currentTask?.categoryId||''
  );
  const title=cleanTitle(item?.title||entry?.title||'');

  if(item?.coverUrl){
    return `<img class="v180-history-cover"
      src="${escapeHtml(item.coverUrl)}"
      alt="${escapeHtml(title)} cover"
      loading="lazy"
      onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
      <div class="v180-history-cover-ph" style="display:none">
        ${v144CategoryIconHtml(cat)}
      </div>`;
  }

  return `<div class="v180-history-cover-ph">
    ${v144CategoryIconHtml(cat)}
  </div>`;
}

function v180RerollHistoryHtml(){
  const task=S.currentTask;
  const history=v180EnsureRecommendationHistory(task);
  const slotLimit=v180RespectSlotLimit(task);
  const rerolls=Math.max(0,history.length-1);
  const cat=getCategory(task?.categoryId||'');

  const rows=history.map((entry,index)=>{
    const item=v180ResolveHistoryItem(entry);
    const title=cleanTitle(
      item?.title||entry.title||'Unavailable title'
    );
    const eligible=index<slotLimit;
    const current=
      String(task?.libraryId||'')===
      String(entry.libraryId||'') &&
      index===history.length-1;

    return `<div class="v180-history-row ${current?'current':''}">
      ${v180HistoryCoverHtml(entry)}

      <div class="v180-history-copy">
        <b>${escapeHtml(title)}</b>

        <div class="v180-history-meta">
          <span>Recommendation #${index+1}</span>

          ${
            index===0
              ?'<span>Initial pick</span>'
              :`<span>Reroll #${index}</span>`
          }

          <span class="v180-history-badge ${eligible?'eligible':'extra'}">
            ${
              eligible
                ?`Respect slot ${index+1}/${slotLimit}`
                :'Extra reroll'
            }
          </span>

          ${
            current
              ?'<span class="v180-history-badge current">Current</span>'
              :''
          }
        </div>
      </div>

      <div class="v180-history-actions">
        ${
          item?.id
            ?`<button type="button"
                class="btn btn-sm btn-ghost"
                onclick="App.v180EditHistoryTitle('${escapeHtml(String(item.id))}')">
                Edit
              </button>`
            :''
        }
      </div>
    </div>`;
  }).join('');

  const targetText=v180IsPerTitleUnit(task)
    ?`${slotLimit} title${slotLimit===1?'':'s'}`
    :'1 exact title';

  return `<div class="modal-overlay"
      id="v180-reroll-history"
      onclick="if(event.target===this)App.v180CloseRerollHistory()">

    <div class="modal v180-history-modal">
      <div class="v180-history-head">
        <div>
          <div class="modal-title" style="margin:0;padding:0;background:none;">
            Current rerolls
          </div>

          <div class="v180-history-summary">
            ${v144CategoryIconHtml(cat)}
            ${escapeHtml(cat?.name||'Task')} ·
            ${rerolls} title reroll${rerolls===1?'':'s'} ·
            ${history.length} recommendation${history.length===1?'':'s'} shown
          </div>
        </div>

        <button type="button"
          class="btn btn-sm btn-ghost"
          onclick="App.v180CloseRerollHistory()">
          Close
        </button>
      </div>

      <div class="v180-respect-explain">
        This task can earn exact-title Respect XP from the <b>first ${targetText}</b>
        MediaFlow recommends. You can reroll as much as you want without a reroll
        penalty. Extra recommendations stay available to watch, but a title shown
        after the task's Respect slots does not retroactively replace a missed
        earlier recommendation.
      </div>

      <div class="v180-history-list">
        ${rows||'<div class="hint">No recommendation history yet.</div>'}
      </div>
    </div>
  </div>`;
}

function v180OpenRerollHistory(){
  if(
    !S.currentTask ||
    !S.settings?.exactTitleRecommendations
  ){
    showToast('There is no current title-reroll history.');
    return;
  }

  v180EnsureRecommendationHistory(S.currentTask);
  document.getElementById('v180-reroll-history')?.remove();
  document.body.insertAdjacentHTML(
    'beforeend',
    v180RerollHistoryHtml()
  );
}

function v180CloseRerollHistory(){
  document.getElementById('v180-reroll-history')?.remove();
}

function v180EditHistoryTitle(id){
  v180CloseRerollHistory();

  if(!id)return;
  const item=(S.library||[]).find(
    row=>String(row?.id||'')===String(id)
  );

  if(!item){showToast('That Library title is no longer available.');
    return;
  }

  App.openLibraryModal(item.id);
}

Object.assign(App,{
  v180RerollRecommendedTitle,
  v180OpenRerollHistory,
  v180CloseRerollHistory,
  v180EditHistoryTitle
});

/* ---------- Every NEW category task gets a fresh title history ---------- */

const v180GenerateTaskBase=generateTask;
generateTask=function(excludeIds){
  const task=v180GenerateTaskBase.apply(this,arguments);

  if(
    task &&
    S.settings?.exactTitleRecommendations &&
    (task.libraryId||task.title)
  ){
    task.v180RecommendationHistory=[];
    task.v180TitleRerolls=0;
    v180EnsureRecommendationHistory(task);
  }

  return task;
};

/* ---------- Dashboard controls beside the recommended title ---------- */

const v180RenderDashboardBase=renderDashboard;
renderDashboard=function(){
  let h=v180RenderDashboardBase();
  const task=S.currentTask;

  if(
    !task?.title ||
    !S.settings?.exactTitleRecommendations
  ){
    return h;
  }

  const history=v180EnsureRecommendationHistory(task);
  const rerolls=Math.max(0,history.length-1);

  const controls=`<div class="v180-rec-actions">
    <button type="button"
      class="btn btn-sm"
      onclick="App.v180RerollRecommendedTitle()"
      title="Keep this category task and show the next MediaFlow-recommended title">
      Reroll title
    </button>

    <button type="button"
      class="btn btn-sm btn-ghost"
      onclick="App.v180OpenRerollHistory()"
      title="Show every title MediaFlow recommended for this current task">
      Rerolls history
      <span class="v180-reroll-count">${rerolls}</span>
    </button>
  </div>`;

  // v174 already adds Edit beside both cover-rich and plain recommendations.
  // Append v180 controls after that Edit button, still inside the same row.
  const editPattern=/(<button type="button"\s+class="btn btn-sm btn-ghost v174-recommended-edit"[\s\S]*?<\/button>)/;

  if(editPattern.test(h)){
    return h.replace(
      editPattern,
      `$1${controls}`
    );
  }

  // Safety fallback for an unexpected older dashboard representation.
  const richPattern=/(<div class="hero-note v50-title-feature">[\s\S]*?<\/div><\/div>)/;
  if(richPattern.test(h)){
    return h.replace(
      richPattern,
      `<div class="v174-recommended-title-row">$1${controls}</div>`
    );
  }

  return h;
};

/* ============================================================
   v180 SYSTEM RESPECT XP
   ------------------------------------------------------------
   Exact-title XP is now earned PER respected recommendation slot.
   For Movies/other per-title units, target 3 means Recommendations #1–#3
   can each independently earn exact-title XP.
   Rerolls after those slots are never penalized; they simply do not replace
   a missed earlier Respect slot.
   ============================================================ */

function v180LoggedTitleSet(entries,groupRows){
  const ids=new Set();
  const titles=new Set();

  const add=(libraryId,title,qty)=>{
    if(!(Number(qty)>0))return;

    const id=String(libraryId||'');
    const key=v165NormalizedTitle(title||'');

    if(id)ids.add(id);
    if(key)titles.add(key);
  };

  for(const e of (entries||[])){
    add(e?.libraryId,e?.title,e?.qty);
  }

  for(const s of (groupRows||[])){
    for(const t of (s?.titles||[])){
      add(t?.libraryId,t?.title,t?.qty);
    }
  }

  return {ids,titles};
}

function v180RespectMatchInfo(task,entries,groupRows){
  if(!S.settings?.exactTitleRecommendations){
    return {
      slotLimit:0,
      eligible:[],
      matched:[],
      matchedCount:0
    };
  }

  const history=v180EnsureRecommendationHistory(task);
  const slotLimit=v180RespectSlotLimit(task);
  const eligible=history.slice(0,slotLimit);
  const logged=v180LoggedTitleSet(entries,groupRows);
  const matched=[];

  for(let index=0;index<eligible.length;index++){
    const rec=eligible[index];
    const ident=v180RecommendationIdentity(rec);

    const hit=
      (ident.id&&logged.ids.has(ident.id)) ||
      (ident.title&&logged.titles.has(ident.title));

    if(hit){
      matched.push({
        slot:index+1,
        libraryId:ident.id,
        title:cleanTitle(
          v180ResolveHistoryItem(rec)?.title||
          rec.title||
          ''
        )
      });
    }
  }

  return {
    slotLimit,
    eligible,
    matched,
    matchedCount:matched.length
  };
}

// Compatibility helper now means "at least one eligible recommendation was
// actually logged", not merely "the final title currently on the task".
v165RecommendedTitleLogged=function(task,entries,groupRows){
  return v180RespectMatchInfo(
    task,
    entries,
    groupRows
  ).matchedCount>0;
};

// FINAL respect reward implementation. It preserves v167's user-configurable
// category/title XP and streak multipliers, while changing exact-title credit
// from one boolean to a per-eligible-title count.
v165ApplyRespectReward=function(task,entries,sessionGroupId,assignedCat){
  const st=v165EnsureRespectState();
  const cfg=v167RespectConfig();
  const groupRows=v165GroupSessions(sessionGroupId);

  const respected=groupRows.some(s=>
    s &&
    s.status!=='skipped' &&
    String(s.categoryId||'')===
      String(task?.categoryId||assignedCat?.id||'') &&
    Number(s.actualAmount)>0
  );

  if(!respected){
    st.noSkipStreak=0;
    st.noRerollStreak=0;
    st.currentRerolls=0;
    st.modifiedAt=Date.now();
    return 0;
  }

  // currentRerolls remains CATEGORY rerolls ("Give me something else").
  // v180 title rerolls never touch this value, therefore browsing next
  // recommended titles has no first-pick/no-Skip penalty.
  const hadCategoryReroll=st.currentRerolls>0;

  st.noSkipStreak++;

  if(hadCategoryReroll)st.noRerollStreak=0;
  else st.noRerollStreak++;

  st.bestNoSkipStreak=Math.max(
    st.bestNoSkipStreak,
    st.noSkipStreak
  );
  st.bestNoRerollStreak=Math.max(
    st.bestNoRerollStreak,
    st.noRerollStreak
  );

  const exactEnabled=!!S.settings?.exactTitleRecommendations;
  const match=v180RespectMatchInfo(
    task,
    entries,
    groupRows
  );

  const categoryXP=Math.max(
    0,
    Math.round(Number(cfg.categoryBaseXP)||0)
  );

  const exactPerTitle=Math.max(
    0,
    Math.round(Number(cfg.exactTitleBaseXP)||0)
  );

  const exactTitleXP=exactEnabled
    ?exactPerTitle*match.matchedCount
    :0;

  const baseRespectXP=categoryXP+exactTitleXP;
  const mult=v165RespectMultipliers(
    st.noSkipStreak,
    st.noRerollStreak
  );
  const levelingEnabled=levelingSettings().enabled!==false;

  const bonus=levelingEnabled
    ?Math.max(
      0,
      Math.round(
        baseRespectXP*
        mult.noSkip*
        mult.noReroll
      )
    )
    :0;

  const target=
    groupRows.find(s=>
      s &&
      s.status!=='skipped' &&
      String(s.categoryId||'')===String(task?.categoryId||'')
    ) ||
    groupRows.find(s=>s&&s.status!=='skipped');

  if(target){
    target.v165RespectBonusXP=bonus;
    target.v165RespectBaseXP=baseRespectXP;
    target.v165SystemBaseXP=categoryXP;
    target.v165RecommendedTitleBaseXP=exactTitleXP;
    target.v165RecommendedTitleFollowed=match.matchedCount>0;
    target.v165ExactTitleRecommendationEnabled=exactEnabled;

    // Keep legacy single-title fields populated with the INITIAL recommendation
    // for older views/backups that know only one title.
    const initial=match.eligible[0]||
      v180EnsureRecommendationHistory(task)[0]||
      null;

    target.v165RecommendedLibraryId=exactEnabled
      ?String(initial?.libraryId||task?.libraryId||'')
      :'';
    target.v165RecommendedTitle=exactEnabled
      ?cleanTitle(initial?.title||task?.title||'')
      :'';

    target.v165NoSkipStreak=st.noSkipStreak;
    target.v165NoRerollStreak=st.noRerollStreak;
    target.v165NoSkipMultiplier=mult.noSkip;
    target.v165NoRerollMultiplier=mult.noReroll;
    target.v165RespectMultiplier=mult.combined;
    target.v165RerollsBeforeLog=st.currentRerolls;
    target.v165RespectXPVersion=V165_RESPECT_XP_VERSION;

    // v180 audit fields.
    target.v180RespectXPVersion=V180_RESPECT_XP_VERSION;
    target.v180TitleRerollsBeforeLog=Math.max(
      0,
      v180EnsureRecommendationHistory(task).length-1
    );
    target.v180RespectSlotLimit=match.slotLimit;
    target.v180RespectEligibleShown=match.eligible.length;
    target.v180RespectMatchedCount=match.matchedCount;
    target.v180RespectMatchedRecommendations=
      match.matched.map(x=>Object.assign({},x));
    target.v180RecommendationHistory=
      v180EnsureRecommendationHistory(task)
        .map(x=>Object.assign({},x));
    target.v180ExactTitleXPPerMatch=exactPerTitle;

    // Preserve the exact configurable reward settings that produced this row.
    target.v167RespectConfigAtLog={
      categoryBaseXP:categoryXP,
      exactTitleBaseXP:exactPerTitle,
      noSkipGrowthPercent:cfg.noSkipGrowthPercent,
      noSkipCapPercent:cfg.noSkipCapPercent,
      firstPickGrowthPercent:cfg.firstPickGrowthPercent,
      firstPickCapPercent:cfg.firstPickCapPercent
    };
  }

  st.currentRerolls=0;
  st.lastRewardAt=Date.now();
  st.modifiedAt=st.lastRewardAt;

  if(bonus>0){
    const titlePart=exactEnabled
      ?` · ${match.matchedCount}/${match.slotLimit} recommended title${match.slotLimit===1?'':'s'} respected`
      :'';

    setTimeout(()=>showToast(
      `System respected · +${bonus.toLocaleString()} XP${titlePart} · no-Skip ${st.noSkipStreak} · first-pick ${st.noRerollStreak}`
    ),0);
  }

  return bonus;
};

/* ---------- Historical merge + cache/audit compatibility ---------- */

const v180MergeSessionRespectFieldsBase=v165MergeSessionRespectFields;
v165MergeSessionRespectFields=function(target,...sources){
  const result=v180MergeSessionRespectFieldsBase(
    target,
    ...sources
  );

  const keys=[
    'v180RespectXPVersion',
    'v180TitleRerollsBeforeLog',
    'v180RespectSlotLimit',
    'v180RespectEligibleShown',
    'v180RespectMatchedCount',
    'v180RecommendationHistory',
    'v180RespectMatchedRecommendations',
    'v180ExactTitleXPPerMatch'
  ];

  for(const src of sources){
    if(!src||typeof src!=='object')continue;

    for(const key of keys){
      if(
        Object.prototype.hasOwnProperty.call(src,key) &&
        src[key]!==undefined &&
        src[key]!==null
      ){
        result[key]=(
          typeof src[key]==='object'
            ?JSON.parse(JSON.stringify(src[key]))
            :src[key]
        );
      }
    }
  }

  return result;
};

// When the live XP cache is rebuilt, make the old
// recommendedTitleFollowedRewards statistic count individual v180 matches
// instead of only rewarded sessions.
const v180BuildLiveXPCacheBase=v150BuildLiveXPCache;
v150BuildLiveXPCache=function(){
  const c=v180BuildLiveXPCacheBase();

  let matchedTitles=0;

  for(const s of (S.sessions||[])){
    if(Number(s?.v180RespectXPVersion)>=V180_RESPECT_XP_VERSION){
      matchedTitles+=Math.max(
        0,
        Math.floor(Number(s.v180RespectMatchedCount)||0)
      );
    }else if(s?.v165RecommendedTitleFollowed){
      matchedTitles++;
    }
  }

  c.recommendedTitleFollowedRewards=matchedTitles;
  return c;
};

function v180RespectHistoryAudit(state){
  let count=0;
  let matched=0;
  let rerolls=0;
  let xor=0;
  let sum=0;

  for(const s of (state?.sessions||[])){
    if(Number(s?.v180RespectXPVersion)<V180_RESPECT_XP_VERSION)continue;

    count++;
    matched+=Math.max(
      0,
      Math.floor(Number(s.v180RespectMatchedCount)||0)
    );
    rerolls+=Math.max(
      0,
      Math.floor(Number(s.v180TitleRerollsBeforeLog)||0)
    );

    const hash=v176Fnv(
      JSON.stringify({
        id:String(s.id||''),
        slots:Number(s.v180RespectSlotLimit)||0,
        matched:Number(s.v180RespectMatchedCount)||0,
        history:Array.isArray(s.v180RecommendationHistory)
          ?s.v180RecommendationHistory
          :[],
        matches:Array.isArray(s.v180RespectMatchedRecommendations)
          ?s.v180RespectMatchedRecommendations
          :[]
      })
    );

    xor=(xor^hash)>>>0;
    sum=(sum+hash)>>>0;
  }

  return {count,matched,rerolls,xor,sum};
}

function v180CurrentTaskAudit(state){
  const task=state?.currentTask;
  if(!task)return {id:'',count:0,xor:0};

  const history=Array.isArray(task.v180RecommendationHistory)
    ?task.v180RecommendationHistory
    :[];

  return {
    id:String(task.id||''),
    count:history.length,
    xor:v176Fnv(JSON.stringify(history))
  };
}

/* ---------- Protected Sync Now verification ---------- */

const v180VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v180VerifyCloudStateBase(
    cloudState,
    expected
  );
  const problems=[...(base?.missing||[])];

  const ca=v180RespectHistoryAudit(cloudState);
  const ea=v180RespectHistoryAudit(expected);

  if(
    ca.count!==ea.count ||
    ca.matched!==ea.matched ||
    ca.rerolls!==ea.rerolls ||
    ca.xor!==ea.xor ||
    ca.sum!==ea.sum
  ){
    problems.push('Title-reroll Respect XP History');
  }

  const ct=v180CurrentTaskAudit(cloudState);
  const et=v180CurrentTaskAudit(expected);

  if(
    ct.id!==et.id ||
    ct.count!==et.count ||
    ct.xor!==et.xor
  ){
    problems.push('Current task reroll history');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

/* ---------- Apply loaded state ---------- */

const v180ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v180ApplyStateBase.apply(this,arguments);

  if(
    S.currentTask &&
    S.settings?.exactTitleRecommendations
  ){
    v180EnsureRecommendationHistory(S.currentTask);
  }

  return result;
};

/* ---------- Full Backup / Automatic Backup ---------- */

const v180BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v180BuildFullBackupBase();

  payload.backupSchemaVersion=V180_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=
    V180_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v180 backup. Includes task-local same-category recommended-title reroll history, current recommendation state, and per-title System Respect XP audit data. Title rerolls never reset category Respect streaks. For per-title tasks such as Movies, the first required number of recommendations are independent exact-title Respect XP slots; later rerolls remain usable choices but do not replace missed earlier slots.';

  return payload;
};

const v180BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v180BackupManifestBase(
    state,
    extras
  );
  const audit=v180RespectHistoryAudit(state);
  const current=v180CurrentTaskAudit(state);

  manifest.schemaVersion=V180_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign(
    {},
    manifest.includes||{},
    {
      sameCategoryTitleRerolls:true,
      currentTaskRerollHistory:true,
      recommendationHistoryCoversByLibraryReference:true,
      multiTitleSystemRespectXP:true,
      titleRerollsWithoutRespectPenalty:true,
      firstRequiredRecommendationsRespectSlots:true
    }
  );

  manifest.counts=Object.assign(
    {},
    manifest.counts||{},
    {
      v180RespectRewardSessions:audit.count,
      v180MatchedRecommendedTitles:audit.matched,
      v180HistoricalTitleRerolls:audit.rerolls,
      currentTaskRecommendationHistory:current.count
    }
  );

  return manifest;
};

// v152 Automatic Backup resolves the final Full Backup builder dynamically.



