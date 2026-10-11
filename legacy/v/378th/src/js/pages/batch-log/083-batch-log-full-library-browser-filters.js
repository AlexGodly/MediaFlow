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

