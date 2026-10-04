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

  // v80: Overview-only estimates for titles whose real total is unknown.
  // These values are presentation estimates only; item.total is never changed.
  const v80OverviewEstimate=(cat,x)=>{
    if(!x.items) return {total:0,pct:0,estimated:false};
    if(!x.unknown && x.total>0) return {total:x.total,pct:Math.min(100,Math.round(x.knownDone/x.total*100)),estimated:false};
    const knownItems=S.library.filter(i=>i.categoryId===cat.id && Number(i.total)>0);
    const knownAvg=knownItems.length ? knownItems.reduce((sum,i)=>sum+Number(i.total),0)/knownItems.length : 0;
    const unknownCount=S.library.filter(i=>i.categoryId===cat.id && !(Number(i.total)>0)).length;
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

/* ============================================================
   VIEW: BATCH LOG — v61
   ============================================================ */
function ensureBatchDraft(){
  if(!S.batchDraft||!Array.isArray(S.batchDraft.rows)) S.batchDraft={rows:[],note:'',date:todayISO()};
  if(!S.batchDraft.date) S.batchDraft.date=todayISO();
}
function addBatchRow(){
  ensureBatchDraft();
  S.batchDraft.rows.push({libraryId:'',query:'',qty:1,minutes:0}); render();
}
function removeBatchRow(i){ ensureBatchDraft(); S.batchDraft.rows.splice(i,1); render(); }
function batchTitleCandidates(query){
  const q=String(query||'').trim().toLocaleLowerCase();
  if(!q) return [];
  return S.library.filter(item=>{
    if(!item || item.status==='dropped') return false;
    return cleanTitle(item.title).toLocaleLowerCase().includes(q);
  }).slice(0,10);
}
function updateBatchSearch(i,value){
  ensureBatchDraft(); const r=S.batchDraft.rows[i]; if(!r)return;
  r.query=String(value||'');
  if(r.libraryId){
    const selected=S.library.find(x=>x.id===r.libraryId);
    if(!selected || cleanTitle(selected.title)!==r.query) r.libraryId='';
  }
  renderBatchSuggestions(i);
}
function renderBatchSuggestions(i){
  const box=document.getElementById(`batch-suggestions-${i}`); if(!box)return;
  ensureBatchDraft(); const r=S.batchDraft.rows[i]; if(!r)return;
  const candidates=batchTitleCandidates(r.query);
  if(!String(r.query||'').trim() || r.libraryId){ box.innerHTML=''; return; }
  if(!candidates.length){ box.innerHTML='<div class="batch-search-empty">No matching Library titles.</div>'; return; }
  box.innerHTML=`<div class="log-suggestion-list">${candidates.map(item=>{
    const cat=getCategory(item.categoryId), progress=item.total!=null?`${item.progress||0}/${item.total}`:'progress unknown';
    return `<div class="log-suggestion"><div class="v50-log-title">${typeof v50Cover==='function'?v50Cover(item):''}<div><b>${escapeHtml(cleanTitle(item.title))}</b><small>${v144CategoryIconHtml(cat)} ${escapeHtml(cat?.name||'Library')} · ${progress}</small></div></div><button class="btn btn-sm btn-ghost" type="button" onclick="App.selectBatchTitle(${i},'${item.id}')">Use</button></div>`;
  }).join('')}</div>`;
}
function selectBatchTitle(i,id){
  ensureBatchDraft(); const r=S.batchDraft.rows[i], item=S.library.find(x=>x.id===id); if(!r||!item)return;
  const cat=getCategory(item.categoryId);
  r.libraryId=item.id; r.query=cleanTitle(item.title); r.qty=Math.max(1,Number(r.qty)||1);
  if(cat) r.minutes=Math.round(r.qty*(Number(cat.minutesPerUnit)||0));
  render();
  setTimeout(()=>document.getElementById(`batch-qty-${i}`)?.focus({preventScroll:true}),0);
}
function updateBatchRow(i,key,value){
  ensureBatchDraft(); const r=S.batchDraft.rows[i]; if(!r)return;
  if(key==='qty'){
    r.qty=Math.max(0,Number(value)||0); const item=S.library.find(x=>x.id===r.libraryId); const cat=item&&getCategory(item.categoryId);
    if(item&&cat) r.minutes=Math.round(r.qty*(Number(cat.minutesPerUnit)||0));
  }else if(key==='minutes') r.minutes=Math.max(0,Number(value)||0);
  // Do not full-render while editing numeric fields: keeps mobile keyboard/focus stable.
  const total=document.getElementById('batch-total-summary');
  if(total){ const mins=S.batchDraft.rows.reduce((n,x)=>n+(Number(x.minutes)||0),0); total.textContent=`${S.batchDraft.rows.length} rows · ${fmtMinutes(mins)}`; }
}
function clearBatchLog(){ S.batchDraft={rows:[],note:'',date:todayISO()}; render(); }
function submitBatchLog(){
  ensureBatchDraft();
  const valid=S.batchDraft.rows.filter(r=>r.libraryId&&Number(r.qty)>0);
  if(!valid.length){ showToast('Add at least one Library title with an amount.'); return; }
  const date=/^\d{4}-\d{2}-\d{2}$/.test(S.batchDraft.date||'')?S.batchDraft.date:todayISO();
  const timestamp=(date===todayISO())?Date.now():(new Date(date+'T12:00:00')).getTime();
  const groupId=uid(), note=String(S.batchDraft.note||'').trim();
  valid.forEach(r=>{
    const item=S.library.find(x=>x.id===r.libraryId); if(!item)return;
    const cat=getCategory(item.categoryId), qty=Math.max(0,Number(r.qty)||0), minutes=Math.max(0,Number(r.minutes)||0);
    const healthStatus=categoryStatus(cat).status, xpCalc=calculateConsumptionXP(cat,qty,minutes,healthStatus);
    S.sessions.push({id:uid(),timestamp,date,categoryId:cat.id,targetAmount:qty,actualAmount:qty,minutes,
      note,status:'logged',unit:cat.unit,xp:xpCalc.xp,healthStatus,source:'batch',batchGroupId:groupId,
      titles:[{title:cleanTitle(item.title),libraryId:item.id,qty,repeat:(item.status==='completed'||(Number(item.total)>0&&Number(item.progress)>=Number(item.total)))}]});
    const v81Repeat=item.status==='completed'||(Number(item.total)>0&&Number(item.progress)>=Number(item.total));
    if(v81Repeat){ return; }
    item.progress=(Number(item.progress)||0)+qty;
    if(item.total) item.progress=Math.min(item.progress,Number(item.total)||0);
    if(item.total&&item.progress>=item.total&&item.status!=='dropped'){
      item.status='completed'; item.completedAt=item.completedAt||timestamp; S.completionTimeline=S.completionTimeline||[];
      if(!S.completionTimeline.some(x=>x.libraryId===item.id)) S.completionTimeline.push({libraryId:item.id,title:cleanTitle(item.title),categoryId:item.categoryId,completedAt:item.completedAt});
    }else if(item.status==='planned') item.status='active';
  });
  normalizeSeasonalLibraryItems(); persistLibrary(); persistSessions();
  S.batchDraft={rows:[],note:'',date:todayISO()};
  // Actual batch consumption is already in S.sessions, so all scheduler balance/health calculations see it.
  persistTask(); showToast(`Batch logged ${valid.length} ${valid.length===1?'title':'titles'} ✓`); S.view='history'; render();
}
function renderBatchLog(){
  ensureBatchDraft();
  const rows=S.batchDraft.rows.map((r,i)=>{
    const item=S.library.find(x=>x.id===r.libraryId), cat=item&&getCategory(item.categoryId);
    const query=r.query!=null?r.query:(item?cleanTitle(item.title):'');
    return `<div class="card batch-log-row">
      <div class="batch-title-field field">
        <label class="field-label">Title</label>
        <div class="batch-search-wrap">
          <input id="batch-title-${i}" type="text" autocomplete="off" value="${escapeHtml(query)}" placeholder="Type to search your entire Library…" oninput="App.updateBatchSearch(${i},this.value)" onfocus="App.renderBatchSuggestions(${i})">
          <div id="batch-suggestions-${i}" class="batch-suggestions"></div>
        </div>
        ${item&&cat?`<div class="batch-selected-title">${v144CategoryIconHtml(cat)} <b>${escapeHtml(cleanTitle(item.title))}</b><span>${escapeHtml(cat.name)}${item.total!=null?` · ${Number(item.progress)||0}/${item.total}`:''}</span></div>`:`<small class="hint">Search across every category, then select the title you consumed.</small>`}
      </div>
      <div class="batch-number-fields">
        <div class="field"><label class="field-label">Amount ${cat?`(${escapeHtml(unitLabel(cat.unit,2))})`:''}</label><input id="batch-qty-${i}" type="number" min="0" inputmode="decimal" value="${r.qty}" oninput="App.updateBatchRow(${i},'qty',this.value)"></div>
        <div class="field"><label class="field-label">Minutes</label><input type="number" min="0" inputmode="numeric" value="${r.minutes}" oninput="App.updateBatchRow(${i},'minutes',this.value)"></div>
      </div>
      <button class="btn btn-danger batch-remove" onclick="App.removeBatchRow(${i})">Remove</button>
      ${cat?`<small class="hint batch-counts-note">${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)} · Updates Library progress and counts toward scheduler balance, health, Statistics and XP.</small>`:''}
    </div>`;
  }).join('');
  const totalMinutes=S.batchDraft.rows.reduce((n,r)=>n+(Number(r.minutes)||0),0);
  return `<div class="view-head"><div><div class="view-title">Batch Log</div><div class="view-desc">Search your entire Library and record multiple titles at once. Every title has its own amount and time and updates its Library progress.</div></div></div>
    <div class="card batch-log-meta"><div class="field-row"><div class="field"><label class="field-label">Consumption date</label><input type="date" value="${escapeHtml(S.batchDraft.date||todayISO())}" onchange="S.batchDraft.date=this.value"></div><div class="field"><label class="field-label">Batch note (optional)</label><input type="text" value="${escapeHtml(S.batchDraft.note||'')}" placeholder="What did you consume?" onchange="S.batchDraft.note=this.value"></div></div>
    <div class="health-note">Batch entries use <b>Logged</b>. Their actual categories, amounts and minutes still fully count throughout MediaFlow.</div></div>
    <div class="batch-log-list">${rows||`<div class="empty-state card"><div class="em-icon">🧾</div><div class="em-title">No batch rows yet</div><div>Add a title, search your Library, and select what you consumed.</div></div>`}</div>
    <div class="batch-log-actions"><button class="btn" onclick="App.addBatchRow()">+ Add title</button><button class="btn btn-primary" ${S.batchDraft.rows.length?'':'disabled'} onclick="App.submitBatchLog()">Log batch</button>${S.batchDraft.rows.length?`<button class="btn btn-ghost" onclick="App.clearBatchLog()">Clear</button>`:''}<span id="batch-total-summary" class="hint">${S.batchDraft.rows.length} rows · ${fmtMinutes(totalMinutes)}</span></div>`;
}

/* ============================================================

   VIEW: HISTORY

   ============================================================ */

function renderHistory(){

  const f = S.histFilters;

  // History can grow very large over time. Keep the DOM small by rendering
  // only one page at a time instead of creating a row for every session.
  let list = S.sessions.slice().sort((a,b)=>b.timestamp-a.timestamp);

  if(f.category && f.category!=='all') list = list.filter(s=>s.categoryId===f.category);

  if(f.type && f.type!=='all') list = list.filter(s=>getCategory(s.categoryId).type===f.type);

  if(f.range==='today') list = list.filter(s=>s.date===todayISO());

  else if(f.range==='week') list = list.filter(s=>s.timestamp>=hoursAgo(24*7));

  else if(f.range==='month') list = list.filter(s=>s.timestamp>=hoursAgo(24*30));

  const pageSize = Math.max(25, Number(S.histPageSize)||50);
  const pageCount = Math.max(1, Math.ceil(list.length/pageSize));
  S.histPage = clamp(Number(S.histPage)||0, 0, pageCount-1);
  const startIndex = S.histPage * pageSize;
  const pageItems = list.slice(startIndex, startIndex + pageSize);

  const rows = pageItems.map(s=>{

    const cat = getCategory(s.categoryId);

    const d = new Date(s.timestamp);

    const labelMap = {complete:'Complete', partial:'Partial', over:'Over', skipped:'Skipped', logged:'Logged'};

    return `<div class="hist-row">

      <div class="hist-date">${fmtDate(s.date)}<br><span style="opacity:.6;">${d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}</span></div>

      <div class="hist-icon" style="background:${cat.color}22; color:${cat.color};">${v144CategoryIconHtml(cat)}</div>

      <div class="hist-main">

        <div class="hist-cat">${escapeHtml(cat.name)}</div>

        <div class="hist-amt">${s.actualAmount} ${unitLabel(s.unit,s.actualAmount)} · ${fmtMinutes(s.minutes)}${s.status==='logged'?'':` · target ${s.targetAmount}`}</div>${s.source==='batch'?`<div class="hist-note" style="margin-top:4px">Batch Log</div>`:''}${s.assignedCategoryId&&s.assignedCategoryId!==s.categoryId?`<div class="hist-note" style="margin-top:4px">Recommended: ${escapeHtml(getCategory(s.assignedCategoryId)?.name||'Unknown')}</div>`:''}
        ${s.status!=='skipped'?`<div class="hist-xp" style="margin-top:4px;font-size:11px;color:var(--flow);font-weight:800;">+${Math.round(sessionStoredXP(s)).toLocaleString()} XP · ${escapeHtml(xpRotationLabel(s.healthStatus||'healthy'))} · 🔥 ${escapeHtml(v149SessionStreakLabel(s))}</div>`:''}

        ${s.note? `<div class="hist-note">"${escapeHtml(s.note)}"</div>`:''}

      </div>

      <div class="hist-status" style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">

        <span class="status-badge status-${s.status==='skipped'?'overused':s.status==='partial'?'due':s.status==='over'?'neglected':'healthy'}">${labelMap[s.status]||'Logged'}</span>

        <div style="display:flex; gap:4px;">

          <button class="btn btn-sm btn-ghost" onclick="App.openSessionModal('${s.id}')">Edit</button>

          <button class="btn btn-sm btn-danger" onclick="App.deleteSession('${s.id}')">Delete</button>

        </div>

      </div>

    </div>`;

  }).join('') || `<div class="empty-state"><div class="em-icon">🕓</div><div class="em-title">No sessions yet</div><div>Complete a task from the dashboard to see it here.</div></div>`;

  const pagerHtml = list.length > pageSize ? `<div class="lib-pagination">
    <button class="btn btn-sm" ${S.histPage<=0?'disabled':''} onclick="App.setHistPage(${S.histPage-1})">← Previous</button>
    <span>Page ${S.histPage+1} of ${pageCount} · ${list.length.toLocaleString()} entries</span>
    <button class="btn btn-sm" ${S.histPage>=pageCount-1?'disabled':''} onclick="App.setHistPage(${S.histPage+1})">Next →</button>
  </div>` : (list.length ? `<div class="health-note">${list.length.toLocaleString()} history ${list.length===1?'entry':'entries'}. Large histories are paginated to keep this view responsive.</div>` : '');

   return `

    <div class="view-head">

      <div><div class="view-title">History</div><div class="view-desc">Every logged task — edit or delete anything, the scheduler recalculates from what's actually here.</div></div>

      ${S.sessions.length? `<button class="btn btn-sm" onclick="App.undoLastEntry()">↺ Undo last entry</button>` : ''}

    </div>

    <div class="lib-toolbar">

      <div class="lib-filters">

        <select onchange="App.setHistFilter('category', this.value)">

          <option value="all">All categories</option>

          ${S.categories.map(c=>`<option value="${c.id}" ${f.category===c.id?'selected':''}>${v144CategoryIconText(c)} ${escapeHtml(c.name)}</option>`).join('')}

        </select>

        <select onchange="App.setHistFilter('type', this.value)">

          <option value="all">All media types</option>

          <option value="video" ${f.type==='video'?'selected':''}>Video</option>

          <option value="reading" ${f.type==='reading'?'selected':''}>Reading</option>

        </select>

        <select onchange="App.setHistFilter('range', this.value)">

          <option value="all" ${f.range==='all'?'selected':''}>All time</option>

          <option value="today" ${f.range==='today'?'selected':''}>Today</option>

          <option value="week" ${f.range==='week'?'selected':''}>This week</option>

          <option value="month" ${f.range==='month'?'selected':''}>This month</option>

        </select>

      </div>

      <button class="btn btn-sm" onclick="App.exportCSV()">Export CSV</button>

    </div>

    ${pagerHtml}
    <div class="card">${rows}</div>
    ${pagerHtml}

  `;

}

/* ============================================================

   VIEW: STATS

   ============================================================ */

function renderStats(){

  const today = totalsForSessions(todaysSessions());

  const week = totalsForSessions(sessionsInRange(7));

  const month = totalsForSessions(sessionsInRange(30));

  const lifetime = totalsForSessions(S.sessions);

  const cats = S.categories.filter(c=>c.enabled);

  const weekMinutesByCat = cats.map(c=>({c, m: sessionsInRange(7).filter(s=>s.categoryId===c.id && s.status!=='skipped').reduce((a,s)=>a+s.minutes,0)}));

  const maxW = Math.max(1, ...weekMinutesByCat.map(x=>x.m));

   const balanceHtml = weekMinutesByCat.map(({c,m})=>` 

    <div class="bal-bar-row">

      <div class="bal-bar-label">${v144CategoryIconHtml(c)} ${escapeHtml(c.name)}</div>

      <div class="bal-bar-track"><div class="bal-bar-fill" style="width:${Math.round(m/maxW*100)}%; background:${c.color};"></div></div>

      <div class="bal-bar-val">${fmtMinutes(m)}</div>

    </div>`).join('');

  const satHtml = cats.map(c=>{

    const lvl = saturationLevel(c);

    return `<div class="sat-row">

      <div class="sat-cat">${v144CategoryIconHtml(c)} ${escapeHtml(c.name)}</div>

      <div class="sat-lvl" style="color:${lvl.c}; background:${lvl.c}20;">${lvl.label}</div>

    </div>`;

  }).join('');

  // records

  const lifetimeByCat = cats.map(c=>({c, m: S.sessions.filter(s=>s.categoryId===c.id && s.status!=='skipped').reduce((a,s)=>a+s.minutes,0)}));

  lifetimeByCat.sort((a,b)=>b.m-a.m);

  const most = lifetimeByCat[0];

  const least = lifetimeByCat[lifetimeByCat.length-1];

  const neglect = cats.map(c=>{

    const last = lastSessionFor(c.id);

    return {c, d: daysSince(last?last.timestamp:null)};

  }).sort((a,b)=>b.d-a.d)[0];

  // current streak

  const chron = [...S.sessions].filter(s=>s.status!=='skipped').sort((a,b)=>b.timestamp-a.timestamp);

  let curStreakCat=null, curStreakLen=0;

  if(chron.length){ curStreakCat=chron[0].categoryId; for(const s of chron){ if(s.categoryId===curStreakCat) curStreakLen++; else break; } }

  // longest streak ever

  const chronAsc = [...S.sessions].filter(s=>s.status!=='skipped').sort((a,b)=>a.timestamp-b.timestamp);

  let longest={cat:null,len:0}, run={cat:null,len:0};

  for(const s of chronAsc){

    if(s.categoryId===run.cat) run.len++;

    else run={cat:s.categoryId, len:1};

    if(run.len>longest.len) longest={cat:run.cat, len:run.len};

  }

  const distinctDays = new Set(S.sessions.filter(s=>s.status!=='skipped').map(s=>s.date)).size || 1;

  const avgDailyMinutes = Math.round(lifetime.minutes/distinctDays);

  const nonSkipped = S.sessions.filter(s=>s.status!=='skipped').length;

  const completedOrOver = S.sessions.filter(s=>s.status==='complete'||s.status==='over').length;

  const avgCompletion = nonSkipped>0 ? Math.round(completedOrOver/nonSkipped*100) : 0;

   return ` 

    <div class="view-head"><div><div class="view-title">Statistics</div><div class="view-desc">Your consumption, measured.</div></div></div>

    <div class="grid-3" style="margin-bottom:24px;">

      ${statCard('Today', today)}

      ${statCard('This week', week)}

      ${statCard('This month', month)}

    </div>

    <div class="two-col" style="margin-bottom:24px;">

      <div class="card">

        <div class="section-label">CATEGORY BALANCE — LAST 7 DAYS</div>

        ${balanceHtml || '<div class="empty-state">No data yet.</div>'}

      </div>

      <div class="card">

        <div class="section-label">RECENT SATURATION</div>

        <div class="sat-grid">${satHtml || '<div class="empty-state">No categories enabled.</div>'}</div>

      </div>

    </div>

    <div class="card">

      <div class="section-label">RECORDS</div>

      <div class="record-list">

        <div class="record-row"><span class="k">Most consumed category</span><span class="v">${most? v144CategoryIconHtml(most.c)+' '+escapeHtml(most.c.name)+' — '+fmtMinutes(most.m) : '—'}</span></div>

        <div class="record-row"><span class="k">Least consumed category</span><span class="v">${least? v144CategoryIconHtml(least.c)+' '+escapeHtml(least.c.name)+' — '+fmtMinutes(least.m) : '—'}</span></div>

        <div class="record-row"><span class="k">Current category streak</span><span class="v">${curStreakCat? getCategory(curStreakCat).icon+' '+getCategory(curStreakCat).name+' × '+curStreakLen : '—'}</span></div>

        <div class="record-row"><span class="k">Longest streak ever</span><span class="v">${longest.cat? getCategory(longest.cat).icon+' '+getCategory(longest.cat).name+' × '+longest.len : '—'}</span></div>

        <div class="record-row"><span class="k">Most neglected category</span><span class="v">${neglect && isFinite(neglect.d)? v144CategoryIconHtml(neglect.c)+' '+escapeHtml(neglect.c.name)+' — '+Math.floor(neglect.d)+'d' : (neglect? v144CategoryIconHtml(neglect.c)+' '+escapeHtml(neglect.c.name)+' — never':'—')}</span></div>

        <div class="record-row"><span class="k">Average daily consumption</span><span class="v">${fmtMinutes(avgDailyMinutes)}</span></div>

        <div class="record-row"><span class="k">Average task completion rate</span><span class="v">${avgCompletion}%</span></div>

        <div class="record-row"><span class="k">Total lifetime</span><span class="v">${fmtMinutes(lifetime.minutes)} · ${lifetime.episodes} ep · ${lifetime.chapters} ch · ${lifetime.movies} mv · ${lifetime.issues} is</span></div>

      </div>

    </div>

  `;

}

