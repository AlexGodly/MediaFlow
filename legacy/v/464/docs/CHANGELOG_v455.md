# MediaFlow v455 — Unified Recovery Execution, Quick Cover Saves & Controls

User-requested update after v454 Stable. Planned MediaFlow Recommends external ratings shifts to v456, with subsequent releases moving accordingly and none of the promised features dropped.

## Quick recovery (Cover, Metadata, Both)
- Enforce readable, full-width vertical cover cards: thumbnail over title, then provider/match evidence. Narrow phone widths never put text in a single-letter column. No generic circled-arrow icon.
- Display multiple loadable cover candidates, including uncertain title matches clearly labeled **Unverified match — review carefully**. Verified status requires an external-ID match. Explicit review before saving unmatched candidates; replacing existing artwork always requires confirmation.
- Confirmed cover writes use canonical saved title coverUrl, coverSource and modifiedAt, persist through Library and cloud storage, and verify the saved value before reporting success.
- Save cover separately from verified metadata proposals: failure of a metadata merge does not undo a successfully saved cover.

## Unified Recovery Workspace
- Cover, Metadata and Recover Both share **Recover selected titles**; no redirect to the old Cover configuration popup.
- Direct launches build durable v424/v442 jobs using selected scope, real providers, safe leases, checkpoints and matching. Both runs covers first, then verified metadata from the same snapshot without reopening the legacy Cover setup.
- New jobs safely pause running work and replace prior unfinished queues. Completed Library changes remain saved; cross-tab ownership is never stolen.
- Background Processes immediately shows new job, actual completed/total counts, status and current title. Readability improved.
- Search provider lists and categories within all modes. Auto-preselect Recovery Presets when scope maps to one category or selected titles all share one category. Mixed categories use global defaults.
- Provider choices become per-job snapshots instead of modifying global preferences.

## Processing & matching
- Three independent processing panels, in Unified Workspace and recovery Settings: Part-by-Part / One-Go; Titles per part Continuation / Automatic / Manual with count; continuation; Hybrid / Smart Automatic / Provider Priority / Manual Selection; Rate-limit Safe / Balanced / Custom (provider limits enforced); resume when app reopens.
- Cover provider priority and manual review stay protected. Metadata adds per-title manual review/skip and manual part-boundary checkpoints.
- Dynamic theme and mobile/tablet responsiveness; existing providers still enforce credentials, limits and verification.

## Safety and delivery
- No modification to XP, personal progress, ratings, collections, or Supabase schema.
- Deterministic tests for cover URL saving, queues, provider presets, direct cover/metadata start and engine safeguards; desktop and 360px Chromium checks.
- Full archive under legacy/v/455, numeric GitHub Release 455 with ZIP and SHA256 after deploy.
