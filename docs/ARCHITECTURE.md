# MediaFlow v216 Architecture

## Goal

v216 is the second-stage refactor of the stable v201 feature base. Unlike v215's broad chronological `parts/` directory, v216 gives every editable JavaScript fragment a concrete ownership area: `core/`, `pages/`, `components/`, `features/`, `services/`, `utils/`, or `legacy/`.

The priority remains **runtime compatibility first**. The browser bundle is reconstructed in the exact stable execution order, so reorganizing source ownership does not rewrite application behavior.

## Runtime

1. `index.html` — SPA entry point.
2. `assets/css/*.css` — v215-extracted stable styles, unchanged in content/order.
3. Supabase browser client CDN.
4. `assets/js/mediaflow-v216.bundle.js` — generated compatibility bundle.
5. Service worker / PWA manifest.

## Editable JavaScript source

```text
src/js/
├── core/          # state, storage, render shell, public app actions
├── pages/         # Dashboard, Library, Personal Order, History, Statistics, Settings, etc.
├── components/    # modals, navigation, category/cover UI, pagination, title details
├── features/      # scheduler, logging, XP, backup, imports, themes, rewatch
├── services/      # cloud sync and persistence pipelines
├── utils/         # shared helpers
├── legacy/        # stable compatibility code not yet safely assigned/extracted
└── build-order.json
```

`pages/` contains actual source fragments owned by pages; they are not separate HTML documents because MediaFlow remains a SPA.

## Why the browser still uses a generated bundle

The stable v201 runtime was built around one shared lexical closure. Turning every file into an independently loaded ES module in one release would change scope semantics and could break stable data/render behavior. v216 therefore changes **source ownership without changing execution semantics**.

This is a deliberate migration architecture:

- future Library bugs are located under `src/js/pages/library/` plus shared components/services;
- Dashboard work is under `src/js/pages/dashboard/`;
- category UI work is under `src/js/components/category/`;
- cloud issues are under `src/js/services/cloud-sync/`;
- build order remains explicit so compatibility can be proved after each extraction.

## Validation guarantee

`scripts/check.py` reconstructs the bundle from all owned fragments, runs `node --check`, and normalizes the v216 human-readable backup note before comparing the SHA-256 hash against the stable v215/v201 runtime. If any executable JS changed unexpectedly, the check fails.

## Version/data compatibility

- App release: **216**
- Stable feature base: **201**
- Cloud Sync contract: **201**
- Full Backup schema: **29**
- Settings Preset schema: **1**

No persistent-data migration is introduced by the architecture refactor.
