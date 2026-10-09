# MediaFlow v317 — XP Controls, Title Starts, Statistics Hierarchy & Community Refresh

**Based on:** MediaFlow v316 Community Modular (Community Beta)  
**Released:** October 8, 2026  
**Developer:** Alex Godly

## XP Settings, Fixes and Defaults

- Fixed the missing **Active Time XP** configuration in Settings → Leveling & XP. v316's wrapper patched an old `renderSettings()` function; the actual v221 registered Settings page renderer bypassed that wrapper. v317 attaches the existing v316 options to the correct card within the active renderer.
- Available time settings: Enable Active Time XP (on); Minutes per reward (10); XP per interval (5); Idle timeout (5 min); Multiply by media streak (on). No daily XP cap. Rewards only accrue through the existing v316 authenticated server heartbeat.
- Default episode consumption increases from **10 to 20 XP per episode**, with the existing independently configurable Episode XP input still available. Existing users on exactly 10 XP upgrade once; custom values besides 10 remain unchanged. Previously logged XP can be rebuilt using Calculate XP Now if desired.
- New **Start a title XP** field: 50 XP default, editable from 0 to 100,000. First-start detection recognizes planned→started status, first progress, and adding a new already-started title. A per-title event ledger prevents multiple bonuses when pausing/resuming.
- Starting an existing active title from an imported or previously completed Library is not automatically retroactively rewarded. Rewards are saved in `S.xpLedger.titleStarts`, combined uniquely by title ID in cloud state merges and retained via existing general-purpose backup and state export serialization.
- Runtime XP calculation and Calculate XP Now now reflect configurable episode values, title-start bonuses, and previously accrued time-based XP. User profile XP publishing uses the same XP total and Level, allowing rankings to track updates where public profile sharing is enabled. Offline time remains in the v316 server ledger, not the local title-start ledger.
- Statistics Leveling totals now include explicitly labeled **Started title XP** and **Active-time XP** alongside their existing historical components.

## Statistics Component Order

1. User Profile — titles, sessions and hours consumed.
2. Time Spent in MediaFlow — active-time history/XP.
3. Lifetime Achievements.

Visibility toggles continue to control whether each component is displayed; v317 changes the order without activating hidden cards.

## Browse / Community Live Refresh

- Added theme-aware **Refresh now** buttons on Browse Titles, Community Collections and Users/Rankings.
- Button fetches current results directly through the corresponding existing Supabase RPC and refreshes the visible result list without resetting search, sort, filtering, page or layout view.
- Automatic refresh runs approximately every 120 seconds if the relevant public view is visible and the user is not editing an input; tab reactivation can also trigger a refresh once due.
- Existing Ratings revision probe (45s) and optimized user ranking revision probe (50s) continue to run. Freshness checks do not expose hidden/private user data.
- Errors show a failure message rather than silently replacing the result list.

## Technical integration / compatibility

- Runtime extension `src/js/components/242-v317-xp-layout-live-refresh.js` after v316 in runtime order; matching responsive CSS `assets/css/174-v317-progression-refresh.css`.
- Build, manifest and React chrome updated to version 317, with versioned main JavaScript and `mediaflow-pwa-v317-shell-v1` service-worker cache. Existing category icons and media assets remain packaged.
- **No new SQL migration**, provided the existing v316 time-XP migration and previous Community schema are present. No new cloud data schema version.
- Cloud Sync v201; Full Backups v29; Settings Presets v1; Personal Order v5; Collections v2.

## Tested

- New v317 isolated Chromium test: 69 assertions across 1440px, 390px and 320px.
- v316 time-XP behavior revalidated against the v317 bundle: 82 assertions.
- Browse / Quick Add regression against v317: 39 browser assertions.
- Workspace / Collections regression against v317: 54 assertions.
- All source fragments build to a valid bundled JavaScript asset; no uncaught browser errors observed in the dedicated v317 suite.
- Live multi-user Supabase interaction remains untested in these isolated browser harnesses.
