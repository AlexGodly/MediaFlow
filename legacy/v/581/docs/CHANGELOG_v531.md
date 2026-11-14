# MediaFlow v531 Stable — Universal Status Names

MediaFlow now shows **Active** instead of **Watching**, and **Planned** instead of **Plan to Watch**, for Library title statuses throughout the application.

| Stored status | Displayed label |
| --- | --- |
| `active` | **Active** |
| `planned` | **Planned** |
| `paused` | On Hold |
| `completed` | Completed |
| `dropped` | Dropped |

## Covered surfaces

The shared status formatter, Library and Dynamic Library status pills and filters, title-details status selector, single and bulk status choice dialogs, Collections and Personal Order status filters, collection bulk actions, recovery status scopes, Statistics status charts and active-title counts, Settings descriptions, and historical/legacy UI fallbacks now show the new labels.

## Compatibility and safety

- The stored `active` and `planned` IDs are **unchanged**. There is no Library/History/Settings/XP migration and no Supabase schema update.
- The category **activity type Watching** remains separate and unchanged.
- External MyAnimeList XML export continues to use its expected status vocabulary. The XML importer accepts its old labels as well as `Active` and `Planned`.
- All 15 tracking units, all four media activity types, 24 category icons, cloud sync and backups are preserved.
- The full project is archived in `legacy/v/531`. Run `node tests/test-v531-status-labels.cjs` plus the existing v514–v530 regression suite and PWA smoke checks before GitHub release tag `531` and Pages deployment.
