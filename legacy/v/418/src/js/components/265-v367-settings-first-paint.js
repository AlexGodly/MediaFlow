/* MediaFlow v367 — Settings Center 2.0: first-paint invariant.
 * Main correction is in the v219 registered page renderer: Settings enhancers
 * now execute synchronously. This final guard also covers future wrappers of
 * renderView that might insert a canonical Settings page without enhancers.
 * Never hide the page behind a splash/skeleton: actual Settings Center content
 * is assembled and displayed in the same task. */
const V367_RELEASE=367;
const v367RenderViewBase=renderView;
renderView=function(){
  const result=v367RenderViewBase.apply(this,arguments);
  if(String(S.view||'')==='settings'){
    const page=document.querySelector('#view-root .v221-settings-page');
    if(page&&!page.classList.contains('mf365-settings-center')){
      // Some previous releases and future render wrappers can bypass the v219
      // renderer. Try the complete canonical enhancer sequence synchronously.
      // The v365 guard ensures control nodes are not duplicated.
      v219RunPageEnhancers('settings');
    }
  }
  return result;
};
MediaFlowRuntime.version=V367_RELEASE;
window.MediaFlowV367={version:367,features:[
  'Settings Center 2.0 built synchronously before first paint',
  'No visible legacy Settings transition on navigation or rerender',
  'Fallback enhancer guard for alternate Settings rendering paths'
]};
