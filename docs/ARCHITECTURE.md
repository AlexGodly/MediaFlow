# MediaFlow v222 Architecture

## Runtime foundation

v221 continues using the v219 runtime-extension architecture. New release modules are injected through `src/js/runtime-order.json` before `core/runtime/999-close-app.js`, while MediaFlow's private state and render helpers are still available.

```text
build-order.json
      ↓
runtime_extensions slot
      ↓
998-runtime-extension-foundation-v219.js
      ↓
146-v221-active-settings-page.js
      ↓
999-close-app.js
```

This keeps release changes connected to the application that actually runs.

## Active Settings ownership

The active Settings page is owned by:

```text
src/js/pages/settings/146-v221-active-settings-page.js
assets/css/92-v221-settings-polish.css
```

The module handles:

- searchable Settings
- synchronized left index + page ordering
- Library/Interface/Appearance/MediaFlow System/Progression/Data & Sync/Updates groups
- Statistics Settings inside Interface
- App Updates in the bottom Updates group
- per-setting reset controls
- section reset controls
- audited Restore All Defaults
- responsive Settings navigation behavior

## Generated runtime

The browser loads:

```text
assets/js/mediaflow-v222.bundle.js
```

It remains a compatibility bundle because the stable v201 application still shares one lexical runtime, while v219+ release modules have an explicit safe injection point.

## Validation

Run:

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-ui.py
```

The smoke test launches Chromium and verifies the rendered UI instead of relying only on syntax checks.

## Compatibility

- App release: **221**
- Stable feature base: **201**
- Runtime foundation: **219**
- Cloud Sync contract: **201**
- Full Backup schema: **29**
- Settings Preset schema: **1**
