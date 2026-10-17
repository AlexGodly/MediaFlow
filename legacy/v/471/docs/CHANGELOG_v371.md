# MediaFlow v371 — Logging Visual Polish, Stable Settings & Fast Per unit Panels

**Release:** v371 Modular · Personal Edition  
**Baseline:** MediaFlow v370 Modular · Personal Edition  
**Date:** October 10, 2026  
**Developer:** Alex Godly  
**Status:** Complete local development build. Automated and local-browser regressions passed; physical-device and live authenticated cloud/PWA testing remain outstanding.

---

## 1. Logging Visual Refinement Initiative

### Objective

Build on the functional v369 itemized logging engine and the v370 mobile-first layout with a more coherent, distinctive, professional visual treatment across **Per unit**, **Quick Logging → Amount Consumed**, and **Quick Logging → Last Progress**.

### Prior issues

- Many form sections, title cards and selection controls had nearly identical surface colors and weak separation.
- It was not always obvious whether Per unit or Quick Logging was selected in Dashboard or Settings.
- The logging theme could appear flat despite MediaFlow's dynamic theme customization.
- Status badges in the selected title area did not show the same status icons used throughout Library.

### Solution

Introduced the v371 logging visual layer using existing MediaFlow theme variables, controlled accent mixing, semantic badges, restrained borders, and stronger selected states. The visual layer is scoped to the logging workspace and existing Settings selector rather than globally recoloring MediaFlow.

### Preservation

No rewrite or replacement of canonical logging, XP, Library progress, History, Season View, repeat consumption, draft merges or backups.

---

## 2. Dynamic Theme-Aware Color System

### Implementation

The new styles derive colors from `--flow`, `--panel`, `--panel-raised`, `--border`, `--text`, and established semantic theme tokens. The active theme remains the primary source of color; no separate hardcoded logging palette or additional theme setting is introduced.

### Improved surfaces

- Logging-mode selector: subtle accent tint and stronger border emphasis.
- Per unit title cards: quiet themed border and left-side accent detail.
- Unit cards: more structured grouping and soft accent surface.
- Rewatch/reread units: distinct repeat badge and side marker.
- Unit runtime grouping: low-contrast visual separation.
- Add-another-unit controls: emphasized action workspace.
- Derived totals: accented session-summary cards.
- Quick Logging selected-title cards: subtle colored accents.
- XP-related information: inherited theme-compatible emphasis without rewriting XP logic.

### Design constraints

Visual treatments are intentionally lightweight: CSS colors, borders and minimal transitions instead of blurred overlay stacks or continuous effects. Respects user-selected dynamic themes, with reduced-motion preferences disabling active-control transitions.

---

## 3. Strong Active Selection — Dashboard Logging

### Problem

The v370 Per unit / Quick Logging selector could look almost identical for active and inactive modes, especially in some themes. The Recommended label could be confused with selection.

### Fix

The active mode now has a visible theme-tinted background, stronger accent border, emphasized icon, and increased text weight. Inactive options remain fully legible.

### Interaction behavior

- Per unit is highlighted only when actively selected.
- Quick Logging is highlighted only when actively selected.
- Recommended remains an informational label independent of selection.
- Existing mode switching and unfinished-draft safeguards remain intact.
- `aria-pressed` remains available for accessible active-state communication.

---

## 4. Strong Active Selection — Quick Logging Methods

### Objective

Make the selected submode immediately obvious in Quick Logging.

### Changes

- Amount Consumed and Last Progress inherit the same active/inactive color hierarchy.
- The canonical Amount and Last Progress icons accompany their respective buttons.
- Existing method values, inputs, progress calculation and quantity behavior remain unchanged.
- CSS accommodates narrow phones and larger desktop layouts without forcing horizontal scrolling.

---

## 5. Strong Active Selection — Settings

### Location

**Settings → Library & Titles → Logging Method → Default Logging Interface**.

### Fix

Both Per unit and Quick Logging display explicit `aria-pressed` states, visible theme-dependent active highlighting, and the same mode icons as Dashboard.

The previously chosen value is restored from the existing persisted `v369Logging.defaultInterface` setting. Storage keys `itemized` and `quick` are unchanged, so old settings and presets remain compatible.

---

## 6. Default Logging Interface Setting Disappearing — Bug Fix

### Reported problem

Choosing Per unit or Quick Logging as the default sometimes caused **Default Logging Interface** to disappear from the Settings page.

### Root cause

