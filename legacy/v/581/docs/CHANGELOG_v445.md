# MediaFlow v445 Stable — Unified Recovery Workspace

## Unified workspace
- Cover Recovery and Metadata Recovery share one theme-aware entry dialog with dedicated accessible tabs.
- Original recovery engines, confirmations, safeguards, checkpoints, retries, provider preferences and write protections remain independent.
- Both tabs show enabled and unavailable provider states with setup shortcuts. Registered integrations are not falsely described as available.
- Expandable category panels render MediaFlow's saved category artwork, emoji or fallback glyph, with Library title counts; categories do not silently restrict provider calls.
- The workspace is reachable from Settings, the background widget, floating recovery shortcuts, recovery entry points and saved-title details.
- A combined Covers + Metadata Recovery action is added in saved-title details, including anime titles.
- Metadata Preview and selected-title batch recovery preserve the original confirmation flow; Cover Recovery retains its original scope selector.

## Visual polish and accessibility
- Current MediaFlow theme surfaces, borders, text and accents, with desktop, tablet and mobile responsive layouts.
- Semantic dialog and tabs, keyboard tab switching, Escape to close, keyboard focus confinement and focus restoration.
- Opening the workspace never modifies saved titles or makes provider network calls.

## Quality gate and deployment
- New deterministic v445 contracts plus existing v424–v444 recovery regression suite.
- Deno typecheck of the authenticated gateway.
- Chromium desktop / 360px mobile smoke tests and screenshot artifacts.
- Complete project archived in legacy/v/445 and numeric GitHub Release 445 after Pages deployment.

## Scope limits
- v445 is a unified workspace and entry-point update, not a new provider-adapter or metadata-field release.
- Availability follows the existing v443 gateway-readiness logic.
- Background recovery remains browser-dependent and retains its previous resume/checkpoint behavior.
