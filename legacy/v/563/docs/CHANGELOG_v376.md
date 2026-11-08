# MediaFlow v376 — Personal Order UI Parity, Position Readability & Continuous Collection Queues

**Release:** v376 Modular — Personal Edition  
**Feature baseline:** MediaFlow v375 (restored v373 application)  
**Date:** October 11, 2026  
**Developer:** Alex Godly  
**Status:** Local development candidate; no production deployment or live cloud-account certification.

---

## 1. Personal Order — Shared Title/Collection Layout Contract

**Previous issue:** Layers from prior Personal Order UI updates applied conflicting grid sizing to order badges, covers and copy. In narrow cards, posters intruded into the position lane, badges clipped beyond two digits, some number inputs became too narrow and collection metadata could be squeezed into the cover lane.

**v376 solution:** A final theme-aware layout layer standardizes the three major columns for direct titles, Collection Queue direct titles, and assigned Collection blocks: a **protected number lane**, a **proportional cover lane**, and a **flexible title/metadata lane**. Bottom action toolbars and assignment detail panels retain full row width. This applies to Tabs / Category Titles, Tabs / Collection Queues, Lists / All Titles, Lists / By Category, and assigned Collection rows.

**Result:** Readable cover/position spacing with no hidden controls, no incorrect column overlaps, and no dependence on hard-coded desktop-only dimensions.

## 2. Position Badges — At Least Three Digits

**Previous issue:** Position labels and editable Collection-position inputs could be limited to 28–34 px, obscuring values such as 125 or 999.

**v376 solution:** Shared minimum position lane **54 px** at normal widths and **48 px** on narrow screens, with natural-content sizing for labels and tabular-number alignment. Handles plain numeric badges and editable positions. Numbers are centered; their column cannot collapse beneath posters.

**Affected areas:** Direct title rows, Collection Queue direct-title rows, assignment position inputs, and inner rows in expanded assigned Collections.

**Result:** 1-, 2- and 3-digit positions display without clipping or poster overlap. Wider number strings can expand where the underlying control allows it.

## 3. Lists / All Titles — Continuous Collection Queue

**Previous behavior:** The Collection Queue board always used a separate card for every category, even when the selected title-order view was **All Titles**. On desktop, multiple category cards were laid out as independent columns.

**v376 solution:** The Collection Queue board now follows the parent Personal Order display mode:

- **Lists → All Titles:** one **continuous Collection Queue list**, flowing through the visible categories in the configured category order. Direct titles and assigned Collection blocks render as consecutive rows in one panel.
- **Lists → By Category:** the existing **category-grouped Collection Queue sections** remain, matching the grouping used by Title Order.
- **Tabs → Category Titles / Collection Queues:** focused category tabs remain available and retain their previous category selection, filters and pagination.

**Position semantics:** In All Titles mode, a continuous presentation index is shown. The editable position of an assigned Collection remains its **category-local canonical queue position**, not its global visual index. This prevents accidental reordering of a different category or writing incorrect positions to cloud state.

**Result:** Title Order and Collection Queue follow the same **All = continuous / By Category = grouped** display model without modifying the underlying queue data.

## 4. Assigned Collection Cards — Artwork and Actions

The three-column layout is shared by assigned Collection blocks in regular mixed orders and dedicated Collection Queues. Collage/single-cover display remains visible, with cover size controlled by the existing Collection cover scale setting. The following stay available:

- Open assigned Collection.
- Show / Hide titles.
- Up / Down moves and editable category-local position.
- Remove assignment.
- Category rule and Completed-title rule.
- Reset assignment progress when applicable.

No assignment rule, eligibility, or recommendation logic was rewritten.

## 5. Expanded Collection Order — Consistent Inner Rows

Expanded assigned Collections use the same protected number/cover/text separation, including three-digit entries for large Collection lists. Eligibility labels wrap below title copy on narrow screens rather than forcing the poster or number column to collapse. The existing per-assignment pagination, Titles/page control, skipped/completed/traversed states, and content ordering are unchanged.

## 6. Desktop / Tablet / Mobile

The local browser test used the compiled v376 JavaScript and release CSS across the following Chromium viewports:

