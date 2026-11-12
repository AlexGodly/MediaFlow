/* ============================================================
   MediaFlow v276 — Collections + Personal Order refinement
   ------------------------------------------------------------
   - Personal Order Add Titles now shows real covers/category fallback.
   - Collections showcase/browser artwork is poster-correct and showcase is
     rebuilt around the supplied Simkl-style horizontal list reference.
   - Collection opening renders immediately and persists last-viewed in the
     background; repeated per-render title resolution is cached.
   - Collection Tools gain Clean Covers, cover/title sizing and the Library
     overlay size controls.
   - Covers+Titles layout, exact rating buckets and Order View numeric
     positioning are corrected.
   - Collection/Add Titles searches retain focus while typing.
   - Semantic icons replace generic ASC/DESC, Order View and Showcase icons.
   - Responsive bottom navigation chooses how many primary tabs actually fit.
   ============================================================ */
const V276_RUNTIME_VERSION=276;

/* ---------- semantic icons ----------------------------------------- */
Object.assign(V225_BUTTON_ICONS,{
  sortAsc:v225IconSvg('<path d="M7 17V4"/><path d="m3 8 4-4 4 4"/><path d="M14 7h7M14 12h5M14 17h3"/>'),
  sortDesc:v225IconSvg('<path d="M7 4v13"/><path d="m3 13 4 4 4-4"/><path d="M14 7h3M14 12h5M14 17h7"/>'),
  orderList:v225IconSvg('<path d="M10 6h11M10 12h11M10 18h11"/><path d="M4 5h2v3M4 8h3M4 11h2l-2 3h3M4 17c1-1 3-1 3 1s-2 2-3 1"/>'),
  showcase:v225IconSvg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v14M13 5v14"/><path d="M17 9h2M17 13h2"/>')
});
function v276SortIcon(dir){return dir==='asc'?'sortAsc':'sortDesc';}

/* ---------- v276 collection settings ------------------------------- */
const v276EnsureSettingsBase=v274EnsureSettings;
v274EnsureSettings=function(target=S.settings||DEFAULT_SETTINGS){
  const s=v276EnsureSettingsBase.apply(this,arguments);
  s.cleanCovers=!!s.cleanCovers;
  s.collectionCoverSize=Math.max(25,Math.min(400,Math.round(v274Num(s.collectionCoverSize,100))));
  s.collectionTitleTextSize=Math.max(60,Math.min(220,Math.round(v274Num(s.collectionTitleTextSize,100))));
  return s;
};
v274EnsureSettings(DEFAULT_SETTINGS);v274EnsureSettings(S.settings||DEFAULT_SETTINGS);
function v276CollectionSettings(){return v274EnsureSettings(S.settings||DEFAULT_SETTINGS);}
function v276ApplyCollectionVisualVars(){
  const s=v276CollectionSettings(),root=document.documentElement;
  root.style.setProperty('--mf276-collection-cover-scale',String(s.collectionCoverSize/100));
  root.style.setProperty('--mf276-collection-title-scale',String(s.collectionTitleTextSize/100));
}
function v276PreviewCollectionSize(kind,value,input){
  const s=v276CollectionSettings();
  if(kind==='cover')s.collectionCoverSize=Math.max(25,Math.min(400,Math.round(Number(value)||100)));
  if(kind==='title')s.collectionTitleTextSize=Math.max(60,Math.min(220,Math.round(Number(value)||100)));
  v276ApplyCollectionVisualVars();
  if(input){const out=input.closest('.mf276-size-control')?.querySelector('output');if(out)out.textContent=`${kind==='cover'?s.collectionCoverSize:s.collectionTitleTextSize}%`;}
}
function v276SetCollectionSize(kind,value){
  v276PreviewCollectionSize(kind,value,null);const s=v276CollectionSettings();s.modifiedAt=v274Now();persistSettings();render();
}
function v276ToggleCollectionCleanCovers(){
  const s=v276CollectionSettings();s.cleanCovers=!s.cleanCovers;s.modifiedAt=v274Now();
  if(s.cleanCovers)S.librarySelection={};persistSettings();render();
  showToast(s.cleanCovers?'Clean Covers enabled for Collections':'Clean Covers disabled for Collections');
}
function v276CollectionSizingControlsHtml(){
  const s=v276CollectionSettings();
  return `<div class="mf276-collection-sizing" aria-label="Collection display sizing">
    <label class="mf276-size-control"><span>Cover size</span><input type="range" min="25" max="400" step="5" value="${s.collectionCoverSize}" oninput="App.v276PreviewCollectionSize('cover',this.value,this)" onchange="App.v276SetCollectionSize('cover',this.value)"><input class="mf276-size-number" type="number" min="25" max="400" step="5" value="${s.collectionCoverSize}" onchange="App.v276SetCollectionSize('cover',this.value)"><output>${s.collectionCoverSize}%</output></label>
    <label class="mf276-size-control"><span>Title text size</span><input type="range" min="60" max="220" step="5" value="${s.collectionTitleTextSize}" oninput="App.v276PreviewCollectionSize('title',this.value,this)" onchange="App.v276SetCollectionSize('title',this.value)"><output>${s.collectionTitleTextSize}%</output></label>
    <label class="v191-clean-covers-control mf276-clean-covers" title="Hide selection squares in Collection Covers and Covers+Titles."><span>Clean Covers</span><button type="button" class="toggle ${s.cleanCovers?'on':''}" onclick="event.preventDefault();App.v276ToggleCollectionCleanCovers()" aria-label="Toggle Collection Clean Covers"></button><b>${s.cleanCovers?'ON':'OFF'}</b></label>
  </div>`;
}

