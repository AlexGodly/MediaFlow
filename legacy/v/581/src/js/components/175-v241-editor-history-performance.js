/* ============================================================
   MediaFlow v241 — Editor Clarity / History Filters / 50K Performance
   --------------------------------------------------------------------------
   - Enlarges and clarifies the Edit Title form while keeping responsive safe
     scrolling. Rewatch/Reread summary cards now use the entire row.
   - Logged / Batch covers fall back to the title category icon and every cover
     opens Title Details.
   - Adds a cached Library lookup/index used by Dynamic Library, Dashboard
     queues and Personal Order hot paths for 50K-scale libraries.
   - Paginates Library History instead of mounting the complete change log.
   - Gives History the same searchable, paginated, multi-select Category Filter
     as Library plus explicit custom From/To dates.
   - Re-audits cloud/full backup/settings preset/export compatibility.
   ============================================================ */
const V241_RUNTIME_VERSION=241;
const V241_LIBRARY_HISTORY_PAGE_SIZE=50;

/* ---------- 50K-oriented Library indexes ------------------------------- */
const V241_LIB_INDEX={ref:null,len:-1,token:-1,byId:new Map(),byCatStatus:new Map(),searchById:new Map(),unrated:[],missing:[]};
function v241ResetLibraryIndex(){
  V241_LIB_INDEX.ref=null;V241_LIB_INDEX.len=-1;V241_LIB_INDEX.token=-1;
  V241_LIB_INDEX.byId=new Map();V241_LIB_INDEX.byCatStatus=new Map();V241_LIB_INDEX.searchById=new Map();V241_LIB_INDEX.unrated=[];V241_LIB_INDEX.missing=[];
  V241_ORDER_CACHE.key='';V241_ORDER_CACHE.rows=[];
}
const v241InvalidateLibraryCacheBase=v53InvalidateLibraryCache;
v53InvalidateLibraryCache=function(){const out=v241InvalidateLibraryCacheBase.apply(this,arguments);v241ResetLibraryIndex();return out;};

let V241_CATEGORY_REF=null,V241_CATEGORY_LEN=-1,V241_CATEGORY_MAP=new Map();
const v241GetCategoryBase=getCategory;
getCategory=function(id){
  if(V241_CATEGORY_REF!==S.categories||V241_CATEGORY_LEN!==(S.categories||[]).length){
    V241_CATEGORY_REF=S.categories;V241_CATEGORY_LEN=(S.categories||[]).length;
    V241_CATEGORY_MAP=new Map((S.categories||[]).filter(Boolean).map(c=>[String(c.id),c]));
  }
  return V241_CATEGORY_MAP.get(String(id))||v241GetCategoryBase(id);
};

function v241EnsureLibraryIndex(){
  try{v53EnsureLibraryIndex();}catch(_){ }
  const lib=S.library||[];const token=Number(V53_LIB?.libraryToken)||0;
  if(V241_LIB_INDEX.ref===lib&&V241_LIB_INDEX.len===lib.length&&V241_LIB_INDEX.token===token)return V241_LIB_INDEX;
  const byId=new Map(),byCatStatus=new Map(),searchById=new Map(),unrated=[],missing=[];
  for(const item of lib){
    if(!item?.id)continue;
    const id=String(item.id),catId=String(item.categoryId||''),status=String(item.status||'planned');
    byId.set(id,item);
    const key=catId+'\u0000'+status;let bucket=byCatStatus.get(key);if(!bucket){bucket=[];byCatStatus.set(key,bucket);}bucket.push(item);
    const cat=getCategory(catId);
    const rich=[cleanTitle(item.title),cat?.name||'',status,item.priority||'',item.mediaFormat||'',item.mediaSource||'',item.demographic||'',item.year||'',
      ...(Array.isArray(item.genres)?item.genres:[]),...(Array.isArray(item.themes)?item.themes:[]),...(Array.isArray(item.studios)?item.studios:[]),...(Array.isArray(item.tags)?item.tags:[])
    ].join(' ').toLocaleLowerCase();
    searchById.set(id,rich);
    if(!(Number(item.rating)>0))unrated.push(item);
    if(!String(item.coverUrl||'').trim())missing.push(item);
  }
  Object.assign(V241_LIB_INDEX,{ref:lib,len:lib.length,token,byId,byCatStatus,searchById,unrated,missing});
  return V241_LIB_INDEX;
}
function v241LibraryById(id){return v241EnsureLibraryIndex().byId.get(String(id||''))||null;}

