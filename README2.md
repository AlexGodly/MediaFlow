# MediaFlow — Latest Release Changelog

# MediaFlow v382 — Logging Progress Outlook, Direct Recommended Titles & XP Summary Redesign

**Release:** v382 Modular · Personal Edition  
**Date:** October 11, 2026  
**Baseline:** v381 Modular  
**Developer:** Alex Godly  
**Delivery:** Complete modular ZIP, local testing only; **no GitHub commits, pushes, or deployments**.

## 1. Professional Logging XP summary

Replaces the legacy pale inline XP calculation with a responsive, theme-aware **Estimated Reward** card showing the total projected XP, base XP, rotation multiplier, streak multiplier, and streak days. The current rotation description is preserved. All numbers come from the existing XP estimator, and actual awards still occur only upon submission. Works in **Quick Logging and Per Unit** and refreshes with draft changes.

## 2. Recommended title — one-click direct addition

Fixes the longstanding shortcut that previously only filled the search field. **Use recommended title** now calls the existing canonical direct-add logic and actually inserts the recommended Library title into the current Logging draft in **both modes**. It preserves the active mode and unrelated drafts, reveals hidden Added Titles, prevents duplicates, and locates an already-added card. Only successful addition shows the confirmation message; success uses a meaningful **check-circle**, replacing the generic circle-arrow icon. The recommendation card derives its state from real draft membership, not the search input.

## 3. Per Unit current and future progress

Every Per Unit added title displays separate **Current progress** and **After this draft** progress bars, plus the count of staged units. Future progress uses MediaFlow's existing contiguous episode/season-aware projection: gaps and repeat units do not falsely advance the bar. Unknown totals display `?` and a neutral track rather than inventing a completion percentage. The bars update when the itemized draft changes. Quick Logging and main Library artwork/cards are unchanged.

## 4. Source and compatibility

- New JS module: `src/js/components/278-v382-logging-recommended-progress-xp.js`.
- New CSS: `assets/css/199-v382-logging-xp-progress.css`.
- Rebuilt bundle: `assets/js/mediaflow-v382.bundle.js`.
- PWA shell: `mediaflow-pwa-v382-shell-v1`; updated `VERSION`, `version.json`, app metadata, runtime registration, and index asset references.
- **No** database migrations, Edge Functions, new credentials, new paid services, XP formula changes, or GitHub operations.

## 5. Tests and limitations

Node syntax validation passed. Focused Chromium tests passed in both Logging modes at **320, 390, 820, 1280 and 1920 px**. Tests verified direct adding, idempotent repeated clicks, XP card refresh, current/proposed progress (9/14 → 12/14 for episodes 10–12), gap/repeat protection, and unknown totals.

Testing used synthetic fixture state, **not a logged-in Supabase account**. Production-scale performance, cloud round-trip, and physical-device validation remain outstanding. v381 multi-provider behavior is retained but was not live-tested in this release.

**Detailed source, acceptance tests and deployment guidance:** [docs/CHANGELOG_v382.md](./docs/CHANGELOG_v382.md).

---

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

---

## MediaFlow v380 — Multi-Provider Detection, Logging Stability & Personal Order Scroll

**Release:** v380 Modular — Personal Edition  
**Baseline:** v379 Modular  
**Date:** October 11, 2026  
**Developer:** Alex Godly  
**Status:** Built and locally tested. No GitHub commit, push, or deployment.

### 1. Five episode sources and Automatic Multi-Provider

Added six selectable modes: Automatic (default), Tenrai, AniZip, AniList, TVmaze and Kitsu. Automatic falls back only when a prior source lacks verified release data. MAL mappings, dated episodes, upcoming/finished anime handling, provider-specific caching/pacing and source diagnostics were integrated without paid services or new OAuth secrets. The previous trustworthy fresh count is preserved when checks are incomplete. **Live-provider access and coverage remain unverified**; the earlier nine unresolved titles cannot be claimed recovered.

### 2. Logging controls and icon reliability

