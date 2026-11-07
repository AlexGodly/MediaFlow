# MediaFlow v380 — Multi-Provider Episode Detection, Logging Reliability & Personal Order Stability

**Release:** MediaFlow v380 Modular — Personal Edition  
**Baseline:** MediaFlow v379 Modular  
**Date:** October 11, 2026  
**Developer:** Alex Godly  
**Delivery:** Local modular ZIP only. **No GitHub commit, push, or deployment.**  
**Verification scope:** Local Chromium regression tests and provider-response fixtures; **no confirmed live API availability, live Supabase sync or physical-device testing.**

## 1. Automatic MAL Detection 2.0 — Five independently implemented data sources

**Problem:** Tenrai sometimes returns insufficient episode data for otherwise matched anime. The last verified Fresh Titles count could remain frozen even though network failures had been reduced to zero. MediaFlow needed independent source adapters and a controlled fallback path without API keys or user-account tracking.

**Changes:**

- Added Settings → Automatic MAL Detection → **Episode data source** selector with six modes: **Automatic Multi-Provider (default), Tenrai, AniZip, TVmaze, Kitsu and AniList**.
- In Automatic, try **Tenrai → AniZip → AniList → TVmaze → Kitsu** only as necessary for each MAL title. Stop when a provider supplies reliable released-episode information, including verified zero for genuinely upcoming anime.
- In Manual modes, query only the selected episode source. Titles without an explicit MAL ID are marked unmatched and are not silently resolved via another provider.
- **AniZip:** Query MAL-ID mappings and dated episode entries. Future episode dates are excluded; undated listings are not assumed to be aired.
- **AniList:** Query its public GraphQL API by `Media(idMal:…, type: ANIME)`. For completed anime use a verified total; for airing anime, consult future next-airing information or dated available schedule entries. Historical airing coverage is not guaranteed; do not fabricate counts.
- **TVmaze:** Use exact IMDb/TVDB identifiers when present, otherwise require a unique exact title match. Use episode air dates from the show's episode feed; do not make unsafe assumptions about shows containing multiple TVmaze seasons.
- **Kitsu:** Map `myanimelist/anime` IDs using the public mappings endpoint, retrieve anime status and dated episodes, paginate with a safe ceiling, and distinguish missing data from an upcoming title or a finished title with a known total.
- **Tenrai:** Retained the v378/v379 episode-list and finished/upcoming safeguards unchanged.
- Shared request caching, in-flight deduplication, basic provider-specific pacing, bounded HTTP retry and request timeout handling.
- Kept the previous trusted Fresh Titles total if a scan is incomplete. A newly verified total is promoted only when enough information is available; data are not double-counted across providers.
- Store source provenance with resolved MAL rows in the existing diagnostic ledger. Switching providers resets source-dependent diagnostics/ledger **without resetting the previously trusted count, Library progress, History or XP**.
- Show source selection and last successful per-provider resolution counts within Settings; credit TVmaze and link to its usage terms/attribution source.

**Important constraints:** AniList integration is based on the owner's stated permission; its actual approval conditions weren't independently verified. TVmaze API data is CC BY-SA and its attribution and ShareAlike conditions apply to uses of that data. Public endpoint availability, CORS, quota behavior and live episode accuracy still need live verification. The nine earlier missing episode lists are **not claimed resolved** until tested with the affected titles and actual provider responses.

## 2. Logging — reliable Hide/Show Added Titles

**Problem:** In v379 the Show/Hide Added Titles control intermittently failed after renders, and its circle-arrow glyph didn't convey the action.

**Changes:**

- Centralized visibility in one persisted draft setting and reapplied it on initial render, Logging rerenders and itemized-panel refreshes.
- Put one button **immediately before Clear All Titles**; its eye-off icon indicates **Hide Added Titles**, and its eye icon indicates **Show Added Titles**.
- Delegated click handling prevents the visibility action from depending on stale DOM event handlers.
- Hiding the list does not delete staged titles or modify individual expansion, per-unit timestamps, progress, repeat data or logging submission state.

## 3. Logging Library — permanent Added check icon

