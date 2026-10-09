# MediaFlow v303 — Public Guest Homepage, Community Navigation, Semantic Icons & Logo Restoration

**Base:** v302 Community Beta (which itself continued the stable v301 Workspace).

## Public homepage and route restoration
- Fixed `index.html` / `404.html` URLs being interpreted as a public username, displaying **Profile unavailable** to signed-out visitors.
- Standardized route recognition for `/MediaFlow/`, `/MediaFlow/index.html`, `/MediaFlow/404.html`, `/MediaFlow/browse`, `/MediaFlow/collections`, `/MediaFlow/ratings`, `/MediaFlow/users`, and public username/Collection deep links.
- Public sections render immediately with a visible loading state while server requests are in progress. Older, slower responses cannot overwrite a newer selected page.
- The MediaFlow logo returns to the public site's top-left, using `assets/icons/mediaflow-192.png`.
- Browse, Collections, Ratings, Users, Log in/Workspace, and the Home brand action are connected to their intended destinations.
- Public navigation and page buttons use semantic SVG icons instead of decorative Unicode placeholders. Button text is separate from icons.
- Signed-out visitors receive Login/Sign Up through the original v298 authentication experience; signed-in visitors retain Workspace.
- Back/forward handling respects public, login, and workspace routes.

## GitHub Pages routing and PWA
- Added `<base href="/MediaFlow/">` for correct assets on nested profile and Collection URLs.
- `scripts/build.py` now automatically regenerates `404.html` from `index.html` on each build, avoiding stale v302 scripts or CSS on GitHub Pages fallback pages.
- Added validation to `scripts/check.py` to verify matching entry/fallback documents and v303 styling.
- New CSS: `assets/css/161-v303-community-navigation.css`.
- Updated bundle: `assets/js/mediaflow-v303.bundle.js`.
- PWA shell: `mediaflow-pwa-v303-shell-v1`.
- Updated VERSION, version.json, and metadata to 303.

## Compatibility and limits
- No changes to Supabase schema or production data were required.
- Existing private Workspace Cloud Sync v201, Full Backup v29, Settings Preset v1, Personal Order v5 and Collections v2 remain preserved.
- Community Beta remains a beta; end-to-end production tests with real accounts are still required.

## Verification
- `scripts/build.py` and Node.js syntax validation passed.
- `scripts/check.py` project integrity passed.
- `scripts/test-v303-public-routing.cjs`: 20 public route/navigation assertions passed.
- `scripts/test-v303-browser.py`: 14 isolated browser click/guest-login tests passed across 1200px and 390px, using a mocked Supabase client (not a live backend).
- Index / 404 equality and ZIP integrity verified.
