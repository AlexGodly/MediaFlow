/* ============================================================
   MediaFlow v254 — Cover Overlay Controls
   ------------------------------------------------------------
   Covers / Covers+Titles only, in both Normal and Dynamic Library:
   - optional semantic status icon over the cover
   - optional category icon over the cover
   - optional rating badge when a rating exists
   - optional progress bar attached to the bottom edge of the cover
   The four visibility choices are persistent Settings and therefore travel
   through the existing Settings Preset, Full Backup and cloud settings paths.
   ============================================================ */

const V254_RUNTIME_VERSION=254;
const V254_COVER_OVERLAY_DEFAULTS={
  status:true,
  category:true,
  rating:true,
  progress:true,
  modifiedAt:0
};

function v254NormalizeCoverOverlaySettings(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  return {
    status:src.status!==false,
    category:src.category!==false,
    rating:src.rating!==false,
    progress:src.progress!==false,
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v254EnsureCoverOverlaySettings(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.v254CoverOverlays=v254NormalizeCoverOverlaySettings(settings.v254CoverOverlays);
  return settings.v254CoverOverlays;
}

function v254IsCoverLibraryView(){
  const mode=String(S.settings?.libraryView||'list');
  return mode==='covers'||mode==='covers-title';
}

function v254SetCoverOverlay(key,value){
  if(!['status','category','rating','progress'].includes(String(key)))return;
  const cfg=v254EnsureCoverOverlaySettings(S.settings||DEFAULT_SETTINGS);
  cfg[key]=!!value;
  cfg.modifiedAt=Date.now();
  persistSettings();
  render();
}

function v254ToggleCoverOverlay(key){
  const cfg=v254EnsureCoverOverlaySettings(S.settings||DEFAULT_SETTINGS);
  v254SetCoverOverlay(key,!cfg[key]);
}

function v254OverlayToggleButton(key,label,icon){
  const cfg=v254EnsureCoverOverlaySettings(S.settings||DEFAULT_SETTINGS);
  const on=!!cfg[key];
  return `<button type="button"
    class="btn btn-sm v254-cover-overlay-toggle ${on?'active':''}"
    data-v225-icon="${escapeHtml(icon)}"
    aria-pressed="${on?'true':'false'}"
    title="${on?'Hide':'Show'} ${escapeHtml(label.toLowerCase())} on Library covers"
    onclick="App.v254ToggleCoverOverlay('${escapeHtml(key)}')">
    ${escapeHtml(label)} <span class="v254-cover-overlay-state">${on?'ON':'OFF'}</span>
  </button>`;
}

function v254CoverOverlayControlsHtml(){
  if(!v254IsCoverLibraryView())return '';
  return `<div class="v254-cover-overlay-controls" aria-label="Cover information visibility">
    <div class="v254-cover-overlay-label">
      <b>On cover</b>
      <span>Choose what appears over Covers and Covers+Titles.</span>
    </div>
    <div class="v254-cover-overlay-actions">
      ${v254OverlayToggleButton('status','Status','watching')}
      ${v254OverlayToggleButton('category','Category','category')}
      ${v254OverlayToggleButton('rating','Rating','rating')}
      ${v254OverlayToggleButton('progress','Progress','progressBar')}
    </div>
  </div>`;
}

/* Semantic icons dedicated to the new toggle controls. */
Object.assign(V225_BUTTON_ICONS,{
  rating:v225IconSvg('<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>'),
  progressBar:v225IconSvg('<rect x="3" y="8" width="18" height="8" rx="4"/><path d="M7 12h7"/>')
});

const v254RenderLibraryBase=renderLibrary;
renderLibrary=function(){
  let h=v254RenderLibraryBase.apply(this,arguments);
  if(!v254IsCoverLibraryView())return h;

  const controls=v254CoverOverlayControlsHtml();
  if(!controls||h.includes('v254-cover-overlay-controls'))return h;

  const display=v181DisplaySwitchHtml();
  if(display&&h.includes(display)){
    h=h.replace(display,display+controls);
  }else if(h.includes('<div class="lib-toolbar">')){
    h=h.replace('<div class="lib-toolbar">',controls+'<div class="lib-toolbar">');
  }else{
    h=controls+h;
  }
  return h;
};

function v254StatusBadgeHtml(item){
  const status=String(item?.status||'planned');
  const label=v199StatusLabel(status);
  const icon=typeof v229StatusChoiceIcon==='function'
    ?v229StatusChoiceIcon(status)
    :(V225_BUTTON_ICONS.watching||'');
  return `<span class="v254-cover-badge v254-cover-status v254-status-${escapeHtml(status)}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">${icon}</span>`;
}

function v254CategoryBadgeHtml(item){
  const cat=getCategory(item?.categoryId);
  if(!cat)return '';
  return `<span class="v254-cover-badge v254-cover-category" title="${escapeHtml(cat.name||'Category')}" aria-label="${escapeHtml(cat.name||'Category')}">${v144CategoryIconHtml(cat)}</span>`;
}

function v254RatingBadgeHtml(item){
  const rating=Number(item?.rating);
  if(!Number.isFinite(rating)||rating<=0)return '';
  return `<span class="v254-cover-rating" title="Rating ${escapeHtml(rating.toFixed(1))}" aria-label="Rating ${escapeHtml(rating.toFixed(1))}"><span aria-hidden="true">★</span> ${escapeHtml(rating.toFixed(1))}</span>`;
}

function v254ProgressHtml(item){
  const total=Number(item?.total);
  if(!Number.isFinite(total)||total<=0)return '';
  const progress=Math.max(0,Number(item?.progress)||0);
  const pct=Math.max(0,Math.min(100,(progress/total)*100));
  const cat=getCategory(item?.categoryId);
  const color=String(cat?.color||'var(--flow)');
  return `<span class="v254-cover-progress" title="${escapeHtml(String(progress))} / ${escapeHtml(String(total))} · ${Math.round(pct)}%" aria-label="Progress ${escapeHtml(String(progress))} of ${escapeHtml(String(total))}">
    <span class="v254-cover-progress-fill" style="width:${pct.toFixed(3)}%;--v254-progress-color:${escapeHtml(color)}"></span>
  </span>`;
}

function v254OverlayHtml(item){
  const cfg=v254EnsureCoverOverlaySettings(S.settings||DEFAULT_SETTINGS);
  return `<span class="v254-cover-overlay-frame">
    ${cfg.status?v254StatusBadgeHtml(item):''}
    ${cfg.category?v254CategoryBadgeHtml(item):''}
    ${cfg.rating?v254RatingBadgeHtml(item):''}
    ${cfg.progress?v254ProgressHtml(item):''}
  </span>`;
}

function v254DecorateVisibleCovers(){
  if(String(S.view||'')!=='library'||!v254IsCoverLibraryView())return;
  const root=document.getElementById('view-root');
  if(!root)return;

  const targets=[
    ...root.querySelectorAll('.library-view-covers .item-row[data-library-id], .library-view-covers-title .item-row[data-library-id]'),
    ...root.querySelectorAll('.v181-dynamic-covers .v181-cover-tile[data-library-id], .v181-dynamic-covers-title .v181-cover-tile[data-library-id]')
  ];

  const seen=new Set();
  for(const el of targets){
    if(!el||seen.has(el))continue;
    seen.add(el);
    el.querySelector(':scope > .v254-cover-overlay-frame')?.remove();
    const id=String(el.getAttribute('data-library-id')||'');
    const item=(S.library||[]).find(row=>String(row?.id||'')===id);
    if(!item)continue;
    el.classList.add('v254-cover-overlay-host');
    el.insertAdjacentHTML('beforeend',v254OverlayHtml(item));
  }
}

/* render() owns legacy Library mounting, so run the cover decorator only after
   the fresh Library DOM has landed. */
const v254RenderBase=render;
render=function(){
  const result=v254RenderBase.apply(this,arguments);
  if(String(S.view||'')==='library'){
    setTimeout(()=>{
      try{v254DecorateVisibleCovers();}catch(err){console.error('MediaFlow v254 cover overlay render failed',err);}
      try{v226RefreshSemanticButtonIcons(document);}catch(_){ }
    },0);
  }
  return result;
};

/* ---------------- Persistence / cloud merge ---------------- */
v254EnsureCoverOverlaySettings(S.settings||DEFAULT_SETTINGS);

const v254PersistSettingsBase=persistSettings;
persistSettings=function(){
  v254EnsureCoverOverlaySettings(S.settings||DEFAULT_SETTINGS);
  return v254PersistSettingsBase.apply(this,arguments);
};

const v254LoadAllBase=loadAll;
loadAll=async function(){
  await v254LoadAllBase.apply(this,arguments);
  v254EnsureCoverOverlaySettings(S.settings||DEFAULT_SETTINGS);
};

const v254ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v254ApplyStateBase.apply(this,arguments);
  v254EnsureCoverOverlaySettings(S.settings||DEFAULT_SETTINGS);
  return result;
};

const v254MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v254MergeStatesBase.apply(this,arguments)||{};
  const ac=v254NormalizeCoverOverlaySettings(a?.settings?.v254CoverOverlays);
  const bc=v254NormalizeCoverOverlaySettings(b?.settings?.v254CoverOverlays);
  out.settings=out.settings||{};
  out.settings.v254CoverOverlays=(Number(ac.modifiedAt)||0)>=(Number(bc.modifiedAt)||0)?ac:bc;
  return out;
};

