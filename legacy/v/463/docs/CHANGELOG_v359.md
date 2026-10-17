# MediaFlow v359 — Independent Picker Page Sizes & Category Tab Redesign

**Release:** v359  
**Baseline:** MediaFlow v358 Modular (Personal Edition)  
**Date:** October 10, 2026  
**Developer:** Alex Godly

---

## 1. Personal Order → Add Titles: Configurable titles per page

- Added a **Titles per page** selector alongside the five existing display modes and text/cover sizing controls.
- Choices: **10, 25, 50, 100, 200, 500** titles per page.
- Default: **50 titles per page**, rather than the previous global Library picker page-size setting (which showed only a few rows in spacious desktop Covers mode).
- The size applies to **List, Compact, Cards, Covers and Covers+Titles** views. Smaller cover tiles can now fill more of the available desktop results area; long result pages scroll within the dialog.
- Added a visible results counter, such as **Showing 201–400 of 618 titles**, which remains visible even when Filters & Sorting is collapsed.
- Changing the size returns to the first page without clearing existing selections, search text, category filters, priority/status filters or display mode.
- Changing pages preserves selected titles, including those selected on earlier pages.
- All existing **Add selected**, **Add shown**, Deselect and pagination actions keep using MediaFlow's canonical Personal Order handlers.
- The saved page size is **independent of the existing 'Ordered titles per page' option** that controls the already-saved Personal Order queue.

## 2. Personal Order → Add Collections: Configurable Collections per page

- Added a **Collections per page** selector with the same **10, 25, 50, 100, 200, 500** options.
- Default: **50 Collections per page**.
- Added a separate Collection results pager with **Previous, five nearby page numbers and Next** controls.
- Added a persistent result summary (e.g., **Showing 26–50 of 121 Collections · Page 2 of 5**).
- Collections are now **rendered only for the current page**, rather than building every Collection card in the DOM at once. This keeps long Collection lists more manageable.
- Changing Collection search, category filter, priority filter, sorting method or sorting direction resets the results to page one without changing the selected page-size preference.
- Changing the assignment category also resets the Collection browser to page one, so the newly assigned/disabled state is visible predictably.
- **Add / Assigned** buttons still invoke the original assignment handler, duplicate checks, queue-position behavior and reward logic.
- Multi-column desktop Collection cards and compact mobile cards from v358 remain supported.

## 3. Page-size Settings and Cloud Persistence

- The two picker page sizes are **independent**. Changing Titles per page does not change Collections per page, or the pagination of the Personal Order queue itself.
- Stored using the existing Settings persistence pipeline in the additive key:

  `settings.v359PickerPagination = { titles: 50, collections: 50 }`

- Both values are constrained to the six available page-size choices, preventing an accidental attempt to render all 30,000–50,000 Library items on one browser page.
- No new database tables, SQL migrations, cloud endpoints or transfer formats are introduced.

## 4. Personal Order → Category Titles and Collection Queues: Tab Redesign

- **Rebuilt the category-tab markup**, rather than only adjusting CSS gaps from previous releases.
- Each category tab now has three explicit aligned areas:
  1. a **34px icon tile** holding the category's actual configured image or emoji;
  2. a readable category-name area with stable spacing and ellipsis for long names;
  3. a separate count badge with consistent sizing and numeric alignment.
- Polished card borders, corner radius, current-category highlighting, hover and keyboard focus under existing MediaFlow dynamic-theme tokens.
- Preserved horizontal scrolling when many categories are visible rather than squeezing the tab names and icons together.
- Used a more compact but still separated **30px icon tile on phones**.
- The same improved category-tab markup applies to **Category Titles** and **Collection Queues** tabs. Existing category sequence, tab counts, selection logic and category visibility remain untouched.
- Tab buttons remain excluded from generic automatic action-icon injection to prevent duplicate decorative icons.

## 5. Source and Built Assets

- New runtime: `src/js/components/257-v359-picker-pagination-category-tabs.js`.
- New CSS: `assets/css/185-v359-picker-pagination-category-tabs.css`.
- Rebuilt JavaScript: `assets/js/mediaflow-v359.bundle.js`.
- Updated `src/js/runtime-order.json`, `VERSION`, `version.json`, `package.json`, `index.html`, `README.md`, `manifest.json`, and `sw.js`.
- Regenerated PWA shell cache: **`mediaflow-pwa-v359-shell-v1`**.
- Build from source with `python scripts/build.py`.

## 6. Verified Regression Coverage

### Browser interactions (offline synthetic account)

Test: `tests/test-v359-pagination-tabs.py`

Passed at **320×720, 390×844, 820×1024, 1280×900 and 1920×1080** CSS pixels:

- Default Add Titles results show **50** titles, and changing to **200** renders 200 entries.
- Per-page selection persists after choosing a new size.
- Title navigation updates the visible range (e.g. **201–400**).
- The Add Titles filter disclosure is not nested on reopening.
- Collection browsing defaults to **50**, changes to **25** and **200**, and displays exactly the expected number of cards for a 121-Collection fixture.
- Collection paging advances and reports the correct visible range.
- Collection sorting and search return to the first page.
- Search narrowing from 121 Collections to 11 displays all 11 and updates the pager.
- Saved title and Collection page-size choices persist when the dialogs are reopened.
- Both **Category Titles** and **Collection Queues** display icon, name and count in separate tab elements with measurable spacing.
- No horizontal document overflow or uncaught browser exceptions in these scenarios.

### Broader compatibility checks

- `python scripts/check.py` — **passed** (source manifest, required functionality and current PWA assets).
- `tests/test-v359-xp-regression.py` — **passed**; action rewards and XP-breakdown totals preserved.
- `tests/test-v359-all-pages.py` — **passed**; ten page families across twelve viewport widths from **320 to 1440** CSS px, without horizontal page overflow.
- Build regenerated the bundle with **JavaScript syntax check passed**.

**Not independently tested:** Real account login, authenticated Supabase state writes, installed-PWA upgrade, deployed GitHub Pages behavior or physical Android/iOS browser behavior. The local browser tests use synthetic data, not a live authenticated account.

## 7. Data and Cloud Compatibility

| Component | Compatibility |
|---|---|
| Cloud Sync | v201, unchanged |
| Full Backup | Schema v29, unchanged |
| Settings Presets | Schema v1, unchanged |
| Personal Order export/import | Format v5, unchanged |
| Collections export/import | Format v2, unchanged |
| XP / streak reward logic | Unchanged |
| Supabase migration | Not required |

**Deployment:** Upload the complete v359 release, keep a current Full Backup, refresh the website/PWA and confirm v359 is active before relying on the new picker page sizes.

---

**MediaFlow v359 · Alex Godly**
