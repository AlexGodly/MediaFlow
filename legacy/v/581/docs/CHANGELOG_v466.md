# MediaFlow v466 Stable — Smart Automatic Recommended-Title Metadata Refresh

## Automatic title-specific provider checks
- Recommended title can automatically recheck verified external ratings and vote counts, supported metadata and missing External IDs without scanning the whole Library.
- Configurable Settings → Title Recommendations refresh intervals: Off, 6h, 12h, 24h (default), 3d or 7d. Independent checkboxes for ratings, metadata and missing external IDs.
- Refreshes while MediaFlow is open, retries overdue checks when reopened, and offers **Refresh now** on the recommended title. An ordinary static GitHub Pages site cannot run dependable refresh jobs while all user sessions are closed.
- Visible status: currently checking provider, last checked time, changes, and errors. Updates the displayed recommendation rating tiles without rerolling.

## Safety, confidence and cloud
- Reuses configured v439/v450 metadata adapters and per-field evidence, provider cooldowns and v442 same-account process leases. Maximum four ready providers per check; never starts a duplicate recovery while another recovery owns the process.
- Only verified, exact record-ID/title matches or exact title + year may update scores/metadata. Existing provider-owned values update only from the same verified provider/record ID. Conflicts, mismatched titles, existing or manually protected fields and personal ratings are preserved.
- Missing metadata is still filled through v439's original high-confidence, idempotent automatic proposal engine.
- External IDs are **filled when missing** from verified matching records; existing saved IDs are never replaced or deleted. Conflicting ID candidates are skipped.
- Save state once per check and persist bounded per-title timestamps through existing cloud settings. No new provider credentials, separate database tables or third-party services.
- Dynamic themes and responsive dashboard/settings layouts preserved.

## Verification
- Deterministic tests for settings, intervals, manual and automatic eligibility, original data protection, trusted rating update and last-check stamps.
- Chromium desktop and 360px mobile, plus full v462–v465 recovery/UI regression.
- Archive complete source under `legacy/v/466`; numeric tag `466`, ZIP and SHA256 after Pages deploy.

## Operational notes
- Provider data changes only when an enabled ready adapter supplies valid newly verified information; unavailable/rate-limited providers remain unchanged.
- A completely closed site has no scheduler. Server-side scheduled refresh would require a separate secure backend and permission/configuration.
