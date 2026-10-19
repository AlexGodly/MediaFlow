/* ============================================================
   MediaFlow v242 — Logging Clarity / History Layout / Logging Performance
   --------------------------------------------------------------------------
   - Enlarges Last progress / Last watched/read progress labels.
   - Keeps logged-title artwork clickable while opting those artwork buttons
     out of the global neutral-button icon decorator.
   - Reuses the v241 Library index for logged-title lookups and adds a compact
     logging-search index/cache for 50K-scale title selection.
   - Polishes History toolbar grouping without changing History data/filter
     semantics.
   - Re-audits current backup / preset / Personal Order export metadata.
   ============================================================ */
const V242_RUNTIME_VERSION=242;

/* Cover-art buttons are visual poster targets, not text actions. Make the
   semantic icon resolver explicitly treat them as icon-free so both the v225
   and v226 decoration layers leave the artwork clean. */
const v242ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(el?.classList?.contains('v242-clean-cover-button')||el?.classList?.contains('v241-logged-cover-button'))return null;
  return v242ButtonIconNameBase(el);
};

/* ---------- Logging artwork: clickable, no neutral overlay icon -------- */
function v242LoggedCoverMarkup(item,title,cls='v239-logged-cover'){
  const id=String(item?.id||''),safeTitle=cleanTitle(item?.title||title||'Untitled'),cat=item?getCategory(item.categoryId):null;
  const fallback=`<span class="${cls} v241-category-cover-fallback" aria-hidden="true">${cat?v144CategoryIconHtml(cat):escapeHtml((safeTitle||'?').charAt(0).toUpperCase())}</span>`;
  if(!id)return item?.coverUrl?`<img class="${cls}" src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(safeTitle)} cover" loading="lazy">`:fallback;
  const image=item?.coverUrl
    ?`<img class="${cls}" src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(safeTitle)} cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">${fallback.replace('aria-hidden="true"','aria-hidden="true" style="display:none"')}`
    :fallback;
  // data-v225-iconified intentionally prevents the global button-icon layer
  // from adding a neutral action glyph over/next to poster artwork.
  return `<button type="button" class="v241-logged-cover-button v242-clean-cover-button" data-v225-iconified="1" title="Open title details" aria-label="Open ${escapeHtml(safeTitle)} details" onclick="event.preventDefault();event.stopPropagation();App.v181OpenTitleDetails('${escapeHtml(id)}')">${image}</button>`;
}
v241LoggedCoverMarkup=v242LoggedCoverMarkup;
v239LoggedCover=function(item,title){return v242LoggedCoverMarkup(item,title,'v239-logged-cover');};

/* ---------- 50K-oriented logging lookup / candidate cache ------------- */
const V242_LOG_INDEX={ref:null,len:-1,token:-1,titleLower:new Map(),exact:new Map()};
const V242_LOG_CANDIDATE_CACHE=new Map();
let V242_LOG_LAST={sig:'',q:'',rows:[]};
function v242ResetLoggingIndex(){
  V242_LOG_INDEX.ref=null;V242_LOG_INDEX.len=-1;V242_LOG_INDEX.token=-1;
  V242_LOG_INDEX.titleLower=new Map();V242_LOG_INDEX.exact=new Map();
  V242_LOG_CANDIDATE_CACHE.clear();V242_LOG_LAST={sig:'',q:'',rows:[]};
}
const v242InvalidateLibraryCacheBase=v53InvalidateLibraryCache;
v53InvalidateLibraryCache=function(){const out=v242InvalidateLibraryCacheBase.apply(this,arguments);v242ResetLoggingIndex();return out;};

function v242EnsureLoggingIndex(){
  try{v241EnsureLibraryIndex();}catch(_){ }
  const lib=S.library||[],token=Number(V53_LIB?.libraryToken)||0;
  if(V242_LOG_INDEX.ref===lib&&V242_LOG_INDEX.len===lib.length&&V242_LOG_INDEX.token===token)return V242_LOG_INDEX;
  const titleLower=new Map(),exact=new Map();
  for(const item of lib){
    if(!item?.id)continue;
    const id=String(item.id),title=cleanTitle(item.title||'').trim().toLocaleLowerCase();
    titleLower.set(id,title);
    const key=String(item.categoryId||'')+'\u0000'+title;
    if(!exact.has(key))exact.set(key,item);
  }
  Object.assign(V242_LOG_INDEX,{ref:lib,len:lib.length,token,titleLower,exact});
  V242_LOG_CANDIDATE_CACHE.clear();V242_LOG_LAST={sig:'',q:'',rows:[]};
  return V242_LOG_INDEX;
}

