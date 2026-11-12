#!/usr/bin/env python3
from pathlib import Path
import base64, shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v235 SMOKE FAILED: Playwright unavailable:', e); sys.exit(1)
ROOT=Path(__file__).resolve().parents[1]
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('v235 SMOKE FAILED: Chromium unavailable'); sys.exit(1)
PNG=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=')
module=(ROOT/'src/js/components/169-v235-missing-cover-live-validation.js').read_text(encoding='utf-8')
css=(ROOT/'assets/css/105-v235-missing-cover-live-validation.css').read_text(encoding='utf-8')
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':900,'height':650})
    errors=[]
    page.on('pageerror',lambda exc: errors.append(str(exc)))
    page.route('https://assets.test/cover.png',lambda route: route.fulfill(status=200,body=PNG,content_type='image/png'))
    page.route('https://assets.test/not-image',lambda route: route.fulfill(status=200,body='<html>not an image</html>',content_type='text/html'))
    page.set_content('<!doctype html><html><body></body></html>')
    page.add_style_tag(content='''
      :root{--panel-raised:#171b24;--text:#eee;--text-mute:#9ca3af;--text-dim:#c4c8d0;--border:#394150;--flow:#7c5cff;--flow-dim:#6650c7;--success:#45c486;--danger:#ff6b73}
      body{background:#111;color:#eee}.v192-cover-placeholder{width:104px;height:148px;display:grid;place-items:center;border:1px solid #333}.field{width:500px}.btn{padding:10px}
    '''+css)
    page.evaluate("""() => {
      window.App={}; window.MediaFlowRuntime={version:234};
      window.__item={id:'one',title:'Example Anime',coverUrl:''}; window.__saved=false; window.__toast='';
      window.cleanTitle=x=>String(x||'').trim();
      window.escapeHtml=x=>String(x??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
      window.showToast=x=>{window.__toast=String(x)};
      window.v192CurrentMissingCoverItem=()=>window.__item;
      window.v192MissingCoversHtml=()=>`<div class="card v192-missing-covers"><button class="v192-cover-placeholder" title="Open title details"><span class="fallback">🎬</span></button><div class="v192-cover-control"><div class="field v192-cover-url-field"><label>COVER URL</label><input id="v192-cover-url-input" type="url"></div><div class="v192-cover-actions"><button class="btn">Edit title</button><button class="btn">Skip</button><button class="btn">Save cover & Next</button></div></div></div>`;
      window.v192SaveMissingCover=function(){window.__item.coverUrl=document.getElementById('v192-cover-url-input').value.trim();window.__saved=true;};
      App.v192SaveMissingCover=window.v192SaveMissingCover;
    }""")
    page.add_script_tag(content=module)
    page.evaluate("document.body.innerHTML=v192MissingCoversHtml()")
    fail=[]
    initial=page.evaluate("""() => ({disabled:document.getElementById('v235-save-cover-btn')?.disabled,notice:document.getElementById('v235-cover-url-notice')?.textContent||'',version:MediaFlowRuntime.version})""")
    if initial['version']!=235: fail.append('runtime version not 235')
    if initial['disabled'] is not True: fail.append('Save button does not start disabled')
    if 'direct image url' not in initial['notice'].lower(): fail.append('initial helper notice missing')

    page.fill('#v192-cover-url-input','https://assets.test/not-image')
    page.wait_for_timeout(700)
    invalid=page.evaluate("""() => ({disabled:document.getElementById('v235-save-cover-btn').disabled,notice:document.getElementById('v235-cover-url-notice').textContent,preview:!!document.querySelector('.v235-live-cover-preview'),saved:window.__saved,cover:window.__item.coverUrl})""")
    if invalid['disabled'] is not True: fail.append('non-image URL enabled Save')
    if 'direct image' not in invalid['notice'].lower(): fail.append('invalid direct-image warning missing')
    if invalid['preview']: fail.append('invalid URL changed poster preview')
    if invalid['saved'] or invalid['cover']: fail.append('invalid URL mutated/saved title')

    page.fill('#v192-cover-url-input','https://assets.test/cover.png')
    page.wait_for_timeout(700)
    valid=page.evaluate("""() => ({disabled:document.getElementById('v235-save-cover-btn').disabled,notice:document.getElementById('v235-cover-url-notice').textContent,src:document.querySelector('.v235-live-cover-preview')?.src||'',saved:window.__saved,cover:window.__item.coverUrl})""")
    if valid['disabled'] is not False: fail.append('valid image URL did not enable Save')
    if 'valid image url' not in valid['notice'].lower(): fail.append('valid image notice missing')
    if valid['src']!='https://assets.test/cover.png': fail.append('poster did not live-preview valid image')
    if valid['saved'] or valid['cover']: fail.append('live preview persisted title before Save')

    page.click('#v235-save-cover-btn')
    saved=page.evaluate("""() => ({saved:window.__saved,cover:window.__item.coverUrl})""")
    if not saved['saved']: fail.append('Save Cover & Next did not invoke save')
    if saved['cover']!='https://assets.test/cover.png': fail.append('validated URL was not saved on confirmation')
    if errors: fail.extend('pageerror: '+x for x in errors)
    b.close()
if fail:
    print('v235 SMOKE FAILED'); [print('-',x) for x in fail]; sys.exit(1)
print('v235 SMOKE OK')
print('Invalid URL: disabled + unsaved. Valid direct image: live preview + enabled. Persistence occurs only after Save Cover & Next.')
