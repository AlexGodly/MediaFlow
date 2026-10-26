# MediaFlow v381 — Multi-Provider Reliability & Detection UI Corrections

**Release:** v381 Modular · Personal Edition  
**Date:** October 11, 2026  
**Baseline:** v380 Modular  
**Developer:** Alex Godly  
**Delivery:** Complete modular ZIP, local testing only; **no GitHub commits, pushes, or deployments**.

## 1. Why this update was needed

Real user checks of the v380 episode-data system showed repeated partial results:

| Selected provider | Reported request failures | Reported missing episode lists |
|---|---:|---:|
| AniList | 58 | 0 reported |
| Kitsu | 58 | 0 reported |
| TVmaze | 0 | 56 |
| AniZip | 0 | 7 |
| Tenrai | 0 | 9 |

The app retained the last trustworthy count of **70 Fresh Titles**; **70 is not a new v381 verification**. Error counts describe different conditions and cannot be compared as though they all represent the same failure.

## 2. Shared provider HTTP engine repair

- Starts each request's **18-second network timeout after provider pacing**, rather than while the request waits in a queue.
- Uses per-host pacing queues so one provider does not block unrelated providers.
- Parses `Retry-After` and `X-RateLimit-Reset` and sets a provider cooldown after HTTP 429. Further title lookups during that cooldown fail fast with an explicit paused-provider explanation instead of spamming the API.
- Classifies HTTP status errors, `network_or_cors`, timeouts, malformed responses, GraphQL errors, and temporary provider cooldowns distinctly.
- Detects GraphQL `errors` even when the HTTP response status is 200.
- Retains request-level caching and in-flight deduplication.
- Adds session-level provider request-health diagnostics with most recent error text.
- Continues preserving the previous trustworthy Fresh Titles aggregate when any required result remains unresolved.

**Note:** Provider cooldowns can leave a manual scan incomplete; they do **not** fabricate missing episode counts or overwrite the previously trusted total.

## 3. AniList GraphQL repair

- Removed the unsupported `sort: TIME_DESC` argument from `Media.airingSchedule`.
- Keeps direct `idMal` lookup with `type: ANIME` and validates the returned MAL ID.
- Retrieves a bounded page of available airing-schedule records and `nextAiringEpisode`.
- Uses a confirmed final total for finished series; excludes future airings and handles upcoming series as zero released episodes.
- Surfaces GraphQL validation errors separately from transport failures.
- Applies shared AniList pacing and cooldown handling.

AniList historical schedule coverage remains incomplete for some series; unavailable historical data is not treated as a confirmed result.

## 4. Kitsu request, mapping and pagination repairs

- Sends the JSON:API `Accept: application/vnd.api+json` header.
- Uses a verified Kitsu ID already stored in MediaFlow where present, avoiding redundant MAL mapping requests.
- Otherwise validates an exact `myanimelist/anime` mapping before reading the anime record.
- Extends bounded episode pagination beyond the previous 200-record limit, with an explicit incomplete-catalogue result when the safety ceiling is reached.
- Uses available release dates, status and finished-series totals conservatively.
- Reports connection/CORS errors distinctly and avoids repeated immediate retries after a browser connection block.

**Outstanding:** The v380 Kitsu result of 58 failed requests has not yet been retested against the live Kitsu service from a deployed browser. If the public endpoint blocks the app's browser origin, a permitted proxy or alternative provider may be needed. No proxy or Supabase Edge Function was deployed in this update.

## 5. AniZip date compatibility

- Added support for episode `airDateUtc`, in addition to the older `airdate`, `airDate`, `aired` and related formats.
- Validates parsed timestamps and MAL ID mappings.
- Does not count future episode airings as released.
- Distinguishes absent and malformed dates from records establishing a verified zero for fully future-dated episodes.

This should reduce missing-data reports caused by the old parser, although recovery of the seven previously unresolved titles remains to be proven by live testing.

## 6. Tenrai episode and status correctness

- Does not automatically count undated episode-list entries as already aired.
- Preserves completed-series totals and upcoming-series zero counts when established by catalogue details.
- Retains HTTP status codes in thrown errors for clearer failure classification.
- Keeps missing episode data separate from actual request failures.

A provider with genuinely absent dates or episode data remains an unresolved source, not an excuse to guess.

## 7. TVmaze matching and anime seasons

