# MediaFlow v417 Stable — Overview Icons & Library Missing Covers

**Baseline:** v416 Stable · **Date:** October 14, 2026 · **Developer:** Alex Godly

- The **Total titles** label in Library Overview now includes the existing Library All Titles icon. Each per-status count uses the exact same canonical status SVG as Library status-choice dialogs; ordering continues to follow Dynamic Status settings.
- **Normal Library status quick filters** no longer receive an extra global leading action icon; the existing status icon, label, and selection behavior remain.
- **Normal and Dynamic Library, List/Compact/Cards:** titles without a cover URL now display the category missing-cover URL if selected in Settings, otherwise the actual category icon. Broken images fall back to the icon rather than leaving an empty area. Cover/Cover+Titles views also respect the category fallback.
- Never writes generated placeholders to the title cover URL. Missing Covers, imports/exports, Supabase/cloud sync, settings, themes, and status count semantics are preserved.
- Regression tests cover missing/default/icon/invalid cover cases, multiple Library modes and views, canonical status icon markup, and prevention of duplicate status-button icons.

**Archive:** `legacy/v/417/` · **Tag:** `417` · **Release:** v417 Stable.
