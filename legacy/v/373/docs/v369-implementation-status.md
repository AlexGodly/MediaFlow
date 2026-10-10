# MediaFlow v369 — Release Candidate Status

**Baseline:** v368 · **Build:** v369 Modular Personal Edition · **Date:** October 10, 2026

## Implemented and bundled

Itemized Logging; individual timestamps and HH:MM:SS unit durations; category runtime defaults; expandable multi-title logging panels; editable season/episode details; contiguous progress calculation; mixed first-time and repeat consumption with repeat XP; grouped Consumption History details; History and Logs CSV additions; Settings Center preference; local/cloud resumable drafts, merge/recovery and Sync Now item checks; full backup manifest; updated PWA cache, version metadata and bundle. Original Quick Logging remains.

## Executed release-candidate checks

- Node itemized contract: PASS.
- Headless Chromium editor/category and mixed-repeat smoke tests: PASS.
- Python build, JavaScript syntax, and repository version/PWA integrity checks: PASS.
- Packaged archive CRC/integrity: PASS.
- Connected Supabase public JSONB state table and RLS setting inspected read-only; no SQL change made.

## External verification not completed

- Authenticated multi-device editing and live offline reconnection under real network faults.
- All legacy import/export variants and complete backup restore with production account data.
- Installed PWA automatic updates on Android, iOS and desktop.
- Physical-device 30k–50k-title performance benchmarks.
- Full per-title mixed Quick/Itemized editing for existing queued entries; changing the overall interface with queued titles is deliberately blocked rather than discarding data.

The source/compiled project is delivered as a **development release candidate** for staging, not as a claim of verified production deployment. The v368 production branch remains untouched. See CHANGELOG_v369.md.
