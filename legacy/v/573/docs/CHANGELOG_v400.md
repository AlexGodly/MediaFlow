# MediaFlow v400 — Independent Logging Times, Picker Parity & Repository Documentation

**Version:** 400 Modular  
**Baseline:** MediaFlow v399 Modular  
**Release date:** October 13, 2026  
**Developer:** Alex Godly  
**Primary focus:** Advanced Logging timestamp independence; consistent title picker workspaces; responsive Tools & Filters; professional project documentation.

## 1. Advanced Logging — Per Unit Logged At independence

**Problem:** Per Unit previously copied the title's draft-added timestamp for every unit. The Last Watched and Amount Consumed time field also wrote its chosen timestamp into all units for the selected season, destroying individually edited dates even when the user only switched methods.

**Changes:**

- Pressing **Log Episode / Log Unit** assigns that unit its own `Date.now()` timestamp, independent of the time the title entered the draft.
- Every Per Unit `loggedAt` remains individually editable in the existing date/time editor.
- The canonical `v369Units` records remain the source of truth for Per Unit dates, seasons, durations, repeats, and unit numbers.
- Last Watched and Amount Consumed use a title-level bulk timestamp: the title-added value is the default, with legacy `v394When` supported for existing unfinished drafts.
- Independent bulk editing values are kept in `v400LastWhen` and `v400AmountWhen` on the draft entry. Changing either date no longer mutates Per Unit record timestamps or their individual update markers.
- Switching between Per Unit, Last Watched, and Amount Consumed is a view change, not a History submission and not a timestamp rewrite.
- On an actual submitted **bulk** method, the selected bulk timestamp is materialized through the existing unit History pipeline. If validation prevents submission or an error occurs, the original unit timestamps and update markers are restored.
- Per Unit submissions preserve the per-unit dates without applying any bulk override.
- Changing bulk quantity keeps existing contiguous unit records, including their individual dates, where possible. Any replacement of mixed/nonconsecutive detailed units still requires the existing confirmation.

**Example:** Title added 14:00; Episode 1 logged 14:05; Episode 2 logged 14:12. Per Unit shows 14:05 and 14:12. Both bulk methods start at 14:00; editing their dates and switching back does not overwrite the two episode times.

**Data compatibility:** Existing draft and History formats remain supported; no Supabase schema migration is required. The optional v400 bulk-date fields are confined to existing draft-entry objects.

## 2. Personal Order → Add Titles — Collections picker workspace parity

**Problem:** The Personal Order title picker still used an older structure even though Collections → Add Titles received an organized v399 two-panel desktop layout and collapsible narrow-screen tools.

**Changes:**

- Desktop Personal Order Add Titles now uses the same **left sidebar + independently scrolling right results** structure as Collections Add Titles.
- On phones and tablets, the tools collapse into a single **Tools & Filters** disclosure, leaving more room for results.
- Search, numeric Titles per page, Direct Add / Multi-Select, all five view modes, Text and Cover size controls, and existing filters/sorters live in the original reparented DOM nodes. Inputs and event handlers are not duplicated.
- The five display modes remain List, Compact, Cards, Covers, and Covers+Titles, with their own existing view behavior.
- Selection, Personal Order category assignment, ordering, undo/remove, and persistence continue through the original Personal Order workflows.
- Pagination, search, and selection controls remain present and usable on narrow and desktop viewports.

**Scope:** Presentation and control hierarchy only. This does not make Personal Order save operations write into Collections.

## 3. Collections → Add Titles — responsive sidebar recovery

**Problem:** A Tools & Filters disclosure collapsed at a narrow browser width could remain closed after expanding to desktop, leaving the left sidebar apparently empty and its controls inaccessible.

**Changes:**

- Widening to desktop forces the full Collection tools panel open.
- Narrow layouts retain an independently remembered collapsed/expanded state.
- The same restoration rule applies to Personal Order's matching title picker.
- The viewport change itself does not clear selections, search text, page-size settings, or current display mode.
- Checks include narrow → desktop → narrow transitions while a modal stays open.

## 4. Personal Order → Add Collections — consolidated Tools & Filters

**Changes:**

- Renamed **Filters & Sorting** to **Tools & Filters**.
- On desktop, Collections per page and display mode / size controls are placed inside the existing expandable section.
- On mobile, the five view-mode choices and Direct Add / Multi-Select are also placed inside that section.
- The category assignment selector, Collection search, available results, and canonical add/select operations remain accessible.
- The same original controls and event handlers are moved, not recreated.

## 5. Mobile List mode — Collection cover dimensions

**Problem:** Personal Order's Add Collections List mode could compress a cover into an unusable, extremely narrow strip on phones.

**Changes:**

- Fixed mobile List cover sizing with a stable 64 × 86px presentation and matching minimum width.
- Applied proportional fallback artwork, protected text-column width, and a separate full-width Add action row.
- The fix only targets the Collection List view on narrow screens; other view modes remain independent.

