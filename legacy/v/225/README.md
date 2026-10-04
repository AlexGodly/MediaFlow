# MediaFlow v225 — Modular Project

**App release:** v225  
**Stable feature/data base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1

MediaFlow v225 builds on v224 with a clearer Personal Order → Add Titles control layout and a global icon language for current and future action buttons.

## Main v225 changes

- Rebuilt the **Personal Order → Add Titles** filter/sort toolbar so Categories, Sort by, Direction, Status and Priority are individually labeled and easy to scan.
- Preserved the v224 sorting model: one sort field plus an independent **ASC/DESC** direction button, defaulting to **Alphabetic · ASC**.
- Added a centralized **global button icon system** that automatically enhances current and future text action buttons.
- Added dedicated icons for Skip, Confirm, Reroll, Edit, Delete/Empty, Details, Fix/Repair, Calculate, Cancel, Save, Add, Clear, Use, Previous/Next, Stopwatch actions, Library modes, display modes, import/export/restore, Personal Order controls, Old System modes, logging modes, sync, scan/fix, auth and About actions.
- Existing controls that already have their own icon, toggles, swatches and numeric pagination remain untouched to avoid duplicate/noisy UI.
- Polished **Account** text fields with clearer spacing, focus states, borders and responsive action layout.
- Preserved every v224 Library, sorting, navigation-name and Dashboard recommendation improvement.

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

See `docs/CHANGELOG_v225.md` for the full release notes.
