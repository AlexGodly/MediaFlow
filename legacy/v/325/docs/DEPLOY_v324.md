# Deploy MediaFlow v324

1. Keep a backup of your deployed website files and important private account data.
2. Your existing v323 SQL migration is sufficient. **There is no new SQL migration to run for v324.** If you have not installed v323 yet, run its `docs/SQL_v323_public_showcase.sql` first.
3. Deploy the full `MediaFlow_v324_Community_Modular.zip` content to the root of your existing GitHub Pages MediaFlow repository, including `index.html`, `404.html`, `assets/`, `src/`, `manifest.json`, `version.json` and `sw.js`.
4. Wait for Pages deployment and reload MediaFlow; for installed PWAs use the existing update flow or reload until the v324 service worker takes effect.
5. Sign into MediaFlow, visit Public Profile → Profile Studio, then click **Refresh published pages** (or **Save and publish**) to republish the owner's read-only data. This is particularly important to populate the new category-aware Personal Order and assigned Collection summaries.
6. Open your public URL in a signed-out browser and verify the six tabs and correct categories, title details, read-only behaviors, Collections subscriptions, and dynamic guest theme. Repeat while signed in with both theme choices.

**Privacy:** Public content remains limited by existing owner tab visibility and database row-level security. Editing controls are not provided to profile visitors. Deleting or changing private data does not instantly rewrite a previously published snapshot until the owner republishes.

**Limits:** This update delivers Workspace-inspired layouts and supported browsing controls using existing publicly published fields; it does not copy private Workspace components or their mutation actions into public pages.
