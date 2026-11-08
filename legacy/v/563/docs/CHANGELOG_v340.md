# MediaFlow v340 — Consumption History Navigation & Recently Viewed Title Cards

**Release:** MediaFlow v340  
**Base:** MediaFlow v339 Modular  
**Created by:** Alex Godly  
**Release date:** October 9, 2026

## 1. Consumption History — Newer/Older Weeks Icons Corrected

### More Meaningful Week Navigation

Replaced the inherited generic circular action glyphs around **Newer weeks** and **Older weeks** with semantic calendar-and-direction icons.

- **Newer weeks:** calendar with a left-pointing arrow, reflecting movement toward more recent history.
- **Older weeks:** calendar with a right-pointing arrow, reflecting movement toward earlier history.
- Existing week-page text, count, navigation behavior, and disabled states are preserved.

### Duplicate Global Action Icons Prevented

Both pager buttons are explicitly excluded from MediaFlow's automatic generic button-icon injection. This prevents the new semantic icons from appearing beside another unrelated circular arrow.

### Existing Week Pagination Preserved

- Page-size preferences remain unchanged.
- Newer/older navigation remains linked to the same week-page actions.
- The original History filters and weekly statistics continue to work.
- Calendar icon color follows the current MediaFlow theme.

---

## 2. Recently Viewed — Display Real Titles Instead of Category Placeholders

### Title-Level Log Rendering Added

Previously, the Recently Viewed tab could treat an entire Consumption log as one card. Logs containing multiple titles could consequently appear as a single category-labeled item instead of displaying the actual titles recorded in the log.

Recently Viewed now inspects the log's **`titles[]`** records and creates separate cards for the identifiable titles inside each session.

### Multi-Title Logs Supported

If a single Consumption log contains several named titles, each distinct title can appear as its own card, with its own:

- title name;
- Library cover when available;
- original log time;
- category context;
- logged units and proportional logged duration;
- Edit Log action.

The original session remains a single stored log; v340 does not split it into multiple database records.

### Real Title Covers Restored

For each named title, MediaFlow resolves the matching Library item by saved Library ID first, then by normalized title lookup if necessary.

Each Recently Viewed title card uses **that title's cover URL**, not a generic category cover.

When a title is missing from the Library or has no cover, the card displays a clean fallback rather than inventing a cover.

### Actual Title Names Restored

The main line of each card now prioritizes its logged title name. Category information is reduced to supporting metadata, rather than being repeated as the main title.

### Duplicate Recently Viewed Entries Reduced

Recently Viewed remains a list of **distinct recent titles**. Repeated logs of the same identifiable title no longer cause a duplicate card for every occurrence. The most recent matching log supplies the card's Edit Log target.

### Legacy Category-Only Logs Handled Safely

Some earlier sessions have no saved title names or Library IDs. These category-only records cannot be converted into real title cards without fabricating information.

v340 therefore leaves them available in **Consumption History** and **Logs**, rather than displaying a category label as if it were a genuine title inside Recently Viewed.

---

## 3. Recently Viewed — Organized Card Design

### Compact Cards Redesigned

Recently Viewed now uses a calmer, more organized layout:

- a dedicated portrait title cover;
- a clear, readable title name;
- category and log time as secondary information;
- logged amount and duration;
- a dedicated **Edit log** button.

### Unnecessary Icon Beside Covers Removed

The generic circular action icon previously injected at the start of each Recently Viewed card is removed. A title card is no longer implemented as one large button, so global button-icon injection cannot insert a misleading icon beside the poster.

### Dedicated Edit Icon Added

The Edit Log action uses a small pencil/edit icon that clearly communicates the action. Its button is intentionally excluded from duplicate automatic icon enhancement.

### Title Details Shortcut Preserved

When the title still exists in the Library, selecting the title name opens its existing Title Details view. The separate Edit Log control edits the history entry instead.

### Day and Time Grouping Preserved

The day-based vertical timeline remains in place. Entries are grouped into dayparts such as Morning, Afternoon, Evening, and Night, with a compact count of distinct titles for each group.

### Per-Title Logging Times Supported

When available, v331 per-title log timestamps are used so title cards display and group by the recorded date and time of the actual title entry. Older entries continue using their session timestamps and dates.

### Time Zone Handling Refined

Day grouping and Today/Yesterday labels use local calendar dates to avoid incorrectly grouping near-midnight titles under another day.

---

## 4. Existing Recently Viewed Controls Preserved

The existing filters continue working with title-level results:

- Category filter.
- All time / Last 7 days / Last 30 days / Last year.
- Search by title.
- Recently Viewed pagination.

