# MediaFlow v222 — Dashboard Rendering Stability

MediaFlow v222 is a focused visual-stability release built on the working v221 modular/runtime base.

The release addresses the tiny green/yellow pixel artifact that could occasionally appear directly below the Dashboard **On This Day** card and then disappear after expanding the card to show the other titles.

## What was happening

The artifact was consistent with a Chromium GPU/compositor texture leak rather than MediaFlow data corruption. The On This Day card combined:

- a closed native `<details>` element,
- lazy-loaded cover images,
- rotating cover artwork,
- dynamic cover-driven themes,
- and `content-visibility:auto` on hidden On This Day rows.

On some Chromium/GPU combinations, especially older integrated/discrete laptop graphics, a few pixels from a hidden cover texture could remain visible outside the collapsed card until the area was repainted. Expanding the card forced that repaint, which explains why the artifact disappeared when viewing the other titles.

## v222 fix

- Removed `content-visibility:auto` from the On This Day event rows.
- Explicitly removes the collapsed On This Day body from painting while the `<details>` card is closed.
- Added paint containment to the On This Day card.
- Added compositor isolation to the On This Day card.
- Added compositor isolation to the Today statistics strip immediately below it.
- Removed accidental transform/will-change promotion from rotating On This Day cover layers.
- Added a lightweight post-render paint guard after Dashboard renders.
- Added a repaint guard after the rotating On This Day hero changes.
- Added a repaint guard when the On This Day details card is opened or closed.
- The fix changes display/rendering behavior only; Library, History, progress, categories and recommendations are untouched.

## Runtime architecture

v222 continues using the v219 runtime-extension foundation. The new Dashboard stability module is injected inside the live MediaFlow application scope:

```text
src/js/pages/dashboard/147-v222-dashboard-rendering-stability.js
```

The CSS guard lives in:

```text
assets/css/93-v222-dashboard-rendering-stability.css
```

## Regression testing

The v222 smoke test now checks that:

- MediaFlowRuntime reports v222.
- the Dashboard paint guard is active.
- collapsed On This Day bodies are `display:none`.
- On This Day rows use normal painting instead of `content-visibility:auto`.
- the On This Day card uses paint isolation.
- the Today strip below it is isolated.
- opening the details card restores its body normally.
- all existing v221 Settings tests continue to pass.

## Compatibility

- **Cloud Sync:** v201
- **Full Backup Schema:** v29
- **Settings Preset Schema:** v1
- No user-data migration required.
- No Library/History/XP/content data changes.

## Release summary

**Release:** MediaFlow v222  
**Codename:** **Dashboard Rendering Stability**  
**Base:** MediaFlow v221 Modular  
**Stable feature base:** MediaFlow v201  
**Created by:** Alex Godly

### Main changes

- Fixed rare green/yellow Dashboard pixel artifact.
- Hardened On This Day collapsed rendering.
- Removed risky hidden-row `content-visibility:auto` behavior.
- Added paint containment/isolation.
- Added post-render and post-rotation repaint guards.
- Preserved v221 Settings hierarchy and responsive navigation.
- Preserved v219 active runtime architecture.
- Kept Cloud Sync v201.
- Kept Full Backup Schema v29.
- Kept Settings Preset Schema v1.
- Updated MediaFlow version to 222.
