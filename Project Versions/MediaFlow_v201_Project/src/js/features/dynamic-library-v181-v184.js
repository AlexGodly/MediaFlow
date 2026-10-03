/* MediaFlow v201 source fragment
 * Dynamic Library, global title details and readability controls
 * Original HTML lines 35317-38101.
 * Build order matters; see scripts/build.mjs.
 */

/* ============================================================
   MediaFlow v181
   - Classic / Dynamic Library experience
   - Two new Library display modes: Cover Only / Cover + Title
   - Global click-any-title-cover details popup + quick detail editing
   - One default Logging method (Last Progress recommended/default)
   - Unlimited per-surface cover sizing from Settings
   ============================================================ */

const V181_BACKUP_SCHEMA_VERSION=18;

const V181_LIBRARY_DEFAULT={
  mode:'classic',
  categoryOrder:[],
  hiddenCategoryIds:[],
  statusOrder:['active','paused','completed','dropped','planned'],
  activeCategoryId:'',
  activeStatus:'active',
  modifiedAt:0
};

const V181_LOGGING_DEFAULT={
  defaultMode:'progress',
  modifiedAt:0
};

const V181_COVER_SIZE_DEFAULTS={
  library:100,
  order:100,
  recommended:100,
  rating:100,
  onThisDayFirst:100,
  onThisDayList:100,
  logging:100,
  history:100,
  rerollHistory:100,
  modifiedAt:0
};

const V181_COVER_LABELS={
  library:'Library covers',
  order:'Ordered titles',
  recommended:'Recommended title',
  rating:'Rating Queue title',
  onThisDayFirst:'First On This Day cover',
  onThisDayList:'On This Day list covers',
  logging:'Logging / Batch Log results',
  history:'History / timeline title covers',
  rerollHistory:'Rerolls history covers'
};

function v181UniqueStrings(values){
  const out=[];
  const seen=new Set();

  for(const value of (Array.isArray(values)?values:[])){
    const key=String(value||'');
    if(!key||seen.has(key))continue;
    seen.add(key);
    out.push(key);
  }

  return out;
}

