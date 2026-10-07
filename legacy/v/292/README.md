# MediaFlow v292 — Recommended Title Cover Background

**App release:** v292  
**Cloud Sync:** v201  
**Full Backup:** Schema v29  
**Settings Preset:** v1  
**Personal Order Export:** v5  
**Collections Export:** v2

## v292

- Added an organized **Recommendation background** control inside **Settings → Dashboard Settings**.
- Default remains **Default MediaFlow logging theme**.
- Added optional **Recommended title cover as background** mode for the active Next Task / logging hero.
- Cover mode uses the actual current recommendation cover as a layered, darkened, blurred, theme-aware atmospheric background while preserving the normal title-cover thumbnail and all controls.
- Titles without a real cover automatically fall back to the default MediaFlow theme.
- The option is visual only and does not modify recommendation selection, rerolls, Personal Order traversal, logging, XP, History, or scheduler behavior.
- Preference is canonical Settings data and participates in normal Settings persistence, Cloud Sync, Sync Now, Full Backup and Settings Preset flows.
- Dashboard Settings reset and per-setting reset include the new preference.
- Responsive safeguards reduce artwork intensity on tablet/mobile widths to keep content readable.
- PWA shell advanced to `mediaflow-pwa-v292-shell-v1`.
- No destructive data migration required.
