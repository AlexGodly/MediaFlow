# MediaFlow v401 — Multi-Provider Episode Verification & Fresh-Aware Recommendations

**Release:** MediaFlow v401 Modular  
**Baseline:** MediaFlow v400 Modular  
**Date:** October 13, 2026  
**Developer:** Alex Godly  
**Scope:** Fresh Episodes source selection, per-title cross-provider evidence, Seasonal Anime recommendation eligibility, diagnostics, settings and regression coverage.

## 1. Overview

v401 adds **Automatic Multi-Provider 2** alongside the original provider selection. Automatic Multi-Provider 1 retains its existing priority-based fallback. Automatic 2 attempts every applicable supported episode source for **each** verified Seasonal Anime title before finalizing its outcome. A first provider returning zero no longer prevents later providers from detecting aired episodes.

The release also adds **Only recommend titles with fresh episodes**, an optional Seasonal Anime recommendation restriction. It is exposed in both **MediaFlow Recommends Title** settings and the **Fresh Episodes checker** and uses one shared saved preference. It is unavailable under Manual Fresh Episodes.

## 2. Automatic Multi-Provider 2

### Algorithm

1. Identify the Seasonal Anime candidate with a stored MAL ID or the existing strict resolver. Avoid guessed or ambiguous season/title matches.
2. Request results from **Tenrai, AniZip, AniList, TVmaze and Kitsu**, using existing adapter-level identity/mapping checks and provider rate-limit gates.
3. Record every provider's status independently: verified released-episode count, unavailable episode data, connection error, timeout or other failure.
4. Compare trustworthy aired-episode counts against the title's current MediaFlow Library progress. Treat future release dates as unaired where supported by the adapter.
5. If at least one verified provider has a released episode beyond current progress, retain that credible positive finding and record other provider disagreements or unavailable sources. Do not count duplicate reports as separate titles.
6. If every checked provider provides usable release evidence and none establishes an unwatched aired episode, the title is **No fresh**.
7. If the remaining evidence cannot establish a fresh release **or** reliable absence (including partial failures where no positive was verified), the title is **Unknown**. Do not silently classify that state as zero.

### Provider behavior

| Source | Identity and release verification inherited from v380/v381 |
| --- | --- |
| Tenrai | MAL ID and available episode dates |
| AniZip | MAL mapping and episode air-date catalogue |
| AniList | Verified `idMal`, airing schedule and available series status |
| TVmaze | Verified identifier / conservative title matching; exact season episode dates |
| Kitsu | Explicit Kitsu identifier or MAL mapping, anime data and episode air dates |

**Automatic 1 is not removed or changed to all-provider mode.** Single-source selection remains supported. All automatic checks use the same canonical Library progress and v377 scan ledger. MAL/SIMKL **account tracking** and canceled v374 functionality are not reintroduced.

### Reliability and performance

- Five provider checks can run concurrently **within each anime**, while the existing scanner processes eligible titles and the v380/v381 HTTP engine rate-limits requests per host.
- Existing request deduplication and response TTLs are reused; forced refresh bypasses cached values where the provider adapter supports it.
- Provider failures are retained as diagnostics rather than counted as zero.
- Verification results are persisted in the existing settings ledger, including source counts and disagreement flags.
- The previous verified aggregate count is preserved if a scan is incomplete; strict recommendation eligibility uses current title-level status, not a stale aggregate.
- Prior trusted title results are no longer treated as current proof after that title fails a subsequent scan.

No improvements to network throughput or 100,000-title throughput are claimed without measurements.

## 3. New Seasonal Anime recommendation preference

**Setting:** `Only recommend titles with fresh episodes`  
**Default:** Off  
**Stored setting:** `v401RecommendFreshOnly`

Appears in both:

- Settings → **MediaFlow Recommends Title**.
- Settings → **Fresh Episodes checker**.

The controls use the same preference and are updated by the same application action, so they cannot intentionally drift into different persisted values.

### Mode gating

| Fresh Episodes mode | Setting |
| --- | --- |
| Automatic Multi-Provider | Enabled for selection |
| Automatic Multi-Provider 2 | Enabled for selection |
| Tenrai / AniZip / AniList / TVmaze / Kitsu | Enabled for selection |
| Manual Fresh Episodes | Unavailable; switching to Manual turns the filter off |

When switched off, title recommendation selection is restored to the existing unrestricted behavior. Other Library categories are unaffected.

## 4. Confirmed-fresh eligibility

When both the setting and exact-title recommendations are enabled, the **Seasonal Anime** recommendation candidate pool is restricted to titles with:

- A matching Seasonal Anime category and an eligible status.
- A currently applicable and sufficiently recent verified provider scan for that title/selected detection mode.
- At least one verified aired episode **above saved watched progress**.

A title with progress `8/12` is **not** eligible if only eight episodes have aired. A title with progress `8/12` becomes eligible if a trustworthy provider establishes that episode nine has aired.

Unknown or expired checks do not become positive matches merely because total planned episodes exceed progress.

### Recommendation integration

