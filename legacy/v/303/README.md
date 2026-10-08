# MediaFlow v303 — Community Guest Routing and Navigation Repair

**Base:** MediaFlow v302 Community Beta, preserving private Workspace compatibility with stable v301.

## Corrections
- Signed-out visitors opening `/MediaFlow/`, `/MediaFlow/index.html`, or `/MediaFlow/404.html` land on the **public Community homepage**, not a nonexistent user profile.
- Browse, Collections, Ratings, Users and the brand/Home button navigate to their correct public screens and update browser history.
- Public `404.html` and the main entry document use `<base href="/MediaFlow/">` to ensure CSS, JavaScript, logo and PWA assets load correctly for nested profile/Collection deep links on GitHub Pages.
- The public header now shows the packaged **MediaFlow app logo**, instead of a placeholder geometric symbol.
- Placeholder Unicode icons/symbols in public navigation are replaced with accessible, meaningful, inline SVG icons. Button labels contain normal text and icons are separate visual elements.
- The signed-out **Log in** and signed-in **Workspace** buttons retain distinct behavior.
- No private Library or History publication changes; no new backend migrations; Community Beta limitations remain.

## Deploy
Deploy **all** files, including the regenerated PWA service worker and `404.html`. If an older release persists, use the MediaFlow update flow or reload after the new service worker activates. Direct GitHub Pages URLs are under `/MediaFlow/`.
