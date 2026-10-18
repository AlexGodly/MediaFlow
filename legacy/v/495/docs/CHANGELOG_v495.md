# MediaFlow v495 Beta — Artwork Extraction Reliability, Cache & Consistency

Visual Evolution milestone v495. The previously shipped v494 Theme Preview Laboratory remains intact. This update hardens artwork pixel analysis, fallback and cache-health handling for Advanced cover themes and independent Custom image/hybrid profiles. The **default Legacy mode is unchanged**.

## Source-consistent pixel extraction

- A verified artwork result must contain actual pixel-sampled data, matching source image URL, at least three valid extracted hex colors, and credible image sampling counts; malformed or mismatched pixel results are rejected instead of incorrectly treated as authoritative.
- Share duplicate in-flight reads of the same artwork and theme owner; track read reuse without issuing extra image requests.
- Reject results from obsolete owner/generation or an explicitly invalidated image before they can be used downstream. The existing v485 source/palette owner remains the final theme-write authority.
- Guard the v487 global last-result reference when a late outdated request resolves, so it does not overwrite the last valid diagnostic sample.
- Temporarily cool down repeated failing/blocked sources using bounded adaptive intervals; unavailable sources return null to the existing source fallback pipeline, rather than masquerading as valid artwork.
- Track source-specific success, failure, invalid metadata, timeout/CORS and retry outcomes; health records and recent events are bounded in memory.
- Per-artwork fingerprinting uses a hashed source identity and owner mode; no raw signed artwork URLs are added to account settings, source ledgers, or UI reports.
- The diagnostic signature distinguishes detected focus and stored v493 corrections from pixel-cache identity, so changing focal choices or corrections does not unnecessarily invalidate verified raw pixel data.
- Retain last verified artwork only for diagnostics. Never substitute an unrelated previous cover into a different theme or override currently selected cover / Theme Collection.
- Preserve v487's existing bounded image cache, 128px analysis downsampling and 12-hour TTL; do not add network polling or paid services.

## New Appearance controls

**Settings → Appearance → Artwork Extraction Reliability & Cache** displays:

- Verified reads, failures, shared in-flight requests, retry cooldown skips, stale results and cache invalidations.
- Per-source verified sample count, confidence (a pixel-quality heuristic, not semantic artwork recognition), analysis version and current retry state.
- Read-only hashed last-verified source identity; previous results do not become fallback colors for a different cover.
- **Reanalyze Current Artwork:** invalidate only the active image's sample cache and trigger the existing guarded Advanced or Custom refresh.
- **Clear Retry Cooldown:** allow a previously failing source to be attempted again during its next normal refresh.

## Mode and data safety

- Legacy delegates to its original image extraction without any v495 behavior changes.
- Advanced preserves all collection source priorities, rotation intervals and fallback order.
- Custom image/hybrid uses only its own chosen image; manual-color-only Custom does not run cover analysis.
- Existing pixel-derived harmony, mood, color roles, corrections and preview laboratory remain untouched; v491 final readability still protects the applied palette.
- No new Supabase schema, copied media records, Library/History/Logging changes or new external dependencies.
- Runtime uses bounded short-lived tracking and no persistent image pixel storage.

## Verification

- Programmatically test concurrent identical requests, validation of pixel provenance, wrong-URL rejection, failure cooldowns, retry controls, stale generation invalidation, stale cache epochs, source-specific histories, independent Custom/Advanced and unchanged Legacy.
- Re-run v494 preview laboratory and v493 through v483 historical regressions.
- Rebuild v495 bundle, verify PWA version/cache coherence and repository health.
- Archive full source at `legacy/v/495`, merge to main, deploy GitHub Pages and publish numeric release `495` with complete project ZIP and SHA-256 checksum.

## Next milestone

**v496 — Unified Living Themes Renderer**: compose the existing visual-intelligence outputs into a unified, owner-safe renderer for future ambient gradients, light and materials, while preserving all existing theme modes.
