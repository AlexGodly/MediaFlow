## MediaFlow v559 Stable

### TMDB finds covers again
- TMDB is now on for **Find cover automatically** (title editor, title details and the dashboard's missing-cover card) and for cover recovery (Recovery Workspace and Unified Recovery). It no longer shows as "off for background recovery".
- Titles that already have a TMDB ID ask TMDB first, using that ID.
- TV shows whose TMDB ID was saved in the movie field are now looked up as TV shows, so they get their real poster instead of nothing.
- If TMDB can't find a title by its saved ID, it now falls back to searching by title instead of giving up on TMDB entirely.
- Recovery waits briefly and retries when the gateway asks it to slow down, instead of marking the title as unresolved.
- You can still turn TMDB off for recovery in the recovery settings; this release only switches it on once.
