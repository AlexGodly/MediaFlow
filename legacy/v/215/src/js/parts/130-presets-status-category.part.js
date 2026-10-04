/* ============================================================
   MediaFlow v196 — Settings Presets
   ------------------------------------------------------------
   Canonical settings-only portability path.

   IMPORTANT FOR FUTURE MEDIAFLOW RELEASES:
   - New persistent settings stored anywhere inside S.settings are included
     automatically because the entire settings object is cloned here.
   - Category configuration/order is exported too because Categories are edited
     from Settings but live outside S.settings.
   - If a future Settings feature stores persistent configuration somewhere
     outside S.settings/categories/categoryOrder, extend this canonical builder
     at the same time as Full Backup, Automatic Backup, cloud/Sync Now and XP
     persistence audits.
   - Library, consumption History, Library History, XP ledgers, profile data,
     current tasks, stopwatch state and other account content are intentionally
     excluded from a Settings Preset.
   ============================================================ */
const V196_SETTINGS_PRESET_SCHEMA_VERSION=1;
const V196_SETTINGS_PRESET_FORMAT='MediaFlow_Settings_Preset';

function v196SettingsPresetTimestamp(date=new Date()){
  const pad=n=>String(n).padStart(2,'0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

function v196BuildSettingsPreset(){
  const now=new Date();
  return {
    presetFormat:V196_SETTINGS_PRESET_FORMAT,
    presetSchemaVersion:V196_SETTINGS_PRESET_SCHEMA_VERSION,
    mediaFlowVersion:v161CurrentVersion(),
    exportedAt:now.toISOString(),
    settings:v148SafeClone(S.settings||DEFAULT_SETTINGS,{}),
    categories:v148SafeClone(Array.isArray(S.categories)?S.categories:[],[]),
    categoryOrder:v74SyncCategoryOrder().slice(),
    presetManifest:{
      settingsOnly:true,
      canonicalSettingsObject:'S.settings',
      includes:{
        allSettingsFields:true,
        categoryConfiguration:true,
        categoryOrder:true,
        themes:true,
        schedulerSettings:true,
        levelingConfiguration:true,
        dashboardSectionSettings:true,
        libraryPresentationSettings:true,
        backupPreferences:true
      },
      excludes:{
        library:true,
        consumptionHistory:true,
        libraryHistory:true,
        xpLedgers:true,
        profile:true,
        stopwatchState:true,
        currentTask:true,
        activeSession:true,
        personalOrder:true,
        ratingQueue:true,
        completionTimeline:true,
        authentication:true,
        cloudCredentials:true
      },
      note:'Settings Presets contain configuration only. They do not contain Library titles, History, XP/progression, profile data or authentication credentials.'
    }
  };
}

function v196ValidateSettingsPreset(data){
  if(!data||typeof data!=='object'||Array.isArray(data))return {ok:false,message:'This file is not a MediaFlow Settings Preset.'};
  if(String(data.presetFormat||'')!==V196_SETTINGS_PRESET_FORMAT)return {ok:false,message:'This JSON is not a MediaFlow Settings Preset.'};
  if(!data.settings||typeof data.settings!=='object'||Array.isArray(data.settings))return {ok:false,message:'This Settings Preset does not contain a valid settings object.'};
  const schema=Number(data.presetSchemaVersion)||0;
  if(schema<1)return {ok:false,message:'This Settings Preset uses an unsupported schema.'};
  return {ok:true};
}

function v196NormalizeImportedSettings(raw){
  const incoming=v148SafeClone(raw,{});
  const next=Object.assign({},DEFAULT_SETTINGS,incoming||{});
  next.backup=Object.assign({},DEFAULT_SETTINGS.backup,incoming?.backup||{});
  next.leveling=Object.assign({},DEFAULT_SETTINGS.leveling,incoming?.leveling||{});
  next.leveling.unitXP=Object.assign({},DEFAULT_SETTINGS.leveling.unitXP,incoming?.leveling?.unitXP||{});
  next.leveling.rotationMultiplier=Object.assign({},DEFAULT_SETTINGS.leveling.rotationMultiplier,incoming?.leveling?.rotationMultiplier||{});
  return next;
}

function v196MergePresetCategories(presetCategories,presetOrder){
  if(!Array.isArray(presetCategories)||!presetCategories.length)return;
  const current=Array.isArray(S.categories)?S.categories:[];
  const currentById=new Map(current.map(c=>[String(c?.id||''),c]));
  const merged=[];
  for(const raw of presetCategories){
    if(!raw||typeof raw!=='object')continue;
    const id=String(raw.id||'').trim();
    if(!id)continue;
    const existing=currentById.get(id)||{};
    merged.push(Object.assign({},existing,v148SafeClone(raw,{}),{id}));
    currentById.delete(id);
  }
  // Never delete an account's newer/extra categories just because an older
  // settings preset did not know about them. Append them after preset entries.
  for(const c of currentById.values())merged.push(c);
  if(merged.length)S.categories=merged;
  const order=Array.isArray(presetOrder)?presetOrder.map(String):[];
  if(order.length)v74ApplyCategoryOrder(order);
  else v74SyncCategoryOrder();
}

App.exportSettingsPreset=function(){
  showDataProgress('Exporting Settings Preset','Collecting MediaFlow configuration only…',12);
  setTimeout(()=>{
    try{
      const payload=v196BuildSettingsPreset();
      updateDataProgress(58,'Packing Settings, category configuration and presentation preferences…');
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
      const stamp=v196SettingsPresetTimestamp(new Date(payload.exportedAt));
      const filename=`MediaFlow_Settings_${stamp}.json`;
      updateDataProgress(88,'Creating Settings Preset download…');
      triggerDownload(blob,filename);
      finishDataProgress(true,'Settings Preset exported',`${filename} · configuration only — Library, History and XP data were not included.`);
    }catch(e){
      console.error(e);
      finishDataProgress(false,'Settings Preset export failed','MediaFlow could not create the settings preset file.');
    }
  },30);
};

App.importSettingsPreset=async function(file){
  if(!file)return;
  showDataProgress('Importing Settings Preset','Reading settings-only preset…',8);
  try{
    const data=JSON.parse(await file.text());
    const validation=v196ValidateSettingsPreset(data);
    if(!validation.ok){
      finishDataProgress(false,'Preset rejected',validation.message);
      return;
    }
    updateDataProgress(30,'Applying MediaFlow settings…');
    S.settings=v196NormalizeImportedSettings(data.settings);
    v196MergePresetCategories(data.categories,data.categoryOrder||data.settings?.categoryOrder||[]);
    S.settings.categoryOrder=v74SyncCategoryOrder().slice();

    // Let the current release's normalizers keep every nested setting current.
    try{v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);}catch(_){ }
    try{v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);}catch(_){ }
    try{applyTheme(S.settings?.theme||'dark');}catch(_){ }
    try{v194ApplyCategoryIconScale();}catch(_){ }
    try{localStorage.setItem('mf_theme',String(S.settings?.theme||'dark'));}catch(_){ }
    try{restartBackupTimer();}catch(_){ }

    updateDataProgress(72,'Saving imported settings to your MediaFlow account…');
    await saveState();
    await saveQueue;
    render();
    finishDataProgress(true,'Settings Preset imported','Settings and category configuration were applied. Library, History, XP and profile data were left untouched.');
  }catch(e){
    console.error(e);
    finishDataProgress(false,'Settings Preset import failed','Could not read that preset. Make sure it is a valid MediaFlow Settings Preset JSON file.');
  }finally{
    try{const input=document.getElementById('v196-settings-preset-file');if(input)input.value='';}catch(_){ }
  }
};

