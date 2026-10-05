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

## v230 — Choice & Filter Layout Control Center

`src/js/components/164-v230-choice-filter-layout.js` owns the v230 cross-surface ordering/visibility layer.

Persistent configuration lives in `S.settings.v230ChoiceLayout`, with one configuration object for each of Set Category, Set Status, Set Priority, Category Filter, Status Filter and Priority Filter. Category-based surfaces may resolve their effective order/visibility from the main Categories state or from the Dynamic Category Row state without overwriting their saved custom order. Filter DOM enhancers apply the resolved configuration to native selects, checkbox category panels and the Dynamic Library status row after rendering.

The module is loaded through the v219 runtime-extension slot, before the explicit application closure, and therefore remains inside the active MediaFlow scope. The v230 settings are part of the canonical Settings object and require no Cloud Sync, Full Backup or Settings Preset schema bump.

## v231 — Settings Navigation + Layout Inheritance Polish

`src/js/components/165-v231-settings-library-mode-layout-inheritance.js` is the final v231 runtime extension.

It keeps the v230 `S.settings.v230ChoiceLayout` model but expands source resolution with:

- `setStatus.source = dynamicStatus`;
- `categoryFilter.source = setCategory`;
- `statusFilter.source = dynamicStatus` in addition to `setStatus`.

Dynamic status inheritance reads `S.settings.v181Library.statusOrder` live and does not copy it into the dependent layout. Category Filter → Set Category recursively resolves Set Category's effective source, including Category Settings and Dynamic Category Row inheritance.

The module also promotes `v181Library.mode` into a separate `LIBRARY MODE` Settings section while leaving Dynamic Library configuration under `LIBRARY EXPERIENCE`.

Settings sidebar highlighting is maintained by a lightweight scroll tracker. Sidebar jumps temporarily lock the clicked target during smooth scrolling, then return to normal scroll-based detection.

v231 adds no new persistent top-level schema. Existing Cloud Sync v201, Full Backup Schema v29 and Settings Preset Schema v1 remain valid.

### v231 active release assets

- `src/js/components/165-v231-settings-library-mode-layout-inheritance.js`
- `assets/css/101-v231-settings-layout-inheritance.css`
- generated bundle: `assets/js/mediaflow-v231.bundle.js`

## v232 — Performance, Dynamic Status Ownership & Persistence Audit

`src/js/components/166-v232-library-performance-persistence-details.js` is the final v232 runtime extension.

### UI enhancement architecture

v225, v226 and v230 each installed a whole-document `MutationObserver`. On Library re-renders these could all rescan the document, and v230 could re-append filter/select children, creating additional mutations. v232 disconnects those three observers and installs one `V232_UI_OBSERVER` that batches newly-added roots with `requestAnimationFrame` and enhances only those subtrees.

The v230 select/category-panel application methods are overridden with idempotent versions: if order/visibility already matches the effective layout, no nodes are moved.

### Library hot paths

The classic Library overview estimator now precomputes known-total/unknown-total information in one Library pass instead of repeatedly scanning the Library per category.

Dynamic Library category/status counts are also produced from single passes. Status/category switching renders first and queues `persistSettings()` afterward.

### Dynamic Status ownership

Dynamic Library status navigation is authoritative from `settings.v181Library.statusOrder` only. `v230ApplyDynamicStatusRow()` is disabled so Status Filter settings cannot reorder Dynamic Library.

Set Status and Status Filter may still inherit **from** Dynamic Status through the v231 source model; the dependency is one-way.

### Persistence audit

v232 explicitly normalizes `settings.v230ChoiceLayout` during persistence/load/apply/snapshot operations and adds a `modifiedAt`-based cloud merge/verification layer for it. Existing `settings.v181Library` cloud handling remains authoritative for Dynamic Library state.

Full Backup and Settings Preset builders are finalized at v232 while preserving **Full Backup Schema v29**, **Settings Preset Schema v1**, and **Cloud Sync v201**. Automatic Backup dynamically resolves the final Full Backup builder and therefore uses the same v232 payload.

