# MediaFlow v448 Stable — Smart Auto-Fill & Automatic Recovery

## Recovery automation and confidence policies
- Add a cohesive Smart Auto-Fill settings section inside each unified Recovery Workspace tab, the combined Cover + Metadata tab, Settings → Recovery Workspace and Metadata Recovery settings.
- **Cover Recovery** provides three policies: Preserve existing verified-ID auto-selection (default), **Strict verified automatic fill** (saved direct external-ID match, configurable 95–99% confidence, and no competing high-confidence verified artwork), or **Manual Review Only**. The strict policy never replaces an existing cover and queues uncertain/conflicting matches for manual review.
- **Metadata Recovery** preserves the existing safe, non-conflicting missing-field fill by default. Raise the configurable evidence-confidence threshold (94–99%) or enable **Manual Review Only** for batches, which advances safe checkpoints without changing metadata.
- **Dashboard Missing Covers** opt-in checkbox reuses the existing v430/v431/v427 validated automatic save-and-next functionality: only a single uniquely verified ID-matched artwork can be auto-saved, after real image validation. Never silently save draft titles.
- Cover picker cards now show verification status and match-confidence percentages, separating direct external-ID matching from title-only candidates.
- Both engines continue using all enabled providers in their established priority, retries and quota-safe sequencing; all existing configured gateway and public APIs are retained. Provider failures and unavailable adapters do not pretend to return successful results.

## Review evidence and safety
- Record up to 250 per-account, local-browser metadata review references from safe batch proposals: low-confidence evidence, source disagreements or manual-review-only mode.
- The **Metadata Review Queue** shows saved title names, reasons, field counts, timestamps, and a Preview action that opens the original one-title field evidence UI. Clearing the queue requires confirmation and never deletes actual metadata or recovery checkpoints.
- Cover and metadata preferences are independent. A job captures its policies in its own durable checkpoint, so modifying settings mid-run does not silently change its evidence threshold.
- Existing fields, user ratings, progress, History, collection membership, external IDs and saved artwork remain protected by original v424/v439/v442 validations and leases.

## Reliability
- The original recovery engines remain responsible for network calls, safe persistence, confirmations, cross-tab locking, pause/resume and progress; the app still cannot recover while its browser process is closed.
- Preserve v446 title scopes and provider controls, and v447 universal shortcuts/combined cover-then-metadata handoff.
- Add deterministic tests for confidence flooring, ID verification, conflicting artwork, no overwrites, metadata review-only batches and Dashboard auto-save compatibility.
- Desktop and 360px mobile Chromium tests, historical recovery regressions, secure provider gateway typecheck, complete archive in `legacy/v/448`, numeric Release `448`, ZIP and checksum.
