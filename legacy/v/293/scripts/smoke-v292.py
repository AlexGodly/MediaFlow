#!/usr/bin/env python3
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[1]
bundle=(ROOT/'assets/js/mediaflow-v292.bundle.js').read_text(encoding='utf-8')
index=(ROOT/'index.html').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
version=json.loads((ROOT/'version.json').read_text(encoding='utf-8'))
checks={
 'runtime version': 'const V292_RUNTIME_VERSION=292;' in bundle and 'MediaFlowRuntime.version=V292_RUNTIME_VERSION;' in bundle,
 'default mode': "V292_RECOMMENDATION_BG_DEFAULT='default'" in bundle and "DEFAULT_SETTINGS[V292_RECOMMENDATION_BG_KEY]=V292_RECOMMENDATION_BG_DEFAULT" in bundle,
 'cover mode': "V292_RECOMMENDATION_BG_COVER='cover'" in bundle and 'mf292-recommendation-cover' in bundle,
 'organized dashboard setting': 'Recommendation background' in bundle and 'v292DashboardVisibilitySettingsHtmlBase=v192DashboardVisibilitySettingsHtml' in bundle,
 'fallback without cover': "if(!cover)return html" in bundle,
 'visual only audit': 'recommendationLogicChanged:false' in bundle and 'loggingLogicChanged:false' in bundle,
 'settings persistence': 'v292EnsureSettings' in bundle and 'v292NormalizeImportedSettingsBase' in bundle and 'v292PersistSettingsBase' in bundle,
 'reset integration': 'App.v292SetRecommendationBackground' in bundle and 'V292_RECOMMENDATION_BG_KEY' in bundle,
 'v292 css': '155-v292-recommendation-cover-background.css' in index,
 'v292 bundle': 'mediaflow-v292.bundle.js' in index,
 'version json': version.get('appVersion')==292 and version.get('version')==292 and version.get('build')==292,
 'pwa shell': 'mediaflow-pwa-v292-shell-v1' in sw,
 'pwa assets': '155-v292-recommendation-cover-background.css' in sw and 'mediaflow-v292.bundle.js' in sw,
 'personal order export remains v5': 'V287_ORDER_FORMAT_VERSION=5' in bundle,
}
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items(): print(('OK  ' if v else 'FAIL'),k)
if failed:
 print('FAILED:',', '.join(failed));sys.exit(1)
print('v292 smoke: OK')
