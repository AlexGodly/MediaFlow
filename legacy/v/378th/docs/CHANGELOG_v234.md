# MediaFlow v234 — Dashboard Quick-Entry Polish

MediaFlow v234 refines the two fast-entry controls on Dashboard so they are easier to read and visually consistent.

## Rate Your Library

- Increased the rating field to a stable, readable width.
- The `e.g. 8.5` placeholder and entered ratings remain fully visible.
- Preserved the existing numeric 0.1–10 rating behavior, Enter-to-confirm flow, Rating XP, queue order and Skip/Confirm actions.
- Added clearer themed hover and focus treatment without changing the underlying rating workflow.

## Missing Covers

- Redesigned **Cover URL** as a full themed input instead of the previously under-styled native URL field.
- Matched its border radius, panel background, focus ring and visual weight to the Rate Your Library quick-entry field.
- Kept the URL field wider than the rating field so long cover links remain practical to enter and review.
- Preserved Enter-to-save, Save cover & Next, Edit title and Skip behavior.

## Responsive behavior

- Rating and Cover URL fields remain compact on desktop but expand cleanly on smaller screens.
- On mobile, both controls use the available width so labels, placeholders and values stay readable.

## Compatibility

No data migration or schema change is required.

- Cloud Sync: v201
- Full Backup Schema: v29
- Settings Preset Schema: v1
- Personal Order Export: v4

## Release summary

**Release:** MediaFlow v234  
**Codename:** **Dashboard Quick-Entry Polish**  
**Base:** MediaFlow v233 Modular  
**Stable feature base:** MediaFlow v201  
**Created by:** Alex Godly

### Main changes

- Made the **Rate Your Library** rating field large enough to display its text clearly.
- Gave the rating input a stable desktop width and responsive mobile sizing.
- Redesigned **Missing Covers → Cover URL** to match the polished Rating input style.
- Added consistent hover, focus, placeholder and border treatments to both quick-entry fields.
- Preserved all rating, XP, Missing Covers, queue, persistence, backup, sync and v233 functionality.
- Updated MediaFlow runtime version to **234**.
