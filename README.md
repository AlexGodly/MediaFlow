# MediaFlow

**A media consumption rotation system that helps you decide what type of media to consume next — without deciding the actual title for you.**

MediaFlow is a personal media library, consumption tracker, and intelligent rotation scheduler built around a simple idea:

> **The app decides what kind of media I should consume next. I decide what I actually want to watch or read.**

Instead of becoming another watchlist with hundreds or thousands of titles sitting untouched, MediaFlow tries to help you actually make progress through your library while maintaining variety.

It supports anime, seasonal anime, TV series, movies, anime movies, manga, manhwa/manhua, Western comics, other animation, and custom categories.

---

# Why I Made MediaFlow

I consume a lot of different kinds of media.

The problem wasn't finding things to watch or read.

The problem was deciding **what to consume next**.

When your library becomes large, you can easily end up:

* watching the same type of content repeatedly;
* ignoring another category for weeks or months;
* spending more time choosing something than actually consuming it;
* constantly adding titles without finishing existing ones;
* forgetting where you left off;
* abandoning parts of your backlog;
* getting bored because you keep consuming similar content;
* feeling overwhelmed by a massive library.

Traditional watchlist applications are useful for tracking titles, but they generally don't solve this particular problem.

I didn't want an algorithm to tell me:

> Watch *this exact anime* next.

I wanted something that could instead tell me:

> 🎯 **NEXT TASK: SEASONAL ANIME**
> Watch 4 episodes from any seasonal anime.

I can then choose whatever I feel like watching.

For example:

* One Piece — 1 episode
* Detective Conan — 3 episodes

After logging those four episodes, MediaFlow may rotate me to something completely different:

> 🎯 **NEXT TASK: MANGA**
> Read 20 chapters.

The scheduler controls the **rotation**.

I keep control over the **content**.

That became MediaFlow.

---

# What Problem Does It Solve?

MediaFlow sits somewhere between a media tracker, backlog manager, habit system, and rotation scheduler.

Its purpose is to reduce **decision fatigue** while preventing one type of media from dominating everything else.

Instead of asking:

> "What should I watch?"

you only need to answer:

> "What title from this category do I feel like consuming?"

MediaFlow handles the first decision.

You handle the second.

The system also keeps track of categories that have been neglected, recently overused, or are due for attention.

The goal isn't to consume everything as quickly as possible.

The goal is to create a sustainable flow through your entire media library.

---

# Core Philosophy

MediaFlow follows four main principles.

### 1. Choose the category, not the title

MediaFlow's scheduler primarily decides the type of media you should consume.

You retain freedom over the actual title.

### 2. Rotate instead of bingeing one category forever

Recent activity affects future recommendations so that the same category doesn't constantly dominate the rotation.

### 3. Give neglected media another chance

Categories you haven't consumed for a while gradually become more important to the scheduler.

### 4. Track progress without turning entertainment into work

Statistics, XP, levels, streaks, history, and achievements provide progression while the actual choice of what to watch or read remains yours.

---

# Default Media Categories

MediaFlow includes:

| Category           | Default Unit |
| ------------------ | ------------ |
| 🔴 Seasonal Anime  | Episodes     |
| 🟢 Anime Backlog   | Episodes     |
| 📺 TV Series       | Episodes     |
| 🎨 Other Animation | Episodes     |
| 🎥 Movies          | Movies       |
| 🎞️ Anime Movies   | Movies       |
| 📖 Manga           | Chapters     |
| 📚 Manhwa / Manhua | Chapters     |
| 📰 Western Comics  | Issues       |

Categories can be enabled, disabled, edited, weighted, or supplemented with custom categories.

---

# Intelligent Rotation Scheduler

The scheduler is the core of MediaFlow.

It considers multiple signals instead of simply selecting categories randomly.

These include:

* category weight;
* time since the category was last consumed;
* neglect;
* recent consumption;
* repetition;
* consecutive category usage;
* saturation;
* seasonal priority;
* randomness;
* category availability.

Categories can be classified as:

**Healthy** — the category is being consumed at a reasonable rate.

**Due** — it hasn't received attention recently and should begin moving up the rotation.

**Neglected** — it has been ignored long enough that MediaFlow should prioritize it.

**Overused** — you've consumed a lot of it recently and should probably rotate elsewhere.

MediaFlow can also explain why a category has its current status and what action would help balance the rotation.

---

# Task Generation

MediaFlow generates consumption tasks such as:

> **Seasonal Anime**
> Watch 4 episodes.

or:

> **Manga**
> Read 20 chapters.

or:

> **Movies**
> Watch 1 movie.

Tasks contain a category and suggested consumption amount.

You can complete the task using whichever eligible titles you want.