## 6. README.md — public GitHub documentation overhaul

The root README is redesigned as an enduring project introduction instead of a chain of successive technical release notes. It now includes:

- Project identity, at-a-glance overview, and product purpose.
- Reasons to use MediaFlow and its distinctive planning/Library separation.
- Detailed explanations of Library, Dashboard, Logging, Personal Order, Collections, History, progression, themes, PWA, and data tooling.
- Getting started, local frontend preview, typical user workflows, and operating constraints.
- Verified architecture and project structure, screenshot references, privacy/data practices, FAQs, fun facts, licensing, and credits.
- An **Evolution** section organizing historical generations and recent milestones.

**Permanent README maintenance convention:** Beginning with v401, update only the content between `MEDIAFLOW_EVOLUTION_START` and `MEDIAFLOW_EVOLUTION_END` in `README.md`, unless an explicit later instruction authorizes broader changes. Detailed technical changes continue in versioned changelog files and README2.md.

## 7. Technical changes

| File | Purpose |
| --- | --- |
| `src/js/components/267-v369-itemized-logging.js` | Timestamp newly added Per Unit records at the moment they are logged |
| `src/js/components/288-v394-advanced-logging.js` | Isolate bulk date fields from Per Unit units; use method-specific defaults in bulk UI |
| `src/js/components/292-v400-workspaces-and-timestamps.js` | Bulk submission integration, matching title picker workspace, responsive tool-state recovery, Add Collections tool placement |
| `src/js/components/260-v362-collection-picker-mobile-workspace.js` | Avoid older responsive control moves after v400 assumes ownership of the displayed workspace |
| `src/js/components/291-v399-picker-workspaces.js` | Protect v400's single-owner control placement during breakpoint changes |
| `src/js/runtime-order.json` | Register the v400 runtime extension |
| `assets/css/213-v400-picker-and-collection-tools.css` | Responsive workspace, modal control groups, List cover protections |
| `assets/js/mediaflow-v400.bundle.js` | Rebuilt primary modular application runtime |
| `README.md` | New public project homepage and tracked Evolution update markers |
| `README2.md` | Technical release summary |
| `VERSION`, `version.json`, `package.json`, `index.html`, `sw.js` | Updated release and PWA metadata |

## 8. Verification

**Completed offline checks:**

| Test | Results |
| --- | --- |
| Modular source build and Node JavaScript syntax | Passed |
| PWA asset-discovery / version regeneration | Passed |
| Independent unit timestamps and bulk method separation | Passed at 390, 1280px |
| Picker layouts, custom pagination, five title modes, and resize recovery | Passed at 320, 390, 820, 1023, 1280, 1920px |
| Personal Order / Collections add/remove, reversible selections, search focus | Passed at 390, 1280px |
| Advanced Logging title rendering and mode conversions | Passed at 320, 390, 820, 1280, 1920px |
| Dashboard save, Per Unit save, Last Watched custom runtime, title add/edit | Passed at 320, 390, 820, 1280, 1920px |
| Floating Task Progress and Quick Actions regressions | Passed at 375, 430, 820, 1280px |

The Chromium checks use synthetic/offline application fixtures, not a live production account. No physical Android/iOS device test, authenticated production Supabase integration test, exhaustive cloud-conflict test, or 100,000-title load benchmark is claimed.

## 9. Compatibility summary

| Area | v400 status |
| --- | --- |
| Per Unit episode Logged At | Independent timestamp per added unit |
| Last Watched / Amount Consumed | Independent bulk timestamp defaults/editors |
| Switching Advanced Logging methods | Existing unit dates preserved |
| Personal Order → Add Titles | Shared workspace UX with Collections Add Titles |
| Collections → Add Titles | Resize recovery fix |
| Personal Order → Add Collections | Tools & Filters organization; mobile List cover fix |
| List / Compact / Cards / Covers / Covers+Titles | Preserved and responsive |
| Library / Dashboard / History / Personal Order / Collections | Existing data/save architecture preserved |
| Themes, XP, Cloud Sync, backups, exports, PWA | Existing integrations preserved |
| Supabase migration | Not required |

## 10. Version evolution

- **v394:** Introduced the three-method Advanced Logging model.
- **v395–v396:** Improved Dashboard recommendations and repaired unified progress/ordering reliability.
- **v397:** Added floating category task progress and quick actions.
- **v398:** Mobile/tablet UI repairs across Dashboard, Logging, and pickers.
- **v399:** Unified Collections title-picker tools, new Personal Order picker controls, numeric page sizes.
- **v400:** Independent timestamp semantics, Personal Order picker parity, reliable responsive Tools & Filters, and permanent public README structure.

---

**MediaFlow v400 — Detailed history, dependable timestamps, and consistent media workspaces.**
