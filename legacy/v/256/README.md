# MediaFlow v256 — Modular Project

**App release:** v256  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v256 adds **theme-aware cover progress**, persistent per-overlay sizing, collapsible Dashboard time tools, and the new **Runtime Calculator**.

## Main v256 changes
- Progress bars attached to Library covers now visually follow the current MediaFlow theme and remain high-contrast in light/dark/full-style themes.
- Added independent size adjusters for Status, Category, Rating and Progress overlays in Covers/Covers+Titles for both Normal and Dynamic Library.
- Stopwatch is now an accordion: click its header or top-right chevron to collapse/expand it.
- Added **Runtime Calculator** directly below Stopwatch with its own Dashboard visibility setting and accordion behavior.
- Carry-forward mode supports repeated calculations with **Continue with result**, runtime count tracking, and **Previous total** restoration.
- Multi-row mode supports adding/removing runtime rows and summing all entered durations.
- Runtime Calculator results can be copied to the current logging form through **Use for minutes**.
- Existing v255 status-color polish, v254 overlay visibility, v253 History tools, v252 Seasons View, cloud/backup/update/PWA systems remain preserved.
- PWA shell advances automatically to `mediaflow-pwa-v256-shell-v1`.

## Build and validation
```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v256.py
```

See `docs/CHANGELOG_v256.md` for release details.
