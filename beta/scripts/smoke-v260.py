#!/usr/bin/env python3
from pathlib import Path
import re, shutil, sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]
def req(cond,msg):
    if not cond: errors.append(msg)

req((ROOT/'VERSION').read_text(encoding='utf-8').strip()=='260','VERSION is not 260')
index=(ROOT/'index.html').read_text(encoding='utf-8')
req('127-v260-design-system.css' in index,'v260 design-system CSS missing from index')
req('mediaflow-v260.bundle.js' in index,'v260 bundle missing from index')
req('<meta name="mediaflow-version" content="260">' in index,'v260 meta version missing')

runtime=(ROOT/'src/js/runtime-order.json').read_text(encoding='utf-8')
req('components/194-v260-professional-ui-react-bridge.js' in runtime,'v260 runtime bridge missing from runtime-order')
css=(ROOT/'assets/css/127-v260-design-system.css').read_text(encoding='utf-8')
js=(ROOT/'assets/js/mediaflow-v260.bundle.js').read_text(encoding='utf-8') if (ROOT/'assets/js/mediaflow-v260.bundle.js').exists() else ''
for token in ['V260_RUNTIME_VERSION=260','window.MediaFlowV260=','v260ClassicFilterDockHtml','v260WrapLibraryTools','MediaFlowRuntime.version=V260_RUNTIME_VERSION']:
    req(token in js,f'missing v260 runtime marker: {token}')
for token in ['--mf260-accent-soft:color-mix(in srgb,var(--flow)','mf260-library-filter-dock','v181-dynamic-nav','prefers-reduced-motion','library-view-cards']:
    req(token in css,f'missing v260 design-system marker: {token}')

sw=(ROOT/'sw.js').read_text(encoding='utf-8') if (ROOT/'sw.js').exists() else ''
req('mediaflow-pwa-v260-shell-v1' in sw,'v260 PWA cache name missing')
req('./assets/css/127-v260-design-system.css' in sw,'v260 stylesheet missing from PWA shell')
req('./assets/js/mediaflow-v260.bundle.js' in sw,'v260 bundle missing from PWA shell')
req((ROOT/'ui-v260/src/components/DesignSystem.tsx').exists(),'React/TypeScript design-system source missing')
req((ROOT/'ui-v260/tailwind.config.ts').exists(),'Tailwind config missing')

try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    errors.append(f'Playwright unavailable: {e}')
    sync_playwright=None

chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    errors.append('Chromium executable not found')

