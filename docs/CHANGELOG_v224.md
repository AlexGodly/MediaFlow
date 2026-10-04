# MediaFlow v224 — Library Controls, Unified Sorting & Navigation Polish

**Release:** MediaFlow v224  
**Base:** MediaFlow v223 Modular  
**Stable data/feature base:** MediaFlow v201  
**Created by:** Alex Godly

MediaFlow v224 focuses on Library browsing, consistent sorting, clearer page naming and cleaner Dashboard recommendation actions.

## Library header cleanup

- Removed **Empty library** from the Library page in both Normal and Dynamic modes.
- Library-wide deletion remains available from **Settings → Library Maintenance**.
- **+ Add title** is now the single Library header action and naturally occupies the right-side header position previously occupied by Empty library.

## New cover filter

Normal and Dynamic Library now share a cover-presence filter with:

- **All covers**
- **Has cover**
- **Missing cover**

The filter checks the title's own `coverUrl`; category fallback artwork does not count as a real title cover.

## Unified sorting system

v224 removes duplicated sort entries such as `Priority: High → Low` and `Priority: Low → High`.

Sorting now uses:

1. one **sort field** selector;
2. one independent **ASC / DESC** direction button.

The default everywhere updated by v224 is:

> **Alphabetic · ASC**

### Normal + Dynamic Library

Library sorting includes:

- Alphabetic
- Priority
- Rating
- Progress watched/read
- Total episodes/chapters
- Last updated by logging
- Last edited
- Last seen in Title Details
- Date added
- Random

Random keeps its existing Shuffle Again behavior and does not use direction.

### Batch Log

Batch Log Library browsing now uses:

- Alphabetic
- Priority
- Rating
- Progress
- Total

plus the independent ASC/DESC switch.

### Personal Order — Add Titles

The Add Titles Library browser now uses the same single-field + direction approach.

The manually arranged Personal Order itself is **not auto-sorted**; only the Library picker used to add titles is sorted.

### Dashboard logging

The Dashboard logging Library browser now:

- exposes sorting immediately when logging opens;
- can browse the full Library before text is entered;
- uses Alphabetic / ASC by default;
- supports the same independent ASC/DESC direction control.

## Page naming cleanup

- **Order** is now named **Personal Order** in the main navigation and on the page heading.
- **Profile settings** is now named **Account** in the main navigation and on the page heading.
- Internal view IDs stay unchanged, so existing navigation order/data remain compatible.

## Dashboard recommendation actions redesigned

When exact-title recommendations are active, the recommendation controls are now presented directly **under the recommended title**.

The action bar contains:

- **Edit** with edit icon
- **Reroll title** with reroll icon
- **Rerolls history** with history icon and reroll count

The action layout is responsive on mobile.

## Architecture / compatibility

v224 continues using the active runtime-extension architecture introduced in v219. New v224 behavior is split into dedicated runtime-owned source modules instead of being appended outside the running app scope.

New active runtime modules:

- `core/runtime/149-v224-sort-foundation.js`
- `pages/library/150-v224-library-controls.js`
- `pages/batch-log/151-v224-batch-log-sorting.js`
- `pages/personal-order/152-v224-personal-order-sorting.js`
- `features/logging/153-v224-dashboard-logging-sorting.js`
- `components/navigation/154-v224-page-names.js`
- `pages/dashboard/155-v224-recommendation-actions.js`

New stylesheet:

- `assets/css/94-v224-library-sorting-actions.css`

## Validation

v224 validation confirms:

- generated bundle matches build/runtime manifests;
- JavaScript syntax passes;
- Settings v221 organization/search remains working;
- v222 Dashboard paint stability remains active;
- v223 On This Day visibility remains working;
- Library no longer exposes Empty library;
- cover filter exists;
- Library default sort is Alphabetic / ASC;
- Batch Log default sort is Alphabetic / ASC;
- Personal Order Add Titles default sort is Alphabetic / ASC;
- Dashboard logging default sort is Alphabetic / ASC;
- Personal Order and Account page/navigation names are active.

## Persistent schemas

No persistent content schema bump is required.

- **Cloud Sync:** v201
- **Full Backup:** Schema v29
- **Settings Preset:** Schema v1
