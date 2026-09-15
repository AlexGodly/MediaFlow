# MediaFlow
Here's the **full MediaFlow feature list** based on everything we've built and discussed so far.

# MediaFlow

A **media rotation and consumption scheduler**, not a traditional watchlist.

The core idea is:

> **MediaFlow decides what TYPE of media you should consume, how MUCH you should consume, and when you should ROTATE. You decide the exact title.**

Optionally, MediaFlow can also decide the **exact title** for you.

---

# 1. Core Media Rotation System

### Media categories

MediaFlow supports different types of media, such as:

* 🔴 Seasonal Anime
* 🟢 Anime Backlog
* 🎬 Movies
* 📺 TV Shows
* 📖 Manga
* 📕 Manhwa
* 📚 Books
* 🎮 Games
* Any custom category

Each category can have its own:

* Target
* Weight
* Unit
* Minutes per unit
* Enabled/disabled state
* Seasonal behavior
* Custom/non-custom status

### Rotation scheduler

The scheduler calculates:

* Which category should come next
* How much should be consumed
* How frequently categories should rotate
* Category weighting
* Consumption progress
* Remaining targets
* Session history

The amount isn't permanently fixed.

For example:

> Seasonal Anime → 3 episodes

Then later:

> Anime Backlog → 1 episode

Then:

> Movie → 2 movies

The scheduler determines the appropriate amount.

---

# 2. Two Recommendation Modes

## Manual Title Mode

Default behavior.

MediaFlow tells you:

> **Watch: Seasonal Anime**
> **Consume: 3 episodes**

You then choose the actual anime yourself.

So MediaFlow **doesn't dictate the title**.

---

## Exact Title Recommendation Mode

Optional setting.

You can turn on:

> **Let MediaFlow choose the exact title**

When enabled, MediaFlow decides:

1. Media category
2. Quantity
3. Exact title

The title is selected from your Library according to the scheduler's calculations and available eligible titles.

So you can essentially choose between:

**OFF**

> MediaFlow: "Watch 3 episodes of Seasonal Anime."
> You: "I'll watch Conan."

**ON**

> MediaFlow: "Watch 3 episodes of Conan."

---

# 3. Session System

Each consumption session gives you a specific assignment.

Example:

> 🎯 **Your Session**
>
> **Category:** Seasonal Anime
> **Amount:** 3 episodes

You can then:

### Complete

Finish the assigned amount.

### Skip

Stop the current session early.

Important distinction:

**Skip ≠ switching category.**

Skip means:

> "I'm done with this session."

### Give me something else

Continue consuming, but switch to another media category.

Example:

> Seasonal Anime
> ↓
> **Give me something else**
> ↓
> Manga

---

# 4. Dynamic Consumption Amounts

MediaFlow doesn't force every category to have a fixed quantity.

For example:

### Anime

Could assign:

* 1 episode
* 2 episodes
* 3 episodes
* 5 episodes

### Movies

Could assign:

* 1 movie
* 2 movies
* 3 movies

### Manga

Could assign:

* 5 chapters
* 10 chapters
* etc.

The system uses the category's configuration and scheduler calculations to determine the amount.

---

# 5. Library

The Library contains your media entries.

Each entry can contain information such as:

* Title
* Category
* Current progress
* Total
* Status
* Priority
* Estimated minutes
* Tags
* Source
* ID

### Statuses

Entries can have statuses such as:

* Planned
* Active
* Completed

---

# 6. Library Search

You can search your library by title.

The search:

* Updates while typing
* Doesn't unnecessarily lose focus
* Preserves your cursor position
* Filters titles dynamically

---

# 7. Library Pagination

Large libraries are paginated.

You get:

* Previous
* Next
* Numbered pages
* Current page indicator
* Total number of titles

Pagination appears both **above and below** the library list.

---

# 8. Library Editing

You can edit existing entries.

You can modify things like:

* Title
* Category
* Progress
* Total
* Status
* Priority
* Estimated time
* Tags

---

# 9. Delete System

Library entries can be deleted.

Delete is available:

* From the Library
* From the Edit Entry modal

Deletion requires confirmation.

