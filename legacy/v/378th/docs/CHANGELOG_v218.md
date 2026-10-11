# MediaFlow v218 — Organized Searchable Settings

## Base
- Architecture: v217 modular project
- Stable feature base: v201
- Cloud Sync: v201
- Full Backup Schema: v29
- Settings Preset Schema: v1

## Settings organization
- Added a dedicated Settings workspace with a searchable toolbar and sticky section index.
- Settings sections are automatically indexed and grouped into Library, Interface, Appearance, MediaFlow System, Progression, Statistics, Data & Sync, and Other groups.
- Clicking a Settings index item scrolls directly to the requested section.
- Search filters the complete Settings page by section title and setting content.
- Existing Settings content remains the canonical UI; v218 reorganizes it without replacing stable setting handlers.

## Reset controls
- Added per-setting Reset buttons for canonical settings whose default value exists in `DEFAULT_SETTINGS`.
- Added section-level Reset section controls for major Settings areas.
- Existing specialized reset controls remain authoritative where already present.
- Category objects themselves are intentionally excluded from generic setting resets because categories are Library data rather than presentation/configuration defaults.

## Restore all defaults audit
- Replaced the legacy reset-all path with the v218 audited reset path.
- Restore all defaults now clones the complete runtime `DEFAULT_SETTINGS`, so settings introduced after the original Settings page are included automatically.
- Navigation layout is also restored to the canonical default order/visibility.
- MAL link preferences are restored to their default state for compatibility with the existing state model.
- Theme, cover-size CSS variables, category-icon scale, automatic backup timer, update checking and dynamic-theme scheduling are refreshed after reset.
- Library, History, XP, categories and other content data are not deleted by Restore all defaults.

## Architecture
- Added `src/js/pages/settings/143-v218-settings-organizer.js`.
- Added `assets/css/90-v218-settings-organizer.css`.
- Generated runtime now contains 144 ordered source fragments.
- The browser continues to run one compatibility bundle to preserve the stable shared lexical runtime.

## Versioning
- App: **218**
- Cloud Sync: **201**
- Full Backup schema: **29**
- Settings Preset schema: **1**
