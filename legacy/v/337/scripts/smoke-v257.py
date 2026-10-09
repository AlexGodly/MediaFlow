#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys
from PIL import Image
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v257 SMOKE FAILED: Playwright unavailable:',e);sys.exit(1)
ROOT=Path(__file__).resolve().parents[1]
VERSION=int((ROOT/'VERSION').read_text().strip())
errors=[];result={'version':VERSION}
if VERSION!=257: errors.append('VERSION is not 257')
bundle=(ROOT/'assets/js/mediaflow-v257.bundle.js').read_text()
index=(ROOT/'index.html').read_text();css=(ROOT/'assets/css/124-v257-dashboard-cloud-settings-mobile-pwa-update-backup.css').read_text();sw=(ROOT/'sw.js').read_text();manifest=json.loads((ROOT/'manifest.json').read_text())
for token in ['MediaFlow v257 — Dashboard Tool Cloud Sync + Settings Nav + Mobile PWA','const V257_RUNTIME_VERSION=257;','dashboardToolsV257','v257BackupBeforeUpdateOptionHtml','v257BuildCleanSettingsNav','v257PwaInstallHelp','MediaFlowRuntime.version=V257_RUNTIME_VERSION;']:
    if token not in bundle: errors.append('bundle missing '+token)
if 'assets/css/124-v257-dashboard-cloud-settings-mobile-pwa-update-backup.css' not in index: errors.append('v257 CSS not wired')
if 'mediaflow-pwa-v257-shell-v1' not in sw: errors.append('PWA cache not v257')
for token in ['.v257-settings-nav-horizontal','.v257-update-backup-option','.v257-pwa-platform-hint']:
    if token not in css: errors.append('CSS missing '+token)
# mobile install manifest / opaque icons
if manifest.get('display')!='standalone' or manifest.get('start_url')!='./' or manifest.get('scope')!='./': errors.append('manifest core install fields changed incorrectly')
icons=manifest.get('icons',[])
for size,name in [(192,'mediaflow-install-192.png'),(512,'mediaflow-install-512.png')]:
    row=next((x for x in icons if x.get('sizes')==f'{size}x{size}' and x.get('purpose')=='any'),None)
    if not row or name not in row.get('src',''): errors.append(f'install-safe {size} icon missing from manifest')
    p=ROOT/'assets/icons'/name
    if not p.exists(): errors.append(f'{name} missing')
    else:
        im=Image.open(p)
        if im.size!=(size,size): errors.append(f'{name} wrong dimensions')
        if 'A' in im.mode and im.getchannel('A').getextrema()!=(255,255): errors.append(f'{name} is not opaque')

chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium: errors.append('Chromium unavailable')
else:
    all_css='\n'.join(p.read_text() for p in sorted((ROOT/'assets/css').glob('*.css')))
    page_errors=[]
    setup_js=r'''() => {
      const store={};const fakeStore={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear:()=>Object.keys(store).forEach(k=>delete store[k]),key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
      Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
      const user={id:'v257-user',email:'v257@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v257'}};const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
      const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};window.supabase={createClient(){return client;}};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
      const fakeWorker={state:'activated',postMessage(){},addEventListener(){},removeEventListener(){}};const fakeReg={scope:'https://mediaflow.test/',active:fakeWorker,waiting:null,installing:null,update:async()=>{},addEventListener(){},removeEventListener(){}};Object.defineProperty(navigator,'serviceWorker',{value:{controller:fakeWorker,register:async()=>fakeReg,getRegistration:async()=>fakeReg,ready:Promise.resolve(fakeReg),addEventListener(){},removeEventListener(){}},configurable:true});Object.defineProperty(window,'isSecureContext',{value:true,configurable:true});window.fetch=async()=>new Response('<meta name="mediaflow-version" content="257">',{status:200,headers:{'content-type':'text/html'}});
    }'''
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':820,'height':900});page.on('pageerror',lambda exc: page_errors.append(str(exc)))
        page.set_content('<!doctype html><html><head><base href="https://mediaflow.test/"><meta name="mediaflow-version" content="257"></head><body><div id="app"></div></body></html>')
        page.evaluate(setup_js);page.add_style_tag(content=all_css);page.add_script_tag(content=bundle);page.wait_for_timeout(800)
        result['runtime']=page.evaluate('()=>MediaFlowRuntime.version')
        if result['runtime']!=257: errors.append('runtime mismatch')
        page.evaluate("()=>{MediaFlowRuntime.registerPageRenderer('__v257_probe__',({state})=>{window.__v257State=state;return '<div>probe</div>';});App.setView('__v257_probe__');}")
        page.wait_for_timeout(60)
        # dashboard icons and non-rotation
        page.evaluate("()=>{const s=window.__v257State;s.settings.v192Dashboard.showStopwatch=true;s.settings.v192Dashboard.showRuntimeCalculator=true;App.setView('dashboard');}");page.wait_for_timeout(140)
        sw=page.locator('.stopwatch-card .v256-accordion-toggle');rt=page.locator('.v256-runtime-card .v256-accordion-toggle')
        if sw.count()!=1 or rt.count()!=1: errors.append('dashboard accordion buttons missing')
        rt_svg=rt.locator('svg').inner_html() if rt.count() else ''; result['runtimeIconSvg']=rt_svg
        if '<circle' not in rt_svg or 'M12 7v5l3 2' not in rt_svg: errors.append('runtime calculator icon is not clock')
        before=page.evaluate("()=>getComputedStyle(document.querySelector('.v256-runtime-card .v256-accordion-toggle .v225-btn-icon')).transform")
        rt.click();page.wait_for_timeout(80)
        after=page.evaluate("()=>getComputedStyle(document.querySelector('.v256-runtime-card .v256-accordion-toggle .v225-btn-icon')).transform")
        result['iconTransforms']=[before,after]
        if before!='none' or after!='none': errors.append('runtime accordion icon rotates')
        sw_before=page.evaluate("()=>getComputedStyle(document.querySelector('.stopwatch-card .v256-accordion-toggle .v225-btn-icon')).transform")
        sw.click();page.wait_for_timeout(80)
        sw_after=page.evaluate("()=>getComputedStyle(document.querySelector('.stopwatch-card .v256-accordion-toggle .v225-btn-icon')).transform")
        if sw_before!='none' or sw_after!='none': errors.append('stopwatch accordion icon rotates')
        # cloud snapshot includes both tools
        page.evaluate("()=>{window.__v257State.stopwatch={running:false,startedAt:0,elapsed:123000,resetValue:120000,modifiedAt:111};window.__v257State.v256RuntimeCalculator={mode:'chain',chain:[{h:1,m:0,s:0},{h:0,m:2,s:0}],rows:[{h:1,m:0,s:0},{h:0,m:2,s:0}],resultSeconds:3720,hasResult:true,resultCount:2,carryCount:0,previousAccumulatorSeconds:3600,previousAccumulatorCount:1};window.__v257State.v257RuntimeCalculatorModifiedAt=222;}")
        cloud=page.evaluate('()=>App.v257DashboardToolsState()');result['cloudTools']=cloud
        if cloud['stopwatch']['elapsed']!=123000 or cloud['runtimeCalculator']['resultSeconds']!=3720: errors.append('dashboard tools missing from cloud snapshot')
        # settings horizontal click + active state + hidden scrollbar class
        page.evaluate("()=>App.setView('settings')");page.wait_for_timeout(180)
        nav=page.locator('#v221-settings-nav')
        if nav.count()!=1: errors.append('settings nav missing')
        else:
            if not nav.evaluate("el=>el.classList.contains('v257-settings-nav-horizontal')"): errors.append('settings nav not marked horizontal at 820px')
            app_updates=page.locator('.v221-settings-nav-item',has_text='App Updates')
            if app_updates.count()!=1: errors.append('App Updates nav item missing')
            else:
                app_updates.click();page.wait_for_timeout(180)
                if not app_updates.evaluate("el=>el.classList.contains('v231-active')"): errors.append('clicked Settings section not highlighted')
                target=app_updates.get_attribute('data-settings-target')
                if not target or not page.locator('#'+target).count(): errors.append('clicked Settings target missing')
        # pre-update backup UI persists and produces a complete backup download
        page.evaluate("()=>App.v257SetBackupBeforeUpdate(true)")
        page.wait_for_timeout(80)
        if page.locator('.v257-update-backup-option input:checked').count()<1: errors.append('pre-update backup checkbox not synced')
        try:
            with page.expect_download(timeout=5000) as dl_info:
                page.evaluate("async()=>await App.v257ExportPreUpdateBackup(258)")
            dl=dl_info.value
            result['preUpdateDownload']=dl.suggested_filename
            if 'MediaFlow_PreUpdate_Backup_v257_to_v258_' not in dl.suggested_filename: errors.append('pre-update backup filename incorrect')
        except Exception as e:
            errors.append('pre-update full backup was not exported: '+str(e))
        # responsive no overflow
        for w,h in [(820,900),(390,844),(320,700),(280,653)]:
            page.set_viewport_size({'width':w,'height':h});page.evaluate("()=>App.setView('settings')");page.wait_for_timeout(120)
            ov=page.evaluate('()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth')
            result[f'settingsOverflow{w}']=ov
            if ov>8: errors.append(f'settings overflow at {w}: {ov}')
            nav=page.locator('#v221-settings-nav')
            if nav.count()==1:
                result[f'navV257At{w}']=nav.get_attribute('data-v257-nav'); result[f'navDisplayAt{w}']=nav.evaluate("el=>getComputedStyle(el).display"); result[f'navOverflowAt{w}']=nav.evaluate("el=>getComputedStyle(el).overflowX");
            if nav.count()==1 and page.evaluate("()=>getComputedStyle(document.getElementById('v221-settings-nav')).display==='flex'"):
                btn=page.locator('.v221-settings-nav-item',has_text='App Updates')
                if btn.count()==1:
                    btn.dispatch_event('click');page.wait_for_timeout(120)
                    active=page.locator('.v221-settings-nav-item.v231-active'); result[f'activeAt{w}']=active.get_attribute('data-settings-target') if active.count() else None; result[f'appTargetAt{w}']=btn.get_attribute('data-settings-target');
                    if not btn.evaluate("el=>el.classList.contains('v231-active')"): errors.append(f'horizontal Settings click/highlight failed at {w}px')
        browser.close()
    if page_errors: errors.extend('pageerror: '+x for x in page_errors)
print(json.dumps(result,indent=2))
if errors:
    print('v257 SMOKE FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('v257 smoke: OK')
