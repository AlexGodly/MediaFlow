# MediaFlow v265 — UX Stability, Dynamic Settings & Collapsible Navigation

**App release:** v265  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v265 focuses on interaction reliability and UI stability over v264 without changing the underlying data model.

## What changed

- Added a prominent **Delete title** action to Edit Title and Title Details, using MediaFlow's designed confirmation flow.
- Library search now keeps focus/caret while results refresh, so continuous typing is uninterrupted.
- Normal Library's legacy category dropdown is permanently hidden from layout and no longer flashes after category selection.
- Normal Library status chips now use the same semantic status-icon family as Dynamic Library.
- Personal Order's category picker is viewport-anchored and clamped so it cannot be clipped on either side.
- Today's Balance is redesigned into a clean, non-clickable Dashboard insight with clearer hierarchy, progress, health and guidance.
- Settings mutations now morph the existing Settings DOM in place instead of rebuilding the page, preserving position, focus and interaction continuity.
- Added a theme-aware collapsible/expandable desktop sidebar. Its state is stored in MediaFlow settings and follows normal cloud/settings persistence.
- Existing v264 Library layout, unified History, PWA, backups, exports/imports and cloud compatibility are preserved.
- PWA shell advances to `mediaflow-pwa-v265-shell-v1`.

## Zero-config GitHub Pages release

The supplied ZIP is already deployable. Extract it into the MediaFlow GitHub Pages repository and push/publish it. No npm install, build command, paid service, environment configuration or post-extraction edit is required.

Development-only validation:

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v265.py
```
