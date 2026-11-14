## MediaFlow v578 Stable

### Fixed: Log any title (Batch Log) rows
With a cover, a title's row in Log any title fell apart: the cover was drawn at full size, and the title and its details were squeezed into a one-letter-wide column. The cover is now its small thumbnail again, with the title and details readable next to it.
- A title logged by parts gets its parts in their own full-width section under the title: chips (✓ on the chosen ones), then one card per part with its counter and bar, then the total and Minutes.
- Checked with a normal and a by-parts title, on desktop and phone widths.
