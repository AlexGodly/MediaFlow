# MediaFlow v402 — Automatic Multi-Provider 2 Accuracy, Cloud Integrity & PWA Reliability

**Release:** v402 Modular  
**Baseline:** MediaFlow v401 Modular  
**Date:** October 13, 2026  
**Developer:** Alex Godly  
**Focus:** Cross-provider identity and released-episode verification; Unknown-safe Seasonal Anime recommendations; data integrity, import/export, cloud readback, and PWA update reliability.  
**Data schema:** Existing Cloud Sync v201, Full Backup schema v29, Settings Preset schema v1, Personal Order export v5 and Collections export v2. No new Supabase tables or migration.

## Automatic Multi-Provider 2 — v402 comprehensive verification corrections

### Identity matching is distinct from episode data

The v377/v401 runner previously incremented the number labeled “matched to MyAnimeList” only when episode-data retrieval succeeded. A valid anime ID could therefore disappear from the matching count whenever one or more providers lacked an episode list. v402 separates **identity identification** from **aired-episode verification**. Stored MAL IDs are checked using the existing MAL/Jikan request infrastructure; saved AniList IDs and Kitsu IDs can provide verified mappings where their APIs expose them. Explicitly conflicting MAL mappings are not silently combined. For titles without a verified MAL mapping, compatible providers can be queried using independently verified native IDs instead of abandoning the title outright.

The current scan separately records `v402MALIdentities` and `v402FreshScan` in Settings. Matching a MAL identity is counted independently from whether the title's episode-release list is available. The diagnostics distinguish total candidates, MAL matches, verified fresh titles, verified no-fresh titles, and unresolved titles. Persisted identity results are cleaned when titles leave the Seasonal Anime candidate pool and cleared when the episode-source configuration changes.

### All providers are checked for each title; highest credible result wins

For every title, v402 checks all applicable sources among **Tenrai, AniZip, AniList, TVmaze and Kitsu** using existing rate-limited/cached adapters. One provider returning zero does **not** terminate the remaining checks. After checking, v402 compares the counts of genuinely aired, unwatched episodes reported for the correctly identified anime/season, selects the **highest verified count** and records the selected provider. It never adds multiple provider counts together. Missing or failing providers cannot defeat a credible positive finding. A verified no-fresh conclusion requires usable independent evidence from at least two providers when no positive result exists; otherwise the result remains Unknown. This prevents one missing episode list from invalidating four other usable results, without pretending that an API failure establishes zero fresh episodes.

Provider provenance includes selected source, per-provider available/fresh counts, missing/unsupported/error classification, source disagreements, and identity evidence. These remain separate from user-managed Library progress, Logging, History and XP. Automatic Multi-Provider 1 and each single-provider mode retain their original algorithms.

### Partial totals and targeted retry

The old behavior could freeze the entire aggregate if even one title was unresolved, while giving little information about the successful portion. v402 now retains the previous *fully certified* total whenever a scan is incomplete, **and separately displays** the current number of MAL matches, verified fresh titles/episodes, caught-up titles and unresolved titles. The latter figures are clearly identified as partial; they are not misrepresented as a newly certified total. Existing per-title and missing-data retry actions work with the v402 runner, so a retry can focus on unresolved titles without automatically rechecking all successfully verified titles. Actual request failures are reported separately from provider metadata omissions. Old trusted no-fresh evidence can remain applicable during a short transient failure within its validity period.

### Fresh-only recommendation eligibility — user-selected rule

The v401 strict policy (Unknown excluded) is **replaced**. With **Only recommend titles with fresh episodes** enabled, a Seasonal Anime title is **eligible when Fresh or Unknown**, including when identity/data verification is pending. It is excluded **only when trustworthy evidence confirms No Fresh**, subject to the existing Library status and category rules. This applies to initial selection, Personal Order prioritization, rerolls, and Dashboard reconciliation. A temporary failed recheck does not automatically discard recent valid no-fresh evidence, but stale data ages out. Other Library categories are unaffected.

### Dashboard settings layout

The very same saved `v401RecommendFreshOnly` switch is placed as the **third row immediately below “Prioritize Personal Order”** inside **Settings → Dashboard → Title Recommendations**, and remains available in Fresh Episodes Checker. Both views remain synchronized; the switch is disabled in Manual mode. The three Dashboard recommendation switches use a shared right-aligned control column on desktop without breaking compact responsive layouts. Settings import also normalizes Manual mode to keep the fresh-only filter off.

### v402 verification scope