// Dynamic Library no longer scans all 50K titles for every status/category click.
v181DynamicRows=function(){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const idx=v241EnsureLibraryIndex();
  const key=String(cfg.activeCategoryId||'')+'\u0000'+String(cfg.activeStatus||'active');
  let rows=(idx.byCatStatus.get(key)||[]).slice();
  const priority=String(S.histFilters?.libPriority||'all');
  if(priority!=='all')rows=rows.filter(item=>String(item.priority||'medium')===priority);
  if(v189UnfinishedOnly())rows=rows.filter(v189IsUnfinished);
  const q=String(S.histFilters?.libSearch||'').trim().toLocaleLowerCase();
  if(q)rows=rows.filter(item=>(idx.searchById.get(String(item.id))||'').includes(q));
  return v181SortDynamicRows(rows);
};

// Dashboard queues share the same single-pass index instead of each scanning
// the full Library multiple times during one render.
v123UnratedItems=function(){return v241EnsureLibraryIndex().unrated;};
v192MissingCoverItems=function(){return v241EnsureLibraryIndex().missing;};
v123CurrentRatingItem=function(){v123SyncRatingQueue();return v241LibraryById(V123_RATING_QUEUE[0]);};
v192CurrentMissingCoverItem=function(){v192SyncMissingCoverQueue();return v241LibraryById(V192_MISSING_COVER_QUEUE[0]);};

// Rating changes are in-place, so invalidate before the queue rerenders.
const v241ConfirmRatingBase=App.v123ConfirmRating;
App.v123ConfirmRating=function(){
  const oldRender=render;
  render=function(){try{v53InvalidateLibraryCache();}catch(_){ }return oldRender.apply(this,arguments);};
  try{return v241ConfirmRatingBase.apply(this,arguments);}finally{render=oldRender;}
};
v123ConfirmRating=App.v123ConfirmRating;

/* ---------- Personal Order hot-path cache ------------------------------ */
const V241_ORDER_CACHE={key:'',rows:[]};
function v241OrderPickerKey(p,ui){
  const ids=p?.titleIds||[];
  return [Number(V53_LIB?.libraryToken)||0,(S.library||[]).length,Number(p?.modifiedAt)||0,ids.length,ids[0]||'',ids[ids.length-1]||'',ui.search,(ui.categories||[]).join(','),ui.status,ui.priority,ui.sort].join('|');
}
v138PickerMatches=function(){
  const p=v138EnsureOrderPlan(),ui=v140EnsureOrderPickerUI(),key=v241OrderPickerKey(p,ui);
  if(V241_ORDER_CACHE.key===key)return V241_ORDER_CACHE.rows;
  const idx=v241EnsureLibraryIndex(),existing=new Set((p.titleIds||[]).map(String)),q=String(ui.search||'').trim().toLocaleLowerCase();
  let rows=[];
  for(const item of (S.library||[])){
    if(!item?.id||existing.has(String(item.id)))continue;
    if(q&&!(idx.searchById.get(String(item.id))||'').includes(q))continue;
    if(ui.categories.length&&!ui.categories.includes(String(item.categoryId||'')))continue;
    if(ui.status!=='all'&&String(item.status||'planned').toLowerCase()!==ui.status)continue;
    if(ui.priority!=='all'&&String(item.priority||'medium').toLowerCase()!==ui.priority)continue;
    rows.push(item);
  }
  const rank={low:0,medium:1,high:2},num=v=>Number.isFinite(Number(v))?Number(v):0;
  const titleCache=new Map();const title=x=>{const id=String(x.id);if(!titleCache.has(id))titleCache.set(id,cleanTitle(x.title));return titleCache.get(id);};
  const cmpTitle=(a,b)=>title(a).localeCompare(title(b),undefined,{numeric:true,sensitivity:'base'});
  rows.sort((a,b)=>{
    let d=0;
    if(ui.sort==='title-asc')return cmpTitle(a,b);if(ui.sort==='title-desc')return cmpTitle(b,a);
    if(ui.sort==='priority-desc')d=(rank[String(b.priority||'medium').toLowerCase()]??1)-(rank[String(a.priority||'medium').toLowerCase()]??1);
    else if(ui.sort==='priority-asc')d=(rank[String(a.priority||'medium').toLowerCase()]??1)-(rank[String(b.priority||'medium').toLowerCase()]??1);
    else if(ui.sort==='rating-desc')d=num(b.rating)-num(a.rating);else if(ui.sort==='rating-asc')d=num(a.rating)-num(b.rating);
    else if(ui.sort==='progress-desc')d=num(b.progress)-num(a.progress);else if(ui.sort==='progress-asc')d=num(a.progress)-num(b.progress);
    else if(ui.sort==='total-desc')d=num(b.total)-num(a.total);else if(ui.sort==='total-asc')d=num(a.total)-num(b.total);
    else if(q){const at=title(a).toLocaleLowerCase(),bt=title(b).toLocaleLowerCase();const ar=at===q?0:at.startsWith(q)?1:at.includes(q)?2:3,br=bt===q?0:bt.startsWith(q)?1:bt.includes(q)?2:3;d=ar-br||(at.includes(q)?at.indexOf(q):1e9)-(bt.includes(q)?bt.indexOf(q):1e9);}
    return d||cmpTitle(a,b);
  });
  V241_ORDER_CACHE.key=key;V241_ORDER_CACHE.rows=rows;return rows;
};

