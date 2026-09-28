# MediaFlow

**A personal media consumption rotation system that helps you decide what type of media to consume next without taking away your choice of what title to watch or read.**

MediaFlow is a media library, consumption tracker, intelligent rotation scheduler, statistics dashboard, and progression system created by **Alex Godly**.

> **MediaFlow decides what type of media comes next. You decide what you actually want to watch or read.**

This README intentionally describes **MediaFlow as a project rather than a specific release**. Individual releases can add features, improve the interface, or expand integrations without requiring this document to be rewritten for every version.

---

## Why MediaFlow Exists

Large media libraries create a different problem from simply finding something good to watch or read. When anime, television, movies, manga, manhwa, comics, and other media are waiting at the same time, it becomes easy to repeatedly consume one category while neglecting others, spend more time choosing than consuming, or continuously add titles without progressing through the existing library.

Traditional watchlists primarily answer **“What titles do I have?”**

MediaFlow is designed to also answer **“What type of media should I consume next, and how much should I consume before rotating?”**

Instead of choosing an exact title for you, MediaFlow can generate a task such as:

> 🎯 **NEXT TASK: SEASONAL ANIME**  
> Watch 4 episodes.

You remain free to choose which eligible titles satisfy that task. The scheduler controls the **rotation**. You control the **content**.

---

## Core Philosophy

- **Category-first recommendations:** MediaFlow normally recommends a media category and amount rather than forcing an exact title.
- **User choice:** You remain in control of the actual title.
- **Variety:** Rotation discourages repeatedly consuming one category while everything else is ignored.
- **Balance:** Consumption history helps identify categories that are due, neglected, healthy, or overused.
- **Progress:** Logging consumption can update Library progress and completion state.
- **One connected system:** Library data, History, Statistics, XP, and scheduler decisions work together.

---

## Supported Media

| Category | Typical Unit |
| --- | --- |
| 🔴 Seasonal Anime | Episodes |
| 🟢 Anime Backlog | Episodes |
| 📺 TV Series | Episodes |
| 🎨 Other Animation | Episodes |
| 🎥 Movies | Movies |
| 🎞️ Anime Movies | Movies |
| 📖 Manga | Chapters |
| 📚 Manhwa / Manhua | Chapters |
| 📰 Western Comics | Issues |

Custom categories can also extend the rotation system beyond the defaults.

---

## Intelligent Rotation Scheduler

The scheduler is the heart of MediaFlow. Rather than using pure randomness, it can evaluate signals such as category weight, configured targets, recent consumption, time since last consumption, neglect, overuse, repetition, consecutive usage, saturation, seasonal relevance, availability, and controlled randomness.

Category health can be represented as:

**Healthy · Due · Neglected · Overused**

MediaFlow is designed to sit between a completely random picker and a rigid calendar.

**Give me something else** can rotate away from the current category for the next recommendation. **Skip** can abandon the current recommendation without falsely recording it as consumed.

---

## Optional Exact-Title Recommendations

MediaFlow is category-first by default, but an optional exact-title recommendation system can suggest a specific Library title. Eligible-title scoring can use factors such as status, priority, progress, category, seasonal relevance, completion state, and controlled randomness.

The feature remains optional. You can always keep choosing exact titles yourself.

---

## Library

The Library is the central collection of tracked media. Titles can contain information such as title, category, progress, total units, status, priority, rating, estimated duration, tags, source information, cover artwork, and imported metadata.

Typical statuses include:

**Planned · Active · Paused · Completed · Dropped**

The Library supports searching, filtering, editing, deletion, priority management, category management, bulk workflows, and large collections. Deleting a Library entry does not have to erase its historical consumption records.

---

## Seasonal Anime & Anime Backlog

MediaFlow includes dedicated Seasonal Anime and Anime Backlog behavior. Seasonal logging can work with eligible Seasonal and Backlog entries, while Backlog logging remains focused on backlog titles.

A suitable Backlog title selected for seasonal consumption can be promoted into Seasonal. When a seasonal title reaches its known final episode, MediaFlow can preserve its progress and completion information while returning it to the normal backlog workflow. Completed titles are excluded from ordinary logging suggestions.

---

## Consumption Logging

A consumption record can include the title, actual category, amount consumed, minutes spent, date/time, notes, Library association, completion information, XP, and recommendation context.

Logging can update Library progress automatically.

The connected flow is:

> **Log consumption → update Library → update History → update Statistics → update XP → update category balance → influence future recommendations**

Recommendation outcomes can be represented separately from independent consumption:

- **Complete:** recommended target completed.
- **Partial:** some of the recommended category consumed below target.
- **Over:** recommendation target exceeded.
- **Skipped:** recommendation not fulfilled.
- **Logged:** genuine consumption independent of recommendation fulfillment.

This lets MediaFlow remember both **what it recommended** and **what you actually consumed**.

---

## Batch Logging

Batch Logging records several consumption events together, which is useful when you consumed multiple titles before opening MediaFlow.

You can search the Library for titles and give each selected title its own amount and minutes. Its actual category comes from the selected Library entry.

Batch consumption participates in the same MediaFlow ecosystem as ordinary logging and can update Library progress, completion state, History, Statistics, XP, category balance, and future scheduler behavior.

---

## History & Library History

Consumption History is a chronological record of what you consumed and is a primary data source for the scheduler and Statistics.

