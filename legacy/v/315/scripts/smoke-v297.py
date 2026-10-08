from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
bundle=(ROOT/'assets/js/mediaflow-v297.bundle.js').read_text(encoding='utf-8')
css=(ROOT/'assets/css/157-v297-auth-refresh.css').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
checks={
  'v297 meta tag':'content="297"' in index,
  'v297 css loaded':'157-v297-auth-refresh.css' in index,
  'v297 bundle loaded':'mediaflow-v297.bundle.js' in index,
  'auth refresh runtime':'MediaFlow v297 — Auth Experience Refresh & Designed Deletion Confirm' in bundle,
  'password toggle hook':'window.MediaFlowAuth.togglePassword' in bundle,
  'delete modal hook':'window.MediaFlowProfile.performDeleteAccount' in bundle,
  'PWA shell v297':'mediaflow-pwa-v297-shell-v1' in sw and 'const MEDIAFLOW_VERSION=297;' in sw,
  'PWA caches v297 CSS and JS':'./assets/css/157-v297-auth-refresh.css' in sw and './assets/js/mediaflow-v297.bundle.js' in sw,
  'css has auth hero':'.v297-auth-hero' in css,
  'css has modal':'.v297-modal-card' in css,
}
failed=[name for name,ok in checks.items() if not ok]
for name,ok in checks.items():
    print(f"{'PASS' if ok else 'FAIL'} - {name}")
if failed:
    raise SystemExit(1)
