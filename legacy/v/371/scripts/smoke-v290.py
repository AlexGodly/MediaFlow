#!/usr/bin/env python3
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[1]
bundle=(ROOT/'assets/js/mediaflow-v290.bundle.js').read_text(encoding='utf-8')
index=(ROOT/'index.html').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
version=json.loads((ROOT/'version.json').read_text(encoding='utf-8'))
checks={
 'runtime version': 'const V290_RUNTIME_VERSION=290;' in bundle and 'MediaFlowRuntime.version=V290_RUNTIME_VERSION;' in bundle,
 'portal category picker': 'v290ToggleCategoryMenu' in bundle and 'mf290-category-popover' in bundle,
 'v289 renderer upgraded': 'v289RichCategorySelectHtml=v290CategorySelectHtml;' in bundle,
 'category order preserved': "v230ResolvedSurface('setCategory')" in bundle,
 'visibility default off': "V290_EDITOR_VISIBILITY_KEY='v290ApplyCategoryVisibilityToTitleEditing'" in bundle and "DEFAULT_SETTINGS[V290_EDITOR_VISIBILITY_KEY]=false" in bundle,
 'visibility opt in': 'Apply Set Category visibility to title editing' in bundle and 'v290SetEditorCategoryVisibility' in bundle,
 'current hidden preserved': "id===currentId" in bundle,
 'quick edit focus': "key==='categoryId'" in bundle and 'mf290-category-trigger' in bundle,
 'modal boundary awareness': "v181-quick-detail-actions,.modal-actions" in bundle and 'v290CategoryBoundary' in bundle,
 'v290 css': '153-v290-category-selector-ui-visibility.css' in index,
 'v290 bundle': 'mediaflow-v290.bundle.js' in index,
 'pwa shell': 'mediaflow-pwa-v290-shell-v1' in sw,
 'pwa assets': '153-v290-category-selector-ui-visibility.css' in sw and 'mediaflow-v290.bundle.js' in sw,
 'version json': version.get('appVersion')==290 and version.get('version')==290 and version.get('build')==290,
 'personal order export remains v5': 'V287_ORDER_FORMAT_VERSION=5' in bundle,
}
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items(): print(('OK  ' if v else 'FAIL'),k)
if failed:
 print('FAILED:',', '.join(failed));sys.exit(1)
print('v290 smoke: OK')