function v196SettingsPresetCard(){
  return `<div class="section-label">SETTINGS PRESET</div>
    <div class="card v196-settings-preset-card" style="margin-bottom:22px">
      <div class="v196-settings-preset-head">
        <div>
          <b>Settings-only preset</b>
          <div class="hint">Export your MediaFlow configuration without exporting your Library, History, XP, profile or other account data. The preset includes the complete current Settings object plus category configuration and category order.</div>
        </div>
      </div>
      <div class="v196-settings-preset-actions">
        <button class="btn btn-primary" type="button" onclick="App.exportSettingsPreset()">Export settings preset</button>
        <button class="btn" type="button" onclick="document.getElementById('v196-settings-preset-file').click()">Import settings preset</button>
        <input id="v196-settings-preset-file" type="file" accept="application/json,.json" style="display:none" onchange="App.importSettingsPreset(this.files[0])">
      </div>
    </div>`;
}

const v196RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v196RenderSettingsBase.apply(this,arguments);
  const marker='<div class="section-label">DATA</div>';
  if(h.includes(marker))h=h.replace(marker,v196SettingsPresetCard()+marker);
  else h+=v196SettingsPresetCard();
  return h;
};


/* ============================================================
   MediaFlow v198 — Settings Preset UI Cleanup
   - Removed the visible preset-schema badge from Settings.
   - Removed the internal/export-filename explanatory hint from Settings.
   - Corrected Settings Preset exports to MediaFlow_Settings_<timestamp>.json.
   - UI/export-name only: no persistent schema bump required.
   ============================================================ */

