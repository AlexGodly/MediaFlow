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

