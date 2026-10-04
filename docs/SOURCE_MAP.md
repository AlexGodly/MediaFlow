# MediaFlow v220 Source Ownership Map

## Active runtime modules

- `core/runtime/998-runtime-extension-foundation-v219.js` — active page renderer/enhancer registry and public runtime API.
- `pages/settings/145-v220-active-settings-page.js` — v220 Settings renderer, organization, search, resets, and page ordering.
- `core/runtime/999-close-app.js` — explicit end of the legacy application scope.
- `runtime-order.json` — runtime modules injected before the app closure.

## Active Settings styling

- `assets/css/91-v220-settings-polish.css` — redesigned search bar, Settings navigator, page-group presentation, responsive behavior, and reset styling.

## Existing ownership

- `core/` — state, shell, app actions, runtime infrastructure.
- `pages/` — page-owned source.
- `components/` — shared UI systems.
- `features/` — scheduler, logging, XP, themes, backup, imports, rewatch, recommendations.
- `services/` — cloud/persistence logic.
- `utils/` — shared helpers.
- `legacy/` — compatibility source not yet migrated to active page modules.

Older v218/v219 Settings implementations are archived under `docs/history/` and are not part of the active build.