/* ---------- Logging covers: category fallback + Title Details ---------- */
function v241LoggedCoverMarkup(item,title,cls='v239-logged-cover'){
  const id=String(item?.id||''),safeTitle=cleanTitle(item?.title||title||'Untitled'),cat=item?getCategory(item.categoryId):null;
  const fallback=`<span class="${cls} v241-category-cover-fallback" aria-hidden="true">${cat?v144CategoryIconHtml(cat):escapeHtml((safeTitle||'?').charAt(0).toUpperCase())}</span>`;
  if(!id)return item?.coverUrl?`<img class="${cls}" src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(safeTitle)} cover" loading="lazy">`:fallback;
  const image=item?.coverUrl?`<img class="${cls}" src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(safeTitle)} cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">${fallback.replace('aria-hidden="true"','aria-hidden="true" style="display:none"')}`:fallback;
  return `<button type="button" class="v241-logged-cover-button" title="Open title details" aria-label="Open ${escapeHtml(safeTitle)} details" onclick="event.preventDefault();event.stopPropagation();App.v181OpenTitleDetails('${escapeHtml(id)}')">${image}</button>`;
}
v239LoggedCover=function(item,title){return v241LoggedCoverMarkup(item,title,'v239-logged-cover');};

const v241RenderBatchLogBase=renderBatchLog;
renderBatchLog=function(){
  const raw=v241RenderBatchLogBase.apply(this,arguments);
  try{
    const host=document.createElement('div');host.innerHTML=String(raw||'');
    [...host.querySelectorAll('.batch-log-row')].forEach((row,idx)=>{
      const draft=S.batchDraft?.rows?.[idx],item=draft?.libraryId?v241LibraryById(draft.libraryId):null,old=row.querySelector('.v239-batch-cover');
      if(old&&item){const box=document.createElement('div');box.innerHTML=v241LoggedCoverMarkup(item,item.title,'v239-batch-cover');old.replaceWith(box.firstElementChild);}
    });
    return host.innerHTML;
  }catch(_){return raw;}
};

