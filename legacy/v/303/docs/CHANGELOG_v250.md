# MediaFlow v250 — About Update UI Cleanup & Complete Persistence Integrity Audit

MediaFlow v250 cleans the **About → Version & updates** interface and performs a new end-to-end persistence audit across MediaFlow's current data systems.

## About / update UI

- Rebuilt the **Version & updates** card into a cleaner compact layout.
- Separated release status, update checks and update-install actions visually without the oversized nested card from v249.
- Kept dynamic checking / update available / up-to-date / install / success / failure states.
- Kept **Check now**, **Open latest web app**, **Install update**, and **Reload app**.
- Kept the PWA installation card separate in Settings exactly as established in v249.

## Cloud + Sync Now integrity

- Re-audited the final cloud snapshot after all current MediaFlow modules.
- Removed the historical **1,000-entry Library History cloud cap**. The complete Library History now participates in cloud snapshots and cloud merge instead of only the newest 1,000 rows.
- Strengthened protected **Sync Now** verification with semantic fingerprints for current Settings, XP ledgers, Personal Order, Library, consumption History, Library History and completion timeline.
- Kept Cloud Sync compatibility at **v201** because no new user-data shape is required.

## Full Data / Automatic Backup

- Re-audited the final Full Backup builder.
- Full backups explicitly preserve the complete uncapped Library History, current update preferences, current Settings, XP ledgers and progression metadata.
- **Automatic Backup** continues resolving the same final Full Backup builder dynamically, so scheduled/manual folder backups receive the same v250 payload.
- Full Backup remains **Schema v29**.

## Settings export/import

- Re-audited Settings Presets against current Settings.
- Automatic update checking, automatic update installation, Automatic Backup preferences and current leveling configuration are explicitly covered.
- Settings Preset remains **Schema v1**.

## Managed application updates

- Update installation and manual reload now wait for the current cloud-save queue before navigating/reloading.
- If the current state cannot be confirmed saved, MediaFlow pauses the transition instead of intentionally racing the save with a page reload.
- PWA generation remains VERSION-aware and advances automatically with v250.

## XP

- Full Backup progression metadata is refreshed through the current XP calculation path at export time.
- Existing XP ledger and progression architecture is preserved; no XP schema migration is required.

## History export

- History CSV now exports XP through the current `sessionStoredXP()` calculation path.
- Added the current MediaFlow release to each exported row.
- Added a complete `session_json` column so current/future per-session metadata is not silently lost when the readable CSV columns lag behind newer features.

## Personal Order import/export

- Personal Order remains **format v4**.
- Current exports are stamped as v250/current.
- Import now explicitly waits for the resulting cloud save queue to finish before reporting the operation chain complete.

## Compatibility

- **Cloud Sync:** v201
- **Full Backup Schema:** v29
- **Settings Preset Schema:** v1
- **Personal Order Export:** v4

No Library/user-data migration is required.
