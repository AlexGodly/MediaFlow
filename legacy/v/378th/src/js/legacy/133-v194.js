/* ============================================================
   MediaFlow v194
   - Global category icon clarity / adjustable size
   - Persistent Category icon size setting (80%–220%, default 150%)
   - Statistics Completion Timeline now renders URL category icons
   ============================================================ */
const V194_BACKUP_SCHEMA_VERSION=27;
const V194_CLOUD_SYNC_VERSION=194;
const V194_CATEGORY_ICON_DEFAULT={scale:150,modifiedAt:0};

function v194ClampCategoryIconScale(value){
  const n=Math.round(Number(value));
  return Number.isFinite(n)?Math.max(80,Math.min(220,n)):150;
}
function v194NormalizeCategoryIconSettings(raw){
  const src=raw&&typeof raw==='object'?raw:{};
  return {
    scale:v194ClampCategoryIconScale(src.scale),
    modifiedAt:Number(src.modifiedAt)||0
  };
}
function v194EnsureCategoryIconSettings(settings){
  const target=settings&&typeof settings==='object'?settings:(S.settings=S.settings||{});
  target.v194CategoryIcons=v194NormalizeCategoryIconSettings(target.v194CategoryIcons);
  return target.v194CategoryIcons;
}
function v194ApplyCategoryIconScale(value){
  const cfg=v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  const scale=v194ClampCategoryIconScale(value==null?cfg.scale:value);
  document.documentElement.style.setProperty('--v194-category-icon-scale',String(scale/100));
  return scale;
}
function v194PreviewCategoryIconScale(value){
  const scale=v194ApplyCategoryIconScale(value);
  const label=document.getElementById('v194-category-icon-size-value');
  if(label)label.textContent=`${scale}%`;
  const number=document.getElementById('v194-category-icon-size-number');
  if(number&&document.activeElement!==number)number.value=scale;
}
function v194SetCategoryIconScale(value){
  const cfg=v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  cfg.scale=v194ClampCategoryIconScale(value);
  cfg.modifiedAt=Date.now();
  v194ApplyCategoryIconScale(cfg.scale);
  persistSettings();
  render();
}
function v194CategoryIconSettingsHtml(){
  const cfg=v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  return `<div class="section-label">CATEGORY ICONS</div>
    <div class="card v194-category-icon-settings-card" style="margin-bottom:22px">
      <div class="v194-category-icon-settings-head">
        <div><b>Category icon size</b><div class="hint">Adjust category icons globally across MediaFlow. URL icons and emoji icons use the same scale while keeping larger icon containers proportionally larger.</div></div>
        <div class="v194-category-icon-preview"><span>${v144CategoryIconHtml(S.categories?.[0]||{icon:'📚'})}</span><strong id="v194-category-icon-size-value">${cfg.scale}%</strong></div>
      </div>
      <div class="v194-category-icon-controls">
        <input type="range" min="80" max="220" step="5" value="${cfg.scale}" aria-label="Category icon size" oninput="App.v194PreviewCategoryIconScale(this.value)" onchange="App.v194SetCategoryIconScale(this.value)">
        <input id="v194-category-icon-size-number" type="number" min="80" max="220" step="5" value="${cfg.scale}" aria-label="Category icon size percent" onchange="App.v194SetCategoryIconScale(this.value)">
        <button type="button" class="btn btn-sm btn-ghost" onclick="App.v194SetCategoryIconScale(150)">Reset 150%</button>
      </div>
      <div class="hint" style="margin-top:9px">Default: 150%. Range: 80%–220%. This changes presentation only — category data and icon URLs are untouched.</div>
    </div>`;
}
Object.assign(App,{v194PreviewCategoryIconScale,v194SetCategoryIconScale});

/* Keep the selected size active on every render, including after settings reset. */
const v194RenderBase=render;
render=function(){
  v194ApplyCategoryIconScale();
  return v194RenderBase.apply(this,arguments);
};

/* Settings: place the global icon-size control directly after Categories and
   make the main category-management icon honor URL icons too. */
const v194RenderSettingsBase=renderSettings;
renderSettings=function(){
  v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  let h=v194RenderSettingsBase.apply(this,arguments);
  const marker='<div class="two-col" style="align-items:start;">';
  if(h.includes(marker))h=h.replace(marker,v194CategoryIconSettingsHtml()+marker);
  else h+=v194CategoryIconSettingsHtml();

  try{
    const host=document.createElement('div');
    host.innerHTML=h;
    host.querySelectorAll('.cat-manage-row[data-category-id]').forEach(row=>{
      const cat=(S.categories||[]).find(c=>String(c?.id||'')===String(row.dataset.categoryId||''));
      const icon=row.querySelector('.hero-icon');
      if(cat&&icon)icon.innerHTML=v144CategoryIconHtml(cat);
    });
    h=host.innerHTML;
  }catch(_){ }
  return h;
};

/* Statistics → Completion Timeline: use the shared category icon renderer so
   URL-based icons render as their image instead of the legacy emoji fallback. */
