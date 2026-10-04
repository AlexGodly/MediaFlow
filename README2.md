# MediaFlow v229 — Modular Project

**App release:** v229  
**Stable feature/data base:** v201  
**Cloud Sync:** v201  
**Full Backup Schema:** v29  
**Settings Preset Schema:** v1

MediaFlow v229 is a focused Library choice-popup release built on v228. It upgrades Set Category to use each category's real Icon URL, removes the category-list scrollbar by showing up to 15 categories at once, adds pagination only when more than 15 categories exist, aligns Set Status icons with Dynamic Library, and restores a clear artwork icon to the Dynamic category-row Icon URL selector.

## Main v229 changes

- **Set Category** now renders `v144CategoryIconHtml(...)`, so a category's configured Icon URL is shown instead of the generic image emoji whenever a valid URL exists.
- Set Category now includes **all current categories**, including categories disabled from scheduling/display.
- Set Category renders up to **15 categories per page** with no internal category-list scrollbar.
- Pagination appears **only when the category count is greater than 15**.
- The Set Category popup automatically opens on the page containing the title's current category.
- Category choices expand into a wider responsive layout and use two columns when needed so 15 choices remain readable at once.
- **Set Status** now uses the exact semantic status icon language already used by Dynamic Library: Plan to Watch, Watching, On Hold, Completed and Dropped.
- Removed the duplicate generic action icon from Set Status choices.
- The **Dynamic category row icons** selector now has an artwork/image icon while preserving its existing values and behavior.
- Preserved v228 Dynamic row ordering, v227 artwork fixes, v226 semantic controls, and all existing data schemas.

## Development

Rebuild the browser bundle:

```bash
python scripts/build.py
```

Run structural checks:

```bash
python scripts/check.py
```

Run Chromium UI smoke tests:

```bash
python scripts/smoke-ui.py
```

For local development use `scripts/serve.bat` on Windows or `scripts/serve.sh` on macOS/Linux.

See `docs/CHANGELOG_v229.md` for the full release notes.
