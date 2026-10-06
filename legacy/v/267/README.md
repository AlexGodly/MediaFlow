# MediaFlow v267 — Cloud Reliability, Dynamic Cover Filter & UI Stability

**App release:** v267  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v267 is a focused reliability release built on v266. It hardens protected Sync Now against JSON round-trip verification false positives and genuine post-upload mismatches, fixes Dynamic Library cover filtering, permanently keeps the latest Today’s Balance presentation on first load/navigation, and moves Personal Order’s Category filter into a viewport-safe portal so it cannot be clipped by the sidebar or parent layout.

## Highlights

- Canonical JSON-safe cloud verification for protected Sync Now.
- Automatic protected re-upload/readback repair when a post-upload verification mismatch is genuine.
- Safety guard against overwriting a clearly newer cloud write from another device.
- Account recovery cache remains aligned with the verified cloud result.
- Dynamic Library `All covers / Has cover / Missing cover` filtering restored after the optimized v241 row builder.
- Today’s Balance now uses only the latest v265/v266 presentation from startup onward instead of switching between old/new implementations.
- Personal Order Category filter is portaled to `document.body`, viewport-clamped, sidebar-aware, and no longer clipped by layout ancestors.
- PWA shell: `mediaflow-pwa-v267-shell-v1`.
- Zero-configuration GitHub Pages deployment remains preserved.

## Validation

```bash
python scripts/check.py
python scripts/smoke-v267.py
```

The v267 smoke suite covers canonical cloud verification, protected Sync Now, latest Balance stability, Personal Order popup bounds, Dynamic Library cover filtering, and responsive overflow checks.
