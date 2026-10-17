# MediaFlow v453 — Quick Title Recovery & Category Presets

This user-requested release follows v452. Planned Recommends external-rating integration moves to v454; all later releases shift without dropping features.

## Provider selection repaired

- Repair malformed, unescaped quotation marks in generated HTML onclick/onchange handlers in both Select All/Deselect All and individual provider checkboxes. Previously the browser truncated their handler arguments.
- Enabled selections remain independently saved for Cover and Metadata providers in Cover, Metadata and Recover Both.
- Provider rows can be preselected even while access or adapter setup is pending. Such providers remain visibly pending and cannot be used until a real adapter, credentials and any necessary approvals are available.
- Refresh API access while keeping the recovery configuration and scope open. Configured gateway providers do not need an additional manual Test API action.

## Recovery Presets

- Add a dedicated Recovery Presets Settings section, with a link under Recovery Workspace.
- Each Library category can select separate cover and metadata providers. The category icon and name are shown.
- Select available, Deselect all, and Use global are available independently for each engine.
- Settings save as v453RecoveryPresets with existing cloud/settings persistence. They are inherited by title quick recovery without modifying global provider settings.

## Quick per-title Cover / Metadata / Both recovery

- Saved-title recovery shortcuts in Add/Edit Title and Title Details open a quick comparison dialog, rather than the entire multi-title recovery configuration.
- Show validated cover candidates, source, match strength and existing cover.
- Show new metadata and external rating suggestions alongside original values, verification evidence, protected-state indicators and per-field confirmation.
- Combined quick recovery displays cover and metadata candidates in the same confirmation flow. Nothing is written until explicit confirmation; replacing a current cover requires a separate confirmation.
- Keep existing v439 verified matching, field protection and missing-only metadata writes. Use v451 safe handoff for active local background processes; respect cross-tab ownership.
- Bulk recovery, API quotas, manual review, cloud sync and account checks remain separate and unchanged.

## Validation and delivery

- Regression tests for real HTML attribute execution, provider settings persistence, pending setup, preset inheritance, quick title preview and no-write-until-confirmed.
- Rebuild PWA and service worker, check older recovery tests and Chromium desktop/360px mobile.
- Archive the complete site in legacy/v/453 and publish GitHub Release 453 with ZIP and SHA-256.
