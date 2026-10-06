# MediaFlow v269 — Consumption History Redesign

**App release:** v269  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v269 is a major redesign of **History → Consumption history**, inspired by the dense week-by-week presentation of Simkl while preserving MediaFlow's own categories, themes, title data and History actions.

## Highlights

- Rebuilt Consumption History into a **week-by-week archive**.
- Added a compact Simkl-inspired filter strip with MediaFlow category filtering plus Year, Month, Period and View Options.
- Added a horizontal **Latest Consumed** cover rail.
- Latest titles show their relevant last progress label such as **Ep.**, **Ch.**, **Issue**, **Vol.** or **Seen all**.
- A missing title cover falls back to the title's **MediaFlow category icon** in the same cover slot.
- Every visible week now has its own summary before the entries belonging to that week.
- Current week remains first; newly logged History automatically stays inside the current week section.
- Week summaries use **MediaFlow categories** instead of hard-coded TV / anime / movie types.
- Category summaries show unique consumed titles and time spent per category.
- Added weekly metrics for total consumed time, active days, average per active day, most active day, most popular time and longest binge.
- Added a **Most Consumed Titles** section for each week.
- History entries are grouped by day under their owning week and use cover-rich responsive cards.
- Existing Edit, Delete, Select, batch-delete, Undo and CSV export behavior remains available.
- Existing Consumption History category/type/date filtering is preserved, with Year and Month convenience filters added on top.
- Recent, Ratings and Library History tabs remain unchanged.
- Dynamic MediaFlow themes remain fully active.
- PWA shell advances automatically to `mediaflow-pwa-v269-shell-v1` during build.
- No data migration or schema bump is required.

## Validation

```bash
python scripts/check.py
python scripts/smoke-v269.py
```

The v269 smoke suite verifies the new filter strip, latest consumed rail, category fallback cover, episode/chapter progress labels, multiple weekly summaries, daily history groups, selection mode, dynamic themes and narrow-screen overflow behavior down to 280px.
