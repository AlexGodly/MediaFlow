# MediaFlow v220 — Settings Polish & Synchronized Organization

**Stable feature base:** MediaFlow v201  
**App release:** v220  
**Runtime foundation:** v219  
**Cloud Sync compatibility:** v201  
**Full Backup schema:** v29  
**Settings Preset schema:** v1

v220 builds on the working v219 active-runtime foundation and focuses on making Settings easier to use and visually consistent. The left Settings index and the actual Settings page now share the same grouping and section order, Categories is the first Library section, the search UI has been redesigned, and noisy legacy `Default` labels have been removed from the affected section headers.

## Run MediaFlow

### Windows
Run `scripts\serve.bat`, then open `http://localhost:8080/`.

### macOS / Linux
```bash
bash scripts/serve.sh
```

## v220 Settings structure

```text
Library
├── Categories
├── Library Experience
├── Logging Method
├── Cover Size Adjustment
├── Library Integrity
├── Category Icons
├── Missing Title Covers
├── Library Overview
├── Library Maintenance
├── Category Maintenance
└── Cover Maintenance

Interface
├── Dashboard Settings
├── Navigation
└── App Updates

Appearance
└── Themes & Customization

MediaFlow System
├── Daily Goal
├── Title Recommendations
├── MediaFlow System
└── Scheduler Tuning

Progression
└── Leveling & XP

Statistics
└── Statistics Settings

Data & Sync
├── Import / Export — Media Services
├── Automatic Backups
├── Cloud Sync
├── Settings Preset
└── Data
```

## Active runtime files

```text
src/js/core/runtime/998-runtime-extension-foundation-v219.js
src/js/pages/settings/145-v220-active-settings-page.js
src/js/runtime-order.json
assets/css/91-v220-settings-polish.css
assets/js/mediaflow-v220.bundle.js
```

The v219 runtime-extension foundation remains the safe execution layer for future updates. v220 registers the active Settings renderer inside that runtime instead of patching the application after its private scope closes.

## Build and verify

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-ui.py
```

The Chromium smoke test verifies the actual rendered Settings page, including the new search, Categories-first Library ordering, matching left-menu/page group order, cleaned Library Integrity label, removed legacy `Default` buttons, per-setting resets, and Restore all defaults.

## Compatibility

The stable v201 Library/data model is preserved. Cloud Sync remains v201, Full Backup remains schema v29, and Settings Preset remains schema v1.
