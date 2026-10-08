# MediaFlow v298 — Premium Authentication Layout Repair

Built directly from the accepted v297 authentication UI release. The complete v297 auth feature set is preserved; v298 fixes its visual regressions and removes duplicated injected code.

## v298 Changes

- Fixed the login/sign-up screen incorrectly shrinking to the width of its contents and leaving large unused desktop space. The auth composition now fills the available viewport, with a centered full-width layout and balanced columns.
- Restored the approved hero copy: **Your media. Everywhere you are.** with an atmospheric orbital glow scene, rather than oversized line-wrapped paragraphs and cramped three-column information cards.
- Repaired email/password/confirmation field sizing and spacing, removing unwanted nested input borders.
- Eliminated duplicate password-eye icons and prevented MediaFlow's older global semantic-icon enhancer from adding extra icons to the auth UI.
- Preserved v297 designed account deletion and password recovery dialogs, account creation/login, show/hide password controls, and accessibility labels.
- Tablet/mobile automatically use a centered single-column sign-in layout without horizontal overflow.
- Added a branded, local MediaFlow icon for the auth header.
- Fixed v297's accidental repeated insertion of its auth module in the generated bundle, retaining exactly one v297 module and one v298 repair layer.
- Updated release metadata and PWA service worker/cache to v298.

# MediaFlow v296 — Category Recovery Confirmation & Responsive More Navigation

MediaFlow v296 is built directly from v295.

## Highlights
- Adds MediaFlow-designed confirmation popups before **Restore missing defaults** and **Restore last deleted** in Settings → Categories.
- Redesigns the <=1080px **More** navigation surface into a compact, theme-aware MediaFlow panel with a header, close action, page icons, descriptions, responsive grid/list behavior, and viewport-safe positioning.
- Preserves the 22 built-in fresh-account categories introduced in v295.
- Audits and re-stamps the current release across cloud/Sync Now, Full + Automatic Backup, Full Data import/export, Settings Presets, XP, History exports, Personal Order v5 import/export, Collections v2 import/export, automatic update/install, and PWA release artifacts.

## Compatibility
- Cloud Sync: v201
- Full Backup Schema: v29
- Settings Preset Schema: v1
- Personal Order Export: v5
- Collections Export: v2


## v297
- Premium auth experience redesign with a larger two-column login/sign-up layout.
- Added semantic icons for Forgot password, Sign up, and Create account.
- Added password show/hide toggles on auth forms.
- Replaced browser account-deletion confirm/prompt with a MediaFlow-designed destructive confirmation modal.
- Added designed reset-password modal instead of browser prompt.
