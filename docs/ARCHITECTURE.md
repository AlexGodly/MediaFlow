# MediaFlow v229 Architecture

## Runtime foundation

MediaFlow v229 continues the v219 runtime-extension architecture. Release modules are injected through `src/js/runtime-order.json` before `core/runtime/999-close-app.js`, while the stable v201-compatible application state and render helpers remain available inside the same lexical scope.

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
163-v229-library-choice-modals.js
      ↓
999-close-app.js
```

## v229 ownership

The v229 runtime behavior is owned by:

```text
src/js/components/163-v229-library-choice-modals.js
```

That module owns:

- Set Category modal rendering;
- use of `v144CategoryIconHtml(...)` for real category Icon URL artwork;
- inclusion of every current category instead of only enabled categories;
- 15-category paging and page selection;
- Set Category Previous / Next actions;
- opening on the page that contains the title's current category;
- Set Status semantic icon parity with Dynamic Library;
- suppression of duplicate global icons on status choices; and
- the restored artwork icon on the Dynamic category-row icon selector.

Shared v229 presentation is owned by:

```text
assets/css/99-v229-library-choice-modals.css
```

The stylesheet owns the wider Set Category modal, non-scrolling category-choice grid, responsive one/two-column layout, pagination presentation, category URL image sizing, Set Status semantic-icon sizing, and the Category Icon URL dropdown's restored leading artwork icon.

## Category modal paging model

Set Category uses:

```text
V229_CATEGORY_MODAL_PAGE_SIZE = 15
```

Behavior:

```text
category count <= 15  → show all choices, no pagination
category count > 15   → show 15 choices per page + pagination
```

The category choice grid intentionally overrides the legacy `.choice-list` `max-height` / `overflow:auto` behavior so the category list itself never becomes an inner scrolling area.

The outer modal remains constrained by the viewport and can still participate in normal modal viewport scrolling on very small displays.

## Category artwork model

Category choices now call:

```text
v144CategoryIconHtml(category)
```

That existing helper:

1. validates `category.iconUrl` as HTTP/HTTPS;
2. displays the URL image when valid; and
3. falls back to the category emoji when no usable URL exists.

No duplicate icon storage is introduced by v229.

## Status icon model

Set Status maps its five state IDs to the existing v226 semantic icon names:

```text
planned   → planToWatch
active    → watching
paused    → onHold
completed → completedStatus
dropped   → dropped
```

The popup therefore uses the same SVG definitions already used by Dynamic Library.

`.status-choice` is excluded from the global action-button decorator because each row renders its explicit semantic icon inside `.choice-icon`.

## Dropdown icon integration

v227 intentionally exempted:

```text
select[aria-label="Dynamic Library category row icons"]
```

from leading dropdown icons.

v229 overrides that focused exception after the v227 handler runs and assigns the existing artwork/cover SVG through the v226 dropdown-icon system.

The selector values and persistence path are unchanged.

## Persistence

v229 adds no new persistent fields.

The release changes rendering and interaction only, so existing persistence paths remain unchanged:

- local settings persistence;
- cloud merge / verification;
- Sync Now;
- Full Backup;
- Automatic Backup;
- Settings Preset Export / Import.

No persistence schema bump is required.

## Generated runtime

The browser loads:

```text
assets/js/mediaflow-v229.bundle.js
```

The generated bundle must exactly match `build-order.json` plus `runtime-order.json`.

## Validation

Run:

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-ui.py
```

The Chromium smoke test validates v221–v228 regressions plus v229 category URL artwork, no-inner-scroll category choices, status semantic icons, duplicate-icon suppression, and the restored Category Icon URL selector icon.

Static structural checks additionally verify that category pagination remains conditional on more than 15 categories.

## Compatibility

- App release: **229**
- Stable feature/data base: **201**
- Runtime foundation: **219**
- Cloud Sync contract: **201**
- Full Backup schema: **29**
- Settings Preset schema: **1**
