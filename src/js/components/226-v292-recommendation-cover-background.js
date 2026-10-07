/* ============================================================
   MediaFlow v292 — Recommendation Cover Background
   ------------------------------------------------------------
   - Adds an organized Dashboard Settings preference for choosing between
     MediaFlow's normal Next Task/logging presentation and an atmospheric
     background driven by the currently recommended title cover.
   - The preference is canonical Settings data, so the existing Settings
     Preset / Cloud Sync / Sync Now / Full Backup pipelines carry it.
   - Cover mode is presentation-only. Recommendation, logging and Personal
     Order behavior are unchanged, and titles without a real cover fall back
     to the normal MediaFlow theme automatically.
   ============================================================ */
const V292_RUNTIME_VERSION=292;
const V292_RECOMMENDATION_BG_KEY='v292RecommendationBackground';
const V292_RECOMMENDATION_BG_DEFAULT='default';
const V292_RECOMMENDATION_BG_COVER='cover';

function v292NormalizeRecommendationBackground(value){
  return String(value||'').toLowerCase()===V292_RECOMMENDATION_BG_COVER
    ?V292_RECOMMENDATION_BG_COVER
    :V292_RECOMMENDATION_BG_DEFAULT;
}

function v292EnsureSettings(settings){
  const target=settings&&typeof settings==='object'?settings:{};
  target[V292_RECOMMENDATION_BG_KEY]=v292NormalizeRecommendationBackground(target[V292_RECOMMENDATION_BG_KEY]);
  return target;
}

DEFAULT_SETTINGS[V292_RECOMMENDATION_BG_KEY]=V292_RECOMMENDATION_BG_DEFAULT;
v292EnsureSettings(S.settings||DEFAULT_SETTINGS);

function v292RecommendationBackgroundMode(){
  return v292EnsureSettings(S.settings||DEFAULT_SETTINGS)[V292_RECOMMENDATION_BG_KEY];
}

function v292RecommendedLibraryItem(){
  const task=S.currentTask;
  if(!S.sessionActive||!task?.title||S.settings?.exactTitleRecommendations===false)return null;
  if(typeof v50FindLibraryItem==='function')return v50FindLibraryItem(task.libraryId,task.title)||null;
  if(task.libraryId){
    const direct=(S.library||[]).find(item=>String(item?.id||'')===String(task.libraryId));
    if(direct)return direct;
  }
  const title=cleanTitle(task.title||'').toLowerCase();
  return title?(S.library||[]).find(item=>cleanTitle(item?.title||'').toLowerCase()===title)||null:null;
}

function v292RecommendedCoverUrl(){
  const item=v292RecommendedLibraryItem();
  return String(item?.coverUrl||item?.cover||item?.imageUrl||'').trim();
}

