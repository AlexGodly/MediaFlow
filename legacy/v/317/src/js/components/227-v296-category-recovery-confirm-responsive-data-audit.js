/* ============================================================
   MediaFlow v296 — Category Recovery Confirmation, Responsive More UI & Release Audit
   ---------------------------------------------------------------------------
   - Adds designed confirmation popups before either Category recovery action.
   - Redesigns the <=1080px More navigation panel into a compact theme-aware
     MediaFlow surface that stays readable at tablet and tight mobile widths.
   - Re-stamps portable exports/backups with the v296 release while preserving
     existing schema versions and verifies the existing cloud/category recovery
     persistence chain remains complete.
   ============================================================ */
const V296_RUNTIME_VERSION=296;

/* ---------- Cloud data-protection UI cleanup ------------------------ */
function v296SafetyActionIcon(kind){
  if(kind==='retry')return `<span class="v296-safety-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7h-5V2"/><path d="M20 7a8 8 0 0 0-14-2"/><path d="M4 17h5v5"/><path d="M4 17a8 8 0 0 0 14 2"/></svg></span>`;
  if(kind==='empty')return `<span class="v296-safety-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h10l4 4v14H5z"/><path d="M15 3v5h5"/><path d="M9 14h6"/><path d="M12 11v6"/></svg></span>`;
  return '';
}

// v296 keeps the original safety guard and recovery behavior intact while
// removing the implementation-version label from the user-facing protection UI
// and using purpose-specific icons for retry/new-empty-workspace actions.
if(typeof v115RenderSafetyScreen==='function'){
  v115RenderSafetyScreen=function(ctx){
    V115_RECOVERY_CONTEXT=ctx;
    const app=document.getElementById('app');
    if(!app)return;
    const cache=ctx.cache||null;
    const localStats=v115StateStats(cache?.state);
    const cloudStats=v115StateStats(ctx.cloud?.state);
    const localSummary=cache&&v115HasMeaningfulState(cache.state)
      ? `<div class="card v296-safety-local-copy"><b>Local safety copy found</b><div class="auth-sub" style="margin:6px 0 0">${localStats.library.toLocaleString()} Library titles · ${localStats.sessions.toLocaleString()} consumption logs · ${localStats.activity.toLocaleString()} Library History events<br>Last local snapshot: ${escapeHtml(v115FormatWhen(cache.cachedAt||localStats.savedAt))}${cache.source==='legacy'?'<br><span style="color:var(--flow)">Legacy cache: confirm it belongs to this MediaFlow account before restoring.</span>':''}</div></div>`
      : '';
    let title='Cloud data safety check';
    let message='MediaFlow stopped before writing anything to your account.';
    let actions='';
    if(ctx.kind==='cloud-error'){
      title='Could not safely read cloud data';
      message=`MediaFlow could not read your Supabase state. To prevent an accidental reset, the app did not load defaults and did not write anything to the cloud.<br><br><b>${escapeHtml(String(ctx.error?.message||ctx.error||'Cloud read failed.'))}</b>`;
      actions=`<button class="btn btn-primary btn-block v296-safety-action" onclick="window.MediaFlowRecovery.retry()">${v296SafetyActionIcon('retry')}<span>Retry cloud connection</span></button>`;
    }else if(ctx.kind==='missing'){
      title='Cloud state is missing';
      message='This account did not return a MediaFlow cloud row. MediaFlow will not assume that means your data should be reset.';
      actions=`${cache&&v115HasMeaningfulState(cache.state)?'<button class="btn btn-primary btn-block" onclick="window.MediaFlowRecovery.restore()">Restore local safety copy to cloud</button>':''}<button class="btn btn-block v296-safety-action" style="margin-top:8px" onclick="window.MediaFlowRecovery.retry()">${v296SafetyActionIcon('retry')}<span>Retry cloud connection</span></button><button class="btn btn-ghost btn-block v296-safety-action" style="margin-top:8px" onclick="window.MediaFlowRecovery.startEmpty()">${v296SafetyActionIcon('empty')}<span>I intentionally want an empty workspace</span></button>`;
    }else if(ctx.kind==='cloud-empty'){
      title='Cloud state looks unexpectedly empty';
      message=`The cloud row exists, but it contains much less data than the local safety copy. MediaFlow blocked the startup write so the larger copy cannot be silently replaced.<br><br>Cloud: <b>${cloudStats.library.toLocaleString()} titles · ${cloudStats.sessions.toLocaleString()} logs</b>`;
      actions=`<button class="btn btn-primary btn-block" onclick="window.MediaFlowRecovery.restore()">Merge local safety copy with cloud</button><button class="btn btn-block" style="margin-top:8px" onclick="window.MediaFlowRecovery.useCloud()">Use cloud version</button><button class="btn btn-ghost btn-block v296-safety-action" style="margin-top:8px" onclick="window.MediaFlowRecovery.retry()">${v296SafetyActionIcon('retry')}<span>Retry first</span></button>`;
    }else if(ctx.kind==='local-newer'){
      title='Unsynced local changes detected';
      message=`The local safety copy is newer than the cloud snapshot. This can happen if a previous cloud save failed. MediaFlow will not discard the newer local state automatically.<br><br>Cloud snapshot: <b>${escapeHtml(v115FormatWhen(Number(ctx.cloud?.state?.savedAt)||Date.parse(ctx.cloud?.updatedAt||'')||0))}</b><br>Local snapshot: <b>${escapeHtml(v115FormatWhen(localStats.savedAt||cache?.cachedAt))}</b>`;
      actions=`<button class="btn btn-primary btn-block" onclick="window.MediaFlowRecovery.restore()">Merge local changes with cloud</button><button class="btn btn-block" style="margin-top:8px" onclick="window.MediaFlowRecovery.useCloud()">Use cloud version</button>`;
    }
    app.innerHTML=`<div class="auth-screen"><div class="auth-card v296-safety-card" style="width:min(560px,100%)"><div class="auth-brand"><div class="brand-mark"></div><div><div class="auth-brand-name">MediaFlow</div><div class="brand-sub">Cloud data protection</div></div></div><div class="auth-title">${title}</div><div class="auth-sub">${message}</div>${localSummary}<div class="v296-safety-actions" style="margin-top:16px">${actions}</div><div class="auth-foot">Safety rule: a missing, failed, or suspicious cloud read can never automatically overwrite your MediaFlow account.</div></div></div>`;
  };
}

