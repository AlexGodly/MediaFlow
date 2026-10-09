# Deploy MediaFlow v326

**v326 requires a new Supabase SQL migration and owner republication.**

1. Keep an independent backup of your existing Supabase database and previous website package. An in-database table copy is not an off-site backup.
2. In the correct Supabase `mediaflowcloud` project, ensure v323 and v325 migrations are installed. Run `docs/SQL_v326_native_public_statistics.sql` in the SQL Editor. This adds five public Statistics section names and revises the v325 public read policy; it does not delete the older public Statistics snapshot.
3. Upload the entire v326 application contents to the MediaFlow GitHub Pages root, including `assets`, `index.html`, `404.html`, `sw.js`, `version.json`, and the manifest. Confirm the version shows 326.
4. Update the installed PWA if relevant.
5. Sign in to the owner's account and choose **Public Profile → Profile Studio → Refresh published pages** (or Save and publish). Leave the page open for large Libraries. The new Statistics publication uses 150-record chunks and may be lengthy.
6. Open the public profile in a signed-out/private window; confirm Statistics uses the same native Workspace cards and analytics, displays the owner's Level and time-XP data, allows supported read-only recaps, and does not show edit controls.
7. Open another account's profile while signed in, then return to your private Workspace and verify your personal records are unchanged.
8. Hide Statistics and verify it is no longer publicly readable. Republish to remove its stored publication rows.

**Privacy:** Enabling Statistics shares more than simple totals: title identifiers and names, completion dates, media ratings and consumption patterns may be included so the original renderer can reproduce the statistics accurately. Private text notes, synopses/descriptions and service IDs are excluded from the Statistics-only title/session projection. Review what you publish before activating the tab.

**Fallback:** If v326 public Statistics has not yet been published, visitors see a clear message and can use the earlier sanitized snapshot. Applying SQL alone does not publish private data.

**Migration status:** The v326 SQL file is provided in this release. It has not been applied to your live Supabase project during packaging.
