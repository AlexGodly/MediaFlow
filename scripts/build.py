#!/usr/bin/env python3
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'src/js'
order=json.loads((SRC/'build-order.json').read_text(encoding='utf-8'))
runtime_order=json.loads((SRC/'runtime-order.json').read_text(encoding='utf-8'))
out=ROOT/'assets/js/mediaflow-v228.bundle.js'
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
print(f'Built {out.relative_to(ROOT)} from {owned_count} source fragments ({len(text):,} characters)')
print(f'Injected {len(runtime_order)} runtime extension module(s) through v228 inside the MediaFlow application scope')
try:
    subprocess.run(['node','--check',str(out)],check=True)
    print('JavaScript syntax: OK')
except FileNotFoundError:
    print('Node not found; skipped node --check')
except subprocess.CalledProcessError as e:
    sys.exit(e.returncode)