/* ---------- History: searchable Category Filter + custom dates --------- */
const V241_HISTORY_CATEGORY_UI={open:false,query:'',page:0};
function v241HistorySelectedCategories(){
  S.histFilters=S.histFilters||{};
  const valid=new Set((S.categories||[]).map(c=>String(c?.id||''))),raw=Array.isArray(S.histFilters.historyCategories)?S.histFilters.historyCategories:[];
  if(!raw.length&&S.histFilters.category&&S.histFilters.category!=='all')raw.push(String(S.histFilters.category));
  const out=[...new Set(raw.map(String).filter(id=>valid.has(id)))];S.histFilters.historyCategories=out;S.histFilters.category='all';return out;
}
function v241HistoryCategoryRows(){
  const q=String(V241_HISTORY_CATEGORY_UI.query||'').trim().toLocaleLowerCase();
  const rows=v236EffectiveCategoryFilterCategories();return q?rows.filter(c=>String(c.name||'').toLocaleLowerCase().includes(q)):rows;
}
function v241HistoryCategoryPage(){
  const all=v241HistoryCategoryRows(),pageSize=v236CategoryFilterPageSize(),pages=Math.max(1,Math.ceil(all.length/pageSize));
  V241_HISTORY_CATEGORY_UI.page=Math.max(0,Math.min(pages-1,Number(V241_HISTORY_CATEGORY_UI.page)||0));
  const start=V241_HISTORY_CATEGORY_UI.page*pageSize;return {all,pageSize,pages,page:V241_HISTORY_CATEGORY_UI.page,rows:all.slice(start,start+pageSize)};
}
function v241HistoryCategoryRowsHtml(rows){
  const selected=new Set(v241HistorySelectedCategories());
  if(!rows.length)return '<div class="v236-category-filter-empty">No categories match your search.</div>';
  return rows.map(cat=>`<label class="v66-cat-option v236-category-filter-option"><input type="checkbox" ${selected.has(String(cat.id))?'checked':''} onchange="App.v241ToggleHistoryCategory('${escapeHtml(String(cat.id))}',this.checked)"><span>${v144CategoryIconHtml(cat)} <span>${escapeHtml(cat.name)}</span></span></label>`).join('');
}
function v241HistoryCategorySummary(){
  const ids=v241HistorySelectedCategories();if(!ids.length)return '<span class="v236-category-filter-summary-label">All categories</span>';
  const byId=new Map((S.categories||[]).map(c=>[String(c.id),c])),cats=ids.map(id=>byId.get(id)).filter(Boolean);
  const chips=cats.slice(0,2).map(c=>`<span class="v236-category-filter-chip">${v144CategoryIconHtml(c)}<span>${escapeHtml(c.name)}</span></span>`).join('');
  return `<span class="v236-category-filter-summary-chips">${chips}${cats.length>2?`<span class="v236-category-filter-more">+${cats.length-2}</span>`:''}</span>`;
}
function v241HistoryCategoryFilterHtml(){
  const data=v241HistoryCategoryPage(),ids=v241HistorySelectedCategories();
  return `<details class="v66-cat-filter v236-category-filter v241-history-category-filter" data-v241-history-category-filter ${V241_HISTORY_CATEGORY_UI.open?'open':''} ontoggle="App.v241HistoryCategoryToggle(this)">
    <summary class="btn v236-category-filter-summary">${v241HistoryCategorySummary()}<span class="v236-category-filter-chevron" aria-hidden="true">⌄</span></summary>
    <div class="v66-cat-panel v236-category-filter-panel" onclick="event.stopPropagation()">
      <div class="v236-category-filter-search-wrap"><input class="v236-category-filter-search" type="search" placeholder="Search categories…" value="${escapeHtml(V241_HISTORY_CATEGORY_UI.query)}" autocomplete="off" oninput="App.v241SearchHistoryCategories(this.value)"></div>
      <div class="v66-cat-head v236-category-filter-head"><b>Categories</b><button type="button" class="btn btn-sm btn-ghost" onclick="event.preventDefault();App.v241ClearHistoryCategories()">All</button></div>
      <div class="v236-category-filter-meta"><span>${ids.length?`${ids.length} selected`:'All selected'}</span><span>${V241_HISTORY_CATEGORY_UI.query?`${data.all.length} matching`:`${v236EffectiveCategoryFilterCategories().length} available`}</span></div>
      <div class="v236-category-filter-list">${v241HistoryCategoryRowsHtml(data.rows)}</div>
      ${data.all.length>data.pageSize?`<div class="v236-category-filter-pager"><button class="btn btn-sm btn-ghost" ${data.page<=0?'disabled':''} onclick="App.v241SetHistoryCategoryPage(${data.page-1})">Previous</button><span>Page <b>${data.page+1}</b> of <b>${data.pages}</b></span><button class="btn btn-sm btn-ghost" ${data.page>=data.pages-1?'disabled':''} onclick="App.v241SetHistoryCategoryPage(${data.page+1})">Next</button></div>`:''}
    </div></details>`;
}
function v241UpdateHistoryCategoryPanel(){
  const d=document.querySelector('[data-v241-history-category-filter]');if(!d)return;
  const data=v241HistoryCategoryPage(),list=d.querySelector('.v236-category-filter-list'),meta=d.querySelector('.v236-category-filter-meta'),pager=d.querySelector('.v236-category-filter-pager');
  if(list)list.innerHTML=v241HistoryCategoryRowsHtml(data.rows);
  if(meta){const ids=v241HistorySelectedCategories();meta.innerHTML=`<span>${ids.length?`${ids.length} selected`:'All selected'}</span><span>${V241_HISTORY_CATEGORY_UI.query?`${data.all.length} matching`:`${v236EffectiveCategoryFilterCategories().length} available`}</span>`;}
  const next=data.all.length>data.pageSize?`<div class="v236-category-filter-pager"><button class="btn btn-sm btn-ghost" ${data.page<=0?'disabled':''} onclick="App.v241SetHistoryCategoryPage(${data.page-1})">Previous</button><span>Page <b>${data.page+1}</b> of <b>${data.pages}</b></span><button class="btn btn-sm btn-ghost" ${data.page>=data.pages-1?'disabled':''} onclick="App.v241SetHistoryCategoryPage(${data.page+1})">Next</button></div>`:'';
  if(next){if(pager)pager.outerHTML=next;else list?.insertAdjacentHTML('afterend',next);}else pager?.remove();
}
function v241HistoryCategoryToggle(el){V241_HISTORY_CATEGORY_UI.open=!!el?.open;}
function v241SearchHistoryCategories(v){V241_HISTORY_CATEGORY_UI.query=String(v||'');V241_HISTORY_CATEGORY_UI.page=0;V241_HISTORY_CATEGORY_UI.open=true;v241UpdateHistoryCategoryPanel();}
function v241SetHistoryCategoryPage(p){V241_HISTORY_CATEGORY_UI.page=Math.max(0,Number(p)||0);V241_HISTORY_CATEGORY_UI.open=true;v241UpdateHistoryCategoryPanel();}
function v241ToggleHistoryCategory(id,on){const set=new Set(v241HistorySelectedCategories());on?set.add(String(id)):set.delete(String(id));S.histFilters.historyCategories=[...set];S.histFilters.category='all';S.histPage=0;V241_HISTORY_CATEGORY_UI.open=true;render();}
function v241ClearHistoryCategories(){S.histFilters.historyCategories=[];S.histFilters.category='all';S.histPage=0;V241_HISTORY_CATEGORY_UI.open=true;render();}
function v241SetHistoryDate(which,value){S.histFilters=S.histFilters||{};const key=which==='to'?'dateTo':'dateFrom';S.histFilters[key]=String(value||'');if(S.histFilters.dateFrom||S.histFilters.dateTo)S.histFilters.range='custom';else if(S.histFilters.range==='custom')S.histFilters.range='all';S.histPage=0;render();}
function v241ClearHistoryDates(){S.histFilters.dateFrom='';S.histFilters.dateTo='';if(S.histFilters.range==='custom')S.histFilters.range='all';S.histPage=0;render();}

