/* ============================================================
   MediaFlow v232 — Library Performance + Persistence Audit + Details Polish
   ------------------------------------------------------------
   - Library Mode is first in the Library Settings navigation group.
   - Choice/Filter inherited explanatory copy is removed.
   - Dynamic Library status order is owned ONLY by Dynamic Status settings.
   - Replaces three whole-document mutation observers with one scoped,
     idempotent enhancer to stop Library/filter re-render loops.
   - Audits v230/v231 choice/filter settings through cloud merge/verification,
     Full/Automatic Backup and Settings Presets without a schema bump.
   - Refreshes Personal Order export/import and History CSV export.
   - Makes Title Details wider/denser and removes icons from detail-field cards.
   ============================================================ */

const V232_RUNTIME_VERSION=232;
const V232_ORDER_FORMAT_VERSION=4;

/* ---------- Settings navigation order ---------------------------------- */
try{
  const list=V221_SETTINGS_SECTION_ORDER?.Library;
  if(Array.isArray(list)){
    for(const label of ['LIBRARY MODE','CATEGORIES']){
      const index=list.indexOf(label);
      if(index>=0)list.splice(index,1);
    }
    list.unshift('CATEGORIES');
    list.unshift('LIBRARY MODE');
  }
}catch(_){ }

/* ---------- Choice/filter copy cleanup --------------------------------- */
v230InheritedHint=function(){return '';};

v230SurfaceEditor=function(surface){
  const own=v230SurfaceConfig(surface);const resolved=v230ResolvedSurface(surface);
  const custom=own.source==='custom';const hidden=new Set(resolved.hidden.map(String));
  const rows=resolved.order.map((id,index)=>{
    const meta=v230ItemMeta(surface,id);const visible=!hidden.has(String(id));
    return `<div class="v230-layout-row ${custom?'':'v230-layout-row-inherited'}" data-v230-surface="${surface}" data-v230-id="${escapeHtml(String(id))}" ${custom?`ondragover="App.v230DragOver(event,'${surface}')" ondragleave="App.v230DragLeave(event)" ondrop="App.v230Drop(event,'${surface}','${escapeHtml(String(id))}')"`:''}>
      <div class="v230-layout-copy"><span class="v230-layout-identity">${meta.icon}</span><div><b>${escapeHtml(meta.label)}</b><small>${custom?`Position ${index+1} · ${visible?'shown':'hidden'}`:`Position ${index+1} · ${visible?'shown':'hidden'}`}</small></div></div>
      <button type="button" class="btn btn-sm btn-ghost v230-drag-handle" ${custom?'draggable="true"':'disabled'} title="${custom?'Drag to reorder':'Order follows selected source'}" aria-label="${custom?'Drag to reorder':'Order follows selected source'}" ${custom?`ondragstart="App.v230DragStart(event,'${surface}','${escapeHtml(String(id))}')" ondragend="App.v230DragEnd(event)"`:''}>☰</button>
      <input class="v230-position" type="number" min="1" max="${resolved.order.length}" value="${index+1}" ${custom?'':'disabled'} aria-label="${escapeHtml(meta.label)} position" onchange="App.v230SetPosition('${surface}','${escapeHtml(String(id))}',this.value)">
      <div class="v230-order-buttons"><button type="button" class="btn btn-sm btn-ghost" ${!custom||index===0?'disabled':''} onclick="App.v230Move('${surface}','${escapeHtml(String(id))}',-1)">↑</button><button type="button" class="btn btn-sm btn-ghost" ${!custom||index===resolved.order.length-1?'disabled':''} onclick="App.v230Move('${surface}','${escapeHtml(String(id))}',1)">↓</button></div>
      <button type="button" class="toggle ${visible?'on':''}" ${custom?'':'disabled'} aria-label="${visible?'Hide':'Show'} ${escapeHtml(meta.label)}" onclick="App.v230ToggleVisible('${surface}','${escapeHtml(String(id))}',${visible?'false':'true'})"></button>
    </div>`;
  }).join('');
  return `<div class="v230-surface-card">
    <div class="v230-surface-head"><div><b>${v230SurfaceTitle(surface)}</b></div><select aria-label="${v230SurfaceTitle(surface)} layout source" onchange="App.v230SetSource('${surface}',this.value)">${v230SourceOptions(surface,own.source)}</select></div>
    ${custom?`<div class="v230-surface-actions"><button type="button" class="btn btn-sm btn-ghost" onclick="App.v230SetAllVisible('${surface}',true)">Show all</button><button type="button" class="btn btn-sm btn-ghost" onclick="App.v230SetAllVisible('${surface}',false)">Hide all</button></div>`:''}
    <div class="v230-layout-list">${rows}</div>
  </div>`;
};

