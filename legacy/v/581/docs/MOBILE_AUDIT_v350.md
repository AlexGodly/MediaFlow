# MediaFlow v350 — Mobile & Tablet UI/UX Audit and Redesign Brief

**Reference:** `mediaflow mobile pages.zip` submitted October 10, 2026  
**Baseline for future implementation:** MediaFlow v349 Modular  
**Status:** Screenshot review and implementation plan; **not an implemented v350 release**.

## Source coverage

Reviewed the supplied ZIP's 210 phone screenshots, grouped into 12 page folders. Every image is 1080 × 2400 **screenshot pixels**, which does not uniquely identify the browser's CSS viewport width or device model. The design must respond to available CSS width, browser zoom, text scaling, safe areas, and touch capabilities rather than hard-code the screenshot's pixel width.

| Page folder | Screenshots |
|---|---:|
| About | 5 |
| Account | 3 |
| Batch Log | 8 |
| Collections | 11 |
| Dashboard | 20 |
| History | 22 |
| Library | 18 |
| More Pages | 1 |
| Old System | 9 |
| Personal Order | 17 |
| Settings | 70 |
| Statistics | 26 |
| **Total** | **210** |

## Non-negotiable requirements

1. **Desktop unchanged:** no intentional layout, typography, navigation, or feature changes at desktop widths. Keep all mobile presentation rules scoped to narrow/tablet viewports and verify desktop reference screenshots before/after.
2. **Features unchanged:** no disabling or removing functionality, including Library modes, filters, batch selection, Collection management, Personal Order queues, editing, XP, History, analytics, export, import, sync, and updates.
3. **Real mobile information architecture:** don't just scale desktop controls down. Prioritize content and primary actions, group advanced options into accessible collapsible panels, sheets, and menus.
4. **Themes supported:** use existing MediaFlow tokens/theme CSS variables. Test contrasting themes, not only the pastel screenshot theme.
5. **PWA/browser supported:** account for Android Chrome's browser controls and installed standalone PWA, iOS Safari safe-area insets, keyboard opening, portrait/landscape, and tablets.
6. **Large-library performance:** avoid rendering all ~30k titles, excessive DOM wrappers, or expensive full-page rerenders when opening tools.

## Cross-page problems visible in screenshots

- Controls often **consume multiple full screen heights** before showing primary page content (notably Library, Personal Order, History, Settings).
- Toolbar buttons, filter selects, icon labels and reset actions **wrap awkwardly**; some labels display letters vertically when a flex child becomes too narrow (Settings navigation, XP settings).
- Typography and metadata sometimes become too small, while surrounding panels have excessive padding and large vertical gaps.
- Filter and layout settings are presented in long always-expanded stacks; a narrow phone needs a compact collapsed state with visible active-filter summary.
- Multiple fixed/sticky toolbars and the bottom navigation compete with the content area, especially on History. On phones, History's tabs and toolbars should scroll naturally with the page rather than remain sticky.
- Long category labels, title names, counts and action groups require stronger overflow/wrapping constraints so interactive text never becomes one-letter-wide.
- Dense dialogs and title pickers need mobile-sized touch areas and a keyboard-safe scroll container.

## Page-by-page redesign requirements

### Dashboard — 20 screenshots
- Make the header/Today summary and recommendation panels tighter while retaining visual hierarchy.
- Reduce vertical height and nested padding in quick logging, recommendation, Stopwatch, Runtime Calculator, Rate Your Library, and Missing Covers.
- Keep numerical inputs and action groups usable with the virtual keyboard; prevent the narrow Confirm & Next button treatment seen in the Rate Your Library section.
- Treat secondary logger filters as expandable tools; preserve logging methods, next-task progression, timer calculations, and XP details.

### Library — 18 screenshots
- Primary content should appear sooner; collapse the extensive **Library Tools** panel by default on small phones.
- Keep the user-requested **categories and statuses controls visible** directly above titles, independently of the collapsed advanced tools.
- Retain Normal/Dynamic switch, list/compact/cards/covers, search, selection, priority/status, sorting, pagination, cover overlays, cover sizes and category filtering.
- Put secondary controls (sort, cover/overlay settings, page size, display size, bulk actions) in orderly mobile panels/sections rather than a many-screen stack.
- Fix the extremely narrow **Display** label and related compressed controls; protect grid/list cards and title action menus from overflow.

### Collections — 11 screenshots
- Preserve the dedicated Collections browser (no Personal Order Lists/Tabs switch).
- Compress search/sort/view controls and collection management actions.
- Make Collection Details hero, cover, edit/add actions, library selection tools and Collection title-order controls phone-friendly.
- Keep Collection displays and cover sizes available through compact options; retain title-picker filters and collection membership actions.

### Personal Order — 17 screenshots
- Compact lengthy layout options (All Titles/By Category, Lists/Tabs, visibility toggles, cover sizes) into an expandable mobile **View & Queue Options** area.
- Preserve Category Titles and Collection Queues with readable, horizontally scrollable category tabs and visible current category.
- Rebuild each ordered title/Collection card's action layout so Open, Edit, Remove, reorder arrows and rule selects remain accessible without awkward wraps.
- Show ordered queues early and let the user invoke controls when needed. Preserve pagination and order integrity.

