# MediaFlow v487 Beta — Advanced Artwork Pixel Analysis

This is the **v487 Visual Evolution** milestone. It upgrades real pixel sampling for Advanced cover themes and image/hybrid Custom profiles without changing original Legacy extraction.

## Perceptual cover analysis

- Browser-side downsized Canvas analysis, reading actual image pixels instead of selecting unrelated colors from image URL hashes.
- Perceptual **OKLab** conversion for meaningful visual color separation.
- Quantized perceptual color bins and deterministic weighted clustering, with bounded iteration count.
- Score visually salient regions using image-center weighting, nearby-pixel contrast and chromatic intensity while retaining true coverage.
- Identify the cover's dominant background independently from distinctive focal/accent colors.
- Generate up to three representative theme colors, including secondary and supporting accents.
- Reject tiny noisy color artifacts; keep muted and monochrome images muted instead of injecting unrelated neon.
- Distinguish naturally light and dark artwork using weighted brightness and dominant cluster lightness.
- Ignore transparent regions and gracefully handle invalid or unreadable images.
- Provide sample counts, dominant-color coverage, perceptual chroma, brightness, separation, color diversity, transparency and dominant background.
- Preserve existing v484/v486 palette composition, source priorities, theme modes and artwork fallback logic.

## Performance and safety

- Downsample to a maximum 128-pixel dimension and process a bounded pixel count.
- Batch duplicate image analysis using a shared promise cache, TTL and a 96-entry cache cap.
- Canvas extraction is opt-in through Advanced and Custom image-sourced themes only; Legacy uses its original sampler and unchanged theme pipeline.
- CORS-blocked and failed images return **no claimed pixel-derived palette**, allowing existing fallback behavior to take over.
- No third-party AI APIs, paid services, Supabase migrations or Library data writes.
- Protects existing v485 stale-theme generation guards and v486 cover-source resolver.

## New Settings diagnostics

**Settings → Appearance → Advanced Artwork Pixel Analysis** presents sampled color chips, extraction counts, cached reads, failures, dominant coverage, brightness, chroma, and a **Reanalyze Current Artwork** action.

All diagnostics refer only to genuinely readable sampled pixels; remote artwork can still be unavailable when the source blocks browser access.

## Validation

- Synthetic dark cover with vivid purple and cyan accents.
- Light cover with distinctive contrasting accent.
- Pure grayscale cover without invented saturated colors.
- Transparent artwork (hidden pixels ignored).
- Invalid buffer and unsafe image URL rejection.
- Cache hit and forced reanalysis.
- CORS/image failure returning null for existing fallback.
- Previous v486 cover-source contract, v485 ownership, v484 schema and v483 recovery scroll tests.
- Bundled JS syntax, PWA consistency, repository integrity, complete `legacy/v/487` archive and numeric GitHub Release `487` with ZIP and SHA-256 checksum.

## Next update

**v488 — Visual Composition & Subject Salience**. Improve subject/focal-region weighting, composition analysis and user-selectable focal regions while retaining accurate natural color distributions.
