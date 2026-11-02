# MediaFlow v452 Stable — Recovery Provider Bulk Controls & Semantic Actions

A user-requested v452 UI/behavior hotfix on v451. The previously planned
MediaFlow Recommends external ratings integration moves from v452 to v453;
subsequent release versions shift accordingly, without dropping any work.

## Cover / Metadata / Recover Both provider selection
- Replace ambiguous "Enable available" / "Disable all" buttons with explicit,
  accessible **Select All** and **Deselect All** controls, with distinct
  multi-checkbox icons.
- Use each respective engine's enabled and available providers: Select All
  only enables currently available providers; Deselect All clears all enabled
  providers, including entries not available due to missing configuration.
- Both mode independently controls cover and metadata providers. Toggling a
  provider or either bulk action keeps the Recover Both tab selected and
  rerenders the correct provider list and count.
- Settings persist through the existing saveState and v446 preference models.
- Mark custom-icon buttons as already iconified so the generic v225 icon
  enhancer does not prepend its unrelated circled-arrow icon.

## Remove redundant Fix Metadata
- Drop the one-off Fix Metadata action from Add/Edit Title (saved and draft)
  and Title Details / Anime Details.
- Keep **Cover Recovery**, **Metadata Recovery** and **Recover Both** visible
  and functional; preserve per-title context and safe draft disabled state.
- No removal of universal metadata fields, ratings, or the actual recovery
  preview/engine.

## Background Processes stopping
- Expose **Stop Now**, **Stop After Title** and **Stop After Part** on active
  Cover Recovery and Metadata Recovery rows, with individual semantic icons.
- Cover stop-after-title waits for its current title's durable save and cursor
  checkpoint before stopping. Cover stop-after-part uses the existing
  configured cover part boundary.
- Metadata stop-after-title waits until its in-flight title is saved and
  checkpointed. Metadata stop-after-part uses its configured metadata
  batchSize as part size (25 titles by default); boundaries work even when
  a Library ID no longer exists.
- Preserve v451 immediate Stop All, Discard Queues, manual resume, cross-tab
  process leases, provider caps, recovery locks and safe-write semantics.
- Replace incorrect v451 icon fallbacks in Stop, Stop All and Discard Queues
  with dedicated recognizable vector icons, including Settings workspace.
- Stopped jobs remain stopped until the user chooses Resume.

## Release controls
- Test provider enable/disable persistence, tab retention, selective removal
  of Fix Metadata, stop-after boundaries, and icon specificity.
- Run v437–v451 regressions, secure gateway typecheck, desktop/360px Chromium
  UI smoke, service-worker regeneration, full legacy/v/452 source archive,
  and numeric v452 Stable release with ZIP and SHA256.