/* ---------- per-render collection data cache ----------------------- */
let V276_RENDER_EPOCH=0;
const V276_COLLECTION_ITEM_CACHE=new Map();
const v276CollectionItemsBase=v274CollectionItems;
v274CollectionItems=function(c){
  if(!c)return [];
  const key=String(c.id||'');const hit=V276_COLLECTION_ITEM_CACHE.get(key);
  if(hit&&hit.epoch===V276_RENDER_EPOCH&&hit.ids===c.titleIds&&hit.library===S.library)return hit.items;
  const items=v276CollectionItemsBase.apply(this,arguments);
  V276_COLLECTION_ITEM_CACHE.set(key,{epoch:V276_RENDER_EPOCH,ids:c.titleIds,library:S.library,items});
  return items;
};
const v276RenderBase=render;
render=function(){V276_RENDER_EPOCH++;const out=v276RenderBase.apply(this,arguments);queueMicrotask(v276ApplyCollectionVisualVars);return out;};

/* ---------- Personal Order: real covers in Add Titles -------------- */
function v276OrderPickerCoverHtml(item){
  const url=v274CoverUrl(item),cat=v274Cat(item),fallback=cat?v144CategoryIconHtml(cat):'◇';
  if(url)return `<span class="mf276-order-picker-cover"><img src="${escapeHtml(url)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="mf276-order-picker-fallback" style="display:none;--mf276-cat:${escapeHtml(cat?.color||'var(--flow)')}">${fallback}</span></span>`;
  return `<span class="mf276-order-picker-cover fallback" style="--mf276-cat:${escapeHtml(cat?.color||'var(--flow)')}"><span class="mf276-order-picker-fallback">${fallback}</span></span>`;
}
v138PickerResultsHtml=function(data){
  const page=data||v140OrderPickerPageData(),rows=page.rows,picks=page.ui.picks;
  if(!rows.length)return `<div class="hint" style="padding:12px 2px">No Library titles match the current search and filters.</div>`;
  return rows.map(item=>{const c=v138OrderCategory(item.categoryId),id=String(item.id);return `<label class="v138-picker-row mf276-picker-row"><input type="checkbox" ${picks.has(id)?'checked':''} onchange="App.v138ToggleOrderPick('${escapeHtml(id)}',this.checked)">${v276OrderPickerCoverHtml(item)}<span class="v138-picker-copy"><b>${escapeHtml(cleanTitle(item.title))}</b><small>${v144CategoryIconHtml(c)} ${escapeHtml(c?.name||'Unknown')} · ${escapeHtml(v199StatusLabel(item.status))} · ${escapeHtml(v138ProgressText(item))}</small></span></label>`;}).join('');
};

/* ---------- exact rating buckets ----------------------------------- */
const V276_RATING_BUCKETS=['10','9','8','7','6','5','4','3','2','1'];
function v276NormalizeRatingMode(mode){const v=String(mode||'all');if(/^([1-9]|10)\+$/.test(v))return v.replace('+','');return ['all','rated','unrated',...V276_RATING_BUCKETS].includes(v)?v:'all';}
function v276RatingOptions(mode){mode=v276NormalizeRatingMode(mode);return `<option value="all" ${mode==='all'?'selected':''}>All ratings</option><option value="rated" ${mode==='rated'?'selected':''}>Rated only</option><option value="unrated" ${mode==='unrated'?'selected':''}>Unrated</option>${V276_RATING_BUCKETS.map(n=>`<option value="${n}" ${mode===n?'selected':''}>${n}</option>`).join('')}`;}
v274RatingMatch=function(item,mode){
  mode=v276NormalizeRatingMode(mode);const r=v274Num(item?.rating,0);
  if(mode==='rated')return r>0;if(mode==='unrated')return r<=0;if(/^([1-9]|10)$/.test(mode))return r>0&&Math.floor(Math.min(10,r))===Number(mode);return true;
};
v274LibraryRatingMode=function(){S.histFilters=S.histFilters||{};const v=v276NormalizeRatingMode(S.histFilters.libRating||'all');if(v!==S.histFilters.libRating)S.histFilters.libRating=v;return v;};
v274LibraryRatingFilterHtml=function(){const m=v274LibraryRatingMode();return `<select class="mf274-library-rating-filter" onchange="App.v274SetLibraryRatingFilter(this.value)" aria-label="Filter Library by rating">${v276RatingOptions(m)}</select>`;};

