# MediaFlow v329 Deployment & Validation

## Installation state
- This release's source ZIP is built from MediaFlow v328 Community Modular.
- Updated Supabase Edge Functions **mediaflow-public-live v3** and **mediaflow-community-live v2** were deployed to the linked `mediaflowcloud` project `zkmsvqepyraehaeydhpa`.
- **No SQL migration** is needed; the existing v328 ID-only `mf_collection_shares_v328` table and its Row-Level Security policies remain in place.
- Do **not** recreate `mf_public_library`, `mf_public_collections`, `mf_public_workspace_v325`, or other duplicated media stores. Existing private account state must remain authoritative.
- The GitHub Pages repository is still on its older release until v329 frontend files are actually deployed.

## Deploy frontend
1. Back up the current GitHub Pages working tree (or create a rollback branch).
2. Deploy the complete v329 package contents at the MediaFlow GitHub Pages root. Keep relative directory structure intact.
3. Ensure the PWA service worker and HTML reference the v329 bundles and `mediaflow-pwa-v329-shell-v1` cache.
4. Reload/upgrade installed PWAs and verify MediaFlow `VERSION` or `version.json` displays 329.
5. Confirm public-profile URL and normal private Workspace navigation are working.

## Manual acceptance checks
- Open your profile from a **second signed-in user** and signed-out guest. Verify every public tab's read-only access, correct category icons, live Categories and counts, correct History media names and covers, and that public Old System shows only Stats.
- In your private Workspace, verify **Collection Details → Make Public / Make Private** and immediately check the result from the visitor's Community Collection directory.
- Public Library: click a cover/title; confirm only read-only details and Quick Add. The visitor must be able to choose their own Category and add the title to their own account only; private Workspace Library controls must remain unchanged.
- Public Statistics: hide avatar/name/account only inside public profile; check that Titles/Sessions/Time Consumed remain visible; heading must read Active time.
- Personal Order: remove public Add Title / Add Collection authoring panels; the private Workspace must retain them.
- Profile Studio: test Favorites search, result ranking, artwork and pagination for large Libraries.
- XP parity: compare **exact total XP and derived Level** between owner private Workspace, Community User Rankings and the owner's public-profile header **after normal Cloud Sync**. Confirm a second user's XP doesn't leak and private XP opt-out is respected.
- Confirm no extra public media rows are created in older publication tables, and no `mf_public_library` publisher runs.

## Recovery
- GitHub Pages frontend can be rolled back to the prior commit; backend Edge Functions should be restored to prior versions if necessary. Database-side v328 cleanup is independent and deliberately does not restore duplicated media catalogs.
- The old v301 private Workspace continues to use original `mediaflow_states`, not the Community public-media mirrors.

## Scope limitations
- Mock browser/API suites validate source-level rendering and privacy but cannot substitute for live multi-account Edge Function calls or a browser test against GitHub Pages.
- Live Community queries currently decompress opted-in Workspace states on demand; monitor performance as the user base grows.