renderCompletionTimeline=function(){
  const map=new Map();
  for(const x of(S.completionTimeline||[])){if(x?.completedAt)map.set(x.libraryId||(`${x.title}::${x.completedAt}`),x);}
  for(const i of S.library){if(i?.status==='completed'&&i.completedAt&&!map.has(i.id))map.set(i.id,{libraryId:i.id,title:i.title,categoryId:i.categoryId,completedAt:i.completedAt});}
  const arr=[...map.values()].sort((a,b)=>Number(b.completedAt)-Number(a.completedAt));
  if(!arr.length)return '<div class="empty-state">No completed titles yet.</div>';
  const size=25,max=Math.max(0,Math.ceil(arr.length/size)-1);
  S.timelinePage=clamp(Number(S.timelinePage)||0,0,max);
  const page=arr.slice(S.timelinePage*size,S.timelinePage*size+size);
  const rows=`<div class="completion-timeline">${page.map(x=>{
    const c=getCategory(x.categoryId),item=v50FindLibraryItem(x.libraryId,x.title);
    return `<div class="timeline-item"><div class="timeline-dot" style="background:${c?.color||'var(--flow)'}"></div><div class="v50-timeline-row">${v50Cover(item)}<div class="v50-timeline-copy"><div class="timeline-date">${new Date(Number(x.completedAt)).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}</div><div class="timeline-title">${escapeHtml(cleanTitle(x.title))}</div><div class="timeline-cat">${v144CategoryIconHtml(c||{icon:'•'})} ${escapeHtml(c?.name||'Unknown')}</div></div></div></div>`;
  }).join('')}</div>`;
  if(max===0)return rows;
  return rows+`<div class="v44-timeline-pager"><button class="btn btn-sm" ${S.timelinePage<=0?'disabled':''} onclick="App.setTimelinePage(${S.timelinePage-1})">← Prev</button><span class="hint">Page ${S.timelinePage+1} of ${max+1} · ${arr.length} completed titles</span><button class="btn btn-sm" ${S.timelinePage>=max?'disabled':''} onclick="App.setTimelinePage(${S.timelinePage+1})">Next →</button></div>`;
};

/* Persistence / cloud / backup for the new global presentation preference. */
DEFAULT_SETTINGS.v194CategoryIcons=v194NormalizeCategoryIconSettings(DEFAULT_SETTINGS.v194CategoryIcons);
v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
v194ApplyCategoryIconScale();

const v194PersistSettingsBase=persistSettings;
persistSettings=function(){
  v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  return v194PersistSettingsBase.apply(this,arguments);
};
const v194LoadAllBase=loadAll;
loadAll=async function(){
  await v194LoadAllBase.apply(this,arguments);
  v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  v194ApplyCategoryIconScale();
};
const v194ApplyStateBase=v46ApplyState;
v46ApplyState=function(){
  const result=v194ApplyStateBase.apply(this,arguments);
  v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  v194ApplyCategoryIconScale();
  return result;
};
const v194SnapshotBase=snapshot;
snapshot=function(){
  v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  const out=v194SnapshotBase.apply(this,arguments)||{};
  out.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  out.cloudSyncVersion=Math.max(Number(out.cloudSyncVersion)||0,V194_CLOUD_SYNC_VERSION);
  return out;
};
const v194MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v194MergeStatesBase.apply(this,arguments)||{};
  out.settings=out.settings||{};
  const av=v194NormalizeCategoryIconSettings(a?.settings?.v194CategoryIcons);
  const bv=v194NormalizeCategoryIconSettings(b?.settings?.v194CategoryIcons);
  out.settings.v194CategoryIcons=(Number(av.modifiedAt)||0)>=(Number(bv.modifiedAt)||0)?av:bv;
  out.cloudSyncVersion=Math.max(Number(a?.cloudSyncVersion)||0,Number(b?.cloudSyncVersion)||0,Number(out.cloudSyncVersion)||0,V194_CLOUD_SYNC_VERSION);
  return out;
};
const v194VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v194VerifyCloudStateBase.apply(this,arguments);
  const problems=[...(base?.missing||[])];
  const cloudCfg=v194NormalizeCategoryIconSettings(cloudState?.settings?.v194CategoryIcons);
  const wantedCfg=v194NormalizeCategoryIconSettings(expected?.settings?.v194CategoryIcons);
  if(JSON.stringify(cloudCfg)!==JSON.stringify(wantedCfg))problems.push('v194 category icon size');
  if(Number(cloudState?.cloudSyncVersion||0)<V194_CLOUD_SYNC_VERSION)problems.push('v194 cloud state version');
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};
const v194BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  const payload=v194BuildFullBackupBase.apply(this,arguments);
  payload.backupSchemaVersion=V194_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  payload.backupManifest.schemaVersion=V194_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v194 backup. Adds a persistent global Category icon size setting and Completion Timeline support for URL-based category icons. Preserves v193 Dashboard Stopwatch visibility, v192 Missing Covers, v191 Clean Covers/deletion recovery, v189 Last Seen, v188 Library Overview/title size, v186 Control Center and all prior Library, History, Logging, Respect XP, Statistics, themes and protected cloud data.';
  return payload;
};
const v194BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v194BackupManifestBase.apply(this,arguments);
  const cfg=v194NormalizeCategoryIconSettings(state?.settings?.v194CategoryIcons);
  manifest.schemaVersion=V194_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{}, {
    adjustableGlobalCategoryIconSize:true,
    completionTimelineCategoryIconUrls:true,
    v194CloudSyncAudit:true
  });
  manifest.v194={
    cloudSyncVersion:V194_CLOUD_SYNC_VERSION,
    backupSchemaVersion:V194_BACKUP_SCHEMA_VERSION,
    categoryIconScale:cfg.scale,
    completionTimelineUrlIcons:true
  };
  return manifest;
};


