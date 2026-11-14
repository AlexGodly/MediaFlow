# MediaFlow v430 Beta — Cover Recovery, Dashboard and Navigation Polish

**Base:** Personal MediaFlow v427 production. Use a new version to avoid overwriting historical v428 release and archived v429 work.

## Changes
- Redesigned Cover Recovery configuration popup with native theme colors, legible text, semantic icons, provider ordering controls, and responsive UI. Removed “MEDIAFLOW • VERSION 424”.
- Fixed native Settings Center section rendering: newly created DOM controls previously had no parent and were discarded, leaving empty Cover Recovery settings.
- Restored provider enable switches and priority ordering in Settings, along with mode, part size, continuation, selection, throttling, automatic resume, Cover XP and confirmation.
- Dashboard Missing Covers: full-width URL, organized responsive Find Cover / Edit / Skip / Save & Next action bar.
- New persistent opt-in: “Automatically save verified cover & go next”. Offered both in Dashboard and Settings. After scanning all selected providers, automatically save only when exactly one candidate has a validated external-ID and high confidence; otherwise display manual cover choices. Disabled by default.
- Cover Maintenance summary and Fix Missing Covers action spacing made responsive.
- Level/XP/streak progression control is created with accessible non-button markup to avoid generic circular-arrow icon on first render and later page refresh.
- All styling follows MediaFlow's existing theme tokens and mobile/tablet behavior.

## Preserved and deferred
- No changes to Supabase schema, personal Library, History, XP-award logic, Collections, Personal Order or account data.
- Existing public provider adapters and category-independent matching preserved. CORS-blocked and credential-only providers are not represented as working.
- Manual cover selection can still opt into protected external-ID linking.
- Expanded custom metadata fields and additional configured APIs remain deferred.
- MediaFlow Plus and MediaFlowApp untouched.

## Gates
JavaScript syntax, deterministic provider and legacy UI contracts, Settings attachment and search, v427 feature regression, 100k synthetic Library indexing, v430 Dashboard opt-in/verified-only checks, PWA/cache consistency, and GitHub Pages deployment.

**Beta:** Deterministic tests cannot promise third-party API uptime or exhaustive browser compatibility.