function v181NormalizeLibrarySettings(raw,categories=S.categories){
  const src=(raw&&typeof raw==='object')?raw:{};
  const cats=Array.isArray(categories)?categories:[];
  const validIds=new Set(cats.filter(Boolean).map(c=>String(c.id||'')).filter(Boolean));

  let categoryOrder=v181UniqueStrings(src.categoryOrder)
    .filter(id=>validIds.has(id));

  for(const cat of cats){
    const id=String(cat?.id||'');
    if(id&&!categoryOrder.includes(id))categoryOrder.push(id);
  }

  const hiddenCategoryIds=v181UniqueStrings(src.hiddenCategoryIds)
    .filter(id=>validIds.has(id));

  const validStatuses=['active','paused','completed','dropped','planned'];
  let statusOrder=v181UniqueStrings(src.statusOrder)
    .filter(x=>validStatuses.includes(x));

  for(const status of validStatuses){
    if(!statusOrder.includes(status))statusOrder.push(status);
  }

  const visible=categoryOrder.filter(id=>!hiddenCategoryIds.includes(id));
  const requestedCat=String(src.activeCategoryId||'');
  const activeCategoryId=visible.includes(requestedCat)
    ?requestedCat
    :(visible[0]||categoryOrder[0]||'');

  const requestedStatus=String(src.activeStatus||'');
  const activeStatus=statusOrder.includes(requestedStatus)
    ?requestedStatus
    :'active';

  return {
    mode:src.mode==='dynamic'?'dynamic':'classic',
    categoryOrder,
    hiddenCategoryIds,
    statusOrder,
    activeCategoryId,
    activeStatus,
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v181EnsureLibrarySettings(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.v181Library=v181NormalizeLibrarySettings(
    settings.v181Library,
    S.categories
  );
  return settings.v181Library;
}

function v181NormalizeLogging(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  return {
    defaultMode:src.defaultMode==='amount'?'amount':'progress',
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v181EnsureLogging(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.v181Logging=v181NormalizeLogging(settings.v181Logging);
  return settings.v181Logging;
}

function v181ClampCoverSize(value,fallback=100){
  const n=Number(value);
  if(!Number.isFinite(n)||n<=0){
    return Math.max(10,Number(fallback)||100);
  }

  // Intentionally NO upper clamp in v181.
  return Math.max(10,Math.round(n*100)/100);
}

function v181NormalizeCoverSizes(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  const out={};

  for(const key of Object.keys(V181_COVER_SIZE_DEFAULTS)){
    if(key==='modifiedAt')continue;
    out[key]=v181ClampCoverSize(
      src[key],
      V181_COVER_SIZE_DEFAULTS[key]
    );
  }

  out.modifiedAt=Math.max(0,Number(src.modifiedAt)||0);
  return out;
}

function v181EnsureCoverSizes(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};

  const normalized=v181NormalizeCoverSizes(
    settings.v181CoverSizes
  );

  // First-time migration from v177's Library / Order scale settings.
  if(!settings.v181CoverSizes){
    const old=settings.v177CoverSizes||{};
    normalized.library=v181ClampCoverSize(
      old.library,
      normalized.library
    );
    normalized.order=v181ClampCoverSize(
      old.order,
      normalized.order
    );
  }

  settings.v181CoverSizes=normalized;
  return normalized;
}

v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
v181EnsureLogging(S.settings||DEFAULT_SETTINGS);
v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);

/* ============================================================
   Default Logging Mode
   ============================================================ */

function v181DefaultLoggingMode(){
  return v181EnsureLogging(S.settings||DEFAULT_SETTINGS).defaultMode;
}

// v179 originally remembered one choice for normal Logging and a second for
// Batch Log. v181 changes that contract: there is ONE Settings default.
// A switch inside an open Logging / Batch Log page is temporary only.
v179Mode=function(kind){
  if(kind==='batch'){
    if(S.view==='batch'&&S.batchDraft?.v179Mode){
      return v179NormalizeMode(S.batchDraft.v179Mode);
    }
    return v181DefaultLoggingMode();
  }

  if(S.logging&&S.logDraft?.v179Mode){
    return v179NormalizeMode(S.logDraft.v179Mode);
  }

  return v181DefaultLoggingMode();
};

v179SetLogMode=function(kind,mode){
  const safeKind=kind==='batch'?'batch':'single';
  const safeMode=v179NormalizeMode(mode);

  if(safeKind==='single'){
    if(!S.logDraft)return;

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

        if(entry.v179EndProgress==null||entry.v179EndProgress===''){
          entry.v179EndProgress=v179ClampEndProgress(
            item,
            start+Math.max(0,Number(entry.qty)||1)
          );
        }

        entry.qty=v179CalculatedQty(
          item,
          entry.v179StartProgress,
          entry.v179EndProgress
        );
      }

      const selected=S.entryDraft?.libraryId
        ?S.library.find(i=>i.id===S.entryDraft.libraryId)
        :null;

      if(selected){
        const start=v179StartProgress(selected);
        S.entryDraft.endProgress=v179ClampEndProgress(
          selected,
          start+1
        );
      }

      v179SyncSingleFromEntries();
    }

    render();
    return;
  }

  ensureBatchDraft();
  S.batchDraft.v179Mode=safeMode;

  if(safeMode==='progress'){
    for(const row of S.batchDraft.rows){
      const item=row.libraryId
        ?S.library.find(i=>i.id===row.libraryId)
        :null;

      if(!item)continue;

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
};
App.v179SetLogMode=v179SetLogMode;

// Opening Dashboard Logging always starts from the Settings default.
const v181OpenLogFormBase=App.openLogForm;
App.openLogForm=function(){
  const result=v181OpenLogFormBase.apply(this,arguments);

  if(S.logDraft){
    S.logDraft.v179Mode=v181DefaultLoggingMode();

    if(S.logDraft.v179Mode==='progress'){
      S.logDraft.updateLibrary=true;
      S.logDraft.amount=0;
      S.logDraft.minutes=0;
      S.entryDraft=S.entryDraft||{title:'',qty:1,libraryId:null};
      S.entryDraft.endProgress='';
    }

    render();
  }

  return result;
};

function v181PrepareBatchDefault(){
  ensureBatchDraft();
  S.batchDraft.v179Mode=v181DefaultLoggingMode();
}

// Desktop/sidebar navigation.
const v181SetViewBase=App.setView;
App.setView=function(v){
  if(v==='batch'&&S.view!=='batch'){
    v181PrepareBatchDefault();
  }
  return v181SetViewBase.call(this,v);
};

// Mobile navigation.
const v181MobileNavBase=App.mobileNav;
App.mobileNav=function(v){
  if(v==='batch'&&S.view!=='batch'){
    v181PrepareBatchDefault();
  }
  return v181MobileNavBase.call(this,v);
};

function v181SetDefaultLoggingMode(mode){
  const cfg=v181EnsureLogging(S.settings||DEFAULT_SETTINGS);
  cfg.defaultMode=mode==='amount'?'amount':'progress';
  cfg.modifiedAt=Date.now();
  persistSettings();
  render();

  showToast(
    cfg.defaultMode==='progress'
      ?'Default logging mode: Last progress'
      :'Default logging mode: Amount consumed'
  );
}

/* ============================================================
   Unlimited per-surface Cover Size Manager
   ============================================================ */

function v181CoverSize(kind){
  const cfg=v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  return v181ClampCoverSize(
    cfg[kind],
    V181_COVER_SIZE_DEFAULTS[kind]||100
  );
}

function v181CoverScale(kind){
  return v181CoverSize(kind)/100;
}

function v181ApplyCoverVars(){
  const root=document.documentElement;
  const map={
    library:'--v181-cover-library',
    order:'--v181-cover-order',
    recommended:'--v181-cover-recommended',
    rating:'--v181-cover-rating',
    onThisDayFirst:'--v181-cover-otd-first',
    onThisDayList:'--v181-cover-otd-list',
    logging:'--v181-cover-logging',
    history:'--v181-cover-history',
    rerollHistory:'--v181-cover-reroll-history'
  };

  for(const [key,varName] of Object.entries(map)){
    root.style.setProperty(
      varName,
      String(v181CoverScale(key))
    );
  }

  // v177 Library / Order layout columns still use these local variables.
  document.querySelectorAll('[data-v177-cover-scope="library"]').forEach(el=>{
    el.style.setProperty(
      '--v177-library-scale',
      String(v181CoverScale('library'))
    );
  });document.querySelectorAll('[data-v177-cover-scope="order"]').forEach(el=>{
    el.style.setProperty(
      '--v177-order-scale',
      String(v181CoverScale('order'))
    );
  });
}

function v181PreviewCoverSize(kind,value){
  const next=v181ClampCoverSize(
    value,
    V181_COVER_SIZE_DEFAULTS[kind]||100
  );

  const root=document.documentElement;
  const varMap={
    library:'--v181-cover-library',
    order:'--v181-cover-order',
    recommended:'--v181-cover-recommended',
    rating:'--v181-cover-rating',
    onThisDayFirst:'--v181-cover-otd-first',
    onThisDayList:'--v181-cover-otd-list',
    logging:'--v181-cover-logging',
    history:'--v181-cover-history',
    rerollHistory:'--v181-cover-reroll-history'
  };

  if(varMap[kind]){
    root.style.setProperty(
      varMap[kind],
      String(next/100)
    );
  }

  if(kind==='library'){
    document.querySelectorAll('[data-v177-cover-scope="library"]').forEach(el=>{
      el.style.setProperty(
        '--v177-library-scale',
        String(next/100)
      );
    });
  }

  if(kind==='order'){
    document.querySelectorAll('[data-v177-cover-scope="order"]').forEach(el=>{
      el.style.setProperty(
        '--v177-order-scale',
        String(next/100)
      );
    });
  }

  const number=document.getElementById(`v181-cover-number-${kind}`);
  if(number&&document.activeElement!==number){
    number.value=String(next);
  }

  const range=document.getElementById(`v181-cover-range-${kind}`);
  if(range&&Number(next)<=400){
    range.value=String(next);
  }
}

function v181SetCoverSize(kind,value){
  if(!Object.prototype.hasOwnProperty.call(V181_COVER_SIZE_DEFAULTS,kind))return;
  if(kind==='modifiedAt')return;

  const cfg=v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  cfg[kind]=v181ClampCoverSize(
    value,
    V181_COVER_SIZE_DEFAULTS[kind]||100
  );
  cfg.modifiedAt=Date.now();

  // Keep the legacy v177 object aligned for old backups/builds that read it.
  if(kind==='library'||kind==='order'){
    S.settings.v177CoverSizes=S.settings.v177CoverSizes||{};
    S.settings.v177CoverSizes[kind]=cfg[kind];
    S.settings.v177CoverSizes.modifiedAt=cfg.modifiedAt;
  }

  v181ApplyCoverVars();
  v181PreviewCoverSize(kind,cfg[kind]);
  persistSettings();
}

function v181ResetCoverSizes(){
  S.settings.v181CoverSizes=Object.assign(
    {},
    V181_COVER_SIZE_DEFAULTS,
    {modifiedAt:Date.now()}
  );

  S.settings.v177CoverSizes=Object.assign(
    {},
    S.settings.v177CoverSizes||{},
    {
      library:100,
      order:100,
      modifiedAt:Date.now()
    }
  );

  v181ApplyCoverVars();
  persistSettings();
  render();
  showToast('Cover sizes reset to defaults.');
}

function v181InlineCoverControl(kind,label='Cover size'){
  const value=v181CoverSize(kind);

  return `<label class="v181-inline-cover-control">
    <span>${escapeHtml(label)}</span>

    <input type="range"
      id="v181-cover-range-${kind}"
      min="25"
      max="400"
      step="5"
      value="${Math.min(400,value)}"
      oninput="App.v181PreviewCoverSize('${kind}',this.value)"
      onchange="App.v181SetCoverSize('${kind}',this.value)"
      aria-label="${escapeHtml(label)} slider">

    <input type="number"
      id="v181-cover-number-${kind}"
      min="10"
      step="5"
      value="${value}"
      oninput="App.v181PreviewCoverSize('${kind}',this.value)"
      onchange="App.v181SetCoverSize('${kind}',this.value)"
      aria-label="${escapeHtml(label)} percentage"
      title="No maximum size">
  </label>`;
}

// Make the existing Library / Order page controls use v181's unlimited setting.
v177ClampCoverSize=function(value,fallback=100){
  return v181ClampCoverSize(value,fallback);
};
v177CoverSize=function(kind){
  return v181CoverSize(kind==='order'?'order':'library');
};
v177ScaleValue=function(kind){
  return String(
    v181CoverScale(kind==='order'?'order':'library')
  );
};
v177CoverSliderHtml=function(kind,label){
  return v181InlineCoverControl(
    kind==='order'?'order':'library',
    label
  );
};
App.v177SetCoverSize=function(kind,value){
  v181SetCoverSize(
    kind==='order'?'order':'library',
    value
  );
};
App.v177PreviewCoverSize=function(kind,value){
  v181PreviewCoverSize(
    kind==='order'?'order':'library',
    value
  );
};

Object.assign(App,{
  v181PreviewCoverSize,
  v181SetCoverSize,
  v181ResetCoverSizes
});

v181ApplyCoverVars();

/* ============================================================
   Library Display Modes
   ============================================================ */

function v181SetLibraryView(mode){
  const allowed=new Set([
    'list',
    'compact',
    'cards',
    'covers',
    'covers-title'
  ]);

  if(!allowed.has(String(mode)))return;

  S.settings.libraryView=String(mode);
  S.libPage=0;
  persistSettings();
  render();
}
App.setLibraryView=v181SetLibraryView;

function v181DisplaySwitchHtml(){
  const mode=S.settings.libraryView||'list';

  const modes=[
    ['list','List'],
    ['compact','Compact'],
    ['cards','Cards'],
    ['covers','Covers'],
    ['covers-title','Covers + titles']
  ];

  return `<div class="v181-display-switch">
    <span class="hint">Display:</span>
    ${modes.map(([id,label])=>`<button type="button"
      class="btn btn-sm ${mode===id?'active':''}"
      onclick="App.setLibraryView('${id}')">
      ${escapeHtml(label)}
    </button>`).join('')}
  </div>`;
}

/* ============================================================
   Classic / Dynamic Library switch
   ============================================================ */

function v181LibraryModeSwitchHtml(){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);

  return `<div class="v181-library-mode-switch">
    <span class="hint">Library mode:</span>

    <button type="button"
      class="btn btn-sm ${cfg.mode==='classic'?'active':''}"
      onclick="App.v181SetLibraryMode('classic')">
      Current
    </button>

    <button type="button"
      class="btn btn-sm ${cfg.mode==='dynamic'?'active':''}"
      onclick="App.v181SetLibraryMode('dynamic')">
      Dynamic
    </button>
  </div>`;
}

function v181SetLibraryMode(mode){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  cfg.mode=mode==='dynamic'?'dynamic':'classic';
  cfg.modifiedAt=Date.now();
  S.libPage=0;
  persistSettings();
  render();
}

function v181MoveInArray(arr,index,delta){
  const next=index+delta;
  if(index<0||next<0||next>=arr.length)return arr;
  const out=arr.slice();
  const [value]=out.splice(index,1);
  out.splice(next,0,value);
  return out;
}

function v181MoveDynamicCategory(id,delta){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const index=cfg.categoryOrder.indexOf(String(id));
  cfg.categoryOrder=v181MoveInArray(
    cfg.categoryOrder,
    index,
    Number(delta)||0
  );
  cfg.modifiedAt=Date.now();
  persistSettings();
  render();
}

function v181ToggleDynamicCategory(id,visible){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const set=new Set(cfg.hiddenCategoryIds||[]);

  if(visible)set.delete(String(id));
  else set.add(String(id));

  cfg.hiddenCategoryIds=[...set];
  const normalized=v181NormalizeLibrarySettings(cfg,S.categories);

  Object.assign(cfg,normalized,{modifiedAt:Date.now()});
  S.libPage=0;
  persistSettings();
  render();
}

function v181MoveDynamicStatus(status,delta){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const index=cfg.statusOrder.indexOf(String(status));

  cfg.statusOrder=v181MoveInArray(
    cfg.statusOrder,
    index,
    Number(delta)||0
  );
  cfg.modifiedAt=Date.now();
  persistSettings();
  render();
}

function v181SelectDynamicCategory(id){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const visible=cfg.categoryOrder.filter(
    x=>!cfg.hiddenCategoryIds.includes(x)
  );

  if(!visible.includes(String(id)))return;

  cfg.activeCategoryId=String(id);
  cfg.modifiedAt=Date.now();
  S.libPage=0;
  persistSettings();
  render();
}

function v181SelectDynamicStatus(status){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);

  if(!cfg.statusOrder.includes(String(status)))return;

  cfg.activeStatus=String(status);
  cfg.modifiedAt=Date.now();
  S.libPage=0;
  persistSettings();
  render();
}

function v181ResetDynamicLibrary(){
  const previousMode=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS).mode;

  S.settings.v181Library=v181NormalizeLibrarySettings(
    Object.assign(
      {},
      V181_LIBRARY_DEFAULT,
      {
        mode:previousMode,
        modifiedAt:Date.now()
      }
    ),
    S.categories
  );

  S.libPage=0;
  persistSettings();
  render();
  showToast('Dynamic Library layout reset.');
}

Object.assign(App,{
  v181SetLibraryMode,
  v181MoveDynamicCategory,
  v181ToggleDynamicCategory,
  v181MoveDynamicStatus,
  v181SelectDynamicCategory,
  v181SelectDynamicStatus,
  v181ResetDynamicLibrary,
  v181SetDefaultLoggingMode
});

/* ============================================================
   Dynamic Library rendering
   ============================================================ */

