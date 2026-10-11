# MediaFlow v286

## Category persistence / runtime cache coherence

- Fixed edited category values being stored in `S.categories` while `getCategory()` continued returning an older cached object.
- Root cause: the v241 category cache invalidated only when the categories array reference or length changed; editing an existing category replaced one element in place.
- Category saves now replace the categories array reference and explicitly invalidate category-derived caches.
- Library indexes that include category-derived metadata are invalidated after category edits.
- Category edits now immediately affect Logging and scheduler calculations such as Minutes per unit.
- Verified 25 → 30 minutes per episode survives same-client reopen and fresh-client cloud reload.

No schema migration. Cloud Sync v201 / Full Backup v29 / Settings Preset v1 preserved.