/* ============================================================
   MediaFlow v199 — Global Library Status Terminology
   ------------------------------------------------------------
   User-facing Library statuses now use one canonical vocabulary everywhere:
   active    -> Watching
   paused    -> On Hold
   dropped   -> Dropped
   completed -> Completed
   planned   -> Plan to Watch

   Internal status ids stay unchanged for backward compatibility with existing
   Library data, imports, cloud state, backups, Settings Presets and APIs.
   ============================================================ */
function v199StatusLabel(value){
  const key=String(value||'planned').toLowerCase();
  return ({
    active:'Watching',
    paused:'On Hold',
    dropped:'Dropped',
    completed:'Completed',
    planned:'Plan to Watch'
  })[key] || String(value||'Plan to Watch');
}

/* ============================================================
   MediaFlow v197 — Category Clear Controls
   ------------------------------------------------------------
   Adds a Clear action beside Edit/Delete in:
   - Settings → Categories
   - Settings → Dynamic Library category row

   Clear removes Library titles assigned to that category while keeping the
   category itself and consumption History. The existing Library History
   transaction/deleted-snapshot pipeline remains authoritative, so cleared
   titles are recorded and can be restored through Library History.

   No new persistent setting/data field is introduced in v197. Cloud Sync,
   Full Backup and Settings Preset schemas therefore stay unchanged.
   ============================================================ */

function v197CategoryClearInfo(id){
  const sid=String(id||'');
  const cat=(S.categories||[]).find(c=>String(c?.id||'')===sid)||null;
  const items=(S.library||[]).filter(i=>String(i?.categoryId||'')===sid);
  return {cat,items,count:items.length};
}

function v197CategoryClearModalHtml(data){
  const id=String(data?.id||'');
  const info=v197CategoryClearInfo(id);
  const cat=info.cat;
  if(!cat)return `<div class="priority-modal v197-category-clear-modal"><div class="modal-title">Category unavailable</div><div class="hint">This category no longer exists.</div><div class="modal-actions"><button type="button" class="btn" onclick="App.closeModal()">Close</button></div></div>`;

  const count=info.count;
  const noun=count===1?'title':'titles';
  const sample=info.items.slice(0,3).map(item=>`<div class="v197-clear-sample-row"><span>•</span><span>${escapeHtml(cleanTitle(item?.title)||'Untitled')}</span></div>`).join('');
  const more=Math.max(0,count-3);

  return `<div class="priority-modal v197-category-clear-modal">
    <div class="v197-category-clear-head">
      <div class="v197-category-clear-icon">${v144CategoryIconHtml(cat)}</div>
      <div>
        <div class="modal-title">Clear ${escapeHtml(cat.name)}?</div>
        <div class="hint">Delete every Library title currently assigned to this category.</div>
      </div>
    </div>

    <div class="v197-category-clear-count">
      <strong>${count.toLocaleString()}</strong>
      <span>${noun} will be removed from your Library</span>
    </div>

    ${sample?`<div class="v197-category-clear-samples">${sample}${more?`<div class="v197-clear-more">+ ${more.toLocaleString()} more</div>`:''}</div>`:''}

    <div class="v197-category-clear-warning">
      <b>The category itself will stay.</b>
      <span>Consumption History and Statistics stay intact. MediaFlow records the removed titles in Library History, where supported deletion snapshots can be restored later.</span>
    </div>

    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
      <button type="button" class="btn btn-danger" onclick="App.v197ConfirmCategoryClear('${escapeHtml(id)}',this)">Clear ${count.toLocaleString()} ${noun}</button>
    </div>
  </div>`;
}

function v197OpenCategoryClear(id){
  const info=v197CategoryClearInfo(id);
  if(!info.cat){showToast('That category no longer exists.');return;}
  if(!info.count){showToast(`${info.cat.name} is already empty`);return;}
  S.modal={type:'categoryClear',data:{id:String(id)}};
  render();
}

const v197ClearCategoryBase=App.clearCategoryLibrary;
async function v197ConfirmCategoryClear(id,button){
  if(button?.dataset?.working==='1')return;
  if(button){button.dataset.working='1';button.disabled=true;}

  const info=v197CategoryClearInfo(id);
  if(!info.cat){S.modal=null;render();showToast('That category no longer exists.');return;}
  if(!info.count){S.modal=null;render();showToast(`${info.cat.name} is already empty`);return;}

  // Close the confirmation before invoking the existing clear transaction.
  // That transaction already records Library History and v191 restore snapshots.
  S.modal=null;
  const modal=document.getElementById('modal-root');
  if(modal)modal.remove();

  if(typeof v197ClearCategoryBase==='function'){
    v197ClearCategoryBase.call(App,String(id));
  }else{
    mfClearCategory(String(id));
  }
}

// Existing Category Maintenance buttons now receive the same designed
// confirmation instead of clearing immediately.
App.clearCategoryLibrary=function(id){v197OpenCategoryClear(id);};
Object.assign(App,{v197OpenCategoryClear,v197ConfirmCategoryClear});

