# MediaFlow v457 Stable — Recovery Interaction Reliability

## Quick Recovery and Edit Title
- After a successful confirmed Quick Cover, Quick Metadata or Quick Both save, dismiss the currently open Edit Title for the same saved title when Quick Recovery closes.
- Never dismiss Edit Title for Cancel, a failed save, an unsaved new title, or a different title.

## Unified Recovery Workspace
- Preserve the user's dialog/pane scroll position and focus when categories, statuses, or scopes redraw.
- Keep one **Recover selected titles** primary action in each of Cover Recovery, Metadata Recovery, and Recover Both. Remove the old metadata preview/duplicate action from the primary action region, not merely hiding it.
- Use a direct click event handler to call the existing safe direct launcher for each mode.
- Expose launch progress immediately, and report startup exceptions with a visible reason.
- Allow a user to click even if scope/provider selection is invalid, so validation can explain what needs fixing instead of displaying a disabled inert button.

## Safety and testing
- Keep v424/v439 provider adapters, verified change merges, credentials, checkpoints, persistence, and recovery locks unchanged.
- Run deterministic regression tests for confirmed editor dismissal and cancellation, plus real Chromium desktop/360px interactions for all three launch controls and scroll retention.
- Preserve existing v455/v456 regression coverage and a complete archived source at `legacy/v/457`.

**Note:** Live cloud recovery under the user's Supabase account still requires an authenticated end-to-end verification.
