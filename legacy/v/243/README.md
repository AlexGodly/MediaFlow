# MediaFlow v243 — Modular Project

**App release:** v243  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v243 fixes two focused UI regressions: logged titles with a real Cover URL no longer show the category fallback artwork underneath the real poster, and the Batch Log searchable Category Filter now renders fully above the following Batch Log content instead of being hidden/clipped.

## Main v243 changes
- One visible artwork source per logged title: real cover first, category icon only as fallback.
- Logged cover/category fallback remains clickable and opens Title Details.
- Batch Log Category Filter popover overflow/stacking repaired.
- Search, multi-select, pagination, order/visibility inheritance and stay-open behavior preserved.
- Cloud/backup/preset/export systems re-audited; no schema bump required.

## Validation
```bash
python scripts/check.py
python scripts/smoke-v243.py
```

See `docs/CHANGELOG_v243.md` for release notes.
