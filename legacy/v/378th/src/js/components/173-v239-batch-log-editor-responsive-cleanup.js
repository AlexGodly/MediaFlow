/* ============================================================
   MediaFlow v239 — Batch Log / Logging / Editor Cleanup
   --------------------------------------------------------------------------
   - Cleans Batch Log browser spacing and mode controls.
   - Rebuilds logged-title rows with covers and readable metadata.
   - Makes Edit Title large, organized and safely scrollable when required.
   - Removes the v238 Device & Layout override feature completely while
     preserving automatic/native responsive behavior and compact performance.
   - Re-audits current persistent settings, cloud, Full/Automatic Backup,
     Settings Presets, Personal Order export and History export metadata.
   ============================================================ */
const V239_RUNTIME_VERSION=239;

/* ---------- Remove Device & Layout feature ----------------------------- */
function v239StripDeviceLayout(settings){
  if(settings&&typeof settings==='object')delete settings.v238DeviceLayout;
  return settings;
}

// Stop v238 from recreating or applying the retired preference.
v238EnsureSettings=function(settings=S.settings||DEFAULT_SETTINGS){
  v239StripDeviceLayout(settings);
  return {mode:'auto',modifiedAt:0};
};
v238ResolvedDeviceMode=function(){
  const w=Math.max(0,Number(window.innerWidth)||0);
  return w<=700?'mobile':w<=1100?'tablet':'desktop';
};
v238ApplyDeviceMode=function(){
  const root=document.documentElement;
  delete root.dataset.v238DevicePreference;
  delete root.dataset.v238Layout;
  return v238ResolvedDeviceMode();
};
v238SetDeviceMode=function(){
  v239StripDeviceLayout(S.settings||DEFAULT_SETTINGS);
  v238ApplyDeviceMode();
};
v239StripDeviceLayout(DEFAULT_SETTINGS);
v239StripDeviceLayout(S.settings||DEFAULT_SETTINGS);
v238ApplyDeviceMode();

// Remove Device & Layout from the generated Settings HTML and sidebar model.
const v239LoggingSettingsHtmlBase=v181LoggingSettingsHtml;
v181LoggingSettingsHtml=function(){
  const raw=v239LoggingSettingsHtmlBase.apply(this,arguments);
  try{
    const host=document.createElement('div');host.innerHTML=String(raw||'');
    host.querySelectorAll('.v238-device-settings-card').forEach(card=>{
      const label=card.previousElementSibling;
      if(label?.classList?.contains('section-label')&&/DEVICE\s*&\s*LAYOUT/i.test(label.textContent||''))label.remove();
      card.remove();
    });
    return host.innerHTML;
  }catch(_){
    return String(raw||'').replace(/<div class="section-label">DEVICE &amp; LAYOUT<\/div>[\s\S]*?<\/div>\s*$/i,'');
  }
};
try{
  for(const key of Object.keys(V221_SETTINGS_SECTION_ORDER||{})){
    if(Array.isArray(V221_SETTINGS_SECTION_ORDER[key]))V221_SETTINGS_SECTION_ORDER[key]=V221_SETTINGS_SECTION_ORDER[key].filter(x=>String(x||'').trim().toUpperCase()!=='DEVICE & LAYOUT');
  }
}catch(_){ }

