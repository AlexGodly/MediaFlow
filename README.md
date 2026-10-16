## MediaFlow v442 — Recovery Integration & Performance Hardening

MediaFlow by Alex Godly, personal web/PWA edition.

This completes the v437–v442 recovery architecture roadmap. Both Cover Recovery and Metadata Recovery now share a safer account-scoped local-browser process guard that prevents two tabs in the same browser profile from applying the two recovery jobs simultaneously. The lock is **not cross-device**. Slow lookups verify ownership before saving, and durable batch checkpoints advance only after the Library save completes. Interrupted saves retain the current title for safe retry.

Metadata title lookup now uses a selected-title index for better performance on 100K libraries. A title edited during recovery is skipped rather than overwritten; manually protected values, personal scores, progress and existing covers are preserved. Recovery Workspace → **Recovery Integrity & Diagnostics** displays checkpoint state, lock status, warnings and sanitized JSON export.

The existing v441 Background Processes widget and v440 artwork sources remain available. No Supabase migration or new API keys are needed.

See [v442 release notes](docs/CHANGELOG_v442.md). Full sources archive under `legacy/v/<version>`, outside the deployed Pages site.
