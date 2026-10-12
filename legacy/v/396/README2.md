# MediaFlow v396 — Technical Release Notes

**Application:** MediaFlow · **Version:** v396 Modular · **Baseline:** v395 · **Date:** October 12, 2026 · **Developer:** Alex Godly

## v396 regression fixes

### 1. Restored advanced-logging progress renderer

- **Cause:** While replacing v382's two-bar progress comparison with the merged v395 preview, the wrapper that appended `v382ProgressHtml(item, entry)` into `.v370-title-info` was inadvertently deleted. The canonical unit calculations were still present, but no progress UI could render.
- **Fix:** Restored the wrapper in `src/js/components/278-v382-logging-recommended-progress-xp.js` *before* the v394 title method decorator runs, so the header gets the same live preview for both collapsed and expanded cards. `v382ProgressNumbers` and the v395 single-track segmentation remain the source of display values. Known totals use a progressbar; unknown totals do not show fake percentages.
- **Scope:** Pure rendering restoration. No saved Library progress or History updates are performed by the progress preview.

### 2. Persistent per-title ordering controls

- **Cause:** v373 originally attached drag handles, position numbers and up/down arrows after full Logging rendering. v394's targeted `v394Paint(index)` rebuilt just one `.v370-title` node; its replacement lacked the `.mf373-row-controls` toolbar, especially on newly edited / just-added titles.
- **Fix:** `src/js/components/289-v396-logging-card-reliability.js` reuses the existing `v373DecorateList(form)` immediately after targeted card replacement. The decorator skips already-decorated cards, reinstates controls for fresh replacements, and reapplies the active order through the existing v387 viewport-preserving pathway. The shared `v369RefreshPanels` path is also guarded to re-decorate after refresh. No new drag/drop engine or alternate manual-order store was introduced.
- **Scope:** Both complete form renders and targeted Advanced Logging updates; Quick Logging's existing v373 ordering pathway is preserved unchanged. UI interaction still uses canonical draft entry indexes.

### Changed / added files

- Updated: `src/js/components/278-v382-logging-recommended-progress-xp.js`, `src/js/runtime-order.json`, `VERSION`, `version.json`, `package.json`, `index.html`, `sw.js`, `README.md`, `README2.md`.
- Added: `src/js/components/289-v396-logging-card-reliability.js`, `scripts/test-v396-logging-rendering.py`, `docs/CHANGELOG_v396.md`.
- Rebuilt: `assets/js/mediaflow-v396.bundle.js`. Added build-version PWA cache metadata.
- Supplemental compatibility tests: `scripts/test-v396-v393-regression.py`, `scripts/test-v396-library-caret-compat.py`, `scripts/test-v396-history-compat.py`, `scripts/test-v396-save-dashboard-regression.py`.

### Verified checks

- Build/PWA discovery and Node.js syntax: PASS.
- Real Chromium rendered DOM test at **320 / 390 / 820 / 1280 / 1920px**: progress exists and is visible; ordering controls exist on every card, including the newest; both persist after method switches, quantity edits, collapsed/expanded transitions, and unknown-total rendering: PASS.
- Arrow and numeric position changes actually reorder the displayed nodes with a single toolbar per title: PASS.
- Existing per-title 4→6→3 unit conversions, editable timestamps, and custom total runtimes: PASS.
- Quick Logging title cards retain the original v373 ordering toolbar at all five tested viewport sizes: PASS.
- v393 Collections/Personal Order picker regressions at 390/1280px: PASS.
- Library search-caret tests across seven viewport/mode combinations: PASS.
- History unit layout at 320/390/820/1280/1920px: PASS.
- Synthetic Logging submissions and Dashboard return/save checks at 320/390/820/1280/1920px: PASS.

**Not verified:** Production authenticated Supabase saves/sync/conflicts, physical devices, installed native wrappers, exhaustive all-app regression, or 100,000-item benchmarking. No database migration or deliberate change to user data was made.

---

# MediaFlow v395 — Technical Release Notes

**Application:** MediaFlow · **Version:** v395 Modular · **Baseline:** v394 · **Date:** October 12, 2026 · **Developer:** Alex Godly

## v395 behavior and compatibility

- **Batch Log page retired:** Removed its visible desktop/mobile navigation and route, plus redirected historical Batch destinations to Dashboard. Legacy batch-related source logic is retained internally where needed for parsing older data; this is not a live Batch Log page and does not imply removal of past sessions.
- **Advanced Logging label/icon:** Former `Per Unit` (`v369Interface: 'itemized'`) is shown as **Advanced Logging** with its own checklist icon in Logging and Settings. The serialized `itemized` identifier stays unchanged, preserving old preferences and drafts. The v372 Precision Logging hero now identifies Advanced Logging.
- **Existing Per Unit unchanged as default:** The individual per-unit UI remains available with numbers, seasons, repeats, timestamps, durations and progress preview. Four units in this view represent the same four underlying `v369Units` when viewed in the new methods.
- **Per-title tab state:** Each resumable logging entry may have `v394Method` (`unit`, `last`, `amount`). v395 keeps the same data model, but the tabs now use explicit method icons and cleaned labels so “Per Unit” always renders correctly and more clearly.
- **Bidirectional mapping:** Last Watched = highest unit in selected season (or prior progress if empty); Amount Consumed = count of its draft units. Editing either value creates a contiguous range from the title/season's saved progress, preserves stable existing entries when possible, and requires confirmation if replacing detailed nonconsecutive/mixed unit data. Entries in other seasons remain unchanged.
- **When Watched:** On initial addition each title already has `loggedAt`; the new Per Unit default uses that captured timestamp. Summary methods show a category-aware `datetime-local` control. A manual change updates the relevant season's draft unit timestamps only; distinct existing times are preserved on tab switches and require confirmation before replacement.
- **Total runtime:** Optional `v394RuntimeManual` + `v394RuntimeSeconds` per title overrides total runtime in the preview and is distributed deterministically across canonical units at submit. If submission is rejected, the original unit runtimes and override fields are restored; turning the override off restores automatic per-unit duration totals. This does not change permanent per-unit category metadata.
- **Dashboard recommendation hero:** The Dashboard “Next Task” card is redesigned around a larger recommended-title hero with live Library progress, a real progress bar when totals are known, better spacing, and inline Edit / Reroll Title / Reroll History actions. The recommendation engine itself is unchanged.

**New:** `docs/CHANGELOG_v395.md`.

