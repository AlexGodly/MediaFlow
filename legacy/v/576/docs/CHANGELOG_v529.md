# MediaFlow v529 Stable — Games & Music Built-in Category Artwork

MediaFlow's built-in category artwork now includes **Games** and **Music** alongside the original 22 icons, for a total of 24.

- Adds two new **128×128 transparent PNG** packaged assets: `assets/category-icons/games.png` (blue game controller) and `assets/category-icons/music.png` (blue music note). Both follow the supplied glossy blue tile styling with transparent outer edges.
- Exposes them in **Add Category** and **Edit Category** under **MediaFlow icons**, retaining the icon-only tile grid and accessible tooltip labels.
- Uses the existing built-in icon allowlist, selection, preview, cloud/backup persistence and display code; no icon URL sanitization bypass, schema change or default-category reset.
- Includes their file paths automatically in the regenerated PWA cache manifest for offline use.
- Preserves existing categories, all prior icon choices, emoji icons and custom URL icons.
- Adds `tests/test-v529-category-icons.cjs` to validate inclusion, actual PNG assets, transparency and picker contract.

No Supabase migration. Release workflow builds, verifies, archives at `legacy/v/529`, publishes numeric tag `529` as **v529 Stable** and deploys GitHub Pages.
