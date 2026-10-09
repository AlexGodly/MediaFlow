# MediaFlow v329 — Public Profile Accuracy, Category Icons & XP Parity

**Version:** 329 · **Base:** v328 Community Modular · **Date:** 2026-10-09 · **Author:** Alex Godly

## Purpose
v329 corrects public-profile category artwork, History session title/cover display, profile-only Workspace controls, Collection sharing, Favorites search, and the mismatch between private Workspace XP and Community/Public Profile XP. The single-source-of-truth architecture from v327/v328 is preserved: public media is read from the original compressed `mediaflow_states` cloud record; this release creates no duplicated media tables or catalog copies.

## 1. Category icon rendering: URLs, packaged artwork and emoji
- The public live API now allows **exactly** the 22 built-in `assets/category-icons/<name>.png` paths in addition to approved HTTPS custom icon URLs; no arbitrary relative image sources are admitted.
- The native public renderer resolves packaged icon URLs against the deployed MediaFlow JavaScript bundle base (including GitHub Pages subdirectory hosting), so the read-only HTML sanitizer can safely retain HTTPS image URLs.
- Category chips, category lists, the Media Universe area and supporting public-native components reuse proper icon rendering. Genuine emoji icons are still supported as fallback. An invalid/broken icon falls back to a meaningful emoji rather than the confusing 🖼️ placeholder.
- The original private Workspace category icons and editing behavior are preserved.

## 2. Per-Collection public/private control in private Workspace
- Inside the owner's **normal Workspace Collection Details**, a themed “Community & public profile” visibility section now reports sharing state and provides **Make Public / Make Private**.
- Sharing writes a single owner/Collection ID permission to `mf_collection_shares_v328`, never copied titles, covers, descriptions or Collection media. Unsharing deletes that permission.
- The status refreshes from the existing sharing-permission table. The option is intentionally present only for one's *own private Workspace Collection Details*; the guest public Collections view remains read-only.
- Previously public Collections stay discoverable subject to existing profile visibility and permission checks.

## 3. Public Personal Order — read-only tools only
- In another user's **public-profile Personal Order**, remove both the **Add Titles** and **Add Collections** authoring panels (including picker tools), while retaining normal browsing, ordered titles, assigned Collection display, filters and compatible view options.
- The owner's actual Workspace Personal Order screen is completely unchanged.

## 4. Public History — actual consumed titles and covers
- The live public History projection now retains a sanitized `titles` array for each consumption session with title ID, **real title name**, available HTTPS cover, amount and eligible season/episode context.
- The server resolves references against the viewed owner's *existing* Library in memory and does not publish a second Library copy.
- The public History state constructs only the title lookup entries referenced by accessible History sessions, so the original consumption History cards display the consumed title names and real artwork, instead of substituting the Category name for each logged title.
- The private Workspace History renderer is untouched.

## 5. Public Statistics — profile-only simplification
- Rename the public activity card heading to **Active time** (previously **Your active time**).
- Remove avatar, profile name and account-identity copy within the public Statistics profile-hero block, retaining **Titles, Sessions and Time Consumed** metrics.
- Only the public-profile Statistics HTML is sanitized this way. Private Workspace Statistics displays the full original profile and activity headings.

## 6. Public Old System — Statistics only
- The guest-facing native Old System view now forces and preserves **Stats** mode; the System/View tabs are suppressed in the public profile.
- Owner's private Workspace Old System tabs and full actions remain unchanged.

## 7. Public Library — safe viewing and Quick Add
- Suppress **Fix Completed Titles** and other repair/quick-edit actions, including direct quick Category, Status and Priority changes, inside guest public Library only.
- Preserve original Workspace Library browsing, title cards, filters, sorting, search and view modes.
- Clicking a public Library cover/title now opens a specifically designed read-only title-details dialog with **Quick Add to my Library**. Signed-in visitors select one of their *own* Categories; the new entry is added to their own private Library and saved through existing state persistence. Duplicate-checking prevents re-adding the same title to the same Category.
- Signed-out visitors receive a Sign in to Quick Add prompt; no attempt is made to write to the profile owner's private account.
- Owner's actual private Workspace Library editing remains untouched.

