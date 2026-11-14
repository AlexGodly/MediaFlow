# MediaFlow v470 — Cloud, PWA, Transfers & XP Reliability Audit

## Changes
- Current release version is stamped dynamically in **Full Data backups**, **automatic backups**, **Settings Presets**, **Personal Order exports**, and **Collections exports**. Removes the stale 405 export stamps that remained in the v402/v405 audit wrappers after later releases.
- Full Data and scheduled automatic backups use the exact same canonical cloud snapshot fields, preserving Library title metadata, History, unit timestamps, settings, XP event ledger, Personal Order, collections, deleted collection tombstones and both Fresh Episodes engine preferences/results. Does not change cloud schema.
- Settings export now preserves every current setting, including the newer advanced fresh engine, background-process controls, update preferences and auto-export configuration. It does not silently reset settings to old preset defaults.
- Protected **Sync Now** post-upload readback verifies every serialized cloud field, including future additive fields, instead of only the older v402 allowlist. A missing/mismatched field reports failure; no success claim based on counts alone.
- New `App.v470AuditDataIntegrity()`: read-only parity and interface checks for cloud-snapshot fields, data/settings/order/collections export formats, History and XP preservation, automatic backup builder parity, JSON round-trip and export-version stamps. This audit does not upload or mutate the account or award XP.
- New `App.v470AuditPWA()`: reads hosted version with no-store and checks installed service worker version where available. No forced reload while there might be unsaved data.
- Existing PWA generator regenerates `index.html`, `version.json`, `sw.js`, the manifest and unique v470 JS cache during build. Existing update check and pre-update backup flows are preserved.
- Legacy imported JSON and presets remain supported by unchanged schema validators. No live user data or Supabase DDL is changed.

## Validation
- `node scripts/test-v470-transfer-integrity.cjs`: tests stale stamp repair, full/automatic account parity, Settings, personal order, collections, readback mismatch detection, XP read-only behavior, and PWA version diagnostic.
- `python scripts/build.py`, JavaScript syntax check, `python scripts/check.py`, version/PWA artifact coherence.
- Project release process: archive `legacy/v/470`, merge passing PR, deploy Pages, numeric `470` Stable release with ZIP and SHA256.

## Operational verification boundary
Local tests validate serialization and interface contracts, **not an authenticated cross-device Supabase round-trip**. Test Save -> Sync Now -> refresh/login on second device before concluding all real account data is synchronized. The service worker cannot safely hot-reload tabs with unsaved edits.