The confirmation explicitly tells you which title you're deleting.

Deleting a Library entry does **not** delete your historical session logs.

---

# 10. Logging Consumption

MediaFlow has a **Titles Consumed / logging system**.

You can record what you actually consumed.

For example:

> Seasonal Anime
> Conan
> +3 episodes

The log records the consumption.

---

# 11. Automatic Library Registration

If you log a title that isn't already in your Library, MediaFlow can automatically create a Library entry for it.

The newly created entry can then be configured with:

* Title
* Current progress
* Total
* Status
* Priority
* Estimated minutes
* Tags

It is marked as:

> **Added automatically**

---

# 12. Automatic Progress Updating

When you log consumption, MediaFlow can update the corresponding Library entry's progress.

For example:

Library:

> One Piece
> 450 / 1150

You log:

> +3 episodes

Library becomes:

> One Piece
> 453 / 1150

---

# 13. Seasonal Anime System

This is the special behavior we worked through.

Seasonal Anime has special rules because seasonal shows are temporary/current consumption rather than permanent backlog items.

---

# 14. Seasonal ↔ Backlog Conversion

When a Seasonal Anime is completed:

> **Seasonal Anime**

automatically becomes:

> **Anime Backlog**

And:

> Status → Completed

Progress is preserved.

There is **no special `backlog` tag** involved.

---

# 15. Seasonal Completion

This works through multiple paths.

If you:

* Log the final episode
* Reach the total episode count
* Manually mark the title as Completed
* Edit the title and set it to Completed

MediaFlow makes sure the completed Seasonal Anime ends up as:

> **Anime Backlog + Completed**

---

# 16. Seasonal Logging Search

This is the special search behavior you requested.

When you're logging:

> 🔴 **Seasonal Anime**

the title search searches **both**:

* 🔴 Seasonal Anime
* 🟢 Anime Backlog

So if you search:

> One Piece

you can potentially see:

> 🔴 Seasonal Anime
> One Piece

and

> 🟢 Anime Backlog
> One Piece

---

# 17. Selecting a Seasonal Entry

If you're currently logging **Seasonal Anime** and select an entry that is already Seasonal:

> Seasonal → Seasonal

Nothing changes.

You simply log the consumption.

---

# 18. Selecting a Backlog Entry During Seasonal Logging

If you're currently logging **Seasonal Anime** and select an entry that belongs to:

> Anime Backlog

MediaFlow automatically changes its category:

> Anime Backlog
> ↓
> Seasonal Anime

Then you consume it as a seasonal anime.

Once completed:

> Seasonal Anime
> ↓
> Anime Backlog
> Status: Completed

This gives you a clean lifecycle:

**Backlog → Seasonal → Completed Backlog**

---

# 19. Backlog Logging Stays Normal

If you're logging:

> 🟢 Anime Backlog

then the special Seasonal behavior does **not** happen.

You search for Backlog titles.

Select one.

It remains:

> **Anime Backlog**

No automatic conversion to Seasonal.

---

# 20. Completed Titles

Completed titles aren't offered as available titles for consumption.

This prevents MediaFlow from recommending/logging something that has already been finished.

---

# 21. MAL Import

MediaFlow supports importing your MAL data.

The importer handles:

* Anime
* Manga
* Large libraries
* Progress
* Status
* Other available library information

The MAL importer was specifically designed to avoid freezing the browser with large imports.

---

# 22. CSV Import

CSV importing is supported.

The importer processes large datasets incrementally rather than trying to process everything in one giant operation.

---

# 23. Import Progress UI

Imports display a loading interface.

You can see:

* Progress bar
* Processed items
* Total/estimated items
* Added
* Updated
* Skipped

---

# 24. Import Success / Failure

After an import:

### Success

You get a clear success message.

### Failure

You get a clear failure message instead of the interface silently failing.

This applies to the import operations rather than leaving you wondering whether anything happened.

---

# 25. Export

MediaFlow can export your data.

The export includes the application's stored data/state so you can preserve your MediaFlow library and progress.

---

# 26. Export Loading UI

Exporting also has a loading/progress state.

You get a visible indication that the export is happening.

Afterward:

