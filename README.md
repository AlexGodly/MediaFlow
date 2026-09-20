# MediaFlow

**A media consumption rotation system that helps you decide what type of media to consume next — without taking control of the actual title away from you.**

MediaFlow is a personal media library, consumption tracker, intelligent rotation scheduler, statistics dashboard, and progression system created by **Alex Godly**.

Its central idea is simple:

> **MediaFlow decides what type of media comes next. You decide what you actually want to watch or read.**

Instead of becoming another watchlist with thousands of titles sitting untouched, MediaFlow uses your real consumption history to maintain variety, surface neglected categories, reduce overuse, track progress, and gradually move you through your entire media library.

---

# MediaFlow v46 — Progression & Cloud Recovery

v46 is a reliability-focused release built around one principle:

> **Your MediaFlow data should always produce a consistent scheduler, XP total, level, statistics state, and cloud state — including after an import or recovery.**

The underlying scheduler and intended XP earning rules remain intact. v46 strengthens how those systems are recalculated, synchronized, restored, and displayed.

## What v46 adds

### Calculate XP Now

The **Leveling & XP** settings now include **Calculate XP now**.

This is a manual recovery/reconciliation tool that forces MediaFlow to process the current Library and consumption history, refresh progression data, and update XP/level displays.

It is designed for situations such as:

* importing an older backup;
* restoring a large library and history;
* recovering sessions whose historical XP was not stored correctly;
* forcing the Menu and Statistics progression displays to refresh;
* validating progression after data restoration.

The operation uses a dedicated progress popup so large MediaFlow datasets can visibly move through the recovery process rather than appearing frozen.

### Sync Now

Cloud settings now include **Sync now**.

This performs an explicit synchronization pass instead of requiring the user to wait for normal background cloud persistence.

The sync workflow refreshes the current MediaFlow state, reconciles relevant progression data, refreshes scheduler-dependent state, and synchronizes the resulting state with the connected cloud account.

A dedicated progress popup communicates the stages of the operation.

### XP Recovery for Imported History

Older or damaged data can contain legitimate consumption sessions without usable stored XP.

v46 improves progression recovery so those sessions can contribute to progression again where their consumption data is sufficient to calculate XP.

Existing valid stored session XP is preserved rather than arbitrarily replaced.

This is particularly important for large backups where the Library and History survived but progression metadata did not.

### Progression Reconciliation After Import

Importing MediaFlow data now has a clearer progression recovery path:

**Import data → normalize/reconcile progression → calculate level → refresh UI → persist corrected state.**

XP and level are not intended to become disconnected from the restored MediaFlow data.

The Menu/sidebar and Statistics views use the same progression source so they remain consistent.

### More Complete Backups

v46 expands progression-aware backup behavior so future backups preserve the state needed to restore MediaFlow more faithfully.

The goal is not merely to restore titles. A MediaFlow backup should preserve the user's broader MediaFlow journey, including the information needed for progression recovery.

### Cloud-State Safety

v46 strengthens the cloud workflow around synchronization and recovery.

Cloud state should be hydrated and reconciled deliberately rather than allowing an empty/default browser state to become the authoritative state during initialization.

Manual synchronization is also available when the user wants an explicit full sync.

### Scheduler Refresh After Data Changes

The scheduler remains the established MediaFlow balancing scheduler.

v46 does **not** replace its scoring model.

Instead, v46 makes sure scheduler-dependent state is refreshed after major data changes such as imports, recovery operations, and explicit synchronization.

The scheduler continues to account for signals such as category weight, neglect, recent consumption, repetition, consecutive usage, saturation, seasonal priority, controlled randomness, and category availability.

---

# Why I Made MediaFlow

I consume a lot of different kinds of media.

The problem wasn't finding things to watch or read. The problem was deciding **what to consume next**.

When a library becomes large, it is easy to watch the same kind of content repeatedly, ignore other categories for weeks, spend more time choosing than consuming, keep adding titles without progressing through existing ones, and eventually become overwhelmed by the backlog.

Traditional watchlist applications are useful for tracking titles, but that is not the exact problem MediaFlow is designed to solve.

Instead of saying:

> Watch this exact anime next.

MediaFlow can say:

> 🎯 **NEXT TASK: SEASONAL ANIME**  
> Watch 4 episodes from any seasonal anime.

You remain free to decide which eligible titles satisfy that task.

The scheduler controls the **rotation**. You control the **content**.

---

# Supported Media

Default categories include:

| Category | Default Unit |
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

Custom categories can also be created.

---

# Intelligent Rotation Scheduler

The scheduler is the core of MediaFlow.

It uses multiple signals rather than blindly choosing a random category. These include category weight, time since last consumption, neglect, recent consumption, repetition, consecutive usage, saturation, seasonal priority, randomness, and availability.

Category health can be represented as **Healthy**, **Due**, **Neglected**, or **Overused**.