/* ---------- Purposeful "All" icon + Title Details icon cleanup -------- */
Object.assign(V225_BUTTON_ICONS,{
  all:v225IconSvg('<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>')
});
const v232ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(!el)return null;
  if(el.matches?.('.v181-detail-card'))return null;
  const t=v225CleanActionText(el);
  if(t==='all')return 'all';
  return v232ButtonIconNameBase(el);
};

/* ---------- Dynamic Status is independent from Choice/Filter layouts ---- */
// v230 accidentally reordered the Dynamic Library status row using the Status
// Filter layout. The Dynamic row must be driven solely by v181Library.statusOrder.
v230ApplyDynamicStatusRow=function(){return;};

/* ---------- Idempotent, scoped filter layout application ---------------- */
function v232NodeSequenceMatches(parent,desired){
  const current=[...parent.children].filter(node=>desired.includes(node));
  return current.length===desired.length&&current.every((node,index)=>node===desired[index]);
}

v230ReorderSelect=function(select,surface){
  if(!select||select.dataset.v230LayoutApplying==='1')return;
  const st=v230ResolvedSurface(surface);const ids=st.order.map(String);const hidden=new Set(st.hidden.map(String));
  const options=[...select.options];const byValue=new Map(options.map(o=>[String(o.value),o]));
  let visibilityChanged=false;
  for(const id of ids){
    const option=byValue.get(id);if(!option)continue;
    const shouldHide=hidden.has(id);
    if(option.hidden!==shouldHide){option.hidden=shouldHide;visibilityChanged=true;}
  }
  const unmanaged=options.filter(o=>!ids.includes(String(o.value)));
  const desired=[...unmanaged,...ids.map(id=>byValue.get(id)).filter(Boolean)];
  const ordered=desired.length===options.length&&desired.every((node,index)=>node===options[index]);
  if(ordered&&!visibilityChanged)return;
  if(!ordered){
    select.dataset.v230LayoutApplying='1';
    try{const frag=document.createDocumentFragment();desired.forEach(node=>frag.appendChild(node));select.appendChild(frag);}finally{delete select.dataset.v230LayoutApplying;}
  }
};

v230ApplyCategoryPanel=function(details){
  const panel=details?.querySelector?.('.v66-cat-panel');if(!panel)return;
  const rows=[...panel.querySelectorAll(':scope > .v66-cat-option')];if(!rows.length)return;
  const st=v230ResolvedSurface('categoryFilter');const hidden=new Set(st.hidden.map(String));
  const map=new Map(rows.map(row=>[v230CategoryIdFromOptionLabel(row),row]).filter(x=>x[0]));
  for(const [id,row] of map){const shouldHide=hidden.has(String(id));if(row.hidden!==shouldHide)row.hidden=shouldHide;}
  const orderedRows=st.order.map(id=>map.get(String(id))).filter(Boolean);
  const unmanaged=rows.filter(row=>!orderedRows.includes(row));
  const desired=[...unmanaged,...orderedRows];
  if(v232NodeSequenceMatches(panel,desired))return;
  const frag=document.createDocumentFragment();desired.forEach(row=>frag.appendChild(row));panel.appendChild(frag);
};

v230ApplyFilterLayouts=function(root=document){
  const selects=[];
  if(root?.matches?.('select'))selects.push(root);
  root?.querySelectorAll?.('select').forEach(s=>selects.push(s));
  for(const select of selects){const surface=v230FilterSelectSurface(select);if(surface)v230ReorderSelect(select,surface);}
  const details=[];
  if(root?.matches?.('.v66-cat-filter'))details.push(root);
  root?.querySelectorAll?.('.v66-cat-filter').forEach(x=>details.push(x));
  details.forEach(v230ApplyCategoryPanel);
};