> ✓ Export successful

or:

> ✕ Export failed

---

# 27. Persistent Data

MediaFlow doesn't intentionally reset your progress every time you refresh the page.

It uses persistent browser storage where available.

The current implementation also has a storage fallback system.

---

# 28. Save Queue

State saves are serialized through a save queue.

This prevents multiple rapid operations from racing against each other and potentially overwriting newer state with older state.

---

# 29. Automatic Data Cleanup

Imported Library data gets sanitized.

This includes handling things like:

* Empty titles
* Duplicate entries
* Invalid/missing IDs
* Missing defaults
* CDATA wrappers

---

# 30. MAL CDATA Cleanup

MAL imports can contain titles like:

> `<![CDATA[Conan]]>`

MediaFlow strips the CDATA wrapper so the Library displays:

> **Conan**

instead.

Empty CDATA titles are also handled rather than becoming ugly blank/invalid entries.

---

# 31. Duplicate Handling

When importing/sanitizing Library data, duplicate titles within the same category can be merged.

Progress and useful metadata are preserved where possible.

---

# 32. Custom Categories

MediaFlow's category system isn't restricted to only the built-in media types.

Categories can be configured/customized.

Each category can define its own consumption unit and timing.

For example:

> Anime = episodes
> Manga = chapters
> Movies = movies
> Books = pages

---

# 33. Minutes-per-Unit

Categories can specify an approximate:

> **Minutes per Unit**

This lets MediaFlow reason about consumption time.

For example:

> Anime
> 24 minutes / episode

This makes the scheduler capable of comparing different media types on a more meaningful consumption-time basis.

---

# 34. Category Weighting

Categories have weights.

A higher weight means MediaFlow can give that category greater importance when calculating the rotation.

This allows the scheduler to balance different types of consumption instead of simply cycling:

> Anime → Manga → Movie → Anime → Manga → Movie

---

# 35. Seasonal Categories

Categories can be marked as:

> **Seasonal**

This lets MediaFlow treat them differently from permanent backlog categories.

Seasonal Anime is the main example.

---

# 36. Enabled / Disabled Categories

Categories can be enabled or disabled.

A disabled category doesn't participate in normal rotation.

This lets you temporarily remove a media type without deleting its data.

---

# 37. Data Safety

The system is designed so that:

* Library data persists
* History is separate from Library deletion
* Imports don't require rebuilding the entire Library
* Large imports use progressive processing
* Saves are queued
* Delete operations require confirmation

---

# 38. Overall Philosophy

MediaFlow is intentionally **not**:

> "Here's the anime you should watch because an algorithm thinks you'll like it."

It's:

> **"Here's the type of media you should consume, here's how much, and here's when to rotate."**

You retain control over the actual titles.

And now you can optionally turn on the other philosophy:

> **"I don't want to choose anything. You choose the exact title too."**

So the app has two fundamentally different modes:

### 🎛️ Manual Mode

**System:**

> What → Seasonal Anime
> How much → 3 episodes

**You:**

> I'll watch Conan.

### 🤖 Exact Title Mode

**System:**

> What → Seasonal Anime
> How much → 3 episodes
> Title → Conan

---

# 39. The Core Flow

The complete intended flow is basically:

```text
MEDIAFLOW
   │
   ├── Calculate rotation
   │
   ├── Choose media type
   │
   ├── Calculate quantity
   │
   ├── Optional: choose exact title
   │
   ▼
SESSION
   │
   ├── Complete
   │
   ├── Skip
   │
   └── Give me something else
   │
   ▼
LOG CONSUMPTION
   │
   ├── Update history
   ├── Update progress
   ├── Update Library
   │
   └── Seasonal completion?
          │
          ├── YES
          │
          ▼
     Anime Backlog
     + Completed
```

And for your special Seasonal workflow:

```text
ANIME BACKLOG
      │
      │ Log while in Seasonal mode
      ▼
SEASONAL ANIME
      │
      │ Consume episodes
      ▼
FINAL EPISODE
      │
      ▼
ANIME BACKLOG
      │
      └── Completed
```

That's essentially the **full feature set and behavior we've established for MediaFlow so far**.
