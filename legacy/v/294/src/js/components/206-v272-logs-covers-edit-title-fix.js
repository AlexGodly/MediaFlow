/* ============================================================
   MediaFlow v272 — Logs Covers + Edit Title Header Repair
   ------------------------------------------------------------
   - Shows consumed title covers + names in History -> Logs.
   - Uses MediaFlow category artwork when a title has no cover URL.
   - Adds an independent persistent Logs cover-size setting.
   - Repairs the Edit Title heading/Delete title layout so the two
     actions never overlap or inherit the old sticky-title geometry.
   ============================================================ */
const V272_RUNTIME_VERSION=272;

/* ---------- Logs title resolution ------------------------------------ */
function v272LogRows(session){
  const rows=Array.isArray(session?.titles)
    ?session.titles.filter(row=>row&&(row.title||row.libraryId))
    :[];
  if(rows.length)return rows;
  const title=cleanTitle(session?.title||session?.libraryTitle||'');
  if(title||session?.libraryId){
    return [{title:title||'Untitled',libraryId:session?.libraryId||null,qty:Number(session?.actualAmount)||0}];
  }
  return [];
}
function v272LogItem(session,row){
  const rowId=String(row?.libraryId||'');
  if(rowId){
    try{const item=v270LibraryById(rowId);if(item)return item;}catch(_){ }
  }
  const sessionId=String(session?.libraryId||'');
  if(sessionId){
    try{const item=v270LibraryById(sessionId);if(item)return item;}catch(_){ }
  }
  const title=cleanTitle(row?.title||session?.title||session?.libraryTitle||'');
  if(title){
    try{return v270LibraryByTitle(title,session?.categoryId||row?.categoryId||'')||null;}catch(_){ }
  }
  return null;
}
function v272LogCoverHtml(item,cat,title){
  const cover=String(item?.coverUrl||item?.cover||item?.imageUrl||'').trim();
  const fallback=cat
    ?v144CategoryIconHtml(cat)
    :escapeHtml((cleanTitle(title)||'?').charAt(0).toUpperCase());
  if(!cover){
    return `<span class="mf272-log-title-cover mf272-log-title-cover-fallback" style="--mf272-log-cat:${escapeHtml(cat?.color||'var(--flow)')}" aria-label="${escapeHtml(cat?.name||'Category')} artwork">${fallback}</span>`;
  }
  return `<span class="mf272-log-title-cover"><img src="${escapeHtml(cover)}" alt="${escapeHtml(cleanTitle(title)||'Title')} cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="mf272-log-title-cover-fallback" style="display:none;--mf272-log-cat:${escapeHtml(cat?.color||'var(--flow)')}">${fallback}</span></span>`;
}
function v272LogTitleRailHtml(session){
  const rows=v272LogRows(session);
  if(!rows.length)return '';
  return `<div class="mf272-log-title-rail" aria-label="Consumed titles">${rows.map(row=>{
    const item=v272LogItem(session,row);
    const cat=getCategory(item?.categoryId||row?.categoryId||session?.categoryId);
    const title=cleanTitle(item?.title||row?.title||session?.title||session?.libraryTitle||cat?.name||'Media');
    const qty=Math.max(0,Number(row?.qty)||0);
    const click=item?.id
      ?`App.v181OpenTitleDetails('${escapeHtml(String(item.id))}')`
      :`App.openSessionModal('${escapeHtml(String(session?.id||''))}')`;
    return `<button type="button" class="mf272-log-title-card mf271-visual-card" onclick="${click}" title="${escapeHtml(title)}">${v272LogCoverHtml(item,cat,title)}<span class="mf272-log-title-copy"><b>${escapeHtml(title)}</b>${qty>0?`<small>×${qty.toLocaleString()}</small>`:''}</span></button>`;
  }).join('')}</div>`;
}
function v272SessionIdFromHistoryRow(row){
  const nodes=[...row.querySelectorAll('[onchange],[onclick]')];
  for(const node of nodes){
    const code=String(node.getAttribute('onchange')||node.getAttribute('onclick')||'');
    const match=code.match(/(?:v253ToggleHistorySelection|openSessionModal|deleteSession)\('([^']+)'/);
    if(match)return match[1];
  }
  return '';
}
function v272GeneratedLogNoteCandidates(session){
  const labels=v272LogRows(session).map(row=>{
    const title=cleanTitle(row?.title||v272LogItem(session,row)?.title||'');
    const qty=Math.max(0,Number(row?.qty)||0);
    return qty>1?`${title} x${qty}`:title;
  }).filter(Boolean);
  if(!labels.length)return new Set();
  return new Set([
    labels.join(', '),labels.join(' · '),labels.join(' + '),labels.join('; '),
    ...labels
  ].map(x=>String(x).trim().toLocaleLowerCase()));
}
function v272DecorateLogsHtml(html){
  try{
    const host=document.createElement('div');host.innerHTML=String(html||'');
    const sessions=new Map((S.sessions||[]).map(session=>[String(session?.id||''),session]));
    host.querySelectorAll('.hist-row').forEach(row=>{
      const id=v272SessionIdFromHistoryRow(row),session=sessions.get(String(id));
      if(!session)return;
      row.classList.add('mf272-log-row');
      row.querySelector(':scope > .hist-icon')?.remove();
      const main=row.querySelector(':scope > .hist-main');
      if(!main)return;
      main.querySelector(':scope > .mf272-log-title-rail')?.remove();
      const railHtml=v272LogTitleRailHtml(session);
      if(railHtml){
        const wrap=document.createElement('div');wrap.innerHTML=railHtml;
        main.insertBefore(wrap.firstElementChild,main.firstChild);
      }

      // Older History often stored the automatic title summary in `note`.
      // Once the actual title cards are visible, remove only notes that are
      // exact generated title summaries; genuine user notes remain untouched.
      const candidates=v272GeneratedLogNoteCandidates(session);
      main.querySelectorAll(':scope > .hist-note').forEach(note=>{
        const text=String(note.textContent||'').trim().replace(/^["“”']+|["“”']+$/g,'').trim().toLocaleLowerCase();
        if(text&&candidates.has(text))note.remove();
      });
    });
    return host.innerHTML;
  }catch(_){return String(html||'');}
}

const v272HistoryBodyBase=v260HistoryBody;
v260HistoryBody=function(tab){
  let html=v272HistoryBodyBase.apply(this,arguments);
  if(tab==='logs')html=v272DecorateLogsHtml(html);
  return html;
};

/* ---------- Independent Logs cover-size setting ---------------------- */
V181_COVER_SIZE_DEFAULTS.historyLogs=100;
V181_COVER_LABELS.historyLogs='History · Logs covers';
V271_COVER_VAR_MAP.historyLogs='--v181-cover-history-logs';
v181EnsureCoverSizes(DEFAULT_SETTINGS);
v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
v271ApplyHistoryCoverVars();

/* Keep the global icon enhancer away from visual Logs title cards. */
const v272ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(el?.matches?.('.mf272-log-title-card'))return null;
  return v272ButtonIconNameBase(el);
};

/* ---------- Edit Title header repair --------------------------------- */
const v272LibraryModalBase=libraryModalHtml;
libraryModalHtml=function(d){
  const html=String(v272LibraryModalBase.apply(this,arguments)||'');
  if(!d?.id)return html;
  try{
    const tpl=document.createElement('template');tpl.innerHTML=html;
    const editor=tpl.content.querySelector('.v240-library-editor,.v238-library-editor');
    const title=editor?.querySelector('.modal-title');
    const del=[...(editor?.querySelectorAll('button')||[])].find(btn=>String(btn.textContent||'').trim().toLocaleLowerCase()==='delete title');
    if(editor&&title&&del){
      let head=title.closest('.mf265-edit-title-head,.mf266-edit-title-head');
      if(!head){
        head=document.createElement('div');
        title.parentNode?.insertBefore(head,title);
        head.appendChild(title);
        head.appendChild(del);
      }else if(del.parentElement!==head){
        head.appendChild(del);
      }
      head.classList.add('mf272-edit-title-head');
      title.classList.add('mf272-edit-title-label');
      title.textContent='Edit title';
      del.classList.add('mf272-edit-title-delete');
      del.textContent='Delete title';
      del.setAttribute('aria-label','Delete title');
      del.dataset.v225Iconified='1';
    }
    return tpl.innerHTML;
  }catch(_){return html;}
};

/* ---------- Release / persistence audit ------------------------------ */
if(typeof v148BackupManifest==='function'){
  const v272BackupManifestBase=v148BackupManifest;
  v148BackupManifest=function(){
    const manifest=v272BackupManifestBase.apply(this,arguments);
    manifest.includes=Object.assign({},manifest.includes||{}, {
      historyLogsTitleCoversV272:true,
      historyLogsCategoryArtworkFallbackV272:true,
      historyLogsCoverSizingV272:true,
      editTitleHeaderRepairV272:true
    });
    manifest.v272={
      logsTitleCovers:true,
      logsCategoryArtworkFallback:true,
      logsCoverSizePersistent:true,
      editTitleHeaderRepaired:true,
      cloudSyncVersion:201,
      fullBackupSchema:29,
      settingsPresetSchema:1,
      personalOrderExportVersion:4,
      pwaRelease:272
    };
    return manifest;
  };
}

function v272AuditState(){
  const cfg=v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  let snap=null,preset=null;
  try{snap=snapshot();}catch(_){ }
  try{preset=v196BuildSettingsPreset();}catch(_){ }
  return {
    version:V272_RUNTIME_VERSION,
    historyLogsCoverSize:cfg.historyLogs,
    snapshotHistoryLogsCoverSize:snap?.settings?.v181CoverSizes?.historyLogs,
    presetHistoryLogsCoverSize:preset?.settings?.v181CoverSizes?.historyLogs
  };
}

Object.assign(App,{v272AuditState});
window.MediaFlowV272={version:272,focus:'History Logs title covers, independent Logs cover sizing and Edit Title header repair'};
MediaFlowRuntime.version=V272_RUNTIME_VERSION;
