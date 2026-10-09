/* ============================================================
   MediaFlow v224 — Dashboard Logging Library Browser Sorting
   ------------------------------------------------------------
   Logging from the Dashboard now exposes its Library browser and
   sort controls immediately, even before a search is typed.
   One sort field + ASC/DESC is used. Alphabetic / ASC is default.
   ============================================================ */
const V224_LOG_SORT_OPTIONS=[
  ['title','Alphabetic'],
  ['priority','Priority'],
  ['rating','Rating'],
  ['progress','Progress'],
  ['total','Total']
];

function v224NormalizeLogSort(){
  const allowed=new Set(V224_LOG_SORT_OPTIONS.map(x=>x[0]));
  let base=String(V89_LOG.sortBase||'').toLowerCase();
  let dir=v224SortDirection(V89_LOG.sortDir);
  if(!allowed.has(base)){
    const parts=v224LegacySortParts(V89_LOG.sort,V224_DEFAULT_SORT_BASE,V224_DEFAULT_SORT_DIR);
    base=allowed.has(parts.base)?parts.base:V224_DEFAULT_SORT_BASE;
    dir=parts.dir;
    if(!V89_LOG.sort||V89_LOG.sort==='relevance'){base=V224_DEFAULT_SORT_BASE;dir=V224_DEFAULT_SORT_DIR;}
  }
  V89_LOG.sortBase=base;
  V89_LOG.sortDir=dir;
  V89_LOG.sort=v224SortKey(base,dir);
  return V89_LOG;
}

logTitleCandidates=function(query){
  const st=v224NormalizeLogSort();
  const q=String(query||'').trim().toLowerCase();
  let rows=(S.library||[]).filter(i=>i?.id);
  if(q){
    rows=rows.filter(i=>{
      const cat=getCategory(i.categoryId);
      return [
        cleanTitle(i.title),cat?.name||'',i.status||'',i.priority||'',i.source||'',i.year||'',
        ...(Array.isArray(i.tags)?i.tags:[])
      ].join(' ').toLowerCase().includes(q);
    });
  }
  if(st.categories.length)rows=rows.filter(i=>st.categories.includes(String(i.categoryId||'')));
  if(st.status!=='all')rows=rows.filter(i=>String(i.status||'planned').toLowerCase()===st.status);
  if(st.priority!=='all')rows=rows.filter(i=>String(i.priority||'medium').toLowerCase()===st.priority);
  rows=rows.slice().sort((a,b)=>v224CompareLibraryLike(a,b,st.sortBase,st.sortDir));
  return rows;
};

function v224LogToolsHtml(candidates,pages){
  const st=v224NormalizeLogSort();
  const cats=(S.categories||[]).filter(c=>c?.id);
  const catLabel=st.categories.length?`${st.categories.length} categories selected`:'All categories';
  return `<div class="v87-log-tools v89-log-tools v224-log-tools" data-v89-log-tools="1">
    <details class="v66-cat-filter"><summary class="btn">${escapeHtml(catLabel)} ▾</summary><div class="v66-cat-panel"><div class="v66-cat-head"><b>Show categories</b><button type="button" class="btn btn-sm btn-ghost" onclick="App.v224LogClearCategories(event)">All</button></div>${cats.map(c=>`<label class="v66-cat-option"><input type="checkbox" ${st.categories.includes(String(c.id))?'checked':''} onchange="App.v224LogToggleCategory('${escapeHtml(String(c.id))}',this.checked)"><span>${v144CategoryIconHtml(c)} ${escapeHtml(c.name)}</span></label>`).join('')}</div></details>
    <div class="v224-sort-pair">
      <select aria-label="Dashboard logging sort field" onchange="App.v224LogSetSort(this.value)">${v224SortOptionsHtml(st.sortBase,V224_LOG_SORT_OPTIONS)}</select>
      ${v224SortDirectionButton(st.sortDir,'App.v224LogToggleSortDirection()',false,'Dashboard logging sort direction')}
    </div>
    <select aria-label="Logging title status" onchange="App.v224LogSetFilter('status',this.value)"><option value="all" ${st.status==='all'?'selected':''}>All statuses</option>${['planned','active','paused','completed','dropped'].map(x=>`<option value="${x}" ${st.status===x?'selected':''}>${v199StatusLabel(x)}</option>`).join('')}</select>
    <select aria-label="Logging title priority" onchange="App.v224LogSetFilter('priority',this.value)"><option value="all" ${st.priority==='all'?'selected':''}>All priorities</option>${['high','medium','low'].map(x=>`<option value="${x}" ${st.priority===x?'selected':''}>${x[0].toUpperCase()+x.slice(1)}</option>`).join('')}</select>
    ${v175PageSizeControlHtml('loggingLibrary','Per page')}
    <button type="button" class="btn btn-sm btn-ghost v87-log-clear" onclick="App.v224LogClearFilters()">Clear filters</button>
    <span class="v87-log-count">${candidates.length.toLocaleString()} match${candidates.length===1?'':'es'} · Page ${V89_LOG.page+1}/${pages}</span>
  </div>`;
}

