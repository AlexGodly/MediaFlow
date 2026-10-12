#!/usr/bin/env python3
from pathlib import Path
import json,sys,re
ROOT=Path(__file__).resolve().parents[1]
bundle=(ROOT/'assets/js/mediaflow-v296.bundle.js').read_text(encoding='utf-8')
index=(ROOT/'index.html').read_text(encoding='utf-8')
css=(ROOT/'assets/css/156-v296-category-recovery-responsive-more.css').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
version=json.loads((ROOT/'version.json').read_text(encoding='utf-8'))
runtime=json.loads((ROOT/'src/js/runtime-order.json').read_text(encoding='utf-8'))
checks={
  'v296 runtime module present':'const V296_RUNTIME_VERSION=296;' in bundle and 'window.MediaFlowV296' in bundle,
  'confirmation popup for missing defaults':'Restore missing default categories?' in bundle and "App.v171RestoreDefaultCategories=function(){return v296OpenCategoryRecoveryConfirm('missing');};" in bundle,
  'confirmation popup for last deleted':'Restore the last deleted category?' in bundle and "App.v171RestoreLastDeletedCategory=function(){return v296OpenCategoryRecoveryConfirm('last');};" in bundle,
  'theme aware recovery css':'.v296-recovery-shell' in css and 'var(--flow)' in css and 'var(--panel-raised)' in css,
  'responsive More redesign':'v296MoreMenuHtml' in bundle and '.v296-more-menu' in css and '.v296-more-grid' in css,
  'data protection subtitle cleaned':'Cloud data protection' in bundle and 'v115 data protection' not in bundle,
  'retry cloud action has semantic icon':'v296SafetyActionIcon' in bundle and "kind==='retry'" in bundle and 'Retry cloud connection' in bundle,
  'empty workspace action has semantic icon':"kind==='empty'" in bundle and 'I intentionally want an empty workspace' in bundle,
  'v296 css loaded':'156-v296-category-recovery-responsive-more.css' in index,
  'v296 bundle loaded':'mediaflow-v296.bundle.js' in index,
  'runtime order includes v296':runtime[-1]=='components/227-v296-category-recovery-confirm-responsive-data-audit.js',
  'release metadata v296':version.get('appVersion')==296 and version.get('version')==296 and version.get('build')==296,
  'cloud/category recovery audited':'categoryRecoveryCloudVerified' in bundle and 'categoryRecoveryInSnapshot' in bundle,
  'portable exports stamped':'personalOrderRelease' in bundle and 'collectionsExportRelease' in bundle and 'presetManifest.v296' in bundle,
  'full backup v296 audit':'backupManifest.v296' in bundle and 'automaticBackupAuditV296' in bundle and 'fullDataExportImportAuditV296' in bundle,
  'PWA shell v296':'mediaflow-pwa-v296-shell-v1' in sw and 'const MEDIAFLOW_VERSION=296;' in sw,
  'PWA caches v296 CSS and JS':'./assets/css/156-v296-category-recovery-responsive-more.css' in sw and './assets/js/mediaflow-v296.bundle.js' in sw,
  'schemas intentionally unchanged':version.get('cloudSyncVersion')==201 and version.get('fullBackupSchema')==29 and version.get('settingsPresetSchema')==1,
  'Personal Order export remains v5':'V287_ORDER_FORMAT_VERSION=5' in bundle,
  'Collections export remains v2':'MEDIAFLOW_COLLECTIONS_EXPORT_VERSION=2' in bundle or 'mediaflowCollectionsExportVersion' in bundle,
}
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items():print(('OK  ' if v else 'FAIL'),k)
if failed:
  print('FAILED:',', '.join(failed));sys.exit(1)
print('v296 smoke: OK')
