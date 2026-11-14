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

