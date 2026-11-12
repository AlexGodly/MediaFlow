# MediaFlow v339 — Cloud, Export/Import, XP & PWA Integrity Audit

**Release:** MediaFlow v339  
**Base:** MediaFlow v338 Modular  
**Created by:** Alex Godly  
**Release date:** October 9, 2026

## Release Purpose

v339 audits and hardens the existing MediaFlow Personal Edition data-protection and portability pathways. The focus is reliable cloud-state coverage, current export metadata, safe imports, XP/activity persistence, and aligned PWA release files—not changes to the Library interface or new paid services.

## 1. Cloud Persistence & Sync Now

- **Expanded protected cloud readback verification.** Beyond the previous Library/History/Settings/XP/Order checks, Sync Now now compares additional serialized fields where present: category definitions/order, Collections, Collection tombstones, portable preferences, Old System, profile image/name, Stopwatch, Runtime Calculator, MAL connection, migration flags and completion timeline.
- **Preserved JSON-safe comparison.** State fields are compared in their serialized form to avoid false errors caused by JavaScript `undefined` properties that do not survive JSON encoding.
- **Existing safe cloud merge retained.** Sync Now still reads the current cloud state, protects populated accounts against unexpectedly empty remote data, merges supported fields, rebuilds progression, uploads, and verifies the remote readback. v339 does not remove those protections.
- **No new Supabase project or tables.** The app continues using its configured personal Supabase backend and existing JSONB state storage.
- **Honest cloud-save status on imports.** If a queued cloud save fails or a startup safety guard blocks the save, impacted import flows no longer claim that the cloud save succeeded. The original export/backup file should be kept and Sync Now retried when connectivity returns.

## 2. Full Data Export / Full Backup

- Full Backup continues to use the current **complete** canonical state snapshot, including Library, consumption History, Library History, Settings, XP ledger, activity tracking, Personal Order, Collections, runtime state, profile data, and supported portable preferences.
- **Updated Full Backup metadata to v339.** The builder now reports the current release rather than an old historical audit version.
- **Added a v339 backup manifest audit.** The manifest identifies current schema versions, Collection and History counts, activity-day count, and feature coverage.
- **Preserved portable cloud merge timestamps.** Full Backups now carry the portable `_syncMeta` timestamps used for Rating Queue and UI preferences during device merges, instead of dropping them when assembling backup extras.
- **Preserved the existing Full Backup Schema v29.** No format-breaking backup migration is introduced.

## 3. Full Data Import

- The current complete backup import path and validation are preserved.
- **Restore portable merge metadata.** Importing a v339 backup also restores the saved portable preference merge timestamps when available.
- **Cloud-save failure surfaced.** The import completion flow now checks whether the queued cloud write failed or was blocked, rather than reporting success unconditionally.
- The original JSON backup remains the recovery source if remote saving cannot be confirmed.

## 4. Automatic Backup / Automatic Export

- **Automatic folder backups continue through the final Full Backup builder.** The scheduled backup and manually triggered folder backup share the same latest v339 state builder used by Full Data Export.
- New v339 backup manifest fields and portable merge timestamps are therefore included in automatic backup files too.
- Existing browser File System Access permissions and backup scheduling preferences remain in effect; browser-granted folder handles cannot be transferred as JSON files.
- A local file download is distinct from a confirmed cloud upload. This release does not treat those as interchangeable.

## 5. Settings Export / Import

- **Updated Settings Preset release metadata to v339.** The preset schema remains v1.
- **Preserved full Settings coverage.** Settings Presets export the current settings object, category definitions, category order, current themes and leveling/XP configuration.
- **Documented all five current XP rate/reward fields** in the v339 preset manifest: first episode, first title start, Collection create/edit, and active time per minute.
- **Safer Settings import feedback.** Imported settings cannot be reported as cloud-saved if the queued save failed or was blocked. A cloud-save-specific error advises keeping the preset and retrying Sync Now.
- Settings Presets intentionally **exclude** personal Library, History and earned XP data; those belong in Full Backup.

## 6. Personal Order Import / Export

- **Version label corrected to v339** in Personal Order exports. The dedicated export **format remains v5** (introduced by v287) for backward compatibility.
- The export audit now identifies whether Collection assignments and category queues are present.
- The existing import mapping from exported titles and Collection assignments to the current Library/Collections is retained.
- **Import cloud-save confirmation hardened.** An imported Order is no longer reported as successfully cloud-saved if its queued write fails.
- Existing Personal Order recovery, queue ordering, imports and exports remain supported.

## 7. Collections Import / Export

