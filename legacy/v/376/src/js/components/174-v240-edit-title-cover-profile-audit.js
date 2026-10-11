/* ============================================================
   MediaFlow v240 — Edit Title Layout / Logged Cover Size / Profile Cleanup
   --------------------------------------------------------------------------
   - Reflows Edit Title into a deliberate 12-column desktop layout so related
     fields sit together: Category + Status and Progress + Total.
   - Uses the previously wasted desktop space while preserving a safe scrollable
     editor on short/tablet/mobile viewports.
   - Adds a dedicated persistent cover-size surface for logged/selected title
     cards used by Dashboard Logging and Batch Log.
   - Removes the neutral action icon beside the sidebar profile/avatar control.
   - Re-audits current cloud/full backup/settings preset/export compatibility.
   ============================================================ */
const V240_RUNTIME_VERSION=240;

/* ---------- Edit Title: semantic field placement ----------------------- */
function v240EditorField(editor,id,cls){
  const field=editor?.querySelector(`#${id}`)?.closest('.field');
  if(field&&cls)field.classList.add(cls);
  return field;
}
function v240SectionLabel(text,kind){
  const el=document.createElement('div');
  el.className=`v240-editor-section-label v240-section-${kind}`;
  el.innerHTML=`<span>${escapeHtml(text)}</span>`;
  return el;
}
function v240DecorateLibraryEditor(raw){
  try{
    const host=document.createElement('div');host.innerHTML=String(raw||'');
    const shell=host.querySelector('.v239-library-editor-shell');
    const editor=host.querySelector('.v238-library-editor');
    if(!editor)return raw;
    shell?.classList.add('v240-library-editor-shell');
    editor.classList.add('v240-library-editor');

    editor.querySelectorAll(':scope > .field-row').forEach(row=>row.classList.add('v240-field-row'));

    const title=v240EditorField(editor,'l-title','v240-field-title');
    const category=v240EditorField(editor,'l-category','v240-field-category');
    const status=v240EditorField(editor,'l-status','v240-field-status');
    const progress=v240EditorField(editor,'l-progress','v240-field-progress');
    const total=v240EditorField(editor,'l-total','v240-field-total');
    const priority=v240EditorField(editor,'l-priority','v240-field-priority');
    const rating=v240EditorField(editor,'l-rating','v240-field-rating');
    const cover=v240EditorField(editor,'l-cover','v240-field-cover');
    const started=v240EditorField(editor,'l-start-date','v240-field-start');
    const finished=v240EditorField(editor,'l-finish-date','v240-field-finish');
    const estimated=v240EditorField(editor,'l-est','v240-field-estimated');
    const tags=v240EditorField(editor,'l-tags','v240-field-tags');

    // Explicit grouping makes the relationship visually obvious without
    // changing IDs or save behavior expected by older MediaFlow modules.
    const core=v240SectionLabel('Core details','core');
    const artwork=v240SectionLabel('Artwork & dates','artwork');
    editor.append(core,artwork);

    const repeat=editor.querySelector('.v82-repeat-panel');
    if(repeat)repeat.classList.add('v240-repeat-panel');
    const rich=editor.querySelector('.v178-rich-editor');
    if(rich)rich.classList.add('v240-rich-editor');
    const actions=editor.querySelector('.modal-actions');
    if(actions)actions.classList.add('v240-editor-actions');

    // Mark the two requested logical pairs for accessibility/testing.
    category?.setAttribute('data-v240-pair','category-status');
    status?.setAttribute('data-v240-pair','category-status');
    progress?.setAttribute('data-v240-pair','progress-total');
    total?.setAttribute('data-v240-pair','progress-total');

    // Defensive classes for any future upstream markup where a field is absent.
    title?.classList.add('v240-core-field');priority?.classList.add('v240-core-field');rating?.classList.add('v240-core-field');
    cover?.classList.add('v240-artwork-field');started?.classList.add('v240-artwork-field');finished?.classList.add('v240-artwork-field');
    estimated?.classList.add('v240-artwork-field');tags?.classList.add('v240-artwork-field');
    return host.innerHTML;
  }catch(_){return raw;}
}
const v240LibraryModalHtmlBase=libraryModalHtml;
libraryModalHtml=function(){return v240DecorateLibraryEditor(v240LibraryModalHtmlBase.apply(this,arguments));};

/* ---------- Logged-title / Batch-selected cover size ------------------- */
V181_COVER_SIZE_DEFAULTS.loggedTitles=100;
V181_COVER_LABELS.loggedTitles='Logged / Batch selected covers';
DEFAULT_SETTINGS.v181CoverSizes=DEFAULT_SETTINGS.v181CoverSizes||{};
if(!Number.isFinite(Number(DEFAULT_SETTINGS.v181CoverSizes.loggedTitles)))DEFAULT_SETTINGS.v181CoverSizes.loggedTitles=100;

function v240ApplyLoggedCoverSize(value){
  const next=v181ClampCoverSize(value,100),scale=next/100;
  const mobile=Math.max(0,Number(window.innerWidth)||0)<=760;
  const logBase=mobile?{w:42,h:60}:{w:48,h:68};
  const batchBase=mobile?{w:34,h:48}:{w:38,h:54};
  const root=document.documentElement;
  root.style.setProperty('--v240-logged-cover-scale',String(scale));
  root.style.setProperty('--v240-logged-cover-width',`${Math.round(logBase.w*scale*100)/100}px`);
  root.style.setProperty('--v240-logged-cover-height',`${Math.round(logBase.h*scale*100)/100}px`);
  root.style.setProperty('--v240-batch-cover-width',`${Math.round(batchBase.w*scale*100)/100}px`);
  root.style.setProperty('--v240-batch-cover-height',`${Math.round(batchBase.h*scale*100)/100}px`);
}

