# MediaFlow v348 — Universal Streak XP, New Action Rewards & XP History

**Release:** MediaFlow v348  
**Base:** MediaFlow v347 Modular  
**Created by:** Alex Godly  
**Release Date:** October 9, 2026  
**Edition:** Personal Edition

---

## 1. Seven New Configurable XP Rewards

MediaFlow v348 expands rewards beyond logging, Library maintenance, title milestones and time spent in the application. New action-based rewards use the existing XP ledger, contribute to the normal Level and XP total, and follow the configured streak multiplier.

### Add Titles to Collections — XP Added

Adding a title to an existing Collection can now grant XP. The reward is applied for each newly inserted title rather than for opening the picker or saving an unchanged Collection.

**Setting:** `collectionAddTitleXP`  
**Default:** **8 XP per newly added title**

### Add Titles to Personal Order — XP Added

Adding new Library titles to Personal Order now awards XP for each new ordered title.

**Setting:** `orderAddTitleXP`  
**Default:** **6 XP per newly added title**

### Add Collections to Personal Order — XP Added

Assigning an existing Collection to a Personal Order category queue now earns XP for each newly created Collection assignment.

**Setting:** `orderAddCollectionXP`  
**Default:** **12 XP per new Collection assignment**

### Reorder Titles in Personal Order — XP Added

A meaningful change to the order of already-added titles can award XP. Display-only changes and identical saves do not qualify.

**Setting:** `orderReorderTitleXP`  
**Default:** **4 XP per order-change action**

### Reorder Collections in Personal Order — XP Added

Changing the position of a Collection assignment in a Personal Order queue now earns XP.

**Setting:** `orderReorderCollectionXP`  
**Default:** **6 XP per queue-position change**

### Reorder Titles in Collections — XP Added

Changing the saved title sequence inside a Collection now earns XP. The existing Collection edit reward can still apply separately when a Collection is meaningfully changed.

**Setting:** `collectionReorderTitleXP`  
**Default:** **4 XP per order-change action**

### Batch Log Submission Bonus — XP Added

Successfully submitting a Batch Log now awards an additional configurable XP bonus on top of the XP already granted by logging the individual titles.

**Setting:** `batchLogXP`  
**Default:** **15 XP per successful Batch Log submission**

Invalid or empty submissions do not earn the Batch Log bonus.

---

## 2. Universal Streak Multiplier

### Apply Streak Multiplier to All XP Sources — Added

Added an application-wide option in **Settings → Progression → Leveling & XP**:

**Apply streak multiplier to all XP sources**

**Setting:** `globalStreakMultiplierEnabled`  
**Default:** **Enabled**

### Existing Consumption & Repeat XP Included

Consumption-session rewards, repeat-unit XP and full rewatch/reread bonuses remain inside the consumption XP calculation and follow its existing streak multiplier. The new global option controls whether that multiplier is applied.

### Active Time XP Included

Foreground-time XP continues using the existing streak multiplier. v348 does not apply a second multiplier on top of it.

### Fixed Award Sources Included

New fixed XP gains can now receive the multiplier, including:

- New Library title rewards.
- Library editing.
- Manual cover artwork.
- First title start.
- First episode.
- Collection creation.
- Collection editing.
- Library completion.
- Rating rewards.
- Collection title additions and reordering.
- Personal Order additions and reordering.
- Batch Log submission bonuses.

Logged-completion XP already has a streak bonus in the existing XP engine and does not receive an additional duplicate multiplication.

### No Double Multiplication

Sources that were already multiplied by streaks remain on their canonical calculation path. The new action rewards multiply their base values **once**.

### Multiplier Can Be Disabled

Disabling the global option sets the multiplier to **×1** for the current calculations and future awards governed by it. Existing persisted action-award amounts are not rewritten.

**Historical nuance:** Older consumption XP and completion streak bonuses in MediaFlow are partly dynamically recalculated from recorded sessions. Disabling the universal setting may change recalculated historical progression for those older session-based sources. v348 preserves fixed event-ledger amounts, but does not retroactively turn every pre-v348 award into an immutable timestamped event.

---

## 3. New Settings Are Visible in the Active Leveling Page

### Correct Settings Renderer Updated

The v348 controls are inserted into MediaFlow's currently registered **v221/v335 Settings page renderer**, not the obsolete legacy `renderSettings()` path.

This specifically avoids the issue from an earlier release where new XP settings existed in source code but were not visible in the actual application.

### New Sections in Leveling & XP

- **Universal Streak Multiplier** — Enable/disable global multiplier.
- **Collections Action XP** — Add titles and reorder titles.
- **Personal Order Action XP** — Add titles, add Collections, reorder titles, reorder Collections.
- **Batch Log Rewards** — Extra XP per successful batch submission.