function v224LogSuggestionsHtml(){
  v224NormalizeLogSort();
  V89_LOG.pageSize=v175PageSize('loggingLibrary');
  const q=String(S.entryDraft?.title||'').trim();
  const candidates=logTitleCandidates(q);
  const pages=Math.max(1,Math.ceil(candidates.length/V89_LOG.pageSize));
  V89_LOG.page=Math.max(0,Math.min(V89_LOG.page,pages-1));
  const rows=candidates.slice(V89_LOG.page*V89_LOG.pageSize,(V89_LOG.page+1)*V89_LOG.pageSize);
  const tools=v224LogToolsHtml(candidates,pages);
  if(!rows.length){
    return tools+'<div class="v86-log-empty">No Library titles match the current search and filters.</div>';
  }
  const list=`<div class="log-suggestion-list">${rows.map(i=>{
    const c=getCategory(i.categoryId);
    const progress=i.total!=null?`${i.progress||0}/${i.total}`:'progress unknown';
    const repeat=(i.status==='completed'||(Number(i.total)>0&&Number(i.progress)>=Number(i.total)))?' · ↻ Rewatch/Reread':'';
    const cover=i.coverUrl?`<img class="v86-log-cover" src="${escapeHtml(i.coverUrl)}" alt="" loading="lazy" onerror="this.style.display='none'">`:'';
    return `<div class="log-suggestion"><div class="v86-log-result">${cover}<div><b>${escapeHtml(cleanTitle(i.title))}</b><small>${v144CategoryIconHtml(c)} ${escapeHtml(c?.name||'Library')} · ${escapeHtml(v199StatusLabel(i.status))} · ${escapeHtml(i.priority||'medium')} priority · ${escapeHtml(progress)}${repeat}</small></div></div><button class="btn btn-sm btn-ghost" type="button" onclick="App.selectLogTitle('${escapeHtml(String(i.id))}')">Use</button></div>`;
  }).join('')}</div>`;
  const count=Math.min(5,pages);
  let from=Math.max(0,V89_LOG.page-2);
  if(from+count>pages)from=Math.max(0,pages-count);
  const nums=[];
  for(let n=from;n<Math.min(pages,from+count);n++)nums.push(`<button type="button" class="btn btn-sm ${n===V89_LOG.page?'active':''}" onclick="App.v224LogPage(${n})">${n+1}</button>`);
  const pager=pages>1?`<div class="v86-log-pager"><button type="button" class="btn btn-sm" ${V89_LOG.page===0?'disabled':''} onclick="App.v224LogPage(${V89_LOG.page-1})">← Prev</button>${nums.join('')}<button type="button" class="btn btn-sm" ${V89_LOG.page===pages-1?'disabled':''} onclick="App.v224LogPage(${V89_LOG.page+1})">Next →</button></div>`:'';
  return tools+list+pager;
}

renderLogSuggestions=function(){
  const box=document.getElementById('log-suggestions');
  if(!box)return;
  box.innerHTML=v224LogSuggestionsHtml();
};

function v224LogSetSort(value){
  const st=v224NormalizeLogSort();
  const allowed=new Set(V224_LOG_SORT_OPTIONS.map(x=>x[0]));
  st.sortBase=allowed.has(String(value))?String(value):V224_DEFAULT_SORT_BASE;
  st.sort=v224SortKey(st.sortBase,st.sortDir);
  st.page=0;
  renderLogSuggestions();
}
function v224LogToggleSortDirection(){
  const st=v224NormalizeLogSort();
  st.sortDir=st.sortDir==='asc'?'desc':'asc';
  st.sort=v224SortKey(st.sortBase,st.sortDir);
  st.page=0;
  renderLogSuggestions();
}
function v224LogSetFilter(key,value){
  const st=v224NormalizeLogSort();
  if(!['status','priority'].includes(String(key)))return;
  st[key]=String(value||'all').toLowerCase();
  st.page=0;
  renderLogSuggestions();
}
function v224LogToggleCategory(id,on){
  const st=v224NormalizeLogSort();
  const set=new Set(st.categories||[]);
  if(on)set.add(String(id));else set.delete(String(id));
  st.categories=[...set];st.page=0;renderLogSuggestions();
}
function v224LogClearCategories(event){
  if(event){event.preventDefault();event.stopPropagation();}
  const st=v224NormalizeLogSort();st.categories=[];st.page=0;renderLogSuggestions();
}
function v224LogClearFilters(){
  const st=v224NormalizeLogSort();
  st.categories=[];st.status='all';st.priority='all';st.sortBase=V224_DEFAULT_SORT_BASE;st.sortDir=V224_DEFAULT_SORT_DIR;st.sort=v224SortKey(st.sortBase,st.sortDir);st.page=0;renderLogSuggestions();
}
function v224LogPage(page){
  V89_LOG.page=Math.max(0,Math.floor(Number(page)||0));
  renderLogSuggestions();
}

const v224RenderLogFormBase=renderLogForm;
renderLogForm=function(){
  let h=v224RenderLogFormBase.apply(this,arguments);
  return h.replace('<div id="log-suggestions" class="log-suggestions"></div>',`<div id="log-suggestions" class="log-suggestions">${v224LogSuggestionsHtml()}</div>`);
};

Object.assign(App,{
  v224LogSetSort,
  v224LogToggleSortDirection,
  v224LogSetFilter,
  v224LogToggleCategory,
  v224LogClearCategories,
  v224LogClearFilters,
  v224LogPage
});

V89_LOG.sortBase=V224_DEFAULT_SORT_BASE;
V89_LOG.sortDir=V224_DEFAULT_SORT_DIR;
V89_LOG.sort=v224SortKey(V224_DEFAULT_SORT_BASE,V224_DEFAULT_SORT_DIR);
