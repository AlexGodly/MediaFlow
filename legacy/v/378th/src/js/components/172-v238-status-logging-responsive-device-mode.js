/* ============================================================
   MediaFlow v238 — Status Filter Reliability + Logging UX + Responsive Device Mode
   ------------------------------------------------------------------------------
   - Fixes native status/priority/category filter select reordering so the
     selected value survives DOM option reordering on every surface.
   - Reflows Dashboard Logging into a clearer "what you logged" -> collapsible
     Library browser workflow and removes redundant full renders when opening.
   - Adds a persistent Auto / Mobile / Tablet / Desktop UI device-mode override.
   - Enlarges and densifies the normal Add/Edit Title editor for desktop.
   - Audits the new setting through cloud merge/verification, Full/Automatic
     Backup and Settings Presets without changing existing schemas.
   ============================================================ */

const V238_RUNTIME_VERSION=238;
const V238_DEVICE_MODES=new Set(['auto','mobile','tablet','desktop']);
let V238_LOG_LIBRARY_OPEN=false;

/* ---------- Reliable select layout application ------------------------- */
// v232 made option reordering idempotent, but moving <option> nodes can make
// Chromium temporarily select the final moved option. Preserve the value
// explicitly around the layout pass so status filters never become visually
// stuck on Plan to Watch (and their underlying onchange remains authoritative).
const v238ReorderSelectBase=v230ReorderSelect;
v230ReorderSelect=function(select,surface){
  if(!select)return;
  const before=String(select.value??'');
  const st=v230ResolvedSurface(surface);
  const hidden=new Set((st?.hidden||[]).map(String));
  v238ReorderSelectBase.apply(this,arguments);

  let wanted=before;
  if(hidden.has(wanted))wanted='all';
  const hasWanted=[...select.options].some(o=>String(o.value)===wanted&&!o.hidden);
  if(!hasWanted){
    const fallback=[...select.options].find(o=>!o.hidden);
    wanted=fallback?String(fallback.value):'';
  }
  if(wanted!==String(select.value)){
    for(const option of select.options)option.selected=String(option.value)===wanted;
    select.value=wanted;
  }
};

/* ---------- Dashboard Logging: one-render open + clearer structure ------ */
function v238OpenLogForm(){
  const t=S.currentTask;
  if(!t)return;
  const cat=getCategory(t.categoryId);
  const mode=typeof v181DefaultLoggingMode==='function'?v181DefaultLoggingMode():'progress';
  S.logDraft={
    categoryId:t.categoryId,
    amount:mode==='progress'?0:t.targetMid,
    minutes:mode==='progress'?0:Math.round(t.targetMid*(Number(cat?.minutesPerUnit)||0)),
    note:'',entries:[],updateLibrary:true,v179Mode:mode
  };
  S.entryDraft={title:'',qty:1,libraryId:null,endProgress:''};
  S.logging=true;
  V238_LOG_LIBRARY_OPEN=false;
  render();
}
App.openLogForm=v238OpenLogForm;

function v238ToggleLogLibrary(details){
  V238_LOG_LIBRARY_OPEN=!!details?.open;
  if(V238_LOG_LIBRARY_OPEN)requestAnimationFrame(()=>{try{renderLogSuggestions();}catch(_){ }});
}

const v238LogSuggestionsHtmlBase=v224LogSuggestionsHtml;
v224LogSuggestionsHtml=function(){
  if(!V238_LOG_LIBRARY_OPEN)return '<div class="v238-log-library-lazy">Open Library to search and filter titles.</div>';
  return v238LogSuggestionsHtmlBase.apply(this,arguments);
};

function v238LoggingLibrarySummary(){
  const entries=S.logDraft?.entries||[];
  const suffix=entries.length?`${entries.length} title${entries.length===1?'':'s'} already added`:'Search, filter and add Library titles';
  return `<span class="v238-log-library-summary-copy"><b>Library</b><small>${escapeHtml(suffix)}</small></span><span class="v238-log-library-chevron" aria-hidden="true">⌄</span>`;
}

