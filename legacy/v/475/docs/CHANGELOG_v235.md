# MediaFlow v235 — Missing Covers Live Preview & Direct Image Validation

MediaFlow v235 upgrades the Dashboard **Missing Covers** workflow so pasted cover URLs can be previewed safely before they are committed to a Library title.

## Live cover preview

- Pasting or typing a URL into **Missing Covers → Cover URL** now validates the candidate image in the background.
- A successfully loaded direct image URL immediately replaces the Missing Covers poster with a temporary live preview.
- The preview is temporary only. It does **not** modify the title or persist data by itself.
- Category/default fallback artwork is restored whenever the candidate URL is empty or invalid.

## Direct-image validation

- Cover candidates must be valid `http://` or `https://` URLs.
- MediaFlow attempts to load the URL as an actual image instead of trusting the URL text or file extension.
- Image endpoints without a `.jpg`/`.png` suffix can still pass as long as the browser can load them directly as an image.
- Web pages, malformed URLs, broken links, and other non-image resources fail validation.

## Save Cover & Next safety

- **Save Cover & Next** starts disabled.
- The button stays disabled while the URL is being checked.
- Invalid/non-image URLs keep the button disabled and show an inline warning telling the user to use a valid direct image URL.
- A successfully validated image enables the button and shows a confirmation notice that the current poster is only a preview.
- The title's real `coverUrl` is written only after **Save Cover & Next** is pressed for the exact URL that passed validation.
- Pressing Enter uses the same validation guard and cannot bypass the safety check.

## Data integrity

The live preview is entirely transient and does not alter Library data, XP, cloud state, backup state, or the Missing Covers queue until the normal confirmed save action runs.

Existing save behavior remains responsible for:

- `coverUrl`
- manual-cover metadata
- cover/edit XP
- Missing Covers queue advancement
- Library cache invalidation
- Library persistence
- cloud synchronization through the existing state pipeline

## Compatibility

No data migration or schema bump is required.

- **Cloud Sync:** v201
- **Full Backup Schema:** v29
- **Settings Preset Schema:** v1
- **Personal Order Export:** v4

# v235 Release Summary

**Release:** MediaFlow v235  
**Codename:** **Missing Covers Live Preview & Direct Image Validation**  
**Base:** MediaFlow v234 Modular  
**Stable feature base:** MediaFlow v201  
**Created by:** Alex Godly

### Main Changes

- Added live Missing Covers poster previews from pasted cover URLs.
- Added background direct-image validation.
- Restricted confirmed manual cover saving to valid `http://` / `https://` image resources.
- Disabled **Save Cover & Next** until validation succeeds.
- Added checking, valid, and invalid inline URL notices.
- Added valid/invalid URL field states.
- Restored fallback poster artwork after failed validation.
- Ensured preview-only changes never write to the title.
- Guarded Enter-to-save with the same validation state.
- Preserved the existing cover-save XP and persistence pipeline.
- Preserved Missing Covers queue behavior.
- Preserved v234 Dashboard quick-input styling.
- Preserved v233 Dynamic Settings and Title Details cover sizing.
- Preserved v232 Library performance protections.
- Kept Cloud Sync v201, Full Backup Schema v29, Settings Preset Schema v1, and Personal Order Export v4.
- Updated MediaFlow runtime to **235**.
