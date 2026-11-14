## MediaFlow v556 Stable

### Per-record cloud storage
- Your account is now stored in the cloud as one record per title, History log, activity entry, collection and settings/XP section, instead of one large block.
- Saving sends only what changed: editing one title uploads a few small records instead of the whole account.
- Other devices fetch only what changed since they last synced, and merge record by record. Edits to different titles never overwrite each other; for the same title, the newer edit wins.
- Changes from your other devices appear while MediaFlow is open (checked every minute and when you return to the tab).
- Deletions and reordering reach your other devices too. A deletion that couldn't be uploaded is retried with the next save.

### Safe move
- The move to records happens once, in the background, after a normal start: every record is uploaded, read back and compared before the account switches.
- The previous single-block cloud copy is kept and still updated in the background (every few minutes and when you leave the tab), so older versions, recovery and Full Backup keep working. A save made by an older version on another device is merged in automatically.
- If the record storage can't be reached, MediaFlow starts from that single-block copy instead.
- Changes are kept on this device (IndexedDB) before every upload, so an interrupted save is recovered on the next start.
- If you edit something while changes from another device are being merged, the merge steps aside and is repeated a moment later, so neither change is lost.

### Speed on large accounts (measured at 100,000 titles)
- Saving one edit uploads about 3 KB instead of about 8 MB, in the background with no freeze longer than about 0.15 s.
- A new device downloads the whole account in about 20 requests instead of about 200 (a new database function returns up to 10,000 records per request), and starts in about 8 s.
- A reload reads this device's copy and fetches only the changes since the last sync, and starts in about 4 s.

### Fixes
- Recovering from the start-up recovery screen now leaves the app fully ready (sync, ratings and imports no longer stay blocked until a reload).
- A background scan finishing while a large account was still loading could crash the Dashboard; it now waits for the account to load.
