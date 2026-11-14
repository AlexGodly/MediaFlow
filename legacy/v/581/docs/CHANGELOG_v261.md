# MediaFlow v261 — Library, History & Balance Refinement

MediaFlow v261 refines the major v260 redesign with a stronger Library browsing hierarchy, repaired cover filtering, a more cohesive and scalable History system, a redesigned Today’s Balance section, cleaner Personal Order pagination and consistent page-level iconography.

## Library
- Fixed **All covers / Has cover / Missing cover** filtering across supported title cover fields.
- Search now gets a dedicated full-width row.
- Status and Category quick filters sit directly below search and remain sticky while scrolling titles.
- Added drag-friendly, scrollbar-free horizontal quick-filter rows.
- Added persistent **Show tools / Hide tools** control.
- Consolidated bulk selection, display, sort, cover and overlay controls under Library Tools.
- Removed duplicated quick category/status controls from the tools area.
- Applies to both Normal and Dynamic Library.

## Today’s Balance
- Reworked the section into clearer category rows with icon, daily amount, Today/Overall health badges, progress and actionable scheduler guidance.
- Added summary KPIs for units, time invested, streak and unrated titles.
- Category rows can jump directly into the corresponding Library category.
- Official MediaFlow artwork is used in the section heading.

## History
- Preserves the unified tabs: Consumption history, Recently viewed, Ratings, Library.
- Makes the four tabs visually cohesive under one Simkl-inspired History language.
- Recently viewed gains category / period / search filtering, pagination and behavior insights.
- Ratings gains category / score / year / sort / search filters and pagination.
- Ratings no longer attempts to render every rated Library title at once, reducing large-library lag.
- Consumption and Library History retain their existing filters, pagination, exports and management controls.

## Navigation / Page chrome
- Removed the current-theme text chip from the application header.
- Page header icons now match the semantic icons used by the sidebar navigation.
- Sidebar branding uses the official MediaFlow icon.

## Personal Order
- Simplified pagination to **Prev / Page / Next**.
- Removed decorative first/last edge glyph buttons and arrow glyphs.

## Compatibility
- Cloud Sync: **v201**
- Full Backup Schema: **v29**
- Settings Preset Schema: **v1**
- Personal Order Export: **v4**
- PWA cache: **mediaflow-pwa-v261-shell-v1**
- Zero-config GitHub Pages deployment preserved.
