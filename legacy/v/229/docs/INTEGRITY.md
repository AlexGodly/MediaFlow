# MediaFlow v229 Integrity Notes

- The modular build continues using the stable MediaFlow v201-compatible feature/data base.
- Runtime extensions remain inside the active application scope before `999-close-app.js`.
- `mediaflow-v229.bundle.js` must exactly match `build-order.json` plus `runtime-order.json`.
- No inline JavaScript or inline style blocks are reintroduced into `index.html`.
- Cloud Sync remains v201.
- Full Backup remains Schema v29.
- Settings Preset remains Schema v1.
- The v228 Dynamic row order mode remains stored inside `settings.v181Library`; v229 adds no new persistent fields.
- Follow Categories mode must never overwrite the stored custom Dynamic row order.
- Dynamic row drag controls are active only in Custom mode and remain glyph-only (`☰`).
- Library category pills must preserve the category's own configured identity while remaining free of the redundant global action icon.
- Library Low / Medium / High priority pills must resolve to distinct semantic icons.
- Set Category must use the existing `v144CategoryIconHtml(...)` URL-first category identity pipeline.
- Set Category must include all current categories and paginate only when the category count exceeds 15.
- The Set Category choice grid must not use its own internal scrollbar.
- Set Status must use the same five semantic status SVGs as Dynamic Library and must not receive a second generic action icon.
- The Dynamic category-row icon selector must retain its v226 purpose-aware dropdown icon treatment in v229.
- Chromium UI testing must verify v221–v229 behavior in the rendered application.
