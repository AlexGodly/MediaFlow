# MediaFlow v216 — Modular Page / Component Architecture

**Stable feature base:** MediaFlow v201  
**App release:** v216  
**Cloud Sync compatibility:** v201  
**Full Backup schema:** v29  
**Settings Preset schema:** v1

v216 is the deeper architecture phase built on v215. The app is still one SPA and behaves like the stable v201 build, but the editable JavaScript source is now organized by ownership instead of by one giant HTML file or broad chronological chunks.

## Run MediaFlow

### Windows
Run `scripts\serve.bat`, then open `http://localhost:8080/`.

### macOS / Linux
```bash
bash scripts/serve.sh
```

## Source architecture

```text
MediaFlow_v216_Modular/
├── index.html
├── assets/
│   ├── css/
│   └── js/mediaflow-v216.bundle.js
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
    └── CHANGELOG_v216.md
```

## Important compatibility rule

Files under `src/js/` are now **owned by real app domains**, but they are concatenated in `build-order.json` into one compatibility bundle. Do not add these files as separate `<script>` tags yet. The stable v201 application shares lexical state, so preserving source order is what keeps the app functioning exactly as before.

This architecture makes future debugging much easier: use the owning folder first, then shared components/services. For example:

- Library bug → `src/js/pages/library/`
- Dashboard bug → `src/js/pages/dashboard/`
- category UI → `src/js/components/category/`
- cloud sync → `src/js/services/cloud-sync/`
- backups → `src/js/features/backup/`

## Build and verify

```bash
python scripts/build.py
python scripts/check.py
```

`check.py` does more than syntax checking: it verifies the generated v216 runtime is executable-code compatible with the stable v215/v201 runtime.

## Find code quickly

```bash
python scripts/locate.py renderLibrary
python scripts/locate.py "category icon"
python scripts/locate.py v155VerifyCloudState
```

## GitHub Pages

Deploy the project contents as usual. `index.html` remains the single SPA entry point.
