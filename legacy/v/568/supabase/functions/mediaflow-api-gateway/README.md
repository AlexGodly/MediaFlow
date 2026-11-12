# MediaFlow v434 — Secure provider gateway

This source is for **Personal MediaFlow only**. The Edge Function accepts an authenticated JWT from MediaFlow's Supabase session and strict JSON operations (status or search). It never accepts arbitrary request URLs, mutates user data, or returns provider credentials.

Migration: supabase/migrations/20261015_v434_gateway_quota.sql. The atomic quota uses daily global and user/provider limits; Watchmode is capped at 15 total searches/day and 4 per user/day to preserve credits. No search titles are stored.

Search-enabled cover adapters: TMDB, OMDb, Fanart.tv (known ID required), MAL Official, AnimeSchedule, EpisoDate, Gutendex.

Search-enabled mapping adapters (ID-only, not artwork): Trakt, Metron, Watchmode. Hardcover remains in schema/credential-ready status pending review of its GraphQL query access and permissions. Restricted Comic Vine, SIMKL, AniDB, Marvel, TheTVDB and direct MangaDex remain disabled. Podcast Index is excluded by user request.

Images remain direct HTTPS references to approved artwork hosts. Gate access, copyright, image use, attribution, individual subscription/licensing and commercial limitations must be respected before enabling automated bulk queries.

Deploy with **verify_jwt=true**, never disable it. Supabase-provided service role and configured API key secrets stay server side. Endpoint: POST /functions/v1/mediaflow-api-gateway. Default UI policy: manual provider testing and explicit opt-in before bulk use.
