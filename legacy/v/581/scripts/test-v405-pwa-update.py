#!/usr/bin/env python3
"""Portable PWA asset inventory + simulated SW lifecycle. No real browser install claim."""
from pathlib import Path
import json,re,subprocess
root=Path(__file__).resolve().parents[1]
sw=(root/'sw.js').read_text()
assert 'MEDIAFLOW_VERSION=405' in sw
assert 'mediaflow-pwa-v405-shell-v1' in sw
assets=re.findall(r'^  "(\./[^"\n]+)"',sw,re.M)
assert len(assets)>160
missing=[a for a in assets if a!='./' and not (root/a[2:]).exists()]
assert not missing,missing
subprocess.run(['node',str(root/'scripts/test-v405-pwa-contract.cjs')],check=True)
print('PASS v405 PWA static inventory:',len(assets),'assets, generated v405 worker and simulated cache lifecycle')