// Pre-warm the 50K logging title index when the collapsible logging Library
// is opened. The empty browser can render immediately while the browser uses
// idle time to prepare subsequent typing/search work.
const v242ToggleLogLibraryBase=App.v238ToggleLogLibrary;
function v242ToggleLogLibrary(details){
  const out=v242ToggleLogLibraryBase?v242ToggleLogLibraryBase.apply(this,arguments):undefined;
  if(details?.open){
    const warm=()=>{try{v242EnsureLoggingIndex();}catch(_){ }};
    if(typeof requestIdleCallback==='function')requestIdleCallback(warm,{timeout:160});else setTimeout(warm,0);
  }
  return out;
}
if(v242ToggleLogLibraryBase){App.v238ToggleLogLibrary=v242ToggleLogLibrary;v238ToggleLogLibrary=v242ToggleLogLibrary;}

findLibraryMatch=function(categoryId,title){
  const q=cleanTitle(title||'').trim().toLocaleLowerCase();
  if(!q)return null;
  return v242EnsureLoggingIndex().exact.get(String(categoryId||'')+'\u0000'+q)||null;
};

function v242LogFilterSignature(){
  return [
    (V89_LOG.categories||[]).map(String).sort().join(','),
    String(V89_LOG.status||'all'),String(V89_LOG.priority||'all'),String(V89_LOG.sort||'title-asc')
  ].join('|');
}
function v242TrimLoggingCandidateCache(){
  while(V242_LOG_CANDIDATE_CACHE.size>12){const first=V242_LOG_CANDIDATE_CACHE.keys().next().value;V242_LOG_CANDIDATE_CACHE.delete(first);}
}
logTitleCandidates=function(query){
  const q=String(query||'').trim().toLocaleLowerCase();
  if(!q)return [];
  const idx=v242EnsureLoggingIndex(),sig=v242LogFilterSignature(),token=idx.token;
  const cacheKey=token+'|'+sig+'|'+q;
  if(V242_LOG_CANDIDATE_CACHE.has(cacheKey))return V242_LOG_CANDIDATE_CACHE.get(cacheKey);

  // When the user continues typing the same search, narrow the previous result
  // set rather than rescanning all 50K titles again.
  const canNarrow=V242_LOG_LAST.sig===sig&&V242_LOG_LAST.q&&q.startsWith(V242_LOG_LAST.q);
  const source=canNarrow?V242_LOG_LAST.rows:(S.library||[]);
  const cats=(V89_LOG.categories||[]).length?new Set((V89_LOG.categories||[]).map(String)):null;
  const status=String(V89_LOG.status||'all').toLowerCase(),priority=String(V89_LOG.priority||'all').toLowerCase();
  const rows=[];
  for(const item of source){
    if(!item?.id)continue;
    const title=idx.titleLower.get(String(item.id))||'';
    if(!title.includes(q))continue;
    if(cats&&!cats.has(String(item.categoryId||'')))continue;
    if(status!=='all'&&String(item.status||'planned').toLowerCase()!==status)continue;
    if(priority!=='all'&&String(item.priority||'medium').toLowerCase()!==priority)continue;
    rows.push(item);
  }

  const rank={low:0,medium:1,high:2},num=v=>Number.isFinite(Number(v))?Number(v):0;
  const titleOf=x=>idx.titleLower.get(String(x?.id||''))||'';
  const cmpTitle=(a,b)=>titleOf(a).localeCompare(titleOf(b),undefined,{numeric:true,sensitivity:'base'});
  rows.sort((a,b)=>{
    let d=0,sort=String(V89_LOG.sort||'title-asc');
    if(sort==='title-asc')return cmpTitle(a,b);
    if(sort==='title-desc')return cmpTitle(b,a);
    if(sort==='priority-desc')d=(rank[String(b.priority||'medium').toLowerCase()]??1)-(rank[String(a.priority||'medium').toLowerCase()]??1);
    else if(sort==='priority-asc')d=(rank[String(a.priority||'medium').toLowerCase()]??1)-(rank[String(b.priority||'medium').toLowerCase()]??1);
    else if(sort==='rating-desc')d=num(b.rating)-num(a.rating);else if(sort==='rating-asc')d=num(a.rating)-num(b.rating);
    else if(sort==='progress-desc')d=num(b.progress)-num(a.progress);else if(sort==='progress-asc')d=num(a.progress)-num(b.progress);
    else if(sort==='total-desc')d=num(b.total)-num(a.total);else if(sort==='total-asc')d=num(a.total)-num(b.total);
    else {
      const at=titleOf(a),bt=titleOf(b),ar=at===q?0:at.startsWith(q)?1:2,br=bt===q?0:bt.startsWith(q)?1:2;
      d=ar-br||(at.includes(q)?at.indexOf(q):1e9)-(bt.includes(q)?bt.indexOf(q):1e9);
    }
    return d||cmpTitle(a,b);
  });
  V242_LOG_LAST={sig,q,rows};V242_LOG_CANDIDATE_CACHE.set(cacheKey,rows);v242TrimLoggingCandidateCache();return rows;
};

