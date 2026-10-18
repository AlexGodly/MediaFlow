# MediaFlow v489 Beta — Advanced Perceptual Color Harmony

Visual Evolution Phase I milestone v489. This update expands the existing Cover Intelligence into a deliberate color-composition system that makes palette roles visually coherent while keeping them sourced from the actual cover or Custom user input.

## New harmony engine

- Computes hue relationships and perceptual distance using OKLab/OKLCH; classifies monochromatic, analogous, complementary, split-complementary and multicolor relationships.
- Keeps the focal source color first, with secondary and tertiary color roles from the original artwork or manually chosen Custom colors.
- Uses verified source color-distribution candidates when available; discourages near-identical accents from competing for the same UI role.
- When source colors are insufficient or too similar, derives restrained tonal variations of the real hue. Never injects an unrelated fake "complementary" neon.
- Preserves manually entered Custom color identities and order. The new composer adjusts applied lightness/contrast for usability without replacing the user's chosen hue family.
- Builds coherent background, panel, elevated surface, border and highlight colors rather than applying the same swatch to every component.
- Creates distinct light/dark palettes with Subtle, Balanced and Vivid expressiveness.
- Evaluates primary/secondary/tertiary accents against the panel, selection text against the action accent and body text against the background; corrects tone where needed.

## Settings diagnostics

In Settings → Appearance → Advanced Color Harmony, the new panel shows:

- Harmony family and last applied three color roles.
- Their actual displayed swatches and hex values.
- Calculated contrast ratios against panels and background.
- Current expressiveness and composition counters.
- A clear explanation that harmony does not invent unrelated colors.

## Compatibility

- Legacy is unchanged and calls the existing v484 composer when appropriate.
- Existing Dynamic/Recommended/On This Day/Library Cover/Image URL collection source priority and rotation remain intact.
- Advanced consumes real pixel-derived colors from v487/v488 where possible.
- Custom manual/image/hybrid modes use the shared harmony compositor, preserving saved profiles, artwork choice and current variation settings.
- The v485 last-good-palette guards, v486 source attribution, v487 safe CORS fallback and v488 focal-region overrides remain untouched.
- No Library, logging, History, statistics, Supabase schema or recommendations changes.

## Verification

- Automated dark and light palette contrast; primary, secondary and tertiary accents on the panel; readable text and action labels.
- Neon purple/cyan/gold source-color fidelity without injected hue replacement.
- Monochrome and muted palette safety; tonal variation for duplicated source hues.
- Custom hue ordering, Legacy isolation, harmony classification and no user-data writes.
- Historical v488 composition, v487 pixel, v486 source, v485 ownership, v484 visual and v483 recovery contracts.
- Rebuilt JS bundle and PWA coherency; archived full source under legacy/v/489; numeric GitHub Release with modular ZIP and checksum.

## Next update

v490 — Artwork Mood & Atmosphere Detection: appearance-aware temperature, contrast, visual energy, softness and art-direction signals to guide later Living Themes effects.
