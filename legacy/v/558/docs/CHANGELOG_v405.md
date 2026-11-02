# MediaFlow v405 — The Data Integrity & Experience Update

**Version:** v405 Modular  
**Baseline:** v404 Modular  
**Release date:** October 13, 2026  
**Developer:** Alex Godly  
**Delivery:** Complete modular source package, local build  
**Database migration:** None

---

## 1. Summary

v405 audits the existing persistence and portable-data contracts, refreshes release metadata and the PWA app shell, fixes floating dock overlap with the responsive More Pages menu, introduces independently persistent visibility preferences for the floating Quick Add button and Task Progress widget, and revises Chapter 06 of the in-app About → MediaFlow Evolution timeline.

The scope is intentionally conservative: preserve the existing MediaFlow engine, Library, Logging, History, XP, themes, organization workflows and account schemas. New visibility settings do not change what a task or Quick Add action does.

## 2. Floating Controls — Two independent settings

**Location:** Settings → Appearance → Floating Controls, using the existing Settings Center's native section registry. Each switch is searchable and belongs to the corresponding Quick Actions or Progress Widgets subgroup.

| Setting | Saved key | Default | Effect |
|---|---|---|---|
| Show Floating Add Button | `v405ShowFloatingAdd` | Visible (`true`) | Hides or shows the floating + shortcut; original Add Title, Logging and Collections workflows remain available elsewhere |
| Show Floating Task Progress | `v405ShowFloatingTaskProgress` | Visible (`true`) | Hides or shows the floating progress widget without stopping calculations, Logging, XP or goal tracking |

**Implementation details:**

- Uses the canonical `S.settings` storage object rather than device-only DOM preferences.
- Existing accounts with no v405 keys treat both elements as visible; no breaking settings migration is required.
- Actions immediately update the floating dock, switch appearance and `aria-checked` state.
- Saves via the existing `persistSettings()` → protected `saveState()` pipeline, including the existing cloud error indicator.
- Values survive navigation and app rendering, and are included in settings presets, full backups and cloud snapshots.
- Supports the existing light/dark and dynamic themes and touch/keyboard interactions.

## 3. More Pages — Layering and accessibility fix

**Prior issue:** The floating + Quick Add shortcut and the Task Progress widget used a higher display layer than the responsive More Pages navigation. They could overlap and block the Account/About destination cards, especially at mobile and intermediate screen widths.

**Changes:**

- Temporarily conceal the dock while More Pages is expanded, regardless of user visibility settings.
- Close an open floating action fan when More Pages opens.
- Make underlying dock controls inert so they cannot intercept keyboard focus or clicks.
- Restore the dock after closing the menu, respecting both saved user preferences.
- Add a CSS `:has()` safety net for menu state changes, plus JS handlers and class observation for legacy navigation paths.
- Preserve the existing menu design, position, and route functionality.

## 4. Cloud, Sync Now and transfer audit

### 4.1 Cloud snapshot

The final cloud snapshot and Sync Now path use the canonical application state, including the complete Settings object, Library, consumption History, Library activity History, Collections, deletion markers, Personal Order and XP ledgers. v405's newly added preferences live in Settings, so they follow this established transport.

The v155 Sync Now implementation continues to perform source completeness checks, protected cloud reads, merged-state preparation, upload and verification readback. The v402 field-by-field `v155VerifyCloudState` extension remains active. No credential or production database schema change is introduced.

### 4.2 Full Data and automatic backups

The canonical Full Data builder includes the current `S.settings` and preserves the existing source schema. v405 stamps exported release metadata as 405 and annotates the manifest with the new floating preferences. Existing automatic backup jobs using the canonical backup builder inherit the new fields and manifest.

### 4.3 Settings presets

The Settings Preset builder includes both keys because it serializes the full current Settings object. Its release stamp and preset manifest are updated, while previous preset formats remain supported by the existing import normalization path.

### 4.4 Personal Order and Collections

The existing dedicated order/collections export payloads retain their data shapes and compatibility fields. v405 stamps them as release 405. Collections export continues to include tombstones and display settings; Personal Order retains collection assignments and category queues.

### 4.5 History and XP

No XP earning or level formulas were changed. The audit verifies serialization and export accessibility without recomputing or re-awarding XP. Existing History exports and v400 individual-unit timestamps remain intact. In a controlled local JSON readback test, **1,555 activity History records** survived cloud snapshot, full backup and merge without an arbitrary 1,000-record cutoff.

### 4.6 Read-only diagnostics

`App.v405AuditDataIntegrity()` extends the previous read-only audit with:

- Per-setting parity for floating Add and Task Progress visibility across cloud snapshot, Full Data backup and Settings Preset.
- Export release stamps for Full Data, Settings Preset, Personal Order and Collections.
- The inherited full cloud/backup field parity, JSON round-trip, order assignment, and collection tombstone checks.
- Explicit notices that live cloud acceptance and installed PWA lifecycle were **not** validated by an offline audit.

