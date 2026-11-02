# MediaFlow v436 Beta — Recovery Selection and UI Consistency

This release implements the confirmed user requests on top of v435, without changing the secure API gateway, metadata stored in existing titles, recovery history, XP transactions, cloud schema or MediaFlow Plus/App.

- **Find IDs:** magnifying glass `search` icon, exactly one icon on initial paint and after repaint.
- **MyAnimeList:** remove the redundant field-level Verify button, preserving the actual MAL ID field and ID recovery.
- **Floating quick actions:** a fourth action, **New Cover Recovery**, alongside the existing Logging, Add to Library and Add Collection actions. It opens the exact existing Cover Recovery configuration modal; starting a job still requires clicking Start Recovery.
- **Selected Library titles:** collect unique checked Library-title IDs across the Library, Collections and compatible title pickers. Snapshot the selected list when opening recovery; display the total and eligible missing-cover count, preview and remove selections before starting. Users may switch to All Library or category scopes. Single-title editor recovery remains exclusive.
- **Settings:** Cover Recovery section uses the same uppercase title scale and weight as Library Maintenance.
- **Rotation XP Multiplier defaults:** Neglected 10×, Due 8×, Healthy 5×, Overused 2×, including individual Reset and Restore All from the canonical defaults. Preserve user-defined values unless reset.
- Browser/desktop/mobile and 100k synthetic regression coverage. Existing users' Library/History/Collections are not modified by this update.

No Podcast Index integration. Restricted provider APIs remain disabled.