**Updated:** Dashboard renderer source, `src/js/components/267-v369-itemized-logging.js`, `src/js/components/268-v370-logging-ui.js`, `src/js/components/278-v382-logging-recommended-progress-xp.js`, `src/js/components/288-v394-advanced-logging.js`, `assets/css/50-library-dashboard.css`, `assets/css/199-v382-logging-xp-progress.css`, `assets/css/209-v394-advanced-logging.css`, `README.md`, `README2.md`, `VERSION`, `version.json`, `package.json`, `index.html`; rebuilt `assets/js/mediaflow-v395.bundle.js` and v395 `sw.js` / PWA manifest data.

**Testing:** Node JS syntax/PWA discovery targeted for v395. Focused manual/automation verification targets: Advanced Logging method tabs, default timestamp carry-over, merged progress preview rendering, and Dashboard recommendation hero rendering. Authenticated cloud, physical device, exhaustive production-account History submission, and extreme-library benchmark remain not verified.

---

# MediaFlow v393 — Interaction, Scrolling & Picker Workspace Stability

**Application:** MediaFlow | **Version:** 393 Modular | **Baseline:** v392 | **Date:** October 12, 2026 | **Developer:** Alex Godly

## Summary

The Collections Add Titles dialog now uses a large near-full-viewport workspace, with the title results in an independently scrolling region. The Collection Multi-Select pathway updates checkbox states, selection counts and bulk controls in place instead of replacing the entire picker, which caused the scroll-to-top bug. Personal Order Edit Title open/save/close actions preserve document and supported nested scroll positions across Lists and Tabs.

The existing **Add/Added** controls are now **reversible** in four locations: Collections title membership, Personal Order title order, Personal Order collection category assignments, and the active Logging Library draft. Add uses a plus icon; Added uses a checkmark and remains clickable. Removing from a picker changes **only** membership/assignment/draft state, not original Library titles, Collections, saved History or XP. Existing sort/filter/multi-select workflows remain intact.

## Technical implementation

- `src/js/components/287-v393-picker-scroll-toggle-stability.js`: late-loaded behavior overrides for Collections selection, reversible direct-add actions, category-scoped Personal Order assignment removal, logging draft-only removal, and Personal Order edit viewport capture/restoration.
- `assets/css/208-v393-interaction-scroll-workspace.css`: near-full viewport Collections dialog and theme-aware active Added controls, responsive down to mobile widths.
- `src/js/runtime-order.json`: register the last-loaded v393 module; `assets/js/mediaflow-v393.bundle.js` rebuilt from modular sources.
- PWA `sw.js`, `index.html`, `VERSION`, `version.json`, package metadata and app-shell asset list updated for v393; database, auth and backup schemas unchanged.
- `scripts/test-v393-workflows.py`, `scripts/test-v393-history-compat.py`, `scripts/test-v393-library-caret-compat.py`: included reproducible offline synthetic-browser checks.

## Tests, limitations and delivery

**Passed:** Modular JavaScript build/syntax, PWA manifest asset generation, two synthetic Chromium picker interaction suites (390px/1280px) covering membership toggles, scroll stability and Personal Order edit open/save/close; History layout checks (320px, 390px, 820px, 1280px, 1920px); seven Library search-caret regression scenarios. Logging Added removal was exercised using a draft with existing entries and verified to leave the Library item count unchanged.

**Not independently tested:** production authenticated Supabase save/recovery, simultaneous edits across devices, installed mobile PWA gesture behavior, exhaustive full-app feature parity or 100,000-title end-to-end responsiveness. No numerical performance improvements are claimed without benchmarks.

**Package:** `MediaFlow_v393_Modular.zip`; **both README files updated**. No GitHub operations performed. [Detailed changelog](./docs/CHANGELOG_v393.md).

---

# MediaFlow v392 — Collections & Personal Order Instant Add and Live Removal

**Application:** MediaFlow | **Version:** 392 Modular | **Baseline:** v391 | **Date:** October 12, 2026 | **Developer:** Alex Godly

## Summary

v392 removes the extra selection/confirmation step when adding one title to a Collection or adding titles/Collections to Personal Order. Every row in these three pickers has a **plus Add** control in default Direct Add mode. After adding, it changes to **check Added**, blocks duplicate additions, and **keeps the picker open**. An optional **Multi-Select** mode retains bulk additions. Existing Library titles, assigned Collections and manually ordered Personal Order entries are not reordered or removed by these operations. The removed circular-arrow Add/Added treatment is not used.

Collections → Add Titles now defaults to **Date added / Oldest first**, keeps added titles in their original positions, and offers membership filtering (all, unadded, already added), search, category/status/priority/rating filtering and alternative sorting. Personal Order → Add Titles defaults to oldest first and includes a picker-specific sorting selector. Personal Order → Add Collections defaults to earliest-created Collections first and retains existing category/priority and additional sort controls.

Single and multi-select **confirmed Collection removals** now mutate the visible Collection before queuing persistence, so you should not have to navigate away or wait for a cloud round-trip to see the result. Removed titles remain intact in the Library. An unsuccessful save raises an error toast; this version does not claim a complete conflict-resolution or automatic rollback mechanism.

## Implementation notes

- `src/js/components/286-v392-collections-instant-add.js` — scoped picker adapters, Add/Added controls, duplicate guards, list refresh, ordered queue mutations, confirmed collection-removal path.
- `assets/css/207-v392-collections-personal-order-instant-add.css` — themed controls, adaptive layouts, preserved List/Compact/Cards/Covers/Covers + Titles presentations.
- `scripts/test-v392-workflows.py` — offline synthetic Chromium workflow regression on 390 px and 1280 px viewports.
- `assets/js/mediaflow-v392.bundle.js` — rebuilt modular application bundle; `sw.js` / PWA shell cache updated for v392.
- No cloud schema migration, new authentication provider, or Library data migration.

## Validation and limitations

**Passed:** v392 compiled bundle JavaScript syntax and two synthetic Chromium UI suites covering all three Direct Add surfaces, both bulk pathways, persistent modal behavior, duplicate prevention, date sorting, search focus, and single/bulk confirmed Collection removals. No metrics or performance percentages are claimed for v392.

**Not independently verified:** real signed-in Supabase accounts, simultaneous edits across multiple devices, installed PWA updates on physical phones, large-account 100,000-title end-to-end profiling and error-recovery under actual network loss. The previously implemented v391 History layout and performance changes are retained as-is.

## Delivery

Complete ZIP: `MediaFlow_v392_Modular.zip`. Both READMEs and this detailed changelog are included. There have been **no GitHub operations**; deployment is owned by the user.

