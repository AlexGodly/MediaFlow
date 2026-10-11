# MediaFlow v287

## Personal Order Collection queues

- Added **Add Collection** directly under Personal Order's existing Add Titles picker.
- Collections are stored as live references in Personal Order instead of duplicating their titles.
- The same Collection can be assigned to multiple Personal Order task categories independently.
- Personal Order categories now support mixed queue items: direct titles and Collection queue blocks.
- Collection blocks read the Collection's current live title order, so reordering the Collection updates future recommendations automatically.

## Per-assignment recommendation rules

Every Collection assignment stores its own two independent rules:

- **Task category rule**
  - Match Task Category: only Collection titles whose actual Library category matches the Personal Order task category are eligible.
  - Force Queue: titles remain eligible even when their actual Library category differs from the task category.
- **Completed title rule**
  - Skip Completed: completed Collection titles are ignored.
  - Include Completed: completed Collection titles can participate in the Collection queue.

Dropped titles remain excluded. Force Queue never changes a title's real Library category.

## Collection traversal / queue progression

- When Prioritize Order reaches a Collection block, eligible titles are recommended in that Collection's own order.
- After the user actually logs the recommended Collection title, that assignment advances to its next eligible title.
- Traversal is stored per Collection assignment, so the same Collection can progress independently in different Personal Order categories.
- Traversal persists locally and through normal cloud state.
- Added **Reset progress** for replaying an assignment's Collection queue.
- Once an assignment has no remaining eligible Collection titles, Personal Order continues to the next direct title or Collection block in that category queue.

## Personal Order management / persistence

- Added a Collection Queue board showing mixed direct-title and Collection ordering.
- Collection assignments support exact numeric position, Move Up, Move Down, rule editing, removal and progress reset.
- Clear Personal Order now includes Collection assignments and keeps one recovery snapshot for Restore Last Order.
- Restore Last Order restores Collection assignments, mixed queue ordering and traversal state.
- Personal Order Export advanced to **v5** and now includes Collection assignments, mixed category queues, traversal state and referenced Collection descriptors.
- Personal Order Import v5 resolves referenced Collections and restores assignments/rules/queue placement where matching Collections exist.
- Cloud Sync v201, Full Backup Schema v29 and the existing state pipeline preserve the new Personal Order Collection data.

## Compatibility

- Cloud Sync: v201
- Full Backup Schema: v29
- Settings Preset: v1
- Personal Order Export: **v5**
- Collections Export: v2
- PWA shell: `mediaflow-pwa-v287-shell-v1`
- No data migration required.