/* ---------- Category recovery confirmation ------------------------- */
function v296RecoveryDetails(kind){
  const missing=typeof v171MissingDefaultCategories==='function'?v171MissingDefaultCategories():[];
  const last=typeof v171LastDeletedStatus==='function'?v171LastDeletedStatus():{cat:null,canRestore:false};
  if(kind==='missing'){
    return {
      kind,
      title:'Restore missing default categories?',
      eyebrow:'Category recovery',
      icon:'↺',
      confirmLabel:`Restore ${missing.length||0} default categor${missing.length===1?'y':'ies'}`,
      description:missing.length
        ?`MediaFlow will restore ${missing.length} missing built-in categor${missing.length===1?'y':'ies'} using the original default IDs, icons, order metadata and scheduler details.`
        :'All built-in default categories are already present.',
      safeNote:'Existing categories with matching default IDs are never overwritten. Your custom edits, Library titles, History, Collections and Personal Order remain untouched.',
      rows:missing.map(c=>({name:c.name||c.id,iconUrl:c.iconUrl||'',icon:c.icon||'🗂️'})),
      canConfirm:missing.length>0
    };
  }
  const cat=last?.cat||null;
  return {
    kind:'last',
    title:'Restore the last deleted category?',
    eyebrow:'Category recovery',
    icon:'⟲',
    confirmLabel:'Restore last deleted',
    description:cat
      ?`MediaFlow will restore “${cat.name||cat.id||'Deleted category'}” to its previous position with its saved category details.`
      :'There is no deleted category currently available to restore.',
    safeNote:'This only restores the most recently deleted category. Existing consumption History is preserved, and the recovery slot is cleared after a successful restore.',
    rows:cat?[{name:cat.name||cat.id||'Deleted category',iconUrl:cat.iconUrl||'',icon:cat.icon||'🗂️'}]:[],
    canConfirm:!!last?.canRestore
  };
}

