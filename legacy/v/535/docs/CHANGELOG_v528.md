# MediaFlow v528 Stable — Universal Media XP Settings Hardening

This maintenance release corrects a late-rendered XP Settings issue in v527.

- Guards the generated additional-unit XP controls against being rediscovered as original XP settings inputs by the global MutationObserver.
- Prevents recursive/nested creation of additional settings rows during Settings rendering, rehydration, and other DOM changes.
- Adds a runnable regression test covering first insertion, injected-frame observation, descendant observations, later full-body scans, and duplicate prevention.
- Retains every v527 activity type, all fifteen units, Progress Reached names, v526 universal sorter labels, session logging, XP and statistics support.
- No data migration, no Supabase changes, and no changes to saved XP, Library progress, or personal orders.

Release includes the full project archive in `legacy/v/528` and GitHub tag `528`.
