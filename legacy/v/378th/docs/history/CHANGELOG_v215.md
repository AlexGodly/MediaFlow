# MediaFlow v215 — Modular Project Refactor

## Base

- Rebased from stable **MediaFlow v201**.
- Feature behavior and persistent-data formats intentionally remain v201-compatible.

## Structure

- Replaced the giant inline application script with an external generated JavaScript bundle.
- Split the JavaScript source into ordered logical source fragments for safer maintenance.
- Extracted all 74 inline `<style>` blocks into 9 organized external stylesheets while preserving cascade order.
- Reduced `index.html` to a clean application entry point.
- Added a build manifest and reproducible JS build script.
- Added structural/integrity checks.
- Added deployment documentation.
- Added the `manifest.json` and `sw.js` files already expected by the stable application when hosted.

## Versioning

- App version: **215**
- Cloud Sync: **201**
- Full Backup schema: **29**
- Settings Preset schema: **1**

No new persistent fields are introduced by the refactor.
