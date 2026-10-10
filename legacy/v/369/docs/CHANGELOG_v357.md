# MediaFlow v357 — Personal Order Dialog Space, Collection Picker Controls & Queue Icon Polish

**Release:** v357  
**Base:** MediaFlow v356 Modular  
**Date:** October 10, 2026  
**Created by:** Alex Godly  
**Edition:** Personal Edition

---

## 1. Personal Order — Better Desktop Use of Add Titles / Add Collections

- Expanded the **desktop Add Titles** and **Add Collections** dialogs so they use more of the available workspace.
- Rebalanced each dialog so the **results area stays the priority**, instead of filters consuming too much room.
- On desktop, the **Add Titles** dialog now separates the search / filters column from the results column.
- On desktop, the **Add Collections** dialog now keeps assignment, search and filtering on the left while the **Collection results stay large on the right**.
- Mobile and tablet still keep the compact bottom-sheet flow introduced in the previous releases.

## 2. Add Collections — Searchable Category Filter + Better Sorting Controls

- Replaced the narrow Collection **category filter dropdown** with a **searchable inline picker**.
- The new picker reads the original `<select>` options, so it still follows MediaFlow’s existing category ordering and filter logic.
- Replaced the Collection **Direction** dropdown with **clear Ascending / Descending buttons**.
- Expanded Collection sorting so the Personal Order Collection picker now supports the same main browser-style sort choices used on the Collections page:
  - **Recently updated**
  - **Alphabetic**
  - **Recently added**
  - **Recently viewed**
  - **Title count**
  - **Progress**
- Existing Collection search, priority filtering, assignment rules and duplicate-protection remain unchanged.

## 3. Collection Matching Logic — Parity with Current Picker Filters

- Updated the Collection picker matching logic so it still honors:
  - Collection search
  - filtered contained-title category
  - filtered contained-title priority
  - chosen sort mode
  - chosen sort direction
- Sorting is still applied only to the **picker results view**; it does not rewrite Collection data or Personal Order queue positions.
- Existing Personal Order assignments continue to use the same stored structure and export format.

## 4. Queue Tabs — Category Icon Alignment Fix

- Refined **Personal Order Tabs mode** category tab styling so the **category icon sits in its own lane** instead of feeling visually attached to the category name.
- Improved icon / label / count alignment on both **desktop and mobile**.
- Helps custom category icons look cleaner and more professional inside the tab strip.

## 5. Personal Order Quick Buttons — Meaningful Unique Icons

- Added explicit, meaningful icons to the main Personal Order quick-workspace buttons, including:
  - **Add title**
  - **Add Collection**
  - **Lists**
  - **Tabs**
  - **Category display**
  - **Queue tools**
- Prevented these buttons from receiving duplicate generic icon injections.
- Kept the existing actions and handlers exactly the same.

## 6. Picker Visual Polish / Small Icon Fixes

- Increased the clarity of small inline icons inside Add Titles / Add Collections picker metadata.
- Protected picker icons from looking clipped in the dialog rows.
- Preserved the current theme-aware surfaces, borders, text and focus states.

## 7. Preservation and Compatibility

- No change to Personal Order data model.
- No change to Collection data model.
- No change to Cloud Sync schema or Supabase migrations.
- No change to Personal Order export/import format (**still format v5**).
- No change to Collections export/import format (**still format v2**).
- Existing backups, settings presets, Sync Now, automatic backups and Full Backup flows remain intact.

| Component | Version / compatibility |
|---|---|
| Cloud Sync | 201, unchanged |
| Full Backup | Schema 29, unchanged |
| Settings Presets | Schema 1, unchanged |
| Personal Order export/import | Format 5, unchanged |
| Collections export/import | Format 2, unchanged |
| Supabase migration | Not required |

## 8. Implementation and Release Assets

- **Runtime module:** `src/js/components/255-v357-personal-order-dialogs-tabs-icons.js`
- **Styles:** `assets/css/183-v357-personal-order-dialogs-tabs-icons.css`
- **Bundle:** `assets/js/mediaflow-v357.bundle.js`
- Updated release metadata in `VERSION`, `version.json`, `manifest.json`, `sw.js`, `index.html`, `package.json`, and `README.md`.
- **PWA cache:** `mediaflow-pwa-v357-shell-v1`

## 9. Verification Scope

The v357 release was prepared to preserve the existing v356 Personal Order dialog flow while improving:

- desktop dialog space usage,
- Collection picker filtering/sorting UX,
- category tab icon alignment,
- and quick-workspace button icon clarity.

Verification focus for this release:

- build integrity,
- runtime inclusion,
- PWA/version metadata regeneration,
- and static consistency of the modified Personal Order / Collection picker surfaces.

Physical-device touch testing, live Supabase authentication / sync sessions, and deployed GitHub Pages validation were **not independently re-run here**.

---

## Version Progression

**v354:** Personal Order quick workspace and settings-aware filtering/sorting.  
**v355:** Professional theme-aware Personal Order UI refinements.  
**v356:** Refined Add Titles / Add Collections dialogs with collapsible filter areas and better result browsing.  
**v357:** **Larger desktop Personal Order dialogs, searchable Collection category filter, direction buttons, full Collection sorting options, better queue-tab icon alignment and distinct quick-workspace icons.**

**Deployment:** Deploy the complete v357 release together; keep a Full Backup before deployment and re-check Sync Now / live update after pushing the new build.
