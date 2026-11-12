# MediaFlow v288

## Personal Order queue display controls

- Collection Queues now appear **below the regular/category queue by default**.
- Added Personal Order Queue Display controls to switch between **Category / title queues first** and **Collection queues first**.
- Category / title queues and Collection Queues can be shown or hidden independently.
- Added an option to mirror assigned Collections directly inside the normal **By Category** queues at their mixed queue positions.
- Queue display preferences are part of Personal Order state and persist through the existing local/cloud/Full Backup pipeline.

## Assigned Collection actions

- Every assigned Collection now has a semantic **Open** button that navigates directly to that Collection on the Collections page.
- Existing per-assignment Category Rule, Completed Titles rule, queue position, reset-progress and removal controls remain available in both Collection Queue and mirrored category-queue presentations.

## Collection title drill-down

- Every Collection assignment can now expand/collapse its live ordered title list.
- Expanded lists follow the Collection's current order and show title covers, category, status, progress and queue eligibility state.
- Long Collection title lists are paginated with **10 titles per page by default**.
- Titles/page is a typed numeric value from 1–1000, with Previous / Next paging controls.
- Collection title drill-down is non-destructive and reads the live Collection rather than duplicating titles into Personal Order.

## Collection Queue title artwork

- Direct ordered titles shown around Collection blocks in the Collection Queue now display their real cover artwork.
- Missing covers use the title's Category artwork fallback.

## Compatibility

- Cloud Sync: v201
- Full Backup Schema: v29
- Settings Preset: v1
- Personal Order Export: v5
- Collections Export: v2
- PWA shell: `mediaflow-pwa-v288-shell-v1`
- No data migration required.
