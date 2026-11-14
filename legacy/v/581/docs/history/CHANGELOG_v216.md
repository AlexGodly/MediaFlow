# MediaFlow v216 — Page / Component / Core Architecture Refactor

- Rebased directly from the stable v215/v201 runtime.
- Replaced the chronological `src/js/parts/` source layout with owned `core/`, `pages/`, `components/`, `features/`, `services/`, `utils/`, and `legacy/` folders.
- Added dedicated page folders for Dashboard, Library, Personal Order, Library History, History, Batch Log, Statistics, Profile Settings, Settings, and Old System.
- Added component ownership folders for modal, category, cover, pagination, navigation, title details, and batch toolbar code.
- Added feature ownership folders for scheduler, logging, XP, backup, import/export, themes, rewatch, recommendations, and automatic backup.
- Added service ownership for cloud sync and persistence.
- Added an explicit ordered source manifest across nested folders.
- Added `scripts/locate.py` to quickly locate symbols/features in the owned source tree.
- Strengthened `scripts/check.py` with stable-runtime parity validation against v215/v201.
- Kept the browser on a generated compatibility bundle so the stable shared-scope runtime remains unchanged.
- No feature/data schema migration.

Versioning:
- App: **216**
- Cloud Sync: **201**
- Full Backup schema: **29**
- Settings Preset schema: **1**
