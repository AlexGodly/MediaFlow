# MediaFlow v296 — Category Recovery Confirmation, Responsive More UI & Full Release Audit

## Settings → Categories
- **Restore missing defaults** now opens a designed confirmation popup before changing data.
- The popup shows how many default categories will be restored and previews the affected categories.
- **Restore last deleted** now opens its own designed confirmation popup before restoration.
- The popup shows the recoverable category and explains that it returns to its previous position.
- Both confirmation surfaces use MediaFlow theme variables, so they adapt to active Dynamic/Full Style themes.
- Existing category edits are not overwritten by Restore missing defaults.
- Confirmation copy explicitly explains cloud-safe persistence and what data is left untouched.

## Responsive navigation
- Reworked the <=1080px **More** popup into a compact MediaFlow navigation surface instead of oversized generic buttons.
- Added a MediaFlow header, destination count, close button, page icons, labels and short page descriptions.
- Medium/tablet widths use a compact 2-column grid.
- Tight mobile widths collapse to one clean column.
- Bottom navigation labels may wrap to two lines rather than becoming cramped or visually merged.
- Panel placement remains fixed above the bottom navigation and stays inside the viewport.
- All colors/borders/backgrounds are derived from MediaFlow theme variables.

## Cloud data protection UI
- Removed the user-facing **v115 data protection** implementation label; the screen now simply identifies itself as **Cloud data protection**.
- **Retry cloud connection** now uses an explicit circular-sync/retry icon that matches the action.
- **I intentionally want an empty workspace** now uses an explicit new/blank-workspace icon instead of an unrelated semantic glyph.
- Retry icons are also used consistently on the alternate retry action shown by suspicious/empty cloud states.
- The underlying cloud safety guard and recovery behavior are unchanged.
- The protection screen remains theme-aware and uses MediaFlow button/card styling.

## Persistence / data audit
- Category recovery state remains included in the canonical cloud snapshot and merge/apply pipeline.
- Sync verification continues checking category definitions, category order, default highlighting and category recovery state.
- Full + Automatic Backup re-stamped for v296 while keeping Full Backup Schema v29.
- Settings Presets re-stamped for v296 while keeping Settings Preset Schema v1.
- Personal Order export remains format v5 and is stamped with release v296.
- Collections export remains format v2 and is stamped with release v296.
- Full Data import/export, XP calculations, History exports, Sync Now, automatic update/install and cloud persistence were audited for the release.

## PWA
- Release shell advanced to v296.
- Current bundle/CSS assets are included in the generated app-shell cache.
- Automatic update detection uses v296 release metadata.
