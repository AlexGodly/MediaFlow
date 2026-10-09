# MediaFlow v258 — Built-in Category Artwork, Category Editor Redesign & Persistence Audit

MediaFlow v258 expands category customization with a new built-in artwork library sourced from the supplied MediaFlow category icons, redesigns both Add Category and Edit Category for clearer editing, and re-audits MediaFlow persistence/export/update paths against the current v257 feature set.

## Built-in category artwork
- Added 22 packaged MediaFlow category icons as selectable defaults.
- Added Seasonal Anime, Missed Anime, Finished Anime, Anime Movies, Anime Backlog and Anime Movies Backlog artwork.
- Added Asian Comics and Asian Comics Backlog artwork.
- Added Movies and Movies Backlog artwork.
- Added TV Series and TV Series Backlog artwork.
- Added Books and Books Backlog artwork.
- Added Novels and Novels Backlog artwork.
- Added Magazines and Magazines Backlog artwork.
- Added Online Media and Online Media Backlog artwork.
- Added Comics and Comics Backlog artwork.
- Built-in artwork is stored locally under `assets/category-icons/` so it does not depend on an external image host.
- The supplied artwork is optimized to 512×512 PNG for category UI, fallback artwork and offline/PWA use while preserving transparency.
- Existing emoji/symbol choices remain available.
- Existing saved custom emoji and URL icons remain available.
- Existing external http/https icon URL support remains available.

## Category editor redesign
- Increased the Add Category and Edit Category modal width.
- Increased title/input readability and spacing.
- Added a dedicated **MediaFlow icons** section with artwork preview tiles and names.
- Added a clearer **Emoji & symbols** section beneath the built-in artwork.
- Kept custom saved icon management and custom color management intact.
- Improved modal behavior at tablet, mobile and very narrow widths.

## Built-in artwork persistence
- Packaged artwork paths are treated as safe first-class category icon sources.
- Arbitrary relative paths are still rejected; only MediaFlow's packaged category artwork directory is allowed in addition to existing http/https URLs.
- Category icon artwork persists through the canonical `S.categories` model.
- Cloud/Sync Now verification explicitly audits category artwork paths.
- Settings Presets continue exporting/importing the full category configuration including built-in icon paths.
- Full Backup and Automatic Backup continue carrying category configuration.
- Full Data export/import continues carrying category configuration.
- Personal Order v4 export now includes current category visual metadata (`icon`, `iconUrl`, `color`) as non-breaking metadata while keeping its matching/import behavior unchanged.

## Persistence and portability audit
The current persistence systems were rechecked after the v258 category changes:
- Cloud Sync remains **v201**.
- Full Backup remains **Schema v29**.
- Settings Preset remains **Schema v1**.
- Personal Order Export remains **v4**.
- Automatic Backup continues using the canonical Full Backup pipeline.
- Managed automatic updates and the optional pre-update Full Backup from v257 remain current.
- Sync Now still verifies current Settings, XP, Library, History, Library History, Personal Order, completion timeline, Dashboard utilities and category artwork.
- XP calculations/progression persistence remain current and require no formula/schema change.
- History CSV remains on the current v250+ export path with session XP and complete `session_json` metadata.
- PWA diagnostics/cache repair remain current.

## PWA
- Advanced PWA cache generation to `mediaflow-pwa-v258-shell-v1`.
- The 22 built-in category artwork files are now included in the generated PWA app shell so selected packaged category icons remain available offline.
- Android, tablet and iOS/iPadOS installation guidance from v257 is preserved.

## Compatibility
- **Cloud Sync:** v201
- **Full Backup Schema:** v29
- **Settings Preset Schema:** v1
- **Personal Order Export:** v4
- No Library/user-data migration is required.

## Version progression
**v254** → Cover overlay controls for Covers & Covers+Titles  
**v255** → Cover status color refinement  
**v256** → Theme-aware cover progress, overlay sizing & Runtime Calculator  
**v257** → Dashboard utility sync, Settings navigation fixes, mobile PWA support & safer updates  
**v258** → **Built-in category artwork, category editor redesign & persistence audit**
