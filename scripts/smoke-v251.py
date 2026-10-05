#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v251 LIBRARY DISPLAY SMOKE FAILED: Playwright unavailable:',e);sys.exit(1)

ROOT=Path(__file__).resolve().parents[1]
VERSION=int((ROOT/'VERSION').read_text(encoding='utf-8').strip())
errors=[]
bundle=(ROOT/f'assets/js/mediaflow-v{VERSION}.bundle.js').read_text(encoding='utf-8')
index=(ROOT/'index.html').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')

for token in [
    'MediaFlow v251 — Covers+Titles Display Label + Semantic Icon',
    'const V251_RUNTIME_VERSION=251;',
    "if(t==='covers+titles'||t==='covers + titles'||t==='covers titles')return 'coversTitles';",
    'data-v225-icon="coversTitles"',
    'MediaFlowRuntime.version=V251_RUNTIME_VERSION;'
]:
    if token not in bundle: errors.append('bundle missing '+token)
if f'assets/js/mediaflow-v{VERSION}.bundle.js' not in index: errors.append('index does not load v251 bundle')
if f'mediaflow-pwa-v{VERSION}-shell-v1' not in sw: errors.append('PWA cache did not advance to v251')
if f'./assets/js/mediaflow-v{VERSION}.bundle.js' not in sw: errors.append('PWA shell does not cache v251 bundle')

chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
result={'version':VERSION}
if not chromium:
    errors.append('Chromium unavailable')
else:
    all_css='\n'.join(p.read_text(encoding='utf-8') for p in sorted((ROOT/'assets/css').glob('*.css')))
    page_errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':390,'height':844});page.on('pageerror',lambda exc: page_errors.append(str(exc)))
        page.set_content('<!doctype html><html><head><base href="https://mediaflow.test/"><meta name="mediaflow-version" content="251"></head><body><div id="app"></div></body></html>')
        page.evaluate(r'''() => {
          const store={};
          const fakeStore={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear:()=>Object.keys(store).forEach(k=>delete store[k]),key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
          Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
          const user={id:'v251-user',email:'v251@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v251'}};
          const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
          const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
          window.supabase={createClient(){return client;}};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
          const fakeWorker={state:'activated',postMessage(){},addEventListener(){},removeEventListener(){}};
          const fakeReg={scope:'https://mediaflow.test/',active:fakeWorker,waiting:null,installing:null,update:async()=>{},addEventListener(){},removeEventListener(){}};
          const swApi={controller:fakeWorker,register:async()=>fakeReg,getRegistration:async()=>fakeReg,ready:Promise.resolve(fakeReg),addEventListener(){},removeEventListener(){}};
          Object.defineProperty(navigator,'serviceWorker',{value:swApi,configurable:true});Object.defineProperty(window,'isSecureContext',{value:true,configurable:true});
          window.fetch=async()=>new Response('<meta name="mediaflow-version" content="251">',{status:200,headers:{'content-type':'text/html'}});
        }''')
        page.add_style_tag(content=all_css)
        page.add_script_tag(content=bundle)
        page.wait_for_timeout(450)
        runtime=page.evaluate('()=>MediaFlowRuntime.version');result['runtime']=runtime
        if runtime!=251: errors.append(f'runtime mismatch {runtime}')

        # Normal Library: render the real shared display switch and inspect the actual button.
        page.evaluate("()=>App.setView('library')");page.wait_for_timeout(140)
        normal_btn=page.locator('button',has_text='Covers+Titles').first
        result['normalLabelCount']=normal_btn.count()
        if normal_btn.count()!=1: errors.append('Normal Library is missing Covers+Titles display mode')
        else:
            if normal_btn.get_attribute('data-v225-icon')!='coversTitles': errors.append('Normal Library Covers+Titles is missing semantic icon binding')
            if normal_btn.locator('.v225-btn-icon svg').count()!=1: errors.append('Normal Library Covers+Titles icon did not render')
            else:
                svg=normal_btn.locator('.v225-btn-icon svg').inner_html();result['normalIconSvg']=svg
                if '<rect x="3" y="3" width="8" height="10"' not in svg or '<rect x="13" y="3" width="8" height="10"' not in svg:
                    errors.append('Normal Library did not receive the new semantic two-cover icon')
        if page.get_by_text('Cover+Titles',exact=True).count(): errors.append('old Cover+Titles label remains in Normal Library')

        # Dynamic Library uses the same shared switch; prove the label/icon survive the mode change.
        page.evaluate("()=>App.v181SetLibraryMode('dynamic')");page.wait_for_timeout(160)
        dynamic_btn=page.locator('button',has_text='Covers+Titles').first
        result['dynamicLabelCount']=dynamic_btn.count()
        if dynamic_btn.count()!=1: errors.append('Dynamic Library is missing Covers+Titles display mode')
        else:
            if dynamic_btn.get_attribute('data-v225-icon')!='coversTitles': errors.append('Dynamic Library Covers+Titles is missing semantic icon binding')
            if dynamic_btn.locator('.v225-btn-icon svg').count()!=1: errors.append('Dynamic Library Covers+Titles icon did not render')
        if page.get_by_text('Cover+Titles',exact=True).count(): errors.append('old Cover+Titles label remains in Dynamic Library')
        browser.close()
    if page_errors: errors.extend('pageerror: '+x for x in page_errors)

print(json.dumps(result,indent=2))
if errors:
    print('v251 LIBRARY DISPLAY SMOKE FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('v251 Covers+Titles Library display smoke: OK')
