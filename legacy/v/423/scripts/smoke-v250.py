#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v250 INTEGRITY SMOKE FAILED: Playwright unavailable:',e);sys.exit(1)

ROOT=Path(__file__).resolve().parents[1]
VERSION=int((ROOT/'VERSION').read_text(encoding='utf-8').strip())
errors=[]
bundle=(ROOT/f'assets/js/mediaflow-v{VERSION}.bundle.js').read_text(encoding='utf-8')
index=(ROOT/'index.html').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
css=(ROOT/'assets/css/118-v250-about-updates-data-integrity.css').read_text(encoding='utf-8') if (ROOT/'assets/css/118-v250-about-updates-data-integrity.css').exists() else ''

for token in [
    'MediaFlow v250 — About Update UI + Persistence Integrity Audit',
    'const V250_RUNTIME_VERSION=250;',
    'function v250AboutUpdateCardHtml',
    'function v250PersistenceAudit',
    'function v250MergeActivityLog',
    'function v250InstallLatestUpdate',
    "Math.round(sessionStoredXP(s)||0)",
    "'session_json'",
    'MediaFlowRuntime.version=V250_RUNTIME_VERSION;'
]:
    if token not in bundle: errors.append('bundle missing '+token)
if 'assets/css/118-v250-about-updates-data-integrity.css' not in index: errors.append('v250 stylesheet not wired')
if './assets/css/118-v250-about-updates-data-integrity.css' not in sw: errors.append('v250 stylesheet not cached by PWA')
if f'mediaflow-pwa-v{VERSION}-shell-v1' not in sw: errors.append('PWA cache did not advance to v250')
for token in ['.v250-about-update-card','.v250-update-summary','.v250-managed-update-panel']:
    if token not in css: errors.append('v250 CSS missing '+token)

chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
result={'version':VERSION}
setup_js=r'''() => {
  const store={};
  const fakeStore={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear:()=>Object.keys(store).forEach(k=>delete store[k]),key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
  Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
  const user={id:'v250-user',email:'v250@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v250'}};
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
        page=browser.new_page(viewport={'width':390,'height':844});page.on('pageerror',lambda exc: page_errors.append(str(exc)))
        page.set_content('<!doctype html><html><head><base href="https://mediaflow.test/"><meta name="mediaflow-version" content="250"></head><body><div id="app"></div></body></html>')
        page.evaluate(setup_js);page.add_style_tag(content=all_css);page.add_script_tag(content=bundle);page.wait_for_timeout(450)
        runtime=page.evaluate('()=>MediaFlowRuntime.version');result['runtime']=runtime
        if runtime!=VERSION: errors.append(f'runtime mismatch {runtime}')

        page.evaluate("()=>App.setView('about')");page.wait_for_timeout(120)
        about=page.locator('#view-root').inner_html()
        for required in ['v250-about-update-card','v250-update-summary','v250-managed-update-panel','Check now','Open latest web app','Reload app']:
            if required not in about: errors.append('About update UI missing '+required)
        if 'v248-update-brand' in about: errors.append('About page still contains old bulky v248 update brand card')
        overflow=page.evaluate('()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth')
        result['aboutOverflow390']=overflow
        if overflow>4: errors.append(f'About v250 overflows at 390px by {overflow}px')

        # Expose state through a temporary renderer, then prove >1000 Library History rows
        # survive the final cloud snapshot audit.
        page.evaluate(r'''() => {MediaFlowRuntime.registerPageRenderer('__v250_probe__',({state})=>{window.__v250State=state;return '<div>probe</div>';});App.setView('__v250_probe__');}''')
        page.wait_for_timeout(50)
        page.evaluate(r'''() => {const s=window.__v250State;s.activityLog=[];for(let i=0;i<1205;i++)s.activityLog.push({id:'a'+i,timestamp:1700000000000+i,action:'Edit',detail:'row '+i});s.settings.autoUpdateCheck=true;s.settings.autoInstallUpdates=true;}''')
        audit=page.evaluate('()=>App.v250PersistenceAudit()')
        result['audit']=audit
        if audit.get('cloudSyncVersion')!=201: errors.append('cloud sync version changed unexpectedly')
        if audit.get('backupSchemaVersion')!=29: errors.append('full backup schema changed unexpectedly')
        if audit.get('settingsPresetSchemaVersion')!=1: errors.append('settings preset schema changed unexpectedly')
        if audit.get('personalOrderFormatVersion')!=4: errors.append('Personal Order format changed unexpectedly')
        if audit.get('counts',{}).get('libraryHistory')!=1205: errors.append('final snapshot still caps Library History instead of keeping all 1205 rows')
        prefs=audit.get('updatePreferences',{})
        if not prefs.get('automaticCheck') or not prefs.get('automaticInstall'): errors.append('automatic update preferences are missing from current settings snapshot')

        pwa=page.evaluate('()=>App.v244PwaSettingsHtml()')
        for required in ['Install app','Reload app','Check PWA update','PWA Diagnostics']:
            if required not in pwa: errors.append('v249 PWA separation regressed: '+required)
        if 'Install update' in pwa: errors.append('managed release update leaked back into PWA card')

        # Tight-width About layout should remain clean.
        for w,h in [(320,700),(280,653),(820,1180)]:
            page.set_viewport_size({'width':w,'height':h});page.evaluate("()=>App.setView('about')");page.wait_for_timeout(70)
            ov=page.evaluate('()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth')
            result[f'aboutOverflow{w}']=ov
            if ov>6: errors.append(f'About v250 overflows at {w}px by {ov}px')
        browser.close()
    if page_errors: errors.extend('pageerror: '+x for x in page_errors)

print(json.dumps(result,indent=2))
if errors:
    print('v250 INTEGRITY SMOKE FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('v250 About/persistence integrity smoke: OK')
