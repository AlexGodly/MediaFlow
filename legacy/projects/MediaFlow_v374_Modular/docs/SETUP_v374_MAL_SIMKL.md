# MediaFlow v374 — MAL and SIMKL Setup

**Do not paste API secrets or account passwords into ChatGPT, GitHub, or a public web page.**

This release requires a one-time backend deployment. The web app works without it but displays an informative tracking setup error; no MAL/SIMKL calls are made from browser JavaScript.

## 1. Verify the Supabase project

The supplied **v373 source** uses the public Supabase project URL:

`https://wgeijxfdpgehesxialxm.supabase.co`

**Confirm this is the actual deployed MediaFlow project before doing anything to a database.** An earlier project can have a different reference. Never apply the migration to the wrong project.

Create a database backup first. A same-database backup is not a substitute for an independent off-site export.

## 2. Database migration

Apply `supabase/migrations/20261011000000_mediaflow_v374_tracking.sql` **once** to the verified Supabase database through SQL Editor or an established migration workflow.

The migration creates four new v374-specific tables; it does not rewrite Library, Consumption History or XP. All tables have RLS enabled. Account credentials, OAuth challenges, and pending jobs have no direct public or authenticated-client table access. Tracking link metadata is read-only for the authenticated owner.

If you already have objects with those names, review them before applying or altering them.

## 3. Register MAL and SIMKL developer apps

MAL API registration: https://myanimelist.net/apiconfig  
SIMKL registration: https://simkl.com/settings/developer/new/

Use the name **MediaFlow**, your app website **https://alexgodly.github.io/MediaFlow/**, and the **exact redirect URI**:

`https://alexgodly.github.io/MediaFlow/tracking-callback.html`

The URL must be byte-for-byte identical to the server configuration and registered callback. If your production MediaFlow URL is different, replace the URL in the registration and server config accordingly.

## 4. Secrets (Supabase → Edge Functions → Secrets)

Configure the following protected environment variables:

| Variable | Required value |
|---|---|
| `MAL_CLIENT_ID` | MAL developer application Client ID |
| `MAL_CLIENT_SECRET` | MAL developer application Client Secret |
| `SIMKL_CLIENT_ID` | SIMKL app Client ID |
| `SIMKL_CLIENT_SECRET` | SIMKL app Client Secret |
| `MEDIAFLOW_TRACKING_REDIRECT` | `https://alexgodly.github.io/MediaFlow/tracking-callback.html` |
| `TRACKING_TOKEN_KEY` | One stable base64-encoded, **32-byte random key** |

You can generate a random encryption key locally with:

```bash
python -c "import secrets,base64;print(base64.b64encode(secrets.token_bytes(32)).decode())"
```

**Keep `TRACKING_TOKEN_KEY` backed up securely. Losing or changing it makes previously encrypted provider tokens unreadable; users would have to reconnect.**

Supabase injects the project URL and service-role/secret keys into hosted functions. Never put secret keys in `index.html` or `tracking-callback.html`.

## 5. Deploy Edge Function

Deploy `supabase/functions/mediaflow-tracking-v374/index.ts` to the **verified** project.

The included `supabase/config.toml` disables gateway JWT verification only for this function because an OAuth redirect from an external browser needs to redeem a one-time state. The function **independently validates the Supabase user JWT on every other action**. Its callback only accepts an unexpired, unpredictable, one-time OAuth state.

With a linked Supabase CLI project, the equivalent deployment command is:

```bash
supabase functions deploy mediaflow-tracking-v374 --no-verify-jwt
```

No credentials should be committed into this repository.

## 6. Deploy v374 GitHub Pages project

Deploy the complete modular web app, including `tracking-callback.html`, `assets/css/194-v374-media-services.css`, and `assets/js/mediaflow-v374.bundle.js`. The build has synchronized service worker assets to v374.

Then sign into MediaFlow, go to Settings → Media Services, connect accounts, and open Add/Edit/Anime Details → Tracking. Select **Assign title**; newly linked titles start **paused** and require manual activation.

## 7. Initial sync safety

- Linking alone makes **no updates** to MAL or SIMKL.
- Enable progress/status/rating only after checking which remote entry was assigned.
- Existing remote data is **never pulled into MediaFlow automatically**.
- MAL can receive absolute episode/chapter progress; SIMKL receives precise episode events. An ambiguous total is not fabricated into SIMKL history.
- `Sync Now` for SIMKL cannot fabricate already-watched episodes from a total.
- Rewatches are *not* pushed as new SIMKL history because of SIMKL account limits and duplicate risk.
- The client retains a limited offline retry queue; recover app data before clearing browser storage.
- Auto-sync runs when the browser is active/online; an always-on background worker has not been deployed.

## 8. Validate before production

1. Connect a disposable MAL and SIMKL account, inspect both connections.
2. Assign a test title to each service; ensure *no* external changes happen on linking.
3. Enable progress for the test title and log a known episode.
4. Confirm the correct account entry changed and that MediaFlow's XP/History were unaffected.
5. Test the same entry twice, an offline save, reconnect, and retry.
6. Test season-by-season IDs, unlink, reassign, wrong account, and token expiration.
7. Verify account isolation and production Supabase usage.

**Not yet verified:** live MAL/SIMKL token exchange, production API writes, real Android WebView OAuth handling, authenticated multi-device synchronization, real device touch input, full 50K Library performance, and deployment to the user's project.