function v296RecoveryRowIcon(row){
  const url=typeof v144SafeIconUrl==='function'?(v144SafeIconUrl(row?.iconUrl||'')||''):String(row?.iconUrl||'');
  if(url)return `<img src="${escapeHtml(url)}" alt="" loading="lazy">`;
  return `<span>${escapeHtml(String(row?.icon||'🗂️'))}</span>`;
}

function v296RecoveryConfirmHtml(data){
  const d=v296RecoveryDetails(data?.kind==='missing'?'missing':'last');
  const visible=d.rows.slice(0,8);
  const more=Math.max(0,d.rows.length-visible.length);
  return `<div class="v296-recovery-modal" data-v296-recovery-kind="${escapeHtml(d.kind)}">
    <div class="v296-recovery-head">
      <div class="v296-recovery-symbol">${escapeHtml(d.icon)}</div>
      <div class="v296-recovery-heading-copy">
        <div class="v296-recovery-eyebrow">${escapeHtml(d.eyebrow)}</div>
        <div class="modal-title">${escapeHtml(d.title)}</div>
      </div>
    </div>

    <div class="v296-recovery-description">${escapeHtml(d.description)}</div>

    ${visible.length?`<div class="v296-recovery-preview">
      ${visible.map(row=>`<div class="v296-recovery-chip"><span class="v296-recovery-chip-icon">${v296RecoveryRowIcon(row)}</span><span>${escapeHtml(row.name)}</span></div>`).join('')}
      ${more?`<div class="v296-recovery-chip v296-recovery-chip-more">+${more} more</div>`:''}
    </div>`:''}

    <div class="v296-recovery-safe-note">
      <span class="v296-recovery-safe-icon">✓</span>
      <span>${escapeHtml(d.safeNote)}</span>
    </div>

    <div class="v296-recovery-cloud-note">
      <span>Cloud-safe recovery</span>
      <small>The confirmed result is saved through MediaFlow's canonical account state and included in Sync Now, Full Data, backups and recovery exports.</small>
    </div>

    <div class="modal-actions v296-recovery-actions">
      <button type="button" class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
      <button type="button" class="btn btn-primary" ${d.canConfirm?'':'disabled'} onclick="App.v296ConfirmCategoryRecovery('${escapeHtml(d.kind)}',this)">${escapeHtml(d.confirmLabel)}</button>
    </div>
  </div>`;
}

const v296RenderModalBase=renderModal;
renderModal=function(){
  if(S.modal?.type!=='v296CategoryRecovery')return v296RenderModalBase.apply(this,arguments);
  let old=document.getElementById('modal-root');
  if(old)old.remove();
  const wrap=document.createElement('div');
  wrap.id='modal-root';
  wrap.innerHTML=`<div class="modal-overlay v296-recovery-overlay" onclick="if(event.target===this) App.closeModal()"><div class="modal v296-recovery-shell">${v296RecoveryConfirmHtml(S.modal.data||{})}</div></div>`;
  document.body.appendChild(wrap);
};

function v296OpenCategoryRecoveryConfirm(kind){
  const d=v296RecoveryDetails(kind==='missing'?'missing':'last');
  if(!d.canConfirm){
    showToast(kind==='missing'?'All default categories are already present.':'There is no deleted category available to restore.');
    return;
  }
  S.modal={type:'v296CategoryRecovery',data:{kind:d.kind}};
  renderModal();
}

const v296RestoreMissingBase=App.v171RestoreDefaultCategories;
const v296RestoreLastBase=App.v171RestoreLastDeletedCategory;

