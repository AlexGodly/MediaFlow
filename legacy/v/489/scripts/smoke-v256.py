#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v256 SMOKE FAILED: Playwright unavailable:',e);sys.exit(1)
ROOT=Path(__file__).resolve().parents[1]
VERSION=int((ROOT/'VERSION').read_text().strip())
errors=[];result={'version':VERSION}
bundle=(ROOT/f'assets/js/mediaflow-v{VERSION}.bundle.js').read_text()
index=(ROOT/'index.html').read_text();sw=(ROOT/'sw.js').read_text();css=(ROOT/'assets/css/123-v256-cover-sizing-runtime-calculator.css').read_text()
for token in ['MediaFlow v256 — Cover Overlay Sizing + Dashboard Runtime Calculator','const V256_RUNTIME_VERSION=256;','function v256RuntimeCalculatorHtml','function v256ContinueRuntimeResult','function v256RestorePreviousRuntime','function v256SetCoverOverlaySize','MediaFlowRuntime.version=V256_RUNTIME_VERSION;']:
    if token not in bundle: errors.append('bundle missing '+token)
if VERSION!=256: errors.append('VERSION is not 256')
if 'assets/css/123-v256-cover-sizing-runtime-calculator.css' not in index: errors.append('v256 stylesheet not wired')
if './assets/css/123-v256-cover-sizing-runtime-calculator.css' not in sw: errors.append('v256 CSS missing from PWA shell')
if 'mediaflow-pwa-v256-shell-v1' not in sw: errors.append('PWA cache not v256')
for token in ['.v256-cover-control','.v256-accordion-head','.v256-runtime-card','.v254-cover-progress-fill']:
    if token not in css: errors.append('CSS missing '+token)
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium: errors.append('Chromium unavailable')
else:
    all_css='\n'.join(p.read_text() for p in sorted((ROOT/'assets/css').glob('*.css')))
    page_errors=[]
    setup_js=r'''() => {
      const store={};const fakeStore={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear:()=>Object.keys(store).forEach(k=>delete store[k]),key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
      Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
      const user={id:'v256-user',email:'v256@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v256'}};const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
      const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};window.supabase={createClient(){return client;}};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
      const fakeWorker={state:'activated',postMessage(){},addEventListener(){},removeEventListener(){}};const fakeReg={scope:'https://mediaflow.test/',active:fakeWorker,waiting:null,installing:null,update:async()=>{},addEventListener(){},removeEventListener(){}};Object.defineProperty(navigator,'serviceWorker',{value:{controller:fakeWorker,register:async()=>fakeReg,getRegistration:async()=>fakeReg,ready:Promise.resolve(fakeReg),addEventListener(){},removeEventListener(){}},configurable:true});Object.defineProperty(window,'isSecureContext',{value:true,configurable:true});window.fetch=async()=>new Response('<meta name="mediaflow-version" content="256">',{status:200,headers:{'content-type':'text/html'}});
    }'''
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1366,'height':900});page.on('pageerror',lambda exc: page_errors.append(str(exc)))
        page.set_content('<!doctype html><html><head><base href="https://mediaflow.test/"><meta name="mediaflow-version" content="256"></head><body><div id="app"></div></body></html>')
        page.evaluate(setup_js);page.add_style_tag(content=all_css);page.add_script_tag(content=bundle);page.wait_for_timeout(700)
        result['runtime']=page.evaluate('()=>MediaFlowRuntime.version')
        if result['runtime']!=256: errors.append('runtime mismatch')
        page.evaluate("()=>{MediaFlowRuntime.registerPageRenderer('__v256_probe__',({state})=>{window.__v256State=state;return '<div>probe</div>';});App.setView('__v256_probe__');}")
        page.wait_for_timeout(40)

        # Dashboard visibility + accordion + runtime calculator.
        page.evaluate("()=>{const s=window.__v256State;s.settings.v192Dashboard.showStopwatch=true;s.settings.v192Dashboard.showRuntimeCalculator=true;App.setView('dashboard');}")
        page.wait_for_timeout(120)
        if page.locator('.stopwatch-card .v256-accordion-head').count()!=1: errors.append('Stopwatch accordion header missing')
        if page.locator('.v256-runtime-card').count()!=1: errors.append('Runtime Calculator missing below Stopwatch')
        if not page.evaluate("()=>document.querySelector('.stopwatch-card').nextElementSibling?.classList.contains('v256-runtime-card')"):
            errors.append('Runtime Calculator is not directly below Stopwatch')
        # collapse by header then restore
        page.locator('.stopwatch-card .v256-accordion-head').click();page.wait_for_timeout(60)
        if not page.locator('.stopwatch-card').evaluate("el=>el.classList.contains('is-collapsed')"): errors.append('Stopwatch header did not collapse section')
        page.locator('.stopwatch-card .v256-accordion-toggle').click();page.wait_for_timeout(60)
        if page.locator('.stopwatch-card').evaluate("el=>el.classList.contains('is-collapsed')"): errors.append('Stopwatch corner toggle did not expand section')

        # Chain calculation: 1:00:00 + 0:30:00 = 1:30:00, count 2.
        inputs=page.locator('.v256-runtime-card input')
        inputs.nth(0).fill('1');inputs.nth(4).fill('30')
        page.locator('.v256-runtime-actions .btn-primary').click();page.wait_for_timeout(60)
        state=page.evaluate('()=>App.v256RuntimeState()');result['firstCalc']=state
        if state['resultSeconds']!=5400 or state['resultCount']!=2: errors.append('chain calculation/count incorrect')
        # Carry result, add 15m -> 1:45, count 3; previous total should be 1:30.
        page.locator('button:has-text("Continue with result")').click();page.wait_for_timeout(50)
        page.locator('.v256-runtime-card input').nth(4).fill('15')
        page.locator('.v256-runtime-actions .btn-primary').click();page.wait_for_timeout(60)
        state=page.evaluate('()=>App.v256RuntimeState()');result['secondCalc']=state
        if state['resultSeconds']!=6300 or state['resultCount']!=3 or state['previousAccumulatorSeconds']!=5400: errors.append('carry-forward calculation/count incorrect')
        page.locator('button:has-text("Previous total")').click();page.wait_for_timeout(50)
        state=page.evaluate('()=>App.v256RuntimeState()')
        if state['resultSeconds']!=5400 or state['carryCount']!=2: errors.append('Previous total did not restore prior accumulator')

        # Multi-row mode supports add/remove and sums all non-zero rows.
        page.locator('button:has-text("Multi-row")').click();page.wait_for_timeout(50)
        page.locator('.v256-add-runtime-row').click();page.wait_for_timeout(50)
        if page.locator('.v256-runtime-row').count()!=3: errors.append('Add runtime row failed')
        # clear fields and use 10m + 20m + 30m = 60m
        multi=page.locator('.v256-runtime-card input')
        for i in range(multi.count()): multi.nth(i).fill('0')
        multi.nth(1).fill('10');multi.nth(4).fill('20');multi.nth(7).fill('30')
        page.locator('.v256-runtime-actions .btn-primary').click();page.wait_for_timeout(60)
        state=page.evaluate('()=>App.v256RuntimeState()');result['multiCalc']=state
        if state['resultSeconds']!=3600 or state['resultCount']!=3: errors.append('multi-row calculation incorrect')
        page.locator('.v256-runtime-remove').last.click();page.wait_for_timeout(50)
        if page.locator('.v256-runtime-row').count()!=2: errors.append('Remove runtime row failed')

        # Logging integration: result -> minutes.
        page.evaluate("()=>{window.__v256State.logging=true;window.__v256State.logDraft=window.__v256State.logDraft||{};App.setView('dashboard');}");page.wait_for_timeout(80)
        if page.locator('.v256-runtime-card button:has-text("Use for minutes")').count()!=1: errors.append('Runtime Use for minutes missing while logging')
        page.locator('.v256-runtime-card button:has-text("Use for minutes")').click();page.wait_for_timeout(60)
        if page.evaluate('()=>window.__v256State.logDraft.minutes')!=60: errors.append('Runtime result did not copy to logging minutes')

        # Dashboard setting sits directly after Stopwatch and toggles visibility.
        page.evaluate("()=>App.setView('settings')");page.wait_for_timeout(80)
        rows=page.locator('.v192-dashboard-toggle-row')
        labels=[rows.nth(i).locator('b').text_content() for i in range(rows.count())]
        result['dashboardSettingLabels']=labels
        if 'Stopwatch' not in labels or 'Runtime Calculator' not in labels or labels.index('Runtime Calculator')!=labels.index('Stopwatch')+1: errors.append('Runtime Calculator Dashboard setting not directly under Stopwatch')

        # Cover overlay sizing + theme-aware progress.
        cat=page.evaluate('()=>window.__v256State.categories[0].id')
        page.evaluate(r'''cat=>{const s=window.__v256State;s.logging=false;s.library=[{id:'v256-title',title:'Theme Progress',categoryId:cat,status:'active',progress:5,total:10,rating:8.5,coverUrl:'',createdAt:Date.now(),modifiedAt:Date.now()}];s.settings.libraryView='covers';s.settings.v181Library=s.settings.v181Library||{};s.settings.v181Library.mode='classic';s.settings.v254CoverOverlays={status:true,category:true,rating:true,progress:true,sizes:{status:100,category:100,rating:100,progress:100},modifiedAt:Date.now()};App.setView('library');}''',cat)
        page.wait_for_timeout(100)
        if page.locator('.v256-cover-control').count()!=4: errors.append('four per-overlay size controls not rendered')
        old_bg=page.evaluate("()=>getComputedStyle(document.querySelector('.v254-cover-progress-fill')).backgroundImage")
        page.evaluate("()=>{document.documentElement.style.setProperty('--flow','#33cc88');document.documentElement.style.setProperty('--v107-accent2','#8855ff');}");page.wait_for_timeout(30)
        new_bg=page.evaluate("()=>getComputedStyle(document.querySelector('.v254-cover-progress-fill')).backgroundImage")
        result['themeProgressChanged']=old_bg!=new_bg
        if old_bg==new_bg: errors.append('cover progress style did not respond to theme variables')
        slider=page.locator('.v256-cover-control').nth(0).locator('input[type=range]');slider.fill('140');slider.dispatch_event('change');page.wait_for_timeout(90)
        if page.evaluate('()=>window.__v256State.settings.v254CoverOverlays.sizes.status')!=140: errors.append('status overlay size did not persist')
        transform=page.evaluate("()=>getComputedStyle(document.querySelector('.v254-cover-status')).transform")
        if '1.4' not in transform: errors.append('status overlay size not applied to cover')
        # Dynamic Library shares controls.
        page.evaluate("()=>{window.__v256State.settings.v181Library.activeCategoryId=window.__v256State.library[0].categoryId;window.__v256State.settings.v181Library.activeStatus='active';App.v181SetLibraryMode('dynamic');}");page.wait_for_timeout(100)
        if page.locator('.v256-cover-control').count()!=4 or page.locator('.v181-dynamic-covers .v254-cover-overlay-frame').count()<1: errors.append('Dynamic Library overlay sizing/overlays missing')

        # Responsive sanity for both Library and Dashboard tools.
        for view in ('library','dashboard'):
            page.evaluate(f"()=>App.setView('{view}')");page.wait_for_timeout(60)
            for w,h in [(820,900),(390,844),(320,700),(280,653)]:
                page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(30)
                ov=page.evaluate('()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth')
                result[f'{view}Overflow{w}']=ov
                if ov>8: errors.append(f'{view} overflow at {w}: {ov}')
        browser.close()
    if page_errors: errors.extend('pageerror: '+x for x in page_errors)
print(json.dumps(result,indent=2))
if errors:
    print('v256 SMOKE FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('v256 smoke: OK')
