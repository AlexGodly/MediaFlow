# MediaFlow v247 — PWA Install Reliability, Diagnostics & Cache Repair

MediaFlow v247 focuses on making the Progressive Web App installation path easier to diagnose and substantially more resilient when GitHub Pages, browser cache state, or an individual app-shell asset prevents Chrome from offering a normal install flow.

## Fault-Tolerant Service-Worker Installation

The generated service worker no longer relies on one all-or-nothing `cache.addAll(APP_SHELL)` operation.

Each local app-shell asset is now cached independently. A single temporary 404, unavailable stylesheet, icon, or bundle request no longer rejects the entire service-worker installation event.

Failed cache entries remain visible through the new diagnostics system and can be retried without reinstalling MediaFlow.

## Automatic Activation Retry

When the v247 worker activates, MediaFlow checks which app-shell assets are still missing from the current release cache and automatically retries those entries once.

Obsolete MediaFlow PWA caches are still cleaned up normally.

## PWA Diagnostics

A new **PWA Diagnostics** panel is available in the existing Install MediaFlow card under Settings.

The diagnostic runner checks:

- secure-context availability
- Web App Manifest loading
- required manifest fields
- manifest start URL and scope relationship
- 192×192 install icon availability
- 512×512 install icon availability
- service-worker file availability
- service-worker registration
- worker lifecycle state
- whether the current page is controlled by a worker
- app-shell cache completeness
- every local generated app-shell URL
- whether the browser has exposed a native install prompt

If a deployed asset fails, MediaFlow displays the exact failing path and HTTP/fetch state instead of leaving the user with only the browser's generic install failure message.

## Run PWA Test

The Install MediaFlow card now includes:

> **Run PWA Test**

This performs an explicit live deployment check against the current hosted build.

The result is summarized as:

- Passed
- Warnings
- Needs attention

## Repair App Cache

A new:

> **Repair app cache**

control asks the current v247 service worker to retry missing app-shell entries.

After repair, MediaFlow automatically runs diagnostics again so the user can immediately see whether the shell became complete.

## Service-Worker Diagnostic API

The generated worker now supports internal message actions for:

- `GET_DIAGNOSTICS`
- `RETRY_APP_SHELL_CACHE`
- existing `GET_VERSION`
- existing `SKIP_WAITING`

The diagnostic response reports the current worker version, release cache, app-shell size, cached count, missing cache entries, and generated app-shell list.

## Better Install-State Explanation

The Install MediaFlow card now distinguishes between situations such as:

- MediaFlow already installed
- native install prompt available
- PWA checks currently running
- PWA checks passed
- PWA checks passed with warnings
- one or more PWA requirements/deployed assets failed
- service worker ready but the browser has not exposed `beforeinstallprompt`

The Install button remains useful even when Chrome does not expose a native prompt: MediaFlow can run diagnostics and then show the existing platform-specific install instructions when the technical checks pass.

## Exact Deployment Validation

The v247 diagnostics system can verify the complete app-shell URL set generated for the release rather than relying on a hard-coded list in the UI.

This is especially useful for GitHub Pages because a case-sensitive path mistake, missing generated bundle, or missing stylesheet can now be identified directly.

## GitHub Pages Compatibility Preserved

MediaFlow remains designed for:

> `https://alexgodly.github.io/MediaFlow/`

The manifest still uses relative:

- `start_url: "./"`
- `scope: "./"`

and the worker remains scoped to the MediaFlow GitHub Pages directory.

## PWA Build Automation Preserved

`scripts/build.py` still runs `scripts/pwa.py` automatically.

The v247 PWA generator continues to:

- read the current `VERSION`
- update `version.json`
- keep manifest installation fields aligned
- discover current local CSS/JS entry assets
- generate the release-specific cache name
- generate `sw.js`

The v247 release cache is:

> **mediaflow-pwa-v247-shell-v1**

## Mobile / Tablet PWA Support Preserved

All v246 responsive work remains active, including support for:

- desktop
- tablet
- standard phones
- very narrow phones
- extremely tight PWA windows
- standalone safe-area handling

The new diagnostics panel also adapts to mobile and very narrow layouts.

## Official Branding Preserved

The v245 official MediaFlow icon remains the canonical identity for:

- favicon
- browser tab
- PWA install icon
- 192×192 icon
- 512×512 icon
- maskable icon
- Apple Touch icon
- Install MediaFlow card

## Existing MediaFlow Systems Preserved

v247 is a PWA reliability/diagnostics release. It does not change MediaFlow user-data formats.

Compatibility remains:

> **Cloud Sync:** v201  
> **Full Backup Schema:** v29  
> **Settings Preset Schema:** v1  
> **Personal Order Export:** v4

Existing Dashboard, Library, Dynamic Library, Personal Order, Batch Log, History, Statistics, Settings, Account, logging, recommendation, large-library performance and persistence systems remain unchanged.

## Validation

v247 adds `scripts/smoke-v247.py` to validate:

- fault-tolerant worker generation
- diagnostic worker messages
- cache-repair messages
- current release cache version
- diagnostics runtime API
- diagnostics Settings UI
- manifest compatibility
- generated app-shell reporting

## v247 Release Summary

**Release:** MediaFlow v247  
**Codename:** **PWA Install Reliability, Diagnostics & Cache Repair**  
**Base:** MediaFlow v246 Modular  
**Stable feature base:** MediaFlow v201  
**Created by:** Alex Godly

### Main Changes

- Replaced all-or-nothing PWA app-shell caching with fault-tolerant per-asset caching.
- Prevented one temporary/missing optional asset from rejecting the whole service-worker install.
- Added automatic activation-time retry for missing app-shell entries.
- Added `GET_DIAGNOSTICS` worker messaging.
- Added `RETRY_APP_SHELL_CACHE` worker messaging.
- Added live PWA Diagnostics to Settings.
- Added **Run PWA Test**.
- Added **Repair app cache**.
- Added manifest validation.
- Added service-worker registration/lifecycle validation.
- Added worker-control validation.
- Added cache-completeness validation.
- Added complete generated app-shell URL validation.
- Added exact failed-asset reporting.
- Added clearer native-install-prompt status.
- Improved Install MediaFlow fallback behavior when Chrome does not expose `beforeinstallprompt`.
- Added responsive diagnostics UI for tablet, mobile and very narrow devices.
- Preserved v246 responsive PWA behavior.
- Preserved v245 official icon branding.
- Preserved GitHub Pages-relative scope.
- Preserved controlled service-worker updates.
- Preserved network-first navigation and offline app-shell fallback.
- Preserved automatic release/cache generation through `scripts/pwa.py`.
- Preserved Cloud Sync v201.
- Preserved Full Backup Schema v29.
- Preserved Settings Preset Schema v1.
- Preserved Personal Order Export v4.
- Added v247 regression validation.
- Updated MediaFlow version to **247**.

## Version Progression

**v243** → Logging artwork fallback fix & Batch Log Category Filter visibility repair  
**v244** → Progressive Web App support & GitHub Pages installability  
**v245** → Unified branding, official favicon & PWA icon refresh  
**v246** → Responsive PWA experience, mobile optimization & PWA controls repair  
**v247** → **PWA install reliability, diagnostics & cache repair**
