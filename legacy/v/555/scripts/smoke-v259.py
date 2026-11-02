#!/usr/bin/env python3
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def req(c,m):
    if not c: errors.append(m)
req((ROOT/'VERSION').read_text().strip()=='259','VERSION is not 259')
index=(ROOT/'index.html').read_text(encoding='utf-8')
req('126-v259-category-icon-showcase-polish.css' in index,'v259 CSS missing from index')
req('mediaflow-v259.bundle.js' in index,'v259 bundle missing from index')
js=(ROOT/'assets/js/mediaflow-v259.bundle.js').read_text(encoding='utf-8') if (ROOT/'assets/js/mediaflow-v259.bundle.js').exists() else ''
css=(ROOT/'assets/css/126-v259-category-icon-showcase-polish.css').read_text(encoding='utf-8')
for token in ['V259_RUNTIME_VERSION=259','data-v225-iconified="1"','aria-label="${escapeHtml(icon.label)}"','v258BuiltInCategoryIconPalette=function']:
    req(token in js,f'missing v259 runtime marker: {token}')
req('v258-icon-choice-label{display:none!important;}' in css,'visible built-in icon labels are not suppressed')
req('.v258-icon-choice>.v225-btn-icon{display:none!important;}' in css,'injected action icon suppression missing')
req('width:42px' in css and 'height:42px' in css,'smaller built-in icon sizing missing')
req(len(list((ROOT/'assets/category-icons').glob('*.png')))==22,'22 packaged category icons were not preserved')
sw=(ROOT/'sw.js').read_text(encoding='utf-8') if (ROOT/'sw.js').exists() else ''
req('mediaflow-pwa-v259-shell-v1' in sw,'v259 PWA cache name missing')
if errors:
    print('v259 smoke: FAIL')
    for e in errors: print('-',e)
    sys.exit(1)
print('v259 smoke: OK')
print('Compact icon-only category artwork picker and PWA release verified.')
