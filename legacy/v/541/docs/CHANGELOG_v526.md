# MediaFlow v526 Stable — Universal Progress Sorter Labels

## Overview

Standardizes existing sorter names across the MediaFlow web app so the controls describe progress generically, without assuming episodes or chapters.

| Stored sort key | New displayed label |
| --- | --- |
| `progress` | **Consumed progress** |
| `total` | **Total progress** |
| `remaining` | **Remaining progress** |

The sorting algorithms, saved keys, directions, title data, metadata, history and cloud persistence remain unchanged. This is a display-only terminology update.

## Surfaces

- Normal Library and Dynamic Library share the canonical Library sorter
- Logging: Arrange Your Session, and the Library title selection browser
- Personal Order: Add Titles browser and title-selection workspace
- Collections: title browser, Add Titles and collection title pickers
- Batch Log's existing sort picker (for compatibility)

The distinct **Collection completion percentage** sorter is left unchanged; it sorts a collection's completion percentage rather than a title's consumed progress.

## Scope and safety

This release only renames sort labels. It does not yet add the planned Watching, Reading, Playing and Listening category expansion or new category units. That proposal remains separate and can move to the next version.

Test `tests/test-v526-universal-sort-labels.cjs` verifies canonical sort definitions and checks the actual generated production bundle for previous episode/chapter-specific sorter labels. Existing v514–v525 tests and PWA validations remain enabled.

Full version archived under `legacy/v/526`; GitHub Release tag `526` and GitHub Pages deployment.
