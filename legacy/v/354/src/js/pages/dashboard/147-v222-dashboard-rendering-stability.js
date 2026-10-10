/* ============================================================
   MediaFlow v222 — Dashboard Rendering Stability
   ------------------------------------------------------------
   Fixes a rare Chromium/GPU paint artifact around the rotating On This Day
   card. The underlying Dashboard behavior and data are unchanged.
   ============================================================ */

function v222StabilizeDashboardPaint(){
  if(String(S.view||'')!=='dashboard')return;
  const details=document.querySelector('.on-this-day.v126-otd, .v126-otd');
  if(!details)return;

  /* Mark the live card so CSS and diagnostics can confirm the guard is active. */
  details.dataset.mfPaintGuard='222';

  /* Bind once. Opening/closing the details element is the exact transition that
     used to clear the artifact manually; schedule a clean layout/paint after it. */
  if(details.dataset.mfPaintGuardBound!=='1'){
    details.dataset.mfPaintGuardBound='1';
    details.addEventListener('toggle',()=>{
      requestAnimationFrame(()=>{
        if(!details.isConnected)return;
        void details.offsetHeight;
        details.dataset.mfPaintEpoch=String((Number(details.dataset.mfPaintEpoch)||0)+1);
      });
    },{passive:true});
  }

  /* A layout read after rotating the hero prevents a stale cover texture from
     surviving into the next compositor frame on affected Chromium builds. */
  void details.offsetHeight;
}

/* Normal Dashboard renders still use all existing legacy wrappers. We only add
   a post-render paint guard; no renderer is replaced. */
const v222RenderViewBase=renderView;
renderView=function(){
  const result=v222RenderViewBase.apply(this,arguments);
  if(String(S.view||'')==='dashboard')setTimeout(v222StabilizeDashboardPaint,0);
  return result;
};

/* On This Day rotates its hero independently of a full page render, so repaint
   the card after a rotation as well. */
if(typeof v159ApplyOtdHero==='function'){
  const v222ApplyOtdHeroBase=v159ApplyOtdHero;
  v159ApplyOtdHero=function(){
    const result=v222ApplyOtdHeroBase.apply(this,arguments);
    if(String(S.view||'')==='dashboard')requestAnimationFrame(v222StabilizeDashboardPaint);
    return result;
  };
}

App.v222StabilizeDashboardPaint=v222StabilizeDashboardPaint;
MediaFlowRuntime.version=222;
