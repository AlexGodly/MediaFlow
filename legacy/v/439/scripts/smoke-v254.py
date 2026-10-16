#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v254 SMOKE FAILED: Playwright unavailable:',e);sys.exit(1)
ROOT=Path(__file__).resolve().parents[1]
VERSION=int((ROOT/'VERSION').read_text().strip())
errors=[];result={'version':VERSION}
bundle=(ROOT/f'assets/js/mediaflow-v{VERSION}.bundle.js').read_text()
index=(ROOT/'index.html').read_text();sw=(ROOT/'sw.js').read_text();css=(ROOT/'assets/css/121-v254-library-cover-overlays.css').read_text()
for token in ['MediaFlow v254 — Cover Overlay Controls','const V254_RUNTIME_VERSION=254;','function v254CoverOverlayControlsHtml','function v254DecorateVisibleCovers','function v254ToggleCoverOverlay','MediaFlowRuntime.version=V254_RUNTIME_VERSION;']:
    if token not in bundle: errors.append('bundle missing '+token)
if 'assets/css/121-v254-library-cover-overlays.css' not in index: errors.append('v254 stylesheet not wired')
if './assets/css/121-v254-library-cover-overlays.css' not in sw: errors.append('v254 CSS missing from PWA shell')
if 'mediaflow-pwa-v254-shell-v1' not in sw: errors.append('PWA cache not v254')
for token in ['.v254-cover-overlay-controls','.v254-cover-overlay-frame','.v254-cover-progress']:
    if token not in css: errors.append('CSS missing '+token)
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium: errors.append('Chromium unavailable')
else:
    all_css='\n'.join(p.read_text() for p in sorted((ROOT/'assets/css').glob('*.css')))
    page_errors=[]
    setup_js=r'''() => {
      const store={};const fakeStore={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear:()=>Object.keys(store).forEach(k=>delete store[k]),key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
      Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
      const user={id:'v254-user',email:'v254@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v254'}};const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
      const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};window.supabase={createClient(){return client;}};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
      const fakeWorker={state:'activated',postMessage(){},addEventListener(){},removeEventListener(){}};const fakeReg={scope:'https://mediaflow.test/',active:fakeWorker,waiting:null,installing:null,update:async()=>{},addEventListener(){},removeEventListener(){}};Object.defineProperty(navigator,'serviceWorker',{value:{controller:fakeWorker,register:async()=>fakeReg,getRegistration:async()=>fakeReg,ready:Promise.resolve(fakeReg),addEventListener(){},removeEventListener(){}},configurable:true});Object.defineProperty(window,'isSecureContext',{value:true,configurable:true});window.fetch=async()=>new Response('<meta name="mediaflow-version" content="254">',{status:200,headers:{'content-type':'text/html'}});
    }'''
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1366,'height':900});page.on('pageerror',lambda exc: page_errors.append(str(exc)))
        page.set_content('<!doctype html><html><head><base href="https://mediaflow.test/"><meta name="mediaflow-version" content="254"></head><body><div id="app"></div></body></html>')
        page.evaluate(setup_js);page.add_style_tag(content=all_css);page.add_script_tag(content=bundle);page.wait_for_timeout(650)
        result['runtime']=page.evaluate('()=>MediaFlowRuntime.version')
        if result['runtime']!=254: errors.append('runtime mismatch')
        # get state pointer and seed titles
        page.evaluate("()=>{MediaFlowRuntime.registerPageRenderer('__v254_probe__',({state})=>{window.__v254State=state;return '<div>probe</div>';});App.setView('__v254_probe__');}")
        page.wait_for_timeout(40)
        cats=page.evaluate("()=>window.__v254State.categories.slice(0,2).map(c=>c.id)")
        if len(cats)<1: errors.append('no category')
        cat1=cats[0]; cat2=cats[1] if len(cats)>1 else cats[0]
        page.evaluate(r'''([c1,c2])=>{const s=window.__v254State;const now=Date.now();s.library=[
          {id:'a',title:'Watching Title',categoryId:c1,progress:5,total:10,status:'active',priority:'high',rating:8.5,coverUrl:'https://example.com/a.jpg',createdAt:now,modifiedAt:now},
          {id:'b',title:'Completed Title',categoryId:c2,progress:12,total:12,status:'completed',priority:'medium',rating:9,coverUrl:'',createdAt:now,modifiedAt:now}
        ];s.settings.libraryView='covers';s.settings.v181Library=s.settings.v181Library||{};s.settings.v181Library.mode='classic';s.settings.v254CoverOverlays={status:true,category:true,rating:true,progress:true,modifiedAt:Date.now()};s.histFilters.libCategory='all';s.histFilters.libStatus='all';s.histFilters.libPriority='all';s.histFilters.libSearch='';}''',[cat1,cat2])
        page.evaluate("()=>App.setView('library')");page.wait_for_timeout(160)
        normal=page.evaluate(r'''()=>({controls:document.querySelectorAll('.v254-cover-overlay-controls').length,frames:document.querySelectorAll('.library-view-covers .v254-cover-overlay-frame').length,status:document.querySelectorAll('.library-view-covers .v254-cover-status').length,category:document.querySelectorAll('.library-view-covers .v254-cover-category').length,rating:document.querySelectorAll('.library-view-covers .v254-cover-rating').length,progress:document.querySelectorAll('.library-view-covers .v254-cover-progress').length,fill:document.querySelector('.library-view-covers [data-library-id="a"] .v254-cover-progress-fill')?.style.width||''})''')
        result['normal']=normal
        if normal['controls']!=1: errors.append('cover controls missing in Normal Library')
        if normal['frames']!=2: errors.append('Normal cover overlays missing')
        if normal['status']!=2 or normal['category']!=2 or normal['rating']!=2 or normal['progress']!=2: errors.append('Normal overlay elements incomplete')
        if not normal['fill'].startswith('50'): errors.append('progress width not derived from title progress')
        # toggle rating off
        page.evaluate("()=>App.v254ToggleCoverOverlay('rating')");page.wait_for_timeout(120)
        if page.locator('.library-view-covers .v254-cover-rating').count()!=0: errors.append('rating toggle did not hide rating')
        # dynamic mode should get same controls/overlays
        page.evaluate("()=>{window.__v254State.settings.v181Library.activeCategoryId=window.__v254State.library[0].categoryId;window.__v254State.settings.v181Library.activeStatus='active';App.v181SetLibraryMode('dynamic');}");page.wait_for_timeout(140)
        dynamic=page.evaluate(r'''()=>({controls:document.querySelectorAll('.v254-cover-overlay-controls').length,frames:document.querySelectorAll('.v181-dynamic-covers .v254-cover-overlay-frame').length,status:document.querySelectorAll('.v181-dynamic-covers .v254-cover-status').length,category:document.querySelectorAll('.v181-dynamic-covers .v254-cover-category').length,rating:document.querySelectorAll('.v181-dynamic-covers .v254-cover-rating').length,progress:document.querySelectorAll('.v181-dynamic-covers .v254-cover-progress').length})''')
        result['dynamic']=dynamic
        if dynamic['controls']!=1 or dynamic['frames']<1: errors.append('Dynamic cover overlay UI missing')
        if dynamic['rating']!=0: errors.append('rating hidden preference not shared in Dynamic Library')
        # exclusive to Covers / Covers+Titles
        page.evaluate("()=>App.setLibraryView('list')");page.wait_for_timeout(100)
        if page.locator('.v254-cover-overlay-controls').count()!=0: errors.append('overlay controls visible outside cover modes')
        if page.locator('.v254-cover-overlay-frame').count()!=0: errors.append('overlay frames visible outside cover modes')
        result['settingsHasV254']=page.evaluate('()=>!!window.__v254State.settings.v254CoverOverlays')
        if not result['settingsHasV254']: errors.append('persistent v254 cover overlay settings missing')
        # responsive controls sanity in Covers+Titles
        page.evaluate("()=>{window.__v254State.settings.v181Library.mode='classic';App.setLibraryView('covers-title');}");page.wait_for_timeout(100)
        for w,h in [(820,900),(390,844),(320,700),(280,653)]:
            page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(50)
            ov=page.evaluate('()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth');result[f'overflow{w}']=ov
            if ov>8: errors.append(f'Library cover controls overflow at {w}: {ov}')
        browser.close()
    if page_errors: errors.extend('pageerror: '+x for x in page_errors)
print(json.dumps(result,indent=2))
if errors:
    print('v254 SMOKE FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('v254 smoke: OK')