- Supports a stored verified TVmaze identifier as well as existing IMDb/TVDB ID lookups.
- Retains conservative unique exact-title matching and avoids accepting ambiguous search hits.
- Recognizes explicit numeric season labels when a TVmaze show contains multiple seasons, and restricts release calculations to that season.
- Excludes future episodes and avoids mixing episodes from different TVmaze seasons.
- Distinguishes missing show lookup, missing episode list and unresolved multi-season mapping.

TVmaze does not natively match MAL IDs and is not expected to cover every separate seasonal anime entry; unreliable fuzzy matches are intentionally rejected.

## 8. Automatic Multi-Provider — use the repaired adapters

- Automatic mode uses the **same repaired source adapters** as manual selection: Tenrai → AniZip → AniList → TVmaze → Kitsu.
- Starts with direct MAL-linked information and moves to other sources when an earlier source cannot establish a trustworthy released count.
- Includes the attempted provider and reason in incomplete-source diagnostics.
- Avoids unnecessary requests when a satisfactory result is found.
- Supports temporary source cooldowns without blocking other independent providers.
- Does not silently convert incomplete scans to a new certified Fresh Titles count.

## 9. Dynamic Settings label and duplicate icon fixes

- The automatic refresh status now displays the actual selected mode: **Automatic: Multi-Provider**, **Automatic: Tenrai**, **Automatic: AniZip**, **Automatic: AniList**, **Automatic: TVmaze**, or **Automatic: Kitsu**.
- Updates the explanatory text to describe the new provider system rather than the former Tenrai-only detection.
- Removes redundant icon injection on **View Unmatched Titles**, **Retry API Failures**, **Retry Missing Episode Data**, and related selection/retry controls.
- Uses a single intentional semantic icon per action after initial render and subsequent global icon passes.
- Adds a compact provider request-health diagnostic section that distinguishes checked and unchecked providers in the current session.

## 10. Testing and verification

| Test | Result |
|---|---|
| Compiled JavaScript syntax (`node --check`) | Pass |
| AniZip `airDateUtc` episode parsing | Pass — controlled response |
| AniList corrected query, upcoming, airing and finished handling | Pass — controlled response |
| TVmaze exact verified show + season 2 mapping | Pass — controlled response |
| Kitsu pagination above 200 entries | Pass — controlled response |
| Automatic fallback after missing Tenrai data | Pass — controlled response |
| Automatic incomplete-result explanations | Pass — controlled response |
| HTTP 429 cooldown prevents repeated requests | Pass — controlled response |
| GraphQL 200-with-errors correctly classified | Pass — controlled response |
| Chromium Settings mode label and one-icon buttons | Pass at 390px and 1280px |
| Personal Order All Titles / By Category / Tabs layout regressions | Pass at 320, 390, 820, 1280 and 1920px |
| Actual live AniList, AniZip, TVmaze, Tenrai and Kitsu requests | **Not verified in the build environment** |
| Authenticated Supabase and physical Android/iOS tests | **Not verified** |

The environment could not resolve live third-party API endpoints for direct integration tests. Local fixture tests and source/schema checks cannot guarantee live success, especially for Kitsu's browser-origin behavior, provider downtime, or incomplete anime coverage.

## 11. Source and release updates

- Corrected the v380 provider integration code in `src/js/components/276-v380-providers-logging-order.js` as part of the v381 release.
- Added `src/js/components/277-v381-multi-provider-reliability.js` for provider-aware Settings labels, diagnostics and icon normalization.
- Added `assets/css/198-v381-provider-diagnostics.css`.
- Registered the new extension in `src/js/runtime-order.json`.
- Built `assets/js/mediaflow-v381.bundle.js` and regenerated app-shell PWA cache (`mediaflow-pwa-v381-shell-v1`).
- Updated `index.html`, `VERSION`, `version.json`, `package.json`, `README.md`, `README2.md` and this changelog.
- No database migrations, new credentials, new paid services, remote deployments, or GitHub actions.

## 12. Compatibility and recommended real-account testing

The existing Library, Logging, Collections, Personal Order, History, XP, themes, import/export and cloud data model are preserved. Make a **Full Data backup** before testing v381 against important account data.

Recommended verification sequence: test AniList and Kitsu separately in the browser; inspect their new request diagnostics; retry the seven AniZip and nine Tenrai missing titles; switch to Automatic Multi-Provider; compare whether missing titles are recovered without introducing incorrect episode counts; confirm the prior trusted Fresh Titles value stays protected if the scan remains incomplete.

**Delivery artifact:** `MediaFlow_v381_Modular.zip` (local package, no GitHub commit or deployment).
