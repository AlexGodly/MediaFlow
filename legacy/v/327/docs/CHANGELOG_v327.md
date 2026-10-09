# MediaFlow v327 — Live Public Workspace (Single Source of Truth)

**Date:** 2026-10-09  
**Base:** v326 Community Modular  
**Owner:** Alex Godly  
**Status:** Packaged + Supabase Edge Function deployed; production cutover and legacy data cleanup pending verification.

## Purpose
Public profiles should SHOWCASE the account owner's existing MediaFlow cloud state instead of storing another copy of that owner's Library, History, Collections, Personal Order, Old System and Statistics records.

## Core implementation
1. Deployed a new public read-only Supabase Edge Function `mediaflow-public-live` (v2) that authenticates **visibility**, not the visitor: it only serves public profiles and only the enabled tab, reading the owner's current `mediaflow_states` account row with server-side privileges. The compressed gzip JSON is decoded on the server and **never returned raw** to the client.
2. The endpoint returns a constrained, per-tab read-only projection with a maximum of 500 records per response. Fifteen sections are supported: `meta`, `library`, `history`, `collections`, `collection_titles`, `order`, `order_titles`, `order_collections`, `old`, `old_transactions`, and the five Statistics sections.
3. The v327 frontend queries those live sections, restoring the original Workspace renderer and preserving v325/v326's visitor-state isolation and read-only event allowlist. It displays the current cloud update timestamp and offers **Refresh live view**.
4. Profile Studio saves visibility, identity, favorites and social-profile **settings only**. The v323/v325/v326 bulk snapshot publishers are bypassed. The redundant `mf_public_profiles.personal_order` title list is saved as an empty list. The obsolete “Refresh published pages” button is removed from the Profile Studio header.
5. Original Workspace data updates become visible on public refresh **after the owner's private Cloud Sync succeeds**. Live access does not mean the owner's unsynced local changes are visible.
6. Legacy public page fallback is disabled for the native v327 page, so the new version does not silently fall back to the stale duplicate-copy interfaces.
7. Existing original Workspace renderer functions (`renderLibrary`, `v274RenderCollectionsPage`, `v287RenderOrder`, `renderOldSystem`, `renderHistory`, `renderStats`) remain intact.

## Public-data privacy
- Public tabs use explicit section checks tied to `profile_v323.tabs` and the older Library/History/Personal Order/Statistics flags.
- No `mediaflow_states.state_data`, authentication secrets, tokens, or arbitrary cloud-state keys are returned.
- Public detail projections deliberately omit freeform Library descriptions/notes and History session notes; fully unfiltered raw private Workspace state must never be returned by a public endpoint.
- Reading is anonymous so public profiles remain visible to signed-out visitors; no write endpoint exists.
- Publicly visible History, rating and activity data can reveal media habits. Review tab visibility accordingly.

## Database migration
No new SQL table is required. The v323/v325/v326 tables remain for a safe, backward-compatible transition. The Edge Function is live, but the v327 frontend is **not yet deployed to GitHub Pages**.

## Legacy data cleanup — staged, not yet executed
- Dedicated v325/v326 public Workspace snapshot table: `mf_public_workspace_v325` (308 chunks at audit time): clean up **after** v327 is deployed and live public-profile requests are verified.
- v323 showcase pages: `mf_public_showcase_v323` (3 rows at audit time): also removable after switching away from old profile pages.
- Legacy `mf_public_statistics` and `mf_public_history`: further audit before deleting; older Community UI and RPCs may still read them.
- Legacy `mf_public_library` (31,414 rows at audit time) and `mf_public_collections` support Browse, Ratings/Rankings, and Collection subscriptions. Removing them without replacing those separate Community indexes would break existing functionality. They are NOT deleted by this release. A Community Browse/index migration is required to remove all such materialized data safely.
- The SQL cleanup file in docs is **manual and gated**. Do not apply while v326 remains deployed.

## Testing
- v327 six-native-tab browser suite: 152 assertions across 1440/768/390/320 px.
- Six inherited suites: 444 assertions across social UI, relationship/Collections UI, Browse, Active-Time XP, Workspace and XP/Community.
- Total: **596 passing assertions** with mocked live endpoint responses.
- Final JavaScript bundle syntax check: pass.
- Edge Function TypeScript syntax parse: pass.
- Supabase Edge Function deployment status: ACTIVE, version 2.
- **Outstanding:** real remote API smoke test and production GitHub Pages cutover with two-account privacy testing; outbound networking is not available inside this build container. Browser tests use mocks, not live responses. Do not claim production parity until checked.
