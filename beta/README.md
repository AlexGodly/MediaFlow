# MediaFlow v260 — Modular Project

**App release:** v260  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v260 is a full professional UI/UX redesign built directly over v259. The existing MediaFlow runtime remains authoritative for functionality and persistence while a new reusable theme-driven design system modernizes every page.

## Main v260 changes
- Added the v260 professional visual system across Dashboard, Library, Personal Order, Old System, histories, Batch Log, Statistics, Account, Settings and About.
- Added a collapsible Library tools panel while keeping Category and Status navigation visible and sticky above titles.
- Redesigned List, Compact, Cards, Covers and Cover+Titles modes with distinct density and hierarchy.
- Preserved Dynamic Cover Theme and every existing theme by deriving all new colors from the established MediaFlow CSS variables.
- Added accessibility improvements, reduced-motion handling, stronger focus states and a skip-to-content path.
- Added `ui-v260/`: React + TypeScript + Tailwind + Vite component workspace with Lucide React and Framer Motion integration points.
- Preserved every v259 feature, category artwork asset, cloud/sync contract and backup schema.
- PWA shell advances to `mediaflow-pwa-v260-shell-v1`.

## Build and validation
```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v260.py
```

See `docs/CHANGELOG_v260.md` and `docs/V260_DESIGN_SYSTEM.md` for release details.

