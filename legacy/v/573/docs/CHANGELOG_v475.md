# MediaFlow v475 — PWA Update Account Continuity / Empty-Account Bootstrap Fix

## Reported bug
After installing a MediaFlow PWA update and the automatic reload, the app sometimes opens as an empty/default account or login shell. A second manual refresh followed by signing in restores the original, fully populated cloud account. Installing updates must **never** show an empty Library as though it were the user's real account, or require unnecessary logout/login cycles.

## Verified code-level root causes
- The previous `init()` subscribed to Supabase auth changes *after* an awaited `getSession()` and initial cloud bootstrap. Auth events could be missed during a release reload.
- Its `onAuthStateChange(async(...) => { await startAuthenticatedApp(); })` callback awaited authenticated Supabase queries while Supabase's internal auth lock was held. This is a documented unsafe re-entrancy pattern and can stall cloud hydration.
- It interpreted any temporary `null` session callback as logout after startup, even `INITIAL_SESSION:null`, and could immediately render the sign-in shell before persistent login restoration settled.
- PWA update/reload controls could activate a new worker while startup/cloud recovery was still pending; older save-before-reload checks treated protected `saveState() === false` like a successful save.

## v475 implementation
- Register Supabase auth listener **before** checking persisted session and dispatch its work on a new task, outside the Supabase callback/auth lock.
- Restore the Supabase persisted session with bounded retries while showing `Restoring your MediaFlow account…`, not a false zero-title dashboard. Once a valid session is found, safely bootstrap the associated account's own cloud state.
- Treat `INITIAL_SESSION:null` as transitional, **not** a logout. `TOKEN_REFRESHED` and repeated `SIGNED_IN` for the same user do not rerun cloud bootstrap. Explicit `SIGNED_OUT` invalidates the workspace and protects cloud writes.
- Single-flight cloud hydration per account, with generation guard and clear retry UI on a real cloud load failure. Preserve existing v115 cloud data-loss/recovery guard, and never write defaults on restoration failure.
- Block manual and automatic update/reload buttons until a real, signed-in account has completed protected cloud hydration and the startup guard is inactive. Before activating a waiting worker from PWA controls, await verified save/serialized queue.
- Keep Supabase `persistSession:true` and `autoRefreshToken:true`; do not copy auth tokens to alternate storage and do not modify/delete any cloud rows or stored account settings.
- Do not affect XP, import/export, Personal Order, Collections, title data, new Showcase visuals or other regular MediaFlow screens.

## Test plan
- `scripts/test-v475-auth-continuity.cjs`: mocked Supabase `INITIAL_SESSION:null`, delayed local saved session, duplicate auth events, sign out/in, blocked cloud guard, true anonymous case, verified save gate and update/reload handoff.
- Run full browser regression `scripts/test-v475-browser.cjs` from previous v474 suite at desktop, tablet and mobile widths.
- PWA cache/install and interrupted update rollback simulation `scripts/test-v475-pwa-contract.cjs`, source build/syntax checks and version/worker/manifest coherence.
- CI archives full `legacy/v/475`, then Pages deploy and numeric `475` Stable GitHub Release with ZIP and checksum.
- **Real-device verification needed:** Install v475 over existing v474 PWA on Windows/Android, confirm identical signed-in Supabase user ID and Library/History/Settings/XP/Collections counts before and after the reload. Because CI cannot access a private signed-in browser, do not claim this physical flow has already been verified.

## Safety
No Supabase migration or reset, no account/session token exported. Existing stored cloud data is never replaced by a blank workspace during the authentication recovery window.