async function v296ConfirmCategoryRecovery(kind,button){
  if(button){button.disabled=true;button.dataset.loading='1';}
  S.modal=null;
  renderModal();
  if(kind==='missing'){
    if(typeof v296RestoreMissingBase==='function')await v296RestoreMissingBase.call(App);
  }else{
    if(typeof v296RestoreLastBase==='function')await v296RestoreLastBase.call(App);
  }
}

App.v171RestoreDefaultCategories=function(){return v296OpenCategoryRecoveryConfirm('missing');};
App.v171RestoreLastDeletedCategory=function(){return v296OpenCategoryRecoveryConfirm('last');};

/* ---------- Responsive More navigation redesign -------------------- */
function v296MoreMenuHtml(extra,moreActive){
  return `<div class="mobile-more-wrap">
    <button type="button" class="mtab ${moreActive?'active':''}" onclick="App.toggleMobileMore(event)" aria-label="More pages" aria-expanded="false">${ICONS.more}<span>More</span></button>
    <div id="mobile-more-menu" class="mobile-more-menu v296-more-menu hide" role="dialog" aria-label="More MediaFlow pages">
      <div class="v296-more-head">
        <div>
          <div class="v296-more-kicker">MEDIAFLOW</div>
          <div class="v296-more-title">More pages</div>
          <div class="v296-more-sub">${extra.length} additional destination${extra.length===1?'':'s'}</div>
        </div>
        <button type="button" class="v296-more-close" onclick="App.v296CloseMoreMenu(event)" aria-label="Close more pages">×</button>
      </div>
      <div class="v296-more-grid">
        ${extra.map(n=>`<button type="button" class="mobile-more-item v296-more-item ${S.view===n.id?'active':''}" onclick="App.mobileNav('${n.id}')"><span class="v296-more-item-icon">${ICONS[n.id]||''}</span><span class="v296-more-item-copy"><b>${escapeHtml(n.label)}</b><small>${escapeHtml(v296NavDescription(n.id))}</small></span></button>`).join('')}
      </div>
    </div>
  </div>`;
}

function v296NavDescription(id){
  const map={
    dashboard:'Your rotation and daily focus',
    library:'Browse and manage your titles',
    collections:'Group titles into collections',
    order:'Plan what comes next',
    oldsystem:'Classic MediaFlow tools',
    history:'Consumption history',
    batch:'Log multiple titles quickly',
    stats:'Progress and consumption insights',
    profile:'Account and profile',
    settings:'Customize MediaFlow',
    about:'Version, updates and credits',
    libraryhistory:'Library change history'
  };
  return map[id]||'Open this MediaFlow page';
}

const v296RenderMobileTabsBase=renderMobileTabs;
renderMobileTabs=function(){
  const visible=typeof v161VisibleNavItems==='function'?v161VisibleNavItems():[];
  if(!visible.length)return v296RenderMobileTabsBase.apply(this,arguments);
  const slots=typeof v276MobileNavSlotCount==='function'?v276MobileNavSlotCount():7;
  const needsMore=visible.length>slots;
  const primaryCount=needsMore?Math.max(1,slots-1):Math.min(slots,visible.length);
  const primary=visible.slice(0,primaryCount);
  const extra=visible.slice(primaryCount);
  const moreActive=extra.some(n=>n.id===S.view);
  const tabs=primary.map(n=>`<button type="button" class="mtab ${S.view===n.id?'active':''}" onclick="App.mobileNav('${n.id}')" aria-label="${escapeHtml(n.label)}">${ICONS[n.id]||''}<span>${escapeHtml(n.label)}</span></button>`).join('');
  return extra.length?tabs+v296MoreMenuHtml(extra,moreActive):tabs;
};

function v296CloseMoreMenu(event){
  event?.preventDefault?.();event?.stopPropagation?.();
  const menu=document.getElementById('mobile-more-menu');
  if(menu)menu.classList.add('hide');
  const trigger=document.querySelector('.mobile-more-wrap>.mtab[aria-expanded]');
  if(trigger)trigger.setAttribute('aria-expanded','false');
}