The v370 preference handler called a full `render()` immediately after a settings write. In parallel, Settings Center's older morph/refresh path regenerated markup directly from the v348 Settings renderer, bypassing the newer v369/v370 logging controls injected through the registered page-renderer chain.

### Fix — In-place selection updates

The v371 mode handler updates `S.settings.v369Logging.defaultInterface`, updates the two existing button classes and `aria-pressed` values in place, and then calls the established `persistSettings()` mechanism. No full Dashboard/Settings rebuild is required merely to change the default mode.

### Fix — Canonical Settings Center refresh

Settings Center's update path now consults the **latest registered Settings renderer**, falling back to v348 only if that renderer is unavailable. This retains logging controls and other later-registered Settings sections when any unrelated Settings operation triggers a complete refresh.

### Additional protection

The current v371 renderer restores the single registered logging setting if absent from upstream markup. The reconstitution uses its original setting ID and registration rather than creating duplicate settings.

### Preserved

Settings search, category navigation, Favorites, stored preferences, cloud persistence pathway, and pre-existing first-paint stability behavior.

---

## 7. Fast Per unit Collapse/Expand — Performance Fix

### Reported problem

Collapsing or expanding a selected title sometimes paused or froze temporarily on mobile and desktop, particularly with many logged units.

### Root cause

The old handler updated `v369Collapsed`, synchronously touched the resumable draft, regenerated **all selected title panels** using HTML replacement, and recalculated the XP preview. Even closing a single panel could trigger unrelated DOM reconstruction and calculation.

### Fix

- Toggle only the targeted title's content visibility and `aria-expanded` value.
- Update the button's chevron and label without replacing the entire logging workspace.
- Preserve the existing content node and unsaved input values when collapsing.
- When a title is *initially* collapsed and has never rendered its contents, lazily create **that title's** inner content on first expansion; other title panels are not regenerated.
- Coalesce draft-state persistence after rapid toggles using a short delayed update rather than performing heavyweight draft work on each click.
- Avoid invoking full form rendering or XP recalculation on the collapse/expand action.
- Preserve title-level `v369Collapsed` state in the current draft.

### Performance verification

A local Chromium interaction test created **160 drafted units** in one title, with the v370 default window of **40 rendered unit editors**. Repeating collapse/expand **100 times** preserved every rendered input element and its unsaved value while recording about **3–6 ms** of synchronous toggle-handler execution, depending on viewport (320, 390, 430, 820, 1280px).

**Important:** This is a synthetic headless-browser handler timing, not a full rendering/paint metric or a guarantee on older physical devices. Real mobile hardware and 30k–50k Library stress testing remain unverified.

### Data preservation

No change to unit number, timestamp, HH:MM:SS runtime, season, repeat marker, saved progress, draft merge structure, or title deletion behavior.

---

## 8. Same Status Icons as Library

### Reported problem

Logging title badges showed status labels without the corresponding icons used in the Library.

### Fix

Per unit title panels now call the **existing canonical Library `v229StatusChoiceIcon()`** rather than maintaining a separate icon map.

Supported status values include:

- Plan to Watch / planned.
- Watching / active.
- On Hold / paused.
- Completed.
- Dropped.

The display label remains the canonical `v274StatusLabel()`, and category/priority data continues to come from the user's Library title record.

### Quick Logging parity

Selected-title cards in Quick Logging now display the same status icon and status label in a dedicated compact badge. The previous plain-text status in the metadata line is omitted to avoid displaying the status twice.

### Theme compatibility

Existing Library icon SVGs are reused; the v371 card styles supply theme-compatible color, spacing, and contrast without changing the underlying status meanings.

---

## 9. Clear All Titles — Keep Titles Icon Correction

### Reported problem

The **Keep titles** cancellation button in the designed Clear All Titles confirmation used a generic directional icon.

### Fix

The button now explicitly displays a **shield-check** icon, conveying that keeping the titles protects the unfinished logging draft.

The shared confirmation implementation still works for Per unit, Quick Logging → Amount Consumed, and Quick Logging → Last Progress.

### Preserved behavior

- Keep titles cancels the pending destructive action.
- Clear titles requires explicit confirmation.
- Only pending logging selections are removed; previously saved Library, History and XP records are unaffected.
- Existing v369 itemized draft deletion tracking is retained.

---

## 10. Responsive Mobile and Desktop Polish

### Improvements