function statCard(label, t){

  return `<div class="stat-box">

    <div class="lbl" style="margin-bottom:8px;">${label}</div>

    <div class="num" style="font-size:20px;">${fmtMinutes(t.minutes)}</div>

    <div style="font-size:12px; color:var(--text-dim); margin-top:6px; line-height:1.7;">

      ${t.episodes} episodes · ${t.chapters} chapters<br>${t.movies} movies · ${t.issues} issues

    </div>

  </div>`;

}

/* ============================================================

   VIEW: PROFILE SETTINGS

   ============================================================ */

async function deleteCloudAccount(){
  if(!AUTH_USER||!supabase){alert('No cloud account is currently signed in.');return;}
  const email=AUTH_USER.email||'';
  if(!confirm(`Delete your MediaFlow account${email?` (${email})`:''}?\n\nThis permanently deletes the account and MediaFlow cloud data.`))return;
  if(prompt('Type DELETE to permanently confirm account deletion.','')!=='DELETE'){alert('Account deletion cancelled.');return;}
  try{
    const {error}=await supabase.rpc('delete_my_account');
    if(error)throw error;
    AUTH_USER=null; AUTH_READY=false;
    try{localStorage.removeItem(STATE_KEY);}catch(e){}
    renderAuthScreen('login','Your account and MediaFlow cloud data were deleted.');
  }catch(e){console.error(e);alert('Account deletion was not completed. Add the delete_my_account Supabase RPC function first. Your account was not deleted.');}
}

function renderProfile(){
  const email=escapeHtml(AUTH_USER?.email||'');
  return `
    <div class="view-head"><div><button class="btn btn-ghost btn-sm" onclick="App.backFromProfile()">← Back</button><div class="view-title" style="margin-top:12px;">Profile settings</div><div class="view-desc">Manage your MediaFlow account and profile.</div></div></div>
    <div class="profile-card">
      <div class="section-label">PROFILE PICTURE</div>
      <div class="card profile-section">
        <div class="profile-avatar-wrap">
          <button class="account-avatar-btn" style="width:88px;height:88px;" onclick="document.getElementById('profile-picture-input')?.click()" title="Change profile picture">${renderProfileAvatar()}</button>
          <div><div style="font-weight:700;">Your profile picture</div><div class="profile-note">Images are resized and prepared for cloud storage. Choose a picture, then click Save picture.</div></div>
        </div>
        <div class="profile-avatar-actions">
          <label class="btn btn-primary" style="cursor:pointer;">Choose picture<input id="profile-picture-input" type="file" accept="image/*" style="display:none" onchange="window.MediaFlowProfile.chooseAvatar(this.files[0])"></label>
          <button id="save-profile-picture" class="btn btn-primary" onclick="window.MediaFlowProfile.saveAvatar()" ${getAvatarUrl()?'':'disabled'}>Save picture</button>
          ${getAvatarUrl()?'<button class="btn btn-danger" onclick="window.MediaFlowProfile.removeAvatar()">Remove picture</button>':''}
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-soft)">
          <div class="field">
            <label class="field-label">Or use an image URL</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <input id="profile-picture-url" type="url" inputmode="url" placeholder="https://example.com/avatar.jpg" style="flex:1;min-width:220px">
              <button id="use-profile-picture-url" class="btn btn-primary" onclick="window.MediaFlowProfile.useAvatarUrl()">Use URL</button>
            </div>
            <div class="profile-note">Use a direct public http:// or https:// image URL. The URL is saved with your MediaFlow cloud state.</div>
          </div>
        </div>
      </div>

      <div class="section-label">NAME</div>
      <div class="card profile-section">
        <div class="field"><label class="field-label">Display name</label><input id="profile-name" type="text" autocomplete="name" maxlength="80" value="${escapeHtml(AUTH_USER?String(AUTH_USER?.user_metadata?.display_name||''):String(S.profileName||''))}" placeholder="Your name"></div>
        <div class="profile-note">If you leave your name empty, MediaFlow will show your account email instead.</div>
        <div class="modal-actions"><button class="btn btn-primary" onclick="window.MediaFlowProfile.updateName()">Save name</button></div>
      </div>

      <div class="section-label">EMAIL</div>
      <div class="card profile-section">
        <div class="field"><label class="field-label">Email address</label><input id="profile-email" type="email" autocomplete="email" value="${email}"></div>
        <div class="profile-note">Changing your email may require confirmation from the new address before it becomes active.</div>
        <div class="modal-actions"><button class="btn btn-primary" onclick="window.MediaFlowProfile.updateEmail()">Change email</button></div>
      </div>

      <div class="section-label">PASSWORD</div>
      <div class="card profile-section">
        <div class="field-row">
          <div class="field"><label class="field-label">New password</label><input id="profile-password" type="password" autocomplete="new-password" minlength="6" placeholder="At least 6 characters"></div>
          <div class="field"><label class="field-label">Confirm new password</label><input id="profile-password-confirm" type="password" autocomplete="new-password" minlength="6" placeholder="Repeat password"></div>
        </div>
        <div class="modal-actions"><button class="btn btn-primary" onclick="window.MediaFlowProfile.updatePassword()">Change password</button></div>
      </div>

      <div class="section-label">ACCOUNT</div>
      <div class="card">
        <div style="font-weight:700;">Cloud account</div>
        <div class="profile-note">Your MediaFlow library, history, settings and progress are synced to this Supabase account. Signing out does not delete your cloud data.</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
          <button class="btn" onclick="window.MediaFlowAuth.logout()">Log out</button>
          <button class="btn btn-danger" onclick="App.deleteCloudAccount()">Delete account</button>
        </div>
        <div class="profile-note" style="margin-top:8px;">Log out keeps your cloud data safe. Delete account permanently removes your cloud account and MediaFlow data after confirmation.</div>
      </div>
    </div>`;
}

/* ============================================================

   VIEW: SETTINGS

   ============================================================ */

function cloneDefaults(value){ return JSON.parse(JSON.stringify(value)); }
function resetSettingsSection(section){
  if(section==='daily'){
    S.settings.dailyMinutes=DEFAULT_SETTINGS.dailyMinutes;
    S.settings.tasksPerDay=DEFAULT_SETTINGS.tasksPerDay;
    S.settings.intensity=DEFAULT_SETTINGS.intensity;
  }else if(section==='titles'){
    S.settings.exactTitleRecommendations=DEFAULT_SETTINGS.exactTitleRecommendations;
    S.settings.prioritizePersonalOrder=DEFAULT_SETTINGS.prioritizePersonalOrder;
  }else if(section==='scheduler'){
    ['neglectRate','neglectCap','repetitionPenalty','consecutivePenalty','saturationWeight','seasonalBonus','randomness','seasonalFreshCount','seasonalFreshAuto','seasonalFreshSyncMinutes','seasonalFreshLastSyncAt','seasonalFreshLastProvider','seasonalFreshLastMatched','seasonalFreshLastEpisodeTotal'].forEach(k=>S.settings[k]=DEFAULT_SETTINGS[k]);
  }else if(section==='leveling'){
    S.settings.leveling=cloneDefaults(DEFAULT_SETTINGS.leveling);
  }else if(section==='appearance'){
    S.settings.theme=DEFAULT_SETTINGS.theme;
    S.settings.globalAppearanceEnabled=DEFAULT_SETTINGS.globalAppearanceEnabled;
    S.settings.appearanceMode=DEFAULT_SETTINGS.appearanceMode;
    S.settings.dynamicCoverTheme=DEFAULT_SETTINGS.dynamicCoverTheme;
    applyTheme(S.settings.theme);
  }else if(section==='backups'){
    S.settings.backup=cloneDefaults(DEFAULT_SETTINGS.backup);
  }else if(section==='mal'){
    S.malLink={username:'',mode:'anime'};
  }
  persistSettings();
  render();
  showToast('Section restored to defaults');
}
function resetAllSettings(){
  S.settings=cloneDefaults(DEFAULT_SETTINGS);
  S.malLink={username:'',mode:'anime'};
  persistSettings();
  restartBackupTimer();
  applyTheme(S.settings.theme);
  render();
  showToast('All settings restored to defaults');
}
function defaultButton(section){
  return `<button class="btn btn-sm btn-ghost" onclick="App.resetSettingsSection('${section}')" title="Restore this section's defaults">Default</button>`;
}

/* v74: ↑/↓ and drag ordering now persist an explicit categoryOrder to cloud. */
function v72MoveCategory(id, direction){
  const idx=S.categories.findIndex(c=>c.id===id);
  if(idx<0) return;
  const next=idx+Number(direction||0);
  if(next<0 || next>=S.categories.length) return;
  [S.categories[idx],S.categories[next]]=[S.categories[next],S.categories[idx]];
  persistCategories();
  render();
}

let V73_CAT_DRAG=null;
function v73CategoryDragStart(ev,id){
  if(!ev || ev.button>0) return;
  const row=ev.currentTarget?.closest('.cat-manage-row');
  if(!row) return;
  ev.preventDefault();
  V73_CAT_DRAG={id,row,pointerId:ev.pointerId};
  row.classList.add('v73-dragging');
  try{ev.currentTarget.setPointerCapture(ev.pointerId);}catch(_){ }
  document.addEventListener('pointermove',v73CategoryDragMove,{passive:false});
  document.addEventListener('pointerup',v73CategoryDragEnd,{once:true});
  document.addEventListener('pointercancel',v73CategoryDragEnd,{once:true});
}
function v73CategoryDragMove(ev){
  if(!V73_CAT_DRAG || ev.pointerId!==V73_CAT_DRAG.pointerId) return;
  ev.preventDefault();
  const el=document.elementFromPoint(ev.clientX,ev.clientY);
  const target=el?.closest?.('.cat-manage-row');
  const row=V73_CAT_DRAG.row;
  if(!target || target===row || target.parentElement!==row.parentElement) return;
  const r=target.getBoundingClientRect();
  target.parentElement.insertBefore(row,ev.clientY < r.top+r.height/2 ? target : target.nextSibling);
}
function v73CategoryDragEnd(ev){
  if(!V73_CAT_DRAG || (ev?.pointerId!=null && ev.pointerId!==V73_CAT_DRAG.pointerId)) return;
  document.removeEventListener('pointermove',v73CategoryDragMove);
  const row=V73_CAT_DRAG.row;
  row?.classList.remove('v73-dragging');
  const parent=row?.parentElement;
  if(parent){
    const ids=[...parent.querySelectorAll(':scope > .cat-manage-row[data-category-id]')].map(x=>x.dataset.categoryId);
    if(ids.length===S.categories.length){
      const byId=new Map(S.categories.map(c=>[c.id,c]));
      S.categories=ids.map(id=>byId.get(id)).filter(Boolean);
      persistCategories();
    }
  }
  V73_CAT_DRAG=null;
  render();
}

function renderSettings(){

  const st = S.settings;

   const catRows = S.categories.map((c,index)=>` 

    <div class="cat-manage-row" data-category-id="${c.id}">

      <div class="hero-icon" style="width:36px;height:36px;font-size:17px;background:${c.color}22; color:${c.color};">${c.icon}</div>

      <div class="name">${escapeHtml(c.name)}<div class="meta">${c.target} ${unitLabel(c.unit,c.target)} target · weight ${c.weight} ${c.seasonal?'· seasonal':''}</div></div>

      <div class="cat-order-controls" style="display:flex;gap:5px;align-items:center;">
        <input class="v157-position-input" type="number" min="1" max="${S.categories.length}" step="1" value="${index+1}"
          title="Set exact category position" aria-label="Set ${escapeHtml(c.name)} category position"
          onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()"
          onkeydown="if(event.key==='Enter'){this.blur();}"
          onchange="App.v157SetCategoryPosition('${c.id}',this.value)">
        <button type="button" class="btn btn-sm btn-ghost cat-drag-handle" title="Drag to reorder" aria-label="Drag ${escapeHtml(c.name)} to reorder" onpointerdown="App.v73CategoryDragStart(event,'${c.id}')">☰</button>
        <button class="btn btn-sm btn-ghost" onclick="App.v72MoveCategory('${c.id}',-1)" ${S.categories[0]?.id===c.id?'disabled':''} title="Move category up" aria-label="Move ${escapeHtml(c.name)} up">↑</button>
        <button class="btn btn-sm btn-ghost" onclick="App.v72MoveCategory('${c.id}',1)" ${S.categories[S.categories.length-1]?.id===c.id?'disabled':''} title="Move category down" aria-label="Move ${escapeHtml(c.name)} down">↓</button>
      </div>

      <button class="toggle ${c.enabled?'on':''}" onclick="App.toggleCategory('${c.id}')"></button>

      <button class="btn btn-sm btn-ghost cat-edit-btn" onclick="App.openCategoryModal('${c.id}')">Edit</button>

      <button class="btn btn-sm btn-danger cat-delete-btn" onclick="App.deleteCategory('${c.id}')">Delete</button>

    </div>`).join('');

   return ` 

    <div class="view-head"><div><div class="view-title">Settings</div><div class="view-desc">Tune the rotation to fit your life.</div></div><button class="btn btn-ghost" onclick="App.resetAllSettings()">Restore all defaults</button></div>

    <div class="section-label">🛠 LIBRARY INTEGRITY</div>
    <div class="card" style="margin-bottom:22px;border:1px solid var(--flow);">
      <div style="font-weight:800;font-size:15px;">Repair Completed title progress</div>
      <div class="v66-note">Scans the whole Library. A Completed title with a known total is set to full progress, for example 0 / 1 → 1 / 1 or 8 / 12 → 12 / 12. Titles with no known total are ignored.</div>
      <button class="btn btn-primary" style="margin-top:12px" onclick="App.v69RepairAllCompleted()">Scan & fix whole Library</button>
    </div>

    <div class="settings-categories-full">
      <div class="section-label">CATEGORIES</div>
      <div class="card">
        ${catRows}
        <button class="btn btn-block" style="margin-top:14px;" onclick="App.openCategoryModal()">+ Add category</button>
      </div>
    </div>

    <div class="two-col" style="align-items:start;">

      <div>

        <div class="section-label settings-section-head"><span>DAILY GOAL</span>${defaultButton('daily')}</div>

        <div class="card" style="margin-bottom:22px;">

          <div class="intensity-row">

             ${Object.entries(INTENSITY_PRESETS).map(([k,p])=>` 

              <div class="intensity-opt ${st.intensity===k?'active':''}" onclick="App.setIntensity('${k}')">

                <div class="t">${p.label}</div><div class="d">${p.desc}</div>

              </div>`).join('')}

          </div>

          <div class="field-row" style="margin-top:16px;">

            <div class="field">

              <label class="field-label">Daily minutes</label>

              <input type="number" min="0" value="${st.dailyMinutes}" onchange="App.updateSetting('dailyMinutes', this.value)">

            </div>

            <div class="field">

              <label class="field-label">Tasks per day</label>

              <input type="number" min="1" value="${st.tasksPerDay}" onchange="App.updateSetting('tasksPerDay', this.value)">

            </div>

          </div>

        </div>

        <div class="section-label settings-section-head"><span>TITLE RECOMMENDATIONS</span>${defaultButton('titles')}</div>

        <div class="card" style="margin-bottom:22px;">
          <div class="settings-toggle-row" style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
            <div>
              <div style="font-weight:700;">Let MediaFlow choose the exact title</div>
              <small class="hint">When enabled, the scheduler uses your Library and its scoring signals to recommend a specific title inside the category it selected. You can still skip or rotate.</small>
            </div>
            <button class="toggle ${st.exactTitleRecommendations?'on':''}" onclick="App.toggleExactTitleRecommendations()" aria-label="Toggle exact title recommendations"></button>
          </div>
          <div style="margin-top:10px; color:var(--text-mute); font-size:12px;">${st.exactTitleRecommendations?'ON — MediaFlow picks category + amount + title.':'OFF — MediaFlow picks category + amount; you pick the title.'}</div>

          <div style="height:1px;background:var(--border-soft);margin:16px 0;"></div>

          <div class="settings-toggle-row" style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
            <div>
              <div style="font-weight:700;">Prioritize Personal Order</div>
              <small class="hint">When enabled, MediaFlow still chooses the category, amount, balance, reasons and task exactly as before. For the exact title only, it first checks your Order and recommends the first eligible ordered title in that task's category. If none is available, the normal MediaFlow title scoring is used.</small>
            </div>
            <button class="toggle ${st.prioritizePersonalOrder?'on':''}" onclick="App.togglePrioritizePersonalOrder()" aria-label="Toggle Personal Order priority"></button>
          </div>
          <div style="margin-top:10px; color:var(--text-mute); font-size:12px;">
            ${st.prioritizePersonalOrder
              ? (st.exactTitleRecommendations
                  ? 'ON — Personal Order gets first priority for the recommended title.'
                  : 'ON — Saved, but it only applies while exact title recommendations are enabled.')
              : 'OFF — MediaFlow uses its normal title scoring.'}
          </div>
        </div>

        <div class="section-label settings-section-head"><span>SCHEDULER TUNING</span>${defaultButton('scheduler')}</div>

        <div class="card" style="margin-bottom:22px;">

          ${sliderField('Neglect sensitivity','neglectRate',1,15,st.neglectRate,'How fast an ignored category climbs in priority.')}

          ${sliderField('Variety strength','repetitionPenalty',2,30,st.repetitionPenalty,'How strongly recent repeats are discouraged.')}

          ${sliderField('Saturation weight','saturationWeight',0,40,st.saturationWeight,'How hard the app pulls back after heavy recent use.')}

          ${sliderField('Seasonal urgency','seasonalBonus',0,35,st.seasonalBonus,'Base priority boost for time-sensitive seasonal anime.')}

          ${sliderField('Randomness','randomness',0,0.6,st.randomness,'Controlled unpredictability in category selection.', true)}<div class="field" style="margin-top:4px;">

            <label class="field-label">Seasonal — titles with fresh episodes waiting</label>

            <input type="number" min="0" value="${st.seasonalFreshCount}" onchange="App.updateSetting('seasonalFreshCount', this.value)">

            <small class="hint">Manual for now — update this yourself when new episodes drop. AniList auto-sync can slot in here later without changing the scheduler.</small>

          </div>

        </div>

        <div class="section-label settings-section-head"><span>LEVELING &amp; XP</span>${defaultButton('leveling')}</div>

        <div class="card" style="margin-bottom:22px;">
          <div class="settings-toggle-row" style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
            <div>
              <div style="font-weight:700;">XP leveling system</div>
              <small class="hint">Control how much XP you earn from time, media units, Library additions, completions, and rotation health.</small>
            </div>
            <button class="toggle ${st.leveling?.enabled!==false?'on':''}" onclick="App.updateLeveling('enabled', ${st.leveling?.enabled!==false?'false':'true'})"></button>
          </div>
          <div class="field-row" style="margin-top:16px;">
            <div class="field"><label class="field-label">XP per minute</label><input type="number" min="0" step="0.1" value="${st.leveling?.minuteXP??1}" onchange="App.updateLeveling('minuteXP',this.value)"></div>
            <div class="field"><label class="field-label">New Library title XP</label><input type="number" min="0" value="${st.leveling?.libraryAdditionXP??25}" onchange="App.updateLeveling('libraryAdditionXP',this.value)"></div>
          </div>
          <div class="field"><label class="field-label">Completion bonus XP</label><input type="number" min="0" value="${st.leveling?.completionXP??50}" onchange="App.updateLeveling('completionXP',this.value)"></div>
          <div style="font-weight:700;font-size:12px;margin:14px 0 8px;">UNIT XP</div>
          <div class="field-row">
            <div class="field"><label class="field-label">Episode</label><input type="number" min="0" value="${st.leveling?.unitXP?.episodes??10}" onchange="App.updateLevelingUnit('episodes',this.value)"></div>
            <div class="field"><label class="field-label">Chapter</label><input type="number" min="0" value="${st.leveling?.unitXP?.chapters??3}" onchange="App.updateLevelingUnit('chapters',this.value)"></div>
          </div>
          <div class="field-row">
            <div class="field"><label class="field-label">Issue</label><input type="number" min="0" value="${st.leveling?.unitXP?.issues??6}" onchange="App.updateLevelingUnit('issues',this.value)"></div>
            <div class="field"><label class="field-label">Movie</label><input type="number" min="0" value="${st.leveling?.unitXP?.movies??30}" onchange="App.updateLevelingUnit('movies',this.value)"></div>
          </div>
          <div style="font-weight:700;font-size:12px;margin:14px 0 8px;">ROTATION XP MULTIPLIERS</div>
          <div class="field-row">
            <div class="field"><label class="field-label">Neglected</label><input type="number" min="0" step="0.1" value="${st.leveling?.rotationMultiplier?.neglected??2}" onchange="App.updateLevelingRotation('neglected',this.value)"></div>
            <div class="field"><label class="field-label">Due</label><input type="number" min="0" step="0.1" value="${st.leveling?.rotationMultiplier?.due??1.5}" onchange="App.updateLevelingRotation('due',this.value)"></div>
          </div>
          <div class="field-row">
            <div class="field"><label class="field-label">Healthy</label><input type="number" min="0" step="0.1" value="${st.leveling?.rotationMultiplier?.healthy??1}" onchange="App.updateLevelingRotation('healthy',this.value)"></div>
            <div class="field"><label class="field-label">Overused</label><input type="number" min="0" step="0.1" value="${st.leveling?.rotationMultiplier?.overused??0.5}" onchange="App.updateLevelingRotation('overused',this.value)"></div>
          </div>
        </div>

        <div class="section-label settings-section-head"><span>IMPORT / EXPORT — MEDIA SERVICES</span>${defaultButton('mal')}</div>

        <div class="card" style="margin-bottom:22px;">
<div style="font-size:13px;color:var(--text-dim);line-height:1.6;margin-bottom:14px;">Import library exports from other tracking services or export your MediaFlow Library into exchange files for those services. MediaFlow merges matching titles and preserves progress, status, ratings, dates and external IDs when the source contains them.</div>
<div class="field-row"><div class="field"><label class="field-label">Service / format</label><select id="exchange-service">${mfExchangeServiceOptions()}</select></div><div class="field"><label class="field-label">Import</label><button class="btn" onclick="App.pickExchangeImport()">Choose export file</button><input id="exchange-file" type="file" accept=".json,.csv,.xml,.txt,application/json,text/csv,text/xml,application/xml" style="display:none" onchange="App.prepareExchangeImport(this.files[0])"></div></div>
<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px"><button class="btn btn-primary" onclick="App.exportExchange()">Export for selected service</button><button class="btn" onclick="document.getElementById('mal-file').click()">Quick MAL XML import</button><input type="file" id="mal-file" accept=".xml,text/xml" style="display:none" onchange="App.prepareLegacyImport('mal',this.files[0])"><button class="btn" onclick="document.getElementById('simkl-file').click()">Quick Simkl JSON import</button><input type="file" id="simkl-file" accept=".json,application/json" style="display:none" onchange="App.prepareLegacyImport('simkl',this.files[0])"></div>
<small class="hint">AniList · AniSearch · AniWatch · BetaSeries · Criticker · Crunchyroll · EpisodeCalendar · HiAnime · IMDb · Letterboxd · LiveChart · Kitsu · MoviesFad · MyAnimeList · MAL-XML · Netflix · PrimeWire · SeriesFad · Stremio · trakt · TV Time · Tviso · Twee · CSV · JSON. Different services expose different fields, so MediaFlow imports what is actually present instead of inventing missing data.</small>
</div>

        <div class="section-label">DATA</div>

        <div class="card">

          <div style="display:flex; gap:10px; flex-wrap:wrap;">

            <button class="btn" onclick="App.exportJSON()">Export JSON backup</button>

            <button class="btn" onclick="document.getElementById('import-file').click()">Import JSON backup</button>

            <input type="file" id="import-file" accept="application/json" style="display:none" onchange="App.prepareBackupImport(this.files[0])">

            <button class="btn btn-danger" onclick="App.resetAll()">Reset all data</button>

          </div>

        </div>

      </div>

    </div>

  `;

}

