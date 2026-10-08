# MediaFlow v315 — Workspace Sidebar, Community Navigation & Social Page Headers

Built from **MediaFlow v314 Community Beta**.

**New:** Workspace navigation scrolls independently of the fixed account and XP footer. The collapsed sidebar stays compact and keeps an account-level indicator.

**Community menu:** The whole Community sidebar section can expand/collapse, while its **Community** homepage entry independently expands/collapses **Browse Titles, Collections, Ratings and Users**. Public Profile, Friends and Inbox remain available in the same group.

**Navigation Settings:** A new Community section within **Settings → Navigation** controls show/hide of the group or individual destinations, order within Community destinations and social Workspace pages, expansion defaults and resetting the Community menu. Changes persist using existing MediaFlow Settings and appear in the mobile More menu too.

**Fixed:** Workspace page headers now say **Public Profile**, **Friends** and **Inbox** with matching semantic icons, rather than raw `mf302-*` IDs and the Dashboard icon. Removed the `"(since v312)"` suffix from public-profile app time display.

**Deployment:** Copy all updated files, including `index.html`, `404.html`, `sw.js`, `assets/js/mediaflow-v315.bundle.js` and `assets/css/172-v315-workspace-sidebar-community.css`. The PWA cache is **mediaflow-pwa-v315-shell-v1**. **No database migration needed.**

**Compatibility:** Cloud Sync v201, Full Backup v29, Settings Preset v1; existing v314 Community media providers, public profiles, Collections, Library, Rankings and Quick Add are inherited. Logging Intensity remains removed. See `docs/CHANGELOG_v315.md` for complete release notes.

**Testing:** New v315 browser suite passed 84 assertions at desktop and mobile widths. v314 media-source/rankings (57) and v313 Workspace Collections (54) regressions also passed against v315. Browser authentication and Supabase data were simulated; deploy and test with real accounts before treating Community Beta as production-verified.
