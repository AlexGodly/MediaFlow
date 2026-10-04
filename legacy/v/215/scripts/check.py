#!/usr/bin/env python3
from pathlib import Path
import json, re, subprocess, hashlib, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
index=(ROOT/'index.html').read_text(encoding='utf-8')
if '<meta name="mediaflow-version" content="215">' not in index: errors.append('index.html version is not 215')
if re.search(r'<style(?:\s|>)',index,re.I): errors.append('inline <style> block remains in index.html')
inline_scripts=[]
for m in re.finditer(r'<script([^>]*)>(.*?)</script>',index,re.I|re.S):
    if 'src=' not in m.group(1).lower() and m.group(2).strip(): inline_scripts.append(m.group(0)[:80])
if inline_scripts: errors.append('inline JavaScript remains in index.html')
order=json.loads((ROOT/'src/js/build-order.json').read_text(encoding='utf-8'))
joined=''.join((ROOT/'src/js/parts'/row['file']).read_text(encoding='utf-8') for row in order)
bundle=(ROOT/'assets/js/mediaflow-v215.bundle.js').read_text(encoding='utf-8')
if joined != bundle: errors.append('bundle does not exactly match concatenated source parts')
for css in re.findall(r'href="(assets/css/[^"]+\.css)"',index):
    if not (ROOT/css).exists(): errors.append(f'missing stylesheet: {css}')
try:
    subprocess.run(['node','--check',str(ROOT/'assets/js/mediaflow-v215.bundle.js')],check=True,stdout=subprocess.DEVNULL)
except Exception as e: errors.append(f'node syntax check failed: {e}')
if errors:
    print('CHECK FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('CHECK OK')
print('JS SHA256:',hashlib.sha256(bundle.encode()).hexdigest())
