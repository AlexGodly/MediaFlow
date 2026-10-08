# MediaFlow v252 — Seasons View & Season-Aware Logging

MediaFlow v252 introduces an optional per-title **Seasons View** for episodic titles. Seasons remain a visual/manual layer when entered by the user, but MediaFlow can also consume season metadata from supported service imports when the source provides it.

## Per-title Seasons View
- Titles can now store multiple season rows with:
  - season number/name
  - season progress
  - season total
- Seasons View is optional per title.
- Season rows can be added, edited and removed from Edit Title.
- Title Details now displays a season breakdown with per-season progress.
- Title Details can open a dedicated season editor.
- While Seasons View exists, the title-wide Progress and Total are derived from the season rows so the two views cannot silently drift apart.

## Season-aware Last Progress logging
- Normal logging in **Last progress** mode detects titles with season metadata.
- A **Seasons View** control lets the user switch between title-wide progress and Season + Episode input.
- Selecting a season and last watched episode converts the local season position into MediaFlow's existing aggregate progress.
- Example: a title at 34/42 with Season 5 beginning at episode 35 can log **Season 5 · Episode 3** as aggregate **37/42**, producing **+3 episodes**.
- After logging, the affected season and the aggregate title progress stay synchronized.
- Existing repeat/rewatch semantics remain intact; repeat logs do not overwrite completed Library progress.
- History title entries can retain season metadata for season-aware logs.

## Import support
- Import normalization can consume per-season progress/totals when a supported service provides them.
- Simkl-style `seasons` metadata is supported by the v252 import normalization path.
- v252 avoids treating a watched-only episode list as a complete season total unless the source actually exposes trustworthy total/full-list information.
- Imported season rows are merged without overwriting explicit manual season rows.
- When aggregate imported progress/total exceeds the season metadata provided by the source, MediaFlow can preserve the difference in an **Unassigned** season row so totals remain mathematically consistent.

## Persistence and compatibility
- Season rows live on the Library title object and participate in cloud snapshots.
- Cloud merge handling explicitly preserves the newest season state and can match older/imported copies by title/category when local IDs differ.
- Full Backup includes season rows and v252 season-coverage metadata.
- Generic MediaFlow exchange JSON rows include season metadata for round-tripping.
- Existing History export keeps season-aware title metadata through its rich title/session JSON fields.
- No persistent schema bump was required:
  - Cloud Sync: v201
  - Full Backup Schema: v29
  - Settings Preset Schema: v1
  - Personal Order Export: v4

## Responsive UI
- Season editing, Title Details season lists and season-aware logging are responsive across desktop, tablet, mobile and very narrow mobile widths.
- Regression validation covers 820px, 390px, 320px and 280px widths without horizontal overflow.

## PWA / release pipeline
- MediaFlow version advanced to **252**.
- PWA cache advanced to **mediaflow-pwa-v252-shell-v1**.
- Existing PWA diagnostics, cache repair, update-system separation and managed updates remain preserved.

## Validation
- Added `scripts/smoke-v252.py`.
- v252 smoke validates:
  - title-details Seasons View
  - Edit Title season editor
  - derived aggregate Progress/Total
  - Season 5 Episode 3 → aggregate 37/42 +3 example
  - automatic season update after logging
  - repeat/rewatch safety
  - Simkl season metadata normalization
  - cloud/full-backup/exchange season persistence
  - responsive overflow at 820/390/320/280px
- Existing v246, v247, v249 and v250 regression tests remain passing.
