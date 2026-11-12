# MediaFlow v398 — Mobile & Tablet Responsive UI Repair

**Version:** 398 Modular  
**Baseline:** MediaFlow v397 Modular  
**Date:** October 12, 2026  
**Developer:** Alex Godly  
**Focus:** Seven responsive fixes across Dashboard, Advanced Logging, the floating dock, Collections, and Personal Order  
**Scope:** Phones and tablets (viewport widths up to 1023px); existing desktop layouts and behavior preserved  
**Database migration:** None

---

## 1. Dashboard → Next Task → Recommended Title

**Problem:** After v395, small screens displayed an oversized poster with large unused areas, overflowing metadata and reason chips, hard-to-scan progress, and crowded Edit/Reroll controls.

**Fix:** The mobile/tablet-specific layout presents a restrained cover beside the recommendation name, category, status, and progress information. At phone widths, the inner content uses CSS grid placement so the artwork occupies a small left column and metadata occupies the right; progress statistics and controls occupy full-width rows below. Tablet widths use a wider two-column composition. The progress bar remains visible, and every displayed progress count has a readable gap.

Recommendation reasons are gathered into an expandable **Why this title?** disclosure on phones/tablets. The unchanged desktop reason chips are preserved separately. The existing **Edit**, **Reroll title**, and **Reroll history** actions continue calling the original handlers. **No recommendation scoring, title choice, task planning, or Library progress calculation was changed.**

## 2. Advanced Logging title cards

**Problem:** Small screens showed enlarged, vertically wasteful title cards. Category/status chips, progress text, actions and covers collided or wrapped unexpectedly.

**Fix:** Card headers now follow a phone/tablet grid with a compact cover and readable title information. Status, priority, category and draft summary remain intact. The progress section is laid out underneath the metadata at **full card width** rather than being confined to the narrow text column. Expand/Collapse and Remove actions have consistent, accessible widths. The existing drag handle, numeric position editor, and up/down controls are retained, with wrapping when the available width is limited.

This is a presentation-only adjustment: all three Advanced Logging entry methods (Per Unit, Last Watched, Amount Consumed), timestamps, runtime, seasons, repeat units, edits, and submit behavior continue using canonical v369 records.

## 3. Unified / merged progress preview visibility

**Problem:** The progress preview was sometimes readable only as broken text. The combined completed-plus-draft bar was not visibly usable on phones/tablets.

**Fix:** In the responsive Advanced Logging card the v382/v395 progress renderer stays mounted and its existing `.mf395-progress-stack` receives full-width, explicitly visible track styling. Its **already-completed**, **current draft**, and **remaining** segments are visually distinguished. Current and projected totals now occupy two clearly separated statistic cells; the draft delta and legend form dedicated rows.

The saved/current and projected values are still derived from the existing Library title and draft. This update does **not** create a second progress model or modify the submission pipeline.

## 4. v397 floating Quick Actions and Task Progress overlap

**Problem:** On smaller screens the always-visible + button and conditional progress widget obscured the bottom area of cards, including Edit, Reroll, Expand and Remove controls.

**Fix:** Phones/tablets receive reduced dock dimensions, safe-area-aware bottom/right positioning and increased trailing scroll room in application content. Relevant action controls receive scroll-margin space so they can be moved above the dock. Blocking dialogs continue to take precedence over floating controls. The v397 approved **Prototype v2** appearance, animated task bar/background, always-visible + button, fan menu, category matching and targets are **not redesigned**.

The dock remains floating; its occupied area can still overlap intermediate scrolling content, but actionable content can be scrolled above it. No claims of eliminating every possible collision are made without physical-device verification.

## 5. Collections → Add Titles picker (five view modes)

**Problem:** The phone/tablet picker forced dense toolbars into narrow rows, while Covers and Covers+Titles could produce unreasonably narrow cards. The footer crowded the browse area.

**Fix:** The search, filters, display tools, Direct Add / Multi-Select controls and selection/pagination footer now use bounded, touch-friendly mobile/tablet spacing. The title-results pane gets a dedicated scroll region. Cover galleries use a reasonable minimum card width at tablet sizes and two columns on typical phones, falling to one on very narrow phones. Covers+Titles names use a three-line clamp and separate Add/Added controls. Long metadata no longer expands the cover grid vertically.

Existing title import, direct addition, checked selections, sorting, category filtering, selection toggling and pagination remain delegated to their original handlers.

## 6. Personal Order → Add Collections picker (five view modes)

**Problem:** Tall inconsistent collection cards, clipped covers and buttons, unreadable names, crowded display/filter controls and awkward scrolling made collection assignment difficult on phones/tablets.

**Fix:** A bounded modal uses a scrollable result pane and predictable header/filter/footer regions. List and Compact produce readable horizontal rows, Cards use a balanced media/text/action composition, and Covers/Covers+Titles receive responsive gallery widths. Collection names wrap cleanly, cover proportions are preserved, and Add/Added buttons remain within their cards.

The existing category assignment selector, sorting, page navigation, direct assignment and multi-selection mechanisms are preserved.

## 7. Personal Order → Add Titles picker (five view modes)

**Problem:** The Covers+Titles mode placed multiple extremely narrow titles side by side, leading to character-by-character wrapping and clipped Add buttons. Other modes and pager controls were also crowded.

