# MediaFlow v468 Stable — Selectable Legacy and Advanced Fresh Episodes Engines

## Independent selectable engines
- Add **Fresh Episodes System** to the Fresh Episodes interface and Settings → Title Recommendations, offering **Legacy** and **Advanced**.
- Legacy is the default and retains the existing v467 detector, provider selection, verification ledger, settings, Fresh Episodes Checker and recommendations completely intact.
- Advanced uses separate cloud-backed `v468AdvancedFresh` settings and `v468AdvancedEpisodeLedger` results; switching does not delete, copy or reinterpret Legacy results. A running scan must finish or stop safely before switching.
- Each engine remembers its own detection method. Advanced supports Smart Multi-Provider, Automatic comparison, individual applicable episode providers or Manual, plus Balanced/Maximum and manual/adaptive checking.
- Advanced results are only considered current if recorded within 24h for the exact title, category, External IDs and season configuration. No stale legacy evidence masquerades as Advanced evidence.

## Smart Engine 2.0
- Reuses existing v402 trusted MAL/AniList/Kitsu identity resolution and v403 airing-aware providers without writing recovered IDs into original Library titles.
- Enforces verified evidence, conservative no-fresh outcomes and explicit Unknown rather than fabricated zero. Verified positives are prioritized; a single negative requires verified airing/finalization evidence.
- Schedules display verified next release date/time where identity and airing data are available, with per-title countdown. Balanced limits schedule queries to the currently recommended title; Maximum checks additional applicable titles.
- Per-title season diagnostics preserve manually configured season numbering and do not claim a provider-wide count is an individual season when no verified mapping exists.
- Advanced checker includes fresh/caught-up/unknown/disagreement/upcoming summary tiles, search, status filters, sorting, pages, per-title Refresh, provider evidence, and **Stop after current title**.
- Existing Background Processes account-wide metadata recovery locks and provider rate limits are honored; progress is checkpointed to cloud every ten checked titles, with a bounded 20,000-title evidence cache.
- Optional adaptive refresh runs while the app is open. Refreshes while all user browsers are closed require a separate server-side scheduler.

## Recommendations and data integrity
- Dashboard Fresh episodes left follows selected engine, using current Library progress with no double-counting of Seasons View.
- The title-specific tile appears only for categories with Seasonal checked and when detection is not Manual.
- Existing fresh-only recommendations preserve Unknown eligibility by default; verified caught-up titles are excluded.
- No changes to Library titles, XP, History, Personal Order, progress, metadata, external IDs, covers, or personal ratings.

## Limitations / follow-ups
- Multi-season provider mapping is presented as unverified until explicit season identity evidence exists; never guesses chapter, issue or special numbering.
- Third-party services for chapters/TV/library release schedules are not automatically introduced by selecting Advanced. Adding verified adapters is separate work requiring API validation.
- All v467 provider and metadata recovery behavior remains available in either mode.

## Release
- Deterministic safeguards and Chromium desktop/360px mobile regression tests; complete archived source `legacy/v/468`, numeric stable tag `468`, full ZIP and SHA256.
