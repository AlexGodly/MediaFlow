# MediaFlow v497 Beta — Living Themes Visual Direction & Title Recovery Parity

v497 builds on the released v496 Unified Living Themes Renderer and includes the requested Title Details recovery-toolbar correction.

## Title Details and Add/Edit Title: same recovery actions

**Title Details now displays the same three labeled recovery buttons as Edit Title:**

1. **Cover Recovery** (image icon)
2. **Metadata Recovery** (database icon)
3. **Recover Both** (layers icon)

- Retires the old **Fix Cover**, **Fix Metadata** shortcut and **Covers + Metadata Recovery** controls inside Title Details, replacing them with a single, consistent three-action shortcut group. Unrelated Details controls such as Edit/Delete/Log are preserved.
- Each choice uses **the existing v447 per-title `App.mf447Open` handler**, scoped to the exact saved title ID. Recover Both retains the original protected cover → metadata confirmation sequence; no new bulk job is introduced.
- **Metadata Recovery** is visually separated into two distinct words in **both** Title Details and Add/Edit Title. All three labels are displayed as intentional two-word phrases using actual CSS gaps, not font-dependent whitespace.
- Edit Title continues using its existing canonical recovery actions and separately preserves any **Fix Metadata** functionality already available in the editor.
- New unsaved titles retain their **disabled recovery buttons** until saved; no Library-wide recovery job is accidentally launched by an unsaved draft.
- Respects the existing recovery shortcut visibility preference for Title Details and Edit Title.
- Uses theme-native, responsive buttons with desktop/tablet/mobile layout and a stacked narrow-phone fallback. No icon duplicates.

## Living Themes Visual Direction & Material Intelligence

- Adds a **visual surface direction** pass after v496's protected atmosphere renderer. It does not change palettes or dynamic cover ownership.
- Uses palette saturation/contrast and **v490 pixel-derived atmosphere hints**, only when they belong to the currently protected palette. Custom manual themes use their own colors and variation, not a Library cover.
- Adds **satin**, **glass**, **prismatic**, and **matte** material finishes selected conservatively from the current palette/variation, with direction-sensitive **ambient**, **diffuse**, or **directional** lighting.
- Existing Basic/Advanced/Off, user effect switches, performance, and reduced-motion settings remain authoritative. Materials/depth require Advanced and their enabled effect flags. Optimized mode avoids expensive full surface treatments.
- Adds **Settings → Appearance → Theme Intelligence → Living Themes Visual Direction & Materials** for mode, active material/lighting, depth, motion, performance and render-reuse diagnostics.
- No new network requests, canvas reads, intervals, paid APIs, Supabase schema, or duplicated Library records. **Legacy unchanged.**

## Tests and release quality

- `scripts/test-v497-recovery-parity.cjs`: Title Details/Edit parity, all three labels, exact saved title ID, retirement of old actions, preserved unrelated buttons, disabled unsaved-title actions, preference controls, zero render-time data writes.
- `scripts/test-v497-visual-direction.cjs`: mood-guided lighting, four materials, Advanced/Basic controls, Custom manual independence, reduced motion, data saver, optimized behavior, Legacy isolation.
- v496 renderer and v495–v483 regression suites carried forward to v497.
- Build with `scripts/build.py`, validate JS syntax, PWA version/assets, `scripts/check.py`, complete version archive at `legacy/v/497`.
- Merge validated PR to main, deploy GitHub Pages, publish numeric release `497` with full source ZIP and SHA-256 checksum.

## Next milestone

**v498 — Ambient Motion and Interactive Surface Refinement**: further improve responsive motion, surface reactions and accessibility while keeping Legacy untouched and each effect independently controllable.
