# MediaFlow v485 Beta — Visual Engine Architecture & v484 Hardening

**First hardening milestone of MediaFlow's Visual Evolution roadmap (v485–v530).**

## Theme ownership and race-condition protection

- Introduce a central visual-owner coordinator distinguishing **Legacy**, **Advanced**, and **Custom** from underlying **static vs cover** sources.
- Reject outdated cover palette writes after entering Custom mode. Reject delayed Custom writes after returning to Legacy/Advanced.
- Invalidate pending cover/custom generation on mode changes and profile changes using existing request-generation guards.
- Guard stale dynamic clear/fallback operations so they cannot silently erase a saved Custom theme.
- Keep the existing Theme Collection selectors and source settings intact.

## Custom theme independence

- Temporarily suspend cover-source and collection rotation timers while Custom is active, **without changing saved collection modes, source order, or intervals**.
- Resume those timers when returning to the existing cover-based collections.
- Prevent legacy static appearance callbacks from replacing a live Custom profile.
- Reapply Custom after a collection source changes, while preserving the selection for when the user returns to cover themes.
- Deduplicate identical asynchronous Custom theme requests, avoiding multiple competing image-analysis jobs.

## Reliable visuals and safe recovery

- Record the most recent successfully applied, validated palette.
- Reject incomplete/invalid color palettes; automatically restore a previous good palette if a renderer error interrupts application.
- Prevent unchanged atmosphere compositions from rebuilding animated DOM layers and restarting their animations unnecessarily.
- Reconcile visual ownership on tab/window reactivation and browser back/forward cache restores.
- Add **Settings → Appearance → Visual Engine Health & Recovery** to show mode, source, last successful palette, stale operations stopped, and recovery actions.
- New manual **Restore / Reapply Palette** and **Return to Legacy** actions preserve Library, History, cloud settings and named Custom profiles.

## Compatibility & safeguards

- **Legacy stays the default**, and with Living Themes Off it retains its original rendering path.
- Existing v484 Advanced color analysis and theme profiles remain available; no new visual presets are forced on existing users.
- No Supabase schema, Library, logging, History, XP, or recommendations changes.
- No paid services required.
- Responsive health controls and safeguards for reduced-motion preferences remain preserved.

## Verification

- Runnable v485 behavioral test simulating mode transitions, rejected stale writes, invalid palettes, last-good rollback, rotation suspension and atmosphere reuse.
- Carried-forward v484 visual schema and v483 recovery-scroll regression tests.
- Full bundled JavaScript syntax validation, PWA metadata generation, and repository integrity check.
- Archived complete project under `legacy/v/485`; numeric GitHub Release `485` with ZIP archive and SHA-256 checksum.

## Next milestone

**v486 — Universal Cover Source Intelligence**: unify source resolution across all cover-based Theme Collections while retaining their distinct priority and rotation behavior.
