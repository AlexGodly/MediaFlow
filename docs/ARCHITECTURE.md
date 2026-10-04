# MediaFlow v220 Architecture

## Runtime foundation

v220 continues using the v219 runtime-extension architecture. New release modules are injected through `src/js/runtime-order.json` before `core/runtime/999-close-app.js`, while MediaFlow's private state and render helpers are still available.

```text
build-order.json
      ↓
runtime_extensions slot
      ↓
998-runtime-extension-foundation-v219.js
      ↓
145-v220-active-settings-page.js
      ↓
999-close-app.js
```

This keeps future changes connected to the app that actually runs.

## Active Settings ownership

The active Settings page is owned by:

```text
src/js/pages/settings/145-v220-active-settings-page.js
assets/css/91-v220-settings-polish.css
```

The module handles:

- searchable Settings
- synchronized left index + page ordering
- Categories as the first Library section
- page group organization
- per-setting reset controls
- section reset controls
- audited Restore all defaults
- Settings keyboard search focus (`Ctrl/Cmd + K`)

## Generated runtime

The browser loads:

```text
assets/js/mediaflow-v220.bundle.js
```

It remains a compatibility bundle because the stable v201 app still shares one lexical runtime, but new release modules now have an explicit safe injection point.

## Validation

Run:

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-ui.py
```

The smoke test launches Chromium and verifies the rendered UI rather than relying only on syntax checks.

## Compatibility

- App release: **220**
- Stable feature base: **201**
- Runtime foundation: **219**
- Cloud Sync contract: **201**
- Full Backup schema: **29**
- Settings Preset schema: **1**
