/* ============================================================
   MediaFlow v233 — Dynamic Settings Section + Title Details Cover Size
   -----------------------------------------------------------------
   - Promotes the Dynamic Library controls into their own Settings section.
   - Places Dynamic Settings directly below Library Mode in the Library group.
   - Adds a semantic Dynamic Settings icon to Settings navigation.
   - Adds an independent Title Details popup cover-size setting.
   ============================================================ */

const V233_RUNTIME_VERSION=233;

/* ---------- Dynamic Settings becomes a first-class Settings section ----- */
const v233DynamicLibrarySettingsHtmlBase=v181DynamicLibrarySettingsHtml;
v181DynamicLibrarySettingsHtml=function(){
  let h=v233DynamicLibrarySettingsHtmlBase.apply(this,arguments);
  // v231 already separated Default Library Mode from this card. What remains
  // is the Dynamic category icon mode, Dynamic category row configuration and
  // Dynamic status row configuration, so give that collection its own section.
  h=h.replace(
    '<div class="section-label">LIBRARY EXPERIENCE</div>',
    '<div class="section-label">DYNAMIC SETTINGS</div>'
  );
  // These are subsections inside the Dynamic Settings card, not top-level
  // Settings sections. Keeping the generic section-label class here caused
  // v221's organizer to detach the card from its DYNAMIC SETTINGS heading.
  h=h.replace(
    '<div class="section-label" style="margin-top:15px;">DYNAMIC CATEGORY ROW</div>',
    '<div class="v233-dynamic-subsection-label" style="margin-top:15px;">DYNAMIC CATEGORY ROW</div>'
  );
  h=h.replace(
    '<div class="section-label" style="margin-top:16px;">DYNAMIC STATUS ROW</div>',
    '<div class="v233-dynamic-subsection-label" style="margin-top:16px;">DYNAMIC STATUS ROW</div>'
  );
  return h;
};

try{
  const list=V221_SETTINGS_SECTION_ORDER?.Library;
  if(Array.isArray(list)){
    const remove=new Set(['LIBRARY MODE','DYNAMIC SETTINGS','LIBRARY EXPERIENCE','CATEGORIES']);
    const rest=list.filter(label=>!remove.has(label));
    list.splice(0,list.length,'LIBRARY MODE','DYNAMIC SETTINGS','CATEGORIES',...rest);
  }
}catch(_){ }

/* Dynamic Settings owns only the Dynamic Library configuration. Library Mode
   remains independently resettable and is intentionally excluded here. */
const v233SectionResetPlanBase=v221SectionResetPlan;
v221SectionResetPlan=function(title){
  const t=String(title||'').trim().toUpperCase();
  if(t==='DYNAMIC SETTINGS')return {kind:'paths',paths:[
    'v181Library.categoryOrder',
    'v181Library.hiddenCategoryIds',
    'v181Library.statusOrder',
    'v181Library.activeCategoryId',
    'v181Library.activeStatus',
    'v181Library.dynamicCategoryIcons',
    'v181Library.dynamicCategoryOrderMode'
  ]};
  return v233SectionResetPlanBase(title);
};

/* ---------- Semantic sidebar icon for Dynamic Settings ----------------- */
Object.assign(V225_BUTTON_ICONS,{
  dynamicSettings:v225IconSvg('<path d="M20 7h-5V2"/><path d="M20 7a8 8 0 0 0-13.7-2.6L4 7"/><path d="M4 17h5v5"/><path d="M4 17a8 8 0 0 0 13.7 2.6L20 17"/><path d="M9 12h6"/><path d="M12 9v6"/>')
});
const v233ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  const t=v225CleanActionText(el);
  if(el?.classList?.contains('v221-settings-nav-item')&&t==='dynamic settings')return 'dynamicSettings';
  return v233ButtonIconNameBase(el);
};