/* ---------- showcase / browser artwork ----------------------------- */
function v276ShowcaseCoverHtml(c){
  const own=v274Text(c?.coverUrl);
  if(own)return `<div class="mf276-showcase-strip single"><img src="${escapeHtml(own)}" alt="" loading="lazy"></div>`;
  const items=v274CollectionCoverItems(c).slice(0,4);
  if(!items.length)return `<div class="mf276-showcase-strip empty"><span>◇</span></div>`;
  return `<div class="mf276-showcase-strip count-${items.length}">${items.map(item=>{const url=v274CoverUrl(item),cat=v274Cat(item);return url?`<span class="mf276-showcase-poster"><img src="${escapeHtml(url)}" alt="" loading="lazy"></span>`:`<span class="mf276-showcase-poster fallback" style="--mf276-cat:${escapeHtml(cat?.color||'var(--flow)')}">${cat?v144CategoryIconHtml(cat):'◇'}</span>`;}).join('')}</div>`;
}
const v276CollectionBrowserCardBase=v274CollectionBrowserCard;
v274CollectionBrowserCard=function(c,mode){
  if(mode!=='showcase')return v276CollectionBrowserCardBase.apply(this,arguments);
  const p=v274CollectionProgress(c),desc=escapeHtml(c.description||'No description yet.');
  return `<article class="mf274-browser-showcase mf276-browser-showcase"><button type="button" class="mf274-showcase-cover mf276-showcase-cover" onclick="App.v274OpenCollection('${escapeHtml(c.id)}')">${v276ShowcaseCoverHtml(c)}</button><div class="mf274-showcase-copy"><div class="mf274-showcase-meta"><span>COLLECTION LIST</span><small>Created ${new Date(c.createdAt).toLocaleDateString()} · Updated ${new Date(c.updatedAt).toLocaleDateString()}</small></div><button type="button" class="mf274-title-link" onclick="App.v274OpenCollection('${escapeHtml(c.id)}')">${escapeHtml(c.title)}</button><p>${desc}</p><div class="mf276-showcase-stats"><span>${c.titleIds.length.toLocaleString()} titles</span><span>${p.pct}% progress</span>${c.lastViewedAt?`<span>Viewed ${new Date(c.lastViewedAt).toLocaleDateString()}</span>`:''}</div></div><div class="mf274-browser-actions"><button class="btn btn-sm" onclick="App.v274OpenCollection('${escapeHtml(c.id)}')">Open</button><button class="btn btn-sm btn-ghost" onclick="App.v274EditCollection('${escapeHtml(c.id)}')">Edit</button></div></article>`;
};
function v276BrowserViewSwitch(){const mode=v274EnsureSettings().browserView;const rows=[['covers','Covers','covers'],['compact','Compact','compact'],['list','List','list'],['cards','Cards','cards'],['showcase','Showcase','showcase']];return `<div class="mf274-view-switch" aria-label="Collection display mode">${rows.map(([id,label,icon])=>`<button type="button" class="btn btn-sm ${mode===id?'btn-primary':''}" data-v225-icon="${icon}" onclick="App.v274SetBrowserView('${id}')">${label}</button>`).join('')}</div>`;}
function v276CollectionsResultsHtml(rows,mode){return rows.length?`<div id="mf276-collections-results" class="mf274-browser-results mode-${mode}">${rows.map(c=>v274CollectionBrowserCard(c,mode)).join('')}</div>`:`<div id="mf276-collections-results" class="empty-state card"><div class="em-title">No collections found</div><div>${V274_UI.search?'No collections match this search.':'Create a collection to build franchises, watchlists, reading lists or any custom grouping.'}</div>${V274_UI.search?'':`<button class="btn btn-primary" style="margin-top:14px" onclick="App.v274CreateCollection()">Create your first collection</button>`}</div>`;}
v274CollectionsBrowserHtml=function(){
  const rows=v274FilteredCollections(),mode=v274EnsureSettings().browserView;
  return `<div class="mf274-page mf274-collections-browser"><div class="view-head mf274-collections-head"><div><div class="view-title">Collections</div><div class="view-desc">Build curated lists that behave like focused mini Libraries.</div></div><button type="button" class="btn btn-primary" onclick="App.v274CreateCollection()">+ Add collection</button></div><div class="mf274-browser-toolbar card"><input id="mf276-collection-search" type="search" placeholder="Search collections…" value="${escapeHtml(V274_UI.search)}" oninput="App.v276CollectionSearchInput(this.value,this)"><select onchange="App.v274SetCollectionSort(this.value)"><option value="updated" ${V274_UI.sort==='updated'?'selected':''}>Recently updated</option><option value="alphabetic" ${V274_UI.sort==='alphabetic'?'selected':''}>Alphabetic</option><option value="added" ${V274_UI.sort==='added'?'selected':''}>Recently added</option><option value="viewed" ${V274_UI.sort==='viewed'?'selected':''}>Recently viewed</option><option value="count" ${V274_UI.sort==='count'?'selected':''}>Title count</option><option value="progress" ${V274_UI.sort==='progress'?'selected':''}>Progress</option></select><button type="button" class="btn btn-sm" data-v225-icon="${v276SortIcon(V274_UI.dir)}" onclick="App.v274ToggleCollectionSortDir()" title="Sort ${V274_UI.dir==='asc'?'ascending':'descending'}">${V274_UI.dir.toUpperCase()}</button>${v276BrowserViewSwitch()}<span class="hint" data-mf276-collection-count>${rows.length.toLocaleString()} collection${rows.length===1?'':'s'}</span></div>${v276CollectionsResultsHtml(rows,mode)}</div>`;
};
function v276CollectionSearchInput(value,input){
  V274_UI.search=String(value||'');V274_UI.page=0;const rows=v274FilteredCollections(),mode=v274EnsureSettings().browserView;
  const old=document.getElementById('mf276-collections-results');if(old)old.outerHTML=v276CollectionsResultsHtml(rows,mode);
  const count=document.querySelector('[data-mf276-collection-count]');if(count)count.textContent=`${rows.length.toLocaleString()} collection${rows.length===1?'':'s'}`;
  // input itself is never replaced, so typing remains uninterrupted.
}

