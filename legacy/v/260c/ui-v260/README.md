# MediaFlow v260 React UI Workspace

This workspace is the React + TypeScript + Tailwind side of the v260 frontend architecture.

## Why v260 is hybrid

MediaFlow already has a mature, large, browser-native runtime with cloud sync, backup/restore, scheduler, history, XP, imports, PWA behavior and a long chain of release-safe compatibility modules. Replacing that state engine in one release would create unnecessary regression risk.

v260 therefore separates **presentation** from **application authority**:

- the existing MediaFlow runtime remains authoritative for state and behavior;
- `assets/css/127-v260-design-system.css` redesigns every current page using theme-driven tokens;
- `src/js/components/194-v260-professional-ui-react-bridge.js` adds the compatibility and accessibility bridge;
- this workspace supplies reusable React/Tailwind primitives and the stable React mount contract for future page-by-page replacement.

## Dynamic theme contract

Never hard-code application palette colors in React components. Use the existing MediaFlow variables:

`--bg`, `--panel`, `--panel-raised`, `--border`, `--border-soft`, `--text`, `--text-dim`, `--text-mute`, `--flow`.

Tailwind aliases those variables as `mf-bg`, `mf-panel`, `mf-raised`, `mf-border`, `mf-text`, `mf-dim`, `mf-muted`, and `mf-flow`.

## Build

```bash
npm install
npm run build
```

The Vite output target is `assets/v260-react/` so a future release can load the compiled React bundle locally and include it in the PWA shell.
