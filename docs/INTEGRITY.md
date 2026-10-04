# MediaFlow v219 Integrity Notes

- Stable feature/data base remains MediaFlow v201.
- v217 ID-based sidebar highlight behavior remains required.
- New release modules are injected before the explicit app closure through `runtime-order.json`.
- No executable release patch is allowed after `core/runtime/999-close-app.js`.
- Settings is registered through `MediaFlowRuntime.registerPageRenderer('settings', ...)`.
- Generated runtime must exactly match the build manifest plus runtime manifest.
- `node --check` must pass.
- Chromium UI smoke testing must prove the Settings search, grouped navigation, reset controls, individual reset, and Restore all defaults actually work in the rendered app.
- Cloud Sync remains v201.
- Full Backup remains schema v29.
- Settings Preset remains schema v1.
