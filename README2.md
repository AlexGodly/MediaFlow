# MediaFlow v221 — Settings Hierarchy & Responsive Navigation Polish

**Stable feature base:** MediaFlow v201  
**App release:** v221  
**Runtime foundation:** v219  
**Cloud Sync compatibility:** v201  
**Full Backup schema:** v29  
**Settings Preset schema:** v1

v221 builds on the working v219/v220 runtime architecture and focuses on making the Settings hierarchy more consistent and easier to browse. Search behavior is intentionally preserved from v220.

## Run MediaFlow

### Windows
Run `scripts\serve.bat`, then open `http://localhost:8080/`.

### macOS / Linux
```bash
bash scripts/serve.sh
```

## v221 Settings structure

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
├── Navigation
├── Dashboard Settings
└── Statistics Settings

Appearance
└── Themes & Customization

MediaFlow System
├── Daily Goal
├── Title Recommendations
├── MediaFlow System
└── Scheduler Tuning

Progression
└── Leveling & XP

Data & Sync
├── Import / Export — Media Services
├── Automatic Backups
├── Cloud Sync
├── Settings Preset
└── Data

Updates
└── App Updates
```

## v221 Settings changes

- Restore All Defaults is aligned with the Settings search control rather than floating awkwardly in the toolbar.
- App Updates moved out of Interface into a dedicated **Updates** group at the bottom.
- The standalone **Statistics** group was removed.
- **Statistics Settings** moved into **Interface**.
- Interface order is now exactly: **Navigation → Dashboard Settings → Statistics Settings**.
- Mobile Settings navigation remains horizontally scrollable, but its scrollbar is hidden on mobile/tablet widths.
- Desktop Settings navigation keeps its normal thin scrollbar.
- Settings search behavior and wording remain unchanged from v220.

## Active runtime files

```text
src/js/core/runtime/998-runtime-extension-foundation-v219.js
src/js/pages/settings/146-v221-active-settings-page.js
src/js/runtime-order.json
assets/css/92-v221-settings-polish.css
assets/js/mediaflow-v221.bundle.js
```

## Build and verify

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-ui.py
```

The Chromium smoke test verifies the actual rendered Settings page, including group ordering, Updates placement, Interface ordering, Restore All Defaults alignment, search behavior, reset controls, and responsive scrollbar behavior.

## Compatibility

The stable v201 Library/data model is preserved. Cloud Sync remains v201, Full Backup remains schema v29, and Settings Preset remains schema v1.
