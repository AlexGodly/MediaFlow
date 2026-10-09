/* ============================================================
   MediaFlow v281 — Collection compact/card responsiveness + cloud UI state
   ------------------------------------------------------------
   - Repairs main Collections Compact progress presentation.
   - Makes Collection Cards adapt to the configured cover size instead of
     letting large covers crush/overflow title content.
   - Persists Collection page preferences/filter state through Settings,
     Cloud Sync, Full Backup and Settings Presets.
   - Upgrades dedicated Collections export/import to carry Collection settings.
   - Hardens Library live-search focus/caret so renders cannot eat keystrokes.
   - Re-audits update/export/import/XP/History/Personal Order/Collections paths.
   ============================================================ */
const V281_RUNTIME_VERSION=281;

/* ---------- Collection page state persistence ---------------------- */
const V281_COLLECTION_FILTER_DEFAULTS={
  search:'',categories:[],status:'all',priority:'all',rating:'all',cover:'all',sort:'order',dir:'asc',
  yearMin:'',yearMax:'',runtimeMin:'',runtimeMax:'',seasonMin:'',seasonMax:'',episodeMin:'',episodeMax:'',limit:0,moderator:'all'
};
function v281NormalizeCollectionFilters(raw){
  raw=raw&&typeof raw==='object'?raw:{};
  const out=Object.assign({},V281_COLLECTION_FILTER_DEFAULTS,raw);
  out.search=String(out.search||'');
  out.categories=Array.isArray(out.categories)?[...new Set(out.categories.map(String).filter(Boolean))]:[];
  for(const key of ['status','priority','rating','cover','sort','dir','yearMin','yearMax','runtimeMin','runtimeMax','seasonMin','seasonMax','episodeMin','episodeMax','moderator'])out[key]=String(out[key]??V281_COLLECTION_FILTER_DEFAULTS[key]);
  out.limit=Math.max(0,Math.round(Number(out.limit)||0));
  return out;
}
const v281EnsureSettingsBase=v274EnsureSettings;
v274EnsureSettings=function(target=S.settings||DEFAULT_SETTINGS){
  const s=v281EnsureSettingsBase.apply(this,arguments);
  s.pageState=Object.assign({browserSearch:'',browserSort:'updated',browserDir:'desc',detailFilters:v281NormalizeCollectionFilters(null)},s.pageState||{});
  s.pageState.browserSearch=String(s.pageState.browserSearch||'');
  s.pageState.browserSort=['updated','alphabetic','added','viewed','count','progress'].includes(String(s.pageState.browserSort))?String(s.pageState.browserSort):'updated';
  s.pageState.browserDir=String(s.pageState.browserDir)==='asc'?'asc':'desc';
  s.pageState.detailFilters=v281NormalizeCollectionFilters(s.pageState.detailFilters);
  return s;
};
v274EnsureSettings(DEFAULT_SETTINGS);v274EnsureSettings(S.settings||DEFAULT_SETTINGS);

function v281CollectionPageStateFromUi(){
  return {
    browserSearch:String(V274_UI.search||''),
    browserSort:String(V274_UI.sort||'updated'),
    browserDir:V274_UI.dir==='asc'?'asc':'desc',
    detailFilters:v281NormalizeCollectionFilters(V274_UI.filters)
  };
}
function v281CaptureCollectionUiState(){
  const s=v274EnsureSettings(S.settings||DEFAULT_SETTINGS),next=v281CollectionPageStateFromUi();
  const before=JSON.stringify(s.pageState||{}),after=JSON.stringify(next);
  if(before!==after){s.pageState=next;s.modifiedAt=v274Now();return true;}
  return false;
}
function v281RestoreCollectionUiState(){
  const s=v274EnsureSettings(S.settings||DEFAULT_SETTINGS),p=s.pageState||{};
  V274_UI.search=String(p.browserSearch||'');
  V274_UI.sort=['updated','alphabetic','added','viewed','count','progress'].includes(String(p.browserSort))?String(p.browserSort):'updated';
  V274_UI.dir=String(p.browserDir)==='asc'?'asc':'desc';
  V274_UI.filters=v281NormalizeCollectionFilters(p.detailFilters);
}
let V281_COLLECTION_PREF_TIMER=0;
function v281ScheduleCollectionUiPersist(){
  clearTimeout(V281_COLLECTION_PREF_TIMER);
  V281_COLLECTION_PREF_TIMER=setTimeout(()=>{try{if(v281CaptureCollectionUiState())persistSettings();}catch(_){ }},420);
}

