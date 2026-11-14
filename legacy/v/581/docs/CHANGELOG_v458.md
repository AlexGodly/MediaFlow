# MediaFlow v458 Stable — Recovery Confirmations & Quick Recovery

## Recovery replacement confirmation
- Bring the confirmation above Unified Recovery Workspace and the Quick Recovery dialog using a dedicated top-level overlay.
- Improve the confirmation footer so **Replace Queue & Start** is visible, readable, and clickable on desktop, tablet, and narrow mobile layouts.
- Label combined jobs **Cover + Metadata Recovery** rather than incorrectly showing only Metadata Recovery.
- Preserve the existing confirmation choice, lease arbitration, checkpoint and queue safety. No job starts until its user confirmation is approved.

## Metadata suggestion selection
- Add **Select All** and **Deselect All** to the verified metadata suggestions panel in both Metadata and Cover + Metadata Quick Recovery.
- Show selected/eligible suggestion counts.
- Exclude protected, unchanged, existing and source-less suggestions from bulk actions.
- Preserve the user's scroll position as the suggestions and cover candidates update.

## Earlier cover confirmation
- Cover Quick Recovery: permit selecting and confirming an already loaded/verified cover while other cover providers continue searching.
- Combined Quick Recovery: permit confirming a selected cover while some cover sources remain pending **only after metadata retrieval finishes**.
- Continue to validate artwork URLs, provider matches and external-ID safety on save.
- After user approval, cancel unneeded cover scanning. Existing cloud/library saving, independent cover/metadata merge protection, and safe close behavior are preserved.

## Verification
- Run standalone tests covering selection protection, early-save eligibility, metadata scan completion, and confirmation style integrity.
- Run desktop and 360px Chromium browser tests for layering, button visibility, quick metadata controls and early-save state.
- Preserve prior recovery, provider, metadata, data integrity, gateway and performance checks.
- Archive the full verified version in `legacy/v/458` and publish release tag `458` with ZIP and SHA-256 checksum after a successful Pages deployment.

**Note:** Live authenticated Supabase/provider recovery still needs user-account end-to-end verification.
