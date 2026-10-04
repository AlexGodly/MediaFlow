# MediaFlow v217 Source Ownership Map

The browser still loads one generated compatibility bundle, but the editable source is now physically organized by ownership. Build order is explicit and preserves the stable v201 execution sequence.

## Top-level ownership

- `core/`: 5 ordered source fragments
- `pages/`: 46 ordered source fragments
- `components/`: 22 ordered source fragments
- `features/`: 34 ordered source fragments
- `services/`: 16 ordered source fragments
- `utils/`: 1 ordered source fragments
- `legacy/`: 19 ordered source fragments

## Detailed ownership

- `components/batch-toolbar/`: 2
- `components/category/`: 5
- `components/cover/`: 8
- `components/modal/`: 1
- `components/navigation/`: 2
- `components/pagination/`: 3
- `components/title-details/`: 1
- `core/app/`: 1
- `core/constants/`: 1
- `core/rendering/`: 2
- `core/state/`: 1
- `features/backup/`: 6
- `features/import-export/`: 3
- `features/logging/`: 5
- `features/rewatch/`: 3
- `features/scheduler/`: 4
- `features/themes/`: 10
- `features/xp/`: 3
- `legacy/`: 19
- `pages/batch-log/`: 3
- `pages/dashboard/`: 8
- `pages/history/`: 2
- `pages/library/`: 13
- `pages/library-history/`: 1
- `pages/old-system/`: 2
- `pages/personal-order/`: 2
- `pages/profile-settings/`: 1
- `pages/settings/`: 8
- `pages/statistics/`: 6
- `services/cloud-sync/`: 16
- `utils/`: 1

## Runtime order

