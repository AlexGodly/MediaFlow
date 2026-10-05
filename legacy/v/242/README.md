# MediaFlow v242 — Modular Project

**App release:** v242  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v242 improves logging readability and performance, removes the unwanted neutral overlay icon from clickable logging artwork, and reorganizes the History controls into a cleaner professional toolbar. No persistent data schema changes are introduced.

## Main v242 changes

- Larger, clearer **Last progress / Last watched/read** labels and inputs.
- Logged-title covers/category-icon fallbacks remain clickable for Title Details without the generic button icon overlay.
- Logging title lookup/search now uses indexed lookups, bounded candidate caching, and prefix narrowing for large Libraries.
- The dynamic-button icon observer now processes only added subtrees instead of rescanning the entire document after every DOM insertion.
- History filters/dates/Export are reorganized into a cleaner two-row toolbar.
- Full Data Export/Import, Automatic Backup, Cloud Sync / Sync Now, Settings Presets, History CSV, and Personal Order export/import were re-audited.

## Build

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v242.py
python scripts/perf-v242.py
```

See `docs/CHANGELOG_v242.md` for the full release notes.

## v241
MediaFlow v241 enlarges and clarifies Edit Title, makes Rewatch/Reread summary cards use the full row, gives logged titles category-icon cover fallbacks with Title Details click-through, adds searchable multi-select/custom-date History filtering, paginates Library History, and adds a 50K-title performance index/regression audit. Persistent schemas remain Cloud v201 / Full Backup v29 / Settings Preset v1 / Personal Order Export v4.
