# MediaFlow v394 — Advanced Logging & Batch Log Retirement

**Version:** 394 Modular  
**Baseline:** v393 Modular  
**Date:** October 12, 2026  
**Developer:** Alex Godly  
**Status:** Built; targeted offline browser tests passed (see limitations)

## 1. Batch Log page retirement

Removed Batch Log from primary and mobile navigation, from the renderer route, and from active navigation preferences. Historic `batch` destinations redirect to Dashboard. Legacy batch-compatible functions remain internal so old session records, backups and exports can still be interpreted; existing History and XP are not deleted. No cloud schema or user data is changed.

## 2. Per Unit becomes Advanced Logging

Updated Logging mode button, Settings default mode, cover-size preference labeling, default mode notifications, Precision Logging header, supporting copy, and the semantic mode icon. Internally the value remains `itemized` so existing saved drafts and mode preferences continue working.

## 3. Independent logging tabs on each selected title

Existing Per Unit editor is retained as the initial tab for every added title. Added **Last Watched** and **Amount Consumed** tabs. Each title independently chooses a display method; switching tabs only changes the editor for that title and does not submit, create History or change saved progress. Current title-card covers, badges, expand/collapse, category and season support are preserved.

## 4. Shared drafts and synchronized methods

All three tabs use the original `v369Units` array. Four selected episodes 11–14 display as **4 consumed** and **Last Watched 14** when saved progress is 10. Entering 6 consumed generates an equivalent 11–16 draft. Season-scoped conversions preserve other-season units. Nonconsecutive, mixed-repeat, independently timed or differently timed-duration entries remain untouched on tab changes; a confirmation is required before a numerical edit would replace detailed entries. Underlying progress and XP continue using the established commit logic.

## 5. When Watched date and time

Every title uses its own addition-to-draft timestamp for newly added Per Unit entries. In Last Watched and Amount Consumed there is a category-aware When Watched/Consumed datetime field. Edited timestamps persist in the unsaved draft; changing one title cannot change another. Different individual-unit timestamps remain intact when switching methods and are not silently flattened.

## 6. Optional total runtime

Both new method panels support default automatic total runtime from per-unit durations and optional custom HH:MM:SS override. The manual total changes the session preview without destroying individual Per Unit durations while editing. On accepted submission it is apportioned across saved unit records; rejected submissions roll back this conversion. Missing category duration metadata is surfaced rather than falsely claiming a known runtime.

## 7. Source changes

- New: `src/js/components/288-v394-advanced-logging.js` — tabs, shared draft projections, conversions, timestamp and runtime controls, submission compatibility.
- New: `assets/css/209-v394-advanced-logging.css` — responsive method controls and theme-aware fields.
- Updated: `src/js/components/267-v369-itemized-logging.js` — default unit time captured on title entry, extra cloud-draft fingerprint fields.
- Updated: `src/js/components/268-v370-logging-ui.js`, `269-v371-logging-polish-stability.js`, `270-v372-logging-premium-settings-collections.js`, other targeted Logging labels.
- Updated: `src/js/core/rendering/010-render-shell.js`, `src/js/components/navigation/064-v161-about-custom-navigation-data-audit.js` — retired page route and navigation.
- Updated: README, README2, build/version/order references and app-shell assets.

## 8. Verification

| Check | Result |
|---|---|
| Build / JavaScript syntax / PWA assets | Passed |
| v394 initial Per Unit UI and category unit labels | Passed in synthetic Chromium |
| 4 → 6 → 3 unit conversion, Last Watched ↔ Amount | Passed in synthetic Chromium |
| Multiple titles with independent tabs | Passed in synthetic Chromium |
| Timestamp inherited from title draft addition | Passed in synthetic Chromium |
| Customized When Watched persistence through tab changes | Passed in synthetic Chromium |
| Manual runtime preview and preservation of original per-unit entries | Passed in synthetic Chromium |
| Batch Log removed from navigation | Passed |
| Previous v393 picker and scrolling tests | Passed at 390px / 1280px |
| Real compiled submission of Advanced Last Watched with manual runtime (synthetic account) | Passed at 320, 390, 820, 1280 and 1920px |
| Library search-caret regression | Passed in seven viewport/mode combinations |
| History layout regression | Passed at 320–1920px |
| Live authenticated Supabase and offline conflict resolution | Not verified |
| Production-account History submission / physical devices | Not verified |
| 100,000-title device benchmark | Not verified |

**Compatibility:** Existing Quick Logging, itemized/Precision UI, History, Library, XP, Collections, Personal Order, Settings, import/export and backup formats were retained by design. Tests are scoped to listed flows and do not prove full production parity.

**Package:** `MediaFlow_v394_Modular.zip` including updated `README.md`, `README2.md`, this changelog, complete modular source, and built app-shell assets. No GitHub activity was performed.
