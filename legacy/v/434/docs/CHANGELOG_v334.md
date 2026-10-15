# MediaFlow v334 — Dashboard Navigation & Expanded XP Progression

**Release:** MediaFlow v334  
**Base:** MediaFlow v333 Modular  
**Created by:** Alex Godly

## Dashboard Scroll Restoration Fixed
- Switching to Dashboard now immediately resets the page scroll position to the top.
- Reset is enforced again after the Dashboard view is rendered to avoid inheriting the previous page's scroll position.
- Re-rendering Dashboard in place (logging, controls and other interactions) preserves the user's current scroll position rather than jumping back to the top.
- Desktop sidebar and mobile Dashboard navigation are covered.

## Runtime Calculator Mode Icons Improved
- **Carry-forward** uses a directional carry/forward arrow icon.
- **Multi-row** uses a stacked-rows icon.
- Calculator behavior and saved calculator state remain unchanged.
- Icons scale for mobile layouts and follow the active theme.

## Active App Time XP Added
- Earn configurable XP for each minute MediaFlow is active in a visible browser tab/PWA window.
- No idle timer or inactivity cutoff: time continues counting even without mouse or keyboard interaction while the app is foregrounded.
- No daily time limit, XP limit, or cumulative XP cap.
- Background/hidden tabs do **not** earn foreground time.
- Active time XP uses the existing day-streak XP multiplier (1 + 0.10 × log2(streak), rounded using v149 rules).
- Fine-grained fractional progress is retained, so partial minutes eventually earn their full configured reward.
- Time XP is persisted in the existing account XP ledger. Local checkpoints occur frequently and normal cloud saves/checkpoints preserve it across reloads.
- Automatic XP-only cloud checkpoints run approximately every 10 minutes to avoid repeatedly uploading very large Library snapshots. Existing user actions can also sync time XP with their regular saves.
- Foreground-time calculation does not add extra consumption History sessions and does not change the logging stopwatch.

## First-Time Title Start XP Added
- New configurable one-time bonus when an existing, previously unstarted Library title becomes active/receives its first progress.
- A newly created active title added through Dashboard logging also earns the one-time start bonus.
- Reward IDs are retained so toggling a title back and forth cannot repeatedly grant first-start XP.
- Importing an already-started title does not retroactively grant first-start XP.
- This reward is separate from New Library Title XP, consumption XP and completion XP.

## Collection XP Added
- **Create collection XP** rewards the initial creation of a new Collection.
- **Edit collection XP** rewards a meaningful edit to an existing Collection.
- Edits include saved metadata and adding/removing/reordering titles.
- Saving a metadata editor without actual changes does not award edit XP.
- Collection editing has no daily reward cap.
- Collection IDs and edit ledgers are stored in the existing cloud-backed XP ledger.

## New Leveling & XP Settings
All rewards have their own configurable field in Settings → Progression → Leveling & XP:
- **Active app time XP / minute:** default 2.
- **First-time title start XP:** default 40.
- **Create collection XP:** default 35.
- **Edit collection XP:** default 10.

Setting XP leveling to disabled also disables new reward grants. Resetting Leveling settings restores the v334 defaults. Already earned credits remain in the ledger.

## Statistics — Active Time Spent
- A new **Active Time Spent** panel is shown directly below the Leveling card.
- Shows lifetime foreground app time, time-earned XP, today's time, current streak multiplier, configured XP rate, first-start XP and Collection XP totals.
- The primary lifetime time and time XP fields refresh while tracking continues.
- Uses existing theme colors, card surfaces, typography and responsive layouts.

## Statistics Component Visibility Settings
- Settings → Statistics → Statistics Components now includes **Active time spent in MediaFlow**.
- Can be shown/hidden independently of the Leveling card.
- The setting persists using the existing Settings/Cloud Sync/backup infrastructure.

## Cloud Synchronization and Backups
- Extended the existing `xpLedger` with v334 active-time and event-reward records.
- Included in the normal Cloud Sync snapshot, Full Data JSON export/import, and restoration of application state.
- Extended merge behavior to retain v334 ledgers when reconciling an older backup or another client.
- New rewards feed into the existing cached XP and level calculations and XP breakdown.
- No database schema migration and no new Supabase tables or Edge Functions are required.
- Retains the v333 Supabase project configuration.
- **Cloud Sync Schema:** 201 (unchanged).
- **Full Backup Schema:** 29 (unchanged).
- **Settings Preset Schema:** 1 (unchanged).

## Release / Deployment Updated
- Active bundle: `assets/js/mediaflow-v334.bundle.js`.
- Version marker, VERSION, version.json and package.json updated to 334.
- PWA shell: `mediaflow-pwa-v334-shell-v1`.
- Rebuilt service-worker app-shell manifest to point at the v334 bundle and v334 CSS file.
- Added rebuild-safe runtime source `src/js/components/232-v334-dashboard-xp-active-time.js`.
- Added theme-aware styles `assets/css/161-v334-active-time-dashboard.css`.
- Legacy versions and documentation remain in the distribution.

## v334 Release Summary
- Fixed Dashboard loading at the previous page's scroll position.
- Improved Runtime Calculator mode icons.
- Added uncapped foreground app-time XP with the existing streak multiplier.
- Added one-time title-start XP.
- Added configurable collection create/edit XP.
- Added independent Active Time Spent Statistics component and visibility toggle.
- Preserved MediaFlow v333 features, Supabase configuration, and existing backup/cloud schemas.
- Updated the PWA release files and validated JavaScript syntax and targeted runtime behavior.

**Version Progression:** v331 Personal Edition → v332 Dedicated Supabase → v333 New Supabase Project → **v334 Dashboard navigation & expanded XP progression.**

**Tracking note:** Time XP represents visible/foreground app time, not stopwatch or consumption runtime. It does not award hidden-tab time and does not retroactively calculate time spent in old versions.
