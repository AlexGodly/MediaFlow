## MediaFlow v561 Stable

### Live logging with the MediaFlow app
- When logging is open on the website, a log you continue in the MediaFlow app (Android, Windows, iOS) now shows up here within a few seconds: the title, amounts, progress, units and notes. You no longer have to wait for the next sync.
- It works both ways. What you type here reaches the app within a second, and the app checks every few seconds while its Log page is open.
- If you start, reroll or end a recommendation in the app, the website follows right away.
- The newer draft wins, and itemised (per-unit) drafts of the same session are merged unit by unit, as before.
- Something you're typing on the website is never replaced while you type.
- This uses the per-record cloud storage from v556 and needs no database change.

### Time in the MediaFlow app earns XP
- Time spent in the MediaFlow app counts like time on the website: the same XP per minute, times the day's streak multiplier, with no idle timeout and no daily cap. It counts toward your total XP and level.
- App time is stored apart from website time, so neither overwrites the other.
- **Statistics → Active time** now shows website time and app time separately, with a breakdown by platform (Android / Windows / iOS).
- **XP history** lists "MediaFlow app time" per day.

### Troubleshooting
- `MediaFlowV561.stats()` in the browser console shows the live logging checks.
- `MediaFlowV561.appTime()` shows the app time totals.