- Initial title selection during task generation.
- Personal Order prioritized title selection, with filtered fallback to eligible Seasonal Anime titles.
- Reroll Title candidates, including the existing Personal Order queue.
- Dashboard recommendation reconciliation when scan results or progress change.
- Dashboard empty states when no currently eligible title is available.
- Restoration of normal title selection when the filter is disabled.

Existing reroll history stays historical; v401 does not delete past recommendation entries or rewrite earned XP.

### No eligible titles

The Dashboard displays an explicit Seasonal Anime recommendation message instead of recommending an ineligible title or rerolling indefinitely. It distinguishes an apparently caught-up pool from titles that still await provider verification and offers a Fresh Episodes refresh action.

## 5. Per-title provider diagnostics

Automatic Multi-Provider 2 adds an expandable **verification details** section to the Fresh Episodes settings. Each matched title can show:

- The verified released-episode count.
- Per-provider counts and Unknown/errors.
- The number of providers that returned verified evidence.
- Disagreement between verified source counts.

The existing current-session provider request health summary is extended to list all five v2 sources. A stored diagnostics record is not a provider uptime guarantee.

## 6. Compatibility and persistence

v401 retains:

- v377's canonical Seasonal Anime ledger and aggregate computation.
- v380/v381 episode adapters, caching, request deduplication and throttling.
- Original Automatic 1 and all individual-source options.
- Existing Manual Fresh Episodes workflow.
- Library, Progress, Seasons, Logging, History, XP, Personal Order and Collections data paths.
- Existing settings/cloud-backup architecture; no new Supabase tables or migrations.
- Existing themes, mobile/tablet/desktop layouts and PWA behavior.

The v401 preference and per-title diagnostics are additional properties in the existing settings JSON. After switching providers, the inherited source-change handler clears old provider-specific episode results so they are not reused as the new source's evidence.

## 7. Source and release changes

| Path | Change |
| --- | --- |
| `src/js/components/276-v380-providers-logging-order.js` | Register Automatic Multi-Provider 2 in the supported source selector; allow automatic identity resolution |
| `src/js/components/277-v381-multi-provider-reliability.js` | New display label for mode 2 |
| `src/js/components/293-v401-fresh-episodes-recommendations.js` | All-provider orchestration, source evidence, fresh recommendation restrictions, diagnostics and settings |
| `assets/css/214-v401-fresh-provider-recommendations.css` | Responsive, theme-aware setting/diagnostics and empty-state presentation |
| `src/js/runtime-order.json` | Register v401 source after v400 extensions |
| `assets/js/mediaflow-v401.bundle.js` | Rebuilt modular bundle |
| `README.md` | **Evolution section only** (permanent README maintenance rule) |
| `README2.md` | Technical release notes |
| `docs/CHANGELOG_v401.md` | Detailed changelog |
| `VERSION`, `version.json`, `package.json`, `sw.js`, `index.html` | Release and PWA metadata |

## 8. Verification

All listed tests below use **mocked provider data and local synthetic browser fixtures**, not authenticated production Supabase data or current live API outputs.

| Test suite | Tested widths | Result |
| --- | --- | --- |
| `scripts/test-v401-provider-and-recommendations.py` | 320, 390, 820, 1280, 1920px | Passed |
| `scripts/test-v401-scan-ledger.py` | 390, 1280px | Passed |
| `scripts/test-v401-v400-advanced-timestamps.py` | 390, 1280px | Passed |
| `scripts/test-v401-v400-picker-and-controls.py` | 320, 390, 820, 1023, 1280, 1920px | Passed |
| `scripts/test-v401-v400-save-dashboard-regression.py` | 320, 390, 820, 1280, 1920px | Passed |
| `scripts/test-v401-v400-picker-workflows-regression.py` | 390, 1280px | Passed |
| Modular build / Node JavaScript syntax / PWA asset inventory | Source and package | Passed |

Verified behaviors include all-five-per-title source checks, valid-first-provider-zero handling, provider error uncertainty, positive evidence amid partial source failures, canonical ledger/aggregate persistence, Automatic 1 fallback unchanged, independent Seasonal Anime recommendation gating, cross-page control presence, Manual mode restrictions and previously working picker and Logging flows.

### Limitations

- Physical Android, iOS and Windows app behavior not verified.
- Production authenticated Supabase sync not exercised.
- Provider API coverage, CORS behavior and actual airing-data accuracy require live verification; mocked adapters cannot demonstrate a live episode was released.
- A credible positive from one provider may still be wrong if the upstream source has incorrect metadata. The system exposes conflicting evidence but cannot guarantee real-world correctness.
- 100,000-title end-to-end performance, extreme scan duration and true provider throttling under production rate limits were not benchmarked.
- Full application test coverage is not claimed from targeted browser regressions.

## 9. Release summary

**v401 introduces all-source Fresh Episodes verification as a separate selectable detection architecture and makes verified fresh episodes a first-class optional eligibility rule for Seasonal Anime recommendations.** It preserves Automatic 1, Manual mode, individual providers, canonical progress data and the v400 user interface foundation, while keeping future README maintenance restricted to the Evolution section.
