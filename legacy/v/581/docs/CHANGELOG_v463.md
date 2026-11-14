# MediaFlow v463 Stable — Recommended Title Fresh Episodes Remaining

## Dashboard → MediaFlow Recommends
- Add a clearly labeled **Recommended title · fresh episodes left** statistic for the specific Seasonal Anime title currently recommended.
- Calculate the number from the existing verified released-episode ledger minus **current saved Library progress**, updating automatically after logging, editing progress, changing recommendations, or refreshing the checker.
- Show **0 / Caught up** when verified released episodes are fully consumed; show **Awaiting verification** when the provider result is missing, stale, mismatched, invalid or otherwise Unknown — never invent a zero from partial/unverified results.
- Display a provider name when a trustworthy matched source has been recorded; distinguish this per-title number from the existing **Verified fresh remaining** category total.
- The title-specific tile appears only when Seasonal Fresh Episodes is **not Manual**. Manual checker selection hides it entirely, without affecting existing title progress/category statistics or recommendations.
- The tile is theme-native, responsive, readable and keyboard/screen-reader friendly on desktop, tablet and small phones.

## Data integrity
- Uses v401/v402 verification outcome and v377-backed ledger rather than starting a scan, guessing from total episode count, or changing any progress/history.
- Leaves existing recommendation ranking, rerolls, fresh-only filter, Cover/Metadata Recovery and Supabase settings untouched.

## Verification and release
- New deterministic regression covers 12 aired/1 logged -> **11 left**, update to 11 logged -> **1**, verified caught-up -> **0**, Unknown, invalid count, Manual, non-Seasonal categories, missing title.
- Chromium desktop and 360px mobile checks plus v462 recovery regression.
- Clean v463 build/PWA, complete project archive at `legacy/v/463`, numeric release `463` with ZIP + checksum.

Next planned feature: **v464 — MediaFlow Recommends: External Ratings Integration**.
