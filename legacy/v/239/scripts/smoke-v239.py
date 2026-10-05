#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v239 SMOKE FAILED: Playwright unavailable:', e); sys.exit(1)
ROOT=Path(__file__).resolve().parents[1]
BUNDLE=ROOT/'assets/js/mediaflow-v239.bundle.js'
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('v239 SMOKE FAILED: Chromium unavailable'); sys.exit(1)
css_files=sorted((ROOT/'assets/css').glob('*.css'),key=lambda p:int(p.name.split('-',1)[0]) if p.name.split('-',1)[0].isdigit() else 9999)
css='\n'.join(p.read_text(encoding='utf-8') for p in css_files)
bundle=BUNDLE.read_text(encoding='utf-8')
setup_js=r'''() => {
 const store={};
 const fakeStore={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{for(const k of Object.keys(store))delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
 Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true}); Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
 const user={id:'v239-user',email:'v239@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v239'}};
 const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
 const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
 window.supabase={createClient(){return client;}}; window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
}'''
fails=[]
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1440,'height':900})
    errors=[];page.on('pageerror',lambda exc: errors.append(str(exc)))
    page.set_content('<!doctype html><html><body><div id="app"></div></body></html>')
    page.add_style_tag(content=css);page.evaluate(setup_js);page.add_script_tag(content=bundle);page.wait_for_timeout(800)
    page.evaluate(r'''() => {MediaFlowRuntime.registerPageRenderer('__v239_probe__',({state})=>{window.__mfState=state;return '<div>probe</div>';});App.setView('__v239_probe__');}''');page.wait_for_timeout(50)
    ok=page.evaluate(r'''() => {const s=window.__mfState;if(!s)return false;const cats=s.categories.slice(0,3);if(!cats.length)return false;s.library=[];for(let i=0;i<60;i++)s.library.push({id:'i'+i,title:'Title '+i,categoryId:cats[i%cats.length].id,status:['planned','active','paused','completed','dropped'][i%5],priority:['high','medium','low'][i%3],progress:i%8,total:12,coverUrl:i<4?'https://example.com/cover'+i+'.jpg':'',createdAt:Date.now()-i,year:2026,mediaFormat:'TV',runtime:24,genres:['Action'],synopsis:'Long synopsis '.repeat(30),externalIds:{mal:String(1000+i)}});s.sessionActive=true;s.currentTask={categoryId:cats[0].id,low:1,high:1,targetMid:1,targetMin:1,targetMax:1,unit:cats[0].unit||'episodes',reasons:[],title:null};s.settings.v181Logging=s.settings.v181Logging||{};s.settings.v181Logging.defaultMode='progress';return true;}''')
    if not ok:fails.append('state setup failed')

    # Device override removed from Settings and state.
    page.evaluate("()=>App.setView('settings')");page.wait_for_timeout(180)
    device=page.evaluate(r'''() => ({nav:[...document.querySelectorAll('.v221-settings-nav-item')].some(x=>x.textContent.trim().toLowerCase()==='device & layout'),section:[...document.querySelectorAll('.section-label')].some(x=>x.textContent.trim().toLowerCase()==='device & layout'),setting:Object.prototype.hasOwnProperty.call(window.__mfState?.settings||{},'v238DeviceLayout'),pref:document.documentElement.dataset.v238DevicePreference||'',layout:document.documentElement.dataset.v238Layout||''})''')

    # Batch Log browser should fill the toolbar and use redesigned mode selector.
    page.evaluate("()=>App.setView('batch')");page.wait_for_timeout(180)
    batch=page.evaluate(r'''() => {const tools=document.querySelector('.v239-batch-library-tools'),cat=tools?.querySelector('.v237-category-filter'),grid=tools?.querySelector('.v224-browser-filterbar'),mode=document.querySelector('.v239-log-mode-switch');if(!tools||!cat||!grid||!mode)return null;const cr=cat.getBoundingClientRect(),gr=grid.getBoundingClientRect();return {catWidth:Math.round(cr.width),gridWidth:Math.round(gr.width),ratio:cr.width/gr.width,mode:!!mode.querySelector('.v239-log-mode-options')};}''')

    # Dashboard logging should show cover-ready logged title cards.
    page.evaluate("()=>App.setView('dashboard')");page.wait_for_timeout(100);page.evaluate("()=>App.openLogForm()");page.wait_for_timeout(80)
    page.evaluate(r'''() => {App.selectLogTitle('i0');window.__mfState.entryDraft.endProgress=2;App.addLogEntry();}''');page.wait_for_timeout(160)
    logged=page.evaluate(r'''() => {const card=document.querySelector('.v239-logged-title-card');return card?{card:true,cover:!!card.querySelector('.v239-logged-cover'),text:card.innerText,small:getComputedStyle(card.querySelector('small')).fontSize}:null;}''')

    # Edit Title is large and scroll-safe; synopsis/actions remain reachable.
    page.evaluate("()=>App.openLibraryModal('i1')");page.wait_for_timeout(150)
    edit=page.evaluate(r'''() => {const m=document.querySelector('.modal'),s=document.querySelector('.v239-library-editor-shell'),syn=document.querySelector('#l-rich-synopsis'),actions=document.querySelector('.v239-library-editor-shell .modal-actions');if(!m||!s)return null;s.scrollTop=s.scrollHeight;return {width:Math.round(m.getBoundingClientRect().width),client:s.clientHeight,scroll:s.scrollHeight,overflow:getComputedStyle(s).overflowY,synopsis:!!syn,actions:!!actions,scrollable:s.scrollHeight>=s.clientHeight};}''')
    page.evaluate('()=>App.closeModal()')

    # Native responsive audit: no forced device attributes and no horizontal overflow.
    responsive={}
    for width,height,label in [(390,844,'mobile'),(820,1180,'tablet')]:
        page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(100)
        views={}
        for view in ['dashboard','library','order','batch','settings','stats']:
            page.evaluate(f"()=>App.setView('{view}')");page.wait_for_timeout(70)
            views[view]=page.evaluate("()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,pref:document.documentElement.dataset.v238DevicePreference||'',layout:document.documentElement.dataset.v238Layout||''})")
        responsive[label]=views
    runtime=page.evaluate('()=>MediaFlowRuntime.version')
    b.close()

