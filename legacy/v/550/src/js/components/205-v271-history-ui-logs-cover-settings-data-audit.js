/* ============================================================
   MediaFlow v271 — History UI Polish, Logs Tab, Cover Sizing & Data Audit
   ----------------------------------------------------------------------
   - Fixes the Consumption History category dropdown clipping.
   - Uses semantic icons only where an icon communicates the action.
   - Keeps visual cover/title buttons icon-free.
   - Enlarges and aligns Consumption History covers/text.
   - Adds drag-to-scroll, scrollbar-free weekly category rails.
   - Adds a Logs tab using the pre-v260/v269 paginated History UI.
   - Adds persistent/cloud-synced cover sizing for History surfaces.
   - Audits current export/backup/settings/order/PWA compatibility.
   ============================================================ */
const V271_RUNTIME_VERSION=271;

/* ---------- Semantic icon policy -------------------------------------- */
Object.assign(V225_BUTTON_ICONS,{
  selection:v225IconSvg('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 2.6 2.6L16.5 9"/>'),
  viewOptions:v225IconSvg('<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="18" r="2"/>'),
  logs:v225IconSvg('<path d="M7 4h10M7 8h10M7 12h7M7 16h10"/><rect x="3" y="2" width="18" height="20" rx="3"/>')
});

const v271ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(!el)return null;

  // Poster/title-cover controls are visual content. A generic action glyph on
  // top of or beside their covers is misleading and destabilizes alignment.
  if(el.matches?.('.mf269-latest-title,.mf269-card-main,.mf269-most-card,.mf271-visual-card'))return null;

  // History tabs already carry their own intentional tab glyphs in markup;
  // never stack a second global button icon on top of them.
  if(el.matches?.('.v260-history-tab'))return null;
  if(el.matches?.('.mf269-select-toggle'))return el.classList.contains('active')?'confirm':'selection';
  if(el.matches?.('.mf269-options>summary'))return 'viewOptions';

  return v271ButtonIconNameBase(el);
};

function v271RefreshSemanticIcons(root=document){
  const visual=root.querySelectorAll?.('.mf269-latest-title,.mf269-card-main,.mf269-most-card')||[];
  visual.forEach(el=>{
    el.querySelectorAll(':scope > .v225-btn-icon').forEach(icon=>icon.remove());
    delete el.dataset.v225Iconified;
    // Re-run once so v271's semantic policy marks the element as handled
    // without injecting a generic icon.
    try{v225EnhanceButtonIcon(el);}catch(_){ }
  });

  root.querySelectorAll?.('.mf269-select-toggle,.mf269-options>summary,.v260-history-tab').forEach(el=>{
    el.querySelectorAll(':scope > .v225-btn-icon').forEach(icon=>icon.remove());
    delete el.dataset.v225Iconified;
    try{v225EnhanceButtonIcon(el);}catch(_){ }
  });
}

/* ---------- Category filter viewport portal --------------------------- */
let V271_CATEGORY_POSITION_FRAME=0;
function v271PositionHistoryCategoryPanel(details=document.querySelector('[data-v241-history-category-filter][open]')){
  if(!details?.open)return;
  const summary=details.querySelector(':scope > summary');
  const panel=details.querySelector(':scope > .v236-category-filter-panel');
  if(!summary||!panel)return;

  const vw=Math.max(280,window.innerWidth||document.documentElement.clientWidth||1200);
  if(vw<=700){
    panel.style.removeProperty('--mf271-cat-left');
    panel.style.removeProperty('--mf271-cat-top');
    return;
  }

  const r=summary.getBoundingClientRect();
  const width=Math.min(430,Math.max(280,vw-24));
  const left=Math.max(12,Math.min(r.left,vw-width-12));
  panel.style.setProperty('--mf271-cat-left',`${Math.round(left)}px`);
  panel.style.setProperty('--mf271-cat-top',`${Math.round(r.bottom+8)}px`);

  requestAnimationFrame(()=>{
    if(!details.open)return;
    const pr=panel.getBoundingClientRect();
    const vh=window.innerHeight||document.documentElement.clientHeight||800;
    if(pr.bottom>vh-12&&r.top-pr.height-8>=12){
      panel.style.setProperty('--mf271-cat-top',`${Math.round(r.top-pr.height-8)}px`);
    }
  });
}
function v271ScheduleCategoryPanelPosition(){
  if(V271_CATEGORY_POSITION_FRAME)return;
  V271_CATEGORY_POSITION_FRAME=requestAnimationFrame(()=>{
    V271_CATEGORY_POSITION_FRAME=0;
    v271PositionHistoryCategoryPanel();
  });
}
const v271HistoryCategoryToggleBase=App.v241HistoryCategoryToggle;
App.v241HistoryCategoryToggle=function(el){
  const out=typeof v271HistoryCategoryToggleBase==='function'?v271HistoryCategoryToggleBase.apply(this,arguments):undefined;
  if(el?.open)requestAnimationFrame(()=>v271PositionHistoryCategoryPanel(el));
  return out;
};
window.addEventListener('resize',v271ScheduleCategoryPanelPosition,{passive:true});
document.addEventListener('scroll',v271ScheduleCategoryPanelPosition,{passive:true,capture:true});

