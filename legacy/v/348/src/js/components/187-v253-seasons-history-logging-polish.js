/* ============================================================
   MediaFlow v253 — Seasons UI / recommended logging / History batch tools
   --------------------------------------------------------------------------
   - Cleans the v252 season-aware Last progress logging layout by keeping the
     season controls on their own full-width row instead of squeezing them into
     the title-search flex row.
   - Keeps Title Details scrollable after Seasons View expands the popup and
     makes the direct season manager stack above Title Details.
   - Adds a one-click "Use recommended title" action to normal logging.
   - Adds a persistent History page-size preference (default 10), transient
     multi-selection, Select visible / Deselect, Delete selected and Delete
     visible with a designed MediaFlow confirmation.
   ============================================================ */
const V253_RUNTIME_VERSION=253;
const V253_HISTORY_SELECTED=new Set();
let V253_HISTORY_DELETE_PENDING=null;

/* ---------- Logging: clean Seasons View layout + recommended shortcut ---- */
function v253RecommendedLogItem(){
  const task=S.currentTask;
  if(!task)return null;
  let item=task.libraryId?(S.library||[]).find(x=>String(x?.id||'')===String(task.libraryId)):null;
  if(!item&&task.title){
    const key=cleanTitle(task.title).toLocaleLowerCase();
    item=(S.library||[]).find(x=>x&&x.status!=='dropped'&&cleanTitle(x.title).toLocaleLowerCase()===key)||null;
  }
  return item&&item.status!=='dropped'?item:null;
}
function v253RecommendedLogCardHtml(item){
  if(!item)return '';
  const cat=getCategory(item.categoryId),selected=String(S.entryDraft?.libraryId||'')===String(item.id);
  const progress=Number(item.total)>0?`${Number(item.progress)||0} / ${Number(item.total)}`:`Progress ${Number(item.progress)||0}`;
  const season=v252HasSeasons(item)?` · ${v252Seasons(item).length} seasons`:'';
  const cover=item.coverUrl?`<img src="${escapeHtml(item.coverUrl)}" alt="" loading="lazy" onerror="this.style.display='none'">`:`<span class="v253-rec-fallback">${v144CategoryIconHtml(cat)}</span>`;
  return `<section class="v253-log-recommended" aria-label="Recommended title shortcut">
    <div class="v253-log-recommended-copy">${cover}<div><span class="v253-log-recommended-kicker">RECOMMENDED TITLE</span><b>${escapeHtml(cleanTitle(item.title))}</b><small>${escapeHtml(cat?.name||'Library')} · ${escapeHtml(progress)}${escapeHtml(season)}</small></div></div>
    <button type="button" class="btn btn-sm ${selected?'btn-ghost':'btn-primary'}" ${selected?'disabled':''} onclick="App.v253UseRecommendedTitle()">${selected?'Recommended title selected':'Use recommended title'}</button>
  </section>`;
}
function v253UseRecommendedTitle(){
  const item=v253RecommendedLogItem();
  if(!item){showToast('The current recommendation does not have an available Library title.');return;}
  try{V238_LOG_LIBRARY_OPEN=true;}catch(_){ }
  App.selectLogTitle(String(item.id));
}
function v253ReflowSeasonLogging(html){
  try{
    const host=document.createElement('div');host.innerHTML=String(html||'');
    const form=host.querySelector('.log-form');if(!form)return html;
    form.classList.add('v253-log-form');
    const browser=form.querySelector('.v238-log-library');
    const body=browser?.querySelector('.v238-log-library-body');
    const titleInput=form.querySelector('#entry-title');
    const builder=titleInput?.parentElement;
    if(builder)builder.classList.add('v253-log-title-builder');

    // v252 inserted Seasons View inside the title-search flex row. Put it on a
    // dedicated line so title search, progress, Season and Episode never fight
    // for the same horizontal space.
    const seasons=form.querySelector('.v252-log-season-box');
    if(seasons&&builder){
      seasons.classList.add('v253-log-season-box');
      builder.insertAdjacentElement('afterend',seasons);
    }

    const item=v253RecommendedLogItem();
    if(item&&browser&&!form.querySelector('.v253-log-recommended')){
      browser.insertAdjacentHTML('beforebegin',v253RecommendedLogCardHtml(item));
    }
    return host.innerHTML;
  }catch(_){return html;}
}
const v253RenderLogFormBase=renderLogForm;
renderLogForm=function(){return v253ReflowSeasonLogging(v253RenderLogFormBase.apply(this,arguments));};

