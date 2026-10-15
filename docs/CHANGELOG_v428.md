# MediaFlow v428 Beta — Universal Media Intelligence & Recovery

**Release class: Beta.** The numeric `428` tag, source archive, modular ZIP and GitHub Pages deployment are produced only after the v428 release workflow passes its build, contract, synthetic scale, Chromium browser-boot and previous-version regression gates. Beta is not a claim of full provider or cross-device compatibility.

## Included in v428 Beta

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

## Known limitations and subsequent hardening

1. Full UI/browser validation across all dynamic themes, desktop/mobile/tablet and extreme narrow screens.
2. Verify real provider CORS, access terms, API stability, attribution and rate limits; expand legitimate release/metadata adapters category by category.
3. Complete cover/save/XP reconciliation under a single controller, refine all-process notifications and backend-optional multi-device coordination.
4. Verify 50,000–100,000 title performance and suspend/resume, partial failure, cross-tab/account-switch correctness in real browsers.
5. Complete release-history, per-provider evidence diagnostics and hardening of automatic retry / cooldown behavior.
6. The release workflow is designed to create `legacy/v/428`, the versioned modular ZIP plus SHA-256 checksum, numeric tag `428`, and GitHub Pages deployment. Verify each published artifact and the live site after the workflow completes.

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

## Phase 5 — Floating Background Widget & Recovery Polish (development)

- **Native themed widget:** The Background Processes floating hub now inherits the selected MediaFlow theme's panels, accents, text, borders, translucent surfaces and shadows. No independent hardcoded theme, smooth subtle activity animation, accessible focus states and reduced-motion support.
- **Display preferences in existing Settings:** Visibility (Hidden / Automatic / Always Show), position (left/right), compact or comfortable sizing and optional completion/error/manual-review notifications are grouped *within* Appearance → Floating Controls alongside the original Floating Add and Task Progress preferences. Registered controls can be found through the Settings Center search. Values persist with account settings.
- **Launcher:** Always Show retains three launch buttons when idle. Automatic hides when no actionable work, but continues displaying while jobs run, queue, cool down, pause or need review. Hidden affects visibility only and never cancels a job.
- **Layout:** The floating hub dynamically moves clear of the existing MediaFlow floating dock; mobile and narrow-screen panels have bounded scrollable heights and safe-area positioning. The widget becomes inert/hidden while the mobile More menu is open, avoiding covered actions and focus conflicts.
- **Compact and comfortable modes:** The user can toggle size from the floating panel itself or Settings; left/right placement and icon styling follow the active theme.
- **Recent activity:** Keeps an account-scoped, locally persisted bounded history of 18 process completion, manual-review and error alerts (the latest five are visible in the panel). Unread counts, clear action, optional toasts and single-notification de-duplication per task outcome. No browser notification permissions requested.
- **Manual review:** Shows queued metadata review results even for unsaved title lookups, and keeps pending recovery review accessible in the same floating panel.
- **Safe stop controls:** Cover Recovery and Metadata Recovery provide Pause, Stop After Current Title and Finish Current Part & Stop when running, preserving checkpoints; other processes keep their supported safe-stop controls.
- **Testing:** Added `scripts/test-v428-widget.cjs` to the isolated development build's required checks. Existing v424/v425/v427 checks and all Phase 2–4 regressions remain active.

**Scope limitations:** Server-run jobs after browser closure and cross-device global API locks are not enabled; this is browser-checkpointed work. Some live-provider CORS and API rate-limit behaviors cannot be fully verified by offline tests. The synthetic 100k-title benchmark exercises indexed access and checkpoints, not every production UI and database flow.

## Phase 6 — Release and verification

- Full development CI and release workflow run syntax, original v424/v425/v427 regressions and new v428 recovery, metadata, Fresh Releases, scheduler, multitab, and theme-aware floating-widget contracts.
- `scripts/test-v428-scale.cjs` indexes 100,000 synthetic records and exercises indexed category selection and checkpoint resume without modifying production data. This **does not** simulate 100,000 remote API calls or a fully loaded live account.
- `scripts/test-v428-browser.cjs` boots the actual assembled app-shell locally in headless Chromium at desktop and narrow mobile viewport sizes, checks v428 runtime initialization and visible HTML, and saves QA screenshots. External DNS is blocked to avoid writing to or relying on production Supabase.
- `.github/workflows/publish-v428.yml` rebuilds and reruns those checks; archives the whole v428 project in `legacy/v/428`; publishes GitHub Release `428` titled `v428 Beta` with `MediaFlow_v428_Modular.zip` and its SHA-256 checksum; deploys Pages and verifies the live v428 version and bundle URL.
- No user-library migration and no new Supabase schema, Edge Functions, or secret-bearing provider integrations are part of v428 Beta.

**Beta disclaimer:** Provider coverage remains category-specific. Unsupported or unverifiable publication outcomes are Unknown, not zero. Existing user progress, ratings, order, and season records must not be silently changed by provider reads. Browser closure pauses frontend processing; persistent checkpoints support resuming after reopening.
