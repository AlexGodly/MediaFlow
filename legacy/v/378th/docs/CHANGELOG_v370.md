# MediaFlow v370 — Logging UI 2.0 & Mobile Responsiveness

**Version:** v370 Modular · Personal Edition  
**Baseline:** v369 Modular (Personal Edition)  
**Developer:** Alex Godly  
**Build:** October 10, 2026  
**Status:** Successfully built and browser-tested development release; production deployment and authenticated cross-device verification remain separate.

## Highlights

### 1. Per unit naming and consistent action icons
- The previous **Per Episode / Chapter / Issue** UI label is now **Per unit** in Dashboard Logging and **Settings → Logging Method**.
- Per unit uses a list/checklist icon; Quick Logging uses a lightning/speed icon. Both use the same icons in Dashboard and Settings.
- The icon mapping also makes Collapse/Expand (chevrons), Mark repeat/Rewatch (repeat arrows), Add/Log unit (plus-circle), Remove unit/title (trash), and Clear all titles (clear-list) immediately recognizable.
- The `itemized` and `quick` stored preference values have **not changed**, preserving cloud and preset compatibility.

### 2. Per unit title panels redesigned
- Each selected title now shows the title's real Library cover URL.
- Absent or failed covers display a missing-cover placeholder containing its assigned **category icon**, consistent with Library semantics.
- Title metadata now includes **status, category with icon, priority, draft unit count, and total duration**, reflecting the canonical Library record.
- Clearer title-level actions and visual hierarchy; independent expandable/collapsible title panels remain supported.
- **Critical correction:** Active title panels are moved outside the collapsible Library picker. Collapsing Library can no longer hide active Per unit entries.

### 3. Compact individual unit editor
- Individual entries are redesigned into clean, bounded cards with logical number, season, recorded timestamp, HH:MM:SS controls, repeat state and remove actions.
- **Hours, Minutes, and Seconds stay side by side on phones.**
- The unit timestamp remains editable to seconds precision; its value, duration, season and replay state are not altered by a UI redraw.
- The add-another-unit action is organized into its own compact area, including an intentional rewatch/reread action.
- Per unit no longer shows duplicated *editable* quantity and minutes controls; the existing inputs remain in the DOM for canonical save compatibility but are visually replaced by derived **Units logged / Consumption time** summaries.
- Existing quick-only controls, XP calculations and backend logic are preserved.

### 4. Mobile-first responsive layout across BOTH interfaces
- Responsive Per unit and Quick Logging UI at 320, 390, 430, 820 and 1280px browser viewport widths.
- Improved mobile action wrapping, metadata badges, title-cover sizing, icon buttons, compact runtime inputs and logging controls.
- Quick Logging preserves its **Last Progress** and **Amount Consumed** methods, with the redesigned mode selector and shared clear-all action.
- Existing recommended-title and Library selection systems remain intact; legacy Quick Logging title cards retain their editing behavior.
- Preserves dynamic-theme variables rather than introducing fixed light or dark assumptions.

### 5. Clear all added titles with designed confirmation
- Shared **Clear all titles** button in Per unit, Quick Logging → Amount Consumed, and Quick Logging → Last Progress.
- The button has a meaningful clear-list icon and disables itself when nothing is selected.
- Opens MediaFlow's existing theme-aware designed confirmation with a destructive warning, title count, cancel and confirm actions.
- **Cancel** makes no changes; **Clear titles** removes only the active draft selections, their unsaved per-unit details, and relevant derived draft totals. It never deletes confirmed Library, History or XP records.
- Per unit applies the same deletion tombstones as v369 cloud draft merging so cleared entries are not unintentionally restored by an older device snapshot.

### 6. Settings — independent Per unit title-cover size
- New **Per unit Logging · Title covers** row alongside the existing cover-size adjusters.
- Reuses the established v181 slider + numeric input, preview, reset, Settings Presets export/import, and existing settings/cloud persistence mechanism.
- Default **100%**, rendered at about 74px on desktop and responsively limited for narrow screens.
- Does **not** change Library, Personal Order, Collections, History or other cover-size preferences.

### 7. Build, PWA and data compatibility
- Upgraded `VERSION`, `package.json`, release metadata, `index.html`, bundle and service-worker app-shell to **v370**.
- Compiled from **267 JS source fragments including 124 runtime modules**; v370 extension is modular at `src/js/components/268-v370-logging-ui.js`.
- PWA shell generated using the existing asset-discovery build process.
- Reuses existing canonical Cloud Sync v201, Full Backup schema 29, Settings Presets schema 1, Personal Order format 5 and Collections format 2. No SQL/schema migration was introduced for visual-only v370 features.
- Original v369 itemized timestamps, repeat/rewatch XP, consumption History, cloud draft recovery and Quick Logging logic are preserved.

## Verified tests

- `python scripts/build.py` — passed (Node.js syntax and PWA resource generation).
- `python scripts/check.py` — passed (repository and release integrity audit).
- `node tests/test-v369-itemized-contract.cjs` — passed (XP/progress, multiple categories, cloud mismatch and Quick Logging parity).
- `python tests/test-v369-browser-smoke.py` — passed (per-unit timestamps, runtimes and category default saving).
- `python tests/test-v369-repeat-browser.py` — passed (mixed repeat XP, normal progress).
- `python tests/test-v370-logging-browser.py` — passed in headless Chromium at **320, 390, 430, 820 and 1280px**: no horizontal document overflow, compact side-by-side runtime fields, title cover fallback, Library metadata, meaningful icons, and both logging interfaces. Tested designed clear modal **cancel and confirm**, Quick Logging **Last Progress and Amount Consumed**, Settings naming, independent size setting, serialization and reset.
- ZIP integrity and release asset-version checks completed during packaging.

## Verification boundaries

- **Live authenticated Supabase cloud round trips, concurrent cross-device edits, and production backup-restoration tests were not run.** The v370 new setting uses established compatible persistence but staging validation is still required.
- **Automatic update of already installed Android, iOS and desktop PWAs was not tested on physical devices.** Service-worker and app-shell correctness were statically verified.
- **30k–50k Library benchmarks were not run on low-end physical hardware.** The existing v368/v369 optimizations remain present.
- A full historical import/export format compatibility matrix has not been executed with the owner's account data. v370 does not change their storage schemas.
- The live `main` branch / GitHub Pages deployment was not modified by this local build. Back up existing account state and test a staged v370 deployment before updating production.