**Detailed notes:** [CHANGELOG_v392.md](./docs/CHANGELOG_v392.md)

---

# MediaFlow v391 — Performance Stability & History Layout Repair

**Application:** MediaFlow | **Version:** 391 Modular | **Baseline:** v390 | **Date:** October 12, 2026 | **Developer:** Alex Godly

## Summary

A focused, measured performance repair rather than an unverified claim of universally freeze-free 100,000-title operation. Dynamic Library now caches filtered/sorted results while its inputs are unchanged and clears them through established Library invalidation; v189 title comparisons reuse an `Intl.Collator`. Active-time XP updates reuse the correct clean XP cache by applying their exact earned delta instead of recomputing the entire Library/History every routine tick. All other XP changes still invalidate and recompute normally.

History episode details now stack beneath the title summary, with responsive unit/timestamp/duration rows that do not overlap. Card neighbors no longer inherit unnecessary height.

**Local performance observations:** Repeated unchanged 100,000-title Dynamic Library calls dropped from roughly 545–664 ms (v390) to ~0–0.1 ms (v391) in a synthetic Chromium calculation test. A clean 30,000-title/13,000-session XP time update took 1.1 ms versus 113 ms for forced full recomputation. Results vary by hardware and apply only to these tested calculations.

**Validation:** v391 filter/sort and XP correctness passed; History details were checked at five widths; v388 save/navigation and v390 caret compatibility suites passed. Real cloud, installed PWA, physical phones, all-page profiling and full 100,000-title rendering are not verified.

**Sources:** `src/js/components/285-v391-runtime-performance.js`, `src/js/pages/library/121-v189-library-sorting-unfinished-filter-dynamic.js`, `assets/css/206-v391-history-unit-layout.css`.

**Details:** [CHANGELOG_v391.md](./docs/CHANGELOG_v391.md)

---

# MediaFlow v390 — Library Search Caret & Selection Stability

**Application:** MediaFlow | **Version:** 390 Modular | **Baseline:** v389 | **Date:** October 12, 2026 | **Developer:** Alex Godly

## Summary

When the Library search rerendered, some earlier delayed focus-restoration callbacks continued resetting the caret to an older position even after the user had clicked inside the query to correct a typo. The v390 fix now treats the actively focused input as authoritative, captures the latest selection when the delayed search actually runs, and preserves selection start/end/direction if the input is replaced. It never forcibly refocuses search when the user is interacting with another field or control.

The existing filtering logic, search debounce, Library settings, Normal/Dynamic modes, data formats, and cloud system are not changed. Local Chromium regression passed seven viewport/mode combinations, including the exact `hot inhumans` → `hotel inhumans` correction and backward text selection.

**Technical source:** `src/js/components/284-v390-library-search-caret-stability.js`; fixes also applied to the earlier v265 and v281 Library focus layers.  
**Testing:** `scripts/test-v390-library-caret.py`  
**Details:** [CHANGELOG_v390.md](./docs/CHANGELOG_v390.md)

**Limitations:** Authenticated cloud, native mobile text editing, and large real Library performance were not tested.

---

# MediaFlow v389 — Responsive Logging Browse Library UI

**Application:** MediaFlow | **Version:** 389 Modular | **Baseline:** v388 | **Date:** October 12, 2026 | **Developer:** Alex Godly

## Summary

Redesigned the responsive arrangement **only inside Logging → Browse Library**. On mobile the filter picker, sort/ASC/DESC, statuses, priorities, per-page and Clear Filters controls wrap into clean rows. The selection toolbar now gives Display a full usable row, pairs Select Visible with Deselect All and places Add Selected on a full-width row. Tablet and desktop widths use balanced grid layouts without button collisions. The panel responds to its **own available width**, supporting sidebars and compact windows.

The change preserves all five views (List, Compact, Cards, Covers and Covers + Titles), existing title selection/addition logic, Quick/Per Unit Logging, dynamic themes and data schemas. No database migration, API changes or cloud operations were required.

**Source:** `assets/css/205-v389-logging-library-responsive.css`  
**Testing:** `scripts/test-v389-logging-library-responsive.py`  
**Details:** [CHANGELOG_v389.md](./docs/CHANGELOG_v389.md)

**Local checks:** responsive browser validation passed at eight widths for both Logging modes and five display modes, and v388 save/navigation compatibility checks passed against the v389 bundle. Physical device and live-account checks remain outstanding. The longer ordering regression did not finish within its time budget.

---

# MediaFlow — Latest Release Changelog

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

## 7. Testing and compatibility

See [the full v388 changelog](./docs/CHANGELOG_v388.md) for test matrix, limitations, exact source changes, and version evolution.

---

# MediaFlow v387 — Logging Added Titles Scroll Stability

**Release:** v387 Modular  
**Date:** October 12, 2026  
**Baseline:** v386 Modular  
**Developer:** Alex Godly

## 1. The problem

Changing the order of Added Titles in Quick or Per Unit could jump the page away from the current scroll position. The v373 sorter unnecessarily detached and re-appended all title cards on each refresh, and the previous Personal Order viewport guard did not cover Logging.

## 2. Fix and efficiency

The v373 renderer now updates only out-of-position DOM cards. v387 adds scroll and input-focus restoration to the canonical Logging ordering pipeline, including nested scroll containers. Arrow buttons, position numbers, sorting, direction toggles and custom/drag moves all share the fix. It uses short requestAnimationFrame restoration rather than a permanent polling or full-page refresh.

## 3. Validation

Tests through the real `renderLogForm()` and compiled v387 bundle passed at **320, 390, 820, 1280, 1920 px** in both Quick and Per Unit. A synthetic 48-title draft retained exact 1500 px viewport position after ordering operations. Repeated moves (20 in succession), numeric focus, DOM-generated button handlers, nested scrolling and no-op DOM mutation checks passed. Production device and authenticated cloud behavior remain unverified.

## 4. Preservation and release files

No XP formulas, Library data, Logging draft entry identities, History, cloud schema, Personal Order, Collections, or export formats changed. Added `282-v387-logging-order-scroll.js`, `204-v387-logging-order-scroll.css` and `test-v387-logging-order-scroll.py`; rebuilt bundle/PWA cache `mediaflow-pwa-v387-shell-v1` and refreshed release metadata.

**Detailed changelog:** [docs/CHANGELOG_v387.md](./docs/CHANGELOG_v387.md)

---

# MediaFlow v386 — Browse Library Real-Theme Color Repair

