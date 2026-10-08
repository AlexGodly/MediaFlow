# MediaFlow v310 — Public Collections Views & Live Community Saves

Built from v309. Public Collections now have List, Compact, Cards, Covers, and Covers+Titles with server-side filters/ASC-DESC sorts; Collection detail uses a Workspace-inspired, read-only title Library with creator profile links. Authenticated users can save a live reference to a public Collection and view it inside Workspace → Collections with **My + Community / My / Community** source filters. After a creator explicitly publishes a Collection, later changes to that public Collection are synchronized after successful saves; subscribers receive the latest published version upon refresh. No private data is automatically published. **Guests retain their original theme; logged-in users retain Workspace theme integration.**

Database: `docs/SQL_v310_saved_collections.sql` was applied to the connected Supabase project; other Supabase instances must apply it. Full details: `docs/CHANGELOG_v310.md`. Tests: `python scripts/test-v310-live-collections.py` and `python scripts/test-v310-browse-regression.py`.

# MediaFlow v309 — Browse Titles Views & Quick Add

Built from v308. Five Browse view modes, server-wide sorting/filtering (ascending/descending), and working Category/cover-selecting Quick Add with verified external IDs. See `docs/CHANGELOG_v309.md`. Database migration `docs/SQL_v309_browse_titles.sql` has been applied to the connected Supabase project.

# MediaFlow v308 — Community Theme Parity

Built on v307 Community Beta. Guests retain the original Community theme; authenticated visitors see the current private Workspace theme (including theme palette, appearance mode, platform/full-style themes, custom colors and dynamic-cover accent). No separate public theme setting or database migration is needed.

Source: `src/js/components/233-v308-community-theme-parity.js`. Stylesheet: `assets/css/165-v308-community-theme-parity.css`. Existing private Workspace and Community features are preserved.

Rebuild: `python scripts/build.py`; validate: `python scripts/check.py`.

MediaFlow v307 — Login route navigation error fix. See docs/CHANGELOG_v307.md.

MediaFlow v306 — Community navigation and clickable controls repair. See docs/CHANGELOG_v306.md.

MediaFlow v305 — Community navigation, login stability and logo glow. See docs/CHANGELOG_v305.md.

# MediaFlow v304 — Public Full Statistics + Local Startup Repair

Built from v303 Community Beta; v301 private Workspace features preserved.

## Changes
- Fixes the blank `Loading MediaFlow…` page when `index.html` is opened directly via file:// by resolving asset base paths dynamically. Existing GitHub Pages `/MediaFlow/` and deep-link paths remain supported.
- Adds opt-in **Show Full Statistics on public profile** setting and an independently confirmed **Publish Full Statistics snapshot** action under Workspace → Public Profile.
- Published Statistics reproduce the existing complete Statistics dashboard as a read-only HTML snapshot, including its chart markup. External interactive controls are removed. Snapshots are sanitized, size-limited, rendered in a no-scripts sandboxed iframe, and guarded by Supabase Row Level Security.
- Snapshot refresh is manual. Turning visibility OFF immediately blocks public database access without deleting published data. No other private Workspace data is auto-published.
- The database migration `docs/SQL_v304_public_statistics.sql` must exist in the associated Supabase project. The migration is deployed to the connected project.
- Rebuild from source via `python scripts/build.py`; `index.html` and `404.html` are kept in sync; PWA cache advances to v304.

**Limits:** Full interactive Statistics controls are intentionally disabled in public snapshot views. Live integration should still be checked using an authenticated account; the public Statistics view requires the owner to save its visibility and publish a snapshot.
