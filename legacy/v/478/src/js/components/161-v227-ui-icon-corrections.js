/* ============================================================
   MediaFlow v227 — UI Icon Corrections + Dashboard Cover Cleanup
   ------------------------------------------------------------
   - Makes Add/Minus time icon treatment consistent.
   - Gives Low/Medium/High priority controls distinct icons.
   - Keeps category-choice controls free of redundant global icons.
   - Fixes Show/Hide switch icons so they remain fully visible.
   - Adds clear Automatic / Manual mode icons.
   - Removes global action icons from Dashboard poster placeholders.
   - Exempts the Dynamic category-row icon selector from dropdown icons.
   ============================================================ */

const V227_RUNTIME_VERSION=227;

Object.assign(V225_BUTTON_ICONS,{
  // Match the existing Add Time plus: plain symbol, no surrounding circle.
  minus:v225IconSvg('<path d="M5 12h14"/>'),
  priorityLow:v225IconSvg('<path d="M12 4v16"/><path d="m7 15 5 5 5-5"/><path d="M6 7h12"/>'),
  priorityMedium:v225IconSvg('<path d="M6 9h12M6 15h12"/>'),
  priorityHigh:v225IconSvg('<path d="M12 20V4"/><path d="m7 9 5-5 5 5"/><path d="M6 17h12"/>'),
  automatic:v225IconSvg('<path d="M20 7h-5V2"/><path d="M20 7a8 8 0 0 0-13.7-2.6L4 7"/><path d="M4 17h5v5"/><path d="M4 17a8 8 0 0 0 13.7 2.6L20 17"/><path d="M12 8v4l3 2"/>'),
  manual:v225IconSvg('<path d="M8 11V6a2 2 0 0 1 4 0v4"/><path d="M12 10V5a2 2 0 0 1 4 0v6"/><path d="M16 11V8a2 2 0 0 1 4 0v5c0 5-3 8-8 8H9c-2 0-3.5-1-4.5-2.5L2.8 16a2 2 0 0 1 3.2-2.3L8 15"/>')
});

const v227ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(!el)return null;
  const t=v225CleanActionText(el);
  const click=String(el.getAttribute?.('onclick')||'').toLowerCase();
  const aria=String(el.getAttribute?.('aria-label')||'').trim().toLowerCase();

  // Dashboard poster/cover placeholders are visual title covers, not action
  // buttons. Never overlay the global action icon on top of their artwork.
  if(el.matches?.('.v123-rating-placeholder,.v186-rating-placeholder-button,.v192-cover-placeholder'))return null;

  // Category choices already show the category's own identity/icon. A second
  // generic button icon only creates noise.
  if(el.matches?.('.category-choice'))return null;

  // Priority picker: each level gets a distinct semantic indicator.
  if(el.matches?.('.priority-choice')){
    if(/['\"]low['\"]/.test(click)||/^low\b/.test(t))return 'priorityLow';
    if(/['\"]medium['\"]/.test(click)||/^medium\b/.test(t))return 'priorityMedium';
    if(/['\"]high['\"]/.test(click)||/^high\b/.test(t))return 'priorityHigh';
  }

  // Most switches intentionally remain icon-free. Visibility switches are the
  // exception requested in v227, and CSS reserves a dedicated side of the
  // switch so the eye/eye-off icon is never hidden under the knob.
  if(el.matches?.('.toggle')){
    if(/^show\b/.test(aria))return 'show';
    if(/^hide\b/.test(aria))return 'hide';
    return null;
  }

  return v227ButtonIconNameBase(el);
};

/* Dynamic category-row icon mode is already self-explanatory from its label
   and selected value. Keep this one category selector clean and icon-free. */
const v227EnhanceDropdownBase=v226EnhanceDropdown;
v226EnhanceDropdown=function(el){
  v227EnhanceDropdownBase(el);
  if(el?.matches?.('select[aria-label="Dynamic Library category row icons"]')){
    delete el.dataset.v226DropdownIcon;
    el.style.removeProperty('--v226-dropdown-icon');
    el.classList.add('v227-dropdown-no-leading-icon');
  }
};

/* Automatic/Manual are state labels rather than ordinary buttons, so add their
   semantic icons directly to the final seasonal settings HTML. */
const v227SeasonalSettingsHtmlBase=v166SeasonalSettingsHtml;
v166SeasonalSettingsHtml=function(){
  let h=v227SeasonalSettingsHtmlBase.apply(this,arguments);
  h=h.replace(
    '<span class="pill">Automatic · Jikan</span>',
    `<span class="pill v227-mode-pill v227-mode-pill-auto">${V225_BUTTON_ICONS.automatic}<span>Automatic · Jikan</span></span>`
  );
  h=h.replace(
    '<span class="pill">Manual</span>',
    `<span class="pill v227-mode-pill v227-mode-pill-manual">${V225_BUTTON_ICONS.manual}<span>Manual</span></span>`
  );
  return h;
};

/* Re-run the semantic pass so controls already present when v227 loads have
   v226's old generic icon replaced/removed immediately. */
function v227RefreshIconsAndDropdowns(){
  try{v226EnhanceDropdowns(document);}catch(_){ }
  try{v226RefreshSemanticButtonIcons(document);}catch(_){ }
}

requestAnimationFrame(v227RefreshIconsAndDropdowns);
Object.assign(App,{v227RefreshIconsAndDropdowns});
MediaFlowRuntime.version=V227_RUNTIME_VERSION;
