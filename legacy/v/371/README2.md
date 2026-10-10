# MediaFlow v371 — Logging Visual Polish, Stable Settings & Fast Per unit Panels

**Version:** v371 · **Edition:** Personal · **Baseline:** v370 · **Built:** October 10, 2026

v371 refines Per unit and Quick Logging with theme-aware accent colors, strong selected-mode highlighting, the same status icons as Library, and compact responsive visual treatments. It fixes the disappearing Default Logging Interface control by changing preferences in place and making Settings Center refresh through the latest registered renderer. Per unit Collapse/Expand now toggles only the selected title's visible content, defers draft persistence, and avoids unrelated XP/form rebuilds. The Clear Titles confirmation now uses a meaningful shield-check icon for Keep titles.

**Tests:** All v369, v370, and dedicated v371 local/browser regressions passed at 320, 390, 430, 820, and 1280px. 100 synthetic collapse toggles with 160 draft units completed in approximately 3–6ms of handler execution, preserving unsaved DOM controls. This is *not* a physical-device benchmark. See [`docs/CHANGELOG_v371.md`](docs/CHANGELOG_v371.md).

**Production:** Not deployed. Authenticate and verify cloud sync, PWA upgrades, account restores and low-end device performance in staging before updating the live site. Existing v370 source changes are retained.
