# MediaFlow v461 Stable — Background Processes Shortcut UI Hotfix

## Fixed
- Remove the unintended second eye icon appearing on the left of **Show / Hide Background Processes** in the floating **+** quick-action sheet.
- Fix the v226 semantic-icon pass that independently adds a "Show" or "Hide" eye to an action already containing its own themed, state-aware SVG eye.
- Preserve the intended **single eye inside the outlined icon tile** and the existing action title, subtitle, and shortcut number.
- Give the icon, label and number independent responsive flex sizing; allow labels to wrap naturally on desktop, tablet and 360px mobile without being clipped.
- Retain dynamic theme styles, keyboard focus, labels and screen-reader semantics.

## Unchanged
- All seven shortcuts, including the single Metadata Recovery shortcut.
- Background Processes cloud-backed Show/Hide preferences and active Cover/Metadata/Combined Recovery jobs.
- Provider locks, queues, checkpoints, title data and Supabase state.

## Validation and shipping
- Dedicated v461 shortcut regression test and Chromium desktop + 360px mobile checks.
- Re-run v460 behavior test and existing v459-v460 browser regression checks.
- Build a clean v461 bundle and PWA manifests, archive the complete source under `legacy/v/461`, and publish a numeric `461` release with ZIP + checksum.

Next planned update: **v462 — MediaFlow Recommends: External Ratings Integration**.
