# MediaFlow v228 — Modular Project

**App release:** v228  
**Stable feature/data base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1

MediaFlow v228 is a focused Library and Dynamic-row configuration release built on v227. It removes redundant Library metadata icons, aligns Library priority pills with the priority picker, restores Dynamic category drag handles, and adds a persistent choice between an independent Dynamic row order and the main Categories order.

## Main v228 changes

- Removed the extra global action icon from Library category metadata while preserving the category's own URL/icon identity.
- Added distinct Low / Medium / High icons to Library priority pills using the same visual language as the priority popup.
- Restored a three-line **☰** drag handle to Dynamic category-row Settings.
- Added functional drag-and-drop reordering for the custom Dynamic category row.
- Added **Dynamic category row order** with:
  - **Custom Dynamic row order**
  - **Follow Categories order**
- Custom order remains the default and is preserved when Follow mode is temporarily enabled.
- Follow mode updates Dynamic Library from the main Categories order automatically while keeping Dynamic visibility and category actions independent.
- Integrated the new persistent preference with Settings reset, cloud merge/verification, Sync Now, Full Backup, Automatic Backup and Settings Presets.
- Preserved Cloud Sync v201, Full Backup Schema v29, Settings Preset Schema v1, and existing user data.

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

See `docs/CHANGELOG_v228.md` for the full release notes.