function sliderField(label, key, min, max, val, hint, isFloat){

  return `<div class="field">

    <label class="field-label">${label}: ${isFloat? Math.round(val*100)+'%' : val}</label>

    <input type="range" min="${min}" max="${max}" step="${isFloat?0.02:1}" value="${val}" oninput="App.updateSetting('${key}', this.value)">

    <small class="hint">${hint}</small>

  </div>`;

}

/* ============================================================

   MODALS

   ============================================================ */

function renderModal(){

  let el = document.getElementById('modal-root');

  if(!S.modal){ if(el) el.remove(); return; }
  // v77: there must only ever be one modal root. Replacing it prevents stacked popups.
  if(el) el.remove();

  const html = S.modal.type==='category' ? categoryModalHtml(S.modal.data)

    : S.modal.type==='session' ? sessionModalHtml(S.modal.data)

    : S.modal.type==='libraryDelete' ? libraryDeleteModalHtml(S.modal.data)

    : S.modal.type==='categoryDelete' ? categoryDeleteModalHtml(S.modal.data)

    : S.modal.type==='emptyLibrary' ? emptyLibraryModalHtml(S.modal.data)

    : S.modal.type==='priority' ? priorityModalHtml(S.modal.data)

    : S.modal.type==='libraryStatus' ? libraryStatusModalHtml(S.modal.data)

    : S.modal.type==='libraryCategory' ? libraryCategoryModalHtml(S.modal.data)

    : S.modal.type==='importConfirm' ? mfImportConfirmModalHtml(S.modal.data)
    : S.modal.type==='coverPicker' ? coverPickerModalHtml(S.modal.data)
    : libraryModalHtml(S.modal.data);

  const wrap = document.createElement('div');

  wrap.id = 'modal-root';

  wrap.innerHTML = `<div class="modal-overlay" onclick="if(event.target===this) App.closeModal()"><div class="modal">${html}</div></div>`;

  document.body.appendChild(wrap);

}

function libraryDeleteModalHtml(d){
  const title = cleanTitle(d?.title) || 'this title';
  const id = escapeHtml(d?.id || '');
  return `<div class="modal-title">Delete library title?</div>
    <div style="color:var(--text-dim); line-height:1.6; font-size:13px; margin-bottom:18px;">
      You are about to remove <b>${escapeHtml(title)}</b> from your Library.
      <br><br>Your existing history/session logs will remain.
      This action cannot be undone.
    </div>
    <div style="display:flex; justify-content:flex-end; gap:8px;">
      <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="App.confirmDeleteLibrary('${id}')">Delete title</button>
    </div>`;
}

function categoryDeleteModalHtml(d){
  const name = String(d?.name || 'this category');
  const id = escapeHtml(d?.id || '');
  const icon = d?.iconUrl?v144CategoryIconHtml(d):escapeHtml(d?.icon||'🗂️');
  const assigned = S.library.filter(item=>item.categoryId===d?.id).length;
  return `<div class="category-delete-modal">
    <div class="v79-delete-head">
      <div class="v79-delete-icon">${icon}</div>
      <div><div class="modal-title" style="margin:0 0 4px;">Delete category?</div><div class="hint">MediaFlow category management</div></div>
    </div>
    <div style="color:var(--text-dim);line-height:1.65;font-size:13px;">
      You are about to permanently delete <b style="color:var(--text);">${escapeHtml(name)}</b>.
      ${assigned?`<div style="margin-top:12px;padding:10px 12px;border-radius:10px;background:var(--panel-raised);border:1px solid var(--border-soft);"><b>${assigned}</b> Library title${assigned===1?' is':'s are'} currently assigned to this category.</div>`:''}
      <div class="v79-delete-warning"><b style="color:var(--text);">This cannot be undone.</b><br>Past history is kept, but entries that reference this category may show it as removed.</div>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
      <button type="button" class="btn btn-danger" onclick="App.confirmDeleteCategory('${id}',this)">Delete category</button>
    </div>
  </div>`;
}

function emptyLibraryModalHtml(d){
  const count=Number(d?.count)||0;
  return `<div class="empty-library-modal">
    <div class="empty-library-icon">${ICONS.library}</div>
    <div class="modal-title" style="margin-bottom:7px;">Empty your Library</div>
    <div class="empty-library-sub">You have <b>${count.toLocaleString()}</b> ${count===1?'title':'titles'} in your Library. Choose what should happen to your current task.</div>
    <div class="empty-library-options">
      <button class="empty-library-option" onclick="App.confirmEmptyLibrary('keep')">
        <span class="empty-option-icon">📚</span><span><b>Remove titles, keep current task</b><small>Delete all Library entries. Your history stays untouched and the current recommendation remains.</small></span>
      </button>
      <button class="empty-library-option danger-option" onclick="App.confirmEmptyLibrary('clearTask')">
        <span class="empty-option-icon">🗑️</span><span><b>Remove titles and clear current task</b><small>Delete all Library entries and also clear the currently assigned task.</small></span>
      </button>
    </div>
    <div class="empty-library-warning"><span>!</span><div><b>This cannot be undone</b><br><small>Consumption history and statistics will remain. Only the Library entries are removed.</small></div></div>
    <div class="modal-actions"><button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button></div>
  </div>`;
}

function categoryModalHtml(d){

  const isNew = !d.id;

   return ` 

    <div class="modal-title">${isNew?'Add category':'Edit category'}</div>

    <div class="field"><label class="field-label">Name</label><input type="text" id="m-name" value="${escapeHtml(d.name||'')}"></div>

    <div class="field"><label class="field-label">Icon</label>

      <div style="display:flex; gap:6px; flex-wrap:wrap;">

        ${ICON_CHOICES.map(ic=>`<div onclick="App.pickIcon('${ic}')" style="cursor:pointer; padding:6px 9px; border-radius:8px; border:1px solid ${d.icon===ic?'var(--flow)':'var(--border-soft)'}; background:var(--panel-raised); font-size:16px;" data-icon-swatch>${ic}</div>`).join('')}

      </div>

      <input type="hidden" id="m-icon" value="${d.icon||'✨'}">

    </div>

    <div class="field-row">

      <div class="field"><label class="field-label">Type</label>

        <select id="m-type"><option value="video" ${d.type==='video'?'selected':''}>Video</option><option value="reading" ${d.type==='reading'?'selected':''}>Reading</option></select>

      </div>

      <div class="field"><label class="field-label">Unit</label>

        <select id="m-unit">${Object.keys(UNITS).map(u=>`<option value="${u}" ${d.unit===u?'selected':''}>${UNITS[u].label}</option>`).join('')}</select>

      </div>

    </div>

    <div class="field-row">

      <div class="field"><label class="field-label">Suggested target</label><input type="number" id="m-target" min="1" value="${d.target||1}"></div>

      <div class="field"><label class="field-label">Weight (1–5)</label><input type="number" id="m-weight" min="1" max="5" value="${d.weight||3}"></div>

    </div>

    <div class="field-row">

      <div class="field"><label class="field-label">Minutes per unit</label><input type="number" id="m-mpu" min="1" value="${d.minutesPerUnit||20}"></div>

      <div class="field" style="display:flex; align-items:flex-end; gap:16px; padding-bottom:9px;">

        <label style="display:flex; align-items:center; gap:6px; font-size:13px;"><input type="checkbox" id="m-seasonal" ${d.seasonal?'checked':''}> Time-sensitive (seasonal)</label>

      </div>

    </div>

    <div class="field"><label class="field-label">Color</label>

      <div style="display:flex; gap:6px; flex-wrap:wrap;">

        ${COLOR_CHOICES.map(c=>`<div onclick="App.pickColor('${c}')" style="cursor:pointer; width:26px; height:26px; border-radius:7px; background:${c}; border:2px solid ${d.color===c?'#fff':'transparent'};" data-color-swatch></div>`).join('')}

      </div>

      <input type="hidden" id="m-color" value="${d.color||COLOR_CHOICES[0]}">

    </div>

    <label style="display:flex; align-items:center; gap:6px; font-size:13px; margin-bottom:6px;"><input type="checkbox" id="m-enabled" ${d.enabled!==false?'checked':''}> Enabled</label>

    <div class="modal-actions">

      <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>

      <button type="button" class="btn btn-primary" onclick="App.saveCategoryModal('${d.id||''}',this)">Save category</button>

    </div>

  `;

}

