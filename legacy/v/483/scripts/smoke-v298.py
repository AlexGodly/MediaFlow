from pathlib import Path
import json, subprocess,sys,zipfile
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text()
bundle=(ROOT/'assets/js/mediaflow-v298.bundle.js').read_text()
sw=(ROOT/'sw.js').read_text()
css=(ROOT/'assets/css/158-v298-auth-layout-fix.css').read_text()
meta=json.loads((ROOT/'version.json').read_text())
order=json.loads((ROOT/'src/js/runtime-order.json').read_text())
checks={
  'release metadata':meta['appVersion']==298 and meta['version']==298 and meta['build']==298,
  'v298 bundle': 'assets/js/mediaflow-v298.bundle.js' in index,
  'auth CSS latest':'assets/css/158-v298-auth-layout-fix.css' in index,
  'v297 auth patch included exactly once':bundle.count('MediaFlow v297 — Auth Experience Refresh & Designed Deletion Confirm')==1,
  'v298 responsive repair included exactly once':bundle.count('MediaFlow v298 — Full-width, Responsive Premium Auth UI Repair')==1,
  'v297 source registered':'components/228-v297-premium-auth-experience.js' in order,
  'v298 source registered':'components/229-v298-auth-layout-repair.js' in order,
  'viewport width repair':'#app > .v297-auth-screen' in css and 'flex:1 1 100%' in css,
  'hero rebuilt':'Your media.' in bundle and 'Everywhere you are.' in bundle and 'v298-hero-orbit' in bundle,
  'no duplicate semantic icons':'v225IconEligible=function' in bundle and 'v225ButtonIconName=function' in bundle,
  'password show/hide retained':'MediaFlowAuth.togglePassword' in bundle,
  'designed account deletion retained':'MediaFlowProfile.performDeleteAccount' in bundle,
  'PWA shell v298':'mediaflow-pwa-v298-shell-v1' in sw and 'const MEDIAFLOW_VERSION=298;' in sw,
  'new CSS cached':'./assets/css/158-v298-auth-layout-fix.css' in sw,
  'v298 JS cached':'./assets/js/mediaflow-v298.bundle.js' in sw,
  'storage schemas unchanged':meta['cloudSyncVersion']==201 and meta['fullBackupSchema']==29 and meta['settingsPresetSchema']==1
}
for name,result in checks.items():print(('PASS' if result else 'FAIL')+' '+name)
if not all(checks.values()):sys.exit(1)
print('v298 release smoke: PASS')