if errors:fails.extend('pageerror: '+e for e in errors)
if runtime!=239:fails.append(f'runtime version {runtime}, expected 239')
if device.get('nav') or device.get('section') or device.get('setting'):fails.append(f'Device & Layout not fully removed: {device}')
if device.get('pref') or device.get('layout'):fails.append(f'v238 forced layout attrs remain: {device}')
if not batch:fails.append('Batch Log v239 UI missing')
else:
    if batch['ratio']<0.45:fails.append(f'Batch category filter still leaves excessive empty space: {batch}')
    if not batch['mode']:fails.append(f'Batch logging mode redesign missing: {batch}')
if not logged or not logged.get('cover'):fails.append(f'logged-title cover card missing: {logged}')
if not edit:fails.append('Edit Title v239 modal missing')
else:
    if edit['width']<950:fails.append(f'Edit Title too narrow: {edit}')
    if edit['overflow'] not in ('auto','scroll'):fails.append(f'Edit Title shell is not scroll-safe: {edit}')
    if not edit['synopsis'] or not edit['actions']:fails.append(f'Edit Title fields/actions unavailable: {edit}')
for label,views in responsive.items():
    for view,m in views.items():
        if m['pref'] or m['layout']:fails.append(f'{label} {view} still has forced v238 layout attrs: {m}')
        if m['sw']>m['iw']+8:fails.append(f'{label} horizontal overflow on {view}: {m}')
print(json.dumps({'runtime':runtime,'deviceRemoved':device,'batch':batch,'logged':logged,'edit':edit,'responsive':responsive,'pageErrors':errors},indent=2))
if fails:
    print('v239 SMOKE FAILED');[print('-',x) for x in fails];sys.exit(1)
print('v239 SMOKE OK')
