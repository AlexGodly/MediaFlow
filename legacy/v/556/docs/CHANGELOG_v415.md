# MediaFlow v415 Stable — Library Overview status breakdown

**October 14, 2026 · Baseline: v414 Hotfix · Developer: Alex Godly**

- Each category Overview card now prominently displays **Total titles**, counting Library entries, not watched units or estimated episode/chapter totals.
- All five title statuses appear in the **same saved order as Settings → Dynamic Status**: Watching, On Hold, Completed, Dropped, and Plan to Watch, with accurate per-category counts including zero values.
- Status counts update automatically when titles change category or status, or when users change their Dynamic Status order. Missing status values use the existing planned/Plan to Watch convention; rare unrecognized statuses are included in an optional Other count so no titles disappear from the total.
- Preserved the existing unit/chapter completion calculation and progress bars separately from these new title counts.
- Responsive, theme-aware status chips in Normal and Dynamic Library; mobile, tablet, and desktop layouts supported.
- Read-only display enhancement: no Supabase, backup, or settings schema migration; existing dynamic status settings remain authoritative.
- Added production-bundle/browser regression tests for status ordering, totals, empty categories, updates to status settings, and card geometry.

**Release assets:** MediaFlow_v415_Modular.zip, full archived version at `legacy/v/415/`.
