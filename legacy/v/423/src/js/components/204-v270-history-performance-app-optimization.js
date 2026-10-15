/* ============================================================
   MediaFlow v270 — History Performance + Global UI Optimization
   ------------------------------------------------------------
   - Permanently removes the release-version chip beside Sync Now.
   - Keeps fallback and React chrome version-chip-free for future releases.
   - Adds a shared normalized-title index for O(1) title/session lookups.
   - Warms the existing 50K Library index during idle time.
   - Reuses fast indexes in unified History helpers.
   - Keeps v269 Consumption History presentation/data behavior intact.
   ============================================================ */
const V270_RUNTIME_VERSION=270;

/* ---------- Permanent top-right version-chip removal ------------------- */
function v270RemoveVersionChrome(root=document){
  const scope=root?.querySelectorAll?root:document;
  scope.querySelectorAll?.('.v260-topbar-actions .v260-topbar-chip').forEach(chip=>{
    if(/^v\d+(?:\.\d+)*$/i.test(String(chip.textContent||'').trim()))chip.remove();
  });
}

// Prevent the legacy fallback header from creating a version chip at all.
v260EnsureReactHost=function(){
  const main=document.querySelector('.main');if(!main)return;
  let host=document.getElementById('v260-react-host');
  if(!host){
    host=document.createElement('div');host.id='v260-react-host';host.className='v260-react-host';
    const container=main.querySelector('.container');main.insertBefore(host,container||main.firstChild);
    const page=String(S.view||'dashboard').replace(/^./,c=>c.toUpperCase());
    host.innerHTML=`<header class="v260-topbar v260-topbar-fallback"><div class="v260-topbar-main"><div class="v260-topbar-mark">✦</div><div class="v260-topbar-copy"><b>${escapeHtml(page)}</b><span>MediaFlow · professional design system</span></div></div><div class="v260-topbar-actions"><button type="button" class="btn btn-sm" onclick="App.syncNow?.()">Sync Now</button></div></header>`;
  }
};

// Earlier releases tried to rewrite the chip text. From v270 onward they are
// redirected to permanent removal instead, so future renders cannot revive it.
try{v265UpdateVersionChrome=v270RemoveVersionChrome;}catch(_){ }
try{v266UpdateVersionChrome=v270RemoveVersionChrome;}catch(_){ }
try{v267UpdateVersionChrome=v270RemoveVersionChrome;}catch(_){ }
try{v268UpdateVersionChrome=v270RemoveVersionChrome;}catch(_){ }

const V270_CHROME_OBSERVER=new MutationObserver(mutations=>{
  for(const mutation of mutations){
    for(const node of mutation.addedNodes){
      if(node?.nodeType!==1)continue;
      if(node.matches?.('.v260-topbar-chip')||node.querySelector?.('.v260-topbar-chip')){v270RemoveVersionChrome(node.parentElement||node);return;}
    }
  }
});
function v270WatchChrome(){
  const host=document.getElementById('v260-react-host');
  if(host){try{V270_CHROME_OBSERVER.disconnect();V270_CHROME_OBSERVER.observe(host,{childList:true,subtree:true});}catch(_){ }}
  v270RemoveVersionChrome(document);
}

/* ---------- Shared sorted History cache -------------------------------- */
const V270_HISTORY_SORT_CACHE={ref:null,len:-1,first:'',last:'',revision:0,sorted:[]};
function v270SessionStamp(s){return `${String(s?.id||'')}|${Number(s?.timestamp)||0}|${String(s?.date||'')}|${String(s?.categoryId||'')}`;}
function v270InvalidateHistoryCache(){
  Object.assign(V270_HISTORY_SORT_CACHE,{ref:null,len:-1,first:'',last:'',revision:(V270_HISTORY_SORT_CACHE.revision||0)+1,sorted:[]});
}
function v270SortedSessions(){
  const list=S.sessions||[],len=list.length,first=v270SessionStamp(list[0]),last=v270SessionStamp(list[len-1]);
  const c=V270_HISTORY_SORT_CACHE;
  if(c.ref===list&&c.len===len&&c.first===first&&c.last===last)return c.sorted;
  c.ref=list;c.len=len;c.first=first;c.last=last;
  c.sorted=list.slice().sort((a,b)=>(Number(b?.timestamp)||0)-(Number(a?.timestamp)||0));
  return c.sorted;
}

// v253 used to clone + sort the complete History array every time History was
// rendered. v270 keeps one invalidatable sorted snapshot and applies only the
// active filters on top. This speeds Consumption, Recently Viewed, Ratings
// helpers that depend on the same filtered History foundation.
v253HistoryFilteredList=function(){
  const f=S.histFilters=S.histFilters||{},selected=new Set(typeof v241HistorySelectedCategories==='function'?v241HistorySelectedCategories():[]);
  let list=v270SortedSessions();
  if(selected.size)list=list.filter(s=>selected.has(String(s?.categoryId||'')));
  if(f.type&&f.type!=='all')list=list.filter(s=>getCategory(s.categoryId).type===f.type);
  if(f.range==='today')list=list.filter(s=>s.date===todayISO());
  else if(f.range==='week'){const cutoff=hoursAgo(24*7);list=list.filter(s=>Number(s?.timestamp)>=cutoff);}
  else if(f.range==='month'){const cutoff=hoursAgo(24*30);list=list.filter(s=>Number(s?.timestamp)>=cutoff);}
  if(f.range==='custom'||f.dateFrom||f.dateTo){const from=String(f.dateFrom||''),to=String(f.dateTo||'');if(from)list=list.filter(s=>String(s?.date||'')>=from);if(to)list=list.filter(s=>String(s?.date||'')<=to);}
  // Callers sometimes mutate/slice the returned value. Never expose the cache.
  return list===V270_HISTORY_SORT_CACHE.sorted?list.slice():list;
};

