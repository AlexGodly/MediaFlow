## MediaFlow v575 Stable

### Lighter on the database
- Besides saving each title and log on its own, MediaFlow keeps one complete copy of your account as a safety net. That copy is several MB, and it was rewritten every 3 minutes and every time you switched away from the tab, which used up the free Supabase project's disk budget. It's now rewritten at most every 30 minutes (and when you leave the tab only if the last copy is at least 10 minutes old). Your data is saved exactly as before; only the extra copy is rarer.