function v238ReflowLogForm(html){
  try{
    const host=document.createElement('div');host.innerHTML=String(html||'');
    const form=host.querySelector('.log-form');
    const titleInput=form?.querySelector('#entry-title');
    const suggestions=form?.querySelector('#log-suggestions');
    if(!form||!titleInput||!suggestions)return html;

    const inputRow=titleInput.parentElement;
    const titleLabel=inputRow?.previousElementSibling?.classList?.contains('field-label')?inputRow.previousElementSibling:null;
    let helper=suggestions.nextElementSibling;
    if(!(helper?.matches?.('small.hint')&&/add one or more/i.test(String(helper.textContent||''))))helper=null;

    const browser=document.createElement('details');
    browser.className='v238-log-library';
    browser.dataset.v238LogLibrary='1';
    if(V238_LOG_LIBRARY_OPEN)browser.open=true;
    browser.setAttribute('ontoggle','App.v238ToggleLogLibrary(this)');
    const summary=document.createElement('summary');summary.className='v238-log-library-summary';summary.innerHTML=v238LoggingLibrarySummary();
    const body=document.createElement('div');body.className='v238-log-library-body';
    const searchHead=document.createElement('div');searchHead.className='v238-log-library-head';searchHead.innerHTML='<div><b>Find a Library title</b><small>Filters stay available while you build this log.</small></div>';
    body.appendChild(searchHead);
    if(titleLabel){titleLabel.textContent='Library title';body.appendChild(titleLabel);}
    body.appendChild(inputRow);body.appendChild(suggestions);if(helper)body.appendChild(helper);
    browser.append(summary,body);

    const entries=S.logDraft?.entries||[];
    const modeSwitch=form.querySelector(':scope > .v179-log-mode-switch');
    if(entries.length){
      const logged=document.createElement('div');logged.className='v238-logged-section-head';
      logged.innerHTML=`<div><span>WHAT YOU LOGGED</span><b>${entries.length} title${entries.length===1?'':'s'} selected</b></div><small>Edit quantities/progress below before saving.</small>`;
      if(modeSwitch)modeSwitch.insertAdjacentElement('afterend',logged);else form.prepend(logged);
    }else{
      const empty=document.createElement('div');empty.className='v238-logged-empty';empty.innerHTML='<span>WHAT YOU LOGGED</span><b>No titles added yet</b><small>Open Library below to search and add one or more titles.</small>';
      if(modeSwitch)modeSwitch.insertAdjacentElement('afterend',empty);else form.prepend(empty);
    }

    const amountRow=[...form.children].find(el=>el.classList?.contains('field-row'));
    if(amountRow)amountRow.before(browser);else form.appendChild(browser);
    return host.innerHTML;
  }catch(_){return html;}
}

const v238RenderLogFormBase=renderLogForm;
renderLogForm=function(){return v238ReflowLogForm(v238RenderLogFormBase.apply(this,arguments));};

/* ---------- Add/Edit Title editor: wide, dense, desktop-friendly -------- */
const v238LibraryModalHtmlBase=libraryModalHtml;
libraryModalHtml=function(d){
  const raw=v238LibraryModalHtmlBase.apply(this,arguments);
  return `<div class="v238-library-editor">${raw}</div>`;
};

/* ---------- Device/layout override setting ------------------------------ */
function v238NormalizeDeviceLayout(raw){
  if(typeof raw==='string')raw={mode:raw,modifiedAt:0};
  const src=raw&&typeof raw==='object'?raw:{};
  const mode=V238_DEVICE_MODES.has(String(src.mode||''))?String(src.mode):'auto';
  return {mode,modifiedAt:Math.max(0,Number(src.modifiedAt)||0)};
}
DEFAULT_SETTINGS.v238DeviceLayout=v238NormalizeDeviceLayout(DEFAULT_SETTINGS.v238DeviceLayout||{mode:'auto'});

function v238EnsureSettings(settings=S.settings||DEFAULT_SETTINGS){
  settings.v238DeviceLayout=v238NormalizeDeviceLayout(settings.v238DeviceLayout);
  return settings.v238DeviceLayout;
}
v238EnsureSettings(DEFAULT_SETTINGS);v238EnsureSettings(S.settings||DEFAULT_SETTINGS);

