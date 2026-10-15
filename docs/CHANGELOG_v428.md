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

## Phase 3 — Metadata Fixer Integration (development)

- **Canonical metadata mapping:** Jikan, TVmaze and ISBN-backed Open Library records now map into MediaFlow's actual v178 fields (`synopsis`, `genres`, `themes`, `studios`, `producers`, `year`, `releaseDate`, `mediaFormat`). This avoids losing imported descriptions in an unrelated `description` field.
- **Add/Edit Title:** Fix Metadata snapshots the unsaved title editor (including rich metadata fields and visible provider IDs), runs the lookup in the shared scheduler, and applies approved changes **to the open form only**. The user must still save the title. Stale editor drafts or changed accounts block application.
- **Title Details:** Direct Fix Metadata button is generated in the native Title Details action row. It opens a one-title recovery job.
- **Library Tools:** Fix Metadata is available alongside Fix Missing Covers. Selected Library IDs are captured as an immutable job scope; Settings can run full-Library or category-scoped recovery.
- **Settings:** A Metadata Recovery subgroup is placed next to Cover Recovery under the Library Settings category. Controls include Fill Missing, Review Differences and Refresh Outdated (manual field review), fields to scan, category scope and per-part size.
- **Human approval:** Before/after field previews show the matched provider identity and link to the source record where safe. No Library title metadata changes without checkbox selection and explicit Apply.
- **Data protection:** Respect `richMetadataManual` flags, avoid modifying personal ratings, notes, statuses, watched progress, seasons or already known totals. Missing totals require explicit opt-in; no updates apply when matched metadata or title field values have become stale.
- **Recovery & undo:** Checkpoint after each title, support resumable part-by-part jobs and pending review in the floating widget. Guard undo against intervening title edits and preserve the original changed fields.
- **Network safety:** Retry temporary network failures and honor provider Retry-After/backoffs. Never classify unknown provider results as zero releases.
- **Tests:** `scripts/test-v428-metadata.cjs` exercises the actual editor/Library/Details extension hooks and canonical field/progress/manual-lock contracts. The development GitHub Actions workflow runs it alongside v424/v425/v427 regressions.

**Limitations:** This phase uses the available public-source adapters rather than registering/configuring credential-dependent providers. Full cross-device locks, live API verification, comprehensive browser UI/real-account sync tests and general media-type provider expansion remain pending before the final v428 release.

## Phase 4 — Universal Fresh Releases (development)

- **Anime:** Continues using the existing Seasonal Anime scan and `v401EpisodeOutcome`, respecting the account's saved provider detection mode, including the original `automatic2` Smart Engine. Does not rewrite anime progress or scan history.
- **TV episodes:** TVmaze and EpisoDate adapters verify exact show identities and actual air dates. TVmaze's specials are counted separately from numbered regular episodes; future episodes never count as released.
- **Manga / manhwa:** MangaDex uses an existing verified MangaDex UUID, English-translation chapter feed, published timestamps, and unique numeric chapter numbers. Latest feed pages are **partial**: they can establish a higher released chapter but cannot conclusively show the reader is caught up. Multiple scanlation group updates never double-count the same chapter number.
- **Podcast, web novel, web series, comics:** A pre-existing trusted HTTPS title RSS/Atom URL may provide timestamped release evidence using unique GUIDs and explicit episode/chapter/issue numbers. A partial or unnumbered feed returns Unknown when it cannot prove a count. No additional provider connection/setup UI is exposed.
- **Books, standalone movies, other media:** Capability classification and future provider manifests are retained, but results remain Unknown where no verified unit-level release source exists. No invented 'caught up' assertions, blanket genre support claims, or unlicensed scraping.
- **Evidence policy:** One valid positive can establish Fresh. `automatic` stops at a verified provider result; `automatic2` compares applicable independent provider evidence and chooses the highest verified released count rather than summing duplicate observations. Any negative inference remains Unknown if required providers fail or the evidence is partial.
- **Identity & date:** Exact title / external-ID matching before counting released units, no future releases, no unverified title guesses. Special handling for seasons and translated editions.
- **UI:** Universal scan accepts all Library titles, selected Library titles, or a specific category. Results show release date, source URL when safe, conflicting provider counts, partial-vs-complete evidence, and Unknown outcomes.
- **Reliability:** Shared scheduler queue, provider-specific cooldown/retry-after handling, checkpointed scans, account ownership guards, and large-Library lookup indexes. Progress writes are throttled to reduce storage churn in 100k-title workloads.
- **Tests:** `scripts/test-v428-fresh.cjs` checks verified-vs-unknown results, duplicate chapter evidence, future-date rejection, TV specials, highest-verified multi-source aggregation, media-category routing, and hidden/unconfigured source behavior.

**Remaining prior to release:** Real-browser verification, provider rate-limit/CORS smoke testing, full media-category provider coverage (only lawful configured sources), performance benchmark, and final release/rollback procedure. This phase is not itself a completed v428 GitHub release.
