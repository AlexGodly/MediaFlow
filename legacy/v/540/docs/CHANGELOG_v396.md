# MediaFlow v396 — Advanced Logging Regression Repairs

**Version:** v396 Modular  
**Baseline:** v395 Modular  
**Date:** October 12, 2026  
**Developer:** Alex Godly  
**Status:** Built; focused synthetic tests passed

## 1. Unified Progress Preview restored

**Problem:** The v395 conversion from two bars to one segmented bar inadvertently deleted the renderer wrapper that placed the preview inside every Advanced Logging title card. Consequently, the user saw no progress bar at all.

**Solution:** Restored the `v382TitlePanelBase` / `v370TitlePanelHtml` wrapper to render `v382ProgressHtml(item, entry)` inside `.v370-title-info` before v394 decorates the card with method tabs. The existing progress projection is unchanged. The single visible track continues to represent completed progress, new contiguous progress expected from the draft, and remaining units. Unknown totals show current/projected numbers without a fabricated percentage.

**Impact:** Works inside the title header even when the title body is collapsed. Visual-only fix; does not write History, progress, XP, settings or cloud data.

## 2. Missing title-order tools fixed

**Problem:** v394's targeted card refresh (`v394Paint`) replaced a DOM node and inadvertently dropped its drag handle, position input and up/down arrow toolbar. Newly added titles were particularly likely to lose these controls after switching a method or editing details.

**Solution:** Added a v396 runtime extension which re-runs the existing idempotent `v373DecorateList` on the live Logging form immediately after an individual card has been replaced, and after the shared draft-panel refresh pathway. Existing sorting, manual ordering, drag/drop delegation and v387 scroll preservation remain authoritative. Already-decorated cards are skipped to avoid duplicate toolbars.

**Impact:** Order controls remain available on all added-title cards, including the newest, after method changes, quantity edits, timestamp/runtime edits and draft-panel refreshes. The underlying draft indexes and custom sequence remain unchanged.

## 3. Compatibility and data safety

- The canonical `v369Units` draft model remains unchanged.
- Per Unit / Last Watched / Amount Consumed conversions are preserved.
- Saved Library title progress, seasons, History, XP, statistics, and category settings are unaffected by these UI repairs.
- Existing v393 Collections / Personal Order workflows and Library search caret are retained.
- No Supabase database migration or authentication modifications.
- No GitHub actions performed.

## 4. Source changes

- Modified `src/js/components/278-v382-logging-recommended-progress-xp.js` to restore the lost preview insertion hook.
- Added `src/js/components/289-v396-logging-card-reliability.js` to reapply existing order decoration after card replacement or panel refresh.
- Registered the new runtime module in `src/js/runtime-order.json`.
- Rebuilt `assets/js/mediaflow-v396.bundle.js`, refreshed PWA app-shell and version metadata.
- Updated `README.md`, `README2.md` and release changelog.

## 5. Verification

| Test | Result |
|---|---|
| Modular build and JavaScript syntax | Passed |
| PWA asset discovery | Passed |
| Progress preview DOM visibility in expanded and collapsed cards | Passed |
| Segmented bar visible after tab/amount updates | Passed |
| Newest title receives ordering toolbar | Passed |
| Toolbar survives repeated method switching | Passed |
| Up-arrow reorder action | Passed |
| Numeric position reorder action | Passed |
| No duplicate toolbars after repeated refreshes | Passed |
| Unknown total doesn't invent a progress percentage | Passed |
| Responsive focused tests, 320–1920px | Passed |
| Existing v394 three-method conversion and timestamps | Passed |
| Quick Logging title-order controls | Passed |
| Existing v393 Collections / Personal Order picker tests | Passed |
| Library caret regression in seven mode/viewport combinations | Passed |
| History layout regressions, 320–1920px | Passed |
| Synthetic Logging save and Dashboard return regressions, 320–1920px | Passed |
| Authenticated Supabase cloud testing | Not verified |
| Physical-device / native-wrapper testing | Not verified |
| 100,000-title benchmark | Not verified |

**Testing limitation:** Tests used synthetic state and controlled Chromium environments; the release has not been verified against production cloud accounts.

## 6. Release summary

v396 restores the missing Advanced Logging unified progress bar and prevents added-title ordering controls from disappearing after individual card refreshes. The release concentrates on v395 regression repair rather than introducing unrelated feature changes.