- **Collections export metadata corrected to v339.** The dedicated Collections export format remains **v2**.
- **Older imported Collection no longer overwrites a newer existing Collection.** The former importer set incoming `updatedAt` to the current time *before* comparing timestamps, causing older exported copies to win. v339 compares original source timestamps first.
- **Collection tombstones handled selectively.** Tombstones are cleared only for imported Collection IDs actually accepted, not for skipped stale copies.
- **Import confirmation reflects applied Collections.** The success toast distinguishes accepted imports from older copies that were skipped.
- **Cloud-save failure warning added.** If imported Collection changes are only in memory because the queued cloud write failed, the app warns instead of displaying confirmed success.
- No change to Collection tile UI, title assignment semantics or v2 export structure.

## 8. XP Calculations & Active Time Tracking

- All existing XP sources remain active: title rewards, first episode, Collection changes, streak multipliers, active time, and the previous progression calculation pipeline.
- **Active-time page/action checkpoint timing repaired.** The extra `pageMs` and `actionMs` data introduced in v336 are now locally checkpointed **after** the latest tick's breakdown is updated. Previously v334's checkpoint could run before these fields were finalized.
- **Equal-time local checkpoint recovery improved.** Where cloud and local daily totals match, additional page/action breakdowns saved locally are still restored rather than discarded.
- **High-end dual milestone interval corrected.** After the predefined time or time-XP milestones are exceeded, newly generated milestones use the correct immediately preceding generated target for percentage calculations.
- **No new XP awards during export or import.** Milestone bars remain informational; exporting files does not re-award XP.
- Foreground-only time, no idle timeout, no daily XP cap and the existing infrequent periodic cloud checkpoint schedule are preserved.

## 9. History Exports

- Audited the existing two current dedicated History CSV entry points—**Consumption History** and **History Logs**—plus the generic History CSV exporter.
- Both dedicated exporters continue emitting the current release number and full `session_json` data, preserving per-title logging timestamps from v331 and other extended session fields.
- History CSV uses the current stored-session XP calculation rather than calculating new rewards from scratch.
- Full Backup continues to include the complete consumption History and full Library History array without a historical 1,000-entry cap.
- No new History export format was necessary.

## 10. App Updates & PWA

- **Updated the active app bundle:** `assets/js/mediaflow-v339.bundle.js`.
- **Aligned release metadata** across `index.html`, `VERSION`, `version.json`, and `package.json`.
- **Regenerated the service worker and PWA app shell:** `mediaflow-pwa-v339-shell-v1`.
- The generated service-worker asset list targets the current release bundle and the current local CSS/JS dependencies.
- Existing automatic update checks, optional automatic installation, managed update/reload and optional backup-before-update settings are preserved.
- The existing managed-update save-queue protection remains in place; the app does not force a reload when the required cloud save reports failure.
- PWA install prerequisites, browser support and permissions are still governed by the browser; regenerating the worker does not guarantee that a native install prompt will appear.

## 11. Internal v339 Persistence Audit

Added a callable `App.v339PersistenceAudit()` for in-app inspection of current local data-pipeline coverage and metadata. It checks the presence of cloud, Sync Now, Full Backup, Settings Presets, History exports, Personal Order, Collections and update functions, and captures release/schema versions and current local counts.

This is a **local diagnostic**, not proof that Supabase accepted the latest state. For real cloud confirmation while signed in, run **Sync Now**, which performs a cloud readback and checks the written state.

## Compatibility

| Data system | v339 value |
|---|---|
| Cloud Sync | 201 |
| Full Backup Schema | 29 |
| Settings Preset Schema | 1 |
| Personal Order Export | 5 |
| Collections Export | 2 |
| PWA Cache | `mediaflow-pwa-v339-shell-v1` |

**No database migration is required.** No Community backend or paid service is introduced.

## New Source & Tests

- `src/js/components/236-v339-data-cloud-transfer-update-audit.js`
- `tests/test-v339-integrity.cjs`
- `tests/test-v339-collections-import.cjs`
- `tests/test-v339-release.py`

## Verification

- JavaScript bundle and source module syntax checks passed.
- v334 XP reward regression checks passed.
- v335 first-episode/Statistics checks passed.
- v336 dialog/analytics browser smoke test passed.
- v337 milestone browser regression checks passed.
- v338 Normal/Dynamic Library checkbox regression checks passed.
- v339 mock-based data transfer, cloud verification, local recovery and Collection conflict checks passed.
- Static version/PWA references and packaged ZIP integrity are checked during release packaging.

**Limitations:** This audit was performed against local code and mock/test fixtures, not a live authenticated Supabase session or installed PWA on every browser/device. Cloud uploads, automatic scheduling, remote readbacks, and automatic update installation cannot be confirmed as completed in the user's account until exercised in the deployed app.

## Version Progression

**v336** → Designed popups and expanded active-time analytics.  
**v337** → Dual active-time and time-XP milestones.  
**v338** → Normal Library cover-selection checkbox repair.  
**v339** → **Full cloud/export/import/XP/PWA integrity audit, version-current file metadata, safe Collection imports, and stronger save verification.**
