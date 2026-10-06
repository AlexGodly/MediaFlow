# MediaFlow v261 — Library, History & Balance Refinement

**App release:** v261  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v261 builds directly on the v260 React-era redesign and focuses on the areas that still felt inconsistent: Library navigation, cover filtering, History performance/cohesion, Today’s Balance, Personal Order pagination, page header icons and MediaFlow branding.

## Zero-config GitHub Pages release

This ZIP is already deployable. Extract it into the MediaFlow GitHub Pages repository and push/publish the files. **No npm install, Vite command, Tailwind build, paid service or manual configuration is required.**

The modern source is included for maintainability under `src-v261/`, while the root app and `assets/` directory contain the prebuilt GitHub Pages-ready release.

## Main v261 changes

- Fixed the Library cover filter so Has cover / Missing cover recognize all supported cover fields instead of only one legacy property.
- Added a full-row Library search surface shared by Normal and Dynamic Library.
- Added sticky Status and Category rows directly under search; they remain visible while scrolling titles.
- Added drag-friendly horizontal status/category strips with hidden scrollbars.
- Added a persistent Show tools / Hide tools Library control and reorganized display/bulk/sort/overlay controls into one Library Tools surface.
- Removed duplicated category/status filter controls inside the tools surface where the sticky rows are now the primary quick filters.
- Redesigned Today’s Balance into clearer per-category guidance rows with status badges, progress, category art, summary KPIs and click-through to the Library category.
- Uses the official MediaFlow icon in the refreshed Today’s Balance heading and sidebar brand.
- Removed the current-theme chip from the page header.
- Page headers now use the same semantic icon family as their corresponding sidebar navigation item.
- Reworked History so the four tabs feel like one cohesive Simkl-inspired system instead of separate embedded pages.
- Added filtering, paging and browsing insights to Recently viewed.
- Rebuilt Ratings with filters and pagination so very large rating libraries no longer render thousands of rows at once.
- Kept Consumption History and Library History tools/data intact inside the unified History page.
- Removed decorative edge-arrow icons from Personal Order pagination while preserving Prev / page / Next navigation.
- Added dedicated v261 responsive smoke validation at 1440 / 1024 / 820 / 390 / 320 / 280 px.
- PWA shell advances to `mediaflow-pwa-v261-shell-v1`.

## React-era source structure

```text
src-v261/
├── components/
│   ├── AppChrome.tsx
│   └── primitives.tsx
├── styles/
│   └── tailwind.css
├── main.tsx
└── README.md

vite.v261.config.ts
package.json
```

The active v261 runtime extension is:

```text
src/js/components/195-v261-library-history-balance-polish.js
```

The prebuilt v261 presentation layer is:

```text
assets/css/128-v261-library-history-balance-polish.css
assets/js/mediaflow-v261-react-ui.js
```

## Build and validation for development only

Alex does **not** need these commands to deploy the supplied ZIP.

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v261.py
```

See `docs/CHANGELOG_v261.md` for release details.
