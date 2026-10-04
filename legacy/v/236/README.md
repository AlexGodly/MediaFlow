# MediaFlow v236 — Modular Project

**App release:** v236  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v236 upgrades the **Normal Library Category Filter** into a searchable, persistent-open multi-select control with configurable pagination. Category order and visibility still come from **Choice & Filter Layout**, while the filter no longer forces you to reopen it after every selection.

## Main v236 changes

- Search inside the Library Category Filter without closing the dropdown.
- Multi-select category checkboxes stay open while Library results refresh dynamically.
- Category order/visibility still follow the configured Category Filter source.
- New **Categories per page** setting under **Choice & Filter Layout → Category Filter**.
- Default Category Filter page size is **15**; pagination appears only when the effective/search result count exceeds the configured limit.
- Search/pagination update only the dropdown list instead of rerendering the whole application.
- Existing v232 large-Library performance protections remain active.

## Build and validation

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-ui.py
python scripts/smoke-v234.py
python scripts/smoke-v235.py
python scripts/smoke-v236.py
python scripts/perf-v232.py
```

See `docs/CHANGELOG_v236.md` for the full release notes.
