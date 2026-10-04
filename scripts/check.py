#!/usr/bin/env python3
from pathlib import Path
import json, re, subprocess, sys, hashlib
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'src/js'
errors=[]
index=(ROOT/'index.html').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')

if '<meta name="mediaflow-version" content="219">' not in index: errors.append('index.html version is not 219')
if 'assets/js/mediaflow-v219.bundle.js' not in index: errors.append('index.html does not load v219 bundle')
if 'assets/css/90-v219-settings-organizer.css' not in index: errors.append('index.html does not load v219 Settings stylesheet')
if 'mediaflow-v219-static-v1' not in sw: errors.append('service worker cache version is not v219')
if './assets/js/mediaflow-v219.bundle.js' not in sw: errors.append('service worker does not cache v219 bundle')
if './assets/css/90-v219-settings-organizer.css' not in sw: errors.append('service worker does not cache v219 Settings stylesheet')
if re.search(r'<style(?:\s|>)',index,re.I): errors.append('inline <style> block remains in index.html')
for m in re.finditer(r'<script([^>]*)>(.*?)</script>',index,re.I|re.S):
    if 'src=' not in m.group(1).lower() and m.group(2).strip(): errors.append('inline JavaScript remains in index.html')

order=json.loads((SRC/'build-order.json').read_text(encoding='utf-8'))
runtime_order=json.loads((SRC/'runtime-order.json').read_text(encoding='utf-8'))
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
bundle_path=ROOT/'assets/js/mediaflow-v219.bundle.js'
bundle=bundle_path.read_text(encoding='utf-8') if bundle_path.exists() else ''
if not bundle: errors.append('missing v219 bundle')
if joined!=bundle: errors.append('bundle does not exactly match build + runtime manifests')
if not bundle.rstrip().endswith('})();'): errors.append('executable JavaScript exists after the explicit MediaFlow app closure')

# Runtime architecture must be active before closure.
required_runtime=[
    'MediaFlow v219 — Runtime Extension Foundation',
    'const MediaFlowRuntime=',
    'window.MediaFlowRuntime=MediaFlowRuntime;',
    "MediaFlowRuntime.registerPageRenderer('settings',v219RenderSettingsPage);",
    "MediaFlowRuntime.registerPageEnhancer('settings',v219EnhanceSettingsDom);"
]
for pat in required_runtime:
    if pat not in bundle: errors.append(f'missing v219 runtime feature: {pat}')
close_pos=bundle.rfind('})();')
for pat in required_runtime:
    pos=bundle.find(pat)
    if pos<0 or pos>close_pos: errors.append(f'v219 runtime feature is not inside the active app scope: {pat}')

# Settings requirements.
required_settings=[
    'MediaFlow v219 — Active Organized Settings Browser',
    'function v219SearchSettings',
    'function v219EnhanceSettingsDom',
    'function v219RestoreAllDefaults',
    'function v219ResetSettingPath',
    'function v219ResetNavigationDefaults',
    'S.settings=v219Clone(DEFAULT_SETTINGS);',
    'S.navLayout=v161NormalizeNavLayout(null)',
    'Search settings…',
    'Restore all defaults',
    'Reset section',
    'resetAllSettings=v219RestoreAllDefaults;'
]
for pat in required_settings:
    if pat not in bundle: errors.append(f'missing v219 Settings feature: {pat}')

mod=(SRC/'pages/settings/144-v219-active-settings-page.js').read_text(encoding='utf-8')
restore=re.search(r'function v219RestoreAllDefaults\(\)\{([\s\S]*?)\n\}',mod)
if not restore: errors.append('v219RestoreAllDefaults function not found')
else:
    body=restore.group(1)
    if 'resetAll()' in body or 'S.library=' in body or 'S.sessions=' in body or 'S.categories=' in body:
        errors.append('v219 Restore all defaults appears to modify content data')

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
print('Navigation highlight fix: preserved')
print('Persistent schemas: Cloud v201 / Full Backup v29 / Settings Preset v1')
print('JS SHA256:',hashlib.sha256(bundle.encode()).hexdigest())
