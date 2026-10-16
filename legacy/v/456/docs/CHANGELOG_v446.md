# MediaFlow v446 Stable — Unified Recovery Scope & Provider Controls

## Recovery workspace
- Enable and disable providers independently for Cover Recovery and Metadata Recovery, directly inside the unified workspace. Provider choices are saved to each original engine's preference settings.
- Availability is respected: unavailable API adapters remain disabled with a direct API Setup shortcut; setting a toggle never fakes connection or starts a request.
- Five explicit recovery scopes for both engines: All, Library (current Normal/Dynamic Library filters across all pages), By Category, By Category → Status, and Selected Titles.
- Categories show the actual saved MediaFlow icons or artwork. Each category's statuses can be selected independently: Planned, Active, On Hold, Completed and Dropped.
- Current scope title counts update before launching and persist as user preferences. Explicit saved-title recovery remains restricted to the requested title.
- Cover Recovery opens the existing safe configuration and preselects the chosen category/status/title scope without bypassing confirmation, review, checkpoints, provider ordering or safe writes.
- Metadata Recovery snapshots the specified title IDs into its existing safe, confirmed queue (up to the configured maximum, capped at 250 per batch), preserving cross-process locks, retries and previously saved fields.

## Background Processes widget
- Cover Recovery now has a **New Recovery** button, matching Metadata Recovery's existing action.
- The former Cover Recovery **Setup** button moves to the shared widget footer, immediately to the left of **Recovery Settings**, opening API Providers & Testing.
- Existing Pause, Resume, Review, Hide and progress controls remain available; widget changes do not start a job.

## UI and reliability
- Dynamic MediaFlow theme colors, responsive 360px mobile through desktop, meaningful action icons, focus-visible states and accessible category controls.
- New automated tests cover provider toggles, independent preferences, title scope snapshots, status filtering, 250-title safety limits, and widget button placement.
- Existing provider gateway validation, metadata/cover recovery regression tests, desktop/mobile Chromium browser tests and full project archive are release gates.

## Compatibility
- Original cover/metadata engine and checkpoint implementations remain authoritative.
- No user Library data migration, no new providers, no new credentials, and no automatic title changes merely from opening the workspace.