Personal Order dedicated export is finalized as format v4, and History CSV is expanded for the current session data model.

### Title Details

`assets/css/102-v232-performance-details-settings.css` owns the wider/denser desktop Title Details presentation. The global button-icon resolver excludes `.v181-detail-card`; metadata-card icons are hidden, while the four real action buttons continue through the global semantic icon system.

### v232 active release assets

- `src/js/components/166-v232-library-performance-persistence-details.js`
- `assets/css/102-v232-performance-details-settings.css`
- optimized `src/js/pages/library/013-v70-expanded-library-display-ordering.js`
- optimized `src/js/pages/library/112-dynamic-library-rendering.js`
- generated bundle: `assets/js/mediaflow-v232.bundle.js`
- large-Library regression: `scripts/perf-v232.py`

### Compatibility

- App release: **232**
- Stable feature/data base: **201**
- Runtime foundation: **219**
- Cloud Sync contract: **201**
- Full Backup schema: **29**
- Settings Preset schema: **1**
- Personal Order dedicated export format: **4**

## v233 — Dynamic Settings & Title Details Cover Surface

`src/js/components/167-v233-dynamic-settings-title-details-cover.js` is the final v233 runtime extension.

### Settings ownership

The existing Dynamic Library controls remain stored in `settings.v181Library`, but their user-facing Settings section is now named **DYNAMIC SETTINGS**. v233 rewrites the final rendered `LIBRARY EXPERIENCE` label after the v231 extraction of **LIBRARY MODE**, then places the new section directly below Library Mode through `V221_SETTINGS_SECTION_ORDER.Library`.

Dynamic Settings owns the Dynamic category artwork mode, Dynamic category row source/order/visibility controls, and Dynamic status row order. Library Mode remains independently resettable.

### Title Details cover-size surface

v233 extends the existing `v181CoverSizes` object with `titleDetails`. `v181NormalizeCoverSizes()` already enumerates `V181_COVER_SIZE_DEFAULTS`, so adding the new default makes current load/import/cloud/backup normalization preserve the value without a schema change.

`assets/css/103-v233-dynamic-settings-title-details-cover.css` applies `--v233-cover-title-details` to `.v181-title-hero-cover` and its placeholder while preserving the v232 default dimensions at 100%.

### Compatibility

- App release: **233**
- Stable feature/data base: **201**
- Runtime foundation: **219**
- Cloud Sync contract: **201**
- Full Backup schema: **29**
- Settings Preset schema: **1**
- Personal Order dedicated export format: **4**

## v234 Dashboard quick-entry layer

`components/168-v234-dashboard-input-polish.js` advances the runtime release while `assets/css/104-v234-dashboard-quick-inputs.css` owns Dashboard Rate Your Library and Missing Covers quick-entry sizing/styling. No data model or persistence schema changes are introduced.

## v235 Missing Covers validation layer

`src/js/components/169-v235-missing-cover-live-validation.js` wraps the current Missing Covers renderer and confirmed save action after all legacy/category-fallback behavior is already installed. It keeps candidate URL state transient, validates `http(s)` candidates by actually loading them through `Image`, and only delegates to the existing v192 save pipeline after the exact current input has passed validation.

The live poster preview is DOM-only. No Library field is changed by typing, pasting, image checking, previewing, or failed validation. Confirmed saves continue through the existing cover persistence/XP/queue pipeline, so Cloud Sync v201, Full Backup Schema v29 and Settings Preset Schema v1 require no changes.

`assets/css/105-v235-missing-cover-live-validation.css` owns the live poster image, URL validation feedback, and disabled-save presentation.

## v236 Category Filter layer

The final runtime extension adds a panel-local searchable/paginated Category Filter for Normal Library while leaving Dynamic Library category navigation untouched. Category order/visibility resolves through the existing v230 Choice & Filter Layout state, and page-size persistence is stored on `settings.v230ChoiceLayout.categoryFilter.pageSize`.

## v237 — Cross-surface searchable Category Filter

