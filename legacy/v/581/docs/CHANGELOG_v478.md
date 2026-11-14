# MediaFlow v478 Stable — Fully Visible Background Processes Launcher

## Issue (screenshots)
The redesigned v476 Background Processes widget contained an icon, the title **Background Processes**, the status **1 process active**, and two separate progress indicators, but on compact screens and while the Task Progress/+ dock repositioned it the launcher was clipped. Screenshots show the status reduced to a lone green dot or truncated text. The affected paths were the closed widget's mobile CSS and its v469 room-height assumptions.

## Root cause
v469 calculated `--mf469-room` and hid its original one-line 49–52px widget only if fewer than **54px** were available. v476 turned that launcher into a **two-row, roughly 116px monitor**, with separate Cover/Metadata percentages. The v469 height cap still applied to the *entire* widget, and v476 later widened its CSS layout without updating the room-safety threshold. This could clip the header or display only a dot.

## v478 fix
- Collapsed Background Processes now has a **full-width, complete two-row header**. The icon, **Background Processes** title, `1 process active` status, both **Covers %** and **Metadata %**, and their separate progress bars remain visible. No more shrinking to icon/dot-only slivers or ellipsis of the title and status.
- Use an appropriate minimum width (up to 292px on mobile, capped to the viewport minus 20px). Title and status wrap only naturally when necessary; metric values cannot disappear. Compact 320/340/360/390px viewports remain supported.
- Remove the obsolete `max-height` clip and width animation from **collapsed** mode. Expanded mode retains its own scrollable recovery monitor, button grid, v477 footer and existing controls.
- Extend the v469 mobile collision guard to measure the **actual, rendered header height**, not a hard-coded 54px. When a small landscape viewport or expanded Task Progress/+ dock leaves insufficient vertical space, temporarily hide the *whole visual widget* instead of cropping it. Automatically restore it when room returns. Recovery jobs continue uninterrupted.
- The widget position (left/right), Hidden/Auto/Always preference, cloud state, theme colors, reduced-motion settings, PWA login continuity, Cover/Metadata engines and their percentages, checkpoints and pause/resume/stop functions are unchanged.

## Automated verification
- `node scripts/test-v478-launcher-visibility.cjs`: complete title + twin metric CSS, room guard hide/restore, no account writes.
- `node scripts/test-v478-browser.cjs`: live Chromium at desktop and mobile 320/360/390/720px. Verifies title/status are fully visible, progress percentages and bars present, no clipping or page overflow, and simulated Task Progress dock collision hides/reveals the whole widget. Reruns full v462–v477 browser regressions.
- PWA build, `version.json`, service worker, offline-cache rollback checks; verified archive in `legacy/v/478`.
- Numeric Stable tag `478`, GitHub Pages deployment, source ZIP + SHA256 after green quality gates.
