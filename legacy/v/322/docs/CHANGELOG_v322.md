# MediaFlow v322 — Sidebar Identity Opens Your Public Community Profile

**Version:** 322  
**Codename:** Own Public Profile Sidebar Navigation  
**Base:** MediaFlow v321 Community Modular  
**Release date:** October 8, 2026  
**Created by:** Alex Godly  
**Status:** Community Beta

---

## 1. Release overview

MediaFlow v322 changes the behavior of the account identity displayed in the Workspace sidebar footer. Previously clicking the profile avatar or account name opened the private Account settings page. In v322, both controls navigate to the authenticated user's own **public Community profile**, using the existing public-profile route.

## 2. Sidebar avatar and name

- Clicking the **avatar** opens the signed-in user's public MediaFlow Community profile.
- Clicking the **display name** does the same.
- The target is retrieved from `mf_public_profiles` using the **authenticated user ID**; a local display name or email is never mistaken for a public username.
- For published profiles, the existing public Community navigation opens `/<username>` (under the GitHub Pages `/MediaFlow/` base when deployed).
- Both buttons now expose the tooltip and accessible label **View my public profile**.
- The adjacent **Log out** button retains its independent behavior.

## 3. Unpublished or unavailable profiles

- If the account has no configured public username, or has not enabled its public profile, clicking the identity takes the user to the existing **Public Profile** setup/editor (`mf302-profile`), with a helpful notice. It does **not** open Account settings or publish anything automatically.
- Network errors show a retry notice without routing to a different user's profile.
- A response arriving after an account switch is ignored; repeated clicks while the lookup is in progress are ignored.
- No profile privacy setting is changed by this navigation update.

## 4. Account access, other navigation, and compatibility

- **Account** remains accessible via its normal Workspace navigation/settings path.
- `App.openProfile()` retains its original private Account semantics for other callers; only the two sidebar identity buttons now call the public-profile action.
- Community profiles, Friends, Inbox, public sharing controls, Collections, Browse, XP, rankings, Statistics, themes, mobile navigation, and refresh systems remain untouched.
- No Supabase SQL migration or data-format change is required.

## 5. Technical implementation

- Updated `src/js/core/rendering/010-render-shell.js` to bind both account identity controls to `App.openSidebarPublicProfile()` with appropriate `type`, title, and accessibility attributes.
- Added `src/js/components/246-v322-sidebar-own-public-profile.js` containing the authenticated-user profile lookup, public-route navigation, setup fallback, account-switch guard, and error handling.
- Registered v322 source extension in `src/js/runtime-order.json`.
- Regenerated `assets/js/mediaflow-v322.bundle.js` and included the v322-versioned React shell `assets/js/mediaflow-v322-react-ui.js`.
- Updated `VERSION`, `version.json`, `package.json`, `index.html`, `404.html`, and `sw.js`.
- PWA shell cache: `mediaflow-pwa-v322-shell-v1`.
- Added dedicated test `scripts/test-v322-sidebar-public-profile.py`.

## 6. Validation

- Dedicated v322 sidebar routing: **72 browser assertions passed**, at 1440px desktop, 768px tablet, 390px mobile, and 320px narrow-mobile widths.
- Verified that avatar and name invoke the public navigation, private/absent profiles use the Public Profile editor, errors do not redirect, Account stays callable, Logout stays independent, and rerendered sidebar buttons remain functional.
- Inherited browser test suites have also been run against the v322 compiled bundle; see release notes and test logs for outcomes.
- JavaScript syntax and PWA release asset generation passed. Browser mocks do not establish live multi-user Supabase availability or authentication behavior.

## 7. Preservation and deployment

Deploy the **complete v322 ZIP** to GitHub Pages (not just `index.html`). The v322 PWA update must propagate to installed app clients. Cloud Sync v201, Full Backup v29, Settings Presets v1, Personal Order v5, and Collections v2 remain compatible.

**Progression:** v320 social workspace redesign → v321 semantic Friends icons and flash-free saved Collections → **v322 sidebar identity opens your own public Community profile rather than Account**.
