# MediaFlow v270 — History Performance & Global Responsiveness

**App release:** v270  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v270 is a focused performance and reliability release built on v269. It fixes the severe lag/freeze that could occur immediately after opening **History → Consumption History**, keeps the v269 redesign intact, introduces week pagination/lazy work so only the visible History page is fully hydrated, and permanently removes the release-version chip that could appear beside **Sync Now**.

## Highlights

- Replaced repeated full-Library scans during Consumption History rendering with shared indexed lookups.
- Reuses MediaFlow's existing large-Library ID index and adds normalized title/category indexes for fallback matching.
- Stops v269 from resolving every event against the full Library one title at a time.
- Hydrates only the History weeks displayed on the current History page.
- Default Consumption History page size is **6 weeks**, configurable from View Options.
- Keeps the complete v269 weekly summary + daily history design inside every History page.
- Latest Consumed, weekly category summaries, top titles, cover fallbacks and progress labels are preserved.
- Adds a reusable sorted-History cache so History no longer clones + sorts the complete session array on every render.
- Invalidates History caches when session data is persisted/changed.
- Warms large-Library indexes during browser idle time to reduce the first interaction cost across MediaFlow.
- Reuses indexed Library resolution in shared History/recent-title helpers beyond the v269 Consumption page.
- Adds `content-visibility`/containment optimizations for large off-screen History sections.
- Reduces expensive backdrop composition on constrained/mobile layouts without changing theme colors.
- Permanently removes the top-right `v###` release chip beside **Sync Now**.
- Removes it from both fallback chrome and the prebuilt React application chrome so it does not reappear after navigation/rerenders.
- Adds a DOM safeguard that removes any stale legacy version chip if an old runtime tries to recreate one.
- Dynamic themes and all v269 History visuals are preserved.
- PWA shell advances to `mediaflow-pwa-v270-shell-v1`.
- No data migration or schema bump is required.

## Validation

```bash
python scripts/build.py
python scripts/check.py
python scripts/perf-v270.py
```

The v270 performance suite stress-tests MediaFlow with a synthetic **30,000-title Library and 5,000 History logs**, verifies History navigation responsiveness, repeated page switching, the v269 weekly/card presentation, permanent version-chip removal, and page-level overflow.
