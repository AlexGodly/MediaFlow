#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def req(cond,msg):
    if not cond: errors.append(msg)

req((ROOT/'VERSION').read_text().strip()=='258','VERSION is not 258')
index=(ROOT/'index.html').read_text(encoding='utf-8')
req('125-v258-category-editor-icons-persistence-audit.css' in index,'v258 CSS missing from index')
req('mediaflow-v258.bundle.js' in index,'v258 bundle missing from index')
js=(ROOT/'assets/js/mediaflow-v258.bundle.js').read_text(encoding='utf-8') if (ROOT/'assets/js/mediaflow-v258.bundle.js').exists() else ''
for token in ['V258_BUILTIN_CATEGORY_ICONS','v258PickBuiltInCategoryIcon','Category artwork','categoryVisualMetadata','builtInCategoryArtworkV258']:
    req(token in js,f'missing v258 runtime marker: {token}')
icons=sorted((ROOT/'assets/category-icons').glob('*.png'))
req(len(icons)==22,f'expected 22 category icons, found {len(icons)}')
for p in icons:
    try:
        im=Image.open(p)
        req(im.size==(512,512),f'{p.name} is {im.size}, expected 512x512')
        req(im.mode in ('RGBA','LA','P'),'{} does not preserve transparency-capable mode'.format(p.name))
    except Exception as e: errors.append(f'cannot read {p.name}: {e}')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
for p in icons:
    rel='./'+p.relative_to(ROOT).as_posix()
    req(rel in sw,f'{rel} missing from PWA app shell')
req('mediaflow-pwa-v258-shell-v1' in sw,'v258 PWA cache name missing')
manifest=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))
req(manifest.get('display')=='standalone','PWA display is not standalone')
req(manifest.get('scope')=='./','PWA scope changed')
req(manifest.get('start_url')=='./','PWA start_url changed')
# Compatibility constants / audited paths
for token in ['V201_CLOUD_SYNC_VERSION','V201_BACKUP_SCHEMA_VERSION','V196_SETTINGS_PRESET_SCHEMA_VERSION','V232_ORDER_FORMAT_VERSION']:
    req(token in js,f'compatibility constant missing: {token}')
for token in ['session_json','progressionBreakdown','dashboardToolsV257','backupBeforeUpdate']:
    req(token in js,f'audited persistence marker missing: {token}')
if errors:
    print('v258 smoke: FAIL')
    for e in errors: print('-',e)
    sys.exit(1)
print('v258 smoke: OK')
print('22 built-in category icons, editor integration, PWA offline assets and persistence compatibility verified.')