1. `features/logging/000-v89-functional-logging-filters-with-direct-event-binding.js` — MediaFlow v89: functional logging filters with direct event binding
2. `core/constants/001-constants.js` — CONSTANTS
3. `core/state/002-state.js` — STATE
4. `pages/library-history/003-v63-library-history-integrity-large-library-fix.js` — MediaFlow v63 — Library History Integrity & Large-Library Fix
5. `services/cloud-sync/004-v115-cloud-data-loss-prevention-recovery-guard.js` — MediaFlow v115 — Cloud Data Loss Prevention & Recovery Guard
6. `components/category/005-v74-persistent-category-ordering.js` — MediaFlow v74 — persistent category ordering
7. `utils/006-util.js` — UTIL
8. `features/scheduler/007-scheduler.js` — SCHEDULER
9. `features/logging/008-session-flow.js` — SESSION FLOW
10. `pages/statistics/009-derived-stats-helpers.js` — DERIVED / STATS HELPERS
11. `core/rendering/010-render-shell.js` — RENDER: SHELL
12. `pages/dashboard/011-view-dashboard.js` — VIEW: DASHBOARD
13. `pages/library/012-v63-large-library-performance-engine.js` — MediaFlow v63 — Large Library Performance Engine
14. `pages/library/013-v70-expanded-library-display-ordering.js` — MediaFlow v70 — expanded Library display ordering
15. `pages/batch-log/014-view-batch-log-v61.js` — VIEW: BATCH LOG — v61
16. `pages/history/015-view-history.js` — VIEW: HISTORY
17. `pages/statistics/016-view-stats.js` — VIEW: STATS
18. `pages/profile-settings/017-view-profile-settings.js` — VIEW: PROFILE SETTINGS
19. `pages/settings/018-view-settings.js` — VIEW: SETTINGS
20. `services/cloud-sync/019-v74-and-drag-ordering-now-persist-an-explicit.js` — v74: ↑/↓ and drag ordering now persist an explicit categoryOrder to cloud.
21. `components/modal/020-modals.js` — MODALS
22. `core/app/021-app-public-actions-bound-to-window.js` — APP — public actions (bound to window)
23. `components/navigation/022-desktop-sidebar-resizing.js` — DESKTOP SIDEBAR RESIZING
24. `pages/statistics/023-v16-features-backups-themes-stopwatch-mal-link-stats.js` — V16 FEATURES: BACKUPS, THEMES, STOPWATCH, MAL LINK, STATS
25. `pages/statistics/024-v28-analytics-cover-timeline-helpers.js` — V28 ANALYTICS / COVER / TIMELINE HELPERS
26. `legacy/025-v40-multi-service-exchange-hub-custom-import-confirmation.js` — v40: Multi-service exchange hub + custom import confirmation
27. `features/import-export/026-v37-simkl-json-bulk-library-tools-activity-undo.js` — v37: Simkl JSON + bulk library tools + activity + undo/redo
28. `features/rewatch/027-v81-repeat-consumption-rewatch-reread.js` — MediaFlow v81 — Repeat Consumption (Rewatch / Reread)
29. `features/rewatch/028-v82-per-title-rewatch-reread-visibility.js` — MediaFlow v82 — per-title Rewatch / Reread visibility
30. `features/themes/029-v63-original-50-theme-collection.js` — MediaFlow v63 — original 50 Theme Collection
31. `features/themes/030-v133-14-additional-built-in-themes.js` — MediaFlow v133 — 14 additional built-in MediaFlow themes.
32. `features/themes/031-v55-platform-themes.js` — v55 Platform Themes
33. `pages/statistics/032-v44-stopwatch-add-time-ratings-covers-xp-timeline.js` — V44 — STOPWATCH ADD TIME / RATINGS / COVERS / XP / TIMELINE
34. `services/cloud-sync/033-v46-progression-cloud-sync-reliability.js` — v46 — Progression + Cloud Sync Reliability
35. `components/cover/034-v50-cover-forward-ui-simkl-export.js` — v50 — Cover-forward UI + Simkl export
36. `core/rendering/035-render-loop-init.js` — RENDER LOOP + INIT
37. `features/themes/036-v101-full-style-themes-runtime-scope-fix.js` — MediaFlow v101: Full Style Themes runtime scope fix
38. `features/xp/037-v120-completion-xp-progression-integrity.js` — MediaFlow v120 — Completion XP + Progression Integrity
39. `features/rewatch/038-v121-rewatch-reread-xp.js` — MediaFlow v121 — Rewatch / Reread XP
40. `pages/dashboard/039-v123-dashboard-rating-queue-rating-xp.js` — MediaFlow v123 — Dashboard Rating Queue + Rating XP
41. `pages/statistics/040-v129-restored-v1-statistics.js` — MediaFlow v129 — Restored v1 Statistics
42. `services/cloud-sync/041-v134-calculate-xp-sync-now-performance.js` — MediaFlow v134 — Calculate XP + Sync Now Performance
43. `pages/dashboard/042-v136-on-this-day-lifecycle-events.js` — MediaFlow v136 — On This Day lifecycle events
44. `pages/history/043-v137-automatic-start-date-from-genuine-history.js` — MediaFlow v137 — Automatic Start Date from genuine History
45. `pages/personal-order/044-v138-personal-order.js` — MediaFlow v138 — Personal Order
46. `pages/personal-order/045-v139-prioritize-personal-order-for-recommendations.js` — MediaFlow v139 — Prioritize Personal Order for recommendations
47. `components/pagination/046-v141-fast-order-pagination-active-page-fix.js` — MediaFlow v141 — Fast Order pagination + active-page fix
48. `components/cover/047-v142-order-import-export-clear-recovery.js` — MediaFlow v142 — Order import/export + clear recovery
49. `components/batch-toolbar/048-v143-library-bulk-action-confirmations.js` — MediaFlow v143 — Library bulk-action confirmations
50. `components/category/049-v144-reusable-category-icon-color-palettes.js` — MediaFlow v144 — Reusable Category Icon & Color Palettes
51. `features/themes/050-v145-dynamic-cover-based-theme-accent.js` — MediaFlow v145 — Dynamic cover-based theme accent
52. `features/themes/051-v146-dynamic-full-cover-theme.js` — MediaFlow v146 — Dynamic Full Cover Theme
53. `pages/settings/052-v147-dynamic-settings-version-copyright-footer.js` — MediaFlow v147 — Dynamic Settings version/copyright footer
54. `features/backup/053-v148-complete-data-backup-audit-full-restore.js` — MediaFlow v148 — Complete-data Backup Audit + Full Restore
55. `features/xp/054-v149-day-streak-xp-multiplier.js` — MediaFlow v149 — Day-Streak XP Multiplier
56. `features/xp/055-v150-v149-streak-xp-performance-fix.js` — MediaFlow v150 — v149 Streak XP Performance Fix
57. `features/backup/056-v152-automatic-backup-full-backup.js` — MediaFlow v152 — Automatic Backup = Full Backup
58. `pages/old-system/057-v153-old-system.js` — MediaFlow v153 — Old System
59. `services/cloud-sync/058-v155-complete-cloud-state-full-sync-now.js` — MediaFlow v155 — Complete Cloud State + Full Sync Now
60. `pages/library/059-v156-fast-order-large-library-performance-engine.js` — MediaFlow v156 — Fast Order / Large-Library Performance Engine
61. `legacy/060-v157-direct-numeric-ordering.js` — MediaFlow v157 — Direct Numeric Ordering
62. `components/cover/061-v158-complete-import-metadata-safe-cover-repair.js` — MediaFlow v158 — Complete Import Metadata + Safe Cover Repair
63. `pages/dashboard/062-v159-rotating-on-this-day-adaptive-cover-themes.js` — MediaFlow v159 — Rotating On This Day + Adaptive Cover Themes
64. `features/themes/063-v160-reliable-dynamic-cover-theme.js` — MediaFlow v160 — Reliable Dynamic Cover Theme
65. `components/navigation/064-v161-about-custom-navigation-data-audit.js` — MediaFlow v161 — About + Custom Navigation + Data Audit
66. `components/cover/065-v162-user-controlled-adaptive-cover-collections.js` — MediaFlow v162 — User-controlled adaptive cover collections
67. `features/themes/066-v163-dynamic-cover-theme-rotation-control.js` — MediaFlow v163 — Dynamic Cover Theme rotation control
68. `features/themes/067-v164-simkl-full-style-theme.js` — MediaFlow v164 — Simkl Full Style Theme
69. `features/scheduler/068-v166-automatic-seasonal-fresh-episode-detection.js` — MediaFlow v166 — Automatic Seasonal Fresh-Episode Detection
70. `features/scheduler/069-v167-editable-system-respect-xp.js` — MediaFlow v167 — Editable System Respect XP
71. `pages/settings/070-v168-settings-cleanup.js` — MediaFlow v168 — Settings cleanup
72. `features/import-export/071-v169-advanced-import-export-media-services.js` — MediaFlow v169 — Advanced Import / Export — Media Services
73. `features/import-export/072-v170-advanced-import-type-exclusions.js` — MediaFlow v170 — Advanced import type exclusions
74. `components/category/073-v171-category-recovery-default-identity.js` — MediaFlow v171 — Category Recovery & Default Identity
75. `legacy/074-v172-unified-media-services-import-interface.js` — MediaFlow v172 — Unified Media Services Import Interface
76. `components/pagination/075-order-edit-buttons-optional-ordered-title-pagination.js` — ORDER — Edit buttons + optional ordered-title pagination
77. `pages/old-system/076-old-system-date-view.js` — OLD SYSTEM — Date View
78. `features/themes/077-themes-3-new-adaptive-cover-collections.js` — THEMES — 3 new adaptive cover collections
79. `services/cloud-sync/078-v173-persistence-merge-sync-now-backups.js` — v173 persistence / merge / Sync Now / backups
80. `pages/dashboard/079-v174-edit-recommended-title-from-dashboard.js` — MediaFlow v174 — Edit Recommended Title From Dashboard
81. `legacy/080-v175.js` — MediaFlow v175
82. `components/pagination/081-ordered-title-pagination-amount.js` — Ordered-title pagination amount
83. `legacy/082-dedicated-order-export-import.js` — Dedicated Order export/import
84. `pages/batch-log/083-batch-log-full-library-browser-filters.js` — BATCH LOG — full Library browser filters
85. `services/cloud-sync/084-v175-persistence-merge-sync-now-backup.js` — v175 persistence / merge / Sync Now / backup
86. `pages/library/085-v176-dense-library-rows-rich-imported-metadata.js` — MediaFlow v176 — Dense Library Rows + Rich Imported Metadata
87. `pages/library/086-rich-library-row-presentation.js` — Rich Library row presentation
88. `services/cloud-sync/087-cloud-merge-preservation.js` — Cloud merge preservation
89. `legacy/088-media-service-exchange-export.js` — Media-service exchange export
90. `legacy/089-sync-verification.js` — Sync verification
91. `features/backup/090-full-backup-automatic-backup.js` — Full Backup / Automatic Backup
92. `pages/library/091-v177-adjustable-library-order-cover-size.js` — MediaFlow v177 — Adjustable Library & Order Cover Size
93. `services/cloud-sync/092-persistence-cloud-sync-now-backup.js` — Persistence / cloud / Sync Now / backup
94. `legacy/093-v178-editable-rich-imported-metadata.js` — MediaFlow v178 — Editable Rich Imported Metadata
95. `pages/library/094-add-rich-fields-to-the-normal-library-editor.js` — Add rich fields to the normal Library editor
96. `legacy/095-protect-manually-edited-fields-from-future-imports.js` — Protect manually edited fields from future imports
97. `services/cloud-sync/096-protected-sync-now-verification.js` — Protected Sync Now verification
98. `features/backup/097-full-backup-automatic-backup-2.js` — Full Backup / Automatic Backup
99. `features/logging/098-v179-dual-logging-modes.js` — MediaFlow v179 — Dual Logging Modes
100. `features/logging/099-normal-logging-ui.js` — Normal logging UI
101. `pages/batch-log/100-batch-log-state-ui.js` — Batch Log state + UI
102. `services/cloud-sync/101-persistence-cloud-sync-now-backup-2.js` — Persistence / cloud / Sync Now / backup
103. `legacy/102-v180.js` — MediaFlow v180
104. `pages/dashboard/103-dashboard-controls-beside-the-recommended-title.js` — Dashboard controls beside the recommended title
105. `features/scheduler/104-v180-system-respect-xp.js` — v180 SYSTEM RESPECT XP
106. `legacy/105-historical-merge-cache-audit-compatibility.js` — Historical merge + cache/audit compatibility
107. `features/backup/106-full-backup-automatic-backup-3.js` — Full Backup / Automatic Backup
108. `legacy/107-v181.js` — MediaFlow v181
109. `features/logging/108-default-logging-mode.js` — Default Logging Mode
110. `components/cover/109-unlimited-per-surface-cover-size-manager.js` — Unlimited per-surface Cover Size Manager
111. `pages/library/110-library-display-modes.js` — Library Display Modes
112. `pages/library/111-classic-dynamic-library-switch.js` — Classic / Dynamic Library switch
113. `pages/library/112-dynamic-library-rendering.js` — Dynamic Library rendering
114. `components/title-details/113-global-title-details-popup.js` — Global Title Details Popup
115. `pages/settings/114-settings-ui.js` — Settings UI
116. `services/cloud-sync/115-persistence-merge-sync-now-full-backup.js` — Persistence / merge / Sync Now / Full Backup
117. `pages/library/116-v182-does-not-duplicate-the-library-configuration-introduced.js` — v182 does not duplicate the Library configuration introduced in v181.
118. `legacy/117-v183.js` — MediaFlow v183
119. `pages/settings/118-v184-settings-readability-metadata.js` — MediaFlow v184 — Settings readability metadata
120. `legacy/119-v186.js` — MediaFlow v186
121. `legacy/120-v188.js` — MediaFlow v188
122. `pages/library/121-v189-library-sorting-unfinished-filter-dynamic.js` — MediaFlow v189 — Library sorting, unfinished filter, Dynamic
123. `pages/library/122-v53-cached-library-filtering-now-understands-the-v189.js` — v53 cached Library filtering now understands the v189 filter + sorts.
124. `services/cloud-sync/123-v189-cloud-backup-audit.js` — v189 cloud / backup audit.
125. `components/batch-toolbar/124-v190-shared-normal-dynamic-library-batch-toolbar.js` — MediaFlow v190 — Shared Normal / Dynamic Library batch toolbar
126. `legacy/125-v190-is-a-rendering-workflow-parity-release-it.js` — v190 is a rendering/workflow parity release. It adds no new persistent
127. `components/cover/126-v191-clean-covers-restorable-deleted-titles.js` — MediaFlow v191 — Clean Covers + Restorable Deleted Titles
128. `legacy/127-persistent-deleted-title-snapshots.js` — Persistent deleted-title snapshots
129. `services/cloud-sync/128-persistence-cloud-backup.js` — Persistence / cloud / backup
130. `legacy/129-v192.js` — MediaFlow v192
131. `pages/dashboard/130-missing-covers-queue.js` — Missing Covers queue
132. `pages/settings/131-settings-ui-2.js` — Settings UI
133. `services/cloud-sync/132-persistence-cloud-backup-2.js` — Persistence / cloud / backup
134. `legacy/133-v194.js` — MediaFlow v194
135. `features/backup/134-v196-settings-presets.js` — MediaFlow v196 — Settings Presets
136. `components/category/135-v197-category-clear-controls.js` — MediaFlow v197 — Category Clear Controls
137. `components/cover/136-v200-category-default-missing-covers.js` — MediaFlow v200 — Category Default Missing Covers
138. `components/category/137-category-editor-missing-default-cover-url.js` — Category editor: Missing default cover URL
139. `components/cover/138-v144-s-save-handler-is-reproduced-with-the.js` — v144's save handler is reproduced with the v200 category cover field so the
140. `pages/settings/139-settings-switch.js` — Settings switch
141. `services/cloud-sync/140-persistence-cloud-full-backup.js` — Persistence / Cloud / Full Backup
142. `pages/settings/141-v194-owns-the-canonical-category-icon-settings-object.js` — v194 owns the canonical category-icon settings object. Extend that object
143. `pages/dashboard/142-v76-on-this-day-whole-day-activity.js` — v76 — On This Day: whole-day activity
