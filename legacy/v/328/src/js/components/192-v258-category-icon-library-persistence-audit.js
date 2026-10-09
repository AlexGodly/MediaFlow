/* ============================================================
   MediaFlow v258 — Built-in Category Artwork + Category Editor Polish
   ------------------------------------------------------------------
   - Adds the user-supplied MediaFlow category artwork as first-class built-in
     choices in Add category / Edit category.
   - Allows only packaged assets/category-icons/*.png relative paths in addition
     to the existing http/https category icon URL support.
   - Keeps the existing emoji/symbol and saved custom URL palettes intact.
   - Refreshes persistence audit metadata without changing Cloud Sync v201,
     Full Backup Schema v29, Settings Preset Schema v1 or Personal Order v4.
   ============================================================ */
const V258_RUNTIME_VERSION=258;

const V258_BUILTIN_CATEGORY_ICONS=Object.freeze([
  {label:'Seasonal Anime',src:'assets/category-icons/seasonal-anime.png'},
  {label:'Missed Anime',src:'assets/category-icons/missed-anime.png'},
  {label:'Finished Anime',src:'assets/category-icons/finished-anime.png'},
  {label:'Anime Movies',src:'assets/category-icons/anime-movies.png'},
  {label:'Anime Backlog',src:'assets/category-icons/anime-backlog.png'},
  {label:'Anime Movies Backlog',src:'assets/category-icons/anime-movies-backlog.png'},
  {label:'Asian Comics',src:'assets/category-icons/asian-comics.png'},
  {label:'Asian Comics Backlog',src:'assets/category-icons/asian-comics-backlog.png'},
  {label:'Movies',src:'assets/category-icons/movies.png'},
  {label:'Movies Backlog',src:'assets/category-icons/movies-backlog.png'},
  {label:'TV Series',src:'assets/category-icons/tv-series.png'},
  {label:'TV Series Backlog',src:'assets/category-icons/tv-series-backlog.png'},
  {label:'Books',src:'assets/category-icons/books.png'},
  {label:'Books Backlog',src:'assets/category-icons/books-backlog.png'},
  {label:'Novels',src:'assets/category-icons/novels.png'},
  {label:'Novels Backlog',src:'assets/category-icons/novels-backlog.png'},
  {label:'Magazines',src:'assets/category-icons/magazines.png'},
  {label:'Magazines Backlog',src:'assets/category-icons/magazines-backlog.png'},
  {label:'Online Media',src:'assets/category-icons/online-media.png'},
  {label:'Online Media Backlog',src:'assets/category-icons/online-media-backlog.png'},
  {label:'Comics',src:'assets/category-icons/comics.png'},
  {label:'Comics Backlog',src:'assets/category-icons/comics-backlog.png'}
]);
const V258_BUILTIN_CATEGORY_ICON_SET=new Set(V258_BUILTIN_CATEGORY_ICONS.map(x=>x.src));

