# MediaFlow v451 Stable — Recovery Stop & Priority Scheduling

Intervening user-requested update after v450 Stable. The planned MediaFlow Recommends external-ratings integration moves to v452; all later updates shift without dropping planned features.

## Completely stopping recoveries
- Add Stop controls per cover/metadata process, plus Stop All and Discard Queues from Background Processes and Settings.
- Stop aborts active cover API requests when possible, prevents further titles being processed, and preserves completed/safely saved Library work.
- Metadata recovery retains its stopped status after its current safe checkpoint boundary; stopped jobs never auto-resume on refresh.
- Stop All also disables the priority scheduler's automatic restart and clears pending combined handoff.
- Discard Queues separately confirms removing unfinished recovery checkpoints, not already-saved Library artwork or metadata.
- Manual Resume remains available for stopped jobs.

## Priority title-first workflows
- Starting Cover Recovery for a saved title suspends the old cover batch, saves its complete checkpoint in account-scoped IndexedDB, and starts the single-title recovery using all existing providers and safe-write rules.
- A per-title Metadata Recovery preview pauses active background processing before making API requests, then resumes eligible interrupted jobs on closing the preview.
- Recover Both uses the original cover-then-metadata confirmation engine, preserving interrupted cover, metadata and combined handoff checkpoints.
- Original jobs can automatically resume upon successful priority completion, or via Resume Interrupted when recovery was cancelled or needs user intervention.
- A job executing in another browser tab retains its existing lease; a new priority action does not steal or overwrite it.
- Original manual-review results, cursor position, completed titles, recoveries and cooldown information are retained.

## Data and performance boundaries
- No modifications to personal rating/progress, status, History, XP, collections or Supabase schema.
- Original provider identities, source evidence, protections, rate limits, conflict review and non-destructive writes remain in force.
- Provider cancellation may take a brief interval for safe completion; the app will not discard a title currently being saved.
- Recovery jobs only execute while MediaFlow is open; checkpoints survive browser reopening.

## Quality and release
- New deterministic stop, resume, priority checkpoint and data-safety tests.
- Re-run existing regression suite and desktop/360px mobile browser smoke, plus gateway typecheck and PWA rebuild.
- Archive full project under legacy/v/451 and publish numeric release 451, ZIP and SHA256.
