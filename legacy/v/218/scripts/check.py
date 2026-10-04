#!/usr/bin/env python3
from pathlib import Path
import json, re, subprocess, sys, hashlib
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'src/js'
errors=[]
index=(ROOT/'index.html').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')

if '<meta name="mediaflow-version" content="218">' not in index: errors.append('index.html version is not 218')
if 'assets/js/mediaflow-v218.bundle.js' not in index: errors.append('index.html does not load v218 bundle')
if 'assets/css/90-v218-settings-organizer.css' not in index: errors.append('index.html does not load v218 Settings stylesheet')
if 'mediaflow-v218-static-v1' not in sw: errors.append('service worker cache version is not v218')
if './assets/js/mediaflow-v218.bundle.js' not in sw: errors.append('service worker does not cache v218 bundle')
if './assets/css/90-v218-settings-organizer.css' not in sw: errors.append('service worker does not cache v218 Settings stylesheet')
if re.search(r'<style(?:\s|>)',index,re.I): errors.append('inline <style> block remains in index.html')
for m in re.finditer(r'<script([^>]*)>(.*?)</script>',index,re.I|re.S):
    if 'src=' not in m.group(1).lower() and m.group(2).strip(): errors.append('inline JavaScript remains in index.html')

order=json.loads((SRC/'build-order.json').read_text(encoding='utf-8'))
joined=''
for row in order:
    p=SRC/row['path']
    if not p.exists():
        errors.append(f'missing source fragment: {row["path"]}')
        continue
    joined+=p.read_text(encoding='utf-8')

bundle_path=ROOT/'assets/js/mediaflow-v218.bundle.js'
if not bundle_path.exists():
    errors.append('missing v218 bundle')
    bundle=''
else:
    bundle=bundle_path.read_text(encoding='utf-8')
if joined != bundle: errors.append('bundle does not exactly match ordered source fragments')

# Preserve v217 navigation regression fix.
for pat in [
    'data-view="${escapeHtml(String(n.id))}"',
    "const viewId=String(el.dataset?.view||'');",
    "el.classList.toggle('active',viewId===String(S.view||''));",
    'const V161_NAV_LAYOUT_VERSION=2;'
]:
    if pat not in bundle: errors.append(f'missing v217 navigation fix: {pat}')
if "NAV_ITEMS[i].id===S.view" in bundle: errors.append('legacy index-based sidebar active-state logic returned')

# v218 Settings requirements.
required=[
    'MediaFlow v218 — Organized Settings Browser',
    'function v218SearchSettings',
    'function v218EnhanceSettingsDom',
    'function v218RestoreAllDefaults',
    'function v218ResetSettingPath',
    'function v218ResetNavigationDefaults',
    "S.settings=v218Clone(DEFAULT_SETTINGS);",
    'S.navLayout=v161NormalizeNavLayout(null)',
    'Search settings…',
    'Restore all defaults',
    'Reset section',
    "resetAllSettings=v218RestoreAllDefaults;"
]
for pat in required:
    if pat not in bundle: errors.append(f'missing v218 Settings feature: {pat}')

# Ensure reset-all does not call destructive resetAll/content wipe paths.
mod=(SRC/'pages/settings/143-v218-settings-organizer.js').read_text(encoding='utf-8')
restore=re.search(r'function v218RestoreAllDefaults\(\)\{([\s\S]*?)\n\}',mod)
if not restore: errors.append('v218RestoreAllDefaults function not found')
else:
    body=restore.group(1)
    if 'resetAll()' in body or 'S.library=' in body or 'S.sessions=' in body or 'S.categories=' in body:
        errors.append('v218 Restore all defaults appears to modify content data')

for css in re.findall(r'href="(assets/css/[^"]+\.css)"',index):
    if not (ROOT/css).exists(): errors.append(f'missing stylesheet: {css}')
for d in ['core','pages','components','features','services','utils','legacy']:
    if not (SRC/d).exists(): errors.append(f'missing source ownership folder: {d}')
if not (SRC/'pages/settings/143-v218-settings-organizer.js').exists(): errors.append('missing v218 Settings source module')

try:
    subprocess.run(['node','--check',str(bundle_path)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,text=True)
except Exception as e:
    errors.append(f'node syntax check failed: {e}')

if errors:
    print('CHECK FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('CHECK OK')
print('Owned source fragments:',len(order))
print('Settings search/index/reset audit: present')
print('Navigation highlight fix: preserved')
print('Persistent schemas: Cloud v201 / Full Backup v29 / Settings Preset v1')
print('JS SHA256:',hashlib.sha256(bundle.encode()).hexdigest())
