# MediaFlow v444 Stable — Recovery Confirmation & Floating Quick Actions UI

## Recovery confirmations
- Replace native browser confirmation dialogs in Metadata Recovery with a proper themed, accessible confirmation modal.
- Cover Recovery and Metadata Recovery share the same visual language; reuse existing v427 safeguards for explicit cover choices, retries and queued reviews.
- New confirmations for starting a metadata batch, replacing an unfinished batch, clearing checkpoints and changing an existing cover from the instant picker.
- Show the exact selected-title count where appropriate, with concise context, safe-operation notices and distinct primary/destructive actions.
- Keyboard support: Escape cancels, Tab stays inside the modal, focus returns to the invoking control, and concurrent confirmations cannot stack.
- Existing user data, recovered history, personal ratings, XP, manual-field locks, cover validation, saved checkpoints and process coordination remain unchanged.

## Floating quick actions
- Rework the existing five actions into a deliberate, equal-width vertical stack without detached 01–05 counters.
- Consistent icon containers, card heights, title/subtitle spacing, hover and focus styles.
- Preserve all original destinations: Add to Logging, Add to Library, Add Collection, New Cover Recovery and New Metadata Recovery.
- Menu dynamically aligns to the available side of the floating + button, including when mobile task progress shifts its position.
- Scrollable on short screens; respects mobile safe areas and prefers-reduced-motion; all colors and surfaces follow MediaFlow's active theme.

## Quality and distribution
- Dedicated source and dialog regression checks, keyboard/approval tests, and desktop/360px mobile Chromium smoke, including screenshots of the confirmation modal.
- Previous v424–v443 provider and recovery regression checks, TypeScript/Deno gateway source typecheck and verified source build.
- No new credentials, backend deployment or SQL migration.
- Full source archived in `legacy/v/444`, numeric GitHub release `444` with ZIP and SHA256 checksum.

## Planned separately
The unified Cover + Metadata popup, category icons/expandable category controls, title-level Auto-Fill, Library Tools metadata shortcut, external ratings in Recommends and Universal Fresh Episodes engines remain future roadmap items.
