/* ============================================================
   MediaFlow v243 — Logging Cover Cleanup / Batch Category Filter Visibility
   --------------------------------------------------------------------------
   - Ensures a logged title with a usable cover URL shows only that cover.
     The category icon exists only as an error/no-cover fallback.
   - Keeps logging artwork clickable so it still opens Title Details.
   - Raises the Batch Log searchable Category Filter above neighboring cards
     and prevents the browser card from clipping its popover.
   - Re-audits current backup / preset / Personal Order export metadata.
   ============================================================ */
const V243_RUNTIME_VERSION=243;

/* ---------- Logging artwork: one visible artwork source at a time ------- */
function v243LoggedCoverMarkup(item,title,cls='v239-logged-cover'){
  const id=String(item?.id||'');
  const safeTitle=cleanTitle(item?.title||title||'Untitled');
  const cat=item?getCategory(item.categoryId):null;
  const fallbackInner=cat?v144CategoryIconHtml(cat):escapeHtml((safeTitle||'?').charAt(0).toUpperCase());
  const fallback=`<span class="${cls} v241-category-cover-fallback" aria-hidden="true">${fallbackInner}</span>`;

  if(!id){
    if(item?.coverUrl)return `<img class="${cls}" src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(safeTitle)} cover" loading="lazy">`;
    return fallback;
  }

  let artwork=fallback;
  if(item?.coverUrl){
    // The category artwork is present only as a hidden failure fallback. The
    // later v243 CSS class outranks the older v241 !important display rule,
    // so a valid title cover can never show both images at once.
    const hiddenFallback=fallback.replace('v241-category-cover-fallback','v241-category-cover-fallback v243-cover-fallback-hidden');
    artwork=`<img class="${cls}" src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(safeTitle)} cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.classList.remove('v243-cover-fallback-hidden')">${hiddenFallback}`;
  }

  return `<button type="button" class="v241-logged-cover-button v242-clean-cover-button v243-clean-cover-button" data-v225-iconified="1" title="Open title details" aria-label="Open ${escapeHtml(safeTitle)} details" onclick="event.preventDefault();event.stopPropagation();App.v181OpenTitleDetails('${escapeHtml(id)}')">${artwork}</button>`;
}

// v242 logged-title cards call this binding directly, while Batch Log and
// older logging surfaces can still enter through the v241/v239 aliases.
v242LoggedCoverMarkup=v243LoggedCoverMarkup;
v241LoggedCoverMarkup=v243LoggedCoverMarkup;
v239LoggedCover=function(item,title){return v243LoggedCoverMarkup(item,title,'v239-logged-cover');};

/* ---------- Batch Log category-filter popover safety ------------------- */
function v243RefreshBatchFilterLayer(){
  const host=document.getElementById('v175-batch-library-tools');
  if(!host)return;
  const filter=host.querySelector('[data-v237-category-filter="batch"]');
  host.classList.toggle('v243-batch-filter-open',!!filter?.open);
}

// Keep the state class accurate even when the searchable filter is rebuilt by
// a live Batch Log refresh while the user is selecting several categories.
const v243CategoryFilterToggleBase=v237CategoryFilterToggle;
v237CategoryFilterToggle=function(surface,details){
  const out=v243CategoryFilterToggleBase.apply(this,arguments);
  if(surface==='batch')requestAnimationFrame(v243RefreshBatchFilterLayer);
  return out;
};
App.v237CategoryFilterToggle=v237CategoryFilterToggle;

const v243RefreshBatchLibraryUIBase=v175RefreshBatchLibraryUI;
v175RefreshBatchLibraryUI=function(){
  const out=v243RefreshBatchLibraryUIBase.apply(this,arguments);
  requestAnimationFrame(v243RefreshBatchFilterLayer);
  return out;
};

/* ---------- Persistence / export / sync audit -------------------------- */
const v243BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v243BuildFullBackupBase.apply(this,arguments);
  if(payload?.backupManifest)payload.backupManifest.note='Complete MediaFlow v243 backup. Current Library/Dynamic Library, Categories, History, Personal Order, rich metadata, cover-size preferences, XP/progression, Choice & Filter layouts and cloud-synced Settings remain included. v243 logging-cover visibility and Batch Log category-popover fixes are presentation/runtime changes and require no schema bump.';
  return payload;
};
const v243BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(){
  const manifest=v243BackupManifestBase.apply(this,arguments);
  manifest.includes=Object.assign({},manifest.includes||{}, {
    loggingSingleArtworkSourceV243:true,
    batchCategoryFilterPopoverV243:true,
    cloudPersistenceAuditV243:true,
    fullExportImportAuditV243:true,
    automaticBackupAuditV243:true,
    syncNowAuditV243:true,
    settingsPresetAuditV243:true,
    historyExportAuditV243:true,
    personalOrderExportAuditV243:true
  });
  manifest.v243={cloudSyncVersion:201,fullBackupSchema:29,settingsPresetSchema:1,personalOrderExportVersion:4,noNewPersistentFields:true};
  return manifest;
};
const v243BuildSettingsPresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
  const preset=v243BuildSettingsPresetBase.apply(this,arguments);
  preset.presetManifest=preset.presetManifest||{};
  preset.presetManifest.includes=Object.assign({},preset.presetManifest.includes||{}, {currentPersistentSettingsAuditV243:true,noNewSettingsV243:true});
  return preset;
};
const v243OrderExportPayloadBase=v142OrderExportPayload;
v142OrderExportPayload=function(){
  const payload=v243OrderExportPayloadBase.apply(this,arguments);
  payload.exportAudit=Object.assign({},payload.exportAudit||{}, {release:V243_RUNTIME_VERSION,current:true,personalOrderFormat:4,loggingArtworkAudit:'single-source',batchCategoryFilterAudit:'popover-layer'});
  return payload;
};
function v243AuditSnapshot(){return {backup:v148BuildFullBackup(),preset:v196BuildSettingsPreset(),order:v142OrderExportPayload()};}

Object.assign(App,{v243LoggedCoverMarkup,v243RefreshBatchFilterLayer,v243AuditSnapshot});
MediaFlowRuntime.version=V243_RUNTIME_VERSION;
