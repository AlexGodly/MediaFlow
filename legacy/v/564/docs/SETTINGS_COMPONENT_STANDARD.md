# MediaFlow Settings Center — mandatory development standard

Every new Settings control and section must use MediaFlow's canonical Settings Center architecture. This policy applies to personal MediaFlow v427 hotfixes and future versions.

## Source of truth
- Core rendering: `src/js/components/263-v365-settings-center.js` (`v365BuildSection`, `v365ToggleSection`, `v365Favorite`, Settings search).
- Metadata: `src/js/components/264-v366-settings-registration.js` (`MediaFlowSettingsRegistry`).
- Design tokens and layout: `assets/css/191-v365-settings-center.css` and `assets/css/192-v366-settings-registry.css`.
- New feature sections: `window.MediaFlowSettingsCenter.mountSection({id,title,category,subgroup,keywords,nodes})` in a registered Settings page enhancer. Pass real DOM element(s) in `nodes`. The helper renders the actual native section, not an imitation.
- Existing built-in sections: continue registering in the v221 Settings renderer and through `MediaFlowSettingsRegistry.registerSection`.

## Required behavior
1. Use an existing category and subgroup where practical. Do not insert a new uppercase subsection heading just for one feature when the appropriate group already exists. For Cover Recovery, use **Library & Titles / Library maintenance**.
2. The *same native* Settings section carries its expand/collapse caret, Pin/favorites button, keyboard accessibility, search entries, responsive sizing, theme colors and font styles. Do not manually reconstruct `.mf365-section-top` or `.mf366-subgroup` in feature code.
3. Register each searchable control with `MediaFlowSettingsRegistry.registerSetting({id,section,selector,label,keywords})`; prefer `data-mf-setting-id` for a stable selector.
4. Use existing design tokens such as `--panel`, `--panel-raised`, `--text`, `--text-dim`, `--flow`, and `--border-soft`. No hardcoded dark/light backgrounds, text colors, border radius, or icons.
5. Preserve existing setting values and action handlers. Never create a shadow copy of a preference or duplicate a Cloud/Supabase write.
6. Keep the complete section in sync after account changes, settings refresh/rerender, mobile layout changes, and PWA updates. Avoid inserting duplicate sections.
7. Add automated tests for native section mounting, search/pins, callback wiring, settings persistence, and mobile-safe style.

## Example

```js
function mySettingsEnhancer() {
  if (S.view !== 'settings') return;
  if (document.querySelector('.mf365-section[data-mf365-section="my-feature"]')) return;
  const controls = document.createElement('div');
  controls.innerHTML = mySettingsMarkup();
  window.MediaFlowSettingsRegistry?.registerSetting({
    id: 'my-feature-toggle',
    section: 'my-feature',
    selector: '[data-mf-setting-id="my-feature-toggle"]',
    label: 'My feature toggle'
  });
  window.MediaFlowSettingsCenter?.mountSection({
    id: 'my-feature', title: 'My Feature',
    category: 'library', subgroup: 'Library maintenance',
    keywords: ['my feature'], nodes: [controls]
  });
}
MediaFlowRuntime.registerPageEnhancer('settings', mySettingsEnhancer);
```

No feature may append its own standalone card, heading, accordion, or Pin control directly into `[data-mf365-content-for]` as a Settings substitute. This guide is backed by the v427 Settings-style regression tests and CI contract checks.
