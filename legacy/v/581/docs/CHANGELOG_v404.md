# MediaFlow v404 — The Smart Engine & Refinement Update

**Version:** v404 Modular  
**Baseline:** MediaFlow v403 Modular  
**Release date:** October 13, 2026  
**Developer:** Alex Godly  
**Release category:** Engine rebranding, UI/settings repair, recommendation responsiveness, About knowledge refresh  
**Cloud/database migration:** None  
**GitHub deployment:** Not included

## 1. Summary

v404 officially names the existing comprehensive Fresh Episodes verification architecture **Alex Godly's Smart Fresh Episodes Engine**. The underlying `automatic2` mode and its all-applicable-provider evidence algorithm are preserved. This release also repairs the Dashboard Settings Center's missing fresh-only recommendation switch, removes synchronous page rebuilding from its click handler, checks progress-sensitive recommendation eligibility, and updates **only** the About page's FAQ and Fun Facts.

## 2. Complete Smart Engine naming pass

### 2.1 Existing problem

The v403 interface exposed variations of “Automatic Multi-Provider 2”, “Multi-Provider 2” and “Automatic 2” across the dropdown, diagnostics, scan reports and the single-source AniList section. Changing the dropdown label alone would leave the checker inconsistent.

### 2.2 Implementation

User-facing labels now consistently use **Alex Godly's Smart Fresh Episodes Engine**, including:

| Surface | v404 user-facing text |
| --- | --- |
| Checking method select / status | Alex Godly's Smart Fresh Episodes Engine |
| Request health | Alex Godly's Smart Fresh Episodes Engine — Request Diagnostics |
| Identity report | Alex Godly's Smart Fresh Episodes Engine — Identity & Verification Coverage |
| Saved per-title evidence | Alex Godly's Smart Fresh Episodes Engine — Verification Details (dynamic count) |
| AniList evidence | Alex Godly's Smart Fresh Episodes Engine — Single-Source Verified Airing Schedules (dynamic count) |
| Runtime partial verification | Partial Alex Godly's Smart Fresh Episodes Engine |
| Settings provider explanation | Official engine name and five-source checking description |

Saved legacy provider **display strings**, when rendered in the current checker or status, are normalized without migrating saved data. Historically published changelogs are left historically accurate. CSS supports heading wrapping and responsive controls.

### 2.3 Compatibility

`automatic2` is still the internal mode key. Automatic Multi-Provider (ordered fallback) is a separate unaffected mode. Single-provider and Manual paths are unchanged. No changes to existing `v377` ledger schemas, `v402FreshScan` fields, `v403Proof` evidence, settings imports/exports or cloud storage.

## 3. Dashboard: missing fresh-only switch

### 3.1 Root cause

v401/v402 attempted to insert and then move a switch through `renderSettings()`, a legacy path. The actual Settings Center uses `V219_PAGE_RENDERERS.get('settings')` through a chain of later registered renderers. Consequently the switch did not appear in the current Dashboard → Recommendations section.

### 3.2 Fix

A new v404 wrapper around the **current canonical settings renderer** inserts the existing `v401FilterControl('recommendations')` directly beneath **Prioritize Personal Order** in the **TITLE RECOMMENDATIONS** card. This is the same handler and preference as the Fresh Episodes Checker. There is one settings value, not a second preference. Registration metadata keeps the switch discoverable in Settings Center search. Extra layout styling keeps controls aligned and the toggle accessible on smaller screens. Manual mode disables the switch in both locations.

## 4. Fast preference changes and safe recommendation recalculation

### 4.1 Existing problem

The v401 switch handler immediately recalculated the saved recommended title, then awaited `saveState()`, and finally ran `render()`. For large libraries, full candidate filtering and sorting, cloud-persistence work and full-view reconstruction could block visible ON/OFF feedback.

### 4.2 Implementation

- Apply the saved boolean and update `aria-checked`, `disabled`, CSS state and notes on all present filter switches **synchronously**.
- Debounce/coalesce persistence through the preexisting `persistSettings()` path, with save failures reported rather than silently claiming success.
- Decouple the switch click from provider API requests: a filter preference change does **not** request a new five-provider scan.
- Schedule title/task refresh after the immediate UI update, canceling stale work if the preference changes again.
- For enabled Seasonal Anime filtering, evaluate eligible candidates in bounded groups with a browser-animation-frame yield between groups. Preserve category/status and **Unknown remains eligible** rules, recommendation score evaluation and applicable Personal Order precedence. The existing unfiltered recommendation path remains unchanged.
- Reconcile saved task selection after successful logging or Library-title saves. Invalid/rejected submissions do not intentionally change saved eligibility.

### 4.3 Constraints

The immediate switch response is intentionally independent of the heavier eventual candidate search and cloud state. This is a **responsive click-path improvement**, not a guarantee of zero long frames on every device or every possible dataset. Existing `renderDashboard` and other application-wide workflows can still have expensive operations outside this release's scope.

## 5. Dynamic fresh-only recommendation eligibility

The v402/v403 ledger is unchanged. Current saved Library progress is compared to trusted aired-episode counts whenever eligibility is evaluated. In v404, successful Logging and Library editor saves additionally schedule a task reconciliation for the current recommendation.

| Example | Expected decision |
| --- | --- |
| Watched 8, verified 9 aired | Fresh — eligible |
| Watched 9, verified 9 aired | Caught up — excluded |
| Watched 9, later verified 10 aired | Fresh again — eligible |
| Availability Unknown due to missing or inconclusive data | Eligible |
| Manual Fresh Episodes detection | Fresh-only toggle disabled/off |

**Availability can only change after updated provider information is actually fetched or verified.** v404 does not add real-time external release notifications.

