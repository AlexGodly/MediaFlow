# MediaFlow v421 Stable — Adaptive Navigation & Logging Show Filter Repair

## Adaptive desktop navigation
- Restores reliable **sidebar edge dragging** with saved widths. Drag narrower to collapse to the **Mini** icon-only navigation, and drag wider to restore the expanded sidebar. The brand remains a click-to-collapse/expand control.
- Fixes v420 sidebar overflow by removing full-sidebar scrolling. **Only navigation pages scroll independently** when the window is short; the profile, leveling, day-streak and cloud-status region remains accessible and the resize grip is no longer clipped by scrolling.
- Adds **Top Navigation** and **Bottom Navigation** docking modes on desktop. Drag the MediaFlow logo toward the top, bottom or left to switch positions; drop-zone previews indicate the target.
- Horizontal navigation measures its available width and places overflow destinations in a fully functional **More** menu, preserving configured page order, visibility, active states and page links.
- Includes a compact profile/progression shortcut in roomy top and bottom bars; account access remains available through the toolbar.
- Settings → **Interface → Navigation** gains four direct style-selection **tabs** (Sidebar, Mini, Top bar, Bottom bar), not a dropdown. Style changes apply immediately and persist through existing MediaFlow settings backup/sync paths.
- Desktop-only navigation options do not override the existing tablet/mobile bottom navigation. Bottom docking positions the floating task dock and Logging back-to-top shortcut clear of the navigation bar.

## Logging → Browse Library Show filter
- Fixes the native dropdown's doubled arrow, stray boxed icon/glyph, and label padding in **All titles**, **Not added**, and **Already added** states.
- Uses one theme-aware chevron with predictable selected-value alignment, accessible focus styling and responsive sizing. The filter's membership semantics are unchanged.

## Tests and data safety
- Browser regression coverage tests real CSS ordering, desktop nav/footer scroll geometry, Sidebar↔Mini width transitions, drag docking to Top/Left, top/bottom dock placement, More button overflow across widths, and dropdown appearance across all filter values.
- The existing v420 cover-repair, Dashboard-statistics and Collection renderers are preserved. No changes to Library, Collection, Personal Order, History, authentication or Supabase records. MediaFlow Plus and MediaFlowApp remain untouched.