renderHistory=function(){
  const f=S.histFilters=S.histFilters||{},selected=new Set(v241HistorySelectedCategories());
  let list=(S.sessions||[]).slice().sort((a,b)=>(Number(b.timestamp)||0)-(Number(a.timestamp)||0));
  if(selected.size)list=list.filter(s=>selected.has(String(s.categoryId)));
  if(f.type&&f.type!=='all')list=list.filter(s=>getCategory(s.categoryId).type===f.type);
  if(f.range==='today')list=list.filter(s=>s.date===todayISO());else if(f.range==='week')list=list.filter(s=>Number(s.timestamp)>=hoursAgo(24*7));else if(f.range==='month')list=list.filter(s=>Number(s.timestamp)>=hoursAgo(24*30));
  if(f.range==='custom'||f.dateFrom||f.dateTo){const from=String(f.dateFrom||''),to=String(f.dateTo||'');if(from)list=list.filter(s=>String(s.date||'')>=from);if(to)list=list.filter(s=>String(s.date||'')<=to);}
  const pageSize=Math.max(25,Number(S.histPageSize)||50),pageCount=Math.max(1,Math.ceil(list.length/pageSize));S.histPage=clamp(Number(S.histPage)||0,0,pageCount-1);const pageItems=list.slice(S.histPage*pageSize,S.histPage*pageSize+pageSize);
  const labelMap={complete:'Complete',partial:'Partial',over:'Over',skipped:'Skipped',logged:'Logged'};
  const rows=pageItems.map(s=>{const cat=getCategory(s.categoryId),d=new Date(Number(s.timestamp)||Date.now());return `<div class="hist-row"><div class="hist-date">${fmtDate(s.date)}<br><span style="opacity:.6;">${d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}</span></div><div class="hist-icon" style="background:${cat.color}22;color:${cat.color};">${v144CategoryIconHtml(cat)}</div><div class="hist-main"><div class="hist-cat">${escapeHtml(cat.name)}</div><div class="hist-amt">${s.actualAmount} ${unitLabel(s.unit,s.actualAmount)} · ${fmtMinutes(s.minutes)}${s.status==='logged'?'':` · target ${s.targetAmount}`}</div>${s.source==='batch'?'<div class="hist-note" style="margin-top:4px">Batch Log</div>':''}${s.assignedCategoryId&&s.assignedCategoryId!==s.categoryId?`<div class="hist-note" style="margin-top:4px">Recommended: ${escapeHtml(getCategory(s.assignedCategoryId)?.name||'Unknown')}</div>`:''}${s.status!=='skipped'?`<div class="hist-xp" style="margin-top:4px;font-size:11px;color:var(--flow);font-weight:800;">+${Math.round(sessionStoredXP(s)).toLocaleString()} XP · ${escapeHtml(xpRotationLabel(s.healthStatus||'healthy'))} · 🔥 ${escapeHtml(v149SessionStreakLabel(s))}</div>`:''}${s.note?`<div class="hist-note">&quot;${escapeHtml(s.note)}&quot;</div>`:''}</div><div class="hist-status" style="display:flex;flex-direction:column;align-items:flex-end;gap:6px"><span class="status-badge status-${s.status==='skipped'?'overused':s.status==='partial'?'due':s.status==='over'?'neglected':'healthy'}">${labelMap[s.status]||'Logged'}</span><div style="display:flex;gap:4px"><button class="btn btn-sm btn-ghost" onclick="App.openSessionModal('${s.id}')">Edit</button><button class="btn btn-sm btn-danger" onclick="App.deleteSession('${s.id}')">Delete</button></div></div></div>`;}).join('')||'<div class="empty-state"><div class="em-icon">🕓</div><div class="em-title">No sessions yet</div><div>No History entries match the current filters.</div></div>';
  const pager=list.length>pageSize?`<div class="lib-pagination"><button class="btn btn-sm" ${S.histPage<=0?'disabled':''} onclick="App.setHistPage(${S.histPage-1})">← Previous</button><span>Page ${S.histPage+1} of ${pageCount} · ${list.length.toLocaleString()} entries</span><button class="btn btn-sm" ${S.histPage>=pageCount-1?'disabled':''} onclick="App.setHistPage(${S.histPage+1})">Next →</button></div>`:(list.length?`<div class="health-note">${list.length.toLocaleString()} history ${list.length===1?'entry':'entries'}.</div>`:'');
  return `<div class="view-head"><div><div class="view-title">History</div><div class="view-desc">Every logged task — edit or delete anything, the scheduler recalculates from what’s actually here.</div></div>${S.sessions.length?'<button class="btn btn-sm" onclick="App.undoLastEntry()">↺ Undo last entry</button>':''}</div>
    <div class="lib-toolbar v241-history-toolbar"><div class="lib-filters">${v241HistoryCategoryFilterHtml()}<select onchange="App.setHistFilter('type',this.value)"><option value="all">All media types</option><option value="video" ${f.type==='video'?'selected':''}>Video</option><option value="reading" ${f.type==='reading'?'selected':''}>Reading</option></select><select onchange="App.setHistFilter('range',this.value)"><option value="all" ${f.range==='all'?'selected':''}>All time</option><option value="today" ${f.range==='today'?'selected':''}>Today</option><option value="week" ${f.range==='week'?'selected':''}>This week</option><option value="month" ${f.range==='month'?'selected':''}>This month</option><option value="custom" ${f.range==='custom'?'selected':''}>Custom dates</option></select><div class="v241-history-date-filter"><label>From<input type="date" value="${escapeHtml(f.dateFrom||'')}" onchange="App.v241SetHistoryDate('from',this.value)"></label><label>To<input type="date" value="${escapeHtml(f.dateTo||'')}" onchange="App.v241SetHistoryDate('to',this.value)"></label>${(f.dateFrom||f.dateTo)?'<button type="button" class="btn btn-sm btn-ghost" onclick="App.v241ClearHistoryDates()">Clear dates</button>':''}</div></div><button class="btn btn-sm" onclick="App.exportCSV()">Export CSV</button></div>${pager}<div class="card">${rows}</div>${pager}`;
};