/* Logged-title cards use indexed ID lookup instead of one 50K Array.find per
   row on every logging render. */
function v242LoggedTitlesHtml(entries){
  if(!Array.isArray(entries)||!entries.length)return '';
  const progressMode=v179Mode('single')==='progress';
  return `<div class="v239-logged-title-list v242-logged-title-list" aria-label="Titles logged">${entries.map((entry,idx)=>{
    const item=entry?.libraryId?v241LibraryById(entry.libraryId):null,cat=item?getCategory(item.categoryId):null;
    const title=cleanTitle(item?.title||entry?.title||'Untitled'),status=item?v199StatusLabel(item.status):'',priority=item?String(item.priority||'medium').toLowerCase():'';
    let action='';
    if(progressMode&&item){
      const start=Number.isFinite(Number(entry.v179StartProgress))?Math.max(0,Number(entry.v179StartProgress)):v179StartProgress(item);
      const end=entry.v179EndProgress!=null?v179ClampEndProgress(item,entry.v179EndProgress):v179ClampEndProgress(item,start+Math.max(0,Number(entry.qty)||0));
      const qty=v179CalculatedQty(item,start,end);
      action=`<label class="v239-logged-progress v242-logged-progress"><span>${escapeHtml(v179ProgressInputLabel(item))}</span><input type="number" min="${start}" ${Number(item.total)>0?`max="${Number(item.total)}"`:''} step="1" value="${end}" onchange="App.v179SetLogEntryEnd(${idx},this.value)"></label><span class="v239-logged-consumed">+${qty} ${escapeHtml(v179ProgressNoun(item,qty))}</span>`;
    }else action=`<span class="v239-logged-consumed">${Math.max(0,Number(entry?.qty)||0)} ${escapeHtml(item?v179ProgressNoun(item,Number(entry?.qty)||0):'units')}</span>`;
    const progress=item?(Number(item.total)>0?`${Number(item.progress)||0}/${Number(item.total)}`:`Progress ${Number(item.progress)||0}`):'';
    return `<article class="v239-logged-title-card v242-logged-title-card">${v242LoggedCoverMarkup(item,title)}<div class="v239-logged-title-copy"><b>${escapeHtml(title)}</b><small>${[cat?.name,status,priority?`${priority} priority`:'',progress,entry?.isRepeat?'Rewatch / reread':''].filter(Boolean).map(escapeHtml).join(' · ')}</small></div><div class="v239-logged-title-actions">${action}<button type="button" class="btn btn-sm btn-ghost v239-remove-log-title" onclick="App.removeLogEntry(${idx})" aria-label="Remove ${escapeHtml(title)}">Remove</button></div></article>`;
  }).join('')}</div>`;
}
v239LoggedTitlesHtml=v242LoggedTitlesHtml;

/* ---------- Dynamic UI observer optimization --------------------------
   Earlier icon/dropdown layers rescanned the entire document after every DOM
   insertion. Logging suggestions/cards can churn frequently, so replace both
   observers with one subtree-scoped pass. */
