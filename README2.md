# MediaFlow v224 — Modular Project

**App release:** v224  
**Stable feature/data base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1

v224 builds on the working v219+ runtime-extension architecture and adds Library cleanup, a cover filter, unified sort-field + ASC/DESC controls, Personal Order / Account naming, and redesigned Dashboard recommendation actions.

## Main v224 changes

- Library page no longer shows **Empty library**; use Settings → Library Maintenance instead.
- **+ Add title** is the single right-side Library header action.
- Normal and Dynamic Library add **All covers / Has cover / Missing cover** filtering.
- Library, Batch Log, Personal Order Add Titles, and Dashboard logging use one sort field plus an independent **ASC/DESC** switch.
- Default sort is **Alphabetic · ASC**.
- **Order** → **Personal Order**.
- **Profile settings** → **Account**.
- Dashboard **Edit / Reroll title / Rerolls history** actions are grouped under the recommended title with icons.

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

See `docs/CHANGELOG_v224.md` for the full release notes.
