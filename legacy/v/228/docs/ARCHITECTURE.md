# MediaFlow v228 Architecture

## Runtime foundation

MediaFlow v228 continues the v219 runtime-extension architecture. Release modules are injected through `src/js/runtime-order.json` before `core/runtime/999-close-app.js`, while the stable v201-compatible application state and render helpers remain available inside the same lexical scope.

```text
build-order.json
      ↓
runtime_extensions slot
      ↓
998-runtime-extension-foundation-v219.js
      ↓
v221–v224 active release modules
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
161-v227-ui-icon-corrections.js
      ↓
162-v228-library-priority-dynamic-row.js
      ↓
999-close-app.js
```

## v228 ownership

The v228 runtime behavior is owned by:

```text
src/js/components/162-v228-library-priority-dynamic-row.js
```

That module owns:

- the Library category-pill global-icon exclusion;
- Library priority-pill semantic icon mapping;
- Low / Medium / High priority icon parity with the priority picker;
- `settings.v181Library.dynamicCategoryOrderMode` normalization/defaults;
- effective Dynamic category order resolution;
- custom/follow order mode switching;
- Dynamic category drag-and-drop handlers;
- Settings UI augmentation for the order source and drag handle;
- effective-order use in Dynamic Library rendering and selection;
- Library Overview Dynamic-order parity;
- individual Settings reset integration; and
- explicit Full Backup manifest metadata for the new persistent setting.

Shared v228 presentation is owned by:

```text
assets/css/98-v228-library-priority-dynamic-row.css
```

The stylesheet owns Library metadata icon cleanup, priority-pill icon sizing, the Dynamic order-source setting card, responsive drag/position/action row layout, drag/drop feedback, and Follow-mode read-only styling.

## Dynamic category order model

The existing `settings.v181Library.categoryOrder` continues storing the user's independent Dynamic custom order.

v228 adds:

```text
settings.v181Library.dynamicCategoryOrderMode
```

with values:

```text
custom   → use settings.v181Library.categoryOrder
category → use the current main S.categories order
```

Follow mode does **not** overwrite `categoryOrder`. Switching back to Custom therefore restores the previous Dynamic-specific order.

Dynamic visibility remains stored independently in `hiddenCategoryIds`.

## Persistence audit

The new order-source preference is inside `S.settings.v181Library`.

As a result:

- local settings persistence includes it;
- v181 cloud merge/verification includes it through `v181NormalizeLibrarySettings`;
- Sync Now includes it;
- Full Backup includes it;
- Automatic Backup includes it through the Full Backup pipeline;
- Settings Preset Export/Import includes it because the complete Settings object is cloned;
- reset/default flows include it through `DEFAULT_SETTINGS.v181Library`.

v228 additionally extends the backup manifest so the order-source preference is explicit in exported backup metadata.

No persistence schema bump is required.

## Generated runtime

The browser loads:

```text
assets/js/mediaflow-v228.bundle.js
```

The generated bundle must exactly match `build-order.json` plus `runtime-order.json`.

## Validation

Run:

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-ui.py
```

The Chromium smoke test validates v221–v227 regressions plus v228 category metadata cleanup, priority icons, the Dynamic row order selector, restored drag handle, Follow Categories behavior, and preservation of the custom Dynamic order when switching modes.

## Compatibility

- App release: **228**
- Stable feature/data base: **201**
- Runtime foundation: **219**
- Cloud Sync contract: **201**
- Full Backup schema: **29**
- Settings Preset schema: **1**
