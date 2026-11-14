# MediaFlow v427 Beta — Unified Cover Recovery UX, Confirmations & Icons

## Unified cover search in Add/Edit Title and Title Details
- Retains the existing cover-search provider engine while routing the older Add/Edit **Find cover automatically** button to the modern Instant Cover Search picker.
- Displays provider identification, matched titles, ID evidence, artwork, provider links and match explanations; prevents duplicate searches and keeps results navigable.
- Fixed Quick Cover Edit popup stacking: cover-search and Advanced Recovery dialogs render above existing quick editor overlays rather than appearing to do nothing.
- Advanced Recovery buttons support saved titles, current Missing Covers Dashboard titles and unsaved Add Title drafts. Draft searches use the same throttled provider lookup flow but never create a Library-wide recovery job or prematurely save a new title.
- Existing saved uncovered titles still open their single-title recoverable job configuration, supporting One-Go and Part-by-Part; saved already-covered titles can search for replacements without launching unrelated Library jobs.
- Preserves unsaved title metadata when interacting with the cover picker.

## Save on Select and user-configurable confirmation
- Selecting **Use this cover** immediately saves the cover for existing titles, including Dashboard Missing Covers, Edit Title and Quick Cover Edit. No extra manual Save is required.
- New unsaved titles simply receive the URL in the draft until the user saves the title.
- A new persistent Settings → Library & Titles → Cover Recovery option **Confirm before applying a selected cover** is OFF by default.
- When enabled, the user receives a MediaFlow-themed confirmation before applying a selected cover; background review-queue selections also follow this preference.
- Saved cover changes continue through the existing XP system. Unchanged URLs do not award additional XP. Dashboard's existing Save Cover & Next / title ordering behavior remains intact.

## Theme-aware recovery UI and dialogs
- Replaced the v424 browser-native job replacement, pending-review loss and unresolved-retry `confirm()` dialogs with accessible, theme-aware MediaFlow dialogs.
- Increased picker/configuration/review overlay priority above the Quick Edit overlay (z-index 99990) and preserved underlying editor drafts.
- Added proper focus, Escape-to-cancel, responsive layouts and clear destructive-action wording.
- Added meaningful icons for Recovered, Unresolved, Reviews and Errors recovery statistics.
- Regrouped expanded recovery controls: current job controls, report exports/retry, and New Recovery separately.
- Replaced duplicated or generic icons with exactly one meaningful SVG per action, including Advanced Recovery. Corrected the upstream v226 icon enhancer so it cannot reinsert a second icon after a button already has an explicit semantic icon.
- Removed hardcoded text glyphs (✧, ☁, ♡) from the About/Support chip source, using themed meaningful icons for possibilities, hosting/storage and improvements.

## Compatibility and safeguards
- Keeps v424/v425's persisted job state, provider budget system, external IDs, protected cloud save, XP history, scope filtering, multi-tab coordination, previous cover picker behavior outside title editing and manual URL entry.
- Preserves v426's original Level/Streak circled-arrow fix and profile picture.
- Maintains independence from MediaFlow Plus and MediaFlowApp. No Supabase schema changes or new Edge Functions.
- Contract tests for title/draft targeting, icon guards, theming, job confirmation, instant saving and a 100,000-title recovery baseline; JavaScript syntax and whole-project checks.
- Full interactive browser validation against every theme/provider is still required before a Stable label.

## Release
- Numeric tag: `427`
- Title: `v427 Beta`
- Full independent project archive: `legacy/v/427`
- ZIP asset: `MediaFlow_v427_Modular.zip`
