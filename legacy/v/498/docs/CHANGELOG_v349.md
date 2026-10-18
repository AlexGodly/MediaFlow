# MediaFlow v349 — History Initial Scroll Position Fix

**Release:** MediaFlow v349  
**Base:** MediaFlow v348 Modular  
**Created by:** Alex Godly  
**Release Date:** October 10, 2026  
**Edition:** Personal Edition

---

## 1. History — Initial Scroll Position Fixed

### History now opens at the top
Fixed an annoying navigation issue where opening **History** for the first time could display the **Consumption History** page already scrolled far down, forcing users to scroll back to the beginning.

When entering History from another page, v349 resets the page's scroll position to the top immediately.

### Initial render scroll restoration improved
The scroll reset is applied before and after the initial History render, then checked during the next two animation frames. This prevents the previous page's scroll position and subsequent layout updates from carrying a deep scroll offset into History.

### Desktop navigation fixed
Selecting History from the sidebar now opens the History page at the top.

### Mobile navigation fixed
Selecting History from the mobile navigation also resets the initial scroll position.

### Theme and layout compatibility
The reset checks the document scroll position and the common MediaFlow content containers, helping it work across standard, responsive, and dynamic-theme layouts.

---

## 2. History — Existing Scroll Behavior Preserved

### Internal History rerenders do not jump to the top
The new reset is limited to **entering History from another page**. Rebuilding the History panel while already viewing History does not trigger another top reset.

### Tab navigation preserved
The existing behavior of the History tabs remains unchanged:

- Consumption History
- Recently Viewed
- Ratings
- Logs
- Library History
- XP History

### Pagination preserved
Existing week pagination, Library History pagination, Recently Viewed pagination and XP History pagination retain their prior behavior.

### Filters and searches preserved
History filtering and searching do not trigger the new initial-navigation scroll reset.

### Log editing preserved
Editing, viewing and exporting History records remains unchanged.

---

## 3. Existing MediaFlow Systems Preserved

v349 is a focused navigation fix. The following are unchanged:

- Dashboard and Library behavior.
- Personal Order Lists/Tabs and queue management.
- Collections browsing and editing.
- All v348 XP rewards and universal streak settings.
- XP History and reward event records.
- Active Time Spent tracking and statistics.
- Full Data Export and Import.
- Automatic backups and exports.
- Settings Presets export/import.
- Personal Order and Collections import/export.
- Cloud Sync and Sync Now.
- Account/profile data and settings.
- Dynamic themes and responsive layout.

---

## 4. Cloud & Backup Compatibility

### No Supabase migration required
The fix changes only how the History interface scrolls when opening. It introduces no new database tables, columns, policies, application-state fields, or SQL migrations.

### Existing Supabase configuration preserved
The same MediaFlow Personal Edition Supabase configuration is retained.

### Data-format versions preserved

| System | Version |
|---|---:|
| Cloud Sync | 201 |
| Full Backup Schema | 29 |
| Settings Preset Schema | 1 |
| Personal Order Export | 5 |
| Collections Export | 2 |

---

## 5. Release Files & Versioning

### New runtime module
`src/js/components/247-v349-history-first-open-scroll-reset.js`

### New browser regression test
`tests/test-v349-history-scroll.py`

### JavaScript bundle updated
`assets/js/mediaflow-v349.bundle.js`

### VERSION updated
MediaFlow now reports **349**.

### package.json updated
Package version: **349.0.0**.

### version.json updated
Application version and build metadata are aligned to **349**.

### index.html updated
The HTML entry point loads the v349 bundle.

---

## 6. PWA & Application Updates

### PWA shell cache updated
`mediaflow-pwa-v349-shell-v1`

### Service worker regenerated
`sw.js` references the v349 JavaScript bundle and current app-shell assets.

### Existing update controls preserved
Automatic update checks, managed reload, and the optional automatic installation behavior remain unchanged.

---

## 7. Release Verification

Tests passed locally against the compiled v349 bundle:

- Open History from another page: scroll resets to top.
- Enter History using mobile navigation: scroll resets to top.
- Internal History rerender: current scroll position preserved.
- Clicking History while already on History: current scroll position preserved.
- History page renders successfully.
- No browser JavaScript exceptions in the regression test.
- JavaScript syntax validation passed.
- PWA shell generated for v349.

**Verification limitation:** Live GitHub Pages deployment, installed-PWA upgrade and authenticated Supabase synchronization were not independently tested.

---

# v349 Release Summary

- Fixed History initially opening already scrolled down.
- Reset scroll to the top when entering History from another page.
- Covered desktop and mobile navigation.
- Added follow-up frame checks to prevent initial layout/scroll restoration issues.
- Preserved internal History scroll on rerenders.
- Preserved History tabs, pagination and filters.
- Preserved all existing data, XP, cloud and export/import functionality.
- Updated version metadata and PWA assets to v349.

## Version Progression

**v347** → Collections / Personal Order layout separation.

**v348** → Universal streak XP, seven new action rewards, XP History and cloud/export audit.

**v349** → **History initial scroll restoration fix: Consumption History now opens at the top on first navigation.**

---

**Release note:** No Supabase migration is required. Existing History, Library, XP and Cloud Sync data formats remain unchanged.