// Capture the live Collections UI immediately before every cloud snapshot so
// Sync Now cannot miss a filter/sort/search choice that has not blurred yet.
const v281SnapshotBase=snapshot;
snapshot=function(){try{v281CaptureCollectionUiState();}catch(_){ }return v281SnapshotBase.apply(this,arguments);};
const v281BackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){try{v281CaptureCollectionUiState();}catch(_){ }return v281BackupBase.apply(this,arguments);};
const v281PresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){try{v281CaptureCollectionUiState();}catch(_){ }return v281PresetBase.apply(this,arguments);};
const v281ApplyStateBase=v46ApplyState;
v46ApplyState=function(data){const out=v281ApplyStateBase.apply(this,arguments);try{v281RestoreCollectionUiState();}catch(_){ }return out;};
const v281LoadAllBase=loadAll;
loadAll=async function(){const out=await v281LoadAllBase.apply(this,arguments);try{v281RestoreCollectionUiState();}catch(_){ }return out;};

// Persist Collection sort/filter controls without changing their existing UX.
const v281SetCollectionSortBase=App.v274SetCollectionSort;
function v281SetCollectionSort(value){const out=v281SetCollectionSortBase(value);v281ScheduleCollectionUiPersist();return out;}
const v281ToggleCollectionSortBase=App.v274ToggleCollectionSortDir;
function v281ToggleCollectionSortDir(){const out=v281ToggleCollectionSortBase();v281ScheduleCollectionUiPersist();return out;}
const v281SetCollectionFilterBase=App.v274SetCollectionFilter;
function v281SetCollectionFilter(key,value){const out=v281SetCollectionFilterBase(key,value);v281ScheduleCollectionUiPersist();return out;}
const v281ToggleCollectionCategoryBase=App.v274ToggleCollectionCategory;
function v281ToggleCollectionCategory(id,on){const out=v281ToggleCollectionCategoryBase(id,on);v281ScheduleCollectionUiPersist();return out;}
const v281ClearCollectionCategoriesBase=App.v274ClearCollectionCategories;
function v281ClearCollectionCategories(event){const out=v281ClearCollectionCategoriesBase(event);v281ScheduleCollectionUiPersist();return out;}
const v281ToggleCollectionFilterDirBase=App.v274ToggleCollectionFilterDir;
function v281ToggleCollectionFilterDir(){const out=v281ToggleCollectionFilterDirBase();v281ScheduleCollectionUiPersist();return out;}
const v281ClearCollectionFiltersBase=App.v274ClearCollectionFilters;
function v281ClearCollectionFilters(){const out=v281ClearCollectionFiltersBase();v281ScheduleCollectionUiPersist();return out;}
const v281CollectionSearchBase=App.v276CollectionSearchInput;
function v281CollectionSearchInput(value,input){const out=v281CollectionSearchBase(value,input);v281ScheduleCollectionUiPersist();return out;}
const v281CollectionDetailSearchBase=App.v276CollectionDetailSearch;
function v281CollectionDetailSearch(value,input){const out=v281CollectionDetailSearchBase(value,input);v281ScheduleCollectionUiPersist();return out;}