const v254BuildSettingsPresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
  v254EnsureCoverOverlaySettings(S.settings||DEFAULT_SETTINGS);
  const preset=v254BuildSettingsPresetBase.apply(this,arguments);
  preset.presetManifest=preset.presetManifest||{};
  preset.presetManifest.includes=Object.assign({},preset.presetManifest.includes||{}, {
    libraryCoverOverlayVisibility:true
  });
  return preset;
};

const v254BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v254EnsureCoverOverlaySettings(S.settings||DEFAULT_SETTINGS);
  const payload=v254BuildFullBackupBase.apply(this,arguments);
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  payload.backupManifest.includes=Object.assign({},payload.backupManifest.includes||{}, {
    libraryCoverOverlayVisibility:true
  });
  payload.backupManifest.note='Complete MediaFlow v254 backup. Adds persistent Covers/Covers+Titles overlay visibility preferences for status, category, rating and progress while preserving v253 Seasons View, History batch management, Cloud Sync v201, Full Backup Schema v29, Settings Preset Schema v1 and Personal Order Export v4.';
  return payload;
};

Object.assign(App,{
  v254ToggleCoverOverlay,
  v254SetCoverOverlay,
  v254DecorateVisibleCovers,
  v254CoverOverlayControlsHtml
});

MediaFlowRuntime.version=V254_RUNTIME_VERSION;
