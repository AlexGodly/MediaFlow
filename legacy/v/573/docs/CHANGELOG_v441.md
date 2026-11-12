# MediaFlow v441 Stable — Recovery Workspace & Background Processes

Phase 5 of the v437–v442 metadata and recovery roadmap.

## Unified Recovery Workspace in Settings
- Adds a native **Recovery Workspace** section in the existing Settings Center under Library maintenance, linking to Cover Recovery, Metadata Recovery, and independent API Providers & Testing.
- Does not duplicate provider settings or relocate their actual persisted controls: existing Cover Recovery and Metadata Recovery panels retain authority and all previous settings.
- Adds a single dynamic-theme **Background Processes** widget that monitors both active cover jobs and metadata batches, with progress percentages, counts, pause/resume and direct actions.
- Visibility controls: **Automatic** (only while jobs are active), **Always show**, and **Hidden**. Choose bottom-left or bottom-right placement; optionally show completed jobs. Settings are persisted with normal MediaFlow settings exports and cloud sync.
- When the shared widget is visible, the old cover-only floating indicator is hidden visually to avoid duplicated overlays, but the original cover job controller, confirmations and recovery logic remain unchanged.
- Widget controls never start or overwrite saved jobs without opening the existing recovery confirmation flows. Closing or hiding the widget never cancels recovery.

## Metadata Recovery shortcuts & previews
- Adds **New Metadata Recovery** as the fifth option beside New Cover Recovery in the floating action menu, with a non-network-launching selection/confirmation dialog.
- Title checkbox selections from the Library are recognized and shown before launching a preview or an explicit confirmed safe batch.
- One selected title opens the existing field-by-field preview; multiple selections initiate the original missing-field-only batch after confirmation. Opening the shortcut itself makes no API calls.
- Improves Metadata Recovery Settings with a selected-title scope summary.
- Enhances the field comparison preview with totals for ready/review/conflicts/existing/protected, plus a filter for each state. Existing/manual/protected title values remain untouched.

## UI & responsiveness
- Fully themed via MediaFlow variables, fluid desktop/tablet/360px layouts, safe-area offsets, overlay positioning, keyboard-accessible buttons, reduced-motion support and scrollable process details.
- All five radial quick actions are positioned independently with no overlap, including narrow/tall phone and short-height layouts.
- Avoids scanning a 100k-title Library on every widget progress update; selection is resolved only when opening a selection UI.

## Safety and compatibility
- Reuses the established v424–v440 cover and metadata systems, provider cooldowns, verification, image validation, per-title provenance, retries, account checks, checkpoints and cloud saves.
- No provider access, credentials, database schema, Recovery Engine writes or GitHub Pages routes change in this release. The production Supabase gateway is not redeployed.
- Existing provider preferences, cover XP, manual edits, personal ratings, progress and History remain unchanged.
- Full backup metadata advances to version 441 and includes Recovery Workspace UI preferences.

## Verification
- v441 deterministic state, progressive widget UI, five actions and 100k memory/performance tests.
- Existing v424–v440 regressions for cover recovery, metadata matching, Supabase gateway, settings and user-data safety.
- Authenticated gateway Deno TypeScript typecheck, desktop and 360px Chromium UI smoke.
- Full archive `legacy/v/441`, numeric GitHub Release tag `441`, ZIP and SHA-256 checksum after Pages deployment.
