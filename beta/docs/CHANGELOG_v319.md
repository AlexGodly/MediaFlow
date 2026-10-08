# MediaFlow v319 — Single Refresh Icon Across All Community Pages

**Version:** 319  
**Codename:** Community Refresh Icon Deduplication  
**Base:** MediaFlow v318 Community Modular  
**Release Date:** October 8, 2026  
**Created by:** Alex Godly  
**Status:** Community Beta

## 1. Overview

MediaFlow v319 eliminates the unwanted **extra refresh icon** in the Community **Refresh now** buttons. The legacy v225/v226 automatic button-icon enhancement could add a second SVG beside the icon hand-authored in v317. The v318 shared freshness bars reused those buttons, exposing the duplicate.

Every Community **Refresh now** button now contains **exactly one refresh icon**, followed by its text. The surrounding full-width freshness bars, automatic-update dots, timestamps, dynamic theme styling, and responsive layouts remain unchanged.

## 2. Affected Community Pages

- **Browse Titles:** retains one icon in Refresh now.
- **Community Collections:** retains one icon in Refresh now.
- **People → Find Users / User Rankings:** retains one icon in the shared Refresh now action.
- **Community Ratings:** presents the same single purpose-built refresh SVG instead of relying on the older automatic icon wrapper.

The change is limited to the four Community-specific refresh actions. Other buttons across MediaFlow continue using their normal icon rules.

## 3. Root Cause & Fix

Older MediaFlow button systems automatically prepend icons to ordinary text buttons. For v317/v318, the Community refresh buttons already included an explicitly-authored SVG. The later semantic-icon enhancement could prepend another SVG, resulting in two refresh icons.

v319 introduces an isolated Community-only guard around the existing semantic icon enhancement:

- Discards injected `.v225-btn-icon` wrappers on Community Refresh now buttons.
- Keeps the first authored refresh SVG; provides one SVG to the Ratings refresh control when needed.
- Removes any redundant extra authored SVG from the same button.
- Marks the button as already iconified so older enhancement passes cannot add another icon.
- Reapplies the same rule through the existing v226 MutationObserver on page navigation, loading, search/filter changes, refreshes, and DOM rerenders.
- Preserves the existing action attributes and event handlers, including the Ratings retry action.
- Does **not** introduce an additional observer, timer, polling loop, or RPC.

## 4. Visual & Accessibility Details

- Exactly one refresh icon, then **Refresh now** text.
- Consistent inline-flex alignment, 8px icon/text gap, and 17px icon sizing.
- Preserved `aria-hidden="true"` for the decorative SVG.
- Preserved the original button's accessible name and functional text.
- Preserved disabled/loading behavior and the existing icon rotation animation on busy state.
- Respects `prefers-reduced-motion`.
- Theme-aware colors inherited from existing Community button styles.
- Compatible with desktop, tablet, mobile, and narrow mobile widths.

## 5. Preserved Functionality

- v318 Ratings-style refresh bars, positioning, green indicator, and last-updated timestamps.
- Existing **Refresh now** click functionality.
- Approximately 120-second Browse/Collections/Users automatic refresh.
- Ratings and Users revision-based freshness checking.
- Community search, filters, sorting, view mode, pagination, and Quick Add.
- v318 Statistics order: User Profile → Leveling → Time Spent in MediaFlow → Lifetime Achievements.
- v317 Start Title XP and 20-XP default episode rewards.
- v316 active-time XP, streak multipliers, server-side activity ledger, and Community ranking synchronization.
- All existing user data, cloud sync, backups, PWA, and Community privacy settings.

## 6. Files & Versioning

- Added `src/js/components/244-v319-community-single-refresh-icon.js`.
- Added `assets/css/176-v319-community-single-refresh-icon.css`.
- Registered v319 in `src/js/runtime-order.json`.
- Generated `assets/js/mediaflow-v319.bundle.js`.
- Updated React chrome to `assets/js/mediaflow-v319-react-ui.js`.
- Updated `VERSION`, `version.json`, `package.json`, `index.html`, and `404.html`.
- Regenerated service worker with `mediaflow-pwa-v319-shell-v1`.
- Added `scripts/test-v319-community-single-refresh-icon.py`.

## 7. Testing

- Dedicated Chromium browser suite: **372 assertions passed** across 1440px desktop, 768px tablet, 390px mobile and 320px narrow mobile widths.
- Verified **one and only one** refresh SVG on Browse Titles, Community Collections, People & Rankings, and Ratings.
- Verified no legacy `.v225-btn-icon` wrapper remains on those refresh buttons.
- Verified icon count remains one after repeated semantic-icon passes, Community rerenders, manual refreshes, and a Ratings refresh click.
- Verified v318 Statistics hierarchy and component hiding remain intact.
- Inherited v317 XP/Community regression: **69 assertions passed**.
- Inherited v316 active-time XP regression: **82 assertions passed**.
- Inherited Browse regression: **39 assertions passed**.
- Inherited Workspace & Collections regression: **54 assertions passed**.
- JavaScript bundle syntax and PWA shell generation passed.

Browser tests use mocked Community RPCs. Real multi-account Supabase behavior must be verified after deployment.

## 8. Database & Compatibility

**No new Supabase migration is required** and no data schema was changed.

Cloud Sync v201 · Full Backup v29 · Settings Presets v1 · Personal Order v5 · Collections v2 remain supported.

## 9. Version Progression

**v316** → Time-Based XP, streak-powered active-time rewards, account ledger, Community Ranking freshness.  
**v317** → Configurable Start Title XP, increased episode XP, Leveling fixes, Community refresh controls.  
**v318** → Unified full-width Ratings-style refresh bars and improved Statistics ordering.  
**v319** → **Removed the duplicate Community refresh icon and standardized every Refresh now button to exactly one refresh SVG.**