function sessionModalHtml(d){

  const cat = getCategory(d.categoryId);

   return ` 

    <div class="modal-title">Edit logged entry</div>

    <div class="field"><label class="field-label">Category</label>

      <select id="s-category">${S.categories.map(c=>`<option value="${c.id}" ${d.categoryId===c.id?'selected':''}>${v144CategoryIconText(c)} ${escapeHtml(c.name)}</option>`).join('')}</select>

    </div>

    <div class="field-row">

      <div class="field"><label class="field-label">Date</label><input type="text" id="s-date" value="${d.date}" placeholder="YYYY-MM-DD"></div>

      <div class="field"><label class="field-label">Status</label>

        <select id="s-status">

          ${['complete','partial','over','skipped','logged'].map(s=>`<option value="${s}" ${d.status===s?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}

        </select>

      </div>

    </div>

    <div class="field-row">

      <div class="field"><label class="field-label">Target amount</label><input type="number" min="0" id="s-target" value="${d.targetAmount}"></div>

      <div class="field"><label class="field-label">Actual amount</label><input type="number" min="0" id="s-actual" value="${d.actualAmount}"></div>

    </div>

    <div class="field"><label class="field-label">Minutes</label><input type="number" min="0" id="s-minutes" value="${d.minutes}"></div>

    <div class="field"><label class="field-label">Note</label><input type="text" id="s-note" value="${escapeHtml(d.note||'')}"></div>

    <small class="hint">Editing history updates the scheduler's picture of your recent consumption immediately — recency, saturation and streaks are recalculated from this log the next time a task is generated.</small>

    <div class="modal-actions">

      <button class="btn btn-danger" style="margin-right:auto;" onclick="App.deleteSessionFromModal('${d.id}')">Delete entry</button>

      <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>

      <button class="btn btn-primary" onclick="App.saveSessionModal('${d.id}')">Save</button>

    </div>

  `;

}

function libraryModalHtml(d){

  const isNew = !d.id;

   return ` 

    <div class="modal-title">${isNew?'Add title':'Edit title'}</div>

    <div class="field"><label class="field-label">Title</label><input type="text" id="l-title" value="${escapeHtml(d.title||'')}"></div>

    <div class="field"><label class="field-label">Category</label>

      <select id="l-category">${S.categories.map(c=>`<option value="${c.id}" ${d.categoryId===c.id?'selected':''}>${v144CategoryIconText(c)} ${escapeHtml(c.name)}</option>`).join('')}</select>

    </div>

    <div class="field-row">

      <div class="field"><label class="field-label">Progress</label><input type="number" id="l-progress" min="0" value="${d.progress||0}"></div>

      <div class="field"><label class="field-label">Total (optional)</label><input type="number" id="l-total" min="0" value="${d.total||''}"></div>

    </div>

    <div class="field-row">

      <div class="field"><label class="field-label">Status</label>

        <select id="l-status">${['planned','active','paused','completed','dropped'].map(s=>`<option value="${s}" ${d.status===s?'selected':''}>${v199StatusLabel(s)}</option>`).join('')}</select>

      </div>

      <div class="field"><label class="field-label">Priority</label>

        <select id="l-priority">${['low','medium','high'].map(s=>`<option value="${s}" ${d.priority===s?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}</select>

      </div>

    </div>

    <div class="field"><label class="field-label">Estimated minutes (optional)</label><input type="number" id="l-est" min="0" value="${d.estimatedMinutes||''}"></div>

    <div class="field"><label class="field-label">Tags (comma separated)</label><input type="text" id="l-tags" value="${(d.tags||[]).join(', ')}"></div>

    <div class="modal-actions" style="justify-content:space-between;">

      <div>
        ${!isNew ? `<button type="button" class="btn btn-danger" onclick="event.preventDefault(); event.stopPropagation(); App.deleteLibraryItem('${d.id}')">Delete title</button>` : ''}
      </div>

      <div style="display:flex; gap:8px;">
        <button type="button" class="btn btn-ghost" onclick="event.preventDefault(); App.closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="event.preventDefault(); App.saveLibraryModal('${d.id||''}')">Save title</button>
      </div>

    </div>

  `;

}

/* ============================================================

   APP — public actions (bound to window)

   ============================================================ */

const App = {
  v72MoveCategory,
  v73CategoryDragStart,
  v69RepairAllCompleted,
  v69RepairSelectedCompleted,
  v69ToggleLibraryCategory,
  v69ClearLibraryCategories,
  v69SetLibrarySort,

  setView(v){ S.view=v; render(); },
  mobileNav, toggleMobileMore,
  openProfile(){ S.profileReturnView=S.view==='profile'?'dashboard':S.view; S.view='profile'; render(); },
  backFromProfile(){ S.view=S.profileReturnView||'dashboard'; render(); },

  startSession, endSession, rotateTask, skipTask, openLogForm, cancelLogForm, submitLog,
  addBatchRow, removeBatchRow, updateBatchRow, updateBatchSearch, renderBatchSuggestions, selectBatchTitle, clearBatchLog, submitBatchLog,

  toggleReasonDetail(){ S.showReasonDetail=!S.showReasonDetail; render(); },

  updateLogDraft(k,v){ S.logDraft[k]=v; if(k==='amount'||k==='minutes') refreshXPPreview(); },

  updateEntryDraft(k,v){ S.entryDraft[k]=v; if(k==='title') renderLogSuggestions(); },

  selectLogTitle(id){
    const item=S.library.find(i=>i.id===id);
    if(!item || item.status==='dropped') return;
    S.entryDraft.title=cleanTitle(item.title);
    S.entryDraft.libraryId=item.id;
    render();
  },

  addLogEntry(){

    const title=(S.entryDraft.title||'').trim();
    if(!title) return;

    const qty=Math.max(1,Number(S.entryDraft.qty)||1);
    const cat=getCategory(S.currentTask.categoryId);
    let match=S.entryDraft.libraryId ? S.library.find(i=>i.id===S.entryDraft.libraryId) : null;
    if(!match) match=findLibraryMatch(cat.id,title);
    // If the title exists in another category, use that Library entry instead
    // of creating a duplicate. This is especially important for Manga, TV,
    // Movies, Manhwa, Comics, and custom categories.
    if(!match){
      const normalized=cleanTitle(title).toLowerCase();
      match=S.library.find(i=>i && i.status!=='dropped' && cleanTitle(i.title).toLowerCase()===normalized) || null;
    }
    let isNew=false;

    if(!match){
      match={
        id:uid(),
        title,
        categoryId:cat.id,
        progress:0,
        total:null,
        status:'active',
        priority:'medium',
        estimatedMinutes:null,
        tags:['manual'],
        source:'manual', createdAt:Date.now(), completedAt:null
      };
      S.library.push(match);
      isNew=true;
      awardLibraryAdditionXP(match.id);
      persistLibrary();
    }

    S.logDraft.entries=S.logDraft.entries||[];
    const isRepeat=match.status==='completed' || (Number(match.total)>0 && Number(match.progress)>=Number(match.total));
    S.logDraft.entries.push({title,qty,libraryId:match.id,isNew,isRepeat});
    S.entryDraft={title:'',qty:1,libraryId:null};
    render();

  },

  removeLogEntry(idx){

    S.logDraft.entries.splice(idx,1); render();

  },

  updateLogEntryDetail(idx,key,value){

    const entry=(S.logDraft.entries||[])[idx];
    if(!entry||!entry.libraryId) return;

    const item=S.library.find(i=>i.id===entry.libraryId);
    if(!item) return;

    if(key==='title'){
      const title=String(value||'').trim();
      if(title){ item.title=title; entry.title=title; }
    }else if(key==='progress'){
      item.progress=Math.max(0,Number(value)||0);
    }else if(key==='total'){
      item.total=value===''?null:Math.max(0,Number(value)||0);
    }else if(key==='status'){
      item.status=value;
    }else if(key==='priority'){
      item.priority=value;
    }else if(key==='estimatedMinutes'){
      item.estimatedMinutes=value===''?null:Math.max(0,Number(value)||0);
    }else if(key==='tags'){
      item.tags=String(value||'').split(',').map(t=>t.trim()).filter(Boolean);
    }

    normalizeSeasonalLibraryItems();
    persistLibrary();

  },

  syncAmountFromEntries(){
    const entries=S.logDraft.entries||[];
    const amount=entriesTotal(entries);
    S.logDraft.amount=amount;
    const cat=getCategory(S.logDraft.categoryId||S.currentTask?.categoryId||'');
    if(cat) S.logDraft.minutes=Math.round(amount*(Number(cat.minutesPerUnit)||0));
    render();
  },

  toggleUpdateLibrary(v){ S.logDraft.updateLibrary = v; },

  setHistFilter(k,v){ S.histFilters[k]=v; S.histPage=0; render(); },

  setHistPage(page){ S.histPage=Math.max(0, Number(page)||0); render(); },

  searchLibrary(v){ v53DebouncedLibrarySearch(v); },
  setLibFilter(k,v,live){
    S.histFilters[k]=v;
    S.libPage=0;
    render();
  },
  setLibPage(page){
    S.libPage=Math.max(0, Number(page)||0);
    render();
    const anchor=document.querySelector('.lib-search');
    if(anchor && document.activeElement!==anchor){}
  },

  setIntensity(k){

    const p = INTENSITY_PRESETS[k];

    S.settings.intensity=k; S.settings.tasksPerDay=p.tasksPerDay; S.settings.dailyMinutes=p.dailyMinutes;

    persistSettings(); render();

  },

  toggleExactTitleRecommendations(){
    S.settings.exactTitleRecommendations=!S.settings.exactTitleRecommendations;
    if(S.sessionActive && S.currentTask){
      const cat=getCategory(S.currentTask.categoryId);
      const picked=S.settings.exactTitleRecommendations ? pickLibraryTitle(cat) : null;
      S.currentTask.libraryId=picked?picked.id:null;
      S.currentTask.title=picked?cleanTitle(picked.title):null;
      persistTask();
    }
    persistSettings(); render();
  },

  resetSettingsSection(section){ resetSettingsSection(section); },
  resetAllSettings(){ resetAllSettings(); },

  updateSetting(key, val){

    const num = Number(val);

    S.settings[key] = isNaN(num) ? val : num;

    persistSettings(); render();

  },

  updateLeveling(key,val){
    S.settings.leveling=S.settings.leveling||cloneDefaults(DEFAULT_SETTINGS.leveling);
    if(key==='enabled') S.settings.leveling.enabled=!!val;
    else S.settings.leveling[key]=Math.max(0,Number(val)||0);
    persistSettings(); render();
  },
  updateLevelingUnit(key,val){
    S.settings.leveling=S.settings.leveling||cloneDefaults(DEFAULT_SETTINGS.leveling);
    S.settings.leveling.unitXP=S.settings.leveling.unitXP||{};
    S.settings.leveling.unitXP[key]=Math.max(0,Number(val)||0);
    persistSettings(); render();
  },
  updateLevelingRotation(key,val){
    S.settings.leveling=S.settings.leveling||cloneDefaults(DEFAULT_SETTINGS.leveling);
    S.settings.leveling.rotationMultiplier=S.settings.leveling.rotationMultiplier||{};
    S.settings.leveling.rotationMultiplier[key]=Math.max(0,Number(val)||0);
    persistSettings(); render();
  },

  toggleCategory(id){

    const c = S.categories.find(c=>c.id===id); if(!c) return;

    c.enabled = !c.enabled; persistCategories(); render();

  },

  openCategoryModal(id){

    const data = id ? Object.assign({}, getCategory(id)) : {name:'', icon:'✨', type:'video', unit:'episodes', target:5, weight:3, minutesPerUnit:20, color:COLOR_CHOICES[0], enabled:true, seasonal:false};

    S.modal = {type:'category', data}; render();

  },

  pickIcon(ic){
    const input=document.getElementById('m-icon'); if(input) input.value=ic;
    if(S.modal?.type==='category') S.modal.data.icon=ic;
    document.querySelectorAll('#modal-root [data-icon-swatch]').forEach(el=>{
      el.style.borderColor=(el.textContent.trim()===ic)?'var(--flow)':'var(--border-soft)';
    });
  },

  pickColor(c){
    const input=document.getElementById('m-color'); if(input) input.value=c;
    if(S.modal?.type==='category') S.modal.data.color=c;
    document.querySelectorAll('#modal-root [data-color-swatch]').forEach(el=>{
      el.style.borderColor=(el.style.background===c || el.style.backgroundColor===c)?'#fff':'transparent';
    });
  },

  saveCategoryModal(id,button){

    // v77: guard against accidental double submission while the cloud save starts.
    if(button?.dataset?.saving==='1') return;
    if(button){button.dataset.saving='1';button.disabled=true;}
    const data = {

      id: id || uid(),

      name: document.getElementById('m-name').value.trim() || 'Untitled category',

      icon: document.getElementById('m-icon').value || '✨',

      type: document.getElementById('m-type').value,

      unit: document.getElementById('m-unit').value,

      target: Math.max(1, Number(document.getElementById('m-target').value)||1),

      weight: clamp(Number(document.getElementById('m-weight').value)||3,1,5),

      minutesPerUnit: Math.max(1, Number(document.getElementById('m-mpu').value)||20),

      seasonal: document.getElementById('m-seasonal').checked,

      color: document.getElementById('m-color').value,

      enabled: document.getElementById('m-enabled').checked,

      custom: true,

    };

    const idx = S.categories.findIndex(c=>c.id===id);

    if(idx>=0) S.categories[idx] = Object.assign({}, S.categories[idx], data);

    else S.categories.push(data);

    persistCategories(); S.modal=null; render();

  },

  deleteCategory(id){
    const c=S.categories.find(c=>c.id===id); if(!c) return;
    // v79: open the MediaFlow confirmation directly in the DOM. Do not use browser confirm().
    const existing=document.getElementById('modal-root'); if(existing) existing.remove();
    const wrap=document.createElement('div');
    wrap.id='modal-root';
    wrap.innerHTML=`<div class="modal-overlay" onclick="if(event.target===this) App.closeModal()"><div class="modal">${categoryDeleteModalHtml({id:c.id,name:c.name,icon:c.icon,iconUrl:c.iconUrl||''})}</div></div>`;
    document.body.appendChild(wrap);
  },

  async confirmDeleteCategory(id,button){
    if(button?.dataset?.deleting==='1') return;
    if(button){button.dataset.deleting='1';button.disabled=true;}
    const c=S.categories.find(c=>c.id===id);
    if(!c){S.modal=null;render();return;}
    S.categories=S.categories.filter(c=>c.id!==id);
    if(Array.isArray(S.categoryOrder)) S.categoryOrder=S.categoryOrder.filter(cid=>cid!==id);
    S.modal=null;
    await persistCategories();
    render();
    showToast(`${c.name} deleted`);
  },

  openLibraryModal(id){

    const data = id ? Object.assign({}, S.library.find(i=>i.id===id)) : {categoryId:S.categories[0]?.id, progress:0, status:'planned', priority:'medium', tags:[]};

    S.modal = {type:'library', data}; render();

  },

  saveLibraryModal(id){

    const tagsRaw = document.getElementById('l-tags').value;

    const data = {

      id: id || uid(),

      title: cleanTitle(document.getElementById('l-title').value) || 'Untitled',

      categoryId: document.getElementById('l-category').value,

      progress: Math.max(0, Number(document.getElementById('l-progress').value)||0),

      total: document.getElementById('l-total').value ? Math.max(0, Number(document.getElementById('l-total').value)) : null,

      status: document.getElementById('l-status').value,

      priority: document.getElementById('l-priority').value,

      estimatedMinutes: document.getElementById('l-est').value ? Number(document.getElementById('l-est').value) : null,

      tags: tagsRaw.split(',').map(t=>t.trim()).filter(Boolean),
      createdAt: id ? (S.library.find(i=>i.id===id)?.createdAt||Date.now()) : Date.now(),
      completedAt: id ? (S.library.find(i=>i.id===id)?.completedAt||null) : null,

    };

    const existingBefore = id ? S.library.find(i=>i.id===id) : null;
    const idx = S.library.findIndex(i=>i.id===id);

    if(data.status==='completed' && !data.completedAt) data.completedAt=Date.now();
    if(data.status==='completed'){ S.completionTimeline=S.completionTimeline||[]; if(!S.completionTimeline.some(x=>x.libraryId===data.id)){ S.completionTimeline.push({libraryId:data.id,title:data.title,categoryId:data.categoryId,completedAt:data.completedAt}); } }
    if(idx>=0) S.library[idx] = data; else { S.library.push(data); awardLibraryAdditionXP(data.id); }

    // Completed seasonal titles are always normalized into the Anime Backlog.
    normalizeSeasonalLibraryItems();
    persistLibrary(); S.modal=null; render();

  },

  deleteLibraryItem(id){
    const item=S.library.find(i=>i && i.id===id);
    if(!item) return;
    S.modal={type:'libraryDelete', data:{id:item.id, title:cleanTitle(item.title)||'this title'}};
    render();
  },

  async confirmDeleteLibrary(id){
    const index=S.library.findIndex(i=>i && i.id===id);
    if(index<0){ S.modal=null; render(); return; }

    S.library.splice(index,1);
    if(S.modal && S.modal.type==='libraryDelete') S.modal=null;

    await persistLibrary();

    const maxPage=Math.max(0,Math.ceil(S.library.length/50)-1);
    S.libPage=clamp(S.libPage||0,0,maxPage);
    render();
    showToast('Library title deleted');
  },

  closeModal(){ S.modal=null; render(); },

  openSessionModal(id){

    const sess = S.sessions.find(s=>s.id===id); if(!sess) return;

    S.modal = {type:'session', data: Object.assign({}, sess)}; render();

  },

  saveSessionModal(id){

    const idx = S.sessions.findIndex(s=>s.id===id); if(idx<0) return;

    const orig = S.sessions[idx];

    const updated = Object.assign({}, orig, {

      categoryId: document.getElementById('s-category').value,

      date: document.getElementById('s-date').value.trim() || orig.date,

      status: document.getElementById('s-status').value,

      targetAmount: Math.max(0, Number(document.getElementById('s-target').value)||0),

      actualAmount: Math.max(0, Number(document.getElementById('s-actual').value)||0),

      minutes: Math.max(0, Number(document.getElementById('s-minutes').value)||0),

      note: document.getElementById('s-note').value.trim(),

    });

    updated.unit = getCategory(updated.categoryId).unit;
    const editCat=getCategory(updated.categoryId);
    const editHealth=categoryStatus(editCat).status;
    updated.healthStatus=editHealth;
    updated.xp=calculateConsumptionXP(editCat,updated.actualAmount,updated.minutes,editHealth).xp;

    S.sessions[idx] = updated;

    persistSessions(); S.modal=null; render();

  },

  deleteSessionFromModal(id){

    if(!confirm('Delete this history entry? The scheduler will recalculate as if it never happened.')) return;

    S.sessions = S.sessions.filter(s=>s.id!==id);
    S.histPage=0;

    persistSessions(); S.modal=null; render();

  },

  deleteSession(id){

    if(!confirm('Delete this history entry?')) return;

    S.sessions = S.sessions.filter(s=>s.id!==id);
    S.histPage=0;

    persistSessions(); render();

  },

  undoLastEntry(){

    if(S.sessions.length===0) return;

    const latest = S.sessions.reduce((a,b)=> a.timestamp>b.timestamp ? a : b);

    if(!confirm(`Undo your last logged entry (${getCategory(latest.categoryId).name}, ${latest.actualAmount} ${latest.unit})? It will be removed from history and given back to you as the next task.`)) return;

    S.sessions = S.sessions.filter(s=>s.id!==latest.id);

    // hand it back as the current task so nothing is lost

    const cat = getCategory(latest.categoryId);

    const {low, high} = suggestedAmount(cat);

    S.currentTask = { id: uid(), categoryId: cat.id, low, high, targetMid: latest.targetAmount || cat.target, unit: cat.unit, createdAt: Date.now(), reasons: ['Restored from undo'] };

    S.sessionActive = true; S.logging = false;

    persistSessions(); persistTask(); render();

  },

  exportJSON(){
    showDataProgress('Exporting complete MediaFlow backup', 'Preparing all portable app data...', 15);
    setTimeout(()=>{
      try{
        const now=new Date();
        const pad=n=>String(n).padStart(2,'0');
        const stamp=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        // v98: snapshot() is MediaFlow's canonical persisted account state.
        // Export that complete portable state instead of a hand-picked subset.
        const payload=Object.assign({},snapshot(),{
          backupFormat:'MediaFlow_Full_Backup',
          backupVersion:98,
          exportedAt:now.toISOString()
        });
        const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
        updateDataProgress(70,'Creating complete backup download...');
        triggerDownload(blob,`MediaFlow_Backup_${stamp}.json`);
        finishDataProgress(true,'Export successful','Your complete MediaFlow backup was downloaded.');
      }catch(e){ console.error(e); finishDataProgress(false,'Export failed','MediaFlow could not create the backup file.'); }
    },40);
  },

  importJSON(file){
    if(!file) return;
    showDataProgress('Importing MediaFlow backup','Reading backup file...',10);
    const reader=new FileReader();
    reader.onprogress=e=>{ if(e.lengthComputable) updateDataProgress(Math.round((e.loaded/e.total)*60),'Reading backup...'); };
    reader.onload=async ()=>{
      try{
        const data=JSON.parse(reader.result);
        
        updateDataProgress(70,'Applying imported data...');
        if(data.categories) S.categories=data.categories;
        if(Array.isArray(data.categoryOrder)){
          S.categoryOrder=data.categoryOrder.slice();
          v74ApplyCategoryOrder(S.categoryOrder);
        }
        if(data.library) S.library=sanitizeLibrary(data.library);
        if(data.sessions) S.sessions=data.sessions;
        if(data.settings){
          S.settings=Object.assign({},DEFAULT_SETTINGS,data.settings);
          S.settings.backup=Object.assign({},DEFAULT_SETTINGS.backup,data.settings?.backup||{});
          S.settings.leveling=Object.assign({},DEFAULT_SETTINGS.leveling,data.settings?.leveling||{});
          S.settings.leveling.unitXP=Object.assign({},DEFAULT_SETTINGS.leveling.unitXP,data.settings?.leveling?.unitXP||{});
          S.settings.leveling.rotationMultiplier=Object.assign({},DEFAULT_SETTINGS.leveling.rotationMultiplier,data.settings?.leveling?.rotationMultiplier||{});
        }
        // v98 full-backup fields. Old backups remain compatible because each field is optional.
        if(Object.prototype.hasOwnProperty.call(data,'currentTask')) S.currentTask=data.currentTask||null;
        if(Object.prototype.hasOwnProperty.call(data,'sessionActive')) S.sessionActive=!!data.sessionActive;
        if(Object.prototype.hasOwnProperty.call(data,'profilePicture')) S.profilePicture=String(data.profilePicture||'').trim();
        if(data.stopwatch&&typeof data.stopwatch==='object') S.stopwatch=Object.assign({running:false,startedAt:0,elapsed:0,resetValue:0},data.stopwatch);
        if(data.malLink&&typeof data.malLink==='object') S.malLink=Object.assign({username:'',mode:'anime'},data.malLink);
        if(data.xpLedger&&typeof data.xpLedger==='object') S.xpLedger=Object.assign({libraryAdditions:{}},data.xpLedger);
        if(Array.isArray(data.completionTimeline)) S.completionTimeline=data.completionTimeline;
        if(Array.isArray(data.activityLog)) S.activityLog=data.activityLog.slice(0,1000);
        if(Object.prototype.hasOwnProperty.call(data,'orderPlan')) S.orderPlan=v138NormalizeOrderPlan(data.orderPlan,S.library,S.categories);
        if(data.migrations&&typeof data.migrations==='object') S.migrations=data.migrations;
        normalizeSeasonalLibraryItems();
        v53InvalidateLibraryCache();
        v53InvalidateSessionCache();
        await saveState();
        render();
        finishDataProgress(true,'Import successful','Your MediaFlow backup was imported successfully.');
      }catch(e){ console.error(e); finishDataProgress(false,'Import failed','Could not read that file. Make sure it is a valid MediaFlow JSON backup.'); }
    };
    reader.onerror=()=>finishDataProgress(false,'Import failed','The file could not be read.');
    reader.readAsText(file);
  },

  importMalXml(file){
    if(!file) return;

    const reader=new FileReader();
    reader.onload=async ()=>{
      try{
        const text=reader.result||'';
        const isManga=/<manga(?:\s|>)/i.test(text);
        const tag=isManga?'manga':'anime';

        // Keep the low-memory streaming-style parser used by MediaFlow.
        const re=new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`,'gi');
        const blocks=[];
        let m;
        while((m=re.exec(text))!==null) blocks.push(m[1]);

        if(blocks.length===0){
          finishImportProgress(false,'Import failed','No entries found. Make sure this is a MAL list export XML.');
          return;
        }

        const statusMap={
          'Watching':'active','Reading':'active','Completed':'completed',
          'On-Hold':'paused','Dropped':'dropped',
          'Plan to Watch':'planned','Plan to Read':'planned'
        };

        const getTag=(block,name)=>{
          const x=block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`,'i'));
          return x?cleanTitle(x[1]):'';
        };

        const parseMalDate=(raw)=>{
          raw=String(raw||'').trim().slice(0,10);
          if(!/^\d{4}-\d{2}-\d{2}$/.test(raw) || raw==='0000-00-00')return 0;
          return Number(v135ParseDateInput(raw))||0;
        };

        const animeFamily=new Set(['seasonal','backlog','animemovies']);
        const mangaFamily=new Set(['manga','manhwa']);

        // v136 indexes the existing Library once. This avoids repeatedly scanning
        // a very large Library for every MAL row.
        const byMalId=new Map();
        const byTitle=new Map();
        for(const item of (S.library||[])){
          const mal=String(item?.externalIds?.mal??'').trim();
          if(mal && !byMalId.has(mal))byMalId.set(mal,item);

          const key=cleanTitle(item?.title||'').toLowerCase();
          if(key){
            let arr=byTitle.get(key);
            if(!arr){arr=[];byTitle.set(key,arr);}
            arr.push(item);
          }
        }

        showImportProgress(`Importing MyAnimeList ${isManga?'manga':'anime'}`,blocks.length);

        let added=0,updated=0,skipped=0,startDates=0,finishDates=0;
        const touched=new Map();
        const BATCH=30;
        const SAVE_EVERY=210;

        for(let r=0;r<blocks.length;r+=BATCH){
          const endBatch=Math.min(r+BATCH,blocks.length);

          for(let j=r;j<endBatch;j++){
            const block=blocks[j];
            const title=getTag(block,isManga?'manga_title':'series_title');
            if(!title){skipped++;continue;}const malId=String(
              getTag(block,isManga?'manga_mangadb_id':'series_animedb_id') ||
              getTag(block,'series_animedb_id') ||
              getTag(block,'manga_mangadb_id') ||
              getTag(block,'series_mangadb_id') ||
              ''
            ).trim();

            const seriesType=getTag(block,isManga?'manga_type':'series_type').toLowerCase();
            const progress=Number(getTag(block,isManga?'my_read_chapters':'my_watched_episodes'))||0;
            const total=Number(getTag(block,isManga?'manga_chapters':'series_episodes') || getTag(block,isManga?'series_chapters':'series_episodes'))||null;
            const malStatus=getTag(block,'my_status');
            const status=statusMap[malStatus]||'planned';
            const score=Math.max(0,Math.min(10,Number(getTag(block,'my_score'))||0));

            const startedAt=parseMalDate(getTag(block,'my_start_date'));
            const finishAt=parseMalDate(getTag(block,'my_finish_date'));

            let categoryId=isManga?'manga':'backlog';
            if(isManga&&/manhwa|manhua/.test(seriesType))categoryId='manhwa';
            if(!isManga){
              if(seriesType==='movie')categoryId='animemovies';
              else if(seriesType==='tv'&&/currently airing/i.test(getTag(block,'series_status')))categoryId='seasonal';
            }
            if(!S.categories.find(c=>c.id===categoryId))categoryId=isManga?'manga':'backlog';

            let existing=malId?byMalId.get(malId)||null:null;

            if(!existing){
              const candidates=byTitle.get(title.toLowerCase())||[];
              existing=
                candidates.find(i=>String(i.categoryId||'')===String(categoryId)) ||
                candidates.find(i=>(isManga?mangaFamily:animeFamily).has(String(i.categoryId||''))) ||
                (candidates.length===1?candidates[0]:null);
            }

            if(existing){
              existing.title=title;
              existing.progress=progress;
              if(total)existing.total=total;
              existing.status=status;
              existing.source='mal';
              existing.tags=[...new Set([...(Array.isArray(existing.tags)?existing.tags:[]),'MAL'])];
              existing.externalIds=Object.assign({},existing.externalIds||{},malId?{mal:malId}:{});

              // Only move a title automatically inside the compatible MAL family.
              const family=isManga?mangaFamily:animeFamily;
              if(family.has(String(existing.categoryId||'')))existing.categoryId=categoryId;

              if(score>0)existing.rating=score;

              // Blank/0000 MAL dates never erase a real local Start/Finish Date.
              if(startedAt){
                existing.startedAt=startedAt;
                existing.startedAtSource='mal';
                startDates++;
              }

              if(status==='completed'){
                if(finishAt){
                  existing.completedAt=finishAt;
                  finishDates++;
                }
                // If MAL has no finish date, preserve an existing local completedAt.
              }else{
                // Keep MediaFlow's status/date invariant when MAL says the title is
                // not completed.
                existing.completedAt=null;
              }

              existing.modifiedAt=Date.now();
              touched.set(String(existing.id),existing);
              if(malId)byMalId.set(malId,existing);
              updated++;
            }else{
              const item={
                id:uid(),
                title,categoryId,progress,total,status,
                priority:'medium',
                estimatedMinutes:null,
                tags:['MAL'],
                source:'mal',
                rating:score>0?score:null,
                externalIds:malId?{mal:malId}:{},
                startedAt:startedAt||null,
                startedAtSource:startedAt?'mal':null,
                completedAt:status==='completed'?(finishAt||null):null,
                createdAt:Date.now(),
                modifiedAt:Date.now()
              };

              S.library.push(item);
              touched.set(String(item.id),item);
              if(startedAt)startDates++;
              if(item.completedAt)finishDates++;

              if(malId)byMalId.set(malId,item);
              const key=title.toLowerCase();
              let arr=byTitle.get(key);
              if(!arr){arr=[];byTitle.set(key,arr);}
              arr.push(item);
              added++;
            }
          }

          const done=endBatch;
          updateImportProgress(
            done,blocks.length,added,updated,skipped,
            `Processing ${done.toLocaleString()} of ${blocks.length.toLocaleString()} · ${startDates.toLocaleString()} start dates · ${finishDates.toLocaleString()} finish dates`
          );

          // Keep periodic safety saves without doing an unnecessary final save
          // before the completion timeline has been synchronized.
          if(done%SAVE_EVERY===0 && done<blocks.length)await saveState();
          await yieldToBrowser();
        }

        // Update completion timeline in one pass instead of filtering it once per
        // imported title.
        const touchedIds=new Set(touched.keys());
        S.completionTimeline=(S.completionTimeline||[]).filter(
          x=>!touchedIds.has(String(x?.libraryId||''))
        );
        for(const item of touched.values()){
          if(item?.status==='completed' && Number(item.completedAt)>0){
            S.completionTimeline.push({
              libraryId:item.id,
              title:cleanTitle(item.title),
              categoryId:item.categoryId,
              completedAt:Number(item.completedAt)
            });
          }
        }

        normalizeSeasonalLibraryItems();
        await saveState();

        finishImportProgress(
          true,
          'MyAnimeList merge complete',
          `${added.toLocaleString()} added · ${updated.toLocaleString()} updated · ${startDates.toLocaleString()} start dates · ${finishDates.toLocaleString()} finish dates${skipped?` · ${skipped.toLocaleString()} skipped`:''}.`
        );
        render();
      }catch(e){
        console.error('MAL import failed',e);
        closeImportProgress();
        alert("Couldn't parse that file as a MAL export XML.");
      }
    };
    reader.readAsText(file);
  },

  importCsv(file){
    if(!file) return;

    const reader=new FileReader();
    reader.onload=async ()=>{
      try{
        const text=reader.result||'';
        if(!text.trim()){alert('That CSV looks empty.');return;}

        // Incremental CSV parser: it keeps its cursor and yields between batches,
        // so a very large file does not monopolize the main UI thread.
        const parser={i:0,row:[],field:'',inQuotes:false,done:false};
        const nextRows=(maxRows)=>{
          const out=[];
          while(parser.i<text.length&&out.length<maxRows){
            const c=text[parser.i++];
            if(parser.inQuotes){
              if(c==='"'){
                if(text[parser.i]==='"'){parser.field+='"';parser.i++;}
                else parser.inQuotes=false;
              }else parser.field+=c;
            }else{
              if(c==='"') parser.inQuotes=true;
              else if(c===','){parser.row.push(parser.field);parser.field='';}
              else if(c==='\\n'){
                parser.row.push(parser.field);parser.field='';
                if(parser.row.some(f=>f&&f.trim())) out.push(parser.row);
                parser.row=[];
              }else if(c==='\\r'){
                // Ignore CR. LF terminates the row.
              }else parser.field+=c;
            }
          }

          if(parser.i>=text.length&&!parser.done){
            if(parser.field.length||parser.row.length){
              parser.row.push(parser.field);
              if(parser.row.some(f=>f&&f.trim())) out.push(parser.row);
            }
            parser.row=[];parser.field='';parser.done=true;
          }
          return out;
        };

        const first=nextRows(1);
        if(first.length===0){alert('That CSV looks empty.');return;}

        const header=first[0].map(h=>h.trim().toLowerCase());
        const find=(...names)=>header.findIndex(h=>names.some(n=>h.includes(n)));
        const iTitle=find('title','name');
        const iProgress=find('progress','watched','read','chapters_read','episodes_watched');
        const iTotal=find('total','episodes','chapters');
        const iStatus=find('status');

        if(iTitle<0){alert('Could not find a "title" column in that CSV.');return;}

        // Newline count is an intentionally cheap estimate for the progress bar.
        const estimatedTotal=Math.max(1,(text.match(/\\n/g)||[]).length);
        showImportProgress('Importing CSV',estimatedTotal);

        let processed=0,added=0,updated=0,skipped=0;
        const BATCH=40;
        const SAVE_EVERY=200;

        while(!parser.done){
          const rows=nextRows(BATCH);
          if(rows.length===0){await yieldToBrowser();continue;}

          for(const row of rows){
            processed++;
            if(!row||!row[iTitle]){skipped++;continue;}

            const title=cleanTitle(row[iTitle]);
            if(!title){skipped++;continue;}

            const progress=iProgress>=0?Number(row[iProgress])||0:0;
            const total=iTotal>=0&&row[iTotal]?Number(row[iTotal])||null:null;
            const rawStatus=iStatus>=0?row[iStatus].trim().toLowerCase():'';
            const status=/complet/.test(rawStatus)?'completed':
              /watch|read|active|progress/.test(rawStatus)?'active':
              /hold|pause/.test(rawStatus)?'paused':
              /drop/.test(rawStatus)?'dropped':'planned';

            const categoryId=S.categories.find(c=>c.enabled)?.id||S.categories[0]?.id;
            if(!categoryId){skipped++;continue;}

            const existing=S.library.find(i=>cleanTitle(i.title).toLowerCase()===title.toLowerCase());
            if(existing){
              existing.progress=progress;
              if(total) existing.total=total;
              existing.status=status;
              existing.source='simkl';
              updated++;
            }else{
              S.library.push({
                id:uid(),title,categoryId,progress,total,status,
                priority:'medium',estimatedMinutes:null,tags:['imported'],source:'simkl'
              });
              added++;
            }
          }

          updateImportProgress(processed,estimatedTotal,added,updated,skipped,`Processing rows... ${processed.toLocaleString()} processed`);
          if(processed%SAVE_EVERY<BATCH) await saveState();
          await yieldToBrowser();
        }

        await saveState();
        finishImportProgress(true,`Import successful`,`Imported ${added} added, ${updated} updated${skipped?', '+skipped+' skipped':''}.`);
        render();
      }catch(e){
        console.error('CSV import failed',e);
        finishImportProgress(false,'Import failed',"Couldn't parse that CSV file.");
      }
    };
    reader.readAsText(file);
  },

  exportCSV(){

    const header = ['date','time','category','target','actual','unit','minutes','status','note'];

    const rows = S.sessions.slice().sort((a,b)=>a.timestamp-b.timestamp).map(s=>{

      const cat = getCategory(s.categoryId);

      const d = new Date(s.timestamp);

      return [s.date, d.toLocaleTimeString(), cat.name, s.targetAmount, s.actualAmount, s.unit, s.minutes, s.status, (s.note||'').replace(/,/g,';')];

    });

    const csv = [header.join(','), ...rows.map(r=>r.join(','))].join('\n');

    triggerDownload(new Blob([csv],{type:'text/csv'}), `mediaflow-history-${todayISO()}.csv`);

  },

  resetAll(){

    if(!confirm('This deletes ALL MediaFlow data — categories, library, history, settings. This cannot be undone. Continue?')) return;

    S.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));

    S.library = []; S.sessions = []; S.settings = Object.assign({}, DEFAULT_SETTINGS);

    S.currentTask = null; S.sessionActive = false;

    persistCategories(); persistLibrary(); persistSessions(); persistSettings(); persistTask();

    render();

  },

};

