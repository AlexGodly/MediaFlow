# MediaFlow v219 Architecture

## Goal

v219 fixes the runtime-boundary problem that caused some post-v201 patches to exist in source without actually controlling the live app. The project remains a SPA with one `index.html`, but future release modules now have an explicit place to run **inside** MediaFlow's active application scope.

## Runtime build

The stable v201-based source remains organized under `core/`, `pages/`, `components/`, `features/`, `services/`, `utils/`, and `legacy/`.

The key v219 addition is:

```text
src/js/runtime-order.json
              ↓
build-order.json -> runtime_extensions slot
              ↓
core/runtime/999-close-app.js
```

`scripts/build.py` injects every module listed in `runtime-order.json` at the `runtime_extensions` slot before the legacy application closure is closed. This prevents new releases from silently landing after the private `S`, `renderSettings`, `renderView`, and other runtime variables have gone out of scope.

## Active page registry

`core/runtime/998-runtime-extension-foundation-v219.js` creates `window.MediaFlowRuntime` and a real page renderer/enhancer registry.

Settings is the first page migrated onto this active registry:

```text
pages/settings/144-v219-active-settings-page.js
```

The router now uses the registered Settings renderer when `S.view === 'settings'`. Other pages continue using their stable legacy renderers until they are migrated in future releases.

## Browser bundle

The browser loads `assets/js/mediaflow-v219.bundle.js`. It is still one compatibility bundle because the stable application shares lexical state, but v219 now has an explicit safe extension point instead of relying on accidental concatenation after the closure.

## Validation

Run:

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-ui.py
```

`check.py` verifies build order, the runtime slot, page registration, v217 navigation behavior, v219 Settings requirements, schemas, and JavaScript syntax.

`smoke-ui.py` launches Chromium with a controlled in-memory MediaFlow account and verifies that the actual Settings page renders with search, organized navigation, reset buttons, working search filtering, individual reset behavior, and Restore all defaults.

## Compatibility

- App release: **219**
- Stable feature base: **201**
- Cloud Sync contract: **201**
- Full Backup schema: **29**
- Settings Preset schema: **1**
