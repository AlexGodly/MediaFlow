# MediaFlow v530 Stable — Category Type Dropdown Compatibility Fix

## Root cause
The original v527 universal-media update correctly expanded the **base** Category modal to four activity types. However, the active **v144 custom icon/color Category modal renderer** subsequently overwrote that form and still displayed only **Video** and **Reading**. The built-in artwork picker (v258/v259) wrapped that older renderer and inherited its outdated type selection.

## Fix
The actual active **Add Category** and **Edit Category** renderer now offers the full set of four activity types:

| UI label | Persisted value |
| --- | --- |
| Watching | `video` |
| Reading | `reading` |
| Playing | `playing` |
| Listening | `listening` |

The existing `video` identifier is intentionally retained for compatibility with historic categories and cloud records. Editing a previously saved Playing or Listening category keeps its selection; the change does not reset other category fields.

## Scope and safety
- Keep all **15 universal progress units**, the **24 built-in PNG icons** (including Games and Music), the existing icon/color editor, Quick and Advanced Logging, XP, and Stats.
- Keep the existing `App.saveCategoryModal` category save path; cloud sync and existing category records are not migrated or changed.
- Test the **active v144 renderer directly** for both Add and Edit (all four values, selection, persistence contract), not only the old base HTML.
- CI regenerates the production bundle, PWA offline assets and full archive at `legacy/v/530`, then publishes the numeric GitHub Release `530` and deploys Pages.

No Supabase migration, new credentials, or changes to existing library data.