Rebuilt Hide/Show Added Titles using one draft-backed visibility state and dynamic eye/eye-off symbols immediately next to Clear All Titles. Replaced Added with a check-circle and corrected the initial Asc/Desc sort arrow. Fixed interference from the existing semantic-button icon layer, including the Unmatched and Retry actions.

### 3. Units in Draft sorting

Added Units in Draft directly to the existing Logging → Sort titles selector. Uses the staged Per Unit records or pending Quick quantity/progress delta, with ascending/descending direction and stable ties. No changes to History, XP or underlying draft indexes.

### 4. Personal Order scroll stability

Preserved the user's scroll position around title and assigned-Collection reordering, including mixed queue dragging, numeric positions and arrow actions in Lists and Tabs. Retains v379's exact cross-title/Collection order changes.

### 5. Testing and delivery

Local browser Logging/mixed-order tests pass at 390 and 1280 px; Personal Order layout tests pass at 320, 390, 820, 1280 and 1920 px. Provider mock-response tests pass for AniZip, AniList, TVmaze, Kitsu and Automatic fallback. Live third-party endpoints, authenticated Supabase, account-scale performance and physical devices remain outstanding.

**Complete changelog:** [docs/CHANGELOG_v380.md](./docs/CHANGELOG_v380.md).

---

## MediaFlow v379 — Logging Recovery, Mixed Collection Reordering & Tenrai Diagnostics

**Release:** v379 Modular — Personal Edition  
**Baseline:** v378 Tenrai Repair Modular  
**Date:** October 11, 2026  
**Developer:** Alex Godly  
**Status:** Built and locally tested; no GitHub commit, push, or deployment.

### 1. Logging expansion restored

Removed the broken global Collapse All/Expand All actions and redundant button under each cover. Per Unit cards once again use their functional right-hand Expand/Collapse to show individual episode/chapter logging controls; Quick Logging gets a working right-hand expander that preserves draft amounts. A new **Show/Hide Added Titles** button sits beside Clear All Titles and hides only the list.

### 2. Logging Library — always-on selection

Removed Clean Covers entirely. Fixed malformed manual-checkbox handlers and synchronized Add Selected count and enabled state with individual selection, Select Visible and Deselect All. Integrated selection checkboxes into all five Library view layouts, slightly enlarged Logging Library covers, preserved bulk Add with duplicate prevention, and changed Added to a check-circle icon.

### 3. Personal Order — mixed title/Collection reordering

Fixed the reported `Anime 1 → Collection → Anime 2` issue. Moving Anime 2 above the Collection now produces `Anime 1 → Anime 2 → Collection` without displacing unrelated entries. Titles and assigned Collections share one queue-movement operation across arrows, positions and drag/drop. Added Collection dragging, touch handles, local queue repaint where applicable, and serialized/debounced order persistence.

### 4. Automatic MAL Detection

Incorporates the v378 Tenrai Repair episode-data safeguards, retaining a clear distinction between API request errors and unavailable episode listings. Keeps **Retry Missing Episode Data** separate and preserves the last verified fresh-title total during incomplete checks. Replaces generic circle-arrow icons on unmatched/retry controls. The previously reported nine missing lists remain provider-dependent and are **not claimed to be resolved**.

### 5. Tests and delivery

Compiled JavaScript checked successfully. Browser tests passed for manual selection, Quick and Per Unit expansion, title-list visibility, exact mixed-order moves and real drag events at 390/1280px. Personal Order layout checks passed at 320, 390, 820, 1280 and 1920px. Nine local Tenrai recovery tests passed. Live Tenrai, real-user cloud sync and physical-device testing remain outstanding.

**Full changelog:** [docs/CHANGELOG_v379.md](./docs/CHANGELOG_v379.md).

---

## MediaFlow v378 — Tenrai Migration, Import IDs, Logging 4.0 & Personal Order

**Release:** v378 Modular — Personal Edition  
**Baseline:** v377 Modular  
**Date:** October 11, 2026  
**Developer:** Alex Godly  
**Status:** Built and locally tested; not committed, pushed or deployed.