function v181SortDynamicRows(rows){
  const mode=S.histFilters?.libSort||'priority-desc';
  const rank={low:0,medium:1,high:2};
  const n=value=>Number.isFinite(Number(value))?Number(value):0;

  const titleCmp=(a,b)=>cleanTitle(a.title).localeCompare(
    cleanTitle(b.title),
    undefined,
    {numeric:true,sensitivity:'base'}
  );

  return rows.slice().sort((a,b)=>{
    let d=0;

    if(mode==='title-asc')return titleCmp(a,b);
    if(mode==='title-desc')return titleCmp(b,a);

    if(mode==='priority-asc'){
      d=(rank[String(a.priority||'medium')]??1)-
        (rank[String(b.priority||'medium')]??1);
    }else if(mode==='priority-desc'||mode==='priority'){
      d=(rank[String(b.priority||'medium')]??1)-
        (rank[String(a.priority||'medium')]??1);
    }else if(mode==='rating-desc'){
      d=n(b.rating)-n(a.rating);
    }else if(mode==='rating-asc'){
      d=n(a.rating)-n(b.rating);
    }else if(mode==='progress-desc'){
      d=n(b.progress)-n(a.progress);
    }else if(mode==='progress-asc'){
      d=n(a.progress)-n(b.progress);
    }else if(mode==='total-desc'){
      d=n(b.total)-n(a.total);
    }else if(mode==='total-asc'){
      d=n(a.total)-n(b.total);
    }

    return d||titleCmp(a,b);
  });
}

function v181DynamicRows(){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const q=String(S.histFilters?.libSearch||'').trim().toLowerCase();
  const priority=String(S.histFilters?.libPriority||'all');

  let rows=(S.library||[]).filter(item=>
    item &&
    String(item.categoryId||'')===String(cfg.activeCategoryId||'') &&
    String(item.status||'planned')===String(cfg.activeStatus||'active')
  );

  if(priority!=='all'){
    rows=rows.filter(
      item=>String(item.priority||'medium')===priority
    );
  }

  if(q){
    rows=rows.filter(item=>{
      const rich=[
        item.title,
        item.mediaFormat,
        item.mediaSource,
        item.demographic,
        item.year,
        ...(Array.isArray(item.genres)?item.genres:[]),
        ...(Array.isArray(item.themes)?item.themes:[]),
        ...(Array.isArray(item.studios)?item.studios:[]),
        ...(Array.isArray(item.tags)?item.tags:[])
      ].join(' ').toLowerCase();

      return rich.includes(q);
    });
  }

  return v181SortDynamicRows(rows);
}

function v181DynamicCoverHtml(item,placeholderClass='v181-cover-tile-placeholder'){
  const cat=getCategory(item.categoryId);

  if(item.coverUrl){
    return `<img class="v181-cover-tile-cover"
      data-library-id="${escapeHtml(String(item.id))}"
      src="${escapeHtml(item.coverUrl)}"
      alt="${escapeHtml(cleanTitle(item.title))} cover"
      loading="lazy"
      onclick="event.stopPropagation();App.v181OpenTitleDetails('${escapeHtml(String(item.id))}')"
      onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
      <div class="${placeholderClass}"
        style="display:none"
        onclick="App.v181OpenTitleDetails('${escapeHtml(String(item.id))}')">
        ${v144CategoryIconHtml(cat)}
      </div>`;
  }

  return `<div class="${placeholderClass}"
    onclick="App.v181OpenTitleDetails('${escapeHtml(String(item.id))}')">
    ${v144CategoryIconHtml(cat)}
  </div>`;
}

function v181DynamicFullRowHtml(item){
  const cat=getCategory(item.categoryId);
  const rating=Number(item.rating)>0
    ?` <span class="v44-rating">★ ${Number(item.rating).toFixed(1)}</span>`
    :'';

  const cover=item.coverUrl
    ?`<img class="library-cover-thumb"
        data-library-id="${escapeHtml(String(item.id))}"
        src="${escapeHtml(item.coverUrl)}"
        alt="${escapeHtml(cleanTitle(item.title))} cover"
        loading="lazy"
        onerror="this.style.display='none'">`
    :'';

  const progress=item.total!=null
    ?`· ${Number(item.progress)||0} / ${item.total} ${unitLabel(cat.unit,Number(item.total)||0)}`
    :(Number(item.progress)>0
      ?`· ${Number(item.progress)} ${unitLabel(cat.unit,Number(item.progress)||0)}`
      :'');

  return `<div class="item-row" data-library-id="${escapeHtml(String(item.id))}">
    <input type="checkbox"
      class="mf-select"
      data-mf-select="${escapeHtml(String(item.id))}"
      ${S.librarySelection?.[item.id]?'checked':''}
      onchange="App.toggleLibrarySelect('${escapeHtml(String(item.id))}',this.checked)">

    ${cover}

    <div class="bal-icon"
      style="background:${cat.color}22;color:${cat.color};">
      ${v144CategoryIconHtml(cat)}
    </div>

    <div class="v176-library-copy">
      <div class="item-title">
        ${escapeHtml(cleanTitle(item.title))}
        ${rating}
        ${
          item.source==='mal'
            ?'<span class="tag">MAL</span>'
            :item.source==='simkl'
              ?'<span class="tag">Imported</span>'
              :''
        }
      </div>

      <div class="item-sub">
        <button type="button"
          class="pill category-click"
          style="text-transform:none;border:1px solid var(--border-soft);color:inherit;background:transparent;padding:2px 7px;"
          onclick="event.preventDefault();event.stopPropagation();App.chooseCategoryForLibrary('${escapeHtml(String(item.id))}')">
          ${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}
        </button>
        ${progress}
        ${
          Array.isArray(item.tags)&&item.tags.length
            ?' · '+item.tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')
            :''
        }
      </div>

      ${v176LibraryInfoHtml(item)}
    </div>

    <button type="button"
      class="pill status-click"
      style="text-transform:none;border:1px solid transparent;color:inherit;"
      onclick="event.preventDefault();event.stopPropagation();App.chooseStatusForLibrary('${escapeHtml(String(item.id))}')">
      ${escapeHtml(v199StatusLabel(item.status))}
    </button>

    <button type="button"
      class="pill priority-click"
      style="text-transform:capitalize;border:0;color:inherit;"
      onclick="event.preventDefault();event.stopPropagation();App.choosePriority('${escapeHtml(String(item.id))}')">
      ${escapeHtml(item.priority||'medium')} priority
    </button>

    <button type="button"
      class="btn btn-sm btn-ghost"
      onclick="event.preventDefault();event.stopPropagation();App.openLibraryModal('${escapeHtml(String(item.id))}')">
      Edit
    </button>

    <button type="button"
      class="btn btn-sm btn-danger"
      onclick="event.preventDefault();event.stopPropagation();App.deleteLibraryItem('${escapeHtml(String(item.id))}')">
      Delete
    </button>
  </div>`;
}

function v181DynamicTileHtml(item,mode){
  if(mode==='covers'||mode==='covers-title'){
    return `<div class="v181-cover-tile"
      data-library-id="${escapeHtml(String(item.id))}">
      ${v181DynamicCoverHtml(item)}
      ${
        mode==='covers-title'
          ?`<div class="v181-cover-tile-title">${escapeHtml(cleanTitle(item.title))}</div>`
          :''
      }
    </div>`;
  }

  return v181DynamicFullRowHtml(item);
}

function v181DynamicPager(total,pageSize){
  const pages=Math.max(1,Math.ceil(total/pageSize));
  S.libPage=Math.max(
    0,
    Math.min(
      Math.floor(Number(S.libPage)||0),
      pages-1
    )
  );

  if(total<=pageSize)return '';

  const buttons=[];
  let start=Math.max(0,S.libPage-2);
  if(start+4>pages-1){
    start=Math.max(0,pages-5);
  }

  for(let p=start;p<=Math.min(pages-1,start+4);p++){
    buttons.push(
      `<button type="button"
        class="btn btn-sm ${p===S.libPage?'page-current':''}"
        onclick="App.setLibPage(${p})">
        ${p+1}
      </button>`
    );
  }

  return `<div class="lib-pagination">
    <button type="button"
      class="btn btn-sm"
      ${S.libPage<=0?'disabled':''}
      onclick="App.setLibPage(${S.libPage-1})">
      ← Prev
    </button>

    ${buttons.join('')}

    <button type="button"
      class="btn btn-sm"
      ${S.libPage>=pages-1?'disabled':''}
      onclick="App.setLibPage(${S.libPage+1})">
      Next →
    </button>

    <small class="hint">
      Page ${S.libPage+1} of ${pages} · ${total.toLocaleString()} titles
    </small>
  </div>`;
}

