/* MediaFlow v405 — Cloud-portable floating control preferences, unobstructed
 * More navigation, live data-contract audits, and v405 transfer stamps.
 * Does not modify Supabase database schema or enable paused integrations. */
const V405_RELEASE=405;
const V405_FLOATING_KEYS=Object.freeze({add:'v405ShowFloatingAdd',progress:'v405ShowFloatingTaskProgress'});
function v405FloatingEnabled(name){
  return S.settings?.[V405_FLOATING_KEYS[name]]!==false; // legacy accounts default visible
}
function v405MoreMenuOpen(){
  const menu=document.getElementById('mobile-more-menu');
  return !!menu&&!menu.classList.contains('hide')&&!menu.hidden;
}
function v405SyncDock(){
  const dock=document.getElementById('mf397-dock');
  if(!dock)return;
  const blocked=v405MoreMenuOpen();
  dock.classList.toggle('mf405-hide-add',!v405FloatingEnabled('add'));
  dock.classList.toggle('mf405-hide-progress',!v405FloatingEnabled('progress'));
  dock.classList.toggle('mf405-more-obscured',blocked);
  const dimmer=document.getElementById('mf397-dimmer');
  dimmer?.classList.toggle('mf405-more-obscured',blocked);
  // An open action fan must close before the More dialog receives focus.
  if(blocked&&MF397.open)mf397SetMenu(false);
  // inert prevents keyboard navigation through underlying floating actions.
  dock.inert=blocked;
}
function v405ToggleFloating(key,button){
  const field=V405_FLOATING_KEYS[key];if(!field)return;
  S.settings=S.settings||{};
  const previous=v405FloatingEnabled(key);
  S.settings[field]=!previous;
  v405SyncDock();
  document.querySelectorAll(`[data-mf405-setting="${key}"] button[role="switch"]`).forEach(el=>{
    const checked=v405FloatingEnabled(key);
    el.setAttribute('aria-checked',String(checked));el.classList.toggle('on',checked);
  });
  // Existing autosave queue and cloud snapshot transport the entire Settings
  // object. A cloud error must still use the application's save-error banner.
  try{const saved=persistSettings();if(saved&&typeof saved.catch==='function')saved.catch(e=>console.error('Floating control preference save failed',e));}
  catch(e){console.error('Floating control preference save failed',e);if(typeof showSaveError==='function')showSaveError();}
}
function v405FloatingRow(key,title,description){
  const checked=v405FloatingEnabled(key);
  const id=`mf405-floating-${key}`;
  return `<div class="mf405-floating-row settings-toggle-row" data-mf405-setting="${key}"><div class="mf405-floating-copy"><label id="${id}-label" for="${id}">${escapeHtml(title)}</label><p class="hint">${escapeHtml(description)}</p></div><button type="button" id="${id}" class="toggle mf405-floating-switch ${checked?'on':''}" role="switch" aria-labelledby="${id}-label" aria-checked="${checked}" onclick="App.v405ToggleFloating('${key}',this)"><span aria-hidden="true"></span></button></div>`;
}
function v405FloatingSettingsHtml(){
  return `<div class="section-label">FLOATING CONTROLS</div><div class="card mf405-floating-settings" data-mf405-group="floating-controls">
    <div class="mf405-group-kicker">QUICK ACTIONS</div>
    ${v405FloatingRow('add','Show Floating Add Button','Display the floating + shortcut for Logging, Library titles and Collections. Other Add Title entry points remain available.')}
    <div class="mf405-floating-divider"></div>
    <div class="mf405-group-kicker">PROGRESS WIDGETS</div>
    ${v405FloatingRow('progress','Show Floating Task Progress','Display the floating task goal indicator. Progress calculations, Logging and XP continue when hidden.')}
  </div>`;
}
// Insert a genuine v221 Settings section BEFORE the existing Navigation section
// rather than an ephemeral post-mount card. The v221 -> v365 enhancement moves
// the original live control nodes and registers search/favorites normally.
function v405InsertFloatingSettings(raw){
  const host=document.createElement('div');host.innerHTML=String(raw||'');
  const content=host.querySelector('.v221-settings-content');
  if(!content||content.querySelector('[data-mf405-group="floating-controls"]'))return raw;
  const labels=[...content.querySelectorAll('.section-label')];
  const navigation=labels.find(el=>/^NAVIGATION$/i.test((el.textContent||'').trim()));
  const candidate=navigation||labels.find(el=>el.parentElement===content);
  if(!candidate||!candidate.parentNode)return raw;
  candidate.insertAdjacentHTML('beforebegin',v405FloatingSettingsHtml());
  return host.innerHTML;
}
v366RegisterSection({id:'v221-settings-floating-controls',category:'appearance',subgroup:'Floating Controls',keywords:['interface','floating','shortcut','quick add','progress','task progress','hide','show','visibility','dock']});
for(const [id,label] of [['add','Show Floating Add Button'],['progress','Show Floating Task Progress']]){
  v366RegisterSetting({id:'v405-floating-'+id,section:'v221-settings-floating-controls',selector:`[data-mf405-setting="${id}"]`,label,subgroup:id==='add'?'Quick Actions':'Progress Widgets',keywords:['floating','interface','show','hide',id]});
}
const v405SettingsRenderer=V219_PAGE_RENDERERS.get('settings');
if(typeof v405SettingsRenderer==='function')MediaFlowRuntime.registerPageRenderer('settings',function(ctx){
  return v405InsertFloatingSettings(v405SettingsRenderer.call(this,ctx));
});
App.v405ToggleFloating=v405ToggleFloating;
const v405DockUpdateBase=mf397Update;
mf397Update=function(){const result=v405DockUpdateBase.apply(this,arguments);v405SyncDock();return result;};
// Menu state changes can come from either the More tab or its close button.
for(const method of ['toggleMobileMore','v296CloseMoreMenu','mobileNav']){
  const base=App[method];if(typeof base!=='function')continue;
  App[method]=function(){const result=base.apply(this,arguments);v405SyncDock();requestAnimationFrame(v405SyncDock);return result;};
}
// Mobile nav can be replaced by a full-page render; delegated observation
// catches the new element as well as class changes by legacy menu handlers.
let V405_OBSERVED_MENU=null;
const v405MenuObserver=new MutationObserver(()=>v405SyncDock());
const v405ShellBase=renderShell;
renderShell=function(){const result=v405ShellBase.apply(this,arguments);v405ObserveMoreMenu();requestAnimationFrame(v405SyncDock);return result;};
function v405ObserveMoreMenu(){
  const menu=document.getElementById('mobile-more-menu');
  if(V405_OBSERVED_MENU===menu)return;
  v405MenuObserver.disconnect();V405_OBSERVED_MENU=menu;
  if(menu)v405MenuObserver.observe(menu,{attributes:true,attributeFilter:['class','hidden','style']});
}
const v405RenderBase=render;
render=function(){const result=v405RenderBase.apply(this,arguments);v405ObserveMoreMenu();requestAnimationFrame(v405SyncDock);return result;};
// Guarantee the live updater sees settings preset/backup imports once the
// normal application renderer has finished applying the imported snapshot.
const v405RenderViewBase=renderView;
renderView=function(){const result=v405RenderViewBase.apply(this,arguments);v405ObserveMoreMenu();requestAnimationFrame(v405SyncDock);return result;};
// Release-neutral schemas: keep all historic import formats compatible, stamp
// exports consistently with the current release and document new settings.
const v405BackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const x=v405BackupBase.apply(this,arguments);
  x.mediaFlowVersion=V405_RELEASE;x.backupVersion=V405_RELEASE;
  const m=x.backupManifest||(x.backupManifest={});
  m.includes=Object.assign({},m.includes||{},{v405FloatingPreferences:true,v405CurrentSettings:true,v405DataIntegrityAudit:true});
  m.v405={release:V405_RELEASE,settingsSchema:'additive',floatAdd:!!v405FloatingEnabled('add'),floatTaskProgress:!!v405FloatingEnabled('progress'),productionDatabaseChanged:false};
  return x;
};
backupSnapshot=function(){return v148BuildFullBackup();};
const v405PresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
  const x=v405PresetBase.apply(this,arguments);
  x.mediaFlowVersion=V405_RELEASE;
  x.presetManifest=x.presetManifest||{};
  x.presetManifest.v405={release:V405_RELEASE,includesFloatingAdd:true,includesFloatingTaskProgress:true};
  return x;
};
const v405OrderBase=v142OrderExportPayload;
v142OrderExportPayload=function(){const x=v405OrderBase.apply(this,arguments);if(x)x.mediaFlowVersion=V405_RELEASE;return x;};
const v405CollectionsBase=v281CollectionsExportPayload;
v281CollectionsExportPayload=function(){const x=v405CollectionsBase.apply(this,arguments);if(x){x.appVersion=V405_RELEASE;x.mediaFlowVersion=V405_RELEASE;}return x;};
// Read-only integrity report: no uploads or XP recalculation. Explicitly
// compare new preferences across snapshot, Full Data and Settings Preset.
function v405AuditDataIntegrity(){
  const prior=v402AuditDataIntegrity();
  const snapshotData=snapshot(),backup=v148BuildFullBackup(),preset=v196BuildSettingsPreset();
  const transfer={};const issues=[...prior.issues];
  for(const [label,key] of Object.entries(V405_FLOATING_KEYS)){
    const actual=v405FloatingEnabled(label),expected=actual===true;
    const states={snapshot:snapshotData.settings?.[key]!==false,
      backup:backup.settings?.[key]!==false,preset:preset.settings?.[key]!==false};
    transfer[label]={...states,expected};
    if(Object.values(states).some(x=>x!==expected))issues.push(key+' transfer mismatch');
  }
  for(const [label,value] of Object.entries({backup:backup.mediaFlowVersion,preset:preset.mediaFlowVersion,
    order:v142OrderExportPayload().mediaFlowVersion,collections:v281CollectionsExportPayload().appVersion})){
    if(Number(value)!==V405_RELEASE)issues.push(label+' incorrect release stamp');
  }
  return {...prior,release:V405_RELEASE,ok:issues.length===0,issues,floatingPreferences:transfer,
    actualLiveCloudChecked:false,actualInstalledPwaChecked:false};
}
App.v405AuditDataIntegrity=v405AuditDataIntegrity;
window.MediaFlowV405={version:V405_RELEASE,preferences:V405_FLOATING_KEYS,
  settingsHtml:v405FloatingSettingsHtml,injectSettings:v405InsertFloatingSettings,
  syncDock:v405SyncDock,audit:v405AuditDataIntegrity};
MediaFlowRuntime.version=V405_RELEASE;
