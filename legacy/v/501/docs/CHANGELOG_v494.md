# MediaFlow v494 Beta — Theme Preview Laboratory & Comparison

Visual Evolution Phase I, milestone v494. A non-destructive three-way comparison workspace for **current theme vs Candidate A vs Candidate B** with realistic MediaFlow component mockups and independent palette tuning.

## Theme Preview Laboratory

Available under **Settings → Appearance → Theme Preview Laboratory & Comparison**.

- Three columns: snapshot of the **currently applied** theme, plus two independently configurable candidate previews.
- Switch between Dashboard, Library and Details component layouts, including navigation, hero surfaces, KPI cards, progress, status labels, list rows, settings-dialog mockups, action buttons, and palette swatches.
- Candidate A starts with the current saved artwork interpretation, including previously saved v493 accent slots; B defaults to a complementary focal candidate.
- Select artwork-based interpretations (Automatic, Focal emphasis, Dominant artwork, Gentle harmony, Distinct accents) for each candidate.
- Tune saturation, accent influence, depth and tint independently (0–100). Sliders update preview panels without re-rendering the entire Settings page, preserving slider focus and page scroll position.
- Swap A/B, reset preview drafts, or explicitly apply either candidate. **No candidate change touches live CSS, persists settings, fetches new covers or alters user data before Apply**.
- Candidate previews use v489 color harmony, v492 expressive composition and v491 contrast protection. Image/hybrid Custom profile variations are also represented in the previews.
- Snapshot common browser-computed theme colors, including rgb()-formatted CSS custom properties.
- Preview styling is entirely contained within the laboratory and is responsive to desktop, tablet and small mobile widths; respects reduced-motion preferences.

## Application and safety

- For Advanced and Custom image/hybrid, Apply delegates the selected artwork variant and saved accent slots to v493's per-artwork persistence/guarded refresh, plus the selected palette-tuning settings.
- For manual-color Custom themes, candidate previews use only the user's manual palette and Apply updates expressiveness tuning; never reads Library covers.
- Rechecks current artwork/profile identity immediately before any persisted write. A rotated cover or changed Custom profile cannot receive a stale candidate.
- Legacy mode is read-only and left exactly as it was. The existing default remains Legacy.
- No image data mutation, extra provider calls, paid services, new Supabase schema or changes to Library, Logging, History, XP or recommendations.
- No global theme CSS changes until explicit Apply.

## Tests and deployment

- Preview isolation across both candidates, three component layouts, swapping, reset and invalid slider/reinterpretation rejection.
- Verify source-derived palette selection, current live computed-style snapshot, previously saved correction roles and valid apply.
- Stale source protection; Custom manual/image behavior; Legacy isolation; original pixel data untouched.
- Retain v493 correction, v492 expressiveness, v491 readability, v490 mood, v489 harmony, v488 composition, v487 pixel, v486 source, v485 ownership, v484 settings and v483 scroll regressions.
- Verify built v494 JS bundle, PWA version/scope, archive full project under `legacy/v/494`, and publish numeric GitHub Beta Release 494 with ZIP, SHA-256 checksum and changelog.

## Next milestone

**v495 — Artwork Extraction Reliability, Cache & Consistency**: confidence and failure diagnostics, cache consistency across cover changes and per-cover overrides, and robust last-known-good palette continuity.