/* ---------- Mouse/touch drag for weekly category rails ---------------- */
function v271BindCategoryDrag(track){
  if(!track||track.dataset.mf271DragBound==='1')return;
  track.dataset.mf271DragBound='1';
  let dragging=false,startX=0,startScroll=0,moved=false;
  track.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.target.closest('button,a,input,select,summary'))return;
    dragging=true;moved=false;startX=event.clientX;startScroll=track.scrollLeft;
    track.classList.add('is-dragging');
    try{track.setPointerCapture(event.pointerId);}catch(_){ }
  });
  track.addEventListener('pointermove',event=>{
    if(!dragging)return;
    const delta=event.clientX-startX;
    if(Math.abs(delta)>3)moved=true;
    if(moved){track.scrollLeft=startScroll-delta;event.preventDefault();}
  });
  const stop=event=>{
    if(!dragging)return;dragging=false;track.classList.remove('is-dragging');
    try{track.releasePointerCapture(event.pointerId);}catch(_){ }
  };
  track.addEventListener('pointerup',stop);track.addEventListener('pointercancel',stop);
}
function v271BindHistoryDrags(root=document){root.querySelectorAll?.('.mf269-week-categories').forEach(v271BindCategoryDrag);}

/* ---------- New Logs tab: restored pre-redesign History ---------------- */
if(!V260_HISTORY_TABS.includes('logs')){
  const libraryIndex=V260_HISTORY_TABS.indexOf('library');
  V260_HISTORY_TABS.splice(libraryIndex>=0?libraryIndex:V260_HISTORY_TABS.length,0,'logs');
}
V260_HISTORY_LABELS.logs='Logs';

function v271HistoryTabsHtml(active=v260HistoryTab()){
  const icons={
    consumption:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9m5 10V5m5 14v-7m5 7V3"/></svg>',
    recent:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5l3 2M3.5 12a8.5 8.5 0 1 0 2.5-6M3 4v5h5"/></svg>',
    ratings:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.5 6 .9-4.4 4.3 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.3 6-.9Z"/></svg>',
    logs:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    library:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22Zm16 0A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22Z"/></svg>'
  };
  return `<div class="v260-history-tabs" role="tablist" aria-label="History views">${V260_HISTORY_TABS.map(tab=>`<button type="button" role="tab" aria-selected="${active===tab?'true':'false'}" class="v260-history-tab ${tab==='logs'?'mf271-logs-tab ':''}${active===tab?'active':''}" onclick="App.v260SetHistoryTab('${tab}')">${icons[tab]||''}<span>${V260_HISTORY_LABELS[tab]||tab}</span></button>`).join('')}</div>`;
}
v260HistoryTabsHtml=v271HistoryTabsHtml;

function v271StripLegacyHistoryHead(html){
  const host=document.createElement('div');host.innerHTML=String(html||'');
  host.querySelector('.view-head')?.remove();
  return host.innerHTML;
}
function v271LogsHtml(){
  let html='';
  try{html=v271StripLegacyHistoryHead(v260BaseRenderHistory());}catch(_){html='';}
  if(!html)return '<div class="v260-empty"><b>No logs available</b><span>Your original paginated History logs will appear here.</span></div>';
  html=String(html).replace(/App\.exportCSV\(\)/g,'App.v271ExportLogsCSV()');
  return `<div class="mf271-logs" data-history-legacy-logs>${html}</div>`;
}
const v271HistoryBodyBase=v260HistoryBody;
v260HistoryBody=function(tab){
  if(tab==='logs')return v271LogsHtml();
  let html=v271HistoryBodyBase.apply(this,arguments);
  if(tab==='consumption')html=String(html||'').replace(/onclick="App\.exportCSV\(\)"/g,'onclick="App.v271ExportConsumptionCSV()"');
  return html;
};

/* ---------- Cover-size settings --------------------------------------- */
Object.assign(V181_COVER_SIZE_DEFAULTS,{
  historyLatest:100,
  historyWeekSummary:100,
  historyConsumptionCard:100,
  historyRecent:100,
  historyRatings:100
});
Object.assign(V181_COVER_LABELS,{
  historyLatest:'Consumption History · Latest consumed covers',
  historyWeekSummary:'Consumption History · Week summary covers',
  historyConsumptionCard:'Consumption History · Daily log covers',
  historyRecent:'History · Recently viewed covers',
  historyRatings:'History · Ratings covers'
});
V181_COVER_LABELS.recommended='Dashboard · Recommended title cover';
v181EnsureCoverSizes(DEFAULT_SETTINGS);
v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);