/* ---------- collection tools --------------------------------------- */
function v276CategoryLabel(ids){
  ids=Array.isArray(ids)?ids:[];if(!ids.length)return 'All categories';
  if(ids.length===1){const cat=(S.categories||[]).find(c=>String(c?.id||'')===String(ids[0]));return cat?.name||'1 category selected';}
  return `${ids.length} categories selected`;
}
function v276CollectionOverlayControlHtml(key,label,icon){
  const cfg=v254EnsureCoverOverlaySettings(S.settings||DEFAULT_SETTINGS),on=!!cfg[key],size=v256ClampCoverSize(cfg.sizes?.[key]);
  return `<div class="v256-cover-control"><button type="button" class="btn btn-sm v254-cover-overlay-toggle ${on?'active':''}" data-v225-icon="${escapeHtml(icon)}" aria-pressed="${on?'true':'false'}" title="${on?'Hide':'Show'} ${escapeHtml(label.toLowerCase())} on Collection covers" onclick="App.v254ToggleCoverOverlay('${escapeHtml(key)}')">${escapeHtml(label)} <span class="v254-cover-overlay-state">${on?'ON':'OFF'}</span></button><label class="v256-cover-size" title="Adjust ${escapeHtml(label.toLowerCase())} overlay size"><span>Size</span><input type="range" min="60" max="180" step="5" value="${size}" oninput="App.v256PreviewCoverOverlaySize('${escapeHtml(key)}',this.value,this)" onchange="App.v256SetCoverOverlaySize('${escapeHtml(key)}',this.value)"><output data-v256-size-value>${size}%</output></label></div>`;
}
v274CollectionOverlayControlsHtml=function(mode){if(mode!=='covers'&&mode!=='covers-title')return '';return `<div class="v254-cover-overlay-controls v256-cover-overlay-controls mf274-cover-overlay-controls" aria-label="Collection cover information visibility and sizing"><div class="v254-cover-overlay-label"><b>On cover</b><span>Choose what appears over Collection Covers and Covers+Titles, then adjust each overlay size.</span></div><div class="v254-cover-overlay-actions v256-cover-overlay-actions">${v276CollectionOverlayControlHtml('status','Status','watching')}${v276CollectionOverlayControlHtml('category','Category','category')}${v276CollectionOverlayControlHtml('rating','Rating','rating')}${v276CollectionOverlayControlHtml('progress','Progress','progressBar')}</div></div>`;};
v274CollectionToolsHtml=function(c){
  const f=V274_UI.filters,cats=(S.categories||[]).filter(c=>c?.id),catLabel=v276CategoryLabel(f.categories),mode=v274EnsureSettings().detailView;
  return `${v274CollectionBatchBarHtml(c)}<div class="mf274-collection-tools card"><div class="mf274-tools-head"><div><span class="section-label">COLLECTION TOOLS</span><p>Library-style browsing, filters, display modes, Clean Covers and cover sizing for this collection.</p></div><button class="btn btn-sm btn-ghost" onclick="App.v274ToggleCollectionTools()">Hide tools</button></div><div class="mf274-tools-grid"><input type="search" placeholder="Search titles…" value="${escapeHtml(f.search)}" oninput="App.v276CollectionDetailSearch(this.value,this)"><details class="v66-cat-filter"><summary class="btn">${escapeHtml(catLabel)} ▾</summary><div class="v66-cat-panel"><div class="v66-cat-head"><b>Show categories</b><button type="button" class="btn btn-sm btn-ghost" onclick="App.v274ClearCollectionCategories(event)">All</button></div>${cats.map(cat=>`<label class="v66-cat-option"><input type="checkbox" ${f.categories.includes(String(cat.id))?'checked':''} onchange="App.v274ToggleCollectionCategory('${escapeHtml(String(cat.id))}',this.checked)"><span>${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</span></label>`).join('')}</div></details><select onchange="App.v274SetCollectionFilter('status',this.value)"><option value="all" ${f.status==='all'?'selected':''}>All statuses</option>${['planned','active','paused','completed','dropped'].map(x=>`<option value="${x}" ${f.status===x?'selected':''}>${escapeHtml(v274StatusLabel(x))}</option>`).join('')}</select><select onchange="App.v274SetCollectionFilter('priority',this.value)"><option value="all" ${f.priority==='all'?'selected':''}>All priorities</option>${['high','medium','low'].map(x=>`<option value="${x}" ${f.priority===x?'selected':''}>${x[0].toUpperCase()+x.slice(1)}</option>`).join('')}</select><select onchange="App.v274SetCollectionFilter('rating',this.value)">${v276RatingOptions(f.rating)}</select><select onchange="App.v274SetCollectionFilter('cover',this.value)"><option value="all" ${f.cover==='all'?'selected':''}>All covers</option><option value="has" ${f.cover==='has'?'selected':''}>Has cover</option><option value="missing" ${f.cover==='missing'?'selected':''}>Missing cover</option></select><select onchange="App.v274SetCollectionFilter('sort',this.value)"><option value="order" ${f.sort==='order'?'selected':''}>Collection order</option><option value="title" ${f.sort==='title'?'selected':''}>Alphabetic</option><option value="priority" ${f.sort==='priority'?'selected':''}>Priority</option><option value="rating" ${f.sort==='rating'?'selected':''}>Rating</option><option value="progress" ${f.sort==='progress'?'selected':''}>Progress</option><option value="total" ${f.sort==='total'?'selected':''}>Total</option><option value="year" ${f.sort==='year'?'selected':''}>Year</option></select><button type="button" class="btn btn-sm" data-v225-icon="${v276SortIcon(f.dir)}" onclick="App.v274ToggleCollectionFilterDir()">${f.dir.toUpperCase()}</button><button type="button" class="btn btn-sm btn-ghost" onclick="App.v274ClearCollectionFilters()">Clear filters</button></div><div class="mf274-display-row"><span>Display</span>${[['list','List','list'],['compact','Compact','compact'],['cards','Cards','cards'],['covers','Covers','covers'],['covers-title','Covers+Titles','coversTitles']].map(([id,label,icon])=>`<button class="btn btn-sm ${mode===id?'btn-primary':''}" data-v225-icon="${icon}" onclick="App.v274SetDetailView('${id}')">${label}</button>`).join('')}<label class="mf274-page-size">Titles/page <select onchange="App.v274SetCollectionPageSize(this.value)">${[25,50,100,200].map(n=>`<option value="${n}" ${v274EnsureSettings().pageSize===n?'selected':''}>${n}</option>`).join('')}</select></label></div>${v276CollectionSizingControlsHtml()}${v274AdvancedFiltersHtml()}${v274CollectionOverlayControlsHtml(mode)}</div>`;
};
function v276CollectionDetailSearch(value,input){
  V274_UI.filters.search=String(value||'');V274_UI.detailPage=0;
  const pos=input?.selectionStart??String(value||'').length;render();
  requestAnimationFrame(()=>{const next=document.querySelector('.mf274-collection-tools input[type="search"]');if(next){try{next.focus({preventScroll:true});next.setSelectionRange(pos,pos);}catch(_){next.focus();}}});
}

/* ---------- Clean Covers selection guard --------------------------- */
const v276CollectionItemHtmlBase=v274CollectionItemHtml;
v274CollectionItemHtml=function(c,item,mode){
  let h=v276CollectionItemHtmlBase.apply(this,arguments);const clean=v276CollectionSettings().cleanCovers&&(mode==='covers'||mode==='covers-title');
  if(clean)h=h.replace(/<label class="mf274-select-title"[\s\S]*?<\/label>/,'');return h;
};
const v276SelectVisibleBase=v274SelectCollectionVisible;
v274SelectCollectionVisible=function(){const mode=v274EnsureSettings().detailView;if(v276CollectionSettings().cleanCovers&&(mode==='covers'||mode==='covers-title')){showToast('Turn off Collection Clean Covers to select cover tiles.');return;}return v276SelectVisibleBase.apply(this,arguments);};
const v276SelectAllBase=v274SelectCollectionAll;
v274SelectCollectionAll=function(){const mode=v274EnsureSettings().detailView;if(v276CollectionSettings().cleanCovers&&(mode==='covers'||mode==='covers-title')){showToast('Turn off Collection Clean Covers to select cover tiles.');return;}return v276SelectAllBase.apply(this,arguments);};

/* ---------- Add Titles: stable search + categories + exact rating -- */
let V276_ADD_COLLECTION_ID='';
function v276CurrentAddCollection(){const id=V276_ADD_COLLECTION_ID||(typeof V275_ADD_COLLECTION_ID!=='undefined'?V275_ADD_COLLECTION_ID:'')||String(V274_UI.activeId||'');return v274CollectionById(id);}
function v276AddData(c){const s=v274AddState(),rows=v274AddCandidates(c),pageSize=24,pages=Math.max(1,Math.ceil(rows.length/pageSize));s.page=Math.max(0,Math.min(s.page,pages-1));return {s,rows,pages,shown:rows.slice(s.page*pageSize,(s.page+1)*pageSize)};}
function v276AddResultsHtml(shown){return shown.length?shown.map(item=>{const cat=v274Cat(item),id=String(item.id),checked=v274AddState().picks.has(id);return `<label class="mf274-add-row"><input type="checkbox" ${checked?'checked':''} onchange="App.v274AddPick('${escapeHtml(id)}',this.checked)">${v274TitleCover(item,false)}<span><b>${escapeHtml(v274SafeTitle(item))}</b><small>${cat?v144CategoryIconHtml(cat):''} ${escapeHtml(cat?.name||'Uncategorized')} · ${escapeHtml(v274StatusLabel(item.status))} · ${escapeHtml(String(item.priority||'medium'))}${Number(item.rating)>0?` · ★ ${Number(item.rating).toFixed(1)}`:''}</small></span></label>`;}).join(''):'<div class="empty-state">No Library titles match.</div>';}
function v276AddFooterHtml(data){const {s,rows,pages,shown}=data;return `<div class="mf274-add-select-actions"><button class="btn btn-sm btn-ghost" ${shown.length?'':'disabled'} onclick="App.v274AddSelectVisible()">Select visible</button><button class="btn btn-sm btn-ghost" ${s.picks.size?'':'disabled'} onclick="App.v274AddDeselectAll()">Deselect all</button><span class="hint">${s.picks.size} selected · ${rows.length.toLocaleString()} matches</span></div><div class="mf274-add-pager"><button class="btn btn-sm" ${s.page===0?'disabled':''} onclick="App.v274AddPage(${s.page-1})">← Prev</button><span>Page ${s.page+1}/${pages}</span><button class="btn btn-sm" ${s.page>=pages-1?'disabled':''} onclick="App.v274AddPage(${s.page+1})">Next →</button></div>`;}
v274AddModalBody=function(c){
  const data=v276AddData(c),s=data.s,cats=(S.categories||[]).filter(x=>x?.id),catLabel=v276CategoryLabel(s.categories);
  return `<div class="mf274-add-tools"><input id="mf276-add-search" type="search" placeholder="Search your Library…" value="${escapeHtml(s.search)}" oninput="App.v276AddSearchInput(this.value,this)"><details class="v66-cat-filter mf276-add-category-filter"><summary class="btn"><span class="mf276-cat-summary">${escapeHtml(catLabel)}</span><span class="mf276-cat-count">${s.categories.length||''}</span></summary><div class="v66-cat-panel"><div class="v66-cat-head"><b>Show categories</b><button class="btn btn-sm btn-ghost" onclick="App.v274AddClearCategories(event)">All</button></div>${cats.map(cat=>`<label class="v66-cat-option"><input type="checkbox" ${s.categories.includes(String(cat.id))?'checked':''} onchange="App.v274AddToggleCategory('${escapeHtml(String(cat.id))}',this.checked)"><span>${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</span></label>`).join('')}</div></details><select onchange="App.v274AddFilter('status',this.value)"><option value="all" ${s.status==='all'?'selected':''}>All statuses</option>${['planned','active','paused','completed','dropped'].map(x=>`<option value="${x}" ${s.status===x?'selected':''}>${escapeHtml(v274StatusLabel(x))}</option>`).join('')}</select><select onchange="App.v274AddFilter('priority',this.value)"><option value="all" ${s.priority==='all'?'selected':''}>All priorities</option>${['high','medium','low'].map(x=>`<option value="${x}" ${s.priority===x?'selected':''}>${x[0].toUpperCase()+x.slice(1)}</option>`).join('')}</select><select onchange="App.v274AddFilter('rating',this.value)">${v276RatingOptions(s.rating)}</select><select onchange="App.v274AddFilter('sort',this.value)"><option value="title" ${s.sort==='title'?'selected':''}>Alphabetic</option><option value="priority" ${s.sort==='priority'?'selected':''}>Priority</option><option value="rating" ${s.sort==='rating'?'selected':''}>Rating</option><option value="progress" ${s.sort==='progress'?'selected':''}>Progress</option><option value="total" ${s.sort==='total'?'selected':''}>Total</option></select><button class="btn btn-sm" data-v225-icon="${v276SortIcon(s.dir)}" onclick="App.v274AddToggleDir()">${s.dir.toUpperCase()}</button></div><div id="mf276-add-results" class="mf274-add-results">${v276AddResultsHtml(data.shown)}</div><div id="mf276-add-footer" class="mf274-add-footer">${v276AddFooterHtml(data)}</div>`;
};
const v276OpenAddBase=v274OpenAddTitles;
v274OpenAddTitles=function(id){V276_ADD_COLLECTION_ID=String(id||'');return v276OpenAddBase.apply(this,arguments);};
v274RefreshAddModal=function(){const c=v276CurrentAddCollection(),body=document.getElementById('mf274-add-body');if(c&&body)body.innerHTML=v274AddModalBody(c);const b=document.getElementById('mf274-add-confirm');if(b)b.disabled=!v274AddState().picks.size;};
function v276AddSearchInput(value,input){
  const c=v276CurrentAddCollection();if(!c)return;const s=v274AddState();s.search=String(value||'');s.page=0;const data=v276AddData(c);
  const results=document.getElementById('mf276-add-results'),footer=document.getElementById('mf276-add-footer');if(results)results.innerHTML=v276AddResultsHtml(data.shown);if(footer)footer.innerHTML=v276AddFooterHtml(data);const b=document.getElementById('mf274-add-confirm');if(b)b.disabled=!s.picks.size;
}
const v276AddFilterBase=v274AddFilter;
v274AddFilter=function(key,value){if(key==='search')return v276AddSearchInput(value,document.getElementById('mf276-add-search'));return v276AddFilterBase.apply(this,arguments);};
const v276CloseOverlayBase=v274CloseOverlay;
v274CloseOverlay=function(id){const out=v276CloseOverlayBase.apply(this,arguments);if(String(id)==='mf274-add-titles')V276_ADD_COLLECTION_ID='';return out;};

/* ---------- Collection opening / ordering performance -------------- */
v274OpenCollection=async function(id){
  const c=v274CollectionById(id);if(!c)return;S.librarySelection={};c.lastViewedAt=v274Now();V274_UI.activeId=c.id;V274_UI.orderView=false;V274_UI.detailPage=0;v274ResetCollectionFilters();render();
  try{window.scrollTo({top:0,behavior:'smooth'});}catch(_){window.scrollTo(0,0);}
  // Last-viewed is metadata; never block navigation on a cloud/local write and
  // do not rewrite updatedAt (Recently Updated and Recently Viewed are distinct).
  queueMicrotask(()=>{try{Promise.resolve(saveState()).catch(()=>{});}catch(_){ }});
};
function v276PersistCollectionSoon(){queueMicrotask(()=>{try{Promise.resolve(saveState()).catch(()=>{});}catch(_){ }});}
function v276SetCollectionOrderPosition(collectionId,titleId,value){
  const c=v274CollectionById(collectionId);if(!c)return;const ids=c.titleIds.slice(),from=ids.indexOf(String(titleId));if(from<0)return;const to=Math.max(0,Math.min(ids.length-1,(Math.floor(Number(value)||1)-1)));if(from===to)return;const [x]=ids.splice(from,1);ids.splice(to,0,x);c.titleIds=ids;c.order=ids.slice();v274TouchCollection(c);render();v276PersistCollectionSoon();
}
v274OrderRowsHtml=function(c){const items=v274CollectionItems(c);if(!items.length)return '<div class="empty-state">Add titles before ordering this collection.</div>';return `<div class="mf274-order-list">${items.map((item,index)=>`<article class="mf274-order-row mf276-order-row" draggable="true" data-collection-id="${escapeHtml(c.id)}" data-title-id="${escapeHtml(String(item.id))}" ondragstart="App.v274OrderDragStart(event,'${escapeHtml(String(item.id))}')" ondragover="event.preventDefault()" ondrop="App.v274OrderDrop(event,'${escapeHtml(c.id)}','${escapeHtml(String(item.id))}')"><label class="mf276-order-number" title="Type an exact position"><input type="number" min="1" max="${items.length}" value="${index+1}" onchange="App.v276SetCollectionOrderPosition('${escapeHtml(c.id)}','${escapeHtml(String(item.id))}',this.value)" onkeydown="if(event.key==='Enter')this.blur()"></label><span class="mf274-grip">⋮⋮</span>${v274TitleCover(item)}<button class="mf274-title-link" onclick="App.v274OpenTitle('${escapeHtml(String(item.id))}')">${escapeHtml(v274SafeTitle(item))}</button><div class="mf274-order-actions"><button class="btn btn-sm" ${index===0?'disabled':''} onclick="App.v274MoveTitle('${escapeHtml(c.id)}','${escapeHtml(String(item.id))}',-1)">↑</button><button class="btn btn-sm" ${index===items.length-1?'disabled':''} onclick="App.v274MoveTitle('${escapeHtml(c.id)}','${escapeHtml(String(item.id))}',1)">↓</button><button class="btn btn-sm btn-ghost" onclick="App.v274RemoveTitle('${escapeHtml(c.id)}','${escapeHtml(String(item.id))}')">Remove</button></div></article>`).join('')}</div>`;};
const v276OrderDropBase=v274OrderDrop;
v274OrderDrop=async function(event,collectionId,targetId){event?.preventDefault?.();const source=V274_DRAG_ID||event?.dataTransfer?.getData?.('text/plain');V274_DRAG_ID='';if(!source||source===String(targetId))return;const c=v274CollectionById(collectionId);if(!c)return;const ids=c.titleIds.slice(),from=ids.indexOf(String(source)),to=ids.indexOf(String(targetId));if(from<0||to<0)return;ids.splice(from,1);ids.splice(to,0,String(source));c.titleIds=ids;c.order=ids.slice();v274TouchCollection(c);render();v276PersistCollectionSoon();};
v274MoveTitle=async function(collectionId,titleId,delta){const c=v274CollectionById(collectionId);if(!c)return;const ids=c.titleIds.slice(),i=ids.indexOf(String(titleId)),j=Math.max(0,Math.min(ids.length-1,i+(Number(delta)||0)));if(i<0||i===j)return;const [x]=ids.splice(i,1);ids.splice(j,0,x);c.titleIds=ids;c.order=ids.slice();v274TouchCollection(c);render();v276PersistCollectionSoon();};

/* ---------- Detail header icon + visual vars ----------------------- */
const v276CollectionDetailBase=v274CollectionDetailHtml;
v274CollectionDetailHtml=function(c){
  let h=v276CollectionDetailBase.apply(this,arguments);
  h=h.replace(/<button class="btn btn-sm ([^"]*)" onclick="App\.v274ToggleOrderView\(\)">Order view ([^<]+)<\/button>/,`<button class="btn btn-sm $1" data-v225-icon="orderList" onclick="App.v274ToggleOrderView()">Order view $2</button>`);
  return h;
};

/* ---------- Responsive mobile navigation --------------------------- */
function v276MobileNavSlotCount(width=window.innerWidth||360){
  width=Math.max(280,Number(width)||360);if(width<360)return 4;if(width<480)return 5;if(width<640)return 6;if(width<820)return 7;return 8;
}
renderMobileTabs=function(){
  const visible=v161VisibleNavItems(),slots=v276MobileNavSlotCount(),needsMore=visible.length>slots,primaryCount=needsMore?Math.max(1,slots-1):Math.min(slots,visible.length),primary=visible.slice(0,primaryCount),extra=visible.slice(primaryCount),moreActive=extra.some(n=>n.id===S.view);
  const tabs=primary.map(n=>`<button type="button" class="mtab ${S.view===n.id?'active':''}" onclick="App.mobileNav('${n.id}')" aria-label="${escapeHtml(n.label)}">${ICONS[n.id]||''}<span>${escapeHtml(n.label)}</span></button>`).join('');
  if(!extra.length)return tabs;
  return `${tabs}<div class="mobile-more-wrap"><button type="button" class="mtab ${moreActive?'active':''}" onclick="App.toggleMobileMore(event)" aria-label="More pages" aria-expanded="false">${ICONS.more}<span>More</span></button><div id="mobile-more-menu" class="mobile-more-menu hide">${extra.map(n=>`<button type="button" class="mobile-more-item ${S.view===n.id?'active':''}" onclick="App.mobileNav('${n.id}')">${ICONS[n.id]||''}<span>${escapeHtml(n.label)}</span></button>`).join('')}</div></div>`;
};
let V276_NAV_FRAME=0;
function v276RefreshMobileNav(){if(V276_NAV_FRAME)return;V276_NAV_FRAME=requestAnimationFrame(()=>{V276_NAV_FRAME=0;const bar=document.querySelector('.mobile-tabbar');if(bar)bar.innerHTML=renderMobileTabs();});}
window.addEventListener('resize',v276RefreshMobileNav,{passive:true});window.addEventListener('orientationchange',v276RefreshMobileNav,{passive:true});

/* ---------- release audit ------------------------------------------ */
function v276TestCollectionOrderIndex(collectionId,titleId){const c=v274CollectionById(collectionId);return c?c.titleIds.indexOf(String(titleId)):-1;}
function v276TestRating(value,mode){return v274RatingMatch({rating:Number(value)},mode);}
function v276TestNormalizeRating(mode){return v276NormalizeRatingMode(mode);}
function v276AuditState(){
  let base={};try{base=v275AuditState()||{};}catch(_){try{base=v274AuditState()||{};}catch(__){ }}
  const s=v276CollectionSettings();
  return Object.assign({},base,{version:276,pwaRelease:276,personalOrderPickerCovers:true,collectionShowcaseV276:true,collectionOpeningNonBlocking:true,collectionCleanCovers:!!s.cleanCovers,collectionCoverSize:s.collectionCoverSize,collectionTitleTextSize:s.collectionTitleTextSize,exactRatingBuckets:true,collectionOrderNumericPosition:true,searchFocusPreserved:true,responsiveMobileNav:true});
}

Object.assign(App,{
  v276PreviewCollectionSize,v276SetCollectionSize,v276ToggleCollectionCleanCovers,
  v276CollectionSearchInput,v276CollectionDetailSearch,v276AddSearchInput,
  v276SetCollectionOrderPosition,v276RefreshMobileNav,v276TestCollectionOrderIndex,v276TestRating,v276TestNormalizeRating,v276AuditState,
  v274OpenCollection,v274SelectCollectionVisible,v274SelectCollectionAll,
  v274OpenAddTitles,v274RefreshAddModal,v274AddFilter,v274CloseOverlay,
  v274OrderDrop,v274MoveTitle
});
window.MediaFlowV276={version:276,focus:'Collections showcase/performance/tools, Personal Order covers, exact ratings and adaptive mobile navigation'};
MediaFlowRuntime.version=V276_RUNTIME_VERSION;
v276ApplyCollectionVisualVars();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{v276ApplyCollectionVisualVars();v276RefreshMobileNav();},{once:true});else{v276ApplyCollectionVisualVars();v276RefreshMobileNav();}