### 1. Automatic MAL Detection powered by Tenrai
Migrated MyAnimeList metadata, episode lookup, unmatched-title retries, API failure retries, and Add/Edit Title MAL verification to Tenrai's public v1 endpoints. Retains MAL-ID-first matching and trustworthy-count protection, without introducing OAuth or external account tracking.

### 2. External Media IDs in imports
Normalizes known provider identifiers in canonical Exchange Hub import flows, extracts MAL IDs from recognized URLs, preserves manually corrected IDs, rejects invalid values and presents import ID outcome counts.

### 3. Logging 4.0
Adds Collapse All/Expand All for Quick Logging and Per Unit, direct title Add, five Logging Library display modes, Clean Covers, multi-select, Select Visible, Deselect All, and one-click Add Selected. Draft entries start at zero consumption until deliberately configured.

### 4. Personal Order
Fixes narrow title position inputs (tested for 3+ digits) and includes assigned Collection blocks within Lists → All Titles, following their mixed order alongside direct titles. No existing cover presentation changes.

### 5. Icons, tests and packaging
Semantic icons for Unmatched, Retry, Verify, and External Media IDs. Built JS/PWA metadata for v378. Chromium synthetic tests at mobile/tablet/desktop widths passed; live Tenrai/cloud/physical-device testing not performed.

**Complete technical changelog:** [docs/CHANGELOG_v378.md](./docs/CHANGELOG_v378.md).

---

## MediaFlow v377 — External IDs, Reliable Jikan & Personal Order Positions

**Release:** v377 Modular — Personal Edition  
**Baseline:** v376 Modular  
**Date:** October 11, 2026  
**Developer:** Alex Godly  
**Status:** Local development candidate; not deployed.

### 1. Editable external media IDs

Added dedicated, collapsible External Media IDs fields to Add/Edit Title for MAL, SIMKL, AniList, TMDB, IMDb, Trakt, Kitsu, ISBN and any additional stored provider IDs. Existing IDs are prefilled, can be changed or cleared, and manual overrides survive normalized Exchange Hub imports. Anime Details includes an **Edit external IDs** shortcut. The MAL field offers Jikan verification; other providers do not gain new automatic metadata integrations.

### 2. Automatic Jikan reliability

Jikan requests use a serialized gate (≥1.15 seconds between calls; no more than 53 attempts per sliding minute), bounded retries, 16-second timeouts, `Retry-After` handling, exponential backoff, and successful-response caching. Missing or empty episode data are treated as failures rather than valid zero counts. Partial scans preserve the previous trustworthy Detected Fresh Titles total.

### 3. Unmatched Titles manager

**View Unmatched Titles** opens a scrollable popup with actual Library covers or the existing category-icon fallback, title, current MAL ID, failure reason, Edit, and per-title Retry. **Check All Unmatched**, **Check Selected**, and **Retry API Failures** check only affected titles. Recovered episodes contribute to Detected Fresh Titles without duplicate counting once the aggregate is verified.

### 4. Add/Edit Title — Seasons View placement

Seasons View now appears at the very end of Core Details. The new External Media IDs section follows immediately afterward, before Artwork & Dates. All existing seasons data and actions remain intact.

### 5. Personal Order three-digit positions

Strengthened the numeric lane and input widths across Tabs, Lists, Collection Queues, assigned Collections, and expanded Collection rows. At least three digits remain visible at mobile and desktop widths; larger values can display safely. **Existing cover presentation and cover-size settings are unchanged.** The continuous/grouped Collection Queue behavior from v376 is preserved.

### 6. Build, validation and compatibility

- Built `mediaflow-v377.bundle.js` and regenerated v377 PWA assets.
- Chromium layout tests passed at 320, 390, 820, 1280 and 1920 px.
- Synthetic Chromium Edit Title/Jikan tests passed at 390 and 1280 px, including manually saved IDs, partial check protection, separate unmatched/API-failure reporting, and fresh-title count recalculation after retries.
- No new SQL migrations or external OAuth provider connections.
- Live Jikan availability, authenticated cloud synchronization, and physical devices were not tested.
- **GitHub:** No commits, pushes, or deployment. Owner manages the repository; numeric commit convention is `377`.