function v181RenderDynamicLibrary(){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const visibleCats=cfg.categoryOrder.filter(
    id=>!cfg.hiddenCategoryIds.includes(id)
  );
  const cats=visibleCats
    .map(id=>S.categories.find(c=>String(c.id)===String(id)))
    .filter(Boolean);

  if(!cats.length){
    return `<div class="view-head">
        <div>
          <div class="view-title">Library</div>
          <div class="view-desc">Dynamic Library mode</div>
        </div>
        <button class="btn btn-primary" onclick="App.openLibraryModal()">+ Add title</button>
      </div>
      ${v181LibraryModeSwitchHtml()}
      ${v183LibraryOverviewToggleHtml()}
      ${v183LibraryOverviewEnabled()?v183LibraryOverviewHtml():''}
      <div class="empty-state card">
        <div class="em-icon">🗂️</div>
        <div class="em-title">No Dynamic Library categories are visible</div>
        <div>Open Settings and enable at least one category for the Dynamic Library row.</div>
      </div>`;
  }

  if(!visibleCats.includes(cfg.activeCategoryId)){
    cfg.activeCategoryId=visibleCats[0];
  }

  if(!cfg.statusOrder.includes(cfg.activeStatus)){
    cfg.activeStatus=cfg.statusOrder[0]||'active';
  }

  const activeCat=getCategory(cfg.activeCategoryId);
  const allForActive=(S.library||[]).filter(
    item=>item&&String(item.categoryId)===String(activeCat.id)
  );

  const categoryButtons=cats.map(cat=>{
    const count=(S.library||[]).filter(
      item=>item&&String(item.categoryId)===String(cat.id)
    ).length;

    return `<button type="button"
      class="btn btn-sm ${String(cat.id)===String(cfg.activeCategoryId)?'active':''}"
      onclick="App.v181SelectDynamicCategory('${escapeHtml(String(cat.id))}')">
      ${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}
      <span class="v181-dynamic-count">${count.toLocaleString()}</span>
    </button>`;
  }).join('');

  const statusButtons=cfg.statusOrder.map(status=>{
    const count=allForActive.filter(
      item=>String(item.status||'planned')===status
    ).length;

    return `<button type="button"
      class="btn btn-sm ${status===cfg.activeStatus?'active':''}"
      onclick="App.v181SelectDynamicStatus('${status}')">
      ${v199StatusLabel(status)}
      <span class="v181-dynamic-count">${count.toLocaleString()}</span>
    </button>`;
  }).join('');

  const rows=v181DynamicRows();
  const pageSize=v175PageSize('library');
  const pages=Math.max(1,Math.ceil(rows.length/pageSize));
  S.libPage=Math.max(
    0,
    Math.min(Math.floor(Number(S.libPage)||0),pages-1)
  );

  const pageRows=rows.slice(
    S.libPage*pageSize,
    S.libPage*pageSize+pageSize
  );

  const mode=S.settings.libraryView||'list';
  const pager=v181DynamicPager(rows.length,pageSize);

  const body=pageRows.length
    ?pageRows.map(item=>v181DynamicTileHtml(item,mode)).join('')
    :`<div class="empty-state">
        No ${escapeHtml(v199StatusLabel(cfg.activeStatus))} titles match the current filters.
      </div>`;

  const bodyClass=(mode==='covers'||mode==='covers-title')
    ?`v181-dynamic-${mode}`
    :'card';

  return `<div class="v177-library-cover-scope library-view-${mode}"
      data-v177-cover-scope="library"
      style="--v177-library-scale:${v181CoverScale('library')}">

    <div class="view-head">
      <div>
        <div class="view-title">Library</div>
        <div class="view-desc">
          Dynamic mode · category → status → titles
        </div>
      </div>

      <button class="btn btn-primary" onclick="App.openLibraryModal()">+ Add title</button>
      <button class="btn btn-danger" onclick="App.emptyLibraryAdvanced()">Empty library</button>
    </div>

    ${v181LibraryModeSwitchHtml()}

    ${v183LibraryOverviewToggleHtml()}
    ${v183LibraryOverviewEnabled()?v183LibraryOverviewHtml():''}

    <div class="v181-dynamic-nav">
      <div class="v181-dynamic-row">
        <span class="v181-dynamic-row-label">Category</span>
        ${categoryButtons}
      </div>

      <div class="v181-dynamic-row">
        <span class="v181-dynamic-row-label">Status</span>
        ${statusButtons}
      </div>
    </div>

    ${v181DisplaySwitchHtml()}

    <div class="v181-dynamic-toolbar">
      <input type="text"
        class="lib-search"
        value="${escapeHtml(S.histFilters?.libSearch||'')}"
        placeholder="Search this category/status…"
        oninput="App.searchLibrary(this.value)">

      <select onchange="App.v69SetLibrarySort(this.value)"
        aria-label="Library display order">
        <option value="priority-desc" ${['priority','priority-desc'].includes(S.histFilters?.libSort||'priority')?'selected':''}>Priority: High → Low</option>
        <option value="priority-asc" ${S.histFilters?.libSort==='priority-asc'?'selected':''}>Priority: Low → High</option>
        <option value="title-asc" ${S.histFilters?.libSort==='title-asc'?'selected':''}>Title: A → Z</option>
        <option value="title-desc" ${S.histFilters?.libSort==='title-desc'?'selected':''}>Title: Z → A</option>
        <option value="rating-desc" ${S.histFilters?.libSort==='rating-desc'?'selected':''}>Rating: High → Low</option>
        <option value="rating-asc" ${S.histFilters?.libSort==='rating-asc'?'selected':''}>Rating: Low → High</option>
        <option value="progress-desc" ${S.histFilters?.libSort==='progress-desc'?'selected':''}>Progress: Most → Least</option>
        <option value="progress-asc" ${S.histFilters?.libSort==='progress-asc'?'selected':''}>Progress: Least → Most</option>
        <option value="total-desc" ${S.histFilters?.libSort==='total-desc'?'selected':''}>Total: Most → Least</option>
        <option value="total-asc" ${S.histFilters?.libSort==='total-asc'?'selected':''}>Total: Least → Most</option>
      </select>

      <select onchange="App.setLibFilter('libPriority',this.value)">
        <option value="all" ${(S.histFilters?.libPriority||'all')==='all'?'selected':''}>All priorities</option>
        ${['high','medium','low'].map(priority=>`<option value="${priority}"
          ${S.histFilters?.libPriority===priority?'selected':''}>
          ${priority[0].toUpperCase()+priority.slice(1)}
        </option>`).join('')}
      </select>

      ${v175PageSizeControlHtml('library','Titles per page')}
      ${v181InlineCoverControl('library','Cover size')}

      <span class="spacer"></span>
    </div>

    <div class="v181-dynamic-summary">
      ${v144CategoryIconHtml(activeCat)}
      <b>${escapeHtml(activeCat.name)}</b>
      <span>›</span>
      <b>${escapeHtml(v199StatusLabel(cfg.activeStatus))}</b>
      <span>·</span>
      <span>${rows.length.toLocaleString()} matching title${rows.length===1?'':'s'}</span>
    </div>

    ${pager}
    <div class="${bodyClass}">${body}</div>
    ${pager}
  </div>`;
}

/* ---------- Final Library renderer ---------- */

const v181ClassicLibraryBase=renderLibrary;
renderLibrary=function(){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);

  if(cfg.mode==='dynamic'){
    return v181RenderDynamicLibrary();
  }

  let h=v181ClassicLibraryBase();

  // Replace v43's 3-view switch with the five v181 display choices.
  h=h.replace(
    /<div class="v43-view-switch"[^>]*>[\s\S]*?<\/div>/,
    v181DisplaySwitchHtml()
  );

  // Make the Library experience mode switch available directly on the page.
  if(!h.includes('v181-library-mode-switch')){
    h=h.replace(
      v181DisplaySwitchHtml(),
      v181LibraryModeSwitchHtml()+v181DisplaySwitchHtml()
    );
  }

  return h;
};

/* ============================================================
   Global Title Details Popup
   ============================================================ */

function v181NormalizeUrl(value){
  try{
    return new URL(String(value||''),location.href).href;
  }catch(_){
    return String(value||'').trim();
  }
}

function v181ResolveCoverItem(img){
  if(!img)return null;

  const direct=String(
    img.dataset?.libraryId||
    img.closest?.('[data-library-id]')?.dataset?.libraryId||
    ''
  );

  if(direct){
    const byId=(S.library||[]).find(
      item=>String(item?.id||'')===direct
    );
    if(byId)return byId;
  }

  const src=v181NormalizeUrl(
    img.currentSrc||img.src||img.getAttribute?.('src')||''
  );

  if(src){
    const byCover=(S.library||[]).find(
      item=>item?.coverUrl&&
        v181NormalizeUrl(item.coverUrl)===src
    );
    if(byCover)return byCover;
  }

  const alt=String(img.alt||'')
    .replace(/\s+cover$/i,'')
    .trim();

  if(alt){
    const key=v165NormalizedTitle(alt);
    const matches=(S.library||[]).filter(
      item=>v165NormalizedTitle(item?.title||'')===key
    );

    if(matches.length===1)return matches[0];
  }

  return null;
}

function v181MarkClickableCovers(){
  document.querySelectorAll('img').forEach(img=>{
    if(
      img.closest('.v181-title-details-overlay')||
      img.closest('.v181-quick-detail-overlay')||
      img.closest('#modal-root')
    ){
      return;
    }

    const item=v181ResolveCoverItem(img);
    if(!item)return;

    img.classList.add('v181-title-cover-clickable');
    img.dataset.v181LibraryId=String(item.id||'');

    if(!img.title){
      img.title='Open title details';
    }
  });
}

function v181FmtDateValue(value){
  if(!value)return '—';

  const n=Number(value);
  let d;

  if(Number.isFinite(n)&&n>1000000000){
    d=new Date(n);
  }else{
    const parsed=Date.parse(String(value));
    if(!Number.isFinite(parsed))return String(value);
    d=new Date(parsed);
  }

  return Number.isNaN(d.getTime())
    ?'—'
    :d.toLocaleDateString(undefined,{
      year:'numeric',
      month:'short',
      day:'numeric'
    });
}

function v181DetailDisplay(value,fallback='—'){
  if(Array.isArray(value)){
    return value.length?value.join(', '):fallback;
  }

  if(value===null||value===undefined||value===''){
    return fallback;
  }

  return String(value);
}

function v181DetailButton(item,key,label,value,wide=false){
  return `<button type="button"
    class="v181-detail-card ${wide?'v181-wide':''}"
    onclick="App.v181QuickEditDetail('${escapeHtml(String(item.id))}','${escapeHtml(key)}')">
    <small>${escapeHtml(label)}</small>
    <b>${escapeHtml(v181DetailDisplay(value))}</b>
  </button>`;
}

function v181ReadonlyDetail(label,value,wide=false){
  return `<div class="v181-detail-card v181-detail-readonly ${wide?'v181-wide':''}">
    <small>${escapeHtml(label)}</small>
    <b>${escapeHtml(v181DetailDisplay(value))}</b>
  </div>`;
}

function v181ExternalIdsText(item){
  const ext=item?.externalIds&&typeof item.externalIds==='object'
    ?item.externalIds
    :{};

  const rows=Object.entries(ext)
    .filter(([,value])=>value!==null&&value!==undefined&&String(value)!=='')
    .map(([key,value])=>`${key.toUpperCase()}: ${value}`);

  return rows.join(' · ')||'—';
}

