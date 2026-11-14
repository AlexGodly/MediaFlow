## MediaFlow v579 Stable

### Titles logged by parts: the same layout everywhere
Logging (Quick), Batch Log and Log any title now share the layout of the app's Log any title: a **Parts · N parts · N in all** header, the part chips (✓ on the chosen ones), one card per part with a wide **Match reached** / **Amount** box (no more "Match reac…"), the move line with its time (*Match 0 → 1 (+1 match) · 15m*) and bar, then **+N in all · time**. Checked on desktop and phone widths.

### MediaFlow Recommends and by-parts titles
- **Fixed:** "Use recommended title" and the Logging picker's quick add left a by-parts title without parts, so it logged nothing. It now starts on the part logged last, one unit.
- The recommendation names the next part (**Next: Mode · Live · Match 5 of 10**), the Logging shortcut says "N parts" instead of "N seasons", and the title's progress is counted in its own unit.

### History in each title's own unit
Consumption history, Recently viewed, Latest consumed and Most consumed titles count a title with its own unit ("3 matches", not "3 sessions"). A by-parts log shows one short line per part, with the kind once:
*MODE · Career · Match 1 → 3 (+2) · Live · Match 0 → 1 (+1)*.
(The History module is private; it now offers `MediaFlowV269Hooks` so later modules can adjust it. The v577 History part text, which never reached the page, works through it too.)

### Title recovery: Select all / Deselect all
A title's own recovery (details, or cover + details) has **Select all** and **Deselect all** above its fields, with "N of M selected". Fields that already have a value stay as they are.

### Also
- Batch Log: the stray broken-image icon beside a chosen title is gone (the cover already shows the category icon).
- Category lists: checked — the website already follows your category order and the choice/filter layout everywhere.
- The `mf556` fallback copy in `mediaflow_states` is already gzip-compressed (about 4.6 MB for a 31k-title account); nothing changed there.

Matches MediaFlow app 10.0.0.579.