**Release:** v386 Modular  
**Date:** October 11, 2026  
**Baseline:** v385 Modular  
**Developer:** Alex Godly

## 1. Confirmed defect and root cause

The Browse Library remained gray in v385 even in strongly colored themes because its v383–v385 CSS relied on **`--accent`**, a variable not generally defined by MediaFlow themes. MediaFlow uses **`--flow`** as the canonical active accent. Undefined `--accent` made the newer background gradients invalid, revealing old neutral styling.

Earlier tests explicitly set `--accent`, inadvertently masking this production-condition defect. v386's tests use the actual `--flow` variable instead.

## 2. Corrected full Library color

Added `assets/css/203-v386-logging-library-theme-repair.css`, with a **component-scoped** alias from `--flow` and new visibly colored gradients for the entire header, outer Library shell and expanded body. Theme-aware controls and icon surfaces retain suitable contrast. Both **Quick Logging and Per Unit** are covered; no shared global theme rules are changed.

## 3. Better verification

New `scripts/test-v386-theme.py` exercises the real `renderLogForm()` output at **320, 390, 820, 1280 and 1920 px**. It verifies actual blue pixels in screenshots, blue-to-pink color changes, expanded/collapsed controls and both Logging modes. Local Chromium tests passed. Authenticated cloud and installed-PWA updates remain unverified.

## 4. Preservation and application assets

No Library data, Logging draft, XP, History, Cloud Sync, or export/import schema was changed. Updated `VERSION`, `version.json`, package metadata, compiled v386 bundle and PWA app-shell cache `mediaflow-pwa-v386-shell-v1`. The complete project retains prior v385 functionality.

**Detailed changelog:** [docs/CHANGELOG_v386.md](./docs/CHANGELOG_v386.md)

---

# MediaFlow v385 — Live Leveling, Full-Color Library & About Alignment

**Release:** v385 Modular  
**Date:** October 11, 2026  
**Baseline:** v384 Modular  
**Developer:** Alex Godly

## 1. Complete theme-colored Logging Library

The entire Browse Library shell and its expanded content now inherit coordinated gradients and surfaces from the live MediaFlow theme accent. The search/workspace container joins the colored header introduced in v384 rather than appearing as a plain gray block. Both Logging modes and existing picker functionality are retained.

## 2. Correct official logo alignment

The About hero now places the official MediaFlow logo on the same visual row as the **MediaFlow.** wordmark, with the version subtitle directly below the heading. Responsive dimensions prevent misalignment on small screens.

## 3. Live sidebar and Statistics Leveling

An event-driven, short-debounced updater patches the visible sidebar and Statistics XP/level/streak fields after relevant changes. Both use existing XP and streak calculations; no formula or cloud data schema changed. No full-page rerender or periodic Library scan is introduced.

## 4. Accurate cloud save status

The sidebar no longer claims **Saved to cloud storage** before a confirmed successful save. It reports unverified, pending, successful or failed states based on the existing save queue.

## 5. Build and validation

New `281-v385-live-leveling-themed-library.js` and `202-v385-themed-library-leveling.css`, rebuilt bundle, PWA cache `mediaflow-pwa-v385-shell-v1`, refreshed metadata and documentation. Chromium tests passed at **320, 390, 820, 1280 and 1920 px**, including simulated XP changes and save success/failure. **Live cloud, installed PWA updates and real-account performance remain unverified.**

**Detailed changelog:** [docs/CHANGELOG_v385.md](./docs/CHANGELOG_v385.md)

---

# MediaFlow v384 — Fully Themed Browse Library & Dynamic About Branding

**Release:** v384 Modular  
**Date:** October 11, 2026  
**Baseline:** v383 Modular  
**Developer:** Alex Godly  

## 1. Fully colored Logging Library header

The entire **Browse Library** header now uses a rich gradient derived from the active MediaFlow theme. The background covers the entire header, not just badges or accent borders. Icon, text, counters, chevron, hover and expanded states have been visually coordinated. All existing selection, search, sorting and title-addition behavior remains unchanged across Quick Logging and Per Unit.

## 2. About Studio: official branding

Replaced the generic header icon with the packaged **MediaFlow logo** and removed “Personal Edition” wording from About while keeping **By Alex Godly**, FAQs, Fun Facts, evolution and existing updates UI.

## 3. Dynamic About version indicators

The hero and version statistic now consistently read the canonical `mediaflow-version` metadata through `v161CurrentVersion()`. A simulated future release `385` updates both indicators automatically without editing any v384 presentation strings.

## 4. Build and testing

New `280-v384-theme-brand-version.js` module and `201-v384-theme-brand-version.css` stylesheet, rebuilt v384 bundle and PWA shell (`mediaflow-pwa-v384-shell-v1`). Five Chromium viewport checks, theme recoloring, logo load, version-forward simulation, About content and header toggle passed. Local/synthetic testing only; live hosted PWA upgrades and authenticated cloud checks remain unverified. No data schema or XP formula changes.

**Detailed notes:** [docs/CHANGELOG_v384.md](./docs/CHANGELOG_v384.md)

---

# MediaFlow v383 — About Studio, Logging Library Redesign & Data Integrity Audit

**Release:** v383 Modular · Personal Edition  
**Date:** October 11, 2026  
**Baseline:** v382 Modular  
**Developer:** Alex Godly  
**Delivery:** Complete modular ZIP, for local testing only. GitHub was not modified.

## 1. Logging Library design

Replaces the old plain collapsible Logging Library header with a more expressive, theme-aware **Browse Library** component, clear iconography, Library and added-title counts, a visible open/close chevron and redesigned expanded search intro. Works in Quick Logging and Per Unit while preserving title selection, filters, bulk actions and lazy Library rendering.

## 2. About Studio

Rebuilt the About page as a polished introduction to MediaFlow with a branded hero, current release, four account counters, six feature cards, a six-stage evolution timeline, **45 searchable FAQs** with category filters, **24 Fun Facts**, and refreshed descriptions of Logging, XP, Collections, Personal Order, five providers and PWA/cloud/export functionality. The existing Version & updates controls are retained, not replaced by a decorative mockup.

## 3. Cloud Sync and data protection audit

A new read-only `App.v383AuditPersistence()` preflight checks snapshot, Full Backup, settings presets, Personal Order and Collections export payloads, relevant entry-point availability, canonical state fields and backup JSON round-trip. **Sync Now** verification now also fingerprints serialized Collections, Collection tombstones and applicable newer persistent fields, in addition to the earlier Library, History, Settings, XP and Personal Order checks. The base data model and SQL schema remain unchanged.

