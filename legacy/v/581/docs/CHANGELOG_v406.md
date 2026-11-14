# MediaFlow v406 — The Smart Filters & Organization Update

**Version:** 406 Modular  
**Baseline:** MediaFlow v405 Modular  
**Date:** October 13, 2026  
**Developer:** Alex Godly  
**Database migration:** None  
**Deployment:** Not included

## 1. Summary

v406 adds context-aware Show filters to Personal Order and Logging, and replaces the three bulk-action native selects in Library and Collections with searchable, icon-aware pickers respecting the user's existing Set Category, Set Status and Set Priority preferences. Existing title and collection data models, ordering, XP, logging submission, and cloud schemas remain unchanged.

## 2. Personal Order → Add Titles

- **Tools & Filters → Show:** All titles / Not added / Already added.
- Membership compares each Library title against the actual `v138EnsureOrderPlan().titleIds` queue.
- Applying filters happens before the existing candidate paginator, preserving page counts and selection handlers.
- After adding/removing a title, the picker reads live queue membership; no independent copied membership data is stored.
- The existing sorting, search, view modes, and multi-selection workflows remain authoritative.

## 3. Personal Order → Add Collections

- **Tools & Filters → Show:** All collections / Not added / Already added.
- Membership is measured **within the selected Personal Order assignment category**, not simply against the main Collections database or all other assignment categories.
- The live assignment list is read through `v287Assignments(categoryId)`.
- Filtering precedes the existing `v359CollectionPageData()` paginator and leaves manual assignments and collection ordering intact.

## 4. Logging → Library

- **Tools & Filters → Show:** All titles / Not added / Already added.
- Membership is measured only against entries in the **current unsubmitted Logging draft** via `v378AddedIds()`.
- Previously logged History and membership in the main Library do not count as currently added.
- Existing Quick, Advanced and itemized Logging add/remove, sorting, search, selection and pagination functions remain in place.
- The Show filter changes only visibility; it never removes History, draft entries or titles by itself.

## 5. Searchable Library & Collections bulk actions

These three original native action selects are upgraded, without replacing their existing mutation and confirmation handlers:

| Bulk action | New interface | Ordering configuration |
| --- | --- | --- |
| Move to category | Searchable dropdown, actual category icons | Settings → Set Category |
| Set status | Searchable dropdown, existing semantic status icons | Settings → Set Status |
| Set priority | Searchable dropdown, existing priority icons | Settings → Set Priority |

**Surfaces:** Library Normal, Library Dynamic, and Collections detail bulk toolbar.

- Search filters options in place, with no page rerender or input focus loss.
- Menu content follows `v230VisibleIds('setCategory' / 'setStatus' / 'setPriority')`, including saved custom order and visibility settings.
- Category icons render through the existing `v144CategoryIconHtml`; Status/Priority icons use canonical `v230StatusIcon` and `v230PriorityIcon`.
- The same existing `App.batchLibrary*` and `App.v274BatchCollection*` handlers perform final changes, preserving confirmation/History/undo flows.
- The menu is keyboard-operable, supports Escape, closes on outside click, and uses a viewport-positioned panel to avoid clipped mobile batch toolbar dropdowns.
- No settings or new cloud fields were added: the update reads the user's existing persisted choice-order settings.

## 6. Source changes

- **New:** `src/js/components/299-v406-smart-filters-actions.js` — membership filtering, Tool & Filter controls, searchable bulk action menus, and existing action delegation.
- **New:** `assets/css/218-v406-smart-filters-actions.css` — responsive, theme-aware styles and overflow-safe popup presentation.
- **Updated:** `src/js/runtime-order.json` — append the v406 runtime extension.
- **Updated:** `index.html` — load v406 stylesheet and generated bundle.
- **Updated:** `VERSION`, `version.json`, `package.json` — v406 metadata.
- **Regenerated:** `assets/js/mediaflow-v406.bundle.js` and `sw.js` PWA shell with v406 asset references.
- **Updated:** `README.md` Evolution section only and `README2.md` technical notes.

## 7. Local verification

**Completed checks:**

- Python modular build and Node JavaScript syntax check — **PASS**.
- Automated headless Chromium script injection at **320, 390, 820 and 1280px** — **PASS** (no JavaScript errors in the isolated runtime fixture).
- Status ordering override: `Dropped → Completed → Watching ...` — **PASS**.
- Priority order override: `High → Low → Medium` — **PASS**.
- Category order override: `Movies → Anime` — **PASS**.
- Search `mov` narrows two categories to one visible option without rebuilding picker DOM — **PASS**.
- Personal Order Add Titles membership (`All`, `Not added`, `Already added`) — **PASS** with a two-title controlled fixture.
- Personal Order Add Collections membership scoped to a selected assignment category — **PASS** with a two-collection controlled fixture.
- Logging Library membership scoped to current unsaved Logging draft — **PASS** with a two-title controlled fixture.
- Collections toolbar outputs three searchable bulk controls — **PASS**.
- Inherited v405 synthetic export/cloud snapshot/History test preserved **1,555 History events** without clipping; no XP ledger mutation — **PASS** in the local simulated environment.
- v406 PWA generation produced a manifest-aligned app shell and cache identity. Older v405-specific PWA scripts that hard-code release 405 require updated expectations and are not counted as v406 passes.

**Limits:** Browser injection fixtures run independently of real authentication and live cloud data. Full authenticated end-to-end workflow testing, installed PWA updates on physical devices, and live Supabase account synchronization were **not performed**. The isolated Library fixture did not fully initialize all legacy dashboard/library state required to render the complete Library page; the bulk-action markup was verified separately. Release-wide performance under real 100,000-title Libraries was not benchmarked for this v406 change. This release does not assert that all old known performance issues are eliminated.

## 8. Compatibility and preservation

v406 makes **no database schema changes** and introduces **no new persistent user data fields**. Membership filters are ephemeral display preferences in the current picker session. Existing category/status/priority ordering lives in the preexisting settings model and continues to participate in its established cloud, Full Data, preset export/import and backup mechanisms. All existing title, collection, Personal Order, Logging, and Fresh Episodes data structures are preserved. The original Automatic Multi-Provider mode and Alex Godly's Smart Fresh Episodes Engine remain unchanged. Paused community, Discord and media-service tracking integrations remain paused.

**MediaFlow v406 — The Smart Filters & Organization Update**  
*Developed by Alex Godly.*
