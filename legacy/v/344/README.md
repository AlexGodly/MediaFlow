# MediaFlow v344 — History Tab & Pagination Reliability

v341 fixes the **Recently Viewed** tab failing to open because v340 referenced private v261 helpers. History tabs now update their content independently, Recently Viewed reuses a cached title-level index, and Library History gains visible 10/25/50/100-row pagination and action/title search. No Supabase migration or data-format change. See [v341 changelog](docs/CHANGELOG_v341.md).

# MediaFlow v340 — Consumption History & Recently Viewed Titles

v340 gives **Newer weeks / Older weeks** meaningful calendar-direction icons in Consumption History. It also turns **Recently Viewed** into a cleaner title-first timeline: individual logged titles appear with their own Library covers and names, the unrelated round action icon is removed, and a dedicated **Edit log** button opens the existing log-entry editor. Historic category-only records stay accessible under Consumption History and Logs without invented titles. No cloud migration is required. See [v340 changelog](docs/CHANGELOG_v340.md).

# MediaFlow v339 — Data, Cloud, XP & PWA Integrity

v339 audited and hardened cloud-state verification, full backups, data and settings transfers, Personal Order, Collection imports, active-time checkpoints and release/PWA metadata. See [v339 changelog](docs/CHANGELOG_v339.md).

# MediaFlow v338 — Normal Library Cover Selection Fix

v338 restores selection checkboxes on title tiles in **Normal Library** when the display is **Covers** or **Covers+Titles** and **Clean Covers is OFF**. It preserves the existing behavior in Dynamic Library and every other display mode, including hidden checkboxes while Clean Covers is ON. Supabase and all other MediaFlow features remain unchanged. See [v338 changelog](docs/CHANGELOG_v338.md).

# MediaFlow v337 — Dual Time & XP Milestones

v337 removes the **Bonus XP earned** panel from Active Time Spent without changing the underlying reward ledger, keeps the next time milestone progress bar, adds a separate **Time XP** milestone bar for XP earned through app time, and expands the remaining activity chart to full width. All v336 date filters and analytics remain available. The v333+ Supabase configuration is unchanged. See [v337 changelog](docs/CHANGELOG_v337.md).

# MediaFlow v336 — Statistics & XP Configuration Polish

v335 fixes Statistics navigation starting scrolled down, places Lifetime Achievements directly beneath Active Time Spent, redesigns the Active Time Spent analytics card, fixes the missing XP reward settings in the active Settings renderer, and gives Runtime Calculator mode and continuation buttons a single meaningful icon. Adds an optional one-time first-episode XP reward. Uses the existing v333 Supabase project and v334 XP ledger with no new database migration. See [v335 changelog](docs/CHANGELOG_v335.md).

# MediaFlow v334 — Dashboard Navigation & Expanded XP Progression

v334 fixes Dashboard scroll restoration, improves Runtime Calculator icons and adds configurable uncapped foreground-time, first-title-start and Collection XP with a new Statistics card. The new rewards use the existing cloud-backed XP ledger and retain the v333 Supabase project. See [v334 changelog](docs/CHANGELOG_v334.md).

# MediaFlow v333 — New Supabase Backend

v333 updates the active cloud client to the new Supabase project and retains the v332 feature baseline. See [v333 changelog](docs/CHANGELOG_v333.md).

# MediaFlow v332 — Dedicated Supabase Edition (v331 baseline)

v332 retains all v331 Personal Edition features and migrates its cloud endpoint to a fresh Supabase project. See [v332 changelog](docs/CHANGELOG_v332.md).

# MediaFlow v331 — Personal Edition (v330 baseline)

v331 adds **per-title logging timestamps** to Dashboard Logging and Batch Log. The moment each title is added to a logging queue, MediaFlow remembers its own date/time; when saved, the titles retain separate times but the batch remains **one logical consumption session**. History shows the individual times. All previous Workspace functions and the v330 Personal Edition architecture remain in place. See [v331 changelog](docs/CHANGELOG_v331.md) for details.

Community development (v302–v329) remains on hold. No new Supabase schema, account migration, or paid infrastructure is needed.

---

# Archived v330 baseline (v301 feature line)

v330 is a **version-only re-release of MediaFlow v301**. The Community features from v302 through v329 are **not included**. No new features, UI redesigns, behavioral changes, database migration, or changes to the original cloud/backup schema. Only release metadata, the runtime version number, and the PWA cache / active bundle reference were updated. Previous v301 assets and historical tests remain in the package.

## Unmodified v301 release history

# MediaFlow v301 — Stable v298 Restoration + Current Rerolls Repair

**Authoritative base: MediaFlow v298 Modular.** No v299 or v300 Logging Intensity, XP multiplier, Settings toggle, or related state features are included.

## Changes
- Restores the stable v298 feature set as v301.
- Repairs Current rerolls popup scrolling blocked by the global v260 modal `overflow:hidden` rule.
- Adds a dedicated native, keyboard-accessible, touch-friendly scroll area inside the popup.
- Redesigns the modal header, spacing, recommendation rows, badges, and Edit buttons using theme variables.
- Fixes enlarged reroll history covers breaking the modal grid; proportionally scales the cover column and constrains sizes at narrow viewports.
- Displays long title names cleanly without overlap, with full title tooltip.
- Maintains Respect slot information, Edit action, current recommendation, and reroll history without altering recommendation logic.
- Updates the service worker, PWA cache, version metadata, and rebuild-safe source module.

## Compatibility
Cloud Sync v201 · Full Backup Schema v29 · Settings Preset Schema v1 · Personal Order Export v5 · Collections Export v2. No data migration required.
