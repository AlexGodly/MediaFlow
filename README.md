## MediaFlow v438 — Unified API Providers & Testing

This is the v438 personal web/PWA edition of MediaFlow by Alex Godly.

- **API Providers & Testing** is now its own Settings Center category. Existing authenticated Supabase gateway tests were moved out of Cover Recovery with credentials and prior approved connections preserved.
- The shared provider directory covers movies, TV, anime, manga, books, comics, video games, visual novels, music/albums and interactive fiction, with honest implemented-vs-planned states.
- Public connectivity tests are manual, rate-conscious and read-only. Catalog entries never automatically activate new recovery adapters.
- Cover Recovery retains its own enabled sources, provider priority, safeguards and preferences.
- v437's universal title metadata, external ratings, field protection, cloud state and backup compatibility are preserved.
- Automatic Metadata Recovery comes in v439; v438 does not auto-populate title fields or change personal scores.

See [v438 release notes](docs/CHANGELOG_v438.md). Each full version archive lives under `legacy/v/<version>/` and is excluded from GitHub Pages deployment.
