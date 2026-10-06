# MediaFlow v273 — Drag Navigation & Responsive App Hardening

**App release:** v273  
**Base:** MediaFlow v272 Modular  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v273 focuses on interaction and device responsiveness. The Consumption History **Latest Consumed** poster shelf is now mouse/touch draggable with no visible horizontal scrollbar, and the application shell now prioritizes the real physical viewport so phones, tablets and tight-width windows cannot remain trapped in a forced desktop-width layout.

## Highlights

- Drag Latest Consumed covers horizontally with mouse, pen or touch.
- Hidden Latest Consumed scrollbar; drag gestures suppress accidental title opening.
- Physical viewport responsive guard overrides stale/forced desktop layout below tablet widths.
- Desktop sidebar automatically gives way to the mobile navigation shell on narrow physical viewports.
- Broader responsive hardening for Dashboard, Library, Personal Order, Old System, History, Batch Log, Statistics, Account, Settings and About.
- History tabs become horizontally scrollable on very narrow screens.
- Settings navigation becomes a clean horizontal shelf on tablet/mobile widths.
- Modal sizing, dense rows, toolbars, grids and action groups have tighter physical-viewport constraints.
- PWA shell advanced to `mediaflow-pwa-v273-shell-v1`.
- Cloud/backup/settings/order/history export/update/XP pipelines re-audited; no schema migration was required.

## Validation

```bash
python scripts/build.py
python scripts/smoke-v273.py
python scripts/smoke-v272-on-v273.py
python scripts/perf-v272-on-v273.py
python scripts/audit-v273.py
python scripts/check.py
```

The v273 smoke suite validates direct poster dragging, hidden scrollbars, forced-desktop narrow-window recovery, all major app pages at 1024/600/320 px, all five History tabs at 320 px, and the current Cloud Sync / backup / settings / update / XP / History export / Personal Order pathways.
