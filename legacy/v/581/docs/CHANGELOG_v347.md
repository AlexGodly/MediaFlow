# MediaFlow v347 — Collections / Personal Order Layout Separation

**Release:** MediaFlow v347  
**Base:** MediaFlow v346 Modular  
**Created by:** Alex Godly  
**Release Date:** October 9, 2026

---

## 1. Collections — Unnecessary Lists / Tabs Switch Removed

### Removed the Collections Layout panel
Removed the extra **Collections Layout → View mode** card from the Collections page.

This card offered Lists and Tabs layouts and explained that users could browse Category Titles and Collection Queues through the Collections page. Those features belong to Personal Order, not the general Collections browser.

### Restored the normal Collections browser
The Collections page now always uses its existing dedicated browser and management interface, without the Personal Order queue-tab workspace.

The original Collections functions remain available, including browsing, creating and editing Collections, cover layouts, searching/sorting, Collection details and import/export actions.

### Previous Collections Tabs preferences handled safely
Accounts that previously selected **Collections → Tabs** in v345 or v346 will still see the native Collections browser after updating to v347.

The old `orderPlan.v288QueueView.collectionsBrowseMode` field is harmlessly ignored by the Collections renderer. No user data is removed or reset just to make the interface appear correctly.

### No duplicate view-layout switch
Collections retains its own existing display-mode choices for its Collection browsing presentation. It no longer offers the separate Personal Order queue-level Lists/Tabs switch.

---

## 2. Personal Order — Lists / Tabs Remains Available

### Personal Order retains the view-layout switch
The **Lists / Tabs** toggle remains in Personal Order, where it belongs.

### Category Titles main tab preserved
Category-specific ordered title queues remain available, using saved title order and the configured category order.

### Collection Queues main tab preserved
Category-specific Collection queue assignments remain available, preserving existing assigned Collection order and actions.

### Category subtabs and icons preserved
The nested category tabs retain their category names, icons, counts, display order and visibility rules.

### v346 toolbar controls preserved
Personal Order Tabs continues supporting:

- Paginate ordered titles.
- Ordered titles per page.
- Cover size slider and numerical input.

These remain connected to their existing Personal Order settings, including mixed title/Collection queue pagination.

### Existing Lists layout preserved
Personal Order's original complete Lists view remains available without changing title ordering or Collection assignments.

---

## 3. Backwards-Compatible Queue Navigation

The existing `App.v345OpenQueueTabs()` shortcut, if called by older code, now navigates into the **Collection Queues** tab of **Personal Order** rather than opening a queue workspace inside Collections.

This prevents old entry points from reintroducing the wrong page layout.

---

## 4. Existing Data & Cloud Compatibility

### Existing Collection data preserved
No changes were made to Collection records, title membership, covers, queue assignments, or title order.

### No Supabase migration required
All changes are local application rendering/navigation logic. No SQL changes or Supabase schema migration are required.

### Existing state and transfer formats preserved

| System | Version |
|---|---:|
| Cloud Sync | 201 |
| Full Backup Schema | 29 |
| Settings Preset Schema | 1 |
| Personal Order Export | 5 |
| Collections Export | 2 |

### Existing XP and History systems preserved
XP calculations, active-time tracking, Consumption History and Library History are unchanged.

---

## 5. Runtime & Release Metadata

### New runtime module
`src/js/components/244-v347-collections-personal-order-separation.js`

### New browser regression test
`tests/test-v347-collections-order-separation.py`

### JavaScript bundle updated
`assets/js/mediaflow-v347.bundle.js`

### Version metadata updated

- `VERSION`: **347**.
- `package.json`: **347.0.0**.
- `version.json`: **347**.
- `index.html`: references the v347 bundle.

---

## 6. PWA Update

### New shell cache
**`mediaflow-pwa-v347-shell-v1`**

### Service worker regenerated
The current service worker and application-shell asset list include the v347 application bundle.

Existing automatic update settings and PWA behavior remain unchanged.

---

## 7. Local Verification

The compiled v347 application was tested in Chromium for:

- Native Collections browser present.
- Collections Lists/Tabs switch absent.
- Personal Order queue workspace absent from Collections.
- Previously saved Collections Tabs preferences safely ignored.
- Existing Collection cards still available.
- Personal Order Lists/Tabs switch retained.
- Both Personal Order main tabs present.
- Personal Order pagination, page-size and cover-size controls present.
- Collection Queue pagination and assignment rows preserved.
- Personal Order Lists mode still available.
- JavaScript bundle syntax.
- PWA generation and release metadata consistency.

**Verification limitation:** Live deployment to GitHub Pages and authenticated Supabase synchronization were not part of this local release test.

---

# v347 Release Summary

- Removed **Collections Layout → Lists / Tabs** from Collections.
- Restored the native Collections browser for all accounts, including those that previously saved Collections Tabs mode.
- Preserved Collection browsing, editing, cover layouts, import/export and data.
- Retained the **Lists / Tabs** switch exclusively in Personal Order.
- Preserved Category Titles and Collection Queues tabs in Personal Order.
- Preserved Personal Order pagination, page-size and cover-size controls.
- Kept previous queue order, Collection assignments and cloud schemas unchanged.
- Updated release metadata, generated JavaScript bundle and PWA shell to v347.

## Version Progression

**v345** → Introduced Lists/Tabs queues in Personal Order and Collections.  
**v346** → Improved queue icons and tabbed pagination/cover-size tools.  
**v347** → **Removed the misplaced Collections view-mode switch; kept all queue Lists/Tabs functionality solely in Personal Order.**
