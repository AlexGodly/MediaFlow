# MediaFlow v215 Architecture

## Objective

v215 is a structural refactor of stable v201. The priority is behavior preservation first, then progressive modular extraction in later releases.

## Runtime layers

1. `index.html` — clean application entry point and dependency ordering.
2. `assets/css/*.css` — CSS extracted from 74 inline style blocks and grouped in the original cascade order.
3. Supabase CDN — retained exactly as the v201 runtime dependency.
4. `assets/js/mediaflow-v215.bundle.js` — generated compatibility bundle preserving the v201 shared closure.
5. Late theme/control styles — still linked after the app script to retain the original pre/post-script stylesheet ordering as closely as possible.

## JavaScript source organization

`src/js/parts/` is intentionally split by contiguous feature generations. These fragments share the original v201 IIFE lexical scope and are concatenated by `scripts/build.py`.

This is safer than pretending the old code is already independent ES modules. Future refactors can now move one feature at a time from a source part into a true module with explicit imports/exports.

## Recommended future extraction order

1. Reusable UI primitives: modal, pagination, cover rendering, category filter.
2. State/storage/cloud adapters.
3. Page renderers: Dashboard, Library, Personal Order, History, Statistics, Settings.
4. Feature services: Logging, Scheduler, XP, Backup, Import.
5. Legacy migrations isolated behind a migration runner.

## Version/data compatibility

- UI/app release number: **215**
- Stable feature base: **201**
- Cloud sync contract: **201**
- Full Backup schema: **29**
- Settings Preset schema: **1**

The higher app version does not imply a persistent-data migration.
