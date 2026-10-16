# MediaFlow v232 — Library Performance, Dynamic Status Independence & Data-Pipeline Audit

MediaFlow v232 is a performance, reliability, persistence-audit, and Title Details refinement release.

It fixes the remaining Library/Dynamic Library interaction stalls, makes Dynamic Library status ordering fully independent from Set Status and Status Filter layout settings, cleans Settings presentation, audits the app's current export/backup/cloud paths after the v224–v231 feature wave, and redesigns Title Details for a wider non-scrolling desktop presentation.

## Settings navigation order

- **Library Mode** is now the first entry in the Settings → Library group.
- **Categories** follows immediately after Library Mode.
- Existing active-section highlighting from v231 is preserved.
- Library Mode keeps its dedicated semantic sidebar icon.

## Choice & Filter Layout copy cleanup

Removed inherited-source helper sentences from the Choice & Filter Layout cards, including the visible variants that said order/visibility followed:

- Library Experience → Dynamic Category Row;
- Settings → Categories;
- Set Priority;
- Set Status.

The selected source remains visible in the source selector itself, so the extra repeated prose is no longer necessary.

## Meaningful All icon

The generic action icon previously used by exact **All** action buttons is replaced with a dedicated four-item/grid-style icon representing “all items”.

## Library performance fix

v232 removes a major source of Library UI stalls.

Three older whole-document MutationObservers from the v225/v226/v230 UI layers were all reacting to newly-rendered Library DOM and repeatedly rescanning the entire document. On very large Libraries, those observers could trigger one another after filter/select DOM reordering and create expensive repeated work.

v232:

- disconnects the three legacy whole-document observers;
- replaces them with one batched, scoped observer;
- enhances only newly-added subtrees;
- skips descendant roots when their parent is already scheduled;
- makes select/category-filter reordering idempotent so unchanged DOM is not re-appended;
- prevents filter layout application from causing a mutation/re-render loop.

## Normal Library category-filter performance

The Normal Library category-filter path has been optimized for large Libraries.

The Library overview estimator previously scanned the full Library multiple times for every category on every Library render. v232 precomputes the required known-total/unknown-total statistics in one Library pass.

This significantly reduces work performed after category-filter changes.

A v232 Chromium regression test uses a synthetic **30,000-title Library** and repeatedly changes category filters to verify that interactions complete correctly without freezes.

## Dynamic Library performance

Dynamic Library category/status counting is now precomputed in single passes rather than repeatedly filtering the entire Library for every category/status button.

Status/category switching also now:

1. updates the active Dynamic Library state;
2. renders the new view immediately;
3. queues persistence through the normal protected save path afterward.

This prevents saving from blocking the visible status/category switch.

## Dynamic Status ordering is now independent

The v230 Choice & Filter Layout layer could accidentally reorder the Dynamic Library status row using **Status Filter** settings.

That behavior is removed.

Dynamic Library status order is now owned only by:

> **Settings → Library Experience → Dynamic Status Row**

The Dynamic Library status row no longer reads Set Status popup order or Status Filter order.

This means the following are separate systems:

- Dynamic Library Status Row;
- Set Status popup;
- Status Filter.

Set Status/Status Filter may still *choose to follow* Dynamic Status through the inheritance options introduced in v231, but Dynamic Status never follows them back.

## Dynamic status click reliability

Fixed cases where clicking Dynamic Library status buttons could appear to do nothing or freeze.

The fix combines:

- removal of the MutationObserver re-render loop;
- scoped UI enhancement;
- one-pass count generation;
- immediate render before persistence;
- strict Dynamic Status ownership.

## Persistence / data pipeline audit

The persistent/export systems were reviewed after the v224–v231 releases.

The audit covers:

- Full Data Export / Import;
- Automatic Backup;
- Sync Now;
- cloud settings/state merge;
- cloud verification;
- Settings Preset Export / Import;
- Personal Order Export / Import;
- History CSV Export.

### Cloud Sync

Cloud Sync remains **v201**.

The current `v230ChoiceLayout` object now receives explicit v232 cloud merge/verification handling by `modifiedAt`, in addition to the complete Settings snapshot path.

Dynamic Library configuration remains under `settings.v181Library`, whose merge/verification path already includes Dynamic status order, category order/visibility, Library mode, and related Library settings.

### Sync Now

Sync Now continues using the existing protected cloud synchronization pipeline.

The v232 verification layer explicitly checks current Choice & Filter Layout state so a successful Sync Now cannot silently omit the v230/v231 layout configuration.

### Full Backup

Full Backup remains **Schema v29**.

No schema bump is required because the current settings are already represented by the complete Settings object.

v232 refreshes the final backup builder/manifest so the exported payload explicitly represents the current v232 state, including:

- Library / Dynamic Library configuration;
- Dynamic status ordering;
- Choice & Filter Layout configuration;
- Categories and category settings;
- Library and rich title metadata;
- History;
- Personal Order and recovery state;
- XP/progression;
- Dashboard/Statistics/Appearance settings;
- current persistent settings added through v232.

### Automatic Backup

Automatic Backup remains routed through the final Full Backup builder at execution time.

Therefore the v232 Full Backup audit also updates Automatic Backup coverage without a second serialization implementation.

