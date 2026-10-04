#!/usr/bin/env python3
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'src/js'
order=json.loads((SRC/'build-order.json').read_text(encoding='utf-8'))
out=ROOT/'assets/js/mediaflow-v218.bundle.js'
text=''.join((SRC/row['path']).read_text(encoding='utf-8') for row in order)
out.write_text(text,encoding='utf-8')
print(f'Built {out.relative_to(ROOT)} from {len(order)} owned source fragments ({len(text):,} characters)')
try:
    subprocess.run(['node','--check',str(out)],check=True)
    print('JavaScript syntax: OK')
except FileNotFoundError:
    print('Node not found; skipped node --check')
except subprocess.CalledProcessError as e:
    sys.exit(e.returncode)
