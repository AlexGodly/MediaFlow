# MediaFlow v379 — Logging Recovery, Personal Order Mixed-Queue Repair & Tenrai Diagnostics

**Release:** v379 Modular — Personal Edition  
**Baseline:** v378 Tenrai Repair (not a rollback)  
**Date:** 11 October 2026  
**Developer:** Alex Godly  
**Delivery:** Complete modular ZIP for local use; no GitHub commit, push, or deployment.  
**Status:** Built and tested against synthetic/local browser fixtures. Live Tenrai, authenticated cloud synchronization, full-library performance and physical-device tests remain outstanding.

## 1. Core Logging repair — Per Unit

**Problem:** v378 introduced a second collapse mechanism independent of the original per-title expansion state. A title could say **Collapse** on the right while its episode entry controls remained hidden, and a second **Expand** control appeared underneath its artwork.

**Changes:**

- Removed the v378 global **Collapse All / Expand All** toolbar and the duplicated inline per-title collapse button.
- Restored the original v370/v371 right-hand **Expand / Collapse** handler as the authoritative state for Per Unit titles.
- Removed the conflicting secondary `mf378-collapsed` CSS class after initial rendering and refreshes.
- Kept episode/chapter number, season, per-unit date/time, duration, repeat consumption, add-unit actions and draft records unchanged.
- Retained itemized entry controls on expanded cards without resetting unsaved units.

## 2. Quick Logging recovery

- Added one functional right-side **Expand / Collapse** action per Quick Logging title card; the duplicate under-cover control is removed.
- Collapsing a Quick title hides detailed progress/amount controls but retains all entered values.
- Expanding immediately restores the editable **Amount Consumed** or **Last Progress** controls.
- Quick draft additions remain zero-consumption until the user explicitly supplies an amount or last progress.

## 3. Show / Hide Added Titles

- Replaced the broken global collapse controls with one **Hide Added Titles / Show Added Titles** control immediately beside **Clear All Titles**.
- Hides the added-title list as a whole without clearing titles, reordering entries, or losing unsaved Per Unit / Quick details.
- The button updates the visible workspace in place without rebuilding the entire page.
- Applies to both Logging interfaces; per-title expansion state remains separate.

## 4. Logging Library selection — always available

**Problem:** Manual checkbox selection failed to enable or update **Add Selected**, while **Select Visible** did work. The original v378 checkbox markup contained improperly nested JavaScript quote characters and could not invoke its handler.

**Changes:**

- Corrected checkbox handler serialization to ensure valid HTML and reliable individual selection.
- Removed the Clean Covers feature and its toggle entirely; no replacement Multi Select toggle is required.
- Individual checkbox changes update the shared selection set, the selected tile state, and **Add Selected (N)** immediately without rerendering the full picker.
- **Select Visible** selects eligible visible entries; **Deselect All** clears the set; **Add Selected** works with manual or bulk selections.
- Already-added titles cannot create duplicate Logging cards.
- Selection is retained when switching between List, Compact, Cards, Covers and Covers + Titles.

## 5. Logging Library layout and covers

- Integrated checkboxes into List and Compact row grids, aligning checkbox, cover, metadata and Add state.
- Integrated selection controls into Cards, Covers and Covers + Titles tiles instead of floating above them.
- Added a subtle theme-aware selected tile outline.
- Increased Logging Library covers by a modest mode-specific amount, with mobile/tablet responsive rules.
- Changed the **Added** action icon from a generic arrow to a check-circle.
- Existing cover URLs, aspect ratios, cropping, and artwork elsewhere in MediaFlow remain unchanged.

## 6. Personal Order — single mixed title/Collection queue

**Reproduction:**

Original: `Anime 1 → Collection → Anime 2`  
Action: move Anime 2 above Collection  
Previously observed wrong outcome: `Anime 2 → Collection → Anime 1`  
**Correct v379 outcome:** `Anime 1 → Anime 2 → Collection`

**Repair:**

