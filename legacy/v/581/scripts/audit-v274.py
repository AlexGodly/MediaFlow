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
source=(ROOT/'src/js/components/208-v274-collections-library-rating-order-layout.js').read_text()
css=(ROOT/'assets/css/139-v274-collections-library-order.css').read_text()
checks={
 'VERSION':version==274,
 'version_json':all(int(vj.get(k,0))==274 for k in ('appVersion','version','build')),
 'index_meta':bool(re.search(r'<meta name="mediaflow-version" content="274">',index)),
 'index_bundle':'assets/js/mediaflow-v274.bundle.js' in index,
 'index_v274_css':'assets/css/139-v274-collections-library-order.css' in index,
 'runtime_module':'components/208-v274-collections-library-rating-order-layout.js' in runtime,
 'bundle_exists':(ROOT/'assets/js/mediaflow-v274.bundle.js').exists(),
 'sw_version':'const MEDIAFLOW_VERSION=274;' in sw,
 'sw_cache':'mediaflow-pwa-v274-shell-v1' in sw,
 'sw_bundle':'./assets/js/mediaflow-v274.bundle.js' in sw,
 'sw_v274_css':'./assets/css/139-v274-collections-library-order.css' in sw,
 'manifest_start':manifest.get('start_url')=='./' and manifest.get('scope')=='./',
 'pwa_icons':len(manifest.get('icons') or [])>=3,
 'collections_nav':"id:'collections'" in source and "label:'Collections'" in source,
 'collections_persistence':'out.collections=' in source and 'out.collectionTombstones=' in source and 'loadAll=async function()' in source,
 'collections_merge':'out.collections=' in source and 'collectionTombstones' in source,
 'collection_crud':all(x in source for x in ['v274CreateCollection','v274EditCollection','v274SaveCollection','v274DeleteCollection']),
 'collection_modes':all(x in source for x in ["['covers','Covers']","['compact','Compact']","['list','List']","['cards','Cards']","['showcase','Showcase']"]),
 'collection_tools':all(x in source for x in ['COLLECTION TOOLS','Running time (min)','Season count','Episode count','Moderator filters','All ratings','All covers']),
 'order_view':'Order view' in source and 'v274OrderDrop' in source,
 'add_titles':'Add titles' in source and 'v274AddCandidates' in source and 'v274AddDeselectAll' in source,
 'library_rating':'mf274-library-rating-filter' in source and 'v274FilterByRating' in source,
 'personal_order_layout':'orderPanelWidth' in source and 'orderCategoryWidth' in source and 'v274-order-deselect' in source,
 'responsive_css':all(x in css for x in ['@media(max-width:1180px)','@media(max-width:980px)','@media(max-width:720px)','@media(max-width:420px)']),
}
bundle_path=ROOT/'assets/js/mediaflow-v274.bundle.js'
print(json.dumps({'checks':checks,'bundle_sha256':hashlib.sha256(bundle_path.read_bytes()).hexdigest()},indent=2))
if not all(checks.values()):sys.exit(1)
print('AUDIT V274 OK')
