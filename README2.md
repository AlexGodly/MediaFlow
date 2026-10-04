# MediaFlow v226 — Modular Project

**App release:** v226  
**Stable feature/data base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1

MediaFlow v226 builds on v225 with a semantic icon pass, clearer dropdowns, a repaired Categories settings layout, and complete Normal/Dynamic Library sizing parity.

## Main v226 changes

- Reworked **Settings → Categories** so category position numbers and Edit/Clear/Delete actions stay fully visible instead of overflowing the card.
- Replaced generic button icons with action-specific icons for Dynamic Library, status tabs, Show/Hide, Refresh, Advanced, Custom order, End session, Minus time, and the Settings sidebar.
- Kept **drag handles icon-free** so the three-line reorder grip stays clean.
- Added purpose-aware icons to native dropdowns without changing their values or behavior.
- Renamed **Covers + titles** to **Cover+Titles**.
- Extended Library cover/title sizing behavior across all display modes in both **Normal** and **Dynamic** Library.
- Dynamic Library category tabs are now text-only by default, with a new persistent Settings option to use each category's own **icon URL** instead.
- Preserved Cloud Sync v201, Full Backup Schema v29, Settings Preset Schema v1, and all existing Library/user data.

## Development

Rebuild the browser bundle:

```bash
python scripts/build.py
```

Run structural checks:

```bash
python scripts/check.py
```

Run Chromium UI smoke tests:

```bash
python scripts/smoke-ui.py
```

For local development use `scripts/serve.bat` on Windows or `scripts/serve.sh` on macOS/Linux.

See `docs/CHANGELOG_v226.md` for the full release notes.