/* New modal type, without disturbing any of MediaFlow's existing modal chain. */
const v197RenderModalBase=renderModal;
renderModal=function(){
  if(S.modal?.type!=='categoryClear')return v197RenderModalBase.apply(this,arguments);
  let el=document.getElementById('modal-root');
  if(el)el.remove();
  const wrap=document.createElement('div');
  wrap.id='modal-root';
  wrap.innerHTML=`<div class="modal-overlay" onclick="if(event.target===this) App.closeModal()"><div class="modal">${v197CategoryClearModalHtml(S.modal.data)}</div></div>`;
  document.body.appendChild(wrap);
};

/* Category Settings: place Clear directly between Edit and Delete. */
const v197CategoryRowsHtmlBase=v171CategoryRowsHtml;
v171CategoryRowsHtml=function(){
  let h=v197CategoryRowsHtmlBase.apply(this,arguments);
  h=h.replace(
    /(<button class="btn btn-sm btn-ghost cat-edit-btn" onclick="App\.openCategoryModal\('([^']+)'\)">Edit<\/button>)\s*(<button class="btn btn-sm btn-danger cat-delete-btn" onclick="App\.deleteCategory\('\2'\)">Delete<\/button>)/g,
    `$1<button type="button" class="btn btn-sm v197-clear-btn cat-clear-btn" onclick="App.v197OpenCategoryClear('$2')">Clear</button>$3`
  );
  return h;
};

/* Dynamic Library category rows: same Edit → Clear → Delete action cluster. */
const v197DynamicLibrarySettingsHtmlBase=v181DynamicLibrarySettingsHtml;
v181DynamicLibrarySettingsHtml=function(){
  let h=v197DynamicLibrarySettingsHtmlBase.apply(this,arguments);
  h=h.replace(
    /(<button type="button" class="btn btn-sm btn-ghost" onclick="App\.openCategoryModal\('([^']+)'\)">Edit<\/button>)\s*(<button type="button" class="btn btn-sm btn-danger" onclick="App\.deleteCategory\('\2'\)">Delete<\/button>)/g,
    `$1<button type="button" class="btn btn-sm v197-clear-btn" onclick="App.v197OpenCategoryClear('$2')">Clear</button>$3`
  );
  h=h.replace(
    'show/hide the category, or edit/delete it directly.',
    'show/hide the category, or edit/clear/delete it directly.'
  );
  return h;
};


/* ============================================================
   MediaFlow v200 — Category Default Missing Covers
   ------------------------------------------------------------
   - Categories now support a "Missing default cover URL".
   - A title's own cover URL always wins.
   - When enabled, titles without their own cover use their category's default
     missing-cover URL; if unavailable, MediaFlow falls back to the category icon.
   - A global Settings switch can force category-icon-only fallback instead.
   - Category defaults remain DISPLAY fallbacks only: they never populate the
     title's own coverUrl, so Missing Covers can still find/fix actual missing art.
   - Full Backup / Cloud Sync / Sync Now / Settings Preset paths are audited.
   ============================================================ */
const V200_BACKUP_SCHEMA_VERSION=28;
const V200_CLOUD_SYNC_VERSION=200;
const V200_CATEGORY_COVER_DEFAULT={useCategoryDefault:true,modifiedAt:0};
const V200_TEMP_ORIGINAL_COVER='__v200OriginalCoverUrl';

