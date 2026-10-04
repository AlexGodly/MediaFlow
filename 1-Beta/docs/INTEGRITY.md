# MediaFlow v231 Integrity Notes

- The modular build continues using the stable MediaFlow v201-compatible feature/data base.
- Runtime extensions remain inside the active application scope before `999-close-app.js`.
- `mediaflow-v231.bundle.js` must exactly match `build-order.json` plus `runtime-order.json`.
- No inline JavaScript or inline style blocks are reintroduced into `index.html`.
- Cloud Sync remains v201.
- Full Backup remains Schema v29.
- Settings Preset remains Schema v1.
- Library Mode must appear as its own section inside the Library Settings group.
- Library Mode must keep a semantic Settings sidebar icon.
- Exactly one visible Settings sidebar item should carry the active v231 highlight state.
- Set Priority's untouched default order is High → Medium → Low.
- Set Status may use Own settings or Follow Dynamic Status Order.
- Category Filter may additionally Follow Set Category.
- Status Filter may Follow Set Status or Follow Dynamic Status Order.
- Follow modes must resolve live without overwriting saved custom orders.
- The removed custom-order helper sentence must not be rendered by v231 Choice & Filter cards.
- Existing v229 category pagination/icon behavior and v230 ordering controls remain preserved.
- Chromium UI testing must verify v221–v231 behavior in the rendered application.
