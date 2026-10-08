/* MediaFlow v319 — exactly one refresh icon per Community Refresh now action.
 * v225/v226 automatically inject button icons. v317 also authored an SVG, so
 * the v226 semantic pass accidentally added a second one. Normalize only the
 * four Community Refresh now actions, without changing their click handlers. */
const MF319_REFRESH_SVG='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.4 6"/><path d="M20 4v7h-7"/></svg>';
function mf319IsCommunityRefresh(el){
 if(!el?.matches?.('#mf302-root button'))return false;
 if(el.matches('[data-mf317-refresh="browse"], [data-mf317-refresh="collections"], [data-mf317-refresh="users"]'))return true;
 return el.matches('.mf312-ratings-freshness [data-mf311-action="retry"]')&&el.textContent.trim()==='Refresh now';
}
function mf319EnsureSingleRefreshIcon(el){
 // Remove ONLY icons inserted by the v225/v226 automatic icon enhancers.
 el.querySelectorAll(':scope > .v225-btn-icon').forEach(icon=>icon.remove());
 // Preserve the existing authored refresh icon, adding one to Ratings when the
 // button originally contained plain text. Extra authored SVGs are redundant.
 const authored=[...el.querySelectorAll(':scope > svg')];
 authored.slice(1).forEach(icon=>icon.remove());
 if(!authored.length)el.insertAdjacentHTML('afterbegin',MF319_REFRESH_SVG);
 el.classList.remove('v225-icon-button');
 el.classList.add('mf319-single-refresh-icon');
 el.dataset.v225Iconified='1';
 el.dataset.v226SemanticIcon='community-custom';
}
const mf319PreviousSemanticIcon=v226RefreshSemanticButtonIcon;
v226RefreshSemanticButtonIcon=function(el){
 if(mf319IsCommunityRefresh(el)){
  mf319EnsureSingleRefreshIcon(el);
  return;
 }
 return mf319PreviousSemanticIcon(el);
};
// Normalize controls already on screen, and let the existing v226 MutationObserver
// perform the same normalization when any Community view renders again.
v226RefreshSemanticButtonIcons(document);
window.MediaFlowCommunity=Object.assign(window.MediaFlowCommunity||{}, {version:319,communitySingleRefreshIcons:true});
