# MediaFlow v425 Beta — Scoped Cover Recovery & UI/XP Integration

**Beta release.** Builds on v424, preserving the original missing-cover recovery and quick cover-search behavior. Live, cross-theme, cross-device browser verification is still needed before Stable.

## Scoped recovery
- All Library, By Category, Category → Status (per-category status matrix), Selected Titles, and single-title recovery scopes.
- Selected IDs are snapshotted and enforced before the v424 job's immutable queue is built; a selected-only job cannot process other Library records.
- Eligibility count in the config dialog; no recovery start when no covers are missing within scope.
- Existing One-Go, Part-by-Part, rate protection, provider priority and restart settings retained.

## Entry points
- New **Fix missing covers** Library Tools shortcut beside Fix completed progress, including Normal and Dynamic Library selection support.
- Dashboard Missing Covers has Instant Cover Search and Advanced Recovery actions without removing manual URL entry, Skip, Edit title, or Save cover & Next.
- Add/Edit Title preserves the pre-existing **Find cover automatically** picker and adds Advanced Recovery (with a fallback Instant search when a legacy picker is unavailable).
- Title Details Quick Cover URL editor adds Find cover automatically and Advanced Recovery without changing its original Save workflow.
- Instant results include the matched provider title, source, provider identifier when available, a record link and an explicit Use Cover action.
- Unsaved Add Title drafts may use Instant Cover Search; resumable queued Advanced Recovery requires the title to be saved first. This limitation is surfaced instead of mistakenly starting an All Library job.

## Readable theme-based interface
- Recovery indicator stays hidden until a job is created; paused/completed job display remains dismissible.
- Panel and modal use MediaFlow's actual --panel, --panel-raised, --text, --text-dim, --border-soft and --flow variables instead of mixing an implicit dark background with light-theme text.
- Scoped styling for input, provider cards, stat tiles, buttons, mobile layouts, candidate galleries, focus states and footer.
- Semantic inline SVG icons; cleaner Donate/Ko-fi/Support buttons and About support chips with one icon per action.
- Clean-up of the duplicate circular-arrow near the Level/Streak badge; do not change Account/profile avatar or progression actions.

## Universal cover XP
- Every genuinely changed and saved cover URL earns repeatable event-based XP through the existing v348 action-event ledger.
- Configurable Cover XP reward in **Settings Center → Library & Titles → Cover Recovery**.
- No XP for identical URL, invalid preview, rejected candidate, request retry or cloud sync alone.
- v424 automatic recovery writes award cover XP before the normal protected save; manual Dashboard and title-editor cover changes use the same event pathway.
- Existing historical once-per-title cover rewards are preserved; new cover rewards do not overwrite historical ledger values.

## Settings
- New Cover Recovery subgroup under Library & Titles in the Settings Center, with mode, part size, continuation, selection strategy, quota protection, reopen-resume and cover XP defaults.
- Uses existing account settings persistence and protected saveState path.

## Validation & limitations
- JS syntax verification, MediaFlow build/check, theme styling contract checks and 100,000 synthetic titles scope test.
- No new Supabase schema, Edge Functions, image bytes, required paid services or MediaFlow Plus/MediaFlowApp changes.
- Experimental provider availability remains limited by per-provider API terms, credentials and CORS; this release does not enable a credential-only provider automatically.
- Browser closed means browser background processing is suspended; resumable IndexedDB job state survives reopening when allowed.
- Full per-provider live verification, full UI interaction tests, per-title draft advanced recovery, and additional large-library save optimizations remain follow-up hardening.

## Release
- Numeric tag: `425`.
- Title: `v425 Beta`.
- Full project archive: `legacy/v/425`.
- ZIP: `MediaFlow_v425_Modular.zip`.
