# MediaFlow v225 Source Ownership Map

## Active runtime modules

Release extensions are listed in `src/js/runtime-order.json` and injected before the explicit app closure.

Current release chain includes:

- `core/runtime/998-runtime-extension-foundation-v219.js` — active page renderer/enhancer registry and public runtime API.
- `pages/settings/146-v221-active-settings-page.js` — Settings organization, search and reset controls.
- `pages/dashboard/147-v222-dashboard-rendering-stability.js` — Dashboard paint stability.
- `pages/dashboard/148-v223-on-this-day-dashboard-visibility.js` — On This Day visibility control.
- `core/runtime/149-v224-sort-foundation.js` — shared v224 sorting foundation.
- `pages/library/150-v224-library-controls.js` — Library header, cover filter and unified sorting.
- `pages/batch-log/151-v224-batch-log-sorting.js` — Batch Log sorting.
- `pages/personal-order/152-v224-personal-order-sorting.js` — Personal Order picker sorting.
- `features/logging/153-v224-dashboard-logging-sorting.js` — Dashboard logging sorting.
- `components/navigation/154-v224-page-names.js` — Personal Order / Account naming.
- `pages/dashboard/155-v224-recommendation-actions.js` — Dashboard recommendation action layout.
- `pages/personal-order/156-v225-personal-order-toolbar-polish.js` — clearly labeled Add Titles filters and sort controls.
- `components/157-v225-global-button-icons.js` — automatic current/future action-button icon system.
- `core/runtime/999-close-app.js` — explicit end of the application scope.

## Active release styling

- `assets/css/92-v221-settings-polish.css` — Settings organization/search polish.
- `assets/css/93-v222-dashboard-rendering-stability.css` — Dashboard compositor safeguards.
- `assets/css/94-v224-library-sorting-actions.css` — v224 Library/sort/recommendation controls.
- `assets/css/95-v225-icons-personal-order.css` — v225 Personal Order toolbar, button icons and Account fields.

## Ownership folders

- `core/` — state, shell, application actions and runtime infrastructure.
- `pages/` — page-owned source.
- `components/` — shared UI systems.
- `features/` — scheduler, logging, XP, themes, backup, imports, rewatch and recommendation features.
- `services/` — cloud/persistence logic.
- `utils/` — shared helpers.
- `legacy/` — compatibility source that still participates in the generated application runtime.
