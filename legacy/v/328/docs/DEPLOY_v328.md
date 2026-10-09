# MediaFlow v328 deployment

## Already applied to Supabase
1. `mediaflow_v328_collection_sharing_permissions_only` — ID-only sharing permission table and migration of existing public Collection choices.
2. `mediaflow-community-live` Supabase Edge Function is deployed and ACTIVE (v1). `mediaflow-public-live` remains ACTIVE (v2) for native public-profile tabs.
3. `mediaflow_v328_clear_community_library_index`, `mediaflow_v328_clear_public_collections_mirror`, `mediaflow_v328_clear_public_statistics_mirror` — duplicated media copies removed.
4. `mediaflow_v328_profile_favorites_ids_only` — profile Favorite IDs retained, replicated XP totals reset.

## Frontend cutover
1. Deploy *contents* of the v328 package to the GitHub Pages repository (currently observed at v301, not v328).
2. Confirm `version.json` reports 328, the service-worker cache is `mediaflow-pwa-v328-shell-v1` and `assets/js/mediaflow-v328.bundle.js` loads.
3. In two different accounts, check public Library, History, Collections, Personal Order, Old System and Statistics. Confirm hidden pages fail even if API requests are made directly.
4. Open Browse and Top/Ratings: titles should appear only when owners opted into sharing their Libraries. Check verified MAL/SIMKL IDs, ratings, provider filters, status, pagination and Quick Add.
5. Share a Collection. Ensure only `mf_collection_shares_v328` receives its ID. Verify directory, detail, saved-Collection references, removing permission, and deletion behavior.
6. Check People/Rankings and the live profile XP against the current owner's Workspace ledger. Confirm no private XP is disclosed.
7. Change owner data, finish normal Cloud Sync, refresh public view and verify the new title/progress/Collection content appears automatically without publication.
8. If a PWA is installed, apply the v328 update and reload. Keep a rollback copy of the v327/v301 frontend.

## Important
No v328 SQL steps are needed **again** on the connected `mediaflowcloud` project; the changes have been applied. Re-running destructive cleanup scripts on another project must follow its own backup/review. Existing **historical backup schemas** are kept separately and are not served by Community. This release does not change the primary `mediaflow_states` record or private cloud migration format.

The live API's current method decompresses the original state to serve Community searches. It avoids persistent duplicate data but can be CPU/memory intensive for much larger user counts. Treat large-scale performance and full real-account end-to-end verification as post-deployment validation requirements.
