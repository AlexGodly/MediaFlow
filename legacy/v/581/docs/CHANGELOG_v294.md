# MediaFlow v294 — Cover Background Feature Removal & v291 Stable Baseline Restoration

## Release identity

- Release: **294**
- Functional baseline: **v291**
- Cloud Sync: **v201**
- Full Backup Schema: **v29**
- Settings Preset Schema: **v1**
- Personal Order Export: **v5**
- Collections Export: **v2**

## Removed

- Recommended Title Cover Background Dashboard mode introduced in v292.
- v292 Dashboard logging appearance selector.
- v293 cinematic recommended-cover background treatment.
- Recommended-cover background blur / full-bleed / foreground artwork layers.
- Cover-background transitions and presentation-only background hooks.
- Missing/broken-cover fallback code that existed only for the removed background mode.
- Cover-background-specific Settings persistence, Cloud Sync, Full Backup, and Settings Preset preference by restoring the v291 Settings/runtime baseline.

## Restored

- v291 Dashboard Next Task / logging presentation as the active default and only Dashboard logging appearance.
- v291 runtime/source manifests and behavior as the functional baseline.

## Preserved from v291

- Category search in Add Title.
- Category search in Edit Title.
- Category search in Title Details Quick Edit.
- Responsive wide Quick Edit Category grid.
- Full Category list exposure on normal desktop widths when space permits.
- Standardized Category row alignment.
- Real Category icons.
- Removal of duplicate generic Category-side action icons.
- Set Category ordering.
- v290 optional Category visibility enforcement for direct title editing.
- Dynamic Themes.
- Personal Order / Collections / History / Logs / XP / backups / Cloud Sync behavior contained in v291.

## Compatibility

- No destructive data migration required.
- Existing user content remains compatible.
- Data written by v292/v293 remains valid; the removed appearance preference is ignored because v294 uses the v291 Settings/runtime model.

## Release infrastructure

- VERSION advanced to **294**.
- version.json advanced to **294**.
- JavaScript bundle advanced to **mediaflow-v294.bundle.js**.
- PWA shell advanced to **mediaflow-pwa-v294-shell-v1**.
