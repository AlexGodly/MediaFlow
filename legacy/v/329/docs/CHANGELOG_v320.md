# MediaFlow v320 — Friends & Inbox Professional Redesign, Tabbed Connection Discovery, Reliable Statistics Page Entry & Theme-Aware Collections Empty States

**Version:** 320  
**Codename:** Community Social Workspace & Statistics Navigation Stability  
**Base:** MediaFlow v319 Community Modular  
**Release Date:** October 8, 2026  
**Created by:** Alex Godly  
**Status:** Community Beta

---

## 1. Overview

MediaFlow v320 redesigns two previously utilitarian social Workspace pages—Friends and Inbox—to match MediaFlow's professional, responsive, dynamic-theme design language. It also corrects the occasional unwanted scroll position when entering Statistics and removes an incongruous dark legacy empty-state card from the saved Community Collections area.

The update deliberately preserves the existing Supabase social relationship data, private messaging actions, published-profile permission checks, XP, Community rankings, and cloud schemas. It is primarily a front-end design and navigation-stability release.

## 2. Friends Page: Full UI/UX Redesign

- Replaced the vertically stacked Mutuals / Following / Followers lists with one polished, purpose-built social workspace.
- Added three tabs in the requested order: **Following**, **Followers**, **Mutuals**.
- Displayed the count of relationships beside every tab label.
- Default selected tab: **Following**. The user's selected tab persists within the current app session when returning to Friends.
- Added a search field within the active tab. Each tab keeps **its own independent search query**, so switching tabs does not erase the query previously entered in another tab.
- Search matches public profile display names, usernames, and bios without requiring additional database queries for every keystroke.
- Added Arrow Left / Right and Home / End keyboard navigation to the tablist.
- Replaced legacy generic tiles with responsive contact cards featuring avatar (when a public HTTPS avatar is available), display name, @username, optional bio, relationship badge, **Profile**, and **Message** actions.
- Added meaningful empty states for Following, Followers, Mutuals, and search-with-no-results, with an **Explore people** action where relevant.
- Preserved existing follow relationships, profile routing, direct message creation, and existing privacy rules. Nonpublic profiles are not rendered as public user cards.
- Integrated MediaFlow color, panel, border, muted-text, and accent theme tokens rather than introducing fixed dark rectangles.

## 3. Inbox Page: Full UI/UX Redesign

- Replaced the narrow old Conversations column and largely empty chat area with a refined two-pane messaging workspace.
- Conversation rail now displays a heading, total conversation count, conversation search, avatar, display name, @username, selection state, and **Discover people** navigation.
- Added client-side conversation search by display name / username, using already-loaded conversation metadata.
- Chat pane now has a deliberate recipient header with avatar/name and a public Profile action where available.
- When no thread is selected, users see a centered, theme-native guidance state. Composer and destructive actions are hidden until a thread is selected.
- Message history uses differentiated, theme-aware incoming and outgoing bubbles, timestamps, existing **Unsend** support, and an in-pane loading state.
- Existing **Send**, **Delete conversation locally**, and **Block user** functionality remains wired to the earlier v302 database operations.
- Existing DM realtime subscription remains active; the new reader prevents stale responses from replacing a newly selected conversation after a rapid thread switch.
- On mobile/narrow layouts, the rail and conversation are separate responsive views. Choosing a conversation opens the messages; an explicit back arrow returns to the list.
- Supports current account theme and all previously supported MediaFlow dynamic themes.

## 4. Statistics Page: Correct Scroll Position on Entry

- Fixed the intermittent behavior in which Statistics opened at the previous page's retained vertical scroll position instead of the top.
- Added a navigation-entry-only scroll reset for window/document and the main Workspace scroll container.
- Performs an immediate reset, a frame-aligned reset, and a brief post-render correction to account for asynchronous page layout and React shell updates.
- Reset occurs **only when navigating into Statistics from a different view**, avoiding unwanted jumps during ordinary Statistics interactions or rerenders.
- No changes to Statistics metrics, Leveling, active-time XP, Lifetime Achievements, or component visibility preferences.

