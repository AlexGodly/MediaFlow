# MediaFlow v336 — Designed Popups & Advanced Active Time Analytics

**Release:** MediaFlow v336  
**Base:** MediaFlow v335 Modular  
**Created by:** Alex Godly

## Designed MediaFlow Popups Added

The reported browser JavaScript popups have been replaced with proper MediaFlow-designed dialogs.

These now use a theme-aware modal presentation instead of the default browser popup style.

## Empty Workspace Confirmation Redesigned

The **Start with an empty MediaFlow workspace?** confirmation now opens as a designed MediaFlow dialog.

It keeps the same protection purpose while matching the rest of the app visually.

## Profile Name Update Success Popup Redesigned

The **Name updated successfully.** popup now uses a custom MediaFlow dialog instead of a browser alert.

This gives account-management success feedback a cleaner presentation.

## Designed Dialog Styling

The new popup style includes:

- MediaFlow-themed header and icon treatment.
- Clear title and explanation text.
- Styled action buttons.
- Overlay/escape handling.
- Responsive layout.
- Dynamic-theme compatibility.

---

## Active Time Spent Component Expanded

The v335 Active Time Spent component design has been preserved as the base and expanded rather than replaced.

The overall style remains familiar, but it is now more informative and visually richer.

## Progress Bar Added

A new progress bar has been added to the Active Time Spent component.

It shows progress toward the next active-time milestone while keeping the v335 look and feel.

## Next Milestone Summary Added

The component now shows:

- current milestone progress,
- next milestone target,
- completed amount inside the current milestone window,
- percentage progress.

---

## Active Time Range Selection Added

You can now choose which time window to inspect inside Active Time statistics.

Available range options:

- **Last 30 days**
- **Last month**
- **Last year**
- **Custom** date span

## Custom Date Span Support Added

When **Custom** is selected, MediaFlow shows date inputs and an **Apply** action so you can inspect a specific time window.

---

## New Time Summary Cards Added

The Active Time section now includes range-based summary cards for:

- total time in selected range,
- average time per day,
- most active day,
- time XP earned in the selected range.

## Active Day Count Added

The range summary also surfaces how many days in the selected range contained recorded foreground activity.

---

## Trend Chart Added

A new trend visualization has been added to show active-time progression through the currently selected date range.

Behavior adapts to the chosen span:

- shorter ranges use more granular day-based bars,
- longer ranges use aggregated month-based bars.

## Time by Page Chart Added

A new breakdown chart shows where time was spent across MediaFlow pages.

Examples include:

- Dashboard
- Library
- History
- Statistics
- Settings
- Profile
- Personal Order

## Time by Action Chart Added

A new action breakdown chart shows what kind of activity consumed your foreground time.

Examples include:

- Browsing
- Logging
- Editing titles
- Managing collections
- Changing settings
- Viewing analytics
- Reviewing history

## Weekday Rhythm Chart Added

A weekday distribution chart has been added so you can quickly see which days of the week account for most of your recorded activity.

## Last 7 Days Chart Preserved

The previous seven-day quick view remains available, so the richer range analytics are added without losing the recent weekly snapshot.

---

## Page-Time Tracking Added

The active-time ledger now records time distribution by MediaFlow page in addition to total foreground time.

This makes it possible to generate page-based analytics for the selected date range.

## Action-Time Tracking Added

The tracker now also records a higher-level action context so foreground time can be grouped into practical behavior categories such as logging, editing, settings and collections.

## Merge Protection for New Analytics Data Added

Cloud/device merge behavior has been extended so the new page/action active-time breakdowns are preserved alongside the existing v334/v335 active-time totals.

---

## Live Totals Preserved

The primary live total active time and live time-XP values still update through the existing active-time tracker.

## Existing Tracking Rules Preserved

v336 does **not** change the core foreground tracking rules introduced earlier.

The following remain the same:

- no idle timeout,
- no daily active-time cap,
- no daily time-XP cap,
- hidden/background tabs do not count,
- existing periodic save/checkpoint behavior remains intact.

## Responsive Support Improved

The new charts, range controls and dialog system are responsive for desktop, tablet and mobile layouts.

## Dynamic Theme Compatibility Preserved

The new analytics and popup system remain compatible with MediaFlow’s theme system.

## Reduced-Motion Respect Added

The new dialog and analytics presentation respects reduced-motion preferences.