| Viewport | Verified |
| ---: | --- |
| 320 px | Continuous queue, grouping, tabs, badge/cover separation, no horizontal document overflow |
| 390 px | Same + expanded Collection order |
| 820 px | Same |
| 1280 px | Same |
| 1920 px | Same |

The test uses **synthetic account data**, including 126 direct titles, two Collection assignments, and an expanded Collection with 140 inner entries. It verifies visible continuous display numbers, category-local editable inputs, saved queue state unchanged after display switches, protected lanes, and existing Tab navigation. No physical-device or authenticated cloud-account verification was performed.

## 7. Technical Files / Source Integration

- `src/js/components/272-v376-personal-order-parity.js` — continuous Collection Queue renderer and application-scoped v376 runtime extension.
- `assets/css/194-v376-personal-order-layout-parity.css` — shared badge/cover grid rules across all Personal Order rendering modes.
- `src/js/runtime-order.json` — registers the last-load v376 runtime extension.
- `index.html` — loads the v376 style and generated release bundle.
- `assets/js/mediaflow-v376.bundle.js` — complete rebuilt modular JavaScript bundle.
- `sw.js`, `version.json`, `manifest.json` — regenerated by the existing PWA build workflow.
- `VERSION`, `package.json` — versioned to 376.
- `tests/test-v376-personal-order-parity.py` — compiled browser rendering regression.
- `README.md`, `README2.md`, `docs/CHANGELOG_v376.md` — release documentation.

**Existing persistent data contracts:** Cloud Sync v201; Full Backup v29; Settings Preset v1; Personal Order export v5; Collections export v2. No SQL migration or external tracking integration.

## 8. Build / Validation

- `python scripts/build.py` — compiled v376 bundle with release-aware PWA assets.
- `node --check assets/js/mediaflow-v376.bundle.js` — syntax verified.
- `python scripts/check.py` — application structure and runtime checks.
- `python tests/test-v376-personal-order-parity.py` — 320/390/820/1280/1920 Chromium browser checks passed.

**Limitations:** No authenticated cross-device sync tests; no real user data used in tests; physical touch devices not verified. Deployment to `main`/GitHub Pages is **not** part of this local development package and is pending owner acceptance.

## 9. Compatibility & Preserved Behavior

- v375 original v373 Logging Sorting & Custom Order Studio, itemized/quick Logging, History and XP preserved.
- Personal Order category order, saved title list, mixed category queues, direct-title moving and dragging, Collection assignment handlers, Collection completion rules and recommendation behavior not modified.
- Existing responsive settings and cover-size controls retained.
- Canceled v374 MAL/SIMKL OAuth tracking remains **absent**. Existing MAL/SIMKL import tools are separate and unaffected.

## 10. Version Evolution

- **v373:** Logging sorting, manual ordering and session-level organization.
- **v374:** Experimental MAL/SIMKL tracking integration, subsequently canceled.
- **v375:** Version-only restoration of the v373 application, tracking schema removal and disabled tracking backend.
- **v376:** Personal Order badge/cover parity and continuous Collection Queue in Lists / All Titles; category grouping retained when By Category is selected.

## 11. Deployment Notes

1. Back up MediaFlow data and retain the working v375 ZIP.
2. Test the v376 ZIP with a local HTTP server (`python -m http.server 8080`). Do not launch the PWA under `file://`.
3. Confirm in **Lists → All Titles** the Collection Queue is continuous.
4. Confirm in **Lists → By Category** the Collection Queue uses category groups.
5. Verify all Tabs, cover sizes, badge values 1–999, plus Open/Hide/Move/Edit/Remove controls.
6. If accepted for deployment, push the approved changes to `main` with the **exact commit message `376`**; deploy the complete site and confirm PWA cache refresh.
7. Verify authenticated Cloud Sync and physical-device layouts after deployment.

---

# Final Release Summary

**MediaFlow v376 — Developed by Alex Godly**  
*Personal Order UI Parity • Readable Position Badges • Continuous Collection Queue • Responsive Collection Artwork*

A focused, non-schema release that corrects layout collisions and makes **Collection Queue** honor **All Titles vs By Category** the same way **Title Order** does.

**Release status:** Built and tested locally with synthetic browser data; pending user acceptance and production verification.
