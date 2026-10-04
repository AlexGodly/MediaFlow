/* v194 owns the canonical category-icon settings object. Extend that object
   instead of creating a second disconnected preference so old presets/backups
   remain compatible and future Settings Presets keep including it automatically. */
v194ClampCategoryIconScale=function(value){
  const n=Math.round(Number(value));
  return Number.isFinite(n)?Math.max(V201_GLOBAL_ICON_MIN,Math.min(V201_GLOBAL_ICON_MAX,n)):150;
};
function v201ClampCoverCategoryIconScale(value){
  const n=Math.round(Number(value));
  return Number.isFinite(n)?Math.max(V201_COVER_ICON_MIN,Math.min(V201_COVER_ICON_MAX,n)):V201_COVER_ICON_DEFAULT;
}
v194NormalizeCategoryIconSettings=function(raw){
  const src=raw&&typeof raw==='object'?raw:{};
  return {
    scale:v194ClampCategoryIconScale(src.scale),
    coverScale:v201ClampCoverCategoryIconScale(src.coverScale),
    modifiedAt:Number(src.modifiedAt)||0
  };
};
v194EnsureCategoryIconSettings=function(settings){
  const target=settings&&typeof settings==='object'?settings:(S.settings=S.settings||{});
  target.v194CategoryIcons=v194NormalizeCategoryIconSettings(target.v194CategoryIcons);
  return target.v194CategoryIcons;
};

function v201ApplyCoverCategoryIconScale(value){
  const cfg=v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  const scale=v201ClampCoverCategoryIconScale(value==null?cfg.coverScale:value);
  document.documentElement.style.setProperty('--v201-cover-category-icon-scale',String(scale/100));
  return scale;
}
v194ApplyCategoryIconScale=function(value){
  const cfg=v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  const scale=v194ClampCategoryIconScale(value==null?cfg.scale:value);
  document.documentElement.style.setProperty('--v194-category-icon-scale',String(scale/100));
  v201ApplyCoverCategoryIconScale(cfg.coverScale);
  return scale;
};
v194PreviewCategoryIconScale=function(value){
  const scale=v194ApplyCategoryIconScale(value);
  const label=document.getElementById('v194-category-icon-size-value');
  if(label)label.textContent=`${scale}%`;
  const number=document.getElementById('v194-category-icon-size-number');
  if(number&&document.activeElement!==number)number.value=scale;
};
v194SetCategoryIconScale=function(value){
  const cfg=v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  cfg.scale=v194ClampCategoryIconScale(value);
  cfg.modifiedAt=Date.now();
  v194ApplyCategoryIconScale(cfg.scale);
  persistSettings();
  render();
};
function v201PreviewCoverCategoryIconScale(value){
  const scale=v201ApplyCoverCategoryIconScale(value);
  const label=document.getElementById('v201-cover-category-icon-size-value');
  if(label)label.textContent=`${scale}%`;
  const number=document.getElementById('v201-cover-category-icon-size-number');
  if(number&&document.activeElement!==number)number.value=scale;
}
function v201SetCoverCategoryIconScale(value){
  const cfg=v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  cfg.coverScale=v201ClampCoverCategoryIconScale(value);
  cfg.modifiedAt=Date.now();
  v201ApplyCoverCategoryIconScale(cfg.coverScale);
  persistSettings();
  render();
}

v194CategoryIconSettingsHtml=function(){
  const cfg=v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  const cat=S.categories?.[0]||{icon:'📚'};
  return `<div class="section-label">CATEGORY ICONS</div>
    <div class="card v194-category-icon-settings-card v201-category-icon-settings-card" style="margin-bottom:22px">
      <div class="v194-category-icon-settings-head">
        <div><b>Category icon size</b><div class="hint">Adjust category icons globally across MediaFlow. This controls normal category icons everywhere except the separate cover-placeholder icon size below.</div></div>
        <div class="v194-category-icon-preview"><span>${v144CategoryIconHtml(cat)}</span><strong id="v194-category-icon-size-value">${cfg.scale}%</strong></div>
      </div>
      <div class="v194-category-icon-controls">
        <input type="range" min="${V201_GLOBAL_ICON_MIN}" max="${V201_GLOBAL_ICON_MAX}" step="5" value="${cfg.scale}" aria-label="Category icon size" oninput="App.v194PreviewCategoryIconScale(this.value)" onchange="App.v194SetCategoryIconScale(this.value)">
        <input id="v194-category-icon-size-number" type="number" min="${V201_GLOBAL_ICON_MIN}" max="${V201_GLOBAL_ICON_MAX}" step="5" value="${cfg.scale}" aria-label="Category icon size percent" onchange="App.v194SetCategoryIconScale(this.value)">
        <button type="button" class="btn btn-sm btn-ghost" onclick="App.v194SetCategoryIconScale(150)">Reset 150%</button>
      </div>
      <div class="hint" style="margin-top:9px">Default: 150%. Range: ${V201_GLOBAL_ICON_MIN}%–${V201_GLOBAL_ICON_MAX}%.</div>

      <div class="v201-cover-icon-subsetting">
        <div class="v194-category-icon-settings-head">
          <div><b>Cover placeholder icon size</b><div class="hint">Only changes the category icon shown inside title-cover boxes when a title has no usable cover image. It does not change category icons elsewhere in MediaFlow.</div></div>
          <div class="v201-cover-icon-preview"><span>${v144CategoryIconHtml(cat)}</span><strong id="v201-cover-category-icon-size-value">${cfg.coverScale}%</strong></div>
        </div>
        <div class="v194-category-icon-controls">
          <input type="range" min="${V201_COVER_ICON_MIN}" max="${V201_COVER_ICON_MAX}" step="5" value="${cfg.coverScale}" aria-label="Cover placeholder category icon size" oninput="App.v201PreviewCoverCategoryIconScale(this.value)" onchange="App.v201SetCoverCategoryIconScale(this.value)">
          <input id="v201-cover-category-icon-size-number" type="number" min="${V201_COVER_ICON_MIN}" max="${V201_COVER_ICON_MAX}" step="5" value="${cfg.coverScale}" aria-label="Cover placeholder category icon size percent" onchange="App.v201SetCoverCategoryIconScale(this.value)">
          <button type="button" class="btn btn-sm btn-ghost" onclick="App.v201SetCoverCategoryIconScale(150)">Reset 150%</button>
        </div>
        <div class="hint" style="margin-top:9px">Default: 150%. Range: ${V201_COVER_ICON_MIN}%–${V201_COVER_ICON_MAX}%. This setting is independent from the global icon size above.</div>
      </div>
    </div>`;
};

