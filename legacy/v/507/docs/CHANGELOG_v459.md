# MediaFlow v459 Stable — Retire Old Cover Recovery Floating Widget

## Removed legacy UI
- Retire the obsolete standalone **Cover Recovery** floating pill and its expandable popup (the old controls for Pause, Stop after title, Finish part & stop, JSON/CSV reports, Retry unresolved, and New Recovery).
- Do not mount or rebuild the `#mf424-indicator` DOM node after any title, part, page, or recovery progress update.
- Apply a defensive stylesheet so stale v424 UI cannot flash on page load on desktop, tablet, or mobile.

## Still available
- **Background Processes**, the modern unified recovery widget, remains the single floating UI for Cover, Metadata and combined recovery progress.
- **Unified Recovery Workspace** remains available for configurations, starting jobs and checking progress.
- Cover recovery engine, saved queues, cross-tab leases, active API requests, checkpoints, recovery results and cloud writes are completely untouched.
- User preferences for the modern Background Processes widget (Automatic / Always / Hidden) are preserved.
- Removing the old widget **does not pause, reset, delete or cancel an active job**.

## QA
- Test that the legacy node is removed at startup and on repeated progress paints and cannot be recreated by the legacy toggle.
- Test that the same recovery job object survives unchanged and that each cover progress paint still invokes the unified Background Processes UI.
- Desktop and mobile Chromium: no obsolete progress card or popup, newest recovery widget markup remains available.
- Run all existing provider/recovery/cloud and PWA regression checks.
- Archive the complete v459 source in `legacy/v/459` and publish numeric release 459 with ZIP and SHA-256 after a successful GitHub Pages deploy.

No change to the planned external ratings feature: rescheduled to **v460**.