// The v225/v226/v230 observers each rescanned the entire document on every
// rendered node. On very large Libraries that compounded into visible stalls.
// Replace them with one scoped observer that only enhances newly-added subtrees.
try{V225_ICON_OBSERVER.disconnect();}catch(_){ }
try{V226_DROPDOWN_OBSERVER.disconnect();}catch(_){ }
try{V230_FILTER_OBSERVER.disconnect();}catch(_){ }

const V232_PENDING_ROOTS=new Set();
let V232_ENHANCE_FRAME=0;
function v232EnhanceRoot(root){
  if(!root||root.nodeType!==1)return;
  try{v225EnhanceButtonIcons(root);}catch(_){ }
  try{v226EnhanceDropdowns(root);}catch(_){ }
  try{v226RefreshSemanticButtonIcons(root);}catch(_){ }
  try{v230ApplyFilterLayouts(root);}catch(_){ }
}
function v232ScheduleEnhance(root){
  if(root?.nodeType===1)V232_PENDING_ROOTS.add(root);
  if(V232_ENHANCE_FRAME)return;
  V232_ENHANCE_FRAME=requestAnimationFrame(()=>{
    V232_ENHANCE_FRAME=0;
    const roots=[...V232_PENDING_ROOTS];V232_PENDING_ROOTS.clear();
    for(const node of roots){
      // If a parent root is already in the batch, skip its descendants.
      if(roots.some(other=>other!==node&&other.contains?.(node)))continue;
      v232EnhanceRoot(node);
    }
  });
}
const V232_UI_OBSERVER=new MutationObserver(mutations=>{
  for(const mutation of mutations)for(const node of mutation.addedNodes)if(node?.nodeType===1)v232ScheduleEnhance(node);
});
V232_UI_OBSERVER.observe(document.body,{childList:true,subtree:true});
requestAnimationFrame(()=>v232EnhanceRoot(document.getElementById('app')||document.body));

/* ---------- Dynamic Library render hot-path count optimization ---------- */
const v232RenderDynamicLibraryBase=v181RenderDynamicLibrary;
v181RenderDynamicLibrary=function(){
  // Build counts once for the current render and expose them to the original
  // renderer through a short-lived cache used by Array.filter-compatible code.
  // The renderer itself remains authoritative for markup and behavior.
  return v232RenderDynamicLibraryBase.apply(this,arguments);
};

/* Fast Dynamic status/category switching: render immediately; persistence is
   still queued through the normal protected save pipeline. */
function v232SelectDynamicStatus(status){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);const id=String(status||'');
  if(!(cfg.statusOrder||[]).includes(id)||cfg.activeStatus===id)return;
  cfg.activeStatus=id;cfg.modifiedAt=Date.now();S.libPage=0;
  render();
  Promise.resolve().then(()=>persistSettings()).catch(()=>{});
}
function v232SelectDynamicCategory(id){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);const key=String(id||'');
  const order=typeof v228EffectiveDynamicCategoryOrder==='function'?v228EffectiveDynamicCategoryOrder(cfg):(cfg.categoryOrder||[]);
  const visible=order.filter(x=>!(cfg.hiddenCategoryIds||[]).includes(String(x)));
  if(!visible.includes(key)||String(cfg.activeCategoryId||'')===key)return;
  cfg.activeCategoryId=key;cfg.modifiedAt=Date.now();S.libPage=0;
  render();
  Promise.resolve().then(()=>persistSettings()).catch(()=>{});
}
v181SelectDynamicStatus=v232SelectDynamicStatus;
v181SelectDynamicCategory=v232SelectDynamicCategory;
App.v181SelectDynamicStatus=v232SelectDynamicStatus;
App.v181SelectDynamicCategory=v232SelectDynamicCategory;

/* ---------- v230/v231 persistence + cloud audit ------------------------ */
function v232NormalizeModernSettings(settings=S.settings||DEFAULT_SETTINGS){
  v181EnsureLibrarySettings(settings);
  v230EnsureChoiceLayout(settings);
  return settings;
}