/* ---------- Dedicated Collections export/import v2 ----------------- */
function v281CollectionsExportPayload(){
  v281CaptureCollectionUiState();
  return {
    mediaflowCollectionsExportVersion:2,
    appVersion:281,
    exportedAt:new Date().toISOString(),
    collections:v274Clone(v274EnsureCollections(),[]),
    collectionSettings:v274Clone(v274EnsureSettings(S.settings||DEFAULT_SETTINGS),{})
  };
}
function v281ExportCollections(){
  const payload=v281CollectionsExportPayload();
  triggerDownload(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),`MediaFlow_Collections_${new Date().toISOString().slice(0,10)}.json`);
  showToast(`${payload.collections.length.toLocaleString()} collections exported`);
}
async function v281ImportCollections(file){
  if(!file)return;let parsed;
  try{parsed=JSON.parse(await file.text());}catch(_){showToast('Could not read that Collections file.');return;}
  const rows=Array.isArray(parsed)?parsed:Array.isArray(parsed?.collections)?parsed.collections:null;
  if(!rows){showToast('That file does not contain MediaFlow Collections.');return;}
  const incoming=v274NormalizeCollections(rows);if(!incoming.length){showToast('No valid collections were found.');return;}
  const hasSettings=parsed?.collectionSettings&&typeof parsed.collectionSettings==='object';
  const ok=await v279Confirm({title:`Import ${incoming.length.toLocaleString()} collection${incoming.length===1?'':'s'}?`,body:`Imported collections will merge with your current Collections.${hasSettings?' Collection display/filter settings from this export will also be restored.':''} Matching IDs use the newer copy. Titles remain in your Library.`,confirmLabel:'Import collections'});if(!ok)return;
  const byId=new Map(v274EnsureCollections().map(c=>[String(c.id),c])),now=v274Now();
  for(const c of incoming){const prev=byId.get(String(c.id));c.updatedAt=Math.max(v274Num(c.updatedAt,0),now);if(!prev||v274Num(c.updatedAt)>=v274Num(prev.updatedAt))byId.set(String(c.id),c);}
  S.collections=[...byId.values()];const importedIds=new Set(incoming.map(c=>String(c.id)));S.collectionTombstones=(S.collectionTombstones||[]).filter(t=>!importedIds.has(String(t?.id||'')));
  if(hasSettings){S.settings=S.settings||{};S.settings.v274Collections=Object.assign({},S.settings.v274Collections||{},v274Clone(parsed.collectionSettings,{}));v274EnsureSettings(S.settings);v281RestoreCollectionUiState();}
  await saveState();V274_UI.activeId='';render();showToast(`${incoming.length.toLocaleString()} collections imported ✓`);
}

/* ---------- Card cover-size responsiveness ------------------------- */
function v281ApplyCollectionCardVars(){
  const s=v274EnsureSettings(S.settings||DEFAULT_SETTINGS),scale=Math.max(.25,Math.min(4,Number(s.collectionCoverSize||100)/100));
  const cover=Math.round(82*scale),min=Math.max(280,Math.min(760,cover+220));
  document.documentElement.style.setProperty('--mf281-card-cover-width',`${cover}px`);
  document.documentElement.style.setProperty('--mf281-card-min-width',`${min}px`);
}
const v281PreviewCollectionSizeBase=App.v276PreviewCollectionSize;
function v281PreviewCollectionSize(kind,value,input){const out=v281PreviewCollectionSizeBase(kind,value,input);v281ApplyCollectionCardVars();return out;}
const v281SetCollectionSizeBase=App.v276SetCollectionSize;
function v281SetCollectionSize(kind,value){const out=v281SetCollectionSizeBase(kind,value);v281ApplyCollectionCardVars();return out;}

