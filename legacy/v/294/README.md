# MediaFlow v294 — Cover Background Feature Removal & v291 Stable Baseline Restoration

**App release:** v294  
**Functional baseline:** v291  
**Cloud Sync:** v201  
**Full Backup:** Schema v29  
**Settings Preset:** v1  
**Personal Order Export:** v5  
**Collections Export:** v2

## v294

MediaFlow v294 intentionally returns the application to the stable v291 feature set and Dashboard presentation.

- Removed the Recommended Title Cover Background experiment introduced in v292 and visually reworked in v293.
- Removed the Dashboard logging appearance selector associated with that experiment.
- Removed all cover-background rendering, cinematic artwork layers, background transitions, cover-quality fallbacks, and related visual hooks from the active app.
- Removed the experiment's Settings / Cloud Sync / Full Backup / Settings Preset preference by restoring the v291 Settings model.
- Restored the original v291 Dashboard Next Task / logging presentation exactly as the active functional baseline.
- Preserved all v291 Category picker improvements: Category search in Add Title, Edit Title, and Title Details Quick Edit; wide responsive Quick Edit grid; standardized Category rows; real Category icons; and removal of duplicate generic icons.
- Preserved v290 Category visibility behavior and all v289-and-earlier Personal Order, Collections, backup, sync, history, logging, XP, PWA, and theme functionality present in v291.
- App release/version metadata advanced to v294.
- PWA shell advanced to `mediaflow-pwa-v294-shell-v1`.
- No destructive data migration is required. Existing data created in v292/v293 remains compatible; the removed appearance preference is simply no longer used by the v294 runtime.

## Version direction

- **v291** — stable searchable Category picker / Quick Edit layout baseline
- **v292** — recommended-title cover background experiment
- **v293** — cinematic cover-background experiment overhaul
- **v294** — cover-background experiment removed; v291 stable functional baseline restored
