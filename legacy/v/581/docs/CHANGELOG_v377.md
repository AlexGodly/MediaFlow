# MediaFlow v377 — External IDs, Jikan Recovery & Personal Order Positions

**Release:** v377 Modular — Personal Edition  
**Baseline:** MediaFlow v376 Modular  
**Date:** October 11, 2026  
**Developer:** Alex Godly  
**Release status:** Locally built and synthetic-browser-tested; not deployed; live Jikan, Supabase cross-device, and physical-device testing outstanding.

## 1. External Media IDs — editable in Add Title / Edit Title

- New collapsible **External Media IDs** section, directly after Core Details and Seasons View.
- Existing IDs are prefilled when editing. Supported fields: MyAnimeList (MAL), SIMKL, AniList, TMDB, IMDb, Trakt, Kitsu, ISBN; previously stored additional provider keys also appear automatically.
- Can add, correct, and clear individual IDs; validates provider-specific ID formatting and prevents invalid submission.
- Manual overrides, including intentional clearing, are preserved against the v158 Exchange Hub normalized import merge path (`v377ManualExternalIds`).
- External IDs are stored in canonical Library title data and remain part of the existing local/cloud backup and export payloads. No additional OAuth, SIMKL account integration, or provider credentials.
- In Anime Details → Dates & Source, **Edit external IDs** opens the original Edit Title popup directly with the IDs section expanded.
- MAL has **Verify**, performing Jikan's exact anime lookup and optionally checking manga ID when anime verification fails. Jikan remains exclusive to MyAnimeList.

## 2. Add/Edit Title — Seasons View moved to the end of Core Details

- Seasons View renders immediately after the existing Core Details fields and before the new External Media IDs section.
- Existing field IDs, season editing, progress aggregation, Logging, and Save Title flow remain intact.
- The change is a CSS ordering/layout adjustment, not a migration or replacement of season data.

## 3. Jikan reliability — request pacing, retries, data protection

- Each outgoing Jikan attempt uses a serialized gate, spaced at least 1,150 ms apart with a rolling-minute budget below the documented provider threshold (up to 53 requests/minute).
- Bounded 16-second requests with up to three attempts. Handles `Retry-After`, HTTP 429, transient HTTP 5xx, and network timeouts with backoff.
- Reuses successful TTL-cached API results; stores no failure responses in the success cache.
- An empty/unusable episode list no longer qualifies as a trustworthy zero-episode result.
- Exact saved MAL IDs are prioritized. Missing MAL IDs use the preexisting strict title/year matching approach; ambiguous matches are not guessed.
- Records each title's latest successful MAL ID / available episodes in a Settings-based ledger. A partial scan does not promote an incomplete count over the last trustworthy count.
- Preserves v376's underlying Seasonal eligibility (category Seasonal and status not completed/dropped), Jikan episode interpretation, and user progress.
- Jikan remains a public third-party service; no local change can guarantee its uptime or complete catalog coverage.

## 4. Automatic Jikan — unmatched and failed-title management

After an Automatic Jikan check, Settings now exposes:

- **View Unmatched Titles (N)** popup, retaining its last report between popup openings.
- **Retry API Failures (N)** action, separate from genuine title matching failures.
- Popup rows use actual Library title, existing cover URL, and the MediaFlow category-icon fallback when no cover exists.
- Rows show unmatched/failure reasons and current MAL ID, with **Edit** and individual **Retry** actions.
- **Check All Unmatched** and checkbox-based **Check Selected** run a subset scan, without rescanning unrelated Library titles.
- On correction, newly matched titles disappear from unmatched results; temporary Jikan failures stay in a separate failure list.
- Retried titles contribute to **Detected Fresh Titles** and episodes waiting only after a complete, trustworthy aggregate is available. Each title is counted once; user progress is considered.
- Report and result ledger use existing Settings persistence; no new Supabase tables or SQL migrations.

## 5. Personal Order — readable three-digit positions

- Stronger last-layer CSS rules secure at least 70 px for position lanes on desktop/tablet and 66 px on narrow mobile layouts.
- Applies to title positions, Collection Queue positions, assigned Collection editable inputs, global display numbers, and inner expanded Collection positions.
- Tested positions 999 and 1000; badges and covers occupy separate lanes, without altering cover dimensions, aspect ratios, sizing presets, or cropping.
- **Cover presentation is intentionally unchanged from v376**, per owner request.
- Continuous Collection Queue in Lists → All Titles, grouped By Category, and focused Tabs remain as v376 designed.

## 6. Implementation details

**New modules:**

- `src/js/components/273-v377-ids-editor-jikan-recovery.js`
- `assets/css/195-v377-ids-jikan-order.css`

**Updated:**

- `src/js/runtime-order.json`
- `index.html`
- `assets/js/mediaflow-v377.bundle.js` (generated, checked with `node --check`)
- `VERSION`, `version.json`, `package.json`, `manifest.json`, `sw.js` (generated release metadata and PWA cache)
- `README.md`, `README2.md`, `docs/CHANGELOG_v377.md`

## 7. Testing

Locally compiled app and synthetic Chromium tests (not live authenticated data):

| Area | Result |
|---|---|
| JavaScript syntax / rebuild / PWA assets | Passed |
| Personal Order continuous queue, grouped queue, tabs, canonical ordering | Passed, 320 / 390 / 820 / 1280 / 1920 px |
| Protected badge/cover lanes including 999 / 1000 | Passed at those five widths |
| Edit Title — external ID prefilling, saving MAL + SIMKL, manual provenance | Passed, 390 / 1280 px |
| Seasons View → External IDs → Artwork visual order | Passed, 390 / 1280 px |
| Mocked Jikan: successful episode data and strict title matching | Passed |
| Mocked Jikan: empty episode list classified as API failure | Passed |
| Mocked Jikan: genuinely unmatched title surfaced in report | Passed |
| Mocked Jikan: partial scan retains previous fresh count | Passed |
| Mocked retries: newly matched title contributes once, failed result resolved later | Passed |
| Mocked retries: resulting authoritative fresh count and waiting episodes | Passed |
| Authenticated Supabase / real Jikan API / hardware testing | Not performed |

**Limitations:** Only mocked Jikan requests were exercised, so live uptime, rate-limit fairness across multiple tabs/devices, MAL catalogue consistency, real Library sizes, and auth/cloud migrations cannot be guaranteed. Future Jikan request traffic is deliberately slower to keep the API stable and may take several minutes for large Seasonal collections. The Settings-based per-title ledger/report can increase synchronized Settings payload size for accounts with large Seasonal libraries; production telemetry has not been measured.

## 8. Compatibility / owner deployment

- Personal Edition v376 baseline; no reintroduced v374 MAL/SIMKL OAuth/account tracking.
- Existing Cloud Sync v201, Full Backup v29, Settings Preset v1, Personal Order export v5, and Collections export v2 are unchanged.
- No new database schema, provider keys, or deployment secrets required.
- No GitHub commit, push, or deployment is performed. Owner manually deploys and uses numeric commit message `377` if desired.
- Test locally using `python -m http.server 8080` from the extracted ZIP directory.

**MediaFlow v377 — Easier identification, safer episode checks, and readable Personal Order positions.**
