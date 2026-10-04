# MediaFlow v220 Integrity Notes

- Stable feature/data base remains MediaFlow v201.
- v217 ID-based sidebar highlighting remains required.
- v219 runtime-extension injection remains the active foundation.
- No executable release patch is allowed after `core/runtime/999-close-app.js`.
- Settings is registered through `MediaFlowRuntime.registerPageRenderer('settings', ...)`.
- Generated runtime must exactly match `build-order.json` + `runtime-order.json`.
- `node --check` must pass.
- Chromium UI testing must verify the requested v220 Settings changes in the actual rendered page.
- Left Settings navigation and actual page group order must match.
- Categories must be the first Library section.
- `LIBRARY INTEGRITY` must render without the old tool emoji.
- Legacy `Default` buttons must be absent from Daily Goal, Title Recommendations, Scheduler Tuning, Leveling & XP, and Automatic Backups.
- Restore all defaults must reset settings without deleting Library/content data.
- Cloud Sync remains v201.
- Full Backup remains schema v29.
- Settings Preset remains schema v1.