### Editable Amounts

All seven reward amounts have numeric controls. Their values are stored alongside existing Leveling settings and saved using the established Settings persistence mechanism.

### Existing Settings Preserved

Existing controls for time XP, first-episode XP, first-title-start XP, Collection create/edit XP, Library and repeat rewards remain available.

### Settings Toggle Persistence Corrected

The base `App.updateLeveling()` implementation converts unfamiliar values to numbers. v348 specifically handles `globalStreakMultiplierEnabled` as a real Boolean, preserving `true` and `false` in saved settings.

---

## 4. History — New XP Tab

### XP Tab Added

Added **History → XP** as a dedicated view alongside Consumption History, Recently Viewed, Ratings, Logs and Library History.

### New Progression Journal UI

The XP tab has a purpose-built, theme-aware interface featuring:

- XP History heading and current account XP total.
- Count of visible reward entries.
- Total XP represented by those entries.
- Count of dated entries.
- Individual reward cards.
- Source, title or other available context.
- Base XP, multiplier and awarded XP.
- Streak length when available.
- Exact recorded time when available.

### Source Breakdown

The history includes entries reconstructed from existing consumption sessions, daily Active Time records and supported XP ledgers, plus newly recorded v348 action events.

### New Action Event Metadata

For new v348 action rewards, MediaFlow records information such as:

- Unique award key.
- Reward type and source.
- Base XP and multiplier.
- Final awarded XP.
- Timestamp.
- Quantity and a limited action description when available.
- Related Library or Collection identifier when available.

### Legacy XP Records Preserved

Older XP ledgers did not store a timestamp or multiplier for every reward. Their available totals still appear where reconstructible, but missing details are labeled unavailable rather than invented.

### Search Added

Search by source, title and available description.

### Source Filter Added

Filter XP History by reward type.

### Entries-per-Page Options Added

Pagination supports:

- 10 entries.
- 25 entries.
- 50 entries.
- 100 entries.

The default is **25 entries per page**.

### Previous / Next Page Controls Added

Page controls include the current page, total pages and displayed-entry count.

### XP History CSV Export Added

Download the filtered XP History in CSV format, including source, timestamps, base XP, multiplier, streak and award amount where known.

### XP History JSON Export Added

Export filtered reward entries as structured JSON with the current application version and export timestamp.

---

## 5. XP Event Ledger & Progression Integrity

### Durable Event Ledgers Added

New action rewards are stored in:

- `xpLedger.v348ActionEvents`

Detailed event information is stored in:

- `xpLedger.v348EventMeta`

Additional separately tracked bonuses for existing dynamically calculated Library title additions/completions are stored in:

- `xpLedger.v348LibraryAdditionBonus`
- `xpLedger.v348LibraryCompletionBonus`

### Existing XP Ledger Preserved

Prior XP data, including v334/v335 milestones, ratings, logged completion rewards and active-time records, remains in its existing structures.

### Progression Total Calculation Updated

v348 integrates its new action and Library-bonus amounts into the current XP calculation and lifetime progression total.

### XP Breakdown Double-Count Protection

The XP breakdown and main XP total were checked for consistency so the same v348 action events are not included twice.

### Cloud Merge Support Added

When device and cloud states merge, award identifiers are preserved. Matching counters use the greater recorded value rather than adding the same award twice.

### Import Reward Suppression Added

Personal Order and Collections imports are data-restoration operations, not gameplay actions. Importing existing queue records does not itself award the new action XP.

### Repeated Unchanged Actions Excluded

No new reward is generated merely by opening a picker, saving an unchanged collection, viewing a queue or re-rendering the page.

---

## 6. Cloud Sync & Sync Now

### Existing Supabase Project Preserved

MediaFlow v348 continues using the existing Personal Edition Supabase configuration and its JSON-based application state.

### XP Action Events Included in Cloud State

The new event ledgers and metadata reside inside `xpLedger` and therefore travel with the existing cloud state.

### Universal Multiplier Setting Included

The toggle and seven new reward settings travel with normal application Settings.

### Sync Now Verification Expanded

v348 adds specific readback comparisons for:

- XP action event contents.
- XP History event metadata.
- Universal streak multiplier setting.

### Existing Cloud Protection Preserved

Cloud safety guards against suspiciously empty or missing remote state remain active. This release does not silently bypass those protections.

### No Supabase SQL Migration Required

No new SQL tables, functions, policies or columns are needed.

---

## 7. Full Data Export, Import & Automatic Backups

