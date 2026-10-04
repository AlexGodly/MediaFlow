# MediaFlow v215 — Modular Refactor

**Stable feature base:** MediaFlow v201  
**App version:** v215  
**Cloud sync compatibility:** v201  
**Full Backup schema:** v29  
**Settings Preset schema:** v1

This release restructures the stable v201 single-file application into a maintainable project without intentionally changing its v201 feature behavior or persistent data formats.

## Run it

The deployable entry point is `index.html`. For normal browser/PWA behavior, serve the folder over HTTP instead of double-clicking the file.

### Windows

Run `scripts\serve.bat`, then open `http://localhost:8080/`.

### macOS / Linux

Run:

```bash
bash scripts/serve.sh
```

Then open `http://localhost:8080/`.

## Project structure

```text
MediaFlow_v215_Modular/
├── index.html
├── manifest.json
├── sw.js
├── VERSION
├── assets/
│   ├── css/                 # external stylesheets, kept in original cascade order
│   └── js/
│       └── mediaflow-v215.bundle.js  # deployable compatibility bundle
├── src/
│   └── js/
│       ├── build-order.json
│       └── parts/           # logical source fragments, concatenated in original order
├── scripts/
│   ├── build.py             # rebuild JS bundle from source parts
│   ├── check.py             # structural + JS syntax checks
│   ├── serve.bat
│   └── serve.sh
└── docs/
    ├── ARCHITECTURE.md
    ├── CHANGELOG_v215.md
    └── INTEGRITY.md
```

## Why the JavaScript has a bundle

The v201 application accumulated a very large shared lexical scope. Splitting that closure into independently loaded browser scripts would change variable visibility and risk breaking the stable build. v215 therefore uses a **compatibility-first modular source layout**:

- the source is separated into logical `src/js/parts/*.part.js` files;
- `scripts/build.py` concatenates them in the exact original execution order;
- the browser loads one generated bundle;
- future work can progressively extract real independent modules from these parts without destabilizing the app.

This removes the 1.8 MB inline HTML problem immediately while preserving the shared-scope behavior of v201.

## Building after JavaScript edits

```bash
python scripts/build.py
python scripts/check.py
```

Do not load files in `src/js/parts/` directly from HTML. They are ordered source fragments of the stable shared closure.

## GitHub Pages

Upload the project contents to the root of the Pages branch/repository. `index.html`, `manifest.json`, `sw.js`, `assets/`, and the other folders can remain exactly as provided.
