# MediaFlow v219 — Runtime Foundation + Organized Settings

**Stable feature base:** MediaFlow v201  
**App release:** v219  
**Cloud Sync compatibility:** v201  
**Full Backup schema:** v29  
**Settings Preset schema:** v1

v219 fixes the architecture problem that caused some later source files to exist without actually controlling the running app. New runtime extensions are now injected inside MediaFlow's live application scope, and Settings is the first page registered through the new active page-renderer registry.

The Settings page now visibly includes a searchable browser, grouped navigation, per-setting reset controls, section resets, and an audited Restore all defaults action.

## Run MediaFlow

### Windows
Run `scripts\serve.bat`, then open `http://localhost:8080/`.

### macOS / Linux
```bash
bash scripts/serve.sh
```

## Runtime architecture

```text
MediaFlow_v219_Modular/
├── index.html
├── assets/
│   ├── css/90-v219-settings-organizer.css
│   └── js/mediaflow-v219.bundle.js
├── src/js/
│   ├── core/runtime/
│   │   ├── 998-runtime-extension-foundation-v219.js
│   │   └── 999-close-app.js
│   ├── pages/settings/144-v219-active-settings-page.js
│   ├── runtime-order.json
│   └── build-order.json
├── scripts/
│   ├── build.py
│   ├── check.py
│   ├── smoke-ui.py
│   └── locate.py
└── tests/settings-smoke.html
```

## Why future updates now appear

`build-order.json` contains a dedicated `runtime_extensions` slot before `999-close-app.js`. `scripts/build.py` injects every file listed in `runtime-order.json` into that slot while MediaFlow's state, renderers and helpers are still in scope. New release modules therefore cannot silently land after the old closure like the broken v218 Settings patch did.

The new `window.MediaFlowRuntime` also provides a real page renderer/enhancer registry. Settings is registered through that registry instead of overriding the old renderer from outside the app.

## Build and verify

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-ui.py
```

The UI smoke test launches Chromium, opens Settings, and verifies that the v219 runtime is active, the search field exists, the organized Settings navigation renders, reset buttons exist, and search actually filters sections.

## Compatibility

The stable v201 Library/data model is preserved. Cloud Sync remains v201, Full Backup remains schema v29, and Settings Preset remains schema v1.