- Replaced the v225 generic circle arrow on already-added entries with a theme-aware **check-circle**, in List, Compact, Cards, Covers and Covers + Titles.
- Retained the Plus/Add action for eligible titles and disabled Already Added actions for duplicate protection.
- Added explicit icon-system opt-outs to prevent the v226 semantic icon renderer from overriding the required icons on first render.

## 4. Personal Order — preserve scroll position when rearranging

**Problem:** Moving titles or Collections could trigger a fallback full render and scroll back to the top.

- Snapshot and restore page/scrollable workspace position around title and Collection ordering actions, including the internal mixed-queue mover used by drag-and-drop.
- Applies to **Lists → All Titles**, **Lists → By Category**, **Tabs → Category Titles**, and **Tabs → Collections Queue**, for arrows, numeric positions and mixed drag actions.
- Existing v379 canonical mixed-order logic is preserved; moving Anime 2 above a Collection must not unexpectedly move Anime 1.
- Delayed viewport restoration mitigates scroll resets caused by synchronous and next-frame rerenders. Native scrolling remains possible during ordinary navigation.

## 5. Logging — Sort Added Titles by Units in Draft

- Added **Units in Draft** directly to the **Sort titles** dropdown, not the Logging Library picker.
- Ascending displays zero/fewest pending units first; descending displays most first. Stable index order is retained for ties.
- Per Unit uses `v369Units.length`; Quick uses pending quantity and the appropriate Last Progress delta when available, never the full Library episode total.
- Sorting is presentation-only and does not change draft indexes, recorded History, XP or progress.
- Avoids immediately shuffling cards when the user is focused on an editable input.

## 6. Initial Asc/Desc icons and Automatic MAL Detection icon cleanup

- Sort direction now has a meaningful upward/downward arrow **before the first click**, after toggles and after rerenders.
- Automatic MAL Detection's unmatched, bulk-check, retry-missing, retry-failed, and individual retry controls use semantically appropriate list/check/retry symbols.
- Fixed a clash with the older general-purpose button icon pass, which previously replaced intentionally chosen icons with circle-arrow placeholders.

## 7. Local validation

| Test category | Result | Scope |
|---|---|---|
| JavaScript bundle syntax | Pass | `node --check` during build |
| Logging interactions | Pass | Chromium 390 and 1280px, visibility clicks, selection, expansion, draft values, new sort controls |
| Mixed title/Collection order | Pass | Existing local browser reordering/dragging regression |
| Responsive Personal Order layouts | Pass | 320, 390, 820, 1280, 1920px Chromium |
| AniZip adapter | Pass with fixtures | MAL mapping, past/future episode dates |
| AniList adapter | Pass with fixtures | `idMal` matching, next episode schedule |
| TVmaze adapter | Pass with fixtures | Unique exact title match, aired dates |
| Kitsu adapter | Pass with fixtures | MAL mapping, episode date filtering |
| Automatic fallback | Pass with fixtures | Tenrai missing followed by alternative |
| Live source APIs | **Not verified** | External network unavailable |
| Authenticated Supabase and account-scale performance | **Not verified** | Requires real account/environment |
| Physical Android/iOS/Windows | **Not verified** | Browser fixtures only |

No percentages or real-world API reliability figures are claimed without measurement. Correctly functioning integration adapters cannot guarantee coverage for unavailable third-party episode information.

## 8. Source, compatibility and deployment

- New source: `src/js/components/276-v380-providers-logging-order.js` (registered in `src/js/runtime-order.json`).
- New CSS: `assets/css/197-v380-episode-providers-logging-order.css`.
- Built: `assets/js/mediaflow-v380.bundle.js`, updated index/version metadata and service-worker app-shell cache `mediaflow-pwa-v380-shell-v1`.
- Updated `README.md`, `README2.md`, `docs/CHANGELOG_v380.md` and release metadata.
- No cloud database migrations, new Edge Functions, paid services or OAuth secrets.
- **Local testing:** Extract the ZIP and serve via `python -m http.server 8080`. Back up main-account data before testing source switching against authenticated cloud state.
- **GitHub:** No commits, pushes, or deployment performed. If the owner later commits manually, the requested commit message is `380`.