## 4. Export/import, backups, XP and PWA

Full/Automatic Backup, Settings Presets, Personal Order and Collections export payloads now carry current **v383 release metadata**, retaining their previous compatible schema versions. The History, XP and automatic update entry points were checked; no XP formula or Logging submission changes were made. The v383 JavaScript bundle and versioned PWA application shell were rebuilt automatically, including the new design CSS.

## 5. Source and testing

- `src/js/components/279-v383-about-logging-data-integrity.js`
- `assets/css/200-v383-about-logging-data-audit.css`
- `assets/js/mediaflow-v383.bundle.js`
- PWA cache: `mediaflow-pwa-v383-shell-v1`
- JavaScript syntax and Chromium responsive UI checks at **320, 390, 820, 1280, 1920 px** passed. All expected major data fields were present in a synthetic snapshot/backup and the JSON serialization check passed.

**Limitations:** Authenticated remote cloud saves, end-to-end import restores, real installed-PWA upgrades and large-account benchmarking remain unverified. The release does not claim these live behaviors were tested. No GitHub commit, push or deployment was performed.

**Full changelog:** [docs/CHANGELOG_v383.md](./docs/CHANGELOG_v383.md)

---

# MediaFlow v382 — Logging Progress Outlook, Direct Recommended Titles & XP Summary Redesign

**Release:** v382 Modular · Personal Edition  
**Date:** October 11, 2026  
**Baseline:** v381 Modular  
**Developer:** Alex Godly  
**Delivery:** Complete modular ZIP, local testing only; **no GitHub commits, pushes, or deployments**.

## 1. Professional Logging XP summary

Replaces the legacy pale inline XP calculation with a responsive, theme-aware **Estimated Reward** card showing the total projected XP, base XP, rotation multiplier, streak multiplier, and streak days. The current rotation description is preserved. All numbers come from the existing XP estimator, and actual awards still occur only upon submission. Works in **Quick Logging and Per Unit** and refreshes with draft changes.

## 2. Recommended title — one-click direct addition

Fixes the longstanding shortcut that previously only filled the search field. **Use recommended title** now calls the existing canonical direct-add logic and actually inserts the recommended Library title into the current Logging draft in **both modes**. It preserves the active mode and unrelated drafts, reveals hidden Added Titles, prevents duplicates, and locates an already-added card. Only successful addition shows the confirmation message; success uses a meaningful **check-circle**, replacing the generic circle-arrow icon. The recommendation card derives its state from real draft membership, not the search input.

## 3. Per Unit current and future progress

Every Per Unit added title displays separate **Current progress** and **After this draft** progress bars, plus the count of staged units. Future progress uses MediaFlow's existing contiguous episode/season-aware projection: gaps and repeat units do not falsely advance the bar. Unknown totals display `?` and a neutral track rather than inventing a completion percentage. The bars update when the itemized draft changes. Quick Logging and main Library artwork/cards are unchanged.

## 4. Source and compatibility

- New JS module: `src/js/components/278-v382-logging-recommended-progress-xp.js`.
- New CSS: `assets/css/199-v382-logging-xp-progress.css`.
- Rebuilt bundle: `assets/js/mediaflow-v382.bundle.js`.
- PWA shell: `mediaflow-pwa-v382-shell-v1`; updated `VERSION`, `version.json`, app metadata, runtime registration, and index asset references.
- **No** database migrations, Edge Functions, new credentials, new paid services, XP formula changes, or GitHub operations.

## 5. Tests and limitations

Node syntax validation passed. Focused Chromium tests passed in both Logging modes at **320, 390, 820, 1280 and 1920 px**. Tests verified direct adding, idempotent repeated clicks, XP card refresh, current/proposed progress (9/14 → 12/14 for episodes 10–12), gap/repeat protection, and unknown totals.

Testing used synthetic fixture state, **not a logged-in Supabase account**. Production-scale performance, cloud round-trip, and physical-device validation remain outstanding. v381 multi-provider behavior is retained but was not live-tested in this release.

**Detailed source, acceptance tests and deployment guidance:** [docs/CHANGELOG_v382.md](./docs/CHANGELOG_v382.md).

---

# MediaFlow v381 — Multi-Provider Reliability & Detection UI Corrections

**Release:** v381 Modular · Personal Edition  
**Date:** October 11, 2026  
**Baseline:** v380 Modular  
**Developer:** Alex Godly  
**Delivery:** Complete modular ZIP, local testing only; **no GitHub commits, pushes, or deployments**.

## 1. Why this update was needed

Real user checks of the v380 episode-data system showed repeated partial results:

| Selected provider | Reported request failures | Reported missing episode lists |
|---|---:|---:|
| AniList | 58 | 0 reported |
| Kitsu | 58 | 0 reported |
| TVmaze | 0 | 56 |
| AniZip | 0 | 7 |
| Tenrai | 0 | 9 |

The app retained the last trustworthy count of **70 Fresh Titles**; **70 is not a new v381 verification**. Error counts describe different conditions and cannot be compared as though they all represent the same failure.

## 2. Shared provider HTTP engine repair

- Starts each request's **18-second network timeout after provider pacing**, rather than while the request waits in a queue.
- Uses per-host pacing queues so one provider does not block unrelated providers.
- Parses `Retry-After` and `X-RateLimit-Reset` and sets a provider cooldown after HTTP 429. Further title lookups during that cooldown fail fast with an explicit paused-provider explanation instead of spamming the API.
- Classifies HTTP status errors, `network_or_cors`, timeouts, malformed responses, GraphQL errors, and temporary provider cooldowns distinctly.
- Detects GraphQL `errors` even when the HTTP response status is 200.
- Retains request-level caching and in-flight deduplication.
- Adds session-level provider request-health diagnostics with most recent error text.
- Continues preserving the previous trustworthy Fresh Titles aggregate when any required result remains unresolved.

**Note:** Provider cooldowns can leave a manual scan incomplete; they do **not** fabricate missing episode counts or overwrite the previously trusted total.

## 3. AniList GraphQL repair

- Removed the unsupported `sort: TIME_DESC` argument from `Media.airingSchedule`.
- Keeps direct `idMal` lookup with `type: ANIME` and validates the returned MAL ID.
- Retrieves a bounded page of available airing-schedule records and `nextAiringEpisode`.
- Uses a confirmed final total for finished series; excludes future airings and handles upcoming series as zero released episodes.
- Surfaces GraphQL validation errors separately from transport failures.
- Applies shared AniList pacing and cooldown handling.

