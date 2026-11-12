# MediaFlow v390 — Library Search Caret & Selection Stability

**Application:** MediaFlow  
**Version:** v390 Modular  
**Baseline:** v389 Modular  
**Date:** October 12, 2026  
**Developer:** Alex Godly  
**Type:** Library UX bug fix, focus/caret reliability, regression protection  
**Status:** Built and locally tested

---

## 1. Problem

When a user corrected a typo **inside** a Library search query, the search results could refresh and move the text insertion caret to the end of the search field. A previous focus fix prevented the search box from being deselected, but it did not reliably preserve the user's chosen insertion point or selected range when multiple older focus-restoration callbacks ran.

Example: enter `hot inhumans`, click immediately after `hot`, and insert `el`. The expected result is `hotel inhumans`; the old behavior could place the caret at the end and append the correction there instead.

## 2. Root cause and correction

MediaFlow's v265 Library-focus layer schedules follow-up cursor restoration after **two animation frames, 48 ms, and 130 ms**. The v281 search layer separately restores a saved selection synchronously, in a microtask, and in the next animation frame. The debounced search update also retained a cursor position captured at the time of the earlier `input` event. These asynchronous restoration paths could replay **stale snapshots** after a user had already clicked elsewhere in the query.

v390 makes the **currently focused search input authoritative**:

- Once the search field has focus, delayed restoration never overwrites its live caret or text selection.
- Deferred refreshes capture the most recent caret **immediately before the refresh**, rather than relying on the position from the last keystroke.
- Restoration of a replaced input preserves selection start, selection end, and direction, including backward selections.
- Stale restores are rejected if a newer search sequence or newer search value exists.
- Restoration does not steal focus from a different connected field, button, or navigation control.
- The synchronous render guard can reattach focus to the replacement input only when the original search was focused and no other live control has focus.
- The preexisting debounced filtering, cache invalidation, pagination reset, and Library filtering logic remain in place.

This is a targeted bug fix, **not** a change to search matching algorithms or cloud data.

## 3. Files changed

| File | Change |
|---|---|
| `src/js/components/199-v265-ux-stability-library-balance-sidebar.js` | Guard delayed focus restores against live selections and unrelated focus targets. |
| `src/js/components/215-v281-collections-responsive-cloud-library-search.js` | Resolve the latest caret when the debounce actually renders; preserve selection direction and suppress stale async restores. |
| `src/js/components/284-v390-library-search-caret-stability.js` | Final render guard for replaced search inputs, with strict focus and state checks. |
| `src/js/runtime-order.json` | Register the v390 module after previous runtime components. |
| `scripts/test-v390-library-caret.py` | Browser-level regression suite exercising both Library renderers and the actual compiled application. |
| `scripts/test-v390-save-compat.py` | Save, Logging, and title-editor compatibility smoke test against the v390 bundle. |
| `assets/js/mediaflow-v390.bundle.js` | Rebuilt complete modular JavaScript bundle. |
| `VERSION`, `version.json`, `package.json`, `index.html` | Updated release/version references. |
| `sw.js`, `manifest.json` | Regenerated PWA metadata and app shell, cache `mediaflow-pwa-v390-shell-v1`. |
| `README.md`, `README2.md` | Updated release documentation. |

## 4. Preserved functionality

The fix maintains the existing Library interface, Normal/Dynamic modes, search and filter functionality, sorting, pagination, title management, cover displays, dynamic themes, and performance cache. It does not alter Logging, XP, History, Personal Order, Collections, saved Library data, cloud schemas, backup formats, or import/export formats.

## 5. Browser regression tests

The v390 script loads the **actual compiled MediaFlow Library renderer** with synthetic local Library data, not a recreated search-bar mockup. It was tested in headless Chromium under these seven mode/viewport combinations:

| Viewport | Library mode | Result |
|---|---|---|
| 320 px | Normal | Passed |
| 390 px | Normal | Passed |
| 390 px | Dynamic | Passed |
| 820 px | Normal | Passed |
| 820 px | Dynamic | Passed |
| 1280 px | Normal | Passed |
| 1920 px | Dynamic | Passed |

**Verified in each case:**

1. Enter `hot inhumans`.
2. Move the caret to index 3 before the debounced refresh completes.
3. Wait for the asynchronous render and old restore timeouts; the caret remains at index 3.
4. Insert `el`; the query becomes `hotel inhumans` and the caret remains after `hotel`, not at the end.
5. Select `hotel` backward, rerender, and preserve both selection endpoints and selection direction.
6. Focus a different button, rerender, and verify that search does not steal focus.
7. Verify the browser reported no uncaught page errors.

**Compatibility checks:** The existing v388 save/navigation flows also passed against the v390 bundle at 390 px and 1280 px, including Cancel Logging, Quick and Per Unit submission, Library progress updates, Add/Edit Title saving, and invalid external-ID validation.

**Build checks:** JavaScript bundle syntax passed, current application shell references verified, and ZIP integrity checked.

**Limitations:** The tests use synthetic data rather than a real signed-in account. Native mobile text-editing handles, IME composition, live Supabase behavior, installed-PWA upgrade behavior, and production-size Library performance were not independently tested. There are no measured speedup claims in this release.

## 6. Version evolution

| Release | Main focus |
|---|---|
| v386 | Browse Library canonical theme-color repair. |
| v387 | Logging Added Titles scroll stability. |
| v388 | Dashboard return-scroll fix and save-path optimizations. |
| v389 | Responsive Logging Browse Library controls and title-card layouts. |
| **v390** | **Preserving the Library search caret and selected text across refreshes.** |

## 7. Summary

MediaFlow v390 closes the gap between **keeping search focus** and **keeping the precise editing position**. Users can correct a typo in the middle of a query without delayed rendering resetting the text cursor to the end. Normal and Dynamic Library retain the same behavior, and the existing search, filtering, data and cloud systems are left unchanged.

**Developed by Alex Godly — MediaFlow v390, October 12, 2026.**
