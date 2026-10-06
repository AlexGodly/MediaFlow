# MediaFlow v260 — Professional UI/UX System + React Migration Foundation

MediaFlow v260 is the first full presentation-system redesign of the modular MediaFlow application. It is built directly over v259 and intentionally keeps the stable MediaFlow feature/data runtime authoritative while replacing the visual language with a reusable, theme-aware design system.

## Professional Design System

- Added `assets/css/127-v260-design-system.css` as the final presentation layer.
- Introduced a reusable visual token layer derived entirely from existing MediaFlow theme variables.
- Redesigned application shell, sidebar, navigation, page headers, cards, buttons, inputs, selects, pills, modals, empty states and focus states.
- Added consistent spacing, border-radius, elevation, density and typography rules.
- Added restrained micro-interactions and `prefers-reduced-motion` support.
- Improved keyboard focus visibility and semantic page-heading/navigation attributes.
- Avoided a generic admin/AI-dashboard look in favor of a media-library/editorial interface with content-first density.

## Dynamic Themes Preserved

v260 does **not** replace the existing theme engine.

All new v260 surfaces derive from MediaFlow's established variables:

- `--bg`
- `--panel`
- `--panel-raised`
- `--border`
- `--border-soft`
- `--text`
- `--text-dim`
- `--text-mute`
- `--flow`

This means Dark, Light, AMOLED, built-in themes, platform/full-style themes, adaptive cover themes and Dynamic Cover Theme continue to drive the redesigned UI without storing a second color system.

## Library Redesign

- Added a structured **Library tools** panel.
- Library tools can be collapsed without hiding the important category/status navigation.
- The collapse state is intentionally a device-local UI preference and adds no cloud or backup schema field.
- Dynamic Library now keeps its Category and Status rows as the stable sticky navigation directly above title content.
- Current/Normal Library receives the same always-visible professional Category + Status filter dock.
- Statuses occupy their own row.
- Categories occupy their own horizontally scrollable row.
- The optional search/sort/display/overlay/bulk controls stay above the Category/Status dock.
- Existing List, Compact, Cards, Covers and Cover+Titles modes receive mode-specific spacing, density and hover treatment.
- Large libraries keep the existing high-performance render/filter engine; v260 does not add another whole-document MutationObserver.

## Page-by-Page Redesign

The new design system covers:

- Dashboard
- Library — Current and Dynamic
- Personal Order
- Old System
- Library History
- History
- Batch Log
- Statistics
- Account / Profile
- Settings
- About
- modal / editor / choice dialogs
- mobile navigation and PWA widths
- authentication surfaces

## React + TypeScript + Tailwind Workspace

Added `ui-v260/` as the modern frontend workspace:

- React
- TypeScript
- Tailwind CSS
- Vite
- Lucide React
- Framer Motion

The workspace includes reusable primitives such as Page Header, Surface, Button, Filter Chip and Tool Panel plus a MediaFlow runtime bridge.

v260 uses a compatibility-first hybrid rollout: the proven MediaFlow runtime remains the state/behavior authority while React owns the new component contract and can replace individual legacy-rendered pages incrementally in later versions without risking sync, backup or scheduler regressions.

## Responsive / Accessibility

- Desktop spacing scales up without wasting large-screen space.
- Tablet layout reduces columns intelligently.
- Mobile/PWA uses compact edge spacing, floating glass navigation and horizontal filter rails.
- Very narrow screens retain usable controls and readable titles.
- Sticky action areas account for mobile bottom navigation.
- Added keyboard-focused skip-to-content support.
- Added semantic roles/labels to existing shell elements where safe.
- Added reduced-motion behavior.

## Compatibility & Persistence

No content/persistence schema bump is required.

- Stable feature/data base: v201
- Cloud Sync: v201
- Full Backup Schema: v29
- Settings Preset Schema: v1
- Personal Order Export: v4
- Category artwork persistence: preserved from v258/v259
- PWA shell: `mediaflow-pwa-v260-shell-v1`

## Main v260 Files

- `assets/css/127-v260-design-system.css`
- `src/js/components/194-v260-professional-ui-react-bridge.js`
- `ui-v260/`
- `scripts/smoke-v260.py`

## Validation

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-v260.py
```
