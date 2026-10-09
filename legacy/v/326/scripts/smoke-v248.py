#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys

try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v248 UPDATE/SETTINGS SMOKE FAILED: Playwright unavailable:', e)
    sys.exit(1)

ROOT=Path(__file__).resolve().parents[1]
VERSION=int((ROOT/'VERSION').read_text(encoding='utf-8').strip())
errors=[]
if VERSION >= 249:
    print(f'v248 historical smoke: managed-update/PWA-card coupling was intentionally superseded by v{VERSION}; run smoke-v249.py for the current scope contract.')
    sys.exit(0)
index=(ROOT/'index.html').read_text(encoding='utf-8')
bundle=(ROOT/f'assets/js/mediaflow-v{VERSION}.bundle.js').read_text(encoding='utf-8')
css248=(ROOT/'assets/css/117-v248-settings-update-install.css').read_text(encoding='utf-8') if (ROOT/'assets/css/117-v248-settings-update-install.css').exists() else ''
sw=(ROOT/'sw.js').read_text(encoding='utf-8')

if VERSION < 248: errors.append(f'expected VERSION >=248, got {VERSION}')
if 'assets/css/117-v248-settings-update-install.css' not in index: errors.append('v248 stylesheet is not wired')
for token in [
    'function v248InstallLatestUpdate',
    'function v248ReloadApp',
    'function v248ToggleAutoInstallUpdates',
    'function v248EnableSettingsNavDragScroll',
    'v231UpdateSettingsActiveNav=function',
    "paths:['autoUpdateCheck','autoInstallUpdates']",
    "phase:'success'",
    "phase:'error'",
    'MediaFlowRuntime.version=V248_RUNTIME_VERSION;'
]:
    if token not in bundle: errors.append('bundle missing '+token)
for token in [
    '.v248-update-brand',
    '.v248-update-progress-shell',
    '.v221-settings-nav.v248-dragging',
    '@media (min-width:701px) and (max-width:1180px)'
]:
    if token not in css248: errors.append('v248 CSS missing '+token)
if f'mediaflow-pwa-v{VERSION}-shell-v1' not in sw: errors.append('PWA cache did not advance to current version')
if './assets/css/117-v248-settings-update-install.css' not in sw: errors.append('v248 stylesheet is not in app shell')

chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
result={'static':{'version':VERSION,'css':bool(css248),'cache':f'mediaflow-pwa-v{VERSION}-shell-v1' in sw}}

