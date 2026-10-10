# MediaFlow v369 — Itemized Logging & Persistence Compatibility

**Version:** v369 · **Edition:** Personal · **Baseline:** v368 · **Built:** October 10, 2026

v369 introduces individual episode/chapter/issue timestamps, category runtime defaults in HH:MM:SS, editable per-unit durations, season-aware progress, mixed rewatch/reread entries, expandable Consumption History, updated CSV exports, and cloud draft verification/recovery improvements. The previous Quick Logging and existing XP, Library, Personal Order and Collections functionality remain supported.

**Build checks:** compiled JavaScript and PWA v369 app-shell passed `scripts/check.py`; the Node logging regression and two headless Chromium smoke tests passed. See [`docs/CHANGELOG_v369.md`](docs/CHANGELOG_v369.md) for a complete feature summary and deployment/verification limitations.

**Production deployment:** not performed. Live authenticated cloud sync, physical-device PWA update, and large-library end-to-end performance still require staging verification. The previous v368 changelog remains in [`docs/CHANGELOG_v368.md`](docs/CHANGELOG_v368.md).
