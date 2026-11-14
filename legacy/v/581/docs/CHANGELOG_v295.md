# MediaFlow v295 — Responsive Navigation Repair & Fresh-Account Category Defaults

## Responsive navigation
- Fixed the bottom navigation layout at intermediate/tablet widths such as ~963 px.
- Reduced the maximum visible tab density so labels such as Personal Order remain readable.
- Rebuilt the More menu as a viewport-safe responsive card/grid rather than a narrow clipped strip at the right edge.
- More menu becomes 3 columns on wider responsive layouts, 2 columns on smaller tablets, and 1 column on phones.

## Fresh-account default categories
Fresh accounts now start with 22 built-in MediaFlow categories in the canonical order below:
1. Seasonal Anime
2. Missed Anime
3. Finished Anime
4. Anime Movies
5. Asian Comics
6. Movies
7. TV Series
8. Anime Backlog
9. Anime Movies Backlog
10. Asian Comics Backlog
11. TV Series Backlog
12. Movies Backlog
13. Books
14. Books Backlog
15. Novels
16. Novels Backlog
17. Magazines
18. Magazines Backlog
19. Online Media
20. Online Media Backlog
21. Comics
22. Comics Backlog

Every default category uses its packaged MediaFlow built-in icon under `assets/category-icons/`, plus category-appropriate type, unit, target, weight, minutes-per-unit, color, seasonal flag and enabled state. Existing accounts are not automatically overwritten.

## Import compatibility
- Legacy Manhwa / Manhua imports fall back to Asian Comics on fresh v295 accounts when a legacy `manhwa` category does not exist.
- Legacy Other Animation classifications fall back to TV Series when that old category does not exist.
- Existing accounts that still have those legacy categories continue using them.

## Persistence / transfer audit
- Category definitions are explicitly protected by Sync Now verification, including name, icon, built-in icon URL, type, unit, target, weight, minutes-per-unit, color, seasonal/enabled/custom state and missing-cover URL.
- Full Backup / Automatic Backup manifests now advertise the v295 category/default/navigation audit.
- Settings Presets include current category definitions and order.
- Personal Order export remains format v5 while stamping the current v295 release.
- Collections export remains format v2 while stamping the current v295 release.
- History CSV exports already stamp the current MediaFlow version per row and remain current.
- XP calculation, Full Data import/export, Settings import/export, Personal Order import/export and Collections import/export were audited without a schema bump.

## PWA / update
- Release version advanced to v295.
- Service worker/app-shell cache regenerated for v295.
- All built-in category icon assets remain pre-cached for offline/PWA use.
- Automatic update/version detection uses the v295 release metadata.

## Compatibility
- Cloud Sync version: 201
- Full Backup schema: 29
- Settings Preset schema: 1
- Personal Order export: v5
- Collections export: v2
