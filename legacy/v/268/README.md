# MediaFlow v268 — Today's Balance Initial Dashboard Load Fix

**App release:** v268  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v268 is a focused Dashboard lifecycle reliability release built on v267. It fixes the case where **Today’s Balance was missing when MediaFlow first opened on Dashboard and only appeared after switching pages**.

## Highlights

- Today’s Balance now appears on the **first Dashboard load**.
- No page switch or second render is required.
- Pristine Dashboard markup is recognized directly instead of waiting for older Balance runtime classes.
- The final v265 Balance presentation is injected synchronously into Dashboard HTML.
- An already-rendered Dashboard is repaired immediately during v268 startup/hydration.
- Startup, microtask, animation-frame, page-enhancer, and rerender paths are idempotent.
- Today’s Balance visibility settings and all existing calculations remain unchanged.
- All v267 Cloud Sync, Dynamic Library cover-filter, and Personal Order portal fixes are preserved.
- PWA shell advances automatically to `mediaflow-pwa-v268-shell-v1` during build.
- Zero-configuration GitHub Pages deployment remains preserved.

## Validation

```bash
python scripts/check.py
python scripts/smoke-v268.py
```

The v268 smoke suite explicitly checks Today’s Balance **before any page navigation occurs**, then verifies that it remains stable after navigating away and back.
