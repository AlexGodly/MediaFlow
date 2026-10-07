# MediaFlow v291 — Searchable Category Picker & Quick Edit Full-List Layout

**App release:** v291  
**Cloud Sync:** v201  
**Full Backup:** Schema v29  
**Settings Preset:** v1  
**Personal Order Export:** v5  
**Collections Export:** v2

## v291

- Added Category search to Add Title, Edit Title, and Title Details Quick Edit.
- Reworked Title Details Category Quick Edit so the Category chooser uses a wide viewport-level responsive grid instead of being constrained by the small Quick Edit modal.
- On normal desktop widths the chooser is designed to expose the complete Category set at once when it fits, while retaining scrolling only when the viewport is genuinely too small.
- Removed the duplicate generic circular action icons that appeared beside the real Category icons.
- Standardized Category rows so artwork, title, and runtime metadata use the same fixed alignment across every row.
- Preserved Set Category order, v290 hidden-category behavior, Category artwork, Dynamic Themes, title saving, and all existing persistence systems.
- PWA shell advanced to `mediaflow-pwa-v291-shell-v1`.
- No destructive data migration required.
