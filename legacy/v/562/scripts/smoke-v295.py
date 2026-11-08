#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
bundle=(ROOT/'assets/js/mediaflow-v295.bundle.js').read_text(encoding='utf-8')
const=(ROOT/'src/js/core/constants/001-constants.js').read_text(encoding='utf-8')
index=(ROOT/'index.html').read_text(encoding='utf-8')
css=(ROOT/'assets/css/155-v295-responsive-default-categories.css').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
version=json.loads((ROOT/'version.json').read_text(encoding='utf-8'))
expected=[
'Seasonal Anime','Missed Anime','Finished Anime','Anime Movies','Asian Comics','Movies','TV Series',
'Anime Backlog','Anime Movies Backlog','Asian Comics Backlog','TV Series Backlog','Movies Backlog',
'Books','Books Backlog','Novels','Novels Backlog','Magazines','Magazines Backlog',
'Online Media','Online Media Backlog','Comics','Comics Backlog']
# isolate default categories source block and read name order
block=const.split('const DEFAULT_CATEGORIES = [',1)[1].split('\n];',1)[0]
names=re.findall(r"name:'([^']+)'",block)
icons=re.findall(r"iconUrl:'([^']+)'",block)
checks={
 'release metadata v295':version.get('appVersion')==295 and version.get('version')==295 and version.get('build')==295,
 'index loads v295 bundle':'mediaflow-v295.bundle.js' in index,
 'v295 css loaded':'155-v295-responsive-default-categories.css' in index,
 '22 fresh default categories':len(names)==22,
 'default category order exact':names==expected,
 'all defaults use packaged icons':len(icons)==22 and all(x.startswith('assets/category-icons/') and x.endswith('.png') for x in icons),
 'responsive slot repair active':'v276MobileNavSlotCount=function' in bundle and 'if(width<760)return 6;' in bundle and 'return 7;' in bundle,
 'viewport-safe more menu':'.mobile-more-menu' in css and 'position:fixed!important' in css and 'grid-template-columns:repeat(3' in css,
 'cloud category verification':'Category definitions' in bundle and 'cloudCategoryDefinitionsProtected' in bundle,
 'full backup v295 audit':'fullDataExportImportAuditV295' in bundle and 'automaticBackupAuditV295' in bundle,
 'settings preset v295 audit':'v295DefaultCategoryDefinitions' in bundle,
 'personal order current release stamp':'payload.mediaFlowVersion=V295_RUNTIME_VERSION' in bundle,
 'collections current release stamp':'payload.appVersion=V295_RUNTIME_VERSION' in bundle and 'payload.mediaFlowVersion=V295_RUNTIME_VERSION' in bundle,
 'history current version stamp':"'mediaflow_version'" in bundle and 'v161CurrentVersion()' in bundle,
 'pwa shell v295':'mediaflow-pwa-v295-shell-v1' in sw,
 'pwa caches category artwork':'./assets/category-icons/seasonal-anime.png' in sw and './assets/category-icons/comics-backlog.png' in sw,
 'v295 runtime final':'MediaFlowRuntime.version=V295_RUNTIME_VERSION;' in bundle,
}
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items():print(('OK  ' if v else 'FAIL'),k)
if failed:
 print('FAILED:',', '.join(failed));sys.exit(1)
print('v295 smoke: OK')