`src/js/components/171-v237-cross-surface-category-filters.js` extends the v236 Category Filter UI to Personal Order Add Titles, Batch Log, and Dashboard logging. It reuses the canonical v230 Category Filter order/visibility resolver and the v236 `Categories per page` preference. Search/pager updates are local to the dropdown DOM; category selection refreshes are coalesced by surface through `requestAnimationFrame`.

## v238 — Status reliability, logging lazy browser and responsive device mode

`src/js/components/172-v238-status-logging-responsive-device-mode.js` is the final v238 runtime extension.

### Status-filter reliability

v238 wraps the final `v230ReorderSelect()` and explicitly preserves/restores the selected value around `<option>` DOM reordering. This fixes Chromium changing the effective selection after Choice & Filter Layout rearranges status/priority/category options. Hidden selections safely fall back to a visible option.

### Logging ownership

v238 installs the final `App.openLogForm()` after earlier logging wrappers, so Log & Complete initializes the draft and renders once. The Library browser is collapsed by default and `v224LogSuggestionsHtml()` returns a lightweight placeholder until the Library panel is opened. The final `renderLogForm()` wrapper moves the browser below the What You Logged summary.

### Responsive device mode

`settings.v238DeviceLayout = { mode, modifiedAt }` is the canonical v238 setting. `mode` is `auto`, `mobile`, `tablet` or `desktop`. `html[data-v238-layout]` drives layout overrides in `assets/css/108-v238-status-logging-responsive-device-mode.css`; Automatic resolves from viewport width without a full app render on resize.

### Persistence

The v238 setting is normalized by the final modern-settings normalizer, explicitly merged/verified by timestamp in cloud-state reconciliation, included in Full Backup audit metadata and Settings Preset metadata, and uses the existing complete Settings payloads. Schemas remain Cloud 201 / Full Backup 29 / Settings Preset 1.

### Edit Title

The final `libraryModalHtml()` is wrapped by `.v238-library-editor`. Desktop CSS uses a large multi-column workspace and compacts cover, repeat-history and rich metadata controls; smaller screens retain scrolling for safety.

## v239 notes
v239 keeps the v219 runtime-extension architecture and v201 stable feature base. The v238 manual Device & Layout override is retired; responsive presentation again follows native viewport breakpoints. The retired settings field is removed during normalization/import/merge so it is no longer written to cloud, Full Backup or Settings Presets. Batch Log, Dashboard logging and Edit Title changes remain presentation/runtime extensions and do not alter Library or History schemas.

## v240 notes
v240 remains a runtime-extension release on the v201 stable feature base. The Edit Title change is presentation-only and keeps every existing field ID/save handler intact; layout is controlled by semantic classes added after the existing modal pipeline renders. A new `settings.v181CoverSizes.loggedTitles` value extends the existing per-surface cover-size object and therefore participates in the established whole-settings cloud/backup/preset pipelines without a schema bump. The account-profile icon cleanup only changes presentation.

## v241 runtime extension
`components/175-v241-editor-history-performance.js` adds the v241 Library index/cache, Dynamic Library bucket reads, Dashboard queue reuse, Personal Order picker caching, History category/date filtering, Library History pagination, logged-cover Title Details behavior, and current persistence/export audit wrappers. `assets/css/111-v241-editor-history-performance.css` owns the corresponding Edit Title, History, logging-cover and render-containment presentation.

## v242 runtime extension
`components/176-v242-logging-history-performance-polish.js` remains inside the v219 runtime-extension slot. It reuses v241's Library index for logged-card lookups and adds a title-only logging index plus bounded query cache/prefix narrowing so Dashboard logging does not repeatedly normalize and scan every title for each keystroke. The v225 global icon observer is replaced with a subtree-scoped equivalent to avoid whole-document button rescans during logging DOM churn. No persistent schema changes are introduced; export/backup wrappers only annotate the current audit state.

## v243 runtime extension
`components/177-v243-logging-cover-batch-filter-polish.js` remains inside the v219 runtime-extension slot. It corrects v242 logging artwork so a real title cover and category fallback cannot render simultaneously, while preserving the existing Title Details click target. Batch Log category filtering keeps the shared v236/v237 filter engine but receives a late stacking/overflow safety layer so the absolute dropdown can render over following cards. No persistent schema changes are introduced; backup/preset/export wrappers only annotate the v243 audit state.