function v258NormalizeBuiltInCategoryIcon(raw){
  let value=String(raw||'').trim().replace(/\\/g,'/');
  value=value.replace(/^\.\//,'').replace(/^\//,'');
  return V258_BUILTIN_CATEGORY_ICON_SET.has(value)?value:'';
}
function v258IsBuiltInCategoryIcon(raw){return !!v258NormalizeBuiltInCategoryIcon(raw);}

/* Existing category icon URLs remain http/https-only, except for the exact
   packaged v258 category artwork paths. Arbitrary relative paths stay blocked. */
const v258SafeIconUrlBase=v144SafeIconUrl;
v144SafeIconUrl=function(raw){
  const builtIn=v258NormalizeBuiltInCategoryIcon(raw);
  if(builtIn)return builtIn;
  return v258SafeIconUrlBase(raw);
};

/* Do not repeat a selected packaged icon again under "Your saved icons". */
const v258CustomIconsHtmlBase=v144CustomIconsHtml;
v144CustomIconsHtml=function(selectedEmoji,selectedUrl,current){
  const safeCurrent=current&&v258IsBuiltInCategoryIcon(current.iconUrl)
    ?Object.assign({},current,{iconUrl:''})
    :current;
  return v258CustomIconsHtmlBase(selectedEmoji,selectedUrl,safeCurrent);
};

function v258BuiltInCategoryIconPalette(selectedUrl){
  const selected=v258NormalizeBuiltInCategoryIcon(selectedUrl);
  return `<div class="v258-icon-library" aria-label="MediaFlow built-in category icons">
    ${V258_BUILTIN_CATEGORY_ICONS.map(icon=>`<button type="button" class="v258-icon-choice ${selected===icon.src?'selected':''}" data-v258-category-icon="${escapeHtml(icon.src)}" onclick="App.v258PickBuiltInCategoryIcon(this.dataset.v258CategoryIcon)" title="${escapeHtml(icon.label)}">
      <span class="v258-icon-choice-art"><img src="${escapeHtml(icon.src)}" alt="" loading="lazy"></span>
      <span class="v258-icon-choice-label">${escapeHtml(icon.label)}</span>
    </button>`).join('')}
  </div>`;
}

App.v258PickBuiltInCategoryIcon=function(raw){
  const src=v258NormalizeBuiltInCategoryIcon(raw);
  if(!src)return;
  App.v144PickCategoryIconUrl(src);
  document.querySelectorAll('#modal-root [data-v258-category-icon]').forEach(el=>{
    el.classList.toggle('selected',String(el.dataset.v258CategoryIcon||'')===src);
  });
};

/* Keep packaged image swatches and the older emoji/custom palettes together in
   one larger, clearer category editor without changing category semantics. */
const v258CategoryModalHtmlBase=categoryModalHtml;
categoryModalHtml=function(d){
  let h=v258CategoryModalHtmlBase.apply(this,arguments);
  const selected=v144SafeIconUrl(d?.iconUrl||'');
  const iconMarker='<label class="field-label">Icon</label>';
  const builtIn=`${iconMarker}
      <div class="v258-palette-heading"><div><b>MediaFlow icons</b><span>Built-in artwork</span></div><small>Choose one of the packaged category icons.</small></div>
      ${v258BuiltInCategoryIconPalette(selected)}
      <div class="v258-palette-heading v258-emoji-heading"><div><b>Emoji &amp; symbols</b><span>Classic icons</span></div><small>You can still use the original icon palette.</small></div>`;
  if(h.includes(iconMarker))h=h.replace(iconMarker,builtIn);
  return `<div class="v258-category-editor">${h}</div>`;
};

/* Category persistence is already canonical through S.categories. Add explicit
   v258 audit metadata and keep order portability aware of current icon artwork. */
const v258OrderExportPayloadBase=v142OrderExportPayload;
v142OrderExportPayload=function(){
  const payload=v258OrderExportPayloadBase.apply(this,arguments)||{};
  const current=new Map((S.categories||[]).map(c=>[String(c?.id||''),c]));
  payload.categories=(Array.isArray(payload.categories)?payload.categories:[]).map(row=>{
    const cat=current.get(String(row?.id||''))||{};
    return Object.assign({},row,{
      icon:String(cat.icon||row?.icon||''),
      iconUrl:v144SafeIconUrl(cat.iconUrl||row?.iconUrl||'')||'',
      color:String(cat.color||row?.color||'')
    });
  });
  payload.formatVersion=Math.max(Number(payload.formatVersion)||1,V232_ORDER_FORMAT_VERSION);
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.exportAudit=Object.assign({},payload.exportAudit||{}, {
    release:V258_RUNTIME_VERSION,
    categoryVisualMetadata:true,
    categoryIconAssets:true
  });
  return payload;
};

const v258BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v258BuildFullBackupBase.apply(this,arguments);
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.backupManifest=payload.backupManifest||{};
  payload.backupManifest.schemaVersion=V201_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.includes=Object.assign({},payload.backupManifest.includes||{}, {
    builtInCategoryArtworkV258:true,
    categoryIconUrlPersistence:true,
    automaticBackupUsesCurrentFullBackup:true,
    fullDataExchangeCurrent:true,
    historyExportCurrent:true,
    xpProgressionCurrent:true,
    personalOrderV4Current:true,
    pwaCategoryArtworkOffline:true
  });
  payload.backupManifest.v258={
    cloudSyncVersion:V201_CLOUD_SYNC_VERSION,
    backupSchemaVersion:V201_BACKUP_SCHEMA_VERSION,
    settingsPresetSchemaVersion:V196_SETTINGS_PRESET_SCHEMA_VERSION,
    personalOrderFormatVersion:V232_ORDER_FORMAT_VERSION,
    builtInCategoryIconCount:V258_BUILTIN_CATEGORY_ICONS.length
  };
  payload.backupManifest.note='Complete MediaFlow v258 backup. Audited current cloud/Sync Now, Full + Automatic Backup, Full Data import/export, Settings Presets, XP/progression, History export and Personal Order v4. Adds packaged built-in category artwork while preserving Cloud Sync v201, Full Backup Schema v29 and Settings Preset Schema v1.';
  return payload;
};

const v258SettingsPresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
  const preset=v258SettingsPresetBase.apply(this,arguments);
  preset.mediaFlowVersion=v161CurrentVersion();
  preset.presetManifest=preset.presetManifest||{};
  preset.presetManifest.includes=Object.assign({},preset.presetManifest.includes||{}, {
    builtInCategoryArtworkV258:true,
    categoryIconUrlPersistence:true
  });
  return preset;
};

/* Sync Now already fingerprints Settings/Library/History/XP/Order and v171
   verifies category iconUrl. Add a direct v258 assertion for packaged icon URLs
   so a category artwork regression is surfaced by protected cloud verification. */
const v258VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v258VerifyCloudStateBase.apply(this,arguments)||{ok:true,missing:[]};
  const problems=[...(base.missing||[])];
  const iconRows=state=>(Array.isArray(state?.categories)?state.categories:[]).map(c=>[
    String(c?.id||''),String(c?.icon||''),v144SafeIconUrl(c?.iconUrl||'')||''
  ]);
  if(v250Fingerprint(iconRows(cloudState))!==v250Fingerprint(iconRows(expected)))problems.push('Category artwork');
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

MediaFlowRuntime.version=V258_RUNTIME_VERSION;
