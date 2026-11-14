# MediaFlow v389 — Responsive Logging Browse Library UI

**Application:** MediaFlow  
**Version:** v389 Modular  
**Baseline:** MediaFlow v388 Modular  
**Release date:** October 12, 2026  
**Developer:** Alex Godly  
**Release type:** Responsive UI correction, Logging Library usability and regression testing  
**Status:** Built and locally validated (controlled Chromium tests)

---

## 1. Reported problem

On a narrow mobile viewport, Logging → Browse Library packed several action buttons into a single narrow row. The **Display**, **Select Visible**, **Deselect All** and **Add Selected** controls overlapped or became unreadable. Category/sort/status/priority filters and pagination controls also inherited competing old responsive rules from different releases, producing cramped layouts. These visual defects occurred in the expanded Browse Library and did not imply missing Library or Logging data.

## 2. v389 responsive solution

- Added a **Browse-Library-only** responsive stylesheet that overrides the earlier rigid flex/grid constraints without rewriting Logging behavior.
- Added **container-width-aware** layout rules so the controls adjust to the actual available Library panel width rather than viewport width alone. This covers mobile devices, tablets, smaller desktop panes and expanded/collapsed navigation layouts.
- Reorganized filtering into readable rows: category picker, sort field/direction, status, priority, titles per page, Clear Filters and the result count.
- Kept the sort field and ASC/DESC button together, with constrained select minimum widths and sensible tap target heights.
- Made **Display** use its own responsive line when the panel is narrow.
- Arranged **Select Visible** and **Deselect All** side by side on regular phones, and **Add Selected** on a separate full-width line. On larger tablet panels, the three action buttons share a balanced row.
- Handled the earlier v379 removal of the obsolete Clean Covers switch. The new CSS no longer reserves a blank slot for that removed control.
- Ensured the five picker layouts (**List, Compact, Cards, Covers, Covers + Titles**) fit inside the panel. Extra-narrow containers can use a single cover-card column where necessary.
- Added panel-scoped box sizing, minimum-width corrections and safe text wrapping to prevent control overlap and horizontal overflow.
- Preserved the colored v386 Browse Library shell and all existing dynamic theme variables. No hardcoded brand palette or theme-system changes.

## 3. Behavior preserved

This release is a **presentation-only** repair. The existing action handlers, selection set, pagination, sorting, categories, status, priority, direct Add, bulk Add, title cards, search and draft state are unchanged. Both **Quick Logging** and **Per Unit** use the same responsive Library component. No Library, History, XP, cloud sync, authentication, Seasons View, Personal Order, Collections or backup schema changes were made.

## 4. Technical files

- **Added:** `assets/css/205-v389-logging-library-responsive.css` — targeted responsive CSS using container queries and scoped specificity to supersede old mobile/tablet overrides.
- **Added:** `scripts/test-v389-logging-library-responsive.py` — browser geometry and display-mode regression test.
- **Added:** `scripts/test-v389-save-compat.py` — v388 save/navigation compatibility test targeting the v389 bundle.
- **Added:** `scripts/test-v389-order-compat.py` — adapted v387 ordering compatibility test (not fully completed in this test run).
- **Regenerated:** `assets/js/mediaflow-v389.bundle.js`, `sw.js`, `manifest.json`, `version.json`.
- **Updated:** `index.html`, `VERSION`, `package.json`, `README.md`, `README2.md`.
- **PWA cache:** `mediaflow-pwa-v389-shell-v1`.
- **Database migrations:** None.

## 5. Tests and results

### Responsive Logging Library tests

The compiled application and real `renderLogForm()` UI were tested in headless Chromium with synthetic Library data and the built-in `v260-redesign` mobile/tablet layout conditions.

| Width | Quick Logging | Per Unit | All five picker views |
|---|---|---|---|
| 320 px | Passed | Passed | Passed |
| 360 px | Passed | Passed | Passed |
| 390 px | Passed | Passed | Passed |
| 481 px | Passed | Passed | Passed |
| 600 px | Passed | Passed | Passed |
| 820 px | Passed | Passed | Passed |
| 1280 px | Passed | Passed | Passed |
| 1920 px | Passed | Passed | Passed |

Each width/mode combination checked filter and selection-toolbar child rectangles for **visible overlap and escape beyond panel bounds**, a usable Display selector, and five picker modes with title cards staying inside the panel. Browser screenshots were captured at 320, 390, 820 and 1280 px. These tests used the current compiled bundle, not a separate hand-built visual mockup.

### Compatibility

The v388 save/navigation test passed again against the v389 bundle, including closing Logging, Quick and Per Unit Save & Get Next Task, Library progress, Add/Edit Title and invalid external-ID safeguards at 320, 390, 820, 1280 and 1920 px. The separate long-running ordering compatibility suite exceeded its execution time budget and is **not claimed as passed** in this release check. No ordering JavaScript was modified.

### Build

`python scripts/build.py` regenerated the bundled JavaScript and PWA shell; `node --check` passed; PWA asset discovery found 161 local shell entries.

## 6. Remaining limitations

- Local synthetic browser validation does not prove every saved custom-theme layout on every physical device.
- Real authenticated Supabase sync, full-account performance, production-installed PWA updates and manual touchscreen interaction were not verified in this test run.
- The previous ordering regression did not finish during this check and should be run again if ordering behavior is changed in a future release.

## 7. Version evolution

| Version | Primary change |
|---|---|
| v385 | Live Leveling and full Library theme refinements |
| v386 | Canonical theme color repair |
| v387 | Added Titles ordering scroll preservation |
| v388 | Dashboard return scroll stability and save-path consolidation |
| **v389** | **Responsive Browse Library filters and bulk-selection layout repair** |

---

**MediaFlow v389 — Developed by Alex Godly**  
*Clean filters. Clear actions. The same Library, on every screen.*
