# MediaFlow v352 — Collections Add Titles: View Modes, Cover Sizing & Readable Names

**Release:** v352  
**Base:** MediaFlow v351 Modular  
**Date:** October 10, 2026  
**Created by:** Alex Godly  
**Edition:** Personal Edition

## 1. Collections — Add Titles picker redesigned

The Add Titles popup now includes **five selectable views** instead of the former single cramped three-column picker:

- **List:** Full-width rows with title art, full readable name, and metadata.
- **Compact:** Denser rows with smaller cover previews while preserving readable names.
- **Cards:** Dedicated cards with cover art and clearly separated title/metadata.
- **Covers:** Poster-oriented cover grid with selectable checkboxes; names remain available as hover/accessibility labels.
- **Covers + Titles:** Poster grid with visible, multi-line names under each cover.

View switching updates the existing result content without clearing selected titles, search terms, filters, or the underlying collection.

## 2. Title text size adjustment

Added a **Title text size** slider (12–24 CSS px, default 15 px). The selected value is applied immediately to title names across text-bearing modes. Unlike the previous 10 px title rule, names now wrap instead of being truncated into unreadable ellipses. Metadata is also increased to a legible size and wraps as needed.

## 3. Cover size adjustment

Added a **Title cover size** slider (36–180 CSS px, default 72 px) with live preview. All five picker views use the requested size according to their layout; Compact reduces the cover proportionally for density. Missing-cover category artwork continues working.

## 4. Saved display preferences

The selected view and both size values persist in `settings.v352CollectionPicker` and are saved using MediaFlow's existing application-state persistence mechanism. This keeps the preferences compatible with the existing cloud-state model and full-data backups. No Supabase migration is necessary.

## 5. Picker behavior retained

- Indexed Library search and debounced results.
- Category, status, priority, rating, and sorting controls.
- ASC / DESC ordering.
- Select visible, deselect all, and per-title checkboxes.
- 24 results per page and Previous / Next navigation.
- Add selected action and existing Collection data / XP workflows.
- Appropriate responsive layout in mobile and desktop modal dimensions.

No changes were made to the Collection browsing page's own display modes or to desktop page layout outside this popup.

## 6. Implementation and release assets

- **Runtime:** `src/js/components/250-v352-collection-add-picker-views.js`
- **CSS:** `assets/css/178-v352-collection-add-picker-views.css`
- **Test:** `tests/test-v352-collection-add-picker.py`
- **Bundle:** `assets/js/mediaflow-v352.bundle.js`
- **PWA:** `mediaflow-pwa-v352-shell-v1`
- **Version:** VERSION `352`, package `352.0.0`, updated `version.json`, `index.html`, and `sw.js`.

Cloud Sync 201, Full Backup schema 29, Settings Preset schema 1, Personal Order v5, and Collections v2 retain their existing versions; no database schema change is required.

## 7. Local verification

Compiled application browser checks at **320, 390, 820, and 1280 CSS px** passed for five views, readable title wrapping, slider updates, re-opening the modal with stored preferences, title selection across view switches, pagination, indexed search, and absence of document-width overflow. Syntax checking and PWA asset generation also passed. Live GitHub Pages updates and authenticated Supabase synchronization have not been independently verified.

---

**Version progression:** v350 introduced the mobile/tablet redesign; v351 repaired mobile regressions; **v352 makes the Collections Add Titles picker readable and adds full presentation control.**
