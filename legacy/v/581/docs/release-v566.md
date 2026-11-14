## MediaFlow v566 Stable

Released together with the MediaFlow app 7.0.0.566.

### Logs keep their real time
- **A log counts on the day you consumed, not the day you saved.** Keeping a log open for two days and then pressing Save or Save & get next task no longer puts everything on the save day.
- **New setting, Log time** (Settings → Dashboard):
  - **When each unit was logged** (default): each episode, chapter or unit counts at its own time.
  - **When the title was added to the log**: everything for a title counts at the time it was added.
- A log that spans several days is saved as one session per day, so streaks, History and Statistics show every day you consumed. XP and amounts are split between the days; the totals don't change.

### Details Recovery
- **Select all / Deselect all** when you review which fields to save for a title. They follow the "Show fields" filter and never pick protected or existing fields.
- **Ratings found by Details Recovery are saved as the title's external ratings.** A newer value replaces an older automatic rating; ratings you entered yourself are never changed.
- **A later ratings refresh updates them** when there's a newer value, and leaves them as they are when there's no update or the source can't be reached.

### Recovery workspace
- **No more lag while recoveries run.** The account is saved in batches (every 10 titles or 10 seconds, and right away when a job pauses, stops or finishes, or the tab is closed) instead of after every title. If a recovery is interrupted, the last few titles are simply checked again.
- **Progress updates a few times a second** instead of after every step, and the Background Processes widget only redraws when what it shows has changed.

### Get MediaFlow
- **Download icon** on the green Get MediaFlow button.
- **Proper icons** for download, install, update and check, and a device icon on every platform card.
- **Your devices:** every phone, PC and browser you use MediaFlow on, with its version and whether it's up to date. Browsers and installed web apps are now checked too, not only the apps.
- Fixed: the website's "up to date" check read an old internal version number.

### Help
- FAQ entries for everything above.
