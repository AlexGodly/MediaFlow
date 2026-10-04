#!/usr/bin/env python3
from pathlib import Path
import json, re, subprocess, hashlib, sys
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'src/js'
errors=[]
index=(ROOT/'index.html').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
if "mediaflow-v217-static-v1" not in sw: errors.append('service worker cache version is not v217')
if "./assets/js/mediaflow-v217.bundle.js" not in sw: errors.append('service worker does not cache v217 bundle')
if 'mediaflow-v216.bundle.js' in sw: errors.append('service worker still references v216 bundle')
if '<meta name="mediaflow-version" content="217">' not in index: errors.append('index.html version is not 217')
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

bundle_path=ROOT/'assets/js/mediaflow-v217.bundle.js'
if not bundle_path.exists():
    errors.append('missing v217 bundle')
    bundle=''
else:
    bundle=bundle_path.read_text(encoding='utf-8')
if joined != bundle: errors.append('bundle does not exactly match ordered source fragments')

# v217 navigation regression checks.
required_patterns=[
    'data-view="${escapeHtml(String(n.id))}"',
    "const viewId=String(el.dataset?.view||'');",
    "el.classList.toggle('active',viewId===String(S.view||''));",
    'const V161_NAV_LAYOUT_VERSION=2;',
    "NAV_ITEMS.splice(settingsIndex>=0?settingsIndex+1:NAV_ITEMS.length,0,{id:'about',label:'About'});",
    "const oldDefault=['dashboard','library','order','oldsystem','libraryhistory','history','batch','stats','profile','about','settings'];",
    'const sourceOrder=oldDefaultMatch ? valid : rawOrder;'
]
for pat in required_patterns:
    if pat not in bundle: errors.append(f'missing v217 navigation fix: {pat}')
if "NAV_ITEMS[i].id===S.view" in bundle:
    errors.append('legacy index-based sidebar active-state logic still present')

# Verify the corrected canonical default produced by the runtime insertion order.
expected_default=['dashboard','library','order','oldsystem','libraryhistory','history','batch','stats','profile','settings','about']
# The static base + insertion points are intentionally checked rather than executing app state.
base_match=re.search(r"const NAV_ITEMS = \[(.*?)\];",bundle,re.S)
if not base_match:
    errors.append('NAV_ITEMS base definition not found')
else:
    ids=re.findall(r"\{id:'([^']+)'",base_match.group(1))
    # Apply stable v201 insertion rules in bundle order.
    if 'order' not in ids:
        li=ids.index('library') if 'library' in ids else 0
        ids.insert(li+1,'order')
    if 'oldsystem' not in ids:
        oi=ids.index('order') if 'order' in ids else -1
        si=ids.index('stats') if 'stats' in ids else max(0,len(ids)-2)
        ids.insert(oi+1 if oi>=0 else si,'oldsystem')
    if 'about' not in ids:
        si=ids.index('settings') if 'settings' in ids else len(ids)-1
        ids.insert(si+1,'about')
    if ids != expected_default:
        errors.append(f'corrected default navigation order mismatch: {ids}')

# Compatibility guard: reverse only the intentional v217 JS changes and require
# the result to match the v216 runtime hash exactly. This catches accidental edits.
normalized=bundle
replacements=[
    ('Complete MediaFlow v217 modular navigation-fix backup (stable v201 feature base).',
     'Complete MediaFlow v216 architecture-refactored backup (stable v201 feature base).'),
    ('const V161_NAV_LAYOUT_VERSION=2;','const V161_NAV_LAYOUT_VERSION=1;'),
    ("  // v217 default navigation ends with Settings -> About. User-customized\n  // navigation order remains fully supported through Navigation settings.\n  NAV_ITEMS.splice(settingsIndex>=0?settingsIndex+1:NAV_ITEMS.length,0,{id:'about',label:'About'});",
     "  NAV_ITEMS.splice(settingsIndex>=0?settingsIndex:NAV_ITEMS.length,0,{id:'about',label:'About'});"),
    ("  // v216's canonical default accidentally placed About before Settings.\n  // Only migrate that exact old default. Any genuinely customized order is\n  // preserved, so Navigation settings remain authoritative for the user.\n  const oldDefault=['dashboard','library','order','oldsystem','libraryhistory','history','batch','stats','profile','about','settings'];\n  const rawOrder=Array.isArray(src.order)?src.order.map(x=>String(x||'')):[];\n  const oldDefaultMatch=rawOrder.length===oldDefault.length && oldDefault.every((id,i)=>rawOrder[i]===id);\n  const sourceOrder=oldDefaultMatch ? valid : rawOrder;\n\n",
     ''),
    ('  for(const id of sourceOrder){','  for(const id of (Array.isArray(src.order)?src.order:[])){'),
    ('          <div class="nav-item ${S.view===n.id?\'active\':\'\'}" data-view="${escapeHtml(String(n.id))}" onclick="App.setView(\'${n.id}\')">',
     '          <div class="nav-item ${S.view===n.id?\'active\':\'\'}" onclick="App.setView(\'${n.id}\')">'),
    ("  document.querySelectorAll('.nav-item').forEach(el=>{\n    const viewId=String(el.dataset?.view||'');\n    el.classList.toggle('active',viewId===String(S.view||''));\n  });",
     "  document.querySelectorAll('.nav-item').forEach((el,i)=>el.classList.toggle('active', NAV_ITEMS[i].id===S.view));")
]
for new,old in replacements:
    if new not in normalized:
        errors.append('compatibility normalization pattern missing: '+new[:80])
    else:
        normalized=normalized.replace(new,old,1)
V216_HASH='4444ec6b849c237f7fe7bf2e3a04159bcc1e0afada80186fcaaae713427951c1'
if normalized and hashlib.sha256(normalized.encode()).hexdigest()!=V216_HASH:
    errors.append('compatibility failure: v217 contains executable JS changes outside the intended navigation fix')

for css in re.findall(r'href="(assets/css/[^"]+\.css)"',index):
    if not (ROOT/css).exists(): errors.append(f'missing stylesheet: {css}')
required=['core','pages','components','features','services','utils','legacy']
for d in required:
    if not (SRC/d).exists(): errors.append(f'missing source ownership folder: {d}')
for d in ['dashboard','library','personal-order','history','statistics','settings']:
    if not (SRC/'pages'/d).exists(): errors.append(f'missing page folder: {d}')
critical=['function renderLibrary','function renderSettings','function renderStats','function renderDashboard','const DEFAULT_SETTINGS','window.App']
for token in critical:
    if token not in bundle: errors.append(f'missing critical runtime symbol/text: {token}')
try:
    subprocess.run(['node','--check',str(bundle_path)],check=True,stdout=subprocess.DEVNULL)
except Exception as e:
    errors.append(f'node syntax check failed: {e}')

if errors:
    print('CHECK FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('CHECK OK')
print('Owned source fragments:',len(order))
print('Navigation highlight: keyed by data-view ID')
print('Default navigation order:', ' > '.join(expected_default))
print('Compatibility: only intended v217 navigation runtime changes vs v216')
print('JS SHA256:',hashlib.sha256(bundle.encode()).hexdigest())
