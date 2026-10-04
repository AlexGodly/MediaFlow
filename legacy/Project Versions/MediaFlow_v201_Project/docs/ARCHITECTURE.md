# Architecture

## Runtime model

MediaFlow remains a single-page application. `index.html` provides only the root container and resource links. The runtime bundle renders the navigation shell and active view into `#app`.

## JavaScript organization

The original JavaScript relied heavily on one private IIFE scope. A direct conversion to independent ES modules would require changing thousands of implicit cross-feature references and would create unnecessary regression risk in the same refactor.

For v201, the source is therefore split into **ordered build-time fragments** by responsibility. `scripts/build.mjs` assembles those fragments back into the same private IIFE boundary. This gives a professional source tree now, without exposing internal state globally or changing application semantics.

Main pages live under `src/js/views/`:

- `dashboard.js`
- `library.js`
- `batch-log.js`
- `history.js`
- `statistics.js`
- `profile.js`
- `settings.js`

Shared application state and behavior live under `src/js/core/`; shell/modal/sidebar code lives under `src/js/ui/`; later feature layers live under `src/js/features/`.

## CSS organization and cascade safety

The single HTML accumulated 74 `<style>` blocks over many releases. Later blocks intentionally override earlier blocks, so re-sorting CSS by selector or alphabetically would be unsafe.

The refactor groups contiguous style blocks into named stylesheets while preserving their original order. Two stylesheet groups intentionally remain in the body because they originally loaded around the runtime script; this keeps cascade and startup behavior as close to v201 as possible.

A later visual-regression pass can consolidate duplicate selectors safely, but that should be done separately from the structural migration.

## Data and cloud behavior

Supabase, local persistence, backup/import/export behavior and the existing state schema are left in the application source. The public Supabase browser client is still loaded before MediaFlow's runtime bundle, matching the original order.