window.App = App;

function parseCsvText(text){

  const rows = []; let row=[]; let field=''; let inQuotes=false;

  for(let i=0;i<text.length;i++){

    const c = text[i];

    if(inQuotes){

      if(c==='"'){ if(text[i+1]==='"'){ field+='"'; i++; } else inQuotes=false; }

      else field+=c;

    } else {

      if(c==='"') inQuotes=true;

      else if(c===','){ row.push(field); field=''; }

      else if(c==='\n'){ row.push(field); rows.push(row); row=[]; field=''; }

      else if(c==='\r'){ /* skip */ }

      else field+=c;

    }

  }

  if(field.length || row.length){ row.push(field); rows.push(row); }

  return rows.filter(r=>r.some(f=>f&&f.trim()));

}


function showDataProgress(title, subtitle, pct){
  let el=document.getElementById('mediaflow-data-progress');
  if(!el){el=document.createElement('div');el.id='mediaflow-data-progress';document.body.appendChild(el);}
  el.className='import-overlay';
  el.innerHTML=`<div class="import-card"><div class="import-title" id="data-progress-title">${escapeHtml(title)}</div><div class="import-sub" id="data-progress-sub">${escapeHtml(subtitle||'Working...')}</div><div class="import-track"><div class="import-fill" id="data-progress-fill" style="width:${pct||0}%"></div></div><div class="import-meta"><span>MediaFlow data</span><span id="data-progress-pct">${pct||0}%</span></div></div>`;
}
function updateDataProgress(pct,subtitle){
  const p=Math.max(0,Math.min(100,Number(pct)||0));
  const fill=document.getElementById('data-progress-fill');if(fill)fill.style.width=p+'%';
  const pe=document.getElementById('data-progress-pct');if(pe)pe.textContent=p+'%';
  const sub=document.getElementById('data-progress-sub');if(sub&&subtitle)sub.textContent=subtitle;
}
function finishDataProgress(success,title,subtitle){
  const el=document.getElementById('mediaflow-data-progress');if(!el)return;
  const t=document.getElementById('data-progress-title');if(t)t.textContent=(success?'✓ ':'✕ ')+title;
  const sub=document.getElementById('data-progress-sub');if(sub)sub.textContent=subtitle||'';
  updateDataProgress(100,subtitle);
  setTimeout(()=>el.remove(),1200);
}
function closeDataProgress(){const el=document.getElementById('mediaflow-data-progress');if(el)el.remove();}

function showImportProgress(title, total){
  let el=document.getElementById('mediaflow-import-progress');
  if(!el){ el=document.createElement('div'); el.id='mediaflow-import-progress'; document.body.appendChild(el); }
  el.className='import-overlay';
  el.innerHTML=`
    <div class="import-card">
      <div class="import-title">${escapeHtml(title)}</div>
      <div class="import-sub" id="import-progress-sub">Reading your file without freezing the page...</div>
      <div class="import-track"><div class="import-fill" id="import-progress-fill"></div></div>
      <div class="import-meta"><span id="import-progress-count">0 / ${total.toLocaleString()}</span><span id="import-progress-pct">0%</span></div>
      <div class="import-stats">
        <div class="import-stat"><b id="import-added">0</b><span>Added</span></div>
        <div class="import-stat"><b id="import-updated">0</b><span>Updated</span></div>
        <div class="import-stat"><b id="import-skipped">0</b><span>Skipped</span></div>
      </div>
    </div>`;
}
function updateImportProgress(done,total,added,updated,skipped,phase){
  const d=Number.isFinite(Number(done))?Number(done):0;
  const t=Number.isFinite(Number(total))?Number(total):0;
  const aNum=Number.isFinite(Number(added))?Number(added):0;
  const uNum=Number.isFinite(Number(updated))?Number(updated):0;
  const sNum=Number.isFinite(Number(skipped))?Number(skipped):0;
  const pct=t>0?Math.min(100,Math.round(d/t*100)):0;
  const fill=document.getElementById('import-progress-fill'); if(fill) fill.style.width=pct+'%';
  const count=document.getElementById('import-progress-count'); if(count) count.textContent=t>0?`${d.toLocaleString()} / ${t.toLocaleString()}`:`${d.toLocaleString()} processed`;
  const pctEl=document.getElementById('import-progress-pct'); if(pctEl) pctEl.textContent=pct+'%';
  const sub=document.getElementById('import-progress-sub'); if(sub) sub.textContent=phase||'Importing...';
  const a=document.getElementById('import-added'); if(a) a.textContent=aNum.toLocaleString();
  const u=document.getElementById('import-updated'); if(u) u.textContent=uNum.toLocaleString();
  const s=document.getElementById('import-skipped'); if(s) s.textContent=sNum.toLocaleString();
}
function closeImportProgress(){
  const el=document.getElementById('mediaflow-import-progress'); if(el) el.remove();
}
function finishImportProgress(success,title,message){
  const el=document.getElementById('mediaflow-import-progress');
  if(!el) return;
  const sub=document.getElementById('import-progress-sub'); if(sub) sub.textContent=message||'';
  const pct=document.getElementById('import-progress-pct'); if(pct) pct.textContent='100%';
  const fill=document.getElementById('import-progress-fill'); if(fill) fill.style.width='100%';
  const heading=el.querySelector('.import-title'); if(heading) heading.textContent=(success?'✓ ':'✕ ')+title;
  setTimeout(()=>el.remove(),1200);
}
function yieldToBrowser(){
  return new Promise(resolve=>setTimeout(resolve,0));
}

function triggerDownload(blob, filename){

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');

  a.href = url; a.download = filename; document.body.appendChild(a); a.click();

  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 200);

}

/* ============================================================

   DESKTOP SIDEBAR RESIZING

   ============================================================ */

const SIDEBAR_WIDTH_KEY='mf_sidebar_width';
const SIDEBAR_MIN=190, SIDEBAR_MAX=380;
function applySidebarWidth(width){
  const w=Math.max(SIDEBAR_MIN,Math.min(SIDEBAR_MAX,Number(width)||236));
  document.documentElement.style.setProperty('--sidebar-width',w+'px');
  try{localStorage.setItem(SIDEBAR_WIDTH_KEY,String(w));}catch(e){}
  return w;
}
function loadSidebarWidth(){try{const v=Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));if(v)applySidebarWidth(v);}catch(e){}}
let sidebarResizeState=null;
function beginSidebarResize(e){
  if(window.innerWidth<=860)return;
  e.preventDefault();
  e.stopPropagation();
  const handle=e.currentTarget||document.querySelector('.sidebar-resizer');
  const sidebar=document.querySelector('.sidebar');
  if(!sidebar)return;
  sidebarResizeState={startX:e.clientX,startWidth:sidebar.getBoundingClientRect().width,handle};
  document.body.classList.add('sidebar-resizing');
  if(handle?.setPointerCapture && e.pointerId!=null){try{handle.setPointerCapture(e.pointerId);}catch(err){}}
  handle?.addEventListener('pointermove',onSidebarResize);
  handle?.addEventListener('pointerup',endSidebarResize,{once:true});
  handle?.addEventListener('pointercancel',endSidebarResize,{once:true});
}
function onSidebarResize(e){
  if(!sidebarResizeState)return;
  e.preventDefault();
  applySidebarWidth(sidebarResizeState.startWidth+(e.clientX-sidebarResizeState.startX));
}
function endSidebarResize(e){
  const state=sidebarResizeState;
  sidebarResizeState=null;
  document.body.classList.remove('sidebar-resizing');
  if(state?.handle){
    state.handle.removeEventListener('pointermove',onSidebarResize);
    try{if(e?.pointerId!=null && state.handle.releasePointerCapture)state.handle.releasePointerCapture(e.pointerId);}catch(err){}
  }
}
window.beginSidebarResize=beginSidebarResize;
window.onSidebarResize=onSidebarResize;
window.endSidebarResize=endSidebarResize;
function bindSidebarResizer(){
  const handle=document.querySelector('.sidebar-resizer');
  if(!handle||handle.dataset.bound==='1')return;
  handle.dataset.bound='1';
  handle.addEventListener('pointerdown',beginSidebarResize);
  handle.addEventListener('dblclick',()=>applySidebarWidth(236));
  handle.addEventListener('keydown',e=>{
    if(window.innerWidth<=860)return;
    const current=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width'))||236;
    if(e.key==='ArrowLeft'){e.preventDefault();applySidebarWidth(current-12);}
    if(e.key==='ArrowRight'){e.preventDefault();applySidebarWidth(current+12);}
    if(e.key==='Home'){e.preventDefault();applySidebarWidth(SIDEBAR_MIN);}
    if(e.key==='End'){e.preventDefault();applySidebarWidth(SIDEBAR_MAX);}
  });
}
function autoFitSidebarToProfile(){
  if(window.innerWidth<=860)return;
  const sidebar=document.querySelector('.sidebar');
  const name=document.querySelector('.account-menu-email');
  if(!sidebar||!name)return;
  const text=String(name.textContent||'').trim();
  // Fit normal names/emails while keeping the sidebar compact. Long emails are capped.
  const target=Math.max(236,Math.min(SIDEBAR_MAX,Math.ceil(text.length*7.1+154)));
  const current=sidebar.getBoundingClientRect().width;
  if(current<target)applySidebarWidth(target);
}
loadSidebarWidth();




/* ============================================================
   V16 FEATURES: BACKUPS, THEMES, STOPWATCH, MAL LINK, STATS
   ============================================================ */
