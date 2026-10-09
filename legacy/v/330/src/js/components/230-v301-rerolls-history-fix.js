/* ============================================================
   MediaFlow v301 — Stable v298 Restoration + Current Rerolls UI
   ------------------------------------------------------------
   This release intentionally starts from v298; Logging Intensity from
   v299/v300 is NOT part of v301. No changes to recommendation logic,
   cover preferences, XP, History, or cloud state.
   ============================================================ */
const V301_RUNTIME_VERSION=330;

// The existing reroll-history renderer is the single source of truth for
// recommendations, Respect slots, title covers and Edit actions. Decorate
// only its modal presentation for accessibility and scalable long lists.
const v301RerollsHistoryHtmlBase=v180RerollHistoryHtml;
v180RerollHistoryHtml=function(){
  const html=v301RerollsHistoryHtmlBase.apply(this,arguments);
  const holder=document.createElement('div');
  holder.innerHTML=html;
  const modal=holder.querySelector('.v180-history-modal');
  if(!modal)return html;
  modal.classList.add('v301-rerolls-modal');
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');
  modal.setAttribute('aria-labelledby','v301-rerolls-heading');
  modal.setAttribute('tabindex','-1');
  const heading=modal.querySelector('.modal-title');
  if(heading)heading.id='v301-rerolls-heading';
  const list=modal.querySelector('.v180-history-list');
  if(list){
    list.classList.add('v301-rerolls-scroll');
    list.setAttribute('tabindex','0');
    list.setAttribute('role','region');
    list.setAttribute('aria-label','Current title reroll recommendations; scroll for more');
  }
  modal.querySelectorAll('.v180-history-copy b').forEach(title=>{
    title.setAttribute('title',title.textContent.trim());
  });
  return holder.innerHTML;
};

// Focus the actual scroll region so PageDown/arrow keys work too; native
// mouse-wheel/touch scrolling needs no custom preventDefault handlers.
const v301OpenRerollsBase=App.v180OpenRerollHistory;
App.v180OpenRerollHistory=function(){
  const out=v301OpenRerollsBase.apply(this,arguments);
  const overlay=document.getElementById('v180-reroll-history');
  if(overlay){
    overlay.classList.add('v301-rerolls-overlay');
    const list=overlay.querySelector('.v301-rerolls-scroll');
    try{ (list||overlay.querySelector('.v301-rerolls-modal'))?.focus({preventScroll:true}); }catch(_){}
    overlay.addEventListener('keydown',event=>{
      if(event.key==='Escape'){
        event.stopPropagation();
        App.v180CloseRerollHistory();
      }
    });
  }
  return out;
};
window.MediaFlowV301={version:V301_RUNTIME_VERSION,base:298,focus:'Current rerolls scrolling, dynamic cover sizes and responsive modal layout; no Logging Intensity'};
MediaFlowRuntime.version=V301_RUNTIME_VERSION;
