# MediaFlow v527 Stable — Universal Media Foundation

v526 delivered the universal sorter labels. **v527 adds the remaining universal media expansion on top of that release.**

## Activity types and units
Watching (`video` legacy identifier), Reading, Playing and Listening are available in **Add Category** and **Edit Category**. All existing category identifiers and saved category values remain unchanged.

All **15 tracking units** are available: Episodes, Chapters, Movies, Issues, Sessions, Videos, Pages, Volumes, Tracks, Albums, Levels, Missions, Matches, Lessons and Items. Each has singular and plural labels. Category editing continues to use the established cloud persistence pathway.

## Quick and Advanced Logging
The user-facing **Last Progress / Last Watched** label is renamed to **Progress Reached**. Underlying stored method IDs (`progress` and `last`) remain unchanged. Progress field labels are unit-aware: e.g., **Episode Reached**, **Movie Reached**, **Mission Reached**, or **Session Reached**. The existing three Advanced Logging methods and per-unit timestamp/duration/commit logic are preserved.

## XP and Statistics
Existing unit XP rates are preserved. New units receive configurable global XP defaults and repeat XP defaults using existing leveling settings. Existing Statistics unit totals and stat cards now handle any registered unit rather than a fixed set of four. Playing/Listening repeat terminology gains Replayed/Relistened descriptions.

## Sorters
The universal **Consumed progress**, **Total progress** and **Remaining progress** labels from v526 are preserved. A minimal DOM option adapter also normalizes any late-rendered historical sort controls, without modifying keys or order logic. The v525 Logging session sort and draft-order behavior remain intact.

## Data safety
There is **no Supabase schema migration**, no modifications to existing Library titles, categories, historical records, XP rewards, saved progress or Personal Order. New category type/unit values are stored through the canonical category save path. No new services or provider credentials are required.

### Limits
Per-category XP *overrides* are deferred to prevent historical XP rebuilds from changing old rewards. Existing global unit XP settings cover all fifteen units. Type-specific third-party catalog integrations are not introduced here.

## Validation and release
Regression tests: v514, v517, v518, v523, v524, v525, v526 and `tests/test-v527-universal-media.cjs`. PWA build/smoke check and archive under `legacy/v/527`, with GitHub Stable Release tag `527`.