These diagnostic operations do not initiate a cloud upload or alter XP.

## 5. PWA and automatic app updates

The release generator refreshed `VERSION`, `version.json`, web manifest, service worker, asset cache naming, runtime bundle references, CSS inventory and app-shell list for **v405**. Existing automatic update preferences, update detection and fault-tolerant installation logic are preserved.

The simulated service-worker test covers a complete shell-cache install and an interrupted critical fetch. In the failure scenario it retains the previous safe cache rather than replacing it with a broken one. The test does not establish a successful installed PWA update on Android/iOS.

## 6. About → MediaFlow Evolution

The sixth milestone is now:

> **06 — The intelligent era**  
> Smarter episode verification, adaptive recommendations, and continuous improvements to performance, stability, and reliability.

This replaces the old `v383` heading and the sentence beginning “A redesigned About”. Other chapters, the FAQ, Fun Facts and About layout remain unchanged in v405.

## 7. Technical changes

| File | Purpose |
|---|---|
| `src/js/components/298-v405-cloud-floating-experience.js` | Settings registration, floating visibility, menu overlay safety, transfer metadata, local data-contract audit |
| `assets/css/217-v405-floating-settings-layering.css` | Responsive settings switches and dock/More overlay safety |
| `src/js/core/constants/001-constants.js` | Default-visible settings |
| `src/js/components/279-v383-about-logging-data-integrity.js` | Sixth Evolution chapter wording only |
| `src/js/components/294-v402-data-integrity-release-audit.js` | Current release stamp for inherited parity audit |
| `src/js/runtime-order.json` | Register v405 extension at end of runtime |
| `index.html`, `VERSION`, `version.json`, `manifest.json`, `sw.js` | Current release registration and generated PWA resources |
| `assets/js/mediaflow-v405.bundle.js` | Built JavaScript bundle |
| `README.md`, `README2.md`, `docs/CHANGELOG_v405.md` | Documentation; README.md changed only inside Evolution markers |

## 8. Validation results

| Check | Result / caveat |
|---|---|
| JavaScript syntax and v405 modular build | PASS |
| Mounted Settings Center, 320/390/820/1280 px | PASS — two floating controls in Appearance, native section, both independent |
| Both visibility toggles and menu overlay behavior | PASS — mocked local UI state, restore verified |
| Complete data-parity regression, 320–1920 px | PASS |
| 1,555-record History cloud JSON readback and merge | PASS — synthetic local data, no truncation |
| Full Backup, Settings Presets, Personal Order and Collections stamps | PASS — v405 |
| Strict settings change detection on simulated cloud readback | PASS |
| XP ledger unchanged by export/audit | PASS |
| Legacy Collections tombstone import and Full Data validation | PASS |
| v403 84-title verification fixture | PASS — 70 fresh, 14 confirmed caught up, zero unresolved |
| Multi-provider/AniList evidence regressions | PASS — simulated providers |
| Logging, Last Watched, Add/Edit Title save regressions | PASS |
| v404 Smart Engine and Dashboard recommendation regression | PASS |
| PWA cache lifecycle and interrupted installation recovery | PASS — simulated worker |
| Synthetic 100,000-title recommendation test | PASS for operation completion; observed occasional ~254 ms long browser frame |
| Live Supabase account verification | NOT PERFORMED |
| Installed PWA Android/iOS update tests | NOT PERFORMED |

### Performance and safety limitations

The synthetic 100,000-title recommendation regression observed ~0.2 ms toggle response, ~2.1 seconds background selection and an occasional ~254 ms long frame in headless Chromium. These figures are not production performance guarantees. An isolated test cannot establish that a real cloud service will accept arbitrarily large JSON payloads, and this package makes **no** claim of universal zero lag or lossless cross-device synchronization without live testing.

## 9. Compatibility

- No destructive migration, authentication change, or Supabase database schema change.
- No live user data, cloud project or GitHub deployment was modified.
- Pre-v405 preferences remain valid; absent floating-control keys default to visible.
- Existing `automatic2` Smart Fresh Episodes Engine mode key and v404 fresh-only recommendation setting remain compatible.
- Existing Library, Logging, History, XP, Personal Order, Collections, themes, old system and PWA update workflows are preserved.
- Tracking with external media services, community features and Discord integrations remain paused.

## 10. Version evolution

- **v403:** Evidence-qualified AniList single-source verification.
- **v404:** Official Smart Fresh Episodes Engine branding, synchronized recommendation settings, responsive filtering and About historical content.
- **v405:** Persistence/export version audit, independent floating control preferences, More Pages overlay fix, v405 PWA assets and the “intelligent era” Evolution milestone.

---

**MediaFlow v405 — The Data Integrity & Experience Update**  
**Developed by Alex Godly.**