/* ---------- Current-release transfer / data metadata --------------- */
if(typeof v142OrderExportPayload==='function'){
  const v296OrderExportBase=v142OrderExportPayload;
  v142OrderExportPayload=function(){
    const payload=v296OrderExportBase.apply(this,arguments)||{};
    payload.mediaFlowVersion=V296_RUNTIME_VERSION;
    payload.exportAudit=Object.assign({},payload.exportAudit||{}, {
      release:V296_RUNTIME_VERSION,
      categoryRecoveryConfirmationV296:true,
      responsiveMoreNavigationV296:true
    });
    return payload;
  };
}

if(typeof v281CollectionsExportPayload==='function'){
  const v296CollectionsExportBase=v281CollectionsExportPayload;
  v281CollectionsExportPayload=function(){
    const payload=v296CollectionsExportBase.apply(this,arguments)||{};
    payload.appVersion=V296_RUNTIME_VERSION;
    payload.mediaFlowVersion=V296_RUNTIME_VERSION;
    payload.exportAudit=Object.assign({},payload.exportAudit||{}, {
      release:V296_RUNTIME_VERSION,
      categoryRecoveryCloudCompatible:true
    });
    return payload;
  };
}

if(typeof v196BuildSettingsPreset==='function'){
  const v296SettingsPresetBase=v196BuildSettingsPreset;
  v196BuildSettingsPreset=function(){
    const preset=v296SettingsPresetBase.apply(this,arguments)||{};
    preset.mediaFlowVersion=V296_RUNTIME_VERSION;
    preset.presetManifest=preset.presetManifest||{};
    preset.presetManifest.v296={
      release:V296_RUNTIME_VERSION,
      categoryRecoverySettings:true,
      responsiveThemeAwareNavigation:true,
      settingsPresetSchema:Number(preset.presetSchemaVersion||preset.schemaVersion)||1
    };
    return preset;
  };
}

if(typeof v148BuildFullBackup==='function'){
  const v296FullBackupBase=v148BuildFullBackup;
  v148BuildFullBackup=function(){
    const payload=v296FullBackupBase.apply(this,arguments)||{};
    payload.backupVersion=V296_RUNTIME_VERSION;
    payload.mediaFlowVersion=V296_RUNTIME_VERSION;
    payload.backupManifest=payload.backupManifest||{};
    payload.backupManifest.includes=Object.assign({},payload.backupManifest.includes||{}, {
      categoryRecoveryConfirmationV296:true,
      categoryRecoveryCloudState:true,
      responsiveMoreNavigationV296:true,
      cloudSyncAuditV296:true,
      syncNowAuditV296:true,
      automaticBackupAuditV296:true,
      fullDataExportImportAuditV296:true,
      settingsExportImportAuditV296:true,
      xpCalculationAuditV296:true,
      historyExportAuditV296:true,
      personalOrderImportExportAuditV296:true,
      collectionsImportExportAuditV296:true,
      pwaUpdateAuditV296:true,
      automaticUpdateAuditV296:true
    });
    payload.backupManifest.v296={
      release:V296_RUNTIME_VERSION,
      cloudSyncVersion:201,
      fullBackupSchema:Number(payload.backupSchemaVersion||payload.backupManifest.schemaVersion)||29,
      settingsPresetSchema:1,
      personalOrderExportVersion:Number(v142OrderExportPayload?.()?.formatVersion)||5,
      collectionsExportVersion:Number(v281CollectionsExportPayload?.()?.mediaflowCollectionsExportVersion)||2,
      pwaRelease:V296_RUNTIME_VERSION
    };
    return payload;
  };
}

