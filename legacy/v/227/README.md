# MediaFlow v227 — Modular Project

**App release:** v227  
**Stable feature/data base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1

MediaFlow v227 is a focused interface-correction release built on v226. It fixes the Dynamic Library category icon URL mode, cleans up several remaining icon inconsistencies, improves visibility switches, and removes unwanted action icons from Dashboard poster placeholders.

## Main v227 changes

- Fixed **Dynamic Library → Category icon URL** so category tabs actually display each category's configured URL icon.
- Removed the leading dropdown icon from the **Dynamic category row icons** selector itself.
- Made **Add time / Minus time** visually consistent by using a plain minus icon instead of a circled minus.
- Added distinct semantic icons for **Low**, **Medium**, and **High** priority controls.
- Fixed Show/Hide switch icons so the eye/eye-off icon remains fully visible instead of sitting under the toggle knob.
- Added clear **Automatic** and **Manual** mode icons to Seasonal fresh-episode settings.
- Removed global action icons from the poster placeholders used by **Rate Your Library** and **Missing Covers** on the Dashboard.
- Removed redundant global icons from category-choice controls that already show the category's own identity.
- Preserved all v226 Settings/category layout fixes, Dynamic Library sizing parity, Cloud Sync v201, Full Backup Schema v29, Settings Preset Schema v1, and existing user data.

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

See `docs/CHANGELOG_v227.md` for the full release notes.
