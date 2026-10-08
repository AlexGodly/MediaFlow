# MediaFlow v307 — Login route navigation error fix

Built from v306 Community Beta (private Workspace based on v301).

- Fixed **Navigation unavailable** after clicking **Log in** from Community homepage.
- Root cause: v306 used raw `history.pushState` for Login/Workspace, throwing in locally opened `file://` pages or restricted history environments. Its click handler caught the error and replaced the page with a generic error.
- Unified Login, Workspace, auth callback, and public navigation route updates using a safe route writer with a `#/login` / `#/workspace` fallback.
- Corrected route reading for supported hash links without confusing them with public usernames.
- Added authentication-specific error recovery, preserving access to sign in rather than displaying `Navigation unavailable`.
- Preserved native public links, Community discovery, profiles, public statistics, and private Workspace/cloud data.
- PWA, service-worker and release assets updated to v307.

No database schema changes, no destructive migration, and no logging intensity feature.