/* ---------- Cleaner logging-method selector ---------------------------- */
v179ModeSwitchHtml=function(kind){
  const safeKind=kind==='batch'?'batch':'single';
  const mode=v179Mode(safeKind);
  const isBatch=safeKind==='batch';
  const help=mode==='progress'
    ?(isBatch
      ?'Enter the final episode, chapter or issue reached for each selected title. MediaFlow calculates the consumed difference automatically.'
      :'Enter the final episode, chapter or issue reached. MediaFlow calculates how much you consumed from the saved starting progress.')
    :(isBatch
      ?'Enter the amount consumed directly for each title in the batch.'
      :'Enter the amount consumed directly in the title’s unit.');
  return `<section class="v179-log-mode-switch v239-log-mode-switch ${isBatch?'v179-batch-mode-wrap':''}" data-v239-logging-mode="${safeKind}">
    <div class="v239-log-mode-heading">
      <span class="v179-mode-label">Logging method</span>
      <b>${isBatch?'How should this batch be logged?':'How should this session be logged?'}</b>
    </div>
    <div class="v239-log-mode-options" role="group" aria-label="Logging method">
      <button type="button" class="btn ${mode==='amount'?'active':''}" onclick="App.v179SetLogMode('${safeKind}','amount')" aria-pressed="${mode==='amount'}">Amount consumed</button>
      <button type="button" class="btn ${mode==='progress'?'active':''}" onclick="App.v179SetLogMode('${safeKind}','progress')" aria-pressed="${mode==='progress'}">Last progress</button>
    </div>
    <div class="v179-log-mode-help">${escapeHtml(help)}</div>
  </section>`;
};

/* ---------- Logged-title cards with cover art -------------------------- */
function v239LoggedCover(item,title){
  if(item?.coverUrl)return `<img class="v239-logged-cover" src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(cleanTitle(item.title||title||''))} cover" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'v239-logged-cover v239-logged-cover-placeholder',textContent:'${String(title||'?').trim().charAt(0).toUpperCase().replace(/'/g,"\\'")||'?'}'}))">`;
  const initial=String(cleanTitle(item?.title||title||'?')||'?').trim().charAt(0).toUpperCase()||'?';
  return `<div class="v239-logged-cover v239-logged-cover-placeholder" aria-hidden="true">${escapeHtml(initial)}</div>`;
}
function v239LoggedTitlesHtml(entries){
  if(!Array.isArray(entries)||!entries.length)return '';
  const progressMode=v179Mode('single')==='progress';
  return `<div class="v239-logged-title-list" aria-label="Titles logged">
    ${entries.map((entry,idx)=>{
      const item=entry?.libraryId?S.library.find(i=>String(i.id)===String(entry.libraryId)):null;
      const cat=item?getCategory(item.categoryId):null;
      const title=cleanTitle(item?.title||entry?.title||'Untitled');
      const status=item?v199StatusLabel(item.status):'';
      const priority=item?String(item.priority||'medium').toLowerCase():'';
      let action='';
      if(progressMode&&item){
        const start=Number.isFinite(Number(entry.v179StartProgress))?Math.max(0,Number(entry.v179StartProgress)):v179StartProgress(item);
        const end=entry.v179EndProgress!=null?v179ClampEndProgress(item,entry.v179EndProgress):v179ClampEndProgress(item,start+Math.max(0,Number(entry.qty)||0));
        const qty=v179CalculatedQty(item,start,end);
        action=`<label class="v239-logged-progress"><span>${escapeHtml(v179ProgressInputLabel(item))}</span><input type="number" min="${start}" ${Number(item.total)>0?`max="${Number(item.total)}"`:''} step="1" value="${end}" onchange="App.v179SetLogEntryEnd(${idx},this.value)"></label><span class="v239-logged-consumed">+${qty} ${escapeHtml(v179ProgressNoun(item,qty))}</span>`;
      }else{
        action=`<span class="v239-logged-consumed">${Math.max(0,Number(entry?.qty)||0)} ${escapeHtml(item?v179ProgressNoun(item,Number(entry?.qty)||0):'units')}</span>`;
      }
      const progress=item?(Number(item.total)>0?`${Number(item.progress)||0}/${Number(item.total)}`:`Progress ${Number(item.progress)||0}`):'';
      return `<article class="v239-logged-title-card">
        ${v239LoggedCover(item,title)}
        <div class="v239-logged-title-copy">
          <b>${escapeHtml(title)}</b>
          <small>${[cat?.name,status,priority?`${priority} priority`:'',progress,entry?.isRepeat?'Rewatch / reread':''].filter(Boolean).map(escapeHtml).join(' · ')}</small>
        </div>
        <div class="v239-logged-title-actions">${action}<button type="button" class="btn btn-sm btn-ghost v239-remove-log-title" onclick="App.removeLogEntry(${idx})" aria-label="Remove ${escapeHtml(title)}">Remove</button></div>
      </article>`;
    }).join('')}
  </div>`;
}

