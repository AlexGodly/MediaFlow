#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v246 SMOKE FAILED: Playwright unavailable:',e);sys.exit(1)
ROOT=Path(__file__).resolve().parents[1]
VERSION=int((ROOT/'VERSION').read_text(encoding='utf-8').strip())
errors=[]
index=(ROOT/'index.html').read_text(encoding='utf-8')
manifest=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
css246=(ROOT/'assets/css/115-v246-pwa-mobile-responsive.css').read_text(encoding='utf-8')
if VERSION!=246: errors.append(f'expected VERSION 246, got {VERSION}')
if '115-v246-pwa-mobile-responsive.css' not in index: errors.append('v246 responsive stylesheet is not wired')
for token in ['@media (max-width:360px)','@media (max-width:310px)','@media (display-mode:standalone)']:
    if token not in css246: errors.append('missing responsive tier '+token)
if manifest.get('start_url')!='./' or manifest.get('scope')!='./': errors.append('PWA lost GitHub Pages-relative start/scope')
if manifest.get('orientation')!='any': errors.append('PWA orientation is not any')
if manifest.get('prefer_related_applications') is not False: errors.append('prefer_related_applications should be false')
if f'mediaflow-pwa-v{VERSION}-shell-v1' not in sw: errors.append('service-worker cache did not advance to v246')
if './assets/css/115-v246-pwa-mobile-responsive.css' not in sw: errors.append('v246 responsive CSS not precached')
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
result={}
if not chromium:
    errors.append('Chromium unavailable')