The new `scripts/test-v402-auto2-comprehensive.py` runs Chromium fixtures at **320, 390, 820, 1280 and 1920px**, with no network calls to real providers. It exercises separate MAL identity counters, trusted AniList ID mapping, all five provider adapters, highest verified fresh count, four-provider no-fresh evidence with a fifth provider unavailable, a failed title remaining Unknown and recommendation-eligible, targeted retry completion, certified count preservation on partial scans, Automatic 1 fallback, and three-row Dashboard settings placement. The existing v401 single-source/adapter checks and v400 Logging/picker/save regressions are also exercised. **Actual live provider coverage, production Supabase persistence, physical PWA installation, and 100,000-title performance have not been independently verified.**

---

## 1. Overview

v402 corrects Automatic Multi-Provider 2 identity reporting and release-result selection, while systematically auditing the account-state serialization and recovery paths rather than creating a parallel storage system. Canonical Library, consumption History, Library History, Settings, XP ledgers, Personal Order, Collections, Stopwatch and runtime calculator state continue to use the current cloud snapshot and full backup infrastructure. v400 individual-unit `loggedAt` values and v401 episode-provider configuration remain inside their established parent objects.

The audit found and fixed concrete issues in full-backup Stopwatch metadata, version stamping of dedicated Collections exports, validation of malformed modern backup files, deletion-awareness in dedicated Collections import/export and mobile PWA pre-cache upgrade behavior. It adds a read-only parity audit for future releases and strengthens Sync Now's actual cloud readback comparator.

## 2. Cloud Sync & Sync Now verification

### Existing behavior preserved

- Protected startup prevents uploading incomplete defaults before account recovery finishes.
- Sync Now reads the authenticated cloud state, checks safety conditions, merges with local data, rebuilds progression/scheduler information, writes the canonical merged snapshot and verifies a remote readback.
- The v267 verified cloud-write path retains limited repair attempts and detects clearly newer concurrent cloud writes.
- Current collection/XP/Personal Order merge and tombstone rules are retained.

### v402 addition

`src/js/components/294-v402-data-integrity-release-audit.js` wraps the **final** `v155VerifyCloudState` function. Following all existing semantic checks, it verifies every enumerated account field in the expected JSON state against the returned cloud JSON representation. This includes Library, History, Settings, XP, Collections, deleted-Collection markers, Personal Order, Stopwatch, runtime tools, portable preferences, profile, migrations and scheduler state. Missing or mismatched fields remain **verification failures**, not a count-only success.

The comparison uses JSON-canonicalized values, recognizing that `undefined` properties are not stored by JSON. Fields legitimately absent from the expected legacy snapshot are not invented merely to pass verification.

**Important:** This change improves verification **when Sync Now reaches its backend**. Successful mock or offline tests do not prove live authenticated Supabase writes, network recovery or cross-device conflict resolution.

## 3. Full Data Export / Import and Automatic Backup

### Full backup coverage

The final `v148BuildFullBackup()` chain remains the source used by manual full JSON export, the folder-based automatic backup scheduler, and the optional backup-before-update workflow.

**Fixed:** The older v148 builder recreated a four-field Stopwatch record, omitting the newer v257 `modifiedAt` value present in the cloud snapshot. v402 now exports the canonical v257 Stopwatch **and** dashboard tools state. This preserves the modification timestamp required to arbitrate edits across devices.

Additional backup metadata records the presence of canonical unit timestamps, the v401 provider preferences/ledger, Personal Order collection assignments, deletion markers, XP events and all Library History entries. It does not award XP, synthesize episode records or modify Library data during export.

### Import validation

v402 extends `v148ValidateBackup()` to reject backups that contain ill-typed modern optional fields (e.g., an object where `activityLog` must be an array or an array where `xpLedger` must be an object). The legacy required-field check remains, so older valid backups without newer optional fields are still accepted.

An import is **not** a reversible transaction against live Supabase: users should keep the original backup until save/verification completes. Cloud persistence is not marked verified by these local-format tests.

## 4. Settings Preset Import/Export

Settings Presets remain settings-only. They serialize the complete persistent Settings object and category definitions/order, while intentionally excluding Library titles, History, XP, passwords and account credentials.

The parity audit verifies that the preset **preserves every existing setting key/value** from the canonical cloud snapshot. Normalizers are permitted to add valid defaults without treating the additional keys as data loss. Specific tested preferences include:

- `v380EpisodeProvider='automatic2'` from v401.
- `v401RecommendFreshOnly=true` from v401.
- Existing seasonal ledger and related provider metadata in `S.settings`.
- Existing theme, XP configuration, update and backup preferences.

The v402 preset manifest receives current release metadata without changing format schema v1.

## 5. Collections Export/Import — Deletion-safe portability

### Discovered issues

1. A late v383 wrapper overwrote the current Collections export `appVersion` stamp with **383**.
2. The dedicated Collections format v2 exported active Collections and display settings, but omitted their `collectionTombstones`. An old file could therefore revive something a newer device had already deleted.

