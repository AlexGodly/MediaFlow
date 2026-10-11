# MediaFlow v266 — Title Actions, Cover Fidelity, Settings Stability & UI Cleanup

- Fixed the Edit Title delete action and standardized it as **Delete title**.
- Standardized Title Details actions to **Delete title** and **Edit all title details**.
- Normal Library List, Compact and Cards no longer display category default cover artwork as if it were a title's own cover when `coverUrl` is empty; Dynamic Library behavior remains unchanged.
- Removed the separate sidebar collapse button; clicking the MediaFlow brand/logo now collapses or expands the desktop menu.
- Personal Order category filtering is clamped to the usable viewport beside the sidebar so neither edge is hidden.
- Increased Today's Balance typography and spacing for clearer Dashboard readability.
- Settings in-place mutations now lock the exact active Settings section during DOM morphs and restore its relative scroll position, preventing random section jumps.
- All v265 persistence/data compatibility remains unchanged.
- PWA cache advances to `mediaflow-pwa-v266-shell-v1`.
