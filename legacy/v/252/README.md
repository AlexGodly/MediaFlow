# MediaFlow v252 — Modular Project

**App release:** v252  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v252 introduces an optional per-title **Seasons View**. Titles can store editable season progress/totals, display that breakdown in Title Details, and use Season + Episode input during normal **Last progress** logging. MediaFlow translates the season-local position back into the existing aggregate title progress, then keeps both views synchronized. Supported service imports such as Simkl can also populate season metadata when the source provides it.

## Main v252 changes
- Added optional per-title Seasons View with add/edit/remove season rows.
- Added season breakdowns to Title Details plus a dedicated season manager.
- Made title Progress/Total derive automatically from the sum of season rows while Seasons View is present.
- Added a Seasons View toggle to normal **Last progress** logging for seasonal titles.
- Added Season + Episode logging with automatic aggregate conversion (for example S5E3 → 37/42 and +3 when the previous aggregate was 34).
- Preserved existing repeat/rewatch behavior and attached season context to History title rows when used.
- Added supported-service season metadata import, including Simkl-style season progress/totals when actually provided.
- Added explicit cloud merge, Full Backup and generic exchange round-trip support for season metadata without a schema bump.
- Added responsive season UI for desktop, tablet, mobile and very narrow mobile widths.
- Advanced the PWA shell to `mediaflow-pwa-v252-shell-v1`.

## Preserved v250/v251 systems
- Cloud Sync v201 and strengthened Sync Now verification.
- Full Backup Schema v29 and Automatic Backup.
- Settings Preset Schema v1.
- Personal Order Export v4.
- Complete Library History cloud preservation.
- Current XP/progression persistence and History export.
- Managed application updates and separate v247-style PWA install/diagnostics card.
- Covers+Titles label and semantic icon in Normal/Dynamic Library.

## Build and validation
```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v246.py
python scripts/smoke-v247.py
python scripts/smoke-v249.py
python scripts/smoke-v250.py
python scripts/smoke-v252.py
```

Deploy the project root to GitHub Pages as usual. MediaFlow continues using relative PWA paths for `https://alexgodly.github.io/MediaFlow/`.

See `docs/CHANGELOG_v252.md` for release details.
