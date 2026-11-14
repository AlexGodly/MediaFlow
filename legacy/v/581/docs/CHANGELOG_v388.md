# MediaFlow v388 — Faster Logging Actions, Stable Dashboard Return & Title Save Optimization

**Application:** MediaFlow  
**Version:** v388 Modular  
**Baseline:** MediaFlow v387 Modular  
**Release date:** October 12, 2026  
**Developer:** Alex Godly  
**Release type:** Navigation bug fix, save-path consolidation, performance maintenance, regression testing  
**Status:** Built and locally tested; live account performance not verified

---

## 1. Problems reported

Closing the Dashboard Logging workspace, or clicking **Save & get next task**, could cause the Dashboard to appear scrolled far down rather than at the top near the next task. Both actions could also feel slow. The Add/Edit Title modal could take noticeable time to finish saving.

The existing code paths contain nested wrappers for Library metadata, Seasons View, External IDs, XP, completed-title rewards, Logging History, draft resume state and cloud persistence. One successful user action could trigger multiple complete view renders and request multiple full-state saves.

## 2. Dashboard return-scroll repair

- Added a scoped Dashboard-return viewport reset when **Cancel/Close Logging** or **Save & get next task** successfully closes the Logging workspace.
- Resets the document scroller and applicable themed app-shell scroll containers.
- Applies an immediate reset and a two-frame confirmation after the Dashboard is mounted, using nonanimated positioning.
- **Does not** reset scrolling if submission validation fails and Logging stays open.
- Does not change ordinary navigation scroll behavior or v387 Added Titles reorder scroll preservation.

## 3. Consolidated synchronous save actions

- A new bounded action transaction covers `App.submitLog()` and `App.saveLibraryModal()` only.
- Existing validation, XP calculations, Library mutations, completion/season logic, History generation and external-ID edits still execute synchronously through their established wrappers.
- Redundant full-view render requests made within a single action are merged into one final render **after all synchronous mutation wrappers complete**.
- `saveState()` requests made inside that same synchronous action are combined into one final serialized save request. The returned promises settle only after the actual save result, avoiding false optimistic cloud-save confirmation.
- Existing save-queue serialization, recovery behavior and cloud error handling remain active.
- The v285 local resume data is still written immediately; redundant v285/v155 deferred save timers from the action can be safely subsumed by the final complete-state save.
- Independent later saves triggered by unrelated actions or timers are not globally disabled or suppressed.

## 4. Faster Add/Edit Title modal path

- The v178 rich-editor, v252 Seasons View, and v377 External IDs wrappers no longer create and search full-Library ID sets merely to identify a newly appended title.
- Their successful-save/validation checks rely on the authoritative `S.modal` state, allowing the modal to render once after the entire save chain finishes.
- Preserves rich title metadata, Seasons View, manual External Media IDs, XP rewards, activity and undo data.
- Invalid external IDs still block saving, keep the editor open and do not generate a save request.
- These adjustments avoid unnecessary work on each save; no unverified percentage speedup is claimed.

## 5. Data integrity and compatibility

- No XP formulas, History schemas, Library formats, Per Unit draft formats, Personal Order, Collections, export/import formats, Supabase database tables, auth policies or Edge Functions were changed.
- Saving a log still generates the next task only after valid submission and retains all standard History, XP, progress and completion updates.
- The Dashboard scroll reset is presentation-only.

## 6. Technical changes

**New:** `src/js/components/283-v388-dashboard-log-title-save-performance.js`  
**Updated:** `src/js/components/186-v252-seasons-view.js`  
**Updated:** `src/js/pages/library/094-add-rich-fields-to-the-normal-library-editor.js`  
**Updated:** `src/js/components/273-v377-ids-editor-jikan-recovery.js`  
**Registered:** `src/js/runtime-order.json`  
**Tests:** `scripts/test-v388-save-dashboard.py`, `scripts/test-v388-order-compat.py`  
**Compiled bundle:** `assets/js/mediaflow-v388.bundle.js`  
**PWA cache:** `mediaflow-pwa-v388-shell-v1`  
**Metadata:** `VERSION`, `version.json`, `package.json`, `index.html`, `manifest.json`, `sw.js`  
**Documentation:** `README.md`, `README2.md`, `docs/CHANGELOG_v388.md`

## 7. Local testing

| Scenario | Result |
|---|---|
| Cancel Logging returns Dashboard to the top | Passed at five viewport widths |
| Save & get next task records History and returns to the top | Passed at five widths |
| Per Unit submission records History, advances contiguous Library progress, and returns to top | Passed at five widths |
| Add Title saves correct title and closes modal | Passed at five widths |
| Edit Title preserves updated title and closes modal | Passed at five widths |
| Invalid external ID preserves editor without saving | Passed at five widths |
| Coalesced save action with mocked storage | Passed in controlled tests |
| Previous Added Titles sort/drag/numeric scroll regression on v388 bundle | Passed at five widths |
| JavaScript syntax / bundle build | Passed |
| PWA asset regeneration / archive integrity | Passed |

**Responsive widths:** 320, 390, 820, 1280 and 1920 pixels. Tests used real Chromium rendering with synthetic application state and simulated cloud storage. The Ordering regression includes repeated moves and nested-scroll fixtures.

**Limitations:** Authenticated Supabase save timings, cross-device synchronization, browser installed-PWA upgrades, real-world 30k–50k title save benchmarks and physical-device gestures were **not** independently verified. The application still uses the existing full-state cloud snapshot architecture; future performance gains may require additional targeted work.

## 8. Version evolution

| Version | Development focus |
|---|---|
| v385 | Full-theme Library, live XP and cloud feedback |
| v386 | Corrected Logging theme-variable mismatch |
| v387 | Added Titles scroll preservation and minimal DOM reordering |
| **v388** | **Stable Dashboard return and fewer redundant renders/saves for Logging and Add/Edit Title** |

**Final status:** v388 is built and locally validated. The scroll-return fix and consolidated action paths passed the recorded tests; real-account performance remains to be verified.

**Developed by Alex Godly · MediaFlow v388**