/* ---------- Title Details / Season-manager modal repair ------------------ */
const v253OpenSeasonManagerBase=v252OpenSeasonManager;
v252OpenSeasonManager=function(id){
  const out=v253OpenSeasonManagerBase.apply(this,arguments);
  const overlay=document.getElementById('v252-season-manager-overlay');
  if(overlay){overlay.classList.add('v253-season-manager-overlay');overlay.setAttribute('aria-modal','true');overlay.setAttribute('role','dialog');}
  return out;
};
App.v252OpenSeasonManager=v252OpenSeasonManager;

/* ---------- History: persistent page size + batch selection/delete ------- */
function v253HistoryPageSize(){
  const raw=Number(S.settings?.historyPageSize);
  return Math.max(1,Math.min(500,Number.isFinite(raw)&&raw>0?Math.round(raw):10));
}
function v253SetHistoryPageSize(value){
  const size=Math.max(1,Math.min(500,Math.round(Number(value)||10)));
  S.settings=S.settings||{};S.settings.historyPageSize=size;S.histPageSize=size;S.histPage=0;
  try{persistSettings();}catch(_){ }
  render();
}
function v253HistoryFilteredList(){
  const f=S.histFilters=S.histFilters||{},selected=new Set(typeof v241HistorySelectedCategories==='function'?v241HistorySelectedCategories():[]);
  let list=(S.sessions||[]).slice().sort((a,b)=>(Number(b.timestamp)||0)-(Number(a.timestamp)||0));
  if(selected.size)list=list.filter(s=>selected.has(String(s.categoryId)));
  if(f.type&&f.type!=='all')list=list.filter(s=>getCategory(s.categoryId).type===f.type);
  if(f.range==='today')list=list.filter(s=>s.date===todayISO());
  else if(f.range==='week')list=list.filter(s=>Number(s.timestamp)>=hoursAgo(24*7));
  else if(f.range==='month')list=list.filter(s=>Number(s.timestamp)>=hoursAgo(24*30));
  if(f.range==='custom'||f.dateFrom||f.dateTo){const from=String(f.dateFrom||''),to=String(f.dateTo||'');if(from)list=list.filter(s=>String(s.date||'')>=from);if(to)list=list.filter(s=>String(s.date||'')<=to);}
  return list;
}
function v253HistoryPageData(){
  const list=v253HistoryFilteredList(),pageSize=v253HistoryPageSize(),pageCount=Math.max(1,Math.ceil(list.length/pageSize));
  S.histPage=clamp(Number(S.histPage)||0,0,pageCount-1);const start=S.histPage*pageSize;
  return {list,pageSize,pageCount,page:S.histPage,pageItems:list.slice(start,start+pageSize)};
}
function v253PruneHistorySelection(){
  const valid=new Set((S.sessions||[]).map(s=>String(s?.id||'')));
  for(const id of [...V253_HISTORY_SELECTED])if(!valid.has(id))V253_HISTORY_SELECTED.delete(id);
}
function v253ToggleHistorySelection(id,on){const key=String(id||'');if(!key)return;on?V253_HISTORY_SELECTED.add(key):V253_HISTORY_SELECTED.delete(key);render();}
function v253SelectVisibleHistory(){for(const s of v253HistoryPageData().pageItems)V253_HISTORY_SELECTED.add(String(s.id));render();}
function v253DeselectHistory(){V253_HISTORY_SELECTED.clear();render();}
function v253HistoryDeleteConfirmHtml(kind,ids){
  const n=ids.length,visible=kind==='visible';
  return `<div class="v253-history-confirm"><div class="v253-history-confirm-icon">${visible?'⌫':'✓'}</div><div class="modal-title">Delete ${visible?'visible':'selected'} History ${n===1?'entry':'entries'}?</div>
    <p>You are about to permanently remove <b>${n.toLocaleString()}</b> ${n===1?'History entry':'History entries'}${visible?' from the page currently visible':''}.</p>
    <div class="v253-history-confirm-note">MediaFlow will recalculate History-based statistics and scheduling from what remains. The deletion is saved as one undoable MediaFlow change.</div>
    <div class="modal-actions"><button type="button" class="btn btn-ghost" onclick="App.v253CancelHistoryDelete()">Cancel</button><button type="button" class="btn btn-danger" onclick="App.v253ConfirmHistoryDelete(this)">Delete ${n.toLocaleString()}</button></div></div>`;
}
function v253OpenHistoryDeleteConfirm(kind){
  const data=v253HistoryPageData();
  const ids=kind==='visible'?data.pageItems.map(s=>String(s.id)):[...V253_HISTORY_SELECTED].filter(id=>(S.sessions||[]).some(s=>String(s.id)===id));
  if(!ids.length){showToast(kind==='visible'?'There are no visible History entries to delete.':'Select at least one History entry first.');return;}
  V253_HISTORY_DELETE_PENDING={kind,ids:[...new Set(ids)]};
  document.getElementById('modal-root')?.remove();const root=document.createElement('div');root.id='modal-root';
  root.innerHTML=`<div class="modal-overlay v253-history-confirm-overlay" onclick="if(event.target===this)App.v253CancelHistoryDelete()"><div class="modal">${v253HistoryDeleteConfirmHtml(kind,V253_HISTORY_DELETE_PENDING.ids)}</div></div>`;
  document.body.appendChild(root);
}
function v253CancelHistoryDelete(){V253_HISTORY_DELETE_PENDING=null;document.getElementById('modal-root')?.remove();}
async function v253ConfirmHistoryDelete(button){
  if(button?.dataset?.working==='1')return;const pending=V253_HISTORY_DELETE_PENDING;if(!pending)return v253CancelHistoryDelete();
  if(button){button.dataset.working='1';button.disabled=true;}
  const ids=new Set(pending.ids),count=[...(S.sessions||[])].filter(s=>ids.has(String(s.id))).length;V253_HISTORY_DELETE_PENDING=null;document.getElementById('modal-root')?.remove();
  if(!count){showToast('Those History entries are no longer available.');return;}
  try{mfBegin('Delete history',`${count} ${count===1?'entry':'entries'}`);}catch(_){ }
  S.sessions=(S.sessions||[]).filter(s=>!ids.has(String(s.id)));
  for(const id of ids)V253_HISTORY_SELECTED.delete(String(id));S.histPage=0;
  try{mfCommit('Delete history',`${count} ${count===1?'entry':'entries'}`);}catch(_){try{persistSessions();}catch(__){ }}
  render();showToast(`${count.toLocaleString()} History ${count===1?'entry':'entries'} deleted · Undo available`);
}
function v253HistorySelectionBar(data){
  const selected=V253_HISTORY_SELECTED.size,visible=data.pageItems.length;
  return `<div class="v253-history-batchbar"><div class="v253-history-batch-left"><button type="button" class="btn btn-sm" ${visible?'':'disabled'} onclick="App.v253SelectVisibleHistory()">Select visible</button><button type="button" class="btn btn-sm btn-ghost" ${selected?'':'disabled'} onclick="App.v253DeselectHistory()">Deselect</button><span><b>${selected.toLocaleString()}</b> selected</span></div><div class="v253-history-batch-actions"><button type="button" class="btn btn-sm btn-danger" ${selected?'':'disabled'} onclick="App.v253OpenHistoryDeleteConfirm('selected')">Delete selected</button><button type="button" class="btn btn-sm btn-danger v253-delete-visible" ${visible?'':'disabled'} onclick="App.v253OpenHistoryDeleteConfirm('visible')">Delete visible (${visible})</button></div></div>`;
}
function v253HistoryRowHtml(s){
  const cat=getCategory(s.categoryId),d=new Date(Number(s.timestamp)||Date.now()),labelMap={complete:'Complete',partial:'Partial',over:'Over',skipped:'Skipped',logged:'Logged'},checked=V253_HISTORY_SELECTED.has(String(s.id));
  return `<div class="hist-row v253-history-row ${checked?'is-selected':''}"><label class="v253-history-check" title="Select this History entry"><input type="checkbox" ${checked?'checked':''} onchange="App.v253ToggleHistorySelection('${escapeHtml(String(s.id))}',this.checked)"><span aria-hidden="true"></span></label><div class="hist-date">${fmtDate(s.date)}<br><span style="opacity:.6;">${d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}</span></div><div class="hist-icon" style="background:${cat.color}22;color:${cat.color};">${v144CategoryIconHtml(cat)}</div><div class="hist-main"><div class="hist-cat">${escapeHtml(cat.name)}</div><div class="hist-amt">${s.actualAmount} ${unitLabel(s.unit,s.actualAmount)} · ${fmtMinutes(s.minutes)}${s.status==='logged'?'':` · target ${s.targetAmount}`}</div>${s.source==='batch'?'<div class="hist-note" style="margin-top:4px">Batch Log</div>':''}${s.assignedCategoryId&&s.assignedCategoryId!==s.categoryId?`<div class="hist-note" style="margin-top:4px">Recommended: ${escapeHtml(getCategory(s.assignedCategoryId)?.name||'Unknown')}</div>`:''}${s.status!=='skipped'?`<div class="hist-xp" style="margin-top:4px;font-size:11px;color:var(--flow);font-weight:800;">+${Math.round(sessionStoredXP(s)).toLocaleString()} XP · ${escapeHtml(xpRotationLabel(s.healthStatus||'healthy'))} · 🔥 ${escapeHtml(v149SessionStreakLabel(s))}</div>`:''}${s.note?`<div class="hist-note">&quot;${escapeHtml(s.note)}&quot;</div>`:''}</div><div class="hist-status"><span class="status-badge status-${s.status==='skipped'?'overused':s.status==='partial'?'due':s.status==='over'?'neglected':'healthy'}">${labelMap[s.status]||'Logged'}</span><div class="v253-history-row-actions"><button class="btn btn-sm btn-ghost" onclick="App.openSessionModal('${escapeHtml(String(s.id))}')">Edit</button><button class="btn btn-sm btn-danger" onclick="App.deleteSession('${escapeHtml(String(s.id))}')">Delete</button></div></div></div>`;
}
renderHistory=function(){
  v253PruneHistorySelection();const f=S.histFilters=S.histFilters||{},data=v253HistoryPageData();
  const rows=data.pageItems.map(v253HistoryRowHtml).join('')||'<div class="empty-state"><div class="em-icon">🕓</div><div class="em-title">No sessions yet</div><div>No History entries match the current filters.</div></div>';
  const pager=data.list.length>data.pageSize?`<div class="lib-pagination v253-history-pager"><button class="btn btn-sm" ${data.page<=0?'disabled':''} onclick="App.setHistPage(${data.page-1})">← Previous</button><span>Page ${data.page+1} of ${data.pageCount} · ${data.list.length.toLocaleString()} entries</span><button class="btn btn-sm" ${data.page>=data.pageCount-1?'disabled':''} onclick="App.setHistPage(${data.page+1})">Next →</button></div>`:(data.list.length?`<div class="health-note">${data.list.length.toLocaleString()} history ${data.list.length===1?'entry':'entries'}.</div>`:'');
  const pageSize=`<label class="v253-history-page-size"><span>Per page</span><input type="number" min="1" max="500" step="1" value="${data.pageSize}" onchange="App.v253SetHistoryPageSize(this.value)" onkeydown="if(event.key==='Enter')this.blur()"><small>Default 10</small></label>`;
  return `<div class="view-head v242-history-head"><div><div class="view-title">History</div><div class="view-desc">Every logged task — edit, select or delete entries and MediaFlow recalculates from what remains.</div></div>${S.sessions.length?'<button class="btn btn-sm v242-history-undo" onclick="App.undoLastEntry()">↺ Undo last entry</button>':''}</div>
    <div class="lib-toolbar v241-history-toolbar v242-history-toolbar v253-history-toolbar"><div class="lib-filters">${v241HistoryCategoryFilterHtml()}<select onchange="App.setHistFilter('type',this.value)"><option value="all">All media types</option><option value="video" ${f.type==='video'?'selected':''}>Video</option><option value="reading" ${f.type==='reading'?'selected':''}>Reading</option></select><select onchange="App.setHistFilter('range',this.value)"><option value="all" ${f.range==='all'?'selected':''}>All time</option><option value="today" ${f.range==='today'?'selected':''}>Today</option><option value="week" ${f.range==='week'?'selected':''}>This week</option><option value="month" ${f.range==='month'?'selected':''}>This month</option><option value="custom" ${f.range==='custom'?'selected':''}>Custom dates</option></select><div class="v241-history-date-filter"><label>From<input type="date" value="${escapeHtml(f.dateFrom||'')}" onchange="App.v241SetHistoryDate('from',this.value)"></label><label>To<input type="date" value="${escapeHtml(f.dateTo||'')}" onchange="App.v241SetHistoryDate('to',this.value)"></label>${(f.dateFrom||f.dateTo)?'<button type="button" class="btn btn-sm btn-ghost" onclick="App.v241ClearHistoryDates()">Clear dates</button>':''}</div></div><div class="v253-history-toolbar-actions">${pageSize}<button class="btn btn-sm v242-history-export" onclick="App.exportCSV()">Export CSV</button></div></div>
    ${v253HistorySelectionBar(data)}${pager}<div class="card v253-history-card">${rows}</div>${pager}`;
};