function v181TitleDetailsHtml(item){
  const cat=getCategory(item.categoryId);
  const progress=Math.max(0,Number(item.progress)||0);
  const total=Number(item.total)>0?Number(item.total):null;
  const pct=total
    ?Math.min(100,Math.round(progress/total*100))
    :0;

  const cover=item.coverUrl
    ?`<img class="v181-title-hero-cover"
        src="${escapeHtml(item.coverUrl)}"
        alt="${escapeHtml(cleanTitle(item.title))} cover">`
    :`<div class="v181-title-hero-placeholder">
        ${v144CategoryIconHtml(cat)}
      </div>`;

  return `<div class="v181-title-details-overlay"
      id="v181-title-details-overlay"
      onclick="if(event.target===this)App.v181CloseTitleDetails()">

    <div class="v181-title-details-modal">
      <div class="v181-title-hero">
        ${cover}

        <div class="v181-title-hero-copy">
          <h2>${escapeHtml(cleanTitle(item.title))}</h2><div class="v181-title-hero-meta">
            <span class="pill">${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</span>
            <span class="pill">${escapeHtml(v199StatusLabel(item.status))}</span>
            <span class="pill">${escapeHtml(item.priority||'medium')} priority</span>
            ${Number(item.rating)>0?`<span class="pill">★ ${Number(item.rating).toFixed(1)}</span>`:''}
            ${item.mediaFormat?`<span class="pill">${escapeHtml(String(item.mediaFormat))}</span>`:''}
            ${item.year?`<span class="pill">${escapeHtml(String(item.year))}</span>`:''}
          </div>

          <div class="v181-title-progress">
            <div class="v181-title-progress-head">
              <span>Progress</span>
              <b>${progress}${total?` / ${total}`:''} ${escapeHtml(unitLabel(cat.unit,total||progress||2))}</b>
            </div>
            ${
              total
                ?`<div class="progress-track">
                    <div class="progress-fill" style="width:${pct}%"></div>
                  </div>`
                :''
            }
          </div>
        </div>

        <div class="v181-detail-actions" style="margin:0;">
          <button type="button"
            class="btn btn-sm btn-primary"
            onclick="App.v181EditFullTitle('${escapeHtml(String(item.id))}')">
            Edit title
          </button>

          <button type="button"
            class="btn btn-sm btn-ghost"
            onclick="App.v181CloseTitleDetails()">
            Close
          </button>
        </div>
      </div>

      <div class="v181-title-details-body">
        <div class="v181-detail-section-label">Library</div>

        <div class="v181-detail-grid">
          ${v181DetailButton(item,'title','Title',cleanTitle(item.title),true)}
          ${v181DetailButton(item,'categoryId','Category',cat.name)}
          ${v181DetailButton(item,'status','Status',v199StatusLabel(item.status))}
          ${v181DetailButton(item,'priority','Priority',item.priority||'medium')}
          ${v181DetailButton(item,'progress','Current progress',progress)}
          ${v181DetailButton(item,'total','Total',total??'Unknown')}
          ${v181DetailButton(item,'rating','Your rating',Number(item.rating)>0?Number(item.rating).toFixed(1):'Not rated')}
          ${v181DetailButton(item,'estimatedMinutes','Estimated minutes',item.estimatedMinutes??'—')}
          ${v181DetailButton(item,'tags','Tags',item.tags||[])}
          ${v181DetailButton(item,'coverUrl','Cover URL',item.coverUrl||'No cover',true)}
        </div>

        <div class="v181-detail-section-label" style="margin-top:14px;">Title metadata</div>

        <div class="v181-detail-grid">
          ${v181DetailButton(item,'year','Year',item.year||'—')}
          ${v181DetailButton(item,'mediaFormat','Media format',item.mediaFormat||'—')}
          ${v181DetailButton(item,'durationMinutes','Runtime',item.durationMinutes?`${item.durationMinutes} min`:'—')}
          ${v181DetailButton(item,'releaseDate','Release date',v181FmtDateValue(item.releaseDate))}
          ${v181DetailButton(item,'seasonLabel','Season',item.seasonLabel||'—')}
          ${v181DetailButton(item,'ageRating','Content rating',item.ageRating||'—')}
          ${v181DetailButton(item,'communityScore','Community score',item.communityScore||'—')}
          ${v181DetailButton(item,'mediaSource','Source material',item.mediaSource||'—')}
          ${v181DetailButton(item,'demographic','Demographic',item.demographic||'—')}
          ${v181DetailButton(item,'studios','Studios',item.studios||[])}
          ${v181DetailButton(item,'producers','Producers',item.producers||[])}
          ${v181DetailButton(item,'genres','Genres',item.genres||[])}
          ${v181DetailButton(item,'themes','Themes',item.themes||[])}
          ${v181DetailButton(item,'synopsis','Synopsis / description',item.synopsis||'—',true)}
        </div>

        <div class="v181-detail-section-label" style="margin-top:14px;">Dates & source</div>

        <div class="v181-detail-grid">
          ${v181DetailButton(item,'startedAt','Started',v181FmtDateValue(item.startedAt))}
          ${v181DetailButton(item,'completedAt','Finished',v181FmtDateValue(item.completedAt))}
          ${v181ReadonlyDetail('Imported / created source',item.source||'manual')}
          ${v181ReadonlyDetail('External IDs',v181ExternalIdsText(item),true)}
        </div>

        <div class="v181-detail-actions">
          <button type="button"
            class="btn btn-primary"
            onclick="App.v181EditFullTitle('${escapeHtml(String(item.id))}')">
            Edit all title details
          </button>

          <button type="button"
            class="btn btn-ghost"
            onclick="App.v181CloseTitleDetails()">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>`;
}

function v181OpenTitleDetails(id){
  const item=(S.library||[]).find(
    row=>String(row?.id||'')===String(id)
  );

  if(!item){
    showToast('That title is no longer in your Library.');
    return;
  }

  document.getElementById('v181-title-details-overlay')?.remove();
  document.getElementById('v181-quick-detail-overlay')?.remove();

  document.body.insertAdjacentHTML(
    'beforeend',
    v181TitleDetailsHtml(item)
  );
}

function v181CloseTitleDetails(){
  document.getElementById('v181-title-details-overlay')?.remove();
  document.getElementById('v181-quick-detail-overlay')?.remove();
}

function v181EditFullTitle(id){
  v181CloseTitleDetails();
  App.openLibraryModal(id);
}

