## MediaFlow v558 Stable

### Add to Logging is fast now
- The popup opens straight away: its frame shows the moment you click, and your library fills in right after.
- Opening no longer rebuilds the title list dozens of times in the background. Large libraries (30,000+ titles) open in a few seconds instead of freezing the page.
- Typing in the search stays smooth: the list updates once you pause instead of on every key.
- Sorting the library is much faster everywhere it's used (Logging picker, Add to Logging, Library pickers), with exactly the same order as before.

### Add to Logging looks like MediaFlow
- The popup follows your theme instead of a fixed dark style: readable header, a pill for "titles added", and matching buttons.
- Filters sit in one tidy grid with clean dropdown arrows; Select Visible / Add Selected stay in reach while you scroll.
- Title rows have round accent checkboxes, a soft highlight when selected, and themed Add buttons.

### Background Processes
- The minimised button now matches the + button: same gradient, glow and rounded shape, with a small badge showing how many jobs are running.
- The minimise button in the panel matches the chevron beside it instead of a black square.

### Discover verified External IDs
- Round radio buttons in your theme colour (no more stretched selection).
- Site results grouped as Found, No match and Couldn't search, with short labels; hover for the full message.
- Already-set IDs shown in one compact "Already linked" list.
- Each result has an "Exact match" or "Check this" tag and an open-on-site button; click anywhere on the row to choose it.
- "Find IDs" is a proper button, and "Add N IDs to this title" counts what you chose (disabled until you choose something).
