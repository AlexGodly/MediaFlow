# MediaFlow v460 Stable — Quick Actions Cleanup & Background Processes Visibility

## Floating + shortcut fixes
- Resolve the duplicate **New Metadata Recovery** entries introduced when the v441 floating action and v447 universal shortcuts were composed.
- Keep exactly one Metadata Recovery entry, preferring the current Unified Recovery Workspace shortcut (and preserving the fallback when that newer shortcut is disabled).
- Preserve **New Cover Recovery**, **New Combined Recovery**, Add to Logging, Add to Library, and Add Collection, in the existing theme-aware, mobile-scrollable action sheet.
- Add a direct **Show Background Processes / Hide Background Processes** shortcut with appropriate eye icons and up-to-date text, even when Settings changes the visibility independently.
- **Show** makes the unified floating widget visible immediately, including when no recovery is active; **Hide** persists hidden state while jobs continue working normally.

## Persistence and safety
- Route visibility through v441's existing `mf441SaveSetting('visibility', ...)` and cloud-backed settings.
- Leave active Cover, Metadata and Combined Recovery workers, state, locks, checkpoints and Supabase data untouched.
- Respect Recovery Workspace visibility preferences; the shortcut reads the actual visibility rather than assuming that Automatic means the widget is displayed.

## Quality gate and release
- Deterministic action-count and show/hide state tests; run previous v455–v459 recovery and browser regression checks.
- Chromium desktop and 360px mobile: exactly one metadata shortcut, a single visibility shortcut, no regression in prior recovery flows.
- Produce versioned site bundle and PWA assets; archive the complete modular source under `legacy/v/460`; publish release tag `460` with ZIP and checksum.

Next planned feature: **v461 — MediaFlow Recommends: External Ratings Integration** (shifted from v460 by this requested fix).
