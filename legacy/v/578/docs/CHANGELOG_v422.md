# MediaFlow v422 Stable — Adaptive Navigation 2.0 & Library Details

## Library — open details directly
- In both Normal Library and Dynamic Library, clicking a title name, real cover, or category missing-cover placeholder opens the existing Title Details popup in List, Compact, Cards, Covers and Covers + Titles.
- Cover/name keyboard activation supported, with focus styles. Selection, filtering, Edit, other cover-overlay actions and current Library position remain independent.

## Navigation — fixes and polish
- Mini Sidebar → expanded sidebar now restores a usable saved width, preventing clipped labels, account controls, leveling, streak and sync cards. Sidebar dragging remains available.
- Navigation Style tabs are embedded in the canonical Settings Center **Appearance → Navigation** section, instead of targeting the obsolete v220 Settings container. Four choices: Sidebar, Mini Sidebar, Top Navigation and Bottom Navigation.
- Desktop top and bottom docks use the real MediaFlow logo; navigation tabs are centered with a theme-reactive glowing logo below the top bar or above the bottom dock.
- Horizontal dock level/streak badge now opens a themed progression panel with actual level, XP, total XP, streak and multiplier. Only the profile button navigates to Account; the old circle-arrow badge icon is removed.
- Top/bottom More overflow, mouse drag-to-dock, and floating action spacing remain compatible.

## Account and About
- File-based profile picture selection is disabled in the web app, with a clear explanation of limited storage and a Ko-fi support link. Direct image URLs and existing pictures remain supported; no existing images or cloud data are deleted.
- Added a themed **Support MediaFlow** donation section on the About page, linking to https://ko-fi.com/alexgodly. Donations remain optional.

## Safety and verification
- No Supabase schema changes, data migrations, or changes to MediaFlow Plus / MediaFlowApp.
- New browser tests for the actual Settings Center, all desktop navigation styles, Mini Sidebar width restoration, progression panel, Library cover/title interaction, Account restrictions, About donations, and v420 missing-cover regressions.
- Responsive and reduced-motion styling maintained. Updated v422 PWA version metadata and cache namespace.