const V271_COVER_VAR_MAP={
  historyLatest:'--v181-cover-history-latest',
  historyWeekSummary:'--v181-cover-history-week-summary',
  historyConsumptionCard:'--v181-cover-history-consumption-card',
  historyRecent:'--v181-cover-history-recent',
  historyRatings:'--v181-cover-history-ratings'
};
function v271ApplyHistoryCoverVars(){
  const root=document.documentElement,cfg=v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  for(const [key,varName] of Object.entries(V271_COVER_VAR_MAP))root.style.setProperty(varName,String(v181ClampCoverSize(cfg[key],100)/100));
}
const v271ApplyCoverVarsBase=v181ApplyCoverVars;
v181ApplyCoverVars=function(){const out=v271ApplyCoverVarsBase.apply(this,arguments);v271ApplyHistoryCoverVars();return out;};
const v271PreviewCoverSizeBase=v181PreviewCoverSize;
v181PreviewCoverSize=function(kind,value){
  const out=v271PreviewCoverSizeBase.apply(this,arguments);
  const varName=V271_COVER_VAR_MAP[kind];
  if(varName)document.documentElement.style.setProperty(varName,String(v181ClampCoverSize(value,V181_COVER_SIZE_DEFAULTS[kind]||100)/100));
  return out;
};
v271ApplyHistoryCoverVars();

/* Settings Presets clone the complete settings object. Normalize the new
   cover keys immediately on import as well so older presets get defaults and
   newer presets restore every v271 cover size without a schema bump. */
const v271NormalizeImportedSettingsBase=v196NormalizeImportedSettings;
v196NormalizeImportedSettings=function(raw){
  const next=v271NormalizeImportedSettingsBase.apply(this,arguments);
  v181EnsureCoverSizes(next);
  return next;
};

