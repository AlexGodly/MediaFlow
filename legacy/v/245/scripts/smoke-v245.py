#!/usr/bin/env python3
from pathlib import Path
import json, hashlib, re, sys, struct

ROOT=Path(__file__).resolve().parents[1]
errors=[]
version=int((ROOT/'VERSION').read_text(encoding='utf-8').strip())
index=(ROOT/'index.html').read_text(encoding='utf-8')
manifest=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))
sw=(ROOT/'sw.js').read_text(encoding='utf-8')

if version!=245: errors.append(f'expected VERSION 245, got {version}')
if '<link rel="icon" href="favicon.ico" type="image/x-icon" sizes="any">' not in index:
    errors.append('favicon.ico is not wired as the browser favicon')
if '<link rel="icon" href="assets/icons/favicon-32.png" type="image/png" sizes="32x32">' not in index:
    errors.append('32px favicon PNG fallback is not wired')
if 'assets/icons/apple-touch-icon.png' not in index:
    errors.append('Apple touch icon is not wired')

expected=[
    'favicon.ico',
    'assets/icons/mediaflow.ico',
    'assets/icons/favicon-32.png',
    'assets/icons/mediaflow-192.png',
    'assets/icons/mediaflow-512.png',
    'assets/icons/mediaflow-maskable-512.png',
    'assets/icons/apple-touch-icon.png',
]
for rel in expected:
    p=ROOT/rel
    if not p.exists() or p.stat().st_size<100:
        errors.append(f'missing/empty icon asset: {rel}')

if (ROOT/'favicon.ico').exists() and (ROOT/'assets/icons/mediaflow.ico').exists():
    if hashlib.sha256((ROOT/'favicon.ico').read_bytes()).hexdigest()!=hashlib.sha256((ROOT/'assets/icons/mediaflow.ico').read_bytes()).hexdigest():
        errors.append('canonical ICO copies differ')

icons={x.get('src'):(x.get('sizes'),x.get('purpose')) for x in manifest.get('icons',[])}
for rel,size in [
    ('./assets/icons/mediaflow-192.png','192x192'),
    ('./assets/icons/mediaflow-512.png','512x512'),
    ('./assets/icons/mediaflow-maskable-512.png','512x512')
]:
    if rel not in icons: errors.append(f'manifest missing {rel}')
    elif icons[rel][0]!=size: errors.append(f'manifest has wrong size for {rel}: {icons[rel][0]}')

for rel in ['./favicon.ico','./assets/icons/favicon-32.png','./assets/icons/mediaflow-192.png',
            './assets/icons/mediaflow-512.png','./assets/icons/mediaflow-maskable-512.png',
            './assets/icons/apple-touch-icon.png']:
    if rel not in sw: errors.append(f'service worker app shell missing {rel}')

if f'mediaflow-pwa-v{version}-shell-v1' not in sw:
    errors.append('service-worker cache version did not advance with VERSION')
if f'assets/js/mediaflow-v{version}.bundle.js' not in index:
    errors.append('index is not loading current release bundle')

if errors:
    print('v245 SMOKE FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('v245 icon branding smoke: OK')
print('Website favicon: canonical user-provided ICO')
print('PWA icons: 192 / 512 / maskable 512')
print('Apple touch icon: active')
print('PWA cache:',f'mediaflow-pwa-v{version}-shell-v1')
