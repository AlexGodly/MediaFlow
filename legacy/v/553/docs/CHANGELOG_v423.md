# MediaFlow v423 Stable — Navigation Reliability & Support Redesign

## Navigation first-load and preferences
- Restore the selected Sidebar, Mini Sidebar, Top, or Bottom navigation style at initial render and when cloud-backed account settings finish loading; use a per-account local preference to avoid the wrong style flashing on refresh.
- Synchronize style selections made through settings or drag-to-dock with the existing settings object; preserve navigation pages, saved sidebar widths, docking, level/streak popup, and More menu.
- Avoid the unwanted full-height sidebar scrollbar on initial load while keeping the page-navigation region independently scrollable when needed.

## Top/bottom navigation cleanup
- Remove the extra theme-glowing MediaFlow logo above/below the desktop navigation dock. Keep the original main MediaFlow branding.
- Remove unwanted circle-arrow decorations from all four Navigation Style selection cards and the horizontal Level/Streak control, including icons injected after the first paint.
- Display the saved Account profile image URL as a cropped avatar in Top and Bottom navigation; use the existing profile icon when absent or the image cannot load.
- Profile alone opens Account; the level/streak button continues to open the separate progression popup.

## Support MediaFlow
- Replace the **Explore other apps** and **Alex Godly Apps** promotional buttons with **Donate on Ko-fi** links to https://ko-fi.com/alexgodly.
- Redesign About's Support section as a responsive theme-aware editorial support hero and focused donation card. Explain voluntary support for resources and ongoing development without fictitious fundraising progress, paywalled features or pressured messages.

## Compatibility and validation
- Preserves all existing Library, Collections, Logging, Personal Order, themes, settings exports, cloud data, and the URL-only account image policy.
- No database schema updates or changes to MediaFlow Plus / MediaFlowApp.
- Browser regression coverage for persistence, first-load navigation, all four styles, badges, profile avatars, donation links and existing Collections/Library missing covers.
