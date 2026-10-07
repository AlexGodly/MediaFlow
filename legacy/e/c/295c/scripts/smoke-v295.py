#!/usr/bin/env python3
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[1]
bundle=(ROOT/'assets/js/mediaflow-v295.bundle.js').read_text(encoding='utf-8')
index=(ROOT/'index.html').read_text(encoding='utf-8')
css=(ROOT/'assets/css/155-v295-logging-intensity.css').read_text(encoding='utf-8')
version=json.loads((ROOT/'version.json').read_text(encoding='utf-8'))
checks={
 'v295 bundle exists': 'MediaFlow v295 — Logging Intensity Slider + Anime Scene Library' in bundle,
 'dashboard intensity card wired': 'v295RenderIntensityCard' in bundle and 'LOGGING INTENSITY' in bundle,
 'settings section wired': 'v295RenderSettingsSection' in bundle,
 'background preset library included': 'DEFAULT BACKGROUND LIBRARY' in bundle and 'Cherry Blossom Path' in bundle,
 'custom mode editing present': 'v295UpdateModeName' in bundle and 'v295UpdateModeMultiplier' in bundle,
 'v295 css loaded': '155-v295-logging-intensity.css' in index,
 'v295 bundle loaded by index': 'mediaflow-v295.bundle.js' in index,
 'v295 css contains intensity classes': '.v295-intensity-card' in css and '.v295-bg-gallery' in css,
 'version metadata is v295': version.get('appVersion')==295 and version.get('version')==295 and version.get('build')==295,
}
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items(): print(('OK  ' if v else 'FAIL'),k)
if failed:
 print('FAILED:',', '.join(failed));sys.exit(1)
print('v295 smoke: OK')
