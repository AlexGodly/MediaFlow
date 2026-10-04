# MediaFlow v225 Architecture

## Runtime foundation

MediaFlow v225 continues the v219 runtime-extension architecture. Release modules are injected through `src/js/runtime-order.json` before `core/runtime/999-close-app.js`, while the legacy v201-compatible application state and render helpers remain available inside the same lexical scope.

```text
build-order.json
      ↓
runtime_extensions slot
      ↓
998-runtime-extension-foundation-v219.js
      ↓
221–224 active release modules
      ↓
156-v225-personal-order-toolbar-polish.js
      ↓
157-v225-global-button-icons.js
      ↓
999-close-app.js
```

## v225 ownership

Personal Order Add Titles clarity is owned by:

```text
src/js/pages/personal-order/156-v225-personal-order-toolbar-polish.js
```

The global action-button icon language is owned by:

```text
src/js/components/157-v225-global-button-icons.js
```

Shared v225 presentation is owned by:

```text
assets/css/95-v225-icons-personal-order.css
```

The icon enhancer is runtime-driven and observes newly rendered DOM nodes, so future text action buttons inherit the icon system without duplicating icon markup across every page renderer.

## Generated runtime

The browser loads:

```text
assets/js/mediaflow-v225.bundle.js
```

The generated bundle must exactly match `build-order.json` plus `runtime-order.json`.

## Validation

Run:

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-ui.py
```

The Chromium smoke test validates Settings integrity, v222/v223 Dashboard regressions, v224 Library/sorting behavior, v225 Personal Order controls, global icons and Account field styling.

## Compatibility

- App release: **225**
- Stable feature/data base: **201**
- Runtime foundation: **219**
- Cloud Sync contract: **201**
- Full Backup schema: **29**
- Settings Preset schema: **1**