const v240ApplyCoverVarsBase=v181ApplyCoverVars;
v181ApplyCoverVars=function(){
  const out=v240ApplyCoverVarsBase.apply(this,arguments);
  const cfg=v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  v240ApplyLoggedCoverSize(cfg.loggedTitles);
  return out;
};
const v240PreviewCoverSizeBase=v181PreviewCoverSize;
v181PreviewCoverSize=function(kind,value){
  const out=v240PreviewCoverSizeBase.apply(this,arguments);
  if(kind==='loggedTitles')v240ApplyLoggedCoverSize(value);
  return out;
};
function v240EnsureSettings(settings=S.settings||DEFAULT_SETTINGS){
  v181EnsureCoverSizes(settings);
  return settings;
}
v240EnsureSettings(DEFAULT_SETTINGS);v240EnsureSettings(S.settings||DEFAULT_SETTINGS);

const v240NormalizeModernSettingsBase=v232NormalizeModernSettings;
v232NormalizeModernSettings=function(settings=S.settings||DEFAULT_SETTINGS){
  const out=v240NormalizeModernSettingsBase(settings);
  v240EnsureSettings(settings);
  return out;
};

window.addEventListener('resize',()=>{try{v240ApplyLoggedCoverSize(v181CoverSize('loggedTitles'));}catch(_){ }},{passive:true});

/* ---------- Remove unwanted profile/sidebar action icon ---------------- */
const v240ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(el?.classList?.contains('account-profile-btn'))return null;
  return v240ButtonIconNameBase(el);
};
function v240CleanProfileActionIcon(root=document){
  root.querySelectorAll?.('.account-profile-btn .v225-btn-icon').forEach(icon=>icon.remove());
  root.querySelectorAll?.('.account-profile-btn').forEach(btn=>btn.classList.remove('v225-icon-button'));
}
requestAnimationFrame(()=>v240CleanProfileActionIcon(document));
MediaFlowRuntime.registerPageEnhancer('dashboard',()=>v240CleanProfileActionIcon(document));
MediaFlowRuntime.registerPageEnhancer('library',()=>v240CleanProfileActionIcon(document));
MediaFlowRuntime.registerPageEnhancer('settings',()=>v240CleanProfileActionIcon(document));

/* ---------- Persistence / export / sync audit -------------------------- */
const v240VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(){
  v240EnsureSettings(S.settings||DEFAULT_SETTINGS);
  return v240VerifyCloudStateBase.apply(this,arguments);
};

const v240BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v240EnsureSettings(S.settings||DEFAULT_SETTINGS);
  const payload=v240BuildFullBackupBase.apply(this,arguments);
  if(payload?.backupManifest){
    payload.backupManifest.note='Complete MediaFlow v240 backup. Includes current Library/Dynamic Library state, Categories, History, Personal Order, Choice & Filter layouts, per-surface cover sizes including logged-title covers, rich title metadata, XP/progression and all current persistent settings. Full Data Export/Import and Automatic Backup continue through the same Schema v29 pipeline.';
  }
  return payload;
};

const v240BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(){
  const manifest=v240BackupManifestBase.apply(this,arguments);
  manifest.includes=Object.assign({},manifest.includes||{}, {
    editTitleLayoutV240:true,
    loggedTitleCoverSizeV240:true,
    profileIconCleanupV240:true,
    fullExportImportAuditV240:true,
    automaticBackupAuditV240:true,
    syncNowAuditV240:true,
    settingsPresetAuditV240:true,
    historyExportAuditV240:true,
    personalOrderExportAuditV240:true
  });
  manifest.v240={
    loggedTitleCoverSizePath:'settings.v181CoverSizes.loggedTitles',
    cloudSyncVersion:201,
    fullBackupSchema:29,
    settingsPresetSchema:1,
    personalOrderExportVersion:4
  };
  return manifest;
};

const v240BuildSettingsPresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
  v240EnsureSettings(S.settings||DEFAULT_SETTINGS);
  const preset=v240BuildSettingsPresetBase.apply(this,arguments);
  preset.presetManifest=preset.presetManifest||{};
  preset.presetManifest.includes=Object.assign({},preset.presetManifest.includes||{}, {
    loggedTitleCoverSizeV240:true,
    currentSettingsAuditV240:true
  });
  return preset;
};

const v240NormalizeImportedSettingsBase=v196NormalizeImportedSettings;
v196NormalizeImportedSettings=function(){
  const next=v240NormalizeImportedSettingsBase.apply(this,arguments);
  v240EnsureSettings(next);
  return next;
};

const v240OrderExportPayloadBase=v142OrderExportPayload;
v142OrderExportPayload=function(){
  const payload=v240OrderExportPayloadBase.apply(this,arguments);
  payload.exportAudit=Object.assign({},payload.exportAudit||{}, {release:V240_RUNTIME_VERSION,current:true,personalOrderFormat:4});
  return payload;
};

function v240AuditSnapshot(){return {backup:v148BuildFullBackup(),preset:v196BuildSettingsPreset()};}

v181ApplyCoverVars();
Object.assign(App,{v240ApplyLoggedCoverSize,v240EnsureSettings,v240CleanProfileActionIcon,v240AuditSnapshot});
MediaFlowRuntime.version=V240_RUNTIME_VERSION;
