# MediaFlow v429 — Recovery and Release Center
**Status: development preview — not merged or deployed.** Live personal MediaFlow remains v428 Beta.

## Implemented on the v429 development branch
- A premium, mobile-responsive, **bottom-left** floating **Recovery and Release Center** replaces the previous separate floating background-process panel. It uses current MediaFlow theme variables rather than fixed app-specific palette and respects reduced motion.
- Exactly four tabs: **Queue, Covers, Metadata, Fresh Episodes**. Expanded/minimized state, selected tab, and visibility (Hidden / Automatic / Always Show) persist in settings.
- **Queue** reads the existing v428 scheduler, shows running/queued/review states and percentages, and forwards reordering, cancel, pause, resume and review to the existing actions without introducing a second execution engine.
- **Covers** embeds the **original v424/v425 advanced cover configuration form**, retaining its recovery policies, matching, provider controls and original review behavior. No imitation form is created.
- **Metadata** embeds the real v428 Metadata Recovery form, extended to every existing v178/MediaServices rich-import field: year, mediaFormat, durationMinutes, releaseDate, seasonLabel, ageRating, communityScore, mediaSource, demographic, studios, producers, genres, themes, and synopsis, plus safe official total recovery. It offers One-Go/Part-by-Part, manual/automatic continuation and selects eligible no-key public metadata providers.
- **Fresh Episodes** uses the actual existing seasonal Fresh Episodes settings HTML (preserving existing Individual/Automatic/automatic2 behavior), alongside the v428 universal scanner. The universal mode chooser now exposes an engine per supported media type and one combined mode; categories without verified providers remain Unknown.
- **Critical v428 correction:** An anime-only selected or category scan no longer runs the original global seasonal refresh outside its requested scope. It can display pre-existing cached anime evidence without silently touching unrelated titles.
- **Critical v428 correction:** Setup-required / unverified Cover Recovery providers are not displayed as working choices or as a collapsible provider list; future-setup documentation stays in source/docs.
- All v428 background jobs/checkpoints, Library/Settings shortcuts, data protection, and existing MediaFlow features remain in place.
- Development-only regression checks, four-tab contract tests, Chromium desktop/mobile boot and actual launcher position checks.

## Not yet completed
- Universal metadata for creator credits, aliases, publication hierarchy, seasons, volumes and custom imported fields not covered by the current v178 schema; implement only after defining tested persistence/export compatibility.
- A genuine shared implementation for all cover, metadata and release providers. Some providers do not have all three capabilities; never invent unavailable endpoints. API credential-dependent providers remain hidden and dormant.
- Full real-account provider CORS, rate-limit, error/undo and multi-tab validation, and full active-theme visual inspection on devices.
- Large-library full UI and Supabase sync benchmarks. Earlier 100,000-title test exercises synthetic indexing and checkpoints, not production network load.
- Final release archive, numeric tag `429`, ZIP and GitHub Pages deployment. These must be gated by follow-up verification.

## Safety
No production Supabase changes. Do not modify MediaFlow Plus or MediaFlowApp. Do not merge this preview until the remaining v429 requirements have been validated. Always preserve existing personal title records, progress, ratings, seasons, History, Collections and user data.