### Settings Preset

Settings Preset remains **Schema v1**.

The final Settings Preset builder now explicitly normalizes and exports the current Settings state, including:

- Choice & Filter Layout;
- Dynamic Library status/category configuration;
- Library Mode;
- other persistent settings added before v232.

Imported settings are normalized through the current v181/v230 settings models before use.

## Personal Order export/import audit

Personal Order's dedicated export format has been refreshed to **format v4** while preserving import compatibility with previous exported formats.

The v232 Personal Order export records the current MediaFlow version and includes the existing order data plus current recovery metadata such as:

- ordered title IDs;
- view/category modes;
- category order/hidden categories;
- ordered-title pagination settings;
- page size;
- last cleared order recovery state;
- modification timestamp.

Import restores the supported modern recovery information after the existing compatibility importer completes.

## History export audit

History CSV export has been expanded beyond the older minimal nine-column export.

The current CSV includes fields for:

- ID;
- date/time/timestamp;
- category and category ID;
- target / actual / unit / minutes;
- status / note;
- XP;
- health status;
- source;
- assigned category/target information;
- whether the assigned category was followed;
- session/batch group IDs;
- structured titles JSON.

This better reflects the richer History/session model used by current MediaFlow releases.

## Title Details popup cleanup

The Title Details / anime-details popup has been redesigned for desktop use.

### Icons removed from metadata

Generic action icons are removed from all editable/read-only metadata cards.

Decorative category artwork is also removed from the title metadata pill inside this popup.

Only the four intended action buttons keep icons:

- **Edit title**;
- **Close**;
- **Edit all title details**;
- **Close**.

### Larger desktop popup

The desktop Title Details popup is now significantly wider and uses a denser multi-column metadata layout.

The layout uses:

- a larger maximum desktop width;
- five metadata columns where space allows;
- tighter card spacing;
- smaller hero/metadata spacing;
- compact action controls.

### No internal desktop scrolling

On normal desktop viewports, the Title Details modal is designed to fit without its own internal scrollbar.

The v232 regression suite validates this on both a wide desktop viewport and a narrower desktop viewport.

## Existing behavior preserved

v232 preserves:

- Library Mode / Categories Settings grouping;
- v231 active Settings navigation highlighting;
- v230 Choice & Filter Layout controls and inheritance modes;
- Set Category paging/artwork;
- Set Status semantic icons;
- priority semantic icons;
- Dynamic Category Row custom/follow ordering;
- category Icon URL mode;
- unified sorting;
- cover filters;
- Dynamic Library display sizing;
- Personal Order naming and layout;
- Account naming/styling;
- current backup/cloud schemas.

## Compatibility

No Library/user-data migration is required.

- **Cloud Sync:** v201
- **Full Backup Schema:** v29
- **Settings Preset Schema:** v1
- **Personal Order dedicated export format:** v4

# v232 Release Summary

**Release:** MediaFlow v232  
**Codename:** **Library Performance, Dynamic Status Independence & Data-Pipeline Audit**  
**Base:** MediaFlow v231 Modular  
**Stable feature base:** MediaFlow v201  
**Created by:** Alex Godly

### Main Changes

- Moved **Library Mode** to the first position in the Settings → Library sidebar/group.
- Kept **Categories** directly after Library Mode.
- Removed inherited-source explanation text from Choice & Filter Layout cards.
- Replaced the generic **All** action icon with a meaningful all-items icon.
- Fixed major Library/category-filter lag caused by overlapping whole-document MutationObservers.
- Replaced three global observer passes with one scoped/batched UI enhancer.
- Made filter/select reordering idempotent.
- Optimized Normal Library overview calculations for large Libraries.
- Optimized Dynamic Library category/status counts.
- Made Dynamic status/category switching render before persistence.
- Fixed intermittent Dynamic Library status clicks/freezes.
- Made Dynamic Library status ordering depend only on **Dynamic Status Row** settings.
- Fully separated Dynamic Status from Set Status popup and Status Filter ordering.
- Audited cloud merge/verification and Sync Now for current Choice & Filter settings.
- Audited Full Backup and Automatic Backup after v224–v232.
- Audited Settings Preset export/import.
- Updated Personal Order export to dedicated format v4 and refreshed recovery metadata.
- Updated Personal Order import compatibility handling.
- Expanded History CSV export for the current session/history data model.
- Removed metadata-card icons from Title Details.
- Kept icons only on Edit title / Close / Edit all title details / Close actions.
- Enlarged and densified the desktop Title Details popup.
- Removed internal Title Details scrolling on tested desktop viewport sizes.
- Added a dedicated **30,000-title performance/regression test**.
- Preserved **Cloud Sync v201**.
- Preserved **Full Backup Schema v29**.
- Preserved **Settings Preset Schema v1**.
- Updated MediaFlow runtime/version/cache to **232**.

## Version Progression

**v229** → Category popup overhaul, status icon alignment & category artwork improvements  
**v230** → Choice & Filter Layout Control Center  
**v231** → Library Mode Settings, active Settings navigation & extended inheritance controls  
**v232** → **Library performance, Dynamic Status independence & data-pipeline audit**