### History — 22 screenshots
- **Make History tab row and its associated filters non-sticky on phone/tablet portrait layouts.** Keep desktop behavior unchanged.
- Use a horizontal scrollable tab strip with clear selected state and no clipped labels.
- Compact and optionally collapse filter groups for Consumption History, Recently Viewed, Ratings, Logs, Library History and XP History.
- Improve timeline/log cards, filter form columns, edit/delete controls and pagination on narrow screens.
- Preserve v349 initial-scroll-to-top entry behavior and in-page scroll preservation.

### Statistics — 26 screenshots
- Keep metric cards, timelines and graph labels readable at phone widths instead of shrinking desktop charts.
- Balance one-/two-column cards based on available width, allowing each chart to use the full card area without horizontal overflow.
- Condense repeated full-height metric panels and keep date/category selectors touch-friendly.
- Preserve Active Time, XP, charts, category balance/saturation, heatmaps and historical metrics.

### Settings — 70 screenshots
- Highest-volume audit area; fix **letters rendered vertically** on narrow Reset/navigation controls and action buttons (especially Menu tabs and XP sections).
- Convert long setting sections into compact organized cards with consistent name/description/control/reset alignment, using a two-row design when necessary.
- Preserve every section and expose all v348 Leveling & XP fields, including the universal streak toggle and seven action XP rewards.
- Make category/status/priority reordering, show/hide toggles, icon selectors, sliders and dialogs usable without tiny tap targets.
- Keep search, Settings section navigation, Import/Export, Automatic Backups, Cloud Sync and PWA diagnostics accessible without massive persistent toolbars.

### Batch Log — 8 screenshots
- Improve the title-search picker, filters, pagination and chosen-entry controls.
- On keyboard opening, keep input and selected suggestions visible; ensure fixed/bottom actions do not overlap the keyboard or content.
- Compact the form without hiding consumption method, selected titles, progress/minutes, validation or Log batch.

### Account — 3 screenshots
- Keep profile, avatar, name/email/password forms, picture URL, logout and deletion controls accessible.
- Improve input widths and long button labels on narrow devices; preserve focus/keyboard layout.

### About — 5 screenshots
- Improve long copy and FAQ density, app update actions and controls, without shrinking copy to unreadable sizes.
- Preserve version/PWA diagnostics and outbound actions.

### Old System — 9 screenshots
- Make System/View/Date View/Stats tabs clear and finger-friendly with compact responsive cards.
- Preserve conversion-category selection, conversion rules and history statistics.

### More Pages — 1 screenshot
- Preserve access to every app page and shortcut, with appropriately sized nav targets.

## Design system specification for v350

- Keep desktop visual design/styles untouched. Add a **late-loaded, mobile/tablet-scoped stylesheet**; allow narrow-only JS state only where CSS alone cannot reorganize a working control.
- Use screen-width breakpoints as implementation targets: **320–359**, **360–390**, **391–480**, **481–767**, **768–1023** CSS pixels. These are testing bands, not a guess that the supplied phone uses a specific width.
- Use minimum functional touch targets around **44 × 44 CSS px** for icon-only buttons and essential interaction surfaces; compact noninteractive labels separately.
- Maintain readable body text (normally ~13–15px rather than tiny 8–10px), with responsive headings and measured card spacing.
- Make advanced toolbars collapsible; preserve active filters and the ability to reset them when the panel is closed.
- Use two-level priority: visible current page content + primary action, with advanced options one tap away.
- Ensure children of flex/grid controls have `min-width:0`, labels can wrap at word boundaries, and buttons never compress to vertical individual letters.
- Prefer mobile bottom sheets/dialogs where helpful, with safe-area padding and scrolling above the keyboard.
- Respect `env(safe-area-inset-bottom)`, installed-PWA viewport, browser chrome and device rotation.
- Avoid sticky History filters and other stacked sticky headers on narrow viewports; desktop sticky layout remains as-is.

## Acceptance and regression checklist

- Compare desktop visual snapshots at **1280, 1440 and 1920px** before/after with the same data and theme, looking for any unintended layout difference.
- Test mobile widths **320, 360, 375, 390, 412, 430, 600** and tablet **768, 820, 1024** (portrait/landscape); also test small-height keyboard-visible scenarios.
- Check for **horizontal document overflow**, compressed vertical text, clipped actions, overlapping bottom nav, too many rows of always-expanded filters, and text smaller than legible defaults.
- Navigate every one of the 12 screenshot page groups; test editing, search, sorts, filters, pagination, modal opening/closing, multiple themes, keyboard actions and back navigation.
- Run the previous XP, cloud, Collections, Personal Order, History and PWA regression tests. Ensure no data migration or export-format change is necessary unless separately justified.
- Update compiled bundle, release metadata, service worker and PWA cache when actually releasing v350.

## Implementation status

This document is a **review and work plan** based on the user's phone screenshots. It does **not** claim v350 has been built, tested, or deployed.
