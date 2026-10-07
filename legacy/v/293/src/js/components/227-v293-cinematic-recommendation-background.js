/* ============================================================
   MediaFlow v293 — Cinematic Recommendation Background
   ------------------------------------------------------------
   v292's optional recommended-cover mode was deliberately conservative.
   v293 keeps the exact same preference and persistence contract, but marks
   enabled Dashboard heroes for a much stronger cinematic presentation:
   visible artwork, lighter scrims, glass recommendation surfaces and richer
   foreground contrast. No recommendation or logging behavior changes.
   ============================================================ */
const V293_RUNTIME_VERSION=293;

const v293RenderDashboardBase=renderDashboard;
renderDashboard=function(){
  let html=v293RenderDashboardBase.apply(this,arguments);
  if(v292RecommendationBackgroundMode()!==V292_RECOMMENDATION_BG_COVER)return html;
  if(!v292RecommendedCoverUrl())return html;
  html=html.replace(
    '<div class="hero mf292-recommendation-cover"',
    '<div class="hero mf292-recommendation-cover mf293-cinematic-cover" data-mf293-cinematic-cover="1"'
  );
  return html;
};

/* Refresh the v292 Settings explanation so users know cover mode is now meant
   to be immersive rather than a faint texture. */
const v293DashboardRecommendationSettingsHtmlBase=v292DashboardRecommendationSettingsHtml;
v292DashboardRecommendationSettingsHtml=function(){
  return v293DashboardRecommendationSettingsHtmlBase.apply(this,arguments)
    .replace('<b>Cover background mode</b>','<b>Cinematic cover background</b>')
    .replace(
      "MediaFlow enlarges, darkens and softly blends the currently recommended title's cover behind the panel while keeping the normal cover thumbnail and controls readable.",
      "MediaFlow turns the currently recommended title's cover into a vivid cinematic backdrop with layered artwork, glass surfaces and protected text contrast while keeping the normal cover thumbnail and controls readable."
    );
};

function v293AuditState(){
  return {
    version:293,
    recommendationBackground:v292RecommendationBackgroundMode(),
    cinematicCoverMode:v292RecommendationBackgroundMode()===V292_RECOMMENDATION_BG_COVER,
    coverBackgroundAvailable:!!v292RecommendedCoverUrl(),
    presentationUpgrade:'cinematic-cover-v2',
    defaultRecommendationBackground:V292_RECOMMENDATION_BG_DEFAULT,
    recommendationLogicChanged:false,
    loggingLogicChanged:false,
    cloudSyncVersion:201,
    fullBackupSchema:29,
    settingsPresetSchema:1,
    personalOrderExportVersion:Number(v142OrderExportPayload()?.formatVersion)||0,
    collectionsExportVersion:2,
    pwaRelease:293
  };
}

Object.assign(App,{v293AuditState});
window.MediaFlowV293={version:293,focus:'Cinematic recommended-title cover background overhaul'};
MediaFlowRuntime.version=V293_RUNTIME_VERSION;
