# MediaFlow v228 Integrity Notes

- The modular build continues using the stable MediaFlow v201-compatible feature/data base.
- Runtime extensions remain inside the active application scope before `999-close-app.js`.
- `mediaflow-v228.bundle.js` must exactly match `build-order.json` plus `runtime-order.json`.
- No inline JavaScript or inline style blocks are reintroduced into `index.html`.
- Cloud Sync remains v201.
- Full Backup remains Schema v29.
- Settings Preset remains Schema v1.
- The v228 Dynamic row order mode is stored inside `settings.v181Library`, so existing cloud/full-backup/automatic-backup/settings-preset pipelines remain canonical.
- Follow Categories mode must never overwrite the stored custom Dynamic row order.
- Dynamic row drag controls are active only in Custom mode and remain glyph-only (`☰`).
- Library category pills must preserve the category's own configured identity while remaining free of the redundant global action icon.
- Library Low / Medium / High priority pills must resolve to distinct semantic icons.
- Chromium UI testing must verify v221–v228 behavior in the rendered application.