You can also rotate or skip tasks when necessary.

---

# Library Management

MediaFlow contains its own media library.

Titles can store information such as:

* title;
* category;
* status;
* priority;
* progress;
* total episodes/chapters/issues;
* rating;
* source;
* external IDs;
* timestamps and imported metadata where available.

Library statuses support different stages such as planned, active, paused/dropped states, and completed titles.

Progress is displayed as consumed progress against the known total where available.

---

# Bulk Library Management

The latest MediaFlow library supports multi-selection.

You can select multiple titles and perform batch operations including:

* change status;
* change priority;
* move titles to another category;
* delete multiple titles;
* select visible titles;
* clear the current selection.

Entire individual categories can also be emptied without deleting the rest of the library.

This makes managing very large imported libraries significantly easier.

---

# Consumption Logging

After completing a task, MediaFlow records the activity.

Logs can contain information including:

* category;
* amount consumed;
* selected title;
* minutes;
* timestamp;
* completion information.

These sessions feed back into the scheduler.

That means MediaFlow's future rotation changes based on what you've actually been consuming.

---

# History

MediaFlow maintains a history of consumption activity.

Instead of your progress disappearing after a task is completed, previous sessions can be reviewed later.

The history contributes to:

* statistics;
* category health;
* XP;
* streaks;
* consumption trends;
* historical summaries.

---

# Activity Log

MediaFlow v37 also introduces a broader library activity log.

It records important library operations such as:

* titles added;
* titles edited;
* titles deleted;
* status changes;
* category changes;
* priority changes;
* batch operations;
* imports;
* consumption logs;
* undo operations;
* redo operations.

This provides a clearer record of what has happened to the library itself, not only what media was consumed.

---

# Undo & Redo

Major library operations can be undone.

MediaFlow keeps snapshots of important library state before changes and allows supported operations to be reversed.

Redo allows an undone operation to be applied again.

Undo and redo operations are themselves represented in the activity history.

This is particularly useful when working with large libraries or batch editing many titles at once.

---

# Statistics

MediaFlow turns consumption history into useful statistics instead of only storing raw logs.

Statistics include information around:

* total consumption;
* time spent;
* category activity;
* weekly activity;
* historical trends;
* category balance;
* completion activity;
* consumption heatmaps;
* monthly recaps;
* completion timelines;
* "On This Day" history;
* lifetime activity.

The purpose of statistics isn't only to show numbers.

They help explain how your media habits change over time.

---

# XP & Leveling

MediaFlow includes a configurable leveling system.

XP can be earned through media consumption and library progress.

Different units can award different amounts of XP, including:

* episodes;
* chapters;
* issues;
* movies;
* completed titles.

The scheduler's category health can also influence XP through rotation multipliers.

For example, consuming something from a neglected category can be rewarded differently from continuing to consume an already overused category.

The leveling system can therefore reward both **consumption** and **healthy rotation**.

---

# Lifetime Achievements

MediaFlow v37 adds lifetime counters for your overall MediaFlow journey.

These include accumulated values such as:

* completed titles;
* episodes watched;
* chapters read;
* comic issues read;
* movies watched;
* total consumption time.

These values are calculated across the library and consumption history rather than representing only the current session.

---

# Day Streak

MediaFlow tracks consecutive days of activity.

The streak provides a lightweight way to see how consistently you're making progress through your library.

---

# Stopwatch

A built-in stopwatch can track how long you're actively consuming media.

You can:

* start;
* pause;
* reset;
* use the recorded time when logging a session.

This is especially useful for media where runtime isn't predictable, such as manga or comics.

---

# MyAnimeList Import

MediaFlow supports importing a MyAnimeList XML export.

This allows an existing anime or manga collection to populate the MediaFlow library instead of requiring every title to be entered manually.

Imported information can be used to update existing titles as well as create new ones.

---

# Simkl Import

MediaFlow v37 supports importing a **Simkl JSON backup**.

MediaFlow can process Simkl data for:

* anime;
* TV shows;
* movies;
* statuses;
* progress;
* ratings;
* external IDs;
* timestamped watch history when available.

This allows the free periodic Simkl backup file to act as an import source without requiring a live Simkl connection.

---

# Import Philosophy

MediaFlow does not need to replace services such as MyAnimeList or Simkl.

They can remain the services that hold or synchronize your traditional lists.

MediaFlow uses imported data to solve a different problem:

**What part of my media library should receive my attention next?**

---

# Cloud Accounts

MediaFlow supports accounts backed by Supabase.

An account allows MediaFlow state such as the following to be stored in the cloud:

* library;
* consumption history;
* settings;
* progress;
* profile information.