function v200NormalizeCategoryCoverSettings(raw){
  const src=raw&&typeof raw==='object'?raw:{};
  return {
    useCategoryDefault:src.useCategoryDefault!==false,
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}
function v200EnsureCategoryCoverSettings(settings=S.settings){
  const target=settings&&typeof settings==='object'?settings:(S.settings=S.settings||{});
  target.v200CategoryCovers=v200NormalizeCategoryCoverSettings(target.v200CategoryCovers);
  return target.v200CategoryCovers;
}
function v200UseCategoryDefaultCover(){
  return v200EnsureCategoryCoverSettings(S.settings||DEFAULT_SETTINGS).useCategoryDefault!==false;
}
function v200SafeCategoryCoverUrl(raw){
  return v144SafeIconUrl(raw||'');
}
function v200CategoryMissingCoverUrl(cat){
  return v200SafeCategoryCoverUrl(cat?.missingDefaultCoverUrl||'');
}
function v200OwnCoverUrl(item){
  if(!item)return '';
  if(Object.prototype.hasOwnProperty.call(item,V200_TEMP_ORIGINAL_COVER)){
    return String(item[V200_TEMP_ORIGINAL_COVER]??'');
  }
  return String(item.coverUrl??'');
}
function v200EffectiveTitleCoverUrl(item){
  const own=v160SafeCoverUrl(v200OwnCoverUrl(item));
  if(own)return own;
  if(!v200UseCategoryDefaultCover())return '';
  return v200CategoryMissingCoverUrl(getCategory(item?.categoryId));
}
function v200TitleCoverSource(item){
  const own=v160SafeCoverUrl(v200OwnCoverUrl(item));
  if(own)return {type:'title',url:own};
  const fallback=v200UseCategoryDefaultCover()?v200CategoryMissingCoverUrl(getCategory(item?.categoryId)):'';
  return fallback?{type:'category-default',url:fallback}:{type:'category-icon',url:''};
}

/* During synchronous UI rendering only, expose category default covers through
   the legacy item.coverUrl field. The original value is restored immediately,
   so no Library/export/cloud data is mutated and Missing Covers stays accurate. */
function v200WithDisplayCovers(fn,ctx,args){
  if(typeof fn!=='function')return;
  if(!v200UseCategoryDefaultCover())return fn.apply(ctx,args||[]);
  const changed=[];
  for(const item of (S.library||[])){
    if(!item||String(item.coverUrl||'').trim())continue;
    const fallback=v200CategoryMissingCoverUrl(getCategory(item.categoryId));
    if(!fallback)continue;
    const original=item.coverUrl;
    try{Object.defineProperty(item,V200_TEMP_ORIGINAL_COVER,{value:original,configurable:true,writable:true,enumerable:false});}
    catch(_){item[V200_TEMP_ORIGINAL_COVER]=original;}
    item.coverUrl=fallback;
    changed.push([item,original]);
  }
  try{return fn.apply(ctx,args||[]);}
  finally{
    for(const [item,original] of changed){
      item.coverUrl=original;
      try{delete item[V200_TEMP_ORIGINAL_COVER];}catch(_){item[V200_TEMP_ORIGINAL_COVER]=undefined;}
    }
  }
}

/* Keep the Missing Covers queue based on ACTUAL title cover URLs rather than
   temporary display fallbacks. */
v192MissingCoverItems=function(){
  return (S.library||[]).filter(item=>item?.id&&!String(v200OwnCoverUrl(item)||'').trim());
};

/* All normal page renderers automatically inherit category default cover art
   without rewriting dozens of existing cover components. */
const v200RenderViewBase=renderView;
renderView=function(){
  return v200WithDisplayCovers(v200RenderViewBase,this,arguments);
};

/* Title Details is created directly outside renderView, so give it the same
   display-only cover treatment. The full title editor intentionally remains
   untouched so its Cover URL field always reflects the title's REAL cover. */
const v200OpenTitleDetailsBase=v181OpenTitleDetails;
v181OpenTitleDetails=function(id){
  return v200WithDisplayCovers(v200OpenTitleDetailsBase,this,arguments);
};
App.v181OpenTitleDetails=v181OpenTitleDetails;

/* Missing Covers must remain in the queue even when a category fallback is
   visible. Show that category fallback as the card artwork when available. */
const v200MissingCoversHtmlBase=v192MissingCoversHtml;
v192MissingCoversHtml=function(){
  const item=v192CurrentMissingCoverItem();
  const url=item?v200EffectiveTitleCoverUrl(item):'';
  const html=v200MissingCoversHtmlBase.apply(this,arguments);
  if(!item||!url)return html;
  try{
    const host=document.createElement('div');
    host.innerHTML=html;
    const ph=host.querySelector('.v192-cover-placeholder');
    if(ph){
      ph.innerHTML=`<img class="v200-missing-default-cover" src="${escapeHtml(url)}" alt="${escapeHtml(cleanTitle(item.title))} category default cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="v200-missing-default-icon" style="display:none">${v144CategoryIconHtml(getCategory(item.categoryId))}</span>`;
      ph.title='Open title details · category default cover';
    }
    return host.innerHTML;
  }catch(_){return html;}
};

/* Dynamic theme recommendations can also use the visible category fallback,
   while still preferring a title's own cover whenever one exists. */
v160RecommendedCoverSource=function(){
  const t=S.currentTask;
  if(!t)return null;
  let item=null;
  if(t.libraryId)item=(S.library||[]).find(x=>String(x?.id||'')===String(t.libraryId))||null;
  if(!item&&t.title)item=v50FindLibraryItem(t.libraryId,t.title);
  const url=item?v200EffectiveTitleCoverUrl(item):'';
  if(!item||!url)return null;
  const source=v200TitleCoverSource(item);
  return {source:'recommended',label:`Recommended: ${cleanTitle(item.title)}`,url,libraryId:item.id||t.libraryId||null,coverType:source.type};
};
v145RecommendedCoverSource=v160RecommendedCoverSource;

/* ---------- Category editor: Missing default cover URL ---------- */
const v200CategoryModalHtmlBase=categoryModalHtml;
categoryModalHtml=function(d){
  let h=v200CategoryModalHtmlBase.apply(this,arguments);
  const url=v200CategoryMissingCoverUrl(d||{});
  const field=`<div class="field v200-category-default-cover-field">
    <label class="field-label">Missing default cover URL</label>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) 62px;gap:10px;align-items:center">
      <div>
        <input type="url" id="m-missing-default-cover" value="${escapeHtml(url)}" placeholder="https://example.com/default-cover.jpg" oninput="App.v200PreviewCategoryDefaultCover(this.value)">
        <small class="hint">Used only when a title in this category has no cover URL of its own. If blank, MediaFlow falls back to the category icon.</small>
      </div>
      <div id="v200-category-default-cover-preview" style="width:54px;height:78px;border:1px solid var(--border-soft);border-radius:9px;overflow:hidden;display:grid;place-items:center;background:var(--panel-raised)">${url?`<img src="${escapeHtml(url)}" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span style="display:none;width:100%;height:100%;place-items:center">${v144CategoryIconHtml(d)}</span>`:v144CategoryIconHtml(d)}</div>
    </div>
  </div>`;
  const colorMarker='<div class="field">\n      <label class="field-label">Color</label>';
  if(h.includes(colorMarker))h=h.replace(colorMarker,field+'\n\n    '+colorMarker);
  else h=h.replace('<label style="display:flex; align-items:center; gap:6px; font-size:13px; margin-bottom:6px;">',field+'<label style="display:flex; align-items:center; gap:6px; font-size:13px; margin-bottom:6px;">');
  return h;
};

function v200PreviewCategoryDefaultCover(raw){
  const box=document.getElementById('v200-category-default-cover-preview');
  if(!box)return;
  const url=v200SafeCategoryCoverUrl(raw);
  const cat=S.modal?.data||{};
  box.innerHTML=url
    ?`<img src="${escapeHtml(url)}" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span style="display:none;width:100%;height:100%;place-items:center">${v144CategoryIconHtml(cat)}</span>`
    :v144CategoryIconHtml(cat);
}
App.v200PreviewCategoryDefaultCover=v200PreviewCategoryDefaultCover;

/* v144's save handler is reproduced with the v200 category cover field so the
   new value is persisted atomically with the rest of the category. */
App.saveCategoryModal=function(id,button){
  if(button?.dataset?.saving==='1')return;
  if(button){button.dataset.saving='1';button.disabled=true;}

  const iconUrl=v144SafeIconUrl(document.getElementById('m-icon-url')?.value||'');
  const icon=iconUrl?'🖼️':(String(document.getElementById('m-icon')?.value||'').trim()||'✨');
  const rawMissing=String(document.getElementById('m-missing-default-cover')?.value||'').trim();
  const missingDefaultCoverUrl=v200SafeCategoryCoverUrl(rawMissing);
  if(rawMissing&&!missingDefaultCoverUrl){
    if(button){delete button.dataset.saving;button.disabled=false;}
    showToast('Use a valid http:// or https:// Missing default cover URL.');
    return;
  }

  let color=String(document.getElementById('m-color')?.value||COLOR_CHOICES[0]).trim().toUpperCase();
  if(!/^#[0-9A-F]{6}$/.test(color))color=COLOR_CHOICES[0];

  const existing=(S.categories||[]).find(c=>String(c?.id||'')===String(id||''))||null;
  const oldMissing=v200CategoryMissingCoverUrl(existing||{});
  const missingModifiedAt=oldMissing!==missingDefaultCoverUrl?Date.now():(Number(existing?.missingDefaultCoverModifiedAt)||0);

  const data={
    id:id||uid(),
    name:document.getElementById('m-name').value.trim()||'Untitled category',
    icon,
    iconUrl:iconUrl||null,
    missingDefaultCoverUrl:missingDefaultCoverUrl||null,
    missingDefaultCoverModifiedAt:missingModifiedAt,
    type:document.getElementById('m-type').value,
    unit:document.getElementById('m-unit').value,
    target:Math.max(1,Number(document.getElementById('m-target').value)||1),
    weight:clamp(Number(document.getElementById('m-weight').value)||3,1,5),
    minutesPerUnit:Math.max(1,Number(document.getElementById('m-mpu').value)||20),
    seasonal:document.getElementById('m-seasonal').checked,
    color,
    enabled:document.getElementById('m-enabled').checked,
    custom:true
  };

  const idx=S.categories.findIndex(c=>String(c?.id||'')===String(id||''));
  if(idx>=0)S.categories[idx]=Object.assign({},S.categories[idx],data);
  else S.categories.push(data);

  persistCategories();
  S.modal=null;
  render();
};

/* ---------- Settings switch ---------- */
function v200CategoryCoverSettingsHtml(){
  const cfg=v200EnsureCategoryCoverSettings(S.settings||DEFAULT_SETTINGS);
  return `<div class="section-label">MISSING TITLE COVERS</div>
    <div class="card v200-category-cover-settings" style="margin-bottom:22px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
        <div style="min-width:0;flex:1">
          <b>Use category default missing cover</b>
          <div class="hint">When a title has no cover URL, use its category's Missing default cover URL. A title's own cover always has priority. Categories without a default automatically fall back to their category icon.</div>
        </div>
        <button type="button" class="toggle ${cfg.useCategoryDefault!==false?'on':''}" onclick="App.v200ToggleCategoryDefaultCovers()" aria-label="Toggle category default missing covers"></button>
      </div>
      <div class="hint" style="margin-top:10px"><b>${cfg.useCategoryDefault!==false?'Category default cover mode':'Category icon only mode'}</b> · Missing Covers still tracks titles that do not have their own cover URL.</div>
    </div>`;
}
function v200ToggleCategoryDefaultCovers(){
  const cfg=v200EnsureCategoryCoverSettings(S.settings||DEFAULT_SETTINGS);
  cfg.useCategoryDefault=cfg.useCategoryDefault===false;
  cfg.modifiedAt=Date.now();
  persistSettings();
  render();
  showToast(cfg.useCategoryDefault?'Category default missing covers enabled':'Missing covers will use category icons only');
}
App.v200ToggleCategoryDefaultCovers=v200ToggleCategoryDefaultCovers;

const v200RenderSettingsBase=renderSettings;
renderSettings=function(){
  v200EnsureCategoryCoverSettings(S.settings||DEFAULT_SETTINGS);
  let h=v200RenderSettingsBase.apply(this,arguments);
  const marker='<div class="section-label">MISSING TITLE COVERS</div>';
  if(h.includes(marker))return h;
  const iconSection='<div class="section-label">CATEGORY ICONS</div>';
  const nextSection='<div class="two-col" style="align-items:start;">';
  if(h.includes(iconSection)&&h.includes(nextSection)){
    const idx=h.indexOf(nextSection,h.indexOf(iconSection));
    if(idx>=0)h=h.slice(0,idx)+v200CategoryCoverSettingsHtml()+h.slice(idx);
    else h+=v200CategoryCoverSettingsHtml();
  }else h+=v200CategoryCoverSettingsHtml();
  return h;
};

/* ---------- Persistence / Cloud / Full Backup ---------- */
DEFAULT_SETTINGS.v200CategoryCovers=v200NormalizeCategoryCoverSettings(DEFAULT_SETTINGS.v200CategoryCovers);
v200EnsureCategoryCoverSettings(S.settings||DEFAULT_SETTINGS);

const v200PersistSettingsBase=persistSettings;
persistSettings=function(){
  v200EnsureCategoryCoverSettings(S.settings||DEFAULT_SETTINGS);
  return v200PersistSettingsBase.apply(this,arguments);
};
const v200LoadAllBase=loadAll;
loadAll=async function(){
  await v200LoadAllBase.apply(this,arguments);
  v200EnsureCategoryCoverSettings(S.settings||DEFAULT_SETTINGS);
};
const v200ApplyStateBase=v46ApplyState;
v46ApplyState=function(){
  const result=v200ApplyStateBase.apply(this,arguments);
  v200EnsureCategoryCoverSettings(S.settings||DEFAULT_SETTINGS);
  return result;
};
const v200SnapshotBase=snapshot;
snapshot=function(){
  v200EnsureCategoryCoverSettings(S.settings||DEFAULT_SETTINGS);
  const out=v200SnapshotBase.apply(this,arguments)||{};
  out.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  out.categories=JSON.parse(JSON.stringify(S.categories||[]));
  out.cloudSyncVersion=Math.max(Number(out.cloudSyncVersion)||0,V200_CLOUD_SYNC_VERSION);
  return out;
};

function v200MergeCategoryDefaultCoverFields(outCats,aCats,bCats){
  const amap=new Map((Array.isArray(aCats)?aCats:[]).map(c=>[String(c?.id||''),c]));
  const bmap=new Map((Array.isArray(bCats)?bCats:[]).map(c=>[String(c?.id||''),c]));
  return (Array.isArray(outCats)?outCats:[]).map(raw=>{
    const c=Object.assign({},raw||{});
    const id=String(c.id||'');
    const ac=amap.get(id),bc=bmap.get(id);
    const at=Math.max(0,Number(ac?.missingDefaultCoverModifiedAt)||0);
    const bt=Math.max(0,Number(bc?.missingDefaultCoverModifiedAt)||0);
    let chosen=null;
    if(at||bt)chosen=at>=bt?ac:bc;
    else if(Object.prototype.hasOwnProperty.call(c,'missingDefaultCoverUrl'))chosen=c;
    else chosen=(v200CategoryMissingCoverUrl(ac)?ac:(v200CategoryMissingCoverUrl(bc)?bc:c));
    c.missingDefaultCoverUrl=v200CategoryMissingCoverUrl(chosen||{})||null;
    c.missingDefaultCoverModifiedAt=Math.max(at,bt,Number(c.missingDefaultCoverModifiedAt)||0)||0;
    return c;
  });
}

const v200MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v200MergeStatesBase.apply(this,arguments)||{};
  out.settings=out.settings||{};
  const av=v200NormalizeCategoryCoverSettings(a?.settings?.v200CategoryCovers);
  const bv=v200NormalizeCategoryCoverSettings(b?.settings?.v200CategoryCovers);
  out.settings.v200CategoryCovers=(Number(av.modifiedAt)||0)>=(Number(bv.modifiedAt)||0)?av:bv;
  out.categories=v200MergeCategoryDefaultCoverFields(out.categories,a?.categories,b?.categories);
  out.cloudSyncVersion=Math.max(Number(a?.cloudSyncVersion)||0,Number(b?.cloudSyncVersion)||0,Number(out.cloudSyncVersion)||0,V200_CLOUD_SYNC_VERSION);
  return out;
};

const v200VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v200VerifyCloudStateBase.apply(this,arguments);
  const problems=[...(base?.missing||[])];
  const cc=v200NormalizeCategoryCoverSettings(cloudState?.settings?.v200CategoryCovers);
  const ec=v200NormalizeCategoryCoverSettings(expected?.settings?.v200CategoryCovers);
  if(JSON.stringify(cc)!==JSON.stringify(ec))problems.push('v200 missing-cover fallback setting');

  const coverMap=state=>new Map((Array.isArray(state?.categories)?state.categories:[]).map(c=>[String(c?.id||''),{
    url:v200CategoryMissingCoverUrl(c)||'',
    modifiedAt:Math.max(0,Number(c?.missingDefaultCoverModifiedAt)||0)
  }]));
  const cm=coverMap(cloudState),em=coverMap(expected);
  for(const [id,wanted] of em){
    const got=cm.get(id)||{url:'',modifiedAt:0};
    if(got.url!==wanted.url||got.modifiedAt!==wanted.modifiedAt){problems.push('v200 category default covers');break;}
  }
  if(Number(cloudState?.cloudSyncVersion||0)<V200_CLOUD_SYNC_VERSION)problems.push('v200 cloud state version');
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

const v200BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v200EnsureCategoryCoverSettings(S.settings||DEFAULT_SETTINGS);
  const payload=v200BuildFullBackupBase.apply(this,arguments);
  payload.backupSchemaVersion=V200_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  payload.categories=JSON.parse(JSON.stringify(S.categories||[]));
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  payload.backupManifest.schemaVersion=V200_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v200 backup. Adds per-category Missing default cover URLs plus the persistent category-default-vs-category-icon missing-cover fallback setting. Title cover URLs always remain authoritative; category defaults are display fallbacks only. Preserves v199 status terminology, v198 Settings Presets, v197 category recovery, v194 icon sizing and all prior Library, History, Logging, XP, Statistics, themes and protected cloud data.';
  return payload;
};
const v200BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v200BackupManifestBase.apply(this,arguments);
  const cfg=v200NormalizeCategoryCoverSettings(state?.settings?.v200CategoryCovers);
  const cats=Array.isArray(state?.categories)?state.categories:[];
  manifest.schemaVersion=V200_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{}, {
    categoryMissingDefaultCoverUrls:true,
    categoryMissingCoverFallbackSetting:true,
    v200CloudSyncAudit:true,
    v200SettingsPresetAudit:true
  });
  manifest.v200={
    cloudSyncVersion:V200_CLOUD_SYNC_VERSION,
    backupSchemaVersion:V200_BACKUP_SCHEMA_VERSION,
    useCategoryDefaultMissingCover:cfg.useCategoryDefault!==false,
    categoriesWithDefaultMissingCover:cats.filter(c=>!!v200CategoryMissingCoverUrl(c)).length
  };
  return manifest;
};

/* Settings Presets already clone all Settings + Categories. Add explicit v200
   manifest flags so future preset audits can see that these fields are covered. */
const v200BuildSettingsPresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
  const preset=v200BuildSettingsPresetBase.apply(this,arguments);
  preset.presetManifest=preset.presetManifest||{};
  preset.presetManifest.includes=Object.assign({},preset.presetManifest.includes||{}, {
    missingCoverFallbackPreference:true,
    categoryMissingDefaultCoverUrls:true
  });
  return preset;
};