### Full Backup Includes New XP Ledgers

The existing Full Backup builder includes the expanded `xpLedger` and current Settings, including v348 event history.

### Full Backup Manifest Extended

Added a v348 feature-coverage entry recording the current release, action event count and XP History metadata count.

### Automatic Backup Uses Current Builder

Automatic backups continue using the same complete backup builder and therefore include the new v348 XP state.

### Full Data Import Compatibility Preserved

Existing Full Data Import can restore state carrying the new ledgers without requiring a different database schema.

### Settings Presets Updated

The Settings Preset manifest identifies the new reward configuration and universal multiplier support. Settings Presets include **settings values**, not personal XP event histories.

### Personal Order Import & Export Preserved

The existing **Personal Order format v5** is retained. The queue operations continue to function after importing previous compatible exports.

### Collections Import & Export Preserved

The existing **Collections format v2** is retained, including the conflict protection added in earlier releases.

### History Export Preserved

Existing consumption/session History exports remain supported. XP History adds its own CSV and JSON exporters rather than altering older History files.

---

## 8. Release Metadata, Updates & PWA

### Application Version Updated

`VERSION` and `version.json` now report **348**.

### Package Version Updated

`package.json` now reports **348.0.0**.

### Active Bundle Updated

`assets/js/mediaflow-v348.bundle.js`

### Main Entry Point Updated

`index.html` references the current v348 bundle and the new stylesheets.

### PWA Shell Updated

**`mediaflow-pwa-v348-shell-v1`**

### Service Worker Refreshed

`sw.js` was regenerated with the current application-shell resources.

### Automatic Updates Preserved

Existing update checks, optional automatic installation and managed reload controls remain in place. No claim is made that browsers will expose a native PWA installation prompt in every environment.

---

## 9. New Files & Tests

### Runtime Modules

- `src/js/components/245-v348-universal-streak-action-xp.js`
- `src/js/components/246-v348-xp-history-cloud-transfer-audit.js`

### Stylesheets

- `assets/css/174-v348-universal-streak-action-xp.css`
- `assets/css/175-v348-xp-history.css`

### v348 Tests

- `tests/test-v348-xp-history.py`
- `tests/test-v348-action-awards.py`
- `tests/test-v348-cloud-export.py`

### Local Verification Results

The following were exercised locally against the generated v348 bundle:

- Visible v348 fields in the **actual registered Settings renderer**.
- Boolean universal multiplier preference persistence path.
- New action XP awards for Collections and Personal Order.
- XP event metadata and merge-safe event IDs.
- No extra duplicate amount in progression breakdown.
- XP History tab, searching, pagination markup and JSON download.
- Personal Order / Collection transfer release metadata.
- Full Backup and Settings Preset v348 coverage.
- XP History metadata tamper/mismatch detection during cloud verification.
- Personal Order Lists/Tabs and queue controls from v347/v346.
- Synthetic 30,000-title Library tab-performance regression.
- v337 milestone and Statistics regression.
- JavaScript syntax and PWA asset generation.

**Important test limitation:** A synthetic cloud-readback fixture with no historical consumption sessions still trips MediaFlow's inherited empty-History protection. New XP metadata mismatch detection passed; a real authenticated Supabase upload/readback was **not** tested. This release is ready for local deployment testing, not a guarantee of live cloud synchronization.

---

# v348 Release Summary

**Major changes:**

1. Seven new configurable XP rewards for Collections, Personal Order and Batch Log.
2. Universal streak multiplier toggle for all supported XP sources without duplicate multiplication.
3. Confirmed-visible controls in Settings → Progression → Leveling & XP.
4. Dedicated paginated **History → XP** journal with source, base XP, multiplier and total when available.
5. XP History search, source filter, CSV export and JSON export.
6. Cloud-synced event details, merge protection and import reward suppression.
7. Updated Full Backup / Automatic Backup / Settings Preset metadata and additional Sync Now verification.
8. Regenerated v348 bundle, release metadata, PWA service worker and offline shell.

## Version Progression

**v345** → Lists/Tabs queue views for Collections and Personal Order.

**v346** → Queue-tab icons and pagination/cover-size controls.

**v347** → Returned Collections to its original browser; Lists/Tabs exclusively in Personal Order.

**v348** → **Universal streak XP, seven new action reward sources, visible Leveling settings, XP History, cloud event persistence and transfer/PWA integrity improvements.**

---

**Deployment note:** No SQL migration is required. Deploy the complete v348 project, allow the PWA update to finish, sign in, and use Sync Now to verify the live state. If Sync Now reports a protection warning or mismatch, retain a Full Backup and do not force an overwrite.