### Fixes

- Both `appVersion` and `mediaFlowVersion` now correctly report v402 in the dedicated Collections export.
- An additive `collectionTombstones` field is exported, keeping the established Collections v2 format compatible with older files.
- Import merges active collections according to original `updatedAt` timestamps, not import time.
- Imported deletion markers are respected only when their `deletedAt` is genuinely newer than the corresponding collection's saved `updatedAt`.
- A newer edit is never deleted by an older tombstone; an older active copy cannot revive a newer deletion.
- The confirmation text explicitly discloses when the file includes deletion markers.
- Valid deletion-only exports can be processed; older v1/v2 imports without deletion markers are still accepted.
- Titles remain separate Library records; Collection import does not create or duplicate watched History entries.

## 6. Personal Order Export/Import

The existing v5 format retains title ordering, category queues, collection assignments and references through the v287/v288 extension chain. v402 normalizes the **current release stamp** without changing the payload format or import logic.

A read-only audit now compares the exported collection assignments and category queues against the canonical cloud `orderPlan`. Existing IDs and ordering remain in place; no destructive queue migration is performed.

## 7. History, Itemized Logging & XP

### History exports

The existing consumption/Logs CSV exporter includes a complete JSON serialization of each session (`session_json`) and the per-unit `v369_itemized_units_json` column. v402 tests confirm that a saved v400-style unit with its own `loggedAt` timestamp survives this export path. No separate History data store is added.

### XP

XP ledgers, event provenance, active-time records and historical session XP are already included in canonical snapshots/full backups. v402's tests inspect reconstructed XP History and check that read-only export/parity routines do **not** modify saved XP ledgers or call award pathways.

**No changes to the XP formula, streak multipliers, achievement thresholds or retroactive rewards are made in v402.** Full production-scale recalculation and multi-device XP reconciliation have not been independently tested on a live user account.

## 8. PWA, versioning and automatic updates

### Release consistency

- `VERSION`, `version.json`, `package.json` and the HTML entry now identify v402.
- The modular bundle is `assets/js/mediaflow-v402.bundle.js`.
- The generated service worker uses `mediaflow-pwa-v402-shell-v1` and includes the current local app-shell assets.
- Existing automatic update checking, auto-install preferences, backup-before-update and save-queue wait behavior remain preserved.

### Safer service-worker caching

Previously `cacheShellAssets()` initiated every fetch simultaneously, which could overload constrained devices on a large app-shell manifest. v402 uses an **8-request concurrency bound** for caching.

During activation, the service worker now retries missing files and **retains older MediaFlow caches if a critical new asset is unavailable**, instead of immediately deleting the previous offline cache. Same-URL older-cache fallback is available on failed requests; assets with new versioned filenames are not silently substituted with incompatible old filenames.

These changes do not override mobile browser installation eligibility or guarantee a background update on every OS/browser.

## 9. Developer data-integrity audit

New read-only diagnostic: `App.v402AuditDataIntegrity()`.

The audit compares the final cloud snapshot with the final full backup, validates JSON serialization, compares Settings Preset keys, checks Personal Order queue/assignment parity, checks Collections tombstones and export version stamps, and reports availability of cloud, import/export, XP, History and update functions. It does not trigger a cloud write, XP award, import, update install or destructive operation.

**Audit scope:** Local serialization only. Authentication, real Supabase readback and physical-device PWA behavior require separate validation.

## 10. Changes in source

| File | Change |
| --- | --- |
| `src/js/components/294-v402-data-integrity-release-audit.js` | New JSON readback integrity check, backup/preset/Order/Collections release metadata, format validation and read-only portability audit |
| `src/js/components/215-v281-collections-responsive-cloud-library-search.js` | Dedicated Collections importer extended to respect optional exported deletion markers and original source modification timestamps |
| `src/js/runtime-order.json` | Register v402 integrity and Automatic 2 extensions in order |
| `scripts/pwa.py` | Bounded service-worker pre-cache, partial-upgrade cache preservation and fallback |
| `assets/js/mediaflow-v402.bundle.js` | Rebuilt production JS bundle |
| `sw.js` | Regenerated v402 service worker with current app-shell assets |
| `index.html`, `VERSION`, `version.json`, `package.json` | v402 release consistency |
| `scripts/test-v402-data-integrity.py` | Offline Chromium data-parity, export, readback and Collection import contracts |
| `scripts/test-v402-pwa-contract.cjs` | Simulated service-worker lifecycle/cache interruption contracts |
| `scripts/test-v402-regression-*.py` | Previously shipped v400/v401 regressions rerun against v402 bundle |
| `README.md` | **Only Evolution section modified** |
| `README2.md` | Added v402 technical release entry |

