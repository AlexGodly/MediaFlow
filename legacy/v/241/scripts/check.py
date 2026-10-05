#!/usr/bin/env python3
from pathlib import Path
import json, re, subprocess, sys, hashlib
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'src/js'
errors=[]
index=(ROOT/'index.html').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')

if '<meta name="mediaflow-version" content="241">' not in index: errors.append('index.html version is not 241')
if 'assets/js/mediaflow-v241.bundle.js' not in index: errors.append('index.html does not load v241 bundle')
if 'assets/css/92-v221-settings-polish.css' not in index: errors.append('index.html does not load v221 Settings stylesheet')
if 'mediaflow-v241-static-v1' not in sw: errors.append('service worker cache version is not v241')
if './assets/js/mediaflow-v241.bundle.js' not in sw: errors.append('service worker does not cache v241 bundle')
if './assets/css/92-v221-settings-polish.css' not in sw: errors.append('service worker does not cache v221 Settings stylesheet')
if 'assets/css/94-v224-library-sorting-actions.css' not in index: errors.append('index.html does not load v224 UI stylesheet')
if './assets/css/94-v224-library-sorting-actions.css' not in sw: errors.append('service worker does not cache v224 UI stylesheet')
if 'assets/css/95-v225-icons-personal-order.css' not in index: errors.append('index.html does not load v225 UI stylesheet')
if './assets/css/95-v225-icons-personal-order.css' not in sw: errors.append('service worker does not cache v225 UI stylesheet')
if 'assets/css/96-v226-semantic-ui-library.css' not in index: errors.append('index.html does not load v226 UI stylesheet')
if './assets/css/96-v226-semantic-ui-library.css' not in sw: errors.append('service worker does not cache v226 UI stylesheet')
if 'assets/css/97-v227-ui-icon-corrections.css' not in index: errors.append('index.html does not load v227 UI stylesheet')
if './assets/css/97-v227-ui-icon-corrections.css' not in sw: errors.append('service worker does not cache v227 UI stylesheet')
if 'assets/css/98-v228-library-priority-dynamic-row.css' not in index: errors.append('index.html does not load v228 UI stylesheet')
if './assets/css/98-v228-library-priority-dynamic-row.css' not in sw: errors.append('service worker does not cache v228 UI stylesheet')
if 'assets/css/99-v229-library-choice-modals.css' not in index: errors.append('index.html does not load v229 modal stylesheet')
if './assets/css/99-v229-library-choice-modals.css' not in sw: errors.append('service worker does not cache v229 modal stylesheet')
if 'assets/css/100-v230-choice-filter-layout.css' not in index: errors.append('index.html does not load v230 choice/filter stylesheet')
if './assets/css/100-v230-choice-filter-layout.css' not in sw: errors.append('service worker does not cache v230 choice/filter stylesheet')
if 'assets/css/101-v231-settings-layout-inheritance.css' not in index: errors.append('index.html does not load v231 settings/inheritance stylesheet')
if './assets/css/101-v231-settings-layout-inheritance.css' not in sw: errors.append('service worker does not cache v231 settings/inheritance stylesheet')

if 'assets/css/102-v232-performance-details-settings.css' not in index: errors.append('index.html does not load v232 stylesheet')
if './assets/css/102-v232-performance-details-settings.css' not in sw: errors.append('service worker does not cache v232 stylesheet')
if 'assets/css/103-v233-dynamic-settings-title-details-cover.css' not in index: errors.append('index.html does not load v233 stylesheet')
if './assets/css/103-v233-dynamic-settings-title-details-cover.css' not in sw: errors.append('service worker does not cache v233 stylesheet')
if 'assets/css/104-v234-dashboard-quick-inputs.css' not in index: errors.append('index.html does not load v234 stylesheet')
if './assets/css/104-v234-dashboard-quick-inputs.css' not in sw: errors.append('service worker does not cache v234 stylesheet')
if 'assets/css/105-v235-missing-cover-live-validation.css' not in index: errors.append('index.html does not load v235 stylesheet')
if './assets/css/105-v235-missing-cover-live-validation.css' not in sw: errors.append('service worker does not cache v235 stylesheet')
if 'assets/css/106-v236-searchable-category-filter.css' not in index: errors.append('index.html does not load v236 stylesheet')
if './assets/css/106-v236-searchable-category-filter.css' not in sw: errors.append('service worker does not cache v236 stylesheet')
if 'assets/css/107-v237-cross-surface-category-filters.css' not in index: errors.append('index.html does not load v237 stylesheet')
if './assets/css/107-v237-cross-surface-category-filters.css' not in sw: errors.append('service worker does not cache v237 stylesheet')
if 'assets/css/108-v238-status-logging-responsive-device-mode.css' not in index: errors.append('index.html does not load v238 stylesheet')
if './assets/css/108-v238-status-logging-responsive-device-mode.css' not in sw: errors.append('service worker does not cache v238 stylesheet')
if 'assets/css/109-v239-batch-log-editor-responsive-cleanup.css' not in index: errors.append('index.html does not load v239 stylesheet')
if './assets/css/109-v239-batch-log-editor-responsive-cleanup.css' not in sw: errors.append('service worker does not cache v239 stylesheet')
if 'assets/css/110-v240-edit-title-cover-profile.css' not in index: errors.append('index.html does not load v240 stylesheet')
if './assets/css/110-v240-edit-title-cover-profile.css' not in sw: errors.append('service worker does not cache v240 stylesheet')
if 'assets/css/111-v241-editor-history-performance.css' not in index: errors.append('index.html does not load v241 stylesheet')
if './assets/css/111-v241-editor-history-performance.css' not in sw: errors.append('service worker does not cache v241 stylesheet')
if re.search(r'<style(?:\s|>)',index,re.I): errors.append('inline <style> block remains in index.html')
for m in re.finditer(r'<script([^>]*)>(.*?)</script>',index,re.I|re.S):
    if 'src=' not in m.group(1).lower() and m.group(2).strip(): errors.append('inline JavaScript remains in index.html')

