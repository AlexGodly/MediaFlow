# MediaFlow v218 — Modular Architecture + Organized Settings

**Stable feature base:** MediaFlow v201  
**App release:** v218  
**Cloud Sync compatibility:** v201  
**Full Backup schema:** v29  
**Settings Preset schema:** v1

v218 keeps the v216/v217 page-component-core architecture and adds a fully organized Settings experience: searchable settings, a sticky section index, per-setting/section reset controls, and an audited Restore all defaults path. The stable v201 feature/data model remains intact.

## Run MediaFlow

### Windows
Run `scripts\serve.bat`, then open `http://localhost:8080/`.

### macOS / Linux
```bash
bash scripts/serve.sh
```

## Source architecture

```text
MediaFlow_v218_Modular/
├── index.html
├── assets/
│   ├── css/
│   │   └── 90-v218-settings-organizer.css
│   └── js/mediaflow-v218.bundle.js
├── src/js/
│   ├── core/
│   ├── pages/
│   │   ├── dashboard/
│   │   ├── library/
│   │   ├── personal-order/
│   │   ├── library-history/
│   │   ├── history/
│   │   ├── batch-log/
│   │   ├── statistics/
│   │   ├── profile-settings/
│   │   ├── settings/
│   │   └── old-system/
│   ├── components/
│   ├── features/
│   ├── services/
│   ├── utils/
│   ├── legacy/
│   └── build-order.json
├── scripts/
│   ├── build.py
│   ├── check.py
│   ├── locate.py
│   ├── serve.bat
│   └── serve.sh
└── docs/
    ├── ARCHITECTURE.md
    ├── SOURCE_MAP.md
    ├── INTEGRITY.md
    └── CHANGELOG_v218.md
```

## Settings source ownership

The v218 Settings browser lives in:

```text
src/js/pages/settings/143-v218-settings-organizer.js
assets/css/90-v218-settings-organizer.css
```

The existing Settings renderers and handlers remain in their owned modules. v218 sits at the end of the compatibility build and organizes the final Settings UI rather than duplicating those underlying setting implementations.

## Important compatibility rule

Files under `src/js/` are owned by real app domains, but are still concatenated in `build-order.json` into one compatibility bundle. Do not add the fragments as independent browser scripts yet; the stable v201 application still shares lexical state.

## Build and verify

```bash
python scripts/build.py
python scripts/check.py
```

## Find code quickly

```bash
python scripts/locate.py renderSettings
python scripts/locate.py "Restore all defaults"
python scripts/locate.py "category icon"
```

## GitHub Pages

Deploy the project contents as usual. `index.html` remains the single SPA entry point.
