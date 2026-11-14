## MediaFlow v555 Stable

### Faster, and built for very large accounts
- Pages open 2–5× faster with 100,000 titles; saving no longer freezes the page (the work moved to a background worker).
- One stylesheet instead of 211 separate files.
- The local safety copy of your data now lives in IndexedDB, so it also works for large accounts.

### External ratings
- Saved IDs are used first, then missing IDs are found (Wikidata links between MAL, AniList, IMDb and TMDB, plus a search with every known name: English, romanized, original and alternate), then every source is checked again with the new IDs.
- Romanized anime titles now find their IMDb and TMDB ratings through the English title.
- Seasons share the whole show's IMDb and TMDB rating.
- Background catch-up handles up to 60 titles an hour and 500 a day, starting with titles that have no ratings at all. Settings also has a "Refresh all missing ratings" button with progress and a Stop button.
- Saved IDs are never replaced, and uncertain matches are skipped rather than guessed.

### External ID finder
- Works without visiting Provider Management first, and shows the real reason when a site fails.
- "All sites" searches every set-up site with every name. Results are grouped per ID, so you pick the right record for each one.

### Interface
- Icon-only Sync button, plus a one-click Full Backup export in the top bar.
- "Add to Logging" opens the real Logging workspace in a popup on any page.
- Background Processes can be minimised to an icon beside the + button, and dragged anywhere.
- The Background Processes menu item now lines up with the other quick actions.
- On This Day has a recovery button that opens the recovery workspace with today's titles selected.

### Data and sync
- Cloud save and reload, Sync Now, Full Backup, automatic export, Settings, Personal Order and Collections import/export, History export, XP recount and the PWA were all re-verified with round-trip tests.
- No changes to the Library, History or backup formats. Older backups still import.