/* ---------- Library History pagination -------------------------------- */
S.v241LibraryHistoryPage=Math.max(0,Number(S.v241LibraryHistoryPage)||0);
function v241LibraryHistoryPageData(){const rows=S.activityLog||[],size=V241_LIBRARY_HISTORY_PAGE_SIZE,pages=Math.max(1,Math.ceil(rows.length/size));S.v241LibraryHistoryPage=Math.max(0,Math.min(pages-1,Number(S.v241LibraryHistoryPage)||0));const start=S.v241LibraryHistoryPage*size;return {rows:rows.slice(start,start+size),size,pages,page:S.v241LibraryHistoryPage,total:rows.length};}
function v241LibraryHistoryPager(d){return d.total>d.size?`<div class="lib-pagination v241-library-history-pager"><button class="btn btn-sm" ${d.page<=0?'disabled':''} onclick="App.v241SetLibraryHistoryPage(${d.page-1})">← Previous</button><span>Page ${d.page+1} of ${d.pages} · ${d.total.toLocaleString()} changes</span><button class="btn btn-sm" ${d.page>=d.pages-1?'disabled':''} onclick="App.v241SetLibraryHistoryPage(${d.page+1})">Next →</button></div>`:'';}
function v241SetLibraryHistoryPage(p){S.v241LibraryHistoryPage=Math.max(0,Number(p)||0);render();}
function v241ActivityHtml(){
  const d=v241LibraryHistoryPageData(),lookup=v50LibraryLookup(),latestDelete=v191LatestDeletionActivityByTitle(),libraryIds=new Set((S.library||[]).map(x=>String(x?.id||''))),idx=v241EnsureLibraryIndex();
  const rows=d.rows.map(x=>{const ids=v43FindLogTitles(x,lookup),change=(x.changes||[]).map(c=>`<div>• <b>${escapeHtml(c.title)}</b> ${escapeHtml(c.kind)}${c.fields?.length?`<div>${c.fields.map(escapeHtml).join('<br>')}</div>`:''}</div>`).join(''),earned=Math.max(0,Number(x.xpEarned)||0),xp=earned?`<div class="mf-activity-xp"><strong>+${earned.toLocaleString()} XP</strong> earned</div>`:'';
    const deleted=(Array.isArray(x.deletedItems)?x.deletedItems:[]).filter(i=>i?.id),restoreRows=deleted.map(item=>{const id=String(item.id),latest=latestDelete.get(id)===String(x.id||''),exists=libraryIds.has(id),actionable=latest&&!exists;return `<div class="v191-restore-row"><span class="v191-restore-title">${escapeHtml(cleanTitle(item.title)||'Deleted title')}</span><button type="button" class="btn btn-sm ${actionable?'':'btn-ghost'}" ${actionable?'':'disabled'} onclick="App.v191RestoreDeletedTitle('${escapeHtml(String(x.id||''))}','${escapeHtml(id)}')">${exists?'Restored':actionable?'Restore title':'Older deletion'}</button></div>`;}).join('');
    const restorableCount=deleted.filter(item=>{const id=String(item?.id||'');return id&&latestDelete.get(id)===String(x.id||'')&&!libraryIds.has(id);}).length,restoreBlock=deleted.length?`<div class="v191-restore-block">${restoreRows}${deleted.length>1&&restorableCount>1?`<button type="button" class="btn btn-sm btn-primary v191-restore-all" onclick="App.v191RestoreDeletedGroup('${escapeHtml(String(x.id||''))}')">Restore all deleted titles (${restorableCount})</button>`:''}</div>`:'';
    return `<div class="mf-activity-row"><div class="mf-activity-time">${new Date(x.timestamp).toLocaleString()}</div><div><b>${escapeHtml(x.action)}</b>${x.detail?`<div class="v43-log-detail">${escapeHtml(x.detail)}</div>`:''}${xp}${change?`<div class="v43-log-detail">${change}</div>`:''}${restoreBlock}${ids.length?`<div class="v43-log-actions">${ids.slice(0,5).map(id=>{const i=idx.byId.get(String(id));return i?`<button class="btn btn-sm btn-ghost" onclick="App.openLibraryModal('${escapeHtml(String(id))}')">Edit ${escapeHtml(cleanTitle(i.title))}</button>`:''}).join('')}</div>`:''}</div></div>`;
  }).join('')||'<div class="empty-state">No library activity recorded yet.</div>';
  const pager=v241LibraryHistoryPager(d);return `${pager}<div class="card"><div class="section-label">LIBRARY CHANGE LOG</div><div class="mf-activity" style="max-height:none">${rows}</div></div>${pager}`;
}
mfActivityHtml=v241ActivityHtml;

