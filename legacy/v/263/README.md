# MediaFlow v263 — Library Filter Interaction Repair

**App release:** v263  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v263 is a focused Library interaction fix built over v262. The v262 Library design remains intact; v263 repairs Status and Category button clicks/taps in both Normal and Dynamic Library without changing the approved layout.

## What changed

- Fixed Normal Library **Status** buttons not activating.
- Fixed Normal Library **Category** buttons not activating.
- Fixed Dynamic Library **Status** buttons not activating.
- Fixed Dynamic Library **Category** buttons not activating.
- Reworked horizontal drag handling so it no longer captures the pointer on a normal click/tap.
- Desktop/pen drag-to-scroll now starts only after a real horizontal gesture.
- Mobile/tablet touch keeps native horizontal scrolling while taps remain normal button taps.
- Preserved every v262 Library layout decision and all newer MediaFlow runtime/data behavior.
- PWA shell advances to `mediaflow-pwa-v263-shell-v1`.

## Zero-config GitHub Pages release

The supplied ZIP is already deployable. Extract it into the MediaFlow GitHub Pages repository and push/publish it. No npm install, build command, paid service or manual configuration is required.

Development-only validation:

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v263.py
```
