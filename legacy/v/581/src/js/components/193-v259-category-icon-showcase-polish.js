/* ============================================================
   MediaFlow v259 — Built-in Category Icon Showcase Polish
   ------------------------------------------------------------
   - Removes visible names beneath packaged category artwork.
   - Removes the global neutral action icon above each artwork tile.
   - Keeps labels available through title/aria-label for accessibility.
   - Uses the same v258 icon selection/persistence behavior unchanged.
   ============================================================ */

const V259_RUNTIME_VERSION=259;

v258BuiltInCategoryIconPalette=function(selectedUrl){
  const selected=v258NormalizeBuiltInCategoryIcon(selectedUrl);
  return `<div class="v258-icon-library v259-icon-library" aria-label="MediaFlow built-in category icons">
    ${V258_BUILTIN_CATEGORY_ICONS.map(icon=>`<button type="button" class="v258-icon-choice ${selected===icon.src?'selected':''}" data-v225-iconified="1" data-v258-category-icon="${escapeHtml(icon.src)}" onclick="App.v258PickBuiltInCategoryIcon(this.dataset.v258CategoryIcon)" title="${escapeHtml(icon.label)}" aria-label="${escapeHtml(icon.label)}">
      <span class="v258-icon-choice-art"><img src="${escapeHtml(icon.src)}" alt="" loading="lazy"></span>
    </button>`).join('')}
  </div>`;
};

MediaFlowRuntime.version=V259_RUNTIME_VERSION;