const BACKUP_DB='MediaFlowBackupDB';
let backupFolderHandle=null, backupTimer=null;
function applyTheme(theme){
  const t=['dark','light','amoled'].includes(theme)?theme:'dark';
  document.documentElement.dataset.theme=t;
  if(S.settings)S.settings.theme=t;
  try{localStorage.setItem('mf_theme',t);}catch(e){}
}
function initTheme(){try{applyTheme(S.settings?.theme||localStorage.getItem('mf_theme')||'dark');}catch(e){applyTheme('dark');}}
function backupSnapshot(){return JSON.parse(JSON.stringify(snapshot()));}
async function openBackupFolder(){
  if(!window.showDirectoryPicker){alert('Automatic file backups need a Chromium-based desktop browser with File System Access support.');return;}
  try{backupFolderHandle=await window.showDirectoryPicker({mode:'readwrite'}); await saveBackupNow(true); await configureBackupPersistence(); render();}
  catch(e){if(e?.name!=='AbortError')alert('Could not access that folder.');}
}
function idbOpen(){return new Promise((resolve,reject)=>{const r=indexedDB.open(BACKUP_DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('handles');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function configureBackupPersistence(){if(!backupFolderHandle)return;try{const db=await idbOpen();const tx=db.transaction('handles','readwrite');tx.objectStore('handles').put(backupFolderHandle,'folder');await new Promise((res,rej)=>{tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});db.close();}catch(e){}}
async function restoreBackupFolder(){try{const db=await idbOpen();const tx=db.transaction('handles','readonly');const r=tx.objectStore('handles').get('folder');const h=await new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});db.close();if(h){const p=await h.queryPermission({mode:'readwrite'});if(p==='granted')backupFolderHandle=h;}}catch(e){}}
function backupFilename(){const d=new Date();const z=n=>String(n).padStart(2,'0');return `mediaflow-backup-${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}.json`;}
async function saveBackupNow(manual=false){
  if(!S.settings?.backup?.enabled && !manual)return;
  if(!backupFolderHandle){if(manual)await openBackupFolder();return;}
  try{
    const filename=S.settings.backup.mode==='single'?(S.settings.backup.fileName||'mediaflow-backup.json'):backupFilename();
    const fh=await backupFolderHandle.getFileHandle(filename,{create:true});const w=await fh.createWritable();await w.write(JSON.stringify(backupSnapshot(),null,2));await w.close();
    S.settings.backup.lastBackup=Date.now(); if(!manual) await persistSettings();
    if(manual)showToast('Backup saved ✓');
  }catch(e){console.warn('Backup failed',e);if(manual)alert('Backup could not be written. Re-select the backup folder if needed.');}
}
function restartBackupTimer(){clearInterval(backupTimer);backupTimer=null;if(!S.settings?.backup?.enabled)return;const ms=Math.max(1,Number(S.settings.backup.interval)||60)*60000;backupTimer=setInterval(()=>saveBackupNow(false),ms);}
function showToast(msg){let t=document.getElementById('mf-toast');if(!t){t=document.createElement('div');t.id='mf-toast';t.style.cssText='position:fixed;right:18px;bottom:18px;background:var(--panel-raised);color:var(--text);border:1px solid var(--border);padding:10px 14px;border-radius:10px;z-index:2000;box-shadow:0 12px 30px #0005;font-size:12px;font-weight:700;';document.body.appendChild(t);}t.textContent=msg;clearTimeout(window.__mfToast);window.__mfToast=setTimeout(()=>t.remove(),2200);}
function stopwatchTick(){if(!S.stopwatch)return;const el=document.getElementById('stopwatch-display');if(!el)return;const elapsed=S.stopwatch.running?(S.stopwatch.elapsed+(Date.now()-S.stopwatch.startedAt)):S.stopwatch.elapsed;el.textContent=fmtStopwatch(elapsed);}
function fmtStopwatch(ms){const sec=Math.max(0,Math.floor((Number(ms)||0)/1000));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
function stopwatchStart(){if(S.stopwatch.running)return;S.stopwatch.running=true;S.stopwatch.startedAt=Date.now();persistTask();render();clearInterval(window.__sw);window.__sw=setInterval(stopwatchTick,250);}
function stopwatchPause(){if(!S.stopwatch.running)return;S.stopwatch.elapsed+=Date.now()-S.stopwatch.startedAt;S.stopwatch.running=false;S.stopwatch.startedAt=0;persistTask();render();clearInterval(window.__sw);}
function stopwatchSetTime(){if(S.stopwatch.running)return;const h=Math.max(0,Math.min(999,Number(document.getElementById('sw-hours')?.value)||0));const m=Math.max(0,Math.min(59,Number(document.getElementById('sw-minutes')?.value)||0));const sec=Math.max(0,Math.min(59,Number(document.getElementById('sw-seconds')?.value)||0));const ms=Math.round((h*3600+m*60+sec)*1000);S.stopwatch.elapsed=ms;S.stopwatch.resetValue=ms;S.stopwatch.startedAt=0;persistTask();render();showToast(`Stopwatch set to ${fmtStopwatch(ms)} ✓`);}
function stopwatchReset(){if(S.stopwatch.running){S.stopwatch.running=false;S.stopwatch.startedAt=0;}S.stopwatch.elapsed=Math.max(0,Number(S.stopwatch.resetValue)||0);persistTask();render();clearInterval(window.__sw);}
function stopwatchClear(){S.stopwatch={running:false,startedAt:0,elapsed:0,resetValue:0};persistTask();render();clearInterval(window.__sw);}
function stopwatchUseMinutes(){const ms=S.stopwatch.running?(S.stopwatch.elapsed+Date.now()-S.stopwatch.startedAt):S.stopwatch.elapsed;S.logDraft.minutes=Math.max(0,Math.round(ms/60000));render();}
function stopwatchHtml(){const sw=S.stopwatch||{running:false,startedAt:0,elapsed:0,resetValue:0};const ms=sw.running?(sw.elapsed+Date.now()-sw.startedAt):(sw.elapsed||0);const base=Math.max(0,Number(sw.resetValue)||0);const baseSec=Math.floor(base/1000),bh=Math.floor(baseSec/3600),bm=Math.floor(baseSec%3600/60),bs=baseSec%60;return `<div class="card stopwatch-card"><div class="section-label">STOPWATCH</div><div class="stopwatch-display" id="stopwatch-display">${fmtStopwatch(ms)}</div><div class="stopwatch-custom"><div class="stopwatch-time-field"><label>HOURS</label><input id="sw-hours" class="input" type="number" min="0" max="999" step="1" value="${bh}" ${sw.running?'disabled':''}></div><div class="stopwatch-time-field"><label>MINUTES</label><input id="sw-minutes" class="input" type="number" min="0" max="59" step="1" value="${bm}" ${sw.running?'disabled':''}></div><div class="stopwatch-time-field"><label>SECONDS</label><input id="sw-seconds" class="input" type="number" min="0" max="59" step="1" value="${bs}" ${sw.running?'disabled':''}></div><button class="btn" onclick="App.stopwatchSetTime()" ${sw.running?'disabled':''}>Set time</button></div>${base>0?`<small class="hint stopwatch-custom-note" style="display:block">Custom starting time: ${fmtStopwatch(base)} · Reset returns here.</small>`:''}<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn btn-primary" onclick="App.stopwatchStart()" ${sw.running?'disabled':''}>${sw.running?'Running…':'Start'}</button><button class="btn" onclick="App.stopwatchPause()" ${!sw.running?'disabled':''}>Pause</button><button class="btn btn-ghost" onclick="App.stopwatchReset()">Reset</button><button class="btn btn-ghost" onclick="App.stopwatchClear()">Clear to 00:00:00</button>${S.logging?'<button class="btn" onclick="App.stopwatchUseMinutes()">Use for minutes</button>':''}</div><small class="hint" style="display:block;text-align:center;margin-top:9px;">Set any starting time, press Start, and the stopwatch continues upward from there.</small></div>`;}
function priorityLabel(p){return (p||'medium')[0].toUpperCase()+(p||'medium').slice(1);}
function choosePriority(id){const item=S.library.find(i=>i.id===id);if(!item)return;S.modal={type:'priority',data:{id:item.id,title:cleanTitle(item.title),priority:item.priority||'medium'}};render();}
function priorityModalHtml(d){
  const current=d?.priority||'medium';
  const options=[
    {id:'low',label:'Low',icon:'▼',desc:'A lower-priority title. The scheduler will generally give it less weight.'},
    {id:'medium',label:'Medium',icon:'●',desc:'The normal priority level used by default.'},
    {id:'high',label:'High',icon:'▲',desc:'A title you want the scheduler to pay more attention to.'}
  ];
  return `<div class="priority-modal">
    <div class="modal-title">Set priority</div>
    <div style="color:var(--text-dim);font-size:13px;line-height:1.5;margin-bottom:16px;">Choose the priority for <b>${escapeHtml(d?.title||'this title')}</b>.</div>
    <div style="display:grid;gap:8px;">${options.map(o=>`<button type="button" class="priority-choice ${current===o.id?'selected':''}" onclick="App.setPriorityChoice('${escapeHtml(d.id)}','${o.id}')"><span class="priority-choice-icon">${o.icon}</span><span style="text-align:left;flex:1;"><b>${o.label}</b><small>${o.desc}</small></span><span class="priority-choice-check">${current===o.id?'✓':''}</span></button>`).join('')}</div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px;"><button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button></div>
  </div>`;
}
function chooseStatusForLibrary(id){const item=S.library.find(i=>i&&i.id===id);if(!item)return;S.modal={type:'libraryStatus',data:{id:item.id,title:cleanTitle(item.title),status:item.status||'planned'}};render();}
function libraryStatusModalHtml(d){
  const current=d?.status||'planned';
  const options=[
    {id:'planned',label:'Plan to Watch',icon:'○',desc:'Planned for later, but not started yet.'},
    {id:'active',label:'Watching',icon:'▶',desc:'Currently being watched or read.'},
    {id:'paused',label:'On Hold',icon:'Ⅱ',desc:'Temporarily set aside without abandoning it.'},
    {id:'completed',label:'Completed',icon:'✓',desc:'Finished and kept as part of your history.'},
    {id:'dropped',label:'Dropped',icon:'×',desc:'Abandoned and excluded from recommendations.'}
  ];
  return `<div class="priority-modal"><div class="modal-title">Set status</div><div style="color:var(--text-dim);font-size:13px;line-height:1.5;margin-bottom:16px;">Choose the status for <b>${escapeHtml(d?.title||'this title')}</b>.</div><div class="choice-list">${options.map(o=>`<button type="button" class="status-choice ${current===o.id?'selected':''}" onclick="App.setLibraryStatus('${escapeHtml(d.id)}','${o.id}')"><span class="choice-icon">${o.icon}</span><span style="text-align:left;flex:1"><b>${o.label}</b><small style="display:block;color:var(--text-mute);font-size:11px;line-height:1.35;margin-top:2px">${o.desc}</small></span><span class="choice-check">${current===o.id?'✓':''}</span></button>`).join('')}</div><div class="modal-actions"><button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button></div></div>`;
}
function chooseCategoryForLibrary(id){const item=S.library.find(i=>i&&i.id===id);if(!item)return;S.modal={type:'libraryCategory',data:{id:item.id,title:cleanTitle(item.title),categoryId:item.categoryId}};render();}
function libraryCategoryModalHtml(d){
  const current=d?.categoryId;
  const cats=S.categories.filter(c=>c.enabled!==false);
  return `<div class="priority-modal"><div class="modal-title">Set category</div><div style="color:var(--text-dim);font-size:13px;line-height:1.5;margin-bottom:16px;">Choose the category for <b>${escapeHtml(d?.title||'this title')}</b>. The category controls its rotation, units, and scheduler behavior.</div><div class="choice-list">${cats.map(c=>`<button type="button" class="category-choice ${current===c.id?'selected':''}" onclick="App.setLibraryCategory('${escapeHtml(d.id)}','${escapeHtml(c.id)}')"><span class="choice-icon" style="color:${escapeHtml(c.color||'var(--flow)')}">${c.icon}</span><span style="text-align:left;flex:1"><b>${escapeHtml(c.name)}</b><small style="display:block;color:var(--text-mute);font-size:11px;line-height:1.35;margin-top:2px">${escapeHtml(unitLabel(c.unit,c.target))} · ${Number(c.minutesPerUnit)||0} min/unit</small></span><span class="choice-check">${current===c.id?'✓':''}</span></button>`).join('')}</div><div class="modal-actions"><button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button></div></div>`;
}
function emptyLibraryAdvanced(){
  if(!S.library.length){showToast('Library is already empty');return;}
  S.modal={type:'emptyLibrary',data:{count:S.library.length}};
  render();
}

async function confirmEmptyLibrary(mode){
  if(!S.library.length){S.modal=null;render();return;}
  S.library=[];
  if(mode==='clearTask'){S.currentTask=null;S.sessionActive=false;}
  S.modal=null;
  await saveState();
  render();
  showToast('Library emptied');
}
async function malFetchPage(username,type,page){
  const candidates=[
    `https://api.jikan.moe/v4/users/${encodeURIComponent(username)}/${type}list?page=${page}&limit=300`,
    `https://api.jikan.moe/v4/users/${encodeURIComponent(username)}/${type}list/full?page=${page}`
  ];
  let lastErr=null;
  for(const url of candidates){
    for(let attempt=0;attempt<5;attempt++){
      try{
        const r=await fetch(url,{headers:{Accept:'application/json'}});
        if(r.ok)return await r.json();
        lastErr=new Error(`MAL ${type} sync failed (${r.status})`);
        if(![408,429,500,502,503,504].includes(r.status))throw lastErr;
        const ra=Number(r.headers.get('Retry-After'))||0;
        await new Promise(resolve=>setTimeout(resolve,ra>0?ra*1000:Math.min(15000,1200*2**attempt)));
      }catch(e){
        lastErr=e;
        if(attempt<4)await new Promise(resolve=>setTimeout(resolve,Math.min(15000,1200*2**attempt)));
      }
    }
  }
  throw lastErr||new Error(`MAL ${type} sync failed`);
}
async function malSync(){
  const username=(S.malLink?.username||'').trim();
  if(!username){alert('Enter your MyAnimeList username first.');return;}
  const mode=S.malLink.mode||'anime', types=mode==='both'?['anime','manga']:[mode];
  showImportProgress('MAL sync',0);
  updateImportProgress(0,0,0,0,0,'Starting…');
  let total=0,added=0,updated=0;
  try{
    for(const type of types){
      let page=1,hasNext=true;
      while(hasNext){
        updateImportProgress(1,`Fetching ${type} page ${page}…`);
        const j=await malFetchPage(username,type,page), rows=Array.isArray(j.data)?j.data:[];
        const apiTotal=Number(j.pagination?.items?.total)||0;
        const knownTotal=Number.isFinite(apiTotal)&&apiTotal>0?apiTotal:0;
        const pageDoneBefore=total;
        for(let offset=0;offset<rows.length;offset+=20){
          const batch=rows.slice(offset,offset+20);
          for(const row of batch){
            const d=row.node||row||{}, my=row.list_status||row.listStatus||{}, title=cleanTitle(d.title);
            if(!title)continue;
            const catId=type==='manga'?'manga':(d.airing?'seasonal':'backlog');
            const prog=Number(my.num_episodes_watched??my.num_chapters_read??0)||0;
            const tot=Number(d.num_episodes??d.num_chapters??0)||null;
            let item=S.library.find(i=>cleanTitle(i.title).toLowerCase()===title.toLowerCase()&&['backlog','seasonal','manga'].includes(i.categoryId));
            if(!item){
              item={id:uid(),title,categoryId:catId,progress:prog,total:tot,status:my.status==='completed'?'completed':(my.status==='watching'||my.status==='reading'?'active':'planned'),priority:'medium',estimatedMinutes:null,tags:['MAL'],source:'mal'};
              S.library.push(item);added++;
            }else{
              item.progress=Math.max(Number(item.progress)||0,prog);
              if(tot)item.total=tot;
              if(catId==='seasonal'&&item.status!=='completed')item.categoryId='seasonal';
              item.tags=[...new Set([...(item.tags||[]),'MAL'])]; item.source='mal'; updated++;
            }
          }
          total+=batch.length;
          const progressTotal=knownTotal>0?knownTotal:Math.max(total,1);
          const progressDone=knownTotal>0?Math.min(total,knownTotal):total;
          updateImportProgress(progressDone,progressTotal,added,updated,0,`Processed ${total.toLocaleString()} ${type} titles…`);
          await yieldToBrowser();
        }
        hasNext=!!j.pagination?.has_next; page++;
        await new Promise(resolve=>setTimeout(resolve,750));
      }
    }
    normalizeSeasonalLibraryItems(); await persistLibrary();
    finishImportProgress(true,'MAL sync complete',`Added ${added}, updated ${updated}, processed ${total} titles.`); render();
  }catch(e){console.error(e);finishImportProgress(false,'MAL sync failed',e.message||String(e));}
}

function renderProfileStatHero(){const url=getAvatarUrl();return `<div class="profile-stat-hero"><div class="profile-stat-avatar">${url?`<img src="${escapeHtml(url)}" alt="Profile picture">`:escapeHtml(profileInitials())}</div><div><div style="font-family:var(--font-display);font-size:30px;font-weight:600;">${escapeHtml(getDisplayName())}</div><div style="color:var(--text-dim);font-size:13px;margin-top:5px;">${escapeHtml(AUTH_USER?.email||'')}</div><div style="margin-top:10px;display:flex;gap:7px;flex-wrap:wrap;"><span class="pill">${S.library.length} titles</span><span class="pill">${S.sessions.length} sessions</span><span class="pill">${fmtMinutes(totalsForSessions(S.sessions).minutes)} consumed</span></div></div></div>`;}
function svgBarChart(data,labelFn,valueFn){
  const rows=Array.isArray(data)?data:[];
  const n=Math.max(1,rows.length);
  const values=rows.map(d=>Math.max(0,Number(valueFn(d))||0));
  const max=Math.max(1,...values);

  // v131: always fit every bar inside the SVG instead of forcing an 8px
  // minimum bar width that made 30/90-day charts overflow their viewBox.
  const w=1000,h=280,left=42,right=22,top=22,bottom=42;
  const plotW=w-left-right,plotH=h-top-bottom;
  const gap=n<=10?12:n<=35?5:2;
  const bw=Math.max(2,(plotW-gap*(n-1))/n);

  // Keep short charts fully labelled. Thin long-axis labels automatically.
  const labelStep=n<=10?1:n<=35?3:7;

  // For 90-day charts, showing a number above all 90 bars becomes unreadable.
  // Keep the strongest non-zero values visible and preserve exact values in tooltips.
  let visibleValues=null;
  if(n>35){
    visibleValues=new Set(
      values.map((v,i)=>({v,i}))
        .filter(x=>x.v>0)
        .sort((a,b)=>b.v-a.v)
        .slice(0,12)
        .map(x=>x.i)
    );
  }

  const bars=rows.map((d,i)=>{
    const v=values[i],bh=plotH*(v/max);
    const x=left+i*(bw+gap),y=top+plotH-bh;
    const rawLabel=String(labelFn(d)||'');
    const showLabel=!!rawLabel && (n<=10 || n>35 || i%labelStep===0 || i===n-1);
    const showValue=n<=10 ? true : n<=35 ? v>0 : visibleValues.has(i);
    const tooltip=[rawLabel||`Item ${i+1}`,String(Math.round(v))].join(' · ');

    return `<g>
      <title>${escapeHtml(tooltip)}</title>
      <rect class="chart-bar" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${bw.toFixed(2)}" height="${Math.max(2,bh).toFixed(2)}" rx="${Math.min(4,bw/2).toFixed(2)}" fill="var(--flow)"/>
      ${showLabel?`<text x="${(x+bw/2).toFixed(2)}" y="${h-13}" text-anchor="middle" font-size="${n>35?10:11}" fill="currentColor" opacity=".72">${escapeHtml(rawLabel)}</text>`:''}
      ${showValue?`<text x="${(x+bw/2).toFixed(2)}" y="${Math.max(14,y-6).toFixed(2)}" text-anchor="middle" font-size="${n>35?9:11}" fill="currentColor" opacity=".86">${Math.round(v)}</text>`:''}
    </g>`;
  }).join('');

  return `<svg class="chart-svg v131-chart-svg" viewBox="0 0 ${w} ${h}" role="img" preserveAspectRatio="xMidYMid meet">
    <line x1="${left}" y1="${top+plotH}" x2="${w-right}" y2="${top+plotH}" stroke="currentColor" opacity=".25"/>
    ${bars}
  </svg>`;
}
function weeklyStatsData(){const out=[];for(let i=6;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);const iso=d.toISOString().slice(0,10);out.push({date:iso,label:d.toLocaleDateString(undefined,{weekday:'short'}),minutes:S.sessions.filter(s=>s.date===iso&&s.status!=='skipped').reduce((a,s)=>a+(s.minutes||0),0),tasks:S.sessions.filter(s=>s.date===iso&&s.status!=='skipped').length});}return out;}
function renderStatsV14(){
 const life=totalsForSessions(S.sessions), today=totalsForSessions(todaysSessions()), week=totalsForSessions(sessionsInRange(7)), month=totalsForSessions(sessionsInRange(30));
 const enabledCats=S.categories.filter(c=>c.enabled), last7=weeklyStatsData();
 const last30=[]; for(let i=29;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);const iso=d.toISOString().slice(0,10);last30.push({date:iso,label:d.toLocaleDateString(undefined,{month:'short',day:'numeric'}),minutes:S.sessions.filter(s=>s.date===iso&&s.status!=='skipped').reduce((a,s)=>a+(Number(s.minutes)||0),0),tasks:S.sessions.filter(s=>s.date===iso&&s.status!=='skipped').length});}
 const last90=[]; for(let i=89;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);const iso=d.toISOString().slice(0,10);last90.push({date:iso,label:i%7===0?d.toLocaleDateString(undefined,{month:'short',day:'numeric'}):'',minutes:S.sessions.filter(s=>s.date===iso&&s.status!=='skipped').reduce((a,s)=>a+(Number(s.minutes)||0),0)});}
 const catData=enabledCats.map(c=>({c,m:S.sessions.filter(s=>s.categoryId===c.id&&s.status!=='skipped').reduce((a,s)=>a+(Number(s.minutes)||0),0),tasks:S.sessions.filter(s=>s.categoryId===c.id&&s.status!=='skipped').length})).sort((a,b)=>b.m-a.m);
 const statusData=['planned','active','paused','completed','dropped'].map(k=>({label:v199StatusLabel(k),value:S.library.filter(i=>i.status===k).length}));
 const priorityData=['high','medium','low'].map(k=>({label:k[0].toUpperCase()+k.slice(1),value:S.library.filter(i=>i.priority===k).length}));
 const mediaMap={}; S.sessions.forEach(s=>{if(s.status==='skipped')return;const cat=S.categories.find(c=>c.id===s.categoryId);const type=cat?.type||'other';mediaMap[type]=(mediaMap[type]||0)+(Number(s.minutes)||0);});
 const mediaData=Object.entries(mediaMap).map(([label,value])=>({label,value}));
 const totalUnits=life.episodes+life.chapters+life.movies+life.issues;
 const avgDaily7=Math.round(last7.reduce((a,d)=>a+d.minutes,0)/7), avgSession=S.sessions.length?Math.round(life.minutes/S.sessions.length):0;
 const longestDay=Math.max(...last30.map(d=>d.minutes),0), mostActiveDay=last30.find(d=>d.minutes===longestDay)?.date;
 const mostActiveDayLabel=mostActiveDay?new Date(mostActiveDay+'T12:00:00').toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'}):'—';
 const maxCat=Math.max(1,...catData.map(x=>x.m));
 const bars=(data,val)=>svgBarChart(data,d=>d.label,d=>d[val]);
 const compactList=(data,unit='')=>data.length?data.map(x=>`<div class="record-row"><span class="k">${escapeHtml(x.label)}</span><span class="v">${Math.round(x.value)}${unit}</span></div>`).join(''):'<div class="empty-state">No data yet.</div>';
 const level=mediaFlowLevelInfo();
 return `<div class="view-head"><div><div class="view-title">Statistics</div><div class="view-desc">Your consumption, measured from every angle.</div></div></div>${renderProfileStatHero()}
 <div class="card stats-level-card" style="margin:0 0 24px;padding:18px 20px;"><div class="section-label">LEVELING</div><div style="display:flex;justify-content:space-between;align-items:flex-end;gap:14px;flex-wrap:wrap;"><div><div style="font-family:var(--font-display);font-size:30px;font-weight:700;line-height:1;">Level ${level.level}</div><div class="hint" style="margin-top:6px;">${level.xp.toLocaleString()} lifetime XP</div></div><div style="min-width:220px;flex:1;max-width:600px;"><div class="stats-level-track"><div class="stats-level-fill" style="width:${level.pct}%"></div></div><div class="stats-level-meta"><span>${level.current.toLocaleString()} / ${level.needed.toLocaleString()} XP</span><span class="stats-level-percent">${level.pct}%</span></div><div class="stats-level-caption"><span>${level.needed-level.current===0?'Ready for the next level':'Progress toward Level '+(level.level+1)}</span><span>${level.needed-level.current===0?'':' '+(level.needed-level.current).toLocaleString()+' XP remaining'}</span></div></div></div><div class="record-list" style="margin-top:15px;"><div class="record-row"><span class="k">Consumption XP</span><span class="v">${S.sessions.reduce((a,s)=>a+sessionStoredXP(s),0).toLocaleString()}</span></div><div class="record-row"><span class="k">Library XP</span><span class="v">${libraryXPTotal().toLocaleString()}</span></div></div></div>
 <div class="grid-3" style="margin-bottom:24px;">${statCard('Today',today)}${statCard('This week',week)}${statCard('This month',month)}</div>
 <div class="grid-3" style="margin-bottom:24px;"><div class="card"><div class="section-label">LIFETIME</div><div class="big-stat">${fmtMinutes(life.minutes)}</div><div class="hint">Total time consumed</div></div><div class="card"><div class="section-label">UNITS</div><div class="big-stat">${totalUnits.toLocaleString()}</div><div class="hint">Episodes, chapters, movies & issues</div></div><div class="card"><div class="section-label">STREAK</div><div class="big-stat">${computeDayStreak()} 🔥</div><div class="hint">Current consecutive days</div></div></div>
 <div class="two-col v131-stats-chart-stack" style="margin-bottom:24px;"><div class="card"><div class="section-label">7-DAY MINUTES</div>${bars(last7,'minutes')}</div><div class="card"><div class="section-label">7-DAY SESSIONS</div>${bars(last7,'tasks')}</div></div>
 <div class="two-col v131-stats-chart-stack" style="margin-bottom:24px;"><div class="card"><div class="section-label">30-DAY DAILY MINUTES</div>${svgBarChart(last30,d=>d.label,d=>d.minutes)}</div><div class="card"><div class="section-label">90-DAY ACTIVITY</div>${svgBarChart(last90,d=>d.label,d=>d.minutes)}</div></div>
 <div class="two-col" style="margin-bottom:24px;"><div class="card"><div class="section-label">30-DAY CATEGORY MIX</div>${catData.map(x=>`<div class="bal-bar-row"><div class="bal-bar-label">${v144CategoryIconHtml(x.c)} ${escapeHtml(x.c.name)}</div><div class="bal-bar-track"><div class="bal-bar-fill" style="width:${Math.round(x.m/maxCat*100)}%;background:${x.c.color};"></div></div><div class="bal-bar-val">${fmtMinutes(x.m)}</div></div>`).join('')||'<div class="empty-state">No data yet.</div>'}</div><div class="card"><div class="section-label">MEDIA TYPE MIX</div>${compactList(mediaData.map(x=>({label:x.label,value:x.value})))}</div></div>
 <div class="two-col" style="margin-bottom:24px;"><div class="card"><div class="section-label">LIBRARY STATUS</div>${compactList(statusData)}</div><div class="card"><div class="section-label">PRIORITY DISTRIBUTION</div>${compactList(priorityData)}</div></div>
 ${(()=>{const r=v81RepeatTotals();const units=r.episodes+r.chapters+r.issues+r.movies;if(!units)return '';return `<div class="card" style="margin-bottom:24px"><div class="section-label">↻ REPEAT CONSUMPTION</div><div class="record-list"><div class="record-row"><span class="k">Repeat sessions</span><span class="v">${r.sessions.toLocaleString()}</span></div><div class="record-row"><span class="k">Episodes rewatched</span><span class="v">${r.episodes.toLocaleString()}</span></div><div class="record-row"><span class="k">Chapters reread</span><span class="v">${r.chapters.toLocaleString()}</span></div><div class="record-row"><span class="k">Issues reread</span><span class="v">${r.issues.toLocaleString()}</span></div><div class="record-row"><span class="k">Movies rewatched</span><span class="v">${r.movies.toLocaleString()}</span></div><div class="record-row"><span class="k">Repeat time</span><span class="v">${fmtMinutes(r.minutes)}</span></div></div></div>`;})()}<div class="two-col" style="margin-bottom:24px;"><div class="card"><div class="section-label">LIBRARY HEALTH</div><div class="record-list"><div class="record-row"><span class="k">Library titles</span><span class="v">${S.library.length}</span></div><div class="record-row"><span class="k">Watching titles</span><span class="v">${S.library.filter(i=>i.status==='active').length}</span></div><div class="record-row"><span class="k">Completed titles</span><span class="v">${S.library.filter(i=>i.status==='completed').length}</span></div><div class="record-row"><span class="k">Total units logged</span><span class="v">${totalUnits.toLocaleString()}</span></div></div></div><div class="card"><div class="section-label">ADVANCED METRICS</div><div class="record-list"><div class="record-row"><span class="k">Average daily minutes (7d)</span><span class="v">${fmtMinutes(avgDaily7)}</span></div><div class="record-row"><span class="k">Average session</span><span class="v">${fmtMinutes(avgSession)}</span></div><div class="record-row"><span class="k">Most active day</span><span class="v">${escapeHtml(mostActiveDayLabel)}</span></div><div class="record-row"><span class="k">Peak day minutes</span><span class="v">${fmtMinutes(longestDay)}</span></div><div class="record-row"><span class="k">Lifetime sessions</span><span class="v">${S.sessions.length}</span></div></div></div></div>`;
}
renderStats=renderStatsV14;


