# MediaFlow v484 Beta — Visual Evolution Foundation

This release begins the approved **Alex Godly Visual Evolution** rollout. The full planned system spans future releases; v484 is the first functional layer, not a claim that every visual effect or editing control is finished.

## New opt-in theme-generation modes
- **Legacy** (default for all existing installs): the original Theme Collections, rotation, and custom colors remain unchanged.
- **Advanced — Alex Godly's Cover Intelligence Engine:** samples readable cover pixels, scores representative color regions for vibrancy and distinctiveness, and creates multi-color palettes with contrasting surfaces and three accents. Works through the existing cover-driven Theme Collections (recommendation, On This Day, Library Cover, Image URL); preserves their source priority/rotation. Cross-origin/unreadable covers use the existing safe fallback.
- **Custom — Alex Godly's Theme Studio:** independent of current media covers. Create a profile from manually chosen colors, an external image URL (where CORS permits analysis), or hybrid colors and image. Choose dark/light, composition variation, and save/duplicate/delete up to 24 named profiles.

## Alex Godly's Living Themes Engine — first functional visual layer
- Opt-in Off / Basic / Advanced modes and Subtle / Balanced / Vivid intensity.
- Real, animated layers for flowing gradients, cinematic lighting, particles, atmospheric depth, reflections, moving textures and organic effects, with refined interface transitions.
- Intelligent selection controls, individual effect toggles, and Auto/Optimized/Full performance preferences.
- Reduced-motion and data-saving safeguards; pause animation in background tabs.
- Responsive studio with immediate color-composition preview; settings appear under Appearance in Settings Center.
- Palette and profile preferences use MediaFlow's existing persisted settings path, so normal settings backups and sync include them.

## Compatibility and safety
- No Library, logging, XP, recovery, history, account, provider, or Supabase schema changes.
- Existing Theme Collections and legacy Custom Theme remain available.
- The new renderer does not initialize visual layers for Legacy+Off.
- URL validation requires HTTP(S); color values are validated and normalized.
- No paid AI dependencies or network model calls.

## Planned next iterations (not included in v484)
- Expanded cover perception, stronger composition scoring, and richer visual previews with real MediaFlow pages.
- The remaining approved families (advanced simulated weather, more refined particles, material/optics, creative effects, controls per visual layer, full sharing/import/export profiles, etc.).
- Additional device-performance profiling and browser regression tests.

## Validation
- Node syntax check of source and assembled bundle.
- v484 mode/default/schema/CSS/runtime regression contract.
- Rebuild/PWA/version and existing integrity checks.
- Full-source snapshot under `legacy/v/484` and numeric release `484`.
