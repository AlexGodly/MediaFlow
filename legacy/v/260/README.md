# MediaFlow v260 — React Design System Redesign

**App release:** v260  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v260 is the first major React-era design-system release. It keeps the mature MediaFlow data/runtime engine intact for compatibility while introducing a reusable React + TypeScript + Tailwind + Vite presentation architecture and a complete professional visual redesign across the existing application surfaces.

## Zero-config GitHub Pages release

This ZIP is already deployable. Extract it into the MediaFlow GitHub Pages repository and publish/push the files. **No npm install, Vite command, Tailwind build, environment file, paid service, or manual configuration is required.**

The `src-v260/` and `vite.v260.config.ts` files are included as maintainable source for future React migration work, while the root application and `assets/` directory contain the prebuilt deployable release.

## Main v260 changes

- Added a reusable v260 design-token/component system for surfaces, buttons, inputs, cards, modals, navigation, typography, responsive states and accessibility.
- Added a React application chrome with TypeScript/Tailwind/Vite source and a static zero-dependency fallback so MediaFlow stays usable if the React CDN is unavailable.
- Redesigned Dashboard, Library, Personal Order, Batch Log, Statistics, Settings, Account/About, modal surfaces and shared controls through one consistent v260 design language.
- Preserved dynamic MediaFlow themes by deriving the new design tokens from the existing theme CSS variables instead of hard-coding one palette.
- Unified Consumption History and Library History into one **History** destination.
- Added History tabs: **Consumption history**, **Recently viewed**, **Ratings**, **Library**.
- Added Simkl-inspired History presentation with weekly consumption insight cards, recent-activity timeline/dayparts, ratings table, and the existing full Library change log.
- Removed the separate Library History navigation destination while keeping all Library History data and functionality available in History → Library.
- Preserved existing consumption History filters, pagination, batch selection/delete actions, custom dates and CSV export.
- Preserved Cloud Sync v201, Full Backup v29, Settings Preset v1, Personal Order Export v4, PWA/update systems, XP, Seasons View, cover overlays, Runtime Calculator, Stopwatch and all v259 behavior.
- PWA shell advances to `mediaflow-pwa-v260-shell-v1` and includes the new local v260 runtime/CSS assets.
- Added dedicated v260 smoke validation across Dashboard, Library, History, Batch Log, Statistics, Account and Settings at 1440 / 1024 / 820 / 390 / 320 / 280 px with no page-level horizontal overflow.

## React-era source structure

```text
src-v260/
├── components/
│   ├── AppChrome.tsx
│   └── primitives.tsx
├── styles/
│   └── tailwind.css
├── main.tsx
└── README.md

vite.v260.config.ts
package.json
```

The active compatibility runtime extension is:

```text
src/js/components/194-v260-react-redesign-history.js
```

The prebuilt professional design layer is:

```text
assets/css/127-v260-react-redesign.css
assets/js/mediaflow-v260-react-ui.js
```

## Build and validation for development only

Alex does **not** need these commands to deploy the supplied ZIP. They are for future development/auditing only.

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v260.py
```

See `docs/CHANGELOG_v260.md` for release details.