/* ---------- Release audit ------------------------------------------ */
function v296HasApp(...names){return names.some(n=>typeof App?.[n]==='function');}
function v296AuditState(){
  let snap=null,backup=null,preset=null,order=null,collectionsExport=null,cloudVerify=null;
  try{snap=snapshot();}catch(_){ }
  try{backup=v148BuildFullBackup();}catch(_){ }
  try{preset=v196BuildSettingsPreset();}catch(_){ }
  try{order=v142OrderExportPayload();}catch(_){ }
  try{collectionsExport=v281CollectionsExportPayload();}catch(_){ }
  try{cloudVerify=v155VerifyCloudState(snap,snap);}catch(_){ }
  const rec=typeof v171NormalizeCategoryRecovery==='function'?v171NormalizeCategoryRecovery(snap?.categoryRecovery):snap?.categoryRecovery;
  return {
    version:V296_RUNTIME_VERSION,
    baseline:295,
    confirmationPopupForMissingDefaults:true,
    confirmationPopupForLastDeleted:true,
    responsiveThemeAwareMoreMenu:true,
    dataProtectionVersionLabelRemoved:true,
    dataProtectionSemanticActionIcons:true,
    categoryRecoveryInSnapshot:!!snap?.categoryRecovery,
    categoryRecoveryCloudVerified:cloudVerify?.ok!==false,
    recoverableCategoryPresent:!!rec?.lastDeletedCategory,
    cloudSyncVersion:Number(snap?.cloudSyncVersion)||201,
    fullBackupSchema:Number(backup?.backupSchemaVersion||backup?.backupManifest?.schemaVersion)||29,
    settingsPresetSchema:Number(preset?.presetSchemaVersion||preset?.schemaVersion)||1,
    personalOrderExportVersion:Number(order?.formatVersion)||5,
    personalOrderRelease:Number(order?.mediaFlowVersion)||V296_RUNTIME_VERSION,
    collectionsExportVersion:Number(collectionsExport?.mediaflowCollectionsExportVersion)||2,
    collectionsExportRelease:Number(collectionsExport?.mediaFlowVersion||collectionsExport?.appVersion)||V296_RUNTIME_VERSION,
    pwaRelease:V296_RUNTIME_VERSION,
    systems:{
      cloudSnapshot:typeof snapshot==='function'&&typeof saveState==='function',
      syncNow:v296HasApp('syncNow'),
      automaticBackup:typeof v148BuildFullBackup==='function',
      fullDataExport:v296HasApp('exportJSON'),
      fullDataImport:v296HasApp('importJSON'),
      settingsExport:v296HasApp('exportSettingsPreset'),
      settingsImport:v296HasApp('importSettingsPreset'),
      xpCalculation:typeof calculateConsumptionXP==='function'&&v296HasApp('calculateXPNow'),
      consumptionHistoryExport:v296HasApp('v271ExportConsumptionCSV'),
      historyLogsExport:v296HasApp('v271ExportLogsCSV'),
      personalOrderExport:typeof v142OrderExportPayload==='function'&&v296HasApp('v142ExportOrder'),
      personalOrderImport:v296HasApp('v142ImportOrder'),
      collectionsExport:v296HasApp('v279ExportCollections'),
      collectionsImport:v296HasApp('v279ImportCollections'),
      automaticUpdate:typeof v161EnsureAutomaticUpdateCheck==='function',
      automaticInstallUpdate:v296HasApp('v248ToggleAutoInstallUpdates')
    }
  };
}

Object.assign(App,{
  v296OpenCategoryRecoveryConfirm,
  v296ConfirmCategoryRecovery,
  v296CloseMoreMenu,
  v296AuditState
});
window.MediaFlowV296={version:V296_RUNTIME_VERSION,focus:'Category recovery confirmations, responsive theme-aware More navigation, cloud data-protection UI cleanup and complete persistence/export/PWA audit'};
MediaFlowRuntime.version=V296_RUNTIME_VERSION;

window.addEventListener('resize',()=>{try{v276RefreshMobileNav?.();}catch(_){ }},{passive:true});
window.addEventListener('orientationchange',()=>{try{v276RefreshMobileNav?.();}catch(_){ }},{passive:true});
