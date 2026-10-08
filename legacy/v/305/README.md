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
