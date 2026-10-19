# MediaFlow v366 — Settings Registration Contract

Settings Center 2.0 now places sections by **explicit registration metadata**, not by guessing from section text. This is the implementation contract for future MediaFlow features. It does **not** create or replace MediaFlow settings values: the real controls, defaults, handlers, cloud persistence, backup and export logic remain in their existing modules.

## Adding settings in a future release

1. Add the actual setting and its control to the canonical MediaFlow Settings renderer (the existing v221/v348 `.section-label` registration system). Do not build a second mobile or desktop copy.
2. When your runtime module initializes, register its section and optional controls, before the user visits Settings:

```js
MediaFlowSettingsRegistry.registerSection({
  id: 'v221-settings-reader-accessibility',
  category: 'appearance',
  subgroup: 'Accessibility',
  keywords: ['reader', 'reduced motion', 'font size', 'visual comfort']
});
MediaFlowSettingsRegistry.registerSetting({
  id: 'reader-motion-toggle',
  section: 'v221-settings-reader-accessibility',
  selector: '[data-setting="reader-motion-toggle"]',
  label: 'Reduce motion',
  keywords: ['animation', 'accessibility', 'motion sickness']
});
```

3. If your feature needs a new Settings category, register it first:

```js
MediaFlowSettingsRegistry.registerCategory({
  id: 'accessibility',
  name: 'Accessibility',
  icon: 'settings',
  hint: 'Comfort, input and readable content',
  description: 'Adjust how MediaFlow looks and feels'
});
```

4. Keep new setting values within the existing `S.settings` / canonical MediaFlow state. New values and defaults still need to be included in the appropriate backup/import/export compatibility handling and in any normalizer where necessary. The registry **only** describes navigation, placement, and search metadata.

## Stable identifiers and ownership

- Section `id` must match the v221-generated section id, or use `title` to match an exact legacy section title.
- `category` is required for correct classification. It must be one of the known category ids; custom categories must be registered first.
- `subgroup` organizes settings panels within their category; an omitted subgroup becomes `General`.
- `keywords` improve search, including terms users may use instead of the exact UI label.
- Setting `id` is a stable identifier used for new favorite shortcuts, so do not rename it casually.
- Setting `selector` points to the actual live control. Custom controls that do not use standard `.field` markup can still be indexed. No duplicate control is created.
- If a setting belongs to an existing section, its category comes from the parent section. To move it to another category, register or split its **parent section**, not a conflicting setting-only category.

## Unknown settings

Unregistered sections still appear under **Uncategorized**, on mobile and desktop. Their existing controls remain functional; standard fields remain searchable, and custom controls can be explicitly indexed. This is an intentional safety fallback, not a guess that they belong to Library.

The Uncategorized navigation category is hidden when it has no sections. Registering a section places it in its declared category on the next Settings render.

## Runtime API

```js
MediaFlowSettingsRegistry.registerCategory(metadata)
MediaFlowSettingsRegistry.registerSection(metadata)
MediaFlowSettingsRegistry.registerSetting(metadata)
MediaFlowSettingsRegistry.refresh()  // Rebuild currently open Settings, when needed
MediaFlowSettingsRegistry.inspect()  // Metadata diagnostics (read-only copies)
```

Registrations normally happen at module initialization, so no manual refresh is required. If metadata changes after Settings has opened, call `refresh()` to use the canonical Settings renderer again. Note that a dynamically registered section must *also exist* in that canonical renderer: registering metadata alone does not invent a control.

## Regression checklist for future releases

- New section is registered and appears under the declared category and subgroup on desktop/mobile.
- Search finds the section and individual controls using their labels and keywords.
- Clicking a result opens the correct live input rather than a cloned or stale element.
- Favorites survive settings refreshes, especially when an explicit setting id is used.
- Unregistered settings land in Uncategorized and remain discoverable.
- Existing 28 pre-v366 sections and XP/cloud/backups retain functionality.
- No horizontal overflow at 320–1920 CSS pixels.

**Compatibility:** Cloud Sync 201, Full Backup schema 29, Settings Presets schema 1, Personal Order format 5, Collections format 2. No Supabase migration for the registry itself.