**Full technical details:** [docs/CHANGELOG_v377.md](./docs/CHANGELOG_v377.md)

---

## MediaFlow v376 — Personal Order UI Parity & Continuous Collection Queue

**Release:** v376 Modular — Personal Edition  
**Baseline:** v375 (restored v373 feature code)  
**Date:** October 11, 2026  
**Developer:** Alex Godly  
**Status:** Local development candidate; not yet deployed.

### 1. Personal Order Row/Card Parity

The position badge, poster and title metadata now use a consistently protected three-column layout throughout **Tabs / Category Titles**, **Tabs / Collection Queues**, **Lists / All Titles**, **Lists / By Category**, direct titles, assigned Collection blocks, and expanded Collection contents.

### 2. Readable Positions

Position badges/inputs support **at least three digits** without overlap or clipping. The protected position lane uses 54 px at normal widths and 48 px on narrow layouts, with a natural-content-friendly label and proportional cover frame.

### 3. Continuous Collection Queue

- **Lists → All Titles:** Collection Queue items form **one continuous list**. Previously separate category cards are no longer displayed as isolated queue panels.
- **Lists → By Category:** Collection Queue items stay grouped by category, matching the Title Order grouping.
- **Tabs:** Category Titles and Collection Queues retain their focused per-category presentation.
- **Canonical data safety:** Global display numbering does **not** overwrite category-local position values. Collection assignment input remains category-local for reordering.

### 4. Responsive Collection Artwork & Expanded Details

Fixed cover/number spacing for individual titles, Collection cover/collage blocks and entries inside expanded Collection Order. Existing adjustable cover sizes, eligibility statuses, title wrapping and action controls are preserved.

### 5. Existing Features Preserved

Retains drag-and-drop, moving via arrows/numeric inputs, Edit/Remove, Open Collection, Show/Hide Titles, collection-category and completed-title rules, history, Logging, XP, Supabase cloud state and data formats. No new SQL migration; canceled v374 MAL/SIMKL authenticated tracking remains absent.

### 6. Development Validation

Compiled v376 JS and regenerated version-aware PWA assets; validated the real app in Chromium at **320, 390, 820, 1280 and 1920 px** using synthetic data and a Collection with 140 members. Full physical-device, live-account and production verification remain outstanding.

**Technical source and detailed test matrix:** [docs/CHANGELOG_v376.md](./docs/CHANGELOG_v376.md)

---

## Previous Release — v375

v375 restored the v373 application baseline after canceling the v374 external tracking experiment. Its `VERSION` and `version.json` values were updated, while v373-named frontend/PWA artifacts remained in that rollback source. v376 performs a complete fresh JavaScript/PWA build.

## Earlier Feature Baseline — v373

v373 introduced the Logging Sorting & Custom Order Studio, with session insertion order, multiple sorting fields, manual movement, and persistent custom draft arrangement. [Read v373 details](./docs/CHANGELOG_v373.md).

---

**Commit policy:** When an approved release is deployed to GitHub `main`, the commit message is **only the numeric version** (for v376, `376`). This local candidate has not been pushed or deployed.


---

## v378 Tenrai Episode-Data Diagnostic Repair (Local Testing Hotfix)

The repair build corrects episode-list classification without advancing to the full v379 release. A successful Tenrai response with an empty episode list is not automatically an API failure. Valid **not-yet-aired** MAL titles count as zero released episodes; **finished airing** titles with a trusted total can be resolved from catalogue metadata; **currently airing** titles without episode-level data are classified as **Missing Episode Data**, not a transport failure. A separate **Retry Missing Episode Data** control allows retrying these titles. Genuine HTTP/network errors still appear under **Retry API Failures**. The last trustworthy fresh-title count stays protected while data remains incomplete.

No new cloud schema, account integration, or cover changes. Tested using synthetic provider responses; **live Tenrai responses cannot be verified from the local build environment**. See `docs/TENRAI_EPISODE_DATA_REPAIR.md`.
