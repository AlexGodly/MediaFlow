# MediaFlow v223 — On This Day Dashboard Visibility

**App release:** v223  
**Stable feature/data base:** v201  
**Cloud Sync:** v201  
**Full Backup schema:** v29  
**Settings Preset schema:** v1

MediaFlow v223 adds a persistent **On This Day** visibility control to **Settings → Interface → Dashboard Settings**.

The new control is placed directly below **Today's Balance**. Turning it off hides only the On This Day card from the Dashboard; it does not delete History data and does not disable On This Day cover/theme sources elsewhere.

The preference is stored in the existing `settings.v192Dashboard` object, so it participates in local persistence, cloud merge/verification, Full Backup, Automatic Backup, Settings Presets, Restore All Defaults, Reset section and individual Reset behavior.

## Important v223 file

```text
src/js/pages/dashboard/148-v223-on-this-day-dashboard-visibility.js
```

## Build / validation

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-ui.py
```

The UI smoke test verifies that **On This Day** appears immediately below **Today's Balance**, can be toggled off, persists in the runtime settings object and can be individually reset to its default of **shown**.

See `docs/CHANGELOG_v223.md` for release notes.
