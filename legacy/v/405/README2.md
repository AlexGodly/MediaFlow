# MediaFlow v405 — Technical Release Notes

**Version:** v405 Modular  
**Baseline:** v404 Modular  
**Date:** October 13, 2026  
**Developer:** Alex Godly  
**Database migration:** None  
**Status:** Locally built modular package. No production deployment or live Supabase account mutation.

## What changed

1. **Appearance → Floating Controls.** Two separately saved, default-visible switches for the floating Quick Add action button and the floating Task Progress widget. The section is registered in the current Settings Center, searchable and available on desktop, tablet and mobile. Hiding an element does not disable its underlying Logging, Library, goal or XP functionality.
2. **More Pages overlay safety.** The More menu cannot be covered or intercepted by floating dock elements. The dock is temporarily concealed and made inert while More is expanded, then restored according to the user's saved preferences.
3. **Persistent settings compatibility.** The new `v405ShowFloatingAdd` and `v405ShowFloatingTaskProgress` fields are part of the canonical `S.settings` object, transmitted by cloud snapshots and Sync Now, and included in Full Data and Settings Preset exports. Legacy accounts default to visible until customized; `automatic2` and v404 fresh-only preferences remain compatible.
4. **Current transfer metadata.** Export stamps for Full Backup, Settings Presets, Personal Order and Collections are v405. Existing data shapes and import formats are preserved. The read-only `App.v405AuditDataIntegrity()` extends v402 transfer checks to include the two preferences and current version stamps.
5. **PWA regeneration.** v405 app shell, service worker, version.json, manifest, CSS/JS inventory, cache identity and update lifecycle refreshed through the existing build pipeline.
6. **About → MediaFlow Evolution.** Chapter 06 is now **The intelligent era** with approved description: “Smarter episode verification, adaptive recommendations, and continuous improvements to performance, stability, and reliability.”
7. **Regression validation.** Local headless Chromium tests covered 320–1920px responsive interfaces, simulated cloud JSON readback, 1,555 History events without clipping, per-unit timestamp preservation, XP non-mutation, Collections tombstones, old-v403 verification evidence, PWA cache fallback, and 100,000-title synthetic recommendation behavior.

### Limits

- **Cloud verification was simulated locally.** The tests do not establish that live Supabase accepted and synchronized every dataset on real devices; no live account was accessed.
- **Installed PWA updates were simulated.** Android/iOS installation and real update transitions require separate on-device validation.
- **100,000-title performance is not fully freeze-free.** The inherited synthetic recommendation test showed approximately 0.2 ms toggle feedback and ~2.1 s background selection, but ~254 ms occasional headless-browser pauses.
- No paused media-service tracking, Discord or community integration was reintroduced.

**Detailed changelog:** [docs/CHANGELOG_v405.md](docs/CHANGELOG_v405.md)

---

## Prior technical release notes

- [v404 — The Smart Engine & Refinement Update](docs/CHANGELOG_v404.md)

- [v403 — Evidence-qualified single-source verification](docs/CHANGELOG_v403.md)
- [v402 — Comprehensive verification and data-integrity improvements](docs/CHANGELOG_v402.md)
- [v401 — Automatic all-provider verification and recommendations](docs/CHANGELOG_v401.md)
- [v400 — Independent timestamps and picker workspace](docs/CHANGELOG_v400.md)
