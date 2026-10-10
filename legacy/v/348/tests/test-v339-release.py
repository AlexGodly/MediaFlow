from pathlib import Path
import json,re,subprocess
root=Path(__file__).resolve().parents[1]
assert root.joinpath('VERSION').read_text().strip()=='339'
assert json.loads(root.joinpath('package.json').read_text())['version']=='339.0.0'
version=json.loads(root.joinpath('version.json').read_text())
assert version['appVersion']==version['version']==version['build']==339
assert version['cloudSyncVersion']==201 and version['fullBackupSchema']==29 and version['settingsPresetSchema']==1
html=root.joinpath('index.html').read_text()
assert 'content="339"' in html
assert 'assets/js/mediaflow-v339.bundle.js' in html
assert 'mediaflow-v338.bundle.js' not in html
assert root.joinpath('assets/js/mediaflow-v339.bundle.js').exists()
assert 'mediaflow-pwa-v339-shell-v1' in root.joinpath('sw.js').read_text()
assert 'MEDIAFLOW_VERSION=339' in root.joinpath('sw.js').read_text()
assert 'mediaflow-v339.bundle.js' in root.joinpath('sw.js').read_text()
manifest=json.loads(root.joinpath('manifest.json').read_text())
assert manifest['start_url']=='./' and manifest['scope']=='./' and manifest['id']=='./'
assets=[]
for href in re.findall(r'<link[^>]+href=["\']([^"\']+)["\'][^>]*>',html,re.I):
    if href.endswith('.css') and not href.startswith(('http://','https://','//')): assets.append(href)
for src in re.findall(r'<script[^>]+src=["\']([^"\']+)["\'][^>]*>',html,re.I):
    if not src.startswith(('http://','https://','//')): assets.append(src)
missing=[a for a in assets if not root.joinpath(a).exists()]
assert not missing,missing
for filename in ['assets/js/mediaflow-v339.bundle.js','src/js/components/236-v339-data-cloud-transfer-update-audit.js']:
    subprocess.run(['node','--check',str(root.joinpath(filename))],check=True)
assert root.joinpath('docs/CHANGELOG_v339.md').is_file()
print(f'PASS v339 release: version/HTML/package/service worker/manifest aligned, {len(assets)} referenced local CSS/JS files exist, scripts parse, changelog exists')
