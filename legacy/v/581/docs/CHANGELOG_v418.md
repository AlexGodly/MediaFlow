# MediaFlow by Alex Godly — v418 Stable

**Collections 2.0 & Missing Cover Parity**

### Inside Collections
- List, Compact and Cards have responsive distinct title layouts that remain aligned when cover sizes change from 25% to 400%.
- Every title shows its configured category icon/name, dynamic status icon/name, progress count, percentage and progress bar.
- Functional Details, Edit and Remove actions; existing selection controls retained.
- Remove on-cover rating overlays from List, Compact and Cards while keeping them on Covers and Covers+Titles.
- Move the Remove X in Covers and Covers+Titles to the top-middle, clear of the corner overlays.

### Collections main page
- Improve title, description, counts, completed/total counts and progress readability across Covers, Compact, List, Cards and Showcase.
- Maintain Open/Edit actions, batch-mode compatibility, sorting and saved display mode.
- Reorder display buttons: Compact, List, Cards, Showcase, Covers.

### Library missing-cover visuals
- Center and proportionally resize the configured category icon when covers change size in Normal and Dynamic Library.
- Respect category fallback image URLs, and leave underlying title cover data unchanged.

### Reliability
- Regression verification of all five detail and five main-page display modes across phone, tablet and desktop widths, and 25%, 100%, 250% and 400% cover scaling.
- No Supabase schema changes or destructive data migrations.