/* ---------- Library live-search keystroke hardening ---------------- */
let V281_LIBRARY_SEARCH_TIMER=0;
let V281_LIBRARY_SEARCH_SEQ=0;
function v281IsLibrarySearch(el){return !!el?.matches?.('#view-root .mf264-library-search,#view-root .lib-search');}
function v281VisibleLibrarySearch(){
  const preferred=[...document.querySelectorAll('#view-root .mf264-library-search,#view-root .lib-search')];
  return preferred.find(el=>{const cs=getComputedStyle(el);return cs.display!=='none'&&cs.visibility!=='hidden'&&el.offsetParent!==null;})||null;
}
function v281CaptureLibrarySearch(){
  if(String(S.view||'')!=='library')return null;const active=document.activeElement;if(!v281IsLibrarySearch(active))return null;
  const value=String(active.value??S.histFilters?.libSearch??''),len=value.length;
  return {value,start:Math.max(0,Math.min(len,Number(active.selectionStart??len))),end:Math.max(0,Math.min(len,Number(active.selectionEnd??active.selectionStart??len))),seq:V281_LIBRARY_SEARCH_SEQ};
}
function v281RestoreLibrarySearch(snapshot){
  if(!snapshot||String(S.view||'')!=='library')return;const next=v281VisibleLibrarySearch();if(!next)return;
  if(String(next.value)!==snapshot.value)next.value=snapshot.value;
  try{next.focus({preventScroll:true});}catch(_){next.focus();}
  try{next.setSelectionRange(snapshot.start,snapshot.end);}catch(_){ }
}
const v281RenderBase=render;
render=function(){
  const search=v281CaptureLibrarySearch();
  if(search){S.histFilters=S.histFilters||{};S.histFilters.libSearch=search.value;}
  const out=v281RenderBase.apply(this,arguments);
  // Stabilize the final Library dock synchronously. Older v261-v264 enhancers
  // historically completed over several animation frames, leaving a short
  // interval where the focused input could disappear and swallow a keypress.
  if(String(S.view||'')==='library'){
    // v262-v265 live inside version IIFEs, so their local function names are
    // not visible here. Use their public App hooks to finish the canonical
    // Library dock synchronously before the browser can dispatch another key.
    // This closes the short post-render window where only the throwaway source
    // search existed and a fast keystroke could be sent to the page instead.
    try{typeof App?.v262EnhanceLibrary==='function'&&App.v262EnhanceLibrary();}catch(_){ }
    try{typeof App?.v264EnhanceLibrary==='function'&&App.v264EnhanceLibrary();}catch(_){ }
    try{typeof App?.v265EnhanceLibrary==='function'&&App.v265EnhanceLibrary();}catch(_){ }
  }
  // Restore synchronously so the browser never gets an event-loop window where
  // the focused Library search has been replaced by the renderer.
  if(search){v281RestoreLibrarySearch(search);queueMicrotask(()=>v281RestoreLibrarySearch(search));requestAnimationFrame(()=>v281RestoreLibrarySearch(search));}
  queueMicrotask(v281ApplyCollectionCardVars);
  return out;
};
function v281SearchLibrary(value){
  const active=document.activeElement,live=v281IsLibrarySearch(active)?active:null;
  const str=String(value??''),len=str.length;
  V281_LIBRARY_SEARCH_SEQ++;
  const snapshot={value:str,start:Math.max(0,Math.min(len,Number(live?.selectionStart??len))),end:Math.max(0,Math.min(len,Number(live?.selectionEnd??live?.selectionStart??len))),seq:V281_LIBRARY_SEARCH_SEQ};
  S.histFilters=S.histFilters||{};S.histFilters.libSearch=str;S.libPage=0;
  document.querySelectorAll('#view-root .lib-search').forEach(el=>{if(el!==live&&el.value!==str)el.value=str;});
  clearTimeout(V281_LIBRARY_SEARCH_TIMER);
  V281_LIBRARY_SEARCH_TIMER=setTimeout(()=>{
    if(String(S.view||'')!=='library'||snapshot.seq!==V281_LIBRARY_SEARCH_SEQ)return;
    const work=()=>{
      if(snapshot.seq!==V281_LIBRARY_SEARCH_SEQ)return;
      try{v53InvalidateLibraryCache();}catch(_){ }
      try{v53InvalidateLibraryFilterCache();}catch(_){ }
      render();
      // render() performs the immediate focus restore; a final pass protects
      // against post-render Library dock enhancers.
      v281RestoreLibrarySearch({value:String(S.histFilters?.libSearch||''),start:Math.min(snapshot.start,String(S.histFilters?.libSearch||'').length),end:Math.min(snapshot.end,String(S.histFilters?.libSearch||'').length),seq:snapshot.seq});
    };
    if(typeof requestIdleCallback==='function')requestIdleCallback(work,{timeout:260});else requestAnimationFrame(work);
  },360);
}

