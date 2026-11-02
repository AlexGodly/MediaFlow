#!/usr/bin/env python3
from pathlib import Path
import json, subprocess, sys, re
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'src/js'
VERSION=int((ROOT/'VERSION').read_text(encoding='utf-8').strip())
order=json.loads((SRC/'build-order.json').read_text(encoding='utf-8'))
runtime_order=json.loads((SRC/'runtime-order.json').read_text(encoding='utf-8'))
out=ROOT/f'assets/js/mediaflow-v{VERSION}.bundle.js'
parts=[]
owned_count=0
runtime_injected=False
for row in order:
    if row.get('slot')=='runtime_extensions':
        runtime_injected=True
        for rel in runtime_order:
            parts.append((SRC/rel).read_text(encoding='utf-8'))
            owned_count+=1
        continue
    rel=row.get('path')
    if not rel: continue
    parts.append((SRC/rel).read_text(encoding='utf-8'))
    owned_count+=1
if not runtime_injected:
    raise SystemExit('runtime extension slot missing from build-order.json')
text=''.join(parts)
out.write_text(text,encoding='utf-8')

# Keep the HTML entry point aligned with the release version/bundle automatically.
index_path=ROOT/'index.html'
index=index_path.read_text(encoding='utf-8')
index=re.sub(r'<meta name="mediaflow-version" content="\d+">',f'<meta name="mediaflow-version" content="{VERSION}">',index,count=1)
index=re.sub(r'assets/js/mediaflow-v\d+\.bundle\.js',f'assets/js/mediaflow-v{VERSION}.bundle.js',index,count=1)

# v555: one stylesheet instead of 200+ requests. src/css-order.json keeps the
# original cascade order (and media conditions); sources stay in assets/css.
css_order=json.loads((ROOT/'src/css-order.json').read_text(encoding='utf-8'))
css_parts=[f'/* MediaFlow v{VERSION} stylesheet bundle: {len(css_order)} sources, original cascade order. */\n']
for row in css_order:
    rel=row['path']
    source=(ROOT/rel).read_text(encoding='utf-8')
    if re.search(r'@import|@charset',source):
        raise SystemExit(f'{rel}: @import/@charset cannot be bundled')
    if row.get('media'):
        source='@media '+row['media']+'{\n'+source+'\n}'
    css_parts.append(f'/* --- {rel} --- */\n{source}\n')
css_out=ROOT/f'assets/css/mediaflow-v{VERSION}.bundle.css'
for old in (ROOT/'assets/css').glob('mediaflow-v*.bundle.css'):
    if old!=css_out: old.unlink()
css_out.write_text(''.join(css_parts),encoding='utf-8')
index=re.sub(r'assets/css/mediaflow-v\d+\.bundle\.css',f'assets/css/mediaflow-v{VERSION}.bundle.css',index,count=1)
print(f'Built {css_out.relative_to(ROOT)} from {len(css_order)} stylesheets')
index_path.write_text(index,encoding='utf-8')

print(f'Built {out.relative_to(ROOT)} from {owned_count} source fragments ({len(text):,} characters)')
print(f'Injected {len(runtime_order)} runtime extension module(s) through v{VERSION} inside the MediaFlow application scope')
try:
    subprocess.run(['node','--check',str(out)],check=True)
    print('JavaScript syntax: OK')
except FileNotFoundError:
    print('Node not found; skipped node --check')
except subprocess.CalledProcessError as e:
    sys.exit(e.returncode)

# PWA files are release artifacts too. Every future build refreshes the cache name
# and discovers the current local CSS/JS assets from index.html automatically.
subprocess.run([sys.executable,str(ROOT/'scripts/pwa.py')],check=True)

# Never publish an installable PWA with a broken service worker. The v512
# deployment had a syntax error in sw.js although its main JS bundle passed.
# Exercise the worker's update handshake and critical-only install lifecycle.
try:
    subprocess.run(['node','--check',str(ROOT/'sw.js')],check=True)
    subprocess.run(['node',str(ROOT/'scripts/check-pwa-release.js')],check=True)
    print('PWA service worker syntax and upgrade smoke test: OK')
except FileNotFoundError:
    print('Node not found; skipped PWA check locally (CI must run Node checks)')
except subprocess.CalledProcessError as e:
    sys.exit(e.returncode)

