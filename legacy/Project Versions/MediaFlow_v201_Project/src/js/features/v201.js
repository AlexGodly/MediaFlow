/* MediaFlow v201 source fragment
 * v201 category icon sizing and persistence audit
 * Original HTML lines 41243-41449.
 * Build order matters; see scripts/build.mjs.
 */

/* ============================================================
   MediaFlow v201 — Category Icon Range + Cover Placeholder Scale
   ------------------------------------------------------------
   - Expands the global Category icon size range from 80–220% to 60–360%.
   - Adds an independent Cover placeholder icon size setting. It changes only
     category icons rendered inside title-cover placeholders/fallback cover boxes.
   - The cover scale is independent from the global category-icon scale.
   - Persistence / Cloud / Sync Now / Full Backup / Settings Preset are audited.
   ============================================================ */
const V201_BACKUP_SCHEMA_VERSION=29;
const V201_CLOUD_SYNC_VERSION=201;
const V201_GLOBAL_ICON_MIN=60;
const V201_GLOBAL_ICON_MAX=360;
const V201_COVER_ICON_MIN=40;
const V201_COVER_ICON_MAX=400;
const V201_COVER_ICON_DEFAULT=150;

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
  payload.backupManifest.note='Complete MediaFlow v201 backup. Expands global category-icon sizing and adds an independent persistent cover-placeholder category-icon scale. Preserves v200 category default missing covers, v199 status terminology, v198 Settings Presets, v197 category recovery and all prior Library, History, Logging, XP, Statistics, themes and protected cloud data.';
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
