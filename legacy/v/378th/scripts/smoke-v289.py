#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
bundle=(ROOT/'assets/js/mediaflow-v289.bundle.js').read_text(encoding='utf-8')
index=(ROOT/'index.html').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
version=json.loads((ROOT/'version.json').read_text(encoding='utf-8'))
checks={
 'runtime version': 'const V289_RUNTIME_VERSION=289;' in bundle and 'MediaFlowRuntime.version=V289_RUNTIME_VERSION;' in bundle,
 'collection cover scale': 'collectionCoverScale' in bundle and 'v289SetQueueCoverScale' in bundle,
 'inner title cover scale': 'collectionTitleCoverScale' in bundle,
 'set category parity': "v289ChoiceIds('setCategory'" in bundle and "v230ResolvedSurface(surface)" in bundle,
 'set status parity': "v289ChoiceIds('setStatus'" in bundle,
 'set priority parity': "v289ChoiceIds('setPriority'" in bundle,
 'rich category icons': 'v289RichCategorySelectHtml' in bundle and 'v144CategoryIconHtml(cat)' in bundle,
 'library modal generic replacement': 'select id="l-status"[^>]*' in bundle and 'App.v135LibraryStatusChanged(this.value)' in bundle,
 'quick details parity': "if(key==='categoryId')return" in bundle and "if(key==='status')return" in bundle and "if(key==='priority')return" in bundle,
 'v289 css': '152-v289-personal-order-editor-choice-parity.css' in index,
 'v289 bundle': 'mediaflow-v289.bundle.js' in index,
 'pwa shell': 'mediaflow-pwa-v289-shell-v1' in sw,
 'pwa assets': '152-v289-personal-order-editor-choice-parity.css' in sw and 'mediaflow-v289.bundle.js' in sw,
 'version json': version.get('appVersion')==289 and version.get('version')==289 and version.get('build')==289,
 'personal order export remains v5': 'V287_ORDER_FORMAT_VERSION=5' in bundle,
}
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items(): print(('OK  ' if v else 'FAIL'),k)
if failed:
 print('FAILED:',', '.join(failed));sys.exit(1)
print('v289 smoke: OK')
