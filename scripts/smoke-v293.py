#!/usr/bin/env python3
from pathlib import Path
import re,sys,json
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css=(ROOT/'assets/css/156-v293-cinematic-recommendation-background.css').read_text(encoding='utf-8')
bundle=(ROOT/'assets/js/mediaflow-v293.bundle.js').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
version=json.loads((ROOT/'version.json').read_text(encoding='utf-8'))
checks={
 'version meta':'content="293"' in index,
 'v293 css':'156-v293-cinematic-recommendation-background.css' in index,
 'v293 bundle':'mediaflow-v293.bundle.js' in index,
 'cinematic class':'mf293-cinematic-cover' in bundle,
 'v293 audit':'v293AuditState' in bundle,
 'strong background':'saturate(1.58)' in css and 'opacity:.76' in css,
 'glass title feature':'.v50-title-feature' in css and 'backdrop-filter:blur(8px)' in css,
 'mobile treatment':'@media(max-width:600px)' in css,
 'pwa shell':'mediaflow-pwa-v293-shell-v1' in sw,
 'pwa css':'156-v293-cinematic-recommendation-background.css' in sw,
 'metadata':version.get('appVersion')==293 and version.get('version')==293 and version.get('build')==293,
}
failed=[k for k,v in checks.items() if not v]
if failed:
 print('v293 smoke FAILED:',', '.join(failed));sys.exit(1)
print('v293 smoke: OK')