/* ============================================================
   V28 ANALYTICS / COVER / TIMELINE HELPERS
   ============================================================ */
function dayKeyLocal(d){ const x=new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; }
function buildDailyActivity(days){
  const map=new Map();
  const cutoff=Date.now()-days*86400000;
  for(const s of S.sessions){ if(s.timestamp<cutoff||s.status==='skipped') continue; const k=s.date||dayKeyLocal(s.timestamp); let v=map.get(k); if(!v)v={minutes:0,sessions:0}; v.minutes+=Number(s.minutes)||0; v.sessions++; map.set(k,v); }
  return map;
}
function v119SessionDateKey(s){
  const raw=String(s?.date||'').slice(0,10);
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const ts=Number(s?.timestamp)||0;
  return ts>0 ? dayKeyLocal(ts) : '';
}
function v119HistoryTimes(){
  const times=[];
  for(const s of (S.sessions||[])){
    if(!s || s.status==='skipped') continue;
    const k=v119SessionDateKey(s);
    if(k){
      const t=new Date(k+'T12:00:00').getTime();
      if(Number.isFinite(t)) times.push(t);
    }
  }
  for(const i of (S.library||[])){
    const t=Number(i?.completedAt)||0;
    if(t>0) times.push(t);
  }
  for(const x of (S.completionTimeline||[])){
    const t=Number(x?.completedAt)||0;
    if(t>0) times.push(t);
  }
  return times;
}
function v119AvailableRecapMonths(){
  const now=new Date();
  const times=v119HistoryTimes();
  const minTime=times.length?Math.min(...times):now.getTime();
  const maxTime=Math.max(now.getTime(),times.length?Math.max(...times):0);
  const first=new Date(minTime), last=new Date(maxTime);
  const cursor=new Date(last.getFullYear(),last.getMonth(),1);
  const stop=new Date(first.getFullYear(),first.getMonth(),1);
  const out=[];
  while(cursor>=stop && out.length<1200){
    out.push(`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}`);
    cursor.setMonth(cursor.getMonth()-1);
  }
  return out.length?out:[`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`];
}
function v119AvailableHeatmapYears(){
  const years=new Set([new Date().getFullYear()]);
  for(const s of (S.sessions||[])){
    if(!s || s.status==='skipped') continue;
    const k=v119SessionDateKey(s);
    const y=Number(k.slice(0,4));
    if(Number.isInteger(y)&&y>=1900&&y<=9999) years.add(y);
  }

  // v136: a year can now be meaningful even when it only contains title
  // lifecycle events and no consumption History.
  for(const item of (S.library||[])){
    for(const ts of [Number(item?.startedAt)||0,Number(item?.completedAt)||0]){
      if(!ts)continue;
      const d=new Date(ts);
      const y=d.getFullYear();
      if(!Number.isNaN(d.getTime())&&y>=1900&&y<=9999)years.add(y);
    }
  }
  for(const x of (S.completionTimeline||[])){
    const ts=Number(x?.completedAt)||0;
    if(!ts)continue;
    const d=new Date(ts),y=d.getFullYear();
    if(!Number.isNaN(d.getTime())&&y>=1900&&y<=9999)years.add(y);
  }

  return [...years].sort((a,b)=>b-a);
}
function renderConsumptionHeatmap(selectedYear){
  const year=Number(selectedYear)||new Date().getFullYear();
  const start=new Date(year,0,1), map=new Map();

  // Consumption remains the only source of heat/intensity.
  for(const s of (S.sessions||[])){
    if(!s || s.status==='skipped') continue;
    const k=v119SessionDateKey(s);
    if(!k || Number(k.slice(0,4))!==year) continue;
    let v=map.get(k);
    if(!v)v={minutes:0,sessions:0,started:[],finished:[]};
    v.minutes+=Number(s.minutes)||0;
    v.sessions++;
    map.set(k,v);
  }

  const lifecycleKey=ts=>{
    ts=Number(ts)||0;
    if(!ts)return '';
    const d=new Date(ts);
    return Number.isNaN(d.getTime())?'':dayKeyLocal(d);
  };

  const ensure=k=>{
    let v=map.get(k);
    if(!v){v={minutes:0,sessions:0,started:[],finished:[]};map.set(k,v);}
    if(!Array.isArray(v.started))v.started=[];
    if(!Array.isArray(v.finished))v.finished=[];
    return v;
  };

  const seenStart=new Set(),seenFinish=new Set();

  // Per-title v135 dates are the primary lifecycle source.
  for(const item of (S.library||[])){
    const title=cleanTitle(item?.title||'');
    if(!title)continue;

    const sk=lifecycleKey(item?.startedAt);
    if(sk && Number(sk.slice(0,4))===year){
      const unique=`${String(item.id||title)}::${sk}`;
      if(!seenStart.has(unique)){
        seenStart.add(unique);
        ensure(sk).started.push({title,libraryId:item.id||null,categoryId:item.categoryId||null});
      }
    }

    const fk=lifecycleKey(item?.completedAt);
    if(fk && Number(fk.slice(0,4))===year){
      const unique=`${String(item.id||title)}::${fk}`;
      if(!seenFinish.has(unique)){
        seenFinish.add(unique);
        ensure(fk).finished.push({title,libraryId:item.id||null,categoryId:item.categoryId||null});
      }
    }
  }

  // Keep legacy completion-timeline-only records visible too.
  for(const x of (S.completionTimeline||[])){
    const fk=lifecycleKey(x?.completedAt);
    if(!fk || Number(fk.slice(0,4))!==year)continue;
    const title=cleanTitle(x?.title||'');
    if(!title)continue;
    const unique=`${String(x.libraryId||title)}::${fk}`;
    if(seenFinish.has(unique))continue;
    seenFinish.add(unique);
    ensure(fk).finished.push({
      title,
      libraryId:x.libraryId||null,
      categoryId:x.categoryId||null
    });
  }

  const janDow=start.getDay();
  const lead=(janDow+6)%7;
  const max=Math.max(1,...[...map.values()].map(v=>Number(v.minutes)||0));
  const daysInYear=new Date(year,1,29).getMonth()===1?366:365;
  const cells=[];

  const names=(rows)=>{
    const unique=[...new Set((rows||[]).map(x=>cleanTitle(x?.title||'')).filter(Boolean))];
    const shown=unique.slice(0,6);
    return shown.join(', ')+(unique.length>shown.length?`, +${unique.length-shown.length} more`:'');
  };

  for(let i=0;i<lead;i++) cells.push('<div class="heat-cell heat-empty"></div>');

  for(let i=0;i<daysInYear;i++){
    const d=new Date(year,0,1);
    d.setDate(d.getDate()+i);
    const k=dayKeyLocal(d);
    const v=map.get(k)||{minutes:0,sessions:0,started:[],finished:[]};
    const m=Number(v.minutes)||0;
    const level=m===0?0:Math.min(4,Math.ceil((m/max)*4));

    const classes=[
      'heat-cell',
      `heat-${level}`,
      v.started?.length?'v136-heat-start':'',
      v.finished?.length?'v136-heat-finish':''
    ].filter(Boolean).join(' ');

    const info=[
      d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}),
      `${Math.round(m)} min${v.sessions?` · ${v.sessions} session${v.sessions===1?'':'s'}`:''}`,
      v.started?.length?`Started (${v.started.length}): ${names(v.started)}`:'',
      v.finished?.length?`Finished (${v.finished.length}): ${names(v.finished)}`:''
    ].filter(Boolean).join(' · ');

    cells.push(`<div class="${classes}" title="${escapeHtml(info)}"></div>`);
  }

  return `<div class="heatmap-wrap">
    <div class="heatmap-grid">${cells.join('')}</div>
    <div class="heatmap-legend"><span>Less</span>${[0,1,2,3,4].map(x=>`<i class="heat-cell heat-${x}"></i>`).join('')}<span>More</span></div>
    <div class="v136-heat-legend">
      <span><i class="heat-cell heat-0 v136-heat-start"></i> Title started</span>
      <span><i class="heat-cell heat-0 v136-heat-finish"></i> Title finished</span>
      <span>Markers do not add fake minutes.</span>
    </div>
  </div>`;
}
function renderCompletionTimeline(){
  const map=new Map();
  for(const x of (S.completionTimeline||[])){ if(x?.completedAt) map.set(x.libraryId||(`${x.title}::${x.completedAt}`),x); }
  for(const i of S.library.filter(i=>i.status==='completed'&&i.completedAt)){ if(!map.has(i.id))map.set(i.id,{libraryId:i.id,title:cleanTitle(i.title),categoryId:i.categoryId,completedAt:i.completedAt}); }
  const arr=[...map.values()].sort((a,b)=>Number(b.completedAt)-Number(a.completedAt));
  if(!arr.length) return '<div class="empty-state">No completed titles have a recorded completion date yet.</div>';
  return `<div class="completion-timeline">${arr.map(x=>{const c=getCategory(x.categoryId);return `<div class="timeline-item"><div class="timeline-dot" style="background:${c?.color||'var(--flow)'}"></div><div class="timeline-date">${new Date(Number(x.completedAt)).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}</div><div class="timeline-title">${escapeHtml(cleanTitle(x.title))}</div><div class="timeline-cat">${c?.icon||'•'} ${escapeHtml(c?.name||'Unknown')}</div></div>`}).join('')}</div>`;
}
function renderMonthlyRecap(){
  const now=new Date(), currentKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const months=v119AvailableRecapMonths();
  let selected=String(S.statsRecapMonth||currentKey);
  if(!months.includes(selected)) selected=months.includes(currentKey)?currentKey:months[0];
  const [y,m]=selected.split('-').map(Number);
  const start=new Date(y,m-1,1).getTime(), end=new Date(y,m,1).getTime();
  const ss=(S.sessions||[]).filter(s=>s && s.status!=='skipped' && v119SessionDateKey(s).startsWith(selected));
  const mins=ss.reduce((a,s)=>a+(Number(s.minutes)||0),0);
  const byCat={};
  ss.forEach(s=>byCat[s.categoryId]=(byCat[s.categoryId]||0)+(Number(s.minutes)||0));
  const top=Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0];
  const finished=(S.library||[]).filter(i=>i.status==='completed'&&Number(i.completedAt)>=start&&Number(i.completedAt)<end).length;
  const days=[...new Set(ss.map(v119SessionDateKey).filter(Boolean))].sort();
  let longest=0,run=0,prev=null;
  for(const d of days){
    const cur=new Date(d+'T12:00:00');
    if(prev&&Math.round((cur-prev)/86400000)===1)run++;
    else run=1;
    longest=Math.max(longest,run);
    prev=cur;
  }
  const options=months.map(k=>{
    const [yy,mm]=k.split('-').map(Number);
    const d=new Date(yy,mm-1,1);
    return `<option value="${k}" ${k===selected?'selected':''}>${d.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</option>`;
  }).join('');
  return `<div class="card" style="margin-bottom:24px;"><div class="section-label">MONTHLY RECAP</div><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px;"><select onchange="App.setRecapMonth(this.value)" style="max-width:210px;">${options}</select></div><div class="recap-grid"><div><b>${fmtMinutes(mins)}</b><small>spent</small></div><div><b>${top?escapeHtml(getCategory(top[0])?.name||'—'):'—'}</b><small>top category · ${top?fmtMinutes(top[1]):'0m'}</small></div><div><b>${finished}</b><small>titles finished</small></div><div><b>${longest}</b><small>longest active-day streak</small></div></div></div>`;
}
function renderOnThisDay(){
  const now=new Date(); const matches=[]; for(const s of S.sessions){const d=new Date(s.timestamp); const years=now.getFullYear()-d.getFullYear(); if(years<1||d.getMonth()!==now.getMonth()||d.getDate()!==now.getDate())continue; for(const t of (s.titles||[])){ if(t.title) matches.push({years,title:t.title}); }}
  if(!matches.length)return ''; const x=matches.sort((a,b)=>a.years-b.years)[0]; return `<div class="on-this-day">On this day · ${x.years} year${x.years===1?'':'s'} ago you logged <b>${escapeHtml(x.title)}</b>.</div>`;
}
function renderSchedulerWhy(){
  if(!S.currentTask)return ''; const cat=getCategory(S.currentTask.categoryId); if(!cat)return ''; const scored=computeScores([...(S.currentTask.categoryId?[S.currentTask.categoryId]:[])]); const all=computeScores([]); const x=all.find(z=>z.cat.id===cat.id); if(!x)return '';
  const d=x.debug; const rows=[['Base weight',d.weightScore],['Neglect bonus',d.neglectBonus],['Seasonal bonus',d.seasonalBonus],['Repetition penalty',-d.repetitionPenalty],['Consecutive penalty',-d.consecutivePenalty],['Saturation penalty',-d.saturationPenalty]];return `<div class="reason-explain reason-breakdown"><b>Why this pick?</b><div class="score-grid">${rows.map(([k,v])=>`<div><span>${k}</span><strong>${v>=0?'+':''}${Math.round(v)}</strong></div>`).join('')}</div><small>Final score also includes controlled randomness. This breakdown is the scheduler's actual scoring inputs before the random jitter.</small></div>`;
}
renderReasonDetail=function(cat){ return renderSchedulerWhy(); };
const _renderDashboardV28=renderDashboard;
renderDashboard=function(){
  let h=_renderDashboardV28();
  const otd=renderOnThisDay(); const pos=h.indexOf('<div class="today-strip">'); return otd&&pos>0?h.slice(0,pos)+otd+h.slice(pos):h;
};

const _oldRenderSettings=renderSettings;
renderSettings=function(){
  let html=_oldRenderSettings();
  const themeCard=`<div class="section-label settings-section-head"><span>APPEARANCE</span>${defaultButton('appearance')}</div><div class="card" style="margin-bottom:22px;"><div class="field"><label class="field-label">UI look</label><select onchange="App.setTheme(this.value)"><option value="dark" ${S.settings.theme==='dark'?'selected':''}>Dark</option><option value="light" ${S.settings.theme==='light'?'selected':''}>Light</option><option value="amoled" ${S.settings.theme==='amoled'?'selected':''}>AMOLED</option></select><small class="hint">Choose the overall MediaFlow interface style.</small></div></div>`;
  const backupCard=`<div class="section-label settings-section-head"><span>AUTOMATIC BACKUPS</span>${defaultButton('backups')}</div><div class="card" style="margin-bottom:22px;"><div style="display:flex;align-items:center;justify-content:space-between;gap:14px;"><div><b>Automatic local JSON backup</b><div class="profile-note">Choose a folder on this computer. MediaFlow can periodically write a backup while the app is open. Browsers cannot write to arbitrary paths while the app is closed.</div></div><button class="toggle ${S.settings.backup?.enabled?'on':''}" onclick="App.toggleBackup()"></button></div><div class="field-row" style="margin-top:14px;"><div class="field"><label class="field-label">Backup every</label><select onchange="App.updateBackup('interval',this.value)"><option value="5" ${Number(S.settings.backup?.interval)===5?'selected':''}>5 minutes</option><option value="15" ${Number(S.settings.backup?.interval)===15?'selected':''}>15 minutes</option><option value="30" ${Number(S.settings.backup?.interval)===30?'selected':''}>30 minutes</option><option value="60" ${Number(S.settings.backup?.interval)===60?'selected':''}>1 hour</option><option value="360" ${Number(S.settings.backup?.interval)===360?'selected':''}>6 hours</option><option value="1440" ${Number(S.settings.backup?.interval)===1440?'selected':''}>Daily</option></select></div><div class="field"><label class="field-label">File mode</label><select onchange="App.updateBackup('mode',this.value)"><option value="single" ${S.settings.backup?.mode==='single'?'selected':''}>One file (overwrite)</option><option value="multiple" ${S.settings.backup?.mode==='multiple'?'selected':''}>Multiple files</option></select></div></div><div class="field"><label class="field-label">Single-file name</label><input value="${escapeHtml(S.settings.backup?.fileName||'mediaflow-backup.json')}" onchange="App.updateBackup('fileName',this.value)"></div><div style="display:flex;gap:8px;flex-wrap:wrap;"><button class="btn" onclick="App.chooseBackupFolder()">Choose backup folder</button><button class="btn btn-ghost" onclick="App.backupNow()">Back up now</button></div><small class="hint">Folder permission is stored in this browser when supported. Multiple-file mode creates a timestamped JSON file each time.</small></div>`;
  const linksCard='';
  const offlineCard='';
  const emptyCard=`<div class="section-label">LIBRARY MAINTENANCE</div><div class="card" style="margin-bottom:22px;"><b>Empty library</b><div class="profile-note">Advanced clearing options. History is preserved.</div><button class="btn btn-danger" style="margin-top:12px" onclick="App.emptyLibraryAdvanced()">Empty library…</button></div>`;
const dataIdx=html.indexOf('<div class="section-label">DATA</div>'); if(dataIdx>=0) html=html.slice(0,dataIdx)+themeCard+backupCard+linksCard+offlineCard+emptyCard+html.slice(dataIdx); else html+=themeCard+backupCard+linksCard+offlineCard+emptyCard;
  return html;
};


const _renderStatsV27Base=renderStats;
renderStats=function(){
  let h=_renderStatsV27Base();
  const heatYears=v119AvailableHeatmapYears();
  let heatYear=Number(S.statsHeatmapYear)||new Date().getFullYear();
  if(!heatYears.includes(heatYear)) heatYear=heatYears[0]||new Date().getFullYear();
  const heatOptions=heatYears.map(y=>`<option value="${y}" ${y===heatYear?'selected':''}>${y}</option>`).join('');
  const heat=`<div class="card" style="margin-bottom:24px;"><div class="section-label">CONSUMPTION HEATMAP · ${heatYear}</div><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px;"><select onchange="App.setHeatmapYear(this.value)" style="max-width:150px;">${heatOptions}</select></div>${renderConsumptionHeatmap(heatYear)}<div class="hint" style="margin-top:10px;">Each square is one day. Intensity is based on minutes logged that day; corner markers show titles started and finished.</div></div>`;
  const recap=renderMonthlyRecap();
  const timeline=`<div class="card" style="margin-bottom:24px;"><div class="section-label">TITLE COMPLETION TIMELINE</div>${renderCompletionTimeline()}</div>`;
  h=h.replace('<div class="grid-3" style="margin-bottom:24px;">', heat+recap+'<div class="grid-3" style="margin-bottom:24px;">'); const pos=h.lastIndexOf('</div>'); return pos>0?h.slice(0,pos)+timeline+h.slice(pos):h+timeline;
};
Object.assign(App,{
  setRecapMonth(v){S.statsRecapMonth=String(v||'');render();},
  setHeatmapYear(v){S.statsHeatmapYear=String(v||'');render();}
});