/* ---------- Dedicated current History exports ------------------------- */
function v271CsvCell(value){
  const text=typeof value==='string'?value:JSON.stringify(value??'');
  return /[",\n\r]/.test(text)?`"${text.replace(/"/g,'""')}"`:text;
}
function v271ExportHistorySessions(sessions,prefix){
  const header=['id','date','time','timestamp','category','category_id','target','actual','unit','minutes','status','note','xp','health_status','source','assigned_category_id','assigned_target','followed_assigned_category','session_group_id','batch_group_id','titles_json','mediaflow_version','session_json','v369_itemized_units_json','v369_duration_seconds','v369_itemized'];
  const rows=(Array.isArray(sessions)?sessions:[]).slice().sort((a,b)=>(Number(a?.timestamp)||0)-(Number(b?.timestamp)||0)).map(s=>{
    const cat=getCategory(s.categoryId),d=new Date(Number(s.timestamp)||Date.now());
    return [s.id||'',s.date||'',d.toLocaleTimeString(),Number(s.timestamp)||'',cat?.name||'',s.categoryId||'',s.targetAmount??'',s.actualAmount??'',s.unit||'',s.minutes??'',s.status||'',s.note||'',Math.round(sessionStoredXP(s)||0),s.healthStatus||'',s.source||'',s.assignedCategoryId||'',s.assignedTargetAmount??'',s.followedAssignedCategory??'',s.sessionGroupId||'',s.batchGroupId||'',Array.isArray(s.titles)?s.titles:[],v161CurrentVersion(),s,(s.titles||[]).flatMap(t=>(t.v369Units||[]).map(u=>({title:t.title||'',libraryId:t.libraryId||'',...u}))),s.v369DurationSeconds??'',s.v369Itemized===true];
  });
  const csv=[header,...rows].map(row=>row.map(v271CsvCell).join(',')).join('\n');
  triggerDownload(new Blob([csv],{type:'text/csv;charset=utf-8'}),`${prefix}-${todayISO()}.csv`);
}
function v271ConsumptionSessionsForExport(){
  let list=[];
  try{list=(v253HistoryPageData().list||[]).slice();}catch(_){list=v270SortedSessions();}
  const year=document.querySelector('.mf269-filterbar select[onchange*="v269SetYear"]')?.value||'all';
  const month=document.querySelector('.mf269-filterbar select[onchange*="v269SetMonth"]')?.value||'all';
  if(year!=='all')list=list.filter(s=>String(new Date(Number(s?.timestamp)||Date.now()).getFullYear())===String(year));
  if(month!=='all')list=list.filter(s=>String(new Date(Number(s?.timestamp)||Date.now()).getMonth()+1)===String(month));
  return list;
}
function v271ExportConsumptionCSV(){return v271ExportHistorySessions(v271ConsumptionSessionsForExport(),'mediaflow-consumption-history');}
function v271ExportLogsCSV(){
  let list=[];try{list=v253HistoryPageData().list||[];}catch(_){list=v270SortedSessions();}
  return v271ExportHistorySessions(list,'mediaflow-history-logs');
}

/* ---------- Render-time polish ---------------------------------------- */
function v271CleanHeaderVersionText(root=document){
  // The persistent top-right release chip was removed in v270. Keep the
  // surrounding page chrome version-neutral too so an older enhancer cannot
  // leave a stale "MediaFlow v###" subtitle behind. Version details remain
  // available in About / Version & Updates where they belong.
  root.querySelectorAll?.('.v260-topbar-copy span').forEach(span=>{
    const text=String(span.textContent||'');
    if(/MediaFlow\s+v\d+/i.test(text))span.textContent=text.replace(/MediaFlow\s+v\d+/ig,'MediaFlow');
  });
  try{v270RemoveVersionChrome(root);}catch(_){ }
}
function v271AfterPaint(fn){requestAnimationFrame(()=>requestAnimationFrame(()=>{try{fn();}catch(_){ }}));}
function v271EnhanceHistoryUI(){
  v271RefreshSemanticIcons(document);
  v271BindHistoryDrags(document);
  v271PositionHistoryCategoryPanel();
  v271ApplyHistoryCoverVars();
  v271CleanHeaderVersionText(document);
}
const v271RenderBase=render;
render=function(){
  const out=v271RenderBase.apply(this,arguments);
  queueMicrotask(v271EnhanceHistoryUI);
  // Older post-paint enhancers can run after the synchronous render. Clean
  // chrome once more after them so stale version text never reappears.
  v271AfterPaint(()=>v271CleanHeaderVersionText(document));
  return out;
};

/* ---------- Persistence / release audit ------------------------------- */
if(typeof v148BackupManifest==='function'){
  const v271BackupManifestBase=v148BackupManifest;
  v148BackupManifest=function(state,extras){
    const manifest=v271BackupManifestBase.apply(this,arguments);
    manifest.includes=Object.assign({},manifest.includes||{}, {
      historyUiPolishV271:true,
      historyLogsTabV271:true,
      historyCoverSizingV271:true,
      consumptionAndLogsExportsV271:true,
      semanticIconPolicyV271:true
    });
    manifest.v271={
      historyLogsTab:true,
      historyCategoryPopupPortal:true,
      semanticIconsOnly:true,
      historyCoverSizesPersistent:true,
      historyCoverSizesCloudSynced:true,
      historyExportsCurrent:true,
      automaticBackupUsesFullBackup:true,
      dataExportImportCurrent:true,
      settingsPresetCurrent:true,
      personalOrderExportVersion:4,
      cloudSyncVersion:201,
      fullBackupSchema:29,
      settingsPresetSchema:1,
      pwaRelease:271,
      xpCalculationsPreserved:true
    };
    return manifest;
  };
}

function v271AuditState(){
  const current=v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  let snap=null,preset=null,manifest=null;
  try{snap=snapshot();}catch(_){ }
  try{preset=v196BuildSettingsPreset();}catch(_){ }
  try{manifest=v148BackupManifest(snap||{},{});}catch(_){ }
  return {
    version:V271_RUNTIME_VERSION,
    cloudSyncVersion:Number(snap?.cloudSyncVersion)||201,
    coverSizes:JSON.parse(JSON.stringify(current||{})),
    snapshotCoverSizes:JSON.parse(JSON.stringify(snap?.settings?.v181CoverSizes||{})),
    settingsPresetCoverSizes:JSON.parse(JSON.stringify(preset?.settings?.v181CoverSizes||{})),
    manifestV271:manifest?.v271||null,
    personalOrderExportVersion:4,
    fullBackupSchema:29,
    settingsPresetSchema:1
  };
}

Object.assign(App,{
  v271PositionHistoryCategoryPanel,
  v271ExportConsumptionCSV,
  v271ExportLogsCSV,
  v271EnhanceHistoryUI,
  v271CleanHeaderVersionText,
  v271AuditState
});
window.MediaFlowV271={version:271,focus:'History UI polish, Logs tab, semantic icons, persistent History cover sizing and data-path audit'};
MediaFlowRuntime.version=V271_RUNTIME_VERSION;

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{requestAnimationFrame(v271EnhanceHistoryUI);v271AfterPaint(()=>v271CleanHeaderVersionText(document));},{once:true});
else{requestAnimationFrame(v271EnhanceHistoryUI);v271AfterPaint(()=>v271CleanHeaderVersionText(document));}
