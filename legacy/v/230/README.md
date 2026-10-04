# MediaFlow v230 — Modular Project

**App release:** v230  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1

MediaFlow v230 adds a centralized **Choice & Filter Layout** settings section for the reusable Set Category, Set Status, Set Priority, Category Filter, Status Filter, and Priority Filter interfaces. Each surface can control order and visibility with drag handles, exact position numbers, arrows, and show/hide toggles. Category-based surfaces can use independent settings, follow the main Categories configuration, or follow the Dynamic Category Row. Status/Priority filters can also inherit their matching Set popup configuration.

## Main v230 changes

- Added **Settings → Library → Choice & Filter Layout**.
- Independent ordering/visibility for Set Category, Set Status, Set Priority, Category Filter, Status Filter, and Priority Filter.
- Drag, exact numeric position, ↑/↓ ordering, and show/hide controls.
- Category surfaces can use **Own settings**, **Follow Category Settings**, or **Follow Dynamic Category Row**.
- Status Filter can optionally **Follow Set Status**.
- Priority Filter can optionally **Follow Set Priority**.
- Set Category pagination from v229 now respects configured ordering and hidden choices.
- Native status/priority/category filter controls are reordered/hidden automatically across MediaFlow.
- Dynamic Library status-row filters respect the Status Filter layout.
- New settings are stored inside `S.settings`, so Settings Preset, Full Backup, Automatic Backup, Sync Now, and cloud settings persistence continue to cover them without schema changes.

See `docs/CHANGELOG_v230.md` for full release notes.
