# MediaFlow v217 — Sidebar Highlight & Default Navigation Order Fix

## Base
- Architecture: v216 modular project
- Stable feature base: v201
- Cloud Sync: v201
- Full Backup Schema: v29
- Settings Preset Schema: v1

## Fixes
- Sidebar active highlighting now keys each rendered item by its actual `data-view` ID instead of assuming DOM position equals `NAV_ITEMS` position.
- This fixes Settings highlighting About and About highlighting Settings.
- The same fix also protects any user-reordered or hidden navigation layout from index-based active-state mismatches.
- Canonical default sidebar order is now: Dashboard, Library, Order, Old System, Library History, History, Batch Log, Statistics, Profile settings, Settings, About.
- The exact old v216 default order (About before Settings) is migrated to the corrected default.
- Genuine user-customized navigation orders are preserved and remain editable from Settings.
- No persistent schema changes.
