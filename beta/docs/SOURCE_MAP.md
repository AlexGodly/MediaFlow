# MediaFlow v229 Source Ownership Map

## Active runtime modules

Release extensions are listed in `src/js/runtime-order.json` and injected before the explicit app closure.

Current release chain includes:

- `core/runtime/998-runtime-extension-foundation-v219.js` — active page renderer/enhancer registry and public runtime API.
- `pages/settings/146-v221-active-settings-page.js` — Settings organization, search and reset controls.
- `pages/dashboard/147-v222-dashboard-rendering-stability.js` — Dashboard paint stability.
- `pages/dashboard/148-v223-on-this-day-dashboard-visibility.js` — On This Day visibility control.
- `core/runtime/149-v224-sort-foundation.js` — shared sorting foundation.
- `pages/library/150-v224-library-controls.js` — Library header, cover filter and unified sorting.
- `pages/batch-log/151-v224-batch-log-sorting.js` — Batch Log sorting.
- `pages/personal-order/152-v224-personal-order-sorting.js` — Personal Order picker sorting.
- `features/logging/153-v224-dashboard-logging-sorting.js` — Dashboard logging sorting.
- `components/navigation/154-v224-page-names.js` — Personal Order / Account naming.
- `pages/dashboard/155-v224-recommendation-actions.js` — Dashboard recommendation action layout.
- `pages/personal-order/156-v225-personal-order-toolbar-polish.js` — Personal Order Add Titles filter/sort clarity.
- `components/157-v225-global-button-icons.js` — automatic global action-button icon system.
- `components/158-v226-semantic-icons-dropdowns.js` — semantic button-icon overrides and purpose-aware dropdown icons.
- `pages/settings/159-v226-category-settings-dynamic-icon-mode.js` — Dynamic category-row artwork preference and persistence/reset hooks.
- `pages/library/160-v226-library-sizing-display-polish.js` — Dynamic Library sizing parity and `Cover+Titles` naming.
- `components/161-v227-ui-icon-corrections.js` — v227 icon corrections, visibility switches, Automatic/Manual indicators and Dashboard poster cleanup.
- `components/162-v228-library-priority-dynamic-row.js` — Library category/priority metadata icon cleanup, Dynamic row order source, restored drag controls, effective-order rendering and persistence audit metadata.
- `components/163-v229-library-choice-modals.js` — Set Category real URL artwork, all-category paging, Set Status semantic icons, duplicate-status-icon suppression and Category Icon URL dropdown icon restoration.
- `core/runtime/999-close-app.js` — explicit end of the application scope.

## Active release styling

- `assets/css/92-v221-settings-polish.css` — Settings organization/search polish.
- `assets/css/93-v222-dashboard-rendering-stability.css` — Dashboard compositor safeguards.
- `assets/css/94-v224-library-sorting-actions.css` — Library/sort/recommendation controls.
- `assets/css/95-v225-icons-personal-order.css` — Personal Order toolbar, global button icons and Account fields.
- `assets/css/96-v226-semantic-ui-library.css` — category-layout containment, dropdown icons, Dynamic category artwork modes and sizing parity.
- `assets/css/97-v227-ui-icon-corrections.css` — category URL visibility fix, switch spacing, priority choice cleanup and Dashboard poster protection.
- `assets/css/98-v228-library-priority-dynamic-row.css` — Library metadata cleanup and responsive Dynamic row order/drag UI.
- `assets/css/99-v229-library-choice-modals.css` — Set Category grid/pagination, URL-icon presentation, Set Status semantic icon presentation and Category Icon URL dropdown artwork icon.

## v229 modal ownership

### Set Category

Owned by `components/163-v229-library-choice-modals.js` and `99-v229-library-choice-modals.css`.

Key behavior:

- source list: `S.categories`;
- page size: 15;
- pagination threshold: more than 15 categories;
- category artwork: `v144CategoryIconHtml(...)`;
- no inner choice-list scrolling;
- current-category-aware initial page.

### Set Status

Owned by `components/163-v229-library-choice-modals.js`.

Uses the same semantic icon names as Dynamic Library and keeps `.status-choice` free of a second global button icon.

### Dynamic category-row icon selector

The underlying persistent setting remains owned by `pages/settings/159-v226-category-settings-dynamic-icon-mode.js`.

v229 changes only the selector's visual icon treatment.

## Ownership folders

- `core/` — state, shell, application actions and runtime infrastructure.
- `pages/` — page-owned source.
- `components/` — shared UI systems.
- `features/` — scheduler, logging, XP, themes, backup, imports, rewatch and recommendation features.
- `services/` — cloud/persistence logic.
- `utils/` — shared helpers.
- `legacy/` — compatibility source that still participates in the generated application runtime.

## v230 runtime extension

- `src/js/components/164-v230-choice-filter-layout.js` — Choice & Filter Layout settings, inheritance resolution, ordering/show-hide actions, Set Category/Status/Priority modal resolution, reusable filter DOM application and persistence normalization.
- `assets/css/100-v230-choice-filter-layout.css` — responsive Choice & Filter Layout cards, row controls, drag/drop states and hidden-filter presentation.

## v231 runtime extension

- `src/js/components/165-v231-settings-library-mode-layout-inheritance.js` — Library Mode Settings extraction, Settings active-section highlighting, Set Priority default correction, Set Status Dynamic Status inheritance, Category Filter → Set Category inheritance, and Status Filter Dynamic Status inheritance.
- `assets/css/101-v231-settings-layout-inheritance.css` — Library Mode card presentation and active Settings sidebar styling.
