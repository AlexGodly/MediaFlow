# MediaFlow v242 — Logging Clarity, History Toolbar Polish & Logging Performance

MediaFlow v242 focuses on clearer logging progress controls, cleaner clickable artwork, a more professional History toolbar, and additional logging-path optimization for very large Libraries.

## Logging readability
- Increased the size and contrast of **Last progress** and contextual progress labels such as **Last watched episode**, **Last read chapter**, **Last read issue**, **Last read volume**, and **Last read book**.
- Enlarged the matching numeric progress fields so the logging workflow remains clear on desktop, tablet, and mobile.
- Increased the logged-title progress-label size without changing progress calculation behavior.

## Logging artwork cleanup
- Removed the generic neutral action icon that could appear beside/over logged-title artwork.
- Real covers and category-icon fallbacks remain clickable and still open **Title Details**.
- Missing covers continue using the title category's configured icon.

## Logging performance
- Added a title-only Library lookup index for logging.
- Exact category/title matching now uses indexed lookup rather than a full Library scan.
- Logging search reuses normalized title text and caches recent candidate sets.
- Continuing to type a longer query narrows the previous result set where possible instead of rescanning the full Library from scratch.
- Logged-title cards use the v241 ID index rather than repeated `Array.find()` calls.
- Replaced the global v225 whole-document dynamic-button rescan with a subtree-scoped observer, reducing work during repeated logging/suggestion DOM updates.

## History toolbar redesign
- Reorganized History controls into a cleaner control card.
- Category, media type, and time range filters stay aligned in the primary row.
- Custom From/To dates use a dedicated aligned row.
- **Export CSV** remains clearly positioned on the right on desktop and becomes full-width when space is limited.
- **Undo last entry** retains a clear position beside the History heading.
- Existing searchable category filtering, custom dates, pagination, Edit/Delete actions, and CSV export behavior are preserved.

## Data / persistence audit
Re-audited current integration with:
- Cloud persistence / **Sync Now**
- Full Data Export / Import
- Full Backup / Automatic Backup
- Settings Preset Export / Import
- History CSV Export
- Personal Order Export / Import

No new persistent fields are introduced in v242.

Compatibility remains:
- **Cloud Sync:** v201
- **Full Backup Schema:** v29
- **Settings Preset Schema:** v1
- **Personal Order Export:** v4
