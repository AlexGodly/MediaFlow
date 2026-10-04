# MediaFlow v237 — Modular Project

**App release:** v237  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v237 extends the **v236 searchable, multi-select, persistent-open Category Filter** beyond the main Library. The same category-filter interaction is now available while adding titles to **Personal Order**, browsing titles in **Batch Log**, and selecting titles during **Dashboard logging**.

## Main v237 changes

- Search categories inside Personal Order, Batch Log, and Dashboard logging category dropdowns.
- Multi-select category choices stay open while the owning title results refresh dynamically.
- Category order and visibility continue to come from **Choice & Filter Layout → Category Filter**.
- The existing **Categories per page** setting now applies to all four Library-style category filters.
- Pagination appears only when the effective/search result count exceeds that setting.
- Search and pagination update only the dropdown panel instead of rerendering the surrounding title browser.
- Category selection refreshes are coalesced into one animation frame to avoid rapid-click render churn.
- Existing v232 large-Library performance protections remain active.

## Build and validation

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-ui.py
python scripts/smoke-v234.py
python scripts/smoke-v235.py
python scripts/smoke-v236.py
python scripts/smoke-v237.py
python scripts/perf-v232.py
```

See `docs/CHANGELOG_v237.md` for the full release notes.
