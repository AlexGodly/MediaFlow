# MediaFlow v267

## Cloud Sync Reliability

- Canonicalizes the expected protected Sync Now state through the same JSON-safe representation used by cloud persistence before content fingerprint verification.
- Prevents false `Library content` verification failures caused solely by non-persisted JavaScript `undefined` properties.
- Rechecks all core cloud collections after upload using persisted-form fingerprints.
- Adds protected verification repair retries when the readback genuinely differs from the state that was uploaded.
- Stops repair rather than overwriting when the cloud clearly changed from another device during verification.
- Keeps the local recovery cache aligned with the final verified cloud state.
- Improves post-failure diagnostics while preserving the existing rule that suspicious/missing cloud reads never automatically overwrite cloud data.

## Dynamic Library

- Restores `All covers`, `Has cover`, and `Missing cover` filtering in Dynamic Library after the optimized v241 Dynamic Library row implementation had replaced the earlier v224 cover-filter wrapper.

## Today's Balance

- Ensures the latest Today’s Balance implementation is used on first app load as well as later Dashboard navigation.
- Prevents older v261/v264 Balance generations from visibly replacing or preceding the latest Balance design.

## Personal Order

- Moves the open Category filter panel into a body-level portal.
- Prevents clipping by sidebar, transformed containers, grid parents, or overflow ancestors.
- Keeps the panel inside the usable viewport and repositions it on resize/scroll.
- Restores the panel to its original filter control when closed.

## Compatibility

- Cloud Sync v201 preserved.
- Full Backup Schema v29 preserved.
- Settings Preset Schema v1 preserved.
- Personal Order Export v4 preserved.
- Zero-config GitHub Pages deployment preserved.
- PWA cache advanced to `mediaflow-pwa-v267-shell-v1`.
