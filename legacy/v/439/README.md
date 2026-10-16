## MediaFlow v439 — Metadata Recovery Engine

This is the v439 personal web/PWA edition of MediaFlow by Alex Godly.

- Recover missing title metadata field-by-field from implemented, public or configured providers.
- Fix Metadata in Add/Edit Title and Title Details, plus a dedicated Metadata Recovery Settings section.
- Recover synopsis into the **existing** imported synopsis field, combine verified title metadata, keep separate external ratings and original scales.
- Exact-title/year/ID confidence checks, visual source comparison, conflict review, and strict preservation of existing and protected fields.
- Safe, explicitly selected batches with checkpoints, pause and resume; Cover Recovery and fresh releases are unchanged.
- Use existing authenticated Supabase API gateway for TMDB, OMDb, MAL Official, Trakt, SIMKL and other pre-existing verified adapters; reuse MediaFlow credentials without redeploying the live gateway.
- v439 implements actual metadata adapters for a subset of v438's 60 cataloged providers. Others remain pending until safe working adapters are added.

See [v439 release notes](docs/CHANGELOG_v439.md). Each full project snapshot is archived under `legacy/v/<version>/`, outside the deployed Pages site.
