# MediaFlow v449 — Add/Edit Title Recovery Toolbar Cleanup

## Requested UI changes
- Show **Cover Recovery**, **Metadata Recovery**, **Recover Both** and **Fix Metadata** together in one clearly styled toolbar **above the Add/Edit Title heading and all editor fields**. No action is duplicated lower in the editor.
- Reuse the original v447 recovery actions and v439 per-title metadata preview; preserve their exact handlers and safe title-ID scoping. A saved title launches recovery only for its own ID by default, with the existing scope options available in the unified workspace.
- Unsaved Add Title drafts show all four shortcuts in a disabled state with a brief instruction to save the title first. No action can accidentally run against the whole Library or create an unsaved recovery job.
- Remove the original **Fix missing covers** button injected into Library Tools by v425, while keeping v447's **Cover Recovery**, **Metadata Recovery**, and **Recover Both** controls available in Normal and Dynamic Library.
- Polished responsive grouping for desktop, tablet and narrow mobile, retaining theme variables and clear focus/touch targets. All other Add/Edit fields, save/delete operations, recovery settings, providers, cloud data, and background jobs are unchanged.

## Scope and version policy
- v449 is an intervening UI refinement requested after the v448 release.
- The previously planned **Universal Metadata & External Ratings Expansion** automatically moves from v449 to **v450**, with all later roadmap features shifting forward. No planned feature is dropped.

## Quality and release
- Automated checks cover the four top-of-popup controls for existing/draft titles, absence of duplicate buttons, preserved v447 Library shortcuts, responsiveness on Chromium desktop and 360px mobile, safety of unsaved drafts, and prior v424–v448 regression suites.
- Versioned source and site bundle archived under `legacy/v/449`; signed off by the quality gate, deployed through GitHub Pages, and published as numeric GitHub Release `449` with a full ZIP and SHA256.
