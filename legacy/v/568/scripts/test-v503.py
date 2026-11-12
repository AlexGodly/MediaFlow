#!/usr/bin/env python3
"""MediaFlow v503 regression contract — runnable after scripts/build.py."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
assert (root/'VERSION').read_text().strip()=='503'
meta=json.loads((root/'version.json').read_text())
assert all(meta[k]==503 for k in ['appVersion','version','build'])
runtime=json.loads((root/'src/js/runtime-order.json').read_text())
extension='components/371-v503-recovery-cover-contrast.js'
assert runtime.count(extension)==1
js=(root/'src/js'/extension).read_text()
bundle=(root/'assets/js/mediaflow-v503.bundle.js').read_text()
assert js in bundle, 'Runtime module must be part of the deployed bundle'
for identifier in ('mf503CoverHtml','v417LibraryCoverSource','v370CoverHtml=function',
 'mf419MissingCoverHtml=mf503CoverHtml','mf503FixMetadataSpacing',
 'v181TitleDetailsHtml=function','mf447Buttons({id:String(item.id)})',
 'mf503PaintSelectedContrast','mf379-picked','v379UpdatePickerActions'):
 assert identifier in js, identifier
assert "'<small>Missing cover</small>'" not in js
assert 'src/js/components/371-v503' not in (root/'index.html').read_text()
html=(root/'index.html').read_text()
assert 'mediaflow-v503.bundle.js' in html
assert '284-v503-recovery-logging-parity.css' in html
assert '<meta name="mediaflow-version" content="503">' in html
assert 'mediaflow-v483.bundle.js' not in html
css=(root/'assets/css/284-v503-recovery-logging-parity.css').read_text()
for selector in ('.mf503-cover-fallback','.mf503-title-cover',
 '.mf503-detail-recovery','.log-suggestion.mf379-picked'):
 assert selector in css, selector
service=(root/'sw.js').read_text()
assert 'const MEDIAFLOW_VERSION=503;' in service
assert 'mediaflow-pwa-v503-shell' in service
assert './assets/css/284-v503-recovery-logging-parity.css' in service
assert './assets/js/mediaflow-v503.bundle.js' in service
print('PASS: v503 runtime, contrast, Library cover parity, PWA and release metadata')