- Better active-mode contrast on phones without consuming more vertical space.
- Theming and status icons scale with existing cover-and-metadata title headers.
- Quick Logging submode buttons wrap naturally on narrower viewports.
- Compact runtime and timestamp controls introduced in v370 remain intact.
- No additional forced horizontal scrolling.
- Focus-visible outlines are clearly distinct from selected-state backgrounds.
- Reduced-motion users do not receive decorative state transitions.

### Tested sizes

**320px, 390px, 430px, 820px, and 1280px**, in local headless Chromium. 360px, 768px, 1024px and 1920px remain design targets and were not all separately included in the automated v371 interaction sweep.

---

## 11. Settings and Data Transfer Compatibility

### Preserved preference contract

`v369Logging.defaultInterface` remains an object containing `itemized` or `quick`. No data migration is introduced for the visual changes or in-place mode selection.

### Existing systems retained

- Cloud Sync v201, Sync Now, and offline drafts.
- Full Backup schema 29 and Automatic Backup.
- Settings Presets schema 1, including v370 cover-size preference.
- Personal Order format 5 and Collections format 2.
- Consumption History, History exports, and XP History.
- Original Quick Logging Amount Consumed / Last Progress functionality.
- Seasons View, unit timestamps, exact duration, and repeat consumption.

**No Supabase SQL migration is required for these changes.** Authenticated live round trips and cross-device draft conflict scenarios were not tested locally.

---

## 12. Build and PWA Release Updates

- Bumped `VERSION`, package metadata, `version.json`, application entrypoint version marker and generated bundle to **v371**.
- Registered `src/js/components/269-v371-logging-polish-stability.js` as the latest runtime extension.
- Made the v370 per-title renderer individually callable for localized panel expansion; its original full renderer remains available for normal updates.
- Regenerated the PWA app shell and versioned cache using the existing build pipeline.
- Preserved existing icon, responsive CSS, offline and update mechanisms.

---

## 13. Completed Local Tests

| Test | Result |
| --- | --- |
| `python scripts/build.py` — complete bundle, Node syntax, PWA | Passed |
| `python scripts/check.py` — release assets and contract checks | Passed |
| `node tests/test-v369-itemized-contract.cjs` | Passed |
| `python tests/test-v369-browser-smoke.py` | Passed |
| `python tests/test-v369-repeat-browser.py` | Passed |
| `python tests/test-v370-logging-browser.py` | Passed |
| `python tests/test-v371-logging-browser.py` | Passed |
| Default logging preference in-place update and save | Passed (local isolated app state) |
| Canonical Settings Center full refresh retains control | Passed (local Chromium) |
| Per unit collapse/expand preserves draft and controls | Passed (160-unit synthetic draft) |
| Initially collapsed panel lazy expansion | Passed |
| Quick Logging selected-title Library status icon | Passed |
| Clear confirmation Keep titles icon and cancel behavior | Passed |
| Responsive horizontal overflow at five tested widths | None observed |

## 14. Verification Boundaries

The following were **not** completed and should not be interpreted as verified:

- Authenticated live Supabase cross-device synchronization, concurrent sessions, and recovery of stale drafts.
- Installed-PWA update/install verification on real Android, iPhone/iPad, and Windows devices.
- Production-account Full Backup restore and historical multi-version import/export regression matrix.
- Physical low-end device frame-time measurements and 30,000–50,000-title end-to-end performance profiling.
- GitHub Pages production deployment. The live site is unchanged by this local build.

---

## Version Evolution

**v367 — Settings Center First-Paint Stability:** Prevented the previous Settings interface from briefly appearing during initialization.

**v368 — Performance & Stability:** Reduced expensive Library indexing, Personal Order normalization, and Collection Queue reconciliation.

**v369 — Advanced Itemized Logging:** Added individual units, timestamp editing, precise HH:MM:SS runtime, season-aware progress, repeat logging and XP integration.

**v370 — Logging UI 2.0 & Mobile Responsiveness:** Redesigned Per unit and Quick Logging layouts; added title covers/metadata, clear-titles confirmation, and independent cover sizing.

**v371 — Logging Visual Polish & Interaction Stability:** Added theme-aware color, obvious active states, canonical Library status icons, a stable Default Logging Interface setting and localized fast collapse/expand.

---

**MediaFlow v371 — Developed by Alex Godly**  
*Logging Visual Polish, Stable Settings & Fast Per unit Panels*

**Deployment recommendation:** Export a Full Backup, stage the complete v371 project, verify installed-PWA upgrades and live Supabase behavior on a test account, then deploy only after testing. No production change was made during this build.
