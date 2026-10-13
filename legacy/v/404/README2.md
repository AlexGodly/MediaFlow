# MediaFlow v404 — Technical Release Notes

**Version:** v404 Modular  
**Baseline:** v403 Modular  
**Date:** October 13, 2026  
**Developer:** Alex Godly  
**Database migration:** None  
**Status:** Local application package; no GitHub/Supabase production deployment

## What's new

1. **Full Fresh Episodes Engine rebranding.** The v403 `automatic2` mode is now displayed as **Alex Godly's Smart Fresh Episodes Engine** throughout the provider selector, selected-mode status, per-title verification, current-session request diagnostics, identity/coverage report, single-source AniList evidence, progress/error messages and related help text. Old saved provider IDs retain their meaning.
2. **Dashboard switch restored.** **Only recommend titles with fresh episodes** now appears as the third control in the actual current Settings Center → Dashboard → Title Recommendations section, directly under **Prioritize Personal Order**. The existing Fresh Episodes checker switch and Dashboard shortcut use the same `v401RecommendFreshOnly` preference. Manual mode disables it.
3. **Responsive toggle path.** Switch feedback no longer waits for a full page render, network save or large-Library title selection. Rapid changes are coalesced; persistence uses MediaFlow's existing settings pathway. Candidate reconciliation after enabling the filter yields between groups of entries, preserving Personal Order precedence and the existing Unknown-eligible rule.
4. **Dynamic eligibility verified.** A title with an existing verified aired-episode count can become ineligible after logging the last available episode, then eligible again when Fresh Episodes verification finds a newer release. Unknown results remain eligible until trustworthy caught-up evidence exists.
5. **About-page refresh — FAQ and Fun Facts only.** Added explanations for Smart Engine behavior, Unknown states and fresh-only recommendations, plus developer history: the pre-v1 Old System, the original engine architecture, the exact quote “Fuck it, I'll do it myself.”, personal origins, friends inspiring a potential separate public edition, and separate paused media-service tracking, community and Discord integration facts due to financial limitations.
6. **UI polish.** Responsive wrapping for longer diagnostics headings and recommendation controls on mobile/tablet/desktop; no unrelated About-page redesign.

## Verification and limitations

- JavaScript syntax and PWA app-shell generation completed for v404.
- Chromium mock UI tests: 320, 390, 820 and 1280px; canonical Settings Center insertion, name replacement, synchronized switches, rapid toggles, manual mode, a single debounced persistence call, no provider checks from toggle, and progress-sensitive eligibility.
- v403 offline regressions rerun against v404 bundle: 84/84 MAL matched, 70 fresh, 14 verified caught up (one AniList-only), zero unresolved, 420 mocked per-provider checks; multi-width data-integrity and identity/evidence tests passed.
- Synthetic 100,000-title test shows immediate toggle state feedback with asynchronous candidate selection, but total selection and browser responsiveness remain hardware/GC-dependent. This does not prove zero lag or zero freezes on all devices. Actual Supabase, real provider responses and production device behavior were not validated in the isolated test environment.
- Existing `automatic2` saved values, cloud fields, import/export schemas and third-party provider contracts remain unchanged. Media-service account tracking, community and Discord integrations were **not** re-enabled.

**Full changelog:** [docs/CHANGELOG_v404.md](docs/CHANGELOG_v404.md)

---

## Prior technical release notes

- [v403 — Evidence-qualified single-source verification](docs/CHANGELOG_v403.md)
- [v402 — Comprehensive verification and data-integrity improvements](docs/CHANGELOG_v402.md)
- [v401 — Automatic all-provider verification and recommendations](docs/CHANGELOG_v401.md)
- [v400 — Independent timestamps and picker workspace](docs/CHANGELOG_v400.md)
