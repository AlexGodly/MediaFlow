# MediaFlow v387 — Logging Added Titles Scroll Stability

**Application:** MediaFlow  
**Version:** v387 Modular  
**Baseline:** v386 Modular  
**Release date:** October 12, 2026  
**Developer:** Alex Godly  
**Release type:** Logging bug fix, rendering efficiency and regression protection  
**Status:** Built and locally tested; not deployed

---

## 1. Problem and cause

Moving an entry in **Logging → Added Titles** could move the entire page away from the user's current position. This was especially disruptive in long drafts, when using arrows, numeric positions, drag-and-drop, or changing sorting options. It affected both **Quick Logging** and **Per Unit**.

Source audit identified a main contributing factor in the v373 order renderer: the sorter called `appendChild` on **every** row in the Added Titles list each time it applied an order. This detached and reinserted even rows already correctly positioned, triggering browser scroll anchoring and risking lost focus. The previous v380 scroll guard covered **Personal Order**, not the separate Logging title-order path.

## 2. Repair — minimum necessary DOM movement

Updated `src/js/components/271-v373-logging-order-studio.js` to move only rows out of sequence, using an in-place cursor and `insertBefore`. Correctly positioned nodes remain attached. This avoids needless mutations for both sorted and custom order displays and reduces focus disruption. **No draft entry is rearranged in storage**: only its displayed row changes.

The title list retains each original `data-mf373-entry` mapping, so existing remove, edit, log and unit-entry handlers continue targeting the correct draft entry.

## 3. New v387 viewport and focus guard

Added `src/js/components/282-v387-logging-order-scroll.js`:

- Captures the window scroll position and active scrollable Logging ancestors before a reorder.
- Restores the prior viewport immediately after ordering and over the next two animation frames; uses instantaneous scroll restoration instead of smooth animated jumping.
- Applies to manual position inputs, up/down arrows, custom moves, drag/drop's shared move function, shuffle, sort-field changes and Asc/Desc changes through the same canonical ordering path.
- Preserves numeric-position input focus with `focus({preventScroll:true})` if row relocation removes it.
- Avoids restoring scroll during detached HTML preparation, ordinary navigation, or unrelated application renders.
- Cancels stale queued restoration after a newer ordering operation or new user scroll input.
- Avoids permanent polling, timers, or full-page rerendering just for scroll restoration.
- Prevents mouse-focus scrolling when repositioning a card using an arrow button, while retaining keyboard accessibility.

Added `assets/css/204-v387-logging-order-scroll.css` to disable browser scroll anchoring on the actively reordered Added Titles lists. Surrounding pages retain their existing layout behavior.

## 4. Scope and preservation

| Surface or action | Behavior after fix |
|---|---|
| Quick Logging → Added Titles | Preserve scroll when reordering |
| Per Unit → Added Titles | Preserve scroll when reordering |
| Move up / move down | Same screen area after movement |
| Numeric position | Same screen area; maintain input focus |
| Custom ordering / drag reorder | Same screen area after drop |
| Sort field / ascending / descending | Keep the current viewport stable |
| Internal scrolling container | Restore the relevant scrollable ancestor |
| Large drafts / repeated moves | No unnecessary full-list DOM reattachment |

The change does **not** alter draft content, staged units, timestamps, runtime, saved Library progress, XP formulas, History, Personal Order queues, Collections, cloud save formats, or backup/import/export schemas.

## 5. Tests and observations

Added `scripts/test-v387-logging-order-scroll.py`. The test loads the real v387 modular application bundle and calls the real `renderLogForm()` for synthetic 48-title drafts. It does not need Supabase or provider API access.

**Five responsive widths:** 320, 390, 820, 1280, 1920 pixels.

**Both Logging modes:** Per Unit and Quick Logging.

**Scenarios:** Arrow moves, numeric position change, sort-field change, direction change, custom/drag mover, generated arrow button handler, nested scroll container, and 20 consecutive reorder operations. Tests check the original order of the canonical draft `entries` remains unchanged and numeric focus survives.

**Recorded scroll behavior:** All tested main-viewport reorder operations preserved 1500 px → 1500 px. Nested-scroller tests preserved the active container's position. Reapplying an unchanged order generated zero Added Titles list child-node reattachments (MutationObserver check). All recorded cases passed.

Tests are controlled Chromium interactions and do not cover physical touchscreen drag gestures, a real authenticated account, large-account latency, or cross-device cloud synchronization. The test measures correctness, not a production-scale speed improvement; **no unmeasured performance percentage is claimed**.

## 6. Technical files and PWA

- Updated `src/js/components/271-v373-logging-order-studio.js` (in-place, minimal row movement).
- Added `src/js/components/282-v387-logging-order-scroll.js` (viewport/focus protection).
- Added `assets/css/204-v387-logging-order-scroll.css`.
- Updated `src/js/runtime-order.json`.
- Added `scripts/test-v387-logging-order-scroll.py`.
- Rebuilt `assets/js/mediaflow-v387.bundle.js`.
- Updated `VERSION`, `version.json`, `package.json`, `index.html`, `README.md`, `README2.md`.
- Regenerated service-worker manifest and PWA cache: `mediaflow-pwa-v387-shell-v1`.

No database migrations, Edge Functions, new secrets, paid services, or extra cloud permissions are required.

## 7. Version evolution

| Version | Key evolution |
|---|---|
| v373 | Added Titles sorting, drag handles, arrows, position inputs and custom order |
| v379 | Restored Logging expansion and fixed mixed Personal Order title/Collection moves |
| v380 | Personal Order scroll preservation; Added Titles draft-unit sorting |
| v382 | Recommended Title direct add, XP card and Per Unit progress outlook |
| v383–v386 | Logging Library and About styling improvements and real theme-color repair |
| **v387** | **Preserve Logging Added Titles scroll during all reorder paths** |

**MediaFlow v387 — Reorder your titles without losing your place.**