## 5. Workspace Collections: Saved Community Collections Empty State

- Replaced the default dark `mf302-empty` box shown when the user has not saved Community Collections.
- New purpose-built panel uses the current MediaFlow theme's panel, border, accent, raised-surface, text, and muted-text variables.
- Added a bookmark icon, short descriptive heading, helpful explanation, and **Explore Collections** shortcut.
- Responsive layout adapts from a horizontal desktop arrangement to a stacked mobile arrangement.
- The change applies only to the empty **Saved Community Collections** presentation; nonempty saved collections, cloud syncing, public visibility, owner permissions, and the **Refresh saved Collections** action remain unchanged.

## 6. Dynamic Themes and Responsive Design

- The Friends, Inbox, and Collections redesigns use `--panel`, `--panel-raised`, `--text`, `--text-dim`, `--border`, and `--flow` theme tokens, with conservative fallbacks.
- Button hover, accent badges, avatars, borders, focus rings, chat bubble backgrounds, input fields, active tabs, and empty states inherit colors from the selected MediaFlow theme.
- Responsive behavior implemented for desktop/tablet, 760px mobile inbox transition, and 450px narrow-mobile adjustments.
- Honors `prefers-reduced-motion` for the new UI transition effects.

## 7. Technical Files

- New runtime extension: `src/js/components/245-v320-friends-inbox-stats-collections.js`.
- New theme-aware stylesheet: `assets/css/177-v320-social-friends-inbox-collections.css`.
- Updated `src/js/runtime-order.json`.
- Built `assets/js/mediaflow-v320.bundle.js`.
- Updated `assets/js/mediaflow-v320-react-ui.js`.
- Updated `VERSION`, `version.json`, `package.json`, `index.html`, and `404.html`.
- Regenerated `sw.js` using `mediaflow-pwa-v320-shell-v1`.
- Added `scripts/test-v320-social-ui.py` and upgraded v320 regression harnesses.

## 8. Data & Database Compatibility

No new SQL migration, database table, social RPC, XP source, cloud schema, or background polling process is required. The release preserves Cloud Sync v201, Full Backup v29, Settings Presets v1, Personal Order v5, and Collections v2, along with v316 Time-Based XP and v317 configurable title-start rewards.

## 9. Testing

- Dedicated Chromium visual/functional suite covering 1440px, 768px, 390px and 320px: **132 browser assertions passed**.
- Verified Friends tab counts, tab switching, independent searches, filtered results, Profile/Message actions, correct empty display and theme-color use.
- Verified Inbox rendering, conversation search, selection, Send operation, chat-message bubbles, mobile back navigation, and hidden controls when no conversation is selected.
- Verified Statistics page-entry scroll reset and saved Collections empty-state theme styling.
- Existing v317 XP/Community regression: **69 assertions passed**.
- Existing v316 Active Time XP regression: **82 assertions passed**.
- Existing Browse regression: **39 assertions passed**.
- Existing Workspace/Collections regression: **54 assertions passed** (18 each at 1440px, 390px and 320px), run as independent isolated browser sessions to avoid browser resource contention.
- Combined verified browser assertions: **376** (132 dedicated + 69 XP/Community + 82 Time XP + 39 Browse + 54 Workspace/Collections).
- Main JavaScript syntax and PWA asset generation succeeded.

**Testing scope:** Browser tests use mocked Supabase responses for deterministic verification. Live multi-account Supabase chat, sharing, and the deployed GitHub Pages instance remain deployment checks.

## 10. Version Progression

**v316** → Uncapped Time-Based XP, streak multipliers, account activity ledger, Community ranking freshness.  
**v317** → Configurable Start Title XP, 20 XP default per episode, XP calculation integration, Community Refresh now actions.  
**v318** → Unified Ratings-style full-width Community refresh bars and Statistics Leveling hierarchy.  
**v319** → Removed duplicate Community refresh icons.  
**v320** → **Professional Friends tabbed/searchable redesign, Inbox messenger redesign, Statistics scroll-on-entry repair, and theme-aware saved Community Collections empty state.**
