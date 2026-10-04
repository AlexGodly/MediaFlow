# MediaFlow v222 — Dashboard Rendering Stability

**Created by Alex Godly**  
**App release:** v222  
**Stable feature/data base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1

MediaFlow v222 continues the modular/runtime architecture from v219–v221 and fixes a rare Chromium/GPU rendering artifact around the Dashboard **On This Day** card.

The tiny green/yellow block that could occasionally appear below the collapsed card was treated as a compositor paint issue, not as Library corruption. v222 removes the risky hidden-row paint optimization, explicitly keeps the collapsed details body out of paint, isolates the card/Today strip, and performs a lightweight repaint after Dashboard and On This Day hero changes.

## Important v222 files

```text
src/js/pages/dashboard/147-v222-dashboard-rendering-stability.js
assets/css/93-v222-dashboard-rendering-stability.css
assets/js/mediaflow-v222.bundle.js
```

The existing v221 Settings system remains active:

```text
src/js/pages/settings/146-v221-active-settings-page.js
assets/css/92-v221-settings-polish.css
```

## Build

```text
python scripts/build.py
```

## Validation

```text
python scripts/check.py
python scripts/smoke-ui.py
```

The smoke test verifies both the v221 Settings behavior and the new v222 Dashboard paint safeguards in Chromium.

See `docs/CHANGELOG_v222.md` for the full release notes.
