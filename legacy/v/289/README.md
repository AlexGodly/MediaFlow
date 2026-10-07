# MediaFlow v289 — Personal Order Cover Sizing & Editor Choice Parity

**App release:** v289  
**Cloud Sync:** v201  
**Full Backup:** Schema v29  
**Settings Preset:** v1  
**Personal Order Export:** v5  
**Collections Export:** v2

## v289

- Personal Order Queue Display now includes independent Collection cover-size and expanded Collection-title cover-size controls.
- Collection cover sizing applies to assigned Collection blocks and Add Collection results; expanded title cover sizing is independent.
- Personal Order cover-size preferences persist in the existing queue-view state, including Cloud Sync, Full Backup and Personal Order Export v5.
- Add/Edit Title Category order now follows Settings → Popup & Filter Ordering → Set Category.
- Add/Edit Title Status order now follows Set Status.
- Add/Edit Title Priority order now follows Set Priority.
- Title Details quick-edit Category / Status / Priority use the same resolved Set ordering and visibility rules.
- Category editing in Add/Edit Title and Title Details now uses a rich icon-aware dropdown so configured URL/image Category icons render directly instead of the native-select image emoji fallback.
- A currently assigned hidden choice is preserved in-place while editing so opening an editor never silently changes an existing title.
- PWA shell advanced to `mediaflow-pwa-v289-shell-v1`.
- No data migration required.
