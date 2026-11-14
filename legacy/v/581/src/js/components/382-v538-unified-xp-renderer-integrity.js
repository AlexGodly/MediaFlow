/* MediaFlow v538 — ensure v537 unified XP preview is really rendered.
 * Fix the v537 old-card fallback visible on mobile even when release metadata
 * says up to date. Neither projection nor DOM repair writes saved data. */
const MF538_VERSION=538;
function mf538RenderXP(){
  try{
    if(typeof mf537XPCardMarkup!=='function')throw Error('Unified reward engine unavailable');
    const html=mf537XPCardMarkup();
    if(typeof html!=='string'||!html.includes('mf537-xp-card'))
      throw Error('Unified XP card was not produced');
    return html;
  }catch(error){
    console.warn('MediaFlow unified XP preview could not render',error);
    return '<div class="mf537-preview-error" role="status">Reward preview unavailable. Your saved XP and draft are safe; try refreshing the Logging preview.</div>';
  }
}
function mf538ApplyLiveXP(){
  const el=document.getElementById('xp-preview');
  if(!el||!S.logDraft)return false;
  const details=el.querySelector?.('.mf537-xp-details');
  const wasExpanded=!!details?.open;
  el.classList.add('mf382-xp-host');
  el.removeAttribute('style');
  const markup=mf538RenderXP();
  if(el.innerHTML!==markup)el.innerHTML=markup;
  if(wasExpanded){
    const next=el.querySelector?.('.mf537-xp-details');
    if(next)next.open=true;
  }
  return !!el.querySelector?.('.mf537-xp-card');
}
// The old preview refresh was still allowed to paint a v382 card. Finalize
// every refresh in the actual DOM rather than trusting chained assignments.
v382UpdateXPPreview=mf538ApplyLiveXP;
// Other extensions render a Logging form from HTML strings. Audit its actual
// output once at the end, and replace a stray old card before it reaches DOM.
const mf538RenderLogFormBase=renderLogForm;
renderLogForm=function(){
  const html=String(mf538RenderLogFormBase.apply(this,arguments)||'');
  if(!S.logDraft||html.includes('mf537-xp-card')||!html.includes('id="xp-preview"'))return html;
  try{
    const host=document.createElement('div');
    host.innerHTML=html;
    const preview=host.querySelector('#xp-preview');
    if(!preview)return html;
    preview.classList.add('mf382-xp-host');
    preview.removeAttribute('style');
    preview.innerHTML=mf538RenderXP();
    return host.innerHTML;
  }catch(error){
    console.warn('MediaFlow Logging preview HTML repair failed',error);
    return html;
  }
};
App.v538VerifyXPPreview=function(){
  const container=document.getElementById('xp-preview');
  return {release:MF538_VERSION,runtimeLoaded:true,unifiedEngine:typeof mf537ProjectXP==='function',
    previewPresent:!!container,unifiedVisible:!!container?.querySelector?.('.mf537-xp-card'),
    oldCardVisible:!!container?.querySelector?.('.mf382-xp-card')};
};
window.MediaFlowV538=Object.freeze({version:MF538_VERSION,repair:mf538ApplyLiveXP,
  diagnostics:App.v538VerifyXPPreview});
MediaFlowRuntime.version=MF538_VERSION;
