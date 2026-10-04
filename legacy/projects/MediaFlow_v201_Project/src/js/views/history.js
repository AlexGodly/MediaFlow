/* MediaFlow v201 source fragment
 * History view
 * Original HTML lines 9130-9266.
 * Build order matters; see scripts/build.mjs.
 */

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
