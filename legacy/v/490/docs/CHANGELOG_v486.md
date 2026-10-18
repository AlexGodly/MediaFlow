# MediaFlow v486 Beta — Universal Cover Source Intelligence

Visual Evolution roadmap phase I, milestone v486. This update makes cover source discovery, fallback order, provenance and diagnostics consistent across all existing adaptive Theme Collections **without changing each collection's selection rules**.

## Shared artwork-source contract

A single resolver observes the final v162/v173 provider across all six existing source policies:

- **Dynamic Cover Theme**: preserves current recommendation/On This Day priority behavior, including random priority and forced On This Day selection.
- **Recommended Title Covers**: recommendation only, no On This Day substitution.
- **On This Day Covers**: On This Day only, retains the selected rotation index.
- **Recommendation + On This Day Picks**: selected sources only; no implicit readdition of unselected items.
- **Library Cover Themes**: preserves saved title IDs, order and interval.
- **Image URL Themes**: preserves saved URLs, order and interval.

A unified resolved-source record includes collection, source family, original label, stable source ID, cover fingerprint, ordered candidate position, and validity. Cover identity stays stable when a Library title's artwork URL changes, while the fingerprint detects a new image.

## Compatibility and reliability

- **Legacy mode receives the original source array and individual source objects unchanged.** No sorting, de-duplication, extra fetching, palette alteration or rotation-policy changes.
- **Advanced mode** uses an opt-in validation step that filters invalid cover URLs while preserving the relative order of valid fallback candidates and original source fields.
- Source diagnostics observe actual refreshes, not a second source lookup that would accidentally consume randomized/forced selection state.
- Records the source successfully applied, preferred-versus-fallback selection, changes in artwork/source configuration, and source errors.
- Leaves the existing last-good-cover and v485 palette recovery behavior untouched.
- Custom Studio remains independent of Library and Theme Collection cover sources.
- No new third-party service, provider request, Supabase migration, Library schema change or user-data copying.

## Settings: Universal Cover Source Intelligence

Added under **Settings → Appearance → Theme Intelligence**:

- Which collection is active and what selection policy it uses.
- Configured and currently available source counts.
- The actual resolved priority list and active source.
- Refresh interval, source-change and fallback counters.
- Safe manual *Refresh Cover Source* action.
- No full signed image URLs in the diagnostics interface.

Settings views remain consistent with the Settings Center's existing responsive layout and styling.

## Verification

- Executable Node regression exercises all six collection families, exact Legacy array identity and ordering, Advanced source validation, picker selection, fallback precedence, URL-change fingerprint tracking, no duplicate source discovery from diagnostics, and Custom isolation.
- Preserves v485 theme ownership, v484 schema, and v483 recovery-scroll compatibility tests.
- Verified modular JS bundle, service-worker/PWA version coherency, repository integrity, complete `legacy/v/486` archive and a numeric GitHub release with ZIP and SHA-256 checksum.

## Next milestone

**v487 — Advanced Artwork Pixel Analysis.** Improve artwork sampling, visual salience and dominant/accent color extraction, building upon the now-consistent source contract.