AniList historical schedule coverage remains incomplete for some series; unavailable historical data is not treated as a confirmed result.

## 4. Kitsu request, mapping and pagination repairs

- Sends the JSON:API `Accept: application/vnd.api+json` header.
- Uses a verified Kitsu ID already stored in MediaFlow where present, avoiding redundant MAL mapping requests.
- Otherwise validates an exact `myanimelist/anime` mapping before reading the anime record.
- Extends bounded episode pagination beyond the previous 200-record limit, with an explicit incomplete-catalogue result when the safety ceiling is reached.
- Uses available release dates, status and finished-series totals conservatively.
- Reports connection/CORS errors distinctly and avoids repeated immediate retries after a browser connection block.

**Outstanding:** The v380 Kitsu result of 58 failed requests has not yet been retested against the live Kitsu service from a deployed browser. If the public endpoint blocks the app's browser origin, a permitted proxy or alternative provider may be needed. No proxy or Supabase Edge Function was deployed in this update.

## 5. AniZip date compatibility

- Added support for episode `airDateUtc`, in addition to the older `airdate`, `airDate`, `aired` and related formats.
- Validates parsed timestamps and MAL ID mappings.
- Does not count future episode airings as released.
- Distinguishes absent and malformed dates from records establishing a verified zero for fully future-dated episodes.

This should reduce missing-data reports caused by the old parser, although recovery of the seven previously unresolved titles remains to be proven by live testing.

## 6. Tenrai episode and status correctness

- Does not automatically count undated episode-list entries as already aired.
- Preserves completed-series totals and upcoming-series zero counts when established by catalogue details.
- Retains HTTP status codes in thrown errors for clearer failure classification.
- Keeps missing episode data separate from actual request failures.

A provider with genuinely absent dates or episode data remains an unresolved source, not an excuse to guess.

## 7. TVmaze matching and anime seasons

- Supports a stored verified TVmaze identifier as well as existing IMDb/TVDB ID lookups.
- Retains conservative unique exact-title matching and avoids accepting ambiguous search hits.
- Recognizes explicit numeric season labels when a TVmaze show contains multiple seasons, and restricts release calculations to that season.
- Excludes future episodes and avoids mixing episodes from different TVmaze seasons.
- Distinguishes missing show lookup, missing episode list and unresolved multi-season mapping.

TVmaze does not natively match MAL IDs and is not expected to cover every separate seasonal anime entry; unreliable fuzzy matches are intentionally rejected.

## 8. Automatic Multi-Provider — use the repaired adapters

- Automatic mode uses the **same repaired source adapters** as manual selection: Tenrai → AniZip → AniList → TVmaze → Kitsu.
- Starts with direct MAL-linked information and moves to other sources when an earlier source cannot establish a trustworthy released count.
- Includes the attempted provider and reason in incomplete-source diagnostics.
- Avoids unnecessary requests when a satisfactory result is found.
- Supports temporary source cooldowns without blocking other independent providers.
- Does not silently convert incomplete scans to a new certified Fresh Titles count.

## 9. Dynamic Settings label and duplicate icon fixes

- The automatic refresh status now displays the actual selected mode: **Automatic: Multi-Provider**, **Automatic: Tenrai**, **Automatic: AniZip**, **Automatic: AniList**, **Automatic: TVmaze**, or **Automatic: Kitsu**.
- Updates the explanatory text to describe the new provider system rather than the former Tenrai-only detection.
- Removes redundant icon injection on **View Unmatched Titles**, **Retry API Failures**, **Retry Missing Episode Data**, and related selection/retry controls.
- Uses a single intentional semantic icon per action after initial render and subsequent global icon passes.
- Adds a compact provider request-health diagnostic section that distinguishes checked and unchecked providers in the current session.

## 10. Testing and verification

| Test | Result |
|---|---|
| Compiled JavaScript syntax (`node --check`) | Pass |
| AniZip `airDateUtc` episode parsing | Pass — controlled response |
| AniList corrected query, upcoming, airing and finished handling | Pass — controlled response |
| TVmaze exact verified show + season 2 mapping | Pass — controlled response |
| Kitsu pagination above 200 entries | Pass — controlled response |
| Automatic fallback after missing Tenrai data | Pass — controlled response |
| Automatic incomplete-result explanations | Pass — controlled response |
| HTTP 429 cooldown prevents repeated requests | Pass — controlled response |
| GraphQL 200-with-errors correctly classified | Pass — controlled response |
| Chromium Settings mode label and one-icon buttons | Pass at 390px and 1280px |
| Personal Order All Titles / By Category / Tabs layout regressions | Pass at 320, 390, 820, 1280 and 1920px |
| Actual live AniList, AniZip, TVmaze, Tenrai and Kitsu requests | **Not verified in the build environment** |
| Authenticated Supabase and physical Android/iOS tests | **Not verified** |

The environment could not resolve live third-party API endpoints for direct integration tests. Local fixture tests and source/schema checks cannot guarantee live success, especially for Kitsu's browser-origin behavior, provider downtime, or incomplete anime coverage.

## 11. Source and release updates

- Corrected the v380 provider integration code in `src/js/components/276-v380-providers-logging-order.js` as part of the v381 release.
- Added `src/js/components/277-v381-multi-provider-reliability.js` for provider-aware Settings labels, diagnostics and icon normalization.
- Added `assets/css/198-v381-provider-diagnostics.css`.
- Registered the new extension in `src/js/runtime-order.json`.
- Built `assets/js/mediaflow-v381.bundle.js` and regenerated app-shell PWA cache (`mediaflow-pwa-v381-shell-v1`).
- Updated `index.html`, `VERSION`, `version.json`, `package.json`, `README.md`, `README2.md` and this changelog.
- No database migrations, new credentials, new paid services, remote deployments, or GitHub actions.

## 12. Compatibility and recommended real-account testing

The existing Library, Logging, Collections, Personal Order, History, XP, themes, import/export and cloud data model are preserved. Make a **Full Data backup** before testing v381 against important account data.

Recommended verification sequence: test AniList and Kitsu separately in the browser; inspect their new request diagnostics; retry the seven AniZip and nine Tenrai missing titles; switch to Automatic Multi-Provider; compare whether missing titles are recovered without introducing incorrect episode counts; confirm the prior trusted Fresh Titles value stays protected if the scan remains incomplete.

**Delivery artifact:** `MediaFlow_v381_Modular.zip` (local package, no GitHub commit or deployment).

---

