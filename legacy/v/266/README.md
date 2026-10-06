# MediaFlow v266 — Title Actions, Cover Fidelity, Settings Stability & UI Cleanup

**App release:** v266  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v266 is a focused usability/fidelity release built on v265. It fixes title action presentation, Normal Library missing-cover behavior, Personal Order category-popup positioning, Today's Balance readability, exact Settings-section continuity, and desktop sidebar collapse behavior.

## What changed

- Standardized Edit Title and Title Details actions to **Delete title** and **Edit all title details** with cleaner action layout.
- Normal Library **List**, **Compact**, and **Cards** now use a title's real `coverUrl`; category default artwork no longer masquerades as a title cover when the title has no cover URL. Dynamic Library behavior is unchanged.
- Removed the separate sidebar collapse button. Clicking the **MediaFlow brand/logo** now collapses or expands the desktop sidebar.
- Personal Order's category picker is clamped to the usable viewport beside the sidebar, preventing left- or right-edge clipping.
- Increased Today's Balance typography, spacing, progress readability, and guidance clarity.
- Settings mutations stay in the exact section being edited by anchoring the focused setting/section through the in-place DOM update instead of jumping to another section.
- Existing v265 Library search focus fixes, sidebar persistence, unified History, PWA, backups, exports/imports and cloud compatibility are preserved.
- PWA shell advances to `mediaflow-pwa-v266-shell-v1`.

## Zero-config GitHub Pages release

The supplied ZIP is already deployable. Extract it into the MediaFlow GitHub Pages repository and push/publish it. No npm install, build command, paid service, environment configuration, or post-extraction edit is required.

Development-only validation:

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v266.py
```
