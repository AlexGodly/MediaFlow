/* ============================================================
   MediaFlow v139 — Prioritize Personal Order for recommendations
   ------------------------------------------------------------
   This feature is intentionally narrow:
   - category selection remains the normal MediaFlow scheduler;
   - suggested amount remains unchanged;
   - balance/health/reasons remain unchanged;
   - only the exact recommended title can be sourced from Personal Order;
   - if no eligible ordered title exists in the selected category, the
     original MediaFlow title scorer is used as fallback.
   ============================================================ */

App.togglePrioritizePersonalOrder=function(){
  S.settings=S.settings||{};
  S.settings.prioritizePersonalOrder=!S.settings.prioritizePersonalOrder;

  // If a task is already active and exact-title recommendations are enabled,
  // immediately refresh only its title recommendation. The task category,
  // amount, reasons, balance and other scheduler data are left untouched.
  if(S.sessionActive && S.currentTask && S.settings.exactTitleRecommendations){
    const cat=getCategory(S.currentTask.categoryId);
    const picked=cat?pickLibraryTitle(cat):null;
    S.currentTask.libraryId=picked?picked.id:null;
    S.currentTask.title=picked?cleanTitle(picked.title):null;
    persistTask();
  }

  persistSettings();
  render();
};



/* ============================================================
   MediaFlow v140 — Order Library picker controls
   ============================================================ */
Object.assign(App,{
  v140OrderSetFilter,
  v140OrderToggleCategory,
  v140OrderClearCategories,
  v140OrderClearFilters,
  v140OrderSetPage
});

// v138 exported these before v140 replaced their implementation.
// Rebind them so inline controls always use the current picker behavior.
App.v138OrderSearch=v138OrderSearch;
App.v138ToggleOrderPick=v138ToggleOrderPick;
App.v138AddSelectedOrderTitles=v138AddSelectedOrderTitles;
App.v138AddVisibleOrderTitles=v138AddVisibleOrderTitles;



