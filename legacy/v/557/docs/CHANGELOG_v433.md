# MediaFlow v433 Beta — Provider Registry & External ID Foundation

## Scope: Infrastructure FIRST, credentials/live testing in v434

- Prepared one unified provider catalog covering IMDb-linked TMDB/OMDb, Fanart.tv, AnimeSchedule, Trakt, Comic Vine, Metron, Hardcover, Podcast Index, EpisoDate, TheTVDB, SIMKL, MAL, MangaDex, Grand Comics Database, Royal Road RSS, MangaUpdates, LiveChart, AniList, Wikidata, AniDB, Marvel, national libraries, Crossref, Watchmode, Fribb mappings, Inventaire, BnF and Gutendex.
- Added 52 new user-editable External ID fields, including distinct book/edition, comic series/issue, TV series/episode, ISBN/DOI, RSS and library identifiers.
- Added searchable External ID fields to Add/Edit Title, with protection for existing values and manual overrides.
- Added a multi-ID matching/persistence pathway across the existing validated Find Cover picker, Dashboard cover selection, Title Details and automatic Cover Recovery. Multiple IDs must be actually supplied by the same provider record, not guessed from title similarity.
- Existing single-ID candidates remain compatible. Automatic linking still requires the existing strict direct-ID match; title-only candidates stay in the human-review queue.
- Added a staged-provider status section inside the existing theme-aware Cover Recovery Settings. New providers remain **disabled until v434**; the existing six tested public providers are unchanged.
- Added a prepared authenticated, fail-closed, single-function Supabase gateway SOURCE, without deploying it or accessing Supabase secrets.
- Google Books remains skipped as requested; paid IMDb API is not required for IMDb ID matching.

## Security and stability
- Never overwrite a conflicting External ID.
- Protect intentionally cleared/manual IDs against automatic overwrite.
- Validate identifier formats, limit candidate-supplied IDs, avoid fabricated cross-provider mappings.
- No automatic real-time external requests added in v433.
- No database migration, key exposure or live provider activation.
- Preserve existing cloud backups, exports/imports, theme, old Cover Recovery and Find Cover behavior.

## v434 (separate update)
Finish API key registration, verify rights/quotas, deploy authenticated gateway, add real provider adapters, conduct controlled live searches, enable providers individually after passing tests.