// v239 owns the logged-title editor; the legacy progress editor would duplicate it.
v179ProgressEntryEditorHtml=function(){return '';};

const v239RenderLogFormBase=renderLogForm;
renderLogForm=function(){
  const raw=v239RenderLogFormBase.apply(this,arguments);
  try{
    const host=document.createElement('div');host.innerHTML=String(raw||'');
    const form=host.querySelector('.log-form');if(!form)return raw;
    const removeButtons=[...form.querySelectorAll('button[onclick^="App.removeLogEntry"]')];
    if(removeButtons.length){
      const old=removeButtons[0].closest('div');
      if(old){
        const holder=document.createElement('div');holder.innerHTML=v239LoggedTitlesHtml(S.logDraft?.entries||[]);
        const fresh=holder.firstElementChild;if(fresh)old.replaceWith(fresh);
      }
    }
    // If markup changed upstream and no legacy pills were found, still place the
    // logged-title cards directly below the What You Logged heading.
    if((S.logDraft?.entries||[]).length&&!form.querySelector('.v239-logged-title-list')){
      const head=form.querySelector('.v238-logged-section-head');
      if(head)head.insertAdjacentHTML('afterend',v239LoggedTitlesHtml(S.logDraft.entries));
    }
    return host.innerHTML;
  }catch(_){return raw;}
};

/* ---------- Batch Log cover + structure polish ------------------------- */
const v239RenderBatchLogBase=renderBatchLog;
renderBatchLog=function(){
  const raw=v239RenderBatchLogBase.apply(this,arguments);
  try{
    const host=document.createElement('div');host.innerHTML=String(raw||'');
    host.querySelector('#v175-batch-library-tools')?.classList.add('v239-batch-library-tools');
    [...host.querySelectorAll('.batch-log-row')].forEach((row,idx)=>{
      const draft=S.batchDraft?.rows?.[idx];
      const item=draft?.libraryId?S.library.find(x=>String(x.id)===String(draft.libraryId)):null;
      const selected=row.querySelector('.batch-selected-title');
      if(selected&&item&&!selected.querySelector('.v239-batch-cover')){
        const cover=document.createElement(item.coverUrl?'img':'div');
        cover.className='v239-batch-cover'+(item.coverUrl?'':' v239-batch-cover-placeholder');
        if(item.coverUrl){cover.src=item.coverUrl;cover.alt=`${cleanTitle(item.title)} cover`;cover.loading='lazy';cover.onerror=()=>{cover.style.display='none';};}
        else cover.textContent=(cleanTitle(item.title)||'?').charAt(0).toUpperCase();
        selected.prepend(cover);
      }
    });
    return host.innerHTML;
  }catch(_){return raw;}
};

/* ---------- Edit Title modal: larger, organized, scroll-safe ----------- */
const v239LibraryModalHtmlBase=libraryModalHtml;
libraryModalHtml=function(){
  const raw=v239LibraryModalHtmlBase.apply(this,arguments);
  return `<div class="v239-library-editor-shell">${raw}</div>`;
};

/* ---------- Persistence / export / cloud retirement audit -------------- */
const v239NormalizeModernSettingsBase=v232NormalizeModernSettings;
v232NormalizeModernSettings=function(settings=S.settings||DEFAULT_SETTINGS){
  const out=v239NormalizeModernSettingsBase(settings);
  v239StripDeviceLayout(settings);
  return out;
};

const v239MergeStatesBase=mergeStates;
mergeStates=function(){
  const out=v239MergeStatesBase.apply(this,arguments)||{};
  if(out.settings)v239StripDeviceLayout(out.settings);
  return out;
};

