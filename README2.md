# MediaFlow v406 — Technical Release Notes

**Version:** v406 Modular  
**Baseline:** v405 Modular  
**Date:** October 13, 2026  
**Developer:** Alex Godly  
**Database migration:** None  
**Status:** Locally packaged source update; no live deployment or production data modification.

## What's new

1. **Personal Order / Add Titles:** `Tools & Filters → Show` offers All titles, Not added, and Already added. Membership follows the live Personal Order title queue.
2. **Personal Order / Add Collections:** The same three-way Show filter, scoped to collections assigned to the currently selected Personal Order category.
3. **Logging / Library:** The same three-way Show filter, scoped to the current unsubmitted Logging draft rather than historical consumption.
4. **Library Normal + Dynamic, Collections:** Searchable bulk action pickers for Move to Category, Set Status, and Set Priority, using the real icon and saved `v230ChoiceLayout.setCategory`, `.setStatus`, and `.setPriority` orders. The original mutation handlers remain authoritative.
5. **Responsive popups:** Viewport-positioned menus, Search without focus loss, Escape and outside-click dismissal, and narrow-screen layout controls.
6. **Compatibility:** No persistent schema changes. v405 cloud, backups, PWA update and Fresh Episodes systems are preserved; v406 app shell and metadata regenerated.

## Tested locally

- Build/Node syntax validation; four responsive headless-browser fixture widths (320, 390, 820, 1280).
- Exact custom ordering for categories, statuses, priorities; Search filtering; all three membership-filter semantics.
- Collections bulk controls; inherited v405 1,555-record synthetic transfer test without XP mutations.
- These are isolated fixture and compatibility checks, **not** authenticated live Supabase synchronization or a full installed-PWA test. Full Library page mounting requires authenticated state and was not established in this isolated fixture.

**Detailed changelog:** [docs/CHANGELOG_v406.md](docs/CHANGELOG_v406.md)

---

## Prior technical release notes

- [v405 — The Data Integrity & Experience Update](docs/CHANGELOG_v405.md)


- [v404 — The Smart Engine & Refinement Update](docs/CHANGELOG_v404.md)

- [v403 — Evidence-qualified single-source verification](docs/CHANGELOG_v403.md)
- [v402 — Comprehensive verification and data-integrity improvements](docs/CHANGELOG_v402.md)
- [v401 — Automatic all-provider verification and recommendations](docs/CHANGELOG_v401.md)
- [v400 — Independent timestamps and picker workspace](docs/CHANGELOG_v400.md)
