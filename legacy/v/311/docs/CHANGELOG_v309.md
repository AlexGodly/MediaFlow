# MediaFlow v309 — Browse Views, Community Sorting/Filters & Verified Quick Add

**Base:** MediaFlow v308 Community Beta. **Private Workspace:** preserved.

## Browse Titles
- Five display modes: **List**, **Compact**, **Cards**, **Covers**, **Covers+Titles**.
- Theme-aware responsive UI with mobile-friendly filters, title artwork, library counts, community ratings and status percentages.
- Search with debouncing and adjustable sorting: Library count, Title, Average rating, Rating count.
- **Ascending / Descending** direction available for each sorting field.
- Server-side filters: source (MAL/SIMKL), community status (Watching, Completed, Planned, On Hold, Dropped), minimum library count, minimum community rating.
- Filtering and sorting happens in PostgreSQL **before pagination**, not just over the current 60 items. Previous/Next pagination and reset controls provided.

## Quick Add
- Fixes broken Browse Quick Add behavior. Clicking Quick Add opens a real import dialog and **does not redirect to Library**.
- Shows verified title name and provider ID, publicly published media metadata, artwork options, category assignment, status, and priority.
- Choose from available published cover URLs (up to 30 in the first query) or enter a custom HTTPS artwork URL. Selected image preview updates.
- Saves with **MediaFlow's existing private Library persistence**, with the selected Category, cover URL, imported title metadata, original external provider ID and original media total where provided.
- Does **not** copy other users' personal progress, status, rating or private account information. New entry starts at progress 0, with the user's chosen status and priority.
- Duplicate verified provider-ID import blocked. Errors displayed without incorrectly claiming success; adds only when user confirms.
- Existing **Community Ratings Quick Add** uses the same improved dialog.
- Opt-in Library publisher now includes **whitelisted media metadata** (synopsis, genres, year, season, type, duration, release date) in separate public records; never automatically publishes private Library data.

## Backend
- `docs/SQL_v309_browse_titles.sql` adds an optional `metadata` JSONB column to `mf_public_library` and a read-only `mf_browse_titles_v309` RPC.
- Requires the owner's profile **public + show_library** to contribute. Only verified MAL/SIMKL identity groups appear.
- Aggregated counts prevent a single user from contributing multiple duplicate entries for the same provider and ID.
- Server-side sorted and paginated results keep the Community responsive with large Libraries. Supports up to 60 results per page.
- The database migration has been applied to the connected Supabase project. Keep the SQL file for other instances.

## Compatibility and validation
- Private Workspace data formats unchanged: Cloud Sync v201, Full Backup Schema v29, Settings Preset Schema v1, Personal Order Export v5, Collections Export v2.
- Logging Intensity remains removed. v301 Current Rerolls fixes, all social pages, public Statistics and the v308 theme behavior preserved.
- v309 PWA: `mediaflow-pwa-v309-shell-v1`.
- Build, JavaScript syntax and project integrity checks passed. Isolated real-bundle browser tests passed at 1440px, 390px, and 320px with mocked Supabase responses, including five view modes, global filter arguments, cover and Category selection, persistence, Ratings Quick Add and guest Login behavior.
- **Community Beta:** live multi-user acceptance testing on the deployed website is still required.
