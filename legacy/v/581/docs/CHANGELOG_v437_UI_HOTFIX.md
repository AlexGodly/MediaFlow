# MediaFlow v437.1 UI Hotfix — Universal Metadata Editor Layout

This maintenance hotfix keeps the application's v437 data/schema version and does not advance the v438 Unified Provider Registry roadmap.

## Fixes
- Restore **Universal Metadata & External Ratings** to a full-width, responsive section inside the existing twelve-column Edit/Add Title modal.
- Place the section **immediately above Title Details / Imported Metadata**, after existing title controls.
- Remove the redundant “v437 · optional · protected” subtitle.
- Replace the narrow, wrapping accordion with a theme-aware header, meaningful database icon and proper open/close affordance.
- Rework metadata fields and rating controls for desktop, tablet and 360px mobile widths.
- Correct Protect checkbox sizing so older v239/v240 input rules cannot force checkboxes into 42px-wide/full-row controls.
- Use MediaFlow's existing colors/surfaces/typography and respect the full range of themes.
- Bump the v437 PWA shell cache revision so installed devices receive the changed assets.

## Preservation
- No changes to Library title values, ratings, tracking progress, categories, account settings or existing user metadata.
- Preserve the existing v437 optional metadata schema, external IDs, personal score isolation, field locks, cloud synchronization, backups and Cover Recovery.
- No Supabase migration or new credentials required.

## Tests
- Unit contracts enforce the final full-width grid order, correct DOM insertion and absent subtitle.
- Real browser DOM checks run the exact production metadata mount function at desktop and 360px mobile sizes, including panel width, ordering and checkbox dimensions, without authentication.
- Existing v437 metadata tests and earlier Cover Recovery/gateway regressions remain required.
- Full project archived at `legacy/v/437.1`; ZIP and checksum attached to numeric hotfix tag `437.1`.