## 8. Their Media Universe — accurate Category ordering and counts
- The public live metadata response includes category-specific title counts computed directly from the owner's existing Library.
- The public Media Universe preserves the owner's **original Category order** and displays per-category icons (built-in, URL, or emoji), display names and title counts. Empty Categories show **0 titles**.
- Counts reflect the last successfully synced owner cloud state, and update after new Cloud Sync and profile refresh.

## 9. Better icons in profile actions
- Replace ambiguous Share Profile decoration with an explicit Share glyph.
- Use a **Palette** icon for MediaFlow Theme and an **Image** icon for Profile Theme, retaining theme-state indication and the existing appearance preferences.

## 10. Profile Studio Favorites search redesign
- Favorite title search is now styled like the familiar MediaFlow Logging search, with a results header, thumbnail artwork or proper Category icon fallback, title, Category and Status subtitle, match highlighting by order, and direct Add controls.
- Case-insensitive ranking puts exact title matches ahead of prefix matches, followed by other title matches.
- A compact **12 results per page** selector avoids dumping thousands of matches into Profile Studio.
- Existing Favorites storage remains ID-only; no title metadata is copied to the public database.

## 11. Workspace / Community XP parity
- The previous v328 `mediaflow-community-live` implementation calculated XP from an incomplete subset of private XP sources, producing mismatched levels and amounts in Community User Rankings and the public-profile header.
- Both deployed Edge Functions now share the **v329 Core XP** calculation modeled on Workspace `v150ComputeStateMetrics`: eligible sessions, rotation and streak multipliers, configurable rewards, Library additions, completion bonuses, Library edits, manual cover rewards, rating rewards and logged-completion awards.
- The original `mf_time_xp_v316.xp_total` active-time ledger is added separately to Core XP, matching the private Workspace's source-of-truth accounting model.
- The existing original Workspace leveling curve is preserved for Community Level presentation. Hidden XP remains hidden under public-profile visibility settings.
- Neither function writes new XP copies or modifies the owner's progression.
- **Validation qualification:** eight parity fixtures matched the actual original Workspace calculation across the two backend sources. Live production per-account verification after deployment remains recommended.

## 12. Technical changes
- New `src/js/components/253-v329-public-profile-parity.js` and `assets/css/183-v329-public-profile-parity.css`.
- Updated `supabase/functions/mediaflow-public-live/index.ts` and `supabase/functions/mediaflow-community-live/index.ts` (superseding v327 public API and v328 Community API versions).
- Updated runtime list, version metadata, v329 React UI asset, JavaScript bundle, both HTML entrypoints and PWA shell cache `mediaflow-pwa-v329-shell-v1`.
- Added `scripts/test-v329-native-parity.py`, `scripts/test-v329-xp-parity.mjs`, `scripts/test-v329-community-edge.mjs`, `scripts/test-v329-live-community-browser.py`, `scripts/test-v329-regression-social-ui.py`.
- Private Cloud Sync v201, full backup v29, Settings Presets v1, Personal Order v5, Collections v2 unchanged. No SQL schema change for v329.

## 13. Automated validation
| Suite | Passed checks |
|---|---:|
| Native Public Profile, History, icons, Quick Add, Collections sharing, Favorites and responsive widths (1440/768/390/320) | 222 |
| Live Community Browse / Ratings / Collections / Users page regression | 44 |
| Mocked live Community Edge backend privacy and aggregation | 20 |
| Direct reference Workspace XP parity in both API functions | 8 |
| Existing Friends / Inbox / Social UI regression | 132 |
| **Combined passed checks** | **426** |

Full Edge Function TypeScript syntax checks, v329 bundled JavaScript syntax checks, and PWA asset build were also validated.

**Limitations:** browser tests and backend tests use mocked endpoints/fixtures; real cross-account and large-Library HTTP testing is still required after deploying the v329 frontend. This release does not replace the GitHub Pages v301 deployment automatically. Check the profile privacy settings and exact XP values using separate real accounts after updating the website.

## 14. Release sequence
v323: public profile snapshot tabs → v324: Workspace-inspired presentation → v325: original renderer bridge for five tabs → v326: original Statistics bridge → v327: live original Workspace read-only profile → v328: live Community with no media duplicates → **v329: profile presentation correctness, original History title data, per-Collection sharing and XP parity**.
