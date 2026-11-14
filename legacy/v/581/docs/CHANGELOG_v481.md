# MediaFlow v481 Stable — Category Classes UI Redesign, Search & Drag-and-Drop

## User-reported bug
The v480 **Add/Edit Category Class** popup inherited giant icon/color controls from the Category editor without the Category editor's proper scrolling, fixed header/footer, and layout. Long saved icon palettes could trap the popup; users could not reach category assignments or Save. Selecting categories could also jump the popup upward.

## v481 — Dedicated Class dialog
- Completely replaces the v480 extraction of the full Category modal with a **purpose-built Category Class dialog**.
- Limits fields to **Class name, Icon, Color, Class Weight, Enabled, and assigned Categories**. No Type, Unit, Suggested Target, Runtime, Seasonal, Default Cover or other Category-only settings.
- Keeps **the exact same shared MediaFlow icon/color palettes and handlers**: 22 built-in art icons, emoji and saved custom emoji, supported custom icon URLs, built-in/saved colors, and add custom icon/color actions. Does not duplicate a different palette.
- Correct fixed, always-visible header and Save/Cancel footer; the dialog body scrolls independently and fits desktop, tablet, 320px mobile, short landscape and keyboard-constrained viewports. Icon and saved-icon subpalettes may scroll without trapping the main body.
- Searchable category-selection list with checkboxes, **Show selected only** and selected count. Searching, checking/unchecking, and icon selection update only their own DOM controls — **never rerender/scroll the modal to the top**.
- Selecting a category already assigned to a different Class indicates its prior assignment and transfers it on Save; filtered-out checked categories remain checked and are saved.

## v481 — Two-pane Category Classes manager
- Integrated searchable **Category Library sidebar**, next to all Class cards, similar to Recovery Presets.
- Drag category rows from the sidebar and **drop onto a Class card** to assign/move it; separate unassign drop area.
- Every sidebar row also has a **keyboard/touch accessible Assign dropdown**, supporting non-drag devices and one-primary-class-per-category transfers.
- Shows actual saved category icon, current Class, and disabled-category flag. Search updates row visibility in place and preserves the search text and scroll position through assignments.
- The two-pane layout collapses to a vertical layout on mobile and remains theme-aware.
- Class assignment changes persist through the original `v480Write` Settings route and do not mutate categories, Library titles, History, XP, Personal Order or cloud schemas.

## Compatibility and safety
- v480 class scheduler and class settings unchanged. **Disabled by default** remains the default.
- Disabled Categories may be organized within Classes but are never eligible for recommendations; disabled Class and existing category eligibility rules are preserved.
- Existing Category editor, recovery workflows and all other modals are unchanged. No new provider or API requirements.
- Uses current canonical Settings cloud sync/import/export path.

## Validation / release
- `scripts/test-v481-category-class-ui.cjs` exercises searching, filtering, transfer/unassign, disabled-category rule, no-jump contract and inherited v480 scheduler regressions.
- `scripts/test-v481-browser.cjs` checks real Chromium desktop/mobile geometry, fixed header/footer, scrolling body, selection/search preservation, responsive Class Manager and earlier browser regressions.
- Build/PWA service worker, browser cache/rollback, `scripts/check.py`, complete source snapshot `legacy/v/481`.
- Numeric tag `481`, name `v481 Stable`, ZIP + SHA256 assets, GitHub Pages deployment.