order=json.loads((SRC/'build-order.json').read_text(encoding='utf-8'))
runtime_order=json.loads((SRC/'runtime-order.json').read_text(encoding='utf-8'))
if 'pages/settings/146-v221-active-settings-page.js' not in runtime_order: errors.append('v221 Settings module is not active in runtime-order.json')
if 'pages/dashboard/147-v222-dashboard-rendering-stability.js' not in runtime_order: errors.append('v222 Dashboard rendering-stability module is not active in runtime-order.json')
if 'pages/dashboard/148-v223-on-this-day-dashboard-visibility.js' not in runtime_order: errors.append('v223 On This Day visibility module is not active in runtime-order.json')
if 'core/runtime/149-v224-sort-foundation.js' not in runtime_order: errors.append('missing active v224 runtime module: core/runtime/149-v224-sort-foundation.js')
if 'pages/library/150-v224-library-controls.js' not in runtime_order: errors.append('missing active v224 runtime module: pages/library/150-v224-library-controls.js')
if 'pages/batch-log/151-v224-batch-log-sorting.js' not in runtime_order: errors.append('missing active v224 runtime module: pages/batch-log/151-v224-batch-log-sorting.js')
if 'pages/personal-order/152-v224-personal-order-sorting.js' not in runtime_order: errors.append('missing active v224 runtime module: pages/personal-order/152-v224-personal-order-sorting.js')
if 'features/logging/153-v224-dashboard-logging-sorting.js' not in runtime_order: errors.append('missing active v224 runtime module: features/logging/153-v224-dashboard-logging-sorting.js')
if 'components/navigation/154-v224-page-names.js' not in runtime_order: errors.append('missing active v224 runtime module: components/navigation/154-v224-page-names.js')
if 'pages/dashboard/155-v224-recommendation-actions.js' not in runtime_order: errors.append('missing active v224 runtime module: pages/dashboard/155-v224-recommendation-actions.js')
if 'pages/personal-order/156-v225-personal-order-toolbar-polish.js' not in runtime_order: errors.append('missing active v225 runtime module: pages/personal-order/156-v225-personal-order-toolbar-polish.js')
if 'components/157-v225-global-button-icons.js' not in runtime_order: errors.append('missing active v225 runtime module: components/157-v225-global-button-icons.js')
if 'components/158-v226-semantic-icons-dropdowns.js' not in runtime_order: errors.append('missing active v226 runtime module: components/158-v226-semantic-icons-dropdowns.js')
if 'pages/settings/159-v226-category-settings-dynamic-icon-mode.js' not in runtime_order: errors.append('missing active v226 runtime module: pages/settings/159-v226-category-settings-dynamic-icon-mode.js')
if 'pages/library/160-v226-library-sizing-display-polish.js' not in runtime_order: errors.append('missing active v226 runtime module: pages/library/160-v226-library-sizing-display-polish.js')
if 'components/161-v227-ui-icon-corrections.js' not in runtime_order: errors.append('missing active v227 runtime module: components/161-v227-ui-icon-corrections.js')
if 'components/162-v228-library-priority-dynamic-row.js' not in runtime_order: errors.append('missing active v228 runtime module: components/162-v228-library-priority-dynamic-row.js')
if 'components/163-v229-library-choice-modals.js' not in runtime_order: errors.append('missing active v229 runtime module: components/163-v229-library-choice-modals.js')
if 'components/164-v230-choice-filter-layout.js' not in runtime_order: errors.append('missing active v230 runtime module: components/164-v230-choice-filter-layout.js')
if 'components/165-v231-settings-library-mode-layout-inheritance.js' not in runtime_order: errors.append('missing active v231 runtime module: components/165-v231-settings-library-mode-layout-inheritance.js')
if 'components/166-v232-library-performance-persistence-details.js' not in runtime_order: errors.append('missing active v232 runtime module: components/166-v232-library-performance-persistence-details.js')
if 'components/167-v233-dynamic-settings-title-details-cover.js' not in runtime_order: errors.append('missing active v233 runtime module: components/167-v233-dynamic-settings-title-details-cover.js')
if 'components/168-v234-dashboard-input-polish.js' not in runtime_order: errors.append('missing active v234 runtime module: components/168-v234-dashboard-input-polish.js')
if 'components/169-v235-missing-cover-live-validation.js' not in runtime_order: errors.append('missing active v235 runtime module: components/169-v235-missing-cover-live-validation.js')
if 'components/170-v236-searchable-category-filter.js' not in runtime_order: errors.append('missing active v236 runtime module: components/170-v236-searchable-category-filter.js')
if 'components/171-v237-cross-surface-category-filters.js' not in runtime_order: errors.append('missing active v237 runtime module: components/171-v237-cross-surface-category-filters.js')
if 'components/172-v238-status-logging-responsive-device-mode.js' not in runtime_order: errors.append('missing active v238 runtime module: components/172-v238-status-logging-responsive-device-mode.js')
if 'components/173-v239-batch-log-editor-responsive-cleanup.js' not in runtime_order: errors.append('missing active v239 runtime module: components/173-v239-batch-log-editor-responsive-cleanup.js')
if 'components/174-v240-edit-title-cover-profile-audit.js' not in runtime_order: errors.append('missing active v240 runtime module')
if 'components/175-v241-editor-history-performance.js' not in runtime_order: errors.append('missing active v241 runtime module')
if 'pages/settings/145-v220-active-settings-page.js' in runtime_order: errors.append('v220 Settings module is still active in runtime-order.json')
slot_indexes=[i for i,row in enumerate(order) if row.get('slot')=='runtime_extensions']
if len(slot_indexes)!=1: errors.append('build-order must contain exactly one runtime_extensions slot')
close_indexes=[i for i,row in enumerate(order) if row.get('path')=='core/runtime/999-close-app.js']
if len(close_indexes)!=1: errors.append('build-order must contain exactly one explicit app closure')
if slot_indexes and close_indexes and slot_indexes[0]>close_indexes[0]: errors.append('runtime extension slot is after the app closure')

parts=[]
for row in order:
    if row.get('slot')=='runtime_extensions':
        for rel in runtime_order:
            p=SRC/rel
            if not p.exists(): errors.append(f'missing runtime source module: {rel}')
            else: parts.append(p.read_text(encoding='utf-8'))
        continue
    rel=row.get('path')
    if not rel: continue
    p=SRC/rel
    if not p.exists(): errors.append(f'missing source fragment: {rel}')
    else: parts.append(p.read_text(encoding='utf-8'))