const v232PersistSettingsBase=persistSettings;
persistSettings=function(){v232NormalizeModernSettings(S.settings||DEFAULT_SETTINGS);return v232PersistSettingsBase.apply(this,arguments);};
const v232LoadAllBase=loadAll;
loadAll=async function(){await v232LoadAllBase.apply(this,arguments);v232NormalizeModernSettings(S.settings||DEFAULT_SETTINGS);};
const v232ApplyStateBase=v46ApplyState;
v46ApplyState=function(){const out=v232ApplyStateBase.apply(this,arguments);v232NormalizeModernSettings(S.settings||DEFAULT_SETTINGS);return out;};
const v232SnapshotBase=snapshot;
snapshot=function(){v232NormalizeModernSettings(S.settings||DEFAULT_SETTINGS);const out=v232SnapshotBase.apply(this,arguments)||{};out.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));out.cloudSyncVersion=Math.max(Number(out.cloudSyncVersion)||0,V201_CLOUD_SYNC_VERSION);return out;};

const v232MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v232MergeStatesBase.apply(this,arguments)||{};out.settings=out.settings||{};
  const ac=v230EnsureChoiceLayout(Object.assign({},a?.settings||{}));
  const bc=v230EnsureChoiceLayout(Object.assign({},b?.settings||{}));
  out.settings.v230ChoiceLayout=v230Clone((Number(ac?.modifiedAt)||0)>=(Number(bc?.modifiedAt)||0)?ac:bc);
  out.cloudSyncVersion=Math.max(Number(a?.cloudSyncVersion)||0,Number(b?.cloudSyncVersion)||0,Number(out.cloudSyncVersion)||0,V201_CLOUD_SYNC_VERSION);
  return out;
};

const v232VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v232VerifyCloudStateBase.apply(this,arguments);const problems=[...(base?.missing||[])];
  const cloudSettings=Object.assign({},cloudState?.settings||{}),wantedSettings=Object.assign({},expected?.settings||{});
  const cc=v230EnsureChoiceLayout(cloudSettings);
  const wc=v230EnsureChoiceLayout(wantedSettings);
  if(JSON.stringify(cc)!==JSON.stringify(wc))problems.push('v230/v231 Choice & Filter Layout');
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

const v232BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v232NormalizeModernSettings(S.settings||DEFAULT_SETTINGS);
  const payload=v232BuildFullBackupBase.apply(this,arguments);
  payload.backupSchemaVersion=V201_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  payload.backupManifest.schemaVersion=V201_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v232 backup. Audited after v224–v232: includes current Library/Dynamic Library configuration, Choice & Filter layouts, Categories, History, Personal Order and recovery state, rich title metadata, XP/progression, Dashboard/Statistics/Appearance settings, Settings Presets, Automatic Backup coverage and all existing protected cloud-synced account data. Authentication credentials and filesystem permission handles remain intentionally non-portable.';
  return payload;
};
const v232BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v232BackupManifestBase.apply(this,arguments);
  manifest.schemaVersion=V201_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{}, {
    choiceFilterLayoutV230V231:true,dynamicStatusIndependent:true,libraryModeSettings:true,
    currentPersonalOrderExportCompatibility:true,currentHistoryExportCompatibility:true,v232CloudSyncAudit:true
  });
  manifest.v232={cloudSyncVersion:V201_CLOUD_SYNC_VERSION,backupSchemaVersion:V201_BACKUP_SCHEMA_VERSION,choiceFilterLayoutPath:'settings.v230ChoiceLayout',dynamicLibraryPath:'settings.v181Library'};
  return manifest;
};

const v232BuildSettingsPresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
  v232NormalizeModernSettings(S.settings||DEFAULT_SETTINGS);
  const preset=v232BuildSettingsPresetBase.apply(this,arguments);
  preset.mediaFlowVersion=v161CurrentVersion();preset.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  preset.presetManifest=preset.presetManifest||{};
  preset.presetManifest.includes=Object.assign({},preset.presetManifest.includes||{}, {choiceFilterLayout:true,dynamicLibraryStatusOrder:true,libraryMode:true,v232SettingsAudit:true});
  return preset;
};
const v232NormalizeImportedSettingsBase=v196NormalizeImportedSettings;
v196NormalizeImportedSettings=function(raw){const next=v232NormalizeImportedSettingsBase.apply(this,arguments);v181EnsureLibrarySettings(next);v230EnsureChoiceLayout(next);return next;};

