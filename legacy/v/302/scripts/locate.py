#!/usr/bin/env python3
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]/'src/js'
if len(sys.argv)<2:
    print('Usage: python scripts/locate.py <text or symbol>')
    raise SystemExit(2)
needle=' '.join(sys.argv[1:]).lower()
hits=[]
for p in ROOT.rglob('*.js'):
    text=p.read_text(encoding='utf-8',errors='replace')
    if needle in text.lower():
        lines=[i+1 for i,l in enumerate(text.splitlines()) if needle in l.lower()]
        hits.append((p.relative_to(ROOT), lines[:8], len(lines)))
for p,lines,count in hits:
    print(f'{p}: lines {", ".join(map(str,lines))}' + (f' (+{count-len(lines)} more)' if count>len(lines) else ''))
print(f'{len(hits)} file(s) matched')
