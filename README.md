# MediaFlow v13: Complete Feature List

MediaFlow is a **media rotation and consumption scheduler**, not a traditional watchlist and not an algorithm that forces you to watch a specific title.

Its main job is:

> **Decide what type of media you should consume, how much you should consume, and when you should rotate.**

You normally choose the actual title yourself.

---

## 1. 🔄 Core Media Rotation System

* Recommends **media categories**, not necessarily specific titles.
* Determines:

  * **What type** of media to consume
  * **How much** to consume
  * **When** to rotate to another category
* Uses weighted scoring rather than simply cycling through categories.
* Prevents one category from dominating your entire consumption.
* Takes recent consumption into account.
* Takes neglected categories into account.
* Supports seasonal urgency.
* Adds controlled randomness so recommendations don't become predictable.

### Example

MediaFlow might say:

> 🎬 **Anime Backlog**
> Watch **5–7 episodes**

You then decide which anime to watch.

---

# 2. 🎯 Two Recommendation Modes

### Normal mode

MediaFlow tells you:

> **Anime Backlog → 6 episodes**

You choose the title.

### Exact-title mode

Optional setting:

> **Let MediaFlow choose the exact title**

When enabled, MediaFlow can recommend:

> **Anime Backlog → 6 episodes → One Piece**

The title recommendation is still scored rather than simply randomly selected.

---

# 3. 🧠 Category Scheduler

Each category has its own:

* Weight
* Target amount
* Minutes per unit
* Enabled/disabled state
* Media type
* Seasonal status

The scheduler considers:

* Base category weight
* Neglect
* Seasonal urgency
* Fresh seasonal episodes
* Recent repetition
* Consecutive-category streaks
* Recent saturation
* Controlled randomness

---

# 4. 📊 Category Health / Balance

MediaFlow tracks how balanced your consumption is.

Categories can become:

* **VERY LOW**
* **LOW**
* **MEDIUM**
* **HIGH**
* **VERY HIGH**

It also identifies categories as:

* **Healthy**
* **Due**
* **Neglected**
* **Overused**

This prevents something like watching anime for 8 hours while completely ignoring manga, movies, or TV.

---

# 5. ⏱️ Dynamic Consumption Amounts

The amount isn't necessarily fixed.

For example:

**Anime Backlog target: 5 episodes**

MediaFlow can dynamically assign something around:

> 4–7 episodes

depending on the scheduler.

For categories with very small targets, the amount remains fixed where appropriate.

---

# 6. 🔀 "Give Me Something Else"

If MediaFlow recommends:

> Anime Backlog

and you don't want that right now, you can press:

**Give me something else**

MediaFlow excludes that category **for the next recommendation only**.

It does NOT permanently blacklist the category.

It can appear again later.

---

# 7. ⏭️ Skip

**Skip** ends the current session early.

It means:

> "I'm done for this session."

It does not mean:

> "I never want this category again."

---

# 8. 📚 Media Library

Every media item can contain:

* Title
* Category
* Progress
* Total
* Status
* Priority
* Estimated minutes
* Tags
* Source
* ID

Supported statuses include:

* Planned
* Active
* Paused
* Completed
* Dropped

---

# 9. 🔎 Library Search

The library has live searching.

Features include:

* Search by title
* Live filtering
* Focus preservation
* Cursor preservation
* Pagination

---

# 10. ✏️ Library Editing

You can edit library entries.

You can modify things such as:

* Title
* Category
* Progress
* Total
* Status
* Priority
* Other entry information

---

# 11. 🗑️ Delete System

Library entries can be deleted with confirmation.

Deleting a title from the library **does not delete its historical consumption records**.

---

# 12. 📝 Consumption Logging

You can manually log what you consumed.

The logging form supports:

* Title
* Quantity consumed
* Actual amount
* Minutes
* Notes
* Auto-update library progress

---

# 13. ➕ Automatic Library Registration

If you log a title that isn't already in your Library:

> MediaFlow can automatically create the library entry.

