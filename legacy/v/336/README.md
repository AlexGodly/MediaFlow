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
