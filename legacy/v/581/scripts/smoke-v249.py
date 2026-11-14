#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys

try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v249 SCOPE CORRECTION SMOKE FAILED: Playwright unavailable:', e)
    sys.exit(1)

ROOT=Path(__file__).resolve().parents[1]
VERSION=int((ROOT/'VERSION').read_text(encoding='utf-8').strip())
errors=[]
bundle=(ROOT/f'assets/js/mediaflow-v{VERSION}.bundle.js').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')

for token in [
    'MediaFlow v249 — PWA / App Update Scope Correction',
    'const V249_RUNTIME_VERSION=249;',
    'function v249PwaSettingsHtml',
    'function v249PwaStatus',
    'MediaFlowRuntime.version=V249_RUNTIME_VERSION;'
]:
    if token not in bundle: errors.append('bundle missing '+token)
if f'mediaflow-pwa-v{VERSION}-shell-v1' not in sw: errors.append('PWA cache did not advance to current version')

chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
result={'version':VERSION}
setup_js=r'''() => {
  const store={};
  const fakeStore={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear:()=>Object.keys(store).forEach(k=>delete store[k]),key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
  Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
  const user={id:'v249-user',email:'v249@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v249'}};
  const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
  const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
  window.supabase={createClient(){return client;}};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
  const fakeWorker={state:'activated',postMessage(){},addEventListener(){},removeEventListener(){}};
  const fakeReg={scope:'https://mediaflow.test/',active:fakeWorker,waiting:null,installing:null,update:async()=>{},addEventListener(){},removeEventListener(){}};
  const swApi={controller:fakeWorker,register:async()=>fakeReg,getRegistration:async()=>fakeReg,ready:Promise.resolve(fakeReg),addEventListener(){},removeEventListener(){}};
  Object.defineProperty(navigator,'serviceWorker',{value:swApi,configurable:true});Object.defineProperty(window,'isSecureContext',{value:true,configurable:true});
  window.fetch=async()=>new Response('<meta name="mediaflow-version" content="250">',{status:200,headers:{'content-type':'text/html'}});
}'''

if not chromium:
    errors.append('Chromium unavailable')
else:
    all_css='\n'.join(p.read_text(encoding='utf-8') for p in sorted((ROOT/'assets/css').glob('*.css')))
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1100,'height':780})
        page.set_content('<!doctype html><html><head><base href="https://mediaflow.test/"><meta name="mediaflow-version" content="249"></head><body><div id="app"></div></body></html>')
        page.evaluate(setup_js);page.add_style_tag(content=all_css);page.add_script_tag(content=bundle);page.wait_for_timeout(180)

        runtime=page.evaluate('()=>MediaFlowRuntime.version')
        result['runtime']=runtime
        if runtime!=VERSION: errors.append(f'runtime version mismatch: {runtime}')

        pwa=page.evaluate('()=>App.v244PwaSettingsHtml()')
        result['pwaHasInstallUpdate']='Install update' in pwa
        for required in ['Install app','Reload app','Check PWA update','PWA Diagnostics']:
            if required not in pwa: errors.append('restored PWA card missing '+required)
        for forbidden in ['Install update','Automatically install MediaFlow updates','v248-update-progress-shell','v248-update-brand']:
            if forbidden in pwa: errors.append('PWA card still contains v248 managed update UI: '+forbidden)

        page.evaluate("()=>App.setView('settings')");page.wait_for_timeout(150)
        settings=page.locator('#view-root').inner_html()
        for required in ['Automatic update checking','Automatically install MediaFlow updates','Install MediaFlow','Install update','Reload app']:
            if required not in settings: errors.append('APP UPDATES lost v248 feature: '+required)
        if settings.count('Install update')!=1: errors.append('Install update should appear only once in Settings after restoring PWA card')

        page.evaluate('async()=>await App.v161CheckForUpdates(false)');page.wait_for_timeout(100);page.evaluate("()=>App.setView('settings')");page.wait_for_timeout(100)
        settings2=page.locator('#view-root').inner_html()
        pwa2=page.evaluate('()=>App.v244PwaSettingsHtml()')
        if 'Install update' not in settings2: errors.append('APP UPDATES does not expose Install update after update detection')
        if 'Install update' in pwa2: errors.append('PWA card gains Install update after update detection')

        browser.close()

print(json.dumps(result,indent=2))
if errors:
    print('v249 SCOPE CORRECTION SMOKE FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('v249 PWA/app-update scope correction smoke: OK')
