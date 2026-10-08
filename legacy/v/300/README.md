# MediaFlow v300 — Logging Intensity Visibility & Settings Repair

Built directly from v299, preserving v298/v299 functionality.

- Fixed a v299 packaging/runtime scope error: the Logging Intensity subsystem is now initialized inside MediaFlow’s main application closure, where its Dashboard, Settings, XP and persistence APIs exist.
- Dashboard: Logging Intensity slider appears above Next Task/logging by default, with five selectable levels and current XP multiplier.
- Settings → Leveling & XP: the current-level slider and five configurable XP multipliers are inserted into the real leveling section instead of being orphaned at the page end.
- Settings → Dashboard Sections: Show/Hide Logging Intensity preference, under On This Day, preserved across saves and cloud sync.
- LV5 title reroll escape now only activates when a finite recommended title has fewer remaining units than the task requires.
- Preserves v299 Current rerolls history modal scrolling/responsiveness repairs.
- Updates v300 PWA/service-worker cache and release metadata; no persistence schema bumps.