// Session mutations already pass through persistSessions in MediaFlow. Hook it
// once so edits with an unchanged array length cannot leave a stale sort cache.
try{
  const v270PersistSessionsBase=persistSessions;
  persistSessions=function(){v270InvalidateHistoryCache();return v270PersistSessionsBase.apply(this,arguments);};
}catch(_){ }

/* ---------- Shared fast Library title/index helpers -------------------- */
const V270_TITLE_INDEX={ref:null,len:-1,token:-1,byTitle:new Map(),byTitleCat:new Map()};
function v270EnsureTitleIndex(){
  const lib=S.library||[],token=Number(globalThis.V53_LIB?.libraryToken)||0;
  if(V270_TITLE_INDEX.ref===lib&&V270_TITLE_INDEX.len===lib.length&&V270_TITLE_INDEX.token===token)return V270_TITLE_INDEX;
  const byTitle=new Map(),byTitleCat=new Map();
  for(const item of lib){
    if(!item)continue;
    const title=cleanTitle(item.title||'').toLocaleLowerCase();if(!title)continue;
    if(!byTitle.has(title))byTitle.set(title,item);
    const cat=String(item.categoryId||'');if(cat&&!byTitleCat.has(`${cat}\u0000${title}`))byTitleCat.set(`${cat}\u0000${title}`,item);
  }
  Object.assign(V270_TITLE_INDEX,{ref:lib,len:lib.length,token,byTitle,byTitleCat});
  return V270_TITLE_INDEX;
}
const v270InvalidateLibraryCacheBase=v53InvalidateLibraryCache;
v53InvalidateLibraryCache=function(){
  const out=v270InvalidateLibraryCacheBase.apply(this,arguments);
  Object.assign(V270_TITLE_INDEX,{ref:null,len:-1,token:-1,byTitle:new Map(),byTitleCat:new Map()});
  V270_IDLE_WARMED=false;
  return out;
};

function v270LibraryById(id){
  if(typeof v241LibraryById==='function')return v241LibraryById(id);
  return (S.library||[]).find(item=>String(item?.id||'')===String(id||''))||null;
}
function v270LibraryByTitle(title,categoryId=''){
  const clean=cleanTitle(title||'').toLocaleLowerCase();if(!clean)return null;
  const idx=v270EnsureTitleIndex(),cat=String(categoryId||'');
  return (cat?idx.byTitleCat.get(`${cat}\u0000${clean}`):null)||idx.byTitle.get(clean)||null;
}
function v270LibraryForSession(session){
  if(!session)return null;
  const direct=session.libraryId?v270LibraryById(session.libraryId):null;if(direct)return direct;
  return v270LibraryByTitle(session.title||session.libraryTitle||'',session.categoryId||'');
}

// Unified History / recent-title helpers now use indexed lookups instead of
// repeatedly scanning tens of thousands of Library rows.
v260LibraryItemForSession=v270LibraryForSession;

/* ---------- Idle warmup + render cleanup ------------------------------- */
let V270_IDLE_WARMED=false;
function v270WarmPerformanceCaches(){
  if(V270_IDLE_WARMED)return;V270_IDLE_WARMED=true;
  try{v241EnsureLibraryIndex?.();}catch(_){ }
  try{v270EnsureTitleIndex();}catch(_){ }
}
function v270ScheduleWarmup(){
  if('requestIdleCallback' in window)requestIdleCallback(v270WarmPerformanceCaches,{timeout:1200});
  else setTimeout(v270WarmPerformanceCaches,180);
}

const v270RenderBase=render;
render=function(){
  const out=v270RenderBase.apply(this,arguments);
  queueMicrotask(v270RemoveVersionChrome);
  return out;
};
const v270RenderShellBase=renderShell;
renderShell=function(){
  const out=v270RenderShellBase.apply(this,arguments);
  queueMicrotask(()=>{v270WatchChrome();v270RemoveVersionChrome();});
  return out;
};

/* ---------- Backup/release audit --------------------------------------- */
if(typeof v148BackupManifest==='function'){
  const v270BackupManifestBase=v148BackupManifest;
  v148BackupManifest=function(){
    const manifest=v270BackupManifestBase.apply(this,arguments);
    manifest.includes=Object.assign({},manifest.includes||{},{historyPerformanceV270:true,globalLibraryLookupIndexV270:true,permanentTopbarVersionRemovalV270:true});
    manifest.v270={historyPerformance:true,indexedLibraryResolution:true,idleCacheWarmup:true,topbarVersionChip:false,dynamicThemesPreserved:true,cloudSyncVersion:201,fullBackupSchema:29,settingsPresetSchema:1,personalOrderExportVersion:4};
    return manifest;
  };
}

Object.assign(App,{v270RemoveVersionChrome,v270WarmPerformanceCaches});
window.MediaFlowV270={version:270,focus:'History responsiveness, whole-app lookup optimization, permanent top-right version-chip removal'};
MediaFlowRuntime.version=V270_RUNTIME_VERSION;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{v270WatchChrome();v270ScheduleWarmup();},{once:true});else{v270WatchChrome();v270ScheduleWarmup();}