function v181QuickSchema(item,key){
  const categories=(S.categories||[]).map(c=>[
    String(c.id),
    `${v144CategoryIconText(c)} ${c.name}`
  ]);

  const status=[
    ['planned','Plan to Watch'],
    ['active','Watching'],
    ['paused','On Hold'],
    ['completed','Completed'],
    ['dropped','Dropped']
  ];

  const priority=[
    ['low','Low'],
    ['medium','Medium'],
    ['high','High']
  ];

  const text=(label,value,type='text')=>({
    label,
    input:`<input id="v181-quick-value"
      type="${type}"
      value="${escapeHtml(String(value??''))}">`
  });

  const number=(label,value,attrs='')=>({
    label,
    input:`<input id="v181-quick-value"
      type="number"
      ${attrs}
      value="${value??''}">`
  });

  const select=(label,value,options)=>({
    label,
    input:`<select id="v181-quick-value">
      ${options.map(([id,name])=>`<option value="${escapeHtml(id)}"
        ${String(value)===String(id)?'selected':''}>
        ${escapeHtml(name)}
      </option>`).join('')}
    </select>`
  });

  const list=(label,value)=>text(
    label,
    Array.isArray(value)?value.join(', '):''
  );

  const dateValue=value=>{
    if(!value)return '';
    if(/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return String(value);

    const n=Number(value);
    const d=Number.isFinite(n)&&n>1000000000
      ?new Date(n)
      :new Date(String(value));

    return Number.isNaN(d.getTime())
      ?''
      :d.toISOString().slice(0,10);
  };

  switch(key){
    case 'title':return text('Title',cleanTitle(item.title));
    case 'categoryId':return select('Category',item.categoryId,categories);
    case 'status':return select('Status',item.status||'planned',status);
    case 'priority':return select('Priority',item.priority||'medium',priority);
    case 'progress':return number('Current progress',Number(item.progress)||0,'min="0" step="1"');
    case 'total':return number('Total',item.total??'','min="0" step="1"');
    case 'rating':return number('Your rating',item.rating??'','min="0" max="10" step="0.1"');
    case 'estimatedMinutes':return number('Estimated minutes',item.estimatedMinutes??'','min="0" step="1"');
    case 'tags':return list('Tags — comma separated',item.tags);
    case 'coverUrl':return text('Cover URL',item.coverUrl||'','url');
    case 'year':return number('Year',item.year??'','min="0" max="9999" step="1"');
    case 'mediaFormat':return text('Media format',item.mediaFormat||'');
    case 'durationMinutes':return number('Runtime / duration (minutes)',item.durationMinutes??'','min="0" step="1"');
    case 'releaseDate':return text('Release date',dateValue(item.releaseDate),'date');
    case 'seasonLabel':return text('Season',item.seasonLabel||'');
    case 'ageRating':return text('Content / age rating',item.ageRating||'');
    case 'communityScore':return number('Community score',item.communityScore??'','min="0" max="10" step="0.01"');
    case 'mediaSource':return text('Source material',item.mediaSource||'');
    case 'demographic':return text('Demographic',item.demographic||'');
    case 'studios':return list('Studios — comma separated',item.studios);
    case 'producers':return list('Producers — comma separated',item.producers);
    case 'genres':return list('Genres — comma separated',item.genres);
    case 'themes':return list('Themes — comma separated',item.themes);
    case 'synopsis':
      return {
        label:'Synopsis / description',
        input:`<textarea id="v181-quick-value">${escapeHtml(String(item.synopsis||''))}</textarea>`
      };
    case 'startedAt':return text('Started',dateValue(item.startedAt),'date');
    case 'completedAt':return text('Finished',dateValue(item.completedAt),'date');
    default:return null;
  }
}

function v181QuickEditDetail(id,key){
  const item=(S.library||[]).find(
    row=>String(row?.id||'')===String(id)
  );
  if(!item)return;

  const schema=v181QuickSchema(item,key);
  if(!schema)return;

  document.getElementById('v181-quick-detail-overlay')?.remove();

  document.body.insertAdjacentHTML(
    'beforeend',
    `<div class="v181-quick-detail-overlay"
        id="v181-quick-detail-overlay"
        onclick="if(event.target===this)App.v181CloseQuickDetail()">

      <div class="v181-quick-detail-modal">
        <h3>${escapeHtml(schema.label)}</h3>
        <div class="hint">
          Quick edit · changes save to the same Library title.
        </div>

        <div class="field">
          ${schema.input}
        </div>

        <div class="v181-quick-detail-actions">
          <button type="button"
            class="btn btn-ghost"
            onclick="App.v181CloseQuickDetail()">
            Cancel
          </button>

          <button type="button"
            class="btn btn-primary"
            onclick="App.v181SaveQuickDetail('${escapeHtml(String(item.id))}','${escapeHtml(key)}')">
            Save
          </button>
        </div>
      </div>
    </div>`
  );

  setTimeout(()=>{
    const input=document.getElementById('v181-quick-value');
    input?.focus?.();
    if(input?.select&&input.tagName!=='SELECT')input.select();
  },0);
}

function v181CloseQuickDetail(){
  document.getElementById('v181-quick-detail-overlay')?.remove();
}

function v181QuickList(value){
  return [...new Set(
    String(value||'')
      .split(',')
      .map(x=>v176SafeText(x,120))
      .filter(Boolean)
  )].slice(0,40);
}

function v181DateTimestamp(value){
  const raw=String(value||'').trim();
  if(!raw)return null;

  const ts=new Date(raw+'T12:00:00').getTime();
  return Number.isFinite(ts)?ts:null;
}

function v181SaveQuickDetail(id,key){
  const item=(S.library||[]).find(
    row=>String(row?.id||'')===String(id)
  );
  const input=document.getElementById('v181-quick-value');

  if(!item||!input)return;

  const value=input.value;
  v181CloseQuickDetail();

  // Use the established Library actions for fields with important side effects.
  if(key==='status'){
    App.setLibraryStatus(item.id,value);
    setTimeout(()=>v181OpenTitleDetails(item.id),0);
    return;
  }

  if(key==='priority'){
    App.setPriorityChoice(item.id,value);
    setTimeout(()=>v181OpenTitleDetails(item.id),0);
    return;
  }

  if(key==='categoryId'){
    App.setLibraryCategory(item.id,value);
    setTimeout(()=>v181OpenTitleDetails(item.id),0);
    return;
  }

  const before=JSON.stringify(item[key]??null);

  if(key==='title'){
    const title=cleanTitle(value);
    if(title)item.title=title;
  }else if(['progress','total','estimatedMinutes','year','durationMinutes','communityScore','rating'].includes(key)){
    const raw=String(value||'').trim();
    let next=raw===''?null:Number(raw);

    if(Number.isFinite(next)){
      next=Math.max(0,next);
    }else{
      next=null;
    }

    if(key==='rating'||key==='communityScore'){
      if(next!=null)next=Math.min(10,next);
    }

    if(key==='year'&&next!=null){
      next=Math.min(9999,Math.round(next));
    }

    if(['progress','total','estimatedMinutes','durationMinutes'].includes(key)&&next!=null){
      next=Math.round(next);
    }

    item[key]=next;

    if(
      key==='progress' &&
      Number(item.total)>0 &&
      Number(item.progress)>Number(item.total)
    ){
      item.progress=Number(item.total);
    }

    if(
      key==='total' &&
      Number(item.total)>0 &&
      Number(item.progress)>Number(item.total)
    ){
      item.progress=Number(item.total);
    }
  }else if(['tags','studios','producers','genres','themes'].includes(key)){
    item[key]=v181QuickList(value);
  }else if(key==='releaseDate'){
    item.releaseDate=v176DateValue(value);
  }else if(key==='startedAt'){
    item.startedAt=v181DateTimestamp(value);
  }else if(key==='completedAt'){
    item.completedAt=v181DateTimestamp(value);
  }else if(key==='synopsis'){
    item.synopsis=v176SafeText(value,6000);
  }else{
    item[key]=v176SafeText(
      value,
      key==='coverUrl'?3000:180
    );
  }

  // v178 contract: manually edited imported metadata cannot be silently
  // overwritten by a later service import.
  if(
    typeof V178_EDITABLE_RICH_FIELDS!=='undefined' &&
    V178_EDITABLE_RICH_FIELDS.includes(key)
  ){
    item.richMetadataManual=v178ManualMap(item);
    item.richMetadataManual[key]=true;
  }

  item.modifiedAt=Date.now();

  // Keep active recommendation text aligned after a quick title rename.
  if(
    key==='title' &&
    S.currentTask &&
    String(S.currentTask.libraryId||'')===String(item.id)
  ){
    S.currentTask.title=cleanTitle(item.title);
  }

  const after=JSON.stringify(item[key]??null);
  if(before!==after){
    try{v44AwardEditXP(item.id);}catch(_){}
  }

  try{v53InvalidateLibraryCache();}catch(_){}
  persistLibrary();
  render();

  setTimeout(()=>{
    v181OpenTitleDetails(item.id);
  },0);
}

Object.assign(App,{
  v181OpenTitleDetails,
  v181CloseTitleDetails,
  v181EditFullTitle,
  v181QuickEditDetail,
  v181CloseQuickDetail,
  v181SaveQuickDetail
});

// Capture-phase handler makes cover clicks work everywhere in the rendered app
// without requiring every historical renderer to be rewritten.
document.addEventListener('click',event=>{
  const img=event.target?.closest?.('img');
  if(!img)return;

  if(
    img.closest('.v181-title-details-overlay')||
    img.closest('.v181-quick-detail-overlay')||
    img.closest('#modal-root')
  ){
    return;
  }

  const item=v181ResolveCoverItem(img);
  if(!item)return;

  event.preventDefault();
  event.stopPropagation();
  v181OpenTitleDetails(item.id);
},true);

/* ============================================================
   Settings UI
   ============================================================ */

function v181DynamicLibrarySettingsHtml(){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);

  const categoryRows=cfg.categoryOrder.map((id,index)=>{
    const cat=S.categories.find(
      c=>String(c.id)===String(id)
    );
    if(!cat)return '';

    const visible=!cfg.hiddenCategoryIds.includes(String(id));

    return `<div class="v181-config-row">
      <div class="v181-config-copy">
        <b>${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</b>
        <small>
          Dynamic row position ${index+1} ·
          ${visible?'shown':'hidden'}
        </small>
      </div>

      <div class="v181-order-buttons">
        <button type="button"
          class="btn btn-sm btn-ghost"
          ${index===0?'disabled':''}
          onclick="App.v181MoveDynamicCategory('${escapeHtml(String(id))}',-1)">
          ↑
        </button>

        <button type="button"
          class="btn btn-sm btn-ghost"
          ${index===cfg.categoryOrder.length-1?'disabled':''}
          onclick="App.v181MoveDynamicCategory('${escapeHtml(String(id))}',1)">
          ↓
        </button>
      </div>

      <button type="button"
        class="toggle ${visible?'on':''}"
        onclick="App.v181ToggleDynamicCategory('${escapeHtml(String(id))}',${visible?'false':'true'})"
        aria-label="${visible?'Hide':'Show'} ${escapeHtml(cat.name)} in Dynamic Library">
      </button>
    </div>`;
  }).join('');

  const statusRows=cfg.statusOrder.map((status,index)=>{
    const label=v199StatusLabel(status);

    return `<div class="v181-config-row">
      <div class="v181-config-copy">
        <b>${escapeHtml(label)}</b>
        <small>Status row position ${index+1}</small>
      </div>

      <div class="v181-order-buttons">
        <button type="button"
          class="btn btn-sm btn-ghost"
          ${index===0?'disabled':''}
          onclick="App.v181MoveDynamicStatus('${status}',-1)">
          ↑
        </button>

        <button type="button"
          class="btn btn-sm btn-ghost"
          ${index===cfg.statusOrder.length-1?'disabled':''}
          onclick="App.v181MoveDynamicStatus('${status}',1)">
          ↓
        </button>
      </div>

      <span></span>
    </div>`;
  }).join('');

  return `<div class="section-label">LIBRARY EXPERIENCE</div>

  <div class="card v181-settings-card">
    <div class="v181-setting-head">
      <div>
        <b>Default Library mode</b>
        <div class="hint">
          Current keeps the existing Library workflow. Dynamic uses category → status navigation.
        </div>
      </div>

      ${v181LibraryModeSwitchHtml()}
    </div>

    <div class="section-label" style="margin-top:15px;">DYNAMIC CATEGORY ROW</div>

    <div class="hint">
      Reorder the category row independently from the normal category order.
      Toggle a category off to hide it from Dynamic Library. New categories are
      automatically added to this configuration.
    </div>

    <div class="v181-config-list">
      ${categoryRows}
    </div>

    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px;">
      <button type="button"
        class="btn btn-sm"
        onclick="App.openCategoryModal()">
        + Add category
      </button>

      <button type="button"
        class="btn btn-sm btn-ghost"
        onclick="App.v181ResetDynamicLibrary()">
        Reset Dynamic Library layout
      </button>
    </div>

    <div class="section-label" style="margin-top:16px;">DYNAMIC STATUS ROW</div>

    <div class="hint">
      Arrange the order used under every Dynamic Library category.
      Default: Watching → On Hold → Completed → Dropped → Plan to Watch.
    </div>

    <div class="v181-config-list">
      ${statusRows}
    </div>
  </div>`;
}

function v181LoggingSettingsHtml(){
  const cfg=v181EnsureLogging(S.settings||DEFAULT_SETTINGS);

  return `<div class="section-label">DEFAULT LOGGING METHOD</div>

  <div class="card v181-settings-card">
    <div class="field" style="margin:0;">
      <label class="field-label">When a Logging page first opens</label>

      <select onchange="App.v181SetDefaultLoggingMode(this.value)">
        <option value="progress" ${cfg.defaultMode==='progress'?'selected':''}>
          Last progress — Recommended
        </option>

        <option value="amount" ${cfg.defaultMode==='amount'?'selected':''}>
          Amount consumed
        </option>
      </select>

      <small class="hint">
        This only chooses the initial mode when Dashboard Logging or Batch Log
        first opens. You can still switch modes inside either page; that
        temporary switch does not change this Settings default.
      </small>
    </div>
  </div>`;
}

function v181CoverSettingsHtml(){
  const cfg=v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);

  const rows=Object.keys(V181_COVER_LABELS).map(kind=>`
    <div class="v181-cover-setting">
      <label>${escapeHtml(V181_COVER_LABELS[kind])}</label>

      <div class="v181-cover-inputs">
        <input type="range"
          id="v181-cover-range-${kind}"
          min="25"
          max="400"
          step="5"
          value="${Math.min(400,cfg[kind])}"
          oninput="App.v181PreviewCoverSize('${kind}',this.value)"
          onchange="App.v181SetCoverSize('${kind}',this.value)">

        <input type="number"
          id="v181-cover-number-${kind}"
          min="10"
          step="5"
          value="${cfg[kind]}"
          oninput="App.v181PreviewCoverSize('${kind}',this.value)"
          onchange="App.v181SetCoverSize('${kind}',this.value)"
          title="No maximum">
      </div>
    </div>
  `).join('');

  return `<div class="section-label">COVER SIZE ADJUSTMENT</div>

  <div class="card v181-settings-card">
    <div class="v181-setting-head">
      <div>
        <b>Cover sizes by location</b>
        <div class="hint">
          Configure every major title-cover surface independently.
        </div>
      </div>

      <button type="button"
        class="btn btn-sm btn-ghost"
        onclick="App.v181ResetCoverSizes()">
        Reset to default
      </button>
    </div>

    <div class="v181-cover-settings-grid">
      ${rows}
    </div>

    <div class="v181-cover-unlimited-note">
      The slider provides a practical 25–400% range. The numeric field has
      <b>no upper maximum</b>, so values above 400% are supported too.
      100% is the original default size for that surface.
    </div>
  </div>`;
}

