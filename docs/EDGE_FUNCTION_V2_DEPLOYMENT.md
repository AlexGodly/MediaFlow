# MediaFlow v374 — SIMKL AUTH V2 Backend Deployment

- Date: 2026-10-11
- Project: `wgeijxfdpgehesxialxm` (`mediaflowcloud`)
- Function: `mediaflow-tracking-v374`
- Verified deployment: **ACTIVE, version 2**

## Changes in version 2

- Moves SIMKL authorization and token exchange to the `/oauth2` V2 endpoints.
- Uses OAuth PKCE `S256` even for confidential server applications.
- Requests `media:read media:write` scopes rather than implicit read-only access.
- Sends the PKCE verifier on the OAuth code exchange.
- Adds SIMKL refresh-token support for expiring V2 access tokens.
- Preserves MAL PKCE and existing authenticated tracking actions.

## Remaining activation steps

1. Rotate the previously exposed MAL and SIMKL client secrets **inside their respective developer accounts**.
2. Set `MAL_CLIENT_ID`, `MAL_CLIENT_SECRET`, `SIMKL_CLIENT_ID`, `SIMKL_CLIENT_SECRET`, `MEDIAFLOW_TRACKING_REDIRECT`, `TRACKING_TOKEN_KEY` in **Supabase Edge Function Secrets**. Do not commit credentials into the repository.
3. Deploy `tracking-callback.html` and the complete v374 website to the registered callback URL.
4. Connect test accounts in MediaFlow and verify live end-to-end authorization and sync.

**The account secret rotations and secret settings have not been performed.** The v2 deployment is active, but live OAuth has not yet been authenticated end-to-end.
