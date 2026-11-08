# MediaFlow v456 — Quick Cover Choices, Live Editor & Recovery Startup

Inserted user-requested fix after v455. The planned MediaFlow Recommends external-rating integration is postponed to v457, shifting all later roadmap updates forward without dropping them.

## Cover and Combined Quick Recovery
- Non-overlapping responsive card grid with independent scrolling. Each artwork choice displays its thumbnail, full title, provider, matching percentage, verification type, exact external-ID provider key and provider record value, plus an explicit **Select this cover** button. Selected artwork has a clear border and button state.
- Preserve multiple available alternatives. Title-based candidates are marked as requiring manual verification; high match scores without actual external ID are not labeled verified.
- Expose the exact ID that may be linked to the title. Only validated, nonconflicting provider record IDs are stored. Existing IDs are never overwritten and no other IDs are silently linked.
- Saved URL, cover source and permitted external ID are committed together through the canonical Library storage path; if saving fails, revert. Metadata recovery persists independently and cannot roll back a previously saved cover.
- The open Add/Edit Title form receives confirmed cover URL and thumbnail updates immediately, without closing and reopening the title. Empty matching metadata fields can refresh without overwriting unsaved text edits. A title-recovered DOM event announces successful changes.
- Multi-step accessible save-progress panel: final cover validation, cover/ID persistence, metadata merge and persistence, editor refresh, confirmation. It advances only on completed operations, not imaginary elapsed time.

## Unified Recovery Workspace
- Direct **Recover selected titles** launch across Cover / Metadata / Recover Both, never an inert disabled primary button. Validation errors explain how to choose an eligible scope or configure actual ready providers.
- Floating launch progress includes validation, confirmation, safe old-process checkpoint, new queue save and provider start. It observes the actual job's running/paused state; it never claims "processing" merely because a job record exists.
- Existing safe queue replacement, provider limits, timeouts, global account leases and background widget remain authoritative.
- The UI distinguishes a saved but not yet active queue from a processing job, and shows explicit pause/lease troubleshooting rather than an empty action.

## Verification / Release
- Deterministic tests cover ID mapping and conflict safety, multiple candidates, select-button state, save stages, old regression compatibility.
- Chromium checks verify no cover overlap, clickable selection buttons, provider record IDs and matching percentage on desktop/360px mobile, as well as visible recovery-launch validation.
- Keep app's dynamic theme and mobile/tablet PWA; no new database schema/secrets or paid providers.
- Archive full site in legacy/v/456; build bundle, release number 456 with ZIP and SHA-256 following green tests and deployment.
