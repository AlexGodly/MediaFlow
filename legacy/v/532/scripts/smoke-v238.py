#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v238 SMOKE FAILED: Playwright unavailable:', e); sys.exit(1)
ROOT=Path(__file__).resolve().parents[1]
BUNDLE=ROOT/'assets/js/mediaflow-v238.bundle.js'
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('v238 SMOKE FAILED: Chromium unavailable'); sys.exit(1)
css_files=sorted((ROOT/'assets/css').glob('*.css'),key=lambda p:int(p.name.split('-',1)[0]) if p.name.split('-',1)[0].isdigit() else 9999)
css='\n'.join(p.read_text(encoding='utf-8') for p in css_files)
bundle=BUNDLE.read_text(encoding='utf-8')
setup_js=r'''() => {
 const store={};
 const fakeStore={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{for(const k of Object.keys(store))delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
 Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true}); Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
 const user={id:'v238-user',email:'v238@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v238'}};
 const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
 const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
 window.supabase={createClient(){return client;}}; window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
}'''

fails=[]
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1440,'height':1000})
    errors=[]; page.on('pageerror',lambda exc: errors.append(str(exc)))
    page.set_content('<!doctype html><html><body><div id="app"></div></body></html>')
    page.add_style_tag(content=css); page.evaluate(setup_js); page.add_script_tag(content=bundle); page.wait_for_timeout(800)
    page.evaluate(r'''() => {MediaFlowRuntime.registerPageRenderer('__v238_probe__',({state})=>{window.__mfState=state;return '<div>probe</div>';});App.setView('__v238_probe__');}'''); page.wait_for_timeout(50)
    prepared=page.evaluate(r'''() => {
      const s=window.__mfState;if(!s)return false; const cats=s.categories.slice(0,3); if(!cats.length)return false;
      const statuses=['planned','active','paused','completed','dropped'];
      s.library=[];for(let i=0;i<300;i++)s.library.push({id:'i'+i,title:'Title '+i,categoryId:cats[i%cats.length].id,status:statuses[i%statuses.length],priority:['high','medium','low'][i%3],progress:i%10,total:12,createdAt:Date.now()-i,year:2026,mediaFormat:'TV',runtime:24,genres:['Action'],synopsis:'Test synopsis '+i,externalIds:{mal:String(1000+i)}});
      s.sessionActive=true;s.currentTask={categoryId:cats[0].id,low:1,high:1,targetMid:1,targetMin:1,targetMax:1,unit:cats[0].unit||'episodes',reasons:[],title:null};
      s.settings.v181Logging=s.settings.v181Logging||{};s.settings.v181Logging.defaultMode='progress';
      return true;
    }''')
    if not prepared:fails.append('state preparation failed')

    # Logging opens once, Library browser is below logged summary and closed/lazy.
    page.evaluate("()=>App.setView('dashboard')");page.wait_for_timeout(120)
    open_ms=page.evaluate("""() => {const a=performance.now();App.openLogForm();return performance.now()-a;}""");page.wait_for_timeout(120)
    log_ui=page.evaluate(r'''() => {
      const f=document.querySelector('.log-form'), d=document.querySelector('.v238-log-library');
      const empty=document.querySelector('.v238-logged-empty,.v238-logged-section-head');
      const amount=[...f?.children||[]].find(el=>el.classList?.contains('field-row'));
      return {details:!!d,open:!!d?.open,lazy:!!d?.querySelector('.v238-log-library-lazy'),afterSummary:!!(empty&&d&&empty.compareDocumentPosition(d)&Node.DOCUMENT_POSITION_FOLLOWING),beforeAmount:!!(d&&amount&&d.compareDocumentPosition(amount)&Node.DOCUMENT_POSITION_FOLLOWING)};
    }''')
    page.locator('.v238-log-library-summary').click();page.wait_for_timeout(120)
    status_sel=page.locator('select[aria-label="Logging title status"]')
    status_initial=status_sel.input_value() if status_sel.count() else None
    status_values=[]
    if status_sel.count():
      for v in ['active','completed','paused','dropped','planned','all']:
        status_sel.select_option(v);page.wait_for_timeout(60);status_values.append(status_sel.input_value())
    else:fails.append('Dashboard logging status filter not found')

    # Edit Title should be wide and fit desktop without internal modal scroll/clipping.
    page.evaluate("()=>App.openLibraryModal('i1')");page.wait_for_timeout(120)
    edit_modal=page.evaluate(r'''() => {const m=document.querySelector('.modal'),e=document.querySelector('.v238-library-editor');if(!m||!e)return null;return {client:m.clientHeight,scroll:m.scrollHeight,width:Math.round(m.getBoundingClientRect().width),editor:Math.round(e.getBoundingClientRect().height),overflow:getComputedStyle(m).overflowY};}''')
    page.evaluate('()=>App.closeModal()')

    # Device mode Settings + semantic nav entry.
    page.evaluate("()=>App.setView('settings')");page.wait_for_timeout(180)
    device_ui=page.evaluate(r'''() => ({section:!![...document.querySelectorAll('.section-label')].find(x=>x.textContent.includes('DEVICE & LAYOUT')),nav:[...document.querySelectorAll('.v221-settings-nav-item')].some(x=>x.textContent.trim().toLowerCase()==='device & layout'),buttons:[...document.querySelectorAll('[data-v238-device-choice]')].map(x=>x.dataset.v238DeviceChoice),icon:!![...document.querySelectorAll('.v221-settings-nav-item')].find(x=>x.textContent.trim().toLowerCase()==='device & layout')?.querySelector('.v225-btn-icon')})''')
    device_modes={}
    for mode in ['mobile','tablet','desktop','auto']:
      page.evaluate(f"()=>App.v238SetDeviceMode('{mode}')");page.wait_for_timeout(40)
      device_modes[mode]=page.evaluate("()=>({pref:document.documentElement.dataset.v238DevicePreference,layout:document.documentElement.dataset.v238Layout})")

    # Mobile and tablet key-page overflow/responsiveness checks.
    responsive={}
    for width,height,label in [(390,844,'mobile'),(820,1180,'tablet')]:
      page.set_viewport_size({'width':width,'height':height});page.evaluate("()=>App.v238SetDeviceMode('auto')");page.wait_for_timeout(100)
      views={}
      for view in ['dashboard','library','order','batch','settings','stats']:
        page.evaluate(f"()=>App.setView('{view}')");page.wait_for_timeout(80)
        views[view]=page.evaluate("()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,layout:document.documentElement.dataset.v238Layout})")
      responsive[label]=views

    runtime=page.evaluate('()=>MediaFlowRuntime.version')
    b.close()

