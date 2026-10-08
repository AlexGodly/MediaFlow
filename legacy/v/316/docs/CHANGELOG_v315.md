# MediaFlow v315 — Workspace Sidebar Navigation, Community Menu Controls & Social Page Header Repair

**Base:** MediaFlow v314 Community Beta  
**Release date:** October 8, 2026  
**Developer:** Alex Godly  
**Version:** 315

## Sidebar navigation layout
- The Workspace sidebar now has **three distinct areas**: MediaFlow branding at the top, an independently scrolling **page navigation list**, and a fixed **account / leveling footer** at the bottom.
- Long navigation menus no longer push the signed-in account, XP level and account controls below the viewport. Navigation scrolls independently; the account area remains anchored and can scroll internally at exceptionally small viewport heights.
- The existing whole-sidebar collapse/expand behavior and sidebar width management are preserved. Collapsed layout keeps the navigation icons readable and adds a compact level indicator beneath the avatar.
- Scroll position in the navigation is retained when the main application shell is rebuilt.

## Two-level Community navigation
- The Community section has its **own collapsible section header**. Collapsing it hides the entire Community group without hiding personal Workspace pages.
- The **Community** entry opens the Community homepage directly; its separate expander reveals direct routes to **Browse Titles, Collections, Ratings and Users**. A second click hides these destinations.
- **Public Profile**, **Friends**, and **Inbox** remain dedicated Workspace pages in the Community group, with their existing icon identities and route behavior preserved.
- If the Community homepage entry itself is hidden in Navigation Settings, the other enabled public destinations remain reachable from the open Community section.
- The nested menu is designed for both expanded desktop navigation and icon-only collapsed sidebar; each icon has a descriptive accessible label and tooltip.

## Community Navigation Settings
- Under **Settings → Navigation**, adds a dedicated **Community navigation** manager integrated into the existing Settings page.
- Allows **show/hide entire Community section** independently of hiding individual Community destinations.
- Allows individual visibility controls for Community homepage, Browse Titles, Collections, Ratings, Users, Public Profile, Friends and Inbox.
- Allows rearranging the Browse/Collections/Ratings/Users submenu and the Public Profile/Friends/Inbox subgroup using **Move up / Move down** controls, with the Community homepage remaining the parent for its public destinations.
- Provides saved default expanded/collapsed preferences for both Community levels, and a **Restore Community defaults** action.
- Preferences are saved in the **existing MediaFlow Settings state** (`mf315CommunityNav`), with no new Supabase table, Cloud Sync version or schema change required.
- Hiding a navigation link does not change its underlying access permissions, disable its page, or expose private data; direct links still work normally.

## Mobile and responsive behavior
- Replaces the unconditional four old Community shortcuts in mobile **More** with the same configured Community section and public destinations used by the desktop sidebar.
- The mobile More section and public destination submenu are separately collapsible and respond to Navigation Settings visibility/order changes without requiring a full application reload.
- Enhanced narrow-width layout, fixed account footer and scrollable navigation have been checked at desktop widths and 390px/320px mobile widths.

## Social workspace page header repair
- The React/Workspace top navigation chrome now displays **Public Profile**, **Friends** and **Inbox**, instead of technical page IDs such as `mf302-profile`, `mf302-friends` or `mf302-inbox`.
- These pages use matching semantic SVG icons instead of the generic Dashboard/home icon, plus appropriate subtitles.
- The Community Workspace page also uses a human-readable label. The existing Dashboard, Library, Collections and other page headers retain their inherited styling.

## Public profile text cleanup
- Removes the **"(since v312)"** suffix from the public-profile active-time display. The underlying opt-in tracking behavior is unchanged and no historical usage data is invented.

## Implementation
- New runtime module: `src/js/components/240-v315-community-sidebar-navigation.js`.
- New stylesheet: `assets/css/172-v315-workspace-sidebar-community.css`.
- Updated `src/js/components/237-v312-community-ranking-refresh.js` solely to remove the public-profile display suffix.
- Updated modular runtime order, `VERSION`, `version.json`, `index.html`, `404.html`, service worker, PWA assets and JS bundle to v315.
- New isolated full-runtime Playwright tests: `scripts/test-v315-community-sidebar.py`.
- **PWA cache:** `mediaflow-pwa-v315-shell-v1`.
- No database migration or destructive change to private Workspace records.

## Validation
- **84 v315 browser assertions passed** at 1440px, 1000px, 850px, 390px and 320px, testing sidebar scroll/fixed footer, group and submenu collapses, destination visibility, reordering, collapsed icons and level badge, social headers, and mobile More synchronization.
- **57 v314 media-source/ranking assertions** and **54 v313 Workspace Collections assertions** passed against the v315 bundle.
- One older v313 Community regression test still expects the pre-v314 rankings markup; it is obsolete after the v314 rankings redesign and is not counted as passing. A separate long Collections regression run did not complete and is not claimed as passing.
- JavaScript syntax and MediaFlow project integrity validation passed.
- Browser checks used simulated authentication and data. Real GitHub Pages / Supabase account testing remains recommended.

## Preserved systems
- v314 eight-source Community catalog, Browse, Ratings, User Rankings and Library Explore Community remain inherited.
- v313 Workspace Collections organization/opening fix, v310 saved public Collections, v309 Quick Add, public profiles, social connections and Inbox are preserved.
- Guest Community theme remains the same, and authenticated Community still follows the user's Workspace theme.
- Cloud Sync **v201**, Full Backup Schema **v29**, Settings Preset Schema **v1**.
- Logging Intensity from v299–v300 remains removed. The canceled mobile History redesign remains excluded.