function v238AutoDeviceMode(){
  const w=Math.max(0,Number(window.innerWidth)||0);
  if(w<=700)return 'mobile';
  if(w<=1100)return 'tablet';
  return 'desktop';
}
function v238ResolvedDeviceMode(){
  const cfg=v238EnsureSettings(S.settings||DEFAULT_SETTINGS);
  return cfg.mode==='auto'?v238AutoDeviceMode():cfg.mode;
}
function v238ApplyDeviceMode(){
  const cfg=v238EnsureSettings(S.settings||DEFAULT_SETTINGS);const resolved=v238ResolvedDeviceMode();
  const root=document.documentElement;
  root.dataset.v238DevicePreference=cfg.mode;
  root.dataset.v238Layout=resolved;
  return resolved;
}
function v238SetDeviceMode(mode){
  const next=V238_DEVICE_MODES.has(String(mode))?String(mode):'auto';
  const cfg=v238EnsureSettings(S.settings||DEFAULT_SETTINGS);
  if(cfg.mode===next){v238ApplyDeviceMode();return;}
  cfg.mode=next;cfg.modifiedAt=Date.now();
  v238ApplyDeviceMode();persistSettings();render();
  showToast(`Interface mode: ${next==='auto'?`Automatic (${v238ResolvedDeviceMode()})`:next.charAt(0).toUpperCase()+next.slice(1)}`);
}
function v238DeviceSettingsHtml(){
  const cfg=v238EnsureSettings(S.settings||DEFAULT_SETTINGS);const resolved=v238ResolvedDeviceMode();
  return `<div class="section-label">DEVICE & LAYOUT</div>
    <div class="card v238-device-settings-card">
      <div class="v238-device-setting-copy"><b>Interface device mode</b><div class="hint">Choose how MediaFlow lays out the interface. Automatic follows the current device/viewport. You can preview Mobile, Tablet or Desktop layout on any device.</div></div>
      <div class="v238-device-mode-grid" role="group" aria-label="Interface device mode">
        ${[['auto','Automatic'],['mobile','Mobile'],['tablet','Tablet'],['desktop','Desktop']].map(([id,label])=>`<button type="button" class="btn ${cfg.mode===id?'active':''}" onclick="App.v238SetDeviceMode('${id}')" aria-pressed="${cfg.mode===id?'true':'false'}" data-v238-device-choice="${id}"><span>${label}</span>${id==='auto'?`<small>${escapeHtml(resolved)}</small>`:''}</button>`).join('')}
      </div>
      <div class="v238-device-mode-state"><span>Current layout</span><b>${escapeHtml(resolved.charAt(0).toUpperCase()+resolved.slice(1))}</b></div>
    </div>`;
}

// v221's legacy Settings renderer calls this helper dynamically, letting the
// new section enter the normal organizer/search/sidebar pipeline.
const v238LoggingSettingsHtmlBase=v181LoggingSettingsHtml;
v181LoggingSettingsHtml=function(){return v238LoggingSettingsHtmlBase.apply(this,arguments)+v238DeviceSettingsHtml();};

try{
  const list=V221_SETTINGS_SECTION_ORDER?.Interface;
  if(Array.isArray(list)&&!list.includes('DEVICE & LAYOUT'))list.unshift('DEVICE & LAYOUT');
}catch(_){ }
const v238SettingsGroupBase=v221SettingsGroup;
v221SettingsGroup=function(label){if(String(label||'').trim().toUpperCase()==='DEVICE & LAYOUT')return 'Interface';return v238SettingsGroupBase(label);};
const v238SectionResetPlanBase=v221SectionResetPlan;
v221SectionResetPlan=function(title){if(String(title||'').trim().toUpperCase()==='DEVICE & LAYOUT')return {kind:'paths',paths:['v238DeviceLayout']};return v238SectionResetPlanBase(title);};
const v238ResetDescriptorBase=v221ResetDescriptorForControl;
v221ResetDescriptorForControl=function(el){const code=[el?.getAttribute?.('onclick'),el?.getAttribute?.('onchange')].filter(Boolean).join(' ');if(/App\.v238SetDeviceMode\(/.test(code))return {type:'path',path:'v238DeviceLayout'};return v238ResetDescriptorBase(el);};

Object.assign(V225_BUTTON_ICONS,{
  deviceLayout:v225IconSvg('<rect x="3" y="4" width="13" height="9" rx="2"/><path d="M7 19h5M9.5 13v6"/><rect x="17" y="7" width="4" height="11" rx="1"/><path d="M18.5 15.5h1"/>'),
  librarySearch:v225IconSvg('<circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 5 5"/><path d="M6 10h8"/>')
});
const v238ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  const t=v225CleanActionText(el);
  if(el?.classList?.contains('v221-settings-nav-item')&&t==='device & layout')return 'deviceLayout';
  if(el?.matches?.('.v238-log-library-summary'))return 'librarySearch';
  return v238ButtonIconNameBase(el);
};

