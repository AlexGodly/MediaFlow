# MediaFlow API Gateway — v433 staged foundation

**Not deployed and not activated in v433.** Cover Recovery and Find Cover continue using their already-tested browser providers.

This one modular function will eventually host authenticated, provider-specific routes for key-dependent metadata/artwork searches. v433 only provides an authenticated **status** action and fail-closed placeholders. It does **not** load TMDB, OMDb, Fanart.tv, Trakt or other provider secrets or call their APIs.

## v434 activation gates
1. Verify each provider's API terms, rate limits, commercial-use and artwork attribution conditions.
2. Verify needed Edge Function Secrets were added directly in the Supabase dashboard, without ever committing values.
3. Implement per-provider adapters with exact allowed destinations; never accept arbitrary user-supplied target URLs.
4. Add authenticated user-scoped quotas, global rate-limit storage/cooldowns, bounded requests, and small JSON responses.
5. Test with live representative real titles under controlled quotas. Keep adapter disabled on errors.
6. Deploy with JWT verification enabled. Add a separate authenticated browser client only after passing integration tests.
7. Ensure original image URLs are used only where the provider permits direct access; never bulk proxy images.

The v433 deployment deliberately does **not** create or change any Supabase Edge Function or database tables.