joined=''.join(parts)
bundle_path=ROOT/'assets/js/mediaflow-v241.bundle.js'
bundle=bundle_path.read_text(encoding='utf-8') if bundle_path.exists() else ''
if not bundle: errors.append('missing v241 bundle')
if joined!=bundle: errors.append('bundle does not exactly match build + runtime manifests')
if not bundle.rstrip().endswith('})();'): errors.append('executable JavaScript exists after the explicit MediaFlow app closure')

# v219 runtime foundation remains the safe extension point; v221 Settings must register before closure.
required_runtime=[
    'MediaFlow v219 — Runtime Extension Foundation',
    'const MediaFlowRuntime=',
    'window.MediaFlowRuntime=MediaFlowRuntime;',
    "MediaFlowRuntime.registerPageRenderer('settings',v221RenderSettingsPage);",
    "MediaFlowRuntime.registerPageEnhancer('settings',v221EnhanceSettingsDom);",
    'MediaFlowRuntime.version=222;'
]
for pat in required_runtime:
    if pat not in bundle: errors.append(f'missing v221 runtime feature: {pat}')
close_pos=bundle.rfind('})();')
for pat in required_runtime:
    pos=bundle.find(pat)
    if pos<0 or pos>close_pos: errors.append(f'v221 runtime feature is not inside the active app scope: {pat}')

required_settings=[
    'MediaFlow v221 — Settings Organization & Search Polish',
    'function v221SearchSettings',
    'function v221OrganizeSettingsContent',
    'function v221NormalizeSectionLabels',
    'function v221EnhanceSettingsDom',
    'function v221RestoreAllDefaults',
    'function v221ResetSettingPath',
    'function v221ResetNavigationDefaults',
    "'Library':['CATEGORIES','LIBRARY EXPERIENCE'",
    "'Interface':['NAVIGATION','DASHBOARD SETTINGS','STATISTICS SETTINGS']",
    "'Updates':['APP UPDATES']",
    "const V221_SETTINGS_GROUP_ORDER=['Library','Interface','Appearance','MediaFlow System','Progression','Data & Sync','Updates'];",
    'Search by setting, feature, or section…',
    'Restore all defaults',
    'Reset section',
    "title.replace(/^🛠\\s*/u,'')",
    'resetAllSettings=v221RestoreAllDefaults;'
]
for pat in required_settings:
    if pat not in bundle: errors.append(f'missing v221 Settings feature: {pat}')

# v221-specific hierarchy / UI cleanup checks.
if 'Ctrl K' in bundle: errors.append('Ctrl K hint still exists in v221 runtime')
if 'v221BindSettingsSearchShortcut' in bundle: errors.append('Ctrl/Cmd+K shortcut binding still exists in v221 runtime')
if "'Statistics':['STATISTICS SETTINGS']" in bundle: errors.append('standalone Statistics Settings group returned')
if "'Interface':['DASHBOARD SETTINGS','NAVIGATION'" in bundle: errors.append('old Interface section order returned')

css221=(ROOT/'assets/css/92-v221-settings-polish.css').read_text(encoding='utf-8') if (ROOT/'assets/css/92-v221-settings-polish.css').exists() else ''
if not css221: errors.append('missing v221 Settings stylesheet')
for pat in [
    '.v221-restore-all{align-self:start;min-height:54px',
    '.v221-settings-nav{scrollbar-width:none;-ms-overflow-style:none}',
    '.v221-settings-nav::-webkit-scrollbar{display:none'
]:
    if pat not in css221: errors.append(f'missing v221 Settings responsive/alignment CSS: {pat}')

mod=SRC/'pages/settings/146-v221-active-settings-page.js'
if not mod.exists(): errors.append('missing v221 Settings runtime module')
else:
    mt=mod.read_text(encoding='utf-8')
    restore=re.search(r'function v221RestoreAllDefaults\(\)\{([\s\S]*?)\n\}',mt)
    if not restore: errors.append('v221RestoreAllDefaults function not found')
    else:
        body=restore.group(1)
        if 'resetAll()' in body or 'S.library=' in body or 'S.sessions=' in body or 'S.categories=' in body:
            errors.append('v221 Restore all defaults appears to modify content data')

# v222 Dashboard rendering-stability checks.
required_v222=[
    'MediaFlow v222 — Dashboard Rendering Stability',
    'function v222StabilizeDashboardPaint',
    'const v222RenderViewBase=renderView;',
    'v159ApplyOtdHero=function()',
    'App.v222StabilizeDashboardPaint=v222StabilizeDashboardPaint;',
    'MediaFlowRuntime.version=222;'
]
for pat in required_v222:
    if pat not in bundle: errors.append(f'missing v222 Dashboard paint guard: {pat}')
    elif bundle.find(pat)>close_pos: errors.append(f'v222 Dashboard paint guard is outside active app scope: {pat}')
css222=(ROOT/'assets/css/93-v222-dashboard-rendering-stability.css').read_text(encoding='utf-8') if (ROOT/'assets/css/93-v222-dashboard-rendering-stability.css').exists() else ''
if not css222: errors.append('missing v222 Dashboard rendering-stability stylesheet')
for pat in [
    '.v126-otd:not([open]) > .v126-otd-body',
    'content-visibility:visible!important',
    'contain:paint',
    '.today-strip'
]:
    if pat not in css222: errors.append(f'missing v222 Dashboard compositor safeguard CSS: {pat}')
if 'assets/css/93-v222-dashboard-rendering-stability.css' not in index: errors.append('index.html does not load v222 Dashboard rendering-stability stylesheet')
if './assets/css/93-v222-dashboard-rendering-stability.css' not in sw: errors.append('service worker does not cache v222 Dashboard rendering-stability stylesheet')

# v223 On This Day Dashboard visibility checks.
required_v223=[
    'MediaFlow v223 — On This Day Dashboard Visibility',
    'showOnThisDay=src.showOnThisDay!==false',
    "${row('showOnThisDay','On This Day'",
    "if(cfg.showOnThisDay===false)return '';",
    "dashboardOnThisDayVisibility:true",
    'MediaFlowRuntime.version=V223_RUNTIME_VERSION;'
]
for pat in required_v223:
    if pat not in bundle: errors.append(f'missing v223 On This Day visibility feature: {pat}')
    elif bundle.find(pat)>close_pos: errors.append(f'v223 On This Day visibility feature is outside active app scope: {pat}')

