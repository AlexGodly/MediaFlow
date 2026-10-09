# MediaFlow v327 deployment & safe migration

## What is installed
The Supabase Edge Function `mediaflow-public-live` has been deployed to the existing `mediaflowcloud` project. It reads the existing `mediaflow_states` record and serves only visible, sanitized, read-only sections. No new SQL migration is required.

## Cutover
1. Keep the currently deployed v326 website and database unchanged until ready to deploy.
2. Deploy the contents of `MediaFlow_v327_Community_Modular.zip` to GitHub Pages and ensure the PWA has updated.
3. From a signed-out browser, open a public profile. Verify all six visible tabs and a tab hidden in Profile Studio. Check that the hidden tab is not available through API requests. Verify the owner and visitor have different Libraries.
4. Change a title status in the owner's Workspace and finish Cloud Sync. Refresh the public profile and verify the change appears **without Save & Publish**.
5. Verify Friends, Browse, Community Ratings, User Rankings, and subscribed Collections are not broken.
6. Only then, after taking an independent database backup, apply the optional `SQL_v327_cleanup_legacy_profile_snapshots_AFTER_CUTOVER.sql` to remove dedicated v323/v325 public-profile snapshot data.
7. Do not delete `mf_public_library` or `mf_public_collections` in this release: Community features still depend on them. Migrating those features to live data needs another deliberate redesign.

## Important security considerations
- The Edge Function has `verify_jwt=false` because public profiles are intentionally guest-accessible. The function enforces `is_public`, per-tab visibility, and legacy publication flags **inside** its handler. The service-role key stays server side. Treat changes to this code as sensitive.
- The service performs a fresh gzip decompression per request; at high traffic, add robust edge-side rate limiting, caching and pagination optimization. No claim of production load testing is made.
- Large Libraries are returned in batches up to 500 records. The client assembles sections before native rendering, similar to the old Workspace behavior; performance with 50,000 titles needs real stress testing.
- A public tab can reveal media habits. Freeform notes and descriptions are intentionally excluded, so read-only public rendering is similar but not identical to all private content.
