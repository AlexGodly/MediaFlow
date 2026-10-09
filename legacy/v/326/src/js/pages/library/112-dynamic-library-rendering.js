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
  const categoryCounts=new Map();
  const allForActive=[];
  for(const item of (S.library||[])){
    if(!item)continue;
    const categoryId=String(item.categoryId||'');
    categoryCounts.set(categoryId,(categoryCounts.get(categoryId)||0)+1);
    if(categoryId===String(activeCat.id))allForActive.push(item);
  }
  const statusCounts=new Map();
  for(const item of allForActive){
    const status=String(item.status||'planned');
    statusCounts.set(status,(statusCounts.get(status)||0)+1);
  }

  const categoryButtons=cats.map(cat=>{
    const count=categoryCounts.get(String(cat.id))||0;

    return `<button type="button"
      class="btn btn-sm ${String(cat.id)===String(cfg.activeCategoryId)?'active':''}"
      onclick="App.v181SelectDynamicCategory('${escapeHtml(String(cat.id))}')">
      ${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}
      <span class="v181-dynamic-count">${count.toLocaleString()}</span>
    </button>`;
  }).join('');

  const statusButtons=cfg.statusOrder.map(status=>{
    const count=statusCounts.get(String(status))||0;

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