Library History can separately track supported Library operations such as additions, edits, deletions, status/category/priority changes, batch operations, imports, and undo/redo activity.

Where supported, Library History uses stable Library associations to avoid incorrectly linking similarly named titles.

---

## XP & Leveling

MediaFlow includes an optional progression system tied to actual application activity. XP can be influenced by time consumed, media units, unit type, category rotation health, supported Library actions, and title completion.

The progression system is designed to reflect MediaFlow activity rather than act as an unrelated decorative counter. Restored or imported data can also be reconciled when sufficient historical information exists.

---

## Statistics

Statistics can provide views of total titles, sessions, consumption time, episodes, chapters, issues, movies, daily/weekly/monthly activity, category and media-type distribution, Library status and priority distribution, completion activity, category balance, streaks, historical trends, lifetime activity, and XP/level progression.

The Statistics interface adapts across desktop, tablet, and mobile layouts.

---

## Stopwatch

The built-in stopwatch can be used to track consumption time. Supported controls can include **Start, Pause, Reset, Clear, Set time, Add time, Minus time**, and using the elapsed value as logging minutes.

---

## Cover Artwork

Library titles can use external cover artwork. Supported cover-search workflows can use providers such as Jikan, TVmaze, and Open Library depending on media type and available data, with fallback behavior where appropriate.

Manual cover URLs remain supported. External artwork references are preferred over embedding large image files directly into MediaFlow state.

---

## Import & Export

MediaFlow supports its own JSON data format and compatible external-media workflows.

- **MediaFlow JSON:** the most complete format for preserving MediaFlow-specific state.
- **MyAnimeList:** supported MAL XML/import and synchronization workflows.
- **Simkl:** supported compatible import/export workflows.
- **CSV:** compatible Library and History data workflows.

MediaFlow follows an update-before-create approach where appropriate and does not intentionally invent metadata missing from a source.

---

## Cloud Accounts & Synchronization

The cloud edition uses **Supabase Auth** and private per-user application state. Cloud synchronization is designed so Library, History, settings, profile information, progression, and related state can follow the account across supported devices.

Automatic persistence and explicit synchronization/reconciliation workflows can coexist. The cloud architecture is designed to avoid replacing valid account data with a fresh empty browser state during initialization.

---

## Backups & Recovery

MediaFlow can support JSON backups, manual backups, automatic local backups where browser APIs permit them, folder-based browser backup workflows, cloud persistence, import-based recovery, and progression reconciliation.

Available local backup capabilities can vary by browser and platform.

---

## Profiles, Themes & Personalization

MediaFlow can maintain profile information such as a display name and profile picture.

Its appearance system supports a large collection of MediaFlow themes, platform-inspired palette interpretations, and a customizable theme. Themes can control backgrounds, panels, borders, text, accents, and other presentation details.

---

## Responsive Interface

MediaFlow is designed for desktop, tablet, and mobile use.

Desktop uses the larger sidebar/dashboard experience. Mobile uses an icon-first bottom navigation system. When every destination cannot safely fit on a narrow screen, additional pages can remain available through a **More** menu rather than being pushed outside the viewport.

Dense pages such as Statistics and Batch Logging adapt their layout for smaller displays.

---

## Technology

MediaFlow is primarily built with:

- **HTML**
- **CSS**
- **JavaScript**
- **Supabase**
- browser storage APIs
- supported Progressive Web App/browser capabilities

A major project goal is to remain lightweight and highly portable, with the main application largely self-contained.

The web build can be deployed as a static application once its required public cloud configuration is supplied. It can also be packaged through supported desktop or mobile wrapper workflows.

---

## Privacy & Security

Cloud builds should contain only appropriate **public/publishable Supabase client credentials**.

> **Never place a Supabase service-role key, database password, or other server secret inside the MediaFlow HTML.**

Private user data should be protected through Supabase authentication and appropriate database security, including Row Level Security policies.

---

## Running MediaFlow

For a cloud web deployment:

1. Obtain the current MediaFlow HTML build.
2. Configure the required public cloud settings.
3. Host it using an HTTPS-capable static host when cloud authentication is required.
4. Open MediaFlow in a supported modern browser.
5. Sign in and import an existing backup or begin building your Library.

Opening a cloud-enabled build directly through `file://` can prevent some browser and authentication features from working correctly.

---

## Updating MediaFlow

This README is deliberately **version-independent**.

New MediaFlow releases may add features, improve existing systems, redesign parts of the interface, or fix bugs without requiring this document to be rewritten.

For version-specific changes, use the release's **changelog or release notes**.

Before replacing a build, keeping a current backup is recommended. Account data should otherwise remain available through MediaFlow's supported cloud or backup/import systems.

---

## Project Direction

MediaFlow began as a solution to media decision fatigue and backlog imbalance. It has grown into a broader personal media-consumption environment combining:

> **Library + Rotation Scheduler + Logging + History + Statistics + Progression + Cloud Sync**

Future releases can expand these systems without changing MediaFlow's central purpose:

> **Consume everything without having to decide everything.**

---

## Author

Created by **Alex Godly**.

MediaFlow was created to maintain variety and make consistent progress through many forms of media without surrendering the freedom to choose the actual title.

---

## License

No open-source license is currently specified.

If a license is added later, the repository's `LICENSE` file should be treated as the authoritative licensing terms.

---

**MediaFlow — consume everything, without having to decide everything.**