# v224 Library / sorting / naming / Dashboard action checks.
required_v224=[
    'MediaFlow v224 — Shared Sorting Foundation',
    'MediaFlow v224 — Library Controls',
    'MediaFlow v224 — Batch Log Unified Sorting',
    'MediaFlow v224 — Personal Order Picker Sorting',
    'MediaFlow v224 — Dashboard Logging Library Browser Sorting',
    'MediaFlow v224 — Page Naming Cleanup',
    'MediaFlow v224 — Recommended Title Action Bar',
    "['title','Alphabetic']",
    'All covers',
    'Has cover',
    'Missing cover',
    "v224OrderNavItem.label='Personal Order'",
    "v224ProfileNavItem.label='Account'",
    'v224-rec-action',
    'MediaFlowRuntime.version=V224_RUNTIME_VERSION;'
]
for pat in required_v224:
    if pat not in bundle: errors.append(f'missing v224 feature: {pat}')
    elif bundle.find(pat)>close_pos: errors.append(f'v224 feature is outside active app scope: {pat}')
css224=(ROOT/'assets/css/94-v224-library-sorting-actions.css').read_text(encoding='utf-8') if (ROOT/'assets/css/94-v224-library-sorting-actions.css').exists() else ''
if not css224: errors.append('missing v224 UI stylesheet')
for pat in ['.v224-sort-direction','.v224-cover-filter','.v224-rec-action','.v174-recommended-title-row']:
    if pat not in css224: errors.append(f'missing v224 UI CSS: {pat}')

# v225 Personal Order clarity + global button icon checks.
required_v225=[
    'MediaFlow v225 — Personal Order Add Titles Toolbar Polish',
    'MediaFlow v225 — Global Button Icon System',
    'function v225EnhanceButtonIcons',
    'MutationObserver',
    "v225-order-filter-label",
    "Sort by",
    "Direction",
    'MediaFlowRuntime.version=V225_RUNTIME_VERSION;'
]
for pat in required_v225:
    if pat not in bundle: errors.append(f'missing v225 feature: {pat}')
    elif bundle.find(pat)>close_pos: errors.append(f'v225 feature is outside active app scope: {pat}')
css225=(ROOT/'assets/css/95-v225-icons-personal-order.css').read_text(encoding='utf-8') if (ROOT/'assets/css/95-v225-icons-personal-order.css').exists() else ''
if not css225: errors.append('missing v225 UI stylesheet')
for pat in ['.v225-order-filterbar','.v225-order-filter-label','.v225-icon-button','.v225-btn-icon','.profile-card input[type="email"]']:
    if pat not in css225: errors.append(f'missing v225 UI CSS: {pat}')

# v226 semantic icons / dropdowns / category layout / Dynamic sizing checks.
required_v226=[
    'MediaFlow v226 — Semantic Icons + Dropdown Icon Language',
    'MediaFlow v226 — Category Settings Layout + Dynamic Row Icons',
    'MediaFlow v226 — Library Sizing + Display Polish',
    'function v226EnhanceDropdowns',
    "V181_LIBRARY_DEFAULT.dynamicCategoryIcons='none';",
    'Dynamic category row icons',
    'Category icon URL',
    "replace(/Covers \\+ titles/g,'Cover+Titles')",
    'v226-dynamic-library',
    'MediaFlowRuntime.version=V226_RUNTIME_VERSION;'
]
for pat in required_v226:
    if pat not in bundle: errors.append(f'missing v226 feature: {pat}')
    elif bundle.find(pat)>close_pos: errors.append(f'v226 feature is outside active app scope: {pat}')
css226=(ROOT/'assets/css/96-v226-semantic-ui-library.css').read_text(encoding='utf-8') if (ROOT/'assets/css/96-v226-semantic-ui-library.css').exists() else ''
if not css226: errors.append('missing v226 UI stylesheet')
for pat in ['select[data-v226-dropdown-icon]', '.settings-categories-full .cat-manage-row', '.v226-dynamic-category-icon-setting', 'data-v226-dynamic-category-icons', '.v226-dynamic-library.library-view-list']:
    if pat not in css226: errors.append(f'missing v226 UI CSS: {pat}')

# v227 icon/category-row/dashboard-cover correction checks.
required_v227=[
    'MediaFlow v227 — UI Icon Corrections + Dashboard Cover Cleanup',
    'priorityLow',
    'priorityMedium',
    'priorityHigh',
    'v227-dropdown-no-leading-icon',
    'v227-mode-pill-auto',
    'v123-rating-placeholder,.v186-rating-placeholder-button,.v192-cover-placeholder',
    'MediaFlowRuntime.version=V227_RUNTIME_VERSION;'
]
for pat in required_v227:
    if pat not in bundle: errors.append(f'missing v227 feature: {pat}')
    elif bundle.find(pat)>close_pos: errors.append(f'v227 feature is outside active app scope: {pat}')
css227=(ROOT/'assets/css/97-v227-ui-icon-corrections.css').read_text(encoding='utf-8') if (ROOT/'assets/css/97-v227-ui-icon-corrections.css').exists() else ''
if not css227: errors.append('missing v227 UI stylesheet')
for pat in [
    'html[data-v226-dynamic-category-icons="category-url"] #view-root',
    'select.v227-dropdown-no-leading-icon',
    '.toggle.v225-icon-button',
    '.priority-choice.v225-icon-button>.priority-choice-icon',
    '.v227-mode-pill',
    '.v123-rating-placeholder>.v225-btn-icon'
]:
    if pat not in css227: errors.append(f'missing v227 UI CSS: {pat}')


# v228 Library metadata + Dynamic category-row ordering checks.
required_v228=[
    'MediaFlow v228 — Library Metadata Icons + Dynamic Row Ordering',
    "V181_LIBRARY_DEFAULT.dynamicCategoryOrderMode='custom';",
    'Dynamic category row order',
    'Custom Dynamic row order',
    'Follow Categories order',
    'function v228DynamicCategoryDragStart',
    'function v228EffectiveDynamicCategoryOrder',
    "if(el.matches?.('.category-click'))return null;",
    "if(el.matches?.('.priority-click'))",
    'MediaFlowRuntime.version=V228_RUNTIME_VERSION;'
]
for pat in required_v228:
    if pat not in bundle: errors.append(f'missing v228 feature: {pat}')
    elif bundle.find(pat)>close_pos: errors.append(f'v228 feature is outside active app scope: {pat}')
