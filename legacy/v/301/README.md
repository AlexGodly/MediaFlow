# MediaFlow v301 — Stable v298 Restoration + Current Rerolls Repair

**Authoritative base: MediaFlow v298 Modular.** No v299 or v300 Logging Intensity, XP multiplier, Settings toggle, or related state features are included.

## Changes
- Restores the stable v298 feature set as v301.
- Repairs Current rerolls popup scrolling blocked by the global v260 modal `overflow:hidden` rule.
- Adds a dedicated native, keyboard-accessible, touch-friendly scroll area inside the popup.
- Redesigns the modal header, spacing, recommendation rows, badges, and Edit buttons using theme variables.
- Fixes enlarged reroll history covers breaking the modal grid; proportionally scales the cover column and constrains sizes at narrow viewports.
- Displays long title names cleanly without overlap, with full title tooltip.
- Maintains Respect slot information, Edit action, current recommendation, and reroll history without altering recommendation logic.
- Updates the service worker, PWA cache, version metadata, and rebuild-safe source module.

## Compatibility
Cloud Sync v201 · Full Backup Schema v29 · Settings Preset Schema v1 · Personal Order Export v5 · Collections Export v2. No data migration required.