You don't have to manually add every title first.

---

# 14. 📈 Automatic Progress Tracking

When consumption is logged:

* Library progress updates automatically.
* Progress is clamped to the title's total.
* Planned titles become **Active** once consumption begins.
* Titles become **Completed** when their progress reaches their total.

---

# 15. 🌸 Seasonal Anime System

Seasonal anime has special handling.

MediaFlow can track:

* Seasonal titles
* Fresh episodes
* Seasonal urgency
* Seasonal category priority

You can manually specify the number of seasonal titles with fresh episodes waiting.

---

# 16. 🔄 Seasonal ↔ Backlog Conversion

This is one of the more specialized systems.

### When logging Anime Backlog

MediaFlow searches:

> **Anime Backlog only**

Selecting an entry keeps it in Anime Backlog.

### When logging Seasonal Anime

MediaFlow searches:

> **Seasonal Anime + Anime Backlog**

If you select a Seasonal title:

> It remains Seasonal.

If you select a Backlog title:

> It gets promoted into Seasonal Anime.

---

# 17. 🌸 Seasonal Completion

When a Seasonal anime finishes:

> Seasonal Anime → Anime Backlog

Its:

* Progress is preserved
* Status becomes Completed
* Category changes to Anime Backlog

The system does **not** add or modify a `backlog` tag just to accomplish this.

---

# 18. 🔍 Smart Seasonal Logging Search

The Seasonal logging interface can search across both:

* Seasonal Anime
* Anime Backlog

while maintaining the correct category behavior depending on what you select.

---

# 19. ✅ Completed Titles

Completed titles are excluded from normal consumption suggestions.

This prevents MediaFlow from repeatedly recommending something you've already finished.

---

# 20. 🎲 Exact-Title Scoring

When exact-title recommendations are enabled, MediaFlow considers factors such as:

* Priority
* Status
* Active/planned state
* Existing progress
* Completion ratio
* Seasonal relevance
* Unfinished content
* Randomness/jitter

So it doesn't simply pick a completely random title.

---

# 21. 🏷️ Priority System

Library titles can have priority levels.

These can influence exact-title recommendations.

---

# 22. 📺 Default Media Categories

MediaFlow comes with:

| Category          | Unit     | Target | Weight |
| ----------------- | -------- | -----: | -----: |
| 🔴 Seasonal Anime | Episodes |      4 |      4 |
| Anime Backlog     | Episodes |      5 |      3 |
| TV Series         | Episodes |      2 |      3 |
| Other Animation   | Episodes |      2 |      2 |
| Movies            | Movies   |      1 |      3 |
| Anime Movies      | Movies   |      1 |      2 |
| Manga             | Chapters |     20 |      4 |
| Manhwa / Manhua   | Chapters |     20 |      3 |
| Western Comics    | Issues   |      3 |      2 |

Each category also has its own estimated minutes per unit.

---

# 23. 🧩 Custom Categories

You can:

* Add categories
* Rename them
* Change targets
* Change weights
* Change minutes per unit
* Enable/disable categories
* Delete categories where allowed
* Mark categories as seasonal
* Define whether they're video or reading

So you can create things like:

> Novels
> Podcasts
> YouTube
> Games
> Light Novels

---

# 24. ⚙️ Intensity Presets

Three presets:

### Light

* 3 tasks
* 90 minutes

### Normal

* 5 tasks
* 180 minutes

### Marathon

* 8 tasks
* 300 minutes

You can also customize your own daily limits.

---

# 25. 📅 Daily Consumption Goals

You can configure:

* Daily minutes
* Tasks per day

MediaFlow uses these to structure your daily rotation.

---

# 26. 🧮 Scheduler Tuning

Advanced scheduler controls include:

* Neglect rate
* Repetition penalty
* Saturation weight
* Seasonal bonus
* Randomness
* Seasonal fresh-episode count

This lets you control how aggressively MediaFlow rotates categories.

---

# 27. 🏠 Dashboard

