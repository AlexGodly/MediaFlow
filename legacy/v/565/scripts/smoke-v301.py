#!/usr/bin/env python3
"""v301 stable v298 restoration + rerolls-only patch smoke verification."""
from pathlib import Path
import json, subprocess
root=Path(__file__).resolve().parents[1]
base=Path('/mnt/data/mediaflow_v298_work')
checks=[]
def check(label,cond):
    checks.append((label,bool(cond)))
    print(('PASS' if cond else 'FAIL')+' '+label)
js=(root/'assets/js/mediaflow-v301.bundle.js').read_text()
source=(root/'src/js/components/230-v301-rerolls-history-fix.js').read_text()
css=(root/'assets/css/159-v301-current-rerolls-responsive.css').read_text()
index=(root/'index.html').read_text()
sw=(root/'sw.js').read_text()
manifest=json.loads((root/'version.json').read_text())
check('release v301',manifest['appVersion']==301 and (root/'VERSION').read_text().strip()=='301')
check('v301 JS active', 'assets/js/mediaflow-v301.bundle.js' in index)
check('v301 CSS active', 'assets/css/159-v301-current-rerolls-responsive.css' in index)
check('v301 CSS PWA cached', './assets/css/159-v301-current-rerolls-responsive.css' in sw)
check('v301 JS PWA cached', './assets/js/mediaflow-v301.bundle.js' in sw)
check('v301 PWA shell','mediaflow-pwa-v301-shell-v1' in sw)
check('no Logging Intensity code',all(x not in js for x in ('v299LoggingIntensity','v299DashboardIntensityHtml','v300LoggingIntensity','Logging Intensity slider')))
check('no v299 or v300 source modules',all(('v299' not in p and 'v300' not in p) for p in json.loads((root/'src/js/runtime-order.json').read_text())))
check('reroll UI source rebuild-safe', 'components/230-v301-rerolls-history-fix.js' in (root/'src/js/runtime-order.json').read_text())
check('reroll open uses current v298 base', 'const v301OpenRerollsBase=App.v180OpenRerollHistory;' in js)
check('native list scrolling', 'overflow-y:auto!important' in css and '-webkit-overflow-scrolling:touch' in css)
check('dynamic cover size capped','--v181-cover-reroll-history' in css and 'clamp(' in css)
check('modal accessible', 'aria-modal' in source and 'aria-label' in source and "event.key==='Escape'" in source)
check('existing respect and Edit logic preserved',all(x in js for x in ('v180RespectSlotLimit(task)','App.v180EditHistoryTitle','v180EnsureRecommendationHistory(task)')))
if base.exists():
    basejs=(base/'assets/js/mediaflow-v298.bundle.js').read_text()
    check('baseline is exactly v298 bundle plus isolated v301 patch',js.startswith(basejs.rsplit('})();',1)[0].rstrip()) and js.endswith('})();\n'))
else:print('SKIP baseline comparison (only available in local build environment)')
check('JavaScript syntax',subprocess.run(['node','--check',str(root/'assets/js/mediaflow-v301.bundle.js')],capture_output=True).returncode==0)
if not all(x for _,x in checks):raise SystemExit(1)
print('PASS',len(checks),'v301 smoke checks')
