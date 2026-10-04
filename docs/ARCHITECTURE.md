# MediaFlow v226 Architecture

## Runtime foundation

MediaFlow v226 continues the v219 runtime-extension architecture. Release modules are injected through `src/js/runtime-order.json` before `core/runtime/999-close-app.js`, while the legacy v201-compatible application state and render helpers remain available inside the same lexical scope.

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
158-v226-semantic-icons-dropdowns.js
      ↓
159-v226-category-settings-dynamic-icon-mode.js
      ↓
160-v226-library-sizing-display-polish.js
      ↓
999-close-app.js
```

## v226 ownership

Semantic icon replacement and purpose-aware dropdown icons are owned by:

```text
src/js/components/158-v226-semantic-icons-dropdowns.js
```

The Dynamic Library category-row icon preference and persistence/reset integration are owned by:

```text
src/js/pages/settings/159-v226-category-settings-dynamic-icon-mode.js
```

Dynamic Library cover/title sizing parity and the `Cover+Titles` display label are owned by:

```text
src/js/pages/library/160-v226-library-sizing-display-polish.js
```

Shared v226 presentation is owned by:

```text
assets/css/96-v226-semantic-ui-library.css
```

The v226 semantic icon pass intentionally runs after the v225 global button decorator. It can replace an already-mounted generic icon with a status-, Settings-, visibility-, refresh-, mode-, order-, or session-specific icon, while leaving drag handles icon-free.

## Generated runtime

The browser loads:

```text
assets/js/mediaflow-v226.bundle.js
```

The generated bundle must exactly match `build-order.json` plus `runtime-order.json`.

## Persistence

The new Dynamic Library category-row icon preference is stored in the existing `settings.v181Library` object. Existing local settings, cloud settings, Full Backup, Automatic Backup, Settings Preset, Sync Now and import/export pipelines continue to own persistence; no schema bump is required.

## Validation

Run:

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-ui.py
```

The Chromium smoke test validates Settings integrity, category-layout containment, semantic icon behavior, dropdown icon coverage, Dynamic Library icon settings, Dynamic Library size controls, and v222–v225 regressions.

## Compatibility

- App release: **226**
- Stable feature/data base: **201**
- Runtime foundation: **219**
- Cloud Sync contract: **201**
- Full Backup schema: **29**
- Settings Preset schema: **1**