setup_js=r'''() => {
  const store={};
  const fakeStore={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear:()=>Object.keys(store).forEach(k=>delete store[k]),key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
  Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
  const user={id:'v248-user',email:'v248@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v248'}};
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
    page_errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
        context=browser.new_context(viewport={'width':1100,'height':780})
        page=context.new_page();page.on('pageerror',lambda exc: page_errors.append(str(exc)))
        page.set_content('<!doctype html><html><head><base href="https://mediaflow.test/"><meta name="mediaflow-version" content="249"></head><body><div id="app"></div></body></html>')
        page.evaluate(setup_js);page.add_style_tag(content=all_css);page.add_script_tag(content=bundle);page.wait_for_timeout(300)

        api=page.evaluate('()=>({runtime:MediaFlowRuntime.version,install:typeof App.v248InstallLatestUpdate,reload:typeof App.v248ReloadApp,auto:typeof App.v248ToggleAutoInstallUpdates,drag:typeof App.v248EnableSettingsNavDragScroll})')
        result['api']=api
        if api != {'runtime':VERSION,'install':'function','reload':'function','auto':'function','drag':'function'}: errors.append('v248 API incomplete: '+repr(api))

        # Persistent auto-install preference can be toggled without requiring an update.
        page.evaluate('()=>App.v248ToggleAutoInstallUpdates()')
        page.evaluate('()=>App.v248ToggleAutoInstallUpdates()')

        # Hold the hosted check open so the About Check now icon visibly enters checking.
        page.evaluate(r'''()=>{
          window.__resolve248=null;
          window.fetch=()=>new Promise(resolve=>{window.__resolve248=()=>resolve(new Response('<meta name="mediaflow-version" content="249">',{status:200,headers:{'content-type':'text/html'}}));});
          window.__check248=App.v161CheckForUpdates(false);App.setView('about');
        }''')
        page.wait_for_timeout(80)
        checking=page.locator('#view-root').inner_html()
        if 'is-checking' not in checking: errors.append('About Check now icon does not enter checking state')

        page.evaluate('()=>window.__resolve248?.()');page.evaluate('()=>window.__check248');page.wait_for_timeout(100)
        page.evaluate("()=>App.setView('about')");about=page.locator('#view-root').inner_html()
        page.evaluate("()=>App.setView('settings')");page.wait_for_timeout(120);settings=page.locator('#view-root').inner_html()
        pwa=page.evaluate('()=>App.v244PwaSettingsHtml()')
        for surface,html in [('about',about),('settings',settings)]:
            if 'Install update' not in html: errors.append(surface+' missing Install update')
            if 'Reload app' not in html: errors.append(surface+' missing Reload app')
        if VERSION < 249:
            if 'Install update' not in pwa: errors.append('pwa missing Install update')
            if 'Reload app' not in pwa: errors.append('pwa missing Reload app')
        else:
            if 'Install update' in pwa: errors.append('v249+ PWA card should not contain managed Install update')
            for required in ['Install app','Reload app','Check PWA update','PWA Diagnostics']:
                if required not in pwa: errors.append('v249+ PWA card missing '+required)
        if 'Ready to install' not in settings or 'Install MediaFlow' not in settings: errors.append('Settings MediaFlow ready-to-install brand missing')
        if 'Automatically install MediaFlow updates' not in settings: errors.append('automatic update install toggle missing')

        # Active Settings nav: at document bottom, final APP UPDATES must win rather
        # than leaving the previous section highlighted.
        page.evaluate('()=>window.scrollTo(0,document.documentElement.scrollHeight)');page.wait_for_timeout(180)
        active_text=page.locator('.v221-settings-nav-item.v231-active').inner_text() if page.locator('.v221-settings-nav-item.v231-active').count() else ''
        result['activeSettings']=active_text
        if 'APP UPDATES' not in active_text.upper(): errors.append('APP UPDATES is not highlighted at the bottom of Settings: '+repr(active_text))

        # Local/about test context cannot self-replace; confirm the managed flow
        # ends in an explicit failure UI instead of silently doing nothing.
        ok=page.evaluate('async()=>await App.v248InstallLatestUpdate(false)')
        page.wait_for_timeout(40);page.evaluate("()=>App.setView('about')");failure=page.locator('#view-root').inner_html()
        result['localInstallResult']=ok
        if ok is not False: errors.append('local unsupported install should report false')
        if '100%' not in failure or 'cannot replace itself' not in failure.lower(): errors.append('explicit update failure/progress feedback missing')

        # Horizontal Settings navigator at a narrow desktop viewport + runtime binding.
        nav_result=page.evaluate(r'''()=>{
          document.body.innerHTML='<div class="v221-settings-page"><div class="v221-settings-layout"><aside id="v221-settings-nav" class="v221-settings-nav">'+Array.from({length:22},(_,i)=>`<button class="v221-settings-nav-item">Section ${i}</button>`).join('')+'</aside><main class="v221-settings-content"></main></div></div>';
          App.v248EnableSettingsNavDragScroll();const nav=document.getElementById('v221-settings-nav');return {bound:nav.dataset.v248DragScroll,overflow:getComputedStyle(nav).overflowX,display:getComputedStyle(nav).display,scrollWidth:nav.scrollWidth,clientWidth:nav.clientWidth};
        }''')
        result['settingsNav']=nav_result
        if nav_result.get('bound')!='1' or nav_result.get('overflow') not in ('auto','scroll'): errors.append('desktop horizontal Settings drag-scroll not active: '+repr(nav_result))

        # Separate page: prior successful update result must render the success
        # progress/message after the updated build reloads.
        success_page=context.new_page();success_page.set_content('<!doctype html><html><head><base href="https://mediaflow.test/"><meta name="mediaflow-version" content="249"></head><body><div id="app"></div></body></html>');success_page.evaluate(setup_js)
        success_page.evaluate("()=>sessionStorage.setItem('mediaflow-v248-update-result',JSON.stringify({target:249,status:'pending',message:'test',at:Date.now()}))")
        success_page.add_style_tag(content=all_css);success_page.add_script_tag(content=bundle);success_page.wait_for_timeout(120);success_page.evaluate("()=>App.setView('about')")
        success_html=success_page.locator('#view-root').inner_html();success_page.close()
        if '100%' not in success_html or 'Updated successfully to MediaFlow v249' not in success_html: errors.append('post-reload update success feedback missing')

        result['pageErrors']=page_errors
        browser.close()
    if page_errors: errors.extend('pageerror: '+x for x in page_errors)

print(json.dumps(result,indent=2))
if errors:
    print('v248 UPDATE/SETTINGS SMOKE FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('v248 Settings/update installer smoke: OK')
