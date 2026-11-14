# MediaFlow v419 Stable — Recommends 2.0, Unified Covers, Logging & Desktop Progress

## MediaFlow Recommends 2.0
- Redesigned the Dashboard recommendation with a responsive cover, themed category/status/priority badges, title progress and a readable reason breakdown using the existing recommendation reasons.
- Display saved title ratings when available; hide empty rating blocks.
- Always display a category-wide total of known remaining units, explicitly counting titles whose totals are unknown.
- For seasonal categories with automatic fresh-episode detection enabled, display verified fresh episodes and unresolved-title counts without presenting unverified data as zero.
- Show queue position from the real mixed Personal Order queue. Collection assignments expand into their eligible titles, preserving the Collection's category and overall slots and each title's Collection rank. Hide Personal Order ranks when there is no applicable assignment.
- Added a collapsible Related Collections explorer listing every Collection containing the recommended title, including Collections outside Personal Order, with direct Open actions.

## Missing covers and size controls
- Unified category-specific fallback covers, centered placeholder icons and cover-relative icon scaling across Normal Library, Dynamic Library, the Logging Library picker, Collections titles and both recommendation surfaces.
- Custom category missing-cover URL images remain the first fallback where configured. Original title cover URLs and data remain untouched.
- Fixed the existing **Dashboard · MediaFlow Recommends cover** size setting so it resizes the current recommendation card.
- Added independent **Logging · Use Recommended Title cover** size control, with live preview, persistence and Reset to Defaults support.

## Logging
- Added a persistent collapsible Logging workspace with a summary of staged titles/units; the Library picker and Recommended Title shortcut remain accessible while collapsed. Draft inputs, units, timestamps and actions are not cleared on collapse.
- Added a floating Back to Logging Top shortcut when scrolled sufficiently deep in active Logging. It hides outside Logging, respects reduced-motion preferences and positions itself above the existing task/quick-action dock and mobile bottom navigation.

## Desktop sidebar
- Redesigned the existing account, XP/level progress, streak and live sync status blocks with improved hierarchy, subtle thematic accents and compact navigation compatibility. Existing XP and sync calculations stay intact. Mobile/tablet navigation is unaffected.

## Reliability
- Preserves Library data, personal orders, ratings, Collections, all logging drafts, cloud configuration and existing recommendation selection logic.
- Adds source-backed browser regression checks covering recommendation rendering, actual queue hierarchy, multiple Collection memberships, seasonal feature gating, missing-cover scaling, display widths and v418 Collections view modes.
