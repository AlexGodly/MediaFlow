# MediaFlow v410 — Mobile Floating Dock & Quick-Action Sheet

**Baseline:** v409 Modular  
**Date:** October 13, 2026  
**Developer:** Alex Godly  
**Release type:** Responsive UI fix  
**Cloud migrations:** None  
**Delivery:** Offline modular ZIP; no commit/push/deployment.

## Problem
In v409, the floating Add shortcut and Task Progress panel obstructed the mobile Dashboard's Next Task and recommendation cards even when no menu was open. The opened quick-action stack was aligned to the right and continued to cover the card in an untidy way.

## Changes
- Present compact progress and the Add trigger on a **single unobtrusive bottom row**, minimizing the combined footprint.
- Default mobile task-progress display to a compact percentage chip with the existing expand/minimize control.
- Expand progress above the dock on demand instead of pushing the Add button around.
- Present the three action buttons in a coherent, centered mobile action sheet with an intentional, dismissible backdrop. Keep names and descriptions readable.
- Constrain the sheet to mobile safe areas, dynamic view height, and short-landscape displays; allow internal scrolling when needed.
- Preserve keyboard Escape/outside click, accessible labels, all original navigation and action handlers.
- Keep desktop fan layout unchanged, use current theme tokens, and preserve active Logging/XP/task state and saved Floating Controls settings.

## Implementation
- Added `assets/css/222-v410-mobile-dock-sheet.css` (late mobile-only stylesheet).
- Updated initial mobile `MF397.compact` behavior in `src/js/components/290-v397-floating-dock.js` (visual default only).
- Updated release metadata, app bundle, PWA assets and regression tests.

No Supabase, data model, authentication, sync, library or history changes.
