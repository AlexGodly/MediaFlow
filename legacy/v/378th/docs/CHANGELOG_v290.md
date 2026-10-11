# MediaFlow v290 — Category Selector UI, Dropdown Layering & Title-Editing Visibility Controls

## Category selector UI
- Rebuilt the rich Category selector used by **Add Title**, **Edit Title**, and **Title Details → Category Quick Edit**.
- Category options now render in a body-level floating picker so modal/editor overflow cannot clip the menu.
- Fixed Category menus visually overlapping or blending with Priority, Start Date, labels, help text, and other editor controls.
- Fixed Title Details Category Quick Edit options colliding with **Cancel / Save**.
- Added opaque theme-aware picker surfaces, stronger layering, controlled shadows/borders, and isolated scrolling.
- Added viewport/modal-aware positioning: the picker opens downward when space allows and upward when needed.
- Added boundary clamping so the picker stays inside the usable modal/viewport area.
- Long Category lists scroll independently with overscroll containment.
- Preserved configured Category artwork/icons in the trigger and every option row.
- Preserved Set Category ordering in Add/Edit/Quick Edit.

## Set Category visibility behavior
- **Default behavior remains: all Categories are available when directly adding or editing a title, even if a Category is hidden in Set Category.**
- Added a Set Category note explaining the distinction between popup visibility and direct title editing availability.
- Added **Apply Set Category visibility to title editing** under the Set Category order/visibility controls.
- The new option is **Off by default**.
- When Off: hidden Set Category choices remain available in Add Title, Edit Title, and Title Details Quick Edit.
- When On: hidden Set Category choices are also hidden from those title-editing selectors.
- A title's currently assigned Category remains visible while editing even when it is hidden, preventing existing titles from showing a blank Category.
- The new setting is stored inside the canonical MediaFlow Settings object and therefore participates in normal persistence, Cloud Sync, Full Backup and Settings Preset portability.

## Compatibility
- Cloud Sync v201
- Full Backup Schema v29
- Settings Preset Schema v1
- Personal Order Export v5
- Collections Export v2
- Dynamic Themes preserved
- No destructive data migration required
- PWA shell `mediaflow-pwa-v290-shell-v1`
