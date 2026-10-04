# MediaFlow v201 — Professional Project Layout

MediaFlow v201 has been refactored from the original ~44,000-line single HTML file into a maintainable static-web project while preserving the existing single-page application behavior.

## Run it

The generated app is already included. Serve the project root with any static web server and open `index.html` through that server. GitHub Pages works directly.

```bash
npm run verify
```

`npm run build` rebuilds `assets/js/mediaflow.js` from the organized source files. `npm run check` verifies the project structure and JavaScript syntax. No npm packages are required.

## Project structure

```text
MediaFlow_v201_Project/
├─ index.html                 # Clean application entry point
├─ manifest.json              # PWA metadata
├─ sw.js                      # Conservative service worker; no fetch interception
├─ assets/
│  ├─ css/                    # Ordered runtime stylesheets
│  └─ js/mediaflow.js         # Generated runtime bundle
├─ src/js/
│  ├─ core/                   # State, storage, scheduler, render/init, actions
│  ├─ ui/                     # Shell, sidebar, modals
│  ├─ views/                  # Dashboard, Library, Batch Log, History, Statistics, Profile, Settings
│  ├─ features/               # Later MediaFlow feature/version layers
│  └─ legacy/                 # Late compatibility code preserved for parity
├─ scripts/
│  ├─ build.mjs               # Dependency-free bundle builder
│  └─ check.mjs               # Structural + syntax audit
└─ docs/
   ├─ ARCHITECTURE.md
   └─ REFACTOR_NOTES.md
```

## Why there are not separate dashboard.html / library.html files

MediaFlow is a stateful SPA. Dashboard, Library, Statistics, Settings, etc. are rendered from JavaScript and share the same in-memory state, cloud session, modal system and navigation shell. Turning each view into a separate HTML document would force reloads, duplicate the shell, complicate state synchronization and risk breaking behavior.

Instead, every main view now has its own source file under `src/js/views/`, while `index.html` remains the single browser entry point. The build step combines the ordered source into one private runtime closure so the original shared scope still behaves like v201.

## Editing workflow

1. Edit the appropriate file in `src/js/` or `assets/css/`.
2. Run `npm run build` after JavaScript changes.
3. Run `npm run check` before publishing.
4. Publish the project root to GitHub Pages or another static host.

Do **not** hand-edit `assets/js/mediaflow.js`; it is generated from `src/js/`.
