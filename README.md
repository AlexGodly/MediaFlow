# MediaFlow

**MediaFlow is a media rotation and consumption scheduler designed to help you manage how much and what type of media you consume.**

## ✨ Features

### 🎯 Smart Media Scheduler

* Dynamic media consumption recommendations
* Chooses **media category**, not a specific title by default
* Dynamic recommended consumption amounts
* Category weighting system
* Neglect detection
* Seasonal priority
* Recent repetition penalties
* Consumption saturation tracking
* Consecutive-category detection
* Controlled randomness for variety
* "Give me something else" recommendations
* Session skipping
* Optional exact-title recommendations

### 📚 Media Library

* Centralized media library
* Anime, TV, movies, manga, manhwa/manhua, comics and custom categories
* Searchable library
* Pagination
* Search by title
* Filter by status
* Filter by priority
* Filter by category
* Combined filters
* Planned / Active / Paused / Completed / Dropped statuses
* Progress tracking
* Total episode/chapter tracking
* Estimated consumption time
* Tags and metadata
* Edit titles directly
* Delete library entries
* Direct priority editing

### ⭐ Priority Management

* Low / Medium / High priorities
* Change priority directly from the library
* No need to open the edit screen
* Instant priority updates

### 📝 Consumption Logging

* Log episodes, chapters, issues, movies and other units
* Record actual amount consumed
* Record minutes spent
* Add notes
* Automatically update library progress
* Automatically activate planned titles when consumed
* Automatically mark completed titles when finished
* Manual minute adjustment
* "Use as amount" calculation based on the actual amount consumed

### ⏱️ Stopwatch

* Built-in Dashboard stopwatch
* Start / Pause / Reset
* HH:MM:SS display
* Use stopwatch time as minutes spent
* Helps track actual watch/read duration

### 🌸 Seasonal Anime

* Dedicated Seasonal Anime category
* Seasonal episode tracking
* Fresh episode tracking
* Seasonal urgency in scheduler
* Search Seasonal + Backlog when logging seasonal anime
* Promote Backlog titles to Seasonal Anime
* Automatically move completed seasonal titles back to Anime Backlog
* Preserve progress when moving between categories

### 🇯🇵 MyAnimeList Integration

* Link a MyAnimeList username
* Import Anime
* Import Manga
* Import Anime + Manga
* One-click MAL synchronization
* Automatic duplicate prevention
* Existing-title updating
* Progress synchronization
* Preserve MediaFlow-specific information
* Batched imports
* Paginated processing
* Progress indicators
* Retry handling for temporary API/server errors
* Designed for large MAL libraries
* Non-blocking/asynchronous processing

### 🔗 Links

* Dedicated Links section
* MyAnimeList account linking
* Saved MAL username
* One-click synchronization

### 📊 Statistics

* Profile statistics dashboard
* Large profile picture and name
* Total titles
* Total sessions
* Total consumption time
* Episodes consumed
* Chapters consumed
* Current streak
* Longest streak
* Average daily consumption
* Average session length
* Most consumed category
* Most active day
* Consumption history
* 7-day statistics
* 30-day statistics
* 90-day statistics
* Category distribution
* Media-type distribution
* Episodes vs chapters
* Library status distribution
* Priority distribution
* Completion progress
* Daily / weekly / monthly activity
* Advanced consumption metrics
* Visual charts

### ☁️ Cloud Storage

* Supabase cloud storage
* Account-based data persistence
* Library synchronization
* Consumption history synchronization
* Settings synchronization
* Category synchronization
* Profile synchronization
* Persistent data across devices
* Row Level Security support

### 💾 Automatic Backups

* Automatic MediaFlow backups
* Choose backup location
* Configurable backup frequency
* Backup every 5 minutes
* Backup every 15 minutes
* Backup every 30 minutes
* Backup every hour
* Backup every 6 hours
* Backup every 24 hours
* One-file backup mode
* Multiple-file backup mode
* Timestamped backup files
* Manual "Backup Now"
* Complete MediaFlow state backups
* File System Access API support where available

### 🎨 Themes

* Dark mode
* Light mode
* AMOLED mode
* Persistent theme selection
* Fully adapted UI for each theme

### 👤 Profile

* Custom profile name
* Profile picture
* Cloud account email
* Password management
* Large profile presentation in Statistics
* Profile settings

### 🗑️ Account Management

* Delete MediaFlow account
* Safe account deletion confirmation
* Cloud data deletion
* Library deletion tools
* Advanced "Empty Library" option

### ⚙️ Advanced Settings

* Scheduler configuration
* Category weights
* Consumption targets
* Minutes per unit
* Seasonal settings
* Recommendation randomness
* Repetition penalties
* Neglect rate
* Saturation settings
* Exact-title recommendation toggle
* Backup configuration
* MAL integration
* Theme selection
* Empty Library
* Profile management

### 🚀 Performance

* Asynchronous MAL imports
* Batched processing
* Pagination
* Incremental processing
* Progress feedback
* Debounced operations
* Queued cloud saves
* Reduced unnecessary DOM updates
* Large-library support
* Retry/backoff handling
* Protection against recursive save/render loops
* Protection against duplicate event listeners
* Designed to avoid browser freezing

### 🧩 Customization

* Custom media categories
* Custom consumption targets
* Custom units
* Custom minutes-per-unit
* Custom category weights
* Flexible library metadata
* Configurable scheduler behavior

### 📦 Data Management

* JSON data export/import
* MAL XML import
* CSV import
* Consumption history export
* Cloud persistence
* Local browser persistence where applicable
* Data validation and sanitization
* Progress preservation

### 🔒 Data Safety

* Supabase Row Level Security
* User-specific cloud data
* No service-role key exposed in the frontend
* Safe destructive actions
* Duplicate prevention
* Progress validation
* Cloud save queueing

### 💻 Single-File Application

* Single HTML application
* HTML + CSS + JavaScript in one file
* No separate frontend server required
* Supabase cloud backend
* Easy to download and run
* Suitable for GitHub distribution

### ❤️ Credits

* **Made by Alex Godly**
* Personal website/profile link included in the application.
