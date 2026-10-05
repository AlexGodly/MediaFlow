# MediaFlow v239 — Modular Project

**App release:** v239  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v239 improves Batch Log layout and logging-method presentation, upgrades logged-title rows with cover artwork and readable metadata, redesigns Edit Title into a large organized scroll-safe editor, removes the v238 Device & Layout override, and returns responsive behavior to automatic native viewport handling.

## Main v239 changes

- Cleaner Batch Log Library Browser layout with no dead category-filter space.
- Redesigned Amount Consumed / Last Progress logging-method selector.
- Logged-title cards now show covers and clearer metadata.
- Batch-selected titles can show cover artwork.
- Larger, cleaner Edit Title modal with polished fields and safe scrolling when content exceeds the viewport.
- Device & Layout override removed from Settings/sidebar/persistence.
- Native desktop/tablet/mobile responsiveness preserved and audited.
- Full Data Export / Import, Automatic Backup, Cloud Sync / Sync Now, Settings Presets, Personal Order export/import and History CSV re-audited.

## Build

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v239.py
python scripts/perf-v232.py
```

See `docs/CHANGELOG_v239.md` for the full release notes.