This allows the same MediaFlow workspace to be accessed across devices.

Cloud state also uses a local safety copy while writes are being processed.

---

# Account & Profile

Users can manage account information from inside MediaFlow.

Profile functionality includes support for:

* display name;
* email;
* password;
* profile picture;
* account management;
* account deletion.

---

# Backups

Media libraries can represent hundreds or thousands of hours of tracking, so protecting the data matters.

MediaFlow includes backup functionality for preserving application state.

Backup-related functionality includes:

* manual backups;
* configurable backup behavior;
* backup snapshots;
* restoration;
* local backup persistence where supported.

---

# Appearance

MediaFlow supports multiple visual themes, including:

* Dark;
* Light;
* AMOLED.

The interface uses a responsive card-based layout designed around a media dashboard rather than a traditional spreadsheet-style tracker.

The desktop sidebar can also be resized.

---

# Customization

A major goal of MediaFlow is to avoid forcing everyone into the same consumption habits.

Settings expose controls for areas such as:

* daily consumption target;
* tasks per day;
* intensity;
* category targets;
* category weights;
* category enable/disable state;
* neglect behavior;
* repetition penalties;
* consecutive repetition penalties;
* saturation;
* seasonal bonuses;
* scheduler randomness;
* leveling;
* XP values;
* rotation XP multipliers;
* appearance;
* backups.

Sections can be restored to their defaults without necessarily resetting the entire application.

---

# Why Not Just Use a Random Picker?

Because completely random selection doesn't understand your consumption history.

Imagine you have watched anime for several days while ignoring manga.

A purely random picker might continue selecting anime.

MediaFlow can take the imbalance into account.

At the same time, the scheduler includes controlled randomness so the rotation doesn't become completely predictable.

The result is intended to sit between:

**pure randomness**

and

**rigid scheduling**.

---

# Why Not Recommend Exact Titles?

Because sometimes you already know what you feel like watching.

If an application says:

> Watch *Anime X*.

but you're not in the mood for it, the recommendation becomes another obstacle.

MediaFlow instead says:

> Watch some **Anime Backlog**.

Now you can choose whichever backlog anime fits your mood.

It reduces decision fatigue without removing choice.

---

# Example Workflow

Suppose your library contains:

* 150 anime;
* 40 seasonal anime;
* 80 TV shows;
* 300 manga;
* 50 movies;
* 25 anime movies;
* 60 manhwa;
* 40 comics.

You open MediaFlow.

It generates:

> 🔴 **Seasonal Anime — 4 episodes**

You watch four episodes across whichever seasonal shows you want and log them.

MediaFlow records the activity and updates the scheduler.

Your next task might become:

> 📖 **Manga — 20 chapters**

Later:

> 🎥 **Movies — 1 movie**

Then:

> 🟢 **Anime Backlog — 5 episodes**

Over time, every part of the library gets opportunities to return to the rotation.

---

# Technology

MediaFlow is primarily a browser-based application built with:

* HTML;
* CSS;
* JavaScript;
* Supabase;
* browser storage APIs;
* Progressive Web App support.

The application has intentionally remained lightweight and largely self-contained.

---

# Running MediaFlow

MediaFlow is a browser application.

For the cloud version, Supabase configuration is required for authentication and cloud persistence.

The application can also be deployed as a static web application once the required configuration and supporting files are provided.

---

# Privacy & Data

Cloud builds use Supabase authentication and per-user MediaFlow state.

When self-hosting MediaFlow, you control the Supabase project used by the application.

Never expose a Supabase service-role or other secret server credential in the client application. Browser builds should only contain the appropriate public/publishable client credentials.

---

# Project Evolution

MediaFlow began as a relatively simple media rotation tool.

Over time it evolved into a much larger personal media system with:

* cloud accounts;
* profiles;
* library management;
* progress tracking;
* intelligent scheduling;
* category health;
* statistics;
* themes;
* backups;
* MAL importing;
* Simkl importing;
* XP and leveling;
* achievements;
* bulk editing;
* activity history;
* undo/redo.

The central idea, however, has remained the same:

> **MediaFlow decides what type of media comes next. You decide the title.**

---

# Current Release

**MediaFlow v37**

The current release expands MediaFlow's large-library workflow with Simkl JSON importing, bulk library operations, category clearing, library activity history, undo/redo, and lifetime achievements.

---

# Author

Created by **Alex Godly**.

MediaFlow started as a solution to my own media backlog and decision-fatigue problem and gradually grew into a complete media rotation and consumption management system.

---

# License

No license is specified here yet.

If this repository is intended to be open source, add a `LICENSE` file and update this section with the chosen license.

---

**MediaFlow — consume everything, without having to decide everything.**

