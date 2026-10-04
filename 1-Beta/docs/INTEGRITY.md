# MediaFlow v218 Integrity Notes

- Stable feature/data base: MediaFlow v201, carried through v215-v217.
- Source ownership architecture: v216/v217 page-component-core structure.
- v218 intentionally changes Settings rendering/runtime behavior only.
- Persistent schemas remain unchanged: Cloud Sync v201, Full Backup v29, Settings Preset v1.
- Generated runtime is rebuilt from the ordered source manifest and must exactly match `assets/js/mediaflow-v218.bundle.js`.
- `node --check` is required for the generated runtime.
- Structural checks verify the v217 ID-based navigation fix remains present.
- Structural checks verify the v218 Settings search/index/reset-all implementation and stylesheet are present.
- Categories, Library, History and XP are not reset by the v218 Restore all defaults action.
