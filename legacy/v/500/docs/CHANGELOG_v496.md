# MediaFlow v496 Beta — Unified Living Themes Renderer

Visual Evolution milestone v496 builds on the v484–v495 palette and artwork-intelligence foundations. The new renderer composes a single protected, source-aware atmosphere for **Advanced** and **Custom**. **Legacy remains exactly the original engine.**

## Unified composition

- Intercepts the existing `mf484ApplyAtmosphere` at the last runtime extension so the original owner-safe v485 renderer still runs first. It never applies a different palette or writes image-derived color roles.
- Computes a deterministic scene plan from the already protected primary, secondary and tertiary colors and, where available, **pixel-verified v490 artwork atmosphere hints**.
- Provides visual layers for multi-point gradients, diffuse/directional ambient lighting, depth, material highlights, textures, organic soft forms and restrained particles, all within the existing `mf484-atmosphere` host.
- Uses source-aware but conservative composition: if verified artwork mood is unavailable, derives behavior from current palette colors rather than inventing artwork meaning.
- Uses existing Living Themes controls for `Off / Basic / Advanced`, `Subtle / Balanced / Vivid`, Intelligent/Custom source, allowed effects and performance mode.
- Honors manually disabled effects. Basic is gradients/lighting only; Advanced can include additional effect families, capped at six concurrent layers.
- Reduces the layers to at most three in Optimized mode and on small screens with Auto performance, and avoids particles, organic and depth in those cases.
- Respects reduced-motion and data-saver preferences. Static composition is retained when animation is disallowed.
- Reuses identical plans instead of tearing down/recreating DOM animation layers after routine app renders.
- Stores no image data or raw cover URL in renderer status. It uses v495's hashed artwork identity and v485's revision to detect relevant source changes.
- Does not add timers, network providers, canvas reads, new paid dependencies, database migrations or duplicated media records.

## Owner, profile and compatibility safety

- Advanced continues to follow currently selected Theme Collection/cover, priority and rotation settings; v485 remains the final protected palette-write guard.
- Custom image/hybrid uses its own selected Studio image and palette. Custom manual colors cannot inherit the previous artwork mood.
- The renderer never alters theme preview drafts or commits; v494 preview/apply/discard and v493 per-artwork corrections remain unchanged.
- The opt-in v496 CSS only activates on `data-mf496-renderer=on`. No new Legacy CSS rule is applied.
- Existing v491 readability contrast corrections remain the final authority for applied text, borders and surfaces.
- If Living Themes is Off, the renderer removes its own layers/properties; Legacy does not receive Unified renderer nodes.

## Appearance diagnostics

**Settings → Appearance → Theme Intelligence → Unified Living Themes Renderer** shows current mode, active layers, protected palette vs pixel-derived direction, motion/performance mode, composition count, reused renders and guarded attempts. The existing v484 Living Themes controls remain the source of truth.

## Validation, archive and release

- New deterministic `scripts/test-v496-unified-renderer.cjs`: owner modes, effect gating, performance reduction, reduced motion, Custom manual isolation, Legacy and no persistence writes.
- Version-aware v496 compatibility tests cover v495 pixel reliability, v494 preview, v493 corrections, v492 expressiveness, v491 readability, v490 mood, v489 harmony, v488 composition, v487 sampling, v486 sources, v485 ownership, v484 visual config, and v483 recovery scroll preservation.
- Build v496 modular JS with `scripts/build.py`, validate syntax, PWA cache/version consistency and repository integrity.
- Commit the full verified release project to `legacy/v/496`, merge to `main`, deploy GitHub Pages, and create numeric GitHub Release `496` with a full modular ZIP and SHA-256 checksum.

## Next milestone

**v497 — Living Themes Visual Direction & Material Intelligence:** further specialize glow, reflections, material finishes and cover-independent Custom motion while preserving a user-controlled, safe default and all three generation modes.