MediaFlow uses multiple consumption windows to compare actual category usage against the balance implied by category weights. Recent repetition and consecutive-category behavior can reduce a category's score, while neglected or under-consumed categories can gain priority.

Controlled randomness prevents the system from becoming completely predictable.

The result is designed to sit between pure randomness and a rigid schedule.

---

# Task Generation

MediaFlow generates category-level consumption tasks such as:

> **Seasonal Anime — 4 episodes**

> **Manga — 20 chapters**

> **Movies — 1 movie**

Suggested quantities can adapt while preserving the category's configured target behavior.

Users can complete a task using whichever eligible titles they want.

**Give me something else** rotates away from the current category for the next selection rather than permanently blacklisting it.

**Skip** abandons the current task.

---

# Optional Exact-Title Recommendations

MediaFlow's default philosophy is category-first recommendation.

An optional setting allows MediaFlow to choose the exact Library title as well.

When enabled, title scoring can consider factors such as priority, status, progress, completion ratio, seasonal relevance, eligibility, and controlled randomness.

When disabled, MediaFlow chooses the category and amount while the user chooses the title.

---

# Library Management

Library titles can store information including:

* title;
* category;
* status;
* priority;
* progress;
* total episodes, chapters, issues, or equivalent units;
* personal rating;
* cover URL and cover source;
* estimated minutes;
* tags;
* source;
* external IDs and imported metadata where available.

Statuses include stages such as **Planned**, **Active**, **Paused**, **Completed**, and **Dropped**.

The Library supports search, filters, pagination, editing, deletion, bulk selection, batch status/priority/category changes, and category clearing.

Deleting a Library entry does not automatically erase historical consumption logs.

---

# Seasonal & Backlog Workflow

Seasonal Anime and Anime Backlog have dedicated behavior.

Backlog logging searches backlog titles.

Seasonal logging can work with Seasonal and Backlog titles, allowing an appropriate backlog title to be promoted into Seasonal when selected.

When a seasonal title reaches its final known episode, MediaFlow can move it back to Anime Backlog while preserving completed progress and status information.

Completed titles are excluded from normal logging suggestions.

---

# Consumption Logging & History

A MediaFlow session can record:

* category;
* amount consumed;
* selected title or titles;
* minutes;
* timestamp;
* completion information;
* notes;
* XP information where applicable.

Consumption history feeds back into the scheduler, Statistics, streaks, category health, XP, and lifetime summaries.

Logging can automatically update Library progress.

Typed titles that do not yet exist can be created as Library entries during the logging workflow.

---

# XP & Leveling

MediaFlow includes a configurable XP and leveling system.

XP is tied to the MediaFlow data rather than being treated as an unrelated decorative counter.

Consumption XP can use:

* time consumed;
* media units consumed;
* the unit type;
* category rotation health.

Default unit bonuses distinguish episodes, chapters, issues, and movies.

Rotation health can modify consumption XP so neglected or due categories can be rewarded differently from already overused categories.

Additional progression can come from supported Library actions such as title additions and title completion.

Level is derived from lifetime XP using MediaFlow's level curve. The Menu/sidebar and Statistics should therefore represent the same underlying progression.

## Imported progression

v46 specifically improves imported progression.

Valid stored XP is preserved. Historical sessions with missing or unusable XP can be reconstructed where the underlying log contains enough consumption information.

The recovery process is designed to be repeatable without simply awarding the same historical event again every time an import or calculation is performed.

The **Calculate XP now** control gives the user an explicit way to force this reconciliation.

---

# Statistics

MediaFlow turns consumption history into a broader view of media activity.

Statistics cover areas such as:

* total consumption;
* total time;
* category activity;
* weekly and monthly activity;
* historical trends;
* category balance;
* completion activity;
* consumption heatmaps;
* monthly recaps;
* completion timelines;
* On This Day history;
* lifetime activity;
* XP and level progression;
* streaks.

v46 emphasizes consistency between the progression shown in Statistics and the progression shown in the main interface.

---

# Lifetime Activity & Achievements

MediaFlow tracks lifetime activity across the Library and History, including values such as completed titles, episodes watched, chapters read, comic issues read, movies watched, and total consumption time.

Lifetime achievements provide another representation of long-term MediaFlow progress.

---

# Imports

MediaFlow supports multiple ways to populate a large Library.

## MyAnimeList

MyAnimeList XML data can be imported, and supported MAL synchronization workflows can update anime/manga data page by page.

## Simkl

Simkl JSON backups can provide supported anime, television, movie, status, progress, rating, external-ID, and timestamped history information where that information exists in the source backup.

## CSV

Supported CSV workflows can be used for Library data, and History can be exported to CSV.

## MediaFlow JSON

MediaFlow's own JSON backup format is the most complete restoration format because it can preserve MediaFlow-specific Library, History, settings, progression-related, and application-state information.

v46 improves the progression recovery path after these backups are imported.

