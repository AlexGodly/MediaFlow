# MediaFlow v464 Stable — External Ratings in MediaFlow Recommends

## Recommended title ratings
- Display every available supported external rating for the current recommended title, each with its own distinct, themed v450 provider mark.
- Preserve scores in **original provider scales** (IMDb /10, Rotten Tomatoes critics/audience /100, MyAnimeList /10, AniList /100, Kitsu /100, Google Books /5, and all other stored v437/v450 ratings). Show genuine vote counts and source labels where available.
- Keep **your personal Library rating completely separate**: neither calculation nor database writes change it.
- Read already saved `universalMetadata.externalRatings` first (manual entries clearly marked as user-entered; verified values identified).
- If missing, quietly and asynchronously check the **enabled, configured** Metadata Recovery sources capable of ratings (Jikan/MAL, AniList, Kitsu, TVmaze, VNDB, plus available OMDb, TMDB, Trakt, SIMKL and MAL Official gateway sources).
- Accept only existing v439 identity evidence at **confidence ≥ 0.97**: exact title plus verified matching external ID or release year. Conflicting equal-confidence provider records are omitted; invalid scores, vote counts, and unmatched records are rejected. A provider timeout or outage cannot prevent the recommendation from rendering.
- Rate-limited adapters and bounded gateway availability checks are reused. Check only the currently recommended title; limit concurrency to two sources. Keep results cached per account/title/provider configuration in session storage and memory, without cloud writes or Library mutation.
- Include a **Refresh ratings** button for the current recommendation and responsive provider cards for desktop, tablet, and narrow phones.

## Unchanged
- v463 per-title fresh episodes statistic, v419 recommendation scoring and rerolls, all Library/Logging/History data.
- Enabled-provider choices and API credentials; private values remain in Supabase. Do not invent provider results or unofficial ratings.

## Quality and release
- Dedicated v464 validation tests for stored/persisted scales, verified exact-ID/year matching, conflict rejection, malformed values, provider configuration, and no Library writes.
- Chromium desktop and 360px mobile regression; v463/v462 UI preserved.
- Release artifact ZIP+SHA256, complete archive `legacy/v/464`, numeric tag `464`.
