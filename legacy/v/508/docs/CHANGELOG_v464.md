# MediaFlow v464 Stable — MediaFlow Recommends: External Ratings Integration

## Dashboard: actual saved external ratings
- New responsive, theme-aware **External ratings** insight in the recommended title card, between title progress and category statistics.
- Show source-specific scores in their **original scales** (IMDb /10, AniList /100, Goodreads /5, VNDB /100, etc.), original source labels, recorded vote counts and **Verified provider / Manually entered / Saved unverified** provenance badges.
- Show the weighted normalized **verified-source average (/100)** only when one or more genuinely provider-verified ratings exist. With only one verified source it is explicitly described as a single-source normalized score, not a consensus.
- With no saved ratings, explain how to populate the already-existing Universal Metadata fields or verify them using Recovery. This update intentionally **does not** invent live ratings or issue any external API request during Dashboard rendering.
- Personal score is always kept separate. Invalid source scales, out-of-range scores and missing/unsafe provider evidence are ignored for aggregation.

## Settings → Title Recommendations
- **Show external ratings**: enabled by default; can hide the display without deleting saved ratings.
- **Use verified ratings for future recommendations**: Off by default (identical existing ranking), Light (bounded ±4 points), Balanced (bounded ±8 points).
- A transparent confidence adjustment rewards multiple verified providers with actual vote evidence rather than overvaluing a single obscure source.
- **Personal Order takes priority**; existing statuses, category matching, Fresh Episodes, priority, personal rating and task history continue working as before. Preferences are saved through existing cloud-backed settings. Current title is not silently rerolled when options change.

## Reliability
- Read-only v437/v450 metadata integration and cached parsing keyed by metadata revision for very large libraries.
- No automatic network requests, score writes, schema migration or changes to third-party credentials.
- Comprehensive deterministic and desktop/360px mobile Chromium regressions, complete archived source at `legacy/v/464`, numeric Release `464` with ZIP and SHA256.

Next version **v465** is available for follow-up improvements.
