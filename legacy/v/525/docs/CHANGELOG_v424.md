# MediaFlow v424 Beta — Advanced Missing Covers Recovery

**Release type: Beta.** This version introduces the recovery architecture and an initial group of provider adapters. It is **not** a claim that every provider in the research is operational or that every failure mode has passed live browser testing.

## New recovery workspace
- **Fix Missing Covers** opens an interactive configuration dialog rather than immediately scanning.
- **One-Go** and **Part-by-Part** recovery, custom positive part sizes (1–10,000), manual or automatic continuation.
- **Hybrid, Smart Automatic, Provider Priority, and Manual Selection** cover strategies.
- Per-provider enabling, priority arrow controls, Safe/Balanced/Custom conservative network budgets, and remembered settings.
- Floating recovery indicator, progress, processing counts, cooldowns, pending confirmations and controls on every MediaFlow page.
- **Pause**, **Resume**, **Stop After Current Title**, and **Finish Current Part & Stop**. Pending reviews do not block independent titles.
- Persistent IndexedDB job state per signed-in account, browser-reopen resumption, and multi-tab lease guard.
- Confirmation queue with cover previews, source links, match explanations, explicit approval and unresolved handling.
- JSON/CSV recovery reports and retrying unresolved entries.

## Identification and provider coverage
- External IDs before title search. Exact-ID lookups are verified against returned title identity; contradictory titles require manual review.
- Experimental adapters: **Jikan, AniList, Kitsu, MangaDex, Google Books**.
- Existing-service adapters: **Tenrai, TVmaze, Open Library**.
- Providers that need authorization, backend access, licensing or additional research remain labelled as such, not silently represented as operational.
- Per-provider bounded scheduling, caching, cooldowns from Retry-After, retry budgets and image-load validation.
- Open Library cover URLs use `default=false` to avoid accepting missing-image placeholders.

## Library safety and compatibility
- Only missing `coverUrl`, `coverSource` and cover-specific modification timestamps are assigned by the engine.
- Checks account identity, title identity and `modifiedAt` before applying and after asynchronous validation.
- Uses the existing protected `saveState` path; saves each recovered cover before advancing the persisted queue cursor.
- Preserves existing manual Dashboard Missing Covers, editing, Logging, Personal Order, Collections, History and other data.
- Recovery runs while MediaFlow is open; browser closure pauses browser execution, but the job resumes on reopen when enabled.
- No Supabase schema changes, no new cloud infrastructure, no stored artwork bytes and no mandatory paid services.

## Validation
- Node runtime syntax verification and standalone mocked contract checks, including 100,000 synthetic Library records.
- MediaFlow build, PWA assets and existing repository invariants verified in the release job.

## Beta limitations / follow-up verification
- Live per-provider integration, CORS, credential handling, licensing and attribution remain contingent on each provider. Experimental adapters can return unavailable; they do not justify a Stable label.
- A browser worker **cannot** execute when the browser has been fully closed, suspended or forcibly terminated.
- Multi-tab leases coordinate in one browser profile but do not guarantee globally serialized API usage across devices or other consumers of shared quotas.
- IndexedDB job checkpoints are device-local; the actual saved Library cover is synchronized by the existing cloud mechanism, not by a new job table.
- No new broken-existing-URL scan is enabled. Existing valid URLs remain untouched.
- Full provider network integration, multi-device recovery-job synchronization, shared quota coordination, exhaustive live API/CORS tests and full device-browser UI tests remain follow-up work.

## Release
- GitHub tag: `424` (numeric only).
- Release name: `v424 Beta`.
- Complete version source archive: `legacy/v/424`.
- GitHub ZIP asset: `MediaFlow_v424_Modular.zip`.
- Personal edition only; MediaFlow Plus and MediaFlowApp are not modified.
