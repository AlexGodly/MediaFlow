#!/usr/bin/env python3
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[1]
bundle=(ROOT/'assets/js/mediaflow-v291.bundle.js').read_text(encoding='utf-8')
index=(ROOT/'index.html').read_text(encoding='utf-8')
css=(ROOT/'assets/css/154-v291-searchable-category-picker.css').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8') if (ROOT/'sw.js').exists() else ''
version=json.loads((ROOT/'version.json').read_text(encoding='utf-8'))
checks={
 'runtime version': 'const V291_RUNTIME_VERSION=291;' in bundle and 'MediaFlowRuntime.version=V291_RUNTIME_VERSION;' in bundle,
 'search markup': 'Search categories…' in bundle and 'mf291-category-search' in bundle,
 'add edit search': 'v289RichCategorySelectHtml=v291CategorySelectHtml;' in bundle,
 'quick edit viewport grid': "context==='quick-details'" in bundle and 'grid-template-columns:repeat(3' in css,
 'duplicate action icons removed': "matches?.('.mf290-category-trigger,.mf290-category-option" in bundle and 'genericCategoryActionIcons:false' in bundle,
 'aligned category rows': 'grid-template-columns:34px minmax(0,1fr)!important' in css,
 'hidden category behavior preserved': 'v290EditorCategoryModel' in bundle and 'v290ApplyCategoryVisibilityToEditors' in bundle,
 'v291 css': '154-v291-searchable-category-picker.css' in index,
 'v291 bundle': 'mediaflow-v291.bundle.js' in index,
 'version json': version.get('appVersion')==291 and version.get('version')==291 and version.get('build')==291,
 'personal order export remains v5': 'V287_ORDER_FORMAT_VERSION=5' in bundle,
}
if sw:
 checks['pwa shell']='mediaflow-pwa-v291-shell-v1' in sw
 checks['pwa assets']='154-v291-searchable-category-picker.css' in sw and 'mediaflow-v291.bundle.js' in sw
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items(): print(('OK  ' if v else 'FAIL'),k)
if failed:
 print('FAILED:',', '.join(failed));sys.exit(1)
print('v291 smoke: OK')