Object.assign(App,{setPriorityChoice(id,value){const item=S.library.find(i=>i && i.id===id);if(!item || !['low','medium','high'].includes(value)) return;item.priority=value;S.modal=null;persistLibrary();render();},setLibraryStatus(id,value){const item=S.library.find(i=>i&&i.id===id);if(!item||!['planned','active','paused','completed','dropped'].includes(value))return;item.status=value;if(value==='completed'){item.completedAt=item.completedAt||Date.now();S.completionTimeline=S.completionTimeline||[];if(!S.completionTimeline.some(x=>x.libraryId===item.id))S.completionTimeline.push({libraryId:item.id,title:cleanTitle(item.title),categoryId:item.categoryId,completedAt:item.completedAt});}else if(value!=='completed'){item.completedAt=null;S.completionTimeline=(S.completionTimeline||[]).filter(x=>x.libraryId!==item.id);}normalizeSeasonalLibraryItems();S.modal=null;persistLibrary();render();},setLibraryCategory(id,value){const item=S.library.find(i=>i&&i.id===id);if(!item||!S.categories.some(c=>c.id===value))return;const old=item.categoryId;item.categoryId=value;normalizeSeasonalLibraryItems();S.modal=null;persistLibrary();render();},setThemeCollection(kind){const isPlatform=V55_PLATFORM_THEMES.includes(S.settings.theme||'dark');if(kind==='platform'&&!isPlatform){S.settings.theme='platform-anilist-dark';applyTheme(S.settings.theme);persistSettings();render();return;}if(kind==='mediaflow'&&isPlatform){S.settings.theme='dark';applyTheme('dark');persistSettings();render();return;}render();},setTheme(theme){S.settings.theme=theme;applyTheme(theme);persistSettings();render();},toggleBackup(){S.settings.backup.enabled=!S.settings.backup.enabled;persistSettings();restartBackupTimer();render();},updateBackup(k,v){S.settings.backup=S.settings.backup||{};S.settings.backup[k]=k==='interval'?Number(v):v;persistSettings();restartBackupTimer();render();},chooseBackupFolder:openBackupFolder,backupNow:()=>saveBackupNow(true),setMalLink(k,v){S.malLink=S.malLink||{username:'',mode:'anime'};S.malLink[k]=v;persistTask();},syncMAL:malSync,emptyLibraryAdvanced,confirmEmptyLibrary,deleteCloudAccount,choosePriority,chooseStatusForLibrary,chooseCategoryForLibrary,stopwatchStart,stopwatchPause,stopwatchSetTime,stopwatchReset,stopwatchClear,stopwatchUseMinutes});


// Add profile name to state and keep it local/cloud.
const _oldSnapshot=snapshot;
snapshot=function(){const x=_oldSnapshot();x.profileName=String(S.profileName||'').trim();return x;};
const _oldLoadAll=loadAll;
loadAll=async function(){await _oldLoadAll();const d=await rawGet(STATE_KEY);S.profileName=String(d?.profileName||'').trim();S.stopwatch=Object.assign({running:false,startedAt:0,elapsed:0,resetValue:0},d?.stopwatch||{});S.malLink=Object.assign({username:'',mode:'anime'},d?.malLink||{});S.xpLedger=Object.assign({libraryAdditions:{}},d?.xpLedger||{});
S.completionTimeline=Array.isArray(d?.completionTimeline)?d.completionTimeline:[];S.xpLedger.libraryAdditions=Object.assign({},d?.xpLedger?.libraryAdditions||{});initTheme();await restoreBackupFolder();restartBackupTimer();clearInterval(window.__sw);window.__sw=null;if(S.stopwatch.running)window.__sw=setInterval(stopwatchTick,250);};


/* v40: Multi-service exchange hub + custom import confirmation */
const MF_EXCHANGE_SERVICES=[['anilist','AniList'],['anisearch','AniSearch'],['aniwatch','AniWatch'],['betaseries','BetaSeries'],['criticker','Criticker'],['crunchyroll','Crunchyroll'],['episodecalendar','EpisodeCalendar'],['hianime','HiAnime'],['imdb','IMDb'],['letterboxd','Letterboxd'],['livechart','LiveChart'],['kitsu','Kitsu'],['moviesfad','MoviesFad'],['simkl','Simkl'],['mal','MyAnimeList'],['malxml','MAL-XML'],['netflix','Netflix'],['primewire','PrimeWire'],['seriesfad','SeriesFad'],['stremio','Stremio'],['trakt','trakt'],['tvtime','TV Time'],['tviso','Tviso'],['twee','Twee'],['csv','Import .csv file'],['json','Import .json file']];
function mfExchangeServiceOptions(){return MF_EXCHANGE_SERVICES.map(([id,n])=>`<option value="${id}">${n}</option>`).join('')}
function mfServiceName(id){return MF_EXCHANGE_SERVICES.find(x=>x[0]===id)?.[1]||id||'External service'}
function mfImportConfirmModalHtml(d){const backup=d?.mode==='backup';return `<div class="priority-modal"><div class="modal-title">Confirm import</div><div style="color:var(--text-dim);font-size:13px;line-height:1.6;margin-bottom:14px">Import <b>${escapeHtml(d?.fileName||'file')}</b> from <b>${escapeHtml(d?.serviceName||'external data')}</b>?</div><div class="card" style="padding:13px;margin:0;background:var(--panel-2)"><div style="font-size:12px;line-height:1.55;color:var(--text-dim)">${backup?'This full MediaFlow backup will replace your current categories, Library, History and Settings.':'Recognized titles will be merged into your Library. Matching entries are updated before new titles are created. Missing fields are not fabricated.'}</div></div><div class="modal-actions"><button class="btn btn-ghost" onclick="App.cancelPendingImport()">Cancel</button><button class="btn btn-primary" onclick="App.confirmPendingImport()">${backup?'Replace & import':'Import data'}</button></div></div>`}
function mfPendingImport(kind,service,file){if(!file)return;S.pendingImport={kind,service,file};S.modal={type:'importConfirm',data:{mode:kind==='backup'?'backup':'merge',fileName:file.name,serviceName:kind==='backup'?'MediaFlow backup':mfServiceName(service)}};render()}
function mfCancelPendingImport(){S.pendingImport=null;S.modal=null;render()}
async function mfConfirmPendingImport(){const x=S.pendingImport;if(!x)return;S.pendingImport=null;S.modal=null;render();if(x.kind==='backup')return App.importJSON(x.file);if(x.kind==='legacy-mal')return App.importMalXml(x.file);if(x.kind==='legacy-simkl')return App.importSimklJson(x.file);if(['mal','malxml'].includes(String(x.service||''))&&/\.xml$/i.test(String(x.file?.name||'')))return App.importMalXml(x.file);return mfImportExchangeFile(x.service,x.file)}
function mfPickExchangeImport(){document.getElementById('exchange-file')?.click()}
function mfPrepareExchangeImport(file){if(file)mfPendingImport('exchange',document.getElementById('exchange-service')?.value||'json',file)}
function mfPrepareLegacyImport(service,file){if(file)mfPendingImport(service==='mal'?'legacy-mal':'legacy-simkl',service,file)}
function mfPrepareBackupImport(file){if(file)mfPendingImport('backup','mediaflow',file)}
function mfCsvParse(text){const rows=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'){if(q&&n==='"'){cell+='"';i++}else q=!q}else if(c===','&&!q){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&n==='\n')i++;row.push(cell);cell='';if(row.some(x=>x.trim()))rows.push(row);row=[]}else cell+=c}if(cell||row.length){row.push(cell);if(row.some(x=>x.trim()))rows.push(row)}if(!rows.length)return[];const h=rows[0].map(x=>x.trim().toLowerCase().replace(/^\ufeff/,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''));return rows.slice(1).map(r=>Object.fromEntries(h.map((k,i)=>[k,(r[i]??'').trim()]))) }
function mfFirst(o,keys){for(const k of keys)if(o&&o[k]!=null&&String(o[k]).trim()!=='')return o[k];return null}
function mfNormStatus(v){v=String(v||'').toLowerCase().replace(/[ _-]+/g,'');if(/completed|complete|watched|finished/.test(v))return'completed';if(/watching|reading|current|inprogress/.test(v))return'active';if(/hold|paused/.test(v))return'paused';if(/drop/.test(v))return'dropped';return'planned'}
function mfGuessCategory(o,service){const raw=String(mfFirst(o,['media_type','type','kind','format','category','list_type','content_type','__group'])||'').toLowerCase();if(/manga|manhwa|manhua|chapter/.test(raw))return/manhwa|manhua/.test(raw)?'manhwa':'manga';if(/anime/.test(raw)||['anilist','anisearch','aniwatch','hianime','livechart','kitsu','mal','malxml','crunchyroll'].includes(service))return/movie|film/.test(raw)?'animemovies':'backlog';if(/movie|film/.test(raw)||['letterboxd','criticker','moviesfad'].includes(service))return'movies';if(/comic|issue/.test(raw))return'comics';if(/animation|cartoon/.test(raw))return'otheranim';return'tv'}
function mfFlattenJson(data){if(Array.isArray(data))return data;const out=[];for(const k of ['anime','shows','movies','items','entries','library','watchlist','history','data','results'])if(Array.isArray(data?.[k]))for(const x of data[k])out.push(Object.assign({__group:k},x));return out.length?out:[data]}
function mfXmlRecords(text){const doc=new DOMParser().parseFromString(text,'text/xml');if(doc.querySelector('parsererror'))throw new Error('The XML file could not be parsed.');return[...doc.querySelectorAll('anime,manga,item,entry,movie,show,series')].map(n=>{const o={};for(const el of n.children)o[el.tagName.toLowerCase()]=el.textContent?.trim()||'';return o})}
function mfNormalizeRecord(rec,service){const nested=rec?.show||rec?.movie||rec?.media||rec?.anime||rec?.item||{};const o=Object.assign({},nested,rec),title=cleanTitle(String(mfFirst(o,['title','name','series_title','anime_title','movie_title','original_title','primary_title'])||''));if(!title)return null;const progress=Number(mfFirst(o,['progress','watched_episodes','watched_episodes_count','episodes_watched','episode','my_watched_episodes','chapters_read','my_read_chapters','watched'])||0)||0;let total=Number(mfFirst(o,['total','total_episodes','total_episodes_count','episodes_total','series_episodes','chapters_total','series_chapters'])||0)||null;const categoryId=mfGuessCategory(o,service);if(categoryId==='movies'||categoryId==='animemovies')total=total||1;const ids=o.ids||{};return{title,categoryId,progress,total,status:mfNormStatus(mfFirst(o,['status','list_status','my_status','state'])),rating:Number(mfFirst(o,['rating','user_rating','your_rating','score','my_score'])||0)||null,year:Number(mfFirst(o,['year','release_year','title_year'])||0)||null,externalIds:{simkl:ids.simkl||o.simkl_id||null,mal:ids.mal||o.mal_id||o.series_animedb_id||null,anilist:ids.anilist||o.anilist_id||null,tmdb:ids.tmdb||o.tmdb_id||null,imdb:ids.imdb||o.imdb_id||o.const||null,trakt:ids.trakt||o.trakt_id||null,kitsu:o.kitsu_id||null}}}
function mfMergeExchangeRecords(records,service){let added=0,updated=0,skipped=0;for(const raw of records){const r=mfNormalizeRecord(raw,service);if(!r){skipped++;continue}let item=S.library.find(i=>Object.entries(r.externalIds).some(([k,v])=>v&&i.externalIds?.[k]&&String(v)===String(i.externalIds[k])));if(!item)item=S.library.find(i=>cleanTitle(i.title).toLowerCase()===r.title.toLowerCase()&&(!r.year||!i.year||Number(i.year)===Number(r.year)));if(item){item.progress=Math.max(Number(item.progress)||0,r.progress);if(r.total)item.total=r.total;item.status=r.status;item.rating=r.rating??item.rating;item.year=r.year||item.year;item.externalIds=Object.assign({},item.externalIds||{},r.externalIds);item.source=service;item.tags=[...new Set([...(item.tags||[]),mfServiceName(service)])];updated++}else{S.library.push({id:uid(),title:r.title,categoryId:S.categories.some(c=>c.id===r.categoryId)?r.categoryId:'tv',progress:r.progress,total:r.total,status:r.status,priority:'medium',estimatedMinutes:null,tags:[mfServiceName(service)],source:service,year:r.year,rating:r.rating,externalIds:r.externalIds,createdAt:Date.now(),completedAt:r.status==='completed'?Date.now():null});added++}}normalizeSeasonalLibraryItems();return{added,updated,skipped}}
async function mfImportExchangeFile(service,file){showImportProgress(`Importing ${mfServiceName(service)}`,1);try{const text=await file.text(),name=file.name.toLowerCase();let records;if(name.endsWith('.xml')||/^\s*</.test(text))records=mfXmlRecords(text);else if(name.endsWith('.csv')||(!name.endsWith('.json')&&text.includes(',')))records=mfCsvParse(text);else records=mfFlattenJson(JSON.parse(text));if(!records.length)throw new Error('No recognizable media records were found.');mfBegin(`${mfServiceName(service)} import`,file.name);const r=mfMergeExchangeRecords(records,service);mfCommit(`${mfServiceName(service)} import`,`${r.added} added, ${r.updated} updated`);updateImportProgress(records.length,records.length,r.added,r.updated,r.skipped,'Saving imported data…');await saveState();finishImportProgress(true,`${mfServiceName(service)} import complete`,`${r.added.toLocaleString()} titles added, ${r.updated.toLocaleString()} updated${r.skipped?`, ${r.skipped.toLocaleString()} skipped`:''}.`);render()}catch(e){console.error(e);finishImportProgress(false,'Import failed',e.message||'MediaFlow could not understand this export file.')}}
function mfCsvEscape(v){v=v==null?'':String(v);return/[",\n\r]/.test(v)?`"${v.replace(/"/g,'""')}"`:v}
function mfExchangeRows(){return S.library.map(i=>{const c=getCategory(i.categoryId);return{title:cleanTitle(i.title),media_type:c?.id||i.categoryId,status:i.status,progress:Number(i.progress)||0,total:i.total??'',rating:i.rating??'',year:i.year??'',start_date:i.startedAt?v135DateInputValue(i.startedAt):'',finish_date:i.completedAt?v135DateInputValue(i.completedAt):'',mal_id:i.externalIds?.mal??'',anilist_id:i.externalIds?.anilist??'',imdb_id:i.externalIds?.imdb??'',tmdb_id:i.externalIds?.tmdb??'',trakt_id:i.externalIds?.trakt??'',simkl_id:i.externalIds?.simkl??''}})}
function mfMalXmlExport(){const rows=mfExchangeRows().filter(r=>['seasonal','backlog','animemovies'].includes(r.media_type)),sm={active:'Watching',completed:'Completed',paused:'On-Hold',dropped:'Dropped',planned:'Plan to Watch'};return`<?xml version="1.0" encoding="UTF-8"?>\n<myanimelist>\n${rows.map(r=>`<anime><series_animedb_id>${r.mal_id||0}</series_animedb_id><series_title><![CDATA[${r.title.replace(/]]>/g,']]]]><![CDATA[>')}]]></series_title><series_type>${r.media_type==='animemovies'?'Movie':'TV'}</series_type><series_episodes>${r.total||0}</series_episodes><my_watched_episodes>${r.progress}</my_watched_episodes><my_start_date>${r.start_date||'0000-00-00'}</my_start_date><my_finish_date>${r.finish_date||'0000-00-00'}</my_finish_date><my_status>${sm[r.status]||'Plan to Watch'}</my_status><my_score>${r.rating||0}</my_score></anime>`).join('\n')}\n</myanimelist>`}
function mfExportExchange(){const service=document.getElementById('exchange-service')?.value||'json',rows=mfExchangeRows();let blob,name;if(['mal','malxml','aniwatch','hianime','livechart'].includes(service)){blob=new Blob([mfMalXmlExport()],{type:'application/xml'});name=`mediaflow-${service}-${todayISO()}.xml`}else if(['json','anilist','anisearch','kitsu','stremio','trakt'].includes(service)){blob=new Blob([JSON.stringify({source:'MediaFlow',target:mfServiceName(service),exportedAt:new Date().toISOString(),items:rows},null,2)],{type:'application/json'});name=`mediaflow-${service}-${todayISO()}.json`}else{const h=Object.keys(rows[0]||{title:'',media_type:'',status:'',progress:'',total:'',rating:'',year:''}),csv=[h.join(','),...rows.map(r=>h.map(k=>mfCsvEscape(r[k])).join(','))].join('\r\n');blob=new Blob([csv],{type:'text/csv'});name=`mediaflow-${service}-${todayISO()}.csv`}triggerDownload(blob,name);showDataProgress(`Exporting for ${mfServiceName(service)}`,'Creating exchange file...',70);setTimeout(()=>finishDataProgress(true,'Export complete',`${rows.length.toLocaleString()} Library titles exported for ${mfServiceName(service)}.`),100)}
Object.assign(App,{pickExchangeImport:mfPickExchangeImport,prepareExchangeImport:mfPrepareExchangeImport,prepareLegacyImport:mfPrepareLegacyImport,prepareBackupImport:mfPrepareBackupImport,cancelPendingImport:mfCancelPendingImport,confirmPendingImport:mfConfirmPendingImport,exportExchange:mfExportExchange});

/* ============================================================
   v42: Dedicated Library History tab
   - Library activity log moved out of Library
   - Undo/Redo controls moved to Library History
   ============================================================ */

/* ============================================================
   v37: Simkl JSON + bulk library tools + activity + undo/redo
   ============================================================ */
S.librarySelection=S.librarySelection||{};
S.activityLog=S.activityLog||[];
S.undoStack=S.undoStack||[];
S.redoStack=S.redoStack||[];

function mfDeep(v){return JSON.parse(JSON.stringify(v));}
function mfCoreSnapshot(){return {library:mfDeep(S.library||[]),sessions:mfDeep(S.sessions||[]),completionTimeline:mfDeep(S.completionTimeline||[]),xpLedger:mfDeep(S.xpLedger||{libraryAdditions:{}})};}
function mfRestoreCore(x){S.library=sanitizeLibrary(mfDeep(x.library||[]));S.sessions=mfDeep(x.sessions||[]);S.completionTimeline=mfDeep(x.completionTimeline||[]);S.xpLedger=mfDeep(x.xpLedger||{libraryAdditions:{}});normalizeSeasonalLibraryItems();}
function mfActivity(action,detail){S.activityLog=S.activityLog||[];S.activityLog.unshift({id:uid(),timestamp:Date.now(),action:String(action||'Change'),detail:String(detail||'')});if(S.activityLog.length>1000)S.activityLog.length=1000;}
function mfBegin(action,detail){S.undoStack=S.undoStack||[];S.redoStack=[];S.undoStack.push({action,detail,before:mfCoreSnapshot()});if(S.undoStack.length>40)S.undoStack.shift();}
function mfCommit(action,detail){const x=S.undoStack[S.undoStack.length-1];if(x&&!x.after)x.after=mfCoreSnapshot();mfActivity(action,detail);saveState();}
async function mfUndo(){const x=(S.undoStack||[]).pop();if(!x){showToast('Nothing to undo');return;}x.after=x.after||mfCoreSnapshot();S.redoStack=S.redoStack||[];S.redoStack.push(x);mfRestoreCore(x.before);mfActivity('Undo',x.action+(x.detail?' · '+x.detail:''));await saveState();render();showToast('Undid '+x.action);}
async function mfRedo(){const x=(S.redoStack||[]).pop();if(!x){showToast('Nothing to redo');return;}S.undoStack=S.undoStack||[];S.undoStack.push(x);mfRestoreCore(x.after);mfActivity('Redo',x.action+(x.detail?' · '+x.detail:''));await saveState();render();showToast('Redid '+x.action);}
function mfSelectedIds(){return Object.keys(S.librarySelection||{}).filter(id=>S.librarySelection[id]&&S.library.some(i=>i.id===id));}
function mfToggleSelect(id,on){S.librarySelection=S.librarySelection||{};S.librarySelection[id]=!!on;render();}
function mfSelectVisible(on){document.querySelectorAll('.item-row [data-mf-select]').forEach(cb=>{cb.checked=!!on;S.librarySelection[cb.dataset.mfSelect]=!!on;});mfEnhanceLibraryDom();}
function mfClearSelection(){S.librarySelection={};render();}
function mfBatchStatus(v){const ids=mfSelectedIds();if(!ids.length)return;mfBegin('Batch status',ids.length+' titles → '+v);ids.forEach(id=>{const i=S.library.find(x=>x.id===id);if(i){i.status=v;if(v==='completed'){i.completedAt=i.completedAt||Date.now();}else i.completedAt=null;}});normalizeSeasonalLibraryItems();mfCommit('Batch status',ids.length+' titles → '+v);render();}
function mfBatchPriority(v){const ids=mfSelectedIds();if(!ids.length)return;mfBegin('Batch priority',ids.length+' titles → '+v);ids.forEach(id=>{const i=S.library.find(x=>x.id===id);if(i)i.priority=v;});mfCommit('Batch priority',ids.length+' titles → '+v);render();}
function mfBatchCategory(v){const ids=mfSelectedIds();if(!ids.length||!S.categories.some(c=>c.id===v))return;mfBegin('Batch move',ids.length+' titles → '+getCategory(v).name);ids.forEach(id=>{const i=S.library.find(x=>x.id===id);if(i)i.categoryId=v;});normalizeSeasonalLibraryItems();mfCommit('Batch move',ids.length+' titles → '+getCategory(v).name);render();}
function mfBatchDelete(){const ids=mfSelectedIds();if(!ids.length)return;mfBegin('Batch delete',ids.length+' titles');S.library=S.library.filter(i=>!ids.includes(i.id));S.librarySelection={};mfCommit('Batch delete',ids.length+' titles');render();showToast(ids.length+' titles deleted');}
function mfClearCategory(id){const cat=S.categories.find(c=>c.id===id);if(!cat)return;const n=S.library.filter(i=>i.categoryId===id).length;if(!n){showToast('That category is already empty');return;}mfBegin('Clear category',cat.name+' · '+n+' titles');S.library=S.library.filter(i=>i.categoryId!==id);mfCommit('Clear category',cat.name+' · '+n+' titles');render();showToast(cat.name+' cleared');}