## 11. Validation and results

### Build and packaging

- Modular production bundle generated from **293** source fragments with **150** registered runtime extensions.
- Node.js JavaScript syntax check: **passed**.
- Service worker generated with **170** local shell assets, and every listed path checked by the build tool.
- v402 release metadata and assets verified before packaging.

### New v402 data-integrity browser checks

**Widths:** 320, 390, 820, 1280 and 1920px.

Passed:

- Cloud snapshot/full-backup parity for canonical fields.
- JSON full-backup serialization and settings-preset key preservation.
- v400 itemized-unit timestamp included in backup and History CSV.
- v401 `automatic2` mode and fresh-only preference included in backups and presets.
- Personal Order assignments and queues present in dedicated export.
- Collections tombstones included, and current v402 release stamp correct.
- Cloud readback comparator accepts identical serialized state and detects changed or missing fields.
- Invalid modern backup formats rejected; compatible legacy backup accepted.
- Older imported Collections cannot overwrite newer local copies or revive deleted entries.
- XP ledger/History reconstruction preserved through audit/export without duplicate awards.

### Service-worker lifecycle simulations

Node.js simulated CacheStorage passed two scenarios:

1. All 171 shell requests succeed: new v402 cache is complete and the old cache is removed.
2. Repeated failure to fetch critical `index.html`: the old cache is preserved and remains available.

Observed cache request concurrency peak: **8**, matching the configured limit.

### Previously shipped regression suites

- v402 Automatic 2 ID matching, five-source maximum, Unknown-eligible recommendations, scan/retry ledger and Dashboard settings: passed at 320, 390, 820, 1280 and 1920px (mocked provider data).
- v402 aggregate partial/retry handling and Automatic 1 fallback preservation: passed at 320, 390, 820, 1280 and 1920px.
- v400 independent timestamp behavior: passed at 390 and 1280px.
- v400 picker controls, five views and responsive breakpoints: passed at 320, 390, 820, 1023, 1280 and 1920px.
- v400 instant-add/selection workflows: passed at 390 and 1280px.
- v400 Dashboard save, History and title-add/edit regression: passed at 320, 390, 820, 1280 and 1920px.

## 12. Known limits

- Live authenticated Supabase readback and multi-device synchronization were **not** performed in this release environment. The new verifier is tested against controlled JSON readback cases only.
- Physical Android/iOS installation, browser background update behavior and production CDN rollouts were **not** verified. Local Chromium navigation to the test server was blocked by the execution environment, so PWA lifecycle behavior was tested with a simulated worker environment instead.
- Backups are not equivalent to independent off-site disaster recovery. Users should maintain copies outside the connected database.
- Comprehensive high-volume (100,000-title) Library/History import-export and offline-online conflict stress tests were not run; no unmeasured throughput improvements are claimed.
- Existing runtime and export data models support many features beyond this targeted regression matrix. Passing targeted checks is not an exhaustive feature-by-feature proof for all deployed configurations.

## 13. Compatibility

| System | v402 status |
| --- | --- |
| Cloud Sync / Sync Now | Existing protected workflow; stricter field-by-field readback |
| Automatic and Full Backup | Shared current builder; Stopwatch metadata fix |
| Full JSON Export / Import | Additional validation and metadata; no required format migration |
| Settings Export / Import | Preserved; v400/v401 settings coverage confirmed |
| History CSV | Preserved, including canonical unit JSON/timestamps |
| Personal Order v5 Export / Import | Preserved; collection queue parity audited |
| Collections v2 Export / Import | Current version stamp; optional deletion-marker support |
| XP calculation and XP History | Existing formulas and ledgers preserved |
| PWA / Automatic Updates | Updated cache generator and release asset/version coherence |
| Dynamic themes | Unchanged |
| Automatic Multi-Provider 2 | MAL identity separation, highest verified fresh count, partial scan diagnostics and Unknown-safe recommendation filter |
| Automatic Multi-Provider 1 & Individual Providers | Existing fallback / selected-provider behavior preserved |
| Manual Fresh Episodes | Preserved; fresh-only switch unavailable |
| Database migration | None |
| README policy | Evolution section only |

## 14. Release summary

**MediaFlow v402** fixes Automatic Multi-Provider 2 verification, recommendation eligibility, data portability and update safety without introducing a parallel account store or changing established XP formulas. It repairs the omission of Stopwatch synchronization metadata in full backups, prevents older Collections exports from silently reinstating newer deletions, extends Sync Now's readback assertions across persistent account fields, and makes PWA cache upgrades gentler on constrained devices. The root public README remains intact outside its Evolution timeline.

**MediaFlow v402 — Better provider verification. Reliable data. Safer updates.**