Object.assign(App,{
  v194PreviewCategoryIconScale,
  v194SetCategoryIconScale,
  v201PreviewCoverCategoryIconScale,
  v201SetCoverCategoryIconScale
});

/* Normalize old v194 settings into the extended v201 shape immediately. */
DEFAULT_SETTINGS.v194CategoryIcons=v194NormalizeCategoryIconSettings(DEFAULT_SETTINGS.v194CategoryIcons);
v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
v194ApplyCategoryIconScale();

/* Cloud/version audit. Existing v194 merge code calls the canonical normalizer
   dynamically, so it already merges coverScale together with scale using the
   same modifiedAt timestamp. v201 only needs to raise the current cloud floor. */
const v201SnapshotBase=snapshot;
snapshot=function(){
  v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  const out=v201SnapshotBase.apply(this,arguments)||{};
  out.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  out.cloudSyncVersion=Math.max(Number(out.cloudSyncVersion)||0,V201_CLOUD_SYNC_VERSION);
  return out;
};
const v201MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v201MergeStatesBase.apply(this,arguments)||{};
  out.settings=out.settings||{};
  out.settings.v194CategoryIcons=v194NormalizeCategoryIconSettings(out.settings.v194CategoryIcons);
  out.cloudSyncVersion=Math.max(Number(a?.cloudSyncVersion)||0,Number(b?.cloudSyncVersion)||0,Number(out.cloudSyncVersion)||0,V201_CLOUD_SYNC_VERSION);
  return out;
};
const v201VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v201VerifyCloudStateBase.apply(this,arguments);
  const problems=[...(base?.missing||[])];
  const cloudCfg=v194NormalizeCategoryIconSettings(cloudState?.settings?.v194CategoryIcons);
  const wantedCfg=v194NormalizeCategoryIconSettings(expected?.settings?.v194CategoryIcons);
  if(Number(cloudCfg.coverScale)!==Number(wantedCfg.coverScale))problems.push('v201 cover placeholder icon size');
  if(Number(cloudState?.cloudSyncVersion||0)<V201_CLOUD_SYNC_VERSION)problems.push('v201 cloud state version');
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

const v201BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  const payload=v201BuildFullBackupBase.apply(this,arguments);
  payload.backupSchemaVersion=V201_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  payload.backupManifest.schemaVersion=V201_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v218 organized-settings modular backup (stable v201 feature base). Expands global category-icon sizing and adds an independent persistent cover-placeholder category-icon scale. Preserves v200 category default missing covers, v199 status terminology, v198 Settings Presets, v197 category recovery and all prior Library, History, Logging, XP, Statistics, themes and protected cloud data.';
  return payload;
};
const v201BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v201BackupManifestBase.apply(this,arguments);
  const cfg=v194NormalizeCategoryIconSettings(state?.settings?.v194CategoryIcons);
  manifest.schemaVersion=V201_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{}, {
    expandedCategoryIconSizeRange:true,
    coverPlaceholderCategoryIconSize:true,
    v201CloudSyncAudit:true,
    v201SettingsPresetAudit:true
  });
  manifest.v201={
    cloudSyncVersion:V201_CLOUD_SYNC_VERSION,
    backupSchemaVersion:V201_BACKUP_SCHEMA_VERSION,
    categoryIconScalePercent:cfg.scale,
    coverPlaceholderIconScalePercent:cfg.coverScale,
    categoryIconRange:[V201_GLOBAL_ICON_MIN,V201_GLOBAL_ICON_MAX],
    coverPlaceholderIconRange:[V201_COVER_ICON_MIN,V201_COVER_ICON_MAX]
  };
  return manifest;
};

