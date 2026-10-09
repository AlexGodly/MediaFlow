# Deploying MediaFlow v323

1. **Back up your existing Supabase database and MediaFlow account data** before upgrading from v322.
2. Sign into the Supabase project used by your MediaFlow deployment. Open its **SQL Editor**.
3. Run **`docs/SQL_v323_public_showcase.sql`** after the previously required Community migrations (v302–v316). Verify that execution succeeds. This SQL has not been applied automatically and has not yet been integration-tested against your live project.
4. Upload the complete v323 web application files from this archive to the root of your GitHub Pages MediaFlow site, keeping all directory paths. Commit/publish changes and let Pages complete deployment.
5. Load the site, reload any installed PWA to pick up the `mediaflow-pwa-v323-shell-v1` cache, and open **Community → Public Profile / Profile Studio**.
6. Carefully review tab visibility, bio, cover/avatar URLs, favorite titles, social links and Discord names before selecting **Save and publish**. Saving enables the public profile and publishes visible sections and Collections; there are no separate opt-in buttons.
7. Visit the published username URL **in a signed-out or private browser window** and verify the visible sections, theme and category/XP information. Repeat with another signed-in account to test Collections Open/Subscribe and member theme selection.
8. For future updates to media contents, use **Refresh published pages** or **Save and publish**. Public pages display the last completed publication, not a live read of the private Workspace.

**Notes:** The v323 public read-only interfaces replicate common Workspace browsing workflows but are not exact clones of all private editing UI. The new SQL controls normal table visibility; older global Community RPC surfaces may have separate publication policies. Verify sharing carefully. For a very large Library, publication may take time; keep the publishing page open until it confirms success. A failure after the profile header saves may leave some public snapshots outdated until you retry publication.
