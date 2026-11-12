/* ============================================================
   MediaFlow v298 — Full-width, Responsive Premium Auth UI Repair
   ============================================================ */
const V298_RUNTIME_VERSION=298;

// The legacy global icon pipeline adds icons by reading button text. Auth
// controls already contain correct, purposeful SVGs; never inject a second
// icon into them. This also corrects duplicate eye icons on password fields.
const v298IconEligibleBase=v225IconEligible;
v225IconEligible=function(el){
  if(el?.closest?.('.v297-auth-screen,#v297-transient-modal'))return false;
  return v298IconEligibleBase(el);
};
const v298ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(el?.closest?.('.v297-auth-screen,#v297-transient-modal'))return null;
  return v298ButtonIconNameBase(el);
};

const v298RenderAuthBase=renderAuthScreen;
renderAuthScreen=function(){
  v298RenderAuthBase.apply(this,arguments);
  const hero=document.querySelector('.v297-auth-hero');
  if(!hero)return;
  hero.innerHTML=`
    <div class="v298-hero-orbit" aria-hidden="true">
      <span class="v298-orbit-core"></span>
      <span class="v298-orbit-track"></span>
      <span class="v298-orbit-light"></span>
    </div>
    <div class="v298-hero-waves" aria-hidden="true"></div>
    <div class="v298-hero-copy">
      <div class="v298-hero-heading">Your media.<span>Everywhere you are.</span></div>
      <div class="v298-hero-tagline">SYNC <span>·</span> ORGANIZE <span>·</span> ENJOY</div>
    </div>`;
  // A v225 icon update may have been queued before an auth transition.
  document.querySelectorAll('.v297-auth-screen .v225-btn-icon').forEach(x=>x.remove());
};
window.MediaFlowAuth.show=renderAuthScreen;
// Startup may have rendered authentication before this late runtime override;
// repaint that already-mounted screen once, without touching signed-in pages.
if(document.querySelector('.v297-auth-screen'))renderAuthScreen(AUTH_MODE);

// Modal content is also icon-complete. Prevent re-iconifying its controls
// when a background observer refreshes button icons.
const v298InjectModalBase=v297InjectTransientModal;
v297InjectTransientModal=function(inner){
  v298InjectModalBase(inner);
  document.querySelectorAll('#v297-transient-modal .v225-btn-icon').forEach(x=>x.remove());
};

window.MediaFlowV298={
  version:V298_RUNTIME_VERSION,
  focus:'Responsive full-width premium auth layout, non-overflowing hero, single password visibility icon, global semantic-icon isolation'
};
MediaFlowRuntime.version=V298_RUNTIME_VERSION;

