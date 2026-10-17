#!/usr/bin/env python3
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[1]
bundle=(ROOT/'assets/js/mediaflow-v294.bundle.js').read_text(encoding='utf-8')
index=(ROOT/'index.html').read_text(encoding='utf-8')
css=(ROOT/'assets/css/154-v291-searchable-category-picker.css').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8') if (ROOT/'sw.js').exists() else ''
version=json.loads((ROOT/'version.json').read_text(encoding='utf-8'))
checks={
 'v291 category runtime preserved': 'const V291_RUNTIME_VERSION=291;' in bundle and 'MediaFlowRuntime.version=V291_RUNTIME_VERSION;' in bundle,
 'search markup preserved': 'Search categories…' in bundle and 'mf291-category-search' in bundle,
 'add edit category search preserved': 'v289RichCategorySelectHtml=v291CategorySelectHtml;' in bundle,
 'quick edit viewport grid preserved': "context==='quick-details'" in bundle and 'grid-template-columns:repeat(3' in css,
 'duplicate category action icons still removed': "matches?.('.mf290-category-trigger,.mf290-category-option" in bundle and 'genericCategoryActionIcons:false' in bundle,
 'aligned category rows preserved': 'grid-template-columns:34px minmax(0,1fr)!important' in css,
 'v290 hidden category behavior preserved': 'v290EditorCategoryModel' in bundle and 'v290ApplyCategoryVisibilityToEditors' in bundle,
 'v294 bundle loaded': 'mediaflow-v294.bundle.js' in index,
 'v291 category css loaded': '154-v291-searchable-category-picker.css' in index,
 'release metadata is v294': version.get('appVersion')==294 and version.get('version')==294 and version.get('build')==294,
 'personal order export remains v5': 'V287_ORDER_FORMAT_VERSION=5' in bundle,
 'no v292 runtime module': 'V292_RUNTIME_VERSION' not in bundle and 'v292' not in ''.join((ROOT/'src/js/runtime-order.json').read_text(encoding='utf-8').split()).lower(),
 'no v293 runtime module': 'V293_RUNTIME_VERSION' not in bundle and 'v293' not in ''.join((ROOT/'src/js/runtime-order.json').read_text(encoding='utf-8').split()).lower(),
}
if sw:
 checks['pwa shell']='mediaflow-pwa-v294-shell-v1' in sw
 checks['pwa v294 bundle cached']='mediaflow-v294.bundle.js' in sw
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items(): print(('OK  ' if v else 'FAIL'),k)
if failed:
 print('FAILED:',', '.join(failed));sys.exit(1)
print('v294 rollback smoke: OK')
