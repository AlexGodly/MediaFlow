# MediaFlow v465 Stable — Fresh Episodes Recommended Title Card Wording and Visibility

## Dashboard → MediaFlow Recommends
- Rename the label **Recommended title · fresh episodes left** to **Fresh episodes left**.
- Show the recommended-title fresh episodes tile **only** when the recommended title's actual Category Details have the **Seasonal** checkbox enabled.
- Require Fresh Episodes checking **not** to be Manual. In Manual mode, hide the entire title-specific tile (without displaying an unknown placeholder); restore it when automatic/provider-based checking is enabled.
- Use the title's own saved category to determine eligibility, not the current task category. A category ID named `seasonal` without its checkbox enabled is insufficient.
- Keep the same verified ledger, provider name, progress-based arithmetic, 0 / Caught up, and Awaiting verification states as v463, with no new API calls or writes.

## Unchanged
- Category-wide remaining/verified fresh statistics, the External Ratings section from v464, progress, rerolls, all recovery jobs, Dynamic Themes and cloud data remain unchanged.
- Responsive desktop/mobile styling remains consistent; no new hard-coded colors.

## Quality and release
- Deterministic tests cover manual, checked/unchecked, unrelated task category, missing categories, legacy ID, automatic and individually-selected sources.
- Chromium desktop and 360px mobile smoke with v462/v463/v464 regressions.
- Complete versioned source archive `legacy/v/465`, numeric stable Release `465` with ZIP and SHA256.