if sync_playwright and chromium and js:
    # Load all local styles in the exact index order. Remote resources are not
    # required for this smoke test.
    styles=[]
    for href in re.findall(r'<link[^>]+href=["\']([^"\']+\.css)["\']',index,re.I):
        if href.startswith(('http://','https://','//')): continue
        p=ROOT/href.lstrip('./')
        if p.exists(): styles.append(p.read_text(encoding='utf-8'))
    combined='\n'.join(styles)
    setup_js=r'''() => {
      const store={};
      const fakeStore={
        getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,
        setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{for(const k of Object.keys(store))delete store[k]},
        key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}
      };
      Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});
      Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
      const user={id:'v260-smoke',email:'v260@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v260 Smoke'}};
      const db=()=>{const q={select(){return q},eq(){return q},in(){return q},order(){return q},limit(){return q},maybeSingle:async()=>({data:null,error:null}),single:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),insert:async()=>({data:null,error:null}),delete(){return q}};return q};
      const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
      window.supabase={createClient(){return client;}};
      window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
    }'''
    try:
      with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1500,'height':1000})
        page_errors=[]
        page.on('pageerror',lambda exc:page_errors.append(str(exc)))
        page.set_content('<!doctype html><html lang="en"><head></head><body><div id="app"></div></body></html>')
        page.add_style_tag(content=combined)
        page.evaluate(setup_js)
        page.add_script_tag(content=js)
        page.wait_for_timeout(900)

        shell=page.evaluate(r'''() => ({
          runtime:window.MediaFlowRuntime?.version||0,
          v260:window.MediaFlowV260?.version||0,
          htmlFlag:document.documentElement.dataset.mf260||'',
          sidebarLabel:document.querySelector('.sidebar')?.getAttribute('aria-label')||'',
          mainRole:document.querySelector('.main')?.getAttribute('role')||'',
          skip:!!document.getElementById('mf260-skip-link')
        })''')
        req(shell['runtime']==260,'browser runtime did not advance to 260')
        req(shell['v260']==260,'window.MediaFlowV260 bridge missing')
        req(shell['htmlFlag']=='1','data-mf260 root flag missing')
        req(shell['sidebarLabel']=='MediaFlow navigation','sidebar accessibility label missing')
        req(shell['mainRole']=='main','main landmark missing')
        req(shell['skip'],'skip-to-content link missing')

        # Current/Normal Library receives the v260 dock and collapsible tools.
        page.evaluate("()=>{App.setView('library');App.v181SetLibraryMode('classic')}")
        page.wait_for_timeout(420)
        classic=page.evaluate(r'''() => ({
          view:document.getElementById('view-root')?.dataset.mf260View||'',
          tools:!!document.querySelector('.mf260-library-tools'),
          dock:!!document.querySelector('.mf260-library-filter-dock'),
          statusRow:!!document.querySelector('.mf260-status-row'),
          categoryRow:!!document.querySelector('.mf260-category-row'),
          sourceHidden:[...document.querySelectorAll('.mf260-source-filter')].every(x=>getComputedStyle(x).display==='none'),
          statusButtons:document.querySelectorAll('.mf260-status-row .mf260-filter-chip').length,
          categoryButtons:document.querySelectorAll('.mf260-category-row .mf260-filter-chip').length
        })''')
        req(classic['view']=='library','Library v260 view marker missing')
        req(classic['tools'],'Current Library tools panel missing')
        req(classic['dock'],'Current Library sticky category/status dock missing')
        req(classic['statusRow'] and classic['categoryRow'],'Current Library status/category rows missing')
        req(classic['sourceHidden'],'legacy duplicate Library filter controls are still visible')
        req(classic['statusButtons']>=6,'Current Library status row is incomplete')
        req(classic['categoryButtons']>=2,'Current Library category row is incomplete')

        page.evaluate("()=>App.v260SetLibraryToolsCollapsed(true)")
        page.wait_for_timeout(100)
        collapse=page.evaluate(r'''() => ({
          collapsed:document.getElementById('view-root')?.classList.contains('mf260-tools-collapsed')===true,
          toolsBody:getComputedStyle(document.querySelector('.mf260-library-tools-body')).display,
          dockDisplay:getComputedStyle(document.querySelector('.mf260-library-filter-dock')).display,
          stored:localStorage.getItem('mediaflow:v260:library-tools-collapsed')
        })''')
        req(collapse['collapsed'],'Library tools collapse class missing')
        req(collapse['toolsBody']=='none','Library tools body did not collapse')
        req(collapse['dockDisplay']!='none','Category/status dock was hidden with Library tools')
        req(collapse['stored']=='1','Library tools local preference did not persist')

        # Dynamic mode keeps the native category/status navigation while moving
        # optional tools above it.
        page.evaluate("()=>App.v181SetLibraryMode('dynamic')")
        page.wait_for_timeout(420)
        dynamic=page.evaluate(r'''() => {
          const tools=document.querySelector('.mf260-library-tools');
          const nav=document.querySelector('.v181-dynamic-nav');
          const relation=tools&&nav&&tools.parentElement===nav.parentElement
            ? [...tools.parentElement.children].indexOf(tools)<[...nav.parentElement.children].indexOf(nav)
            : false;
          return {
            nav:!!nav,
            rows:nav?.querySelectorAll('.v181-dynamic-row').length||0,
            toolsBeforeNav:relation,
            aria:nav?.getAttribute('aria-label')||''
          };
        }''')
        req(dynamic['nav'] and dynamic['rows']>=2,'Dynamic Library category/status navigation missing')
        req(dynamic['toolsBeforeNav'],'Dynamic Library tools are not above category/status navigation')
        req(dynamic['aria']=='Library category and status navigation','Dynamic Library navigation aria label missing')

        # Theme behavior: changing the existing --flow source variable must
        # change v260-derived chrome without touching v260 CSS variables.
        before=page.evaluate("()=>getComputedStyle(document.querySelector('.mf260-library-tools-title svg')).color")
        page.evaluate("()=>document.documentElement.style.setProperty('--flow','rgb(11, 201, 123)')")
        page.wait_for_timeout(80)
        after=page.evaluate("()=>getComputedStyle(document.querySelector('.mf260-library-tools-title svg')).color")
        req(before!=after,'v260 chrome did not react to the existing --flow theme token')

        # Every main destination should still render under the v260 wrapper.
        renderable=[]
        for view in ['dashboard','library','order','oldsystem','libraryhistory','history','batch','stats','profile','settings','about']:
          try:
            page.evaluate("v=>App.setView(v)",view)
            page.wait_for_timeout(110)
            ok=page.evaluate("v=>document.getElementById('view-root')?.dataset.mf260View===v",view)
          except Exception:
            ok=False
          renderable.append((view,ok))
        for view,ok in renderable:
          req(ok,f'v260 page enhancer did not attach on {view}')

        # Responsive smoke.
        page.set_viewport_size({'width':390,'height':820})
        page.evaluate("()=>App.setView('library')")
        page.wait_for_timeout(180)
        mobile=page.evaluate(r'''() => ({
          tabbar:!!document.querySelector('.mobile-tabbar'),
          sidebar:document.querySelector('.sidebar')?getComputedStyle(document.querySelector('.sidebar')).display:'none',
          containerPad:getComputedStyle(document.querySelector('.container')).paddingLeft,
          rootWidth:document.documentElement.scrollWidth,
          viewport:window.innerWidth
        })''')
        req(mobile['tabbar'],'mobile tabbar missing')
        req(mobile['sidebar']=='none','desktop sidebar visible at mobile width')
        req(mobile['rootWidth']<=mobile['viewport']+2,'v260 causes horizontal viewport overflow on mobile')

        # Ignore expected browser/network-ish noise; fail on actual uncaught JS.
        meaningful=[e for e in page_errors if 'ResizeObserver loop' not in e]
        req(not meaningful,'browser page errors: '+ ' | '.join(meaningful[:5]))
        browser.close()
    except Exception as e:
      errors.append(f'v260 browser smoke raised: {e}')

if errors:
    print('v260 smoke: FAIL')
    for e in errors: print('-',e)
    sys.exit(1)
print('v260 smoke: OK')
print('Professional design system, Library hierarchy, dynamic theme contract, responsive shell and React/Tailwind source verified.')