if errors:fails.extend('pageerror: '+e for e in errors)
if runtime!=238:fails.append(f'runtime version {runtime}, expected 238')
if open_ms>300:fails.append(f'Log & Complete open took {open_ms:.1f}ms (>300ms)')
if not all(log_ui.get(k) for k in ['details','lazy','afterSummary','beforeAmount']):fails.append(f'logging reflow/lazy state wrong: {log_ui}')
if log_ui.get('open'):fails.append('logging Library should be collapsed by default')
if status_initial!='all':fails.append(f'status filter initial value stuck at {status_initial!r}, expected all')
if status_values!=['active','completed','paused','dropped','planned','all']:fails.append(f'status filter selections did not persist: {status_values}')
if not edit_modal:fails.append('Edit Title modal missing')
else:
    if edit_modal['width']<900:fails.append(f'Edit Title modal too narrow: {edit_modal}')
    if edit_modal['scroll']>edit_modal['client']+2:fails.append(f'Edit Title modal still needs internal scroll/clips on desktop: {edit_modal}')
if not device_ui.get('section') or not device_ui.get('nav'):fails.append(f'Device & Layout Settings missing: {device_ui}')
if set(device_ui.get('buttons',[]))!={'auto','mobile','tablet','desktop'}:fails.append(f'Device mode choices incomplete: {device_ui}')
for mode in ['mobile','tablet','desktop']:
    if device_modes[mode]['pref']!=mode or device_modes[mode]['layout']!=mode:fails.append(f'device mode {mode} did not apply: {device_modes[mode]}')
for label,views in responsive.items():
    for view,m in views.items():
        if m['layout']!=label:fails.append(f'{label} auto layout mismatch on {view}: {m}')
        # tolerate small intrinsic scrollbar/rounding only
        if m['sw']>m['iw']+6:fails.append(f'{label} horizontal overflow on {view}: {m}')

print(json.dumps({'runtime':runtime,'openLogMs':round(open_ms,2),'logging':log_ui,'statusInitial':status_initial,'statusSequence':status_values,'editModal':edit_modal,'deviceUI':device_ui,'deviceModes':device_modes,'responsive':responsive,'pageErrors':errors},indent=2))
if fails:
    print('v238 SMOKE FAILED');[print('-',x) for x in fails];sys.exit(1)
print('v238 SMOKE OK')
