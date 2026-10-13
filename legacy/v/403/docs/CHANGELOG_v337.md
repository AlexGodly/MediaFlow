# MediaFlow v337 — Dual Time & XP Milestones

**Release:** MediaFlow v337  
**Base:** MediaFlow v336 Modular  
**Created by:** Alex Godly  
**Supabase:** Existing v333+ personal cloud project preserved

## Bonus XP Earned Panel Removed from Active Time Spent

Removed the **Bonus XP earned** panel from Statistics → Active Time Spent.

The removed panel previously displayed:

- First-episode XP
- First-title-start XP
- Collections-created XP
- Collections-edited XP

This is a presentation change only. **The underlying XP rewards, configurable values, accumulated XP and cloud data remain unchanged.** Bonus XP continues contributing to MediaFlow's existing progression totals and is not deleted.

## Seven-Day Activity Chart Expanded

With the bonus XP panel removed, the existing compact activity chart can use the full row rather than sharing space with the removed bonus panel.

This provides more room for recent daily activity without affecting the other v336 charts.

---

# Two Separate Milestone Progress Bars

## Time Milestone Progress Preserved

The existing **Next Time Milestone** progress bar remains available.

It continues to show:

- The next accumulated active-time milestone.
- Time earned within the current milestone interval.
- Progress percentage.
- The previous completed milestone.

The progress display follows the existing MediaFlow theme.

## Time Milestone Extension Added

Milestone progression now continues beyond the original preset targets rather than becoming permanently full when total active time reaches the highest preset.

## New Time XP Milestone Progress Added

An additional progress bar now tracks **XP earned specifically through active application time**.

This is separate from the time milestone and separate from the total XP earned from titles, collections or other rewards.

The second progress card appears alongside the existing time milestone on larger layouts and beneath it on smaller screens.

## Time XP Milestone Targets Added

The time-XP milestone ladder includes:

- 100 XP
- 250 XP
- 500 XP
- 1,000 XP
- 2,500 XP
- 5,000 XP
- 10,000 XP
- 25,000 XP
- 50,000 XP
- 100,000 XP
- 250,000 XP
- 500,000 XP
- 1,000,000 XP

Additional targets are generated beyond the preset ladder when needed.

## Time XP Milestone Progress Details Added

The new progress card displays:

- The next time-XP milestone target.
- XP earned since the previous milestone.
- The total XP needed across the current milestone interval.
- Completion percentage.
- The previous milestone achieved.

For example, at 620 time-earned XP, the next milestone is 1,000 XP and progress within the 500–1,000 XP interval is 120 of 500 XP, or 24%.

## Streak XP Compatibility Preserved

The XP milestone uses the **time XP already awarded by MediaFlow's existing streak-multiplied time tracking system**. It does not introduce another multiplier or award XP merely for crossing a milestone.

## Live Milestone Updating Added

Both progress bars now refresh alongside the existing active-time XP tick, without rebuilding the entire Statistics page.

The bar values, completion percentages, and targets update as new foreground time is recorded.

## Milestone Accessibility Improved

The new XP bar includes an accessible progress indicator, descriptive label and current percentage.

---

# Active Time Spent Design Preserved

## v335/v336 Visual Design Preserved

The original Active Time Spent styling remains in place:

- The activity heading and foreground tracking badge.
- Lifetime active time summary.
- Time XP earned summary.
- Today's activity.
- Streak multiplier.
- Configured XP earning rate.
- Date-range controls.
- Range-based summaries.
- Activity trend chart.
- Time by page chart.
- Time by action chart.
- Weekday rhythm chart.
- Compact recent-activity view.

## Responsive Milestone Layout Added

The pair of progress cards uses two columns on wider screens and a single column on narrow mobile screens.

## Dynamic Themes Preserved

Both progress cards use MediaFlow's existing surface, border, accent, and text tokens.

## Reduced-Motion Support Preserved

Motion preferences remain respected.

---

# XP, Cloud Sync & Data Compatibility

## Reward Data Preserved

Removing the Bonus XP panel does not disable or remove:

- First-episode XP.
- First-time title-start XP.
- Collection creation XP.
- Collection editing XP.
- Existing configured XP rewards.

## No Database Migration Required

The new Time XP progress display uses values already present in the existing `xpLedger`.

No Supabase SQL migration or additional cloud table is needed.

## Existing Supabase Project Preserved

v337 retains the existing v333+ personal cloud configuration.

## Existing Schemas Preserved

| System | Version |
|---|---|
| Cloud Sync | 201 |
| Full Backup | 29 |
| Settings Preset | 1 |

---

# Release & PWA Updates

## New Runtime Module

`src/js/components/235-v337-active-time-dual-milestones.js`

## New Stylesheet

`assets/css/164-v337-active-time-dual-milestones.css`

## JavaScript Bundle Updated

`assets/js/mediaflow-v337.bundle.js`

## VERSION Updated

**337**

## version.json Updated

Application version and build metadata report **337**.

## PWA Shell Updated

`mediaflow-pwa-v337-shell-v1`

## Service Worker Updated

The service worker now references the active v337 bundle and stylesheet.

---

# v337 Release Summary

- Removed the Bonus XP earned panel from Active Time Spent.
- Preserved all underlying bonus XP awards and ledger records.
- Expanded the recent activity chart into the vacated space.
- Preserved the time milestone progress bar.
- Added a dedicated **Time XP** milestone progress bar.
- Added scalable XP milestone targets.
- Added next XP target, interval progress and percentage readouts.
- Added live progress updates to both milestone bars.
- Preserved v336 time ranges and all activity analytics.
- Preserved no-idle-cap and no-daily-cap time tracking.
- Preserved the current Supabase configuration and cloud schemas.
- Updated bundle, release metadata, and PWA cache to v337.

## Version Progression

**v335** → Statistics UI redesign and XP configuration polish.  
**v336** → Designed popups and advanced active-time analytics.  
**v337** → **Dual time/time-XP milestones, removal of Bonus XP Earned panel, and expanded recent activity layout.**

**Validation:** JavaScript syntax, browser regression checks, responsive milestone layout, and ZIP integrity checked. Live GitHub Pages deployment and real Supabase login/synchronization are not yet verified.