const v181RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v181RenderSettingsBase();

  const sections=
    v181DynamicLibrarySettingsHtml()+
    v181LoggingSettingsHtml()+
    v181CoverSettingsHtml();

  const marker='<div class="section-label">🛠 LIBRARY INTEGRITY</div>';

  if(h.includes(marker)){
    h=h.replace(
      marker,
      sections+marker
    );
  }else{
    h=sections+h;
  }

  return h;
};

/* ============================================================
   Render hook — cover vars + global clickable cover discovery
   ============================================================ */

const v181RenderBase=render;
render=function(){
  const result=v181RenderBase.apply(this,arguments);

  v181ApplyCoverVars();

  setTimeout(()=>{
    v181MarkClickableCovers();
  },0);

  return result;
};

setTimeout(()=>{
  v181ApplyCoverVars();
  v181MarkClickableCovers();
},0);

/* ============================================================
   Persistence / merge / Sync Now / Full Backup
   ============================================================ */

const v181PersistSettingsBase=persistSettings;
persistSettings=function(){
  v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  v181EnsureLogging(S.settings||DEFAULT_SETTINGS);
  v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  return v181PersistSettingsBase.apply(this,arguments);
};

const v181LoadAllBase=loadAll;
loadAll=async function(){
  await v181LoadAllBase.apply(this,arguments);

  v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  v181EnsureLogging(S.settings||DEFAULT_SETTINGS);
  v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  v181ApplyCoverVars();
};

const v181SnapshotBase=snapshot;
snapshot=function(){
  v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  v181EnsureLogging(S.settings||DEFAULT_SETTINGS);
  v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);

  const x=v181SnapshotBase();
  x.settings=JSON.parse(
    JSON.stringify(S.settings||DEFAULT_SETTINGS)
  );
  x.cloudSyncVersion=Math.max(
    Number(x.cloudSyncVersion)||0,
    181
  );

  return x;
};

const v181ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v181ApplyStateBase.apply(this,arguments);

  v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  v181EnsureLogging(S.settings||DEFAULT_SETTINGS);
  v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  v181ApplyCoverVars();

  return result;
};

const v181MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v181MergeStatesBase(a,b)||{};
  out.settings=out.settings||{};

  const al=v181NormalizeLibrarySettings(
    a?.settings?.v181Library,
    a?.categories||out.categories||S.categories
  );
  const bl=v181NormalizeLibrarySettings(
    b?.settings?.v181Library,
    b?.categories||out.categories||S.categories
  );

  out.settings.v181Library=
    (Number(al.modifiedAt)||0)>=(Number(bl.modifiedAt)||0)
      ?al
      :bl;

  const ag=v181NormalizeLogging(a?.settings?.v181Logging);
  const bg=v181NormalizeLogging(b?.settings?.v181Logging);

  out.settings.v181Logging=
    (Number(ag.modifiedAt)||0)>=(Number(bg.modifiedAt)||0)
      ?ag
      :bg;

  const ac=v181NormalizeCoverSizes(a?.settings?.v181CoverSizes);
  const bc=v181NormalizeCoverSizes(b?.settings?.v181CoverSizes);

  out.settings.v181CoverSizes=
    (Number(ac.modifiedAt)||0)>=(Number(bc.modifiedAt)||0)
      ?ac
      :bc;

  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    181
  );

  return out;
};

const v181VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v181VerifyCloudStateBase(
    cloudState,
    expected
  );
  const problems=[...(base?.missing||[])];

  const cloudLibrary=v181NormalizeLibrarySettings(
    cloudState?.settings?.v181Library,
    cloudState?.categories||[]
  );
  const wantedLibrary=v181NormalizeLibrarySettings(
    expected?.settings?.v181Library,
    expected?.categories||[]
  );

  if(JSON.stringify(cloudLibrary)!==JSON.stringify(wantedLibrary)){
    problems.push('v181 Library experience');
  }

  const cloudLogging=v181NormalizeLogging(
    cloudState?.settings?.v181Logging
  );
  const wantedLogging=v181NormalizeLogging(
    expected?.settings?.v181Logging
  );

  if(JSON.stringify(cloudLogging)!==JSON.stringify(wantedLogging)){
    problems.push('Default logging mode');
  }

  const cloudCovers=v181NormalizeCoverSizes(
    cloudState?.settings?.v181CoverSizes
  );
  const wantedCovers=v181NormalizeCoverSizes(
    expected?.settings?.v181CoverSizes
  );

  if(JSON.stringify(cloudCovers)!==JSON.stringify(wantedCovers)){
    problems.push('Per-surface cover sizes');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

const v181BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  v181EnsureLogging(S.settings||DEFAULT_SETTINGS);
  v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);

  const payload=v181BuildFullBackupBase();

  payload.backupSchemaVersion=V181_BACKUP_SCHEMA_VERSION;
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
    V181_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v181 backup. Includes Classic/Dynamic Library mode, Dynamic category visibility/order and status order, all five Library title display modes, recommended Last Progress default logging preference, unlimited per-surface cover-size configuration, editable rich title metadata and all prior MediaFlow Library/History/Order/Respect XP/backup data. In-page logging mode switches remain intentionally temporary and are not account preferences.';

  return payload;
};

const v181BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v181BackupManifestBase(state,extras);
  const library=v181NormalizeLibrarySettings(
    state?.settings?.v181Library,
    state?.categories||[]
  );
  const logging=v181NormalizeLogging(
    state?.settings?.v181Logging
  );
  const covers=v181NormalizeCoverSizes(
    state?.settings?.v181CoverSizes
  );

  manifest.schemaVersion=V181_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign(
    {},
    manifest.includes||{},
    {
      classicDynamicLibraryMode:true,
      dynamicLibraryCategoryOrder:true,
      dynamicLibraryCategoryVisibility:true,
      dynamicLibraryStatusOrder:true,
      coverOnlyLibraryView:true,
      coverTitleLibraryView:true,
      globalCoverTitleDetails:true,
      quickTitleDetailEditing:true,
      defaultLoggingMode:true,
      unlimitedPerSurfaceCoverSizing:true
    }
  );

  manifest.v181Library={
    mode:library.mode,
    categoryOrderCount:library.categoryOrder.length,
    hiddenCategoryCount:library.hiddenCategoryIds.length,
    statusOrder:library.statusOrder.slice()
  };

  manifest.v181Logging={
    defaultMode:logging.defaultMode
  };

  manifest.v181CoverSizes=Object.assign({},covers);

  return manifest;
};

// v152 Automatic Backup resolves the final Full Backup builder dynamically,
// therefore all persistent v181 Settings are included automatically.


/* ============================================================
   MediaFlow v182
   - Minimalist, theme-aware Dynamic Library navigation
   - No horizontal Dynamic Library navigation scrollbars
   - Full Backup schema v19
   - Cloud/Sync Now audit bumped to v182
   - Automatic Backup keeps using the final Full Backup builder
   ============================================================ */

const V182_BACKUP_SCHEMA_VERSION=19;
const V182_CLOUD_SYNC_VERSION=182;

/* v182 does not duplicate the Library configuration introduced in v181.
   The same category order/visibility, status order, active category/status,
   display mode, default Logging mode and cover-size settings remain the
   canonical persistent data. The redesign is presentation-only and therefore
   remains automatically compatible with v181 backups. */

/* Cloud snapshots now identify themselves as v182 while preserving the entire
   v181 Settings object and every older persistent field. */
const v182SnapshotBase=snapshot;
snapshot=function(){
  const out=v182SnapshotBase.apply(this,arguments)||{};
  out.cloudSyncVersion=Math.max(
    Number(out.cloudSyncVersion)||0,
    V182_CLOUD_SYNC_VERSION
  );
  return out;
};

const v182MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v182MergeStatesBase.apply(this,arguments)||{};
  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    V182_CLOUD_SYNC_VERSION
  );
  return out;
};

/* Protected Sync Now keeps every prior verification and additionally verifies
   that the final cloud snapshot is from the v182 state pipeline. */
const v182VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v182VerifyCloudStateBase.apply(this,arguments);
  const problems=[...(base?.missing||[])];

  if(Number(cloudState?.cloudSyncVersion||0)<V182_CLOUD_SYNC_VERSION){
    problems.push('v182 cloud state version');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

/* Full Backup / manual export / Automatic Backup.
   v152 Automatic Backup resolves v148BuildFullBackup dynamically, so wrapping
   the final builder here updates both manual and automatic exports. */
const v182BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v182BuildFullBackupBase.apply(this,arguments);

  payload.backupSchemaVersion=V182_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V182_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note=
    'Complete MediaFlow v182 backup. Includes the complete v181 Dynamic Library configuration, five Library display modes, default Logging preference, unlimited per-surface cover sizing, all recommendation/reroll and System Respect XP history, plus every prior Library, History, Order, progression, theme and cloud-synced field. v182 redesigns Dynamic Library navigation as minimalist theme-aware category/status tabs with no horizontal navigation scrollbar. The visual redesign introduces no destructive data migration and remains backward-compatible with older complete MediaFlow backups.';

  return payload;
};

const v182BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v182BackupManifestBase.apply(this,arguments);

  manifest.schemaVersion=V182_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign(
    {},
    manifest.includes||{},
    {
      minimalistDynamicLibraryNavigation:true,
      themeAwareDynamicLibraryNavigation:true,
      noHorizontalDynamicNavigationScrollbar:true,
      v181DynamicLibraryDataCompatibility:true,
      v182CloudSyncAudit:true
    }
  );

  manifest.v182DynamicLibrary={
    navigationStyle:'minimal-theme-aware',
    horizontalNavigationScrollbar:false,
    persistentConfigurationSource:'settings.v181Library'
  };

  manifest.v182Cloud={
    cloudSyncVersion:V182_CLOUD_SYNC_VERSION,
    verifiesV181LibraryExperience:true,
    verifiesDefaultLoggingMode:true,
    verifiesPerSurfaceCoverSizes:true
  };


  return manifest;
};


