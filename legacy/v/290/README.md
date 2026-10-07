# MediaFlow v290 — Category Selector UI & Title-Editing Visibility Controls

**App release:** v290  
**Cloud Sync:** v201  
**Full Backup:** Schema v29  
**Settings Preset:** v1  
**Personal Order Export:** v5  
**Collections Export:** v2

## v290

- Rebuilt the Category selector used by Add Title, Edit Title, and Title Details Quick Edit.
- Category choices now open in a modal-safe, viewport-aware floating picker that cannot be clipped by editor scroll containers.
- Fixed Category choices overlapping or blending with Priority, Start Date, labels, help text, and Quick Edit Save/Cancel actions.
- Added opaque theme-aware picker surfaces, independent scrolling, boundary clamping, and automatic upward/downward placement.
- Preserved configured Category image/URL icons and Set Category ordering everywhere titles are added or edited.
- Changed direct title-editing behavior so **all Categories remain available by default even when hidden in Set Category**.
- Added **Apply Set Category visibility to title editing** under Set Category ordering/visibility controls. It is Off by default.
- When the option is enabled, hidden Set Category choices are also hidden from Add Title, Edit Title, and Title Details Quick Edit.
- A title's currently assigned hidden Category remains visible while editing so an existing assignment never becomes blank.
- The new visibility preference lives inside the canonical Settings object and therefore participates in normal Cloud Sync, Full Backup and Settings Preset portability.
- Preserved v289 Personal Order cover sizing and Status/Priority ordering behavior.
- PWA shell advanced to `mediaflow-pwa-v290-shell-v1`.
- No destructive data migration required.