The result count now refers to **distinct named titles** in the filtered result, rather than category-placeholder cards.

### Existing Log Editor Reused

Selecting **Edit log** calls the existing `App.openSessionModal(sessionId)` action.

The normal **Edit Log Entry** popup is reused. v340 does not introduce a separate editor, reimplement log saving, or change XP calculations.

### Existing History Data Preserved

This release modifies only rendering and navigation presentation. Consumption session records, per-title log rows, stored XP, timestamps, exports, History filters, and cloud state remain untouched.

---

## 5. Performance, Responsive Layout & Accessibility

### Fast Library Lookups Reused

The new renderer reuses MediaFlow's existing Library ID and title lookup indexes. It does not scan the complete Library separately for every displayed title, keeping it practical for large libraries.

### Paginated Rendering Preserved

The view keeps existing pagination to avoid inserting thousands of card elements into the DOM at once.

### Desktop, Tablet & Mobile Support

The card grid adapts to viewport width. On narrow screens, cards stack vertically, Edit Log becomes icon-led, and filters fit without horizontal overflow.

### Semantic Controls

Week navigation retains its readable button labels. The Edit Log action includes an accessible label naming the corresponding title.

### Dynamic Theme Compatibility

The new presentation uses the existing MediaFlow surface, border, accent, and text variables.

### Reduced-Motion Preferences

Hover transitions are suppressed when reduced motion is requested.

---

## 6. Release Files & PWA

### New Runtime Module

`src/js/components/237-v340-history-navigation-recent-titles.js`

### New Stylesheet

`assets/css/167-v340-history-navigation-recent-titles.css`

### New Browser Regression Test

`tests/test-v340-history.py`

### Bundled Application

`assets/js/mediaflow-v340.bundle.js`

### Release Metadata

- `VERSION`: **340**.
- `version.json`: appVersion, version, and build **340**.
- `package.json`: **340.0.0**.
- `index.html`: references the v340 bundle and new stylesheet.

### PWA Cache

`mediaflow-pwa-v340-shell-v1`

The service worker and app-shell asset list were regenerated for the current release.

---

## 7. Cloud & Export/Import Compatibility

No Supabase SQL migration is required. This release makes no changes to the cloud project configuration, cloud schema, stored Consumption history, XP ledger, or import/export payload format.

| System | Version |
|---|---|
| Cloud Sync | 201 |
| Full Backup Schema | 29 |
| Settings Preset Schema | 1 |
| Personal Order Export | 5 |
| Collections Export | 2 |

History CSV/JSON export and full backups remain supported using their existing format and data.

---

## 8. Release Verification

The following checks passed locally:

- v340 JavaScript syntax and generated application bundle.
- Consumption History week pager icons and retained navigation callbacks.
- Recently Viewed: multiple named titles from one session.
- Recently Viewed: unique-title deduplication.
- Correct Library cover source selection and cover fallback.
- Per-title Edit Log action resolves to the original saved session.
- Title Details shortcut works independently of Edit Log.
- Title search and category filtering.
- Older category-only logs are not misrepresented as named titles.
- Mobile viewport does not overflow horizontally in the targeted browser fixture.
- Regression tests for v334 XP, v335 Statistics, v336 analytics, v337 milestone bars, v338 selection checkboxes, and v339 cloud/Collection import audit.
- PWA asset manifest and bundled-JavaScript generation.

**Verification limitation:** Live authenticated Supabase sync and deployed GitHub Pages behavior were not tested in this local build.

---

## v340 Release Summary

- Replaced Newer weeks / Older weeks generic icons with calendar-direction icons.
- Prevented duplicate automatic button icons on week navigation.
- Removed the generic circular icon beside Recently Viewed title covers.
- Rebuilt Recently Viewed to display real individual titles from multi-title logs.
- Added per-title poster/name/time/amount context.
- Added a dedicated Edit Log button that opens the existing log editor.
- Preserved title-details access for Library titles.
- Kept only distinct titles in the Recently Viewed overview.
- Preserved category-only legacy logs in Consumption History and Logs without inventing title identities.
- Retained filtering, search, pagination, cloud state, backups, History and XP calculations.
- Updated v340 release metadata and PWA shell.

### Version Progression

**v337** → Dual Time and XP milestones.  
**v338** → Normal Library cover-selection visibility fix.  
**v339** → Cloud persistence, import/export, backup, XP and PWA integrity audit.  
**v340** → **Consumption History navigation icon polish and organized title-level Recently Viewed cards with Edit Log controls.**
