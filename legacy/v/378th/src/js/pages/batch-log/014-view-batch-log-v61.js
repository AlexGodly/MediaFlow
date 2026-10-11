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
    if(!selected || cleanTitle(selected.title)!==r.query){r.libraryId='';r.loggedAt=null;}
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
  if(String(r.libraryId||'')!==String(item.id)||!v331ValidTimestamp(r.loggedAt))r.loggedAt=Date.now();
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
      titles:[{title:cleanTitle(item.title),libraryId:item.id,qty,repeat:(item.status==='completed'||(Number(item.total)>0&&Number(item.progress)>=Number(item.total))),loggedAt:v331BatchTitleTimestamp(r,S.batchDraft,date,timestamp)}]});
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
    <div class="card batch-log-meta"><div class="field-row"><div class="field"><label class="field-label">Consumption date</label><input type="date" value="${escapeHtml(S.batchDraft.date||todayISO())}" onchange="S.batchDraft.date=this.value; S.batchDraft.v331DateOverride=true"></div><div class="field"><label class="field-label">Batch note (optional)</label><input type="text" value="${escapeHtml(S.batchDraft.note||'')}" placeholder="What did you consume?" onchange="S.batchDraft.note=this.value"></div></div>
    <div class="health-note">Batch entries use <b>Logged</b>. Their actual categories, amounts and minutes still fully count throughout MediaFlow.</div></div>
    <div class="batch-log-list">${rows||`<div class="empty-state card"><div class="em-icon">🧾</div><div class="em-title">No batch rows yet</div><div>Add a title, search your Library, and select what you consumed.</div></div>`}</div>
    <div class="batch-log-actions"><button class="btn" onclick="App.addBatchRow()">+ Add title</button><button class="btn btn-primary" ${S.batchDraft.rows.length?'':'disabled'} onclick="App.submitBatchLog()">Log batch</button>${S.batchDraft.rows.length?`<button class="btn btn-ghost" onclick="App.clearBatchLog()">Clear</button>`:''}<span id="batch-total-summary" class="hint">${S.batchDraft.rows.length} rows · ${fmtMinutes(totalMinutes)}</span></div>`;
}