## 6. About page: FAQ modernization — only FAQ and Fun Facts modified

Eleven additional FAQ entries cover engine design, original versus comprehensive provider checking, disagreement/Unknown, explicit single-source AniList evidence, progress-driven eligibility, avoiding automatic rescans, Manual-mode restrictions, unreleased pre-v1 history, personal origins and a possible separate public edition. Two existing Episode Detection answers were updated for correctness. The existing FAQ search and topic UI are preserved.

## 7. About page: Fun Facts expansion

The existing **“A personal project”** fact now tells the authentic origin story under **“Built for One Nerd, Not the World”**, including Alex Godly's exact quote: **“Fuck it, I'll do it myself.”** The iterations fact now recognizes 400+ releases. New separate Fun Facts include:

1. **Where It All Began — The Old System:** The entire original MediaFlow from unreleased pre-v1 iterations, intentionally preserved in its final original state for nostalgia.
2. **An Original Architecture by Alex Godly:** Developer-designed Smart Fresh Episodes Engine coordination and evidence model (using third-party data sources).
3. **Media Service Tracking — A Paused Ambition:** Media-service live tracking plans paused due to financial limitations.
4. **Community Integration — A Paused Ambition:** Community/social plans paused due to financial limitations.
5. **Discord Integration — A Paused Ambition:** Discord/Rich Presence integration plans paused due to financial limitations.
6. **A Library of Tens of Thousands:** The large personal Library helped shape organizational and performance needs.
7. **An Obsession With Customization:** The developer's enthusiasm for organizing inspired the adaptable UI and controls.
8. **One Home for Every Fictional Universe:** Different media types in one personalized Library.
9. **Even the Watchlist Needed a Watchlist:** Personal Order's precisely curated queues.
10. **Your Library, Your Data:** Backups, exports, presets and synchronization for personal data.
11. **Friends Inspired a Future Edition:** Friends' interest helped inspire a possible **separate** public edition; no release date or feature delivery is implied.
12. **Verified, Not Just Available:** Evidence-based episode release decisions rather than treating missing data as zero.

The rest of the About page — hero, biography/developer links, evolution visuals, feature cards, footer and styling — was not intentionally changed. Future social, tracking and Discord services are **not** reintroduced by adding historical Fun Facts.

## 8. Technical changes

- Updated provider name dictionaries: `src/js/components/276-v380-providers-logging-order.js`, `277-v381-multi-provider-reliability.js`.
- Updated active user-facing diagnostic strings: `293-v401-fresh-episodes-recommendations.js`, `295-v402-automatic2-verification.js`, `296-v403-single-source-airing-evidence.js`.
- New `src/js/components/297-v404-smart-engine-and-about.js`: current Settings Center insertion, shared state controls, scheduled save/reconciliation, dynamic logging/editor triggers, legacy displayed-label normalization, FAQ and facts data.
- New `assets/css/216-v404-smart-engine-controls.css`: responsive toggle/card/heading refinements.
- Added new runtime component to `src/js/runtime-order.json` and stylesheet to `index.html`; generated new bundled asset with `scripts/build.py`.
- Updated `VERSION`, `version.json`, `index.html`, PWA cache `sw.js` and generated asset list.
- Updated `README.md` **Evolution only**, and refreshed `README2.md` plus this changelog.

## 9. Verification

| Validation | Result | Limitations |
| --- | --- | --- |
| Build / `node --check` | PASS | Static syntax only |
| Mock canonical Settings + FAQs/Facts | PASS at 320, 390, 820, 1280px | Synthetic document/browser state |
| Shared switch, Manual mode, rapid-click debounce | PASS, one debounced settings persist after three clicks | Persistence mock, no Supabase auth |
| No provider requests on switch | PASS | Mock adapters |
| Episode eligibility 8/9 → 9/9 → 9/10 → Unknown | PASS | Trusted ledger fixture |
| v403 comprehensive source regression | PASS at 320–1920px | Mocked providers |
| v403 data/backup/import compatibility | PASS at 320–1920px | No production cloud readback |
| v403 single-source proof regression | PASS at 320–1920px | Mocked AniList |
| 84-title verification reproduction | PASS: 84 matched, 70 fresh, 14 caught up, 0 unresolved, 420 provider checks | Synthetic fixture, not live API |
| Synthetic 100,000-title preference response | Sub-millisecond click in local headless Chromium; subsequent candidate reconciliation asynchronous | Frame pauses still observed; not proof of zero freezes on all devices |

Actual physical-device performance, Supabase account persistence, provider uptime and deployment behavior require a production/staging smoke test after adoption. No performance percentage is invented without a comparable measured baseline.

## 10. Compatibility

| System | v404 |
| --- | --- |
| Library / History / XP / Logging | Preserved, with recommendation refresh after completed saves |
| Settings Presets | Same key `v401RecommendFreshOnly` and provider value `automatic2` |
| Cloud Sync / Sync Now | Existing fields and schema retained |
| Full Data / Automatic Backups | Existing fields, no schema migration |
| Collections / Personal Order | Existing exports, ordering and behavior retained |
| Automatic Multi-Provider 1 | Preserved |
| AniList one-source airing evidence | Preserved |
| iOS / Android / Windows / PWA | Web/PWA responsive code packaged; no native rebuild or installed-device verification |
| MAL/SIMKL tracking / Community / Discord | **Still paused**; no new integrations |

## 11. Version evolution and package

**v401:** Comprehensive provider mode and fresh-only option → **v402:** identity/availability separation and data parity → **v403:** trust-qualified single-source AniList evidence → **v404:** official engine branding, real Settings Center integration, responsive toggles and About history.

Package: `MediaFlow_v404_Modular.zip` (full modular project, source and build scripts). No GitHub deployment or production Supabase changes performed.
