# MediaFlow v271 — History UI Polish, Logs Restoration & Persistent Cover Sizing

**App release:** v271  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v271 builds on the v269 Consumption History redesign and v270 performance work. It fixes the History UI issues found after the redesign, restores the old paginated History experience as a dedicated **Logs** tab, adds independent cover-size controls for History surfaces, and audits the current persistence/export/update paths without requiring a data migration.

## Highlights

- Fixes the Consumption History Category picker so its panel is not clipped inside the filter toolbar.
- Replaces misleading generic toolbar icons with semantic Select and View Options icons.
- Stops MediaFlow's legacy global button-icon enhancer from injecting generic action glyphs onto poster/title cards or History tabs.
- Enlarges Latest Consumed covers and improves cover/title alignment in daily History and weekly Most Consumed cards.
- Keeps weekly summary date badges visible and readable.
- Hides the weekly category rail scrollbar while preserving mouse/pointer drag-to-scroll.
- Adds clearer typography throughout Consumption History, Recently Viewed, Ratings, Logs, and Library History.
- Adds **Logs** immediately before **Library** in Unified History. Logs restores the pre-redesign paginated History rows, filters, edit/delete, selection and pagination behavior.
- Adds dedicated CSV exports for the redesigned Consumption History and the restored Logs view.
- Adds Settings cover-size controls for:
  - Consumption History · Latest consumed covers
  - Consumption History · Week summary covers
  - Consumption History · Daily log covers
  - History · Recently viewed covers
  - History · Ratings covers
  - Dashboard · Recommended title cover
- New cover-size preferences flow through the normal Settings persistence, Cloud Sync snapshot/merge, Full Backup/restore and Settings Preset export/import paths.
- Preserves v270 week pagination and large-Library History optimization.
- Keeps the top-right release-version chip permanently removed and removes stale version numbers from the general page-header subtitle.
- PWA shell advances to `mediaflow-pwa-v271-shell-v1`.
- No data migration or schema bump is required.

## Data / Update Audit

v271 preserves and validates the current paths for:

- Cloud Sync / Sync Now — v201
- Full Backup + Automatic Backup — Schema v29
- Full Data Export / Import
- Settings Preset Export / Import — Schema v1
- Managed update + automatic update preferences
- PWA update/cache pipeline
- XP calculations and persistence
- Consumption History CSV export
- Logs CSV export
- Personal Order import/export — v4

## Validation

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v271.py
python scripts/perf-v271.py
```

The v271 smoke suite checks the five History tabs, unclipped Category picker, semantic icon policy, cover-size persistence through cloud/settings snapshots, dedicated exports, 280px layouts and Settings controls. The performance suite stress-tests a synthetic 30,000-title Library with 5,000 History logs while preserving the v270 six-week rendering window.