## MediaFlow v380 — Multi-Provider Detection, Logging Stability & Personal Order Scroll

**Release:** v380 Modular — Personal Edition  
**Baseline:** v379 Modular  
**Date:** October 11, 2026  
**Developer:** Alex Godly  
**Status:** Built and locally tested. No GitHub commit, push, or deployment.

### 1. Five episode sources and Automatic Multi-Provider

Added six selectable modes: Automatic (default), Tenrai, AniZip, AniList, TVmaze and Kitsu. Automatic falls back only when a prior source lacks verified release data. MAL mappings, dated episodes, upcoming/finished anime handling, provider-specific caching/pacing and source diagnostics were integrated without paid services or new OAuth secrets. The previous trustworthy fresh count is preserved when checks are incomplete. **Live-provider access and coverage remain unverified**; the earlier nine unresolved titles cannot be claimed recovered.

### 2. Logging controls and icon reliability

Rebuilt Hide/Show Added Titles using one draft-backed visibility state and dynamic eye/eye-off symbols immediately next to Clear All Titles. Replaced Added with a check-circle and corrected the initial Asc/Desc sort arrow. Fixed interference from the existing semantic-button icon layer, including the Unmatched and Retry actions.

### 3. Units in Draft sorting

Added Units in Draft directly to the existing Logging → Sort titles selector. Uses the staged Per Unit records or pending Quick quantity/progress delta, with ascending/descending direction and stable ties. No changes to History, XP or underlying draft indexes.

### 4. Personal Order scroll stability

Preserved the user's scroll position around title and assigned-Collection reordering, including mixed queue dragging, numeric positions and arrow actions in Lists and Tabs. Retains v379's exact cross-title/Collection order changes.

### 5. Testing and delivery

Local browser Logging/mixed-order tests pass at 390 and 1280 px; Personal Order layout tests pass at 320, 390, 820, 1280 and 1920 px. Provider mock-response tests pass for AniZip, AniList, TVmaze, Kitsu and Automatic fallback. Live third-party endpoints, authenticated Supabase, account-scale performance and physical devices remain outstanding.

**Complete changelog:** [docs/CHANGELOG_v380.md](./docs/CHANGELOG_v380.md).

---

## MediaFlow v379 — Logging Recovery, Mixed Collection Reordering & Tenrai Diagnostics

**Release:** v379 Modular — Personal Edition  
**Baseline:** v378 Tenrai Repair Modular  
**Date:** October 11, 2026  
**Developer:** Alex Godly  
**Status:** Built and locally tested; no GitHub commit, push, or deployment.

### 1. Logging expansion restored

Removed the broken global Collapse All/Expand All actions and redundant button under each cover. Per Unit cards once again use their functional right-hand Expand/Collapse to show individual episode/chapter logging controls; Quick Logging gets a working right-hand expander that preserves draft amounts. A new **Show/Hide Added Titles** button sits beside Clear All Titles and hides only the list.

### 2. Logging Library — always-on selection

Removed Clean Covers entirely. Fixed malformed manual-checkbox handlers and synchronized Add Selected count and enabled state with individual selection, Select Visible and Deselect All. Integrated selection checkboxes into all five Library view layouts, slightly enlarged Logging Library covers, preserved bulk Add with duplicate prevention, and changed Added to a check-circle icon.

### 3. Personal Order — mixed title/Collection reordering

Fixed the reported `Anime 1 → Collection → Anime 2` issue. Moving Anime 2 above the Collection now produces `Anime 1 → Anime 2 → Collection` without displacing unrelated entries. Titles and assigned Collections share one queue-movement operation across arrows, positions and drag/drop. Added Collection dragging, touch handles, local queue repaint where applicable, and serialized/debounced order persistence.

### 4. Automatic MAL Detection

Incorporates the v378 Tenrai Repair episode-data safeguards, retaining a clear distinction between API request errors and unavailable episode listings. Keeps **Retry Missing Episode Data** separate and preserves the last verified fresh-title total during incomplete checks. Replaces generic circle-arrow icons on unmatched/retry controls. The previously reported nine missing lists remain provider-dependent and are **not claimed to be resolved**.

### 5. Tests and delivery

Compiled JavaScript checked successfully. Browser tests passed for manual selection, Quick and Per Unit expansion, title-list visibility, exact mixed-order moves and real drag events at 390/1280px. Personal Order layout checks passed at 320, 390, 820, 1280 and 1920px. Nine local Tenrai recovery tests passed. Live Tenrai, real-user cloud sync and physical-device testing remain outstanding.

**Full changelog:** [docs/CHANGELOG_v379.md](./docs/CHANGELOG_v379.md).

---

## MediaFlow v378 — Tenrai Migration, Import IDs, Logging 4.0 & Personal Order

**Release:** v378 Modular — Personal Edition  
**Baseline:** v377 Modular  
**Date:** October 11, 2026  
**Developer:** Alex Godly  
**Status:** Built and locally tested; not committed, pushed or deployed.

### 1. Automatic MAL Detection powered by Tenrai
Migrated MyAnimeList metadata, episode lookup, unmatched-title retries, API failure retries, and Add/Edit Title MAL verification to Tenrai's public v1 endpoints. Retains MAL-ID-first matching and trustworthy-count protection, without introducing OAuth or external account tracking.

### 2. External Media IDs in imports
Normalizes known provider identifiers in canonical Exchange Hub import flows, extracts MAL IDs from recognized URLs, preserves manually corrected IDs, rejects invalid values and presents import ID outcome counts.

### 3. Logging 4.0
Adds Collapse All/Expand All for Quick Logging and Per Unit, direct title Add, five Logging Library display modes, Clean Covers, multi-select, Select Visible, Deselect All, and one-click Add Selected. Draft entries start at zero consumption until deliberately configured.

### 4. Personal Order
Fixes narrow title position inputs (tested for 3+ digits) and includes assigned Collection blocks within Lists → All Titles, following their mixed order alongside direct titles. No existing cover presentation changes.

### 5. Icons, tests and packaging
Semantic icons for Unmatched, Retry, Verify, and External Media IDs. Built JS/PWA metadata for v378. Chromium synthetic tests at mobile/tablet/desktop widths passed; live Tenrai/cloud/physical-device testing not performed.

**Complete technical changelog:** [docs/CHANGELOG_v378.md](./docs/CHANGELOG_v378.md).

---

## MediaFlow v377 — External IDs, Reliable Jikan & Personal Order Positions

