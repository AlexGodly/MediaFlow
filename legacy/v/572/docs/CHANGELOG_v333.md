# MediaFlow v333 — Supabase Backend Reconfiguration

**Release:** MediaFlow v333  
**Base:** MediaFlow v332 Modular  
**Created by:** Alex Godly

## New Supabase Project

- Reconfigured MediaFlow's active cloud connection to the new Supabase project (`wgeijxfdpgehesxialxm`).
- Updated the publishable API key for the replacement project.
- Separated the v333+ active cloud connection from previous Supabase projects.
- Created `public.mediaflow_states` with per-user RLS and authenticated ownership policies.
- Installed `delete_my_account()` for authenticated account deletion.
- The new database is empty: create a new account and restore your JSON backup.

## v333 Release Metadata

- Updated VERSION, version.json, HTML version marker, app bundle filename, runtime version and PWA service-worker cache identifier to v333.
- Preserved MediaFlow v332 application features and existing backup format.
- Updated the active source constants and packaged runtime bundle; archived versions are unchanged.

## Limitations

- The new Supabase backend currently supports core personal cloud-state storage. Community/social tables and Edge Functions are **not** installed by this release.
- Live end-to-end sign-in, JSON import and synchronization must be tested after deployment.
- A new project isolates older app versions using the prior project's credentials, but does not prevent anyone with the new public credentials from accessing the new project's protected APIs subject to RLS.
