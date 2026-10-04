/* MediaFlow v70 — expanded Library display ordering */
function v69KnownTotal(item){const n=Number(item?.total);return Number.isFinite(n)&&n>0?n:0;}
function v69RepairCompleted(ids){
  const wanted=ids?new Set(ids):null; let changed=0;for(const item of S.library){
    if(wanted&&!wanted.has(item.id))continue;
    const total=v69KnownTotal(item);
    if(item.status==='completed'&&total>0&&Number(item.progress)!==total){
      item.progress=total; item.completedAt=item.completedAt||Date.now(); changed++;
    }
  }
  if(changed)v53InvalidateLibraryCache();
  return changed;
}
async function v69RepairAllCompleted(){
  const changed=v69RepairCompleted();
  if(!changed){showToast('All completed titles with known totals are already correct.');return;}
  await persistLibrary(); render(); showToast(`${changed} completed title${changed===1?'':'s'} repaired ✓`);
}
async function v69RepairSelectedCompleted(){
  const ids=mfSelectedIds();
  if(!ids.length){showToast('Select one or more Library titles first.');return;}
  const changed=v69RepairCompleted(ids);
  if(!changed){showToast('No selected completed titles needed repair.');return;}
  await persistLibrary(); render(); showToast(`${changed} selected title${changed===1?'':'s'} repaired ✓`);
}
function v69ToggleLibraryCategory(id,on){
  S.histFilters=S.histFilters||{};
  const set=new Set(Array.isArray(S.histFilters.libCategories)?S.histFilters.libCategories:[]);
  if(on)set.add(id);else set.delete(id);
  S.histFilters.libCategories=[...set];
  S.histFilters.libCategory='all';
  S.libPage=0;
  v53InvalidateLibraryCache();
  render();
}
function v69ClearLibraryCategories(){
  S.histFilters=S.histFilters||{};
  S.histFilters.libCategories=[]; S.histFilters.libCategory='all'; S.libPage=0;
  v53InvalidateLibraryCache(); render();
}
function v69SetLibrarySort(v){
  S.histFilters=S.histFilters||{};
  const allowed=['priority','priority-desc','priority-asc','title-asc','title-desc','rating-desc','rating-asc','progress-desc','progress-asc','total-desc','total-asc'];
  S.histFilters.libSort=allowed.includes(v)?v:'priority-desc';
  S.libPage=0; v53InvalidateLibraryCache(); render();
}
function renderLibrary(){

  // v69: self-heal Completed titles whenever Library is rendered.
  const v69AutoFixed=v69RepairCompleted();
  if(v69AutoFixed) persistLibrary();

  const cats = S.categories;
  const ov=v53LibraryOverview();

  // v232 performance: precompute the values used by the overview estimator in
  // one Library pass. Older code scanned the entire Library twice per category,
  // which became expensive with tens of thousands of titles and made filter
  // interactions feel frozen.
  const v232OverviewMeta=new Map();
  for(const item of (S.library||[])){
    const id=String(item?.categoryId||'');
    let row=v232OverviewMeta.get(id);
    if(!row){row={knownCount:0,knownTotal:0,unknownCount:0};v232OverviewMeta.set(id,row);}
    const total=Number(item?.total);
    if(Number.isFinite(total)&&total>0){row.knownCount++;row.knownTotal+=total;}
    else row.unknownCount++;
  }

  // v80: Overview-only estimates for titles whose real total is unknown.
  // These values are presentation estimates only; item.total is never changed.
  const v80OverviewEstimate=(cat,x)=>{
    if(!x.items) return {total:0,pct:0,estimated:false};
    if(!x.unknown && x.total>0) return {total:x.total,pct:Math.min(100,Math.round(x.knownDone/x.total*100)),estimated:false};
    const meta=v232OverviewMeta.get(String(cat.id))||{knownCount:0,knownTotal:0,unknownCount:0};
    const knownAvg=meta.knownCount ? meta.knownTotal/meta.knownCount : 0;
    const unknownCount=meta.unknownCount;
    const observed=Math.max(0,Number(x.done)||0);
    const baseline=Math.max(1,Number(cat.target)||1);
    // Prefer the category's own known-title average. If none exists, use a conservative
    // progress-aware estimate so even all-unknown categories still get a useful bar.
    const perUnknown=knownAvg>0 ? knownAvg : Math.max(baseline*4, observed/Math.max(1,x.items)*1.35, 12);
    const estimatedTotal=Math.max(Math.ceil(x.total + unknownCount*perUnknown),Math.ceil(observed*1.12),observed||1);
    return {total:estimatedTotal,pct:Math.min(99,Math.round(observed/estimatedTotal*100)),estimated:true};
  };

  const overviewRows = cats.map(cat=>{
    const x=ov.byCat.get(cat.id)||{items:0,done:0,knownDone:0,total:0,unknown:false};
    const est=v80OverviewEstimate(cat,x);
    const pct=est.pct;
    const progressText=x.items===0?'0 / -':(est.estimated?`${x.done} / ≈${est.total} (~${pct}%)`:`${x.done} / ${est.total} (${pct}%)`);
    const approxTitle=est.estimated?'Approximate overview only — unknown title totals are estimated for this progress bar and are not saved to Library titles.':'';
    return `<div class="overview-row" ${approxTitle?`title="${escapeHtml(approxTitle)}"`:''}>
      <div class="ov-name"><span>${v144CategoryIconHtml(cat)}</span> ${escapeHtml(cat.name)}</div>
      <div class="ov-track"><div class="progress-track"><div class="progress-fill" style="width:${pct}%; background:linear-gradient(90deg, ${cat.color}88, ${cat.color});"></div></div></div>
      <div class="ov-num">${progressText}</div>
    </div>`;
  }).join('');

  const overallPct=ov.overallPct;

  let itemsHtml, pagerHtml='';

  if(S.library.length===0){

    itemsHtml = `<div class="empty-state"><div class="em-icon">📚</div><div class="em-title">Your library is empty</div><div>Add titles to track progress toward clearing your whole collection.</div>

      <div style="margin-top:16px;"><button class="btn btn-primary" onclick="App.openLibraryModal()">Add a title</button></div>

    </div>`;

  } else {

    const catFilter = S.histFilters.libCategory || 'all';

    const statusFilter = S.histFilters.libStatus || 'all';

    const q = (S.histFilters.libSearch||'').trim();
    const priorityFilter = S.histFilters.libPriority || 'all';
    const items = v53FilteredLibrary(catFilter,statusFilter,priorityFilter,q);

    const PAGE = v175PageSize('library');

    const totalItems = items.length;

    const maxPage = Math.max(0, Math.ceil(totalItems/PAGE)-1);

    S.libPage = clamp(S.libPage||0, 0, maxPage);

    const pageItems = items.slice(S.libPage*PAGE, S.libPage*PAGE+PAGE);
    // v82: calculate repeat data once for the visible Library render.
    const v82RepeatMap = v81RepeatTotals().byTitle;

    itemsHtml = pageItems.map(i=>{

      const cat = getCategory(i.categoryId);

      const lastTouchedTs=v53LastTouched(i);
      const ageMs = lastTouchedTs ? Math.max(0,Date.now()-lastTouchedTs) : Math.max(0,Date.now()-(Number(i.createdAt)||Date.now()));
      const ageDays = Math.floor(ageMs/86400000);
      const ageLabel = lastTouchedTs ? (ageDays===0?'Touched today':`${ageDays}d untouched`) : (ageDays===0?'Added today':`Never consumed · ${ageDays}d old`);
      const aging = cat.id==='backlog' ? `<span class="aging-badge status-${ageDays>=30?'neglected':ageDays>=7?'due':'healthy'}" title="Time since this backlog item was last consumed">${escapeHtml(ageLabel)}</span>` : '';
      // v71: bind cover/rating directly to THIS library item.
      // Never inject artwork later by searching/replacing rendered HTML: rows can share
      // category markup, so global replacement can attach one title's cover to another.
      const v71Cover=i.coverUrl?`<img class="library-cover-thumb" data-library-id="${escapeHtml(i.id)}" src="${escapeHtml(i.coverUrl)}" alt="${escapeHtml(cleanTitle(i.title))} cover" loading="lazy" onerror="this.style.display='none'">`:'';
      const v71Rating=Number(i.rating)>0?` <span class="v44-rating">★ ${Number(i.rating).toFixed(1)}</span>`:'';
      const v82r=v82RepeatMap.get(i.id);
      const v82RepeatBadge=v82r&&v82r.amount>0?` <span class="v82-repeat-badge" title="${escapeHtml(v82RepeatSummary(i,v82r))}">↻ ${v82r.completedRepeats>0?v82r.completedRepeats+'×':v82r.amount+' '+unitLabel(v82r.unit,v82r.amount)}</span>`:'';
      return `<div class="item-row" data-library-id="${escapeHtml(i.id)}">
        ${v71Cover}<div class="bal-icon" style="background:${cat.color}22; color:${cat.color};">${v144CategoryIconHtml(cat)}</div>
        <div class="v176-library-copy">

          <div class="item-title">${escapeHtml(cleanTitle(i.title))}${v71Rating}${v82RepeatBadge} ${i.source==='mal'?'<span class="tag">MAL</span>':i.source==='simkl'?'<span class="tag">Imported</span>':''}</div>

          <div class="item-sub"><button type="button" class="pill category-click" style="text-transform:none;border:1px solid var(--border-soft);color:inherit;background:transparent;padding:2px 7px;" onclick="event.preventDefault();event.stopPropagation();App.chooseCategoryForLibrary('${i.id}')">${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</button> ${aging} ${i.total? '· '+i.progress+' / '+i.total+' '+unitLabel(cat.unit,i.total) : (i.progress? '· '+i.progress+' '+unitLabel(cat.unit,i.progress):'')} ${(i.tags&&i.tags.length)? '· '+i.tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join(''):''}</div>

          ${v176LibraryInfoHtml(i)}

        </div>

        <button type="button" class="pill status-click" style="text-transform:none;border:1px solid transparent;color:inherit;" onclick="event.preventDefault();event.stopPropagation();App.chooseStatusForLibrary('${i.id}')">${escapeHtml(v199StatusLabel(i.status))}</button>

        <button type="button" class="pill priority-click" style="text-transform:capitalize;border:0;color:inherit;" onclick="event.preventDefault();event.stopPropagation();App.choosePriority('${i.id}')">${i.priority} priority</button>

        <button type="button" class="btn btn-sm btn-ghost" onclick="event.preventDefault(); event.stopPropagation(); App.openLibraryModal('${i.id}')">Edit</button>

        <button type="button" class="btn btn-sm btn-danger" onclick="event.preventDefault(); event.stopPropagation(); App.deleteLibraryItem('${i.id}')">Delete</button>

      </div>`;

    }).join('') || `<div class="empty-state">No items match this filter.</div>`;

    if(totalItems>PAGE){
      const pageCount=maxPage+1;
      const pageButtons=[];
      let startPage=Math.max(0,S.libPage-2);
      if(startPage+4>maxPage) startPage=Math.max(0,maxPage-4);
      const endPage=Math.min(maxPage,startPage+4);
      for(let p=startPage;p<=endPage;p++){
        pageButtons.push(`<button class="btn btn-sm page-num ${p===S.libPage?'page-current':''}" onclick="App.setLibPage(${p})">${p+1}</button>`);
      }
      pagerHtml = `<div class="lib-pagination">
        <button class="btn btn-sm" ${S.libPage<=0?'disabled':''} onclick="App.setLibPage(${S.libPage-1})">← Prev</button>
        ${pageButtons.join('')}
        <button class="btn btn-sm" ${S.libPage>=maxPage?'disabled':''} onclick="App.setLibPage(${S.libPage+1})">Next →</button>
        <small class="hint" style="margin:0 0 0 4px;">Page ${S.libPage+1} of ${pageCount} · ${totalItems} titles</small>
      </div>`;
    }

  }

   return ` 

    <div class="view-head">

      <div><div class="view-title">Library</div><div class="view-desc">Track your titles. The scheduler still only picks the category — this is just for your own progress.</div></div>

      <button class="btn btn-primary" onclick="App.openLibraryModal()">+ Add title</button>
      <button class="btn btn-danger" onclick="App.emptyLibraryAdvanced()">Empty library</button>

    </div>

    <div class="card" style="margin-bottom:18px;padding:12px 14px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <b style="margin-right:4px;">Library tools</b>
      <button class="btn btn-sm" ${mfSelectedIds().length?'':'disabled'} onclick="App.v69RepairSelectedCompleted()">✓ Fix completed progress for selected</button>
      <span class="hint">Select titles below, then repair Completed titles with known totals.</span>
    </div>

    ${v183LibraryOverviewToggleHtml()}

    ${v183LibraryOverviewEnabled()?`<div class="v183-library-overview-block">
      <div class="section-label">OVERVIEW · ${overallPct}% of known tracked totals cleared <span style="font-weight:500;text-transform:none;letter-spacing:0;opacity:.72;">· ≈ means display-only estimate</span></div>
      <div class="card" style="margin-bottom:26px;">${overviewRows}</div>
    </div>`:''}

    <div class="lib-toolbar">

      <div class="section-label" style="margin:0;">TITLES (${S.library.length})</div>

      <div class="lib-filters">

        <input type="text" placeholder="Search titles…" value="${escapeHtml(S.histFilters.libSearch||'')}" class="lib-search" oninput="App.searchLibrary(this.value)">

        <details class="v66-cat-filter"><summary class="btn">${Array.isArray(S.histFilters.libCategories)&&S.histFilters.libCategories.length?`${S.histFilters.libCategories.length} categories selected`:'All categories'} ▾</summary><div class="v66-cat-panel"><div class="v66-cat-head"><b>Show categories</b><button type="button" class="btn btn-sm btn-ghost" onclick="event.preventDefault();App.v69ClearLibraryCategories()">All</button></div>${cats.map(c=>`<label class="v66-cat-option"><input type="checkbox" ${Array.isArray(S.histFilters.libCategories)&&S.histFilters.libCategories.includes(c.id)?'checked':''} onchange="App.v69ToggleLibraryCategory('${c.id}',this.checked)"><span>${v144CategoryIconHtml(c)} ${escapeHtml(c.name)}</span></label>`).join('')}</div></details><select onchange="App.v69SetLibrarySort(this.value)" aria-label="Library display order">
<option value="priority-desc" ${['priority','priority-desc'].includes(S.histFilters.libSort||'priority')?'selected':''}>Priority: High → Low</option>
<option value="priority-asc" ${S.histFilters.libSort==='priority-asc'?'selected':''}>Priority: Low → High</option>
<option value="title-asc" ${S.histFilters.libSort==='title-asc'?'selected':''}>Title: A → Z</option>
<option value="title-desc" ${S.histFilters.libSort==='title-desc'?'selected':''}>Title: Z → A</option>
<option value="rating-desc" ${S.histFilters.libSort==='rating-desc'?'selected':''}>Rating: High → Low</option>
<option value="rating-asc" ${S.histFilters.libSort==='rating-asc'?'selected':''}>Rating: Low → High</option>
<option value="progress-desc" ${S.histFilters.libSort==='progress-desc'?'selected':''}>Progress watched/read: Most → Least</option>
<option value="progress-asc" ${S.histFilters.libSort==='progress-asc'?'selected':''}>Progress watched/read: Least → Most</option>
<option value="total-desc" ${S.histFilters.libSort==='total-desc'?'selected':''}>Total episodes/chapters: Most → Least</option>
<option value="total-asc" ${S.histFilters.libSort==='total-asc'?'selected':''}>Total episodes/chapters: Least → Most</option>
</select>

        <select onchange="App.setLibFilter('libStatus', this.value)">

          <option value="all">All statuses</option>

          ${['planned','active','paused','completed','dropped'].map(s=>`<option value="${s}" ${S.histFilters.libStatus===s?'selected':''}>${v199StatusLabel(s)}</option>`).join('')}

        </select>

        <select onchange="App.setLibFilter('libPriority', this.value)">

          <option value="all">All priorities</option>

          ${['high','medium','low'].map(s=>`<option value="${s}" ${S.histFilters.libPriority===s?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}

        </select>

      </div>

    </div>

    ${pagerHtml}
    <div class="card">${itemsHtml}</div>
    ${pagerHtml}

  `;

}

