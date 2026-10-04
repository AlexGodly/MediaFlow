# MediaFlow v227 Architecture

## Runtime foundation

MediaFlow v227 continues the v219 runtime-extension architecture. Release modules are injected through `src/js/runtime-order.json` before `core/runtime/999-close-app.js`, while the legacy v201-compatible application state and render helpers remain available inside the same lexical scope.

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
161-v227-ui-icon-corrections.js
      ↓
999-close-app.js
```

## v227 ownership

The v227 semantic corrections are owned by:

```text
src/js/components/161-v227-ui-icon-corrections.js
```

That module owns:

- plain Minus Time icon treatment;
- Low / Medium / High priority semantic icons;
- visibility-toggle icon handling;
- Automatic / Manual state icons;
- Dashboard poster-placeholder icon exclusions;
- redundant category-choice icon removal; and
- the icon-free exception for the Dynamic category-row icon selector.

Shared v227 presentation is owned by:

```text
assets/css/97-v227-ui-icon-corrections.css
```

The stylesheet also fixes the Dynamic Library category URL icon mode by deliberately outranking the older v181 clean-tab rule that hid category images with `#view-root ... !important`.

## Generated runtime

The browser loads:

```text
assets/js/mediaflow-v227.bundle.js
```

The generated bundle must exactly match `build-order.json` plus `runtime-order.json`.

## Persistence

v227 introduces no new persistent schema. The existing Dynamic Library category icon preference remains stored in `settings.v181Library.dynamicCategoryIcons` and continues through local settings, cloud settings, Full Backup, Automatic Backup, Settings Preset, Sync Now and import/export behavior.

## Validation

Run:

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-ui.py
```

The Chromium smoke test validates Settings integrity, v226 regressions, the Dynamic category icon URL visibility fix, the icon-free selector exception, priority icons, visibility switches, Dashboard poster placeholders, Automatic/Manual state icons and stopwatch minus treatment.

## Compatibility

- App release: **227**
- Stable feature/data base: **201**
- Runtime foundation: **219**
- Cloud Sync contract: **201**
- Full Backup schema: **29**
- Settings Preset schema: **1**
