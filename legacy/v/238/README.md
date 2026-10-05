# MediaFlow v238 — Modular Project

**App release:** v238  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v238 is a reliability/performance/responsive release. It repairs status filters that could become stuck on **Plan to Watch**, redesigns Dashboard logging around a collapsible lazy Library browser, enlarges and densifies Edit Title, adds a persistent **Automatic / Mobile / Tablet / Desktop** interface override, and audits the current backup/export/cloud paths.

## Main v238 changes

- Reliable status-filter selection across every shared native status filter.
- Logging Library moved below **What You Logged** and made collapsible/lazy.
- Faster Log & Complete opening with one final render path.
- Larger desktop Edit Title workspace with dense multi-column layout.
- Mobile/tablet overflow and paint-cost optimization across key views.
- New **Settings → Interface → Device & Layout** setting with semantic icon.
- New layout setting participates in cloud merge, Sync Now, Full Backup, Automatic Backup and Settings Presets.
- Re-audited Full Data Export/Import, dedicated Personal Order export/import and History export.

## Build and validation

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-ui.py
python scripts/smoke-v238.py
python scripts/perf-v232.py
```

See `docs/CHANGELOG_v238.md` for the full release notes.
