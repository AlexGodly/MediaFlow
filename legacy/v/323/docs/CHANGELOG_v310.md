# MediaFlow v310 — Public Collections Views & Live Saved Community Collections

**Base:** v309 Community Beta. **Private data:** Cloud Sync v201 / Full Backup v29 / Settings Preset v1. **PWA:** `mediaflow-pwa-v310-shell-v1`.

## Public Collections directory
- **Five views:** List, Compact, Cards, Covers, Covers+Titles, with responsive desktop/tablet/phone layouts and active-view controls.
- **Search:** collection name, description and creator username, with a short debounce.
- **Global sorting:** Recently Updated, Title, Title Count, Creator; all support Ascending/Descending, with database-side ordering before pagination.
- **Filters:** Minimum title count (Any, 1+, 5+, 10+, 25+, 50+) and artwork (All / With Artwork). Reset and 40-per-page navigation.
- **Creator attribution:** visible creator name/username in each directory card, linking to the creator's public profile.
- **RLS-backed catalog:** only Collections currently marked public, from owners with public profiles, appear in public discovery.

## Community Collection detail
- **Workspace-style cover hero** with background derived from published collection artwork, title, description, title count and last updated date.
- **Creator profile link** available inside the detail hero and collection listings.
- **Five title views:** List, Compact, Cards, Covers, Covers+Titles. Read-only title cover, status and published rating display.
- **Collection Tools:** title search, sorting (manual/order, title, rating, status), ASC/DESC, status and cover filters, reset and 50-titles-per-page navigation.
- **Direct URLs:** `/MediaFlow/<username>/Collections/<collectionId>`; updated local hash routing for Collection profile paths.
- No other user's private Library fields are exposed; only the explicitly published Collection item snapshot is displayed.

## Live saved community Collections in Workspace
- **Save to My Collections** on directory cards and collection details for signed-in visitors; guests are directed to Login.
- **Cloud-persisted references** in `mf_saved_collections` for the subscriber, not copies of items inside `S.collections` or the private Library.
- **Workspace Collections filter:** My + Community, My Collections, Community Collections.
- **Creator attribution & clickable public profile** on every available saved card and detail.
- **Open saved Collection inside Workspace:** a read-only, Workspace-themed Collection detail page; refreshes server state before revealing saved contents.
- **Live updates:** existing explicitly-public Collections are republished automatically after a successful owner collection/Library save when published content changes. Subscriber view refreshes on entry, periodically while viewing Collections, and via Refresh.
- **Privacy revocation:** if the owner hides a Collection, deletes it, or disables the public profile, subscribed Collections display **Collection unavailable** rather than stale content after refresh. Owner-initiated Collection deletion also unpublishes its public record.
- **Remove saved:** deletes only the subscriber's saved reference; does not touch the creator's Collection.
- **No takeover/edit controls:** saved Collections remain read-only and owned by their creators.

## Backend
- `docs/SQL_v310_saved_collections.sql` — `mf_saved_collections` table, primary key `(user_id,owner_id,collection_id)`, own-record SELECT/INSERT/DELETE RLS, INSERT only if the target Collection and creator profile are public; `mf_public_collections_v310()` catalog RPC with public-only filtering and global server-side sorts.
- Migration was applied to the connected MediaFlow Supabase project. Other deployments must apply the included migration.
- `src/js/components/235-v310-public-collections-live-saves.js` and `assets/css/167-v310-community-collections.css`.
- Private Cloud Sync v201, Full Backup v29, Settings Preset v1 unchanged. Logging Intensity remains removed.

## Validation and limitations
- The v310 browser suite checks guest browsing, five views, filters, profile links, save/remove, Workspace source switching, saved read-only detail, owner updates, publication revocation and mobile widths 1440/390/320px using simulated Supabase responses and accounts.
- v309 Browse Titles and Quick Add regression suite was rerun against the v310 bundle.
- Public Collection updates are **near-live**, not guaranteed instantaneous: they synchronize after successful saves and become visible on refresh, navigation into Workspace Collections, or periodic refresh while the Collections page is active. They depend on the creator keeping the Collection and profile public.
- Real multi-account authentication, cross-browser cloud saves, and very large public Collections should still be verified on the deployed GitHub Pages app. Public published item fields are limited to the existing public Collection snapshot.
