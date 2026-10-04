# MediaFlow v219 Source Ownership Map

## Active v219 runtime modules

- `core/runtime/998-runtime-extension-foundation-v219.js` — page renderer/enhancer registry and public runtime API.
- `pages/settings/144-v219-active-settings-page.js` — active organized Settings renderer, search, resets, and Restore all defaults.
- `core/runtime/999-close-app.js` — explicit end of the legacy application scope.
- `runtime-order.json` — modules injected into the active runtime slot.

## Existing ownership

- `core/` — application state, shell, app actions, runtime infrastructure.
- `pages/` — Dashboard, Library, Order, History, Statistics, Settings, and other page-owned source.
- `components/` — shared category, cover, modal, navigation, pagination, title-details, and batch UI.
- `features/` — scheduler, logging, XP, themes, backup, imports, rewatch, and recommendations.
- `services/` — cloud and persistence logic.
- `utils/` — shared helpers.
- `legacy/` — compatibility source not yet migrated to a true active module.

The old v218 Settings organizer is archived under `docs/history/` and is not part of the active runtime build.
