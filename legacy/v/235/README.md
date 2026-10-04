# MediaFlow v235 — Modular Project

**App release:** v235  
**Stable feature base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1  
**Personal Order Export:** v4

MediaFlow v235 upgrades **Dashboard → Missing Covers** with live cover previews and direct-image validation. A pasted URL can temporarily preview on the poster, but the title is not changed until the URL successfully loads as an image and the user presses **Save Cover & Next**.

## Main v235 changes

- Live Missing Covers poster preview for valid pasted image URLs.
- Direct-image validation using actual browser image loading rather than filename extensions.
- **Save Cover & Next** remains disabled for empty, malformed, broken, or non-image URLs.
- Inline checking/valid/invalid notices explain the current URL state.
- Preview state is transient and never persists the cover before explicit confirmation.
- Existing cover XP, queue advancement, Library persistence, cloud sync and backup behavior remain unchanged.

## Build and validation

```bash
python scripts/build.py
python scripts/check.py
python scripts/smoke-ui.py
python scripts/smoke-v234.py
python scripts/smoke-v235.py
python scripts/perf-v232.py
```

See `docs/CHANGELOG_v235.md` for the full release notes.