The Dashboard shows:

* Today's progress
* Tasks completed
* Daily target
* Time invested
* Daily minutes
* Current streak
* Current recommended task
* Category balance
* Why the category was selected
* Session controls
* Exact title recommendation when enabled

---

# 28. 📋 Session System

Each recommendation becomes a consumption session.

A session tracks:

* Category
* Target
* Actual amount
* Unit
* Minutes
* Status
* Note
* Date/time

---

# 29. 📜 History

History lets you review previous consumption.

Filters include:

* Category
* Media type
* Date range

You can also:

* Export history
* Undo the last entry

---

# 30. 📊 Statistics

MediaFlow tracks:

### Today

* Consumption
* Minutes
* Tasks

### Week

* Consumption
* Category balance
* Minutes

### Month

* Consumption
* Minutes
* Category activity

### Lifetime

* Total records
* Total consumption
* Total minutes

And additional statistics such as:

* Most consumed category
* Least consumed category
* Most neglected category
* Current category streak
* Longest streak
* Average daily minutes
* Average completion percentage

---

# 31. 📉 Recent Saturation

MediaFlow specifically monitors how much you've consumed from each category recently.

This helps answer:

> "Have I been consuming too much of this lately?"

and lets the scheduler pull you toward other categories.

---

# 32. 🔥 Streak System

Tracks:

* Current streak
* Category streak
* Longest streak

---

# 33. 📥 MAL Import

MediaFlow supports importing MAL data.

The importer handles:

* Large imports
* Batch processing
* Progress indication
* Success/failure reporting
* Status mapping
* Current-airing seasonal detection
* Title cleanup
* Periodic saves

---

# 34. 📄 CSV Import

CSV importing supports:

* Batch processing
* Progress UI
* Large datasets
* Periodic saves
* Status mapping

---

# 35. 📤 JSON Export

You can export your entire MediaFlow state as JSON.

Useful as a full backup.

---

# 36. 📥 JSON Import

You can restore MediaFlow from a JSON backup.

---

# 37. 📊 History CSV Export

Consumption history can be exported separately as CSV.

---

# 38. 💾 Persistent Storage

MediaFlow has multiple storage layers.

### Cloud account

Your authenticated MediaFlow state is stored in:

**Supabase**

### Local fallback

Browser `localStorage` can be used when appropriate.

### Memory fallback

There is also a fallback layer to prevent immediate crashes if normal storage isn't available.

---

# 39. ☁️ Cloud Accounts

MediaFlow supports:

* Sign up
* Login
* Logout
* Password reset
* Persistent sessions
* Per-user cloud data

Each account gets its own MediaFlow state.

---

# 40. 🔐 Per-User Data Security

The Supabase database uses:

**Row Level Security (RLS)**

Each user can only access their own `mediaflow_states` record.

The frontend uses the **publishable Supabase key**, not the secret/service-role key.

---

# 41. 🔄 Local → Cloud Migration

If local MediaFlow data exists when you log into a cloud account, the app can migrate/use that state rather than simply losing it.

---

# 42. 💾 Save Queue

Cloud writes use a save queue to reduce problems caused by multiple state changes happening very quickly.

This helps prevent:

> Save A → Save B → Save A

race-condition-style overwrites.

---

# 43. ⚠️ Cloud Save Error Handling

If cloud saving fails, MediaFlow can show a persistent error rather than silently pretending the data was saved.

The UI indicates:

> **● Saved to cloud storage**

when cloud mode is active.

---

# 44. 👤 Profile System

Your account now has a dedicated Profile Settings page.

You can change:

### Name

* New account starts with an empty name.
* Email is shown by default.
* Set a name → the name appears.
* Delete the name → email appears again.

So:

**New account**

> `alex@example.com`

After setting name:

> `Alex`

After deleting name:

> `alex@example.com`

---

# 45. 🖼️ Profile Picture

Profile settings support:

* Selecting a profile picture
* Previewing it
* Saving it
* Removing it
* Cloud persistence
* Avatar display in the sidebar

