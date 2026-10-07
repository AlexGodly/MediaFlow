# MediaFlow v286 — Category Persistence & Runtime Cache Coherence

**App release:** v286  
**Cloud Sync:** v201  
**Full Backup:** Schema v29  
**Settings Preset:** v1  
**Personal Order Export:** v4  
**Collections Export:** v2

## v286

- Fixes category edits that appeared to save but reopened with the previous values.
- Fixes stale category runtime data caused by the v241 category lookup cache after in-place category edits.
- Category edits now replace the categories array immutably and invalidate category-derived runtime indexes immediately.
- Minutes per unit, name, target, weight, unit, type, seasonal state, enabled state, color, icons and missing-cover metadata become canonical immediately after Save.
- Logging, scheduler calculations, statistics and other `getCategory()` consumers now read the newly saved category values immediately.
- Reopening Edit Category shows the saved values rather than stale cached values.
- Cloud persistence was regression-tested by changing Minutes per unit from 25 to 30 and reopening the category in a completely fresh client using only the saved cloud state.
- One episode then resolves to 30 minutes through the same runtime category lookup used by Logging.
- PWA shell advanced to `mediaflow-pwa-v286-shell-v1`.
- No data migration required.
