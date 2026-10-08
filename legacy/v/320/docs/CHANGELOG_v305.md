# MediaFlow v305 — Public Navigation and Authentication Session Stability

Base: MediaFlow v304 Community Beta (v301 stable workspace).

- Removed inherited decorative glyphs around the official MediaFlow logo and applied a soft glowing-edge treatment to the packaged MediaFlow icon.
- Repaired the public Community navigation: Browse, Collections, Ratings, Users, Explore Titles, Find People and header logo action.
- Browse and Ratings now display an empty state if the Community API client has not initialized, rather than treating missing Supabase as a navigation error.
- Fixed authenticated workspace bounce: logins now canonicalize the URL to `workspace` before asynchronous workspace hydration begins. Subsequent auth callbacks cannot reinterpret the old homepage route and reopen the public portal.
- Added Back to Homepage to the existing Login and Sign Up interfaces, including rerenders after authentication errors.
- Kept public deep links, local file routing, private workspace data, optional publishing and existing community database unchanged.
- PWA assets and release metadata updated to v305.
