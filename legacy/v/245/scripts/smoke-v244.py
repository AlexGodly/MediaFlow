#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v244 PWA SMOKE FAILED: Playwright unavailable:',e);sys.exit(1)
ROOT=Path(__file__).resolve().parents[1]
VERSION=int((ROOT/'VERSION').read_text(encoding='utf-8').strip())
BUNDLE=ROOT/f'assets/js/mediaflow-v{VERSION}.bundle.js'
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
fails=[]
manifest=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
index=(ROOT/'index.html').read_text(encoding='utf-8')
result={'manifest':{},'serviceWorker':{},'runtime':{}}
# Structural PWA validation (GitHub Pages-safe relative paths).
result['manifest']={'display':manifest.get('display'),'start_url':manifest.get('start_url'),'scope':manifest.get('scope'),'icons':manifest.get('icons')}
if manifest.get('display')!='standalone':fails.append('manifest display is not standalone')
if manifest.get('start_url')!='./' or manifest.get('scope')!='./':fails.append('manifest start_url/scope are not GitHub Pages relative')
for rel in ['assets/icons/mediaflow-192.png','assets/icons/mediaflow-512.png','assets/icons/mediaflow-maskable-512.png','assets/icons/apple-touch-icon.png']:
    if not (ROOT/rel).exists():fails.append('missing icon '+rel)
if f'mediaflow-pwa-v{VERSION}-shell-v1' not in sw:fails.append(f'v{VERSION} cache name missing')
if "request.mode==='navigate'" not in sw or "networkFirst(request,'./index.html')" not in sw:fails.append('network-first navigation/offline fallback missing')
if "event.data?.type==='SKIP_WAITING'" not in sw:fails.append('controlled service-worker update message missing')
if f'./assets/js/mediaflow-v{VERSION}.bundle.js' not in sw:fails.append(f'v{VERSION} bundle not precached')
if './assets/css/114-v244-pwa.css' not in sw:fails.append('v244 PWA CSS not precached')
result['serviceWorker']={'cache':f'mediaflow-pwa-v{VERSION}-shell-v1','networkFirstNavigation':"networkFirst(request,'./index.html')" in sw,'controlledUpdate':"SKIP_WAITING" in sw}
if '<link rel="manifest" href="manifest.json">' not in index:fails.append('manifest link missing')
if 'apple-mobile-web-app-capable' not in index:fails.append('Apple PWA metadata missing')

if not chromium:
    fails.append('Chromium unavailable for runtime PWA UI smoke')
else:
    css='\n'.join(p.read_text(encoding='utf-8') for p in sorted((ROOT/'assets/css').glob('*.css')))
    bundle=BUNDLE.read_text(encoding='utf-8')
    setup_js=r'''() => {
      const store={}; const fakeStore={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear:()=>Object.keys(store).forEach(k=>delete store[k]),key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
      Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
      const user={id:'v244-user',email:'v244@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v244'}};
      const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
      const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
      window.supabase={createClient(){return client;}};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
    }'''
    errors=[]
    with sync_playwright() as p:
        b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
        page=b.new_page(viewport={'width':1360,'height':900});page.on('pageerror',lambda exc: errors.append(str(exc)))
        page.set_content('<!doctype html><html><body><div id="app"></div></body></html>');page.add_style_tag(content=css);page.evaluate(setup_js);page.add_script_tag(content=bundle);page.wait_for_timeout(900)
        runtime=page.evaluate('()=>MediaFlowRuntime.version')
        pwa=page.evaluate("()=>({exists:!!window.MediaFlowPWA,register:typeof window.MediaFlowPWA?.register,install:typeof App.v244InstallPwa,check:typeof App.v244CheckPwaUpdate,apply:typeof App.v244ApplyPwaUpdate,settings:App.v244PwaSettingsHtml().includes('Install MediaFlow')})")
        result['runtime']={'version':runtime,'pwa':pwa,'pageErrors':errors}
        b.close()
    if runtime!=VERSION:fails.append(f'runtime {runtime}, expected {VERSION}')
    if not all([pwa.get('exists'),pwa.get('register')=='function',pwa.get('install')=='function',pwa.get('check')=='function',pwa.get('apply')=='function',pwa.get('settings')]):fails.append('PWA runtime/UI API incomplete: '+repr(pwa))
    if errors:fails.extend('pageerror: '+e for e in errors)

print(json.dumps(result,indent=2))
if fails:
    print('v244 PWA SMOKE FAILED');[print('-',x) for x in fails];sys.exit(1)
print(f'v244+ PWA FOUNDATION SMOKE OK on v{VERSION}')
