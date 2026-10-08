# MediaFlow v299

Built from v298.

## Added
- Logging Intensity slider above the Dashboard logging area / Next Task card.
- 5 levels with configurable XP multipliers.
- Settings section to change the current Logging Intensity level.
- XP settings inputs for LV1–LV5 multipliers.
- Dashboard Sections toggle to show/hide Logging Intensity under On This Day.

## Behavior
- LV1: default behavior, x1 by default.
- LV2: disables Reroll title, x2 by default.
- LV3: disables Reroll title and Give me something else, x3 by default.
- LV4: disables Reroll title, Give me something else, and Skip, x4 by default.
- LV5: behaves like LV4 plus recommended-title-only logging when exact title recommendations are enabled. If the task needs more than one unit, Reroll title remains available. If exact title recommendations are disabled, LV5 behaves like LV4.

## Files
- New bundle: `assets/js/mediaflow-v299.bundle.js`
- New stylesheet: `assets/css/159-v299-logging-intensity.css`


## Fixes
- Current rerolls modal is now scrollable again.
- Current rerolls modal layout responds better when cover size changes.
- Logging Intensity XP now stays tied to the session that earned it instead of changing retroactively when you switch levels later.
