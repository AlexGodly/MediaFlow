/* MediaFlow v396 — Advanced Logging card decoration reliability.
 * v394 re-renders ONE title after method/quantity/time/runtime edits. That
 * replacement loses the v373 drag/numeric/arrow toolbar, previously attached
 * only during full list decoration. Re-decorate the still-mounted list after
 * the new card is inserted, preserving indexes, custom order and scroll.
 */
const V396_RELEASE=396;
const v396PaintBase=v394Paint;
v394Paint=function(index){
  const result=v396PaintBase.apply(this,arguments);
  const form=document.querySelector('.log-form.mf373-logging');
  if(form){
    // v373DecorateList is idempotent and its ordering pass is protected by
    // the existing v387 viewport/focus guard. Never add another toolbar.
    v373DecorateList(form);
  }
  return result;
};
// Keep the standalone title-decoration API safe for card replacement after
// other existing title refresh pathways, not only the v394 method switch.
const v396RefreshPanelsBase=v369RefreshPanels;
v369RefreshPanels=function(){
  const result=v396RefreshPanelsBase.apply(this,arguments);
  const form=document.querySelector('.log-form.mf373-logging');
  if(form)v373DecorateList(form);
  return result;
};
window.MediaFlowV396={version:396,features:[
  'Restored unified Advanced Logging progress preview',
  'Order controls retained after per-title method, time and runtime edits',
  'Order decoration after draft refreshes'
]};
MediaFlowRuntime.version=V396_RELEASE;
