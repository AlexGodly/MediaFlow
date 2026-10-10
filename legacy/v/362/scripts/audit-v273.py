#!/usr/bin/env python3
from pathlib import Path
import json,re,sys,hashlib
ROOT=Path(__file__).resolve().parents[1]
version=int((ROOT/'VERSION').read_text().strip())
vj=json.loads((ROOT/'version.json').read_text())
manifest=json.loads((ROOT/'manifest.json').read_text())
index=(ROOT/'index.html').read_text()
sw=(ROOT/'sw.js').read_text()
runtime=json.loads((ROOT/'src/js/runtime-order.json').read_text())
checks={
 'VERSION':version==273,
 'version_json':all(int(vj.get(k,0))==273 for k in ('appVersion','version','build')),
 'index_meta':bool(re.search(r'<meta name="mediaflow-version" content="273">',index)),
 'index_bundle':'assets/js/mediaflow-v273.bundle.js' in index,
 'index_v273_css':'assets/css/138-v273-drag-responsive-app.css' in index,
 'runtime_module':'components/207-v273-drag-responsive-data-audit.js' in runtime,
 'bundle_exists':(ROOT/'assets/js/mediaflow-v273.bundle.js').exists(),
 'sw_version':'const MEDIAFLOW_VERSION=273;' in sw,
 'sw_cache':"mediaflow-pwa-v273-shell-v1" in sw,
 'manifest_start':manifest.get('start_url')=='./' and manifest.get('scope')=='./',
 'pwa_icons':len(manifest.get('icons') or [])>=3,
}
print(json.dumps({'checks':checks,'bundle_sha256':hashlib.sha256((ROOT/'assets/js/mediaflow-v273.bundle.js').read_bytes()).hexdigest()},indent=2))
if not all(checks.values()):sys.exit(1)
print('AUDIT V273 OK')
