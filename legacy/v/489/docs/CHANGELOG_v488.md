# MediaFlow v488 Beta — Visual Composition & Subject Salience

Visual Evolution Phase I milestone v488. Extends the real-pixel OKLab sampler from v487 with composition-aware regional focus so a visually distinctive off-center feature can influence the resulting theme without discarding the artwork's dominant identity.

## What's new

- Inspect a bounded 3×3 spatial map of the sampled cover with perceptual contrast against the dominant background, color chroma, local image gradients, and region coverage.
- Choose an automatic focal region with a restrained center preference, but allow edge/corner regions to win when supported by actual visual evidence.
- Distinguish a cover's large, relatively uniform background from smaller, visually prominent color features.
- Refine accent selection from coherent, sufficiently represented focal-region color clusters rather than isolated compression pixels.
- Preserve muted/grayscale covers without inventing neon accents.
- Add analysis.composition diagnostics, colorRoles with region, focal color, heuristic confidence, foreground/background contrast and ranked candidate regions.
- Clearly label the method **visual heuristics, not semantic person/object recognition**.

## Manual focal controls

**Settings → Appearance → Visual Composition & Subject Salience** provides:

- Current artwork preview when an accessible HTTP(S) URL is available.
- Nine selectable focal regions (corners, edges and center).
- **Automatic detection** to remove a manual override.
- Diagnostic region, confidence and focal accent.
- Per-artwork selections in a bounded v488FocalOverrides settings map keyed by image URL hash (not raw source URL), synced with existing MediaFlow settings and normal backups.
- Immediate guarded analysis refresh and cache invalidation when the setting changes.
- No change to the actual image, source URL, Library data, cover rotation or user-selected Theme Collection.

## Compatibility

- **Legacy remains untouched.** Prior extraction behavior stays unchanged and the focal selector refuses Legacy mode.
- Advanced cover-driven collections use the composition stage after successful v487 pixel analysis.
- Custom themes remain independent of rotating Library artwork. For Custom image/hybrid sources, the focal selector applies only to the Custom profile's chosen image; manual color profiles are unaffected.
- Continue existing CORS/image fallback, caching, theme-owner sequence cancellation and last-good palette recovery.

## Validation

- Synthetic dark poster with an off-center vivid focal color and secondary accent.
- Automatic off-center detection despite a strong dark background.
- Manual per-artwork focal override with persistence, selection, source isolation and reset.
- Legacy isolation, grayscale preservation, transparency handling, invalid buffer fallback and no Library/History mutations.
- Full v487 pixel, v486 source, v485 ownership, v484 schema and v483 recovery-scroll regression suite.
- Rebuilt v488 bundle, JavaScript syntax, PWA/integrity contract and complete legacy/v/488 archive.

## Next update

**v489 — Advanced Color Harmony Engine**: perceptual harmony selection, accent-role compatibility, accessible expressive surfaces and user-friendly candidate palettes.
