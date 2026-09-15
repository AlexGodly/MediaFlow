Yep. Since **v8 is primarily the cloud/account fix**, the actual MediaFlow feature set is essentially the full system we built up, plus the new cloud account layer.

## 🆕 MediaFlow v8 features

### ☁️ 1. Cloud Accounts

You now have proper user accounts through Supabase:

* **Sign up**
* **Log in**
* **Log out**
* **Forgot password / password reset**
* Persistent login sessions
* Your account is identified by your Supabase user ID
* Your MediaFlow data is stored in the cloud
* Same library/history/settings available when you open MediaFlow elsewhere
* Private per-user data through Row Level Security
* Local browser data can be migrated into the cloud account

The app's authentication and cloud-storage system are built around Supabase Auth and the `mediaflow_states` table. 

---

# 🎯 2. Media Rotation Scheduler

This is the **core of MediaFlow**.

Instead of saying:

> "Watch One Piece episode 17."

MediaFlow says:

> **Anime Backlog → Consume 4–7 episodes**

You decide what exact title you want.

The scheduler determines:

* **What category**
* **How much**
* **Why that category**
* When to rotate to another category

---

# 🧠 3. Intelligent Category Scoring

Categories aren't selected randomly.

The scheduler considers things like:

* Category weight
* How long you've neglected it
* Recent consumption
* Consecutive repeats
* Recent saturation
* Seasonal urgency
* Controlled randomness

So something you've ignored for several days can gradually climb in priority.

At the same time, something you've consumed heavily recently can be pushed down.

---

# 🔀 4. Weighted Rotation

MediaFlow doesn't simply choose:

> Highest score = next task.

It uses **weighted selection**, so there's controlled unpredictability.

That prevents the scheduler from becoming completely predictable.

---

# ⏱️ 5. Dynamic Consumption Amounts

The amount isn't always fixed.

For example:

**Anime Backlog target = 5 episodes**

MediaFlow can give you something around:

> **4–7 episodes**

while respecting the category's normal target.

Smaller targets such as movies generally remain fixed.

---

# 🔄 6. "Give Me Something Else"

If MediaFlow gives you:

> 🔴 Seasonal Anime
> Consume 3–5 episodes

and you don't feel like watching seasonal anime:

**Give me something else**

will generate another category.

Important behavior:

**It only excludes the current category for that pick.**

It doesn't blacklist Seasonal Anime forever.

So it can come back later.

---

# ⏭️ 7. Skip

**Skip** means:

> "I'm not doing this task."

It records the skipped task in history and generates another task.

It doesn't pretend that you consumed anything.

---

# 📚 8. Personal Media Library

You can maintain your own library containing:

* Anime
* TV series
* Movies
* Manga
* Manhwa / Manhua
* Comics
* Custom categories

Each title can have:

* Title
* Category
* Progress
* Total
* Status
* Priority
* Estimated time
* Tags
* Source

---

# 🔎 9. Library Search

Search your entire library instantly.

You can also filter by:

* Category
* Status

And the library has pagination for large collections.

---

# ✏️ 10. Library Editing

You can edit library entries instead of deleting/recreating them.

You can modify things such as:

* Title
* Progress
* Total
* Status
* Priority
* Category
* Other entry information

---

# 🗑️ 11. Safe Delete

Deleting a library title **doesn't erase its historical consumption records**.

So your statistics don't suddenly become inaccurate just because you removed a title from your current library.

---

# ▶️ 12. Consumption Logging

You can log what you actually consumed.

For example:

> Category: Anime Backlog
> Titles: One Piece + Conan
> Amount: 4 episodes
> Actual: 4
> Minutes: 90
> Note: "Good session"

You can also log multiple titles in one category session.

---

# 📈 13. Automatic Progress Updating

If you log:

> One Piece + 3 episodes

MediaFlow can automatically update its library progress.

For example:

**Episode 47 → 50**

When progress reaches the total, the title becomes:

> **Completed**

Completed titles are excluded from future logging suggestions.

---

# 🔴 14. Seasonal Anime System

Seasonal Anime has special behavior.

When logging **Seasonal Anime**, MediaFlow searches:

* Seasonal Anime
* Anime Backlog

So you can promote a backlog anime into your seasonal rotation.

---

# 🔄 15. Seasonal → Backlog Conversion

When a seasonal anime finishes:

**Seasonal Anime → Anime Backlog**

The title keeps its progress and becomes completed.

The system automatically normalizes completed seasonal entries this way. 

---

# 📌 16. Planned / Active / Paused / Completed / Dropped

Titles can have different statuses:

* 🟡 Planned
* 🟢 Active
* ⏸️ Paused
* ✅ Completed
* ❌ Dropped

When you actually start consuming a planned title, it can become **Active**.

---

# 🤖 17. Optional Exact Title Recommendations

This is one of the biggest options.

By default:

> **MediaFlow chooses category + amount.**
> **You choose the title.**

But you can enable:

### "Let MediaFlow choose the exact title"

Then it becomes:

> **Anime Backlog → 5 episodes → One Piece**

The setting is explicitly available in Settings. 

---

# 🎲 18. Title Recommendation Scoring

When exact-title mode is enabled, MediaFlow considers:

* Priority
* Active vs planned
* Remaining content
* Progress
* Completion percentage
* Seasonal relevance
* Randomness/jitter

So it isn't simply:

