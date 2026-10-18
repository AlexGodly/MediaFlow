# MediaFlow v467 Stable — Refresh External Ratings Anywhere + Authentic Provider Logos

## One-click refresh for any saved title
- **Edit Title**: New **Refresh external ratings** action inside Universal Metadata → External ratings, directly beside the rating fields.
- **Title Details (including anime)**: Same action and live external ratings presentation even for titles without saved external rating values.
- **Add Title**: The button is visible but disabled until the new title is saved to the Library, with a clear explanation; no untracked title or empty ID is submitted.
- One-click refresh checks up to four currently configured/ready v439/v450 metadata providers through the existing bounded adapter/evidence system; only verified, provider-owned rating values and vote counts are eligible for updates. Manually protected/entered ratings and personal ratings are never overwritten.
- Shares v442 account-wide recovery locks/cooldowns, preventing overlap with full recoveries, quick recovery and the v466 automatic recommended-title refresh. No extra service, schema migration or API keys.
- Updates score fields in an open Edit Title **without closing the editor**. Any unsaved user-edited inputs are preserved; Title Details and MediaFlow Recommends refresh their displayed ratings live.
- No automatic refresh of unrelated metadata or External IDs. No recommendation rerolls, progress/history changes.

## Actual rating-provider logos throughout MediaFlow
- Replaces v450's textual provider marks with original brand SVG shapes from Simple Icons (locally bundled, usable offline). This updates **MediaFlow Recommends**, **Add/Edit Title**, and **Title Details** through their shared provider mark renderer.
- Distinct authentic providers include IMDb, Trakt, Rotten Tomatoes (both score types), MAL, AniList, Kitsu, TMDB, SIMKL, Metacritic, Letterboxd, Goodreads, StoryGraph, IGDB, OpenCritic, Steam, MangaUpdates, Discogs and Audible.
- For niche providers not available in the local icon library (AniDB, TVmaze, Hardcover, Backloggd, VNDB, Rate Your Music, IFDB, RAWG, Google Books), request the provider's actual favicon via the public favicon cache when online; retain an accessible fallback for offline/unavailable logos.
- Icons identify their trademark holders; not an endorsement. Source score original scales, votes and verification labels unchanged.
- Desktop, tablet and 360px mobile layout, dynamic theme colors and keyboard accessibility retained.

## Release
- Test rate-limit safety, cross-process locks, concurrent scan prevention, exact-match verification, partial provider errors, unsaved title behavior, and editor draft-preservation.
- Complete archive `legacy/v/467`, numeric GitHub Release `467` with full source ZIP and SHA256 checksum following successful Pages deployment.
