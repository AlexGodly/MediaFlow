/* MediaFlow v277 — responsive navigation breakpoint repair */
const V277_RUNTIME_VERSION=277;
let V277_NAV_FRAME=0;
function v277SyncNavigationMode(){
  if(V277_NAV_FRAME)return;
  V277_NAV_FRAME=requestAnimationFrame(()=>{
    V277_NAV_FRAME=0;
    const mobile=window.matchMedia?.('(max-width: 1080px)')?.matches ?? ((window.innerWidth||0)<=1080);
    document.documentElement.dataset.mfNavMode=mobile?'mobile':'desktop';
    if(!mobile){
      const menu=document.getElementById('mobile-more-menu');
      if(menu)menu.classList.add('hide');
      const more=document.querySelector('.mobile-more-wrap>.mtab[aria-expanded]');
      if(more)more.setAttribute('aria-expanded','false');
    }
    try{v276RefreshMobileNav?.();}catch(_){ }
  });
}
function v277AuditState(){
  let base={};
  try{base=v276AuditState()||{};}catch(_){ }
  return Object.assign({},base,{
    version:277,
    pwaRelease:277,
    responsiveNavBreakpoint:1080,
    mutuallyExclusiveNavigation:true,
    fixedCompactMobileTabbar:true
  });
}
Object.assign(App,{v277SyncNavigationMode,v277AuditState});
window.MediaFlowV277={version:277,focus:'Responsive navigation breakpoint and duplicate navigation repair'};
MediaFlowRuntime.version=V277_RUNTIME_VERSION;
window.addEventListener('resize',v277SyncNavigationMode,{passive:true});
window.addEventListener('orientationchange',v277SyncNavigationMode,{passive:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',v277SyncNavigationMode,{once:true});else v277SyncNavigationMode();
