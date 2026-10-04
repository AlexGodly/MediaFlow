# MediaFlow v221 Source Ownership Map

## Active runtime modules

- `core/runtime/998-runtime-extension-foundation-v219.js` — active page renderer/enhancer registry and public runtime API.
- `pages/settings/146-v221-active-settings-page.js` — v221 Settings renderer, hierarchy, search integration, resets, ordering, and responsive behavior.
- `core/runtime/999-close-app.js` — explicit end of the legacy application scope.
- `runtime-order.json` — runtime modules injected before the app closure.

## Active Settings styling

- `assets/css/92-v221-settings-polish.css` — Settings search/toolbar alignment, Settings navigator, page-group presentation, reset styling, and mobile scrollbar hiding.

## Existing ownership

- `core/` — state, shell, app actions, runtime infrastructure.
- `pages/` — page-owned source.
- `components/` — shared UI systems.
- `features/` — scheduler, logging, XP, themes, backup, imports, rewatch, recommendations.
- `services/` — cloud/persistence logic.
- `utils/` — shared helpers.
- `legacy/` — compatibility source not yet migrated to active page modules.

Older Settings implementations are retained only for history/reference and are not active in `runtime-order.json`.