The picture is resized/compressed before being stored so it doesn't unnecessarily consume huge amounts of database space.

---

# 46. 💾 Profile Picture Save Button

The profile picture has its own explicit:

> **Save picture**

button.

The UI can show:

> Saving…

then:

> Saved ✓

rather than silently pretending the image was saved.

---

# 47. ✉️ Change Email

Profile Settings lets you change the account email.

Supabase's authentication flow handles the email-change process and confirmation where required.

---

# 48. 🔑 Change Password

You can change your account password directly from Profile Settings.

---

# 49. 👤 Multiple Ways to Open Profile Settings

You can access Profile Settings by clicking:

* Profile picture
* Your name
* Your email

There is also a dedicated:

> **Profile Settings**

menu item.

---

# 50. 🖥️ Desktop Sidebar

The sidebar is designed separately from the mobile navigation.

On desktop it can be resized.

The intended behavior is:

* Drag the sidebar divider
* Change sidebar width
* Width persists
* Mobile remains responsive

The sidebar also accommodates the user's name/email rather than unnecessarily truncating it.

---

# 51. 🧹 Automatic Data Cleanup

MediaFlow sanitizes library data to deal with:

* Invalid IDs
* Missing defaults
* Duplicate entries
* Invalid progress
* Bad titles
* Malformed values

---

# 52. 🧼 Title Cleanup

Imported titles are cleaned automatically.

This includes handling things like:

* CDATA wrappers
* Extra whitespace
* Import formatting artifacts

---

# 53. 🔁 Duplicate Handling

Imports and library sanitization can detect and handle duplicate entries instead of blindly creating multiple copies.

---

# 54. 🛡️ Reset System

**Reset All** requires confirmation.

It resets:

* Categories
* Library
* Sessions
* Settings
* Current task/session

---

# 55. 📱 Single-HTML Architecture

The core MediaFlow application is designed to work as a **single HTML file**.

You don't need to deploy the frontend to:

* GitHub Pages
* Vercel
* Netlify
* A VPS
* Your own domain

The HTML connects directly to Supabase from the browser.

So the architecture is essentially:

```text
                ┌─────────────────────┐
                │   MediaFlow HTML    │
                │     one file        │
                └──────────┬──────────┘
                           │
                    Supabase Auth
                           │
                           ▼
                ┌─────────────────────┐
                │  Supabase Database  │
                │  mediaflow_states   │
                └─────────────────────┘
                           │
                           ▼
                    Your account data
```

That means you can keep the HTML file and open it wherever you need it, while your **MediaFlow data belongs to your cloud account**, not to that particular computer.

---

# 56. 🧠 Overall Philosophy

The most important distinction is that MediaFlow is **not trying to become Netflix's recommendation algorithm**.

It doesn't primarily say:

> "Watch One Piece episode 1034."

It says:

> **"Anime Backlog. 5–7 episodes."**

Then **you decide what you actually want to consume**.

The scheduler's job is to manage your **overall media rotation**, preventing you from getting stuck consuming only one type of media while keeping neglected and time-sensitive categories in circulation.

### The complete loop

```text
        YOUR LIBRARY
             ↓
      CATEGORY SCORING
             ↓
     ROTATION DECISION
             ↓
       WHAT TYPE?
             ↓
       HOW MUCH?
             ↓
      ┌──────┴──────┐
      │             │
   You choose    MediaFlow
     title       chooses title
      │             │
      └──────┬──────┘
             ↓
       CONSUME MEDIA
             ↓
        LOG SESSION
             ↓
     UPDATE PROGRESS
             ↓
      UPDATE HISTORY
             ↓
   UPDATE BALANCE /
     SATURATION
             ↓
      NEXT ROTATION
```

So **v13's feature set is essentially the complete MediaFlow ecosystem**: cloud accounts + profile system + library + imports + consumption logging + seasonal handling + scheduler + dynamic sessions + history + statistics + backups + customizable categories.