try{V225_ICON_OBSERVER?.disconnect?.();}catch(_){ }
try{V226_DROPDOWN_OBSERVER?.disconnect?.();}catch(_){ }
const V242_UI_PENDING=new Set();let V242_UI_FRAME=0;
function v242QueueUiSubtree(node){
  if(!node||node.nodeType!==1)return;V242_UI_PENDING.add(node);
  if(V242_UI_FRAME)return;
  V242_UI_FRAME=requestAnimationFrame(()=>{
    V242_UI_FRAME=0;const roots=[...V242_UI_PENDING];V242_UI_PENDING.clear();
    for(const root of roots){
      if(!root.isConnected)continue;
      try{v225EnhanceButtonIcons(root);}catch(_){ }
      try{v226EnhanceDropdowns(root);}catch(_){ }
      try{v226RefreshSemanticButtonIcons(root);}catch(_){ }
    }
  });
}
const V242_UI_OBSERVER=new MutationObserver(ms=>{for(const m of ms)for(const node of m.addedNodes)v242QueueUiSubtree(node);});
V242_UI_OBSERVER.observe(document.body,{childList:true,subtree:true});

/* ---------- History toolbar presentation hook ------------------------- */
const v242RenderHistoryBase=renderHistory;
renderHistory=function(){
  let h=String(v242RenderHistoryBase.apply(this,arguments)||'');
  h=h.replace('<div class="view-head">','<div class="view-head v242-history-head">');
  h=h.replace('<div class="lib-toolbar v241-history-toolbar">','<div class="lib-toolbar v241-history-toolbar v242-history-toolbar">');
  h=h.replace('<button class="btn btn-sm" onclick="App.exportCSV()">Export CSV</button>','<button class="btn btn-sm v242-history-export" onclick="App.exportCSV()">Export CSV</button>');
  h=h.replace('<button class="btn btn-sm" onclick="App.undoLastEntry()">↺ Undo last entry</button>','<button class="btn btn-sm v242-history-undo" onclick="App.undoLastEntry()">↺ Undo last entry</button>');
  return h;
};

/* ---------- Persistence / export / sync audit -------------------------- */
const v242BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){const payload=v242BuildFullBackupBase.apply(this,arguments);if(payload?.backupManifest)payload.backupManifest.note='Complete MediaFlow v242 backup. Current persistent Library/Dynamic Library, Categories, History, Personal Order, rich metadata, cover-size preferences, XP/progression, Choice & Filter layouts and cloud-synced Settings remain included. v242 logging clarity/performance and History toolbar changes are presentation/runtime changes and require no schema bump.';return payload;};
const v242BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(){const manifest=v242BackupManifestBase.apply(this,arguments);manifest.includes=Object.assign({},manifest.includes||{}, {loggingLabelClarityV242:true,loggingArtworkNoOverlayV242:true,loggingCandidateCacheV242:true,scopedButtonObserverV242:true,historyToolbarPolishV242:true,fullExportImportAuditV242:true,automaticBackupAuditV242:true,syncNowAuditV242:true,settingsPresetAuditV242:true,historyExportAuditV242:true,personalOrderExportAuditV242:true});manifest.v242={cloudSyncVersion:201,fullBackupSchema:29,settingsPresetSchema:1,personalOrderExportVersion:4,noNewPersistentFields:true};return manifest;};
const v242BuildSettingsPresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){const preset=v242BuildSettingsPresetBase.apply(this,arguments);preset.presetManifest=preset.presetManifest||{};preset.presetManifest.includes=Object.assign({},preset.presetManifest.includes||{}, {currentPersistentSettingsAuditV242:true,noNewSettingsV242:true});return preset;};
const v242OrderExportPayloadBase=v142OrderExportPayload;
v142OrderExportPayload=function(){const payload=v242OrderExportPayloadBase.apply(this,arguments);payload.exportAudit=Object.assign({},payload.exportAudit||{}, {release:V242_RUNTIME_VERSION,current:true,personalOrderFormat:4,loggingPerformanceAudit:'50k'});return payload;};
function v242AuditSnapshot(){return {backup:v148BuildFullBackup(),preset:v196BuildSettingsPreset(),order:v142OrderExportPayload()};}

Object.assign(App,{v242EnsureLoggingIndex,v242LogTitleCandidates:(q)=>logTitleCandidates(q),v242AuditSnapshot});
MediaFlowRuntime.version=V242_RUNTIME_VERSION;
