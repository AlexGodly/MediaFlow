#!/usr/bin/env python3
from pathlib import Path
import json, re, subprocess, sys, hashlib
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'src/js'
errors=[]
index=(ROOT/'index.html').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')

if '<meta name="mediaflow-version" content="225">' not in index: errors.append('index.html version is not 225')
if 'assets/js/mediaflow-v225.bundle.js' not in index: errors.append('index.html does not load v225 bundle')
if 'assets/css/92-v221-settings-polish.css' not in index: errors.append('index.html does not load v221 Settings stylesheet')
if 'mediaflow-v225-static-v1' not in sw: errors.append('service worker cache version is not v225')
if './assets/js/mediaflow-v225.bundle.js' not in sw: errors.append('service worker does not cache v225 bundle')
if './assets/css/92-v221-settings-polish.css' not in sw: errors.append('service worker does not cache v221 Settings stylesheet')
if 'assets/css/94-v224-library-sorting-actions.css' not in index: errors.append('index.html does not load v224 UI stylesheet')
if './assets/css/94-v224-library-sorting-actions.css' not in sw: errors.append('service worker does not cache v224 UI stylesheet')
if 'assets/css/95-v225-icons-personal-order.css' not in index: errors.append('index.html does not load v225 UI stylesheet')
if './assets/css/95-v225-icons-personal-order.css' not in sw: errors.append('service worker does not cache v225 UI stylesheet')
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
bundle_path=ROOT/'assets/js/mediaflow-v225.bundle.js'
bundle=bundle_path.read_text(encoding='utf-8') if bundle_path.exists() else ''
if not bundle: errors.append('missing v225 bundle')
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
print('v225 Personal Order clarity/global button icons/Account polish: active')
print('Navigation highlight fix: preserved')
print('Persistent schemas: Cloud v201 / Full Backup v29 / Settings Preset v1')
print('JS SHA256:',hashlib.sha256(bundle.encode()).hexdigest())