> Pick random anime.

It scores eligible titles first and then selects from them. 

---

# 📝 19. "Why This Pick?"

Every generated task can show reasons behind the recommendation.

For example:

> **Due after 3 days**

> **Seasonal urgency**

> **Recently neglected**

> **Lower recent saturation**

This makes the scheduler understandable rather than feeling like a black box.

---

# 📊 20. Dashboard

The Dashboard gives you the current state of your consumption.

It includes:

* Today's progress
* Tasks completed
* Daily target
* Time invested
* Streak
* Current recommended task
* Category balance
* Why the category was selected
* Session controls
* Recommended title when exact-title mode is enabled

---

# 🕐 21. Session System

You can start a consumption session and move through tasks.

Flow:

**Start Session**

↓

**MediaFlow gives category + amount**

↓

**Consume**

↓

**Log**

↓

**Next task**

or

**Give me something else**

or

**Skip**

This keeps MediaFlow focused on **rotation**, rather than becoming another watchlist.

---

# 📜 22. History

Every consumption session can be recorded.

History tracks:

* Date
* Time
* Category
* Target amount
* Actual amount
* Unit
* Minutes
* Status
* Notes

You can filter it by:

* Category
* Media type
* Today
* Week
* Month

---

# ↩️ 23. Undo Last Entry

If you accidentally log something:

**Undo Last Entry**

removes that history record and gives the task back to you.

So you don't have to manually reconstruct what happened.

---

# 📈 24. Statistics

MediaFlow calculates things like:

### Today

* Consumption
* Minutes
* Completion

### Week

* Category balance
* Consumption
* Saturation

### Month

* Consumption
* Average daily minutes
* Completion rate

### Lifetime

* Total records
* Most consumed
* Least consumed
* Most neglected
* Longest streak
* Current category streak
* Average daily consumption
* Average task completion

---

# ⚖️ 25. Category Balance

You can see whether you're heavily favoring certain categories.

For example:

> Anime Backlog: HIGH
> Movies: LOW
> Manga: VERY LOW
> TV: MEDIUM

This ties directly back into the scheduler.

---

# 🔥 26. Saturation System

MediaFlow doesn't just ask:

> "What haven't you watched?"

It also asks:

> "What have you watched **too much recently**?"

A category can become:

* VERY LOW
* LOW
* MEDIUM
* HIGH
* VERY HIGH

This helps prevent bingeing one category indefinitely.

---

# 💤 27. Neglect System

If you haven't consumed a category for a while, its priority gradually rises.

This is controlled by:

**Neglect Rate**

So you can decide how aggressively MediaFlow tries to bring neglected categories back into rotation.

---

# ⚙️ 28. Scheduler Tuning

You can control the personality of the scheduler.

Settings include:

* **Neglect Rate**
* **Repetition Penalty**
* **Saturation Weight**
* **Seasonal Bonus**
* **Randomness**
* **Seasonal Fresh Count**

So you can make MediaFlow:

**more balanced**

or

**more chaotic**

or

**more resistant to repetition**

depending on what you want.

---

# 🏃 29. Intensity Modes

Three presets:

### Light

**3 tasks / 90 minutes**

### Normal

**5 tasks / 180 minutes**

### Marathon

**8 tasks / 300 minutes**

These are presets for your overall consumption intensity.

---

# 🗂️ 30. Custom Categories

You're not locked into the default categories.

You can:

* Add categories
* Rename categories
* Change icons
* Change colors
* Change media type
* Change unit
* Change target
* Change minutes per unit
* Change weight
* Enable/disable categories
* Delete custom categories

---

# 📥 31. MyAnimeList Import

You can import MAL XML data.

It handles:

* Anime
* Manga
* Progress
* Status
* Total episodes/chapters
* Current airing status
* Seasonal detection
* Existing entries
* Large imports

The importer also has progress feedback.

---

# 📄 32. CSV Import

You can import media data from CSV files.

Useful if you're moving your library from another system.

---

# 📤 33. JSON Backup / Restore

You can export your entire MediaFlow state.

Backup includes:

* Categories
* Library
* Sessions
* Settings
* Other app state

And you can import the backup later.

---

# 💾 34. Persistent Storage

Your data isn't supposed to disappear when you refresh.

Cloud mode stores the complete MediaFlow state against your account.

The app also has fallback storage behavior for situations where cloud/local storage isn't available. 

---

# 🛡️ 35. Per-Account Data Isolation

This is important now that accounts exist.

Your MediaFlow state is associated with:

**your Supabase user ID**

and the database uses **Row Level Security**.

So:

> Alex's account → Alex's library/history/settings

A different account gets its own state.

---

# 📱 36. Single-HTML Architecture

One of the original goals is preserved:

You don't need to host the actual MediaFlow HTML on a server just to use its core functionality.

The HTML connects directly to:

**Supabase Auth + Supabase Database**

So the architecture is essentially:

```text
MediaFlow.html
      │
      ├── Supabase Auth
      │      └── Account
      │
      └── Supabase Database
             └── MediaFlow State
                  ├── Library
                  ├── History
                  ├── Categories
                  ├── Settings
                  └── Current session
```

The main thing **v8 adds** is making that cloud/account layer actually initialize correctly. The underlying MediaFlow system itself already contains the scheduler, library, logging, seasonal system, imports, history, statistics, and settings described above.
