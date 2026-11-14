# MediaFlow v438 Stable — Unified API Providers & Testing

Phase 2 of the v437–v442 metadata and recovery roadmap.

## Dedicated API Providers & Testing Settings
- Add **API Providers & Testing** as a proper category in MediaFlow's canonical Settings Center (searchable, pinnable, desktop/mobile compatible).
- Relocate the existing authenticated **Configured API Connections** testing panel out of Cover Recovery. The old Supabase gateway, credential storage and verified-provider approvals are reused directly, not copied or reset.
- Cover Recovery retains **its own Enabled Cover Providers & Priority**, retry/selection, rate protection and recovery controls. API testing is no longer duplicated inside it.
- Introduce a unified, deduplicated directory merging existing Cover Recovery definitions, registered providers and selected public/research providers across anime, manga, movies, TV, books, comics, video games, visual novels, music/albums and interactive fiction.
- Search/filter providers by capability, media type and availability. Show cataloged capabilities separately from implemented request adapters and previously verified connections.
- Support opt-in manual read-only connectivity probes for a conservative set of public endpoints, with strict allowlists, bounded payloads, timeouts, per-provider cooldowns, no automatic polling and truthful failures. Tests do not activate unused services.
- Continue using the existing authenticated gateway for key-based providers, with preserved Supabase secrets, v434 approval data and request quotas.
- Gateway status refreshes update the unified directory. A previously saved test cannot masquerade as a newly successful test.
- Ensure custom Library category names never restrict manual provider discovery.

## Safety and boundaries
- **Catalog entry is not live support**. Some providers still require keys, licensed access, CORS compatibility or an approved adapter. Their state is shown as pending; no fake "connected" status.
- External ratings, descriptions/synopses and metadata are **not recovered automatically** in v438. Provider-to-title mapping and safe write paths remain for v439.
- No external API writes Library titles, personal ratings, tracking progress, History, collections, XP or credentials.
- Versioned Library metadata from v437 is preserved; no live SQL migration or new API key is required.
- Canonical full backup release stamp advances to 438; existing saved provider verification and Cover Recovery preferences carry forward.

## Quality gates
- Provider catalog/authority tests, no eager API requests, missing-credential fail-closed contracts, Settings Center registration and Cover Recovery relocation.
- Existing v433–v437 gateway, cover recovery and metadata preservation regressions.
- Node bundle syntax + Supabase gateway Deno typecheck, real Chromium desktop and 360px mobile provider panel smoke tests.
- Full archive at `legacy/v/438`, numeric tag `438`, changelog, SHA-256 checksum and GitHub Pages deployment.

## Roadmap
v439: Metadata Recovery Engine · v440: Cover Recovery expansion · v441: Recovery interfaces · v442: Integration and performance.
