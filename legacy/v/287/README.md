# MediaFlow v287 — Personal Order Collection Queues

**App release:** v287  
**Cloud Sync:** v201  
**Full Backup:** Schema v29  
**Settings Preset:** v1  
**Personal Order Export:** v5  
**Collections Export:** v2

## v287

- Adds **Add Collection** directly below Personal Order's Add Titles section.
- A Collection can be assigned to one or more Personal Order task categories without duplicating its titles.
- Personal Order now supports mixed queue items: direct titles and Collection blocks.
- When Prioritize Order reaches a Collection block, MediaFlow recommends eligible titles using the Collection's live title order before moving to the next queue item.
- Each Collection assignment independently supports **Match Task Category / Force Queue** and **Skip Completed / Include Completed**.
- Force Queue can recommend a Collection title under the assignment's task category without changing the title's real Library category.
- Successfully logging a Collection-sourced recommendation advances that assignment to its next eligible title; traversal is persistent and can be reset manually.
- Same Collection assignments in different task categories keep independent rules and traversal progress.
- Clear / Restore Last Order, Cloud Sync and Full Backup preserve Collection queue assignments and traversal state.
- Personal Order Export/Import advanced to **v5** with Collection assignments, mixed queue order, traversal state and Collection references.
- PWA shell advanced to `mediaflow-pwa-v287-shell-v1`.
- No data migration required.