**Release:** v377 Modular — Personal Edition  
**Baseline:** v376 Modular  
**Date:** October 11, 2026  
**Developer:** Alex Godly  
**Status:** Local development candidate; not deployed.

### 1. Editable external media IDs

Added dedicated, collapsible External Media IDs fields to Add/Edit Title for MAL, SIMKL, AniList, TMDB, IMDb, Trakt, Kitsu, ISBN and any additional stored provider IDs. Existing IDs are prefilled, can be changed or cleared, and manual overrides survive normalized Exchange Hub imports. Anime Details includes an **Edit external IDs** shortcut. The MAL field offers Jikan verification; other providers do not gain new automatic metadata integrations.

### 2. Automatic Jikan reliability

Jikan requests use a serialized gate (≥1.15 seconds between calls; no more than 53 attempts per sliding minute), bounded retries, 16-second timeouts, `Retry-After` handling, exponential backoff, and successful-response caching. Missing or empty episode data are treated as failures rather than valid zero counts. Partial scans preserve the previous trustworthy Detected Fresh Titles total.

### 3. Unmatched Titles manager

**View Unmatched Titles** opens a scrollable popup with actual Library covers or the existing category-icon fallback, title, current MAL ID, failure reason, Edit, and per-title Retry. **Check All Unmatched**, **Check Selected**, and **Retry API Failures** check only affected titles. Recovered episodes contribute to Detected Fresh Titles without duplicate counting once the aggregate is verified.

### 4. Add/Edit Title — Seasons View placement

Seasons View now appears at the very end of Core Details. The new External Media IDs section follows immediately afterward, before Artwork & Dates. All existing seasons data and actions remain intact.

### 5. Personal Order three-digit positions

Strengthened the numeric lane and input widths across Tabs, Lists, Collection Queues, assigned Collections, and expanded Collection rows. At least three digits remain visible at mobile and desktop widths; larger values can display safely. **Existing cover presentation and cover-size settings are unchanged.** The continuous/grouped Collection Queue behavior from v376 is preserved.

### 6. Build, validation and compatibility

- Built `mediaflow-v377.bundle.js` and regenerated v377 PWA assets.
- Chromium layout tests passed at 320, 390, 820, 1280 and 1920 px.
- Synthetic Chromium Edit Title/Jikan tests passed at 390 and 1280 px, including manually saved IDs, partial check protection, separate unmatched/API-failure reporting, and fresh-title count recalculation after retries.
- No new SQL migrations or external OAuth provider connections.
- Live Jikan availability, authenticated cloud synchronization, and physical devices were not tested.
- **GitHub:** No commits, pushes, or deployment. Owner manages the repository; numeric commit convention is `377`.

**Full technical details:** [docs/CHANGELOG_v377.md](./docs/CHANGELOG_v377.md)

---

## MediaFlow v376 — Personal Order UI Parity & Continuous Collection Queue

**Release:** v376 Modular — Personal Edition  
**Baseline:** v375 (restored v373 feature code)  
**Date:** October 11, 2026  
**Developer:** Alex Godly  
**Status:** Local development candidate; not yet deployed.

### 1. Personal Order Row/Card Parity

The position badge, poster and title metadata now use a consistently protected three-column layout throughout **Tabs / Category Titles**, **Tabs / Collection Queues**, **Lists / All Titles**, **Lists / By Category**, direct titles, assigned Collection blocks, and expanded Collection contents.

### 2. Readable Positions

Position badges/inputs support **at least three digits** without overlap or clipping. The protected position lane uses 54 px at normal widths and 48 px on narrow layouts, with a natural-content-friendly label and proportional cover frame.

### 3. Continuous Collection Queue

- **Lists → All Titles:** Collection Queue items form **one continuous list**. Previously separate category cards are no longer displayed as isolated queue panels.
- **Lists → By Category:** Collection Queue items stay grouped by category, matching the Title Order grouping.
- **Tabs:** Category Titles and Collection Queues retain their focused per-category presentation.
- **Canonical data safety:** Global display numbering does **not** overwrite category-local position values. Collection assignment input remains category-local for reordering.

### 4. Responsive Collection Artwork & Expanded Details

Fixed cover/number spacing for individual titles, Collection cover/collage blocks and entries inside expanded Collection Order. Existing adjustable cover sizes, eligibility statuses, title wrapping and action controls are preserved.

### 5. Existing Features Preserved

Retains drag-and-drop, moving via arrows/numeric inputs, Edit/Remove, Open Collection, Show/Hide Titles, collection-category and completed-title rules, history, Logging, XP, Supabase cloud state and data formats. No new SQL migration; canceled v374 MAL/SIMKL authenticated tracking remains absent.

### 6. Development Validation

Compiled v376 JS and regenerated version-aware PWA assets; validated the real app in Chromium at **320, 390, 820, 1280 and 1920 px** using synthetic data and a Collection with 140 members. Full physical-device, live-account and production verification remain outstanding.

**Technical source and detailed test matrix:** [docs/CHANGELOG_v376.md](./docs/CHANGELOG_v376.md)

---

## Previous Release — v375

v375 restored the v373 application baseline after canceling the v374 external tracking experiment. Its `VERSION` and `version.json` values were updated, while v373-named frontend/PWA artifacts remained in that rollback source. v376 performs a complete fresh JavaScript/PWA build.

## Earlier Feature Baseline — v373

v373 introduced the Logging Sorting & Custom Order Studio, with session insertion order, multiple sorting fields, manual movement, and persistent custom draft arrangement. [Read v373 details](./docs/CHANGELOG_v373.md).

---

**Commit policy:** When an approved release is deployed to GitHub `main`, the commit message is **only the numeric version** (for v376, `376`). This local candidate has not been pushed or deployed.


---

## v378 Tenrai Episode-Data Diagnostic Repair (Local Testing Hotfix)

The repair build corrects episode-list classification without advancing to the full v379 release. A successful Tenrai response with an empty episode list is not automatically an API failure. Valid **not-yet-aired** MAL titles count as zero released episodes; **finished airing** titles with a trusted total can be resolved from catalogue metadata; **currently airing** titles without episode-level data are classified as **Missing Episode Data**, not a transport failure. A separate **Retry Missing Episode Data** control allows retrying these titles. Genuine HTTP/network errors still appear under **Retry API Failures**. The last trustworthy fresh-title count stays protected while data remains incomplete.

No new cloud schema, account integration, or cover changes. Tested using synthetic provider responses; **live Tenrai responses cannot be verified from the local build environment**. See `docs/TENRAI_EPISODE_DATA_REPAIR.md`.