MediaFlow follows an update-before-create philosophy where possible and does not intentionally fabricate source data that was never available.

---

# Cloud Accounts & Synchronization

The cloud build uses **Supabase Auth** for account access and private per-user MediaFlow state.

Cloud-capable state includes the Library, History, settings, profile-related information, progression-related state, and other MediaFlow application data.

Later MediaFlow versions introduced queued/merged cloud persistence and compression-oriented handling for large states.

v46 adds an explicit **Sync now** workflow for manual full synchronization and strengthens recovery behavior around cloud initialization.

The objective is simple:

> A valid cloud MediaFlow state should not be silently replaced by an empty/default browser state during login or hydration.

Normal cloud saving remains automatic. **Sync now** exists when an explicit reconciliation/synchronization pass is wanted.

---

# Backups

Media libraries can represent thousands of titles and many years of consumption history, so backup integrity matters.

MediaFlow supports manual and automatic local backups where the browser APIs allow them.

Backup options include configurable intervals and folder-based backup workflows using supported browser file-system APIs.

v46 makes progression preservation and recovery a more explicit part of the backup/import lifecycle.

---

# Cover Art

MediaFlow v45 rebuilt automatic cover searching into a multi-provider system.

Supported provider paths include Jikan for anime/manga, TVmaze for television, Open Library for supported reading material, and fallback providers where applicable.

Search results can present multiple possible matches so the user can choose the correct title.

Covers are stored as external URLs rather than embedding large Base64 images into the MediaFlow state.

Manual cover URLs remain supported.

---

# Activity History, Undo & Redo

MediaFlow includes broader Library activity tracking for important operations such as additions, edits, deletions, status/category/priority changes, batch operations, imports, consumption logs, undo operations, and redo operations.

Supported Library operations can be undone and redone using saved state snapshots.

---

# Stopwatch

A built-in stopwatch can be started, paused, reset, and used to populate logging minutes.

This is especially useful for media where runtime is not predictable.

---

# Appearance & Customization

MediaFlow supports **Dark**, **Light**, and **AMOLED** themes.

Settings expose controls for areas including daily targets, tasks per day, intensity, category targets and weights, enabled categories, scheduler tuning, seasonal behavior, randomness, leveling, XP values, rotation XP multipliers, appearance, and backups.

The application uses a responsive dashboard-oriented interface and remains largely self-contained.

---

# Technology

MediaFlow is primarily built with:

* HTML;
* CSS;
* JavaScript;
* Supabase;
* browser storage APIs;
* Progressive Web App support.

The project intentionally remains lightweight and can be deployed as a static browser application when its required configuration is provided.

---

# Privacy & Security

Cloud builds use Supabase authentication and per-user MediaFlow state.

Browser builds should contain only the appropriate public/publishable Supabase client credentials.

**Never place a Supabase service-role key or other server secret inside the client HTML.**

When self-hosting MediaFlow, the owner controls the Supabase project used by the application.

---

# Project Evolution

MediaFlow evolved from a category rotation tool into a complete personal media-consumption system.

Major milestones include:

* **v6** — seasonal logging and custom suggestions;
* **v7** — Supabase cloud accounts and cross-device state;
* **v9–v11** — history controls, backup-state improvements, and cloud-era refinements;
* **v14** — expanded Library filters and priority controls;
* **v17–v18** — MAL retry improvements, stopwatch, theme hardening, account deletion, and MAL progress fixes;
* **v20** — cloud save queue, merging, and compression-oriented architecture;
* **v37** — Simkl JSON import, bulk Library operations, category clearing, activity history, undo/redo, and lifetime achievements;
* **v44** — personal ratings, cover metadata, and cover-related progression;
* **v45** — rebuilt multi-provider automatic cover-art system and Final Edition packaging;
* **v46** — XP recovery, progression reconciliation, manual Calculate XP Now, manual Sync Now, import recovery, cloud-state safety, and scheduler/progression refresh hardening.

Despite the expansion, the original philosophy remains:

> **MediaFlow decides what type of media comes next. You decide the title.**

---

# Current Release

## MediaFlow v46 — Progression & Cloud Recovery

v46 focuses on protecting and rebuilding the relationship between the user's actual MediaFlow data and the systems derived from it.

The release improves XP recovery from historical logs, progression reconciliation after imports, Menu/Statistics consistency, progression-aware backups, explicit cloud synchronization, explicit XP recalculation, and scheduler refresh behavior after major state changes.

The scheduler's established balancing model and the intended normal XP earning rules remain part of the same MediaFlow system rather than being replaced by a new algorithm.

---

# Author

Created by **Alex Godly**.

MediaFlow started as a solution to my own media-backlog and decision-fatigue problem and gradually grew into a complete media rotation and consumption management system.

---

# License

No license is specified yet.

If the repository is intended to be open source, add a `LICENSE` file and update this section with the selected license.

---

**MediaFlow — consume everything, without having to decide everything.**
