# MediaFlow v253 — Modular Project

**App release:** v253  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v253 polishes the v252 Seasons View workflow and expands History management. Season-aware logging is now laid out as a clean full-width section instead of competing with the Library title picker, Title Details regains reliable internal scrolling, and the season editor correctly layers above Title Details. Logging also gains a one-click shortcut for the current recommended title. History now defaults to 10 entries per page, supports a persistent custom page size, and adds current-page selection plus designed batch deletion tools.

## Main v253 changes
- Reworked season-aware Last progress logging into a clean full-width Seasons View block below the title picker.
- Fixed Add/Edit Season from Title Details opening behind the Title Details modal.
- Restored internal Title Details scrolling so lower fields remain reachable on long titles/seasons.
- Added a **Use recommended title** shortcut in logging for the current Dashboard recommendation.
- Added persistent **History entries per page**, defaulting to 10 and adjustable by typing a value.
- Added History row multi-selection with **Select visible** and **Deselect**.
- Added **Delete selected** and **Delete visible** with designed confirmation dialogs.
- Select/Delete visible operate only on entries shown on the current History page.
- Batch deletion remains integrated with MediaFlow's mutation/undo workflow.
- Preserved v252 season-aware aggregate progress, repeat/rewatch behavior, import support and persistence.
- Advanced the PWA shell to `mediaflow-pwa-v253-shell-v1`.

## Preserved compatibility
- Cloud Sync v201.
- Full Backup Schema v29 and Automatic Backup.
- Settings Preset Schema v1; the new History page-size preference participates in normal Settings persistence/export/import.
- Personal Order Export v4.
- v250 cloud/history persistence reliability.
- v249 application-update/PWA separation.
- v247 PWA diagnostics and cache repair.
- v246 desktop/tablet/mobile/very-narrow-width responsiveness.

## Build and validation
```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v253.py
```

v253 regression validation covers the corrected modal stack, Title Details scrolling, recommended-title shortcut, Seasons View logging layout, History page-size behavior, current-page selection/deletion, and responsive History layouts at 820px, 390px, 320px and 280px.

Deploy the project root to GitHub Pages as usual. MediaFlow continues using relative PWA paths for `https://alexgodly.github.io/MediaFlow/`.

See `docs/CHANGELOG_v253.md` for release details.