**Fix:** The modal now uses bounded height with a dedicated title-results scroller; on phones, cover galleries use two sensible columns (or one for especially narrow screens), while List/Compact/Cards maintain readable row widths. Long Covers+Titles names are limited to three lines, with the full value still present in the original title element. Add/Added actions remain touch-sized and distinct. Tablet layouts adapt to available width without inheriting small-phone column counts.

Positioning, assignment, selection, title search, sorting, custom cover/text-size settings and pagination retain the same application state and data flows.

## 8. All picker display modes are in scope

For **each** of the three pickers above, all five display modes received responsive rules and were exercised through their actual application mode handlers:

| View | Responsive objective |
| --- | --- |
| List | One legible full-width row per result |
| Compact | Denser, but still readable rows |
| Cards | Covers, names and actions have enough width |
| Covers | Proportional artwork with clear Add/Added controls |
| Covers+Titles | Readable artwork/title balance; constrained long titles |

Selection state, current page, saved preferences, modal lifecycle and data mutations continue through the existing MediaFlow workflows. **Desktop rules and desktop view modes were not revised.**

## 9. Themes, performance and accessibility

- All new responsive surfaces use the existing MediaFlow theme variables (`--panel`, `--text`, `--flow`, `--border` and related values), avoiding any new per-widget theme setting.
- Scrollable result panes use contained scrolling; no full-Library render or new data fetch was introduced.
- Search focus, Direct Add, Multi-Select, scrolling and pagination remain handled by existing picker code.
- Mobile/touch minimum sizes, readable label wrapping, safe-area spacing and accessible native disclosure behavior are retained.
- No database tables, RLS policies, authentication settings, Supabase secrets, cloud-sync schemas, backup schema or History formats were changed.

The update does **not** claim a measured improvement at 100,000 titles. Synthetic tests exercise the existing pagination architecture; large production-Library performance was not benchmarked in this release.

## 10. Technical changes

| File | Change |
| --- | --- |
| `assets/css/211-v398-mobile-tablet-responsive-repair.css` | New isolated phone/tablet layout rules, 320–1023px |
| `src/js/pages/dashboard/011-view-dashboard.js` | Adds mobile/tablet expandable reason disclosure while preserving desktop reason-chip markup |
| `index.html` | Loads the v398 responsive stylesheet and current v398 bundle |
| `VERSION`, `version.json`, `package.json` | Current release metadata updated to 398 |
| `sw.js` | PWA cache identity and app-shell manifest updated through existing build scripts |
| `README.md`, `README2.md` | Current release documentation |
| `scripts/test-v398-responsive-ui.py` | New responsive UI, unified bar, every picker view and viewport browser coverage |
| `scripts/test-v398-desktop-visual-parity.py` | v397 vs v398 desktop card pixel comparison; requires v397 ZIP beside extracted v398 tree |
| `scripts/test-v398-*-regression.py` | Existing v397/v396/v393 functional and save-path regression suites run against the v398 bundle |

No new database migration or third-party paid dependency is required.

## 11. Verification results

**Build:** Python modular compiler succeeded: **289 JavaScript source fragments**, including **146 runtime extension modules**. Node JavaScript syntax validation passed. PWA app-shell generation discovered **167 local assets**. Release ZIP verification is a separate packaging step.

**Responsive UI:** Chromium tests passed at **320, 375, 430, 768, 820, 1023 and 1280px**. They exercised:

- Dashboard recommendation layout and visible progress.
- Real in-app Advanced Logging renderer injecting the unified progress bar, two progress segments and a full-width phone/tablet track.
- **All five display modes in each of three pickers** (15 combinations at each width), covering accessible results, Add/Added actions and absence of horizontal results-pane overflow.
- Current theme-variable based styling without new theme contracts.

**Regressions:**

- Floating Task Progress category matching, fixed/ranged consumption targets, menu actions, Add to Library, Add Collection and Add to Logging: **passed at 375, 430, 820, 1280px**.
- Advanced Logging method switching, quantity conversion, runtime and ordering continuity: **passed at 320, 390, 820, 1280, 1920px**.
- Collection/Personal Order direct add, reversible selection, bulk selection, search focus, duplicate prevention and persistent pickers: **passed at 390, 1280px**.
- Dashboard return, Logging History submission, progress-save semantics, Advanced Logging custom runtime, Add/Edit Library title and invalid-ID preservation: **passed at 320, 390, 820, 1280, 1920px**.

**Desktop comparison:** At **1280 and 1920px**, original v397 and v398 **Recommended Title renders were pixel-identical**. Advanced Logging cards had identical geometry and a tiny **100–104-pixel transient input-caret difference out of 583,740 pixels**, rather than a structural or stylistic layout change. Existing desktop interactions passed regression checks.

**Not verified:** production authenticated Supabase sync; physical Android/iOS tablets and phones; third-party browser engines; installed native wrappers; full 100,000-title stress and long-duration performance; exhaustive visual inspection of every theme and custom cover-size combination.

## 12. Release summary

**MediaFlow v398** repairs the accepted v397 experience **for both mobile and tablet users**, across seven specific issues and all view modes in the three affected popups. The upgrade makes Dashboard recommendation, Advanced Logging and existing picker interactions more readable and usable without replacing their canonical algorithms, save methods or data structures.

**Desktop's v397 design and functionality remain the baseline.**
