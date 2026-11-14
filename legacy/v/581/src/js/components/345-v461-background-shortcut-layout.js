/* MediaFlow v461 — honor the background widget shortcut's own eye artwork.
 * v226's semantic pass otherwise injects a second "Show/Hide" eye before it,
 * squeezing the label in the compact action sheet. All jobs remain untouched.
 */
const MF461_VERSION=461;
const mf461PreviousButtonIconName=v225ButtonIconName;
v225ButtonIconName=function(el){
 if(el?.matches?.('.mf460-widget-action'))return null;
 return mf461PreviousButtonIconName.apply(this,arguments);
};
window.MediaFlowV461=Object.freeze({version:MF461_VERSION,shortcutSelector:'.mf460-widget-action'});
MediaFlowRuntime.version=MF461_VERSION;