const v239VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(){
  const result=v239VerifyCloudStateBase.apply(this,arguments)||{ok:true,missing:[]};
  const missing=(result.missing||[]).filter(x=>String(x)!=='v238 device/layout setting');
  return {ok:missing.length===0,missing:[...new Set(missing)]};
};

const v239BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v239StripDeviceLayout(S.settings||DEFAULT_SETTINGS);
  const payload=v239BuildFullBackupBase.apply(this,arguments);
  if(payload?.settings)v239StripDeviceLayout(payload.settings);
  if(payload?.backupManifest){
    payload.backupManifest.note='Complete MediaFlow v239 backup. Includes current Library/Dynamic Library state, Categories, History, Personal Order, Choice & Filter layouts, responsive settings, rich title metadata, XP/progression and all current persistent configuration. The retired v238 Device & Layout override is intentionally excluded.';
  }
  return payload;
};

const v239BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(){
  const manifest=v239BackupManifestBase.apply(this,arguments);
  manifest.includes=Object.assign({},manifest.includes||{}, {
    batchLogUiV239:true,loggedTitleCoversV239:true,editTitleResponsiveV239:true,nativeResponsiveAuditV239:true,
    fullExportImportAuditV239:true,automaticBackupAuditV239:true,syncNowAuditV239:true,settingsPresetAuditV239:true,personalOrderExportAuditV239:true,historyExportAuditV239:true
  });
  if(manifest.includes){delete manifest.includes.deviceLayoutV238;delete manifest.includes.responsiveLayoutV238;}
  delete manifest.v238;
  manifest.v239={deviceLayoutOverrideRemoved:true,cloudSyncVersion:201,fullBackupSchema:29,settingsPresetSchema:1,personalOrderExportVersion:4};
  return manifest;
};

const v239BuildSettingsPresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
  v239StripDeviceLayout(S.settings||DEFAULT_SETTINGS);
  const preset=v239BuildSettingsPresetBase.apply(this,arguments);
  if(preset?.settings)v239StripDeviceLayout(preset.settings);
  if(preset?.presetManifest?.includes){delete preset.presetManifest.includes.deviceLayoutV238;delete preset.presetManifest.includes.responsiveLayoutV238;}
  preset.presetManifest=preset.presetManifest||{};
  preset.presetManifest.includes=Object.assign({},preset.presetManifest.includes||{}, {v239CurrentSettingsAudit:true,deviceLayoutOverrideRemoved:true});
  return preset;
};

const v239NormalizeImportedSettingsBase=v196NormalizeImportedSettings;
v196NormalizeImportedSettings=function(){
  const next=v239NormalizeImportedSettingsBase.apply(this,arguments);
  v239StripDeviceLayout(next);
  return next;
};

const v239OrderExportPayloadBase=v142OrderExportPayload;
v142OrderExportPayload=function(){
  const payload=v239OrderExportPayloadBase.apply(this,arguments);
  payload.exportAudit=Object.assign({},payload.exportAudit||{}, {release:V239_RUNTIME_VERSION,personalOrderFormat:4,current:true});
  return payload;
};

// Remove the retired field from current in-memory state immediately and from
// any future persistence pass. Current History CSV remains the richer v232
// exporter and carries session/title metadata without a schema dependency.
v239StripDeviceLayout(S.settings||DEFAULT_SETTINGS);
v238ApplyDeviceMode();

// Keep semantic icons refreshed after the new logging / Batch markup mounts.
MediaFlowRuntime.registerPageEnhancer('batch',()=>{try{v226RefreshSemanticButtonIcons(document);}catch(_){ }});
MediaFlowRuntime.registerPageEnhancer('dashboard',()=>{try{v226RefreshSemanticButtonIcons(document);}catch(_){ }});
MediaFlowRuntime.registerPageEnhancer('settings',()=>{try{v226RefreshSemanticButtonIcons(document);}catch(_){ }});

Object.assign(App,{v238SetDeviceMode,v238ApplyDeviceMode,v238EnsureSettings});
MediaFlowRuntime.version=V239_RUNTIME_VERSION;
