# MediaFlow v306 — Community navigation and clickable controls repair

Base: v305 Community Beta; v301 private Workspace preserved.

- Replaced inline `onclick` Community navigation buttons with semantic links with real destinations and shared capture-phase delegated DOM events.
- Repaired public header Browse, Collections, Ratings, Users, Login/Workspace, MediaFlow logo/Home, homepage Explore Titles, Find People, and all four Explore cards.
- Provided native hyperlink fallback for GitHub Pages public navigation and a safe hash-based fallback for direct local file use.
- Preserved existing public-profile, Community, authentication, private Workspace, and messaging logic.
- Maintained accessible keyboard-activatable links and existing MediaFlow logo glow.
- Refreshed PWA service worker, version metadata, and bundle to v306.
- No changes to the database or private user data.

Testing: Browser regression with simulated data and auth, not a claim of live production Supabase validation.