- Both titles and assigned Collections now use a shared category queue-token movement helper.
- Every move removes exactly one token and inserts it at the requested destination; unrelated items remain in order.
- After each mixed movement, the category's title-only index is synchronized from the mixed token order to prevent older reconciliation logic from undoing the move.
- Collection arrow buttons and numeric positions use the same queue mover as ordinary titles.
- Added drag handles and native drag/drop support for assigned Collections, including drag targets for adjacent direct titles.
- Added touch-pointer drag handling on title and Collection drag handles, with category safeguards.
- Optimized fully rendered category queues with local DOM reordering where possible; complex/paginated views continue using the existing full renderer.
- Rapid mixed-order saves are debounced and serialized so older saves do not start after newer order changes.
- Dragging never silently reassigns a title or Collection to a different category.
- The existing collection Category Rule, Completed Titles Rule, Open, Show/Hide, Remove and progress state are preserved.

## 7. Automatic MAL Detection — diagnostic repair retained

v379 is built from the v378 **Tenrai Repair** candidate, retaining its nine locally tested episode-data safeguards:

- A successful but empty episode directory is not automatically labeled an HTTP/API failure.
- Verified upcoming titles can correctly have zero released episodes.
- Finished series can use trustworthy completed total-episode data when detailed lists are unavailable.
- Airing series without sufficient episode information remain explicitly **Missing Episode Data** rather than being assigned an invented release count.
- **Retry Missing Episode Data** remains separate from **Retry API Failures**.
- Last verified **Detected Fresh Titles** totals remain protected during incomplete checks.

**Current known limitation:** The user's live test showed **0 request failures, 9 missing episode lists, last trustworthy count 70**. v379 preserves safe classification and retry, but cannot guarantee episode data missing from Tenrai. A complete refreshed count depends on the provider returning sufficient trustworthy information.

## 8. Semantic icon replacements

- **View Unmatched Titles:** filtered list.
- **Check All Unmatched:** checklist.
- **Check Selected:** double check.
- **Retry API Failures / Retry Missing Episode Data / individual Retry:** refresh/retry icon.
- **Logging Added:** checked circle.

## 9. Technical integration

- New runtime module: `src/js/components/275-v379-logging-personal-order-stability.js`.
- Corrected checkbox attribute generation in `src/js/components/274-v378-tenrai-import-logging-order.js`.
- New presentation stylesheet: `assets/css/196-v379-logging-order-ui.css`.
- Updated `src/js/runtime-order.json`, `VERSION`, `version.json`, `package.json`, `README.md`, `README2.md`, `index.html`, app bundle and PWA cache assets.
- Corrected the HTML entry script reference so the app loads the **v379 bundle** rather than the older v378 Tenrai Repair bundle.
- No new database migration required. Existing import/export, cloud and History/XP contracts are not deliberately modified.

## 10. Testing summary

| Verification | Outcome |
|---|---|
| Full 274-source-fragment JavaScript build and `node --check` | Passed |
| Manual checkbox selection immediately enables Add Selected | Passed (390/1280px) |
| Individual select/deselect and Select Visible | Passed (390/1280px) |
| Per Unit expansion, collapse and reopening | Passed (390/1280px) |
| Per Unit added-title visibility and restoration | Passed (390/1280px) |
| Quick Logging right-side collapse and amount preservation | Passed (390/1280px) |
| Exact mixed-queue ordering reproduction and reverse move | Passed (390/1280px) |
| Browser drag of title above Collection | Passed (390/1280px) |
| All Titles continuous, By Category grouping, Tabs and 3-digit positions | Passed at 320, 390, 820, 1280 and 1920px |
| Tenrai missing-data classification and retry contracts | 9 local tests passed |
| Live Tenrai availability, authenticated cloud sync and physical devices | Not verified |
| Large-library movement timing benchmark | Not measured; no speed percentage claimed |

## 11. Packaging and deployment

The release ZIP includes the complete current modular source, generated `assets/js/mediaflow-v379.bundle.js`, v379 stylesheet, PWA metadata, and release documentation. It excludes old generated bundles and development-only artifacts.

To test locally:

```bash
python -m http.server 8080
```

Open `http://localhost:8080`. For a previously installed PWA, verify the updated cache or test on a different localhost port to avoid stale assets. Export a Full Data backup before switching a real account.

**GitHub:** No commit, push, or deployment. If the owner decides to publish, their commit message convention is exactly `379`.

---

**MediaFlow v379 — Developed by Alex Godly.**
