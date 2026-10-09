# MediaFlow v328 — Single-Source-of-Truth Community

Release: 2026-10-09. Base: v327 Community Modular.

## Fundamental architecture change
- Public profiles retain native Workspace renderers (Library, Collections, Personal Order, Old System, History and Statistics), viewing the owner's original compressed cloud state through `mediaflow-public-live`.
- Community Browse, Top/Ratings, Collections directory and detail, saved Collections and People/Rankings now read the original owner data through `mediaflow-community-live`; all responses are computed at request time rather than sourced from replicated public media tables.
- The backend filters public profiles, section visibility, published Library opt-in and explicitly shared Collection IDs. Only whitelisted title and session fields are sent to visitors. Freeform title notes are not exposed in Browse.
- Community title identity is deduplicated using verified external IDs. Per-title average ratings, statuses, provider groupings, library counts and covers are derived live. Existing quick-add validation and 5 Browse views are preserved.
- Public Collection lists, details and saved references resolve current title data from the owner rather than duplicated media JSON. Owners share by inserting an owner/Collection-ID permission only. Saved-Collection records remain normal social relationships.
- User Rankings derive XP from the owner's existing sessions, library-addition ledger and the authoritative time-XP table, and use original server-owned app usage for active-time metrics. Private/disabled display flags remain respected.
- Favorite titles in `mf_public_profiles` now store only title IDs; public display resolves names/covers from the owner's current Library. Previously replicated XP fields are reset and not synchronized by v328.
- Media publishing, auto-refresh copy writers and Statistics snapshot writer are disabled. Profile settings still save independently without bulk media publication.

## Supabase changes applied
- Added `mf_collection_shares_v328(user_id, collection_id, shared_at)` with RLS and owner-only INSERT/DELETE; migrated previously shared Collection IDs from `mf_public_collections`.
- Cleared 31,414 rows from `mf_public_library`, one media-copy record from `mf_public_collections`, and one old Statistics snapshot from `mf_public_statistics`.
- `mf_public_history`, `mf_public_workspace_v325`, and `mf_public_showcase_v323` have zero active rows. Empty compatibility table definitions are retained.
- Original `mediaflow_states`, public profiles, friend/follow/message and saved-Collection relationship tables, app-usage and time-XP tables were preserved.
- Historical private backup schemas remain for recovery, not used by the current application.
- SQL in `docs/SQL_v328_community_share_permissions.sql` and `docs/SQL_v328_remove_duplicated_community_media.sql` documents the migration.

## Implementation
- Added `src/js/components/252-v328-single-source-community.js`.
- Added `supabase/functions/mediaflow-community-live/index.ts`.
- Redirected existing v309/v310/v311/v312/v313/v317 Community fetchers to the live API and preserved their display layouts, filters and paging.
- Updated v323 Profile Studio to store favorite IDs rather than copied title names/covers and stopped writing redundant XP totals.
- Updated v328 version, bundle, PWA asset references, service-worker cache and modular source list.
- Existing cloud sync v201, full backup v29, Settings Presets v1, Personal Order v5 and Collections v2 remain unchanged.

## Validation
- 152 native public-profile browser assertions passed at 1440/768/390/320px.
- 44 dedicated Community Browse/Ratings/Collections/People browser assertions passed at the same widths, with no legacy Community RPCs or media-copy writes in these scenarios.
- 20 mocked Edge Function API/privacy assertions passed for opt-in visibility, no private title leaks, Collection sharing, XP privacy and live favorite resolution.
- 132 inherited v320 social UI assertions passed.
- Several older v321/v322 regression fixtures expect the deleted published tables and did not complete against the new live-reader design; do not count them as passed.
- JavaScript bundle syntax and PWA generation passed.
- The new Edge Function was deployed and marked ACTIVE, but direct live HTTP and multi-account production tests remain outstanding.

## Important production caveat
Enumerating and decompressing all opted-in user cloud states for global searching is expensive as the Community grows. This release is designed for the currently small community; large-scale optimization should normalize the **authoritative** media store into searchable records rather than recreating a second public copy. Profile and publication visibility settings should always be retested after deployment.
