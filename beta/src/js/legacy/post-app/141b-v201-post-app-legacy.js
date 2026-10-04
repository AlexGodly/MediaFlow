
/* v50 one-time Library History integrity migration.
   Exact IDs only. Ambiguous/unsafe legacy entries are left unlinked. */
setTimeout(async()=>{
  try{
    if(!S.migrations?.libraryHistoryExactIdsV50?.done){
      const r=v50MigrateLibraryHistoryLinks();
      if(r.linked>0) await saveState();
      if(S.view==='libraryhistory') render();
      console.info(`MediaFlow v63: linked ${r.linked} legacy Library History entr${r.linked===1?'y':'ies'} by exact unique title.`);
    }
  }catch(e){console.warn('MediaFlow v63 Library History migration skipped:',e);}
},0);


/* MediaFlow v63
   Global dropdown styling is CSS-driven, so all current and future native
   <select> controls automatically inherit the designed theme-aware UI. */


/* MediaFlow v63 — Large Library Performance Update
   - debounced Library search
   - cached normalized title index
   - cached filter/sort results
   - one-pass Library overview aggregation
   - one-pass History last-touched index
   - reduced offscreen row painting */


/* MediaFlow v63 — Library Search Focus Hotfix
   Debounced search now restores focus and caret after the Library DOM refresh,
   allowing uninterrupted typing while retaining v53 performance optimizations. */

/* MediaFlow v63 — Platform Theme Collection
Separate MediaFlow and Platform theme selectors. Platform themes are MediaFlow palette interpretations inspired by the named services; no third-party logos/assets/layouts are copied. */
/* MediaFlow v63 — v56 Loading Hotfix + Profile Picture URL
   Rebuilt from the stable v55 base. The URL-avatar feature is isolated to the
   Profile Settings action and performs no image/network work during app startup. */
/* MediaFlow v63 — Stopwatch Full Time Adjustment
   Adds Minus time alongside Set time and Add time. Entered H/M/S can be
   repeatedly added or subtracted, never going below 00:00:00. The resulting
   value becomes the reset/start value and can be started normally. */
/* MediaFlow v63 — Actual Consumption Category Integrity
   Logging titles from categories different from the scheduler recommendation now
   credits History, category balance, health, XP and the next rotation to the
   categories actually consumed. The originally assigned category is preserved
   as metadata instead of being falsely credited as completed. Mixed-category
   logs are split into category-correct linked session records. */

/* MediaFlow v63 — Batch Logging & Recommendation Status Refinement
   Batch Log records multiple Library titles with independent amounts/minutes and
   feeds the same sessions-based scheduler, health, statistics, XP and progresssystems. Recommendation statuses now describe recommendation fulfillment only:
   Complete / Partial / Over / Skipped. Off-category and batch consumption uses
   Logged, while a fully missed recommendation receives a zero-consumption Skipped
   record so it is never falsely credited. */

/* MediaFlow v63 — Dedicated Batch Logging
   Adds a visible Batch Log navigation page with multi-title rows, automatic
   Library category detection, independent amount/minutes, date and note,
   Logged status for non-recommendation consumption, Library progress and
   completion updates, XP, History, Statistics, and scheduler balance/health
   integration. Recommendation statuses remain Complete/Partial/Over/Skipped. */

/* MediaFlow v63 — Searchable Responsive Batch Logging
   Batch Log now uses type-to-search Library title selection across all categories,
   responsive phone/tablet cards with no horizontal row scrolling, and explicitly
   updates each selected title's Library progress on submission. */

/* MediaFlow v63 — Mobile Navigation & Statistics Responsiveness
   Replaces the overcrowded mobile tab bar with five always-visible primary tabs
   plus a More menu for Library History, Profile and Settings. Statistics charts,
   cards, progress tracks and record rows now shrink/wrap cleanly on phones and
   tablets without pushing Settings off-screen or requiring horizontal scrolling. */
/* MediaFlow v64 — Classic Mobile Bottom Menu Design
   Preserves every v63 responsiveness/navigation fix while restoring the
   original pre-v63 visual design for the mobile bottom menu. The More fallback
   remains available when all destination tabs cannot fit safely. */

/* MediaFlow v65 — Mobile Bottom Navigation Visual Restoration
   Restyles the mobile bottom navigation to match the supplied reference:
   large outline icons above full labels on a clean flat bottom bar, with the
   active destination highlighted by the current theme accent. The v63
   responsive navigation logic and More fallback remain intact. */