/* Settings Presets already export all S.settings. Add explicit audit metadata so
   the new cover-only icon scale remains part of future preset checks. */
const v201BuildSettingsPresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
  const preset=v201BuildSettingsPresetBase.apply(this,arguments);
  preset.presetManifest=preset.presetManifest||{};
  preset.presetManifest.includes=Object.assign({},preset.presetManifest.includes||{}, {
    expandedCategoryIconSizing:true,
    coverPlaceholderCategoryIconSize:true
  });
  return preset;
};

})();


/* v50 one-time Library History integrity migration.
   Exact IDs only. Ambiguous/unsafe legacy entries are left unlinked. */
setTimeout(async()=>{
  try{
    if(!S.migrations?.libraryHistoryExactIdsV50?.done){
      const r=v50MigrateLibraryHistoryLinks();
      if(r.linked>0) await saveState();
      if(S.view==='libraryhistory') render();
      console.info(`MediaFlow v63: linked ${r.linked} legacy Library History entr${r.linked===1?'y':'ies'} by exact unique title.`);
    }
  }catch(e){console.warn('MediaFlow v63 Library History migration skipped:',e);}
},0);


/* MediaFlow v63
   Global dropdown styling is CSS-driven, so all current and future native
   <select> controls automatically inherit the designed theme-aware UI. */


/* MediaFlow v63 — Large Library Performance Update
   - debounced Library search
   - cached normalized title index
   - cached filter/sort results
   - one-pass Library overview aggregation
   - one-pass History last-touched index
   - reduced offscreen row painting */


/* MediaFlow v63 — Library Search Focus Hotfix
   Debounced search now restores focus and caret after the Library DOM refresh,
   allowing uninterrupted typing while retaining v53 performance optimizations. */

/* MediaFlow v63 — Platform Theme Collection
Separate MediaFlow and Platform theme selectors. Platform themes are MediaFlow palette interpretations inspired by the named services; no third-party logos/assets/layouts are copied. */
/* MediaFlow v63 — v56 Loading Hotfix + Profile Picture URL
   Rebuilt from the stable v55 base. The URL-avatar feature is isolated to the
   Profile Settings action and performs no image/network work during app startup. */
/* MediaFlow v63 — Stopwatch Full Time Adjustment
   Adds Minus time alongside Set time and Add time. Entered H/M/S can be
   repeatedly added or subtracted, never going below 00:00:00. The resulting
   value becomes the reset/start value and can be started normally. */
/* MediaFlow v63 — Actual Consumption Category Integrity
   Logging titles from categories different from the scheduler recommendation now
   credits History, category balance, health, XP and the next rotation to the
   categories actually consumed. The originally assigned category is preserved
   as metadata instead of being falsely credited as completed. Mixed-category
   logs are split into category-correct linked session records. */

/* MediaFlow v63 — Batch Logging & Recommendation Status Refinement
   Batch Log records multiple Library titles with independent amounts/minutes and
   feeds the same sessions-based scheduler, health, statistics, XP and progresssystems. Recommendation statuses now describe recommendation fulfillment only:
   Complete / Partial / Over / Skipped. Off-category and batch consumption uses
   Logged, while a fully missed recommendation receives a zero-consumption Skipped
   record so it is never falsely credited. */

/* MediaFlow v63 — Dedicated Batch Logging
   Adds a visible Batch Log navigation page with multi-title rows, automatic
   Library category detection, independent amount/minutes, date and note,
   Logged status for non-recommendation consumption, Library progress and
   completion updates, XP, History, Statistics, and scheduler balance/health
   integration. Recommendation statuses remain Complete/Partial/Over/Skipped. */

/* MediaFlow v63 — Searchable Responsive Batch Logging
   Batch Log now uses type-to-search Library title selection across all categories,
   responsive phone/tablet cards with no horizontal row scrolling, and explicitly
   updates each selected title's Library progress on submission. */

/* MediaFlow v63 — Mobile Navigation & Statistics Responsiveness
   Replaces the overcrowded mobile tab bar with five always-visible primary tabs
   plus a More menu for Library History, Profile and Settings. Statistics charts,
   cards, progress tracks and record rows now shrink/wrap cleanly on phones and
   tablets without pushing Settings off-screen or requiring horizontal scrolling. */
/* MediaFlow v64 — Classic Mobile Bottom Menu Design
   Preserves every v63 responsiveness/navigation fix while restoring the
   original pre-v63 visual design for the mobile bottom menu. The More fallback
   remains available when all destination tabs cannot fit safely. */

/* MediaFlow v65 — Mobile Bottom Navigation Visual Restoration
   Restyles the mobile bottom navigation to match the supplied reference:
   large outline icons above full labels on a clean flat bottom bar, with the
   active destination highlighted by the current theme accent. The v63
   responsive navigation logic and More fallback remain intact. */