/* ---------- Title Details cover becomes a first-class cover surface ----- */
V181_COVER_SIZE_DEFAULTS.titleDetails=100;
V181_COVER_LABELS.titleDetails='Title Details popup cover';
DEFAULT_SETTINGS.v181CoverSizes=DEFAULT_SETTINGS.v181CoverSizes||{};
if(!Number.isFinite(Number(DEFAULT_SETTINGS.v181CoverSizes.titleDetails))){
  DEFAULT_SETTINGS.v181CoverSizes.titleDetails=100;
}

function v233ApplyTitleDetailsCoverVar(value){
  const next=v181ClampCoverSize(value,100);
  const scale=next/100;
  const viewport=Math.max(0,Number(window.innerWidth)||0);
  const base=viewport>=900?{w:92,h:130}:(viewport>520?{w:112,h:158}:{w:76,h:108});
  const root=document.documentElement;
  root.style.setProperty('--v233-cover-title-details',String(scale));
  root.style.setProperty('--v233-cover-title-details-width',`${Math.round(base.w*scale*100)/100}px`);
  root.style.setProperty('--v233-cover-title-details-height',`${Math.round(base.h*scale*100)/100}px`);
}

const v233ApplyCoverVarsBase=v181ApplyCoverVars;
v181ApplyCoverVars=function(){
  const out=v233ApplyCoverVarsBase.apply(this,arguments);
  const cfg=v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  v233ApplyTitleDetailsCoverVar(cfg.titleDetails);
  return out;
};

const v233PreviewCoverSizeBase=v181PreviewCoverSize;
v181PreviewCoverSize=function(kind,value){
  const out=v233PreviewCoverSizeBase.apply(this,arguments);
  if(kind==='titleDetails')v233ApplyTitleDetailsCoverVar(value);
  return out;
};

/* Make cloud/load/import normalization immediately aware of the new nested
   cover value. Existing v181/v232 pipelines already serialize the complete
   settings object and normalize v181CoverSizes, so no schema bump is needed. */
function v233EnsureSettings(settings=S.settings||DEFAULT_SETTINGS){
  return v181EnsureCoverSizes(settings);
}
v233EnsureSettings(DEFAULT_SETTINGS);
v233EnsureSettings(S.settings||DEFAULT_SETTINGS);

const v233NormalizeModernSettingsBase=v232NormalizeModernSettings;
v232NormalizeModernSettings=function(settings=S.settings||DEFAULT_SETTINGS){
  const out=v233NormalizeModernSettingsBase(settings);
  v233EnsureSettings(settings);
  return out;
};

/* Explicit backup/preset audit metadata for the new cover surface. */
const v233BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v233BackupManifestBase.apply(this,arguments);
  manifest.includes=Object.assign({},manifest.includes||{}, {
    dynamicSettingsSectionV233:true,
    titleDetailsCoverSizeV233:true
  });
  manifest.v233={
    dynamicSettingsPath:'settings.v181Library',
    titleDetailsCoverSizePath:'settings.v181CoverSizes.titleDetails'
  };
  return manifest;
};

const v233BuildSettingsPresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
  v233EnsureSettings(S.settings||DEFAULT_SETTINGS);
  const preset=v233BuildSettingsPresetBase.apply(this,arguments);
  preset.presetManifest=preset.presetManifest||{};
  preset.presetManifest.includes=Object.assign({},preset.presetManifest.includes||{}, {
    dynamicSettingsSectionV233:true,
    titleDetailsCoverSizeV233:true
  });
  return preset;
};

/* Refresh CSS and any already-mounted Settings navigation after startup. */
v181ApplyCoverVars();
window.addEventListener('resize',()=>{
  try{v233ApplyTitleDetailsCoverVar(v181CoverSize('titleDetails'));}catch(_){ }
},{passive:true});
requestAnimationFrame(()=>{
  try{v226RefreshSemanticButtonIcons(document);}catch(_){ }
  try{v231ScheduleSettingsActiveNav(true);}catch(_){ }
});

Object.assign(App,{v233ApplyTitleDetailsCoverVar,v233EnsureSettings});
MediaFlowRuntime.version=V233_RUNTIME_VERSION;
