# MediaFlow v493 Beta — Advanced Cover Intelligence Diagnostics & Corrections

Visual Evolution roadmap milestone v493. Adds an opt-in, pixel-grounded palette correction workspace, keeping original Legacy behavior and all personal MediaFlow data intact.

## Cover Intelligence Correction Workspace

**Settings → Appearance → Cover Intelligence Diagnostics & Corrections**

- Current cover preview when artwork has a safe, readable HTTP(S) URL.
- Grounded explanation: measured sample count, dominant/background color, ranked coverage swatches, focal region, and detected visual mood.
- Five previewable choices **Automatic**, **Focal emphasis**, **Dominant artwork**, **Gentle harmony**, and **Distinct accents**.
- Each variant derives only from colors actually identified in the image or restrained tonal adjustments of those colors. No unrelated neon or invented complementary hue.
- Independent Primary, Secondary and Supporting accent roles selected from the sampled source-color pool, rejecting arbitrary or outdated colors.
- Sample UI composition preview with actual backgrounds, panels, text and readable action buttons. Preview does not change or persist the live theme.
- Explicit **Apply to this cover**, **Discard preview**, and **Reset cover** operations.
- Saved corrections use a bounded settings map keyed by hashed image identity and separate Advanced/Custom scope. They are stored in the existing settings persistence and account backup flow, without writing image URLs or duplicating Library entries.
- A source identity guard prevents a preview from being saved to a different cover if the artwork rotates before Apply.

## Integration and safety

- Selected colors flow into v489's harmony engine, v492's expressiveness system, and v491's final contrast check; the default legacy pipeline is untouched.
- v484 Custom image/hybrid profiles now pass through verified image source identity so the correction applies only to their selected image/profile. **Manual-color-only Custom profiles remain unaffected.**
- Existing v485 asynchronous ownership, v486 source priority and rotation, v487 pixel extraction, v488 focal override, and v490 artwork mood remain preserved.
- Restoring Automatic removes only this individual artwork's correction; other saved cover corrections and Custom profiles are retained.
- CORS/unreadable images cannot be claimed as verified; no correction is offered without an actual sampled image.
- No Supabase migrations, provider API changes, added paid services, Library/History/Logging mutations, or background polling.

## Verification

- Five image-grounded alternatives, coverage and sample diagnostics.
- Preview-only behavior, explicit persistence, correct regeneration, selective reset, and per-cover identity separation.
- Stale artwork prevention, invalid saved-color rejection, no raw image URL in correction settings, and independent Custom scopes.
- Legacy isolation, manual-only Custom exclusion, previous v492 expressiveness, v491 contrast, v490 mood, v489 harmony, v488 composition, v487 pixel, v486 source, v485 ownership, v484 visual, v483 recovery regression tests.
- PWA version coherence, bundled JS syntax, repository integrity, archived full modular source at legacy/v/493, and numeric GitHub Release 493 with ZIP and SHA-256 checksum.

## Next milestone

**v494 — Theme Preview Laboratory & Comparison**: richer side-by-side real-component theme previews, candidate comparison, and adjustments before applying without disrupting currently active styles.