/* ---------- Persistence / audit ----------------------------------------- */
function v253EnsureHistoryPreference(settings=S.settings||DEFAULT_SETTINGS){if(!settings)return settings;const n=Number(settings.historyPageSize);settings.historyPageSize=Math.max(1,Math.min(500,Number.isFinite(n)&&n>0?Math.round(n):10));return settings;}
DEFAULT_SETTINGS.historyPageSize=10;v253EnsureHistoryPreference(S.settings||DEFAULT_SETTINGS);
const v253PersistSettingsBase=persistSettings;
persistSettings=function(){v253EnsureHistoryPreference(S.settings||DEFAULT_SETTINGS);return v253PersistSettingsBase.apply(this,arguments);};
const v253LoadAllBase=loadAll;
loadAll=async function(){await v253LoadAllBase.apply(this,arguments);v253EnsureHistoryPreference(S.settings||DEFAULT_SETTINGS);S.histPageSize=v253HistoryPageSize();};
const v253ApplyStateBase=v46ApplyState;
v46ApplyState=function(){const out=v253ApplyStateBase.apply(this,arguments);v253EnsureHistoryPreference(S.settings||DEFAULT_SETTINGS);S.histPageSize=v253HistoryPageSize();return out;};
const v253BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){const manifest=v253BackupManifestBase.apply(this,arguments);manifest.includes=Object.assign({},manifest.includes||{},{seasonsUiRepairV253:true,recommendedTitleLoggingShortcutV253:true,historyPageSizeV253:true,historyBatchDeleteV253:true});manifest.v253={historyPageSize:v253HistoryPageSize(),historyPageSizePersistent:true,historyBatchSelectionTransient:true,cloudSyncVersion:201,fullBackupSchema:29,settingsPresetSchema:1,personalOrderExportVersion:4};return manifest;};
const v253BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){v253EnsureHistoryPreference(S.settings||DEFAULT_SETTINGS);const payload=v253BuildFullBackupBase.apply(this,arguments);payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});payload.backupManifest.note='Complete MediaFlow v253 backup. Includes v252 Seasons View data plus persistent History page-size preference, while History selection itself remains transient UI state. Preserves all v250-v252 cloud, XP, History, Personal Order, Settings, update and PWA data.';return payload;};

Object.assign(App,{
  v253UseRecommendedTitle,v253SetHistoryPageSize,v253ToggleHistorySelection,v253SelectVisibleHistory,v253DeselectHistory,
  v253OpenHistoryDeleteConfirm,v253CancelHistoryDelete,v253ConfirmHistoryDelete,
  v253HistoryPageData:()=>v253HistoryPageData(),v253HistorySelectedCount:()=>V253_HISTORY_SELECTED.size,
  v253CurrentLogFormHtml:()=>{const t=S.currentTask;return t?renderLogForm(t,getCategory(t.categoryId)):'';}
});
MediaFlowRuntime.version=V253_RUNTIME_VERSION;
