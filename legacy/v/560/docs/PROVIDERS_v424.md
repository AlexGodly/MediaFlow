# v424 provider audit — 2026-10-15

This matrix lists integration status, not guaranteed end-to-end availability. A browser implementation cannot safely ship arbitrary third-party secret keys. All actual adapters use HTTPS and must satisfy provider terms and image validation before acceptance. This project uses its own metadata model; artwork is referenced by URL, not copied into Supabase.

| Provider | ID lookup | Search | Artwork | Integration classification | Notes / documentation |
|---|---|---|---|---|---|
| Tenrai | MAL anime/manga | Yes | Yes | Existing-adapter, live validation required | https://api.tenrai.org/ |
| Jikan | MAL anime/manga | Yes | Yes | Experimental | https://docs.api.jikan.moe/ ; bounded to fewer than documented 60/min |
| AniList | AniList/MAL | Yes | Yes | Experimental | https://docs.anilist.co/guide/rate-limiting ; currently 30/min degraded, configured 18/min before safe margin |
| Kitsu anime database | Kitsu | Yes | Yes | Experimental | https://kitsu.docs.apiary.io/ ; not the unrelated Kitsu software API |
| TVmaze | TVmaze/IMDb | Yes | Yes | Existing-adapter | https://www.tvmaze.com/api ; 20 requests per 10 seconds per IP, attribution required |
| MangaDex | MangaDex UUID | Yes | Yes | Experimental | https://api.mangadex.org/docs/ ; permitted usage and attribution require verification |
| Open Library | ISBN | Yes | Yes | Existing-adapter; throttle heavily | https://openlibrary.org/dev/docs/api/covers ; 100 non-ID cover requests/IP/5min, use `default=false`; not designed for bulk crawling |
| Google Books | ISBN/volume mapping | Yes | Yes | Experimental | https://developers.google.com/books/docs/v1/using ; key/quota/access and image CORS to be verified |
| SIMKL | SIMKL | Conditional | Conditional | Restricted | https://simkl.docs.apiary.io/ ; usage constraints and credentials |
| Official MAL | MAL | Conditional | Conditional | Requires setup | https://myanimelist.net/apiconfig/references/api/v2 ; credential flow required |
| TMDB | TMDB | Yes | Yes | Requires setup | https://developer.themoviedb.org/docs ; API key and attribution |
| OMDb | IMDb | Yes | Yes | Requires setup | https://www.omdbapi.com/ ; API key |
| TheTVDB | TVDB | Yes | Yes | Requires setup/licensing | https://thetvdb.github.io/v4-api/ |
| Fanart.tv | Mapped IDs | Limited | Yes | Requires setup | https://fanart.tv/api-docs/ |
| Comic Vine | Comic Vine | Yes | Yes | Requires setup | https://comicvine.gamespot.com/api/ |
| Metron | Metron | Yes | Yes | Requires setup | https://metron.cloud/ ; authentication and quotas |
| AniDB | AniDB | Conditional | Conditional | Restricted | https://wiki.anidb.net/HTTP_API_Definition |
| AnimeSchedule | Conditional | Conditional | Conditional | Research | https://animeschedule.net/ |
| Watchmode | IDs | Conditional | Conditional | Research | https://api.watchmode.com/ |
| Marvel | Marvel IDs | Conditional | Conditional | Research | https://developer.marvel.com/ |
| Wikidata | Wikidata IDs | Yes | Conditional | Mapping source only | https://www.wikidata.org/wiki/Wikidata:Data_access |
| Fribb | MAL/AniList mappings | Dataset | No | Offline mapping candidate | https://github.com/Fribb/anime-lists |
| manami-project | Anime mappings | Historical dataset | No | Archived mapping source | https://github.com/manami-project/anime-offline-database |
| Library of Congress | Bibliographic | Yes | Selective | Bibliographic only | https://www.loc.gov/apis/ |
| German National Library | Bibliographic | Yes | Selective | Bibliographic only | https://www.dnb.de/ |
| Bibliothèque nationale de France | Bibliographic | Yes | Selective | Bibliographic only | https://api.bnf.fr/ |
| Crossref | DOI | Yes | Not a general cover API | Bibliographic only | https://www.crossref.org/documentation/retrieve-metadata/ |

**Rate-limit guarantees:** This implementation schedules recovery requests per adapter, with safety margins and retry-after cooldowns. Image loads and unrelated MediaFlow modules or other user devices can still share provider/IP quotas. Treat production availability as conditional until smoke-tested in browsers against real APIs, without exceeding their policies. Providers may change limits without notice.