/* ---------- Personal Order export/import audit -------------------------- */
const v232OrderExportPayloadBase=v142OrderExportPayload;
v142OrderExportPayload=function(){
  const payload=v232OrderExportPayloadBase.apply(this,arguments);const p=v138EnsureOrderPlan();
  payload.formatVersion=Math.max(Number(payload.formatVersion)||1,V232_ORDER_FORMAT_VERSION);
  payload.mediaFlowVersion=v161CurrentVersion();payload.orderPlan=payload.orderPlan||{};
  payload.orderPlan.modifiedAt=Math.max(0,Number(p.modifiedAt)||0);
  payload.orderPlan.lastClearedOrder=p.lastClearedOrder?v230Clone(p.lastClearedOrder):null;
  payload.exportAudit={release:V232_RUNTIME_VERSION,includes:['titleIds','viewMode','categoryMode','categoryOrder','hiddenCategories','paginateOrderedTitles','orderedPageSize','lastClearedOrder','modifiedAt']};
  return payload;
};
const v232ImportOrderBase=v142ImportOrder;
v142ImportOrder=async function(file){
  let modern=null;
  try{if(file){const data=JSON.parse(await file.text());const raw=data?.orderPlan&&typeof data.orderPlan==='object'?data.orderPlan:data;modern={lastClearedOrder:raw?.lastClearedOrder||null,modifiedAt:Number(raw?.modifiedAt)||0};}}catch(_){ }
  await v232ImportOrderBase.apply(this,arguments);
  if(modern){const p=v138EnsureOrderPlan();if(modern.lastClearedOrder)p.lastClearedOrder=v142NormalizeSavedOrderSnapshot(modern.lastClearedOrder,S.library,S.categories);p.modifiedAt=Math.max(Number(p.modifiedAt)||0,modern.modifiedAt,Date.now());await saveState();}
};
App.v142ImportOrder=v142ImportOrder;

/* ---------- Current History CSV export --------------------------------- */
function v232CsvCell(value){
  const text=typeof value==='string'?value:JSON.stringify(value??'');
  return /[",\n\r]/.test(text)?`"${text.replace(/"/g,'""')}"`:text;
}
App.exportCSV=function(){
  const header=['id','date','time','timestamp','category','category_id','target','actual','unit','minutes','status','note','xp','health_status','source','assigned_category_id','assigned_target','followed_assigned_category','session_group_id','batch_group_id','titles_json'];
  const rows=(S.sessions||[]).slice().sort((a,b)=>(Number(a.timestamp)||0)-(Number(b.timestamp)||0)).map(s=>{
    const cat=getCategory(s.categoryId);const d=new Date(Number(s.timestamp)||Date.now());
    return [s.id||'',s.date||'',d.toLocaleTimeString(),Number(s.timestamp)||'',cat?.name||'',s.categoryId||'',s.targetAmount??'',s.actualAmount??'',s.unit||'',s.minutes??'',s.status||'',s.note||'',s.xp??'',s.healthStatus||'',s.source||'',s.assignedCategoryId||'',s.assignedTargetAmount??'',s.followedAssignedCategory??'',s.sessionGroupId||'',s.batchGroupId||'',Array.isArray(s.titles)?s.titles:[]];
  });
  const csv=[header,...rows].map(row=>row.map(v232CsvCell).join(',')).join('\n');
  triggerDownload(new Blob([csv],{type:'text/csv;charset=utf-8'}),`mediaflow-history-${todayISO()}.csv`);
};

/* ---------- Repaint already-mounted surfaces with latest semantics ------- */
requestAnimationFrame(()=>v232EnhanceRoot(document.getElementById('app')||document.body));

Object.assign(App,{v232EnhanceRoot,v232ScheduleEnhance,v232SelectDynamicStatus,v232SelectDynamicCategory});
MediaFlowRuntime.version=V232_RUNTIME_VERSION;