css228=(ROOT/'assets/css/98-v228-library-priority-dynamic-row.css').read_text(encoding='utf-8') if (ROOT/'assets/css/98-v228-library-priority-dynamic-row.css').exists() else ''
if not css228: errors.append('missing v228 UI stylesheet')
for pat in [
    '.v228-dynamic-category-order-setting',
    '.v228-dynamic-drag-handle',
    '.v228-follow-category-order',
    '#view-root .category-click>.v225-btn-icon',
    '#view-root .priority-click.v225-icon-button>.v225-btn-icon'
]:
    if pat not in css228: errors.append(f'missing v228 UI CSS: {pat}')

# Preserve v217 navigation regression fix.
for pat in [
    'data-view="${escapeHtml(String(n.id))}"',
    "const viewId=String(el.dataset?.view||'');",
    "el.classList.toggle('active',viewId===String(S.view||''));",
    'const V161_NAV_LAYOUT_VERSION=2;'
]:
    if pat not in bundle: errors.append(f'missing v217 navigation fix: {pat}')
if "NAV_ITEMS[i].id===S.view" in bundle: errors.append('legacy index-based sidebar active-state logic returned')

for css in re.findall(r'href="(assets/css/[^"]+\.css)"',index):
    if not (ROOT/css).exists(): errors.append(f'missing stylesheet: {css}')
for d in ['core','pages','components','features','services','utils','legacy']:
    if not (SRC/d).exists(): errors.append(f'missing source ownership folder: {d}')

