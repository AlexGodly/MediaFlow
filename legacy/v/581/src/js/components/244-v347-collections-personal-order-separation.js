/* MediaFlow v347 — Keep Personal Order Lists/Tabs solely in Personal Order.
 * Collections is for collection browsing/management, not the Personal Order
 * Category Titles / Collection Queues layout selector. Restoration is safe
 * even when a v345/v346 account previously chose Collections Tabs mode.
 */
const V347_RELEASE=347;
// v345CollectionsBrowserBase is the untouched v274 browser captured before
// the v345 replacement; bypass the entire Collections-only toggle/workspace.
v274CollectionsBrowserHtml=function(){
  return v345CollectionsBrowserBase.apply(this,arguments);
};
// Backwards-compatible shortcut: open the Collection Queues tab in Personal
// Order rather than re-enabling a queue layout inside Collections.
App.v345OpenQueueTabs=async function(){
  v345UI().main='collections';
  const view=v288EnsureQueueView();
  if(view.layoutMode!=='tabs')await App.v345SetLayout('tabs');
  if(S.view!=='order')App.setView('order');
  else render();
};
MediaFlowRuntime.version=V347_RELEASE;
window.MediaFlowV347={version:347,features:['Collections browser restored to original layout','Queue tabs available only in Personal Order','Previous Collections Tabs preference safely ignored']};
