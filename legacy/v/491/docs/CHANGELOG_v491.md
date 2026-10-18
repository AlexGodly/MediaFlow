# MediaFlow v491 Beta — Perceptual Color Science & Readability

Visual Evolution Phase I milestone v491. This update strengthens the final rendered palettes of **Advanced and Custom** without changing Legacy, previous source preferences, cover processing or user data.

## New final-write contrast guard

The existing v489 harmony compositor already generates visually related colors, but later Custom variations can adjust surfaces and invalidate earlier readability checks. v491 audits **the final palette at the moment it is applied**, after those variations and before the theme-ownership and recovery stack accepts the result.

- Perceptual OKLCH tonal adjustment of text, secondary/muted text, primary/secondary/tertiary accents, flow-dim and structural borders.
- Checks the **worst contrast across background, panel and raised-card surfaces**, instead of checking only one background.
- Targets **7:1 main text**, **4.5:1 secondary/muted text**, **4.5:1 accent foreground colors**, and **4.5:1 primary button labels**.
- Improved structural-border visibility aims for a 1.55:1 design contrast, clearly distinguished from WCAG non-text contrast requirements.
- Chooses legible light or dark primary button text dynamically for the actual accent color, including hover. Replaces a fixed gold hover background with the theme accent.
- Visible focus outlines for common controls in opt-in themes.
- Keeps source hue and saturation as much as possible, only adjusting lightness/tone when necessary. Does not inject unrelated saturated hues or make every theme visually identical.
- If a particularly mixed palette cannot meet a contrast target, selects the strongest available neutral and surfaces explicit audit failures rather than falsely claiming that all contrast is perfect.
- Original source objects are never mutated; the validated palette is passed through v485's existing ownership and last-good recovery controls.

## Appearance diagnostics

**Settings → Appearance → Perceptual Color Science & Readability** includes actual measured ratios for main, secondary and muted text, each accent, primary button label and structural borders; shows how many roles were adjusted and any remaining warnings.

The audit applies to the theme's standard CSS variables and supported primary-button presentation; it does **not** claim to certify every custom overlay or third-party media image. Full accessibility verification comes in later roadmap updates.

## Legacy and compatibility

- **Legacy remains the default and unchanged.** Its palette apply call and static Theme Collection controls continue as before.
- Advanced cover Theme Collections and Custom profiles retain their original selected artwork, color identity, rotations and settings.
- Current v490 mood detection, v489 harmony, v488 focal correction, v487 sampling, v486 source selection, v485 owner guards, v484 theme profiles and v483 scroll recovery remain integrated.
- No Library, Logging, Statistics, XP, provider, recommendations, Supabase schema or cloud data changes.
- No new third-party dependency, paid API, background image requests or per-frame work.

## Validation

- Test representative vivid, pale, muted and grayscale palettes in light and dark modes.
- Simulate late Custom variation surface recoloring and validate contrast on all three structural surfaces.
- Reject stale palette writes from a different mode and do not attribute them as applied; verify Legacy receives unmodified palette objects.
- Confirm button-label contrast, color-hue fidelity, diagnostic targets and CSS theme-only scoping.
- Preserve all previous feature contracts and run full bundle/PWA/repository checks.
- Archive the complete current project under legacy/v/491 and publish numeric GitHub tag 491 with full modular ZIP, checksum and detailed changelog.

## Next milestone

**v492 — Smart Palette Composition & Expressiveness**: richer Subtle/Balanced/Vivid tuning, user-configurable saturation/depth/accent influence and coordinated color expressiveness without compromising v491 readability.
