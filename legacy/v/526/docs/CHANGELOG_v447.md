# MediaFlow v447 — Universal Recovery Actions & Shortcuts

## Universal actions
- Cover Recovery, Metadata Recovery and **Recover Both** now have dedicated entry points in saved-title Details and Add/Edit Title, Library toolbar, Collection details, Personal Order, floating + quick menu, Background Processes and Recovery Workspace settings.
- The unified workspace adds a **Recover Both** tab, showing independent provider toggles and the same five recovery scopes established in v446. Checked titles, collection members and Personal Order title IDs are passed as saved-ID snapshots; users can switch scope before beginning.
- The floating quick menu expands to six correctly laid-out actions on desktop and mobile with one meaningful icon per action. A new Settings → Recovery Workspace section lets you show or hide each shortcut group independently.

## Combined recovery
- One **Recover Both** action creates a protected **Cover → Metadata** sequence for the same immutable title IDs (bounded by the current metadata batch limit, maximum 250).
- Cover Recovery opens its existing configuration and does not start until the user clicks Start Recovery. All original rate limits, provider preferences, safe-write rules, reviews and recovery checkpoints are preserved.
- Metadata begins only **after Cover Recovery finishes completely** (including resolving pending cover reviews). An explicit metadata confirmation is required before any metadata fields are written. On cover completion the confirmation opens automatically when possible; it remains available from Background Processes after refresh.
- The handoff is persisted locally per account; it never runs a recovery stage without the original engine's confirmation, and allows safe cancellation without deleting already recovered Library data or independent engine checkpoints.
- When all selected titles already have covers, Cover Recovery is skipped and metadata confirmation opens directly. Existing personal ratings, progress, external IDs and saved metadata are protected.
- If the combined request exceeds the metadata engine's configured limit, the interface explains it and both stages run on the first matching titles only.

## Compatibility and testing
- v424 Cover, v439 Metadata, and v442 locking/persistence engines remain authoritative.
- Existing v446 provider and scope controls and user data are retained.
- Automated regression and desktop/360px Chromium tests validate entry points, scope preservation, sequential handoff, cross-device layout and no eager recovery calls.
- Complete project archive in `legacy/v/447`, numeric Release `447`, ZIP and checksum after GitHub Pages deployment.
