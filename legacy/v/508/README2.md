## MediaFlow v423 — Navigation Reliability & Support Redesign

This is the v423 personal web/PWA edition of MediaFlow by Alex Godly.

- Fixed the desktop navigation style restoring incorrectly on first load and after account hydration. Saved selections persist by account with normal Settings export/import support.
- Removed the redundant glowing top/bottom navigation logos and unwanted circle-arrow icons in navigation controls.
- Top/bottom Profile now shows the saved Account image URL when available, with a safe fallback.
- Replaced the Explore Other Apps and Alex Godly Apps buttons with Ko-fi donation links and redesigned About's Support MediaFlow section.
- Added focused UI regression tests for the new behavior and retained the previous Library/Collections fallback-cover verification.

See [v423 release notes](docs/CHANGELOG_v423.md). Previous complete versions remain archived under `legacy/v/<version>/` in the GitHub repository (excluded from GitHub Pages deployment). The `beta` folder is also excluded from the deployed website. The app's existing cloud and personal data remain untouched.