## v244 Progressive Web App architecture

MediaFlow v244 promotes the existing hosted manifest/service-worker concept into a release-owned PWA subsystem.

### Scope and GitHub Pages
`manifest.json` uses `start_url: "./"` and `scope: "./"`. `sw.js` is served from the project root. This deliberately scopes the installed app to the GitHub Pages `/MediaFlow/` project directory without assuming a domain-root deployment.

### Runtime install/update controller
`components/178-v244-pwa.js` owns browser-facing PWA state: deferred install prompt, installed/standalone detection, service-worker registration, update discovery, waiting-worker application, online/visibility rechecks and the PWA card injected into the existing App Updates Settings section.

The older core registration point now delegates to `window.MediaFlowPWA.register()` when v244+ is present and retains a minimal fallback for older modular builds.

### Service-worker strategy
`scripts/pwa.py` generates `sw.js` from the current `VERSION` and current local assets referenced by `index.html`.

- Navigation / app document: network-first, cached `index.html` fallback.
- Manifest/version metadata: network-first.
- Release app-shell CSS/JS/icons: versioned cache-first.
- Cross-origin account/API/font/cover traffic: not captured by the MediaFlow app-shell cache.
- Activation removes old `mediaflow-pwa-*` and legacy `mediaflow-v*` caches.
- Waiting workers activate only after an explicit `SKIP_WAITING` message.

### Future release contract
Every release must advance `VERSION` before the build. `scripts/build.py` derives the versioned bundle path from `VERSION`, aligns the index release metadata, then runs `scripts/pwa.py`. The PWA cache name therefore advances with the MediaFlow release and the current entry assets are rediscovered instead of being copied into `sw.js` by hand.

### Data ownership
The PWA subsystem stores only browser cache/install state. MediaFlow user data remains owned by the existing local/cloud/full-backup/settings-preset pipelines. Cloud Sync v201, Full Backup Schema v29, Settings Preset Schema v1 and Personal Order Export v4 are unchanged.


## v245 — Unified application icon identity

v245 does not create a second PWA system. The v244 manifest/service-worker/update architecture remains authoritative. The supplied Alex Godly `.ico` becomes the canonical visual source for the browser favicon and the derived install/icon assets.

The project root `favicon.ico` is the browser-facing canonical favicon. Normal PWA icons preserve the supplied logo on transparency, while the maskable variant places the same logo inside a safe opaque area to survive launcher cropping. `scripts/pwa.py` includes the favicon assets in the generated release app shell, so future VERSION bumps retain the icon identity automatically.

## v246 responsive PWA layer
`assets/css/115-v246-pwa-mobile-responsive.css` is the final viewport/PWA responsiveness layer for tablet, mobile, very tight phones and standalone safe-area handling. `components/180-v246-pwa-mobile-install-responsive.js` owns the v246 PWA card actions, install fallback instructions, always-working reload behavior and runtime viewport classification. PWA release/cache generation remains owned by `scripts/pwa.py` and is run by `scripts/build.py`.

## v247 PWA reliability and diagnostics layer

`src/js/components/181-v247-pwa-reliability-diagnostics.js` extends the existing v244/v246 PWA runtime rather than creating a second install system. It owns the Settings diagnostics panel, live manifest/icon/worker/app-shell probes, cache-repair action, clearer install-state messaging and the v247 public diagnostics API.

`scripts/pwa.py` remains the canonical worker generator. Starting with v247 it precaches app-shell assets independently instead of using one rejecting `cache.addAll(APP_SHELL)` transaction. `sw.js` exposes `GET_DIAGNOSTICS` and `RETRY_APP_SHELL_CACHE` so the running MediaFlow UI can inspect and repair the release cache without touching user data.

`assets/css/116-v247-pwa-reliability-diagnostics.css` is a presentation-only layer for diagnostics and keeps the v246 tablet/mobile/tight-width behavior intact.
