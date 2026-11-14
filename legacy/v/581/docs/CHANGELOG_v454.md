# MediaFlow v454 — Quick Title Recovery UI & Priority Hardening

Requested inserted hotfix following v453 Stable. Planned MediaFlow Recommends external-rating integration now targets v455; subsequent roadmap moves forward without dropping features.

## Recovery Presets redesign
- Replace the oversized and sometimes full-viewport category icon with a bounded, theme-aware thumbnail (supports image, emoji or builtin icon).
- New compact two-pane interface: searchable category sidebar, Cover/Metadata provider groups with independent search fields, selected and ready counts, and compact rows.
- Bulk controls Select available, Deselect all and Use global remain separated by engine.
- Select/deselect updates count in place and does not reconstruct the entire Settings section or reset provider list scroll position. Category switching redraws only the right panel and preserves sidebar scroll.
- Add Copy both provider presets to another Library category without changing global preferences. Category-based selections continue to persist via the existing account settings save.
- Dynamic themes, mobile, tablet, keyboard focus and 360px layout supported.

## Quick title recovery: Cover, Metadata and Recover Both
- Run all three entry points through one synchronous modal reservation and safe lifecycle: no duplicate modals from rapid clicks, orphan header, uncloseable loading state or stacked duplicate overlay.
- Modal lives in the document top layer above Title Details, Anime Details and Add/Edit Title. Dialog layout remains usable at desktop, tablet and phone dimensions.
- Press Escape, Cancel, backdrop or Close at any point, including while provider setup or an API request is in progress. Cleanup removes all old duplicate roots.
- Foreground quick recovery shows a progress message while pausing the previous recovery's current title and waiting for provider access; it does not show a blank header.
- Cover cards are legible, with thumbnail, full wrapping title, provider, matched strength and review marking. Up to 24 validated-loading cover alternatives across configured providers can be compared; lower-confidence matches stay available with an extra explicit confirmation before saving.
- Metadata shows each field's original and suggested values plus evidence, and a source selector for multiple different verified suggestions. Protected/existing metadata remains non-overwritable through original v439 checks.
- Search all ready providers offers further cover and metadata candidates without changing the category preset. No message claiming "no cover" while still scanning.
- Cover and Metadata scans run concurrently where applicable. Real credentials, gateway permissions and available adapters are never bypassed.
- Existing covers are not overwritten without the separate original confirmation, and no Library changes are written before Confirm.
- Quick recovery uses v451 account-scoped checkpoint handoff for BOTH older Cover and Metadata jobs, even when quick mode only needs one kind. The original jobs stop at a safe point and are automatically restored when quick recovery closes or completes, with cross-tab lock protection.
- Closing during the handoff waits for checkpoint creation before restore; closing during scanning waits for outstanding requests before restarting previous recovery activity.
- No new Supabase tables, keys or network proxies. Existing Library data/history/progress unaffected.

## Verification and delivery
- Deterministic tests for bounded artwork, category search/actions, multiple cover and metadata options, pending provider access and safe cross-engine handoff.
- Real Chromium desktop and 360px browser smoke for foreground stacking, cover readability and category icon dimensions.
- Historic v437-v453 regression checks, gateway typecheck, PWA/offline build. Full version snapshot in legacy/v/454, numeric v454 Stable GitHub Release with modular ZIP and SHA256.
