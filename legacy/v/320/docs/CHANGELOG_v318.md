# MediaFlow v318 — Community Refresh Bar Parity & Statistics Leveling Order

**Version:** 318  
**Codename:** Ratings-Style Community Freshness & Statistics Hierarchy  
**Base:** MediaFlow v317 Community Modular  
**Release Date:** October 8, 2026  
**Created by:** Alex Godly  
**Status:** Community Beta

## 1. Release Overview

MediaFlow v318 is a focused design and layout update. It reuses the familiar Community Ratings freshness bar on all three other Community discovery views and adjusts the order of existing Statistics cards. Existing XP mechanics, Community RPCs, filters, real-time freshness checks, and privacy protections remain unchanged.

## 2. Community Refresh Bar Design Parity

**Affected pages:** Browse Titles, Community Collections, and People & Rankings (both Find users and User rankings).

- Replaces the v317 small refresh button placed under the page heading with the **same full-width refresh/status strip** used in Community Ratings.
- Shows the same green status indicator (`mf312-pulse`), succinct auto-update message, **Updated** timestamp and right-aligned **Refresh now** button with a refresh icon.
- Places the strip immediately **beneath the page's search/filter/view controls and above the results**, like Ratings, instead of nesting the button in the heading.
- Keeps exactly one refresh strip/button per view, even after page navigation, filter changes, rerenders, or refreshes.
- Reuses Ratings' theme-aware backgrounds, borders, type treatment, radius, spacing, and button treatment, with mobile/tablet adjustments at 600px and narrow devices at 370px.
- Refresh button has the existing loading/disabled behavior. While checking, the status reflects that the refresh is underway; after a successful fetch it shows the latest update time. Failed requests do not report a successful update.
- Existing v317 manual refresh RPCs and approximately **120-second** automatic refresh remain, including search, filter, sort, pagination and view persistence; no additional polling loop was added.
- Community Ratings retains its original bar and refresh/revision mechanisms unchanged. Existing Users approximately 50-second revision checking remains active.

## 3. Statistics Order

Statistics now places these existing components in this order:

1. **User Profile** — titles, sessions and hours consumed.
2. **Leveling** — Level, lifetime XP, XP progress bar and breakdown (including v317's Started title XP and Active-time XP).
3. **Time spent in MediaFlow** — recorded active time and associated rewards.
4. **Lifetime Achievements** — existing achievement metrics.

The new order respects existing component visibility settings and does not modify XP calculations, stored Library data, achievements or cloud data. If Time spent is hidden, Leveling still sits before Lifetime Achievements.

## 4. Technical

- Added `src/js/components/243-v318-community-refresh-layout-stats-order.js`, loaded after v317.
- Added `assets/css/175-v318-community-freshness-statistics.css`.
- Updated main application JavaScript to `assets/js/mediaflow-v318.bundle.js`.
- Updated React chrome asset to `assets/js/mediaflow-v318-react-ui.js`.
- Updated `VERSION`, `version.json`, HTML entrypoints and service-worker cache to `mediaflow-pwa-v318-shell-v1`.
- Preserved the full existing Community Beta and Workspace source history, PWA assets, category icons, backups and cloud format compatibility.
- No Supabase SQL migration is needed for v318, assuming previous Community/v316 migrations are already installed.

## 5. Tests

- Dedicated v318 Chromium browser suite: **212 assertions** across 1440px, 768px, 390px and 320px, including component order, visibility settings, DOM placement, one-button integrity, refresh RPCs and rerenders.
- Inherited v317 XP & Community behavior: **69 assertions**.
- v316 time-based XP regression against v318: **82 assertions**.
- Browse regression against v318: **39 assertions**.
- Workspace & Collections regression against v318: **54 assertions**.
- JavaScript compilation/syntax checks and PWA asset generation passed.

Tests use simulated profiles and database responses. Live multi-account Supabase validation and real GitHub Pages deployment remain external checks.

## 6. Compatibility

Cloud Sync v201 · Full Backup v29 · Settings Presets v1 · Personal Order v5 · Collections v2. No change to XP defaults, XP/Level formula, privacy policies, or user data schema.