/* ---------- persistence / transfer / update audit ------------------ */
function v281HasApp(...names){return names.some(n=>typeof App?.[n]==='function');}
function v281PersistenceProbe(){
  let snap=null,backup=null,preset=null;
  try{snap=snapshot();}catch(_){ }
  try{backup=v148BuildFullBackup();}catch(_){ }
  try{preset=v196BuildSettingsPreset();}catch(_){ }
  return {snap,backup,preset,collectionsExport:v281CollectionsExportPayload()};
}
function v281AuditState(){
  let snap=null,backup=null,preset=null,order=null,base=null,manifest=null;
  try{base=typeof App.v273AuditState==='function'?App.v273AuditState():null;}catch(_){ }
  try{snap=snapshot();}catch(_){ }
  try{backup=v148BuildFullBackup();}catch(_){ }
  try{preset=v196BuildSettingsPreset();}catch(_){ }
  try{order=v142OrderExportPayload();}catch(_){ }
  try{manifest=v148BackupManifest(snap||{},{});}catch(_){ }
  const colSettings=snap?.settings?.v274Collections;
  return {
    version:281,pwaRelease:281,
    collections:Array.isArray(snap?.collections)?snap.collections.length:0,
    collectionCloudData:Array.isArray(snap?.collections)&&Array.isArray(snap?.collectionTombstones),
    collectionCloudSettings:!!colSettings,
    collectionPageStateSynced:!!colSettings?.pageState,
    collectionBackupData:Array.isArray(backup?.collections),
    collectionBackupSettings:!!backup?.settings?.v274Collections,
    collectionPresetSettings:!!preset?.settings?.v274Collections,
    collectionsExportVersion:v281CollectionsExportPayload().mediaflowCollectionsExportVersion,
    cloudSyncVersion:Number(snap?.cloudSyncVersion)||201,
    fullBackupSchema:Number(backup?.schemaVersion||backup?.backupSchemaVersion||manifest?.schemaVersion)||29,
    settingsPresetSchema:Number(preset?.schemaVersion||preset?.presetSchemaVersion)||1,
    personalOrderExportVersion:Number(order?.formatVersion)||4,
    systems:Object.assign({},base?.systems||{}, {
      syncNow:v281HasApp('syncNow'),
      xpCalculation:v281HasApp('calculateXPNow'),
      fullDataExport:v281HasApp('exportJSON'),
      fullDataImport:v281HasApp('importJSON'),
      settingsExport:v281HasApp('exportSettingsPreset'),
      settingsImport:v281HasApp('importSettingsPreset'),
      consumptionHistoryExport:v281HasApp('v271ExportConsumptionCSV'),
      logsExport:v281HasApp('v271ExportLogsCSV'),
      personalOrderImport:v281HasApp('v142ImportOrder'),
      personalOrderExport:typeof v142OrderExportPayload==='function',
      collectionsExport:v281HasApp('v279ExportCollections'),
      collectionsImport:v281HasApp('v279ImportCollections'),
      automaticUpdate:typeof v161EnsureAutomaticUpdateCheck==='function'&&v281HasApp('v248ToggleAutoInstallUpdates'),
      automaticBackup:typeof v148BuildFullBackup==='function'
    })
  };
}
if(typeof v148BackupManifest==='function'){
  const v281ManifestBase=v148BackupManifest;
  v148BackupManifest=function(){const m=v281ManifestBase.apply(this,arguments);m.includes=Object.assign({},m.includes||{},{collectionsPageStateV281:true,collectionsExportV2:true,librarySearchReliabilityV281:true,collectionResponsiveCardsV281:true});m.v281={collectionPageCloudSync:true,collectionsExportVersion:2,librarySearchKeystrokeHardening:true,responsiveCollectionCards:true,compactCollectionProgressRepair:true,cloudSyncVersion:201,fullBackupSchema:29,settingsPresetSchema:1,personalOrderExportVersion:4,pwaRelease:281};return m;};
}

Object.assign(App,{
  v274SetCollectionSort:v281SetCollectionSort,
  v274ToggleCollectionSortDir:v281ToggleCollectionSortDir,
  v274SetCollectionFilter:v281SetCollectionFilter,
  v274ToggleCollectionCategory:v281ToggleCollectionCategory,
  v274ClearCollectionCategories:v281ClearCollectionCategories,
  v274ToggleCollectionFilterDir:v281ToggleCollectionFilterDir,
  v274ClearCollectionFilters:v281ClearCollectionFilters,
  v276CollectionSearchInput:v281CollectionSearchInput,
  v276CollectionDetailSearch:v281CollectionDetailSearch,
  v279ExportCollections:v281ExportCollections,
  v279ImportCollections:v281ImportCollections,
  v276PreviewCollectionSize:v281PreviewCollectionSize,
  v276SetCollectionSize:v281SetCollectionSize,
  searchLibrary:v281SearchLibrary,
  v281CollectionsExportPayload,v281PersistenceProbe,v281CaptureCollectionUiState,v281RestoreCollectionUiState,v281AuditState
});
window.MediaFlowV281={version:281,focus:'Collection compact/card responsiveness, Collection cloud state and Library search keystroke reliability'};
MediaFlowRuntime.version=V281_RUNTIME_VERSION;
v281RestoreCollectionUiState();v281ApplyCollectionCardVars();