/* ---------- Persistence / cloud / exports audit ------------------------ */
const v238NormalizeModernSettingsBase=v232NormalizeModernSettings;
v232NormalizeModernSettings=function(settings=S.settings||DEFAULT_SETTINGS){const out=v238NormalizeModernSettingsBase(settings);v238EnsureSettings(settings);return out;};

const v238MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v238MergeStatesBase.apply(this,arguments)||{};out.settings=out.settings||{};
  const av=v238NormalizeDeviceLayout(a?.settings?.v238DeviceLayout),bv=v238NormalizeDeviceLayout(b?.settings?.v238DeviceLayout);
  out.settings.v238DeviceLayout=(av.modifiedAt>=bv.modifiedAt)?av:bv;
  return out;
};
const v238VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v238VerifyCloudStateBase.apply(this,arguments);const problems=[...(base?.missing||[])];
  const got=v238NormalizeDeviceLayout(cloudState?.settings?.v238DeviceLayout),wanted=v238NormalizeDeviceLayout(expected?.settings?.v238DeviceLayout);
  if(JSON.stringify(got)!==JSON.stringify(wanted))problems.push('v238 device/layout setting');
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};
const v238BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v238BackupManifestBase.apply(this,arguments);
  manifest.includes=Object.assign({},manifest.includes||{}, {deviceLayoutV238:true,statusFilterRepairV238:true,loggingUxV238:true,responsivePerformanceAuditV238:true,fullExportImportAuditV238:true,automaticBackupAuditV238:true,syncNowAuditV238:true,settingsPresetAuditV238:true,personalOrderExportAuditV238:true,historyExportAuditV238:true});
  manifest.v238={deviceLayoutPath:'settings.v238DeviceLayout',cloudSyncVersion:201,fullBackupSchema:29,settingsPresetSchema:1,personalOrderExportVersion:4};
  return manifest;
};
const v238BuildSettingsPresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
  v238EnsureSettings(S.settings||DEFAULT_SETTINGS);
  const preset=v238BuildSettingsPresetBase.apply(this,arguments);preset.presetManifest=preset.presetManifest||{};
  preset.presetManifest.includes=Object.assign({},preset.presetManifest.includes||{}, {deviceLayoutV238:true,responsiveLayoutV238:true});
  return preset;
};
const v238NormalizeImportedSettingsBase=v196NormalizeImportedSettings;
v196NormalizeImportedSettings=function(raw){const next=v238NormalizeImportedSettingsBase.apply(this,arguments);v238EnsureSettings(next);return next;};

// Dedicated Personal Order / History exports do not carry global Settings, but
// keep their existing current formats and stamp the audit release where they
// already expose audit metadata.
const v238OrderExportPayloadBase=v142OrderExportPayload;
v142OrderExportPayload=function(){const payload=v238OrderExportPayloadBase.apply(this,arguments);payload.exportAudit=Object.assign({},payload.exportAudit||{}, {release:V238_RUNTIME_VERSION,personalOrderFormat:4});return payload;};

/* ---------- Apply layout efficiently ----------------------------------- */
v238ApplyDeviceMode();
let V238_RESIZE_FRAME=0;
window.addEventListener('resize',()=>{
  if(V238_RESIZE_FRAME)return;
  V238_RESIZE_FRAME=requestAnimationFrame(()=>{V238_RESIZE_FRAME=0;if(v238EnsureSettings(S.settings||DEFAULT_SETTINGS).mode==='auto')v238ApplyDeviceMode();});
},{passive:true});

MediaFlowRuntime.registerPageEnhancer('settings',()=>{v238ApplyDeviceMode();try{v226RefreshSemanticButtonIcons(document);}catch(_){ }});

Object.assign(App,{v238ToggleLogLibrary,v238SetDeviceMode,v238ApplyDeviceMode,v238EnsureSettings});
MediaFlowRuntime.version=V238_RUNTIME_VERSION;
