# MediaFlow v373 — modular website release

This ZIP contains the ready-to-deploy MediaFlow v373 app shell, source JS, newly built v373 production bundle, CSS, icons, PWA worker, v373 tests and detailed changelog. It is built directly from the v372 website.

To deploy on GitHub Pages, copy the ZIP's contents to the same root folder containing your existing `index.html`. Preserve unrelated files; replacing only these matching paths is sufficient. Commit/deploy to GitHub Pages and refresh the web/PWA application. The Android and Windows website-shell apps then use the deployed version.

**Default logging Library order:** oldest Library additions first. Choose another sort, or select My custom order for drag-and-drop, arrows and a global position input. Applies to Quick, Per Unit and Batch Log.

No Supabase database migration is required. Back up your Library before any release deployment as a normal precaution.

See `CHANGELOG_v373.md` for the full change list, tests and limitations.