function v292CssUrl(value){
  const safe=String(value||'')
    .replace(/\\/g,'\\\\')
    .replace(/"/g,'\\"')
    .replace(/[\r\n\f]/g,'');
  return `url("${safe}")`;
}

function v292RecommendationBackgroundLayers(cover,title){
  const style=`--mf292-recommendation-cover:${v292CssUrl(cover)}`;
  return `<div class="mf292-recommendation-bg" aria-hidden="true" style="${escapeHtml(style)}"></div>
    <div class="mf292-recommendation-art" aria-hidden="true" style="${escapeHtml(style)}"></div>
    <div class="mf292-recommendation-scrim" aria-hidden="true"></div>`;
}

const v292RenderDashboardBase=renderDashboard;
renderDashboard=function(){
  let html=v292RenderDashboardBase.apply(this,arguments);
  if(v292RecommendationBackgroundMode()!==V292_RECOMMENDATION_BG_COVER)return html;
  const cover=v292RecommendedCoverUrl();
  if(!cover)return html;
  const task=S.currentTask;
  const marker='<div class="hero">';
  if(!html.includes(marker))return html;
  const open=`<div class="hero mf292-recommendation-cover" data-mf292-recommendation-cover="1" data-mf292-title="${escapeHtml(cleanTitle(task?.title||''))}">${v292RecommendationBackgroundLayers(cover,task?.title||'')}`;
  return html.replace(marker,open);
};

function v292SetRecommendationBackground(value){
  const next=v292NormalizeRecommendationBackground(value);
  v292EnsureSettings(S.settings||DEFAULT_SETTINGS)[V292_RECOMMENDATION_BG_KEY]=next;
  try{persistSettings();}catch(_){try{saveState();}catch(__){ }}
  document.querySelectorAll('[data-v292-recommendation-background]').forEach(el=>{
    if('value' in el)el.value=next;
  });
  showToast(next===V292_RECOMMENDATION_BG_COVER
    ?'Recommended title covers will now style the active Next Task panel when artwork is available.'
    :'Dashboard recommendation background restored to the default MediaFlow theme.');
}

function v292DashboardRecommendationSettingsHtml(){
  const mode=v292RecommendationBackgroundMode();
  return `<div class="card v192-dashboard-settings-card mf292-dashboard-appearance-card">
    <div class="v192-dashboard-settings-head">
      <div>
        <b>Recommendation background</b>
        <div class="hint">Choose the visual treatment for the active Next Task / logging panel. This changes appearance only — recommendation and logging behavior stay exactly the same.</div>
      </div>
    </div>
    <div class="mf292-dashboard-background-setting">
      <div class="field mf292-dashboard-background-field">
        <label class="field-label" for="mf292-recommendation-background">Next Task background style</label>
        <select id="mf292-recommendation-background" data-v292-recommendation-background onchange="App.v292SetRecommendationBackground(this.value)">
          <option value="default" ${mode===V292_RECOMMENDATION_BG_DEFAULT?'selected':''}>Default MediaFlow logging theme</option>
          <option value="cover" ${mode===V292_RECOMMENDATION_BG_COVER?'selected':''}>Recommended title cover as background</option>
        </select>
      </div>
      <div class="mf292-background-explainer">
        <span class="mf292-background-icon" aria-hidden="true">▣</span>
        <div><b>Cover background mode</b><small>MediaFlow enlarges, darkens and softly blends the currently recommended title's cover behind the panel while keeping the normal cover thumbnail and controls readable. If the title has no cover, MediaFlow automatically uses the default theme.</small></div>
      </div>
    </div>
  </div>`;
}

// Keep the preference beside the existing Dashboard controls instead of
// creating another scattered Settings section.
const v292DashboardVisibilitySettingsHtmlBase=v192DashboardVisibilitySettingsHtml;
v192DashboardVisibilitySettingsHtml=function(){
  return v292DashboardVisibilitySettingsHtmlBase.apply(this,arguments)+v292DashboardRecommendationSettingsHtml();
};

// Reset integration: one-control Reset and Dashboard Settings Reset section.
const v292ResetDescriptorBase=v221ResetDescriptorForControl;
v221ResetDescriptorForControl=function(el){
  const code=[el?.getAttribute?.('onchange'),el?.getAttribute?.('onclick'),el?.getAttribute?.('oninput')].filter(Boolean).join(' ');
  if(code.includes('App.v292SetRecommendationBackground'))return {type:'path',path:V292_RECOMMENDATION_BG_KEY};
  return v292ResetDescriptorBase.apply(this,arguments);
};
const v292SectionResetPlanBase=v221SectionResetPlan;
v221SectionResetPlan=function(title){
  const plan=v292SectionResetPlanBase.apply(this,arguments);
  if(String(title||'').trim().toUpperCase()!=='DASHBOARD SETTINGS')return plan;
  if(plan?.kind==='paths')return {kind:'paths',paths:[...new Set([...(plan.paths||[]),V292_RECOMMENDATION_BG_KEY])]};
  return {kind:'paths',paths:[V292_RECOMMENDATION_BG_KEY]};
};

/* ---------- Persistence normalization -------------------------------- */
const v292NormalizeImportedSettingsBase=v196NormalizeImportedSettings;
v196NormalizeImportedSettings=function(raw){
  const next=v292NormalizeImportedSettingsBase.apply(this,arguments);
  v292EnsureSettings(next);
  return next;
};
const v292PersistSettingsBase=persistSettings;
persistSettings=function(){
  v292EnsureSettings(S.settings||DEFAULT_SETTINGS);
  return v292PersistSettingsBase.apply(this,arguments);
};
const v292LoadAllBase=loadAll;
loadAll=async function(){
  await v292LoadAllBase.apply(this,arguments);
  v292EnsureSettings(S.settings||DEFAULT_SETTINGS);
};

function v292AuditState(){
  const cover=v292RecommendedCoverUrl();
  return {
    version:292,
    recommendationBackground:v292RecommendationBackgroundMode(),
    defaultRecommendationBackground:V292_RECOMMENDATION_BG_DEFAULT,
    coverBackgroundAvailable:!!cover,
    coverBackgroundFallback:'default-theme',
    recommendationLogicChanged:false,
    loggingLogicChanged:false,
    cloudSyncVersion:201,
    fullBackupSchema:29,
    settingsPresetSchema:1,
    personalOrderExportVersion:Number(v142OrderExportPayload()?.formatVersion)||0,
    collectionsExportVersion:2,
    pwaRelease:292
  };
}

Object.assign(App,{v292SetRecommendationBackground,v292AuditState});
window.MediaFlowV292={version:292,focus:'Optional recommended-title cover background for the Dashboard Next Task and logging panel'};
MediaFlowRuntime.version=V292_RUNTIME_VERSION;
