# MediaFlow v492 Beta — Smart Palette Composition & Expressiveness

Visual Evolution Phase I, milestone v492.

## Fine-tuned expressive themes

The Subtle, Balanced and Vivid options now drive a coherent **four-control composition system** for opt-in Advanced and Custom modes, adding visible variation without replacing actual source colors.

- **Palette saturation (0–100):** perceptual OKLCH chroma of existing palette accents. Monochromatic artwork remains monochromatic; no fabricated hues.
- **Accent influence (0–100):** strength of primary, secondary and tertiary accent colors while preserving original hue families.
- **Surface depth (0–100):** meaningful lightness separation among background, panel and raised-card surfaces. Supports both Light and Dark without changing theme mode.
- **Atmospheric tint (0–100):** how strongly source-color tint and subtle chroma appear in backgrounds, surfaces and borders.
- Three coordinated presets: Subtle (restrained), Balanced (expressive default) and Vivid (richer color and surface depth). These are tunable, and selecting a preset deliberately resets finer overrides.
- Per-control settings persist through existing MediaFlow settings, cloud sync and backup/export. Values are finite and bounded.
- Existing Theme Intelligence & Living Atmospheres expressiveness dropdown is synchronized with the presets.
- Actual palette composition happens after v489/v490; v491 remains the final authority over text, button, accent and surface contrast **after** any Custom variation.
- Changing colors does not start animations, alter recommendation logic, change media covers, or rewrite user data.

## Appearance settings

**Settings → Appearance → Smart Palette & Expressiveness** includes a preset picker, four independent sliders, live values, theme-color preview and Reset to preset. The sliders commit on change, avoiding expensive network work on every pointer movement. A cached cover can be refreshed for Advanced; Custom only refreshes its selected source. Legacy's controls are disabled.

## Compatibility

- Legacy retains the original MediaFlow skin, cover source rules and saved custom-color features.
- Advanced continues using Source Intelligence (v486), pixel analysis (v487), focal regions (v488), color harmony (v489) and mood guidance (v490).
- Custom colors and image/hybrid sources remain profile-driven and independent of rotating Library covers.
- Perceptual Readability & Contrast v491 continues to protect the final applied palette.
- No new paid dependencies, cloud tables, user data copying, or per-frame processing.

## Verification

- Contrast after every expressiveness preset and manual saturation/depth extreme in dark and light.
- Grayscale colors remain neutral, source data unchanged, meaningful increase in depth and accent intensity when configured.
- Preset and slider persistence, reset behavior, malformed input rejection, Legacy isolation and Custom profile reapplication.
- Previous v491 readability, v490 mood, v489 harmony, v488 composition, v487 pixel, v486 cover source, v485 owner, v484 appearance and v483 scroll regressions.
- Fully built v492 bundle, valid PWA metadata, repository integrity and complete legacy/v/492 source snapshot. Numeric tag/release 492 includes ZIP and SHA-256 checksum.

## Next milestone

**v493 — Advanced Cover Intelligence Diagnostics & Corrections:** expose understandable artwork color reasoning, selected focal/accents, previewable palette alternatives and safe per-cover corrections.
