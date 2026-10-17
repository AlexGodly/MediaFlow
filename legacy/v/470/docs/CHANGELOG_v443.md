# MediaFlow v443 Stable — Automatic Provider Availability

## Scope
- Remove the historical “Test API before enabling” prerequisite for both Cover Recovery and Metadata Recovery.
- Automatically resolve the authenticated Supabase gateway status on demand when opening Cover Recovery, running its instant picker, or entering Settings; Metadata Recovery independently resolves status before a gateway lookup.
- Enable only **genuinely configured and approved gateway request adapters**; never treat catalog-only or credentialless placeholders as working.
- Keep every registered cover provider visible in Cover Recovery settings, including providers awaiting setup or a functioning adapter; label those limitations clearly.
- Keep every supported metadata provider visible and configurable, even when a gateway credential is missing; missing credentials are shown instead of requiring a saved test.
- New/default Cover Recovery selections automatically include currently configured eligible gateway cover sources. Migrate unchanged default selections once without overriding custom provider preferences; a manually disabled provider stays disabled.
- Keep the API testing interface for optional connection diagnostics. A failed optional test must not revoke an otherwise authorized adapter.
- Refresh on-screen provider status and preferences after obtaining gateway capabilities. Cache status per account for five minutes to avoid excessive requests and refresh explicitly only on user action.
- Preserve authenticated gateway access, secret isolation, title-ID matching, rate limits, request quotas, safe recovery merges, local-browser process leases, progress, user ratings and all other v442 guarantees.

## Verification
- Dedicated v443 source build and Node syntax checks.
- v443 deterministic gateway/default-selection/account-isolation tests plus all supported prior recovery regression tests.
- Supabase gateway source type check, 100K Library safety regression, desktop and 360px Chromium boot smoke.
- Full source archive at `legacy/v/443`, numeric release `443`, project ZIP and SHA256 checksum.

## Not in this release
The shared Cover + Metadata popup redesign, Auto-Fill button, selected-title Metadata Recovery shortcut, external ratings in Recommends and Universal Fresh Episodes engines are separate future updates. This release makes the existing working adapters usable without requiring a prior manual test. It does not add new provider credentials or integrations.
