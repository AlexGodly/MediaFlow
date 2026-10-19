# MediaFlow v476 — Background Processes visual redesign

Only the interface changes. Cover and Metadata each show a separate percentage and progress bar in collapsed and expanded states. The prior header showed only max(cover, metadata).

Expanded recovery cards preserve original status, counters, recovery controls, Settings and Hide actions. New CSS uses MediaFlow theme variables and respects dark/light mode, phone/tablet widths, reduced motion, v462 first-paint and v469 dock collision rules. Recovery jobs, provider calls, cloud state, exports and XP are unchanged.

Tests: v476 component contract and Chromium responsive regression, PWA cache/rollback, full legacy/v/476 source archive, GitHub Pages and numeric 476 Stable release.
