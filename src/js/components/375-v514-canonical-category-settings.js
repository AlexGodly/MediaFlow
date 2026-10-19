/* MediaFlow v514 — canonical Settings Center 2.0 integration for the
 * independent Today's Balance / Library Overview visual category controls.
 *
 * The v508-v513 implementation registered a v220 HTML renderer even though the
 * current Settings Center uses v221 + v348 and the v365/v366 registration path.
 * That replaced the canonical renderer and made the new sections unavailable
 * to Settings Center navigation, search and the mobile layout.
 *
 * This module is deliberately loaded after v508; it retains existing
 * v508Panels settings, update/recovery controls and all cloud backup fields.
 */
const MF514_SETTINGS_SECTIONS=Object.freeze([
  {
    id:'v221-settings-today-s-balance',
    title:"TODAY'S BALANCE",
    category:'dashboard',
    subgroup:'Balance & Visibility',
    keywords:['today balance','category visibility','health scope','dashboard','show hide reorder','follow categories']
  },
  {
    id:'v221-settings-library-overview-display',
    title:'LIBRARY OVERVIEW DISPLAY',
    category:'library',
    subgroup:'Overview & Display',
    keywords:['library overview','categories','order','visibility','show hide','custom','follow dashboard']
  },
  {
    id:'v221-settings-pwa-update-recovery',
    title:'PWA UPDATE RECOVERY',
    category:'app',
    subgroup:'Updates & Installation',
    keywords:['service worker','stuck update','force update','refresh app','install']
  }
]);
// v221Slug("TODAY'S BALANCE") produces "today-s-balance".
if(typeof v366RegisterSection==='function'){
  for(const section of MF514_SETTINGS_SECTIONS)v366RegisterSection(section);
}
if(typeof v366RegisterSetting==='function'){
  const inputs=[
    ['today-balance-visible','v221-settings-today-s-balance','[data-mf508-panel="todayBalance"] .mf508-master','Show Today’s Balance'],
    ['today-balance-source','v221-settings-today-s-balance','[data-mf508-panel="todayBalance"] .mf508-field','Today’s Balance category source'],
    ['today-balance-insights','v221-settings-today-s-balance','[data-mf508-panel="todayBalance"] .mf508-footnote','Balance insights category scope'],
    ['overview-visible','v221-settings-library-overview-display','[data-mf508-panel="libraryOverview"] .mf508-master','Show Library Overview'],
    ['overview-source','v221-settings-library-overview-display','[data-mf508-panel="libraryOverview"] .mf508-field','Library Overview category source']
  ];
  for(const [id,section,selector,label] of inputs)
    v366RegisterSetting({id,section,selector,label,keywords:[label,'visual categories','category order']});
}
const mf514PreviousSettingsRenderer=V219_PAGE_RENDERERS.get('settings');
if(typeof mf514PreviousSettingsRenderer!=='function')
  throw new Error('MediaFlow v514: canonical Settings page renderer unavailable');
MediaFlowRuntime.registerPageRenderer('settings',function(){
  // Keep v348 XP, v335 and all later Settings features; do not call the
  // obsolete v220 renderer or reconstruct the Settings page ourselves.
  const markup=String(mf514PreviousSettingsRenderer.apply(this,arguments)||'');
  if(markup.includes('data-mf508-panel="todayBalance"')&&
     markup.includes('data-mf508-panel="libraryOverview"'))return markup;
  const marker='<div id="v221-settings-empty"';
  const at=markup.indexOf(marker);
  if(at<0)throw new Error('MediaFlow v514: v221 Settings content anchor missing');
  const inserts=
    '<div class="section-label mf508-settings-heading">TODAY\'S BALANCE</div>'+
    mf508PanelHtml('todayBalance')+
    '<div class="section-label mf508-settings-heading">LIBRARY OVERVIEW DISPLAY</div>'+
    mf508PanelHtml('libraryOverview')+
    '<div class="section-label mf508-settings-heading">PWA UPDATE RECOVERY</div>'+
    '<div class="card mf514-update-recovery"><b>App update stuck?</b>'+
      '<p class="hint">Safely request the latest deployed app without deleting locally stored Library, settings or History.</p>'+
      '<button type="button" class="btn btn-primary" onclick="App.mf510ForcePwaRefresh()">Force latest app update</button></div>';
  return markup.slice(0,at)+inserts+markup.slice(at);
});
// Make the configured balance-scope switch functional WITHOUT changing the
// consumption/time totals, XP, or scheduler. It controls only the additional
// Today/Overall health-summary counts; the category rows remain visual.
const mf514OriginalBalanceMarkup=v264BalanceMarkup;
v264BalanceMarkup=function(){
  const existing=String(mf514OriginalBalanceMarkup.apply(this,arguments)||'');
  return existing+mf508HealthSummaryHtml(mf508VisibleCategories('todayBalance'));
};
window.MediaFlowV514=Object.freeze({
  version:514,
  settingsSections:MF514_SETTINGS_SECTIONS.map(x=>x.id),
  inspect:()=>({
    settingsRendererActive:V219_PAGE_RENDERERS.get('settings')!==mf514PreviousSettingsRenderer,
    sectionIds:MF514_SETTINGS_SECTIONS.map(x=>x.id),
    todayBalance:mf508Ensure().todayBalance,
    libraryOverview:mf508Ensure().libraryOverview,
    todayCategoryIds:mf508VisibleCategories('todayBalance').map(c=>String(c.id)),
    overviewCategoryIds:mf508VisibleCategories('libraryOverview').map(c=>String(c.id))
  })
});
