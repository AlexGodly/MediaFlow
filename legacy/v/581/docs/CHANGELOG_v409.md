# MediaFlow v409 — Mobile Floating Quick Actions Repair

**Baseline:** v408 Modular | **Date:** October 13, 2026 | **Developer:** Alex Godly  
**Scope:** Website/PWA UI-only responsive patch; no database or Supabase changes.  
**GitHub:** No push, no commit, no deployment.

## Problem

At mobile viewport widths, the v397 floating menu placed its fan with `left:0` relative to a trigger already positioned at the right edge of the screen. The cards expanded to the right and became clipped, showing only the icons, as reported in the mobile Dashboard screenshot. With active task progress, the horizontal dock could also move the trigger away from the right edge.

## Solution

Add a late-loading, scoped mobile CSS layer (`221-v409-mobile-floating-actions.css`) that transforms the fan into a right-aligned, vertically stacked menu positioned **inside** the phone viewport. Each quick action retains its original event handler, icon, text and theme styles. Narrow and short screens may scroll the menu internally. The mobile task-progress card sits above the FAB instead of beside it; it is temporarily visually hidden while the menu is open, without modifying task data.

## Compatibility

Preserves all v408 Logging, Collections, Library, dashboard, settings, PWA and cloud features. No changes to Supabase policies, user records, progression, service integrations or cloud fields. Desktop fan layout is untouched.

## Files and testing

- `assets/css/221-v409-mobile-floating-actions.css` — responsive corrections.
- `index.html` and version/PWA assets — package version and cache refresh.
- `scripts/test-v409-mobile-fab.py` — offline Playwright geometry and interaction checks at mobile and desktop viewports.

No live authenticated production session was tested. The standalone geometry test uses the real v409 styles and the production floating-action markup and verifies that all three action buttons are fully within the screen.
