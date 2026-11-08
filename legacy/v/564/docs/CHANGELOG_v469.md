# MediaFlow v469 Stable — Background Processes Mobile Floating-Control Collision Fix

## Problem
On phones, the unified Background Processes widget shared the lower corner of the viewport with the + Quick Actions control and the Task Progress widget, covering the controls and obscuring tap targets.

## New mobile layout (width ≤720px)
- Put a **compact Background Processes launcher** in the upper left/right corner, underneath the mobile header, separate from the Task Progress / + bottom floating dock.
- Respect existing saved **Left/Right** preference and **Hidden/Auto/Always Show** visibility. No preference migration or persistence change.
- Tapping the compact launcher opens a scrolling, theme-native recovery panel downward, rather than into the bottom dock.
- Automatically measure available vertical space between the top recovery widget and the **highest point of the bottom quick dock / expanded task card**. Limit the open recovery panel to the measured free space, using internal scrolling for Cover/Metadata recovery actions.
- While the **+ Quick Actions sheet** is open, temporarily hide the Background Processes launcher so it cannot cover action options or intercept touches. Restore it immediately when the sheet closes. Actual Cover/Metadata jobs and recovery checkpoints continue unaffected.
- For exceptionally short mobile landscape layouts where even a 54px launcher cannot fit above the expanded task panel, hide only the launcher temporarily, then show it again when there is room.
- Support mobile safe-area insets, visual viewport resizing, orientation changes, narrow 320px widths, and prefers-reduced-motion.
- Keep the original desktop floating widget **completely unchanged**.

## No regression
- v462 safe authenticated first-paint gate remains active; no early wrong-position flash.
- No changes to Cover Recovery, Metadata Recovery, provider calls, task status, quick action handlers, cloud data, or user theme variables.
- Automated regression for mobile top dock placement, max-height, + menu, short viewport, collapsed/expanded task state, left/right preferences, desktop parity, cloud-free presentation.
- Chromium desktop plus 320/360/390/720px mobile visual geometry checks.
- Complete source archived under `legacy/v/469`, numeric tag `469`, release ZIP and SHA256.
