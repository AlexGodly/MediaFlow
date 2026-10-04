#!/usr/bin/env python3
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
parts=ROOT/'src/js/parts'
order=json.loads((ROOT/'src/js/build-order.json').read_text(encoding='utf-8'))
out=ROOT/'assets/js/mediaflow-v215.bundle.js'
text=''.join((parts/row['file']).read_text(encoding='utf-8') for row in order)
out.write_text(text,encoding='utf-8')
print(f'Built {out.relative_to(ROOT)} ({len(text):,} characters)')
try:
    subprocess.run(['node','--check',str(out)],check=True)
    print('JavaScript syntax: OK')
except FileNotFoundError:
    print('Node not found; skipped node --check')
except subprocess.CalledProcessError as e:
    sys.exit(e.returncode)
