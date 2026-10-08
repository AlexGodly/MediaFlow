# MediaFlow v302 — Community Beta (built from v301)

**Base:** stable MediaFlow v301 (itself based on v298). Experimental Logging Intensity is **not** included. Existing Workspace and Current Rerolls v301 fixes remain.

## Included
- Guest-facing MediaFlow homepage with public navigation and Workspace/Login switching.
- Public profiles with unique usernames, optional bio/avatar, XP/level, visibility controls, followers/following, and favorite-title showcase.
- Users directory, profile search and mutual-Friends workspace page.
- Separate opt-in publication of Library and History; private MediaFlow account state is not publicly accessible. Paginated public Library and History views.
- Individual Collection sharing via opt-in toggles; public Collection URLs and GitHub Pages deep-link fallback (404.html).
- Shared Browse Titles and Ratings with provider-ID grouping, server-side aggregate counts/status distribution/ratings and rotating contributed covers, with server-side search and pagination.
- Quick Add from a community title into private Library with Category/Status/Priority selection.
- Private Inbox with direct messages, reply composer, unsend, per-user conversation clearing, user blocking and Realtime subscription. Desktop compact chat drawer and workspace Friends / Inbox navigation.
- Supabase database migration has been applied to project `zkmsvqepyraehaeydhpa`: nine new community/social tables with Row Level Security, opt-in public read policies, guarded message creation and update, moderation basics (blocking), rate limits and aggregation RPC. Existing `mediaflow_states` is untouched.
- New theme-matched responsive community styles, app shell cache `mediaflow-pwa-v302-shell-v1`, GitHub Pages deep-link support, and modular build source `231-v302-community.js`.

## Important beta limitations
- The browse catalog currently deduplicates by provider + external ID. Cross-provider MAL/SIMKL ID reconciliation is not yet implemented; titles with different provider IDs may appear separately.
- Realtime delivery depends on the browser having a working Supabase connection; there are no push notifications or offline message delivery notices yet.
- No message requests, typing indicators, read receipts, reactions, reporting interface, attachments, conversation muting or archiving yet.
- The public title cover rotates by five-minute time slots when a view is refreshed, not through a background live feed.
- Library and History publication are explicit snapshots: re-publish to share later changes. Large initial publications may take time and can be interrupted; the app reports errors without deleting the private data.
- Public Personal Order is a snapshot of directly ordered titles at the time the profile was saved; Collection assignments are not yet expanded in this public view.
- Favorites selector supports up to 12 titles from the private Library.
- Unauthenticated readers can see only public profiles/opted-in content; messaging requires an account.
- GitHub Pages has a deep-link 404.html fallback; custom domains and SEO/social preview rendering have not been configured.
- Supabase table and policy migrations were applied, but full multi-user end-to-end browser validation was not available in this environment. Test in staging before enabling public profiles broadly.

## Compatibility
Cloud Sync v201 · Full Backup Schema v29 · Settings Preset Schema v1 · Personal Order Export v5 · Collections Export v2. The new community data is separate from the private workspace backup; community social data is not yet included in Full Backup.

## Deploy
Replace the GitHub Pages deployment with this entire ZIP contents, including `404.html` and `sw.js`. Use an incognito browser to check guest homepage, then sign in and open Community → Public Profile to claim your username. The community backend migration is already present in the linked Supabase project; no SQL paste step is required for that project.
