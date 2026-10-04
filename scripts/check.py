#!/usr/bin/env python3
from pathlib import Path
import json, re, subprocess, hashlib, sys
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'src/js'
errors=[]
index=(ROOT/'index.html').read_text(encoding='utf-8')
if '<meta name="mediaflow-version" content="216">' not in index: errors.append('index.html version is not 216')
if re.search(r'<style(?:\s|>)',index,re.I): errors.append('inline <style> block remains in index.html')
for m in re.finditer(r'<script([^>]*)>(.*?)</script>',index,re.I|re.S):
    if 'src=' not in m.group(1).lower() and m.group(2).strip(): errors.append('inline JavaScript remains in index.html')
order=json.loads((SRC/'build-order.json').read_text(encoding='utf-8'))
joined=''
for row in order:
    p=SRC/row['path']
    if not p.exists(): errors.append(f'missing source fragment: {row["path"]}'); continue
    joined+=p.read_text(encoding='utf-8')
bundle_path=ROOT/'assets/js/mediaflow-v216.bundle.js'
bundle=bundle_path.read_text(encoding='utf-8')
if joined != bundle: errors.append('bundle does not exactly match ordered source fragments')
# Normalize the only intended JS textual change and compare to the v215 stable runtime.
normalized=bundle.replace('Complete MediaFlow v216 architecture-refactored backup (stable v201 feature base). Expands global category-icon sizing and adds an independent persistent cover-placeholder category-icon scale.','Complete MediaFlow v215 modular backup (stable v201 feature base). Expands global category-icon sizing and adds an independent persistent cover-placeholder category-icon scale.',1)
if hashlib.sha256(normalized.encode()).hexdigest() != '04eeb987df031254fdbd7ae4a444c26018ecd9025ab081b85b5d3baf6a5e0649':
    errors.append('runtime parity failure: normalized v216 JS differs from stable v215/v201 runtime')
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
except Exception as e: errors.append(f'node syntax check failed: {e}')
if errors:
    print('CHECK FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('CHECK OK')
print('Owned source fragments:',len(order))
print('Runtime parity: stable v215/v201 logic preserved')
print('JS SHA256:',hashlib.sha256(bundle.encode()).hexdigest())
