# MediaFlow v260 Design System

## Design direction

MediaFlow v260 is a dense media-management interface, not a generic SaaS admin dashboard. The design emphasizes artwork, titles, category/status context, progress, fast controls and large-library information density.

## Theme contract

v260 creates aliases and mixed surfaces from the existing MediaFlow variables. It never replaces the theme source of truth.

| Existing token | v260 responsibility |
|---|---|
| `--bg` | canvas / deepest surface |
| `--panel` | primary surface |
| `--panel-raised` | elevated controls / cards |
| `--border`, `--border-soft` | structural hierarchy |
| `--text`, `--text-dim`, `--text-mute` | typography hierarchy |
| `--flow` | interactive accent, focus, selected states |

The CSS uses `color-mix()` to derive subtle accent backgrounds and borders. Therefore a Dynamic Cover Theme change immediately recolors v260 without re-rendering or saving a second palette.

## Component grammar

- **Canvas:** low-noise theme background with restrained accent atmosphere.
- **Surface:** 1px theme border, 15px radius, soft shadow.
- **Raised control:** 10px radius and compact 36–40px control height.
- **Primary action:** `--flow` driven, reserved for the main action.
- **Ghost action:** low-noise controls for secondary actions.
- **Danger action:** uses existing MediaFlow negative/status semantics.
- **Filter rail:** horizontally scrollable, chip-based, keyboard-focusable.
- **Sticky dock:** glass-like theme surface for high-frequency Library context.
- **Page header:** editorial display type + restrained description.

## Library hierarchy

1. Page identity / add-title action
2. Optional Library tools
3. Always-visible Category + Status dock
4. Current category/status summary
5. Pagination
6. Title content

The tools panel may collapse, but Category and Status navigation never disappears.

## Responsive rules

- `> 1100px`: full desktop density.
- `861–1100px`: reduced gutters and narrower side systems.
- `<= 860px`: mobile/PWA shell, bottom nav, sticky compact rails.
- `<= 520px`: very-tight-phone spacing and action compression.

## React migration rule

React components must consume the same theme variables. Do not copy colors from a specific theme into JSX/Tailwind classes. Tailwind aliases are defined in `ui-v260/tailwind.config.ts`.
