# MediaFlow by Alex Godly — v373

**Release:** Logging Library Sorting & Personal Ordering  
**Baseline:** MediaFlow v372 modular website  
**Release date:** October 10, 2026  
**Developer:** Alex Godly  
**Platforms:** Responsive Web, Android website application, Windows website application, iPhone/iPad web/PWA  
**Data migration:** Not required; cloud database schema unchanged

---

## 1. Default ordering — oldest additions first

**Previously:** The Dashboard Logging Library chooser defaulted to alphabetical A–Z, and the Batch Log chooser also defaulted to alphabetical sorting.

**Now:** Both choosers default to the chronological order in which titles entered the Library: **the oldest-added titles appear first**. Titles are ordered by their existing `createdAt` metadata, with original Library insertion order as the stable fallback for old records lacking that metadata. Search, categories, status filters, priority filters and pagination all remain available. There is no need to type a search merely to browse the Library in Dashboard Logging.

## 2. Comprehensive logging title sorting

The shared sorting preference applies to **Quick Logging, Per Unit Logging, both Amount Consumed and Last Progress entry methods, and Batch Log**.

| Sort field | Behavior |
|---|---|
| Date added | Oldest → newest by default, reverse for newest first |
| Recently added to logging | Most recently inserted into a logging draft, including Batch Log choices |
| Last updated by logging | Existing consumption History's last touched timestamp |
| Progress | Current Library progress, asc/desc |
| Total episodes / units | Current total, asc/desc |
| Priority | High/medium/low, asc/desc |
| Rating | Retained from v372, asc/desc |
| Alphabetical | Title A–Z or Z–A |
| Last edited | Current Library `modifiedAt` / `updatedAt` metadata |
| Last seen in Title Details | Existing Library `lastSeenAt` timestamp |
| Random | Stable random order until pressing Reshuffle |
| My custom order | User-managed permanent order described below |

For regular fields, **ASC/DESC** is available. For Manual and Random, the irrelevant direction control is hidden. Changing a temporary sort does not overwrite a saved custom order.

## 3. Full manual Library ordering — desktop and mobile

Choose **My custom order** to organize the full Library, independent of search filters or the current page.

- **Drag** the move handle with a mouse, touchscreen or pen; dropping before or after another visible row repositions the title.
- **Arrow buttons** move a title up/down one absolute Library position.
- **Numeric position input** moves a title directly to position 1 through Library size, allowing moves across distant pages.
- **Restore added order** resets the custom sequence without changing titles, Library data, log History, ratings, or XP.
- The chosen manual order persists when switching sorting fields, navigating away, reloading, and syncing to cloud.
- New Library titles are appended to the current custom sequence in date-added order; deleted IDs are ignored when rendering.

The visible numeric position is the **global manual position**, including when filters hide some titles. Search and pagination never delete or rewrite hidden titles' ordering.

## 4. Shared synchronization and data safety

All new settings are stored in `S.settings.v373LoggingBrowser` within MediaFlow's established Settings/backup/synchronization state. A field-wise merge independently respects the most recent sort choice, the most recent manual-order edit, and recently selected logging titles. v373 extends existing cloud verification with this configuration.

**Unchanged:** Supabase tables, account authentication, title IDs, Library record structure, session/History write logic, XP, streaks, logging units, current drafts, import/export mechanisms and collection editing. No destructive data migration or database SQL is required.

## 5. UI/UX: phone, tablet and desktop

The new Library browser uses the established v372 theme variables, responsive sorting field, concise order-description row, numbered result cards, compact action controls and accessible button labels. Manual row tools wrap underneath titles on narrow devices rather than forcing horizontal scrolling. Drag handles use Pointer Events with support for touch, pen and mouse; keyboard users can use arrows and numeric positions.

The existing v372 Logging 3.0 headers, title badges, category filters, status/priority filters, XP previews and entry editors are preserved. No separate native reimplementation is required in the Android/Windows website-shell applications: they display v373 once the website is deployed and refreshed.

## 6. Source changes

| File | Purpose |
|---|---|
| `src/js/components/271-v373-logging-browser-ordering.js` | Shared sorting, full-Library manual order, Recent to Log, drag, arrows, numeric moves, Batch integration, merge/verification |
| `src/js/runtime-order.json` | Registers v373 as the final runtime extension |
| `assets/css/193-v373-logging-browser-ordering.css` | Responsive theme-aware title picker styles |
| `assets/js/mediaflow-v373.bundle.js` | Rebuilt production JavaScript bundle |
| `index.html` | v373 bundle and stylesheet loading |
| `VERSION`, `version.json`, `sw.js` | Synchronized release and PWA cache version |
| `package.json` | v373 package version and test command |
| `tests/test-v373-logging-order.cjs` | Functional, 50,000-title and preservation tests |
| `tests/test-v373-responsive.py` | Static browser width/no-overflow checks |

## 7. Verification (development environment, not a physical-device benchmark)

| Check | Result |
|---|---|
| JavaScript production-bundle `node --check` | PASS |
| v373 sorting, defaults, manually reordered positions, draft recency, filters, cloud merge | PASS |
| v373 Batch Log sorting and manual order | PASS |
| v369 existing Quick/Per Unit itemized logging contract | PASS |
| Synthetic 50,000-title initial order, Node.js | PASS — **143 ms** in one recorded run |
| Synthetic 50,000-title manual reordering, Node.js | PASS — **355 ms** in one recorded run |
| Chromium static responsive layout (320 / 390 / 430 / 820 / 1280 px) | PASS — no document horizontal overflow |
| v373 regenerated PWA shell manifest | PASS — 148 assets validated |
| Live Supabase cross-device synchronization and real Android/iOS/Windows interaction | **Not executed** in this build environment |

Measurements vary by runtime and are not guarantees of device performance. Static responsive tests verify representative v373 controls, not a complete production browser session. The historical `scripts/check.py` cannot complete against the compact working-source snapshot because three legacy historical changelogs were not included in that source export; its failure is unrelated to the v373 generated assets.

## 8. Compatibility and deployment

| Platform | v373 interface |
|---|---|
| Desktop Chrome, Edge and compatible browsers | Responsive desktop picker |
| Android browser / MediaFlow Android website-shell app | Responsive mobile picker |
| iPhone / iPad Safari and PWA | Responsive mobile/tablet picker |
| Windows desktop website-shell app | Responsive desktop picker |

Deploy the **contents** of `MediaFlow_v373_Modular.zip` over the active MediaFlow website root, retaining unrelated existing repository content. In particular upload the new `index.html`, `VERSION`, `version.json`, `sw.js`, v373 CSS/JS, source extension, and `runtime-order.json`. The browser/PWA needs to fetch the new version before changes appear in any installed website-shell app. The Android and Windows app installers themselves do not require rebuilding when website content changes.

**Evolution:** v372 — Premium Logging 3.0 presentation and metadata clarity → **v373 — Advanced Logging Library Sorting & Persistent Personal Title Order.**