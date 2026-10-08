# MediaFlow v313 — Community & Collections UI Refinement

Built directly on v312; existing private Workspace, Community Beta, and legacy features are preserved. This release fixes opening **owned Workspace Collections** (v310 intercepted the browser renderer even with an active Collection), reorganizes Workspace Collections into **Together** or **Separate tabs** with an All / My / Community filter in the combined view, and moves **Refresh saved** into the main action bar. Saved Community Collections stay read-only live references to their creators and honor existing privacy settings.

Community UI improvements: reorganized Ratings and Users filter toolbars, a custom portrait icon for **Avatars**, a responsive Top 3 Users Ranking podium with clear numbered positions, improved ranking cards, and an exact **Community Browse Title Count** (distinct public verified MAL/SIMKL identities, including unrated titles). Public profiles gain a guest-accessible **Share profile link** button and the public-profile editor adds a copy action. The optional usage sharing label no longer contains '(tracked from v312 onward)'; historical tracking semantics are unchanged.

**Database:** `docs/SQL_v313_community_title_count.sql` creates `mf_community_title_count_v313()`. The migration was applied to the existing connected Supabase project. Other deployments must run that SQL. It counts only eligible opted-in publicly visible Library identities, not private titles. Browse caches the count for five minutes to minimize database load.

**App/Bundle/PWA:** v313 / `mediaflow-v313.bundle.js` / `mediaflow-pwa-v313-shell-v1`. Existing Cloud Sync v201, Backup v29 and Settings Preset v1 remain unchanged. Logging Intensity stays removed, and the canceled mobile History redesign stays excluded. See `docs/CHANGELOG_v313.md`.

**Verification:** Scripts `test-v313-community-regression.py`, `test-v313-workspace-collections.py`, `test-v313-collections-regression.py`, plus v312 Browse regression. Browser tests use simulated accounts and DB responses; a live real-account cross-browser check after deployment is still recommended.
