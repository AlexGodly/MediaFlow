# MediaFlow v223 — On This Day Dashboard Visibility

## Dashboard Settings

- Added a new **On This Day** show/hide setting.
- Positioned **On This Day** directly below **Today's Balance** in Dashboard Settings.
- Default remains **shown**.
- Turning it off hides only the Dashboard On This Day section.
- On This Day History data is never deleted by this setting.
- On This Day theme/cover sources remain available to theme systems even when the Dashboard card is hidden.

## Persistence / Reset Audit

- Stored in the existing `settings.v192Dashboard.showOnThisDay` preference container.
- Included in local Settings persistence.
- Included in cloud merge and Sync Now verification through the existing Dashboard settings audit.
- Explicit v223 cloud verification added.
- Included in Full Backup manifest/audit metadata.
- Included automatically in Automatic Backup through the Full Backup builder.
- Included in Settings Presets.
- Included in **Dashboard Settings → Reset section**.
- Included in individual **Reset** controls.
- Included in **Restore all defaults**.
- Default reset value is `true` (shown).

## Compatibility

- Stable feature/data base remains **v201**.
- Cloud Sync version remains **v201** because the new preference is merged inside the already-supported `v192Dashboard` settings object.
- Full Backup schema remains **v29** because the existing schema already serializes the complete Settings object.
- Settings Preset schema remains **v1** because presets already serialize the complete Settings object.
- No Library/History/XP data migration is required.

## Release

**Release:** MediaFlow v223  
**Base:** MediaFlow v222 Modular  
**Created by:** Alex Godly