else:
    css='\n'.join(p.read_text(encoding='utf-8') for p in sorted((ROOT/'assets/css').glob('*.css')))
    bundle=(ROOT/f'assets/js/mediaflow-v{VERSION}.bundle.js').read_text(encoding='utf-8')
    setup_js=r'''() => {
      const store={}; const fakeStore={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear:()=>Object.keys(store).forEach(k=>delete store[k]),key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
      Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
      const user={id:'v246-user',email:'v246@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v246'}};
      const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
      const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
      window.supabase={createClient(){return client;}};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
    }'''
    page_errors=[]
    with sync_playwright() as p:
        b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
        page=b.new_page(viewport={'width':390,'height':844});page.on('pageerror',lambda exc: page_errors.append(str(exc)))
        page.set_content('<!doctype html><html><body><div id="app"></div></body></html>')
        page.add_style_tag(content=css);page.evaluate(setup_js);page.add_script_tag(content=bundle);page.wait_for_timeout(700)
        runtime=page.evaluate('()=>MediaFlowRuntime.version')
        html=page.evaluate('()=>App.v244PwaSettingsHtml()')
        page.evaluate('(h)=>{const d=document.createElement("div");d.id="v246-test-card";d.innerHTML=h;document.body.appendChild(d)}',html)
        card=page.locator('#v246-test-card')
        install_disabled=page.locator('#v244-pwa-install').is_disabled()
        reload_disabled=page.locator('#v244-pwa-update').is_disabled()
        icon_count=page.locator('.v246-pwa-mark img').count()
        page.wait_for_timeout(80)
        install_icon=page.locator('#v244-pwa-install > .v225-btn-icon').count()
        reload_icon=page.locator('#v244-pwa-update > .v225-btn-icon').count()
        check_icon=page.locator('#v246-pwa-check > .v225-btn-icon').count()
        semantic=page.evaluate('()=>[document.getElementById("v244-pwa-install")?.dataset.v226SemanticIcon,document.getElementById("v244-pwa-update")?.dataset.v226SemanticIcon,document.getElementById("v246-pwa-check")?.dataset.v226SemanticIcon]')
        page.locator('#v244-pwa-install').click();page.wait_for_timeout(80)
        help_exists=page.locator('#v246-pwa-help').count()==1
        if help_exists: page.locator('#v246-pwa-help .btn').click()
        native_install=page.evaluate(r'''async()=>{window.__v246Prompted=0;window.MediaFlowPWA.state.installed=false;window.MediaFlowPWA.state.installPrompt={prompt(){window.__v246Prompted++},userChoice:Promise.resolve({outcome:'accepted'})};const ok=await App.v244InstallPwa();return {ok,prompted:window.__v246Prompted,installed:window.MediaFlowPWA.state.installed};}''')
        reload_update=page.evaluate(r'''async()=>{window.__v246SwMessage=null;window.MediaFlowPWA.state.registration={update:async()=>{},waiting:{postMessage:m=>window.__v246SwMessage=m}};window.MediaFlowPWA.state.applyingUpdate=false;const ok=await App.v246ReloadPwa();return {ok,msg:window.__v246SwMessage,applying:window.MediaFlowPWA.state.applyingUpdate};}''')
        widths={}
        for w,h,expected in [(820,1180,'tablet'),(390,844,'mobile'),(320,700,'tight'),(280,653,'tight')]:
            page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(80)
            cls=page.evaluate('()=>document.documentElement.dataset.v246Viewport')
            overflow=page.evaluate('()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-window.innerWidth')
            widths[str(w)]={'class':cls,'overflow':overflow}
            if cls!=expected: errors.append(f'{w}px classified as {cls}, expected {expected}')
            if overflow>2: errors.append(f'{w}px page overflows horizontally by {overflow}px')

        # Exercise primary app surfaces at very tight, phone and tablet widths.
        page.evaluate('()=>document.getElementById("v246-test-card")?.remove()')
        page.evaluate(r'''() => {MediaFlowRuntime.registerPageRenderer('__v246_probe__',({state})=>{window.__v246State=state;return '<div>probe</div>';});App.setView('__v246_probe__');}''')
        page.wait_for_timeout(50)
        page.evaluate(r'''() => {const s=window.__v246State;if(!s)return;const cats=s.categories.slice(0,4);const st=['planned','active','paused','completed','dropped'];s.library=[];for(let i=0;i<180;i++)s.library.push({id:'v246-'+i,title:'Responsive Title '+i,categoryId:cats[i%cats.length].id,status:st[i%st.length],priority:['high','medium','low'][i%3],progress:i%12,total:24,createdAt:Date.now()-i*60000,coverUrl:''});}''')
        surfaces={}
        for w,h in [(820,1180),(390,844),(320,700),(280,653)]:
            page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(60)
            row={}
            for view in ['dashboard','library','order','batch','history','settings','stats']:
                page.evaluate(f"()=>App.setView('{view}')");page.wait_for_timeout(70)
                m=page.evaluate('()=>({sw:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),iw:innerWidth})')
                row[view]=m['sw']-m['iw']
                if row[view]>6: errors.append(f'{w}px horizontal overflow on {view}: {row[view]}px')
            surfaces[str(w)]=row
        result={'runtime':runtime,'installDisabled':install_disabled,'reloadDisabled':reload_disabled,'icons':[icon_count,install_icon,reload_icon,check_icon],'semantic':semantic,'help':help_exists,'nativeInstall':native_install,'reloadUpdate':reload_update,'widths':widths,'surfaces':surfaces,'pageErrors':page_errors}
        b.close()
    if runtime!=VERSION: errors.append(f'runtime {runtime}, expected {VERSION}')
    if install_disabled: errors.append('Install app is disabled without native prompt')
    if reload_disabled: errors.append('Reload app is disabled')
    if [icon_count,install_icon,reload_icon,check_icon]!=[1,1,1,1]: errors.append('PWA semantic icon wiring incomplete')
    if semantic!=['installPwa','reloadPwa','checkPwaUpdate']: errors.append('PWA semantic icon meanings are wrong: '+repr(semantic))
    if not help_exists: errors.append('Install fallback instructions did not open')
    if not native_install.get('ok') or native_install.get('prompted')!=1 or not native_install.get('installed'): errors.append('native install prompt path failed: '+repr(native_install))
    if not reload_update.get('ok') or reload_update.get('msg',{}).get('type')!='SKIP_WAITING' or not reload_update.get('applying'): errors.append('reload/update activation path failed: '+repr(reload_update))
    if page_errors: errors.extend('pageerror: '+x for x in page_errors)
print(json.dumps(result,indent=2))
if errors:
    print('v246 SMOKE FAILED');[print('-',e) for e in errors];sys.exit(1)
print('v246 mobile/tablet PWA smoke: OK')
