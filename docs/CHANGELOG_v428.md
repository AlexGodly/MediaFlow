# MediaFlow v428 — Universal Media Intelligence (development candidate)

**Status:** in active development on `feature/v428-universal-recovery`. This is **not** a published release, not a Stable designation and not a claim of full v428 scope completion. As of this branch, the production site remains on v427.

## Implemented in source on the development branch

- Theme-aware floating Background Processes panel with Hidden, Automatic and Always Show visibility; direct launch controls and distinct Cover Recovery / Metadata Recovery / Fresh Releases rows.
- Browser-local account-scoped serialized work queue, 60-second inter-feature cooldown, queue ordering and cancellation, cross-tab coordination, progress and pause controls. Browser closure pauses work; jobs use checkpoints. Cross-device locks are **not implemented**.
- Initial Metadata Fixer module with Add/Edit Title, Title Details, Library Tools selection, Settings next to Cover Recovery, public provider queries (Jikan, TVmaze and ID-based Open Library) and opt-in per-field before/after review. Existing personal ratings, progress, seasons and statuses are not fields proposed for mutation.
- Metadata change history and an undo action guarded against intervening edits.
- Initial TVmaze and EpisoDate public episode records, and MangaDex **English-translated chapter** evidence; evidence from unsupported or unverified categories is Unknown, not zero. Original Seasonal Anime Smart Engine is preserved.
- 48 hidden source-only provider manifests and developer-side future setup instructions. Providers requiring keys, OAuth, approval or subscriptions remain hidden and inactive without secrets.
- New responsive CSS and a CI contract/build workflow; no Supabase schema migration.

## Validation available

- `python scripts/build.py` — generates v428 production JS bundle and PWA cache.
- `node scripts/test-v428-recovery.cjs` — syntax, module integration contracts, developer-only provider flags, visibility, Library and editor hooks.
- Existing v427/v425/v424 regression tests and `python scripts/check.py`.
- GitHub Actions development workflow on branch/PR; generated JS and PWA assets are subject to successful build and branch-artifact commit.

## Remaining work before a v428 release

1. Full UI/browser validation across all dynamic themes, desktop/mobile/tablet and extreme narrow screens.
2. Verify real provider CORS, access terms, API stability, attribution and rate limits; expand legitimate release/metadata adapters category by category.
3. Complete cover/save/XP reconciliation under a single controller, refine all-process notifications and backend-optional multi-device coordination.
4. Verify 50,000–100,000 title performance and suspend/resume, partial failure, cross-tab/account-switch correctness in real browsers.
5. Complete release-history, per-provider evidence diagnostics and hardening of automatic retry / cooldown behavior.
6. Add complete `legacy/v/428` archive, reviewed versioned release ZIP, numeric `428` tag and live GitHub Pages deployment **only once release testing is complete**.

## Safety

- MediaFlow Plus and MediaFlowApp are untouched.
- No production Supabase data operations, new secrets or paid provider connection.
- Manual metadata review required before modifying title data.
- GitHub Pages deployment continues from `main` only; the draft PR does not deploy the development branch.

## Phase 2 — Shared Background Scheduler Hardening (development)

- Added origin-local Web Locks coordination when supported; retained the existing v424 cover lease as a secondary safeguard. Multiple tabs in the same browser origin should not knowingly start overlapping background workers. This does not provide a cross-device lock or a global API quota guarantee.
- Changed durable queue storage from one shared JSON queue to three per-feature queue records (cover / metadata / fresh). This prevents a completing tab from deleting a different tab's independently queued work during a full-state rewrite.
- Made queue cancellation save a recoverable paused state and kept safe-resume handling distinct from finished status.
- Preserved the configured inter-feature cooldown and the provider-specific backoff mechanisms. A pause or completed operation releases the shared execution slot only at a safe boundary.
- Added account-pinned lease and queue storage; Metadata and Fresh Releases checkpoints now store under the initiating account rather than the account visible after an in-flight sign-in change.
- Added owner checks to cover writes, cover candidate processing and cloud-flush boundaries, with manual-review actions unaffected when the background worker is not active.
- Queued unsaved-title metadata lookups through the same scheduler, guarded against stale account contexts when applying their draft results.
- Improved the themed widget with persistent left/right placement, a reliable re-created DOM state, and keyboard focus preservation on countdown updates.
- Added deterministic offline behavioral regression tests for queue exclusivity, FIFO ordering, cooldown, cancel/restart, widget preferences, and cross-tab pending-job preservation.

**Still not a Stable release:** Full native-browser integration and provider validation are outstanding. Browser-exited processing remains checkpoint-based rather than a continuously running server-side job. The v428 draft pull request is intentionally not merged or deployed.
