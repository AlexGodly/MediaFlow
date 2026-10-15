# MediaFlow v428 — Future Provider Setup (side note)

This file is **developer documentation**, not a MediaFlow settings page. The source registry is `src/js/providers/v428-provider-registry.json`.

- Every provider starts `enabled: false` in the declarative registry, including public adapters. Actual runtime public providers continue to use the existing v424 / v380 adapters or tested v428 modules; this registry does not enable a provider automatically.
- Providers requiring API tokens, OAuth, registration, licensing or approval have `requiresSetup: true`, `publicUi: false`. Keep them hidden from all provider pickers while unconfigured.
- Future implementation must validate credential presence **on a secure server**, validate API authorization and scope, then explicitly enable the adapter after integration testing.
- Never put bearer tokens, client secrets, paid keys or OAuth refresh tokens in GitHub Pages files, client-side config, localStorage, service worker, exports or IndexedDB. Use authenticated server-side secrets and an access-controlled proxy/Edge Function if a provider needs secrets.
- A disabled/restricted/unavailable source must not count as zero releases, and mapping/bibliographic/cover-only sources must never be reported as live release feeds.
- Reuse a single connection for covers, metadata, and Fresh Releases whenever its lawful capabilities overlap.
- Public adapters still need live CORS, rate-limit, API-terms and release-evidence verification before being reported as operational.
- No provider credentials, subscriptions, Supabase Edge Functions or schema changes have been added in v428 preparation.

## Setup activation checklist

1. Review provider terms and capabilities; acquire authorized credentials or a permitted feed/instance URL.
2. Implement the relevant source adapter and its field mapping; test stable title ID matching.
3. Configure secrets only in a protected backend environment (using the manifest's envPrefix as a naming hint, not as a guaranteed API schema).
4. Test authentication, errors, rate limits, cooldowns, attribution, CORS and authorization.
5. Enable the adapter in code, run integration tests, then expose it in applicable user-facing provider menus.
6. Confirm detection returns Unknown when evidence is incomplete and deduplicates identical releases.

This side note is cumulative: append future providers to this registry and guide.
