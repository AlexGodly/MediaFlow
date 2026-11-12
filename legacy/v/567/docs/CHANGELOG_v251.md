# MediaFlow v251 — Covers+Titles Display Mode Polish

MediaFlow v251 is a focused Library display-mode polish release.

## Library display mode naming

- Renamed **Cover+Titles** to **Covers+Titles**.
- The updated label applies to both **Normal Library** and **Dynamic Library** because both use the same Library display switch.

## Covers+Titles icon

- Replaced the generic action-arrow fallback icon with a dedicated semantic **covers + title text** icon.
- The new icon shows two cover tiles with title lines underneath, making the purpose of the display mode recognizable at a glance.
- Added an explicit icon binding so future text/icon inference cannot accidentally fall back to the generic action icon.

## Compatibility

- No Library data migration is required.
- No persistence, cloud, backup, XP, History, Personal Order, update-system, or PWA behavior is changed.
- Existing v250 data compatibility remains intact.
