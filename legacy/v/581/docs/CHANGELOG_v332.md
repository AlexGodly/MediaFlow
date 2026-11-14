# MediaFlow v332 — Dedicated Supabase backend

**Release:** 2026-10-09  
**Base:** v331 Personal Edition  

## Changes

- Rebrands the new-Supabase configuration build as MediaFlow v332.
- Points the active cloud connection to the replacement Supabase project, separating it from legacy MediaFlow installations.
- Keeps the per-title logging timestamps and all Personal Edition functionality introduced in v331.
- Increments app/runtime metadata and PWA service-worker cache to v332 so existing installations refresh their app shell.
- Preserves Cloud Sync schema v201, Full Backup schema v29, and Settings Preset schema v1.

## Scope and limitations

- The new Supabase backend currently has the core `mediaflow_states` table and account deletion function.
- The Community functionality from v302–v329 is not part of the v331 Personal Edition base and is not reinstated in this release.
- Prior releases and their changelogs are retained as historical records.
