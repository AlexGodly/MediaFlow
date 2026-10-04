# MediaFlow v234 — Modular Project

**App release:** v234  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1

MediaFlow v234 polishes the two Dashboard quick-entry fields: **Rate Your Library** now has a stable, readable rating input width, and **Missing Covers** now uses a fully styled Cover URL input that matches the rating field. All v233 Dynamic Settings and Title Details cover-size behavior remains intact.

## Main v234 changes

- Increased the **Rate Your Library** rating input to a stable readable width so `e.g. 8.5` and entered values remain fully visible.
- Added a polished shared Dashboard quick-input visual style with clearer hover/focus states.
- Redesigned **Missing Covers → Cover URL** as a proper themed input matching the Rating field while keeping enough width for long URLs.
- Preserved Rating Queue behavior, rating XP, Missing Covers queue behavior, cover saving, skipping and all v233 settings/persistence behavior.

## Build and validation

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-ui.py
python scripts/smoke-v234.py
python scripts/perf-v232.py
```

See `docs/CHANGELOG_v234.md` for the full release notes.
