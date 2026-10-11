# MediaFlow v374 — MAL & SIMKL Opt-In Tracking

**Release:** v374 Modular — Personal Edition  
**Baseline:** v373 Modular  
**Developer:** Alex Godly  
**Release status:** Local development candidate. The external integrations require developer registration, secret setup, Supabase migration and live account testing. This ZIP is not a claim that live synchronization is already deployed.

## Included

- New **Media Services Tracking** section within Settings Center.
- Tracking panel in **Add Title**, **Edit Title**, and **Anime Details**.
- Manual MAL and SIMKL catalog search, assignment, and season-specific links.
- Explicitly paused new links; field-level switches for progress, status, rating.
- Account connect/reconnect/disconnect and secure OAuth callback.
- Backend encrypted credentials, owner-scoped associations, retry queue, unlink cleanup, and event deduplication.
- Automatic outbound update hooks after committed MediaFlow Logging and title edits, with existing History/XP untouched.
- Offline browser retry storage with bounded queue and user-session isolation.
- Responsive layouts and v373 sorting preservation.

See `docs/CHANGELOG_v374.md` and `docs/SETUP_v374_MAL_SIMKL.md` for full details.
