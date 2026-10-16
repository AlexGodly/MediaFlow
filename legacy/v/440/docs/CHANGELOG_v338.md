# MediaFlow v338 — Normal Library Cover Selection Fix

**Release:** MediaFlow v338  
**Base:** MediaFlow v337 Modular  
**Created by:** Alex Godly  
**Release Date:** October 9, 2026

## Normal Library — Missing Selection Checkboxes Fixed

Fixed a regression in **Library → Normal mode** where the selection checkboxes did not appear on title tiles when using **Covers** or **Covers+Titles** while **Clean Covers was OFF**.

The previous Normal Library cover stylesheet hid all direct elements inside a cover tile. This unintentionally hid the checkbox inserted by the Library selection system.

## Covers Display Selection Restored

With **Normal mode → Covers** and **Clean Covers OFF**, every visible title tile now displays its selection checkbox again.

## Covers+Titles Display Selection Restored

With **Normal mode → Covers+Titles** and **Clean Covers OFF**, title tiles now display their selection checkboxes as expected.

## Existing Selection Actions Preserved

The restored checkboxes use the existing `librarySelection` state and selection event handlers. They remain compatible with MediaFlow's current batch-selection workflow.

## Clean Covers Behavior Preserved

When **Clean Covers is ON**, title-selection checkboxes remain hidden in both cover display modes, exactly as before.

No change was made to the Clean Covers toggle or the rules for clearing hidden selections.

## Dynamic Library Preserved

Dynamic Library already displayed the selection boxes correctly. v338 leaves its checkbox markup and styling untouched.

The existing Dynamic Library behavior remains unchanged across all display modes.

## Other Display Modes Unchanged

Normal Library's **List**, **Compact**, and **Cards** modes retain their existing selection behavior and styling.

## Scoped Styling Fix

Added a narrowly targeted CSS override that applies only when all of the following conditions are true:

- Library is using Normal mode;
- Display is Covers or Covers+Titles;
- Clean Covers is OFF;
- the tile contains its existing selection checkbox.

This fixes visibility and positioning without modifying any title data, cloud records, or Library selection APIs.

## Responsive Cover Sizing Preserved

The checkbox position follows the existing adjustable cover size, placing it over the title cover without altering tile dimensions.

## Existing Features Preserved

No changes were made to Dashboard, Statistics, XP, Active Time Spent, Collections, Personal Order, Supabase configuration, imports, exports, themes, or other MediaFlow functionality.

---

# Release Files & Versioning

## New Stylesheet Added

`assets/css/165-v338-normal-cover-selection.css`

## JavaScript Bundle Updated

`assets/js/mediaflow-v338.bundle.js`

The JavaScript application logic remains the same as v337; the fix is a scoped CSS change.

## VERSION Updated

**338**

## version.json Updated

Application version and build metadata now report v338.

## PWA Updated

**`mediaflow-pwa-v338-shell-v1`**

The service worker includes the new stylesheet and points to the v338 application bundle.

## Supabase Configuration Preserved

MediaFlow continues using the existing Supabase project. No SQL migration is required.

| System | Version |
|---|---|
| Cloud Sync | 201 |
| Full Backup Schema | 29 |
| Settings Preset Schema | 1 |

---

# v338 Release Summary

- Fixed missing selection checkboxes in Normal Library Covers display.
- Fixed missing selection checkboxes in Normal Library Covers+Titles display.
- Restored checkbox visibility only when Clean Covers is OFF.
- Preserved Clean Covers ON behavior.
- Preserved Dynamic Library behavior.
- Preserved List, Compact, and Cards displays.
- Preserved existing selection and batch actions.
- Added one scoped CSS file.
- Updated the active bundle, version metadata, and PWA shell to v338.
- Kept Supabase, backup formats, and all other functionality unchanged.

## Version Progression

**v337** → Dual active-time and Time XP milestone bars, Bonus XP panel removal.  
**v338** → **Normal Library Covers/Covers+Titles selection-checkbox visibility fix.**

**Validation:** JavaScript syntax passed. Targeted browser tests confirmed Normal Library Covers/Covers+Titles selections when Clean Covers is OFF and continued hiding when ON; Dynamic Library was checked for unchanged behavior. Full live deployment and Supabase sync have not been tested for v338.
