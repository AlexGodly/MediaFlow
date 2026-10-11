#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v255 SMOKE FAILED: Playwright unavailable:',e);sys.exit(1)
ROOT=Path(__file__).resolve().parents[1]
VERSION=int((ROOT/'VERSION').read_text().strip())
errors=[];result={'version':VERSION}
index=(ROOT/'index.html').read_text(); sw=(ROOT/'sw.js').read_text()
css=(ROOT/'assets/css/122-v255-cover-status-colors.css').read_text()
bundle=(ROOT/f'assets/js/mediaflow-v{VERSION}.bundle.js').read_text()
if VERSION!=255: errors.append('VERSION is not 255')
for token in ['MediaFlow v255 — Cover Overlay Status Color Polish','const V255_RUNTIME_VERSION=255;','MediaFlowRuntime.version=V255_RUNTIME_VERSION;']:
    if token not in bundle: errors.append('bundle missing '+token)
if 'assets/css/122-v255-cover-status-colors.css' not in index: errors.append('v255 stylesheet not wired')
if './assets/css/122-v255-cover-status-colors.css' not in sw: errors.append('v255 CSS missing from PWA shell')
if 'mediaflow-pwa-v255-shell-v1' not in sw: errors.append('PWA cache not v255')
if '.v254-cover-status.v254-status-completed{color:#4da3ff}' not in css: errors.append('Completed cover status is not blue')
if '.v254-cover-status.v254-status-planned{color:#fff}' not in css: errors.append('Plan to Watch cover status is not white')
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium: errors.append('Chromium unavailable')
else:
    all_css='\n'.join(p.read_text() for p in sorted((ROOT/'assets/css').glob('*.css')))
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1000,'height':700})
        page.set_content('<!doctype html><html><body><div id="completed" class="v254-cover-badge v254-cover-status v254-status-completed"></div><div id="planned" class="v254-cover-badge v254-cover-status v254-status-planned"></div></body></html>')
        page.add_style_tag(content=all_css)
        colors=page.evaluate("""()=>({completed:getComputedStyle(document.getElementById('completed')).color,planned:getComputedStyle(document.getElementById('planned')).color})""")
        result['colors']=colors
        if colors['completed']!='rgb(77, 163, 255)': errors.append('Computed Completed color mismatch: '+colors['completed'])
        if colors['planned']!='rgb(255, 255, 255)': errors.append('Computed Plan to Watch color mismatch: '+colors['planned'])
        browser.close()
print(json.dumps(result,indent=2))
if errors:
    print('v255 SMOKE FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('v255 smoke: OK')