/* ---------- Persistence / export / sync audit -------------------------- */
const v241BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){const payload=v241BuildFullBackupBase.apply(this,arguments);if(payload?.backupManifest)payload.backupManifest.note='Complete MediaFlow v241 backup. Audited for 50K-title Library performance and current Library/Dynamic Library, Categories, consumption History, paginated Library History, Personal Order, rich title metadata, per-surface cover settings, XP/progression, Choice & Filter layouts and all current persistent cloud-synced settings. History view filters/pagination remain transient UI state and do not alter exported account data.';return payload;};
const v241BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(){const manifest=v241BackupManifestBase.apply(this,arguments);manifest.includes=Object.assign({},manifest.includes||{}, {editTitleClarityV241:true,loggedCategoryCoverFallbackV241:true,loggedCoverTitleDetailsV241:true,libraryHistoryPaginationV241:true,historySearchableCategoryFilterV241:true,historyCustomDatesV241:true,performance50kAuditV241:true,fullExportImportAuditV241:true,automaticBackupAuditV241:true,syncNowAuditV241:true,settingsPresetAuditV241:true,historyExportAuditV241:true,personalOrderExportAuditV241:true});manifest.v241={cloudSyncVersion:201,fullBackupSchema:29,settingsPresetSchema:1,personalOrderExportVersion:4,historyFiltersTransient:true};return manifest;};
const v241BuildSettingsPresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){const preset=v241BuildSettingsPresetBase.apply(this,arguments);preset.presetManifest=preset.presetManifest||{};preset.presetManifest.includes=Object.assign({},preset.presetManifest.includes||{}, {currentPersistentSettingsAuditV241:true,performanceSafeSettingsV241:true});return preset;};
const v241OrderExportPayloadBase=v142OrderExportPayload;
v142OrderExportPayload=function(){const payload=v241OrderExportPayloadBase.apply(this,arguments);payload.exportAudit=Object.assign({},payload.exportAudit||{}, {release:V241_RUNTIME_VERSION,current:true,personalOrderFormat:4,performanceAudit:'50k'});return payload;};
function v241AuditSnapshot(){return {backup:v148BuildFullBackup(),preset:v196BuildSettingsPreset(),order:v142OrderExportPayload()};}

Object.assign(App,{v241LibraryById,v241ToggleHistoryCategory,v241ClearHistoryCategories,v241HistoryCategoryToggle,v241SearchHistoryCategories,v241SetHistoryCategoryPage,v241SetHistoryDate,v241ClearHistoryDates,v241SetLibraryHistoryPage,v241AuditSnapshot});
MediaFlowRuntime.version=V241_RUNTIME_VERSION;