/* ============================================================
   MediaFlow v183
   - Readability pass for pagination/cover-size controls everywhere
   - Shared persistent Show/Hide Library Overview switch
   - Overview available in both Current and Dynamic Library modes
   - Full Backup schema v20
   - Cloud/Sync Now audit bumped to v183
   ============================================================ */

const V183_BACKUP_SCHEMA_VERSION=20;
const V183_CLOUD_SYNC_VERSION=183;
const V183_LIBRARY_OVERVIEW_DEFAULT={
  showOverview:true,
  modifiedAt:0
};

function v183NormalizeLibraryOverview(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  return {
    showOverview:src.showOverview!==false,
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v183EnsureLibraryOverview(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.v183LibraryOverview=v183NormalizeLibraryOverview(
    settings.v183LibraryOverview
  );
  return settings.v183LibraryOverview;
}

function v183LibraryOverviewEnabled(){
  return v183EnsureLibraryOverview(S.settings||DEFAULT_SETTINGS).showOverview!==false;
}

function v183LibraryOverviewToggleHtml(){
  const shown=v183LibraryOverviewEnabled();
  return `<div class="v183-library-overview-toggle">
    <div class="v183-library-overview-toggle-copy">
      <b>Library overview</b>
      <small>Use the same overview visibility in both Current and Dynamic Library modes.</small>
    </div>
    <div class="v183-library-overview-toggle-actions">
      <span class="v183-library-overview-toggle-state">${shown?'Shown':'Hidden'}</span>
      <button type="button"
        class="toggle ${shown?'on':''}"
        onclick="App.v183ToggleLibraryOverview()"
        aria-label="${shown?'Hide':'Show'} Library overview"
        aria-pressed="${shown?'true':'false'}"></button>
    </div>
  </div>`;
}

function v183LibraryOverviewEstimate(cat,x){
  if(!x.items)return {total:0,pct:0,estimated:false};
  if(!x.unknown&&x.total>0){
    return {
      total:x.total,
      pct:Math.min(100,Math.round(x.knownDone/x.total*100)),
      estimated:false
    };
  }

  const knownItems=(S.library||[]).filter(
    i=>i&&i.categoryId===cat.id&&Number(i.total)>0
  );
  const knownAvg=knownItems.length
    ?knownItems.reduce((sum,i)=>sum+Number(i.total),0)/knownItems.length
    :0;
  const unknownCount=(S.library||[]).filter(
    i=>i&&i.categoryId===cat.id&&!(Number(i.total)>0)
  ).length;
  const observed=Math.max(0,Number(x.done)||0);
  const baseline=Math.max(1,Number(cat.target)||1);
  const perUnknown=knownAvg>0
    ?knownAvg
    :Math.max(
        baseline*4,
        observed/Math.max(1,x.items)*1.35,
        12
      );
  const estimatedTotal=Math.max(
    Math.ceil(x.total+unknownCount*perUnknown),
    Math.ceil(observed*1.12),
    observed||1
  );

  return {
    total:estimatedTotal,
    pct:Math.min(99,Math.round(observed/estimatedTotal*100)),
    estimated:true
  };
}

function v183LibraryOverviewHtml(){
  const ov=v53LibraryOverview();
  const rows=(S.categories||[]).map(cat=>{
    const x=ov.byCat.get(cat.id)||{
      items:0,
      done:0,
      knownDone:0,
      total:0,
      unknown:false
    };
    const est=v183LibraryOverviewEstimate(cat,x);
    const pct=est.pct;
    const progressText=x.items===0
      ?'0 / -'
      :(est.estimated
        ?`${x.done} / ≈${est.total} (~${pct}%)`
        :`${x.done} / ${est.total} (${pct}%)`);
    const approxTitle=est.estimated
      ?'Approximate overview only — unknown title totals are estimated for this progress bar and are not saved to Library titles.'
      :'';

    return `<div class="overview-row" ${approxTitle?`title="${escapeHtml(approxTitle)}"`:''}>
      <div class="ov-name"><span>${v144CategoryIconHtml(cat)}</span> ${escapeHtml(cat.name)}</div>
      <div class="ov-track"><div class="progress-track"><div class="progress-fill" style="width:${pct}%; background:linear-gradient(90deg, ${cat.color}88, ${cat.color});"></div></div></div>
      <div class="ov-num">${progressText}</div>
    </div>`;
  }).join('');

  return `<div class="v183-library-overview-block">
    <div class="section-label">OVERVIEW · ${ov.overallPct}% of known tracked totals cleared <span style="font-weight:500;text-transform:none;letter-spacing:0;opacity:.72;">· ≈ means display-only estimate</span></div>
    <div class="card" style="margin-bottom:26px;">${rows}</div>
  </div>`;
}

function v183ToggleLibraryOverview(){
  const cfg=v183EnsureLibraryOverview(S.settings||DEFAULT_SETTINGS);
  cfg.showOverview=!cfg.showOverview;
  cfg.modifiedAt=Date.now();
  persistSettings();
  render();
  showToast(cfg.showOverview?'Library overview shown':'Library overview hidden');
}

App.v183ToggleLibraryOverview=v183ToggleLibraryOverview;
v183EnsureLibraryOverview(S.settings||DEFAULT_SETTINGS);

/* Persistence / load / cloud state. */
const v183PersistSettingsBase=persistSettings;
persistSettings=function(){
  v183EnsureLibraryOverview(S.settings||DEFAULT_SETTINGS);
  return v183PersistSettingsBase.apply(this,arguments);
};

const v183LoadAllBase=loadAll;
loadAll=async function(){
  await v183LoadAllBase.apply(this,arguments);
  v183EnsureLibraryOverview(S.settings||DEFAULT_SETTINGS);
};

const v183SnapshotBase=snapshot;
snapshot=function(){
  v183EnsureLibraryOverview(S.settings||DEFAULT_SETTINGS);
  const out=v183SnapshotBase.apply(this,arguments)||{};
  out.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  out.cloudSyncVersion=Math.max(
    Number(out.cloudSyncVersion)||0,
    V183_CLOUD_SYNC_VERSION
  );
  return out;
};

const v183ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v183ApplyStateBase.apply(this,arguments);
  v183EnsureLibraryOverview(S.settings||DEFAULT_SETTINGS);
  return result;
};

const v183MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v183MergeStatesBase.apply(this,arguments)||{};
  out.settings=out.settings||{};

  const av=v183NormalizeLibraryOverview(a?.settings?.v183LibraryOverview);
  const bv=v183NormalizeLibraryOverview(b?.settings?.v183LibraryOverview);
  out.settings.v183LibraryOverview=
    (Number(av.modifiedAt)||0)>=(Number(bv.modifiedAt)||0)
      ?av
      :bv;

  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    V183_CLOUD_SYNC_VERSION
  );
  return out;
};

const v183VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v183VerifyCloudStateBase.apply(this,arguments);
  const problems=[...(base?.missing||[])];

  const cloudOverview=v183NormalizeLibraryOverview(
    cloudState?.settings?.v183LibraryOverview
  );
  const wantedOverview=v183NormalizeLibraryOverview(
    expected?.settings?.v183LibraryOverview
  );

  if(JSON.stringify(cloudOverview)!==JSON.stringify(wantedOverview)){
    problems.push('Library overview visibility');
  }
  if(Number(cloudState?.cloudSyncVersion||0)<V183_CLOUD_SYNC_VERSION){
    problems.push('v183 cloud state version');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

/* Full Backup / manual export / Automatic Backup. */
const v183BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v183EnsureLibraryOverview(S.settings||DEFAULT_SETTINGS);
  const payload=v183BuildFullBackupBase.apply(this,arguments);

  payload.backupSchemaVersion=V183_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V183_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note=
    'Complete MediaFlow v183 backup. Includes the shared Current/Dynamic Library Overview visibility preference, the full v181 Dynamic Library configuration, all five Library display modes, default Logging preference, unlimited per-surface cover sizing, recommendation/reroll and System Respect XP history, and every prior Library, History, Order, progression, theme and cloud-synced field. v183 also increases pagination/cover-control readability across MediaFlow without changing their underlying data.';

  return payload;
};

const v183BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v183BackupManifestBase.apply(this,arguments);
  const overview=v183NormalizeLibraryOverview(
    state?.settings?.v183LibraryOverview
  );

  manifest.schemaVersion=V183_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign(
    {},
    manifest.includes||{},
    {
      readablePaginationAndCoverControls:true,
      sharedLibraryOverviewVisibility:true,
      libraryOverviewInCurrentMode:true,
      libraryOverviewInDynamicMode:true,
      v183CloudSyncAudit:true
    }
  );
  manifest.v183LibraryOverview={
    showOverview:overview.showOverview,
    sharedAcrossCurrentAndDynamic:true
  };
  manifest.v183Cloud={
    cloudSyncVersion:V183_CLOUD_SYNC_VERSION,
    verifiesLibraryOverviewVisibility:true
  };

  return manifest;
};

/* ============================================================
   MediaFlow v184 — Settings readability metadata
   UI-only release: no persisted data shape changed, so Full Backup
   schema v20 and Cloud Sync state v183 remain intentionally compatible.
   ============================================================ */
const v184BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v184BuildFullBackupBase.apply(this,arguments);
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  if(payload.backupManifest){
    payload.backupManifest.note=
      'Complete MediaFlow v185 backup. Preserves the full v183 data schema and all prior Library, History, Dynamic Library, Overview, Logging, cover-size, recommendation/Respect XP, theme and cloud-synced data. v185 is a title-details readability release and does not introduce a new persisted data field.';
  }
  return payload;
};

const v184BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v184BackupManifestBase.apply(this,arguments);
  manifest.includes=Object.assign({},manifest.includes||{}, {
    readableDynamicLibrarySettingsText:true,
    readableCategoryRecoverySettingsText:true
  });
  manifest.v185={
    settingsTypographyReadability:true,
    dataSchemaChanged:false
  };
  return manifest;
};


/* v186 hotfix: keep control-center logic inside the main MediaFlow scope. */