try:
    subprocess.run(['node','--check',str(bundle_path)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,text=True)
except Exception as e:
    errors.append(f'node syntax check failed: {e}')


# v229 choice-modal regression checks.
css229=(ROOT/'assets/css/99-v229-library-choice-modals.css').read_text(encoding='utf-8') if (ROOT/'assets/css/99-v229-library-choice-modals.css').exists() else ''
if not css229: errors.append('missing v229 choice-modal stylesheet')
for pat in [
    'V229_CATEGORY_MODAL_PAGE_SIZE=15',
    "libraryStatusModalHtml=function(d)",
    "libraryCategoryModalHtml=function(d)",
    "const cats=(S.categories||[]).slice()",
    'cats.length>V229_CATEGORY_MODAL_PAGE_SIZE',
    'v144CategoryIconHtml(cat||{})',
    "if(el?.matches?.('.status-choice'))return null",
    'select[aria-label="Dynamic Library category row icons"]'
]:
    if pat not in bundle: errors.append(f'missing v229 modal feature: {pat}')
for pat in [
    '.modal:has(.v229-category-modal)',
    '.v229-category-choice-list{',
    'max-height:none!important',
    '.v229-category-choice-list-two{grid-template-columns:repeat(2,minmax(0,1fr))}',
    '.v229-status-choice-icon>.v225-btn-icon',
    'select[aria-label="Dynamic Library category row icons"][data-v226-dropdown-icon]'
]:
    if pat not in css229: errors.append(f'missing v229 modal CSS: {pat}')


# v236 searchable/paginated persistent-open Category Filter checks.
required_v236=[
    'MediaFlow v236 — Searchable + Paginated Category Filter',
    'V236_CATEGORY_FILTER_DEFAULT_PAGE_SIZE=15',
    'function v236SearchLibraryCategories',
    'function v236ToggleLibraryCategory',
    'Categories per page',
    'data-v236-library-category-filter',
    'MediaFlowRuntime.version=V236_RUNTIME_VERSION;'
]
for pat in required_v236:
    if pat not in bundle: errors.append(f'missing v236 feature: {pat}')
    elif bundle.find(pat)>close_pos: errors.append(f'v236 feature is outside active app scope: {pat}')
css236=(ROOT/'assets/css/106-v236-searchable-category-filter.css').read_text(encoding='utf-8') if (ROOT/'assets/css/106-v236-searchable-category-filter.css').exists() else ''
if not css236: errors.append('missing v236 Category Filter stylesheet')
for pat in ['.v236-category-filter-search','.v236-category-filter-pager','.v236-category-filter-page-size-setting']:
    if pat not in css236: errors.append(f'missing v236 Category Filter CSS: {pat}')

# v237 cross-surface searchable Category Filter checks.
css237=(ROOT/'assets/css/107-v237-cross-surface-category-filters.css').read_text(encoding='utf-8') if (ROOT/'assets/css/107-v237-cross-surface-category-filters.css').exists() else ''
required_v237=[
    'MediaFlow v237 — Searchable Category Filters Everywhere',
    "const V237_RUNTIME_VERSION=237;",
    "order:{open:false,query:'',page:0}",
    "batch:{open:false,query:'',page:0}",
    "logging:{open:false,query:'',page:0}",
    'function v237CategoryFilterHtml',
    'function v237ToggleCategoryFilter',
    "return v237ReplaceCategoryFilter(v237OrderToolsBase.apply(this,arguments),'order');",
    "return v237ReplaceCategoryFilter(v237BatchToolsBase.apply(this,arguments),'batch');",
    "return v237ReplaceCategoryFilter(v237LogToolsBase.apply(this,arguments),'logging');",
    'MediaFlowRuntime.version=V237_RUNTIME_VERSION;'
]
for pat in required_v237:
    if pat not in bundle: errors.append(f'missing v237 feature: {pat}')
    elif bundle.find(pat)>close_pos: errors.append(f'v237 feature is outside active app scope: {pat}')
if not css237: errors.append('missing v237 cross-surface Category Filter stylesheet')
for pat in ['.v237-category-filter','.v225-order-filter-category .v237-category-filter','.v224-browser-filterbar>.v237-category-filter']:
    if pat not in css237: errors.append(f'missing v237 Category Filter CSS: {pat}')
if not (ROOT/'scripts/smoke-v237.py').exists(): errors.append('missing v237 focused UI smoke test')
if not (ROOT/'docs/CHANGELOG_v237.md').exists(): errors.append('missing v237 changelog')


# v239 Batch Log / logging / editor / responsive cleanup checks.
css239=(ROOT/'assets/css/109-v239-batch-log-editor-responsive-cleanup.css').read_text(encoding='utf-8') if (ROOT/'assets/css/109-v239-batch-log-editor-responsive-cleanup.css').exists() else ''
required_v239=[
    'MediaFlow v239 — Batch Log / Logging / Editor Cleanup',
    'const V239_RUNTIME_VERSION=239;',
    'function v239StripDeviceLayout(settings)',
    'function v239LoggedTitlesHtml(entries)',
    'v179ProgressEntryEditorHtml=function(){return \'\';};',
    'v239-batch-library-tools',
    'deviceLayoutOverrideRemoved:true',
    'MediaFlowRuntime.version=V239_RUNTIME_VERSION;'
]
for pat in required_v239:
    if pat not in bundle: errors.append(f'missing v239 feature: {pat}')
    elif bundle.find(pat)>close_pos: errors.append(f'v239 feature is outside active app scope: {pat}')
if not css239: errors.append('missing v239 UI stylesheet')
for pat in ['.v239-batch-library-tools','.v239-log-mode-switch','.v239-logged-title-card','.v239-library-editor-shell']:
    if pat not in css239: errors.append(f'missing v239 CSS: {pat}')
if not (ROOT/'docs/CHANGELOG_v239.md').exists(): errors.append('missing v239 changelog')
if not (ROOT/'scripts/smoke-v239.py').exists(): errors.append('missing v239 focused UI smoke test')

if errors:
    print('CHECK FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('CHECK OK')
print('Build manifest rows:',len(order))
print('Runtime extension modules:',len(runtime_order))
print('Settings page renderer: active inside app scope')
print('v221 Settings ordering/search polish: preserved')
print('v222 Dashboard rendering stability: present')
print('v223 On This Day visibility: preserved')
print('v224 Library/sorting/page naming/recommendation actions: preserved')
print('v225 Personal Order clarity/global button icons/Account polish: preserved')
print('v226 semantic icons/dropdowns/category layout/Dynamic Library sizing: preserved')
print('v227 icon/category-row/dashboard-cover corrections: preserved')
print('v228 Library metadata/Dynamic row ordering controls: preserved')
# v230 choice/filter layout checks.
css230=(ROOT/'assets/css/100-v230-choice-filter-layout.css').read_text(encoding='utf-8') if (ROOT/'assets/css/100-v230-choice-filter-layout.css').exists() else ''
if not css230: errors.append('missing v230 choice/filter stylesheet')
for pat in [
    'MediaFlow v230 — Choice + Filter Layout Control Center',
    'CHOICE & FILTER LAYOUT',
    'Follow Category Settings',
    'Follow Dynamic Category Row',
    'function v230SetPosition',
    'function v230DragStart',
    'function v230ApplyFilterLayouts',
    'MediaFlowRuntime.version=V230_RUNTIME_VERSION;'
]:
    if pat not in bundle: errors.append(f'missing v230 choice/filter feature: {pat}')
    elif bundle.find(pat)>close_pos: errors.append(f'v230 choice/filter feature is outside active app scope: {pat}')
for pat in ['.v230-settings-grid','.v230-layout-row','.v230-drag-handle','.v230-position']:
    if pat not in css230: errors.append(f'missing v230 choice/filter CSS: {pat}')

print('v229 Category/Status popup polish: active')
# v231 Settings / inheritance checks.
css231=(ROOT/'assets/css/101-v231-settings-layout-inheritance.css').read_text(encoding='utf-8') if (ROOT/'assets/css/101-v231-settings-layout-inheritance.css').exists() else ''
if not css231: errors.append('missing v231 settings/inheritance stylesheet')
for pat in [
    'MediaFlow v231 — Settings Navigation + Layout Inheritance Polish',
    "modeLabel.textContent='LIBRARY MODE'",
    "if(surface==='setStatus')values.push(['dynamicStatus','Follow Dynamic Status Order'])",
    "['setStatus','Follow Set Status'],['dynamicStatus','Follow Dynamic Status Order']",
    "['setCategory','Follow Set Category']",
    "const V231_SET_PRIORITY_DEFAULT=['high','medium','low'];",
    'MediaFlowRuntime.version=V231_RUNTIME_VERSION;'
]:
    if pat not in bundle: errors.append(f'missing v231 feature: {pat}')
    elif bundle.find(pat)>close_pos: errors.append(f'v231 feature is outside active app scope: {pat}')
for pat in ['.v231-library-mode-card','.v221-settings-nav-item.v231-active']:
    if pat not in css231: errors.append(f'missing v231 CSS: {pat}')
if 'Drag with ☰, use the number or arrows to reorder, and show/hide individual choices.' in (SRC/'components/165-v231-settings-library-mode-layout-inheritance.js').read_text(encoding='utf-8'):
    errors.append('v231 reintroduced removed Choice & Filter helper copy')

print('v230 Choice/Filter layout controls: active')

# v232 performance / persistence / details checks.
css232=(ROOT/'assets/css/102-v232-performance-details-settings.css').read_text(encoding='utf-8') if (ROOT/'assets/css/102-v232-performance-details-settings.css').exists() else ''
for pat in [
    'MediaFlow v232 — Library Performance + Persistence Audit + Details Polish',
    'V225_ICON_OBSERVER.disconnect()',
    'V226_DROPDOWN_OBSERVER.disconnect()',
    'V230_FILTER_OBSERVER.disconnect()',
    'v230ApplyDynamicStatusRow=function(){return;}',
    "list.unshift('LIBRARY MODE')",
    "payload.formatVersion=Math.max(Number(payload.formatVersion)||1,V232_ORDER_FORMAT_VERSION)",
    'choiceFilterLayoutV230V231:true',
    'App.exportCSV=function()',
    'MediaFlowRuntime.version=V232_RUNTIME_VERSION;'
]:
    if pat not in bundle: errors.append(f'missing v232 feature: {pat}')
    elif bundle.find(pat)>close_pos: errors.append(f'v232 feature is outside active app scope: {pat}')
for pat in ['.v181-title-details-modal','.v181-detail-card>.v225-btn-icon','content-visibility:auto']:
    if pat not in css232: errors.append(f'missing v232 CSS: {pat}')

classic232=(SRC/'pages/library/013-v70-expanded-library-display-ordering.js').read_text(encoding='utf-8')
dynamic232=(SRC/'pages/library/112-dynamic-library-rendering.js').read_text(encoding='utf-8')
if 'const v232OverviewMeta=new Map();' not in classic232: errors.append('missing v232 one-pass classic Library overview optimization')
if 'const categoryCounts=new Map();' not in dynamic232 or 'const statusCounts=new Map();' not in dynamic232: errors.append('missing v232 one-pass Dynamic Library count optimization')
if not (ROOT/'scripts/perf-v232.py').exists(): errors.append('missing v232 large-Library performance regression script')
if not (ROOT/'docs/CHANGELOG_v232.md').exists(): errors.append('missing v232 changelog')

print('v231 Settings navigation/inheritance polish: active')

# v233 Dynamic Settings + Title Details cover-size checks.
css233=(ROOT/'assets/css/103-v233-dynamic-settings-title-details-cover.css').read_text(encoding='utf-8') if (ROOT/'assets/css/103-v233-dynamic-settings-title-details-cover.css').exists() else ''
required_v233=[
    'MediaFlow v233 — Dynamic Settings Section + Title Details Cover Size',
    "h=h.replace(\n    '<div class=\"section-label\">LIBRARY EXPERIENCE</div>',",
    "'LIBRARY MODE','DYNAMIC SETTINGS','CATEGORIES'",
    "if(t==='DYNAMIC SETTINGS')return {kind:'paths'",
    "V181_COVER_SIZE_DEFAULTS.titleDetails=100;",
    "V181_COVER_LABELS.titleDetails='Title Details popup cover';",
    "--v233-cover-title-details",
    'MediaFlowRuntime.version=V233_RUNTIME_VERSION;'
]
for pat in required_v233:
    target=css233 if pat=='--v233-cover-title-details' else bundle
    if pat not in target: errors.append(f'missing v233 feature: {pat}')
    elif target is bundle and bundle.find(pat)>close_pos: errors.append(f'v233 feature is outside active app scope: {pat}')
if 'DYNAMIC SETTINGS' not in bundle: errors.append('v233 Dynamic Settings label missing from bundle')
if not (ROOT/'docs/CHANGELOG_v233.md').exists(): errors.append('missing v233 changelog')
if not (ROOT/'scripts/smoke-v233.py').exists(): errors.append('missing v233 focused UI smoke test')

# v234 Dashboard quick-entry polish checks.
css234=(ROOT/'assets/css/104-v234-dashboard-quick-inputs.css').read_text(encoding='utf-8') if (ROOT/'assets/css/104-v234-dashboard-quick-inputs.css').exists() else ''
required_v234=[
    'MediaFlow v234 — Dashboard Quick Input Polish',
    'const V234_RUNTIME_VERSION=234;',
    'MediaFlowRuntime.version=V234_RUNTIME_VERSION;'
]
for pat in required_v234:
    if pat not in bundle: errors.append(f'missing v234 feature: {pat}')
    elif bundle.find(pat)>close_pos: errors.append(f'v234 feature is outside active app scope: {pat}')
if not css234: errors.append('missing v234 Dashboard quick-input stylesheet')
for pat in ['#v123-rating-input','#v192-cover-url-input','width:190px','min-height:48px']:
    if pat not in css234: errors.append(f'missing v234 Dashboard quick-input CSS: {pat}')
if not (ROOT/'docs/CHANGELOG_v234.md').exists(): errors.append('missing v234 changelog')
if not (ROOT/'scripts/smoke-v234.py').exists(): errors.append('missing v234 focused UI smoke test')


# v235 Missing Covers live preview/direct-image validation checks.
css235=(ROOT/'assets/css/105-v235-missing-cover-live-validation.css').read_text(encoding='utf-8') if (ROOT/'assets/css/105-v235-missing-cover-live-validation.css').exists() else ''
required_v235=[
    'MediaFlow v235 — Missing Covers live preview + direct-image validation',
    'const V235_RUNTIME_VERSION=235;',
    'function v235ValidateMissingCover',
    'function v235GuardedSaveMissingCover',
    "save.setAttribute('onclick','App.v192SaveMissingCover()');",
    'MediaFlowRuntime.version=V235_RUNTIME_VERSION;'
]
for pat in required_v235:
    if pat not in bundle: errors.append(f'missing v235 feature: {pat}')
    elif bundle.find(pat)>close_pos: errors.append(f'v235 feature is outside active app scope: {pat}')
if not css235: errors.append('missing v235 Missing Covers validation stylesheet')
for pat in ['.v235-live-cover-preview','.v235-cover-url-notice','#v235-save-cover-btn:disabled']:
    if pat not in css235: errors.append(f'missing v235 CSS: {pat}')
if not (ROOT/'docs/CHANGELOG_v235.md').exists(): errors.append('missing v235 changelog')
if not (ROOT/'scripts/smoke-v235.py').exists(): errors.append('missing v235 focused UI smoke test')

# v238 reliability/logging/responsive/device-mode checks.
css238=(ROOT/'assets/css/108-v238-status-logging-responsive-device-mode.css').read_text(encoding='utf-8') if (ROOT/'assets/css/108-v238-status-logging-responsive-device-mode.css').exists() else ''
required_v238=[
    'MediaFlow v238 — Status Filter Reliability + Logging UX + Responsive Device Mode',
    'const V238_RUNTIME_VERSION=238;',
    'const v238ReorderSelectBase=v230ReorderSelect;',
    'function v238OpenLogForm()',
    'function v238ReflowLogForm(html)',
    'function v238SetDeviceMode(mode)',
    'settings.v238DeviceLayout',
    'MediaFlowRuntime.version=V238_RUNTIME_VERSION;'
]
for pat in required_v238:
    if pat not in bundle: errors.append(f'missing v238 feature: {pat}')
    elif bundle.find(pat)>close_pos: errors.append(f'v238 feature is outside active app scope: {pat}')
if not css238: errors.append('missing v238 responsive/logging stylesheet')
for pat in ['.v238-log-library','.v238-library-editor','.v238-device-settings-card','data-v238-layout']:
    if pat not in css238: errors.append(f'missing v238 CSS: {pat}')
if not (ROOT/'scripts/smoke-v238.py').exists(): errors.append('missing v238 focused UI smoke test')
if not (ROOT/'docs/CHANGELOG_v238.md').exists(): errors.append('missing v238 changelog')


# v239 Batch Log / logging / editor / responsive cleanup checks.
css239=(ROOT/'assets/css/109-v239-batch-log-editor-responsive-cleanup.css').read_text(encoding='utf-8') if (ROOT/'assets/css/109-v239-batch-log-editor-responsive-cleanup.css').exists() else ''
required_v239=[
    'MediaFlow v239 — Batch Log / Logging / Editor Cleanup',
    'const V239_RUNTIME_VERSION=239;',
    'function v239StripDeviceLayout(settings)',
    'function v239LoggedTitlesHtml(entries)',
    'v179ProgressEntryEditorHtml=function(){return \'\';};',
    'v239-batch-library-tools',
    'deviceLayoutOverrideRemoved:true',
    'MediaFlowRuntime.version=V239_RUNTIME_VERSION;'
]
for pat in required_v239:
    if pat not in bundle: errors.append(f'missing v239 feature: {pat}')
    elif bundle.find(pat)>close_pos: errors.append(f'v239 feature is outside active app scope: {pat}')
if not css239: errors.append('missing v239 UI stylesheet')
for pat in ['.v239-batch-library-tools','.v239-log-mode-switch','.v239-logged-title-card','.v239-library-editor-shell']:
    if pat not in css239: errors.append(f'missing v239 CSS: {pat}')
if not (ROOT/'docs/CHANGELOG_v239.md').exists(): errors.append('missing v239 changelog')
if not (ROOT/'scripts/smoke-v239.py').exists(): errors.append('missing v239 focused UI smoke test')


# v240 Edit Title / logged cover sizing / profile cleanup checks.
css240=(ROOT/'assets/css/110-v240-edit-title-cover-profile.css').read_text(encoding='utf-8') if (ROOT/'assets/css/110-v240-edit-title-cover-profile.css').exists() else ''
required_v240=[
    'MediaFlow v240 — Edit Title Layout / Logged Cover Size / Profile Cleanup',
    'const V240_RUNTIME_VERSION=240;',
    'function v240DecorateLibraryEditor(raw)',
    "V181_COVER_SIZE_DEFAULTS.loggedTitles=100;",
    "V181_COVER_LABELS.loggedTitles='Logged / Batch selected covers';",
    'function v240CleanProfileActionIcon(root=document)',
    'loggedTitleCoverSizeV240:true',
    'MediaFlowRuntime.version=V240_RUNTIME_VERSION;'
]
for pat in required_v240:
    if pat not in bundle: errors.append(f'missing v240 feature: {pat}')
    elif bundle.find(pat)>close_pos: errors.append(f'v240 feature is outside active app scope: {pat}')
if not css240: errors.append('missing v240 Edit Title/cover/profile stylesheet')
for pat in ['.v240-library-editor','.v240-field-category','.v240-field-progress','.v239-logged-cover','.account-profile-btn>.v225-btn-icon']:
    if pat not in css240: errors.append(f'missing v240 CSS: {pat}')
if not (ROOT/'docs/CHANGELOG_v240.md').exists(): errors.append('missing v240 changelog')
if not (ROOT/'scripts/smoke-v240.py').exists(): errors.append('missing v240 focused UI smoke test')
if 'components/174-v240-edit-title-cover-profile-audit.js' not in runtime_order: errors.append('missing active v240 runtime module')
if 'assets/css/110-v240-edit-title-cover-profile.css' not in index: errors.append('index.html does not load v240 stylesheet')
if './assets/css/110-v240-edit-title-cover-profile.css' not in sw: errors.append('service worker does not cache v240 stylesheet')

# v241 Edit Title clarity / History / 50K optimization checks.
css241=(ROOT/'assets/css/111-v241-editor-history-performance.css').read_text(encoding='utf-8') if (ROOT/'assets/css/111-v241-editor-history-performance.css').exists() else ''
for pat in [
    'MediaFlow v241 — Editor Clarity / History Filters / 50K Performance',
    'const V241_RUNTIME_VERSION=241;',
    'function v241EnsureLibraryIndex()',
    'function v241LoggedCoverMarkup',
    'function v241HistoryCategoryFilterHtml()',
    'function v241ActivityHtml()',
    'performance50kAuditV241:true',
    'MediaFlowRuntime.version=V241_RUNTIME_VERSION;'
]:
    if pat not in bundle: errors.append(f'missing v241 feature: {pat}')
    elif bundle.find(pat)>close_pos: errors.append(f'v241 feature is outside active app scope: {pat}')
for pat in ['.v241-logged-cover-button','.v241-history-toolbar','.v240-repeat-panel .v82-repeat-grid','content-visibility:auto']:
    if pat not in css241: errors.append(f'missing v241 CSS: {pat}')
if not (ROOT/'scripts/smoke-v241.py').exists(): errors.append('missing v241 focused UI smoke test')
if not (ROOT/'scripts/perf-v241.py').exists(): errors.append('missing v241 50K performance test')
if not (ROOT/'docs/CHANGELOG_v241.md').exists(): errors.append('missing v241 changelog')

if errors:
    print('FINAL CHECK FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('v232 Library performance/persistence/details audit: active')
print('v233 Dynamic Settings/title-details cover sizing: active')
print('v234 Dashboard quick-entry polish: active')
print('v235 Missing Covers live validation/preview: active')
print('v236 Searchable/paginated Category Filter: active')
print('v238 Status reliability/logging base: preserved')
print('v239 Batch Log/logging/editor/native responsive cleanup: preserved')
print('v240 Edit Title/logged-cover/profile polish: active')
print('v237 Personal Order/Batch Log/Dashboard logging Category Filters: active')
print('Navigation highlight fix: preserved')
print('Persistent schemas: Cloud v201 / Full Backup v29 / Settings Preset v1')
print('JS SHA256:',hashlib.sha256(bundle.encode()).hexdigest())
