# MediaFlow v298 — Full-Width Auth Design & Responsive UI Repair

## Main fixes
- Auth page now consumes the entire viewport instead of shrink-to-fitting a narrow left strip.
- Form and artwork hero sit in balanced, properly centered desktop columns.
- Removed cramped three-column feature cards and oversized multiline slogans; restored the chosen cinematic hero headline and orbit styling.
- Fixed form input nested borders, actual input width, padding, text readability, and alignment.
- Removed extra password visibility/action icons caused by legacy global icon injection. One eye icon per password input.
- Responsive layout adapted to desktop, tablet, and very narrow mobile widths.
- Preserved Supabase login/sign up, recovery, account deletion modal, typed DELETE confirmation, and cloud/data features unchanged.
- Rebuilt the runtime from v296 with the accepted v297 module only once (previous v297 bundle had accidentally inserted it repeatedly). The v298 patch is isolated and after the feature module.

## Release / PWA
- Version, version.json, package.json, meta, and PWA shell advanced to 298.
- New stylesheet: assets/css/158-v298-auth-layout-fix.css
- Runtime: assets/js/mediaflow-v298.bundle.js
- Service-worker shell: mediaflow-pwa-v298-shell-v1
- Existing Cloud Sync / Full Backup / Settings Presets / Personal Order / Collections formats are not changed.
